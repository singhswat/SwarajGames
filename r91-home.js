(()=>{
'use strict';
const $=id=>document.getElementById(id);
const title=$('title'); if(!title||$('r91Home')) return;

title.classList.add('r91-home');
const shell=document.createElement('div'); shell.id='r91Home'; shell.className='r91-shell';
const actions={
  play:()=>$('bStart')?.click(), levels:()=>$('bLevels')?.click(), looks:()=>$('bLooks')?.click(), settings:()=>$('bSettings')?.click(),
  multi:()=>$('bMulti')?.click(), board:()=>$('bLeaderboard')?.click(), credits:()=>$('bCredits')?.click(),
  ranked:()=>($('bRankedRun')||$('bStart'))?.click(), achievements:()=>($('bAchievements')||$('bStart'))?.click()
};

const slides=[
 {k:'MOST PLAYED',a:'IRON',b:'TRAP',copy:'50 floors, boss phases, mini-bosses, weapon evolution, elite enemies, secrets, challenges and a full Floor 50 finale.',action:'play',label:'PLAY NOW'},
 {k:'COMPETE FOR YOUR BEST RUN',a:'RANKED',b:'RUN',copy:'Push for a faster clear, a higher score and a cleaner run. Rankings use real backend data when the service is connected.',action:'ranked',label:'START RANKED'},
 {k:'RACE YOUR FRIENDS',a:'MULTI',b:'PLAYER',copy:'Create or join a room code, compare progress and race through IRONTRAP with live room status when the multiplayer backend is available.',action:'multi',label:'MULTIPLAYER'}
];

const cards=[
 {title:'IRONTRAP CAMPAIGN',cat:['trending'],icon:'⚔️',meta:'50 FLOORS',status:'SOLO',act:'play',c1:'#17233a',c2:'#3a2015'},
 {title:'RANKED RUN',cat:['trending','racing'],icon:'🏁',meta:'TIME + SCORE',status:'RANKED',act:'ranked',c1:'#2a1738',c2:'#5d2617'},
 {title:'MULTIPLAYER RACE',cat:['trending','racing','multiplayer'],icon:'⚔️',meta:'ROOM CODES',status:'FRIENDS',act:'multi',c1:'#102c35',c2:'#204f3c'},
 {title:'LEVEL SELECT',cat:['trending'],icon:'🗺️',meta:'50 FLOORS',status:'PRACTICE',act:'levels',c1:'#20334a',c2:'#1b534b'},
 {title:'SECRET ROOMS',cat:['puzzles'],icon:'🧩',meta:'CRACKED WALLS',status:'EXPLORE',act:'play',c1:'#302149',c2:'#16263d'},
 {title:'FLOOR CHALLENGES',cat:['puzzles','trending'],icon:'🎯',meta:'OPTIONAL GOALS',status:'BONUS',act:'play',c1:'#3d2b16',c2:'#49361d'},
 {title:'BOSS HUNTS',cat:['trending'],icon:'👹',meta:'PHASE FIGHTS',status:'HARD+',act:'levels',c1:'#481722',c2:'#1a162d'},
 {title:'CHARACTER VAULT',cat:['trending'],icon:'🧍',meta:'8 FIGHTERS',status:'CUSTOM',act:'looks',c1:'#163040',c2:'#263156'},
 {title:'ACHIEVEMENTS',cat:['puzzles'],icon:'🏆',meta:'TITLES',status:'UNLOCK',act:'achievements',c1:'#44330f',c2:'#22263c'},
 {title:'CREDITS',cat:['trending'],icon:'🎬',meta:'SWARAJ SINGH',status:'ROLL',act:'credits',c1:'#171b2c',c2:'#38212f'}
];

shell.innerHTML=`
<div class="r91-topbar"><div class="r91-brand">IRON<span>TRAP</span></div><div class="r91-nav">
<button class="btn small" data-act="play">PLAY</button><button class="btn small" data-act="multi">MULTIPLAYER</button><button class="btn small" data-act="board">LEADERBOARD</button><button class="btn small" data-act="looks">CHARACTERS</button><button class="btn small" data-act="credits">CREDITS</button><button class="btn small" data-act="settings">SETTINGS</button>
</div></div>
<section class="r91-hero"><div class="r91-hero-content"><div class="r91-kicker" id="r91Kicker"></div><h2 id="r91HeroTitle"></h2><p class="r91-hero-copy" id="r91HeroCopy"></p><div class="r91-hero-actions"><button class="btn r91-play" id="r91HeroPlay">PLAY NOW</button><button class="btn small" data-act="levels">EXPLORE FLOORS</button><div class="r91-counter"><b id="r91Counter">9,999</b><span>RUN COUNTER · THIS DEVICE</span></div></div></div><div class="r91-pixel-fighter"><i class="h"></i><i class="b"></i><i class="a1"></i><i class="a2"></i><i class="l1"></i><i class="l2"></i><i class="gun"></i></div><div class="r91-dots" id="r91Dots"></div></section>
<div class="r91-filters"><button class="r91-pill on" data-filter="trending">🔥 Trending</button><button class="r91-pill" data-filter="racing">🏎️ Racing</button><button class="r91-pill" data-filter="puzzles">🧩 Puzzles</button><button class="r91-pill" data-filter="multiplayer">⚔️ Multiplayer</button></div>
<div class="r91-section-head"><h3>IRONTRAP EXPERIENCES</h3><span>10 WAYS INTO THE GAME · NO FAKE PLAYER COUNTS</span></div><div class="r91-grid" id="r91Grid"></div>`;
title.appendChild(shell);

function fire(name){ try{actions[name]?.();}catch(e){console.warn('R91 action',name,e);} }
shell.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>fire(b.dataset.act)));

