// Gobble Dash — the game loop and state machine.
// One job: own the states (title → playing → paused → caught/escaped),
// advance the turkey, the farmer and the world each frame, and hand the
// canvas to the renderers. Deterministic where it matters: the run itself
// uses a fixed seed, so a screenshot scene replays the same farm.

import { CANVAS_W, CANVAS_H, GROUND_Y, PHYSICS, PLAYER, SCORE, STAGES, ESCAPE_DISTANCE_M } from './config.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { sound } from './audio.js';
import {
  createTurkey,
  turkeyJump,
  turkeyHide,
  turkeyUnhide,
  turkeyUpdate,
  turkeyIsInvulnerable,
  drawTurkey,
} from './turkey.js';
import { createFarmer, farmerUpdate, farmerLunge, drawFarmer } from './farmer.js';
import {
  createWorld,
  worldUpdate,
  worldReset,
  stageForDistance,
  obstacleHitsTurkey,
  pickupHitsTurkey,
  nearestHay,
  drawBackground,
  drawObstacle,
  drawPickup,
} from './world.js';
import { drawTitle, drawHud, drawPaused, drawEnd, drawCaughtFlash, buttonRects, inside } from './render.js';
import { stageShot } from './shots.js';

const STATE = { TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused', END: 'end' };

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const rng = makeRng(20261127);

  const game = {
    state: STATE.TITLE,
    endKind: null,
    turkey: createTurkey(),
    farmer: createFarmer(),
    world: createWorld(rng),
    input,
    score: 0,
    bonus: 0, // corn, feathers, hides and stage bonuses on top of distance
    distanceM: 0,
    stageIndex: 0,
    stageName: STAGES[0].name,
    speed: PHYSICS.baseSpeed,
    bestScore: 0,
    muted: false,
    hurtFlash: 0,
    stats: { corn: 0, feathers: 0, hides: 0, jumps: 0 },
    time: 0,
    // Deterministic screenshot mode: ?shot=start|play|kitchen|end
    shot: new URLSearchParams(window.location.search).get('shot'),
    shotStaged: false,
  };

  function resetRun() {
    game.turkey = createTurkey();
    game.farmer = createFarmer();
    worldReset(game.world);
    game.score = 0;
    game.bonus = 0;
    game.distanceM = 0;
    game.stageIndex = 0;
    game.stageName = STAGES[0].name;
    game.speed = PHYSICS.baseSpeed;
    game.stats = { corn: 0, feathers: 0, hides: 0, jumps: 0 };
    game.endKind = null;
    game.hurtFlash = 0;
  }

  // Score is distance in metres plus every bonus earned along the way.
  function syncScore() {
    game.score = Math.floor(game.distanceM) * SCORE.perMetre + game.bonus;
  }

  function startRun() {
    resetRun();
    game.state = STATE.PLAYING;
    sound.gobble();
  }

  function endRun(kind) {
    game.state = STATE.END;
    game.endKind = kind;
    if (game.score > game.bestScore) game.bestScore = game.score;
    if (kind === 'escaped') sound.escaped();
    else sound.caught();
  }

  function hurtTurkey(now) {
    const turkey = game.turkey;
    if (turkeyIsInvulnerable(turkey, now)) return;
    turkey.lives -= 1;
    turkey.invulnerableUntil = now + PLAYER.invulnerableSeconds;
    turkey.stunUntil = now + PLAYER.stunSeconds;
    game.hurtFlash = now + 0.35;
    farmerLunge(game.farmer, 70);
    sound.hurt();
    if (turkey.lives <= 0) endRun('caught');
  }

  function currentSpeed() {
    let speed = PHYSICS.baseSpeed + STAGES[game.stageIndex].speedBonus;
    if (input.right()) speed = PHYSICS.sprintSpeed + STAGES[game.stageIndex].speedBonus;
    if (input.left()) speed = PHYSICS.slowSpeed;
    if (game.turkey.hidden) speed = 0;
    return Math.min(speed, PHYSICS.maxSpeed);
  }

  function updatePlaying(dt, now) {
    const turkey = game.turkey;

    if (input.jumpPressed()) {
      const jumped = turkeyJump(turkey, now);
      if (jumped === 'jump') {
        sound.jump();
        game.stats.jumps += 1;
      } else if (jumped === 'double') {
        sound.doubleJump();
        game.stats.jumps += 1;
      }
    }
    if (input.hidePressed()) {
      const bale = nearestHay(game.world, turkey);
      if (bale && turkeyHide(turkey, bale)) {
        sound.hide();
        game.stats.hides += 1;
        game.bonus += SCORE.hideBonus;
      }
    }
    if (turkey.hidden && (input.left() || input.right() || input.jumpPressed())) {
      turkeyUnhide(turkey);
    }

    game.speed = currentSpeed();
    turkeyUpdate(turkey, dt, now, game.speed);

    // Distance and score tick with the run; a hidden turkey gains nothing.
    if (!turkey.hidden) {
      game.distanceM += (game.speed * dt) / 24;
    }
    syncScore();

    const newStage = stageForDistance(game.distanceM);
    if (newStage !== game.stageIndex) {
      game.stageIndex = newStage;
      game.stageName = STAGES[newStage].name;
      game.bonus += SCORE.stageBonus;
      sound.stage();
    }

    const caught = farmerUpdate(game.farmer, dt, now, game.speed, turkey.hidden, game.stageIndex);
    if (caught === 'caught') {
      endRun('caught');
      return;
    }

    worldUpdate(game.world, dt, game.speed, game.distanceM, game.stageIndex);

    for (const o of game.world.obstacles) {
      if (obstacleHitsTurkey(o, turkey)) {
        o.hit = true;
        hurtTurkey(now);
        if (game.state !== STATE.PLAYING) return;
      }
    }
    for (const p of game.world.pickups) {
      if (pickupHitsTurkey(p, turkey)) {
        p.taken = true;
        if (p.kind === 'corn') {
          game.bonus += SCORE.corn;
          game.stats.corn += 1;
          sound.corn();
        } else {
          game.bonus += SCORE.goldenFeather;
          game.stats.feathers += 1;
          sound.feather();
        }
        syncScore();
      }
    }

    if (game.distanceM >= ESCAPE_DISTANCE_M) endRun('escaped');
  }

  function draw(now) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground(ctx, game.world, game.stageIndex, game.time);
    for (const p of game.world.pickups) drawPickup(ctx, p, game.time);
    for (const o of game.world.obstacles) drawObstacle(ctx, o, game.time);
    drawFarmer(ctx, game.farmer, game.turkey.x, game.time);
    drawTurkey(ctx, game.turkey, now, game.time);

    if (game.state === STATE.TITLE) drawTitle(ctx, game.bestScore, game.time);
    if (game.state === STATE.PLAYING || game.state === STATE.PAUSED) drawHud(ctx, game, now);
    if (game.state === STATE.PAUSED) drawPaused(ctx);
    if (game.state === STATE.END) {
      if (game.endKind === 'caught') drawCaughtFlash(ctx);
      drawEnd(ctx, game, game.time);
    }
  }

  function frame(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(0.05, Math.max(0.001, now - (frame.last ?? now)));
    frame.last = now;
    game.time = now;

    // Screenshot mode: stage one fixed scene, draw it once, stop the loop.
    if (game.shot && !game.shotStaged) {
      stageShot(game, startRun, endRun);
      game.shotStaged = true;
      draw(now);
      input.endFrame();
      return;
    }
    if (game.shot) {
      input.endFrame();
      return;
    }

    if (input.mutePressed()) {
      game.muted = sound.toggleMute();
    }

    const click = input.takeClick();

    if (game.state === STATE.TITLE) {
      if (input.confirmPressed() || inside(buttonRects().start, click)) {
        sound.click();
        startRun();
      }
    } else if (game.state === STATE.PLAYING) {
      if (input.pausePressed()) {
        game.state = STATE.PAUSED;
        sound.click();
      } else {
        updatePlaying(dt, now);
      }
    } else if (game.state === STATE.PAUSED) {
      if (input.pausePressed() || click) {
        game.state = STATE.PLAYING;
        sound.click();
      }
    } else if (game.state === STATE.END) {
      if (input.restartPressed() || input.confirmPressed() || inside(buttonRects().restart, click)) {
        sound.click();
        startRun();
      }
    }

    draw(now);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  // A handle for the play-test and for curious players: read-only state.
  window.__turkeyGame = {
    game,
    state: () => game.state,
    score: () => game.score,
    distance: () => game.distanceM,
    lives: () => game.turkey.lives,
    farmerGap: () => game.farmer.gap,
    stage: () => game.stageName,
  };

  requestAnimationFrame(frame);
  return game;
}
