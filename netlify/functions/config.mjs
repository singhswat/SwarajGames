export default async () => {
  const url = Netlify.env.get("SUPABASE_URL") || "";
  const anonKey = Netlify.env.get("SUPABASE_ANON_KEY") || "";
  return new Response(JSON.stringify({ url, anonKey }), {
    status: url && anonKey ? 200 : 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
};
