// Gobble Dash — the world: fences, knives, ovens, hay and corn.
// One job: spawn the hazards and treats, move them, test collisions, and
// paint the three stages (farmyard, barn, kitchen) as they scroll past.

import { CANVAS_W, GROUND_Y, STAGES } from './config.js';
import { chance, range } from './random.js';

export const OBSTACLE = {
  FENCE: 'fence',
  KNIFE: 'knife',
  OVEN: 'oven',
  HAY: 'hay',
};

export function stageForDistance(distanceM) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (distanceM >= STAGES[i].fromM) index = i;
  }
  return index;
}

export function createWorld(rng) {
  return {
    rng,
    scrollX: 0,
    obstacles: [],
    pickups: [],
    nextSpawnX: 700,
    knifeTimer: 2.2,
    clouds: Array.from({ length: 6 }, (_, i) => ({
      x: rng() * CANVAS_W,
      y: 40 + rng() * 90,
      s: 0.7 + rng() * 0.8,
      speed: 6 + rng() * 10,
    })),
    pumpkins: Array.from({ length: 5 }, (_, i) => ({
      x: 120 + i * 210 + rng() * 60,
      bob: rng() * Math.PI * 2,
    })),
  };
}

function spawnObstacle(world, stage, x) {
  const rng = world.rng;
  const roll = rng();
  if (roll < 0.34) {
    world.obstacles.push({ kind: OBSTACLE.FENCE, x, y: GROUND_Y - 46, w: 26, h: 46, hit: false });
  } else if (roll < 0.62) {
    world.obstacles.push({ kind: OBSTACLE.HAY, x, y: GROUND_Y - 44, w: 66, h: 44, hit: false });
  } else if (roll < 0.82 && stage.ovenChance > 0 && chance(rng, stage.ovenChance + 0.4)) {
    world.obstacles.push({ kind: OBSTACLE.OVEN, x, y: GROUND_Y - 58, w: 74, h: 58, hit: false });
  } else {
    world.obstacles.push({ kind: OBSTACLE.FENCE, x, y: GROUND_Y - 46, w: 26, h: 46, hit: false });
  }
  // Corn often trails an obstacle: risk a jump, get a snack.
  if (chance(rng, 0.65)) {
    const n = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      world.pickups.push({
        kind: chance(rng, 0.12) ? 'feather' : 'corn',
        x: x + 40 + i * 34,
        y: GROUND_Y - 96 - (i % 2) * 26,
        taken: false,
        bob: rng() * Math.PI * 2,
      });
    }
  }
}

export function worldUpdate(world, dt, speed, distanceM, stageIndex) {
  const stage = STAGES[stageIndex];
  const rng = world.rng;
  world.scrollX += speed * dt;

  // Spawn obstacles ahead of the screen.
  const gap = range(rng, stage.obstacleGap[0], stage.obstacleGap[1]);
  if (world.nextSpawnX - world.scrollX < CANVAS_W + 120) {
    spawnObstacle(world, stage, world.nextSpawnX);
    world.nextSpawnX += gap + 260;
  }

  // Falling carving knives: the farmer throws them from off screen.
  world.knifeTimer -= dt;
  if (world.knifeTimer <= 0) {
    world.knifeTimer = range(rng, 1.6, 2.6) / (1 + stage.knifeChance);
    if (chance(rng, 0.35 + stage.knifeChance)) {
      world.obstacles.push({
        kind: OBSTACLE.KNIFE,
        x: 420 + rng() * 420,
        y: -70,
        w: 18,
        h: 64,
        vy: 520 + stageIndex * 90,
        falling: true,
        hit: false,
      });
    }
  }

  for (const o of world.obstacles) {
    o.x -= speed * dt;
    if (o.kind === OBSTACLE.KNIFE && o.falling) {
      o.y += o.vy * dt;
      if (o.y >= GROUND_Y - o.h) {
        o.y = GROUND_Y - o.h;
        o.falling = false;
        o.stuckTimer = 0.9;
      }
    }
    if (o.stuckTimer !== undefined && !o.falling) o.stuckTimer -= dt;
  }
  world.obstacles = world.obstacles.filter((o) => o.x > -120 && (o.stuckTimer === undefined || o.stuckTimer > 0));

  for (const p of world.pickups) {
    p.x -= speed * dt;
    p.bob += dt * 3;
  }
  world.pickups = world.pickups.filter((p) => p.x > -40 && !p.taken);

  for (const c of world.clouds) {
    c.x -= c.speed * dt;
    if (c.x < -90) {
      c.x = CANVAS_W + 80;
      c.y = 40 + rng() * 90;
    }
  }
}

export function worldReset(world) {
  world.obstacles = [];
  world.pickups = [];
  world.nextSpawnX = 760;
  world.knifeTimer = 2.4;
}

