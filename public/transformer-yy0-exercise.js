import {
  element,
  initConnectionNavigation,
  label,
} from './transformer-three-phase-connection-diagram.js';
import {
  deltaLinks,
  phaseOrder,
  vectorGroup,
} from './transformer-vector-group-model.mjs';

const byId = (id) => document.getElementById(id);
const star = { connection: 'star', reversed: false, offset: 0, flipped: false };
const params = new URLSearchParams(window.location.search);
const groupParam = params.get('group');
const yd11 = groupParam === 'Yd11';
const legacyYd1Alternate = groupParam === 'Yd1Alternate';
const yd1 = groupParam === 'Yd1' || legacyYd1Alternate;
const delta = yd11 || yd1;
const flipped = groupParam === 'Yy6';
const shifted = groupParam === 'Yy4';
const defaultLowSide = {
  connection: delta ? 'delta' : 'star',
  reversed: yd11,
  flipped,
  offset: shifted ? 2 : 0,
  tails: 'xyz',
};
const otherYd11Side = {
  ...defaultLowSide,
  reversed: false,
  flipped: true,
  offset: 2,
};
const otherYd1Side = {
  ...defaultLowSide,
  reversed: true,
  flipped: true,
  offset: 1,
  tails: 'zxy',
};
let lowSide = defaultLowSide;
let lowOrder = phaseOrder(lowSide.offset);
let result = vectorGroup(star, lowSide);
let groupName = getGroupName();

function getGroupName() {
  return `Y${delta ? 'd' : 'y'}${result.clock}`;
}

if (delta) {
  document.title = `例题：${groupName} 联结组别的正向与逆向分析`;
  byId('phasors').setAttribute('viewBox', '0 0 432 390');
  byId('wiring').setAttribute('viewBox', '0 0 414 293');
} else if (flipped || shifted) {
  document.title = `例题：${groupName} 联结组别的正向与逆向分析`;
  byId('phasors').setAttribute(
    'viewBox',
    flipped ? '-70 0 470 510' : '0 15 432 485',
  );
}
const progress = { forward: 0, reverse: 0, 'reverse-alternate': 0 };
let mode = 'forward';

function line(svg, [x1, y1], [x2, y2], attributes = {}) {
  element(
    'line',
    { x1, y1, x2, y2, stroke: 'currentColor', ...attributes },
    svg,
  );
}

function arrow(
  svg,
  from,
  to,
  width,
  tipAt = 1,
  dashed = false,
  headLength = 10,
) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const x = from[0] + dx * tipAt;
  const y = from[1] + dy * tipAt;
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
  const halfHeadWidth = headLength * 0.46;
  line(svg, from, to, {
    'stroke-width': width,
    ...(dashed && { 'stroke-dasharray': '6 5' }),
  });
  element(
    'path',
    {
      d: `M0 0L-${headLength} -${halfHeadWidth}V${halfHeadWidth}Z`,
      transform: `translate(${x} ${y}) rotate(${rotation})`,
      fill: 'currentColor',
    },
    svg,
  );
}

