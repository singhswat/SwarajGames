(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const API=(window.IRONTRAP_API_ORIGIN||location.origin).replace(/\/$/,'');
  const LOCAL_KEY='irontrap.localRankedRuns.v1';
  const fmt=t=>{t=Math.max(0,Math.floor(Number(t)||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');};
  const readLocal=()=>{try{const a=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(a)?a:[];}catch(_){return[];}};
  const writeLocal=a=>{try{localStorage.setItem(LOCAL_KEY,JSON.stringify(a.slice(-120)));}catch(_){}};
  const saveRun=run=>{
    if(!run||run.cheatsUsed)return;
    const time=Math.floor(Number(run.time)),score=Math.floor(Number(run.score));
    if(!(time>0&&score>=0))return;
    const rows=readLocal();
    rows.push({player_name:(localStorage.getItem('ironfall.playerName')||'PLAYER').slice(0,16),completion_seconds:time,score,difficulty:String(run.difficulty||'normal'),created_at:new Date().toISOString(),local:true});
    writeLocal(rows);updatePersonalBests();
  };
  function periodRows(rows,period){
    if(period==='all')return rows;
    const d=new Date(),start=new Date(d);
    if(period==='daily')start.setHours(0,0,0,0);
    else if(period==='weekly'){const day=(start.getDay()+6)%7;start.setDate(start.getDate()-day);start.setHours(0,0,0,0);}
    else if(period==='monthly'){start.setDate(1);start.setHours(0,0,0,0);}
    return rows.filter(r=>new Date(r.created_at).getTime()>=start.getTime());
  }
  function sorted(rows,metric){return [...rows].sort(metric==='score'?(a,b)=>(b.score-a.score)||(a.completion_seconds-b.completion_seconds):(a,b)=>(a.completion_seconds-b.completion_seconds)||(b.score-a.score));}
  function ensureLeaderboardUI(){
    const screen=$('leaderboard'); if(!screen||$('r87LeadInfo'))return;
    const info=document.createElement('div');info.id='r87LeadInfo';info.className='r87-info-grid';info.innerHTML=`<div class="r87-stat"><b>ONLINE SERVICE</b><span id="r87LeadBackend">CHECKING…</span></div><div class="r87-stat"><b>LOCAL RUNS</b><span id="r87LocalCount">0</span></div><div class="r87-stat"><b>YOUR FASTEST</b><span id="r87BestTime">—</span></div><div class="r87-stat"><b>YOUR HIGH SCORE</b><span id="r87BestScore">—</span></div>`;
    const p=screen.querySelector('p');p.insertAdjacentElement('afterend',info);
    const note=document.createElement('p');note.id='r87LeadNote';note.className='r87-explainer';note.textContent='Online rankings use completed 50-floor Ranked Runs. If the online service is unavailable, your real completed runs on this device are shown as LOCAL rankings.';info.insertAdjacentElement('afterend',note);updatePersonalBests();
  }
  function updatePersonalBests(){
    const rows=readLocal(),times=rows.map(r=>+r.completion_seconds).filter(x=>x>0),scores=rows.map(r=>+r.score).filter(Number.isFinite);
    if($('r87LocalCount'))$('r87LocalCount').textContent=rows.length;if($('r87BestTime'))$('r87BestTime').textContent=times.length?fmt(Math.min(...times)):'—';if($('r87BestScore'))$('r87BestScore').textContent=scores.length?Math.max(...scores).toLocaleString():'—';
  }
  function renderLeaderboard(rows,period,metric,source,errorText){
    const box=$('leaderRows');if(!box)return;const list=sorted(periodRows(rows,period),metric).slice(0,50);
    box.innerHTML='<div class="leader-row head"><span>#</span><span>PLAYER</span><span>'+(metric==='fastest'?'TIME':'SCORE')+'</span><span>'+(metric==='fastest'?'SCORE':'TIME')+'</span><span>MODE</span></div>'+list.map((x,i)=>`<div class="leader-row${x.local?' local':''}"><span>${i+1}</span><b>${esc(x.player_name||'PLAYER')}</b><span>${metric==='fastest'?fmt(x.completion_seconds):Number(x.score||0).toLocaleString()}</span><span>${metric==='fastest'?Number(x.score||0).toLocaleString():fmt(x.completion_seconds)}</span><span>${esc(String(x.difficulty||'').toUpperCase())}</span></div>`).join('');
    if(!list.length)box.innerHTML+='<div class="r87-empty"><b>NO COMPLETED RUNS YET</b><span>Finish a full Ranked Run to put a real result here.</span></div>';
    const s=$('leadStatus');if(s){s.className='online-status'+(errorText?' bad':' good');s.textContent=(source==='online'?'ONLINE GLOBAL':'LOCAL DEVICE')+' · '+period.toUpperCase()+' · '+(metric==='fastest'?'FASTEST':'HIGH SCORE')+(errorText?' · '+errorText:'');}
  }
  function ensureMultiplayerUI(){
    const screen=$('multiplayer');if(!screen||$('r87MultiInfo'))return;const card=screen.querySelector('.online-card');
    const info=document.createElement('div');info.id='r87MultiInfo';info.className='r87-info-grid';info.innerHTML=`<div class="r87-stat"><b>BACKEND</b><span id="r87MpBackend">CHECKING…</span></div><div class="r87-stat"><b>ROOM</b><span id="r87MpRoom">NOT JOINED</span></div><div class="r87-stat"><b>PLAYERS</b><span id="r87MpPlayers">0</span></div><div class="r87-stat"><b>YOUR CALLSIGN</b><span id="r87MpCallsign">—</span></div>`;card.insertAdjacentElement('afterend',info);
    const tools=document.createElement('div');tools.className='row r87-room-tools';tools.innerHTML='<button class="btn small" id="r87CopyRoom">COPY ROOM CODE</button><button class="btn small" id="r87TestBackend">TEST CONNECTION</button>';info.insertAdjacentElement('afterend',tools);
    const help=document.createElement('div');help.className='r87-help';help.innerHTML='<b>HOW MULTIPLAYER WORKS</b><span>1. Create a room. 2. Send the room code to friends. 3. Everyone joins the same code. 4. Live floor, HP, difficulty and status appear below.</span><small>This is a live race/presence mode. Each player runs their own game locally.</small>';tools.insertAdjacentElement('afterend',help);
    $('r87CopyRoom').onclick=async()=>{const code=($('mpRoom')?.value||'').trim();if(!code)return setMpStatus('Create or join a room first.',true);try{await navigator.clipboard.writeText(code);setMpStatus('ROOM CODE '+code+' COPIED.',false);}catch(_){setMpStatus('ROOM CODE: '+code,false);}};$('r87TestBackend').onclick=()=>probeBackend(true);
  }
  function setMpStatus(msg,bad){const s=$('mpStatus');if(s){s.textContent=msg;s.className='online-status '+(bad?'bad':'good');}}
  function updateMpMeta(){if($('r87MpRoom'))$('r87MpRoom').textContent=($('mpRoom')?.value||'').trim()||'NOT JOINED';if($('r87MpCallsign'))$('r87MpCallsign').textContent=($('mpName')?.value||localStorage.getItem('ironfall.playerName')||'—');if($('r87MpPlayers'))$('r87MpPlayers').textContent=$('roomPlayers')?.querySelectorAll('.player-row').length||0;}
  async function probeBackend(verbose=false){
    const lb=$('r87LeadBackend'),mp=$('r87MpBackend');if(lb)lb.textContent='CHECKING…';if(mp)mp.textContent='CHECKING…';
    try{const r=await fetch(API+'/.netlify/functions/config',{cache:'no-store'});let body={};try{body=await r.json();}catch(_){}if(!r.ok||!body.url||!body.anonKey)throw new Error(r.status===503?'SUPABASE NOT CONFIGURED':'BACKEND '+r.status);if(lb){lb.textContent='ONLINE';lb.className='ok';}if(mp){mp.textContent='ONLINE';mp.className='ok';}if(verbose)setMpStatus('ONLINE BACKEND READY — rooms and live presence are available.',false);return true;
    }catch(e){const msg=e.message||'OFFLINE';if(lb){lb.textContent=msg;lb.className='bad';}if(mp){mp.textContent=msg;mp.className='bad';}if(verbose)setMpStatus('ONLINE BACKEND NOT READY — '+msg+'. Add the Supabase environment variables in Netlify.',true);return false;}
  }
  function installNetworkEnhancements(){
    if(!window.IronNet||window.IronNet.__r87)return;const net=window.IronNet;net.__r87=true;const oldSubmit=net.submitCompletion?.bind(net);net.submitCompletion=async run=>{saveRun(run);if(oldSubmit)return oldSubmit(run);};
    net.loadLeaderboard=async(period='daily',metric='fastest')=>{document.querySelectorAll('#periodTabs [data-period]').forEach(b=>b.classList.toggle('active',b.dataset.period===period));document.querySelectorAll('#metricTabs [data-metric]').forEach(b=>b.classList.toggle('active',b.dataset.metric===metric));const s=$('leadStatus');if(s)s.textContent='Loading rankings…';try{const r=await fetch(API+'/.netlify/functions/leaderboard?limit=50&period='+encodeURIComponent(period)+'&metric='+encodeURIComponent(metric),{cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||('HTTP '+r.status));renderLeaderboard(data.rows||[],period,metric,'online','');if($('r87LeadBackend')){$('r87LeadBackend').textContent='ONLINE';$('r87LeadBackend').className='ok';}}catch(e){renderLeaderboard(readLocal(),period,metric,'local','online service unavailable');if($('r87LeadBackend')){$('r87LeadBackend').textContent='LOCAL FALLBACK';$('r87LeadBackend').className='warn';}}updatePersonalBests();};
    const oldOpen=net.openMultiplayer?.bind(net);net.openMultiplayer=()=>{ensureMultiplayerUI();const r=oldOpen?.();setTimeout(()=>{updateMpMeta();probeBackend(false);},100);return r;};const oldCreate=net.createRoom?.bind(net);net.createRoom=()=>{const r=oldCreate?.();setTimeout(updateMpMeta,150);return r;};const oldJoin=net.joinFromUI?.bind(net);net.joinFromUI=()=>{const r=oldJoin?.();setTimeout(updateMpMeta,150);return r;};const oldLeave=net.leaveRoom?.bind(net);net.leaveRoom=async(...a)=>{const r=await oldLeave?.(...a);updateMpMeta();return r;};const oldReroll=net.rerollName?.bind(net);net.rerollName=()=>{const r=oldReroll?.();setTimeout(updateMpMeta,0);return r;};
  }
  function installCredits(){
    const screen=$('credits'),button=$('bCredits');if(!screen||!button)return;
    const sections=[['CREATION & DIRECTION',['CREATOR','FOUNDER','GAME DIRECTOR','CREATIVE DIRECTOR','EXECUTIVE PRODUCER','PROJECT LEAD','ORIGINAL CONCEPT']],['GAME DESIGN',['LEAD GAME DESIGN','GAMEPLAY DESIGN','SYSTEMS DESIGN','COMBAT DESIGN','LEVEL DESIGN','WORLD DESIGN','QUEST DESIGN','PROGRESSION DESIGN','DIFFICULTY DESIGN','BALANCE DESIGN','ECONOMY & REWARDS']],['COMBAT & CHARACTERS',['BOSS DESIGN','ENEMY DESIGN','MINI-BOSS DESIGN','CHARACTER DESIGN','PLAYER DESIGN','ABILITY DESIGN','WEAPON DESIGN','MELEE DESIGN','GRENADE DESIGN','THROWABLE DESIGN','POWER-UP DESIGN','WORKBENCH & PERK DESIGN']],['ONLINE SYSTEMS',['MULTIPLAYER DESIGN','LIVE RACE DESIGN','ROOM CODE SYSTEM','PRESENCE SYSTEM','RANKED MODE DESIGN','LEADERBOARD DESIGN','RUN VALIDATION','COMPETITIVE BALANCE']],['ENGINEERING',['GAMEPLAY PROGRAMMING','PLAYER CONTROLLER','ENEMY AI','BOSS AI','COMBAT PROGRAMMING','PHYSICS & COLLISION','SAVE & PERSISTENCE','UI PROGRAMMING','MENU PROGRAMMING','MULTIPLAYER PROGRAMMING','BACKEND INTEGRATION','DEPLOYMENT ENGINEERING']],['ART & PRESENTATION',['ART DIRECTION','VISUAL DESIGN','PIXEL ART DIRECTION','CHARACTER PIXEL ART','UI ART','HUD DESIGN','MENU ART','ENVIRONMENT ART','ANIMATION DIRECTION','EFFECTS DIRECTION','TYPOGRAPHY','COLOR & LIGHTING']],['FEEL, AUDIO & WORLD',['AUDIO DIRECTION','SOUND DESIGN DIRECTION','MUSIC DIRECTION','GAME FEEL','CAMERA DIRECTION','SCREEN SHAKE DESIGN','HIT-STOP DESIGN','WORLD & LORE','CHARACTER LORE','BOSS LORE','WRITING','NAMING & TONE']],['QUALITY & RELEASE',['QUALITY CONTROL','PLAYTESTING','BUG HUNTING','REGRESSION TESTING','BALANCE TESTING','UX TESTING','RELEASE TESTING','BUILD MANAGEMENT','VERSIONING','GITHUB MANAGEMENT','NETLIFY DEPLOYMENT','GITHUB PAGES DEPLOYMENT','POST-LAUNCH SUPPORT']]];
    screen.innerHTML='<h2 class="credits-title">IRONTRAP CREDITS</h2><div id="creditsViewport" tabindex="0"><div id="creditsRoll"><div class="r87-credit-hero"><b>IRONTRAP</b><span>A game created by</span><strong>Swaraj Singh</strong></div>'+sections.map(([h,roles])=>'<section class="r87-credit-section"><h3>'+h+'</h3>'+roles.map(r=>'<p><b>'+r+'</b><span>Swaraj Singh</span></p>').join('')+'</section>').join('')+'<section class="r87-credit-final"><h3>DEDICATION</h3><p>Every system, every floor, every boss, every character, every idea and every release of IRONTRAP is dedicated to <strong>Swaraj Singh</strong>.</p><p><b>SPECIAL THANKS</b><span>Swaraj Singh</span></p><p><b>MADE POSSIBLE BY</b><span>Swaraj Singh</span></p><p><b>FINAL CREATIVE AUTHORITY</b><span>Swaraj Singh</span></p><div class="r87-signoff">IRONTRAP<br><strong>Created by Swaraj Singh</strong></div><button id="creditsEgg" aria-label="secret dinosaur egg">🥚</button><div id="creditsEggMsg"></div></section></div></div><div id="creditsControls"><span id="creditsHint">AUTO-SCROLL · SCROLL ANY TIME</span><button class="btn small" id="bCreditsBack">BACK</button></div>';
    let raf=0,last=0,pos=0,pause=0;const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;};const tick=t=>{const v=$('creditsViewport');if(!v||!screen.classList.contains('show')){stop();return;}if(!last)last=t;const dt=Math.min(64,t-last);last=t;if(t>pause&&pos<v.scrollHeight-v.clientHeight-1){pos+=dt*.026;v.scrollTop=pos;}raf=requestAnimationFrame(tick);};const open=()=>{if(typeof show==='function')show('credits');const v=$('creditsViewport');pos=0;if(v)v.scrollTop=0;pause=performance.now()+900;stop();raf=requestAnimationFrame(tick);};
    button.addEventListener('click',e=>{e.stopImmediatePropagation();open();},true);$('bCreditsBack').onclick=()=>{stop();if(typeof show==='function')show('title');};$('creditsEgg').onclick=()=>{$('creditsEggMsg').textContent='AP';pause=performance.now()+7000;};['wheel','touchstart','pointerdown','keydown'].forEach(ev=>$('creditsViewport').addEventListener(ev,()=>pause=performance.now()+4500,{passive:true}));
  }
  function boot(){ensureLeaderboardUI();ensureMultiplayerUI();installNetworkEnhancements();installCredits();probeBackend(false);updateMpMeta();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);setTimeout(boot,600);
})();