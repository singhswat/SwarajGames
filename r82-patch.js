(()=>{
  "use strict";
  // Keep the original internal id so old saves remain compatible.
  const chars=typeof R7_CHARACTERS!=="undefined"?R7_CHARACTERS:[];
  const rookie=chars.find(c=>c.id==="rookie"); if(rookie) rookie.name="ZAK";
  if(typeof SCREENS!=="undefined"&&!SCREENS.includes("credits")) SCREENS.push("credits");

  const credits=document.getElementById("credits");
  if(credits){
    credits.innerHTML=`<h2 class="credits-title">CREDITS</h2><div id="creditsViewport" tabindex="0" aria-label="Iron Trap credits"><div id="creditsRoll">
      <p><b>CREATOR &amp; GAME DIRECTOR</b>Swaraj Singh</p><p><b>LEAD GAME DESIGN</b>Swaraj Singh</p><p><b>GAMEPLAY DESIGN</b>Swaraj Singh</p><p><b>LEVEL DESIGN</b>Swaraj Singh</p><p><b>COMBAT DESIGN</b>Swaraj Singh</p><p><b>BOSS &amp; ENEMY DESIGN</b>Swaraj Singh</p><p><b>CHARACTER DESIGN</b>Swaraj Singh</p><p><b>WEAPON DESIGN</b>Swaraj Singh</p><p><b>QUEST DESIGN</b>Swaraj Singh</p><p><b>PROGRESSION &amp; BALANCE</b>Swaraj Singh</p><p><b>UI / UX DIRECTION</b>Swaraj Singh</p><p><b>ART DIRECTION</b>Swaraj Singh</p><p><b>WORLD &amp; LORE</b>Swaraj Singh</p><p><b>MULTIPLAYER DESIGN</b>Swaraj Singh</p><p><b>LEADERBOARD DESIGN</b>Swaraj Singh</p><p><b>QUALITY CONTROL</b>Swaraj Singh</p><p><b>PRODUCTION</b>Swaraj Singh</p><p><b>EXECUTIVE PRODUCER</b>Swaraj Singh</p><p class="credits-game"><b>IRONTRAP</b>Created by Swaraj Singh</p>
      <button id="creditsEgg" aria-label="secret dinosaur egg" title="?" style="font-size:28px;background:none;border:0;cursor:pointer;padding:18px">🥚</button><div id="creditsEggMsg" style="min-height:28px;font-weight:bold;color:var(--gold)"></div></div></div><div id="creditsControls"><span id="creditsHint">AUTO-SCROLL · WHEEL / ↑↓ TO BROWSE</span><button class="btn small" id="bCreditsBack">BACK</button></div>`;
  }

  let raf=0,last=0,pauseUntil=0,pos=0;
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0};
  const frame=t=>{const v=document.getElementById("creditsViewport");if(!v||!credits.classList.contains("show")){stop();return}if(!last)last=t;const dt=Math.min(60,t-last);last=t;if(t>=pauseUntil&&pos<v.scrollHeight-v.clientHeight-2){pos+=dt*.026;v.scrollTop=pos}raf=requestAnimationFrame(frame)};
  const start=()=>{if(!credits)return;const v=document.getElementById("creditsViewport");pos=0;if(v)v.scrollTop=0;const msg=document.getElementById("creditsEggMsg");if(msg)msg.textContent="";pauseUntil=performance.now()+900;stop();raf=requestAnimationFrame(frame)};
  const creditBtn=document.getElementById("bCredits"); if(creditBtn)creditBtn.addEventListener("click",start);
  const back=document.getElementById("bCreditsBack"); if(back)back.addEventListener("click",()=>{stop();if(typeof show==="function")show("title")});
  const egg=document.getElementById("creditsEgg"); if(egg)egg.addEventListener("click",()=>{document.getElementById("creditsEggMsg").textContent="AP";pauseUntil=performance.now()+8000});
  const viewport=document.getElementById("creditsViewport"); if(viewport)["wheel","touchstart","pointerdown","keydown"].forEach(ev=>viewport.addEventListener(ev,()=>pauseUntil=performance.now()+5000,{passive:true}));

  const themes={rookie:["#d9a06a","#2b1b13","#3a86ff","#202938","#d9e2ec"],tank:["#b97850","#362016","#b82e3c","#451820","#a8b2bd"],swift:["#e1a875","#f6c945","#ffe14f","#3a3f52","#8cecff"],blade:["#c98d67","#16161a","#6f2dbd","#1d1730","#efe9ff"],gunner:["#d8a17c","#492f22","#42b883","#19342b","#dfe7ef"],demolition:["#a96f4b","#3e281a","#e67e22","#4a2c12","#ffcf5c"],reaper:["#d1a080","#161419","#8f1738","#211019","#e9edf2"],fortune:["#c98d65","#392518","#00b894","#153a31","#ffd166"]};
  function paint(cv,c){const g=cv.getContext("2d"),t=themes[c.id]||themes.rookie,p=6,r=(x,y,w,h,k)=>{g.fillStyle=k;g.fillRect(x*p,y*p,w*p,h*p)};g.imageSmoothingEnabled=false;g.fillStyle="#080b12";g.fillRect(0,0,96,72);for(let x=0;x<16;x++){let h=(x*7+c.id.length*3)%5+1;r(x,9-h,1,h,"#111827")}r(0,10,16,2,"#0d1118");r(5,10,6,1,"#020304");r(6,7,1,3,t[3]);r(9,7,1,3,t[3]);r(5,4,6,4,t[2]);r(6,1,4,3,t[0]);r(6,1,4,1,t[1]);r(6,2,1,1,t[1]);r(9,2,1,1,"#111");r(4,5,1,3,t[0]);r(11,5,1,3,t[0]);if(c.id==="tank"){r(4,3,8,1,"#5b121c");r(4,4,1,4,"#5b121c");r(11,4,1,4,"#5b121c");r(12,5,2,1,t[4])}else if(c.id==="swift"){r(10,0,1,2,"#8cecff");r(11,0,1,1,"#fff");r(3,6,3,1,t[4]);r(2,6,1,1,"#fff")}else if(c.id==="blade"){r(12,2,1,7,t[4]);r(13,1,1,2,"#fff");r(4,4,1,4,"#2b163e")}else if(c.id==="gunner"){r(11,5,4,1,t[4]);r(13,6,2,1,"#697784")}else if(c.id==="demolition"){r(12,5,2,2,"#3a342c");r(13,4,1,1,"#ffcf5c")}else if(c.id==="reaper"){r(4,0,7,1,"#2a0c16");r(3,1,1,5,"#2a0c16");r(12,3,1,6,t[4]);r(13,2,2,1,t[4])}else if(c.id==="fortune"){r(12,4,2,2,"#ffd166");r(13,3,1,1,"#fff1a8")}else{r(11,5,3,1,t[4]);r(13,4,1,1,"#fff")}g.fillStyle=c.col;g.fillRect(0,68,96,4)}
  function decorate(){const grid=document.getElementById("r7CharGrid");if(!grid)return;[...grid.children].forEach((card,i)=>{if(card.querySelector(".r7PixelThumb")||!chars[i])return;const old=card.firstElementChild,cv=document.createElement("canvas");cv.className="r7PixelThumb";cv.width=96;cv.height=72;cv.setAttribute("aria-label",chars[i].name+" pixel art portrait");if(old)old.replaceWith(cv);else card.prepend(cv);paint(cv,chars[i])})}
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  setInterval(decorate,700);
})();
