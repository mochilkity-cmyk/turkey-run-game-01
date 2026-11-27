// Gobble Dash — configuration: canvas, physics, stages, scoring.
// One job: every tunable number lives here so tuning never touches logic.

export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const GROUND_Y = 468;

export const PHYSICS = {
  gravity: 2100,
  jumpVelocity: -760,
  doubleJumpVelocity: -640,
  baseSpeed: 250,
  sprintSpeed: 340,
  slowSpeed: 150,
  maxSpeed: 430,
};

export const PLAYER = {
  x: 190,
  width: 64,
  height: 56,
  maxLives: 3,
  invulnerableSeconds: 1.6,
  stunSeconds: 0.45,
};

// The farmer starts this far behind the turkey (pixels). At 0 the turkey is caught.
export const FARMER = {
  startGap: 300,
  catchGap: 26,
  chaseSpeed: 96,
  searchSeconds: 2.4,
  cornerBonusSpeed: 46,
};

// Escape! Reach this distance (metres) and the turkey is free.
export const ESCAPE_DISTANCE_M = 1500;

export const SCORE = {
  perMetre: 1,
  corn: 50,
  goldenFeather: 150,
  hideBonus: 25,
  stageBonus: 200,
};

export const STAGES = [
  {
    name: 'FARMYARD',
    fromM: 0,
    skyTop: '#ffd98a',
    skyBottom: '#ffeec2',
    ground: '#b5772e',
    groundDark: '#8a5a20',
    accent: '#c94f2e',
    obstacleGap: [300, 460],
    knifeChance: 0.16,
    ovenChance: 0,
    speedBonus: 0,
  },
  {
    name: 'THE BARN',
    fromM: 400,
    skyTop: '#e8a34c',
    skyBottom: '#f7cf8a',
    ground: '#9c6b2f',
    groundDark: '#6f4a1e',
    accent: '#7a3b1e',
    obstacleGap: [260, 400],
    knifeChance: 0.24,
    ovenChance: 0,
    speedBonus: 34,
  },
  {
    name: 'THE KITCHEN',
    fromM: 900,
    skyTop: '#f2b25c',
    skyBottom: '#fbe3ae',
    ground: '#a06a35',
    groundDark: '#74491f',
    accent: '#b3271e',
    obstacleGap: [230, 360],
    knifeChance: 0.32,
    ovenChance: 0.34,
    speedBonus: 68,
  },
];

export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6b4420',
  turkeyLight: '#b5772e',
  feather: '#c98a3a',
  wattle: '#d42a1e',
  beak: '#f2a007',
  farmerShirt: '#3e6fb0',
  farmerOveralls: '#2e4a6b',
  farmerSkin: '#f2c89b',
  farmerHat: '#e8c96a',
  corn: '#ffd23e',
  knife: '#cfd6dd',
  ovenGlow: '#ff7a1a',
  hay: '#e8c96a',
  hudBg: 'rgba(43, 24, 8, 0.72)',
  hudText: '#ffeec2',
};
