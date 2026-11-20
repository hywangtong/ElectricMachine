import {
  buildCore,
  element,
  initConnectionNavigation,
  initFluxAnimation,
  join,
  label,
  wire,
} from './transformer-three-phase-connection-diagram.js';
import { PHASES } from './transformer-three-phase-model.mjs';
import {
  deltaLinks,
  phaseOrder,
  vectorGroup,
} from './transformer-vector-group-model.mjs';

const clockView = new URLSearchParams(location.search).get('view') === 'clock';
const coreCard = document.querySelector('.core-card');
const core = clockView ? null : document.getElementById('core');
const xs = [126, 270, 414];
const sides = ['primary', 'secondary'].map((id, index) => ({
  card: document.querySelector(`[data-side="${id}"]`),
  primary: index === 0,
  heads: index === 0 ? 'ABC' : 'abc',
  tails: index === 0 ? 'XYZ' : 'xyz',
  connection: 'star',
  reversed: false,
  offset: 0,
  flipped: false,
}));
let fluxElements = [];
const redrawFlux = core ? initFluxAnimation(() => fluxElements) : null;

if (clockView) {
  const title = '三相变压器：联结组别的时钟表示法';
  document.title = title;
  document.querySelector('h1').textContent = title;
  document.querySelector('.page-head p').textContent =
    '将高压线电压 UAB 固定在 12 点，顺时针读出低压线电压 uab 的钟点数。';
  document.querySelector('.vector-group-page').classList.add('clock-view');
  coreCard.replaceWith(document.getElementById('clock-view').content);
  document
    .querySelector('.clock-card')
    .append(document.querySelector('.combination-result'));
  document.getElementById('calculation-note').textContent =
    '按理想、对称三相变压器计算。';
  document.querySelector('.phasor-card p:last-child').textContent =
    '两侧相量统一以高压 UAB 向上为基准。';

  sides.forEach(({ card }) => {
    const actions = document.createElement('div');
    actions.className = 'winding-actions';
    const rotate = card.querySelector('[data-rotate]');
    rotate.before(actions);
    const polarity = document.createElement('button');
    polarity.type = 'button';
    polarity.dataset.flip = '';
    polarity.textContent = '反转极性';
    actions.append(rotate, polarity);
  });
}

function drawSide(side) {
  const { primary, heads, tails, connection, reversed, offset } = side;
  const delta = connection === 'delta';
  const group = element(
    'g',
    { 'data-side-wiring': primary ? 'primary' : 'secondary' },
    core,
  );
  const lineY = primary ? 16 : 345;
  const headY = primary ? 128 : 192;
  const busY = primary ? 62 : 294;
  const lanes = primary ? [42, 54, 66] : [284, 298, 312];
  const order = phaseOrder(offset);
  const starts = [...heads].map((_, phase) => [
    xs[order.indexOf(phase)] - 40,
    headY,
  ]);
  const ends = starts.map(([x, y]) => [x + 80, y + 35]);
  const lines = !delta && reversed ? ends : starts;
  const starEnds = reversed ? starts : ends;
  const links = deltaLinks(reversed);
  const routes = delta ? ends : starEnds;
  const verticals = [
    ...lines.map(([x, y]) => [x, Math.min(y, lineY), Math.max(y, lineY)]),
    ...routes.map(([x, y], phase) => {
      const lane = delta ? lanes[phase] : busY;
      return [x, Math.min(y, lane), Math.max(y, lane)];
    }),
  ];

  lines.forEach(([x, y], phase) => {
    const color = PHASES[phase].color;
    wire(
      [
        [x, y],
        [x, lineY],
      ],
      [],
      color,
      group,
    );
    element(
      'circle',
      {
        cx: x,
        cy: lineY,
        r: 3,
        fill: '#fffdf7',
        stroke: color,
        'stroke-width': 1.7,
      },
      group,
    );
    label(group, heads[phase], {
      x: x - 9,
      y: lineY + 5,
      'text-anchor': 'end',
      fill: color,
      'font-size': 17,
    });
  });

  if (delta) {
    const junctions = ends.map(([x, y], phase) => {
      const lane = lanes[phase];
      const targetX = starts[links[phase]][0];
      wire(
        [
          [x, y],
          [x, lane],
          [targetX, lane],
        ],
        verticals,
        PHASES[phase].color,
        group,
        {
          'data-link': tails[phase],
          'data-connects-to': heads[links[phase]],
        },
      );
      return [targetX, lane];
    });
    junctions.forEach(([x, y], phase) =>
      join(group, x, y, PHASES[links[phase]].color),
    );
  } else {
    const busColor = '#546c60';
    const busEnds = starEnds.map(([x]) => x);
    const left = Math.min(...busEnds);
    const right = Math.max(...busEnds);
    starEnds.forEach(([x, y]) =>
      wire(
        [
          [x, y],
          [x, busY],
        ],
        [],
        busColor,
        group,
      ),
    );
    wire(
      [
        [left, busY],
        [right, busY],
      ],
      verticals,
      busColor,
      group,
      { 'data-star-bus': '' },
    );
    busEnds.forEach((x) => join(group, x, busY));
  }

  starts.forEach(([x, y], phase) => {
    const [endX, endY] = ends[phase];
    const color = PHASES[phase].color;
    element(
      'circle',
      {
        cx: side.flipped ? endX - 8 : x + 8,
        cy: side.flipped ? endY + 7 : y - 7,
        r: 3.4,
        fill: '#173b3b',
        'data-polarity-dot': heads[phase],
      },
      group,
    );
    for (const [tx, ty, name, anchor] of [
      [x - 8, y, heads[phase], 'end'],
      [endX + 8, endY, tails[phase], 'start'],
    ]) {
      label(group, name, {
        x: tx,
        y: ty + 5,
        'text-anchor': anchor,
        fill: color,
        'font-size': 15,
        stroke: '#fffdf7',
        'stroke-width': 3,
        'paint-order': 'stroke',
      });
    }
  });
}

