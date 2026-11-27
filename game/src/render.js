// Gobble Dash — screens and HUD: title, pause, caught, escaped.
// One job: everything drawn on top of the world — the HUD bar, the menus,
// the buttons — and the click zones that make them work with a mouse.

import { CANVAS_W, CANVAS_H, ESCAPE_DISTANCE_M, PLAYER } from './config.js';

export function buttonRects() {
  return {
    start: { x: CANVAS_W / 2 - 150, y: 392, w: 300, h: 58 },
    restart: { x: CANVAS_W / 2 - 130, y: 400, w: 260, h: 58 },
    again: { x: CANVAS_W / 2 - 130, y: 400, w: 260, h: 58 },
  };
}

export function inside(rect, click) {
  return (
    click &&
    click.x >= rect.x &&
    click.x <= rect.x + rect.w &&
    click.y >= rect.y &&
    click.y <= rect.y + rect.h
  );
}

function drawButton(ctx, rect, label, pulse) {
  const glow = pulse ? 0.85 + Math.sin(performance.now() / 300) * 0.15 : 1;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = '#b3271e';
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffeec2';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffeec2';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43, 24, 8, 0.78)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = '#e8c96a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawTitle(ctx, bestScore, time) {
  ctx.fillStyle = 'rgba(43, 24, 8, 0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  panel(ctx, CANVAS_W / 2 - 330, 52, 660, 300);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('GOBBLE DASH', CANVAS_W / 2, 128);

  ctx.fillStyle = '#ffeec2';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('The Great Turkey Escape', CANVAS_W / 2, 168);

  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#ffd9a0';
  ctx.fillText('Thanksgiving is tonight. Farmer Barnaby has the oven hot,', CANVAS_W / 2, 212);
  ctx.fillText('the carving knife sharp — and one turkey on the menu.', CANVAS_W / 2, 236);
  ctx.fillText('Run, jump, hide in the hay. Reach the forest gate and live!', CANVAS_W / 2, 260);

  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#ffeec2';
  ctx.fillText('← → run   •   SPACE / ↑ jump (twice = flap)   •   ↓ hide in hay', CANVAS_W / 2, 300);
  ctx.fillText('Corn +50   •   Golden feather +150   •   P pause   •   M mute', CANVAS_W / 2, 324);

  drawButton(ctx, buttonRects().start, '▶  START THE ESCAPE', true);

  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#e8c96a';
  const best = bestScore > 0 ? `Best score so far: ${bestScore}` : 'No turkey has escaped yet. Be the first!';
  ctx.fillText(best, CANVAS_W / 2, 486);
  ctx.fillStyle = '#c9a06a';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('An original game — art, sounds and story drawn and played by its own code.', CANVAS_W / 2, 510);
}

export function drawHud(ctx, game, now) {
  const { score, distanceM, stageIndex, stageName } = game;
  const lives = game.turkey.lives;
  const farmerGap = Math.max(0, Math.round(game.farmer.gap));

  ctx.fillStyle = 'rgba(43, 24, 8, 0.72)';
  ctx.beginPath();
  ctx.roundRect(10, 10, CANVAS_W - 20, 52, 10);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffeec2';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`SCORE ${score}`, 24, 36);
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`${Math.floor(distanceM)} m / ${ESCAPE_DISTANCE_M} m`, 210, 37);

  // Lives: hearts.
  for (let i = 0; i < PLAYER.maxLives; i++) {
    const hx = 420 + i * 30;
    ctx.fillStyle = i < lives ? '#d42a1e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(hx, 32, 8, 0, Math.PI * 2);
    ctx.arc(hx + 11, 32, 8, 0, Math.PI * 2);
    ctx.moveTo(hx - 6, 38);
    ctx.lineTo(hx + 5, 48);
    ctx.lineTo(hx + 17, 38);
    ctx.fill();
  }

  // Stage badge.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(stageName, 560, 37);

  // Farmer proximity: the closer he is, the redder the bar. The bar drains
  // left-to-right as he closes in, so "full bar" always means "safe".
  const danger = 1 - Math.min(1, farmerGap / 340);
  ctx.textAlign = 'right';
  ctx.fillStyle = danger > 0.6 ? '#ff6a4d' : '#ffeec2';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('FARMER', CANVAS_W - 24, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(CANVAS_W - 184, 36, 160, 10);
  ctx.fillStyle = danger > 0.6 ? '#d42a1e' : '#e8c96a';
  ctx.fillRect(CANVAS_W - 184, 36, 160 * (1 - danger), 10);
  ctx.strokeStyle = '#ffeec2';
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_W - 184, 36, 160, 10);

  if (game.turkey.hidden) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffeec2';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('HIDDEN IN THE HAY — hold still, he is searching…', CANVAS_W / 2, 92);
  }
  if (game.farmer.state === 'search' && !game.turkey.hidden) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('HE LOST YOU! RUN!', CANVAS_W / 2, 92);
  }
  if (game.farmer.spottedFlash > 0 && game.state === 'playing') {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6a4d';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('SPOTTED!', CANVAS_W / 2, 118);
  }
  if (game.hurtFlash > now) {
    ctx.fillStyle = 'rgba(212, 42, 30, 0.25)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  if (game.muted) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#c9a06a';
    ctx.font = '13px Georgia, serif';
    ctx.fillText('muted (M)', CANVAS_W - 24, 84);
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43, 24, 8, 0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffeec2';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 10);
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Press P or click to keep running.', CANVAS_W / 2, CANVAS_H / 2 + 26);
}

export function drawEnd(ctx, game, time) {
  const escaped = game.endKind === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(34, 74, 30, 0.55)' : 'rgba(60, 10, 6, 0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  panel(ctx, CANVAS_W / 2 - 320, 66, 640, 300);

  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#a8e07a' : '#ff8a6a';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', CANVAS_W / 2, 138);

  ctx.fillStyle = '#ffeec2';
  ctx.font = 'italic 21px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'Gus bursts through the forest gate — free, fat and fabulous.'
      : 'Barnaby grabs Gus by the drumstick. Dinner is served…',
    CANVAS_W / 2,
    178,
  );

  ctx.font = '19px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'The oven stays cold tonight. The turkey lives to gobble another day.'
      : '…but a turkey that got this far? The farm will talk about it for years.',
    CANVAS_W / 2,
    208,
  );

  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillStyle = '#ffd23e';
  ctx.fillText(`Final score: ${game.score}   •   Distance: ${Math.floor(game.distanceM)} m`, CANVAS_W / 2, 258);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = '#ffeec2';
  const cornLine = `Corn eaten: ${game.stats.corn}   •   Feathers: ${game.stats.feathers}   •   Hides: ${game.stats.hides}   •   Jumps: ${game.stats.jumps}`;
  ctx.fillText(cornLine, CANVAS_W / 2, 292);
  ctx.fillStyle = '#e8c96a';
  ctx.fillText(
    game.score > game.bestScore
      ? 'NEW BEST SCORE!'
      : `Best score: ${game.bestScore}`,
    CANVAS_W / 2,
    322,
  );

  drawButton(ctx, buttonRects().restart, '↻  RUN AGAIN  (R)', true);

  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#c9a06a';
  ctx.fillText('Tip: sprint (hold →) to open the gap, hide in the hay when he gets close.', CANVAS_W / 2, 486);
}

export function drawCaughtFlash(ctx) {
  ctx.fillStyle = 'rgba(212, 42, 30, 0.35)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}
