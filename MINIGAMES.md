# Optional Arcade Encounters

Ten short bonus games are offered through optional terminals on normal campaign floors.
They never replace a floor objective or gate the exit.

## Games

| Game | Encounter |
| --- | --- |
| Pulse Lock | Stop a moving marker inside five changing target bands. |
| Rune Recall | Repeat four progressively longer directional sequences. |
| Signal Relay | Match twelve time-limited directional signals. |
| Reactor Balance | Keep power stable for eighteen seconds and make ten corrections. |
| Circuit Align | Rotate four panels into alignment, across four circuits. |
| Cargo Sort | Send twelve crates and cores to their corresponding bins. |
| Orbital Catch | Move between three lanes, catch ten supplies, and avoid debris. |
| Switch Hunt | Move a grid cursor and activate ten illuminated switches. |
| Salvage Grid | Collect six cores while avoiding visible hazards. |
| Conveyor Hop | Time jumps over ten approaching barriers. |

## Appearance and Controls

Terminals have a 38% offer chance on eligible floors 6-44. Bosses, mini-bosses,
existing weapon-quest floors, workbench floors, tutorial floors, final floors,
ranked runs, and joined multiplayer rooms are excluded. Shuffled ten-game rounds
use every game once per round and avoid the previous three offers across rounds.
Offers are saved, including empty
offers, so restarting cannot repeatedly roll a terminal onto the same floor.

Placement uses the existing movement graph and collision checks, and leaves
space around pickups, exits, NPCs, and floor objectives. A nearby terminal has
an optional Play button and accepts the existing Interact key. Enemies, nearby
shots, active/warning ambushes, dead players, and non-playing states prevent entry.

Inside a game: arrows or WASD move/select; Space or Enter activates; P pauses;
Escape returns to the floor. Five large directional/action buttons support touch.
The main floor clock, enemies, player, shots, and floor objectives remain paused.
Backgrounding the window pauses the bonus timer and requires an explicit resume.

The ready screen can be dismissed without consuming the attempt. Pressing Play
records the attempt before gameplay, and abandoning or failing consumes it without
losing a life. Checkpoints, floor restarts, and reloads cannot duplicate an attempt.
Winning grants 6 + biome tier + a random 0-4 scrap, once. No weapons, armour,
health, ammunition, quest progress, or exit conditions are altered. Starting a
fresh campaign/save resets the arcade ledger with the rest of the save.

## Integration

`r110-minigames.js` loads after R105/R106/R107 through the existing loader. It
does not wrap campaign functions. R106 calls the arcade service on floor entry,
enemy-update completion, and checkpoint respawn. R107 draws terminals through
its existing world drawing hook. Duplicate script inclusion is a no-op.
Each bonus game owns a bounded state machine and a separate animation clock.
Terminal selection uses a separate random stream, so it cannot disturb loot RNG.

## Verification

Set `IRONTRAP_PLAYWRIGHT` to an installed Playwright module and optionally set
`IRONTRAP_BROWSER` to a Chromium/Edge executable, then run:

```text
node tests/minigames.cjs
node tests/encounters.cjs
node tests/loot.cjs
```

The minigame suite tests 100 winning seeds and timeout states per game, all
250 floor/difficulty combinations against a no-arcade baseline, saved offer
variety, protected entry states, real keyboard and touch input, pause, campaign
freeze, single rewards, checkpoint/restart/reload handling, abandonment, and
external floor changes. All ten arenas are checked for rendered pixels and
horizontal overflow at 1440, 390, and 320 pixels wide. Screenshots are written
to the system temporary directory under `irontrap-minigames-tests`.

### Verified on 9 October 2026

All three suites passed using headless Microsoft Edge through Playwright.
The minigame suite completed 1,000 solver/model win cases and 1,000 timeout
cases; compared 250 campaign states; checked 30 campaign offer selections;
and exercised real keyboard and touch input. Rendered-pixel and layout checks
passed for all ten games at 1440x900, 390x844, and 320x740. Representative
desktop/mobile screenshots were also visually inspected. No browser errors
were reported.

The existing encounter suite passed another 250 floor/difficulty cases,
objective lifecycles, ambush warning/spawning/clearing, checkpoint retries,
floor completion, and weapon/life persistence. The loot suite passed 120
chest rolls, 30 floor-loot rolls, 80 ordinary kill drops, guaranteed pickups
on all 50 floors, the Floor 25 chest quest, and Floor 10 boss/Floor 15 mini-boss
loot and duplicate-reward checks.

These are local browser tests, not CI or a full human difficulty-balancing
playthrough. Hosting deployment has not been verified. No database migration
is needed. If loading, returning to a floor, or normal floor progression
regresses after release, revert the minigame commit as a unit; older code
ignores the additional `save.arcade` field.
