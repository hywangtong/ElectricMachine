import {
  defaults,
  equilibrium,
  readings,
  step,
} from './dc-motor-load-current-model.mjs';

const $ = (id) => document.getElementById(id);
let input = { ...defaults };
let state = equilibrium(input);
let time = 0;
let angle = 0;
let paused = false;
let accumulator = 0;
let sampleTicks = 0;
let history = [{ time: 0, ...readings(state) }];
let events = [];
let experiment = '';
const dt = 1 / 240;
const channels = [
  { key: 'current', label: 'Ia / A', color: '#72e3be', span: 10 },
  { key: 'emf', label: 'E / V', color: '#f4c475', span: 50 },
  { key: 'speed', label: 'n / rpm', color: '#80bfff', span: 400 },
  { key: 'torque', label: 'T / N·m', color: '#d7a4ed', span: 12 },
];
const units = { voltage: 'V', resistance: 'Ω', load: 'N·m' };

function updateControls() {
  for (const key of Object.keys(input)) {
    $(key).value = input[key];
    $(`${key}-value`).textContent =
      `${key === 'resistance' ? input[key].toFixed(2) : input[key]} ${units[key]}`;
  }
  $('load-label').textContent = `${input.load} N·m`;
}

function change(key, value) {
  if (value === input[key]) return;
  const increasing = value > input[key];
  input[key] = value;
  const symbol = { voltage: 'U', resistance: 'R', load: 'TL' }[key];
  // Coalesce continuous dragging into an event marker, without resetting physics.
  if (events.at(-1)?.key === key && time - events.at(-1).time < 0.3)
    events.pop();
  events.push({ time, key, label: `${symbol}${increasing ? '↑' : '↓'}` });
  const slowsDown = key === 'voltage' ? !increasing : increasing;
  experiment =
    key === 'load'
      ? '负载改变 → 新稳态电流随负载转矩改变。'
      : slowsDown
        ? 'Ia↓ → T < TL → n↓、E↓ → Ia 恢复原值。'
        : 'Ia↑ → T > TL → n↑、E↑ → Ia 恢复原值。';
  updateControls();
  render();
}

for (const key of Object.keys(input)) {
  $(key).addEventListener('input', (event) =>
    change(key, Number(event.target.value)),
  );
}
document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.preset;
    const values = { voltage: 180, resistance: 1.8, load: 27 };
    change(key, values[key]);
  });
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
  time = angle = accumulator = sampleTicks = 0;
  paused = false;
  history = [{ time: 0, ...readings(state) }];
  events = [];
  experiment = '';
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

function render() {
  const actual = readings(state);
  const target = readings(equilibrium(input));
  const settled =
    Math.abs(actual.current - target.current) < 0.08 &&
    Math.abs(actual.speed - target.speed) < 1;
  $('current-meter').textContent = `${actual.current.toFixed(1)} A`;
  $('emf-meter').textContent = `${actual.emf.toFixed(1)} V`;
  $('speed-meter').textContent = `${actual.speed.toFixed(0)} rpm`;
  $('torque-meter').textContent = `${actual.torque.toFixed(1)} N·m`;
  $('target-current').textContent = `${target.current.toFixed(1)} A`;
  $('time').textContent = `${time.toFixed(2)} s${paused ? ' · 暂停' : ''}`;
  $('status').textContent = paused
    ? '已暂停 · 可调整设定后继续'
    : settled
      ? '已达稳态：T = TL'
      : '暂态：T ≠ TL，转速正在调整';
  $('explanation').textContent =
    experiment || '调节电压或电阻，观察电流先变化、再恢复。';
  $('target-speed').textContent =
    `新稳态：E = ${target.emf.toFixed(1)} V，n = ${target.speed.toFixed(0)} rpm。${actual.current < 0 ? '当前负电流：短时回馈制动。' : '虚线随设定更新，实线连续响应。'}`;
  $('shaft-marker').setAttribute('transform', `rotate(${angle})`);
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
      angle = (angle + ((state.omega * 180) / Math.PI / 30) * dt) % 360;
      accumulator -= dt;
      if (++sampleTicks === 4) {
        sampleTicks = 0;
        history.push({ time, ...readings(state) });
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