// AABB overlap between the turkey and an obstacle. Knives only hurt while
// falling or freshly stuck; fences and ovens hurt on contact at ground level.
export function obstacleHitsTurkey(o, turkey) {
  if (o.hit) return false;
  if (turkey.hidden) return false;
  const tx0 = turkey.x + 8;
  const tx1 = turkey.x + turkey.width - 8;
  const ty0 = turkey.y + 6;
  const ty1 = turkey.y + turkey.height;
  const ox0 = o.x;
  const ox1 = o.x + o.w;
  const oy0 = o.y;
  const oy1 = o.y + o.h;
  if (tx1 < ox0 || tx0 > ox1 || ty1 < oy0 || ty0 > oy1) return false;
  if (o.kind === OBSTACLE.KNIFE) return o.y > 40;
  return true;
}

export function pickupHitsTurkey(p, turkey) {
  if (p.taken || turkey.hidden) return false;
  const cx = turkey.x + turkey.width / 2;
  const cy = turkey.y + turkey.height / 2;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy < 42 * 42;
}

export function nearestHay(world, turkey) {
  let best = null;
  for (const o of world.obstacles) {
    if (o.kind !== OBSTACLE.HAY) continue;
    const d = Math.abs(o.x + o.w / 2 - (turkey.x + turkey.width / 2));
    if (d < 70 && (!best || d < best.d)) best = { bale: o, d };
  }
  return best ? best.bale : null;
}

// ---- Backgrounds: one painter per stage, all vector art. ----

function drawClouds(ctx, world) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (const c of world.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 34 * c.s, 13 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 22 * c.s, c.y + 4, 24 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - 22 * c.s, c.y + 5, 20 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx, stage, scrollX) {
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, 540 - GROUND_Y);
  ctx.fillStyle = stage.groundDark;
  const offset = -(scrollX % 48);
  for (let x = offset; x < CANVAS_W; x += 48) {
    ctx.fillRect(x, GROUND_Y + 58, 26, 4);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, GROUND_Y, CANVAS_W, 4);
}

