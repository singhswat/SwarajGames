(()=>{
  "use strict";

  const isBoss=e=>!!(e&&typeof ENEMIES!=="undefined"&&ENEMIES[e.type]&&ENEMIES[e.type].isBoss);

  function finishBoss(e){
    if(!isBoss(e)||e.dead)return false;
    const hp=Number(e.hp);
    if(Number.isFinite(hp)&&hp<1){
      e.hp=0;
      if(typeof killEnemy==="function") killEnemy(e);
      return true;
    }
    return false;
  }

  if(typeof damageEnemy==="function"){
    const baseDamageEnemy=damageEnemy;
    const fixedDamageEnemy=function(e,...rest){
      const out=baseDamageEnemy(e,...rest);
      finishBoss(e);
      return out;
    };
    try{damageEnemy=fixedDamageEnemy;}catch(_){window.damageEnemy=fixedDamageEnemy;}
  }

  if(typeof updateEnemies==="function"){
    const baseUpdateEnemies=updateEnemies;
    const fixedUpdateEnemies=function(...args){
      const out=baseUpdateEnemies(...args);
      if(typeof G!=="undefined"&&G&&Array.isArray(G.enemies)){
        for(const e of G.enemies){
          if(finishBoss(e)) break;
        }
      }
      return out;
    };
    try{updateEnemies=fixedUpdateEnemies;}catch(_){window.updateEnemies=fixedUpdateEnemies;}
  }

  if(typeof drawBossBar==="function"){
    const baseDrawBossBar=drawBossBar;
    const fixedDrawBossBar=function(...args){
      let boss=null, originalHp=0;
      if(typeof G!=="undefined"&&G&&Array.isArray(G.enemies)){
        boss=G.enemies.find(e=>isBoss(e)&&!e.dead);
      }
      if(boss&&boss.hp>0&&boss.maxhp>0){
        const barWidth=(typeof CW==="number"?CW:960)*0.6;
        const minVisibleHp=boss.maxhp/Math.max(1,barWidth);
        if(boss.hp<minVisibleHp){
          originalHp=boss.hp;
          boss.hp=minVisibleHp;
        }
      }
      try{return baseDrawBossBar(...args);}
      finally{if(boss&&originalHp>0&&!boss.dead)boss.hp=originalHp;}
    };
    try{drawBossBar=fixedDrawBossBar;}catch(_){window.drawBossBar=fixedDrawBossBar;}
  }
})();