function drawWiring(revealLow) {
  const svg = byId('wiring');
  svg.replaceChildren();
  const columnPairs = lowOrder.map((phase, i) => `${'ABC'[i]}/${'abc'[phase]}`);
  const lowDots = lowSide.flipped ? 'xyz' : 'abc';
  const lowConnections = delta
    ? `低压三角形接线为 ${describeDeltaLinks()}。`
    : '低压 xyz 共接星点。';
  svg.setAttribute(
    'aria-label',
    revealLow
      ? `高压 ABC、低压 abc。同柱依次为 ${columnPairs.join('、')}。高压同名端为 ABC，低压同名端为 ${lowDots}。高压 XYZ 共接星点。${lowConnections}`
      : '高压 ABC 出线，XYZ 共接星点，同名端在出线侧。低压侧待确定。',
  );
  const columns = [143, 240, 337];
  columns.forEach((x) =>
    line(svg, [x, 20], [x, 256], {
      stroke: '#d9e3dc',
      'stroke-dasharray': '4 5',
    }),
  );
  [0, 1].forEach((index) => {
    const isHigh = index === 0;
    const y = isHigh ? 23 : 154;
    const isDelta = !isHigh && delta;
    const group = element(
      'g',
      { class: isHigh ? 'phasor-high' : 'phasor-low' },
      svg,
    );
    label(group, isHigh ? '高压 Y' : isDelta ? '低压 d' : '低压 y', {
      x: 43,
      y: y + 51,
      'font-size': 19,
    });
    if (!isHigh && !revealLow) {
      label(group, '同柱相别及同名端待定', {
        x: 240,
        y: y + 51,
        'font-size': 20,
      });
      return;
    }
    const heads = isHigh ? 'ABC' : 'abc';
    const tails = isHigh ? 'XYZ' : lowSide.tails;
    if (isDelta) {
      drawDeltaLinks(group, columns, y);
    } else {
      line(group, [columns[0], y + 102], [columns[2], y + 102], {
        'stroke-width': 2,
      });
    }
    columns.forEach((x, column) => {
      const phase = isHigh ? column : lowOrder[column];
      element(
        'path',
        {
          d: `M${x} ${y + 18}v15q24 7 0 14q24 7 0 14q24 7 0 14v27`,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2.4,
        },
        group,
      );
      element(
        'circle',
        { cx: x, cy: y + 18, r: 3.5, fill: 'white', stroke: 'currentColor' },
        group,
      );
      element(
        'circle',
        { cx: x, cy: y + 102, r: 3.8, fill: 'currentColor' },
        group,
      );
      element(
        'circle',
        {
          cx: x + 22,
          cy: y + (!isHigh && lowSide.flipped ? 88 : 31),
          r: 4.1,
          fill: '#173b3b',
        },
        group,
      );
      label(group, heads[phase], { x, y: y + 3, 'font-size': 19 });
      label(group, tails[phase], { x: x - 16, y: y + 86, 'font-size': 17 });
    });
    if (!isDelta) {
      label(group, isHigh ? 'N' : 'n', { x: 361, y: y + 102, 'font-size': 16 });
    }
  });
}

function describeDeltaLinks() {
  const links = deltaLinks(lowSide.reversed);
  return [...'xyz']
    .map((tail) => `${tail}–${'abc'[links[lowSide.tails.indexOf(tail)]]}`)
    .join('、');
}

function drawDeltaLinks(group, columns, y) {
  const links = deltaLinks(lowSide.reversed);
  lowOrder.forEach((phase, column) => {
    const target = lowOrder.indexOf(links[phase]);
    const x = columns[column];
    const targetX = columns[target];
    const outer = Math.abs(target - column) === 2;
    const bendX = targetX + (lowSide.reversed ? 42 : -38);
    const bottom = y + (outer ? 130 : 114);
    element(
      'path',
      {
        d: `M${x} ${y + 102}V${bottom}H${bendX}V${y + 24}H${targetX}`,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2,
      },
      group,
    );
  });
}