export function drawBackground(ctx, world, stageIndex, time) {
  const stage = STAGES[stageIndex];
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, stage.skyTop);
  grad.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

  if (stageIndex === 0) {
    // Farmyard: sun, clouds, red barn and pumpkins.
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath();
    ctx.arc(830, 74, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 207, 77, 0.35)';
    ctx.beginPath();
    ctx.arc(830, 74, 52, 0, Math.PI * 2);
    ctx.fill();
    drawClouds(ctx, world);
    // Red barn silhouette.
    ctx.fillStyle = '#a83a22';
    ctx.fillRect(60, 300, 150, 168);
    ctx.beginPath();
    ctx.moveTo(44, 302);
    ctx.lineTo(135, 228);
    ctx.lineTo(226, 302);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a2a18';
    ctx.fillRect(112, 392, 46, 76);
    ctx.strokeStyle = '#ffeec2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(112, 392);
    ctx.lineTo(158, 468);
    ctx.moveTo(158, 392);
    ctx.lineTo(112, 468);
    ctx.stroke();
    // Pumpkins by the fence.
    for (const p of world.pumpkins) {
      const px = p.x - (world.scrollX * 0.25) % 1100;
      const py = GROUND_Y - 12 + Math.sin(time * 2 + p.bob) * 1.5;
      ctx.fillStyle = '#e8761e';
      ctx.beginPath();
      ctx.ellipse(px, py, 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a3b1e';
      ctx.fillRect(px - 2, py - 18, 4, 7);
    }
    // Wooden fence posts scrolling past.
    ctx.fillStyle = '#7a5a2a';
    const off = -(world.scrollX % 120);
    for (let x = off; x < CANVAS_W; x += 120) {
      ctx.fillRect(x, GROUND_Y - 34, 8, 34);
      ctx.fillRect(x + 8, GROUND_Y - 30, 112, 5);
      ctx.fillRect(x + 8, GROUND_Y - 18, 112, 5);
    }
  } else if (stageIndex === 1) {
    // The barn: wooden planks, hanging lanterns, hay bales in the back.
    ctx.fillStyle = 'rgba(122, 74, 30, 0.35)';
    for (let x = 0; x < CANVAS_W; x += 90) {
      ctx.fillRect(x, 0, 4, GROUND_Y);
    }
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(0, 120, CANVAS_W, 10);
    ctx.fillRect(0, 300, CANVAS_W, 10);
    for (const lx of [180, 480, 780]) {
      const sway = Math.sin(time * 1.4 + lx) * 4;
      ctx.strokeStyle = '#3a2410';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx + sway, 58);
      ctx.stroke();
      ctx.fillStyle = '#ffcf4d';
      ctx.beginPath();
      ctx.arc(lx + sway, 70, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 207, 77, 0.25)';
      ctx.beginPath();
      ctx.arc(lx + sway, 70, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hay bales stacked at the back.
    ctx.fillStyle = '#d9b45a';
    for (let i = 0; i < 4; i++) {
      const bx = 90 + i * 220 - ((world.scrollX * 0.3) % 220);
      ctx.beginPath();
      ctx.ellipse(bx, GROUND_Y - 26, 52, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // The kitchen: checkered tiles, a glowing oven, hanging pans.
    ctx.fillStyle = '#f2e3c2';
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);
    const tile = 46;
    ctx.fillStyle = '#e3cba0';
    for (let ty = 0; ty < GROUND_Y; ty += tile) {
      for (let tx = ((ty / tile) % 2) * tile; tx < CANVAS_W; tx += tile * 2) {
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
    // Hanging pans and a copper pot.
    ctx.fillStyle = '#8a8f96';
    for (const px of [140, 330, 520, 720, 880]) {
      ctx.beginPath();
      ctx.arc(px, 92, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b7076';
      ctx.beginPath();
      ctx.arc(px, 92, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a8f96';
      ctx.fillRect(px - 2, 60, 4, 12);
    }
    // The big oven at the back, glowing: the heart of the danger.
    const glow = 0.55 + Math.sin(time * 3) * 0.2;
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(60, 300, 190, 168);
    ctx.fillStyle = `rgba(255, 122, 26, ${glow})`;
    ctx.fillRect(84, 330, 142, 60);
    ctx.fillStyle = '#2a1a08';
    ctx.fillRect(84, 330, 142, 60);
    ctx.fillStyle = `rgba(255, 170, 60, ${glow})`;
    ctx.fillRect(92, 338, 126, 44);
    ctx.fillStyle = '#cfd6dd';
    ctx.fillRect(84, 410, 142, 8);
    // A Thanksgiving turkey poster on the wall — the warning.
    ctx.fillStyle = '#fff8e8';
    ctx.fillRect(700, 120, 120, 150);
    ctx.strokeStyle = '#b3271e';
    ctx.lineWidth = 4;
    ctx.strokeRect(700, 120, 120, 150);
    ctx.fillStyle = '#b3271e';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TONIGHT:', 760, 150);
    ctx.fillText('TURKEY', 760, 172);
    ctx.fillText('DINNER!', 760, 194);
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = '#3a2410';
    ctx.fillText('(not Gus!)', 760, 240);
  }

  drawGround(ctx, stage, world.scrollX);
}

// ---- Obstacles and pickups. ----

export function drawObstacle(ctx, o, time) {
  if (o.kind === OBSTACLE.FENCE) {
    ctx.fillStyle = '#7a5a2a';
    ctx.fillRect(o.x, o.y, 6, o.h);
    ctx.fillRect(o.x + o.w - 6, o.y, 6, o.h);
    ctx.fillRect(o.x, o.y + 8, o.w, 6);
    ctx.fillRect(o.x, o.y + 24, o.w, 6);
    ctx.fillStyle = '#5a421e';
    ctx.fillRect(o.x, o.y, o.w, 4);
  } else if (o.kind === OBSTACLE.HAY) {
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8933a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 8, o.h / 2 - 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7a5a2a';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE!', o.x + o.w / 2, o.y - 6);
  } else if (o.kind === OBSTACLE.OVEN) {
    const glow = 0.6 + Math.sin(time * 5 + o.x) * 0.25;
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = `rgba(255, 122, 26, ${glow})`;
    ctx.fillRect(o.x + 8, o.y + 10, o.w - 16, 26);
    ctx.fillStyle = '#2a1a08';
    ctx.fillRect(o.x + 8, o.y + 10, o.w - 16, 26);
    ctx.fillStyle = `rgba(255, 170, 60, ${glow})`;
    ctx.fillRect(o.x + 14, o.y + 16, o.w - 28, 14);
    ctx.fillStyle = '#cfd6dd';
    ctx.fillRect(o.x + 8, o.y + 42, o.w - 16, 5);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', o.x + o.w / 2, o.y - 6);
  } else if (o.kind === OBSTACLE.KNIFE) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.falling ? 0.12 : 0.06);
    // Blade.
    ctx.fillStyle = '#cfd6dd';
    ctx.beginPath();
    ctx.moveTo(-7, -26);
    ctx.lineTo(7, -26);
    ctx.lineTo(7, 8);
    ctx.lineTo(0, 20);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9aa4ad';
    ctx.fillRect(-1, -26, 2, 34);
    // Handle.
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-6, -32, 12, 10);
    ctx.restore();
    if (!o.falling) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('THUNK!', o.x + o.w / 2, o.y - 8);
    }
  }
}

export function drawPickup(ctx, p, time) {
  const bobY = Math.sin(p.bob) * 4;
  if (p.kind === 'corn') {
    ctx.save();
    ctx.translate(p.x, p.y + bobY);
    ctx.rotate(Math.sin(time * 2 + p.bob) * 0.2);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a91c';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i * 5 - 1, -11, 2, 22);
    }
    ctx.fillStyle = '#4a8a2a';
    ctx.beginPath();
    ctx.ellipse(-8, -8, 6, 3, -0.6, 0, Math.PI * 2);
    ctx.ellipse(8, -8, 6, 3, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Golden feather: rare, worth 150.
    ctx.save();
    ctx.translate(p.x, p.y + bobY);
    ctx.rotate(Math.sin(time * 3 + p.bob) * 0.3);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 16, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.ellipse(-2, -2, 3, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8933a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(6, 22);
    ctx.stroke();
    ctx.restore();
  }
}
