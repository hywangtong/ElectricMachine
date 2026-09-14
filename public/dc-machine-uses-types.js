const lesson = document.querySelector('.lesson');
const buttons = document.querySelectorAll('.mode-buttons button');
const machineRole = document.getElementById('machine-role');
const electricalPort = document.getElementById('electrical-port');
const mechanicalPort = document.getElementById('mechanical-port');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    const generating = mode === 'generator';
    lesson.dataset.mode = mode;
    machineRole.textContent = generating ? '发电机' : '电动机';
    electricalPort.textContent = generating ? '输出' : '输入';
    mechanicalPort.textContent = generating ? '输入' : '输出';
    buttons.forEach((candidate) => {
      candidate.setAttribute('aria-pressed', String(candidate === button));
    });
  });
});

// Keep course navigation available when focus is inside this same-origin frame.
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (
    event.target.closest('button, a') &&
    (event.key === ' ' || event.key === 'Enter')
  )
    return;
  const keys = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
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
    if (event.target.closest('button, a')) {
      touchStart = null;
      return;
    }
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