function drawPhasors(step, reverse, description) {
  const { high: highVoltages, low: lowVoltages } = result;
  const svg = byId('phasors');
  svg.replaceChildren();
  svg.setAttribute('aria-label', description);
  // E_AB is drawn from A to B, opposite to the model's voltage vector.
  const [refX, refY] = highVoltages.line[0].map((component) => -component);
  const radius = Math.hypot(refX, refY);
  const project = ([x, y]) => [
    (x * refY - y * refX) / radius,
    -(x * refX + y * refY) / radius,
  ];
  const highCenter = [190, 181];
  const highScale = 158;
  const lowScale = 88;
  const showLowSide = reverse || step >= 4;
  const alignedTriangles = !delta && !flipped && !shifted;
  const a = project(highVoltages.phase[0]).map(
    (value, i) => highCenter[i] + highScale * value,
  );
  const phaseLabels = [];
  const lowCenter = project(lowVoltages.phase[0]).map(
    (value, i) => a[i] - lowScale * value,
  );
  if (showLowSide && !delta) {
    label(svg, '低压幅值按示意比例绘制', {
      x: a[0] + (shifted ? 140 : flipped ? 90 : 0),
      y: a[1] + (shifted ? 137 : 37),
      'text-anchor': 'start',
      color: '#47665d',
      'font-size': 16,
    });
  }
  [
    [highVoltages, highCenter, highScale, 'ABC', 'N', 'phasor-high'],
    [lowVoltages, lowCenter, lowScale, 'abc', 'n', 'phasor-low'],
  ].forEach(([voltages, center, scale, names, neutral, className], side) => {
    if (side && delta) return;
    if (side && !showLowSide) return;
    const showPhase = step >= (reverse || !side ? 3 : 4);
    const lineCount =
      step >= (reverse || !side ? 2 : 5) ? 3 : reverse || !side ? 1 : 0;
    const group = element('g', { class: className }, svg);
    const tips = voltages.phase.map((value) =>
      project(value).map((component, i) => center[i] + scale * component),
    );
    tips.forEach((to, i) => {
      if (step === 1 && i === 2) return;
      if (showPhase) {
        arrow(group, to, center, side ? 2.8 : 4, 0.9, true, 16);
        const [fraction, dx, dy] = (
          side
            ? [
                [0.47, 13, 6],
                [0.47, -8, 7],
                [0.57, 0, 11],
              ]
            : [
                [0.72, 19, -10],
                [0.47, 16, -10],
                [0.45, 0, -14],
              ]
        )[i];
        phaseLabels.push({
          className,
          phase: names[i],
          x: to[0] + (center[0] - to[0]) * fraction + dx,
          y: to[1] + (center[1] - to[1]) * fraction + dy,
        });
      }
      if (!side && i < lineCount) {
        const sharedEdge = i === 2 && showLowSide && alignedTriangles;
        arrow(
          group,
          to,
          tips[(i + 1) % 3],
          i === 0 || sharedEdge ? 7 : 2.4,
          sharedEdge ? 0.88 : 0.92,
          false,
          i === 0 ? 26 : 19,
        );
      }
      const sharedA = showLowSide && i === 0;
      if (!sharedA || !side) {
        const [x, y] = to.map(
          (value, axis) => value + (value - center[axis]) * 0.14,
        );
        const adjacentToHighEdge = side === 1 && alignedTriangles;
        label(group, sharedA ? 'A = a' : names[i], {
          x:
            sharedA && shifted
              ? a[0] - 36
              : x - (adjacentToHighEdge && i === 1 ? 9 : 0),
          y:
            sharedA && shifted
              ? a[1] + 12
              : y + (adjacentToHighEdge && i === 2 ? 15 : 0),
          'font-size': 19,
        });
      }
    });
    if (showPhase) {
      element(
        'circle',
        { cx: center[0], cy: center[1], r: 3.6, fill: 'currentColor' },
        group,
      );
      label(group, neutral, {
        x: center[0] - (side && shifted ? 3 : 14),
        y: center[1] + (side && shifted ? 16 : -11),
        'font-size': 16,
      });
    }
    if (lineCount === 0) return;
    if (side) {
      // Draw the purple line voltages after both sets of phase voltages.
      const lineVoltages = element('g', { class: 'low-line-voltages' }, group);
      tips.slice(0, lineCount).forEach((from, i) => {
        arrow(lineVoltages, from, tips[(i + 1) % 3], 4.8, 0.94, false, 21);
      });
    }
    const [[ax, ay], [bx, by]] = tips;
    const edgeLength = Math.hypot(bx - ax, by - ay);
    const labelOffset = 34;
    const referenceLabel = label(group, 'E', {
      x: (ax + bx) / 2 + (labelOffset * (by - ay)) / edgeLength,
      y: (ay + by) / 2 - (labelOffset * (bx - ax)) / edgeLength,
      'font-size': 23,
    });
    element(
      'tspan',
      { 'baseline-shift': 'sub', 'font-size': 15 },
      referenceLabel,
    ).textContent = names.slice(0, 2);
  });
  if (delta && showLowSide) drawDeltaPhasors(svg, project, a, step, reverse);
  phaseLabels.forEach(({ className, phase, x, y }) => {
    const symbol = label(svg, 'E', {
      class: `phase-symbol ${className}`,
      x,
      y,
      'font-size': 21,
    });
    element(
      'tspan',
      {
        'baseline-shift': 'sub',
        'font-size': 14,
      },
      symbol,
    ).textContent = phase;
  });
}

