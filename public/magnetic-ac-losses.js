import {
  magneticSample,
  eddySample,
  cycleSamples,
  cycleEnergy,
  maxEmf,
} from './magnetic-ac-losses-model.js';

const $ = (id) => document.getElementById(id);
const tau = 2 * Math.PI;
const controls = ['h-frequency', 'h-amplitude', 'b-frequency', 'b-amplitude'];
const value = (id) => Number($(id).value);
let hPhase = 0;
let bPhase = 0;
let time = 0;
let paused = false;
let history = [];
let previousAngles = [];
let chargePhase = 0;

function point(x, y) {
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

function moveDot(id, x, y) {
  $(id).setAttribute('cx', x);
  $(id).setAttribute('cy', y);
}

function updateLoop() {
  const amplitude = value('h-amplitude');
  const samples = cycleSamples(amplitude);
  const path =
    samples
      .map(
        (s, i) =>
          `${i === 0 ? 'M' : 'L'}${point(246 + s.h / 3, 60 - s.b * 23.5)}`,
      )
      .join('') + 'Z';
  for (const id of ['loop-path', 'loop-fill', 'loop-hatch']) {
    $(id).setAttribute('d', path);
  }
  $('loop-area').textContent = `每圈 ${cycleEnergy(samples).toFixed(0)} J/m³`;
  // Label actual remanence/coercivity intersections, not guessed positions.
  const remanence = magneticSample(Math.PI, amplitude).b;
  const crossing = samples.findIndex(
    (s, i) => i > 0 && s.b >= 0 && samples[i - 1].b < 0,
  );
  let labels = '';
  if (remanence > 0.01 && crossing > 0) {
    const a = samples[crossing - 1];
    const b = samples[crossing];
    const hc = a.h + ((b.h - a.h) * -a.b) / (b.b - a.b);
    const y = 60 - remanence * 23.5;
    labels = `<circle cx="246" cy="${y}" r="3" fill="#173b3b" /><text x="253" y="${y - 5}" class="plot-note">Bᵣ</text><circle cx="${246 + hc / 3}" cy="60" r="3" fill="#173b3b" /><text x="${255 + hc / 3}" y="55" class="plot-note">H꜀</text>`;
  }
  $('loop-landmarks').innerHTML = labels;
}

function record(t, hp, bp) {
  const h = magneticSample(hp, value('h-amplitude'));
  const e = eddySample(bp, value('b-frequency'), value('b-amplitude'));
  history.push({
    t,
    h: h.h / 600,
    hb: h.b / 1.6,
    b: e.b / 1.5,
    e: e.e / maxEmf,
  });
}

function initializeHistory() {
  history = [];
  for (let i = 0; i <= 480; i++) {
    const t = -4 + i / 120;
    record(
      t,
      hPhase + tau * value('h-frequency') * t,
      bPhase + tau * value('b-frequency') * t,
    );
  }
}

function scopePath(key, center, height) {
  return history
    .map(
      (s, i) =>
        `${i === 0 ? 'M' : 'L'}${point(456 + (s.t - time) * 102, center - s[key] * height)}`,
    )
    .join('');
}

function drawScopes() {
  for (const [pathId, dotId, key, center, height] of [
    ['h-wave', 'h-now', 'h', 60, 33],
    ['hb-wave', 'hb-now', 'hb', 60, 33],
    ['b-wave', 'b-now', 'b', 57, 30],
    ['e-wave', 'e-now', 'e', 57, 30],
  ]) {
    $(pathId).setAttribute('d', scopePath(key, center, height));
    moveDot(dotId, 456, center - history.at(-1)[key] * height);
  }
}

function warmColor(strength, shade = 0) {
  const t = Math.min(1, Math.max(0, strength));
  const cold = [195 - shade, 215 - shade, 204 - shade];
  const warm = [246 - shade, 140 - shade, 69 - shade];
  return `rgb(${cold.map((c, i) => Math.round(c + (warm[i] - c) * t)).join(' ')})`;
}

function drawDomains(sample, dt) {
  const circles = [];
  const angles = [];
  for (let i = 0; i < 12; i++) {
    // Mirrored pairs cancel transverse components. Their average horizontal
    // magnetization matches the ensemble which produces the plotted B.
    const start = Math.floor(i / 2) * 4;
    const m =
      sample.magnetizations.slice(start, start + 4).reduce((a, b) => a + b, 0) /
      4;
    const angle = Math.acos(Math.max(-1, Math.min(1, m))) * (i % 2 ? -1 : 1);
    angles.push(angle);
    const speed =
      dt > 0 && previousAngles.length
        ? Math.abs(angle - previousAngles[i]) / dt
        : 0;
    const heat = Math.min(1, speed / 5);
    const stroke = heat > 0.015 ? warmColor(Math.max(0.35, heat)) : '#6b9385';
    const x = 35 + i * 60;
    const rotation = (-angle * 180) / Math.PI;
    circles.push(
      `<g transform="translate(${x} 31)"><circle r="21" fill="#fcfdf9" stroke="${stroke}" stroke-width="4" /><path d="M-13 0H13M6 -6L13 0L6 6" fill="none" stroke="#214e4a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${rotation})" /></g>`,
    );
  }
  previousAngles = angles;
  $('domain-circles').innerHTML = circles.join('');
  $('domain-field').textContent =
    `H ${Math.abs(sample.h) < 0.01 ? '= 0' : sample.h > 0 ? '→' : '←'}`;
}

function ringPoint(angle, radius) {
  return {
    x: 221 + radius * Math.cos(angle) + radius * 0.28 * Math.sin(angle),
    y: 72 - radius * 0.16 * Math.sin(angle),
  };
}

function drawEddy(sample, dt) {
  const strength = Math.abs(sample.b) / 1.5;
  const electric = sample.e / maxEmf;
  const fields = [];
  const count = strength < 0.005 ? 0 : Math.max(1, Math.round(strength * 7));
  for (let i = 0; i < count; i++) {
    const x = 221 + (i - (count - 1) / 2) * 20;
    const halfLength = 58 + 8 * strength;
    const sign = Math.sign(sample.b);
    fields.push(
      `<path d="M${point(x, 72 + sign * halfLength)}L${point(x, 72 - sign * halfLength)}" stroke-width="${1.5 + strength * 2}" opacity="${0.3 + 0.7 * strength}" />`,
    );
  }
  $('eddy-field').innerHTML = fields.join('');
  chargePhase += electric * dt * 18;
  const loops = [];
  const charges = [];
  const active = Math.abs(electric) > 0.0001;
  for (const radius of [42, 76]) {
    const points = Array.from({ length: 81 }, (_, i) =>
      ringPoint((i / 80) * tau, radius),
    );
    loops.push(
      `<path d="${points.map((p, i) => `${i ? 'L' : 'M'}${point(p.x, p.y)}`).join('')}Z" stroke-width="${1 + Math.abs(electric) * 5}" opacity="${active ? 0.4 + Math.abs(electric) * 0.6 : 0.15}" />`,
    );
    if (!active) continue;
    for (let i = 0; i < 3; i++) {
      const angle = chargePhase + (i * tau) / 3;
      const p = ringPoint(angle, radius);
      const next = ringPoint(angle + Math.sign(electric) * 0.18, radius);
      const rotation = (Math.atan2(next.y - p.y, next.x - p.x) * 180) / Math.PI;
      charges.push(
        `<path d="M-6 -4L5 0L-6 4Z" transform="translate(${p.x} ${p.y}) rotate(${rotation})" opacity="${0.45 + Math.abs(electric) * 0.55}" />`,
      );
    }
  }
  $('eddy-loops').innerHTML = loops.join('');
  $('eddy-charges').innerHTML = charges.join('');
  // Fixed resistance: dissipated power ∝ E². A compressive color scale keeps
  // small losses visible without claiming a thermal-equilibrium temperature.
  const heat = (electric * electric) ** 0.35;
  [...$('block-faces').children].forEach((face, i) =>
    face.setAttribute('fill', warmColor(heat, i * 8)),
  );
  $('eddy-direction').textContent = !active
    ? '瞬时涡流 = 0'
    : electric > 0
      ? '俯视：逆时针'
      : '俯视：顺时针';
  $('eddy-heat').textContent = `E = ${sample.e.toFixed(3)} V`;
}

function render(dt = 0) {
  const h = magneticSample(hPhase, value('h-amplitude'));
  moveDot('loop-dot', 246 + h.h / 3, 60 - h.b * 23.5);
  drawDomains(h, dt);
  drawEddy(eddySample(bPhase, value('b-frequency'), value('b-amplitude')), dt);
  drawScopes();
}

function updateLabels() {
  for (const id of controls) {
    const frequency = id.endsWith('frequency');
    const digits = id === 'h-amplitude' ? 0 : 2;
    const unit = frequency ? 'Hz' : id === 'h-amplitude' ? 'A/m' : 'T';
    $(`${id}-value`).textContent = `${value(id).toFixed(digits)} ${unit}`;
  }
}

for (const id of controls) {
  $(id).addEventListener('input', () => {
    updateLabels();
    if (id === 'h-amplitude') updateLoop();
    // Start a fresh settled-cycle display after amplitude changes; this is
    // explicitly a periodic model, so no spurious transient is plotted.
    time = 0;
    initializeHistory();
    previousAngles = [];
    render();
  });
}

$('pause').addEventListener('click', () => {
  paused = !paused;
  $('pause').textContent = paused ? '继续演示' : '暂停演示';
  $('pause').setAttribute('aria-pressed', String(paused));
});
$('reset').addEventListener('click', () => {
  for (const id of controls) $(id).value = $(id).defaultValue;
  hPhase = bPhase = time = chargePhase = 0;
  paused = false;
  $('pause').textContent = '暂停演示';
  $('pause').setAttribute('aria-pressed', 'false');
  previousAngles = [];
  updateLabels();
  updateLoop();
  initializeHistory();
  render();
});

function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
resize();
updateLabels();
updateLoop();
initializeHistory();
render();

let previousTime;
function animate(timestamp) {
  const dt =
    previousTime === undefined
      ? 0
      : Math.min(0.05, (timestamp - previousTime) / 1000);
  previousTime = timestamp;
  if (!paused && !document.hidden && dt > 0) {
    // Sample at ≥120 Hz even on slower displays, preserving waveform shapes.
    const steps = Math.max(1, Math.ceil(dt * 120));
    for (let i = 0; i < steps; i++) {
      time += dt / steps;
      hPhase = (hPhase + (tau * value('h-frequency') * dt) / steps) % tau;
      bPhase = (bPhase + (tau * value('b-frequency') * dt) / steps) % tau;
      record(time, hPhase, bPhase);
    }
    while (history.length > 1 && history[0].t < time - 4) history.shift();
    render(dt);
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
