const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { chromium } = require(process.env.IRONTRAP_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(os.tmpdir(), 'irontrap-minigames-tests');
fs.mkdirSync(artifacts, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : 'text/plain'); res.end(data);
  });
});

async function load(browser, viewport = { width: 1440, height: 900 }, baseline = false) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 560, isMobile: viewport.width < 560 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (baseline) await page.route('**/r110-minigames.js*', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.waitForFunction(() => window.__IRONTRAP_R107_ENCOUNTERS);
  if (!baseline) await page.waitForFunction(() => window.__IRONTRAP_R110_ARCADE);
  return { page, errors };
}

async function setup(page, id = 'pulse') {
  return page.evaluate(id => {
    if (IronTrapArcade.session) document.getElementById('r110Return').click();
    save.rankedRun = false; localStorage.removeItem('ironfall.room');
    save.arcade = { version: 1, offers: {}, played: {} };
    for (let n = 6; n < 46; n++) save.arcade.offers[n] = id;
    for (let n = 6; n < 46; n++) {
      startFloor(n); mode = 'pause';
      if (G.r110Terminal) {
        G.enemies.forEach(e => { e.dead = true; }); G.shots.length = 0;
        Object.assign(G.r106Ambush, { active: false, warning: false, complete: true });
        P.x = G.r110Terminal.x; P.y = G.r110Terminal.y; P.vx = 0; P.vy = 0; P.inv = 99999; G.freeze = 0;
        mode = 'play'; IronTrapArcade.tick();
        return G.num;
      }
    }
    throw new Error('No reachable terminal');
  }, id);
}

