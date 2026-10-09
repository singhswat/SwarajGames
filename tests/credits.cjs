const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { chromium } = require(process.env.IRONTRAP_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(os.tmpdir(), 'irontrap-credits-tests');
fs.mkdirSync(artifacts, { recursive: true });
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : 'text/plain'); res.end(data);
  });
});

async function load(browser, viewport = { width: 1440, height: 900 }, baseline = false) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 560, isMobile: viewport.width < 560 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (baseline) await page.route('**/r104-credits.js*', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.waitForFunction(() => window.__IRONTRAP_R110_ARCADE);
  return { page, errors };
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ ...(process.env.IRONTRAP_BROWSER ? { executablePath: process.env.IRONTRAP_BROWSER } : {}), headless: true, args: ['--disable-gpu', '--no-sandbox', '--in-process-gpu'] });
  try {
    const baseline = await load(browser, undefined, true);
    await baseline.page.locator('#bCredits').click();
    await baseline.page.keyboard.press('Escape');
    const failure = await baseline.page.evaluate(() => ({ registered: SCREENS.includes('credits'), visibleScreens: document.querySelectorAll('.screen.show').length, creditsVisible: getComputedStyle(document.getElementById('credits')).display !== 'none', mode }));
    assert.deepEqual(failure, { registered: false, visibleScreens: 0, creditsVisible: false, mode: 'title' });
    console.log('REPRODUCED shipped freeze:', JSON.stringify(failure));
    await baseline.page.close();
    if (process.argv.includes('--reproduce')) return;

    const current = await load(browser), page = current.page;
    await page.waitForFunction(() => window.IronTrapCredits);
    assert.equal(await page.evaluate(() => SCREENS.filter(id => id === 'credits').length), 1);
    await page.evaluate(() => { window.creditsHooks = [show, navBack]; });
    await page.addScriptTag({ path: path.join(root, 'r104-credits.js') });
    assert.ok(await page.evaluate(() => show === creditsHooks[0] && navBack === creditsHooks[1] && document.querySelectorAll('#creditsViewport').length === 1 && document.querySelectorAll('#r104CreditsStyle').length === 1));

    await page.locator('#bCredits').click();
    await page.waitForTimeout(1100);
    assert.ok(await page.evaluate(() => mode === 'credits' && currentScreen().id === 'credits' && document.querySelectorAll('.screen.show').length === 1));
    const first = await page.locator('#creditsViewport').evaluate(v => v.scrollTop);
    await page.waitForTimeout(500);
    assert.ok(await page.locator('#creditsViewport').evaluate(v => v.scrollTop) > first, 'auto-roll moves');
    await page.locator('#bCreditsPause').click();
    const paused = await page.locator('#creditsViewport').evaluate(v => v.scrollTop);
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#creditsViewport').evaluate(v => v.scrollTop), paused);
    await page.locator('#bCreditsPause').click();
    await page.waitForTimeout(350);
    assert.ok(await page.locator('#creditsViewport').evaluate(v => v.scrollTop) > paused);
    await page.keyboard.press('End');
    const end = await page.locator('#creditsViewport').evaluate(v => v.scrollTop);
    assert.ok(end > 1000);
    await page.keyboard.press('PageUp');
    assert.ok(await page.locator('#creditsViewport').evaluate(v => v.scrollTop) < end);
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#creditsViewport').evaluate(v => v.scrollTop), 0);
    await page.keyboard.press('ArrowDown');
    assert.ok(await page.locator('#creditsViewport').evaluate(v => v.scrollTop) > 0);
    await page.locator('#creditsViewport').hover(); await page.mouse.wheel(0, 300); await page.waitForTimeout(250);
    const manual = await page.locator('#creditsViewport').evaluate(v => v.scrollTop);
    await page.waitForTimeout(4600);
    const resumed = await page.locator('#creditsViewport').evaluate(v => v.scrollTop);
    assert.ok(resumed >= manual && resumed < manual + 120, 'manual scroll does not snap back');
    await page.locator('#bCreditsBack').click();
    assert.ok(await page.evaluate(() => mode === 'title' && currentScreen().id === 'title' && !IronTrapCredits.active && !IronTrapCredits.running));
    console.log('PASS visible credits, scrolling, pause/resume, Back, and duplicate load');

    for (const code of ['Escape', 'Backspace']) {
      await page.locator('#bCredits').click(); await page.keyboard.press(code);
      assert.ok(await page.evaluate(() => mode === 'title' && currentScreen().id === 'title' && !IronTrapCredits.running));
    }
    await page.locator('#bCredits').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => currentScreen().id), 'credits', 'keyboard opens credits');
    await page.locator('#bCreditsBack').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => currentScreen().id), 'title', 'keyboard Back');
    console.log('PASS keyboard open, Enter, Escape, and Backspace');

    await page.locator('#bCredits').click();
    await page.locator('#bCreditsBack').focus(); await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'bCreditsPause');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'bCreditsBack');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await page.locator('#bCreditsPause').getAttribute('aria-pressed'), 'true');
    await page.evaluate(() => navBack());
    assert.equal(await page.evaluate(() => currentScreen().id), 'title');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#bCredits').click(); await page.waitForTimeout(1200);
    assert.equal(await page.locator('#creditsViewport').evaluate(v => v.scrollTop), 0);
    assert.equal(await page.locator('#bCreditsPause').getAttribute('aria-pressed'), 'true');
    await page.locator('#bCreditsPause').click(); await page.waitForTimeout(250);
    assert.ok(await page.locator('#creditsViewport').evaluate(v => v.scrollTop) > 0);
    await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'no-preference' });
    console.log('PASS focus trap, direct menu Back, background pause, and reduced motion');

    for (const origin of ['play', 'pause', 'inv', 'bench', 'clear', 'dead']) {
      const before = await page.evaluate(origin => {
        startFloor(origin === 'bench' ? 8 : 6); P.inv = 99999;
        if (origin === 'pause') pauseGame();
        else if (origin === 'inv') openInventory();
        else if (origin !== 'play') { mode = origin; show(origin); }
        if (origin === 'clear') G.done = true;
        if (origin === 'dead') P.dead = true;
        const before = { time: G.time, lives: G.lives, hp: P.hp, weapon: curWep().id, num: G.num, enemy: G.enemies.map(e => [e.x, e.y, e.hp]), shots: G.shots.length, scrap: save.scrap || 0 };
        show('credits'); show('credits');
        return before;
      }, origin);
      await page.waitForTimeout(250);
      assert.deepEqual(await page.evaluate(() => ({ time: G.time, lives: G.lives, hp: P.hp, weapon: curWep().id, num: G.num, enemy: G.enemies.map(e => [e.x, e.y, e.hp]), shots: G.shots.length, scrap: save.scrap || 0 })), before, 'gameplay frozen from ' + origin);
      const restored = await page.evaluate(() => { document.getElementById('bCreditsBack').click(); const result = { mode, screen: currentScreen() && currentScreen().id, running: IronTrapCredits.running, keys: Object.values(keys).every(v => !v) }; if (mode === 'play') mode = 'pause'; return result; });
      assert.equal(restored.mode, origin);
      assert.equal(restored.screen, origin === 'play' ? null : origin);
      assert.ok(!restored.running && restored.keys);
    }
    await page.evaluate(() => { startFloor(6); show('credits'); startFloor(10); mode = 'pause'; });
    assert.ok(await page.evaluate(() => !document.getElementById('credits').classList.contains('show') && !IronTrapCredits.active && G.num === 10));
    await page.evaluate(() => { show('credits'); show('title'); });
    assert.ok(await page.evaluate(() => mode === 'title' && currentScreen().id === 'title' && !IronTrapCredits.running));
    console.log('PASS all return states, repeated open, frozen campaign, and external floor transition');

    await page.evaluate(() => { startFloor(6); P.inv = 99999; show('credits'); });
    await page.keyboard.press('Escape');
    const moving = await page.evaluate(() => ({ x: P.x, time: G.time }));
    await page.keyboard.down('KeyD'); await page.waitForTimeout(250); await page.keyboard.up('KeyD');
    assert.ok(await page.evaluate(before => G.time > before.time && P.x > before.x && mode === 'play', moving), 'actual play and movement resume');
    await page.evaluate(() => { startFloor(50); mode = 'clear'; G.done = true; show('clear'); show('credits'); });
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(() => G.num === 50 && G.done && mode === 'clear' && currentScreen().id === 'clear'));
    await page.evaluate(() => { mode = 'title'; show('title'); });
    console.log('PASS real gameplay resumes and final-floor return');

    for (const id of [null, 'not-a-screen']) {
      await page.locator('#bCredits').click(); await page.evaluate(id => show(id), id);
      assert.ok(await page.evaluate(() => mode === 'title' && currentScreen().id === 'title' && !IronTrapCredits.active));
    }
    await page.locator('#bCredits').click(); await page.evaluate(() => { mode = 'title'; });
    await page.waitForFunction(() => currentScreen().id === 'title' && !IronTrapCredits.running);
    console.log('PASS hidden/invalid screen requests and external mode cleanup');

    // Older credits scripts may install target-level capture listeners. The owner must win.
    const legacy = await load(browser, undefined, true);
    await legacy.page.addScriptTag({ path: path.join(root, 'r82-patch.js') });
    await legacy.page.addScriptTag({ path: path.join(root, 'r85-credits.js') });
    await legacy.page.addScriptTag({ path: path.join(root, 'r87-systems.js') });
    await legacy.page.addScriptTag({ path: path.join(root, 'r104-credits.js') });
    await legacy.page.locator('#bCredits').click(); await legacy.page.keyboard.press('Escape');
    assert.ok(await legacy.page.evaluate(() => mode === 'title' && currentScreen().id === 'title' && !IronTrapCredits.running));
    assert.deepEqual(legacy.errors, []); await legacy.page.close();
    console.log('PASS obsolete credits-handler compatibility');

    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 740, height: 320 }]) {
      const visual = await load(browser, viewport);
      if (viewport.width < 560) await visual.page.locator('#bCredits').tap(); else await visual.page.locator('#bCredits').click();
      await visual.page.waitForTimeout(150);
      assert.ok(await visual.page.evaluate(() => {
        const screen = document.getElementById('credits'), button = document.getElementById('bCreditsBack'), r = button.getBoundingClientRect();
        return screen.scrollWidth <= screen.clientWidth && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && r.width >= 44 && r.height >= 44 && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).closest('#bCreditsBack');
      }), 'Back visible and clickable at ' + viewport.width + 'x' + viewport.height);
      await visual.page.screenshot({ path: path.join(artifacts, 'credits-' + viewport.width + 'x' + viewport.height + '.png') });
      await visual.page.keyboard.press('End');
      await visual.page.locator('#creditsEgg').click();
      assert.equal(await visual.page.locator('#creditsEggMsg').textContent(), 'AP');
      if (viewport.width < 560) await visual.page.locator('#bCreditsBack').tap(); else await visual.page.locator('#bCreditsBack').click();
      assert.ok(await visual.page.evaluate(() => currentScreen().id === 'title'));
      for (let i = 0; i < 5; i++) { await visual.page.locator('#bCredits').click(); await visual.page.locator('#bCreditsBack').click(); }
      assert.ok(await visual.page.evaluate(() => !IronTrapCredits.active && !IronTrapCredits.running));
      assert.deepEqual(visual.errors, []); await visual.page.close();
      console.log('PASS credits rendering and exit at ' + viewport.width + 'x' + viewport.height);
    }
    assert.deepEqual(current.errors, []);
    console.log('PASS no runtime errors; screenshots:', artifacts);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
