# Credits Freeze Repair

## Reproduced Failure

The current packed game has no closing body tag, so the loader did not activate
the legacy R82 registration or the R104 credits handler. The base screen list
omitted `credits`. Clicking Credits therefore hid the title screen without
showing credits. No screen remained visible, and Escape had no return route.
The browser reproduction confirmed these conditions without a runtime exception.

## Repair

- Load the existing R104 credits module unconditionally, once, at version 111.
  Preserve the activation condition for unrelated legacy patches.
- Register credits in the screen list and use one navigation/animation owner.
  Capture credits commands before obsolete target-level listeners can intercept them.
- Keep Back fixed outside the scrolling viewport, before scrollable controls in
  DOM order. This also stops keyboard-menu initialization jumping to the final credit.
- Restore the originating menu or game state, clear held inputs, stop the credits
  animation on exit, and clean up when an external screen/floor transition occurs.
- Support Back, Escape, Backspace, the configured menu key, keyboard activation,
  touch, focus navigation, pause/resume, and manual scrolling without snap-back.
- Show content immediately rather than an empty viewport with oversized lead-in
  padding. Respect reduced motion and pause rolling when the window backgrounds.

Credits sections and attribution from the existing R104 module are retained.
Weapons, lives, rewards, quests, bosses, floor progression, and minigames are not
changed by this repair. Credits pause campaign gameplay and never alter a save.

## Verification

Use the existing Playwright/browser environment and run:

```text
node tests/credits.cjs --reproduce
node tests/credits.cjs
node tests/minigames.cjs
node tests/encounters.cjs
node tests/loot.cjs
```

The credits suite first reproduces the shipped missing-controller failure, then
checks the fixed screen, automatic/manual scrolling, pause/resume, keyboard exits,
focus and reduced-motion behavior, return states, real resumed movement, final
Floor 50 return, repeated opens, duplicate script inclusion, old-handler conflicts,
external floor transitions, and clickable exits at 1440x900, 390x844, 320x740,
and landscape 740x320. Screenshots go to `irontrap-credits-tests` in the system
temporary directory. These are local browser tests, not hosted deployment proof.

Verified on 9 October 2026 using Microsoft Edge through Playwright: the full
credits suite, encounter suite, loot suite, and minigame suite passed. The
credits screenshots were inspected, including narrow portrait and short
landscape layouts. Syntax and patch-whitespace checks passed. No browser
runtime errors were reported by the successful suites.

One timing-sensitive Pulse Lock keyboard check failed while multiple browser
suites were competing for resources. The complete minigame suite passed when
rerun independently; minigame code and its tests were not changed for this fix.
Hosted deployment and CI status have not been verified.

If credits, returning to gameplay, or normal navigation regresses after release,
revert this credits-fix commit as a unit. No database or saved-game migration is needed.
