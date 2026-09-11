(()=>{
  "use strict";
  const credits=document.getElementById("credits");
  if(!credits)return;

  const roles=[
    "CREATOR","FOUNDER","GAME DIRECTOR","CREATIVE DIRECTOR","EXECUTIVE PRODUCER","LEAD PRODUCER","ASSOCIATE PRODUCER","PROJECT LEAD","VISION & CONCEPT",
    "LEAD GAME DESIGN","SYSTEMS DESIGN","GAMEPLAY DESIGN","COMBAT DESIGN","LEVEL DESIGN","WORLD DESIGN","MISSION DESIGN","QUEST DESIGN","PROGRESSION DESIGN","DIFFICULTY DESIGN","BALANCE DESIGN","ECONOMY DESIGN","REWARD DESIGN",
    "BOSS DESIGN","ENEMY DESIGN","MINI-BOSS DESIGN","CHARACTER DESIGN","PLAYER DESIGN","ABILITY DESIGN","WEAPON DESIGN","MELEE DESIGN","GRENADE DESIGN","THROWABLE DESIGN","POWER-UP DESIGN","WORKBENCH DESIGN","PERK DESIGN","ACHIEVEMENT DESIGN",
    "MULTIPLAYER DESIGN","RANKED MODE DESIGN","LEADERBOARD DESIGN","ROOM CODE SYSTEM DESIGN","CALLSIGN SYSTEM DESIGN","COMPETITIVE BALANCE","RUN VALIDATION DESIGN",
    "GAMEPLAY PROGRAMMING","PLAYER CONTROLLER","ENEMY AI","BOSS AI","COMBAT PROGRAMMING","WEAPON PROGRAMMING","PHYSICS & COLLISION","SAVE SYSTEMS","PERSISTENCE SYSTEMS","UI PROGRAMMING","MENU PROGRAMMING","MULTIPLAYER PROGRAMMING","BACKEND INTEGRATION","DEPLOYMENT ENGINEERING",
    "ART DIRECTION","VISUAL DESIGN","PIXEL ART DIRECTION","CHARACTER PIXEL ART","UI ART","HUD DESIGN","MENU ART","ENVIRONMENT ART","EFFECTS DIRECTION","ANIMATION DIRECTION","TYPOGRAPHY","COLOR & LIGHTING",
    "AUDIO DIRECTION","SOUND DESIGN DIRECTION","MUSIC DIRECTION","IMPACT FEEL","GAME FEEL","CAMERA DIRECTION","SCREEN SHAKE DESIGN","HIT-STOP DESIGN","FEEDBACK DESIGN",
    "WORLD & LORE","SETTING DEVELOPMENT","CHARACTER LORE","BOSS LORE","WRITING","TEXT DESIGN","NAMING","TONE & STYLE",
    "QUALITY CONTROL","PLAYTESTING","BUG HUNTING","REGRESSION TESTING","BALANCE TESTING","UX TESTING","RELEASE TESTING","FINAL APPROVAL",
    "BUILD MANAGEMENT","VERSIONING","GITHUB MANAGEMENT","NETLIFY DEPLOYMENT","GITHUB PAGES DEPLOYMENT","DATABASE PLANNING","LIVE SYSTEMS PLANNING","POST-LAUNCH SUPPORT",
    "ORIGINAL IDEA","FINAL CREATIVE AUTHORITY","IRONTRAP UNIVERSE"
  ];

  const roleHtml=roles.map(r=>`<p><b>${r}</b>Swaraj Singh</p>`).join("");
  credits.innerHTML=`
    <h2 class="credits-title">CREDITS</h2>
    <div id="creditsViewport" tabindex="0" aria-label="IRONTRAP credits">
      <div id="creditsRoll">
        <p class="credits-opening"><b>IRONTRAP</b>A game by Swaraj Singh</p>
        ${roleHtml}
        <p class="credits-special"><b>SPECIAL THANKS</b>Swaraj Singh</p>
        <p class="credits-special"><b>MADE POSSIBLE BY</b>Swaraj Singh</p>
        <p class="credits-special"><b>DEDICATED TO</b>Swaraj Singh</p>
        <p class="credits-dedication">This game, its world, its characters, its systems, its battles, and its journey are dedicated to <strong>Swaraj Singh</strong>.</p>
        <p class="credits-signoff"><b>IRONTRAP</b>Created, directed, designed, and dedicated to Swaraj Singh</p>
        <button id="creditsEgg" aria-label="secret dinosaur egg" title="?">🥚</button>
        <div id="creditsEggMsg"></div>
      </div>
    </div>
    <div id="creditsControls"><span id="creditsHint">AUTO-SCROLL · WHEEL / ↑↓ TO BROWSE</span><button class="btn small" id="bCreditsBack">BACK</button></div>`;

  let raf=0,last=0,pauseUntil=0,pos=0;
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0};
  const frame=t=>{
    const v=document.getElementById("creditsViewport");
    if(!v||!credits.classList.contains("show")){stop();return;}
    if(!last)last=t;
    const dt=Math.min(60,t-last);last=t;
    if(t>=pauseUntil&&pos<v.scrollHeight-v.clientHeight-2){pos+=dt*.024;v.scrollTop=pos;}
    raf=requestAnimationFrame(frame);
  };
  const start=()=>{
    const v=document.getElementById("creditsViewport");
    pos=0;if(v)v.scrollTop=0;
    const msg=document.getElementById("creditsEggMsg");if(msg)msg.textContent="";
    pauseUntil=performance.now()+900;stop();raf=requestAnimationFrame(frame);
  };
  const b=document.getElementById("bCredits");if(b)b.addEventListener("click",start);
  const back=document.getElementById("bCreditsBack");if(back)back.addEventListener("click",()=>{stop();if(typeof show==="function")show("title");});
  const egg=document.getElementById("creditsEgg");if(egg)egg.addEventListener("click",()=>{const m=document.getElementById("creditsEggMsg");if(m)m.textContent="AP";pauseUntil=performance.now()+8000;});
  const viewport=document.getElementById("creditsViewport");if(viewport)["wheel","touchstart","pointerdown","keydown"].forEach(ev=>viewport.addEventListener(ev,()=>pauseUntil=performance.now()+5000,{passive:true}));
})();