(()=>{
  "use strict";

  // Human-style display names. Internal ids never change, so existing saves stay valid.
  const HUMAN_NAMES={
    rookie:"ALEX",
    tank:"MARCUS",
    swift:"ZAK",
    blade:"KAI",
    gunner:"MASON",
    demolition:"OWEN",
    reaper:"ELIAS",
    fortune:"LEO"
  };

  function applyHumanNames(){
    if(typeof R7_CHARACTERS==="undefined") return;
    R7_CHARACTERS.forEach(c=>{ if(HUMAN_NAMES[c.id]) c.name=HUMAN_NAMES[c.id]; });
  }
  applyHumanNames();

  function fixVault(){
    applyHumanNames();
    const scr=document.getElementById("r7CharacterScreen");
    const grid=document.getElementById("r7CharGrid");
    if(!scr||!grid) return;

    // Beat legacy inline flex centering, which made the first/last row unreachable on short screens.
    scr.style.setProperty("justify-content","flex-start","important");
    scr.style.setProperty("align-items","stretch","important");
    scr.style.setProperty("overflow-y","auto","important");
    scr.style.setProperty("height","100dvh","important");
    const inner=scr.firstElementChild;
    if(inner){
      inner.style.setProperty("width","min(1180px,100%)","important");
      inner.style.setProperty("max-width","1180px","important");
      inner.style.setProperty("margin","0 auto","important");
    }

    const cards=[...grid.children];
    // Re-label existing cards immediately in case the menu was created before this patch ran.
    cards.forEach((card,i)=>{
      const c=typeof R7_CHARACTERS!=="undefined"?R7_CHARACTERS[i]:null;
      if(!c) return;
      const title=card.querySelector("b");
      if(title) title.textContent=c.name;
      const cv=card.querySelector(".r7PixelThumb");
      if(cv){
        cv.setAttribute("aria-label",c.name+" pixel art portrait");
        if(typeof r7PaintPixelThumb==="function") r7PaintPixelThumb(cv,c);
      }
    });

    // A tiny sanity indicator makes it obvious all eight fighters loaded.
    if(inner&&!document.getElementById("r84RosterCount")){
      const head=inner.firstElementChild;
      const badge=document.createElement("div");
      badge.id="r84RosterCount";
      badge.textContent=cards.length+" / 8 FIGHTERS LOADED";
      if(head) head.insertAdjacentElement("afterend",badge); else inner.prepend(badge);
    } else {
      const badge=document.getElementById("r84RosterCount");
      if(badge) badge.textContent=cards.length+" / 8 FIGHTERS LOADED";
    }

    // Start at the actual top and keep all rows reachable with wheel/touch/keyboard scrolling.
    scr.scrollTop=0;
  }

  const prevMenu=typeof r7ShowCharacterMenu==="function"?r7ShowCharacterMenu:null;
  if(prevMenu){
    const upgradedMenu=function(){
      applyHumanNames();
      prevMenu();
      requestAnimationFrame(()=>{
        fixVault();
        requestAnimationFrame(fixVault);
      });
    };
    try{r7ShowCharacterMenu=upgradedMenu;}catch(_){window.r7ShowCharacterMenu=upgradedMenu;}
    window.r7ShowCharacterMenu=upgradedMenu;
  }

  // The main-menu vault button was created earlier with a function reference. Rebind it if present.
  const rebind=()=>{
    applyHumanNames();
    const b=document.getElementById("r7CharactersBtn");
    if(b&&typeof r7ShowCharacterMenu==="function") b.onclick=r7ShowCharacterMenu;
  };
  rebind();
  setTimeout(rebind,700);
})();
