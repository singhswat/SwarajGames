(()=>{
  "use strict";
  const BACKEND="https://irontrap.netlify.app";
  const nativeFetch=window.fetch.bind(window);
  const onStaticHost=location.hostname.endsWith("github.io");

  function routedUrl(value){
    if(!onStaticHost) return null;
    try{
      const u=new URL(value,location.href);
      const marker="/.netlify/functions/";
      const at=u.pathname.indexOf(marker);
      if(at<0) return null;
      return BACKEND+u.pathname.slice(at)+u.search+u.hash;
    }catch(_){ return null; }
  }

  window.IRONTRAP_API_ORIGIN=onStaticHost?BACKEND:location.origin;
  window.fetch=function(input,init){
    const raw=input instanceof Request?input.url:String(input);
    const target=routedUrl(raw);
    if(!target) return nativeFetch(input,init);
    if(input instanceof Request){
      const req=new Request(target,input);
      return nativeFetch(req,init);
    }
    return nativeFetch(target,init);
  };
})();
