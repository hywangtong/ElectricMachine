import './dc-generator-emf-controls.js';

const conductor = document.querySelector('#moving-conductor');
const reverse = document.querySelector('#reverse-motion');
const pause = document.querySelector('#pause-motion');
const arrow = document.querySelector('#velocity-arrow');
const label = document.querySelector('#velocity-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let direction = 1;
let paused = reducedMotion.matches;
let angle = -20;
let lastTime = null;

function updateDirection() {
  document.querySelector('#emf-cross').toggleAttribute('hidden', direction < 0);
  document.querySelector('#emf-dot').toggleAttribute('hidden', direction > 0);
  document.querySelector('#emf-tag').textContent =
    direction > 0 ? 'e ×' : 'e ·';
  document.querySelector('#direction-reading').textContent =
    direction > 0 ? '向右运动 → e 入纸面 ×' : '向左运动 → e 出纸面 ·';
  arrow.setAttribute('x1', direction > 0 ? '453' : '429');
  arrow.setAttribute('y1', direction > 0 ? '205' : '193');
  arrow.setAttribute('x2', direction > 0 ? '485' : '397');
  arrow.setAttribute('y2', direction > 0 ? '220' : '178');
  label.setAttribute('x', direction > 0 ? '495' : '380');
  label.setAttribute('y', direction > 0 ? '226' : '170');
}

function updatePause() {
  pause.textContent = paused ? '继续动画' : '暂停动画';
  pause.setAttribute('aria-pressed', String(paused));
}

reverse.addEventListener('click', () => {
  direction *= -1;
  updateDirection();
});
pause.addEventListener('click', () => {
  paused = !paused;
  updatePause();
});
reducedMotion.addEventListener('change', () => {
  paused = reducedMotion.matches;
  updatePause();
});

function tick(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (!paused) {
    angle += direction * dt * 12;
    // Re-enter at the other edge of the same N-pole teaching window.
    if (angle > 12) angle = -57;
    if (angle < -57) angle = 12;
  }
  conductor.setAttribute('transform', `rotate(${angle} 310 480)`);
  requestAnimationFrame(tick);
}
updateDirection();
updatePause();
requestAnimationFrame(tick);
