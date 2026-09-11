const ALLOWED_ORIGINS=new Set([
  "https://irontrap.netlify.app",
  "https://singhswat.github.io"
]);
function headers(req){
  const origin=req.headers.get("origin")||"";
  const h={
    "content-type":"application/json",
    "cache-control":"no-store",
    "access-control-allow-methods":"GET,OPTIONS",
    "access-control-allow-headers":"content-type",
    "vary":"Origin"
  };
  if(ALLOWED_ORIGINS.has(origin))h["access-control-allow-origin"]=origin;
  return h;
}
export default async(req)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
  const url=Netlify.env.get("SUPABASE_URL")||"";
  const anonKey=Netlify.env.get("SUPABASE_ANON_KEY")||"";
  return new Response(JSON.stringify({url,anonKey,error:url&&anonKey?undefined:"Multiplayer backend is not configured on Netlify."}),{
    status:url&&anonKey?200:503,
    headers:headers(req)
  });
};