let runCount=9999; try{const saved=Number(localStorage.getItem('irontrap.r91.runCounter'));if(Number.isFinite(saved)&&saved>=9999)runCount=saved;}catch(_){}
function drawCount(){const e=$('r91Counter');if(e)e.textContent=runCount.toLocaleString('en-GB');}
function countRun(){runCount++;try{localStorage.setItem('irontrap.r91.runCounter',String(runCount));}catch(_){}drawCount();}
drawCount();
const oldStart=$('bStart'); if(oldStart&&!oldStart.__r91count){oldStart.addEventListener('click',countRun);oldStart.__r91count=true;}

const grid=$('r91Grid'); cards.forEach((c,i)=>{const b=document.createElement('button');b.className='r91-card';b.dataset.cats=c.cat.join(' ');b.style.setProperty('--c1',c.c1);b.style.setProperty('--c2',c.c2);b.innerHTML=`<div class="r91-thumb"><span class="r91-card-icon">${c.icon}</span></div><div class="r91-card-body"><div class="r91-card-title">${String(i+1).padStart(2,'0')} · ${c.title}</div><div class="r91-card-meta"><span>${c.meta}</span><strong>${c.status}</strong></div></div>`;b.addEventListener('click',()=>fire(c.act));grid.appendChild(b);});
function filter(cat){shell.querySelectorAll('.r91-pill').forEach(p=>p.classList.toggle('on',p.dataset.filter===cat));shell.querySelectorAll('.r91-card').forEach(c=>{c.hidden=!c.dataset.cats.split(' ').includes(cat);});}
shell.querySelectorAll('.r91-pill').forEach(p=>p.addEventListener('click',()=>filter(p.dataset.filter)));

let slide=0,timer=0; const dots=$('r91Dots');
slides.forEach((_,i)=>{const d=document.createElement('button');d.className='r91-dot';d.setAttribute('aria-label','Hero slide '+(i+1));d.onclick=()=>setSlide(i,true);dots.appendChild(d);});
function setSlide(i,user=false){slide=(i+slides.length)%slides.length;const s=slides[slide];$('r91Kicker').textContent=s.k;$('r91HeroTitle').innerHTML=`${s.a}<span>${s.b}</span>`;$('r91HeroCopy').textContent=s.copy;const p=$('r91HeroPlay');p.textContent=s.label;p.onclick=()=>fire(s.action);[...dots.children].forEach((d,n)=>d.classList.toggle('on',n===slide));if(user)restart();}
function restart(){clearInterval(timer);timer=setInterval(()=>setSlide(slide+1),5200);}setSlide(0);restart();

const observer=new MutationObserver(()=>{if(title.classList.contains('show')){shell.hidden=false;} });observer.observe(title,{attributes:true,attributeFilter:['class']});
})();
