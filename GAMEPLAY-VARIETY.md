# Floor Variety (R107)

Normal floors 6-44 now alternate between patrols, breakouts, core recovery,
relay sabotage, and marked-target encounters. The deterministic encounter bag
uses each combat objective once before refilling and prevents consecutive repeats.
Retries keep the same objective. Workbench floors through Floor 44 instead offer
an optional supply cache with a small group of guards and an open exit.

- Breakout: reach the exit; killing enemies is optional.
- Recovery: touch two cores (three from Floor 26) to unlock the exit.
- Sabotage: interact with both relays; each action takes 45 gameplay ticks.
  A touch tap starts the action. Moving away cancels partial progress.
- Marked target: defeat the highlighted enemy; its remaining guards are optional.
- Patrol: retain the original exit tolerance with fewer, curated enemies.
- Supply detour: collect the optional cache for scrap and ammo, or leave immediately.

Objective placement uses the existing movement graph and collision checks.
Recovery and breakout floors add thin catwalks without replacing rock, hazards,
pickups, or secret rooms. Mandatory encounters fall back to the original floor
if enough valid objective locations cannot be found. Normal rosters are capped
at 16 enemies and scale with biome and difficulty; cache guards are capped at six.
Ambushes retain their existing independent simultaneous cap (maximum 18).

Tutorial floors, mini-boss floors, major bosses (including Floor 10), weapon
quests, and Floors 46-50 retain their existing maps and enemies. Weapons,
pickups, workbenches, lives, save progression, and floor-clear rewards still use
the original systems. Collected cores/disabled relays persist through checkpoint
respawns; partial interactions reset. Cache rewards cannot repeat on a checkpoint
respawn. A full floor restart resets the encounter, like existing floor loot.

## Integration

`r106-ambushes.js` remains the single owner of the start-floor, enemy-update,
exit, and checkpoint hooks. It calls the encounter service in `r107-encounters.js`.
Ambushes cannot start during recovery, sabotage, breakout, or cache encounters,
or after a marked target is defeated. Checkpoint respawns discard ambush entities
to prevent a cleared wave from reappearing. Duplicate script loads are ignored.

The loader fetches both gameplay scripts before writing the packed document,
then installs them in order after the base game. The current packed export omits
its closing body tag. The previous loader's conditional legacy patch activation
is preserved; this change does not enable previously inactive legacy scripts.

## Verification

With Playwright and a Chromium browser installed, run:

```sh
node tests/encounters.cjs
```

Optional environment variables: `IRONTRAP_PLAYWRIGHT` selects a Playwright module
path, `IRONTRAP_BROWSER` selects a browser executable, and
`IRONTRAP_TEST_ARTIFACTS` selects a screenshot output directory. The test owns
its temporary HTTP server and closes both server and browser when finished.

The browser suite compares all 50 floors on all five difficulties against the
same packed game with R107 disabled. It checks original pickups, workbenches,
lives, protected maps/enemies, objective reachability, encounter variety, caps,
exit gates, pause/death/checkpoint behavior, duplicate rewards and hooks,
floor completion, weapon/life persistence, next-floor progression, and ambush
warning/spawn/clear/retry behavior. It also exercises keyboard and emulated touch
interaction and renders screenshots at desktop and two mobile sizes.

These are automated integration checks, not a human playthrough or a complete
balance evaluation. Publishing to GitHub does not verify hosting deployment.
