import {
  defaults,
  equilibrium,
  readings,
  step,
  parameters,
  limits,
  magnetization,
} from './dc-generator-experiment-model.mjs';

const $ = (id) => document.getElementById(id);
let input = { ...defaults };
let state = equilibrium(input);
let time = 0;
let paused = false;
let accumulator = 0;
let sampleTicks = 0;
const dt = 1 / 240;
const scopeReadings = (s, settings) => {
  const r = readings(s, settings);
  return { ...r, flux: r.flux * 1000 };
};
let history = [{ time: 0, ...scopeReadings(state, input) }];
let events = [];
const channels = [
  { key: 'flux', label: 'Φ / mWb', color: '#72e3be', span: 8 },
  { key: 'current', label: 'Ia / A', color: '#f4c475', span: 10 },
  { key: 'emf', label: 'E / V', color: '#80bfff', span: 50 },
  { key: 'voltage', label: 'U / V', color: '#d7a4ed', span: 50 },
];

function updateControls() {
  for (const key of Object.keys(input)) {
    $(key).value = input[key];
    const open = input[key] === limits[key];
    $(key + '-value').textContent = open
      ? key === 'field'
        ? '∞ · 断励'
        : '∞ · 断路空载'
      : input[key] + ' Ω';
    $(key).setAttribute('aria-valuetext', $(key + '-value').textContent);
  }
}

function change(key, value) {
  if (value === input[key]) return;
  const increasing = value > input[key];
  input[key] = value;
  if (events.at(-1)?.key === key && time - events.at(-1).time < 0.3)
    events.pop();
  const symbol = key === 'field' ? 'Rf' : 'RL';
  events.push({
    time,
    key,
    label:
      value === limits[key] ? symbol + '∞' : symbol + (increasing ? '↑' : '↓'),
  });
  // Preserve both sides of a quasi-steady load step in the trace.
  history.push({ time, ...scopeReadings(state, input) });
  updateControls();
  render();
}
for (const key of Object.keys(input)) {
  $(key).addEventListener('input', (event) =>
    change(key, Number(event.target.value)),
  );
}
document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () =>
    change(button.dataset.preset, limits[button.dataset.preset]),
  );
});
$('pause').addEventListener('click', () => {
  paused = !paused;
  $('pause').textContent = paused ? '继续' : '暂停';
  $('pause').setAttribute('aria-pressed', String(paused));
  render();
});
$('reset').addEventListener('click', () => {
  input = { ...defaults };
  state = equilibrium(input);
  time = accumulator = sampleTicks = 0;
  paused = false;
  history = [{ time: 0, ...scopeReadings(state, input) }];
  events = [];
  $('pause').textContent = '暂停';
  $('pause').setAttribute('aria-pressed', 'false');
  updateControls();
  render();
});