function drawClock(clock) {
  const svg = byId('clock');
  svg.replaceChildren();
  svg.setAttribute(
    'aria-label',
    clock === null
      ? '高压线电动势对准十二点。低压指向待求。'
      : `高压线电动势对准十二点，低压线电动势指向 ${clock || 12} 点。`,
  );
  const center = [110, 120];
  const point = (hour, radius) => {
    const angle = (hour * Math.PI) / 6;
    return [
      center[0] + radius * Math.sin(angle),
      center[1] - radius * Math.cos(angle),
    ];
  };
  element(
    'circle',
    {
      cx: center[0],
      cy: center[1],
      r: 102,
      fill: '#f8fbf7',
      stroke: '#acc5b9',
      'stroke-width': 2,
    },
    svg,
  );
  for (let hour = 0; hour < 12; hour++) {
    line(svg, point(hour, 90), point(hour, 99), { stroke: '#719188' });
    const [x, y] = point(hour, 77);
    label(svg, String(hour || 12), { x, y, 'font-size': 16 });
  }
  element(
    'path',
    {
      d: 'M108 120V61L110 55L112 61V120Z',
      class: 'phasor-high',
      fill: 'currentColor',
    },
    svg,
  );
  if (clock !== null) {
    element(
      'path',
      {
        d: 'M108.5 120V83L110 76L111.5 83V120Z',
        class: 'phasor-low',
        fill: 'currentColor',
        transform: `rotate(${clock * 30} 110 120)`,
      },
      svg,
    );
  }
  element(
    'circle',
    { cx: center[0], cy: center[1], r: 4, fill: '#173b3b' },
    svg,
  );
}

function drawDeltaPhasors(svg, project, a, step, reverse) {
  const group = element('g', { class: 'phasor-low' }, svg);
  const [ab, bc] = result.low.line.map((value) =>
    project(value).map((component) => -112 * component),
  );
  const b = a.map((value, axis) => value + ab[axis]);
  const c = b.map((value, axis) => value + bc[axis]);
  const tips = [a, b, c];
  const center = a.map((value, axis) => (value + b[axis] + c[axis]) / 3);
  const lineCount = reverse ? (step === 1 ? 1 : 3) : step === 5 ? 3 : 0;
  const links = deltaLinks(lowSide.reversed);
  if (step >= (reverse ? 3 : 4)) {
    tips.forEach((from, phase) => {
      const to = tips[links[phase]];
      const inset = (point) =>
        point.map((value, axis) => value + 0.19 * (center[axis] - value));
      const start = inset(from);
      const end = inset(to);
      arrow(group, start, end, 2.6, 0.9, true, 15);
      const [x, y] = start.map((value, axis) => (value + end[axis]) / 2);
      deltaSymbol(group, 'abc'[phase], x, y);
    });
  }
  tips.slice(0, lineCount).forEach((from, index) => {
    arrow(group, from, tips[(index + 1) % 3], index === 0 ? 4.8 : 3, 0.96);
  });
  if (lineCount) {
    const midpoint = a.map((value, axis) => (value + b[axis]) / 2);
    const [x, y] = midpoint.map(
      (value, axis) => value + 0.85 * (value - center[axis]),
    );
    deltaSymbol(group, 'ab', x - (result.clock === 1 ? 18 : 0), y);
  }
  tips.slice(1, reverse && step === 1 ? 2 : 3).forEach((tip, index) => {
    const [x, y] = tip.map(
      (value, axis) => value + 0.24 * (value - center[axis]),
    );
    label(group, 'bc'[index], {
      class: 'phase-symbol',
      x,
      y,
      'font-size': 19,
    });
  });
}

function deltaSymbol(group, subscript, x, y) {
  const symbol = label(group, 'E', {
    class: 'phase-symbol',
    x,
    y,
    'font-size': 20,
  });
  element(
    'tspan',
    { 'baseline-shift': 'sub', 'font-size': 14 },
    symbol,
  ).textContent = subscript;
}

