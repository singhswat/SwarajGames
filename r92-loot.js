(()=>{
'use strict';
if(window.__IRONTRAP_R92_LOOT)return;window.__IRONTRAP_R92_LOOT=true;
const rand=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const choose=a=>a[Math.floor(Math.random()*a.length)];
function persist(){try{if(typeof writeSave==='function')writeSave();}catch(_){}}
function popup(x,y,t,c){try{if(typeof popText==='function')popText(x,y,t,c);}catch(_){}}
function fx(x,y,c,n=12){try{if(typeof spark==='function')spark(x,y,n,c,3,24);}catch(_){}}
function giveCurrency(x,y,scrap,coins,label){
  if(typeof save==='undefined')return;
  if(scrap>0){save.scrap=(save.scrap||0)+scrap;popup(x,y-16,'+'+scrap+' SCRAP','#c9d2e0');}
  if(coins>0){let bonus=1;try{if(typeof r7CoinBonus==='function')bonus=r7CoinBonus();}catch(_){}coins=Math.max(1,Math.round(coins*bonus));save.coins=(save.coins||0)+coins;popup(x,y-32,'🪙 +'+coins,'#ffd166');}
  persist();
  if(label)try{if(typeof toast==='function')toast(label,(scrap?('+'+scrap+' scrap'):'' )+(scrap&&coins?' · ':'')+(coins?('🪙 +'+coins):''));}catch(_){}
}
function spawn(x,y,kind,data,dx=0,dy=0){
  try{if(typeof G!=='undefined'&&G&&Array.isArray(G.pickups)&&typeof mkPickup==='function')G.pickups.push(mkPickup(x+dx,y+dy,kind,data));}catch(_){}
}
function randomPower(){return choose(['berserk','haste','aegis','overload','leech','magnet','flower','feather','clock','star']);}
function randomEnemyBonus(e,d){
  if(!e||!d||d.isBoss||e.__r92Bonus)return;e.__r92Bonus=true;
  const x=e.x+e.w/2,y=e.y+e.h/2,tier=Math.max(1,Number(e.tier)||1);
  const elite=!!(e.role||e.elite||e.isElite), mini=!!e.isMiniBoss;
  let rolls=mini?3:(elite?2:1);
  if(Math.random()<Math.min(.45,.08*tier))rolls++;
  for(let i=0;i<rolls;i++){
    const r=Math.random();
    if(r<.26){giveCurrency(x,y,rand(1,Math.max(2,tier+1)),0);}
    else if(r<.50){giveCurrency(x,y,0,rand(1,Math.max(3,tier+2)));}
    else if(r<.64)spawn(x,y,'ammo',null,rand(-24,24),rand(-18,2));
    else if(r<.75)spawn(x,y,'health',null,rand(-24,24),rand(-18,2));
    else if(r<.84)spawn(x,y,'throwables',null,rand(-24,24),rand(-18,2));
    else if(r<.94)spawn(x,y,'power',randomPower(),rand(-24,24),rand(-18,2));
    else {try{if(typeof armourForSet==='function'&&typeof G!=='undefined'&&G&&G.biome){const id=armourForSet(G.biome.n,Math.random,G.num);if(id)spawn(x,y,'armour',id,rand(-24,24),rand(-18,2));}}catch(_){}}
  }
  if(mini){giveCurrency(x,y,rand(8,16),rand(10,20),'MINI-BOSS LOOT');}
  fx(x,y,mini?'#ffd166':'#c9d2e0',mini?24:10);
}
function bossLoot(e,d){
  if(!e||!d||!d.isBoss||e.__r92BossLoot)return;e.__r92BossLoot=true;
  const x=e.x+e.w/2,y=e.y+e.h/2;
  const floor=(typeof G!=='undefined'&&G)?(Number(G.num)||10):10;
  const scrap=rand(28,46)+Math.floor(floor/10)*4;
  const coins=rand(30,55)+Math.floor(floor/10)*5;
  giveCurrency(x,y,scrap,coins,'BOSS LOOT JACKPOT');
  const guaranteed=['health','ammo','throwables'];
  guaranteed.forEach((k,i)=>spawn(x,y,k,null,(i-1)*42,-18-rand(0,20)));
  const powers=rand(2,4);for(let i=0;i<powers;i++)spawn(x,y,'power',randomPower(),rand(-90,90),rand(-52,-10));
  try{if(typeof armourForSet==='function'&&typeof G!=='undefined'&&G&&G.biome){const id=armourForSet(Math.min(5,G.biome.n+1),Math.random,G.num);if(id)spawn(x,y,'armour',id,rand(-70,70),-34);}}catch(_){}
  if(Math.random()<.35){
    try{const pool=(typeof WEAPONS!=='undefined'?WEAPONS:[]).filter(w=>w&&(w.rare||w.veryRare||w.mystic)).map(w=>w.id).filter(id=>!(save.arsenal||[]).includes(id));if(pool.length)spawn(x,y,'weapon',choose(pool),rand(-60,60),-50);}catch(_){}
  }
  if(Math.random()<.22){try{save.power=(save.power||0)+1;persist();if(typeof toast==='function')toast('BOSS POWER CORE','Permanent damage increased.');}catch(_){}}
  try{if(typeof G!=='undefined'&&G){G.flash=Math.max(G.flash||0,28);G.shake=Math.max(G.shake||0,24);}}catch(_){}
  fx(x,y,'#ffd166',48);
}
if(typeof killEnemy==='function'&&!killEnemy.__r92){
  const old=killEnemy;
  const wrapped=function(e){
    let d=null;try{d=e&&typeof ENEMIES!=='undefined'?ENEMIES[e.type]:null;}catch(_){}
    const wasDead=!!(e&&e.dead);const out=old.apply(this,arguments);
    if(e&&!wasDead){if(d&&d.isBoss)bossLoot(e,d);else randomEnemyBonus(e,d||{});}
    return out;
  };wrapped.__r92=true;try{killEnemy=wrapped;}catch(_){window.killEnemy=wrapped;}
}
if(typeof takePickup==='function'&&!takePickup.__r92){
  const old=takePickup;
  const wrapped=function(pk){
    const kind=pk&&pk.kind,was=!!(pk&&pk.taken),x=pk?pk.x:0,y=pk?pk.y:0;
    const out=old.apply(this,arguments);
    if(!pk||was||pk.__r92ChestBonus)return out;
    if(kind==='chest'||kind==='goldchest'){
      pk.__r92ChestBonus=true;
      const gold=kind==='goldchest';
      const scrap=gold?rand(10,22):rand(2,8);
      const coins=gold?rand(14,30):rand(3,11);
      giveCurrency(x,y,scrap,coins,gold?'GOLD CHEST BONUS':'CHEST BONUS');
      const extraRolls=gold?rand(2,4):rand(0,2);
      for(let i=0;i<extraRolls;i++){
        const r=Math.random();
        if(r<.34)spawn(x,y,'power',randomPower(),rand(-45,45),-28-rand(0,16));
        else if(r<.58)spawn(x,y,'throwables',null,rand(-45,45),-18);
        else if(r<.80)spawn(x,y,'ammo',null,rand(-45,45),-18);
        else {try{if(typeof armourForSet==='function'&&typeof G!=='undefined'&&G&&G.biome){const id=armourForSet(Math.min(5,G.biome.n+(gold?1:0)),Math.random,G.num);if(id)spawn(x,y,'armour',id,rand(-45,45),-25);}}catch(_){}}
      }
      fx(x,y,gold?'#ffd166':'#f2c14e',gold?34:18);
    }
    return out;
  };wrapped.__r92=true;try{takePickup=wrapped;}catch(_){window.takePickup=wrapped;}
}
})();
