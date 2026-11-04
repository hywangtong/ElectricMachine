import { PHASES, sample } from './transformer-three-phase-model.mjs';

const bank = document.getElementById('bank');
const core = document.getElementById('core');
const waves = document.getElementById('waves');
const angleInput = document.getElementById('angle');
const angleValue = document.getElementById('angle-value');
const playButton = document.getElementById('play');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const fluxElements = [];
const cursorElements = [];
const waveDots = [];
let angle = 30;
let playing = !reducedMotion.matches;
let visible = false;
let frame = 0;
let previous = 0;

const ns = 'http://www.w3.org/2000/svg';
function element(tag, attributes, parent) {
  const node = document.createElementNS(ns, tag);
  Object.entries(attributes).forEach(([key, value]) =>
    node.setAttribute(key, String(value)),
  );
  parent.append(node);
  return node;
}

function text(parent, x, y, value, attributes = {}) {
  const node = element('text', { x, y, ...attributes }, parent);
  node.textContent = value;
  return node;
}

function phaseGroup(parent, phase) {
  return element('g', { class: 'phase-part', 'data-phase': phase }, parent);
}

function bolt(parent, x, y) {
  element(
    'circle',
    { cx: x, cy: y, r: 3.4, fill: '#e5e9df', stroke: '#7d9187' },
    parent,
  );
  element('path', { d: `M${x - 1.8} ${y}h3.6`, stroke: '#7d9187' }, parent);
}

// Front elevation with a small extrusion: the winding placement stays legible.
function iron(parent, outline, holes, bolts) {
  const path = outline + holes;
  element(
    'path',
    {
      d: path,
      transform: 'translate(7 -7)',
      fill: '#a4b4aa',
      'fill-rule': 'evenodd',
      stroke: '#74887d',
      'stroke-width': 1.4,
    },
    parent,
  );
  for (const offset of [5.5, 4, 2.5, 1]) {
    element(
      'path',
      {
        d: path,
        transform: `translate(${offset} ${-offset})`,
        fill: '#cad4c9',
        'fill-rule': 'evenodd',
        stroke: '#8c9f92',
        'stroke-width': 0.5,
      },
      parent,
    );
  }
  element(
    'path',
    {
      d: path,
      fill: '#d8e0d7',
      'fill-rule': 'evenodd',
      stroke: '#74887d',
      'stroke-width': 1.4,
    },
    parent,
  );
  bolts.forEach(([x, y]) => bolt(parent, x, y));
}

function winding(parent, x, y, phase) {
  const color = PHASES[phase].color;
  const group = phaseGroup(parent, phase);
  element(
    'rect',
    {
      x: x - 20,
      y: y - 4,
      width: 40,
      height: 48,
      rx: 5,
      fill: '#f7f2e5',
      stroke: '#c4bda6',
    },
    group,
  );
  for (let turn = 0; turn < 6; turn++) {
    const cy = y + turn * 7;
    element(
      'path',
      {
        d: `M${x - 19} ${cy}C${x - 32} ${cy - 9} ${x + 29} ${cy - 9} ${x + 23} ${cy}`,
        fill: 'none',
        stroke: color,
        'stroke-width': 2,
        opacity: 0.42,
      },
      group,
    );
    element(
      'path',
      {
        d: `M${x + 23} ${cy}C${x + 30} ${cy + 9} ${x - 30} ${cy + 9} ${x - 23} ${cy}`,
        fill: 'none',
        stroke: color,
        'stroke-width': 3.2,
        'stroke-linecap': 'round',
      },
      group,
    );
  }
  for (const endY of [y, y + 35]) {
    element(
      'path',
      {
        d: `M${x - 23} ${endY}H${x - 38}`,
        stroke: color,
        'stroke-width': 2,
        fill: 'none',
      },
      group,
    );
    element(
      'circle',
      {
        cx: x - 40,
        cy: endY,
        r: 2.7,
        fill: '#fffdf7',
        stroke: color,
        'stroke-width': 1.8,
      },
      group,
    );
  }
}