const forwardSteps = [
  [
    '以高压线电动势 E<sub>AB</sub> 为基线',
    '从 A 竖直向上指向 B，画出 E<sub>AB</sub>，以 12 点方向为基线。',
    '高压 EAB 从 A 竖直向上指向 B，对准 12 点。',
  ],
  [
    '补齐高压侧线电动势',
    '按 ABC 正相序，E<sub>BC</sub> 比 E<sub>AB</sub> 滞后 120°，E<sub>CA</sub> 再滞后 120°。画出等长的 B → C 和 C → A，闭合线电动势三角形。',
    '高压线电动势三角形沿 A 到 B、B 到 C、C 到 A 闭合。',
  ],
  [
    '由高压线电动势三角形画相电动势',
    'XYZ 共接为高压星点 N，位于三角形中心。从 A、B、C 分别指向 N，得到 E<sub>A</sub>、E<sub>B</sub>、E<sub>C</sub>，长度为线电动势的 1/√3。',
    '高压相电动势从 A、B、C 分别指向三角形中心 N。',
  ],
  [
    '按同柱绕组和同名端画低压相电动势',
    flipped
      ? 'A/a、B/b、C/c 分别同柱。高压同名端 ABC 为出线端，低压同名端 xyz 并为星点 n。两侧相电动势均从出线端指向星点，因此对应相量反向。以 A、a 为共同起点，按示意幅值画出低压相量。'
      : '右图中 A/a、B/b、C/c 分别同柱，两侧出线均在同名端。以 A、a 等电位为基准，将两点重合。较短的紫色相量 E<sub>a</sub>、E<sub>b</sub>、E<sub>c</sub> 分别与对应高压相量同向。',
    `A、a 画在同一点。低压相电动势较短，与对应高压相量平行${flipped ? '反向' : '同向'}。`,
  ],
  [
    '由低压相电动势求线电动势并读组号',
    flipped
      ? 'E<sub>ab</sub> = E<sub>a</sub> − E<sub>b</sub>，画成 a → b，再画 b → c 和 c → a。低压相量均反向，作差所得的对应线相量也反向。E<sub>AB</sub> 指向 12 点，E<sub>ab</sub> 指向 6 点，相差 6 × 30° = 180°。两侧星接，组别为 Yy6。'
      : 'E<sub>ab</sub> = E<sub>a</sub> − E<sub>b</sub>，画成 a → b。同理画 b → c 和 c → a。E<sub>AB</sub> 与 E<sub>ab</sub> 都竖直指向 12 点。两侧星接，组别为 Yy0。',
    flipped
      ? '低压三角形的各边与对应高压线相量反向。高压 EAB 指向 12 点，低压 Eab 指向 6 点，组别为 Yy6。'
      : '三条低压线相量较短，与对应的高压线相量同向。两支 AB 线相量都指向 12 点，组别为 Yy0。',
  ],
];

const reverseSteps = [
  [
    `由 ${groupName} 定出两侧 AB 线相量`,
    flipped
      ? 'Y 和 y 表示两侧均为星接。6 表示低压相对高压顺时针转 6 × 30° = 180°。以 A、a 为共同起点，画高压 E<sub>AB</sub> 向上指向 12 点，低压 E<sub>ab</sub> 向下指向 6 点。'
      : 'Y 和 y 表示两侧均为星接。0 表示相位差为 0°。将高压 E<sub>AB</sub> 对准 12 点，则低压 E<sub>ab</sub> 也指向 12 点。取 A、a 等电位，将两个相量的起点画在同一处。',
    flipped
      ? '高压 EAB 和低压 Eab 从共同起点 A、a 分别指向 12 点和 6 点。低压相量较短。'
      : '高压 EAB 和低压 Eab 从共同起点 A、a 齐向 12 点。低压相量较短。',
  ],
  [
    '按正相序补齐两侧线相量',
    'E<sub>BC</sub>、E<sub>CA</sub> 从 E<sub>AB</sub> 依次滞后 120°，连接 B → C → A。低压侧同理，由 E<sub>ab</sub> 补画 E<sub>bc</sub> 和 E<sub>ca</sub>，闭合两个三角形。',
    '两侧分别沿 A、B、C 和 a、b、c 的顺序画出闭合的线电动势三角形。',
  ],
  [
    '由两侧线相量画出相相量',
    flipped
      ? '取两个三角形的中心为星点 N、n，从各相出线端指向各自星点。相电动势长度为所在侧线电动势的 1/√3。两三角形相对转过 180°，所以 A/a、B/b、C/c 的相量分别反向。'
      : '取两个三角形的中心为星点 N、n，画出各出线端指向各自星点的相量。各相相量比对应线相量滞后 30°，长度是对应线相量的 1/√3，因此 A/a、B/b、C/c 相量分别同向。',
    `高、低压各有三条虚线相电动势，从各相出线端指向各自星点，对应相量分别${flipped ? '反向' : '同向'}。`,
  ],
  [
    '由相相量确定低压绕组顺序和同名端',
    flipped
      ? 'A/a、B/b、C/c 的相量分别反向，按该对应关系配置同柱绕组。高压 ABC 从同名端出线，低压 abc 从另一端出线，带点的 x、y、z 共接成低压星点 n。'
      : 'A/a、B/b、C/c 的相量同向且两侧保持正相序，低压绕组应与高压柱位一一对应。两侧出线均取同名端，故低压按 a、b、c 引出，x、y、z 共接成星点。',
    `两侧相量完整显示。低压绕组与高压依次同柱，低压同名端在${flipped ? '星点侧' : '出线侧'}。`,
  ],
];