function updateControls(side) {
  const { card, heads, tails, connection, reversed, offset } = side;
  const delta = connection === 'delta';
  const terminals = reversed ? heads : tails;
  const output = card.querySelector('.side-symbol');
  output.textContent = delta
    ? side.primary
      ? 'D'
      : 'd'
    : side.primary
      ? 'Y'
      : 'y';
  card.querySelectorAll('[data-connection]').forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.connection === connection),
    );
  });
  card.querySelectorAll('[data-reversed]').forEach((button, index) => {
    button.textContent = (
      delta ? ['尾接后相首端', '首接后相尾端'] : ['尾端共接', '首端共接']
    )[index];
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.reversed === String(reversed)),
    );
  });
  card.querySelector('.terminal-summary').textContent = delta
    ? `${deltaLinks(reversed)
        .map((phase, index) => `${tails[index]}—${heads[phase]}`)
        .join('、')}；${heads} 引出。`
    : `${[...terminals].join('、')} 共接；${reversed ? `${tails} 分别接 ${heads} 出线` : `${heads} 引出`}。`;
  card.querySelector('[data-rotate]').textContent = `从左到右 ${phaseOrder(
    offset,
  )
    .map((phase) => heads[phase])
    .join('')} · 循环换位`;
  if (clockView) {
    const button = card.querySelector('[data-flip]');
    button.setAttribute('aria-pressed', String(side.flipped));
    button.setAttribute(
      'aria-label',
      `反转${side.primary ? '高压' : '低压'}绕组极性`,
    );
    button.setAttribute(
      'aria-description',
      `当前同名端为 ${side.flipped ? tails : heads}`,
    );
  }
  return output.textContent;
}

function drawPhasor(
  svg,
  from,
  to,
  name,
  labelAt,
  { color, startColor, kind = 'phase', highlight = false },
) {
  const tipFraction = kind === 'line' ? 0.94 : 0.89;
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const [tipX, tipY] = [from[0] + dx * tipFraction, from[1] + dy * tipFraction];
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const group = element(
    'g',
    { 'data-voltage': kind, 'data-symbol': name, color },
    svg,
  );
  const coordinates = { x1: from[0], y1: from[1], x2: to[0], y2: to[1] };
  let stroke = color;
  if (startColor) {
    const id = `${svg.id}-${name}`;
    const gradient = element(
      'linearGradient',
      {
        id,
        gradientUnits: 'userSpaceOnUse',
        ...coordinates,
      },
      svg.querySelector('defs'),
    );
    element('stop', { offset: 0, 'stop-color': startColor }, gradient);
    element('stop', { offset: 1, 'stop-color': color }, gradient);
    stroke = `url(#${id})`;
  }
  element('line', { ...coordinates, stroke }, group);
  element(
    'path',
    {
      d: 'M0 0L-9 -3.8V3.8Z',
      transform: `translate(${tipX} ${tipY}) rotate(${angle})`,
    },
    group,
  );
  if (highlight) group.classList.add('reference-phasor');
  const text = label(group, highlight && name === 'ab' ? 'u' : 'U', {
    x: labelAt[0],
    y: labelAt[1],
  });
  const subscript = element(
    'tspan',
    { 'baseline-shift': 'sub', 'font-size': '75%' },
    text,
  );
  subscript.textContent = name;
}

