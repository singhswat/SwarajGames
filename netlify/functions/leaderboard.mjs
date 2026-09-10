const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const DIFF=new Set(["easy","normal","hard","nightmare","demon"]);
function env(){return {url:Netlify.env.get("SUPABASE_URL"), key:Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")};}
function safeName(v){return String(v||"PLAYER").toUpperCase().replace(/[^A-Z0-9 _-]/g,"").trim().slice(0,16)||"PLAYER";}
function safeId(v){return String(v||"").replace(/[^a-zA-Z0-9-]/g,"").slice(0,64);}
function periodStart(period){
  const now=new Date();
  if(period==="daily") return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  if(period==="weekly"){
    const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
    const day=(d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-day); return d;
  }
  if(period==="monthly") return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
  return null;
}
export default async (req)=>{
  const {url,key}=env(); if(!url||!key)return json({error:"Supabase server environment variables are not configured."},503);
  const h={apikey:key,Authorization:`Bearer ${key}`,"content-type":"application/json"};
  if(req.method==="GET"){
    const u=new URL(req.url);
    const limit=Math.max(1,Math.min(100,Number(u.searchParams.get("limit"))||50));
    const period=["daily","weekly","monthly","all"].includes(u.searchParams.get("period"))?u.searchParams.get("period"):"daily";
    const metric=u.searchParams.get("metric")==="score"?"score":"fastest";
    const start=periodStart(period);
    const filters=start?`&created_at=gte.${encodeURIComponent(start.toISOString())}`:"";
    const order=metric==="score"?"score.desc,completion_seconds.asc":"completion_seconds.asc,score.desc";
    const endpoint=`${url}/rest/v1/leaderboard?select=player_name,score,completion_seconds,difficulty,created_at${filters}&order=${order}&limit=${limit}`;
    const r=await fetch(endpoint,{headers:h});
    if(!r.ok)return json({error:await r.text(),rows:[]},502);
    return json({period,metric,rows:await r.json()});
  }
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  let b; try{b=await req.json();}catch{return json({error:"Invalid JSON"},400);}
  if(b.cheatsUsed)return json({error:"Cheat-enabled runs are not ranked."},400);
  const completion=Math.floor(Number(b.time));
  const score=Math.floor(Number(b.score));
  const difficulty=String(b.difficulty||"normal");
  if(!(completion>=60&&completion<=86400&&score>=1&&score<=100000000&&DIFF.has(difficulty))) return json({error:"Invalid completed run data"},400);
  const row={player_name:safeName(b.name),player_id:safeId(b.playerId),score,completion_seconds:completion,difficulty,floor:50,time_seconds:completion,rank:"S",streak:0};
  const r=await fetch(`${url}/rest/v1/leaderboard`,{method:"POST",headers:{...h,Prefer:"return=representation"},body:JSON.stringify(row)});
  if(!r.ok)return json({error:await r.text()},502);
  return json({ok:true,row:(await r.json())[0]});
};
