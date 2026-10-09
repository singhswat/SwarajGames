(()=>{
"use strict";
if(window.__IRONTRAP_R104_CREDITS)return;window.__IRONTRAP_R104_CREDITS=true;
const $=id=>document.getElementById(id);
const sections=[
["CREATION & DIRECTION",["CREATOR","FOUNDER","GAME DIRECTOR","CREATIVE DIRECTOR","EXECUTIVE PRODUCER","PROJECT LEAD","ORIGINAL CONCEPT"]],
["GAME DESIGN",["LEAD GAME DESIGN","GAMEPLAY DESIGN","SYSTEMS DESIGN","COMBAT DESIGN","LEVEL DESIGN","WORLD DESIGN","QUEST DESIGN","PROGRESSION DESIGN","DIFFICULTY DESIGN","BALANCE DESIGN","ECONOMY & REWARDS"]],
["COMBAT & CLASSES",["BOSS DESIGN","ENEMY DESIGN","MINI-BOSS DESIGN","CLASS DESIGN","PLAYER DESIGN","ABILITY DESIGN","WEAPON DESIGN","MELEE DESIGN","GRENADE DESIGN","THROWABLE DESIGN","POWER-UP DESIGN","WORKBENCH & PERK DESIGN"]],
["ONLINE SYSTEMS",["MULTIPLAYER DESIGN","LIVE RACE DESIGN","ROOM CODE SYSTEM","PRESENCE SYSTEM","RANKED MODE DESIGN","LEADERBOARD DESIGN","RUN VALIDATION","COMPETITIVE BALANCE"]],
["ENGINEERING",["GAMEPLAY PROGRAMMING","PLAYER CONTROLLER","ENEMY AI","BOSS AI","COMBAT PROGRAMMING","PHYSICS & COLLISION","SAVE & PERSISTENCE","UI PROGRAMMING","MENU PROGRAMMING","MULTIPLAYER PROGRAMMING","BACKEND INTEGRATION","DEPLOYMENT ENGINEERING"]],
["ART & PRESENTATION",["ART DIRECTION","VISUAL DESIGN","PIXEL ART DIRECTION","CLASS PIXEL ART","UI ART","HUD DESIGN","MENU ART","ENVIRONMENT ART","ANIMATION DIRECTION","EFFECTS DIRECTION","TYPOGRAPHY","COLOR & LIGHTING"]],
["FEEL, AUDIO & WORLD",["AUDIO DIRECTION","SOUND DESIGN DIRECTION","MUSIC DIRECTION","GAME FEEL","CAMERA DIRECTION","SCREEN SHAKE DESIGN","HIT-STOP DESIGN","WORLD & LORE","CLASS LORE","BOSS LORE","WRITING","NAMING & TONE"]],
["QUALITY & RELEASE",["QUALITY CONTROL","PLAYTESTING","BUG HUNTING","REGRESSION TESTING","BALANCE TESTING","UX TESTING","RELEASE TESTING","BUILD MANAGEMENT","VERSIONING","GITHUB MANAGEMENT","DEPLOYMENT ENGINEERING","POST-LAUNCH SUPPORT"]]
];
let origin=null,raf=0,last=0,pos=0,pauseUntil=0,paused=false;
let screen=null,baseShow=null;
function clearInputs(){for(const k in keys)keys[k]=false;for(const k in pressed)pressed[k]=false;}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
function detach(){stop();origin=null;clearInputs();}
function status(t){
 const v=$("creditsViewport"),max=Math.max(0,v.scrollHeight-v.clientHeight);
 const label=paused?"Paused":v.scrollTop>=max-1?"Complete":t<pauseUntil?"Browsing":"Rolling";
 if($("creditsStatus").textContent!==label)$("creditsStatus").textContent=label;
 $("creditsProgress").textContent=(max?Math.round(v.scrollTop/max*100):100)+"%";
 const b=$("bCreditsPause");b.textContent=paused?">":"||";
 b.title=paused?"Resume credits":"Pause credits";b.setAttribute("aria-label",b.title);b.setAttribute("aria-pressed",String(paused));
}
function frame(t){
 raf=0;
 if(!origin)return;
 if(mode!=="credits"){
  detach();const destination=mode==="play"&&G&&P&&!P.dead&&!G.done?null:SCREENS.includes(mode)?mode:"title";
  if(destination==="title")mode="title";baseShow(destination);return;
 }
 if(!screen.classList.contains("show")){close();return;}
 const v=$("creditsViewport");
 const dt=last?Math.min(64,Math.max(0,t-last)):0;last=t;
 if(paused||t<pauseUntil)pos=v.scrollTop;
 else{
  // Keep a fractional accumulator at high refresh rates and adopt manual scrolling.
  pos=Math.min(Math.max(0,v.scrollHeight-v.clientHeight),pos+dt*.035);
  v.scrollTop=pos;
 }
 status(t);raf=requestAnimationFrame(frame);
}
function manual(){pauseUntil=performance.now()+4500;pos=$("creditsViewport").scrollTop;}
function togglePause(){if(!origin)return;paused=!paused;pauseUntil=0;pos=$("creditsViewport").scrollTop;last=performance.now();status(last);}
function open(){
 if(origin)return true;
 if(window.IronTrapArcade&&window.IronTrapArcade.session)return false;
 const previous=currentScreen();
 origin={mode,screen:previous&&previous.id,floor:G,player:P,dead:P&&P.dead,done:G&&G.done,focus:document.activeElement};
 clearInputs();mode="credits";baseShow("credits");
 pos=0;$("creditsViewport").scrollTop=0;$("creditsEggMsg").textContent="";
 paused=matchMedia("(prefers-reduced-motion: reduce)").matches;
 pauseUntil=performance.now()+900;stop();status(performance.now());
 $("bCreditsBack").focus({preventScroll:true});raf=requestAnimationFrame(frame);
 return true;
}
function close(){
 if(!origin)return;
 const previous=origin;
 detach();
 const same=G===previous.floor&&P===previous.player&&(!P||P.dead===previous.dead)&&(!G||G.done===previous.done);
 if(same&&previous.mode==="play"&&!previous.screen&&G&&P&&!P.dead&&!G.done)resumeGame();
 else if(same&&previous.screen&&SCREENS.includes(previous.screen)){
  mode=previous.screen==="title"?"title":previous.mode;baseShow(previous.screen);
 }else{mode="title";baseShow("title");}
 if(previous.focus&&previous.focus.isConnected&&previous.focus.offsetParent!==null)previous.focus.focus({preventScroll:true});
}
function build(){
 screen=$("credits");
 if(!screen){screen=document.createElement("div");screen.id="credits";screen.className="screen";document.body.append(screen);}
 if(!SCREENS.includes("credits"))SCREENS.push("credits");
 screen.setAttribute("role","dialog");screen.setAttribute("aria-modal","true");screen.setAttribute("aria-labelledby","r104CreditsTitle");
 // Back precedes every scrollable button so the menu navigator cannot jump to the end.
 screen.innerHTML='<header class="r104-header"><h2 class="credits-title" id="r104CreditsTitle">IRONTRAP CREDITS</h2><button class="btn small" id="bCreditsBack">BACK</button></header><div id="creditsViewport" tabindex="0" aria-label="IRONTRAP credits"><div id="creditsRoll"><div class="r104-hero"><b>IRONTRAP</b><span>A game created by</span><strong>Swaraj the Almighty</strong></div>'+sections.map(([h,roles])=>'<section class="r104-section"><h3>'+h+'</h3>'+roles.map(r=>'<p><b>'+r+'</b><span>Swaraj the Almighty</span></p>').join("")+'</section>').join("")+'<section class="r104-section"><h3>FINAL CREDITS</h3><p>IRONTRAP - created, designed and developed by <strong>Swaraj the Almighty</strong>.</p><p><b>SPECIAL THANKS</b><span>Swaraj the Almighty</span></p><p><b>MADE POSSIBLE BY</b><span>Swaraj the Almighty</span></p><p><b>FINAL CREATIVE AUTHORITY</b><span>Swaraj the Almighty</span></p><p>IRONTRAP<br><strong>Created by Swaraj the Almighty</strong></p><button id="creditsEgg" aria-label="Secret credit" title="Secret credit">*</button><div id="creditsEggMsg"></div></section></div></div><footer id="creditsControls"><span id="creditsStatus" role="status">Rolling</span><span id="creditsProgress">0%</span><button class="btn small" id="bCreditsPause" title="Pause credits" aria-label="Pause credits">||</button></footer>';
 const style=document.createElement("style");style.id="r104CreditsStyle";
 style.textContent=`
 #credits{position:fixed;inset:0;z-index:2000;background:#06080c;isolation:isolate;overflow:hidden;box-sizing:border-box;padding:16px;gap:12px;align-items:stretch;justify-content:flex-start;text-align:center;letter-spacing:0}
 #credits::before,#credits::after{content:none}
 #credits .r104-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:0 0 auto;max-width:760px;width:100%;margin:0 auto}
 #credits .credits-title{position:static;margin:0;min-width:0;font-size:20px;line-height:1.3;letter-spacing:0;overflow-wrap:anywhere;text-align:left}
 #credits button{min-width:44px;min-height:44px;border-radius:4px;letter-spacing:0;flex-shrink:0}
 #credits button:focus-visible,#creditsViewport:focus-visible{outline:2px solid #69d9e8;outline-offset:2px}
 #creditsViewport{position:relative;inset:auto;flex:1 1 0;min-height:0;width:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;scroll-behavior:auto;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
 #creditsViewport::-webkit-scrollbar{display:block;width:6px}#creditsViewport::-webkit-scrollbar-thumb{background:#596473}
 #creditsRoll{width:100%;max-width:700px;margin:0 auto;box-sizing:border-box;padding:0 12px 48px;letter-spacing:0}
 #credits .r104-hero{min-height:180px;display:flex;flex-direction:column;justify-content:center;gap:10px;margin-bottom:28px}
 #credits .r104-hero b{font-size:28px;color:#f2c14e}#credits .r104-hero span{font:13px Consolas,monospace;color:#aab5c5}#credits .r104-hero strong{font-size:20px;line-height:1.4;overflow-wrap:anywhere;color:#edf1f4}
 #credits .r104-section{margin:0 0 52px}#credits .r104-section h3{font-size:13px;line-height:1.4;margin:0 0 24px;letter-spacing:0;color:#f2c14e}
 #credits .r104-section p{max-width:620px;display:grid;gap:6px;margin:0 auto 22px;font-size:15px;line-height:1.5;letter-spacing:0;overflow-wrap:anywhere;color:#dbe2eb}
 #credits .r104-section p b{font-size:12px;letter-spacing:0;margin:0;color:#aab5c5}#credits .r104-section p span{font-size:16px;color:#edf1f4}
 #creditsControls{position:static;flex:0 0 auto;max-width:760px;width:100%;margin:0 auto;display:flex;align-items:center;gap:12px;justify-content:flex-end;pointer-events:auto}
 #creditsStatus{margin-right:auto;font:12px Consolas,monospace;color:#aab5c5}#creditsProgress{font:12px Consolas,monospace;color:#f2c14e}
 #creditsEgg{font-size:24px;background:none;border:0;color:#f2c14e;padding:8px}#creditsEggMsg{min-height:28px;color:#f2c14e;font-weight:bold;letter-spacing:0}
 @media(max-width:480px),(max-height:400px){#credits{padding:10px;gap:8px}#credits .credits-title{font-size:17px}#credits .r104-hero{min-height:140px}}
 `;
 document.head.append(style);
 for(const event of ["wheel","touchstart","pointerdown"])$("creditsViewport").addEventListener(event,manual,{passive:true});
 $("creditsEgg").addEventListener("click",()=>{$("creditsEggMsg").textContent="AP";manual();});
}
function boot(){
 build();baseShow=show;
 show=function(id,...args){
  if(id==="credits")return open();
  if(origin&&mode==="credits"&&(!id||!SCREENS.includes(id)))return close();
  if(origin){detach();if(mode==="credits")mode=id||"title";}
  return baseShow.call(this,id,...args);
 };
 const baseBack=navBack;
 navBack=function(...args){if(origin)return close();return baseBack.apply(this,args);};
 // Capture before old target-level handlers; one controller owns credits navigation.
 window.addEventListener("click",event=>{
  const target=event.target.closest&&event.target.closest("#bCredits,#bCreditsBack,#bCreditsPause");
  if(!target)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(target.id==="bCredits")open();else if(target.id==="bCreditsBack")close();else togglePause();
 },true);
 window.addEventListener("keydown",event=>{
  if(!origin){
   if(document.activeElement&&document.activeElement.id==="bCredits"&&["Enter","Space","NumpadEnter"].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)open();}
   return;
  }
  event.stopImmediatePropagation();
  if(event.code==="Tab"){
   const items=[...screen.querySelectorAll("button,#creditsViewport")],first=items[0],last=items[items.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
   return;
  }
  event.preventDefault();
  if(event.code==="Escape"||event.code==="Backspace"||((save.binds&&save.binds.menu)||[]).includes(event.code)){close();return;}
  if(["Enter","Space","NumpadEnter"].includes(event.code)){
   if(event.repeat)return;
   if(document.activeElement&&document.activeElement.tagName==="BUTTON")document.activeElement.click();else togglePause();
   return;
  }
  const v=$("creditsViewport");
  const moves={ArrowDown:52,KeyS:52,ArrowUp:-52,KeyW:-52,PageDown:v.clientHeight*.8,PageUp:-v.clientHeight*.8};
  if(event.code==="Home"||event.code==="End"||Object.prototype.hasOwnProperty.call(moves,event.code)){
   manual();v.scrollTop=event.code==="Home"?0:event.code==="End"?v.scrollHeight:v.scrollTop+moves[event.code];pos=v.scrollTop;
  }
 },true);
 window.addEventListener("keyup",event=>{if(origin){event.preventDefault();event.stopImmediatePropagation();}},true);
 const background=()=>{if(origin&&!paused)togglePause();};
 window.addEventListener("blur",background);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)background();});
 new MutationObserver(()=>{if(origin&&!screen.classList.contains("show")){if(mode==="credits")close();else detach();}}).observe(screen,{attributes:true,attributeFilter:["class"]});
 window.IronTrapCredits={open,close,get active(){return !!origin;},get running(){return !!raf;}};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
