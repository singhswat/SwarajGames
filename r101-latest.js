(()=>{
"use strict";
if(window.__IRONTRAP_R101_LATEST)return;
window.__IRONTRAP_R101_LATEST=true;

const style=document.createElement("style");
style.textContent=`
#r7CharacterScreen .r101-class-tag{display:inline-block;padding:3px 7px;border:1px solid #f2c14e;font-size:10px;letter-spacing:1.4px;color:#f2c14e;background:#111827;margin-top:4px}
#r7CharacterScreen .r101-loadout{padding:7px 8px;border:1px solid #263244;background:#080d16;font-size:11px;line-height:1.45}
#r101WorldGuide{margin:12px 0 16px;padding:12px;border:1px solid #39465a;background:#080d16;font-size:12px;line-height:1.5;text-align:left}
`;
document.head.appendChild(style);

const CLASSES={
  rookie:{name:"VANGUARD",human:"ALEX",starter:"knife",strength:"Balanced health, movement and damage.",weakness:"No extreme specialty.",exclusive:["vanguard_blade"],allowedKinds:["melee","shot","thrown"]},
  tank:{name:"CRUSHER",human:"MARCUS",starter:"mace",strength:"Heavy armour, knockback resistance and Mace Slam.",weakness:"Slower movement and recovery.",exclusive:["mace","warhammer"],allowedKinds:["melee"]},
  swift:{name:"ARCHER",human:"ZAK",starter:"shortbow",strength:"Fast ranged pressure and mobility.",weakness:"Lower health.",exclusive:["shortbow","longbow"],allowedKinds:["shot","thrown"]},
  blade:{name:"MELEE",human:"KAI",starter:"sword",strength:"High close-range blade damage.",weakness:"Weak ranged damage.",exclusive:["greatsword","katana"],allowedKinds:["melee"]},
  gunner:{name:"MARKSMAN",human:"MASON",starter:"pistol",strength:"Accurate high-speed gun damage.",weakness:"Weak melee damage.",exclusive:["handcannon","burst_rifle"],allowedKinds:["shot"]},
  demolition:{name:"DEMOLITION",human:"OWEN",starter:"bazooka",strength:"Explosives and large blast damage.",weakness:"Slow attacks and dangerous self-damage.",exclusive:["grenade_launcher","blast_cannon"],allowedKinds:["shot","thrown"]},
  reaper:{name:"REAPER",human:"ELIAS",starter:"battleaxe",strength:"Aggressive close-range damage.",weakness:"Reduced healing.",exclusive:["scythe","soul_blade"],allowedKinds:["melee"]},
  fortune:{name:"SCAVENGER",human:"LEO",starter:"shuriken",strength:"Better loot economy and flexible weapons.",weakness:"Lower base damage.",exclusive:["scrap_shooter","lucky_knife"],allowedKinds:["melee","shot","thrown"]}
};

function addWeapon(w){
  if(typeof WEAPONS==="undefined"||typeof WEP==="undefined"||WEP[w.id])return;
  w.slot=WEAPONS.length;WEAPONS.push(w);WEP[w.id]=w;
}
[
{id:"mace",name:"WAR MACE",cls:"blade",kind:"melee",dmg:34,rate:44,reach:43,arc:40,kb:12,ammo:Infinity,unlock:1,blurb:"Crusher weapon. Falling onto enemies triggers Mace Slam."},
{id:"shortbow",name:"SHORTBOW",cls:"thrown",kind:"shot",dmg:22,rate:20,speed:15.5,grav:.025,life:82,pierce:1,kb:2.5,ammo:Infinity,unlock:1,blurb:"Archer-only quick bow."},
{id:"vanguard_blade",name:"VANGUARD BLADE",cls:"blade",kind:"melee",dmg:27,rate:24,reach:39,arc:36,kb:6,ammo:Infinity,unlock:1,blurb:"Vanguard-only balanced blade."},
{id:"warhammer",name:"WARHAMMER",cls:"blade",kind:"melee",dmg:48,rate:58,reach:46,arc:45,kb:16,ammo:Infinity,unlock:1,blurb:"Crusher-only heavy hammer."},
{id:"longbow",name:"LONGBOW",cls:"thrown",kind:"shot",dmg:38,rate:34,speed:17,grav:.018,life:95,pierce:2,kb:3,ammo:Infinity,unlock:1,blurb:"Archer-only long-range bow."},
{id:"greatsword",name:"GREATSWORD",cls:"blade",kind:"melee",dmg:44,rate:40,reach:51,arc:52,kb:10,ammo:Infinity,unlock:1,blurb:"Melee-only heavy sword."},
{id:"katana",name:"KATANA",cls:"blade",kind:"melee",dmg:30,rate:15,reach:45,arc:34,kb:4,ammo:Infinity,unlock:1,blurb:"Melee-only fast combo blade."},
{id:"handcannon",name:"HAND CANNON",cls:"gun",kind:"shot",dmg:52,rate:46,speed:20,life:70,pierce:1,kb:8,ammo:8,unlock:1,blurb:"Marksman-only high-damage sidearm."},
{id:"burst_rifle",name:"BURST RIFLE",cls:"gun",kind:"shot",dmg:19,rate:10,speed:21,life:76,pierce:1,kb:2,ammo:30,unlock:1,blurb:"Marksman-only rapid rifle."},
{id:"grenade_launcher",name:"GRENADE LAUNCHER",cls:"gun",kind:"shot",dmg:42,rate:55,speed:11,grav:.13,life:80,pierce:0,kb:11,ammo:8,unlock:1,explosive:true,blurb:"Demolition-only launcher."},
{id:"blast_cannon",name:"BLAST CANNON",cls:"gun",kind:"shot",dmg:58,rate:72,speed:10,life:62,pierce:0,kb:16,ammo:5,unlock:1,explosive:true,blurb:"Demolition-only heavy cannon."},
{id:"scythe",name:"REAPER SCYTHE",cls:"blade",kind:"melee",dmg:41,rate:30,reach:54,arc:66,kb:8,ammo:Infinity,unlock:1,blurb:"Reaper-only scythe."},
{id:"soul_blade",name:"SOUL BLADE",cls:"blade",kind:"melee",dmg:35,rate:22,reach:42,arc:42,kb:5,ammo:Infinity,unlock:1,blurb:"Reaper-only cursed blade."},
{id:"scrap_shooter",name:"SCRAP SHOOTER",cls:"gun",kind:"shot",dmg:24,rate:22,speed:17,life:66,pierce:1,kb:3,ammo:18,unlock:1,blurb:"Scavenger-only improvised gun."},
{id:"lucky_knife",name:"LUCKY KNIFE",cls:"blade",kind:"melee",dmg:23,rate:13,reach:33,arc:30,kb:3,ammo:Infinity,unlock:1,blurb:"Scavenger-only quick knife."}
].forEach(addWeapon);

function classId(){try{if(typeof r7Char==="function"&&r7Char())return r7Char().id||"rookie";}catch(_){}return"rookie";}
function cfg(){return CLASSES[classId()]||CLASSES.rookie;}
function applyClasses(){
  if(typeof R7_CHARACTERS!=="undefined")R7_CHARACTERS.forEach(c=>{const x=CLASSES[c.id];if(!x)return;c.name=x.name;c.strength=x.strength;c.weakness=x.weakness;c.className=x.name;c.human=x.human;c.starter=x.starter;});
}
function allowed(w){
  if(!w)return true;const id=classId(),c=cfg();
  for(const [otherId,o] of Object.entries(CLASSES))if(otherId!==id&&o.exclusive.includes(w.id))return false;
  if(c.exclusive.includes(w.id)||w.id==="knife")return true;
  return c.allowedKinds.includes(w.kind);
}
function grantClassWeapons(){
  if(typeof save==="undefined"||typeof WEP==="undefined")return;
  save.arsenal=Array.isArray(save.arsenal)?save.arsenal:[];
  try{
    if(typeof P!=="undefined"&&P)P.owned=Array.isArray(P.owned)?P.owned:[];
    for(const id of cfg().exclusive){
      if(WEP[id]&&!save.arsenal.includes(id))save.arsenal.push(id);
      if(typeof P!=="undefined"&&P&&WEP[id]&&!P.owned.includes(id))P.owned.push(id);
    }
    if(typeof writeSave==="function")writeSave();
  }catch(_){}
}
function giveStarter(id){
  if(typeof save==="undefined"||!CLASSES[id])return;
  const starter=CLASSES[id].starter;
  save.arsenal=Array.isArray(save.arsenal)?save.arsenal:[];
  if(!save.arsenal.includes(starter))save.arsenal.push(starter);
  try{if(typeof P!=="undefined"&&P){P.owned=Array.isArray(P.owned)?P.owned:[];if(!P.owned.includes(starter))P.owned.push(starter);P.slot=Math.max(0,P.owned.indexOf(starter));}}catch(_){}
  try{if(typeof writeSave==="function")writeSave();}catch(_){}
}

if(typeof curWep==="function"){
  const old=curWep;
  const wrapped=function(){
    let w=old();if(allowed(w))return w;
    try{
      if(typeof P!=="undefined"&&P&&Array.isArray(P.owned)){
        const ok=P.owned.map(id=>WEP[id]).filter(allowed);
        if(ok.length){P.slot=P.owned.indexOf(ok[0].id);if(typeof toast==="function")toast("CLASS WEAPON LOCK","That weapon cannot be used by "+cfg().name+".");return ok[0];}
      }
    }catch(_){}
    return WEP&&WEP.knife?WEP.knife:w;
  };
  try{curWep=wrapped;}catch(_){window.curWep=wrapped;}
}

if(typeof tryStomp==="function"){
  const old=tryStomp;
  const wrapped=function(e,d){
    let w=null;try{w=typeof curWep==="function"?curWep():null;}catch(_){}
    const fall=(typeof P!=="undefined"&&P)?Math.max(0,P.vy||0):0;
    const hit=old(e,d);
    if(hit&&w&&w.id==="mace"&&e&&!e.dead){
      const raw=Math.round(32+Math.min(78,fall*5.5));
      try{
        if(typeof damageEnemy==="function")damageEnemy(e,WEP.mace,typeof sign==="function"?(sign(e.x-P.x)||1):1,raw);
        if(typeof popText==="function")popText(e.x+e.w/2,e.y-30,"MACE SLAM!","#ffd166");
        if(typeof spark==="function")spark(e.x+e.w/2,e.y+e.h/2,24,"#ffd166",5,34);
        if(typeof G!=="undefined"&&G&&Array.isArray(G.enemies)){
          G.shake=Math.max(G.shake||0,15);G.freeze=Math.max(G.freeze||0,5);
          for(const o of G.enemies){if(o===e||o.dead)continue;const dx=(o.x+o.w/2)-(e.x+e.w/2),dy=(o.y+o.h/2)-(e.y+e.h/2);if(Math.hypot(dx,dy)<=82&&typeof damageEnemy==="function")damageEnemy(o,WEP.mace,dx<0?-1:1,Math.round(raw*.42));}
        }
      }catch(_){}
    }
    return hit;
  };
  try{tryStomp=wrapped;}catch(_){window.tryStomp=wrapped;}
}

function rand(a,b){return Math.floor(a+Math.random()*(b-a+1));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function dropAt(e,kind,data){try{if(typeof G!=="undefined"&&G&&Array.isArray(G.pickups)&&typeof mkPickup==="function")G.pickups.push(mkPickup(e.x+e.w/2+rand(-18,18),e.y+e.h/2-8,kind,data));}catch(_){}}
function randomMobDrop(e,d){
  if(!e||e.__r101Drop||(d&&d.isBoss))return;e.__r101Drop=true;
  const r=Math.random();if(r<.26)return;
  if(r<.43)dropAt(e,"health",null);
  else if(r<.60)dropAt(e,"ammo",null);
  else if(r<.73)dropAt(e,"throwables",null);
  else if(r<.86)dropAt(e,"power",pick(["berserk","haste","aegis","overload","leech","magnet"]));
  else if(r<.95){
    try{const pool=(typeof P!=="undefined"&&P&&Array.isArray(P.owned)?P.owned:[]).map(id=>WEP[id]).filter(w=>w&&allowed(w)&&w.id!=="knife");dropAt(e,pool.length?"weapon":"ammo",pool.length?pick(pool).id:null);}catch(_){dropAt(e,"ammo",null);}
  }else{
    try{save.scrap=(save.scrap||0)+rand(2,6);save.coins=(save.coins||0)+rand(2,7);if(typeof writeSave==="function")writeSave();if(typeof popText==="function")popText(e.x+e.w/2,e.y-18,"RANDOM LOOT!","#ffd166");}catch(_){}
  }
}
if(typeof killEnemy==="function"){
  const old=killEnemy;
  const wrapped=function(e){let d=null;try{d=e&&typeof ENEMIES!=="undefined"?ENEMIES[e.type]:null;}catch(_){}const was=!!(e&&e.dead);const out=old.apply(this,arguments);if(e&&!was)randomMobDrop(e,d||{});return out;};
  try{killEnemy=wrapped;}catch(_){window.killEnemy=wrapped;}
}

if(typeof mkPickup==="function"){
  const old=mkPickup;
  const wrapped=function(x,y,kind,data){const pk=old.apply(this,arguments);if(pk&&(kind==="chest"||kind==="goldchest")){pk.anim=0;pk.frame=0;pk.spin=0;pk.bob=0;pk.vy=0;pk.solidVisual=true;}return pk;};
  try{mkPickup=wrapped;}catch(_){window.mkPickup=wrapped;}
}
setInterval(()=>{try{if(typeof G!=="undefined"&&G&&Array.isArray(G.pickups))G.pickups.forEach(pk=>{if(pk&&(pk.kind==="chest"||pk.kind==="goldchest")){pk.anim=0;pk.frame=0;pk.spin=0;pk.bob=0;if(typeof pk.vy==="number")pk.vy=0;}});}catch(_){}},80);

const GUIDE=`<div id="r101WorldGuide"><b style="color:#ffd166">IRONTRAP FIELD GUIDE</b><br><br><b>SECRET ROOMS</b><br>Some floors contain cracked walls. Break or explore suspicious cracked sections to uncover hidden rooms, rewards and optional discoveries.<br><br><b>LEVELS</b><br>The run has 50 floors across 10 five-floor chapters. Regular floors build toward mini-bosses and major boss encounters, with workbenches appearing through the run so you can improve your loadout.<br><br><b>INTERACTIVE / MOVING OBJECTS</b><br>Explosive barrels can be used against enemies. Crumbling platforms collapse after use. Pressure plates can activate doors or mechanisms. Moving saws are hazards that can hurt anything caught in them. Environmental objects can also be used for kills.<br><br><b>CLASSES</b><br>The old Character Vault is merged into this CHARACTER menu. Pick a class here to change its strengths, weaknesses and class-only weapon pool.</div>`;

function removeRainbow(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes)if(n.nodeValue&&n.nodeValue.includes("🌈"))n.nodeValue=n.nodeValue.replaceAll("🌈","");
  document.querySelectorAll('[aria-label*="rainbow" i],[title*="rainbow" i],.rainbow,.rainbow-icon').forEach(el=>el.remove());
}
function mergeMenu(){
  applyClasses();
  const main=document.getElementById("bLooks"),vault=document.getElementById("r7CharactersBtn");
  if(vault){vault.style.display="none";vault.setAttribute("aria-hidden","true");}
  if(main&&typeof r7ShowCharacterMenu==="function"){main.textContent="CHARACTER";main.onclick=e=>{if(e)e.preventDefault();r7ShowCharacterMenu();};}
}
function decorate(){
  const scr=document.getElementById("r7CharacterScreen"),grid=document.getElementById("r7CharGrid");
  if(!scr||!grid)return;
  const h=scr.querySelector("h1");if(h)h.textContent="CHARACTER — CLASS SELECT";
  const p=scr.querySelector("h1 + p");if(p)p.textContent="Choose a combat class. Each class has its own specialty, starter weapon and class-only arsenal.";
  const badge=document.getElementById("r84RosterCount");if(badge)badge.textContent=grid.children.length+" / 8 CLASSES LOADED";
  if(!document.getElementById("r101WorldGuide"))grid.insertAdjacentHTML("beforebegin",GUIDE);
  [...grid.children].forEach((card,i)=>{
    const c=typeof R7_CHARACTERS!=="undefined"?R7_CHARACTERS[i]:null;if(!c)return;
    const x=CLASSES[c.id];if(!x)return;
    const name=card.querySelector("b");if(name)name.textContent=x.name;
    if(!card.querySelector(".r101-class-tag")){const tag=document.createElement("div");tag.className="r101-class-tag";tag.textContent=x.human+" · "+x.name+" CLASS";const top=card.querySelector("div");if(top)top.insertAdjacentElement("afterend",tag);}
    if(!card.querySelector(".r101-loadout")){const box=document.createElement("div");box.className="r101-loadout";box.innerHTML="<b>STARTER WEAPON</b><br>"+(WEP[x.starter]?.name||x.starter.toUpperCase())+"<br><b>CLASS-ONLY</b><br>"+x.exclusive.map(id=>WEP[id]?.name||id).join(" · ")+(x.starter==="mace"?"<br><span style='color:#ffd166'>SPECIAL: MACE SLAM — fall onto enemies for impact damage.</span>":"");const actions=card.querySelector(".r7actions");if(actions)actions.insertAdjacentElement("beforebegin",box);else card.appendChild(box);}
    [...card.querySelectorAll("button")].forEach(btn=>{if(btn.dataset.r101Bound)return;const t=btn.textContent||"";if(t.includes("SELECT")){const old=btn.onclick;btn.onclick=ev=>{if(old)old.call(btn,ev);giveStarter(c.id);setTimeout(grantClassWeapons,0);};btn.dataset.r101Bound="1";}});
  });
}
const oldMenu=typeof r7ShowCharacterMenu==="function"?r7ShowCharacterMenu:null;
if(oldMenu){
  const wrapped=function(){applyClasses();oldMenu();requestAnimationFrame(()=>{decorate();mergeMenu();removeRainbow();});};
  try{r7ShowCharacterMenu=wrapped;}catch(_){window.r7ShowCharacterMenu=wrapped;}
  window.r7ShowCharacterMenu=wrapped;
}
function apply(){mergeMenu();removeRainbow();}
apply();setTimeout(apply,500);setTimeout(apply,1200);
new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();