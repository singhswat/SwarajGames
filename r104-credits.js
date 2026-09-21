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
let raf=0,last=0,pos=0,pauseUntil=0;
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
function tick(t){
 const screen=$("credits"),v=$("creditsViewport");
 if(!screen||!v||!screen.classList.contains("show")){stop();return;}
 if(!last)last=t;const dt=Math.min(64,t-last);last=t;
 if(t>pauseUntil&&pos<v.scrollHeight-v.clientHeight-1){pos+=dt*.026;v.scrollTop=pos;}
 raf=requestAnimationFrame(tick);
}
function start(){
 const v=$("creditsViewport");pos=0;if(v)v.scrollTop=0;
 pauseUntil=performance.now()+900;stop();raf=requestAnimationFrame(tick);
}
function build(){
 const screen=$("credits"),button=$("bCredits");if(!screen||!button)return false;
 screen.innerHTML='<h2 class="credits-title">IRONTRAP CREDITS</h2><div id="creditsViewport" tabindex="0" aria-label="IRONTRAP credits"><div id="creditsRoll"><div class="r87-credit-hero"><b>IRONTRAP</b><span>A game created by</span><strong>Swaraj the Almighty</strong></div>'+sections.map(([h,roles])=>'<section class="r87-credit-section"><h3>'+h+'</h3>'+roles.map(r=>'<p><b>'+r+'</b><span>Swaraj the Almighty</span></p>').join("")+'</section>').join("")+'<section class="r87-credit-final"><h3>FINAL CREDITS</h3><p>IRONTRAP — created, designed and developed by <strong>Swaraj the Almighty</strong>.</p><p><b>SPECIAL THANKS</b><span>Swaraj the Almighty</span></p><p><b>MADE POSSIBLE BY</b><span>Swaraj the Almighty</span></p><p><b>FINAL CREATIVE AUTHORITY</b><span>Swaraj the Almighty</span></p><div class="r87-signoff">IRONTRAP<br><strong>Created by Swaraj the Almighty</strong></div><button id="creditsEgg" aria-label="secret egg" title="?">🥚</button><div id="creditsEggMsg"></div></section></div></div><div id="creditsControls"><span id="creditsHint">AUTO-SCROLL · WHEEL / ↑↓ TO BROWSE</span><button class="btn small" id="bCreditsBack">BACK</button></div>';
 const back=$("bCreditsBack");if(back)back.onclick=()=>{stop();if(typeof show==="function")show("title");};
 const egg=$("creditsEgg");if(egg)egg.onclick=()=>{const m=$("creditsEggMsg");if(m)m.textContent="AP";pauseUntil=performance.now()+7000;};
 const v=$("creditsViewport");if(v)["wheel","touchstart","pointerdown","keydown"].forEach(ev=>v.addEventListener(ev,()=>pauseUntil=performance.now()+4500,{passive:true}));
 if(!button.dataset.r104Credits){button.addEventListener("click",e=>{e.stopImmediatePropagation();if(typeof show==="function")show("credits");build();start();},true);button.dataset.r104Credits="1";}
 return true;
}
function boot(){if(build())return;setTimeout(boot,100);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();