function drawPhasors(svg, side, { line, phase }, reference) {
  const { heads, tails, reversed, connection, offset } = side;
  const delta = connection === 'delta';
  const sharedEnds = deltaLinks(reversed);
  const center = [125, 82];
  // Give both connection types the same line-voltage triangle before fitting.
  const scale = delta ? 55 * Math.sqrt(3) : 55;
  // V_i = (U_i,i+1 - U_i-1,i) / 3 when the terminal centroid is zero.
  const potentials = delta
    ? line.map(([x, y], i) => [
        (x - line[(i + 2) % 3][0]) / 3,
        (y - line[(i + 2) % 3][1]) / 3,
      ])
    : phase;
  // Set the common reference from the high-voltage terminal on the middle limb.
  const up = reference ?? potentials[phaseOrder(offset)[1]];
  const [topX, topY] = up;
  const radius = Math.hypot(topX, topY);
  const orient = ([x, y]) => [
    (x * topY - y * topX) / radius,
    -(x * topX + y * topY) / radius,
  ];
  const terminals = potentials.map((value) => {
    const [x, y] = orient(value);
    return [center[0] + x * scale, center[1] + y * scale];
  });
  const angle = (value) => {
    const [x, y] = orient(value);
    return (360 + Math.round((Math.atan2(x, -y) * 180) / Math.PI)) % 360;
  };

  svg.replaceChildren();
  element('defs', {}, svg);
  svg.setAttribute(
    'aria-label',
    [...heads]
      .flatMap((head, i) => {
        const lineName = head + heads[(i + 1) % 3];
        const phaseName =
          reversed && !delta ? tails[i] + head : head + tails[i];
        return [
          `线电压 ${clockView && i === 0 && !side.primary ? 'u' : 'U'}${lineName} 顺时针 ${angle(line[i])} 度`,
          `相电压 U${phaseName} 顺时针 ${angle(phase[i])} 度`,
        ];
      })
      .join('，'),
  );

  function edgeLayout(from, to) {
    const x = (from[0] + to[0]) / 2;
    const y = (from[1] + to[1]) / 2;
    const radius = Math.hypot(x - center[0], y - center[1]);
    const normalX = (x - center[0]) / radius;
    const normalY = (y - center[1]) / radius;
    const shift = ([px, py], distance) => [
      px + distance * normalX,
      py + distance * normalY,
    ];
    return { shift, labelAt: (distance) => shift([x, y], distance) };
  }

  terminals.forEach((to, i) => {
    const next = (i + 1) % 3;
    const from = terminals[next];
    const windingPhase = delta && reversed ? next : i;
    drawPhasor(
      svg,
      from,
      to,
      heads[i] + heads[next],
      edgeLayout(from, to).labelAt(delta ? -9 : 19),
      {
        kind: 'line',
        color: PHASES[windingPhase].color,
        startColor: delta ? undefined : PHASES[next].color,
        highlight: clockView && i === 0,
      },
    );
  });
  terminals.forEach((to, i) => {
    const name = reversed && !delta ? tails[i] + heads[i] : heads[i] + tails[i];
    const from = delta ? terminals[sharedEnds[i]] : center;
    if (delta) {
      const { shift, labelAt } = edgeLayout(from, to);
      drawPhasor(svg, shift(from, 8), shift(to, 8), name, labelAt(24), {
        color: PHASES[i].color,
      });
    } else {
      const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
      const labelAt = [
        from[0] + dx * 0.38 - dy * 0.18,
        from[1] + dy * 0.38 + dx * 0.18,
      ];
      drawPhasor(svg, from, to, name, labelAt, { color: PHASES[i].color });
    }
  });

  terminals.forEach(([x, y], i) => {
    join(svg, x, y);
    label(svg, heads[i], {
      class: 'phasor-node',
      x: x + (x - center[0]) * 0.28,
      y: y + (y - center[1]) * 0.28,
    });
  });
  if (!delta) join(svg, ...center);

  if (clockView) {
    svg.setAttribute('viewBox', '35 -1 180 166');
    return up;
  }

  const { x, y, width, height } = svg.getBBox();
  const padding = 7;
  if (width > 0 && height > 0) {
    svg.setAttribute(
      'viewBox',
      `${x - padding} ${y - padding} ${width + 2 * padding} ${height + 2 * padding}`,
    );
  }
  return up;
}

