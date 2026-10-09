(() => {
  'use strict';
  if (window.__IRONTRAP_R105_LOOT) return;
  window.__IRONTRAP_R105_LOOT = true;
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const choose = items => items[rand(0, items.length - 1)];
  const tier = () => Math.max(1, Math.min(5, G.biome.n));

  function weighted(entries) {
    const total = entries.reduce((sum, item) => sum + item[1], 0);
    let roll = Math.random() * total;
    for (const [id, weight] of entries) { roll -= weight; if (roll < 0) return id; }
    return entries[entries.length - 1][0];
  }

  function randomPower() {
    return weighted(PU_KEYS.map(id => [id, id === 'star' ? 1 : id === 'mushroom' ? 2 : id === 'clock' ? 4 : 10]));
  }

  function randomArmour(setN, random = Math.random) {
    const pool = ARMOURS.filter(a => a.sets.includes(Math.max(1, Math.min(5, setN))));
    if (!pool.length) return null;
    // Favour the common grade without tying every drop to the same floor number.
    const total = pool.length + 2;
    let roll = random() * total;
    for (let i = 0; i < pool.length; i++) { roll -= i === 0 ? 3 : 1; if (roll < 0) return pool[i].id; }
    return pool[pool.length - 1].id;
  }

  function spawn(x, y, kind, data, offset = 0) {
    const pk = mkPickup(clamp(x + offset, TS, G.w * TS - TS * 2), clamp(y - TS, TS, G.h * TS - TS * 2), kind, data);
    unstick(pk);
    if (rectSolid(pk.x, pk.y, pk.w, pk.h)) return false;
    G.pickups.push(pk);
    return true;
  }

  function currency(scrap, coins, lines) {
    if (scrap) { save.scrap = (save.scrap || 0) + scrap; lines.push('+' + scrap + ' scrap'); }
    if (coins) {
      const amount = Math.max(1, Math.round(coins * (typeof r7CoinBonus === 'function' ? r7CoinBonus() : 1)));
      save.coins = (save.coins || 0) + amount;
      lines.push('+' + amount + ' coins');
    }
  }

  function guns() {
    return P.owned.map(id => WEP[id]).filter(w => w && w.ammo !== Infinity && Number.isFinite(w.maxAmmo) && w.maxAmmo > 0 && ammoOf(w) < w.maxAmmo);
  }

  function reward(kind, source, gold, lines, index) {
    const x = source.x, y = source.y, offset = (index % 3 - 1) * 32;
    if (kind === 'health') {
      const amount = Math.min(P.maxhp - P.hp, gold ? rand(40, 85) : rand(18, 50));
      P.hp = Math.min(P.maxhp, P.hp + amount); lines.push('+' + amount + ' health');
    } else if (kind === 'ammo' && guns().length) {
      const w = choose(guns());
      const rarity = w.veryRare ? .35 : w.rare ? .55 : 1;
      const amount = Math.min(w.maxAmmo - ammoOf(w), Math.max(1, Math.round(w.maxAmmo * (gold ? rand(35, 65) : rand(15, 35)) / 100 * rarity)));
      save.ammo[w.id] = Math.min(w.maxAmmo, ammoOf(w) + amount);
      lines.push('+' + amount + ' ' + w.name + ' ammo');
    } else if (kind === 'throwables') {
      const pool = THROWABLES.filter(item => throwAmmoOf(item) < throwCap(item));
      if (pool.length) {
        const item = choose(pool), amount = Math.min(throwCap(item) - throwAmmoOf(item), gold ? rand(2, 4) : rand(1, 2));
        save.throwAmmo[item.id] = throwAmmoOf(item) + amount;
        lines.push('+' + amount + ' ' + item.name);
      } else currency(2 + tier(), 0, lines);
    } else if (kind === 'core') {
      save.power = (save.power || 0) + 1; lines.push('POWER CORE');
    } else if (kind === 'maxhp') {
      P.maxhp += 5; P.hp = Math.min(P.maxhp, P.hp + 5); lines.push('+5 max health');
    } else if (kind === 'power') {
      const id = randomPower();
      if (spawn(x, y, 'power', id, offset)) lines.push(POWERUPS[id].name);
      else currency(2 + tier(), 0, lines);
    } else if (kind === 'armour') {
      const id = randomArmour(Math.min(5, tier() + (gold ? 1 : 0)));
      if (id && spawn(x, y, 'armour', id, offset)) lines.push(ARM[id].name);
      else currency(2 + tier(), 0, lines);
    } else if (kind === 'weapon') {
      const ids = gold ? ['bazooka', 'saber', ...WEAPONS.filter(w => w.mystic).map(w => w.id)] : ['sniper'];
      const pool = ids.filter(id => WEP[id] && !save.arsenal.includes(id));
      if (pool.length) {
        const id = choose(pool);
        if (spawn(x, y, 'weapon', id, offset)) lines.push(WEP[id].name);
        else currency(3 + tier(), 0, lines);
      } else currency(gold ? rand(6, 12) : rand(2, 5), 0, lines);
    } else currency(gold ? rand(4, 9) : rand(1, 4), rand(1, 3 + tier()), lines);
  }

  function rewards(source, gold, cache = false) {
    const lines = [];
    currency(gold ? rand(5, 11) + tier() : rand(1, 4) + tier(), rand(1, (gold ? 10 : 4) + tier()), lines);
    const entries = [
      ['health', P.hp < P.maxhp ? 23 : 0], ['ammo', guns().length ? 23 : 0],
      ['throwables', 12], ['power', 14], ['armour', gold ? 15 : 10],
      ['currency', 11], ['weapon', gold ? 12 : cache ? 0 : 2],
      ['core', cache ? 0 : gold ? 5 : 2], ['maxhp', cache ? 0 : 2]
    ].filter(item => item[1] > 0);
    const count = cache ? rand(1, 2) : gold ? rand(3, 5) : rand(2, 3);
    for (let i = 0; i < count && entries.length; i++) {
      const kind = weighted(entries);
      entries.splice(entries.findIndex(item => item[0] === kind), 1);
      reward(kind, source, gold, lines, i);
    }
    writeSave();
    refreshHUD();
    return lines;
  }

  const oldArmour = armourForSet;
  armourForSet = function(setN, random, floor) { return randomArmour(setN, typeof random === 'function' ? random : Math.random) || oldArmour(setN, random, floor); };

  const oldBuild = buildLevel;
  buildLevel = function(...args) {
    const result = oldBuild.apply(this, args);
    for (const pk of G.pickups) {
      if (pk.kind === 'power') pk.data = randomPower();
      else if (pk.kind === 'armour') pk.data = randomArmour(tier()) || pk.data;
    }
    return result;
  };

  const oldTake = takePickup;
  takePickup = function(pk) {
    if (!pk || pk.taken) return;
    if (pk.kind !== 'chest' && pk.kind !== 'goldchest') return oldTake.apply(this, arguments);
    // Own the chest transaction so the fixed base bundle cannot also be awarded.
    pk.taken = true;
    G.chestsOpened++;
    const gold = pk.kind === 'goldchest';
    const lines = rewards(pk, gold);
    spark(pk.x + pk.w / 2, pk.y, gold ? 28 : 16, gold ? '#ffd166' : '#f2c14e', 3, 24);
    Audio2.sfx(gold ? 'power' : 'pickup');
    toast(gold ? 'GOLD CHEST' : 'CHEST OPENED', lines.join(' / '));
    checkQuest();
  };
  takePickup.__r105 = true;

  const oldKill = killEnemy;
  killEnemy = function(e) {
    if (!e || e.dead) return;
    const result = oldKill.apply(this, arguments);
    if (!e.dead || e.__r105Bonus) return result;
    e.__r105Bonus = true;
    const boss = ENEMIES[e.type].isBoss, mini = !!e.isMiniBoss;
    // Existing ordinary mob drops already roll weighted tables. Keep one drop path.
    if (boss || mini) {
      const lines = [];
      currency(boss ? rand(12, 24) + tier() * 2 : rand(4, 9), boss ? rand(10, 22) : rand(3, 8), lines);
      const count = boss ? rand(2, 3) : rand(1, 2);
      const pool = ['power', 'armour', 'throwables', 'ammo'];
      for (let i = 0; i < count; i++) {
        const kind = choose(pool); pool.splice(pool.indexOf(kind), 1);
        const data = kind === 'power' ? randomPower() : kind === 'armour' ? randomArmour(tier()) : null;
        spawn(e.x, e.y, kind, data, (i - 1) * 32);
      }
      writeSave();
      toast(boss ? 'BOSS LOOT' : 'MINI-BOSS LOOT', lines.join(' / '));
    }
    return result;
  };
  killEnemy.__r105 = true;
  window.IronTrapLoot = { rewardCache(source) { return rewards(source, false, true); } };
})();
