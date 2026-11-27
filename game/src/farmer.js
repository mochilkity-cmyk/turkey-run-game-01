// Gobble Dash — the farmer: Barnaby, knife in one hand, net in the other.
// One job: the farmer's chase AI and his drawing. He chases when the turkey
// is slow, searches when the turkey hides, and corners harder in the kitchen.

import { FARMER, GROUND_Y } from './config.js';

export const FARMER_STATE = {
  CHASE: 'chase',
  SEARCH: 'search',
  CORNER: 'corner',
};

export function createFarmer() {
  return {
    x: 0, // drawn relative to the gap behind the turkey
    gap: FARMER.startGap,
    state: FARMER_STATE.CHASE,
    searchUntil: 0,
    walkCycle: 0,
    armSwing: 0,
    spottedFlash: 0,
  };
}

// gap: pixels between farmer and turkey. Returns 'caught' when he grabs Gus.
export function farmerUpdate(farmer, dt, now, turkeySpeed, turkeyHidden, stageIndex) {
  const cornering = stageIndex >= 2;
  farmer.walkCycle += dt * 11;
  farmer.armSwing = Math.sin(farmer.walkCycle) * 0.5;
  farmer.spottedFlash = Math.max(0, farmer.spottedFlash - dt);

  if (turkeyHidden) {
    if (farmer.state !== FARMER_STATE.SEARCH) {
      farmer.state = FARMER_STATE.SEARCH;
      farmer.searchUntil = now + FARMER.searchSeconds;
      farmer.spottedFlash = 0;
    }
    // He stops, scratches his head, and looks around the hay.
    if (now >= farmer.searchUntil) {
      farmer.state = cornering ? FARMER_STATE.CORNER : FARMER_STATE.CHASE;
    }
    farmer.gap = Math.min(farmer.gap + 26 * dt, FARMER.startGap + 60);
    return null;
  }

  if (farmer.state === FARMER_STATE.SEARCH) {
    farmer.state = cornering ? FARMER_STATE.CORNER : FARMER_STATE.CHASE;
  }

  // The farmer closes in whenever the turkey is not sprinting; a sprinting
  // turkey slowly opens the gap again. Kitchen stage: he corners faster.
  const closeRate = FARMER.chaseSpeed + (cornering ? FARMER.cornerBonusSpeed : 0);
  const sprinting = turkeySpeed >= 330;
  if (sprinting) {
    farmer.gap = Math.min(farmer.gap + 34 * dt, FARMER.startGap + 80);
  } else if (turkeySpeed <= 200) {
    farmer.gap -= closeRate * dt;
  } else {
    farmer.gap -= (closeRate * 0.35) * dt;
  }

  if (farmer.gap <= FARMER.catchGap) {
    farmer.gap = FARMER.catchGap;
    return 'caught';
  }
  return null;
}

// A hit or a stumble lets the farmer lunge closer.
export function farmerLunge(farmer, pixels) {
  farmer.gap = Math.max(FARMER.catchGap + 4, farmer.gap - pixels);
  farmer.spottedFlash = 1;
}

export function farmerSpot(farmer) {
  farmer.spottedFlash = 1;
}

// Draw Barnaby at (turkeyX - gap), standing on the ground.
export function drawFarmer(ctx, farmer, turkeyX, time) {
  const x = turkeyX - farmer.gap;
  if (x < -90) return; // off screen to the left, still a threat
  const y = GROUND_Y;
  const searching = farmer.state === FARMER_STATE.SEARCH;
  const legSwing = Math.sin(farmer.walkCycle) * 9;

  ctx.save();
  ctx.translate(x, y);

  // Legs: heavy boots pounding the dirt.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -34);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();

  // Overalls.
  ctx.fillStyle = '#2e4a6b';
  ctx.fillRect(-14, -72, 28, 40);
  // Shirt.
  ctx.fillStyle = '#3e6fb0';
  ctx.fillRect(-16, -92, 32, 24);
  // Overall straps.
  ctx.fillStyle = '#2e4a6b';
  ctx.fillRect(-12, -96, 6, 12);
  ctx.fillRect(6, -96, 6, 12);

  // Arms: one holds the net high, one reaches forward.
  ctx.strokeStyle = '#f2c89b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(12, -86);
  ctx.lineTo(26, -108 + farmer.armSwing * 4);
  ctx.moveTo(-12, -86);
  ctx.lineTo(4, -70 + farmer.armSwing * 3);
  ctx.stroke();

  // The net, raised and ready.
  ctx.save();
  ctx.translate(30, -112 + farmer.armSwing * 4);
  ctx.rotate(0.5);
  ctx.strokeStyle = '#7a5a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220, 220, 220, 0.85)';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, -15);
    ctx.lineTo(i * 6, 15);
    ctx.moveTo(-15, i * 6);
    ctx.lineTo(15, i * 6);
    ctx.stroke();
  }
  ctx.restore();

  // Head with straw hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -102, 12, 0, Math.PI * 2);
  ctx.fill();
  // Moustache.
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-7, -96, 14, 3);
  // Eyes: fixed on the turkey.
  ctx.fillStyle = '#1c1410';
  ctx.beginPath();
  ctx.arc(4, -105, 1.8, 0, Math.PI * 2);
  ctx.arc(-4, -105, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Straw hat.
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(0, -110, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -112, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#b3271e';
  ctx.fillRect(-10, -114, 20, 3);

  if (searching) {
    // A "?" pops over his head while he hunts for the hidden turkey.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 26, -138 + Math.sin(time * 4) * 3);
  }

  ctx.restore();
}