function drawCore(focusedSide, symbols) {
  core.replaceChildren();
  fluxElements = buildCore(
    core,
    sides.map((side) => phaseOrder(side.offset)),
  );
  sides.forEach(drawSide);
  sides.forEach((side, index) => {
    const title = side.primary ? '高压侧' : '低压侧';
    const control = element(
      'rect',
      {
        x: xs[0] - 48,
        y: side.primary ? 118 : 182,
        width: xs[2] - xs[0] + 96,
        height: 62,
        rx: 8,
        fill: 'transparent',
        'data-polarity-side': index,
        tabindex: 0,
        role: 'button',
        'aria-pressed': side.flipped,
        'aria-label': `反转${title}三个绕组的极性`,
        'aria-description': `当前同名端为 ${side.flipped ? side.tails : side.heads}`,
      },
      core,
    );
    if (index === focusedSide) control.focus();
  });
  redrawFlux();
  core.setAttribute(
    'aria-label',
    `三相变压器高、低压绕组接线及同名端，当前接法 ${symbols.join('、')}`,
  );
}

function drawClock(clock) {
  const svg = document.getElementById('group-clock');
  svg.replaceChildren();
  svg.setAttribute(
    'aria-label',
    `联结组别时钟，高压 UAB 固定在 12 点，低压 uab 指向 ${clock || 12} 点`,
  );
  const center = 180;
  const point = (hour, radius) => {
    const angle = (hour * Math.PI) / 6;
    return [
      center + radius * Math.sin(angle),
      center - radius * Math.cos(angle),
    ];
  };
  element(
    'circle',
    { cx: center, cy: center, r: 157, class: 'clock-face' },
    svg,
  );
  for (let hour = 0; hour < 12; hour += 1) {
    const [x1, y1] = point(hour, 137);
    const [x2, y2] = point(hour, 148);
    element('line', { x1, y1, x2, y2, class: 'clock-tick' }, svg);
    const [x, y] = point(hour, 116);
    label(svg, String(hour || 12), { x, y, class: 'clock-number' });
  }

  element(
    'path',
    { d: 'M177 180V84L180 75L183 84V180Z', class: 'clock-high' },
    svg,
  );
  element(
    'path',
    {
      d: 'M175 180V116L180 105L185 116V180Z',
      class: 'clock-low',
      transform: `rotate(${clock * 30} 180 180)`,
    },
    svg,
  );
  const [lowX, lowY] = point(clock, 56);
  const [sideX, sideY] = point(clock === 1 ? 4 : clock - 3, 22);
  label(svg, 'UAB', { x: 208, y: 89, class: 'clock-high clock-label' });
  label(svg, 'uab', {
    x: lowX + sideX - center,
    y: lowY + sideY - center,
    class: 'clock-low clock-label',
  });
  element('circle', { cx: center, cy: center, r: 6, class: 'clock-pin' }, svg);
}

function render(focusedSide) {
  const symbols = sides.map(updateControls);
  if (core) drawCore(focusedSide, symbols);
  const { high, low, clock } = vectorGroup(...sides);
  const reference = drawPhasors(
    document.getElementById('high-phasors'),
    sides[0],
    high,
    clockView ? high.line[0] : undefined,
  );
  drawPhasors(document.getElementById('low-phasors'), sides[1], low, reference);
  if (clockView) drawClock(clock);
  document.getElementById('voltage-ratios').textContent = sides
    .map(
      (side) =>
        `${side.primary ? '高压' : '低压'} U线 = ${side.connection === 'delta' ? '' : '√3 '}U相`,
    )
    .join('　·　');
  document.getElementById('combination').textContent =
    `${symbols.join('')}${clock}`;
  const angle = clock <= 6 ? clock * 30 : (12 - clock) * 30;
  document.getElementById('combination-description').textContent =
    clock === 0
      ? `低压 ${clockView ? 'uab' : 'Uab'} 与高压 UAB 同相`
      : `低压 ${clockView ? 'uab' : 'Uab'} ${clock <= 6 ? '滞后' : '超前'}高压 UAB ${angle}°`;
}

function flipSide(event) {
  const control = event.target.closest('[data-polarity-side]');
  if (!control) return;
  const index = Number(control.dataset.polaritySide);
  sides[index].flipped = !sides[index].flipped;
  render(index);
}

core?.addEventListener('click', flipSide);
core?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  if (!event.repeat) flipSide(event);
});

sides.forEach((side) => {
  side.card.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-rotate')) {
      side.offset = (side.offset + 1) % 3;
    } else if (button.hasAttribute('data-flip')) {
      side.flipped = !side.flipped;
    } else if (button.dataset.connection) {
      side.connection = button.dataset.connection;
    } else {
      side.reversed = button.dataset.reversed === 'true';
    }
    render();
  });
});
initConnectionNavigation();
render();
