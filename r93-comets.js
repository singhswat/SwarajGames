(()=>{
'use strict';
const title=document.getElementById('title');
const debug=new URLSearchParams(location.search).has('cometdebug');
function dbg(msg){if(!debug)return;let box=document.getElementById('r97CometDebug');if(!box){box=document.createElement('div');box.id='r97CometDebug';box.style.cssText='position:fixed;right:12px;top:12px;z-index:2147483647;background:#05070bcc;color:#8dff8d;border:1px solid #8dff8d;padding:10px 12px;font:12px/1.4 monospace;white-space:pre-wrap;pointer-events:none;max-width:360px';document.body.appendChild(box);}box.textContent=msg;}
if(!title){dbg('COMET DEBUG\nscript: loaded\ntitle: MISSING');return;}
if(document.getElementById('r93CometField')){dbg('COMET DEBUG\nscript: loaded\ntitle: found\nfield: already exists');return;}
const field=document.createElement('div');
field.id='r93CometField';
field.setAttribute('aria-hidden','true');
title.prepend(field);
const tiers=[
  {name:'tiny',w:34,tail:[80,130],dur:[2.8,4.0],alpha:[.38,.58]},
  {name:'small',w:31,tail:[110,175],dur:[3.2,4.6],alpha:[.48,.68]},
  {name:'medium',w:21,tail:[150,230],dur:[3.6,5.0],alpha:[.58,.8]},
  {name:'large',w:11,tail:[210,310],dur:[4.2,5.8],alpha:[.72,.92]},
  {name:'hero',w:3,tail:[300,430],dur:[5.0,6.7],alpha:[.88,1]}
];
const max=18;
let timer=0;
const rand=(a,b)=>a+Math.random()*(b-a);
function titleVisible(){if(document.hidden)return false;const s=getComputedStyle(title);return s.display!=='none'&&s.visibility!=='hidden'&&title.getClientRects().length>0;}
function report(){if(!debug)return;const fs=getComputedStyle(field),sample=field.querySelector('.r93-comet'),ss=sample?getComputedStyle(sample):null;dbg('COMET DEBUG\nscript: loaded\ntitle: found\ntitle visible: '+titleVisible()+'\nfield: attached\nfield display: '+fs.display+'\nfield z-index: '+fs.zIndex+'\ncomets: '+field.childElementCount+'\ncss animation: '+(ss?ss.animationName:'waiting for comet'));}
function pickTier(){let n=Math.random()*100,total=0;for(const t of tiers){total+=t.w;if(n<total)return t;}return tiers[0];}
function spawn(){if(!titleVisible()||field.childElementCount>=max){report();return;}const t=pickTier(),e=document.createElement('i');e.className='r93-comet '+t.name;const startX=rand(-24,78),startY=rand(-22,18),drift=rand(58,90),fall=rand(72,118);e.style.setProperty('--sx',startX+'vw');e.style.setProperty('--sy',startY+'vh');e.style.setProperty('--ex',(startX+drift)+'vw');e.style.setProperty('--ey',(startY+fall)+'vh');e.style.setProperty('--tail',rand(t.tail[0],t.tail[1])+'px');e.style.setProperty('--dur',rand(t.dur[0],t.dur[1])+'s');e.style.setProperty('--alpha',rand(t.alpha[0],t.alpha[1]).toFixed(2));e.style.setProperty('--angle',rand(31,39)+'deg');field.appendChild(e);e.addEventListener('animationend',()=>{e.remove();report();},{once:true});report();}
function burst(n=5){for(let i=0;i<n;i++)setTimeout(spawn,i*120);}
function loop(){clearTimeout(timer);spawn();timer=setTimeout(loop,titleVisible()?rand(160,430):700);}
if(debug){const probe=document.createElement('i');probe.className='r93-comet hero';probe.style.cssText='--sx:8vw;--sy:12vh;--ex:75vw;--ey:78vh;--tail:420px;--dur:4.5s;--alpha:1;--angle:35deg';field.appendChild(probe);probe.addEventListener('animationend',()=>probe.remove(),{once:true});}
burst(8);loop();report();
const mo=new MutationObserver(()=>{if(titleVisible())burst(5);else field.replaceChildren();report();});
mo.observe(title,{attributes:true,attributeFilter:['class','style']});
window.addEventListener('resize',()=>{if(titleVisible())burst(2);report();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)field.replaceChildren();else burst(5);report();});
})();
