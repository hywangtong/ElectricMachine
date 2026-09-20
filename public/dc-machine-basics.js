// Preserve the parent course's keyboard, swipe and 1444 × 744 scaling rules.
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  const keys = [
    'ArrowRight',
    'ArrowLeft',
    'ArrowUp',
    'ArrowDown',
    'PageDown',
    'PageUp',
    'Home',
    'End',
    ' ',
    'f',
    'F',
    'm',
    'M',
    'Escape',
  ];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  window.parent.document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: event.key, bubbles: true }),
  );
});

let touchStart = null;
document.addEventListener(
  'touchstart',
  (event) => {
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  },
  { passive: true },
);
document.addEventListener(
  'touchend',
  (event) => {
    const start = touchStart;
    touchStart = null;
    if (!start || window.parent === window) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) <= 60 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    window.parent.document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: dx < 0 ? 'ArrowRight' : 'ArrowLeft',
        bubbles: true,
      }),
    );
  },
  { passive: true },
);

function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
resize();
