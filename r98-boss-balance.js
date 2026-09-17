(()=>{
'use strict';
if(window.__IRONTRAP_R98_BOSS_BALANCE)return;window.__IRONTRAP_R98_BOSS_BALANCE=true;

function bossDef(e){try{return e&&typeof ENEMIES!=='undefined'?ENEMIES[e.type]:null;}catch(_){return null;}}
function isBoss(e){const d=bossDef(e);return !!(d&&d.isBoss);}
function floorNum(){try{return Number(G&&G.num)||0;}catch(_){return 0;}}

function balanceFloor10Boss(e){
  if(!e||e.dead||!isBoss(e)||floorNum()!==10||e.__r98Balanced)return;
  e.__r98Balanced=true;
  const oldMax=Math.max(1,Number(e.maxhp)||Number(e.hp)||1);
  const ratio=Math.max(0,Math.min(1,(Number(e.hp)||oldMax)/oldMax));
  const newMax=Math.max(1,Math.round(oldMax*0.45));
  e.maxhp=newMax;
  e.hp=Math.max(1,Math.round(newMax*ratio));
  try{if(typeof popText==='function')popText(e.x+e.w/2,e.y-24,'BOSS WEAKENED','#ffd166');}catch(_){}
}

function forceBossDeath(e){
  if(!e||e.dead||!isBoss(e))return false;
  if(Number(e.hp)<=0){
    e.hp=0;
    try{if(typeof killEnemy==='function')killEnemy(e);}catch(_){}
    return true;
  }
  return false;
}

if(typeof damageEnemy==='function'&&!damageEnemy.__r98){
  const old=damageEnemy;
  const wrapped=function(e,...rest){
    balanceFloor10Boss(e);
    const out=old.call(this,e,...rest);
    forceBossDeath(e);
    return out;
  };
  wrapped.__r98=true;
  try{damageEnemy=wrapped;}catch(_){window.damageEnemy=wrapped;}
}

if(typeof updateEnemies==='function'&&!updateEnemies.__r98){
  const old=updateEnemies;
  const wrapped=function(...args){
    const out=old.apply(this,args);
    try{
      if(G&&Array.isArray(G.enemies)){
        for(const e of G.enemies){
          if(isBoss(e)){
            balanceFloor10Boss(e);
            if(forceBossDeath(e))break;
          }
        }
      }
    }catch(_){}
    return out;
  };
  wrapped.__r98=true;
  try{updateEnemies=wrapped;}catch(_){window.updateEnemies=wrapped;}
}

// Ensure any remaining endurance timer logic cannot keep a defeated boss alive.
try{keepBossInEndurancePhase=function(){return false;};}catch(_){try{window.keepBossInEndurancePhase=function(){return false;};}catch(__){}}
})();
