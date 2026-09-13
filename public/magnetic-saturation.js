import {
  advanceField,
  createMagneticState,
  domainDirections,
  sampleCurve,
} from './magnetic-saturation-model.js';

const $ = (id) => document.getElementById(id);
const x = (h) => 410 + (350 * h) / 3;
const y = (b) => 240 - 165 * b;
const coordinates = (point) =>
  `${x(point.h).toFixed(2)} ${y(point.b).toFixed(2)}`;
const path = (points) =>
  points.map((point, i) => `${i ? 'L' : 'M'}${coordinates(point)}`).join('');
const signed = (number) =>
  `${number < -0.0005 ? '−' : number > 0.0005 ? '+' : ''}${Math.abs(number).toFixed(2)}`;

const descending = sampleCurve(3, -3);
const ascending = sampleCurve(-3, 3);
const virgin = sampleCurve(0, 3);
$('descending-curve').setAttribute('d', path(descending));
$('ascending-curve').setAttribute('d', path(ascending));
$('loop-fill').setAttribute(
  'd',
  `${path(descending)}${path(ascending).replace(/^M/, 'L')}Z`,
);
$('virgin-positive').setAttribute('d', path(virgin));
$('virgin-negative').setAttribute('d', path(sampleCurve(0, -3)));
$('down-direction').setAttribute('d', path(descending.slice(155, 176)));
$('up-direction').setAttribute('d', path(ascending.slice(155, 176)));

const br = descending.find((point) => Math.abs(point.h) < 1e-8).b;
const hcPoint = ascending.reduce((best, point) =>
  Math.abs(point.b) < Math.abs(best.b) ? point : best,
);
const hc = hcPoint.h;
$('characteristic-points').innerHTML = [
  { h: 0, b: br },
  { h: 0, b: -br },
  { h: hc, b: 0 },
  { h: -hc, b: 0 },
]
  .map((point) => `<circle cx="${x(point.h)}" cy="${y(point.b)}" r="5" />`)
  .join('');
$('br-label').setAttribute('y', y(br) - 8);
$('negative-br-label').setAttribute('y', y(-br) + 23);
$('hc-label').setAttribute('x', x(hc) + 10);
$('negative-hc-label').setAttribute('x', x(-hc) - 40);
const knee = virgin.find((point) => point.h >= 1.6);
$('knee-point').setAttribute('cx', x(knee.h));
$('knee-point').setAttribute('cy', y(knee.b));
$('knee-leader').setAttribute('d', `M${coordinates(knee)}L570 57`);

// Opposite pairs have zero initial vector sum. Their mean horizontal
// component equals the model magnetization, including at H=0 with remanence.
const angles = domainDirections(0);
$('domain-cells').innerHTML = angles
  .map((_, i) => {
    const cx = 44 + (i % 12) * (560 / 12);
    const cy = 82 + Math.floor(i / 12) * 56;
    return `<rect x="${cx - 21}" y="${cy - 24}" width="42" height="48" rx="7" fill="#e5f2ee" stroke="#c8d9d4" />
    <g id="domain-arrow-${i}" transform="translate(${cx} ${cy})"><path d="M-16 0H15M7 -7L16 0L7 7" fill="none" stroke="#2f7c70" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" /></g>`;
  })
  .join('');

