[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/mochilkity-cmyk/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/mochilkity-cmyk/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Gobble Dash — The Great Turkey Escape

An entry for the [turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) competition on [make.fun](https://make.fun).

Thanksgiving is tonight. Farmer Barnaby has the oven hot, the carving knife
sharp — and one turkey on the menu. You are Gus, the turkey. Run from the
farmyard, through the barn, into the kitchen, and burst through the forest
gate before the farmer grabs you by the drumstick.

## How to play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static
server). No network, no build step, no install — every script, sound and
pixel is a file under `game/`.

| Control | What it does |
|---|---|
| `←` / `→` (or `A` / `D`) | Slow down / sprint — sprinting opens the gap to the farmer |
| `SPACE` / `↑` (or `W`) | Jump — press again mid-air to flap (double jump) |
| `↓` (or `S` / `H`) | Hide in the nearest hay bale while the farmer searches |
| `P` | Pause |
| `M` | Mute |
| `R` / `Enter` / click | Restart after being caught or escaping |

Mouse works too: click the big red buttons on the title and end screens.

## The escape

- **The farmer chases.** Barnaby runs behind you with his net. Walk or dawdle
  and he closes in; sprint and the gap opens again. If he reaches you, dinner
  is served.
- **Hide in the hay.** Duck behind a hay bale and he stops, scratches his
  head and searches — but a hidden turkey gains no distance.
- **Dodge the dangers.** Jump the fences, leap the glowing oven, dodge the
  carving knives the farmer throws. A hit costs a life and lets him lunge
  closer. Three lives, then you are caught.
- **Three stages, growing harder.** The farmyard (knives are rare), the barn
  (faster, more knives), the kitchen (ovens, knives everywhere, and the
  farmer corners harder). Each stage you reach pays a bonus.
- **Eat to win.** Corn is +50, a rare golden feather is +150. Reach
  **1,500 m** — the forest gate — and Gus escapes.

The HUD shows score, distance, lives (hearts), the stage, and a farmer
proximity bar that turns red when he is close. Every sound — the gobble, the
jump, the alarm when he spots you, the sad trombone when he catches you, the
fanfare when you escape — is synthesized live with the Web Audio API; there
are no audio files.

## The code

All original, split into files with one clear job each under `game/src/`:

- `config.js` — canvas, physics, stages, scoring, palette
- `random.js` — the seeded RNG behind every spawn and gust
- `audio.js` — synthesized sound effects (Web Audio, no files)
- `input.js` — keyboard and mouse, edge-triggered
- `turkey.js` — Gus: physics, double-jump flap, hiding, vector art
- `farmer.js` — Barnaby: chase / search / corner AI and his drawing
- `world.js` — obstacles, pickups, stage backgrounds (farmyard, barn, kitchen)
- `render.js` — title screen, HUD, pause and end screens, buttons
- `main.js` — the game loop and state machine
- `shots.js` — deterministic staged scenes for the screenshots

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored make.fun
library in `vendor/makefun-game.ts` (unchanged from the kit).

## Screenshots

Four real renders of the game's own code, taken in desktop Chromium:

1. `1-title.jpg` — the title screen (cover)
2. `2-play.jpg` — a run in the farmyard, HUD, corn, a falling knife
3. `3-kitchen.jpg` — the kitchen stage, one life left, the farmer closing in
4. `4-end.jpg` — the escaped end screen

## License

MIT — see `LICENSE`.
