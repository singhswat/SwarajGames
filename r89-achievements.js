(()=>{
'use strict';
const KEY='irontrap.achievements.r89';
const TITLE_KEY='irontrap.equippedTitle.r89';
const $=id=>document.getElementById(id);
const defs=[
 {id:'firstblood',title:'FIRST BLOOD',name:'First Blood',desc:'Defeat your first enemy.',test:s=>s.kills>=1},
 {id:'hunter',title:'HUNTER',name:'Hunter',desc:'Defeat 100 enemies.',test:s=>s.kills>=100},
 {id:'slayer',title:'SLAYER',name:'Slayer',desc:'Defeat 500 enemies.',test:s=>s.kills>=500},
 {id:'combo10',title:'COMBO KING',name:'Combo King',desc:'Reach a 10-hit combo.',test:s=>s.bestCombo>=10},
 {id:'combo25',title:'UNTOUCHABLE',name:'Untouchable',desc:'Reach a 25-hit combo.',test:s=>s.bestCombo>=25},
 {id:'env10',title:'TRAP MASTER',name:'Trap Master',desc:'Get 10 environmental kills.',test:s=>s.envKills>=10},
 {id:'secrets5',title:'SEEKER',name:'Seeker',desc:'Discover 5 secret rooms.',test:s=>s.secrets>=5},
 {id:'challenge10',title:'CHALLENGER',name:'Challenger',desc:'Complete 10 optional floor challenges.',test:s=>s.challenges>=10},
 {id:'minis5',title:'MINI-BOSS HUNTER',name:'Mini-Boss Hunter',desc:'Defeat all five mini-boss encounters.',test:s=>s.minibosses>=5},
 {id:'boss1',title:'BOSS HUNTER',name:'Boss Hunter',desc:'Defeat a major boss.',test:s=>s.bosses>=1},
 {id:'boss5',title:'BOSS BREAKER',name:'Boss Breaker',desc:'Defeat all five major bosses.',test:s=>s.bosses>=5},
 {id:'floor25',title:'DEEP DIVER',name:'Deep Diver',desc:'Clear Floor 25.',test:s=>s.highestFloor>=25},
 {id:'floor50',title:'IRONFALL MASTER',name:'Ironfall Master',desc:'Clear Floor 50.',test:s=>s.highestFloor>=50},
 {id:'hardclear',title:'HARDENED',name:'Hardened',desc:'Clear a boss floor on Hard or above.',test:s=>s.hardBossClear},
 {id:'demon',title:'DEMON WALKER',name:'Demon Walker',desc:'Clear Floor 50 on Demon difficulty.',test:s=>s.demonClear},
 {id:'nodeath',title:'IRON HEART',name:'Iron Heart',desc:'Clear five consecutive floors without dying.',test:s=>s.noDeathStreak>=5}
];
function blank(){return{kills:0,bestCombo:0,envKills:0,secrets:0,challenges:0,minibosses:0,bosses:0,highestFloor:0,hardBossClear:false,demonClear:false,noDeathStreak:0,lastDeaths:0,unlocked:{}}}
function load(){try{return Object.assign(blank(),JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){return blank();}}
let st=load();
function saveState(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(_){}}
function equipped(){return localStorage.getItem(TITLE_KEY)||'';}
function setEquipped(t){try{localStorage.setItem(TITLE_KEY,t||'');}catch(_){} refreshBadges(); render();}
function notify(d){
  try{ if(typeof toast==='function') toast('ACHIEVEMENT UNLOCKED',d.name+' · TITLE: '+d.title); }catch(_){}
  try{ if(typeof Audio2!=='undefined'&&Audio2.sfx) Audio2.sfx('power'); }catch(_){}
}
function evaluate(){let changed=false;for(const d of defs){if(!st.unlocked[d.id]&&d.test(st)){st.unlocked[d.id]=Date.now();changed=true;notify(d);}}if(changed){saveState();render();}}
function bump(k,n=1){st[k]=(Number(st[k])||0)+n;saveState();evaluate();}
function syncFromGame(){
 try{if(P&&Number.isFinite(P.bestCombo))st.bestCombo=Math.max(st.bestCombo,P.bestCombo);}catch(_){}
 try{if(G&&Number.isFinite(G.envKills))st.envKills=Math.max(st.envKills,G.envKills);}catch(_){}
 try{if(G&&Number.isFinite(G.secretsFound))st.secrets=Math.max(st.secrets,G.secretsFound);}catch(_){}
 try{if(save&&Number.isFinite(save.challengeCompletions))st.challenges=Math.max(st.challenges,save.challengeCompletions);}catch(_){}
 saveState();evaluate();refreshBadges();
}
function unlockedCount(){return defs.filter(d=>st.unlocked[d.id]).length;}
function addScreen(){
 if($('achievements'))return;
 const wrap=$('wrap');if(!wrap)return;
 const s=document.createElement('div');s.className='screen';s.id='achievements';
 s.innerHTML='<h2>ACHIEVEMENTS</h2><p id="achSummary"></p><div id="achGrid" class="invgrid" style="max-width:760px;max-height:58vh;overflow-y:auto"></div><div class="row"><button class="btn small" id="bAchClearTitle">UNEQUIP TITLE</button><button class="btn small" id="bAchBack">BACK</button></div>';
 wrap.appendChild(s);
 const title=$('title');const row=title&&title.querySelector('.row');if(row&&!$('bAchievements')){const b=document.createElement('button');b.className='btn small';b.id='bAchievements';b.textContent='ACHIEVEMENTS';row.appendChild(b);b.onclick=()=>{render();if(typeof show==='function')show('achievements');};}
 $('bAchBack').onclick=()=>{if(typeof show==='function')show('title');};$('bAchClearTitle').onclick=()=>setEquipped('');
}
function render(){
 const g=$('achGrid'),sum=$('achSummary');if(!g||!sum)return;const eq=equipped();sum.textContent=unlockedCount()+' / '+defs.length+' UNLOCKED · EQUIPPED TITLE: '+(eq||'NONE');
 g.innerHTML='';defs.forEach(d=>{const on=!!st.unlocked[d.id];const el=document.createElement('div');el.className='slot '+(on?'on':'locked');el.style.minWidth='220px';el.innerHTML='<b>'+d.name+'<span class="cls">'+(on?(eq===d.title?'EQUIPPED':'UNLOCKED'):'LOCKED')+'</span></b><span style="display:block;margin-top:4px">'+d.desc+'</span><span style="display:block;margin-top:5px;color:#f2c14e">TITLE: '+d.title+'</span>';if(on)el.onclick=()=>setEquipped(d.title);g.appendChild(el);});
}
function refreshBadges(){
 const t=equipped();
 let chip=$('r89TitleChip');if(!chip){chip=document.createElement('div');chip.id='r89TitleChip';chip.style.cssText='font-size:10px;letter-spacing:2px;text-align:right;margin-top:3px;color:#f2c14e';const lvl=$('lvlname');if(lvl&&lvl.parentNode)lvl.parentNode.appendChild(chip);}if(chip)chip.textContent=t?'['+t+']':'';
 const mp=$('r87MpCallsign');if(mp){const base=($('mpName')?.value||localStorage.getItem('ironfall.playerName')||'PLAYER');mp.textContent=t?base+' · '+t:base;}
}
function installHooks(){
 try{if(typeof killEnemy==='function'&&!killEnemy.__r89){const old=killEnemy;killEnemy=function(e){const wasDead=!!e?.dead;const isBoss=!!(e&&typeof ENEMIES!=='undefined'&&ENEMIES[e.type]?.isBoss);const mini=!!e?.isMiniBoss;const r=old.apply(this,arguments);if(!wasDead&&e?.dead){bump('kills');if(mini)bump('minibosses');if(isBoss)bump('bosses');syncFromGame();}return r;};killEnemy.__r89=true;}}
 catch(e){console.warn('R89 kill hook',e);}
 try{if(typeof finishFloor==='function'&&!finishFloor.__r89){const old=finishFloor;finishFloor=function(){const n=G?.num||0;const beforeDeaths=Number(save?.deaths)||0;const difficulty=String(save?.difficulty||'normal');const wasBoss=!!G?.boss;const r=old.apply(this,arguments);st.highestFloor=Math.max(st.highestFloor,n);if(beforeDeaths===st.lastDeaths)st.noDeathStreak++;else st.noDeathStreak=0;st.lastDeaths=beforeDeaths;if(wasBoss&&['hard','nightmare','demon'].includes(difficulty))st.hardBossClear=true;if(n>=50&&difficulty==='demon')st.demonClear=true;syncFromGame();evaluate();return r;};finishFloor.__r89=true;}}
 catch(e){console.warn('R89 floor hook',e);}
 try{if(typeof killPlayer==='function'&&!killPlayer.__r89){const old=killPlayer;killPlayer=function(){st.noDeathStreak=0;try{st.lastDeaths=(Number(save?.deaths)||0)+1;}catch(_){}saveState();return old.apply(this,arguments);};killPlayer.__r89=true;}}
 catch(e){console.warn('R89 death hook',e);}
}
function boot(){addScreen();installHooks();syncFromGame();render();refreshBadges();setInterval(syncFromGame,1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);setTimeout(boot,800);
window.IronAchievements={state:()=>JSON.parse(JSON.stringify(st)),definitions:defs,equipped,setEquipped};
})();