let state = createMagneticState();
let target = 0;
let frame = 0;
let lastTime = 0;
let hasHistory = false;
let direction = 0;
let virginDirection = 0;
let onVirginCurve = true;
let trail = [{ h: 0, b: 0 }];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function render() {
  const { field: h, b, magnetization: m } = state;
  for (const id of ['excitation-point', 'excitation-halo']) {
    $(id).setAttribute('cx', x(h));
    $(id).setAttribute('cy', y(b));
  }
  $('point-guides').setAttribute('d', `M410 ${y(b)}H${x(h)}V240`);
  $('excitation-trail').setAttribute('d', path(trail));
  $('point-value').textContent = `H = ${signed(h)} · B = ${signed(b)}`;
  $('field').setAttribute(
    'aria-valuetext',
    `目标 H ${signed(target)}，当前 H ${signed(h)}，B ${signed(b)}`,
  );
  const remanent = Math.abs(h) < 1e-8 && Math.abs(m) > 0.01;
  const saturated = Math.abs(m) > 0.96;
  let badge;
  let description;
  if (!hasHistory) {
    badge = '初始退磁态';
    description = '初始：各磁畴仍有磁化，但方向互相抵消，整体 B=0。';
  } else if (remanent) {
    badge = m > 0 ? '正剩磁' : '负剩磁';
    description = `H 已撤去，但部分磁畴保留${m > 0 ? '向右' : '向左'}取向（橙色），不能完全抵消：B=${signed(b)} ≠ 0。`;
  } else if (saturated) {
    badge = '接近饱和';
    description = `磁畴几乎都${m > 0 ? '向右' : '向左'}排列；再加 H，净磁化已难再增加，B 只缓慢增长。`;
  } else if (Math.abs(b) < 0.025) {
    badge = onVirginCurve ? '初始磁化' : '净磁通接近零';
    description = onVirginCurve
      ? '从原点开始磁化，磁畴取向刚开始重排，净 B 仍很小。'
      : '历史回扫使净 B 接近零；磁畴仍存在，不代表恢复了初始退磁态。';
  } else {
    badge = '磁畴重排中';
    description = `磁畴随励磁历史重排，净磁化${m > 0 ? '向右' : '向左'}；减小 H 不会原路退回。`;
  }
  $('domain-badge').textContent = badge;
  $('domain-state').textContent = description;
  $('path-status').textContent = !hasHistory
    ? '初始退磁态：H=0，B=0，磁畴取向互相抵消。'
    : remanent
      ? '同样 H=0，现在 B≠0：这就是剩磁。反向励磁才会逐步抵消。'
      : `${direction > 0 ? '增大 H →' : '减小 H ←'} 沿历史路径运动；未到饱和就反向，会形成局部回线。`;
  domainDirections(m).forEach(({ cosine, rotation }, i) => {
    const cx = 44 + (i % 12) * (560 / 12);
    const cy = 82 + Math.floor(i / 12) * 56;
    $(`domain-arrow-${i}`).setAttribute(
      'transform',
      `translate(${cx} ${cy}) rotate(${rotation})`,
    );
    $(`domain-arrow-${i}`).firstElementChild.setAttribute(
      'stroke',
      remanent && Math.sign(cosine) === Math.sign(m) ? '#b36b39' : '#2f7c70',
    );
  });
  $('domain-field').setAttribute('x1', 300 - Math.abs(h) * 38);
  $('domain-field').setAttribute(
    'x2',
    300 + Math.abs(h) * 38 * (h < 0 ? -1 : 1),
  );
  // Center the applied-field arrow, reverse its direction, hide it at H=0.
  if (h < 0) $('domain-field').setAttribute('x1', 300 + Math.abs(h) * 38);
  $('domain-field').style.visibility = h === 0 ? 'hidden' : 'visible';
  $('domain-field-label').textContent = `H = ${signed(h)}`;
  $('bh-diagram').setAttribute(
    'aria-label',
    `非线性 B-H 磁滞回线与虚线初始磁化曲线；当前励磁点 H=${signed(h)}，B=${signed(b)}。${badge}`,
  );
  $('domain-diagram').setAttribute('aria-label', description);
}

function animate(time) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 1 / 60;
  lastTime = time;
  const distance = target - state.field;
  const step = Math.sign(distance) * Math.min(Math.abs(distance), dt * 7);
  advanceField(
    state,
    Math.abs(distance) <= Math.abs(step) ? target : state.field + step,
  );
  trail.push({ h: state.field, b: state.b });
  if (trail.length > 1200) trail.shift();
  render();
  if (state.field !== target) frame = requestAnimationFrame(animate);
  else {
    frame = 0;
    lastTime = 0;
  }
}

function setTarget(value) {
  target = value;
  $('field').value = String(value);
  if (target === state.field) return;
  hasHistory = true;
  direction = Math.sign(target - state.field);
  if (!virginDirection) virginDirection = direction;
  else if (direction !== virginDirection) onVirginCurve = false;
  if (reducedMotion.matches) {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const points = sampleCurve(state.field, target, state);
    trail.push(...points.slice(1));
    trail = trail.slice(-1200);
    render();
  } else if (!frame) frame = requestAnimationFrame(animate);
}

$('field').addEventListener('input', (event) =>
  setTarget(Number(event.target.value)),
);
$('zero-field').addEventListener('click', () => setTarget(0));
$('reset-state').addEventListener('click', () => {
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  target = 0;
  hasHistory = false;
  direction = 0;
  virginDirection = 0;
  onVirginCurve = true;
  state = createMagneticState();
  trail = [{ h: 0, b: 0 }];
  $('field').value = '0';
  render();
});
render();
