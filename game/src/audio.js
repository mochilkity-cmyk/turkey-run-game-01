// Gobble Dash — all sound is synthesized with the Web Audio API.
// One job: gobbles, dings, thuds and fanfares from oscillators, no audio files.
// Nothing plays until the player first presses a key or clicks, so the
// browser's autoplay rules are never fought.

let audioCtx = null;
let muted = false;

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function blip(freqStart, freqEnd, seconds, type, gainValue, when = 0) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + seconds);
  gain.gain.setValueAtTime(gainValue, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

export const sound = {
  toggleMute() {
    muted = !muted;
    return muted;
  },
  isMuted() {
    return muted;
  },
  // The turkey's signature: two quick descending gobbles.
  gobble() {
    blip(420, 180, 0.09, 'square', 0.10);
    blip(380, 150, 0.11, 'square', 0.10, 0.10);
    blip(300, 120, 0.14, 'square', 0.08, 0.22);
  },
  jump() {
    blip(280, 620, 0.16, 'sine', 0.12);
  },
  doubleJump() {
    blip(420, 880, 0.14, 'sine', 0.10);
  },
  corn() {
    blip(880, 880, 0.07, 'triangle', 0.12);
    blip(1320, 1320, 0.09, 'triangle', 0.10, 0.07);
  },
  feather() {
    blip(660, 660, 0.08, 'triangle', 0.12);
    blip(990, 990, 0.08, 'triangle', 0.12, 0.08);
    blip(1320, 1760, 0.14, 'triangle', 0.10, 0.16);
  },
  hide() {
    blip(500, 240, 0.18, 'sine', 0.08);
  },
  spotted() {
    // The farmer spots the turkey: a sharp alarm yelp.
    blip(700, 1150, 0.12, 'sawtooth', 0.09);
    blip(700, 1150, 0.12, 'sawtooth', 0.09, 0.14);
  },
  hurt() {
    blip(220, 60, 0.30, 'sawtooth', 0.16);
  },
  caught() {
    // Sad trombone: the farmer wins this round.
    blip(392, 392, 0.22, 'sawtooth', 0.12);
    blip(370, 370, 0.22, 'sawtooth', 0.12, 0.24);
    blip(349, 330, 0.34, 'sawtooth', 0.12, 0.48);
    blip(311, 220, 0.55, 'sawtooth', 0.12, 0.84);
  },
  escaped() {
    // A little fanfare: the turkey is free.
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => blip(n, n, 0.16, 'triangle', 0.12, i * 0.13));
    blip(1047, 1319, 0.30, 'triangle', 0.10, 0.55);
  },
  stage() {
    blip(523, 784, 0.18, 'triangle', 0.10);
    blip(784, 1047, 0.20, 'triangle', 0.10, 0.16);
  },
  click() {
    blip(600, 500, 0.06, 'sine', 0.08);
  },
};