if (shifted) {
  forwardSteps[3] = [
    '按同柱绕组和同名端画低压相电动势',
    '右图的同柱对应为 A/c、B/a、C/b。两侧均从同名端出线，所以 E<sub>c</sub> 与 E<sub>A</sub>、E<sub>a</sub> 与 E<sub>B</sub>、E<sub>b</sub> 与 E<sub>C</sub> 分别同向。将 A、a 画在同一点，先由 E<sub>a</sub> 定出低压星点 n，再按相量方向定出 b、c。',
    'A、a 作图时重合。低压 a、b、c 的相电动势分别与高压 B、C、A 的相电动势同向。',
  ];
  forwardSteps[4] = [
    '由低压相电动势求线电动势并读组号',
    'E<sub>ab</sub> = E<sub>a</sub> − E<sub>b</sub>，画成 a → b，再补齐 b → c 和 c → a。因 a、b 分别与 B、C 同柱且同极性，E<sub>ab</sub> 与 E<sub>BC</sub> 同向，指向 4 点，比 E<sub>AB</sub> 滞后 120°。两侧星接，组别为 Yy4。',
    '高压 EAB 指向 12 点，低压 Eab 指向 4 点，且与高压 EBC 同向。组别为 Yy4。',
  ];
  reverseSteps[0] = [
    `由 ${groupName} 定出两侧 AB 线相量`,
    'Y 和 y 表示两侧均为星接。4 表示低压相对高压顺时针转 4 × 30° = 120°。以 A、a 为共同起点，画 E<sub>AB</sub> 指向 12 点，E<sub>ab</sub> 指向 4 点。',
    '高压 EAB、低压 Eab 从共同起点 A、a 分别指向 12 点和 4 点。',
  ];
  reverseSteps[2] = [
    '由两侧线相量画出相相量',
    '取两个三角形的中心为星点 N、n，从各相出线端指向各自星点。相电动势长度为所在侧线电动势的 1/√3。比较方向可见 E<sub>a</sub> 与 E<sub>B</sub>、E<sub>b</sub> 与 E<sub>C</sub>、E<sub>c</sub> 与 E<sub>A</sub> 分别同向。',
    '高、低压各有三条虚线相电动势，从各相出线端指向各自星点。低压 a、b、c 分别与高压 B、C、A 同向。',
  ];
  reverseSteps[3] = [
    '由相相量确定低压绕组顺序和同名端',
    '按同向相量配对，高压按 A、B、C 排列时，低压同柱绕组依次是 c、a、b。高压 ABC 从同名端出线，低压也从带点的 c、a、b 出线，另一端 z、x、y 共接低压星点 n。',
    '揭示完整接线图。同柱从左到右为 A/c、B/a、C/b，低压的同名端位于出线侧。',
  ];
}
function deltaSteps() {
  const { reversed: deltaReversed, flipped } = lowSide;
  const otherYd11 = lowSide === otherYd11Side;
  const otherYd1 = lowSide === otherYd1Side;
  const links = describeDeltaLinks();
  const pairs = lowOrder
    .map((phase, column) => `${'ABC'[column]}/${'abc'[phase]}`)
    .join('、');
  const e = (phase) => `E<sub>${phase}</sub>`;
  const directions = lowOrder
    .map(
      (phase, column) =>
        `${e('abc'[phase])} 与 ${e('ABC'[column])} ${flipped ? '反向' : '同向'}`,
    )
    .join('、');
  const winding = deltaReversed ? 1 : 0;
  const lowPhase = 'abc'[winding];
  const highPhase = 'ABC'[lowOrder.indexOf(winding)];
  const equality = `${e('ab')} = ${deltaReversed ? '−' : ''}${e(lowPhase)}`;
  const linePolarity = deltaReversed === flipped ? '同向' : '反向';
  const relation = `${e('ab')} 与 ${e(highPhase)} ${linePolarity}。`;
  const windingDirection = deltaReversed ? 'b → a' : 'a → b';
  const dots = flipped ? '低压尾端 x、y、z 带点' : '低压出线端 a、b、c 带点';
  const polarities = flipped ? '从无点端指向带点端' : '从带点端指向无点端';
  const displacement =
    result.clock === 11 ? '超前 30°' : `滞后 ${result.clock * 30}°`;
  return {
    forward: [
      ...forwardSteps.slice(0, 3),
      [
        '按同柱绕组和同名端画低压相电动势',
        `同柱为 ${pairs}。${dots}，以出线端指向本绕组尾端为正方向，得到 ${directions}。根据跨接 ${links} 合并等电位端子，以 A、a 为公共起点，按示意幅值画出低压绕组相量。`,
        `低压的三个绕组相量组成闭合三角形。跨接端子为 ${links}。`,
      ],
      [
        '沿三角形的边取线电动势并读组号',
        `a、b 由同一个绕组跨接，按 a → b 取 ${equality}。${relation} 再画 b → c 和 c → a。低压线相量指向 ${result.clock} 点，较高压的 12 点${displacement}，组别为 ${groupName}。`,
        `高压 EAB 指向 12 点，低压 Eab 指向 ${result.clock} 点，组别为 ${groupName}。`,
      ],
    ],
    reverse: [
      [
        `由 ${groupName} 定出两侧 AB 线相量`,
        `Y 为高压星接，d 为低压三角形接法。数字 ${result.clock} 表示低压线相量较高压${displacement}。以 A、a 为公共起点，将 ${e('AB')} 对准 12 点，将 ${e('ab')} 对准 ${result.clock} 点。`,
        `两侧 AB 线相量从 A、a 出发，分别指向 12 点和 ${result.clock} 点。`,
      ],
      reverseSteps[1],
      [
        '由星点和三角形边确定两侧绕组相量',
        otherYd11
          ? '从 A、B、C 指向高压星点 N，得到三个高压相量。11 点的 E<sub>ab</sub> 与 −E<sub>B</sub> 同向。取 E<sub>ab</sub> = E<sub>a</sub>，将 a–x 绕组放在 B 柱。同理，E<sub>bc</sub> 与 −E<sub>C</sub> 同向，E<sub>ca</sub> 与 −E<sub>A</sub> 同向，将 b–y 放在 C 柱、c–z 放在 A 柱。'
          : otherYd1
            ? '从 A、B、C 指向高压星点 N，得到三个高压相量。1 点的 E<sub>ab</sub> 与 E<sub>A</sub> 同向。取 E<sub>ab</sub> = −E<sub>b</sub>，让 b–x 绕组沿 b→a，放在 A 柱。同理，将 c–y 放在 B 柱、a–z 放在 C 柱。'
          : `从 A、B、C 指向高压三角形中心 N，得到高压相量。低压每条边由一个绕组跨接。${relation} 选 ${highPhase} 柱上的低压绕组跨接 a、b，取 ${e(lowPhase)} 沿 ${windingDirection}，有 ${equality}。同理补齐另外两边。`,
        '高压虚线相量从各相出线到星点，低压虚线相量沿三角形各边平移画出。',
      ],
      [
        '由相量方向还原同柱极性和低压跨接',
        otherYd11
          ? '沿 a→x、b→y、c→z 的低压相量均与各自同柱的高压相量反向，所以尾端 x、y、z 带点。a→x 的终点是 b 点，故接 x–b。同理接 y–c、z–a。两套端子写法对应同一组物理接点，例如 a 都接 A 柱带点端与 B 柱无点端。'
          : `由 ${directions} 定出同柱配对 ${pairs}。高压相量从带点端指向无点端，所以低压相量${polarities}，${dots}。按低压相量的起讫点跨接 ${links}，得到一种 ${groupName} 接法。`,
        `完整低压接线。同柱为 ${pairs}，跨接为 ${links}，${dots}。`,
      ],
    ],
  };
}

