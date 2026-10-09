(() => {
  "use strict";
  if (window.__IRONTRAP_R110_ARCADE) return;
  window.__IRONTRAP_R110_ARCADE = true;

  const W = 640, HEIGHT = 360;
  const C = { ink: "#12171e", paper: "#edf1f4", cyan: "#69d9e8", gold: "#f5c86a", pink: "#ee799a", green: "#8ee0a2", muted: "#6e7c8c" };
  const catalogue = [
    { id: "pulse", name: "Pulse Lock", goal: "Five locks / Three faults", color: C.gold },
    { id: "memory", name: "Rune Recall", goal: "Four sequences / Three faults", color: C.pink },
    { id: "signal", name: "Signal Relay", goal: "Twelve signals / Three faults", color: C.cyan },
    { id: "balance", name: "Reactor Balance", goal: "Eighteen seconds of stable power", color: C.green },
    { id: "circuit", name: "Circuit Align", goal: "Four aligned circuits", color: C.cyan },
    { id: "sort", name: "Cargo Sort", goal: "Twelve sorted shipments / Three faults", color: C.gold },
    { id: "catch", name: "Orbital Catch", goal: "Ten supplies / Three faults", color: C.green },
    { id: "switch", name: "Switch Hunt", goal: "Ten switches / Three faults", color: C.pink },
    { id: "salvage", name: "Salvage Grid", goal: "Six cores / Three faults", color: C.gold },
    { id: "hop", name: "Conveyor Hop", goal: "Ten barriers / Three faults", color: C.cyan }
  ];
  const dir = ["up", "right", "down", "left"];
  const glyphs = ["^", ">", "v", "<"];
  const random = mulberry(crypto.getRandomValues(new Uint32Array(1))[0]);
  const integer = (rng, n) => Math.floor(rng() * n);
  const shuffled = (values, rng) => {
    const out = values.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = integer(rng, i + 1); [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  // These small state machines run on their own clock, never on the campaign clock.
  function createGame(id, seed) {
    if (!catalogue.some(g => g.id === id)) throw new Error("Unknown arcade game: " + id);
    const rng = mulberry(seed >>> 0);
    const g = { id, time: 0, score: 0, faults: 0, result: null, limit: 35, cursor: 4 };
    const target = { pulse: 5, memory: 4, signal: 12, balance: 18, circuit: 4, sort: 12, catch: 10, switch: 10, salvage: 6, hop: 10 }[id];
    const fault = () => { if (++g.faults >= 3) g.result = "lost"; };
    const hit = () => { if (++g.score >= target) g.result = "won"; };
    const nextSignal = () => { g.symbol = integer(rng, 4); g.deadline = g.time + 1.6; };
    const nextCargo = () => { g.cargo = integer(rng, 2); g.deadline = g.time + 1.8; };
    const nextSwitch = () => { g.target = (g.cursor + 1 + integer(rng, 8)) % 9; };
    const nextCircuit = () => { g.tiles = Array.from({ length: 4 }, () => 1 + integer(rng, 3)); g.cursor = 0; };
    const replayMemory = () => { g.phase = "show"; g.phaseAt = g.time; g.input = 0; };
    const moveCursor = (action, width, height) => {
      const x = g.cursor % width, y = Math.floor(g.cursor / width);
      if (action === "left" && x > 0) g.cursor--;
      if (action === "right" && x < width - 1) g.cursor++;
      if (action === "up" && y > 0) g.cursor -= width;
      if (action === "down" && y < height - 1) g.cursor += width;
    };
    if (id === "pulse") { g.marker = 0; g.band = .38 + rng() * .18; }
    if (id === "memory") { g.sequence = Array.from({ length: 3 }, () => integer(rng, 4)); g.limit = 55; replayMemory(); }
    if (id === "signal") nextSignal();
    if (id === "balance") { g.energy = .5; g.stable = 0; g.adjustments = 0; g.drift = .09; g.changeAt = 2; g.limit = 30; }
    if (id === "circuit") nextCircuit();
    if (id === "sort") nextCargo();
    if (id === "catch") { g.lane = 1; g.drops = []; g.nextDrop = .4; }
    if (id === "switch") nextSwitch();
    if (id === "salvage") {
      g.cursor = 0;
      const cells = shuffled(Array.from({ length: 23 }, (_, i) => i + 1), rng);
      g.cores = cells.slice(0, 6); g.hazards = [];
      // Keep every core reachable without requiring a deliberate fault.
      for (const candidate of cells.slice(6)) {
        const blocked = new Set([...g.hazards, candidate]), seen = new Set([0]), queue = [0];
        for (let i = 0; i < queue.length; i++) {
          const cell = queue[i], x = cell % 6, y = Math.floor(cell / 6);
          const adjacent = [x > 0 ? cell - 1 : -1, x < 5 ? cell + 1 : -1, y > 0 ? cell - 6 : -1, y < 3 ? cell + 6 : -1];
          for (const next of adjacent) if (next >= 0 && !blocked.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
        }
        if (g.cores.every(core => seen.has(core))) g.hazards.push(candidate);
        if (g.hazards.length === 5) break;
      }
    }
    if (id === "hop") { g.jump = 0; g.barriers = []; g.nextBarrier = 1; }

    g.act = action => {
      if (g.result) return;
      if (id === "pulse" && action === "action") {
        if (Math.abs(g.marker - g.band) <= .105) { hit(); g.band = .2 + rng() * .6; }
        else fault();
      } else if (id === "memory" && g.phase === "input" && dir.includes(action)) {
        if (dir[g.sequence[g.input]] !== action) { fault(); replayMemory(); }
        else if (++g.input === g.sequence.length) { hit(); g.sequence.push(integer(rng, 4)); replayMemory(); }
      } else if (id === "signal" && dir.includes(action)) {
        if (action === dir[g.symbol]) hit(); else fault();
        nextSignal();
      } else if (id === "balance") {
        if (action === "left") { g.energy = Math.max(0, g.energy - .085); g.adjustments++; }
        if (action === "right") { g.energy = Math.min(1, g.energy + .085); g.adjustments++; }
      } else if (id === "circuit") {
        if (action === "left") g.cursor = (g.cursor + 3) % 4;
        if (action === "right") g.cursor = (g.cursor + 1) % 4;
        if (action === "action") {
          g.tiles[g.cursor] = (g.tiles[g.cursor] + 1) % 4;
          if (g.tiles.every(tile => tile === 0)) { hit(); nextCircuit(); }
        }
      } else if (id === "sort" && ["left", "right"].includes(action)) {
        if ((action === "right" ? 1 : 0) === g.cargo) hit(); else fault();
        nextCargo();
      } else if (id === "catch") {
        if (action === "left") g.lane = Math.max(0, g.lane - 1);
        if (action === "right") g.lane = Math.min(2, g.lane + 1);
      } else if (id === "switch") {
        moveCursor(action, 3, 3);
        if (action === "action") { if (g.cursor === g.target) { hit(); nextSwitch(); } else fault(); }
      } else if (id === "salvage") {
        moveCursor(action, 6, 4);
        if (g.cores.includes(g.cursor)) { g.cores = g.cores.filter(c => c !== g.cursor); hit(); }
        if (g.hazards.includes(g.cursor)) { g.hazards = g.hazards.filter(c => c !== g.cursor); fault(); }
      } else if (id === "hop" && ["action", "up"].includes(action) && g.jump === 0) g.jump = .85;
    };
    g.tick = dt => {
      if (g.result) return;
      dt = Math.max(0, Math.min(.05, dt));
      g.time += dt;
      if (g.time >= g.limit) { g.result = "lost"; return; }
      if (id === "pulse") g.marker = .5 + Math.sin(g.time * (2.6 + g.score * .2)) * .48;
      if (id === "memory" && g.phase === "show" && g.time - g.phaseAt >= g.sequence.length * .72 + .4) g.phase = "input";
      if (id === "signal" && g.time >= g.deadline) { fault(); nextSignal(); }
      if (id === "sort" && g.time >= g.deadline) { fault(); nextCargo(); }
      if (id === "balance") {
        if (g.time >= g.changeAt) { g.drift = (rng() < .5 ? -1 : 1) * (.07 + rng() * .045); g.changeAt += 2; }
        g.energy += g.drift * dt;
        if (g.energy >= .2 && g.energy <= .8) g.stable += dt;
        if (g.energy <= 0 || g.energy >= 1) { fault(); g.energy = .5; }
        g.score = Math.min(18, Math.floor(g.stable));
        if (g.stable >= 18 && g.adjustments >= 10) g.result = "won";
      }
      if (id === "catch") {
        if (g.time >= g.nextDrop) {
          g.drops.push({ lane: integer(rng, 3), y: 0, danger: rng() < .22 }); g.nextDrop += .95;
        }
        for (const drop of g.drops) {
          drop.y += dt * 150;
          if (drop.y >= 278 && !drop.done) {
            drop.done = true;
            if (drop.lane === g.lane) { if (drop.danger) fault(); else hit(); }
            else if (!drop.danger) fault();
          }
        }
        g.drops = g.drops.filter(drop => !drop.done);
      }
      if (id === "hop") {
        g.jump = Math.max(0, g.jump - dt);
        if (g.time >= g.nextBarrier) { g.barriers.push({ x: 620 }); g.nextBarrier += 1.25 + rng() * .45; }
        for (const barrier of g.barriers) {
          barrier.x -= dt * 245;
          if (barrier.x <= 112 && !barrier.done) { barrier.done = true; if (g.jump > .12) hit(); else fault(); }
        }
        g.barriers = g.barriers.filter(barrier => !barrier.done);
      }
    };
    g.status = () => g.score + "/" + target + "  |  " + g.faults + "/3 faults  |  " + Math.ceil(g.limit - g.time) + "s";
    return g;
  }

  function paint(g, c) {
    c.save();
    c.fillStyle = C.ink; c.fillRect(0, 0, W, HEIGHT);
    c.font = "bold 22px monospace"; c.textAlign = "center";
    const text = (s, x, y, color = C.paper, size = 22) => { c.fillStyle = color; c.font = "bold " + size + "px monospace"; c.fillText(s, x, y); };
    const box = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const grid = (cols, rows, cell, left, top, drawCell) => {
      for (let i = 0; i < cols * rows; i++) {
        const x = left + i % cols * cell, y = top + Math.floor(i / cols) * cell;
        box(x + 3, y + 3, cell - 6, cell - 6, "#28333f"); drawCell(i, x, y);
        if (i === g.cursor) { c.strokeStyle = C.paper; c.lineWidth = 3; c.strokeRect(x + 1, y + 1, cell - 2, cell - 2); }
      }
    };
    if (g.id === "pulse") {
      box(60, 170, 520, 38, "#28333f"); box(60 + (g.band - .105) * 520, 170, .21 * 520, 38, C.gold);
      box(60 + g.marker * 520 - 3, 148, 6, 82, C.paper); text("LOCK " + Math.min(5, g.score + 1), 320, 110, C.gold);
    } else if (g.id === "memory") {
      text(g.phase === "show" ? "SIGNAL" : "RECALL", 320, 62, C.pink);
      const current = Math.floor((g.time - g.phaseAt) / .72);
      const lit = g.phase === "show" && (g.time - g.phaseAt) % .72 < .52 ? g.sequence[current] : -1;
      for (let i = 0; i < 4; i++) { box(76 + i * 126, 124, 110, 110, i === lit ? C.pink : "#28333f"); text(glyphs[i], 131 + i * 126, 195, i === lit ? C.ink : C.paper, 44); }
      text(g.phase === "input" ? g.input + "/" + g.sequence.length : "ROUND " + Math.min(4, g.score + 1), 320, 298);
    } else if (g.id === "signal") {
      text(glyphs[g.symbol], 320, 225, C.cyan, 110);
      box(120, 290, 400 * Math.max(0, (g.deadline - g.time) / 1.6), 8, C.cyan);
    } else if (g.id === "balance") {
      box(60, 166, 520, 48, "#28333f"); box(164, 166, 312, 48, "#365945"); box(60 + g.energy * 520 - 4, 146, 8, 88, C.green);
      text(g.drift > 0 ? ">>>" : "<<<", 320, 110, C.gold); text(g.stable.toFixed(1) + " / 18.0", 320, 285, C.green);
      text("CORRECTIONS " + Math.min(10, g.adjustments) + "/10", 320, 328, C.paper, 16);
    } else if (g.id === "circuit") {
      for (let i = 0; i < 4; i++) {
        const x = 100 + i * 118; box(x, 134, 86, 86, "#28333f");
        c.save(); c.translate(x + 43, 177); c.rotate(g.tiles[i] * Math.PI / 2); box(-43, -5, 86, 10, g.tiles[i] === 0 ? C.green : C.cyan); box(28, -5, 10, 22, C.gold); c.restore();
        if (g.cursor === i) { c.strokeStyle = C.paper; c.lineWidth = 3; c.strokeRect(x - 5, 129, 96, 96); }
      }
      box(60, 170, 40, 14, C.green); box(540, 170, 40, 14, C.green);
    } else if (g.id === "sort") {
      box(278, 95, 84, 84, g.cargo ? C.cyan : C.gold); text(g.cargo ? "CORE" : "CRATE", 320, 148, C.ink, 20);
      box(60, 244, 200, 54, C.gold); box(380, 244, 200, 54, C.cyan);
      text("< CRATE", 160, 280, C.ink); text("CORE >", 480, 280, C.ink);
      box(120, 205, Math.max(0, g.deadline - g.time) / 1.8 * 400, 6, C.paper);
    } else if (g.id === "catch") {
      for (let i = 0; i < 3; i++) box(114 + i * 152, 34, 2, 282, "#28333f");
      for (const d of g.drops) { box(164 + d.lane * 152, d.y + 24, 30, 30, d.danger ? C.pink : C.green); if (d.danger) text("X", 179 + d.lane * 152, d.y + 48, C.ink); }
      box(145 + g.lane * 152, 312, 68, 16, C.cyan);
    } else if (g.id === "switch") {
      grid(3, 3, 90, 185, 45, (i, x, y) => { if (i === g.target) { box(x + 24, y + 24, 42, 42, C.pink); text("+", x + 45, y + 54, C.ink); } });
    } else if (g.id === "salvage") {
      grid(6, 4, 64, 128, 52, (i, x, y) => {
        if (g.cores.includes(i)) { box(x + 22, y + 18, 20, 28, C.gold); box(x + 27, y + 23, 10, 18, C.paper); }
        if (g.hazards.includes(i)) text("X", x + 32, y + 41, C.pink, 28);
      });
    } else if (g.id === "hop") {
      box(0, 298, 640, 14, C.muted);
      for (let i = 0; i < 16; i++) box((i * 44 - g.time * 100 % 44), 302, 20, 6, C.ink);
      box(83, 260 - (g.jump > 0 ? Math.sin(g.jump / .85 * Math.PI) * 108 : 0), 30, 38, C.cyan);
      for (const b of g.barriers) box(b.x, 261, 24, 37, C.pink);
    }
    c.restore();
  }

  let session = null, pending = false, lastFrame = 0, animation = null, focusBefore = null;
  const style = document.createElement("style");
  style.textContent = `
    #r110Offer{position:fixed;bottom:140px;left:50%;transform:translateX(-50%);z-index:80;background:#12171e;color:#69d9e8;border:1px solid #69d9e8;border-radius:4px;padding:10px 16px;font:700 12px Arial;max-width:calc(100% - 24px);min-height:44px;letter-spacing:0}
    #r110Arcade{position:fixed;inset:0;z-index:10000;background:#10151bf5;color:#edf1f4;overflow:auto;padding:16px;box-sizing:border-box;font-family:Arial,sans-serif;letter-spacing:0}
    #r110Arcade[hidden],#r110Offer[hidden]{display:none}
    .r110-inner{max-width:720px;margin:auto}.r110-head{display:flex;align-items:center;gap:12px;justify-content:space-between}.r110-head h2{font-size:22px;margin:8px 0;overflow-wrap:anywhere;line-height:1.2}.r110-head button{flex-shrink:0}
    #r110Arcade button{border:1px solid #526171;border-radius:4px;background:#26313e;color:#edf1f4;min-width:44px;min-height:44px;font:700 15px Arial;letter-spacing:0;cursor:pointer}
    #r110Arcade button:focus-visible{outline:3px solid #f5c86a;outline-offset:2px}#r110Arcade button:disabled{opacity:.4;cursor:default}
    #r110Arcade canvas{display:block;width:100%;aspect-ratio:16/9;height:auto;image-rendering:pixelated;touch-action:none}
    #r110Status{font:700 13px monospace;min-height:36px;margin:8px 0;line-height:1.35;overflow-wrap:anywhere}
    #r110Goal{color:#acb9c6;font-size:13px;min-height:32px;margin:4px 0}
    .r110-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}.r110-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.r110-actions button{padding:0 14px}
    @media(max-width:480px){#r110Arcade{padding:10px}.r110-head h2{font-size:18px}.r110-controls{gap:6px}.r110-actions{margin:8px 0}}
  `;
  document.head.append(style);
  const offer = document.createElement("button");
  offer.id = "r110Offer"; offer.hidden = true; document.body.append(offer);
  const modal = document.createElement("section");
  modal.id = "r110Arcade"; modal.hidden = true; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "r110Title");
  modal.innerHTML = `<div class="r110-inner"><header class="r110-head"><h2 id="r110Title"></h2><button id="r110Leave" title="Return to the floor" aria-label="Return to the floor">&#10005;</button></header><p id="r110Goal"></p><canvas width="640" height="360" aria-label="Bonus game arena"></canvas><div id="r110Status" role="status" aria-live="polite"></div><div class="r110-controls"><button data-action="left" title="Left" aria-label="Left">&#8592;</button><button data-action="up" title="Up" aria-label="Up">&#8593;</button><button data-action="down" title="Down" aria-label="Down">&#8595;</button><button data-action="right" title="Right" aria-label="Right">&#8594;</button><button data-action="action" title="Activate or jump" aria-label="Activate or jump">&#9679;</button></div><div class="r110-actions"><button id="r110Start">Play</button><button id="r110Pause" hidden title="Pause bonus game">Pause</button><button id="r110Return">Return to Floor</button></div></div>`;
  document.body.append(modal);
  const get = id => document.getElementById(id);
  const arena = modal.querySelector("canvas"), context = arena.getContext("2d");
  arena.tabIndex = 0;
  const clearInputs = () => { for (const k in keys) keys[k] = false; for (const k in pressed) pressed[k] = false; };
  function ledger() {
    if (!save.arcade || save.arcade.version !== 1 || !save.arcade.offers || typeof save.arcade.offers !== "object" || !save.arcade.played || typeof save.arcade.played !== "object") save.arcade = { version: 1, offers: {}, played: {} };
    return save.arcade;
  }
  function protectedFloor() {
    return !G || !P || G.num < 6 || G.num >= 46 || G.num % 5 === 0 || G.boss || G.quest || G.bench || G.h !== H || shouldHaveWorkbench(G.num) || !!save.rankedRun || !!localStorage.getItem("ironfall.room");
  }
  const distance = (a, b) => Math.hypot(a.x + (a.w || 0) / 2 - b.x - (b.w || 0) / 2, a.y + (a.h || 0) / 2 - b.y - (b.h || 0) / 2);
  function location() {
    const sx = Math.floor(G.spawn.x / TS), sy = groundTopAt(G.grid, sx) - 1;
    if (!standable(G.grid, G.w, sx, sy)) return null;
    const seen = reachSet(G.grid, G.w, sx, sy), candidates = [];
    for (const key of seen) {
      const tx = key % G.w, ty = Math.floor(key / G.w);
      const spot = { x: tx * TS + 3, y: (ty + 1) * TS - 28, w: 22, h: 28, tx, ty };
      if (tx < 10 || tx > G.w - 10 || ty < 2 || rectSolid(spot.x, spot.y, spot.w, spot.h)) continue;
      if ([G.exit, G.bench, G.giver, ...G.pickups, ...(G.r107Encounter ? G.r107Encounter.points : [])].filter(Boolean).some(o => distance(spot, o) < 110)) continue;
      if (G.grid[ty + 1][tx] !== "#" && G.grid[ty + 1][tx] !== "=") continue;
      candidates.push(spot);
    }
    candidates.sort((a, b) => Math.abs(a.tx - G.w * .38) - Math.abs(b.tx - G.w * .38));
    return candidates[0] || null;
  }
  function safeToEnter() {
    if (protectedFloor() || mode !== "play" || G.done || P.dead || G.freeze > 0 || !G.r110Terminal || G.r110Terminal.used) return false;
    const ambush = G.r106Ambush;
    if (ambush && (ambush.active || ambush.warning)) return false;
    if (G.enemies.some(e => !e.dead && (e.isMiniBoss || ENEMIES[e.type].isBoss || distance(P, e) < 170))) return false;
    if (G.shots.some(s => distance(P, s) < 170)) return false;
    return distance(P, G.r110Terminal) < 58;
  }
  function onFloor() {
    if (session) close(false);
    offer.hidden = true; pending = false;
    G.r110Terminal = null;
    if (protectedFloor()) return;
    const data = ledger();
    if (data.played[G.num]) return;
    if (!Object.prototype.hasOwnProperty.call(data.offers, G.num)) {
      const history = Object.values(data.offers).filter(id => catalogue.some(g => g.id === id));
      const round = history.slice(Math.floor(history.length / catalogue.length) * catalogue.length);
      const pool = catalogue.filter(g => !round.includes(g.id) && !history.slice(-3).includes(g.id));
      data.offers[G.num] = random() < .38 ? (pool[integer(random, pool.length)] || catalogue.find(g => !round.includes(g.id)) || catalogue[0]).id : "none";
      writeSave();
    }
    const id = data.offers[G.num], descriptor = catalogue.find(g => g.id === id);
    if (!descriptor) return;
    const spot = location();
    if (spot) G.r110Terminal = { ...spot, id, used: false };
  }
  function tick() {
    const terminal = G && G.r110Terminal;
    if (session || !terminal || mode !== "play" || G.done || !P || P.dead) { offer.hidden = true; return; }
    const nearby = distance(P, terminal) < 58;
    offer.hidden = !nearby || terminal.used;
    if (!offer.hidden) {
      const ready = safeToEnter();
      offer.textContent = ready ? "PLAY " + catalogue.find(g => g.id === terminal.id).name.toUpperCase() : "BONUS TERMINAL - AREA UNSAFE";
      offer.disabled = !ready;
      offer.title = "Optional bonus game";
      if (ready && pressed.use && !pending) {
        pressed.use = false; pending = true;
        // Enter only after the campaign's current update and rendering have finished.
        queueMicrotask(() => { pending = false; open(); });
      }
    }
  }
  function draw() {
    const t = G && G.r110Terminal;
    if (!t || t.x < G.cam.x - TS || t.x > G.cam.x + CW + TS) return;
    ctx.save();
    ctx.fillStyle = "#19222c"; ctx.fillRect(t.x - 3, t.y - 8, 28, 36);
    ctx.strokeStyle = t.used ? C.muted : C.cyan; ctx.strokeRect(t.x - 3, t.y - 8, 28, 36);
    ctx.fillStyle = t.used ? C.muted : C.cyan; ctx.fillRect(t.x + 2, t.y - 3, 18, 13);
    ctx.fillStyle = C.ink; ctx.fillRect(t.x + 7, t.y, 8, 7);
    ctx.fillStyle = C.pink; ctx.fillRect(t.x + 3, t.y + 17, 4, 4);
    ctx.fillStyle = C.gold; ctx.fillRect(t.x + 15, t.y + 17, 4, 4);
    ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = t.used ? C.muted : C.cyan;
    ctx.fillText(t.used ? "PLAYED" : "BONUS", t.x + 11, t.y - 16); ctx.restore();
  }
  function controls() {
    const enabled = session && session.phase === "playing";
    for (const button of modal.querySelectorAll("[data-action]")) button.disabled = !enabled;
    get("r110Start").hidden = !session || session.phase !== "ready";
    get("r110Pause").hidden = !session || !["playing", "paused"].includes(session.phase);
    get("r110Pause").textContent = session && session.phase === "paused" ? "Resume" : "Pause";
  }
  function open() {
    if (session || !safeToEnter()) return false;
    const terminal = G.r110Terminal, descriptor = catalogue.find(g => g.id === terminal.id);
    focusBefore = document.activeElement;
    session = { floor: G, player: P, terminal, phase: "ready", game: createGame(terminal.id, integer(random, 0xffffffff)), credited: false };
    mode = "bonus"; clearInputs(); offer.hidden = true; modal.hidden = false;
    get("r110Title").textContent = descriptor.name;
    get("r110Goal").textContent = descriptor.goal;
    get("r110Status").textContent = "BONUS ENCOUNTER";
    controls(); paint(session.game, context); get("r110Start").focus();
    lastFrame = performance.now(); animation = requestAnimationFrame(animate);
    return true;
  }
  function start() {
    if (!session || session.phase !== "ready") return;
    const data = ledger();
    if (data.played[session.floor.num]) { close(true); return; }
    data.played[session.floor.num] = session.terminal.id;
    session.terminal.used = true; writeSave();
    session.phase = "playing"; clearInputs(); controls();
    get("r110Status").textContent = session.game.status();
    arena.focus();
  }
  function finish() {
    if (!session || session.phase !== "playing" || !session.game.result) return;
    session.phase = "result";
    let reward = 0;
    if (session.game.result === "won" && !session.credited && session.floor === G && session.player === P && !P.dead && !G.done) {
      session.credited = true;
      reward = 6 + Math.min(5, G.biome.n) + integer(random, 5);
      save.scrap = (save.scrap || 0) + reward; writeSave(); refreshHUD();
    }
    get("r110Status").textContent = session.game.result === "won" ? "BONUS COMPLETE  /  +" + reward + " scrap" : "ATTEMPT FINISHED  /  NO LIFE LOST";
    controls(); get("r110Return").focus();
  }
  function animate(now) {
    animation = null;
    if (!session) return;
    if (G !== session.floor || P !== session.player || mode !== "bonus" || G.done || P.dead) { close(false); return; }
    const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
    if (session.phase === "playing") {
      session.game.tick(dt); finish();
      if (session.phase === "playing" && get("r110Status").textContent !== session.game.status()) get("r110Status").textContent = session.game.status();
    }
    paint(session.game, context);
    animation = requestAnimationFrame(animate);
  }
  function close(resume) {
    if (!session) return;
    const same = session.floor === G && session.player === P;
    session = null; modal.hidden = true; clearInputs();
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    if (resume && same && mode === "bonus" && !G.done && !P.dead) { mode = "play"; refreshHUD(); }
    if (focusBefore && focusBefore.isConnected && typeof focusBefore.focus === "function") focusBefore.focus();
  }
  function act(action) { if (session && session.phase === "playing") { session.game.act(action); finish(); paint(session.game, context); } }
  function pause() {
    if (!session || !["playing", "paused"].includes(session.phase)) return;
    session.phase = session.phase === "playing" ? "paused" : "playing";
    lastFrame = performance.now(); clearInputs(); controls();
    get("r110Status").textContent = session.phase === "paused" ? "PAUSED" : session.game.status();
  }
  offer.addEventListener("click", open);
  get("r110Start").addEventListener("click", start);
  get("r110Pause").addEventListener("click", pause);
  get("r110Return").addEventListener("click", () => close(true));
  get("r110Leave").addEventListener("click", () => close(true));
  for (const button of modal.querySelectorAll("[data-action]")) button.addEventListener("click", e => { e.preventDefault(); act(button.dataset.action); });
  window.addEventListener("keydown", e => {
    if (!session) return;
    if (e.code === "Tab") {
      const buttons = [...modal.querySelectorAll("button")].filter(b => !b.disabled && !b.hidden);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      e.stopImmediatePropagation(); return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    if (["Enter", "Space"].includes(e.code) && document.activeElement && document.activeElement.tagName === "BUTTON" && modal.contains(document.activeElement)) { document.activeElement.click(); return; }
    if (e.code === "Escape") { close(true); return; }
    if (e.code === "KeyP") { pause(); return; }
    if (["Enter", "Space"].includes(e.code) && session.phase === "ready") { start(); return; }
    const action = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", Space: "action", Enter: "action" }[e.code];
    if (action) act(action);
  }, true);
  window.addEventListener("keyup", e => { if (session) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener("visibilitychange", () => { if (document.hidden && session && session.phase === "playing") pause(); });
  window.addEventListener("blur", () => { if (session && session.phase === "playing") pause(); });
  window.IronTrapArcade = {
    onFloor, tick, draw, open, catalogue, createGame,
    respawn() { if (session) close(false); offer.hidden = true; },
    get session() { return session; }
  };
})();
