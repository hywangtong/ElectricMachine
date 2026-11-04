import { PHASES, sample } from './transformer-three-phase-model.mjs';

const ns = 'http://www.w3.org/2000/svg';
const core = document.getElementById('core');
const xs = [126, 270, 414];
const names = { star: '星形', neutral: '星形并引出中性线', delta: '三角形' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const fluxElements = [];
let playing = !reducedMotion.matches;
let visible = false;
let frame = 0;
let previous = 0;
let angle = 30;

function element(tag, attributes, parent) {
  const node = document.createElementNS(ns, tag);
  Object.entries(attributes).forEach(([key, value]) =>
    node.setAttribute(key, String(value)),
  );
  parent.append(node);
  return node;
}
function label(parent, value, attributes) {
  const node = element('text', attributes, parent);
  node.textContent = value;
  return node;
}
function phaseGroup(parent, phase) {
  return element('g', { 'data-phase': phase }, parent);
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
  group.dataset.winding = `${phase}-${y}`;
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
  for (const [endX, endY, innerX] of [
    [x - 40, y, x - 23],
    [x + 40, y + 35, x + 23],
  ]) {
    element(
      'path',
      {
        d: `M${innerX} ${endY}H${endX}`,
        stroke: color,
        'stroke-width': 2,
        fill: 'none',
      },
      group,
    );
    element(
      'circle',
      {
        cx: endX,
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

// Copy of the core-type model from the preceding lesson: the same laminated
// iron, six windings and flux paths. External electrical leads are added below.
function buildCore() {
  const group = element('g', { transform: 'translate(60 40)' }, core);
  iron(group, 'M48 49H372V225H48Z', 'M84 77H192V197H84ZM228 77H336V197H228Z', [
    [66, 62],
    [210, 62],
    [354, 62],
    [66, 211],
    [210, 211],
    [354, 211],
  ]);
  [66, 210, 354].forEach((x, phase) => {
    flux(
      group,
      `M${x} 211V63`,
      (state) => state.phases[phase].phi,
      PHASES[phase].color,
      phase,
      [x, 142, 0],
    );
  });
  for (let i = 0; i < 2; i++) {
    const left = [66, 210][i];
    const right = [210, 354][i];
    const color = PHASES[i === 0 ? 0 : 2].color;
    flux(
      group,
      `M${left} 63H${right}`,
      (state) => state.yokes[i],
      color,
      undefined,
      [(left + right) / 2, 63, 90],
    );
    flux(
      group,
      `M${left} 211H${right}`,
      (state) => -state.yokes[i],
      color,
      undefined,
      [(left + right) / 2, 211, 90],
    );
  }
  [66, 210, 354].forEach((x, phase) => {
    winding(group, x, 88, phase);
    winding(group, x, 152, phase);
  });
}
buildCore();

function symbol(connection, primary) {
  const letter = connection === 'delta' ? 'D' : 'Y';
  return (
    (primary ? letter : letter.toLowerCase()) +
    (connection === 'neutral' ? `<sub>${primary ? 'N' : 'n'}</sub>` : '')
  );
}

function buildSide(id, primary, connection) {
  const group = element('g', { 'data-side-wiring': id }, core);
  const startY = primary ? 128 : 192;
  const endY = startY + 35;
  const lineY = primary ? 16 : 345;
  const starts = xs.map((x) => [x - 40, startY]);
  const finishes = xs.map((x) => [x + 40, endY]);
  starts.forEach(([x, y], phase) => {
    element(
      'path',
      {
        d: `M${x} ${y}V${lineY}`,
        fill: 'none',
        stroke: PHASES[phase].color,
        'stroke-width': 2,
      },
      group,
    );
    element(
      'circle',
      {
        cx: x,
        cy: lineY,
        r: 3,
        fill: '#fffdf7',
        stroke: PHASES[phase].color,
        'stroke-width': 1.7,
      },
      group,
    );
    label(group, (primary ? 'ABC' : 'abc')[phase], {
      x: x - 10,
      y: lineY + 5,
      'text-anchor': 'end',
      fill: PHASES[phase].color,
      'font-size': 17,
    });
    for (const [point, name, dx] of [
      [starts[phase], (primary ? 'ABC' : 'abc')[phase], -8],
      [finishes[phase], (primary ? 'XYZ' : 'xyz')[phase], 8],
    ]) {
      label(group, name, {
        x: point[0] + dx,
        y: point[1] + 5,
        'text-anchor': dx < 0 ? 'end' : 'start',
        fill: PHASES[phase].color,
        'font-size': 14,
        stroke: '#fffdf7',
        'stroke-width': 3,
        'paint-order': 'stroke',
      });
    }
  });
  const wiring = element('g', {}, group);
  return { id, primary, connection, group, wiring, starts, finishes, lineY };
}
const sides = [
  buildSide('primary', true, 'star'),
  buildSide('secondary', false, 'neutral'),
];

// Draw crossing bridges on horizontal leads. Only dots are electrical joins.
function wire(points, verticals, color, parent, attributes = {}) {
  let d = `M${points[0].join(' ')}`;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    if (y1 === y2) {
      const direction = Math.sign(x2 - x1);
      const crossings = [
        ...new Set(
          verticals
            .filter(
              ([x, top, bottom]) =>
                x > Math.min(x1, x2) + 5 &&
                x < Math.max(x1, x2) - 5 &&
                y1 > top &&
                y1 < bottom,
            )
            .map(([x]) => x),
        ),
      ].sort((a, b) => direction * (a - b));
      for (const x of crossings) {
        d += `L${x - direction * 4} ${y1}Q${x} ${y1 - 8} ${x + direction * 4} ${y1}`;
      }
    }
    d += `L${x2} ${y2}`;
  }
  element(
    'path',
    {
      d,
      fill: 'none',
      stroke: '#fffdf7',
      'stroke-width': 5,
      'stroke-linejoin': 'round',
    },
    parent,
  );
  return element(
    'path',
    {
      d,
      fill: 'none',
      stroke: color,
      'stroke-width': 2.2,
      'stroke-linejoin': 'round',
      ...attributes,
    },
    parent,
  );
}
function join(parent, x, y, color = '#365951') {
  element(
    'circle',
    { cx: x, cy: y, r: 3, fill: color, 'data-junction': '' },
    parent,
  );
}
function drawWiring(side) {
  const { primary, connection, starts, finishes, lineY, wiring } = side;
  wiring.replaceChildren();
  const busY = primary ? 62 : 294;
  const lanes = primary ? [42, 54, 66] : [284, 298, 312];
  const routes = finishes.map(([x, y], phase) => {
    const targetX = connection === 'delta' ? starts[(phase + 1) % 3][0] : x;
    const lane = connection === 'delta' ? lanes[phase] : busY;
    return [
      [x, y],
      [x, lane],
      [targetX, lane],
    ];
  });
  const verticals = [
    ...starts.map(([x, y]) => [x, Math.min(y, lineY), Math.max(y, lineY)]),
    ...routes.map(([[x, y], [, lane]]) => [
      x,
      Math.min(y, lane),
      Math.max(y, lane),
    ]),
  ];
  routes.forEach((points, phase) => {
    wire(points, verticals, PHASES[phase].color, wiring, {
      'data-link': (primary ? 'XYZ' : 'xyz')[phase],
      'data-connects-to':
        connection === 'delta'
          ? (primary ? 'BCA' : 'bca')[phase]
          : primary
            ? 'XYZ'
            : 'xyz',
    });
  });
  if (connection === 'delta') {
    routes.forEach((points, phase) =>
      join(wiring, ...points[2], PHASES[phase].color),
    );
  } else {
    wire(
      [
        [finishes[0][0], busY],
        [finishes[2][0], busY],
      ],
      verticals,
      '#738779',
      wiring,
      { 'data-star-bus': '' },
    );
    finishes.forEach(([x]) => join(wiring, x, busY));
    label(wiring, '星点', {
      x: 481,
      y: busY - 10,
      fill: '#617b70',
      'font-size': 13,
    });
    if (connection === 'neutral') {
      wire(
        [
          [finishes[2][0], busY],
          [523, busY],
          [523, lineY],
        ],
        verticals,
        '#738779',
        wiring,
        { 'data-neutral': '' },
      );
      element(
        'circle',
        {
          cx: 523,
          cy: lineY,
          r: 3,
          fill: '#fffdf7',
          stroke: '#738779',
          'stroke-width': 1.7,
        },
        wiring,
      );
      label(wiring, primary ? 'N' : 'n', {
        x: 534,
        y: lineY + 5,
        fill: '#365951',
        'font-size': 17,
      });
    }
  }
}
function describe() {
  sides.forEach((side) => {
    const { id, connection, primary } = side;
    const lower = (value) => (primary ? value : value.toLowerCase());
    document.getElementById(`${id}-symbol`).innerHTML = symbol(
      connection,
      primary,
    );
    document.getElementById(`${id}-rule`).textContent =
      connection === 'delta'
        ? '三相首尾相接，形成闭合回路'
        : connection === 'neutral'
          ? '三相末端共接，并引出中性线'
          : '三相末端共接，星点不引出';
    document.getElementById(`${id}-terminals`).textContent =
      connection === 'delta'
        ? lower('X—B、Y—C、Z—A；首端接出线。')
        : lower('X、Y、Z 共接；A、B、C 接出线。');
    side.group.dataset.connection = connection;
    document
      .querySelectorAll(`[data-side="${id}"] [data-connection]`)
      .forEach((button) =>
        button.setAttribute(
          'aria-pressed',
          String(button.dataset.connection === connection),
        ),
      );
  });
  core.setAttribute(
    'aria-label',
    `三相心式变压器实体绕组接线：原边${names[sides[0].connection]}，副边${names[sides[1].connection]}`,
  );
  document.getElementById('combination').innerHTML =
    `${symbol(sides[0].connection, true)},${symbol(sides[1].connection, false)}`;
  document.getElementById('combination-description').textContent =
    `原边${names[sides[0].connection]}，副边${names[sides[1].connection]}`;
  document
    .querySelectorAll('[data-preset]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(
          button.dataset.preset ===
            sides.map((side) => side.connection).join(','),
        ),
      ),
    );
}
function choose(side, connection) {
  if (side.connection === connection) return;
  side.connection = connection;
  drawWiring(side);
}
function drawFlux(dt = 0) {
  const state = sample(angle);
  fluxElements.forEach((item) => {
    const value = item.valueOf(state);
    const magnitude = Math.abs(value);
    item.offset -= value * dt * 38;
    item.line.setAttribute('stroke-dashoffset', item.offset);
    item.line.setAttribute('opacity', 0.12 + 0.88 * magnitude);
    item.line.setAttribute('stroke-width', 1.5 + magnitude * 2.2);
    const [x, y, rotation] = item.arrowAt;
    item.arrow.setAttribute(
      'transform',
      `translate(${x} ${y}) rotate(${rotation + (value < 0 ? 180 : 0)}) scale(${0.55 + magnitude * 0.8})`,
    );
    item.arrow.setAttribute('opacity', Math.min(1, magnitude * 7));
  });
}
function tick(now) {
  frame = 0;
  const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
  previous = now;
  angle = (angle + dt * 30) % 360;
  drawFlux(dt);
  if (visible && !document.hidden && playing)
    frame = requestAnimationFrame(tick);
}
function animate() {
  cancelAnimationFrame(frame);
  frame = 0;
  previous = 0;
  document.getElementById('motion').textContent = playing
    ? '暂停动画'
    : '播放动画';
  if (visible && !document.hidden && playing)
    frame = requestAnimationFrame(tick);
}
document.querySelectorAll('[data-connection]').forEach((button) =>
  button.addEventListener('click', () => {
    choose(
      sides.find(
        (side) => side.id === button.closest('[data-side]').dataset.side,
      ),
      button.dataset.connection,
    );
    describe();
  }),
);
document.querySelectorAll('[data-preset]').forEach((button) =>
  button.addEventListener('click', () => {
    button.dataset.preset
      .split(',')
      .forEach((connection, i) => choose(sides[i], connection));
    describe();
  }),
);
document.getElementById('motion').addEventListener('click', () => {
  playing = !playing;
  animate();
});
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  animate();
}).observe(document.querySelector('.lesson'));
document.addEventListener('visibilitychange', animate);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) playing = false;
  animate();
});
function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
resize();
sides.forEach(drawWiring);
describe();
drawFlux();
animate();

// Keep native button activation, and forward the course's navigation shortcuts.
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
    if (
      event.target.closest('button, a, input, select, textarea') ||
      event.touches.length !== 1
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