let stepsByMode = delta
  ? deltaSteps()
  : { forward: forwardSteps, reverse: reverseSteps };

function selectDeltaSide(side) {
  lowSide = side;
  lowOrder = phaseOrder(lowSide.offset);
  result = vectorGroup(star, lowSide);
  groupName = getGroupName();
  stepsByMode = deltaSteps();
}

function render() {
  const reverse = mode !== 'forward';
  const sequence = stepsByMode[reverse ? 'reverse' : 'forward'];
  const step = progress[mode];
  const revealed = step > 0;
  const complete = step === sequence.length;
  const clockRevealed = reverse ? revealed : complete;
  byId('question').textContent = reverse
    ? `已知联结组 ${groupName}。固定高压 ABC，保持正相序，用相量图推导${delta ? '一种低压绕组接线' : '低压绕组的同柱排列和同名端'}。`
    : '已知右图的三相变压器接线，画出高、低压侧相量图，并用时钟法判断联结组别。';
  if (mode === 'reverse-alternate') {
    byId('question').textContent =
      `已知联结组 ${groupName}。固定高压 ABC 和正相序，从 ${result.clock} 点线相量推导低压端子的另一种标法。`;
  }
  byId('phasors').toggleAttribute('hidden', !revealed);
  const awaitingLowLines = !reverse && step === sequence.length - 1;
  byId('phasor-status').hidden = !awaitingLowLines;
  byId('phasor-prompt').hidden = revealed;
  byId('phasor-prompt').querySelector('p').innerHTML = reverse
    ? '先从组号确定两侧 AB 线相量的关系，再逐步推导接线。'
    : '以高压 E<sub>AB</sub> 为基线，逐步画出两侧相量。';
  byId('reveal').textContent = reverse ? '显示逆向推导' : '显示正向推导';
  byId('step-controls').hidden = !revealed;
  byId('previous-step').disabled = step <= 1;
  byId('next-step').textContent = complete
    ? '从头推导'
    : awaitingLowLines
      ? '画低压线相量'
      : reverse && step === sequence.length - 1
        ? '揭示低压接线'
        : '下一步';
  byId('wiring-title').textContent = reverse
    ? complete
      ? '答案 · 绕组接线图'
      : '待求 · 低压侧接线'
    : '已知 · 绕组接线图';
  byId('group-result').textContent = clockRevealed
    ? `${groupName} · ${result.clock || 12} 点`
    : reverse
      ? `已知 ${groupName}`
      : '待求 · 低压钟点';
  drawWiring(!reverse || complete);
  drawClock(clockRevealed ? result.clock : null);
  const steps = byId('steps');
  if (revealed) {
    const [heading, body, diagramDescription] = sequence[step - 1];
    drawPhasors(step, reverse, diagramDescription);
    steps.innerHTML = `<article><h2>第 ${step} / ${sequence.length} 步 · ${heading}</h2><p>${body}</p></article>`;
  } else {
    steps.innerHTML = reverse
      ? '<p>把高压出线端的同名端作为基准，依据组号和相量图确定低压接线。</p>'
      : '<p>作图约定：实线表示线电动势，虚线表示相电动势。</p>';
  }
}

const modeButtons = document.querySelectorAll('[data-mode]');
const alternateButton = document.querySelector(
  '[data-mode="reverse-alternate"]',
);
const alternateSide = yd11 ? otherYd11Side : yd1 ? otherYd1Side : null;
alternateButton.hidden = !alternateSide;
modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    if (alternateSide) {
      selectDeltaSide(
        mode === 'reverse-alternate' ? alternateSide : defaultLowSide,
      );
    }
    modeButtons.forEach((tab) =>
      tab.setAttribute('aria-pressed', String(tab === button)),
    );
    render();
  });
});
byId('reveal').addEventListener('click', () => {
  progress[mode] = 1;
  render();
  byId('next-step').focus();
});
byId('previous-step').addEventListener('click', () => {
  progress[mode]--;
  render();
  if (progress[mode] === 1) byId('next-step').focus();
});
byId('next-step').addEventListener('click', () => {
  const sequence = stepsByMode[mode === 'forward' ? 'forward' : 'reverse'];
  progress[mode] = (progress[mode] % sequence.length) + 1;
  render();
});
initConnectionNavigation();
if (yd1 && (legacyYd1Alternate || params.get('mode') === 'reverse-alternate')) {
  alternateButton.click();
} else {
  render();
}
