const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.IRONTRAP_PLAYWRIGHT || 'playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  });
});

async function load(browser, baseline = false, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 560, isMobile: viewport.width < 560 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.text().startsWith('R106 ambush')) errors.push(message.text()); });
  if (baseline) await page.route('**/r107-encounters.js*', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.waitForFunction(() => window.__IRONTRAP_R106_AMBUSHES && typeof startFloor === 'function');
  if (!baseline) await page.waitForFunction(() => window.__IRONTRAP_R107_ENCOUNTERS);
  return { page, errors };
}

async function snapshot(page, difficulty, n) {
  return page.evaluate(({ difficulty, n }) => {
    save.difficulty = difficulty;
    Math.random = mulberry(n * 173 + 9);
    startFloor(n);
    mode = 'pause';
    const s = G.r107Encounter;
    const objectivePoints = s ? s.points.map(p => ({ x: p.x, y: p.y, tx: p.tx, ty: p.ty })) : [];
    const seen = reachSet(G.grid, G.w, Math.floor(G.spawn.x / TS), Math.floor((G.spawn.y + P.h - 1) / TS));
    return {
      n, kind: s && s.kind, grid: G.grid.map(row => row.join('')),
      pickups: G.pickups.map(p => [p.kind, p.data || null, p.x, p.y]),
      enemies: G.enemies.map(e => [e.type, e.x, e.y, e.hp, !!e.isMiniBoss]),
      bench: G.bench && [G.bench.x, G.bench.y], lives: G.lives,
      points: objectivePoints, reachable: objectivePoints.every(p => seen.has(p.ty * G.w + p.tx)),
      open: exitOpen(), ambush: G.r106Ambush.eligible,
      target: !!(s && s.target), hud: document.getElementById('killcount').textContent
    };
  }, { difficulty, n });
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    ...(process.env.IRONTRAP_BROWSER ? { executablePath: process.env.IRONTRAP_BROWSER } : {}),
    headless: true, args: ['--disable-gpu', '--no-sandbox', '--in-process-gpu']
  });
  try {
    const baseline = await load(browser, true);
    const current = await load(browser);
    await current.page.evaluate(() => { window.testHooks = [startFloor, updateEnemies, exitOpen, respawn, buildLevel, drawPickups, refreshHUD]; });
    await current.page.addScriptTag({ path: path.join(root, 'r106-ambushes.js') });
    await current.page.addScriptTag({ path: path.join(root, 'r107-encounters.js') });
    assert.ok(await current.page.evaluate(() => [startFloor, updateEnemies, exitOpen, respawn, buildLevel, drawPickups, refreshHUD].every((fn, i) => fn === window.testHooks[i])), 'duplicate script load does not stack wrappers');
    const kinds = {}, examples = {}, difficulties = ['easy', 'normal', 'hard', 'nightmare', 'demon'];
    let cases = 0;
    for (const difficulty of difficulties) {
      let previous = null;
      for (let n = 1; n <= 50; n++) {
        const before = await snapshot(baseline.page, difficulty, n);
        const after = await snapshot(current.page, difficulty, n);
        assert.deepEqual(after.pickups, before.pickups, 'original pickups on floor ' + n);
        assert.deepEqual(after.bench, before.bench, 'workbench on floor ' + n);
        assert.equal(after.lives, before.lives, 'lives on floor ' + n);
        if (!after.kind) {
          assert.deepEqual(after.grid, before.grid, 'protected floor layout ' + n);
          assert.deepEqual(after.enemies, before.enemies, 'protected encounters ' + n);
        } else {
          assert.ok(after.enemies.length <= 16, 'enemy cap on floor ' + n);
          assert.ok(after.reachable, 'reachable objectives on floor ' + n);
          assert.ok(after.enemies.length > 0, 'nonempty encounter on floor ' + n);
          assert.notEqual(after.kind, previous, 'consecutive repeated objective ' + n);
          previous = after.kind;
          kinds[after.kind] = (kinds[after.kind] || 0) + 1;
          examples[after.kind] ||= n;
          if (!['combat', 'hunt'].includes(after.kind)) assert.equal(after.ambush, false, 'objective excludes ambush ' + n);
          if (['recovery', 'sabotage', 'hunt'].includes(after.kind)) assert.equal(after.open, false, 'objective gates exit ' + n);
          if (['escape', 'scavenge'].includes(after.kind)) assert.equal(after.open, true, 'optional combat exit ' + n);
        }
        cases++;
      }
      console.log('PASS 50 floors on ' + difficulty);
    }
    for (const kind of ['escape', 'recovery', 'sabotage', 'hunt', 'scavenge', 'combat']) assert.ok(kinds[kind], kind + ' is playable');

    // Exercise objective completion, checkpoint retries, and paused/dead states in the real game.
    for (const kind of ['recovery', 'sabotage', 'hunt', 'scavenge']) {
      await snapshot(current.page, 'normal', examples[kind]);
      const result = await current.page.evaluate(kind => {
        const s = G.r107Encounter, initialScrap = save.scrap || 0;
        P.x = s.points[0] ? s.points[0].x : P.x;
        P.y = s.points[0] ? s.points[0].y : P.y;
        mode = 'pause'; keys.use = true; G.time++; IronTrapEncounters.tick();
        const pausedUntouched = s.points.every(p => !p.done && p.progress === 0);
        mode = 'play'; P.dead = true; G.time++; IronTrapEncounters.tick();
        const deadUntouched = s.points.every(p => !p.done && p.progress === 0);
        P.dead = false;
        if (kind === 'hunt') killEnemy(s.target);
        for (const point of s.points) {
          P.x = point.x; P.y = point.y;
          for (let i = 0; i < 45; i++) { G.time++; IronTrapEncounters.tick(); }
        }
        G.time++; IronTrapEncounters.tick();
        keys.use = false;
        const unlocked = exitOpen(), bonus = (save.scrap || 0) - initialScrap;
        const pointsDone = s.points.every(p => p.done);
        respawn();
        const afterRespawn = exitOpen();
        for (const point of s.points) { P.x = point.x; P.y = point.y; G.time++; IronTrapEncounters.tick(); }
        const noDuplicateReward = (save.scrap || 0) - initialScrap === bonus;
        mode = 'pause';
        return { pausedUntouched, deadUntouched, unlocked, pointsDone, afterRespawn, noDuplicateReward, bonus };
      }, kind);
      assert.ok(result.pausedUntouched && result.deadUntouched && result.unlocked && result.pointsDone);
      assert.equal(result.afterRespawn, kind !== 'hunt', 'checkpoint objective state ' + kind);
      assert.ok(result.noDuplicateReward, 'no duplicate checkpoint reward ' + kind);
      console.log('PASS lifecycle ' + kind, JSON.stringify(result));
    }

    await snapshot(current.page, 'normal', examples.sabotage);
    assert.equal(await current.page.evaluate(() => {
      const point = G.r107Encounter.points[0];
      P.x = point.x; P.y = point.y; mode = 'play'; keys.use = true;
      for (let i = 0; i < 20; i++) { G.time++; IronTrapEncounters.tick(); }
      P.x += 200; G.time++; IronTrapEncounters.tick(); keys.use = false; mode = 'pause';
      return point.progress;
    }), 0, 'relay progress resets when leaving');

    // The existing mobile interaction emits a one-frame use press, not a held key.
    assert.equal(await current.page.evaluate(() => {
      const point = G.r107Encounter.points[0];
      P.x = point.x; P.y = point.y; mode = 'play';
      document.getElementById('tinteract').dispatchEvent(new Event('touchstart', { cancelable: true }));
      G.time++; IronTrapEncounters.tick(); pressed.use = false;
      for (let i = 0; i < 44; i++) { G.time++; IronTrapEncounters.tick(); }
      mode = 'pause'; return point.done;
    }), true, 'touch tap completes relay');

    for (const kind of Object.keys(examples)) {
      await snapshot(current.page, 'normal', examples[kind]);
      const progression = await current.page.evaluate(() => {
        const s = G.r107Encounter;
        mode = 'play'; P.inv = 9999;
        if (s.target) killEnemy(s.target);
        for (const point of s.points) {
          P.x = point.x; P.y = point.y; keys.use = true;
          for (let i = 0; i < 45; i++) { G.time++; IronTrapEncounters.tick(); }
        }
        keys.use = false;
        if (s.kind === 'combat') G.enemies.forEach(killEnemy);
        G.r106Ambush.complete = true;
        P.x = G.exit.x; P.y = G.exit.y; P.vx = 0; P.vy = 0;
        const num = G.num, lives = G.lives, weapon = curWep().id;
        updatePlayer();
        const cleared = mode === 'clear' && G.done && save.cleared[num];
        const savedLives = save.setLives === lives, savedWeapon = save.currentWeapon === weapon;
        startFloor(num + 1); mode = 'pause';
        return { cleared, savedLives, savedWeapon, nextFloor: G.num === num + 1 };
      });
      assert.ok(Object.values(progression).every(Boolean), kind + ' progression ' + JSON.stringify(progression));
    }
    console.log('PASS floor completion, weapon/life persistence, and next-floor progression');

    await snapshot(current.page, 'normal', examples.hunt);
    assert.ok(await current.page.evaluate(() => {
      G.time = 1200; mode = 'play'; killEnemy(G.r107Encounter.target);
      Object.assign(G.r106Ambush, { eligible: true, triggerAt: 0, complete: false, warning: false });
      updateEnemies(); mode = 'pause';
      return G.r106Ambush.complete && !G.r106Ambush.warning;
    }), 'completed objective cannot start a late ambush');

    await snapshot(current.page, 'normal', examples.combat);
    const ambush = await current.page.evaluate(() => {
      const s = G.r107Encounter;
      const e = G.enemies.find(e => ENEMIES[e.type].ai !== 'fly');
      P.x = e.x; P.y = e.y; G.enemies = [e]; G.time = 1200; mode = 'play';
      Math.random = () => 0;
      Object.assign(G.r106Ambush, { eligible: true, triggerAt: 0, complete: false, triggered: false, active: false, warning: false });
      updateEnemies();
      const warned = G.r106Ambush.warning;
      G.time += 111; updateEnemies();
      const spawned = G.enemies.filter(e => e.fromAmbush).length;
      const activeLocked = G.r106Ambush.active && !exitOpen();
      G.enemies.filter(e => e.fromAmbush).forEach(killEnemy);
      G.time++; updateEnemies();
      const cleared = G.r106Ambush.complete && !G.r106Ambush.active;
      G.time++; updateEnemies();
      const noRepeat = !G.enemies.some(e => e.fromAmbush && !e.dead);
      respawn();
      const noRevivedWave = !G.enemies.some(e => e.fromAmbush);
      mode = 'pause';
      return { warned, spawned, activeLocked, cleared, noRepeat, noRevivedWave };
    });
    assert.ok(ambush.warned && ambush.spawned > 0 && ambush.activeLocked && ambush.cleared && ambush.noRepeat && ambush.noRevivedWave, JSON.stringify(ambush));
    console.log('PASS ambush compatibility', JSON.stringify(ambush));

    await snapshot(current.page, 'normal', examples.sabotage);
    const useKey = await current.page.evaluate(() => {
      const point = G.r107Encounter.points[0];
      P.x = point.x; P.y = point.y; P.vx = 0; P.vy = 0; P.inv = 9999;
      mode = 'play'; return save.binds.use[0];
    });
    await current.page.keyboard.down(useKey);
    await current.page.waitForFunction(() => G.r107Encounter.points[0].done, { timeout: 5000 });
    await current.page.keyboard.up(useKey);
    await current.page.evaluate(() => { mode = 'pause'; });
    console.log('PASS keyboard relay interaction through the running game loop');

    const artifactDir = process.env.IRONTRAP_TEST_ARTIFACTS;
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
      const visualPage = viewport.width < 560 ? await load(browser, false, viewport) : current;
      await visualPage.page.setViewportSize(viewport);
      for (const kind of ['recovery', 'sabotage', 'hunt', 'scavenge']) {
        await snapshot(visualPage.page, 'normal', examples[kind]);
        const visual = await visualPage.page.evaluate(() => {
          const s = G.r107Encounter, target = s.target || s.points[0];
          G.cam.x = clamp(target.x - CW / 2, 0, Math.max(0, G.w * TS - CW));
          G.cam.y = 0; draw();
          const pixels = ctx.getImageData(0, 0, CW, CH).data;
          const colors = new Set();
          for (let i = 0; i < pixels.length; i += 64) colors.add(pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2]);
          const hud = document.getElementById('killcount');
          const bounds = hud.getBoundingClientRect();
          const biome = document.getElementById('biome').getBoundingClientRect();
          const help = document.getElementById('keybtn').getBoundingClientRect();
          return { colors: colors.size, hud: hud.textContent, bounds: { left: bounds.left, right: bounds.right }, viewport: innerWidth, biome: biome.toJSON(), help: help.toJSON(), clearOfHelp: biome.bottom <= help.top || biome.left >= help.right || biome.right <= help.left };
        });
        assert.ok(visual.colors > 20, 'rendered canvas ' + kind);
        assert.ok(visual.bounds.left >= 0 && visual.bounds.right <= visual.viewport + 1, 'HUD fits ' + kind);
        assert.ok(visual.clearOfHelp, 'objective HUD does not push biome into help ' + kind + ': ' + JSON.stringify(visual));
        if (artifactDir) {
          fs.mkdirSync(artifactDir, { recursive: true });
          await visualPage.page.screenshot({ path: path.join(artifactDir, kind + '-' + viewport.width + '.png') });
        }
      }
      if (viewport.width < 560) {
        await snapshot(visualPage.page, 'normal', examples.sabotage);
        await visualPage.page.evaluate(() => {
          const point = G.r107Encounter.points[0];
          P.x = point.x; P.y = point.y; P.vx = 0; P.vy = 0; P.inv = 9999; mode = 'play';
        });
        await visualPage.page.locator('#tinteract').tap();
        await visualPage.page.waitForFunction(() => G.r107Encounter.points[0].done, { timeout: 5000 });
        await visualPage.page.evaluate(() => { mode = 'pause'; });
        assert.deepEqual(visualPage.errors, [], 'mobile runtime errors');
        await visualPage.page.close();
      }
    }
    assert.deepEqual(current.errors, [], 'browser runtime errors');
    assert.deepEqual(baseline.errors, [], 'baseline runtime errors');
    console.log('PASS browser rendering, desktop/mobile HUD, ' + cases + ' floor/difficulty cases; encounters:', JSON.stringify(kinds));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