function flux(parent, path, valueOf, color, phase, arrowAt) {
  const group = phase === undefined ? parent : phaseGroup(parent, phase);
  const line = element(
    'path',
    {
      d: path,
      fill: 'none',
      stroke: color,
      'stroke-width': 3,
      'stroke-dasharray': '5 7',
      'stroke-linecap': 'round',
    },
    group,
  );
  const arrow = element(
    'path',
    {
      d: 'M-5 6L0 0L5 6',
      fill: 'none',
      stroke: color,
      'stroke-width': 3,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    group,
  );
  fluxElements.push({ line, arrow, valueOf, arrowAt, offset: 0 });
}

function buildBank() {
  PHASES.forEach(({ name, terminal, color }, phase) => {
    const left = 28 + phase * 136;
    const x = left + 18;
    text(bank, left + 41, 23, `${name} · ${terminal}`, {
      fill: color,
      'font-size': 19,
      'text-anchor': 'middle',
    });
    iron(bank, `M${left} 49h93v176h-93Z`, `M${left + 34} 77h31v120h-31Z`, [
      [left + 15, 62],
      [left + 78, 62],
      [left + 15, 211],
      [left + 78, 211],
    ]);
    // A private return limb exists for every phase in a bank of single phases.
    flux(
      bank,
      `M${x} 137V63H${left + 79}V211H${x}Z`,
      (state) => state.phases[phase].phi,
      color,
      phase,
      [left + 79, 151, 180],
    );
    winding(bank, x, 88, phase);
    winding(bank, x, 152, phase);
    text(bank, left + 46, 253, '独立磁路', {
      fill: '#6f847a',
      'font-size': 16,
      'text-anchor': 'middle',
    });
  });
}

function buildCore() {
  const xs = [66, 210, 354];
  iron(core, 'M48 49H372V225H48Z', 'M84 77H192V197H84ZM228 77H336V197H228Z', [
    [66, 62],
    [210, 62],
    [354, 62],
    [66, 211],
    [210, 211],
    [354, 211],
  ]);
  xs.forEach((x, phase) => {
    const { name, terminal, color } = PHASES[phase];
    text(core, x, 23, `${name} · ${terminal}`, {
      fill: color,
      'font-size': 19,
      'text-anchor': 'middle',
    });
    // All three positive references point up; the upper yoke carries A and A+B.
    flux(
      core,
      `M${x} 211V63`,
      (state) => state.phases[phase].phi,
      color,
      phase,
      [x, 142, 0],
    );
  });
  for (const [index, color] of [
    [0, PHASES[0].color],
    [1, PHASES[2].color],
  ]) {
    flux(
      core,
      `M${xs[index]} 63H${xs[index + 1]}`,
      (state) => state.yokes[index],
      color,
      undefined,
      [(xs[index] + xs[index + 1]) / 2, 63, 90],
    );
    flux(
      core,
      `M${xs[index]} 211H${xs[index + 1]}`,
      (state) => -state.yokes[index],
      color,
      undefined,
      [(xs[index] + xs[index + 1]) / 2, 211, 90],
    );
  }
  xs.forEach((x, phase) => {
    winding(core, x, 88, phase);
    winding(core, x, 152, phase);
  });
  text(core, 210, 253, '共用磁轭 · 三柱相互回磁', {
    fill: '#6f847a',
    'font-size': 16,
    'text-anchor': 'middle',
  });
}

const plot = { left: 46, width: 438, amplitude: 29 };
const rows = [
  { key: 'u', title: '相电压  u / Uₘ', center: 52 },
  { key: 'i', title: '励磁电流  iμ / Iμₘ', center: 158 },
  { key: 'phi', title: '主磁通  Φ / Φₘ', center: 264 },
];

function buildWaves() {
  rows.forEach(({ key, title, center }) => {
    text(waves, 6, center - 37, title, {
      fill: '#365951',
      'font-size': 17,
      'font-weight': 600,
    });
    [-1, 0, 1].forEach((value) => {
      const y = center - value * plot.amplitude;
      element(
        'path',
        {
          d: `M${plot.left} ${y}h${plot.width}`,
          fill: 'none',
          stroke: value === 0 ? '#adbeb3' : '#e0e7df',
          'stroke-width': 1,
        },
        waves,
      );
      text(
        waves,
        plot.left - 12,
        y + 4,
        value === 0 ? '0' : value > 0 ? '+1' : '−1',
        { fill: '#82958a', 'font-size': 12, 'text-anchor': 'end' },
      );
    });
    [0, 90, 180, 270, 360].forEach((degrees) => {
      const x = plot.left + (degrees / 360) * plot.width;
      element(
        'path',
        {
          d: `M${x} ${center - plot.amplitude}v${2 * plot.amplitude}`,
          stroke: '#e0e7df',
          'stroke-width': 1,
        },
        waves,
      );
      text(waves, x, center + plot.amplitude + 16, `${degrees}°`, {
        fill: '#82958a',
        'font-size': 12,
        'text-anchor': 'middle',
      });
    });
    PHASES.forEach(({ color, dash }, phase) => {
      const group = phaseGroup(waves, phase);
      const points = Array.from({ length: 241 }, (_, index) => {
        const degrees = index * 1.5;
        return `${index === 0 ? 'M' : 'L'}${plot.left + (degrees / 360) * plot.width} ${center - sample(degrees).phases[phase][key] * plot.amplitude}`;
      }).join('');
      element(
        'path',
        {
          d: points,
          fill: 'none',
          stroke: color,
          'stroke-width': 2.2,
          'stroke-dasharray': dash,
        },
        group,
      );
      const dot = element(
        'circle',
        { r: 4.5, fill: color, stroke: '#fff', 'stroke-width': 1.5 },
        group,
      );
      waveDots.push({ dot, phase, key, center });
    });
    cursorElements.push(
      element(
        'path',
        {
          d: `M0 ${center - 34}v68`,
          stroke: '#365951',
          'stroke-width': 1.2,
          opacity: 0.7,
        },
        waves,
      ),
    );
  });
}

function signed(value) {
  return `${value < -0.0005 ? '−' : '+'}${Math.abs(value).toFixed(2)}`;
}

function draw(dt = 0) {
  const state = sample(angle);
  const cursorX = plot.left + (angle / 360) * plot.width;
  angleInput.value = angle.toFixed(0);
  angleValue.value = `${angle.toFixed(0).padStart(3, '0')}°`;
  document.getElementById('time-value').textContent =
    `t = ${((angle / 360) * 20).toFixed(2)} ms`;
  document.querySelectorAll('[data-flux]').forEach((node) => {
    node.textContent = signed(state.phases[Number(node.dataset.flux)].phi);
  });
  document.getElementById('flux-sum').textContent = Math.abs(state.sum).toFixed(
    2,
  );
  cursorElements.forEach((node) =>
    node.setAttribute('transform', `translate(${cursorX} 0)`),
  );
  waveDots.forEach(({ dot, phase, key, center }) => {
    dot.setAttribute('cx', cursorX);
    dot.setAttribute('cy', center - state.phases[phase][key] * plot.amplitude);
  });
  fluxElements.forEach(({ line, arrow, valueOf, arrowAt }, index) => {
    const value = valueOf(state);
    const magnitude = Math.abs(value);
    fluxElements[index].offset -= value * dt * 38;
    line.setAttribute('stroke-dashoffset', fluxElements[index].offset);
    line.setAttribute('opacity', 0.12 + 0.88 * magnitude);
    line.setAttribute('stroke-width', 1.5 + magnitude * 2.2);
    const [x, y, rotation] = arrowAt;
    arrow.setAttribute(
      'transform',
      `translate(${x} ${y}) rotate(${rotation + (value < 0 ? 180 : 0)}) scale(${0.55 + magnitude * 0.8})`,
    );
    arrow.setAttribute('opacity', Math.min(1, magnitude * 7));
  });
}

function tick(now) {
  const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
  previous = now;
  angle = (angle + dt * 30) % 360;
  draw(dt);
  frame = requestAnimationFrame(tick);
}

function updateAnimation() {
  cancelAnimationFrame(frame);
  frame = 0;
  previous = 0;
  playButton.textContent = playing ? '暂停' : '播放';
  playButton.setAttribute(
    'aria-label',
    playing ? '暂停同步动画' : '播放同步动画',
  );
  if (playing && visible && !document.hidden)
    frame = requestAnimationFrame(tick);
}

playButton.addEventListener('click', () => {
  playing = !playing;
  updateAnimation();
});
angleInput.addEventListener('input', () => {
  playing = false;
  angle = Number(angleInput.value);
  draw();
  updateAnimation();
});
document.getElementById('step').addEventListener('click', () => {
  playing = false;
  angle = (Math.round(angle / 30) * 30 + 30) % 360;
  draw();
  updateAnimation();
});
document.getElementById('reset').addEventListener('click', () => {
  angle = 30;
  playing = false;
  fluxElements.forEach((item) => {
    item.offset = 0;
  });
  draw();
  updateAnimation();
});
document.querySelectorAll('[data-select]').forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.dataset.select;
    document.querySelectorAll('[data-select]').forEach((other) => {
      other.setAttribute('aria-pressed', String(other === button));
    });
    document.querySelectorAll('[data-phase]').forEach((node) => {
      node.classList.toggle(
        'dimmed',
        selected !== 'all' && node.dataset.phase !== selected,
      );
    });
  });
});
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  updateAnimation();
}).observe(document.querySelector('.lesson'));
document.addEventListener('visibilitychange', updateAnimation);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) playing = false;
  updateAnimation();
});

function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
buildBank();
buildCore();
buildWaves();
resize();
draw();
updateAnimation();

// Preserve course navigation while keeping sliders and buttons operable.
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
    (event.key === ' ' && event.target.closest('button, a')) ||
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
    if (event.target.closest('a, button, input, select, textarea')) return;
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
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
      navigate(dx < 0 ? 'ArrowRight' : 'ArrowLeft');
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
