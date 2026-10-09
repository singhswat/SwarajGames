(() => {
  "use strict";
  if (window.__IRONTRAP_R107_ENCOUNTERS) return;
  window.__IRONTRAP_R107_ENCOUNTERS = true;

  const MINI = new Set([5, 15, 25, 35, 45]);
  const TITLES = { escape: "BREAKOUT", recovery: "RECOVER THE CORES", sabotage: "DISABLE THE RELAYS", hunt: "MARKED TARGET", scavenge: "SUPPLY DETOUR", combat: "PATROL" };
  const COLORS = { escape: "#62d9ef", recovery: "#62d9ef", sabotage: "#f2c14e", hunt: "#ef6d85", scavenge: "#7ee081", combat: "#e8edf3" };
  const HUD_TITLES = { escape: "BREAKOUT", recovery: "CORES", sabotage: "RELAYS", hunt: "TARGET", scavenge: "CACHE", combat: "PATROL" };
  const hudStyles = new WeakMap();
  const plans = new Map();
  let bag = [], previous = "";
  for (let n = 6; n < 46; n++) {
    if (n % 10 === 0 || MINI.has(n)) continue;
    if (shouldHaveWorkbench(n)) { plans.set(n, "scavenge"); previous = "scavenge"; continue; }
    if (!bag.length) bag = ["escape", "recovery", "sabotage", "hunt", "combat"];
    const pool = bag.filter(k => k !== previous);
    const rnd = mulberry(n * 1039 + 107)();
    const kind = pool[Math.floor(rnd * pool.length)] || bag[0];
    bag.splice(bag.indexOf(kind), 1);
    plans.set(n, kind);
    previous = kind;
  }

  function encounter() { return G && G.r107Encounter; }
  function livingBoss() { return G.enemies.some(e => !e.dead && (e.isMiniBoss || ENEMIES[e.type].isBoss)); }
  function isPlaying() { return G && P && mode === "play" && !G.done && !P.dead && !livingBoss(); }
  function center(o) { return { x: o.x + (o.w || 0) / 2, y: o.y + (o.h || 0) / 2 }; }
  function distance(a, b) { const ac = center(a), bc = center(b); return Math.hypot(ac.x - bc.x, ac.y - bc.y); }
  function difficultyOffset() { return save.difficulty === "easy" ? -2 : ["hard", "nightmare"].includes(save.difficulty) ? 1 : save.difficulty === "demon" ? 2 : 0; }

  // Reuse the generator's movement graph rather than guessing where a player can go.
  function reachableSpots() {
    const sx = Math.floor(G.spawn.x / TS);
    let sy = Math.floor((G.spawn.y + P.h - 1) / TS);
    if (!standable(G.grid, G.w, sx, sy)) sy = groundTopAt(G.grid, sx) - 1;
    if (sy < 1 || !standable(G.grid, G.w, sx, sy)) return [];
    const seen = reachSet(G.grid, G.w, sx, sy);
    const spots = [];
    for (const id of seen) {
      const tx = id % G.w, ty = Math.floor(id / G.w);
      const p = { x: tx * TS + 3, y: (ty + 1) * TS - 28, w: 22, h: 28, tx, ty };
      if (tx < 12 || tx > G.w - 9 || rectSolid(p.x, p.y, p.w, p.h)) continue;
      if ([G.exit, G.bench, G.giver, ...G.pickups.filter(pk => !pk.taken)].filter(Boolean).some(o => distance(p, o) < 70)) continue;
      spots.push(p);
    }
    return spots;
  }

  function addCatwalks(kind) {
    if (!["escape", "recovery"].includes(kind)) return;
    const spots = reachableSpots();
    for (const fraction of [.25, .5, .75]) {
      const ordered = spots.slice().sort((a, b) => Math.abs(a.tx - G.w * fraction) - Math.abs(b.tx - G.w * fraction));
      const spot = ordered.find(p => {
        const y = p.ty - 2;
        if (y < 3) return false;
        for (let x = p.tx - 2; x <= p.tx + 2; x++) {
          if (G.grid[y][x] !== "." || G.grid[y - 1][x] !== "." || G.grid[y - 2][x] !== ".") return false;
          const platform = { x: x * TS, y: y * TS, w: TS, h: TS };
          if (G.pickups.some(pk => distance(platform, pk) < 75)) return false;
        }
        return true;
      });
      if (spot) for (let x = spot.tx - 2; x <= spot.tx + 2; x++) G.grid[spot.ty - 2][x] = "=";
    }
  }

  function choosePoints(kind, count) {
    const spots = reachableSpots(), chosen = [];
    for (let i = 0; i < count; i++) {
      const fraction = kind === "scavenge" ? .64 : (i + 1) / (count + 1);
      const candidates = spots.filter(p => chosen.every(o => distance(p, o) > TS * 8));
      candidates.sort((a, b) => {
        const score = p => Math.abs(p.tx - G.w * fraction) + (kind === "recovery" || kind === "scavenge" ? p.ty * .35 : -p.ty * .25);
        return score(a) - score(b);
      });
      if (candidates[0]) chosen.push({ ...candidates[0], done: false, progress: 0 });
    }
    return chosen;
  }

  function curateEnemies(kind, points) {
    const original = G.enemies.slice().sort((a, b) => a.x - b.x);
    const tier = G.biome.n;
    const budget = kind === "scavenge" ? Math.max(3, Math.min(6, 3 + Math.ceil(tier / 2) + difficultyOffset())) : Math.max(5, Math.min(16, (kind === "escape" ? 7 : 8) + tier + difficultyOffset()));
    if (kind === "scavenge") original.sort((a, b) => distance(a, points[0]) - distance(b, points[0]));
    const mix = enemyMixFor(G.num);
    const templates = {
      escape: ["grunt", "flyer", "grunt"], recovery: ["shield", "grunt", "flyer"],
      sabotage: ["shield", "turret", "grunt"], hunt: ["brute", "shield", "grunt"],
      scavenge: ["grunt", "shield"], combat: ["shield", "turret", "grunt", "flyer"]
    };
    const allowed = templates[kind].filter(type => mix.includes(type));
    const selected = [];
    const count = Math.min(budget, original.length);
    for (let i = 0; i < count; i++) {
      const old = original[kind === "scavenge" ? i : Math.min(original.length - 1, Math.floor((i + .5) * original.length / count))];
      // Keep airborne spawns airborne; try curated ground pairs only on valid footing.
      let e = old;
      if (ENEMIES[old.type].ai !== "fly" && allowed.length) {
        const type = allowed[i % allowed.length];
        if (ENEMIES[type].ai !== "fly") {
          const tx = Math.floor((old.x + old.w / 2) / TS), ty = Math.floor((old.y + old.h - 1) / TS);
          const replacement = mkEnemy(type, tx * TS, ty * TS);
          if (!rectSolid(replacement.x, replacement.y, replacement.w, replacement.h)) e = replacement;
        }
      }
      selected.push(e);
    }
    G.enemies = selected;
  }

  function initialize() {
    G.r107Encounter = null;
    const kind = plans.get(G.num);
    if (!kind || G.boss || G.quest || livingBoss() || G.h !== H) return;
    addCatwalks(kind);
    const count = kind === "recovery" ? (G.num >= 26 ? 3 : 2) : kind === "sabotage" ? 2 : kind === "scavenge" ? 1 : 0;
    const points = choosePoints(kind, count);
    if (points.length !== count) return;
    curateEnemies(kind, points);
    const state = { kind, points, target: null, cleared: false, rewarded: false, lastTick: -1, count };
    if (kind === "hunt") {
      const reachable = reachableSpots();
      const candidates = G.enemies.filter(e => ENEMIES[e.type].ai !== "fly" && reachable.some(p => distance(p, e) < TS * 3));
      candidates.sort((a, b) => Math.abs(a.x - G.w * TS * .65) - Math.abs(b.x - G.w * TS * .65));
      if (!candidates.length) state.kind = "combat";
      else state.target = candidates[0];
    }
    G.r107Encounter = state;
  }

  function completePoint(s, p) {
    p.done = true;
    p.progress = 0;
    p.activating = false;
    spark(p.x + p.w / 2, p.y + p.h / 2, 12, COLORS[s.kind], 2, 20);
    popText(p.x + p.w / 2, p.y - 16, s.kind === "sabotage" ? "RELAY OFFLINE" : s.kind === "scavenge" ? "CACHE SECURED" : "CORE RECOVERED", COLORS[s.kind]);
    if (s.kind === "scavenge" && !s.rewarded) {
      s.rewarded = true;
      if (window.IronTrapLoot) {
        const lines = window.IronTrapLoot.rewardCache(p);
        toast("SUPPLY CACHE", lines.join(" / "));
        return;
      }
      const bonus = 4 + G.biome.n * 2;
      save.scrap = (save.scrap || 0) + bonus;
      G.pickups.push(mkPickup(p.x, p.y - TS, "ammo"));
      writeSave();
      toast("SUPPLY CACHE", "+" + bonus + " scrap and ammo");
    }
  }

  function tick() {
    const s = encounter();
    if (!s || !isPlaying() || s.lastTick === G.time) return;
    s.lastTick = G.time;
    if (s.kind === "hunt") {
      if (s.target && !s.target.dead && s.target.y > G.h * TS) killEnemy(s.target);
      if (s.target && !s.target.dead && rectSolid(s.target.x, s.target.y, s.target.w, s.target.h)) unstick(s.target);
    }
    let nearRelay = false;
    for (const p of s.points) {
      if (p.done) continue;
      const near = distance(P, p) < (s.kind === "sabotage" ? 54 : 32);
      if (s.kind === "sabotage") {
        nearRelay = nearRelay || near;
        // A tap starts the action on touch; moving away cancels it on all inputs.
        if (near && (key("use") || pressed.use)) p.activating = true;
        if (near && p.activating) p.progress++;
        else { p.progress = 0; p.activating = false; }
        if (p.progress >= 45) completePoint(s, p);
      } else if (near) completePoint(s, p);
    }
    if (nearRelay) {
      const button = document.getElementById("tinteract"), label = document.getElementById("tinteractLabel");
      if (button) button.classList.add("active");
      if (label) label.textContent = "RELAY";
    }
    const done = s.kind === "hunt" ? s.target && s.target.dead : s.points.length && s.points.every(p => p.done);
    if (done && !s.cleared) {
      s.cleared = true;
      if (s.kind !== "scavenge") toast("OBJECTIVE COMPLETE", "The exit is unlocked.");
      refreshHUD();
    }
  }

  function exitDecision() {
    const s = encounter();
    if (!s || livingBoss() || s.kind === "combat") return null;
    if (["escape", "scavenge"].includes(s.kind)) return true;
    if (s.kind === "hunt") return !!(s.target && s.target.dead);
    return s.points.every(p => p.done);
  }

  function blockedMessage() {
    const s = encounter();
    if (G && G.r106Ambush && G.r106Ambush.active) return "CLEAR THE AMBUSH";
    if (!s || s.kind === "combat") return null;
    if (s.kind === "hunt") return "DEFEAT THE MARKED TARGET";
    return s.kind === "sabotage" ? "RELAYS STILL ONLINE" : "RECOVER THE CORES";
  }

  function announce() {
    const s = encounter();
    if (!s) return;
    const descriptions = {
      escape: "Reach the exit. Fighting is optional.", recovery: "Recover " + s.count + " cores to unlock the exit.",
      sabotage: "Disable both relays to unlock the exit.", hunt: "Defeat the marked target to unlock the exit.",
      scavenge: "The exit is open. A guarded supply cache is optional.", combat: "Small patrols control the route."
    };
    toast(TITLES[s.kind], descriptions[s.kind]);
    refreshHUD();
  }

  function drawObjectives() {
    const s = encounter();
    if (!s) return;
    ctx.save();
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    for (const p of s.points) {
      if (p.x < G.cam.x - TS || p.x > G.cam.x + CW + TS || p.done) continue;
      const col = COLORS[s.kind];
      ctx.fillStyle = "#10151b";
      ctx.fillRect(p.x - 3, p.y, 28, 28);
      ctx.strokeStyle = col;
      ctx.strokeRect(p.x - 3, p.y, 28, 28);
      ctx.fillStyle = col;
      if (s.kind === "sabotage") {
        ctx.fillRect(p.x + 5, p.y + 5, 12, 4);
        ctx.fillRect(p.x + 5, p.y + 12, 12, 4);
        ctx.fillRect(p.x + 5, p.y + 19, 12, 4);
        if (p.progress) ctx.fillRect(p.x - 3, p.y + 31, 28 * p.progress / 45, 3);
      } else if (s.kind === "recovery") {
        ctx.fillRect(p.x + 6, p.y + 5, 10, 18);
        ctx.fillStyle = "#e8edf3";
        ctx.fillRect(p.x + 9, p.y + 8, 4, 12);
      } else {
        ctx.fillRect(p.x + 1, p.y + 7, 20, 14);
        ctx.fillStyle = "#10151b";
        ctx.fillRect(p.x + 9, p.y + 10, 4, 7);
      }
      ctx.fillStyle = col;
      const label = s.kind === "sabotage" ? (distance(P, p) < 54 ? keyName("use") + " - RELAY" : "RELAY") : s.kind === "recovery" ? "CORE" : "CACHE";
      ctx.fillText(label, p.x + 11, p.y - 9);
    }
    if (s.target && !s.target.dead) {
      const e = s.target;
      ctx.strokeStyle = COLORS.hunt;
      ctx.strokeRect(e.x - 5, e.y - 5, e.w + 10, e.h + 10);
      ctx.fillStyle = COLORS.hunt;
      ctx.fillText("TARGET", e.x + e.w / 2, e.y - 13);
    }
    ctx.restore();
  }

  function updateObjectiveHUD() {
    const s = encounter(), el = document.getElementById("killcount");
    if (!s || !el) return;
    const ambush = G.r106Ambush && G.r106Ambush.active;
    const open = exitOpen();
    const completed = s.points.filter(p => p.done).length;
    let text = s.kind === "combat" ? "PATROL " + aliveEnemies() : HUD_TITLES[s.kind];
    if (s.points.length) text += " " + completed + "/" + s.points.length;
    text += ambush ? " - AMBUSH" : open ? " - EXIT OPEN" : " - LOCKED";
    const target = s.target && !s.target.dead ? s.target : s.points.find(p => !p.done);
    if (target) text += target.x > P.x ? " >" : " <";
    el.textContent = text;
    el.style.color = ambush ? COLORS.hunt : open ? "#7ee081" : COLORS[s.kind];
    el.style.whiteSpace = "nowrap";
    el.style.fontFamily = "Consolas, monospace";
    el.style.fontSize = "11px";
    el.style.letterSpacing = "0";
    el.style.lineHeight = "1.35";
    const biome = document.getElementById("biome");
    if (biome) {
      biome.style.whiteSpace = "nowrap";
      biome.style.fontSize = "10px";
      biome.style.letterSpacing = "0";
    }
  }

  window.IronTrapEncounters = {
    tick, announce, exitDecision, blockedMessage,
    allowsAmbush() { const s = encounter(); return !s || s.kind === "combat" || (s.kind === "hunt" && s.target && !s.target.dead); },
    respawn() { const s = encounter(); if (s) { s.points.forEach(p => { p.progress = 0; p.activating = false; }); s.lastTick = -1; if (s.kind === "hunt") s.cleared = !!s.target.dead; } }
  };

  const oldBuild = buildLevel;
  buildLevel = function(...args) { const result = oldBuild.apply(this, args); initialize(); return result; };
  const oldDraw = drawPickups;
  drawPickups = function(...args) { const result = oldDraw.apply(this, args); drawObjectives(); return result; };
  const oldHUD = refreshHUD;
  refreshHUD = function(...args) {
    for (const el of [document.getElementById("killcount"), document.getElementById("biome")].filter(Boolean)) {
      if (!hudStyles.has(el)) hudStyles.set(el, el.style.cssText);
      el.style.cssText = hudStyles.get(el);
    }
    const result = oldHUD.apply(this, args); updateObjectiveHUD(); return result;
  };
  const oldPop = popText;
  popText = function(x, y, text, col) {
    if (/^-?\d+ MORE TO KILL$/.test(text)) text = blockedMessage() || text;
    return oldPop.call(this, x, y, text, col);
  };
})();
