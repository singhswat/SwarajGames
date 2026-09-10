# Iron Trap — Netlify Setup

Build: `FRIENDS-RANKED-R8.1-BUGFIX-2026-09-10`

1. Connect `singhswat/SwarajGames` to Netlify.
2. Keep the repository root as the publish directory; `netlify.toml` already configures the functions folder.
3. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Netlify environment variables if multiplayer/leaderboards are enabled.
4. Run `supabase-schema.sql` in Supabase once.
5. Deploy `main`.

The root `index.html` loads the exact R8.1 monolithic game bundle from `src/irontrap-r8.1.html.gz` using the browser gzip decompression API. The compressed file is lossless and contains the full game HTML/CSS/JavaScript.
