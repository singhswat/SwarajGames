(()=>{
"use strict";
if(window.__IRONTRAP_R106_AMBUSHES)return;
window.__IRONTRAP_R106_AMBUSHES=true;

const MINI_FLOORS=new Set([5,15,25,35,45]);
const AMBUSH_TAG="__r106Ambush";
const rand=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const dist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const safeCall=(fn,...args)=>{try{return typeof fn==="function"?fn(...args):undefined;}catch(_){return undefined;}};

function floorNumber(){try{return Number(G&&G.num)||0;}catch(_){return 0;}}
function isBossEnemy(e){try{return !!(e&&ENEMIES&&ENEMIES[e.type]&&ENEMIES[e.type].isBoss);}catch(_){return false;}}
function isMiniEnemy(e){return !!(e&&e.isMiniBoss&&!e.dead);}
function aliveNonBoss(){try{return (G.enemies||[]).filter(e=>e&&!e.dead&&!isBossEnemy(e)).length;}catch(_){return 0;}}
function hasLiveBossOrMini(){try{return !!(G.boss&&typeof bossAlive==="function"&&bossAlive())||(G.enemies||[]).some(isMiniEnemy);}catch(_){return true;}}
function solidTile(c){
  try{return (typeof SOLID!=="undefined"&&SOLID.has(c))||(typeof THIN!=="undefined"&&THIN.has(c));}
  catch(_){return "#ST+-.=".replace('.','').includes(String(c||""));}
}
function tile(tx,ty){
  try{
    if(!G||!G.grid||tx<0||ty<0||tx>=G.w||ty>=G.h)return "#";
    return G.grid[ty][tx];
  }catch(_){return "#";}
}
function clearTile(tx,ty){return tile(tx,ty)===".";}
function nearRect(cx,cy,r){
  try{
    const checks=[G.exit,G.bench,G.giver].filter(Boolean);
    return checks.some(o=>dist(cx,cy,o.x+(o.w||0)/2,o.y+(o.h||0)/2)<r);
  }catch(_){return true;}
}
function difficultyBonus(){
  const d=String((typeof save!=="undefined"&&save&&save.difficulty)||"normal");
  return d==="easy"?-1:d==="hard"?1:d==="nightmare"?1:d==="demon"?2:0;
}
function simultaneousCap(){
  const setN=Math.max(1,Math.min(5,Number(G&&G.biome&&G.biome.n)||1));
  return Math.max(8,Math.min(18,9+setN*2+difficultyBonus()));
}
function plannedCount(){
  const n=floorNumber(),base=n<12?2:n<25?3:n<38?4:5;
  return Math.max(2,Math.min(6,base+difficultyBonus()));
}
function suitableFloor(n){
  if(!n||n<3||n>=46)return false;
  if(n%10===0||MINI_FLOORS.has(n))return false;
  try{if(typeof shouldHaveWorkbench==="function"&&shouldHaveWorkbench(n))return false;}catch(_){}
  try{if(G&&G.boss)return false;}catch(_){}
  return true;
}
function triggerChance(n){
  const bonus=difficultyBonus();
  return Math.max(.12,Math.min(.42,.16+n*.004+bonus*.04));
}
function pickTypes(count){
  let mix=[];
  try{if(typeof enemyMixFor==="function")mix=enemyMixFor(floorNumber()).filter(t=>ENEMIES&&ENEMIES[t]&&!ENEMIES[t].isBoss);}
  catch(_){}
  if(!mix.length)mix=["grunt","grunt"];
  const out=[];
  for(let i=0;i<count;i++)out.push(mix[rand(0,mix.length-1)]);
  return out;
}
function candidateSpots(type,used){
  const spots=[];
  if(!G||!P||!G.grid)return spots;
  const d=ENEMIES&&ENEMIES[type]||null;
  const fly=d&&d.ai==="fly";
  const pcx=P.x+P.w/2,pcy=P.y+P.h/2,ptx=Math.floor(pcx/TS),pty=Math.floor(pcy/TS);
  const minD=fly?120:135,maxD=fly?520:600;
  const yBand=fly?8:7;
  for(let tx=1;tx<G.w-1;tx++){
    for(let ty=2;ty<G.h-1;ty++){
      if(Math.abs(tx-ptx)<4||Math.abs(ty-pty)>yBand)continue;
      if(!clearTile(tx,ty))continue;
      if(fly){
        if(!clearTile(tx,ty-1))continue;
      }else if(!solidTile(tile(tx,ty+1))){
        continue;
      }
      const sx=tx*TS,sy=ty*TS,cx=sx+TS/2,cy=sy+TS/2,dd=dist(cx,cy,pcx,pcy);
      if(dd<minD||dd>maxD)continue;
      if(nearRect(cx,cy,100))continue;
      if(used.some(p=>dist(cx,cy,p.x,p.y)<78))continue;
      spots.push({x:sx,y:sy,cx,cy,score:Math.abs(dd-(fly?260:240))+Math.random()*80});
    }
  }
  spots.sort((a,b)=>a.score-b.score);
  return spots;
}
function spawnOne(type,ambushId,used){
  const spots=candidateSpots(type,used);
  for(const s of spots.slice(0,20)){
    try{
      const e=mkEnemy(type,s.x,s.y);
      if(!e||e.dead||isBossEnemy(e)||e.isMiniBoss)continue;
      if(typeof rectSolid==="function"&&rectSolid(e.x,e.y,e.w,e.h))continue;
      e[AMBUSH_TAG]=ambushId;
      e.fromAmbush=true;
      e.t=(e.t||0)+rand(0,60);
      used.push({x:e.x+e.w/2,y:e.y+e.h/2});
      G.enemies.push(e);
      safeCall(popText,e.x+e.w/2,e.y-12,"AMBUSH","#d9455f");
      safeCall(spark,e.x+e.w/2,e.y+e.h/2,12,"#d9455f",3,22);
      return true;
    }catch(_){}
  }
  return false;
}
function playerInQuietSpot(){
  try{
    if(!P||P.dead||!G||G.done)return true;
    const px=P.x+P.w/2,py=P.y+P.h/2;
    if(nearRect(px,py,120))return true;
    if(G.time<7*60)return true;
    if(hasLiveBossOrMini())return true;
    return false;
  }catch(_){return true;}
}
function initAmbush(){
  if(!G)return;
  const n=floorNumber();
  G.r106Ambush={eligible:false,triggered:false,active:false,complete:false,warning:false,waits:0,id:"r106-"+n+"-"+Date.now()};
  if(!suitableFloor(n))return;
  if(Math.random()>triggerChance(n))return;
  const earliest=8*60,latest=Math.max(13*60,Math.min(34*60,12*60+n*22));
  Object.assign(G.r106Ambush,{eligible:true,triggerAt:earliest+rand(0,latest-earliest)});
}
function warnAmbush(a){
  a.warning=true;
  a.warnUntil=(G.time||0)+110;
  safeCall(toast,"AMBUSH WARNING","Enemies are closing in. Hold your ground.");
  if(P){
    safeCall(popText,P.x+P.w/2,P.y-28,"AMBUSH WARNING","#ffd166");
    safeCall(spark,P.x+P.w/2,P.y+P.h/2,22,"#ffd166",4,28);
  }
  try{G.shake=Math.max(G.shake||0,8);G.flash=Math.max(G.flash||0,8);}catch(_){}
}
function releaseAmbush(a){
  if(playerInQuietSpot()){
    if(++a.waits>8){a.complete=true;a.warning=false;}
    else{a.warning=false;a.triggerAt=(G.time||0)+rand(150,300);}
    return;
  }
  const live=aliveNonBoss(),room=Math.max(0,simultaneousCap()-live),want=plannedCount(),count=Math.min(want,room);
  if(count<2){
    if(++a.waits>8){a.complete=true;a.warning=false;}
    else{a.warning=false;a.triggerAt=(G.time||0)+rand(180,360);}
    return;
  }
  const used=[],types=pickTypes(count);
  let made=0;
  for(const type of types)if(spawnOne(type,a.id,used))made++;
  if(made>0){
    a.active=true;
    a.triggered=true;
    a.warning=false;
    a.spawned=made;
    safeCall(toast,"AMBUSH","Defeat the surprise wave to reopen the route.");
    try{G.shake=Math.max(G.shake||0,12);G.flash=Math.max(G.flash||0,10);if(Audio2&&Audio2.sfx)Audio2.sfx("power");}catch(_){}
  }else{
    a.complete=true;
    a.warning=false;
  }
}
function ambushAlive(a){
  try{return (G.enemies||[]).some(e=>e&&!e.dead&&e[AMBUSH_TAG]===a.id);}catch(_){return false;}
}
function tickAmbush(){
  const a=G&&G.r106Ambush;
  if(!a||!a.eligible||a.complete||mode!=="play"||!G||G.done||!P||P.dead)return;
  if(a.active){
    if(!ambushAlive(a)){
      a.active=false;
      a.complete=true;
      safeCall(toast,"AMBUSH CLEARED","The floor has settled.");
      if(P)safeCall(popText,P.x+P.w/2,P.y-24,"AMBUSH CLEARED","#7ee081");
    }
    return;
  }
  if(a.triggered)return;
  if((G.time||0)<(a.triggerAt||0))return;
  if(!a.warning){warnAmbush(a);return;}
  if((G.time||0)>=(a.warnUntil||0))releaseAmbush(a);
}

if(typeof startFloor==="function"&&!startFloor.__r106Ambush){
  const old=startFloor;
  const wrapped=function(...args){
    const out=old.apply(this,args);
    try{initAmbush();}catch(e){console.warn("R106 ambush init",e);}
    return out;
  };
  wrapped.__r106Ambush=true;
  try{startFloor=wrapped;}catch(_){window.startFloor=wrapped;}
}

if(typeof updateEnemies==="function"&&!updateEnemies.__r106Ambush){
  const old=updateEnemies;
  const wrapped=function(...args){
    const out=old.apply(this,args);
    try{tickAmbush();}catch(e){console.warn("R106 ambush tick",e);}
    return out;
  };
  wrapped.__r106Ambush=true;
  try{updateEnemies=wrapped;}catch(_){window.updateEnemies=wrapped;}
}

if(typeof exitOpen==="function"&&!exitOpen.__r106Ambush){
  const old=exitOpen;
  const wrapped=function(...args){
    try{if(G&&G.r106Ambush&&G.r106Ambush.active&&ambushAlive(G.r106Ambush))return false;}catch(_){}
    return old.apply(this,args);
  };
  wrapped.__r106Ambush=true;
  try{exitOpen=wrapped;}catch(_){window.exitOpen=wrapped;}
}
})();
