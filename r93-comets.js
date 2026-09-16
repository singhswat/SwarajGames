(()=>{
'use strict';
const title=document.getElementById('title');
if(!title||document.getElementById('r93CometField'))return;
const field=document.createElement('div');
field.id='r93CometField';
field.setAttribute('aria-hidden','true');
title.prepend(field);

const tiers=[
  {name:'tiny',w:34,tail:[70,120],dur:[2.7,4.2],alpha:[.28,.5]},
  {name:'small',w:31,tail:[95,160],dur:[3.2,4.8],alpha:[.38,.62]},
  {name:'medium',w:21,tail:[135,210],dur:[3.7,5.4],alpha:[.5,.76]},
  {name:'large',w:11,tail:[180,280],dur:[4.4,6.1],alpha:[.62,.88]},
  {name:'hero',w:3,tail:[260,390],dur:[5.2,7.1],alpha:[.78,1]}
];
const max=16;
let timer=0;
const rand=(a,b)=>a+Math.random()*(b-a);
function pickTier(){let n=Math.random()*100,total=0;for(const t of tiers){total+=t.w;if(n<total)return t;}return tiers[0];}
function spawn(){
  if(!title.classList.contains('show')||document.hidden||field.childElementCount>=max)return;
  const t=pickTier();
  const e=document.createElement('i');
  e.className='r93-comet '+t.name;
  const startX=rand(-18,82), startY=rand(-18,22);
  const drift=rand(54,82), fall=rand(68,112);
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
function loop(){clearTimeout(timer);spawn();const visible=title.classList.contains('show');timer=setTimeout(loop,visible?rand(180,520):900);}
for(let i=0;i<5;i++)setTimeout(spawn,i*240);
loop();
const mo=new MutationObserver(()=>{if(title.classList.contains('show')){for(let i=0;i<3;i++)setTimeout(spawn,i*180);}else field.replaceChildren();});
mo.observe(title,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)field.replaceChildren();});
})();
