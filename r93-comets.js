(()=>{
'use strict';
const title=document.getElementById('title');
if(!title||document.getElementById('r93CometField'))return;
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
function titleVisible(){
  if(document.hidden)return false;
  const s=getComputedStyle(title);
  return s.display!=='none'&&s.visibility!=='hidden'&&title.getClientRects().length>0;
}
function pickTier(){let n=Math.random()*100,total=0;for(const t of tiers){total+=t.w;if(n<total)return t;}return tiers[0];}
function spawn(){
  if(!titleVisible()||field.childElementCount>=max)return;
  const t=pickTier();
  const e=document.createElement('i');
  e.className='r93-comet '+t.name;
  const startX=rand(-24,78),startY=rand(-22,18);
  const drift=rand(58,90),fall=rand(72,118);
  e.style.setProperty('--sx',startX+'vw');
  e.style.setProperty('--sy',startY+'vh');
  e.style.setProperty('--ex',(startX+drift)+'vw');
  e.style.setProperty('--ey',(startY+fall)+'vh');
  e.style.setProperty('--tail',rand(t.tail[0],t.tail[1])+'px');
  e.style.setProperty('--dur',rand(t.dur[0],t.dur[1])+'s');
  e.style.setProperty('--alpha',rand(t.alpha[0],t.alpha[1]).toFixed(2));
  e.style.setProperty('--angle',rand(31,39)+'deg');
  field.appendChild(e);
  e.addEventListener('animationend',()=>e.remove(),{once:true});
}
function burst(n=5){for(let i=0;i<n;i++)setTimeout(spawn,i*120);}
function loop(){clearTimeout(timer);spawn();timer=setTimeout(loop,titleVisible()?rand(160,430):700);}
burst(8);loop();
const mo=new MutationObserver(()=>{if(titleVisible())burst(5);else field.replaceChildren();});
mo.observe(title,{attributes:true,attributeFilter:['class','style']});
window.addEventListener('resize',()=>{if(titleVisible())burst(2);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)field.replaceChildren();else burst(5);});
})();
