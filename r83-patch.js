(()=>{
  "use strict";
  const SKINS={
    rookie:{name:"ZAK",skin:"#d8a174",hair:"#1a1d26",shirt:"#2878d0",shorts:"#18253a",socks:"#52d6ff",dark:"#0d1626",light:"#9cecff",metal:"#dce8f2"},
    tank:{name:"TITAN",skin:"#b97850",hair:"#261612",shirt:"#a92132",shorts:"#43151d",socks:"#c9d2da",dark:"#4f0f19",light:"#ff707f",metal:"#aab7c4"},
    swift:{name:"VOLT",skin:"#e1a875",hair:"#efc13e",shirt:"#f1c928",shorts:"#34394c",socks:"#71e7ff",dark:"#725d0a",light:"#ecfbff",metal:"#8ff1ff"},
    blade:{name:"RONIN",skin:"#c98d67",hair:"#121318",shirt:"#6323a5",shorts:"#20162d",socks:"#c792ff",dark:"#2c1246",light:"#ead7ff",metal:"#f4f2ff"},
    gunner:{name:"ACE",skin:"#d8a17c",hair:"#3b291f",shirt:"#238b61",shorts:"#173229",socks:"#8be8bc",dark:"#0c4732",light:"#d7ffeb",metal:"#dce7ee"},
    demolition:{name:"BOOMER",skin:"#a96f4b",hair:"#302016",shirt:"#c76513",shorts:"#4a2b13",socks:"#ffbd4a",dark:"#633006",light:"#ffe09a",metal:"#454a50"},
    reaper:{name:"REAPER",skin:"#d0a080",hair:"#111218",shirt:"#74152e",shorts:"#211018",socks:"#ef476f",dark:"#270811",light:"#ffc0d0",metal:"#e7edf2"},
    fortune:{name:"LUCKY",skin:"#c98d65",hair:"#362217",shirt:"#07966f",shorts:"#123c31",socks:"#ffd166",dark:"#064d3a",light:"#b8ffe9",metal:"#ffd166"}
  };

  if(typeof R7_CHARACTERS!=="undefined"){
    const z=R7_CHARACTERS.find(c=>c.id==="rookie"); if(z) z.name="ZAK";
  }

  function skinFor(id){return SKINS[id]||SKINS.rookie;}

  function paintThumb(cv,c){
    if(!cv||!cv.getContext)return;
    const g=cv.getContext("2d"), s=skinFor(c.id), W=cv.width, H=cv.height, p=4;
    g.imageSmoothingEnabled=false; g.clearRect(0,0,W,H);
    const r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x*p,y*p,w*p,h*p)};
    g.fillStyle="#060910";g.fillRect(0,0,W,H);
    r(0,14,24,4,"#0b111c");
    for(let x=0;x<24;x++){const hh=((x*5+c.id.length*3)%4)+1;r(x,14-hh,1,hh,x%3?"#111a28":"#162235");}
    r(7,15,10,1,"#020305");
    r(9,10,2,4,s.shorts);r(13,10,2,4,s.shorts);r(8,14,3,1,"#05070a");r(13,14,3,1,"#05070a");
    r(8,6,8,5,s.shirt);r(7,7,1,4,s.skin);r(16,7,1,4,s.skin);
    r(9,2,6,4,s.skin);r(9,1,6,2,s.hair);r(9,2,1,2,s.hair);
    r(14,3,1,1,"#07090c");

    switch(c.id){
      case "rookie":
        r(8,6,8,1,s.light);r(8,8,2,2,s.dark);r(15,7,1,3,s.dark);
        r(16,8,5,1,s.metal);r(20,7,1,1,"#ffffff");
        r(6,4,2,1,s.light);r(7,5,1,1,s.light);
        break;
      case "tank":
        r(7,5,10,2,s.dark);r(6,6,2,4,s.dark);r(16,6,2,4,s.dark);
        r(9,1,6,1,s.metal);r(9,2,1,2,s.dark);r(14,2,1,2,s.dark);
        r(10,7,4,3,"#7d1826");r(17,8,4,2,s.metal);
        break;
      case "swift":
        r(8,6,8,1,s.light);r(15,3,3,1,s.metal);r(16,2,1,1,"#ffffff");
        r(6,8,2,1,s.metal);r(5,8,1,1,"#ffffff");
        r(17,6,1,1,s.light);r(18,5,1,1,"#ffffff");r(18,7,1,1,"#ffffff");
        break;
      case "blade":
        r(8,5,8,2,s.dark);r(8,8,8,1,"#dca8ff");r(10,0,3,1,s.hair);r(11,1,1,1,s.hair);
        r(17,3,1,10,s.metal);r(18,2,1,2,"#ffffff");r(16,10,3,1,"#7a4aa3");
        break;
      case "gunner":
        r(8,6,8,1,s.light);r(9,7,2,3,s.dark);r(13,7,2,3,s.dark);
        r(8,1,7,1,s.dark);r(14,2,2,1,s.dark);r(16,8,6,1,s.metal);r(19,9,3,1,"#697885");
        r(7,3,1,2,"#9fffd0");
        break;
      case "demolition":
        r(8,6,8,1,s.light);r(7,6,2,5,s.dark);r(15,6,2,5,s.dark);
        r(9,2,2,1,"#ffcf5c");r(13,2,2,1,"#ffcf5c");r(17,7,3,3,"#34383d");
        r(18,6,1,1,"#ffcf5c");r(18,5,1,1,"#ff6b35");r(18,4,1,1,"#fff1a8");
        break;
      case "reaper":
        r(8,1,8,1,s.dark);r(7,2,2,8,s.dark);r(15,2,2,8,s.dark);r(9,2,6,4,"#d7d9dc");
        r(10,3,1,1,"#30020c");r(13,3,1,1,"#30020c");r(11,5,2,1,"#6d1428");
        r(18,3,1,11,s.metal);r(19,2,4,1,s.metal);r(22,3,1,1,s.metal);
        break;
      case "fortune":
        r(8,6,8,1,s.light);r(10,8,4,1,s.metal);r(8,0,8,1,s.dark);r(9,1,6,1,s.dark);r(10,0,4,1,s.dark);
        r(9,1,6,1,s.metal);r(17,7,3,3,s.metal);r(18,6,1,1,"#fff1a8");
        r(6,4,1,1,s.metal);r(5,3,1,1,"#fff1a8");
        break;
    }
    g.strokeStyle=c.col||s.light;g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);
    g.fillStyle=c.col||s.light;g.fillRect(0,H-4,W,4);
  }

  try{ r7PaintPixelThumb=paintThumb; }catch(_){ window.r7PaintPixelThumb=paintThumb; }

  const originalDraw=typeof drawPlayer==="function"?drawPlayer:null;
  function drawGear(id){
    if(typeof ctx==="undefined"||typeof P==="undefined")return;
    const g=ctx,s=skinFor(id),x=P.x|0,y=P.y|0,w=P.w,h=P.h,face=P.face||1;
    g.save();
    switch(id){
      case "rookie":
        g.fillStyle=s.light;g.fillRect(x+1,y+h*.34,w-2,2);g.fillRect(x+(face>0?0:w-3),y+h*.25,3,6);
        break;
      case "tank":
        g.fillStyle=s.dark;g.fillRect(x-3,y+h*.28,5,10);g.fillRect(x+w-2,y+h*.28,5,10);
        g.fillStyle=s.metal;g.fillRect(x+3,y+1,w-6,2);g.fillStyle="#7d1826";g.fillRect(x+5,y+h*.35,w-10,9);
        break;
      case "swift":
        g.fillStyle=s.metal;g.fillRect(x+(face>0?w-6:3),y+6,5,2);g.fillStyle=s.light;g.fillRect(x+2,y+h*.31,w-4,2);
        if(frame%4<2){g.fillStyle="#dffbff";g.fillRect(x+(face>0?-4:w+2),y+h*.45,3,2);}
        break;
      case "blade":
        g.fillStyle=s.dark;g.fillRect(x+1,y+h*.28,w-2,4);g.fillStyle="#dca8ff";g.fillRect(x+3,y+h*.54,w-6,2);
        g.fillStyle=s.metal;g.fillRect(x+(face>0?1:w-2),y+4,2,h-8);g.fillRect(x+(face>0?0:w-4),y+3,4,2);
        break;
      case "gunner":
        g.fillStyle=s.dark;g.fillRect(x+2,y+h*.31,5,12);g.fillRect(x+w-7,y+h*.31,5,12);
        g.fillRect(x+2,y,w-4,3);g.fillRect(x+(face>0?w-2:-2),y+2,4,2);g.fillStyle=s.light;g.fillRect(x+(face>0?w-4:2),y+6,2,2);
        break;
      case "demolition":
        g.fillStyle=s.dark;g.fillRect(x-3,y+h*.3,4,15);g.fillStyle="#34383d";g.fillRect(x+w-1,y+h*.32,5,10);
        g.fillStyle="#ffcf5c";g.fillRect(x+4,y+5,4,2);g.fillRect(x+w-8,y+5,4,2);
        if(frame%8<4){g.fillStyle="#ff7849";g.fillRect(x+w+3,y+h*.28,2,2);}
        break;
      case "reaper":
        g.fillStyle=s.dark;g.fillRect(x-2,y,4,h*.66);g.fillRect(x+w-2,y,4,h*.66);g.fillRect(x+1,y-2,w-2,4);
        g.fillStyle="#d8d8da";g.fillRect(x+5,y+5,w-10,6);g.fillStyle="#30020c";g.fillRect(x+(face>0?w-8:5),y+7,2,2);
        break;
      case "fortune":
        g.fillStyle=s.dark;g.fillRect(x+1,y-3,w-2,4);g.fillRect(x+3,y-7,w-6,5);g.fillStyle=s.metal;g.fillRect(x+3,y-3,w-6,2);
        g.fillRect(x+4,y+h*.47,w-8,2);if(frame%12===0){g.fillStyle="#fff4b7";g.fillRect(x+w+2,y+3,2,2);}
        break;
    }
    g.restore();
  }
  if(originalDraw){
    const enhanced=function(){
      const id=(typeof r7Char==="function"?r7Char().id:"rookie"), s=skinFor(id), prev=save.skin;
      const pal={skin:s.skin,hair:s.hair,shirt:s.shirt,shorts:s.shorts,socks:s.socks};
      if(id==="rookie"&&prev){pal.skin=prev.skin||pal.skin;pal.hair=prev.hair||pal.hair;}
      try{save.skin=pal;originalDraw();}finally{save.skin=prev;}
      drawGear(id);
    };
    try{drawPlayer=enhanced;}catch(_){window.drawPlayer=enhanced;}
  }

  function refreshVault(){
    const grid=document.getElementById("r7CharGrid"); if(!grid||typeof R7_CHARACTERS==="undefined")return;
    const cards=[...grid.children];
    cards.forEach((card,i)=>{const c=R7_CHARACTERS[i],cv=card.querySelector(".r7PixelThumb");if(c&&cv)paintThumb(cv,c);});
    const scr=document.getElementById("r7CharacterScreen"); if(scr){scr.scrollTop=0;}
  }
  const originalMenu=typeof r7ShowCharacterMenu==="function"?r7ShowCharacterMenu:null;
  if(originalMenu){
    const menu=function(){originalMenu();requestAnimationFrame(refreshVault);};
    try{r7ShowCharacterMenu=menu;}catch(_){window.r7ShowCharacterMenu=menu;}
    window.r7ShowCharacterMenu=menu;
  }
})();
