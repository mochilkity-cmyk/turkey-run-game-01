// Gobble Dash — deterministic screenshot scenes.
// One job: stage one fixed, good-looking moment per ?shot= value, using the
// game's own code and a fixed seed, so the screenshots are real renders of
// the game and replay identically every time.
//
//   ?shot=start   — title screen over the farmyard
//   ?shot=play    — mid-run in the farmyard: HUD, corn, a knife, the farmer
//   ?shot=kitchen — the kitchen stage: oven, farmer closing in, low lives
//   ?shot=end     — the escaped end screen, with a run's stats behind it

import { GROUND_Y, STAGES } from './config.js';
import { OBSTACLE } from './world.js';

function place(game, spec) {
  const turkey = game.turkey;
  turkey.x = spec.turkeyX ?? 190;
  turkey.y = GROUND_Y - turkey.height - (spec.turkeyAir ?? 0);
  turkey.onGround = (spec.turkeyAir ?? 0) === 0;
  turkey.runCycle = spec.runCycle ?? 1.2;
  turkey.lives = spec.lives ?? 3;
  game.farmer.gap = spec.farmerGap ?? 300;
  game.farmer.walkCycle = spec.farmerWalk ?? 0.8;
  game.farmer.state = spec.farmerState ?? 'chase';
  game.score = spec.score ?? 0;
  game.bonus = (spec.score ?? 0) - Math.floor(spec.distanceM ?? 0);
  game.distanceM = spec.distanceM ?? 0;
  game.stageIndex = spec.stageIndex ?? 0;
  game.stageName = STAGES[game.stageIndex].name;
  game.stats = spec.stats ?? { corn: 0, feathers: 0, hides: 0, jumps: 0 };
  game.world.obstacles = spec.obstacles ?? [];
  game.world.pickups = spec.pickups ?? [];
  game.world.scrollX = spec.scrollX ?? 0;
}

export function stageShot(game, startRun, endRun) {
  const shot = game.shot;

  if (shot === 'start') {
    // Title screen: the farm behind it, Gus waiting on the ground.
    game.state = 'title';
    game.turkey.y = GROUND_Y - game.turkey.height;
    game.turkey.runCycle = 0.6;
    game.farmer.gap = 420;
    game.world.scrollX = 120;
    game.world.obstacles = [
      { kind: OBSTACLE.HAY, x: 640, y: GROUND_Y - 44, w: 66, h: 44, hit: false },
    ];
    game.world.pickups = [
      { kind: 'corn', x: 560, y: GROUND_Y - 100, taken: false, bob: 0.4 },
      { kind: 'corn', x: 596, y: GROUND_Y - 100, taken: false, bob: 1.1 },
    ];
    return;
  }

  if (shot === 'play') {
    startRun();
    place(game, {
      score: 1240,
      distanceM: 187,
      lives: 3,
      farmerGap: 118, // close enough that Barnaby and his net read clearly
      turkeyAir: 0,
      runCycle: 2.4,
      scrollX: 340,
      stats: { corn: 6, feathers: 0, hides: 1, jumps: 9 },
      obstacles: [
        { kind: OBSTACLE.FENCE, x: 430, y: GROUND_Y - 46, w: 26, h: 46, hit: false },
        { kind: OBSTACLE.HAY, x: 640, y: GROUND_Y - 44, w: 66, h: 44, hit: false },
        { kind: OBSTACLE.KNIFE, x: 520, y: 60, w: 18, h: 64, vy: 520, falling: true, hit: false },
      ],
      pickups: [
        { kind: 'corn', x: 470, y: GROUND_Y - 100, taken: false, bob: 0.3 },
        { kind: 'corn', x: 506, y: GROUND_Y - 100, taken: false, bob: 1.4 },
        { kind: 'corn', x: 542, y: GROUND_Y - 126, taken: false, bob: 2.1 },
        { kind: 'feather', x: 700, y: GROUND_Y - 140, taken: false, bob: 0.9 },
      ],
    });
    return;
  }

  if (shot === 'kitchen') {
    startRun();
    place(game, {
      score: 4820,
      distanceM: 1043,
      lives: 1,
      farmerGap: 168, // behind the turkey, clear of the back oven
      turkeyX: 420, // mid-jump, right over the glowing oven
      turkeyAir: 44,
      runCycle: 3.1,
      farmerWalk: 2.2,
      scrollX: 780,
      stageIndex: 2,
      stats: { corn: 31, feathers: 2, hides: 4, jumps: 41 },
      obstacles: [
        { kind: OBSTACLE.OVEN, x: 470, y: GROUND_Y - 58, w: 74, h: 58, hit: false },
        { kind: OBSTACLE.KNIFE, x: 660, y: 30, w: 18, h: 64, vy: 700, falling: true, hit: false },
        { kind: OBSTACLE.FENCE, x: 800, y: GROUND_Y - 46, w: 26, h: 46, hit: false },
      ],
      pickups: [
        { kind: 'corn', x: 580, y: GROUND_Y - 120, taken: false, bob: 0.6 },
        { kind: 'feather', x: 850, y: GROUND_Y - 150, taken: false, bob: 1.8 },
      ],
    });
    return;
  }

  if (shot === 'end') {
    startRun();
    place(game, {
      score: 7310,
      distanceM: 1500,
      lives: 2,
      farmerGap: 260,
      stageIndex: 2,
      stats: { corn: 44, feathers: 3, hides: 5, jumps: 58 },
      obstacles: [
        { kind: OBSTACLE.HAY, x: 700, y: GROUND_Y - 44, w: 66, h: 44, hit: false },
      ],
      pickups: [],
    });
    game.bestScore = 7310;
    endRun('escaped');
    return;
  }

  // Unknown ?shot value: fall back to the title screen.
  game.state = 'title';
}