// Solvers exercise the public game models without bypassing their win conditions.
function solveAllInBrowser() {
  const reports = [];
  const walk = (g, target, width) => {
    while (g.cursor % width > target % width) g.act('left');
    while (g.cursor % width < target % width) g.act('right');
    while (Math.floor(g.cursor / width) > Math.floor(target / width)) g.act('up');
    while (Math.floor(g.cursor / width) < Math.floor(target / width)) g.act('down');
  };
  for (const descriptor of IronTrapArcade.catalogue) {
    let wins = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const g = IronTrapArcade.createGame(descriptor.id, seed);
      for (let step = 0; step < 4000 && !g.result; step++) {
        const id = g.id;
        if (id === 'pulse' && Math.abs(g.marker - g.band) < .08) g.act('action');
        if (id === 'memory' && g.phase === 'input') g.act(['up', 'right', 'down', 'left'][g.sequence[g.input]]);
        if (id === 'signal') g.act(['up', 'right', 'down', 'left'][g.symbol]);
        if (id === 'balance') { if (g.energy > .56) g.act('left'); if (g.energy < .44) g.act('right'); }
        if (id === 'circuit') {
          while (g.tiles[g.cursor] !== 0 && !g.result) g.act('action');
          if (!g.result) g.act('right');
        }
        if (id === 'sort') g.act(g.cargo ? 'right' : 'left');
        if (id === 'catch' && g.drops.length) {
          const d = g.drops.reduce((a, b) => a.y > b.y ? a : b);
          const lane = d.danger ? (d.lane + 1) % 3 : d.lane;
          while (g.lane > lane) g.act('left'); while (g.lane < lane) g.act('right');
        }
        if (id === 'switch') { walk(g, g.target, 3); g.act('action'); }
        if (id === 'salvage') {
          const queue = [g.cursor], paths = new Map([[g.cursor, []]]);
          let target;
          for (let i = 0; i < queue.length; i++) {
            const cell = queue[i], x = cell % 6, y = Math.floor(cell / 6);
            if (g.cores.includes(cell)) { target = cell; break; }
            const edges = [[x > 0 ? cell - 1 : -1, 'left'], [x < 5 ? cell + 1 : -1, 'right'], [y > 0 ? cell - 6 : -1, 'up'], [y < 3 ? cell + 6 : -1, 'down']];
            for (const [next, action] of edges) if (next >= 0 && !g.hazards.includes(next) && !paths.has(next)) { paths.set(next, [...paths.get(cell), action]); queue.push(next); }
          }
          if (target === undefined) throw new Error('Unreachable salvage core, seed ' + seed);
          for (const action of paths.get(target)) g.act(action);
        }
        if (id === 'hop' && g.barriers.some(b => b.x < 190 && b.x > 120) && g.jump === 0) g.act('action');
        g.tick(.05);
      }
      if (g.result !== 'won') throw new Error(descriptor.id + ' failed solver at seed ' + seed + ': ' + g.status());
      wins++;
      const frozen = JSON.stringify(g);
      g.tick(.05); g.act('action');
      if (frozen !== JSON.stringify(g)) throw new Error('Finished game mutated');
      const timeout = IronTrapArcade.createGame(descriptor.id, seed);
      timeout.time = timeout.limit - .01;
      timeout.tick(.05);
      if (timeout.result !== 'lost') throw new Error('No timeout/failure for ' + descriptor.id);
    }
    reports.push({ id: descriptor.id, wins, failures: 100 });
  }
  return reports;
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ ...(process.env.IRONTRAP_BROWSER ? { executablePath: process.env.IRONTRAP_BROWSER } : {}), headless: true, args: ['--disable-gpu', '--no-sandbox', '--in-process-gpu'] });
  try {
    const current = await load(browser), baseline = await load(browser, undefined, true);
    console.log('PASS models:', JSON.stringify(await current.page.evaluate(solveAllInBrowser)));
    const hooks = await current.page.evaluate(() => {
      window.arcadeHooks = [startFloor, buildLevel, updateEnemies, drawPickups, respawn, exitOpen];
      return IronTrapArcade.catalogue.length;
    });
    assert.equal(hooks, 10);
    await current.page.addScriptTag({ path: path.join(root, 'r110-minigames.js') });
    assert.ok(await current.page.evaluate(() => [startFloor, buildLevel, updateEnemies, drawPickups, respawn, exitOpen].every((fn, i) => fn === arcadeHooks[i])));

    let offers = 0;
    const ids = new Set();
    for (const difficulty of ['easy', 'normal', 'hard', 'nightmare', 'demon']) {
      for (let n = 1; n <= 50; n++) {
        const snapshot = ({ n, difficulty }) => {
          save.difficulty = difficulty; Math.random = mulberry(n * 111 + 42); startFloor(n); mode = 'pause';
          const t = G.r110Terminal;
          const seen = reachSet(G.grid, G.w, Math.floor(G.spawn.x / TS), Math.floor((G.spawn.y + P.h - 1) / TS));
          return { grid: G.grid, enemies: G.enemies.map(e => [e.type, e.hp, e.x, e.y]), pickups: G.pickups.map(p => [p.kind, p.data, p.x, p.y]), lives: G.lives, open: exitOpen(), weapon: curWep().id, terminal: t && { id: t.id, reachable: seen.has(t.ty * G.w + t.tx), solid: rectSolid(t.x, t.y, t.w, t.h) }, protected: G.boss || G.quest || G.bench || n < 6 || n >= 46 || n % 5 === 0 };
        };
        const before = await baseline.page.evaluate(snapshot, { n, difficulty });
        const after = await current.page.evaluate(snapshot, { n, difficulty });
        const terminal = after.terminal;
        delete before.terminal; delete after.terminal;
        assert.deepEqual(after, before, 'unchanged campaign ' + n + '/' + difficulty);
        if (terminal) { assert.ok(!after.protected && terminal.reachable && !terminal.solid); offers++; ids.add(terminal.id); }
      }
    }
    console.log('PASS campaign invariants: 250 floor/difficulty cases; terminals:', offers);
    const variety = await current.page.evaluate(() => {
      const found = new Set(), recentValid = [];
      for (let run = 0; run < 30; run++) {
        save.arcade = { version: 1, offers: {}, played: {} };
        const recent = [];
        for (let n = 6; n < 46; n++) {
          startFloor(n); mode = 'pause';
          const id = save.arcade.offers[n];
          if (!id || id === 'none') continue;
          if (recent.slice(-3).includes(id)) throw new Error('Repeated recent game');
          if (recent.slice(Math.floor(recent.length / 10) * 10).includes(id)) throw new Error('Repeated game within a round');
          recent.push(id); found.add(id);
        }
        recentValid.push(recent.length);
      }
      return { found: [...found], perRun: recentValid };
    });
    assert.equal(variety.found.length, 10);
    console.log('PASS random selection:', JSON.stringify(variety));

    const floor = await setup(current.page);
    const safeguards = await current.page.evaluate(() => {
      const t = G.r110Terminal, checks = {};
      for (const state of ['pause', 'bench', 'dead', 'clear', 'settings', 'inv']) { mode = state; checks[state] = IronTrapArcade.open() === false; }
      mode = 'play'; P.dead = true; checks.deadPlayer = !IronTrapArcade.open(); P.dead = false;
      G.done = true; checks.done = !IronTrapArcade.open(); G.done = false;
      G.r106Ambush.warning = true; checks.warning = !IronTrapArcade.open(); G.r106Ambush.warning = false;
      G.r106Ambush.active = true; checks.ambush = !IronTrapArcade.open(); G.r106Ambush.active = false;
      G.enemies[0].dead = false; const e = G.enemies[0], old = { x: e.x, y: e.y }; e.x = P.x; e.y = P.y;
      checks.enemy = !IronTrapArcade.open(); e.dead = true; Object.assign(e, old);
      G.shots.push({ x: P.x, y: P.y }); checks.shot = !IronTrapArcade.open(); G.shots.length = 0;
      save.rankedRun = true; checks.ranked = !IronTrapArcade.open(); IronTrapArcade.onFloor(); checks.rankedSpawn = !G.r110Terminal; save.rankedRun = false;
      G.r110Terminal = t; localStorage.setItem('ironfall.room', 'TEST'); checks.room = !IronTrapArcade.open(); localStorage.removeItem('ironfall.room');
      return checks;
    });
    assert.ok(Object.values(safeguards).every(Boolean));
    console.log('PASS entry safeguards:', JSON.stringify(safeguards));

    await current.page.locator('#r110Offer').click();
    await current.page.keyboard.press('Escape');
    assert.ok(await current.page.evaluate(() => mode === 'play' && !save.arcade.played[G.num]));
    await current.page.evaluate(() => IronTrapArcade.tick());
    await current.page.locator('#r110Offer').click();
    await current.page.locator('#r110Leave').focus();
    await current.page.keyboard.press('Shift+Tab');
    assert.equal(await current.page.evaluate(() => document.activeElement.id), 'r110Return', 'focus stays in dialog');
    await current.page.keyboard.press('Tab');
    assert.equal(await current.page.evaluate(() => document.activeElement.id), 'r110Leave');
    await current.page.locator('#r110Start').focus();
    const world = await current.page.evaluate(() => ({ time: G.time, hp: P.hp, lives: G.lives, weapon: curWep().id, scrap: save.scrap || 0, enemies: G.enemies.map(e => [e.x, e.y, e.hp]), shots: G.shots.length }));
    await current.page.keyboard.press('Enter');
    await current.page.waitForTimeout(400);
    assert.deepEqual(await current.page.evaluate(() => ({ time: G.time, hp: P.hp, lives: G.lives, weapon: curWep().id, scrap: save.scrap || 0, enemies: G.enemies.map(e => [e.x, e.y, e.hp]), shots: G.shots.length })), world, 'campaign frozen in bonus');
    await current.page.keyboard.press('KeyP');
    const pausedTime = await current.page.evaluate(() => IronTrapArcade.session.game.time);
    await current.page.waitForTimeout(250);
    assert.equal(await current.page.evaluate(() => IronTrapArcade.session.game.time), pausedTime);
    await current.page.keyboard.press('KeyP');
    await current.page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await current.page.evaluate(() => IronTrapArcade.session.phase), 'paused', 'background pause');
    await current.page.keyboard.press('KeyP');
    await current.page.locator('[data-action="action"]').focus();
    for (let i = 0; i < 5; i++) {
      await current.page.waitForFunction(() => IronTrapArcade.session.phase === 'playing' && Math.abs(IronTrapArcade.session.game.marker - IronTrapArcade.session.game.band) < .065);
      await current.page.keyboard.press('Space');
    }
    assert.equal(await current.page.evaluate(() => IronTrapArcade.session.phase), 'result');
    const reward = await current.page.evaluate(() => save.scrap || 0);
    assert.ok(reward - world.scrap >= 7 && reward - world.scrap <= 15);
    await current.page.waitForTimeout(250);
    assert.equal(await current.page.evaluate(() => save.scrap || 0), reward, 'no duplicate result rewards');
    await current.page.keyboard.press('Enter');
    assert.ok(await current.page.evaluate(() => mode === 'play' && G.r110Terminal.used && Object.values(keys).every(v => !v)));
    await current.page.evaluate(() => { respawn(); mode = 'pause'; });
    assert.ok(await current.page.evaluate(() => G.r110Terminal.used && !!save.arcade.played[G.num]));
    await current.page.evaluate(n => { startFloor(n); mode = 'pause'; }, floor);
    assert.ok(await current.page.evaluate(() => !G.r110Terminal), 'restart cannot farm an attempt');
    await current.page.reload(); await current.page.waitForFunction(() => window.__IRONTRAP_R110_ARCADE);
    await current.page.evaluate(n => { startFloor(n); mode = 'pause'; }, floor);
    assert.ok(await current.page.evaluate(() => !G.r110Terminal), 'reload cannot farm an attempt');
    console.log('PASS keyboard, pause, world freeze, reward once, checkpoint/restart/reload');

    await setup(current.page);
    await current.page.locator('#r110Offer').click(); await current.page.locator('#r110Start').click();
    const failScrap = await current.page.evaluate(() => save.scrap || 0);
    await current.page.evaluate(() => { const g = IronTrapArcade.session.game; for (let i = 0; i < 800 && !g.result; i++) g.tick(.05); });
    await current.page.waitForFunction(() => IronTrapArcade.session.phase === 'result');
    assert.ok(await current.page.evaluate(scrap => (save.scrap || 0) === scrap && !P.dead && G.lives > 0, failScrap));
    await current.page.locator('#r110Return').click();
    await setup(current.page); await current.page.locator('#r110Offer').click(); await current.page.locator('#r110Start').click();
    await current.page.keyboard.press('Escape');
    assert.ok(await current.page.evaluate(() => mode === 'play' && G.r110Terminal.used));
    await setup(current.page); await current.page.locator('#r110Offer').click();
    await current.page.evaluate(() => { startFloor(10); mode = 'pause'; });
    assert.ok(await current.page.evaluate(() => !IronTrapArcade.session && document.getElementById('r110Arcade').hidden && !G.r110Terminal));
    console.log('PASS failure, abandonment, and external floor transition');

    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const visual = await load(browser, viewport);
      for (const id of ['pulse', 'memory', 'signal', 'balance', 'circuit', 'sort', 'catch', 'switch', 'salvage', 'hop']) {
        await setup(visual.page, id); await visual.page.locator('#r110Offer').click();
        const frame = await visual.page.evaluate(() => {
          const modal = document.getElementById('r110Arcade'), canvas = modal.querySelector('canvas');
          const rect = canvas.getBoundingClientRect();
          const colors = new Set(), data = canvas.getContext('2d').getImageData(0, 0, 640, 360).data;
          for (let i = 0; i < data.length; i += 4) colors.add(data.slice(i, i + 3).join(','));
          return { colors: colors.size, within: rect.left >= 0 && rect.right <= innerWidth, overflow: modal.scrollWidth > modal.clientWidth, buttons: [...modal.querySelectorAll('button:not([hidden])')].every(b => b.getBoundingClientRect().width >= 44) };
        });
        assert.ok(frame.colors >= 3 && frame.within && !frame.overflow && frame.buttons, 'visual ' + id + '/' + viewport.width + ': ' + JSON.stringify(frame));
        if (['memory', 'salvage', 'hop'].includes(id)) await visual.page.screenshot({ path: path.join(artifacts, id + '-' + viewport.width + '.png') });
        if (viewport.width < 560 && id === 'pulse') {
          await visual.page.locator('#r110Start').tap();
          await visual.page.waitForFunction(() => Math.abs(IronTrapArcade.session.game.marker - IronTrapArcade.session.game.band) < .065);
          await visual.page.locator('[data-action="action"]').tap();
          assert.equal(await visual.page.evaluate(() => IronTrapArcade.session.game.score), 1, 'real touch action');
          await visual.page.locator('#r110Pause').tap();
          assert.equal(await visual.page.evaluate(() => IronTrapArcade.session.phase), 'paused');
        }
        await visual.page.locator('#r110Return').click();
      }
      assert.deepEqual(visual.errors, []); await visual.page.close();
      console.log('PASS all 10 arenas and controls at ' + viewport.width + 'px');
    }
    assert.deepEqual(current.errors, []); assert.deepEqual(baseline.errors, []);
    console.log('PASS no browser runtime errors; screenshots:', artifacts);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