const canvas = $('scope');
const ctx = canvas.getContext('2d');
function drawScope(target) {
  const width = 720;
  const height = 380;
  const left = 78;
  const right = 704;
  const start = Math.max(0, time - 12);
  const end = start + 12;
  const x = (t) => left + ((t - start) / (end - start)) * (right - left);
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, width, height);
  channels.forEach((channel, index) => {
    const top = 17 + index * 89;
    const bottom = top + 61;
    const values = history.map((sample) => sample[channel.key]);
    const low = Math.min(...values, target[channel.key]);
    const high = Math.max(...values, target[channel.key]);
    const range = Math.max(channel.span, high - low);
    const mid = (low + high) / 2;
    const min = mid - range * 0.65;
    const max = mid + range * 0.65;
    const y = (v) => bottom - ((v - min) / (max - min)) * (bottom - top);
    ctx.font = '13px Segoe UI, Microsoft YaHei, sans-serif';
    ctx.fillStyle = channel.color;
    ctx.textAlign = 'left';
    ctx.fillText(channel.label, 0, top - 3);
    ctx.fillStyle = '#9db7bf';
    ctx.textAlign = 'right';
    for (let j = 0; j <= 2; j++) {
      const value = max - ((max - min) * j) / 2;
      const yy = y(value);
      ctx.fillText(
        value.toFixed(channel.key === 'speed' ? 0 : 1),
        left - 9,
        yy + 4,
      );
      ctx.strokeStyle = '#2d464e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, yy);
      ctx.lineTo(right, yy);
      ctx.stroke();
    }
    for (let t = Math.ceil(start / 2) * 2; t <= end; t += 2) {
      ctx.strokeStyle = '#2d464e';
      ctx.beginPath();
      ctx.moveTo(x(t), top);
      ctx.lineTo(x(t), bottom);
      ctx.stroke();
      if (index === 3) {
        ctx.fillStyle = '#a9c4c7';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.toFixed(0)}s`, x(t), height - 2);
      }
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
    ctx.strokeStyle = channel.color;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(left, y(target[channel.key]));
    ctx.lineTo(right, y(target[channel.key]));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    for (const event of events) {
      ctx.strokeStyle = '#8d9c9e';
      ctx.beginPath();
      ctx.moveTo(x(event.time), top);
      ctx.lineTo(x(event.time), bottom);
      ctx.stroke();
    }
    ctx.strokeStyle = channel.color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    history.forEach((sample, i) => {
      if (i === 0) ctx.moveTo(x(sample.time), y(sample[channel.key]));
      else ctx.lineTo(x(sample.time), y(sample[channel.key]));
    });
    ctx.stroke();
    ctx.restore();
  });
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillStyle = '#e1e9e4';
  ctx.textAlign = 'left';
  for (const event of events)
    ctx.fillText(event.label, Math.min(x(event.time) + 3, right - 25), 12);
}

const bhX = (h) => 34 + (h / 1300) * 189;
const bhY = (b) => 133 - (b / 1.3) * 106;
$('bh-curve').setAttribute(
  'd',
  Array.from(
    { length: 131 },
    (_, i) => (i ? 'L' : 'M') + bhX(i * 10) + ' ' + bhY(magnetization(i * 10)),
  ).join(' '),
);

function render() {
  const actual = readings(state, input);
  const target = scopeReadings(equilibrium(input), input);
  const settled = Math.abs(actual.fieldCurrent - target.fieldCurrent) < 0.001;
  const noLoad = input.load === limits.load;
  const noField = actual.fieldCurrent === 0;
  $('flux-meter').textContent = (actual.flux * 1000).toFixed(2) + ' mWb';
  $('current-meter').textContent = actual.current.toFixed(2) + ' A';
  $('emf-meter').textContent = actual.emf.toFixed(2) + ' V';
  $('voltage-meter').textContent = actual.voltage.toFixed(2) + ' V';
  $('field-current').textContent =
    'Iᶠ = ' + actual.fieldCurrent.toFixed(2) + ' A';
  $('bh-reading').textContent =
    'H = ' + actual.h.toFixed(0) + ' A/m · B = ' + actual.b.toFixed(3) + ' T';
  $('bh-point').setAttribute('cx', bhX(actual.h));
  $('bh-point').setAttribute('cy', bhY(actual.b));
  $('bh-guides').setAttribute(
    'd',
    'M34 ' + bhY(actual.b) + 'H' + bhX(actual.h) + 'V133',
  );
  $('time').textContent = time.toFixed(2) + ' s' + (paused ? ' · 暂停' : '');
  $('balance').textContent =
    actual.emf.toFixed(1) +
    ' − ' +
    actual.current.toFixed(2) +
    ' × 0.8 = ' +
    actual.voltage.toFixed(1) +
    ' V';
  $('no-load-note').textContent = noLoad
    ? '当前空载：Iₐ = 0 A，U = E = ' + actual.emf.toFixed(2) + ' V'
    : '带载：IₐRₐ = ' +
      (actual.current * parameters.ra).toFixed(2) +
      ' V，因此 U < E；断开负载观察 U = E。';
  $('status').textContent = paused
    ? '已暂停 · 设定仍可调'
    : noField
      ? '零励磁 · 剩磁仍在'
      : settled
        ? '已达励磁稳态'
        : '励磁暂态 · 工作点正在移动';
  $('explanation').textContent = noField
    ? 'Iᶠ = 0，Φᵣ = 1.20 mWb，仍产生 Eᵣ = 13.50 V。'
    : input.field === limits.field
      ? '励磁电流衰减至零，工作点回到剩磁 Bᵣ。'
      : 'Rᶠ调 ↑ → Iᶠ ↓ → Φ ↓ → E ↓；增大励磁时逐渐饱和。';
  $('load-resistor').setAttribute('visibility', noLoad ? 'hidden' : 'visible');
  $('field-resistor').setAttribute(
    'visibility',
    input.field === limits.field ? 'hidden' : 'visible',
  );
  $('field-break').setAttribute(
    'visibility',
    input.field === limits.field ? 'visible' : 'hidden',
  );
  $('load-break').setAttribute('visibility', noLoad ? 'visible' : 'hidden');
  $('circuit-state').textContent = noLoad ? '断路 · Iₐ = 0' : '向负载送电';
  $('armature-arrow').style.opacity = noLoad ? '0' : '1';
  $('field-arrow').style.opacity = noField ? '0' : '1';
  $('armature-flow').style.opacity = noLoad ? '0' : '0.75';
  $('field-flow').style.opacity = noField ? '0' : '0.75';
  $('armature-flow').style.strokeDashoffset = -time * 20;
  $('field-flow').style.strokeDashoffset = -time * 20;
  drawScope(target);
}

let previous = performance.now();
let lastPaint = 0;
function frame(now) {
  const elapsed = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  if (!paused && !document.hidden) {
    accumulator += elapsed;
    while (accumulator >= dt) {
      state = step(state, input, dt);
      time += dt;
      accumulator -= dt;
      if (++sampleTicks === 4) {
        sampleTicks = 0;
        history.push({ time, ...scopeReadings(state, input) });
      }
    }
    while (history.length > 1 && history[1].time < time - 12) history.shift();
    events = events.filter((event) => event.time >= time - 12);
  }
  if (now - lastPaint > 32) {
    render();
    lastPaint = now;
  }
  requestAnimationFrame(frame);
}

// Local navigation preserves range keys, button activation and control dragging.
const interactive = (target) =>
  target instanceof Element &&
  target.closest('input, button, a, select, textarea');
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    interactive(event.target) ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (
    ![
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
    touchStart = interactive(event.target)
      ? null
      : { x: event.touches[0].clientX, y: event.touches[0].clientY };
  },
  { passive: true },
);
document.addEventListener(
  'touchend',
  (event) => {
    const start = touchStart;
    touchStart = null;
    if (!start || window.parent === window) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
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
document.addEventListener('visibilitychange', () => {
  previous = performance.now();
});

resize();
updateControls();
render();
requestAnimationFrame(frame);
