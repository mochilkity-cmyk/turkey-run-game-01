// Gobble Dash — the turkey: Gus, the bird of the hour.
// One job: Gus's body, physics and drawing. He runs, jumps (twice, with a
// flap), hides in the hay, and looks properly panicked while doing it.

import { GROUND_Y, PHYSICS, PLAYER } from './config.js';

export function createTurkey() {
  return {
    x: PLAYER.x,
    y: GROUND_Y - PLAYER.height,
    width: PLAYER.width,
    height: PLAYER.height,
    vy: 0,
    jumps: 0,
    onGround: true,
    hidden: false,
    hidingSpot: null,
    lives: PLAYER.maxLives,
    invulnerableUntil: 0,
    stunUntil: 0,
    runCycle: 0,
    squash: 0,
  };
}

export function turkeyJump(turkey, now) {
  if (turkey.hidden) return null;
  if (turkey.onGround) {
    turkey.vy = PHYSICS.jumpVelocity;
    turkey.onGround = false;
    turkey.jumps = 1;
    turkey.squash = -0.18;
    return 'jump';
  }
  if (turkey.jumps < 2) {
    turkey.vy = PHYSICS.doubleJumpVelocity;
    turkey.jumps = 2;
    turkey.squash = -0.22;
    return 'double';
  }
  return null;
}

export function turkeyHide(turkey, hayBale) {
  if (!hayBale || turkey.hidden) return false;
  turkey.hidden = true;
  turkey.hidingSpot = hayBale;
  turkey.y = GROUND_Y - turkey.height;
  turkey.vy = 0;
  turkey.onGround = true;
  return true;
}

export function turkeyUnhide(turkey) {
  turkey.hidden = false;
  turkey.hidingSpot = null;
}

export function turkeyUpdate(turkey, dt, now, speed) {
  if (turkey.hidden) return;
  if (turkey.stunUntil > now) return;
  if (!turkey.onGround) {
    turkey.vy += PHYSICS.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y - turkey.height) {
      turkey.y = GROUND_Y - turkey.height;
      turkey.vy = 0;
      turkey.onGround = true;
      turkey.jumps = 0;
      turkey.squash = 0.22;
    }
  } else {
    turkey.runCycle += dt * (speed / 26);
    turkey.squash += (0 - turkey.squash) * Math.min(1, dt * 10);
  }
}

export function turkeyIsInvulnerable(turkey, now) {
  return now < turkey.invulnerableUntil;
}

// Draw Gus at his current position. All vector art, no image files.
export function drawTurkey(ctx, turkey, now, time) {
  const x = turkey.x;
  const y = turkey.y;
  const w = turkey.width;
  const h = turkey.height;
  const blink = (time % 3.7) < 0.12 ? 0.15 : 1;

  // Flicker while invulnerable after a hit.
  if (turkeyIsInvulnerable(turkey, now) && Math.floor(time * 14) % 2 === 0) return;

  ctx.save();
  ctx.translate(x + w / 2, y + h);
  const squash = turkey.squash || 0;
  ctx.scale(1 - squash * 0.5, 1 + squash);

  if (turkey.hidden) {
    // Only the top of the head and a nervous eye peek out of the hay.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -6, 13, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d42a1e';
    ctx.beginPath();
    ctx.ellipse(2, -14, 3, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -9, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1410';
    ctx.beginPath();
    ctx.arc(5.6, -9, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const running = turkey.onGround;
  const legSwing = running ? Math.sin(turkey.runCycle) * 7 : 0;
  const airTilt = turkey.onGround ? 0 : -0.12;

  ctx.rotate(airTilt);

  // Tail fan: five autumn feathers, fanned behind.
  for (let i = -2; i <= 2; i++) {
    const ang = -0.5 - i * 0.42;
    const len = 30 - Math.abs(i) * 3;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = i % 2 === 0 ? '#c98a3a' : '#a86a24';
    ctx.beginPath();
    ctx.ellipse(-26, -len / 2 - 6, 6.5, len / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4420';
    ctx.beginPath();
    ctx.ellipse(-26, -len - 2, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Legs: two orange sticks, scissoring while running.
  ctx.strokeStyle = '#f2a007';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -8);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();

  // Body: a plump brown oval.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(0, -26, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b5772e';
  ctx.beginPath();
  ctx.ellipse(2, -24, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing, flapping hard in the air, tucked while running.
  const flap = turkey.onGround ? 0.25 : Math.sin(time * 22) * 0.7 - 0.4;
  ctx.save();
  ctx.translate(-4, -28);
  ctx.rotate(-0.5 - flap);
  ctx.fillStyle = '#6b4420';
  ctx.beginPath();
  ctx.ellipse(-12, 0, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head: small, round, and very worried.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(14, -52, 11, 0, Math.PI * 2);
  ctx.fill();
  // Snood (the red wattle) flopping over the beak.
  ctx.fillStyle = '#d42a1e';
  ctx.beginPath();
  ctx.ellipse(20, -46, 3.2, 6.5, 0.35, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2a007';
  ctx.beginPath();
  ctx.moveTo(22, -55);
  ctx.lineTo(33, -51);
  ctx.lineTo(22, -48);
  ctx.closePath();
  ctx.fill();
  // Eye: wide open, looking back at the farmer.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(13, -56, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1410';
  ctx.beginPath();
  ctx.arc(11.5, -56, 1.9 * blink + 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
