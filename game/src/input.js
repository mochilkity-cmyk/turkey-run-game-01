// Gobble Dash — keyboard and mouse input, edge-triggered.
// One job: turn raw key/mouse events into the game's questions:
// "did the player just press jump?", "are they holding run?", "where did
// they click?" — the game loop never touches an event listener directly.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let click = null;

  const GAME_KEYS = [
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
    'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyH', 'KeyP', 'KeyM', 'KeyR', 'Enter',
  ];

  function onKeyDown(e) {
    if (!GAME_KEYS.includes(e.code)) return;
    e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    click = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Held-down state, checked every frame.
    left() {
      return keys.has('ArrowLeft') || keys.has('KeyA');
    },
    right() {
      return keys.has('ArrowRight') || keys.has('KeyD');
    },
    down() {
      return keys.has('ArrowDown') || keys.has('KeyS');
    },
    // Edge-triggered: true once, the frame after the press.
    jumpPressed() {
      return pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW');
    },
    hidePressed() {
      return pressed.has('ArrowDown') || pressed.has('KeyS') || pressed.has('KeyH');
    },
    confirmPressed() {
      return pressed.has('Enter') || pressed.has('Space');
    },
    pausePressed() {
      return pressed.has('KeyP');
    },
    mutePressed() {
      return pressed.has('KeyM');
    },
    restartPressed() {
      return pressed.has('KeyR');
    },
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
    // Called at the end of every frame: edge presses expire.
    endFrame() {
      pressed.clear();
    },
  };
}
