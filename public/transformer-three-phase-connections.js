import {
  buildCore,
  initFluxAnimation,
  element,
  initConnectionNavigation,
  join,
  label,
  wire,
} from './transformer-three-phase-connection-diagram.js';
import { PHASES } from './transformer-three-phase-model.mjs';
const core = document.getElementById('core');
const xs = [126, 270, 414];
const names = { star: '星形', neutral: '星形并引出中性线', delta: '三角形' };
const fluxElements = buildCore(core);

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
initConnectionNavigation();
sides.forEach(drawWiring);
describe();
initFluxAnimation(() => fluxElements);
