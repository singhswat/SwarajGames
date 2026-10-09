const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.IRONTRAP_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404).end(); return; }
    const ext = path.extname(file);
    res.setHeader('Content-Type', ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.html' ? 'text/html' : 'text/plain');
    res.end(body);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    ...(process.env.IRONTRAP_BROWSER ? { executablePath: process.env.IRONTRAP_BROWSER } : {}),
    headless: true, args: ['--disable-gpu', '--no-sandbox', '--in-process-gpu']
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.IronTrapLoot && window.IronTrapEncounters);

    await page.evaluate(() => { window.lootHooks = [buildLevel, takePickup, killEnemy, armourForSet]; });
    await page.addScriptTag({ path: path.join(root, 'r105-random-loot.js') });
    assert.ok(await page.evaluate(() => [buildLevel, takePickup, killEnemy, armourForSet].every((fn, i) => fn === window.lootHooks[i])), 'one loot handler after duplicate loading');

    const rolls = await page.evaluate(() => {
      const results = {};
      for (const kind of ['chest', 'goldchest']) {
        const signatures = [], categories = new Set();
        let safe = true, duplicateSafe = true, valid = true, alwaysReward = true;
        for (let i = 0; i < 60; i++) {
          save.loadout = ['knife', 'pistol', 'shotgun']; save.arsenal = save.loadout.slice();
          save.ammo.pistol = 0; save.ammo.shotgun = 0; save.scrap = 0; save.coins = 0; save.power = 0;
          THROWABLES.forEach(t => save.throwAmmo[t.id] = 0);
          startFloor(24); mode = 'pause'; P.hp = 20;
          const before = G.pickups.length;
          const pk = mkPickup(G.spawn.x, G.spawn.y, kind);
          takePickup(pk);
          const drops = G.pickups.slice(before);
          const state = () => JSON.stringify({ hp: P.hp, maxhp: P.maxhp, scrap: save.scrap, coins: save.coins, power: save.power, ammo: save.ammo, throws: save.throwAmmo, chests: G.chestsOpened, pickups: G.pickups.length });
          const first = state(); takePickup(pk); duplicateSafe &&= state() === first;
          signatures.push(JSON.stringify([P.hp, P.maxhp, save.scrap, save.coins, save.power, save.ammo.pistol, save.ammo.shotgun, save.throwAmmo, drops.map(p => [p.kind, p.data])]));
          for (const p of drops) {
            categories.add(p.kind);
            safe &&= !rectSolid(p.x, p.y, p.w, p.h);
            valid &&= (p.kind !== 'power' || !!POWERUPS[p.data]) && (p.kind !== 'armour' || !!ARM[p.data]) && (p.kind !== 'weapon' || !!WEP[p.data]);
          }
          valid &&= Number.isFinite(save.ammo.pistol) && Number.isFinite(save.ammo.shotgun) && P.hp <= P.maxhp;
          alwaysReward &&= save.scrap > 0 && save.coins > 0 && G.chestsOpened === 1;
        }
        results[kind] = { unique: new Set(signatures).size, categories: [...categories], safe, duplicateSafe, valid, alwaysReward };
      }
      return results;
    });
    for (const [kind, result] of Object.entries(rolls)) {
      assert.ok(result.unique >= 20, kind + ' varies: ' + JSON.stringify(result));
      assert.ok(result.safe && result.duplicateSafe && result.valid && result.alwaysReward, kind + ' valid transaction');
      assert.ok(result.categories.includes('power') && result.categories.includes('armour'), kind + ' varied reward types');
    }
    console.log('PASS 120 chest openings: ', JSON.stringify(rolls));

    const floorLoot = await page.evaluate(() => {
      const signatures = [], powers = new Set(), armour = new Set();
      for (let i = 0; i < 30; i++) {
        startFloor(24); mode = 'pause';
        signatures.push(JSON.stringify(G.pickups.filter(p => ['power', 'armour', 'chest', 'goldchest'].includes(p.kind)).map(p => [p.kind, p.data])));
        G.pickups.filter(p => p.kind === 'power').forEach(p => powers.add(p.data));
        G.pickups.filter(p => p.kind === 'armour').forEach(p => armour.add(p.data));
      }
      const common = armourForSet(3, () => 0, 24), uncommon = armourForSet(3, () => .999, 24);
      return { unique: new Set(signatures).size, powers: powers.size, armour: armour.size, armourUsesRandom: common !== uncommon };
    });
    assert.ok(floorLoot.unique > 10 && floorLoot.powers > 3 && floorLoot.armour > 1 && floorLoot.armourUsesRandom, JSON.stringify(floorLoot));
    console.log('PASS 30 fresh floor loot rolls:', JSON.stringify(floorLoot));

    const preserved = await page.evaluate(() => {
      let weapons = true, explicitGold = true, healthAndAmmo = true;
      save.relics = 3; save.hasGod = false;
      for (let n = 1; n <= 50; n++) {
        startFloor(n); mode = 'pause';
        const rows = CAMPAIGN[n - 1].rows;
        for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
          const c = rows[y][x];
          const pk = G.pickups.find(p => p.x === x * TS + 4 && p.y === y * TS + 6);
          if (c === 'X') explicitGold &&= !!pk && pk.kind === 'goldchest';
          if (c === 'h') healthAndAmmo &&= !!pk && pk.kind === 'health';
          if (c === 'a') healthAndAmmo &&= !!pk && pk.kind === 'ammo';
          if (c === 'W') weapons &&= !!pk && pk.kind === 'weapon' && pk.data === WEAPON_FLOOR[n];
          if (c === '$') weapons &&= !!pk && pk.kind === 'relic';
          if (c === 'G') weapons &&= !!pk && pk.kind === 'god';
        }
      }
      save.arsenal = ['knife']; save.loadout = ['knife'];
      startFloor(25); mode = 'pause'; G.questState = 'taken';
      takePickup(mkPickup(G.spawn.x, G.spawn.y, 'chest'));
      takePickup(mkPickup(G.spawn.x, G.spawn.y, 'goldchest'));
      const questCount = G.chestsOpened === 2 && questDone();
      talkToGiver();
      return { weapons, explicitGold, healthAndAmmo, questCount, questReward: save.arsenal.includes('acid') };
    });
    assert.ok(Object.values(preserved).every(Boolean), JSON.stringify(preserved));
    console.log('PASS guaranteed pickups across 50 floors and chest quest:', JSON.stringify(preserved));

    const kills = await page.evaluate(() => {
      const results = [];
      for (const n of [10, 15]) {
        startFloor(n); mode = 'pause';
        const e = G.enemies.find(e => n === 10 ? ENEMIES[e.type].isBoss : e.isMiniBoss);
        const before = G.pickups.length, lives = G.lives;
        killEnemy(e);
        const state = () => JSON.stringify([G.kills, save.scrap, save.coins, save.power, G.pickups.length]);
        const first = state(); killEnemy(e);
        results.push({ n, once: state() === first, loot: G.pickups.length > before, lives: G.lives === lives, bossDead: e.dead });
      }
      return results;
    });
    assert.ok(kills.every(result => result.once && result.loot && result.lives && result.bossDead), JSON.stringify(kills));
    console.log('PASS boss/mini-boss loot and duplicate kill protection:', JSON.stringify(kills));

    const mobs = await page.evaluate(() => {
      startFloor(24); mode = 'pause';
      const signatures = new Set();
      let once = true;
      for (let i = 0; i < 80; i++) {
        const e = mkEnemy('grunt', G.spawn.x, G.spawn.y), before = G.pickups.length;
        killEnemy(e);
        signatures.add(JSON.stringify(G.pickups.slice(before).map(p => [p.kind, p.data])));
        const count = G.pickups.length, kills = G.kills;
        killEnemy(e); once &&= G.pickups.length === count && G.kills === kills;
      }
      return { unique: signatures.size, once };
    });
    assert.ok(mobs.unique > 3 && mobs.once, JSON.stringify(mobs));
    console.log('PASS 80 ordinary mob drop rolls:', JSON.stringify(mobs));

    assert.ok(await page.evaluate(() => {
      save.loadout = ['knife']; startFloor(24); mode = 'pause';
      P.hp = P.maxhp;
      takePickup(mkPickup(G.spawn.x, G.spawn.y, 'goldchest'));
      return Number.isFinite(P.hp) && P.hp <= P.maxhp && Number.isFinite(save.scrap) && Number.isFinite(save.coins);
    }), 'melee-only full-health loadout has valid rewards');

    const retries = await page.evaluate(() => {
      startFloor(22); mode = 'play';
      const s = G.r107Encounter, point = s.points[0];
      P.x = point.x; P.y = point.y; G.time++; IronTrapEncounters.tick();
      const first = JSON.stringify([save.scrap, save.coins, save.power, G.pickups.map(p => [p.kind, p.data, p.taken])]);
      respawn(); P.x = point.x; P.y = point.y; G.time++; IronTrapEncounters.tick(); mode = 'pause';
      const after = JSON.stringify([save.scrap, save.coins, save.power, G.pickups.map(p => [p.kind, p.data, p.taken])]);
      return point.done && s.rewarded && first === after;
    });
    assert.ok(retries, 'cache does not reroll after checkpoint respawn');
    assert.deepEqual(errors, [], 'browser runtime errors');
    console.log('PASS checkpoint reward stability and browser runtime');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
