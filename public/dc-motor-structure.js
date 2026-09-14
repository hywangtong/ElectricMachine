const pages = [...document.querySelectorAll('[data-page]')];
const requestedPage = new URLSearchParams(window.location.search).get('page');
const activePage =
  pages.find((page) => page.dataset.page === requestedPage) ?? pages[0];
activePage.hidden = false;
document.title = activePage.querySelector('h1').textContent;

const lesson = document.querySelector('.lesson');
const resize = () => {
  lesson.style.setProperty(
    '--lesson-scale',
    Math.min(window.innerWidth / 1444, window.innerHeight / 744),
  );
};
window.addEventListener('resize', resize);
resize();

// Forward navigation while the embedded lesson has focus.
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (
    event.target.closest('input, textarea, select, [contenteditable="true"]') ||
    (event.key === ' ' && event.target.closest('button, a'))
  )
    return;
  if (
    ![
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
    ].includes(event.key)
  )
    return;
  event.preventDefault();
  window.parent.document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: event.key, bubbles: true }),
  );
});

let touchStart = null;
document.addEventListener(
  'touchstart',
  (event) => {
    touchStart = null;
    if (event.target.closest('button, a')) return;
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
