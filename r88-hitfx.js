(()=>{
  'use strict';
  const colFor=cls=>cls==='fire'?'#ff9b3d':cls==='energy'||cls==='shock'?'#8fd8ff':cls==='acid'?'#7ee081':cls==='explosive'?'#ffb03a':cls==='bullet'?'#fff3c4':'#e8e4dc';
  const safe=(fn,...args)=>{try{return fn&&fn(...args);}catch(_){}};
  if(typeof damageEnemy==='function'&&!damageEnemy.__r88){
    const baseDamage=damageEnemy;
    const wrapped=function(e,w,dir,raw){
      if(!e||e.dead)return baseDamage.apply(this,arguments);
      const before=Number(e.hp)||0, cls=(w&&w.cls)||'blade';
      e.__r88LastClass=cls;
      e.__r88LastDir=dir||1;
      const out=baseDamage.apply(this,arguments);
      const dealt=Math.max(0,before-(Number(e.hp)||0));
      if(dealt>0&&typeof G!=='undefined'&&G){
        const heavy=dealt>=55||cls==='explosive';
        G.freeze=Math.max(G.freeze||0,heavy?5:dealt>=28?3:2);
        G.shake=Math.max(G.shake||0,heavy?8:dealt>=28?4:2);
        if(heavy)G.flash=Math.max(G.flash||0,4);
        const cx=e.x+e.w/2,cy=e.y+e.h/2,c=colFor(cls);
        safe(typeof spark==='function'?spark:null,cx,cy,heavy?15:8,c,heavy?5.5:3.2,heavy?25:18);
        if(cls==='blade'){
          for(let i=0;i<(heavy?3:1);i++) setTimeout(()=>safe(typeof spark==='function'?spark:null,cx+(Math.random()-.5)*16,cy+(Math.random()-.5)*12,4,'#ffffff',3,12),i*18);
        }else if(cls==='bullet'||cls==='energy'){
          safe(typeof spark==='function'?spark:null,cx,cy,heavy?10:5,c,heavy?7:4,14);
        }else if(cls==='fire'){
          safe(typeof spark==='function'?spark:null,cx,cy,heavy?18:10,'#e2603c',4.5,30);
        }else if(cls==='acid'){
          safe(typeof spark==='function'?spark:null,cx,cy,heavy?16:9,'#7ee081',4,28);
        }
        if(heavy&&typeof popText==='function') popText(cx,e.y-20,'HEAVY HIT',c);
      }
      return out;
    };
    wrapped.__r88=true;
    damageEnemy=wrapped;
  }

  if(typeof killEnemy==='function'&&!killEnemy.__r88){
    const baseKill=killEnemy;
    const wrapped=function(e){
      if(!e||e.dead)return baseKill.apply(this,arguments);
      const d=(typeof ENEMIES!=='undefined'&&ENEMIES[e.type])||{};
      const cls=e.killedByEnvironment?'environment':(e.__r88LastClass||e.lastDamageClass||'blade');
      const cx=e.x+e.w/2,cy=e.y+e.h/2;
      const boss=!!d.isBoss,mini=!!d.isMiniBoss;
      const n=boss?46:mini?28:16;
      const c=cls==='environment'?'#7ee081':colFor(cls);
      if(typeof G!=='undefined'&&G){
        G.freeze=Math.max(G.freeze||0,boss?10:mini?7:4);
        G.shake=Math.max(G.shake||0,boss?25:mini?13:6);
        G.flash=Math.max(G.flash||0,boss?14:mini?8:3);
      }
      safe(typeof spark==='function'?spark:null,cx,cy,n,c,boss?8:mini?6:4.8,boss?46:34);
      if(cls==='explosive'||cls==='environment'){
        setTimeout(()=>safe(typeof spark==='function'?spark:null,cx,cy,Math.ceil(n*.65),'#f2c14e',7,34),35);
        setTimeout(()=>safe(typeof spark==='function'?spark:null,cx,cy,Math.ceil(n*.4),'#d9455f',5,28),70);
      }else if(cls==='fire'){
        safe(typeof popText==='function'?popText:null,cx,e.y-18,'INCINERATED','#ffb03a');
        for(let i=1;i<=3;i++)setTimeout(()=>safe(typeof spark==='function'?spark:null,cx+(Math.random()-.5)*e.w,cy,5,'#ff7b39',3.8,24),i*55);
      }else if(cls==='energy'||cls==='shock'){
        safe(typeof popText==='function'?popText:null,cx,e.y-18,'DISRUPTED','#8fd8ff');
        for(let i=0;i<4;i++)setTimeout(()=>safe(typeof spark==='function'?spark:null,cx,cy,6,i%2?'#fff':'#8fd8ff',6,18),i*30);
      }else if(cls==='acid'){
        safe(typeof popText==='function'?popText:null,cx,e.y-18,'DISSOLVED','#7ee081');
        for(let i=0;i<3;i++)setTimeout(()=>safe(typeof spark==='function'?spark:null,cx+(Math.random()-.5)*e.w,cy,7,'#7ee081',3.2,30),i*45);
      }else if(cls==='blade'){
        safe(typeof popText==='function'?popText:null,cx,e.y-18,'FINISH','#fff3c4');
        setTimeout(()=>safe(typeof spark==='function'?spark:null,cx+e.__r88LastDir*8,cy,8,'#fff',5.5,18),25);
      }
      if(boss){
        for(let i=1;i<=5;i++)setTimeout(()=>{
          safe(typeof spark==='function'?spark:null,cx+(Math.random()-.5)*e.w*.7,cy+(Math.random()-.5)*e.h*.6,14,i%2?'#f2c14e':'#ffffff',7,34);
          if(typeof G!=='undefined'&&G)G.shake=Math.max(G.shake||0,10-i);
        },i*90);
      }else if(mini){
        for(let i=1;i<=3;i++)setTimeout(()=>safe(typeof spark==='function'?spark:null,cx+(Math.random()-.5)*e.w*.5,cy,10,c,5,28),i*65);
      }
      return baseKill.apply(this,arguments);
    };
    wrapped.__r88=true;
    killEnemy=wrapped;
  }
  window.IRONTRAP_R88={hitFeedback:true,deathFX:true,version:'r88'};
})();
