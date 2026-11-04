const lesson = document.querySelector('.lesson');
const toggle = document.querySelector('#animation-toggle');
const targets = [...document.querySelectorAll('[data-pair], .mapping-row')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let pinned = 'all';
let hovered = null;
let focused = null;
let automatic = 'primary';
let playing = !reducedMotion.matches;
let cycleTimer = null;
let inView = true;

function pairOf(target) {
  return target?.dataset.pair ?? target?.dataset.focus;
}

function renderFocus() {
  const focus =
    pairOf(hovered) ??
    pairOf(focused) ??
    (pinned !== 'all' ? pinned : playing ? automatic : 'all');
  lesson.dataset.focus = focus;
  lesson.dataset.running = String(playing && inView && !document.hidden);
  for (const target of targets) {
    const pair = pairOf(target);
    target.classList.toggle('is-highlighted', pair === focus);
    target.setAttribute('aria-pressed', String(pair === pinned));
  }
  for (const group of document.querySelectorAll('.focusable')) {
    group.classList.toggle(
      'is-highlighted',
      group.classList.contains(
        focus === 'main' ? 'main-flux' : `${focus}-side`,
      ),
    );
  }
  toggle.textContent = playing ? '暂停对应动画' : '播放对应动画';
  toggle.setAttribute('aria-pressed', String(playing));
}

function scheduleCycle() {
  clearTimeout(cycleTimer);
  cycleTimer = null;
  renderFocus();
  if (
    !playing ||
    !inView ||
    document.hidden ||
    hovered ||
    focused ||
    pinned !== 'all'
  )
    return;
  cycleTimer = setTimeout(() => {
    automatic = automatic === 'primary' ? 'secondary' : 'primary';
    scheduleCycle();
  }, 3400);
}

function selectPair(target) {
  const pair = pairOf(target);
  pinned = pinned === pair ? 'all' : pair;
  scheduleCycle();
}

targets.forEach((target) => {
  if (target.tagName.toLowerCase() !== 'button') {
    target.setAttribute('role', 'button');
    target.setAttribute('tabindex', '0');
    if (!target.hasAttribute('aria-label')) {
      target.setAttribute(
        'aria-label',
        `${pairOf(target) === 'primary' ? '原边' : '副边'}漏抗与漏磁通对应；点击锁定`,
      );
    }
    target.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      selectPair(target);
    });
  }
  target.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    hovered = target;
    scheduleCycle();
  });
  target.addEventListener('pointerleave', () => {
    if (hovered === target) hovered = null;
    scheduleCycle();
  });
  target.addEventListener('focus', () => {
    if (target.matches(':focus-visible')) focused = target;
    scheduleCycle();
  });
  target.addEventListener('blur', () => {
    if (focused === target) focused = null;
    scheduleCycle();
  });
  target.addEventListener('click', () => selectPair(target));
});

toggle.addEventListener('click', () => {
  playing = !playing;
  scheduleCycle();
});
document.addEventListener('visibilitychange', scheduleCycle);
new IntersectionObserver(([entry]) => {
  inView = entry.isIntersecting;
  scheduleCycle();
}).observe(lesson);
reducedMotion.addEventListener('change', () => {
  playing = !reducedMotion.matches;
  scheduleCycle();
});
scheduleCycle();

// Front turns cover the flux paths; each leakage loop crosses only its own coil.
const svgNamespace = 'http://www.w3.org/2000/svg';
for (const [id, x, direction] of [
  ['primary-winding', 143, 1],
  ['secondary-winding', 417, -1],
]) {
  const group = document.getElementById(id);
  const pitch = 99 / 7;
  for (let turn = 0; turn < 7; turn += 1) {
    const y = 89 + turn * pitch;
    const front = document.createElementNS(svgNamespace, 'path');
    front.setAttribute(
      'd',
      `M${x} ${y} C${x + direction * 68} ${y - 8},${x + direction * 68} ${y + pitch + 8},${x} ${y + pitch}`,
    );
    front.setAttribute('class', 'coil');
    const back = document.createElementNS(svgNamespace, 'path');
    back.setAttribute(
      'd',
      `M${x} ${y} Q${x - direction * 18} ${y + pitch / 2},${x} ${y + pitch}`,
    );
    back.setAttribute('class', 'coil coil-back');
    group.append(back, front);
  }
}

function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
resize();

const navigationKeys = new Set([
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
]);
function navigate(key) {
  if (window.parent === window) return;
  window.parent.document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true }),
  );
}
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.closest('input, select, textarea') ||
    (event.key === ' ' && event.target.closest('a, button, [role="button"]')) ||
    !navigationKeys.has(event.key)
  )
    return;
  event.preventDefault();
  navigate(event.key);
});

let touchStart = null;
document.addEventListener(
  'touchstart',
  (event) => {
    touchStart = null;
    if (
      event.target.closest(
        'a, button, [role="button"], input, select, textarea',
      )
    )
      return;
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
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigate(dx < 0 ? 'ArrowRight' : 'ArrowLeft');
    }
  },
  { passive: true },
);
document.addEventListener(
  'touchcancel',
  () => {
    touchStart = null;
  },
  { passive: true },
);
