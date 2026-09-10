# IRONTRAP

Current deployable build: **FRIENDS-RANKED-R8.1-BUGFIX-2026-09-10**.

This repository is the source of truth for the Iron Trap Netlify deployment.

## Deployment

Connect this repository to Netlify with the repository root as the publish directory. `netlify.toml` points Netlify Functions to `netlify/functions`.

The browser entry point is `index.html`. To stay within the GitHub connector's text-size limits, the exact monolithic game HTML is stored losslessly as `src/irontrap-r8.1.html.gz`; `index.html` decompresses and loads it at runtime. No game code is omitted.

## Online features

For multiplayer/leaderboards, configure these Netlify environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Run `supabase-schema.sql` once in the Supabase SQL editor.

## Version

R8.1 fixes the JavaScript parse failure that previously prevented menu buttons from receiving their event handlers. It retains IRONTRAP branding, the Credits menu, Swaraj Singh credits, and the hidden egg that reveals `AP`.
