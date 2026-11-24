import {
  element,
  initConnectionNavigation,
  label,
} from './transformer-three-phase-connection-diagram.js';
import { phaseOrder, vectorGroup } from './transformer-vector-group-model.mjs';

const byId = (id) => document.getElementById(id);
const high = { connection: 'star', reversed: false, offset: 0, flipped: false };
const order = byId('order');
const polarity = byId('polarity');
let mode = 'forward';
let forwardStep = 0;
let checked = false;
let showAnswer = false;

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

function drawWiring(low, revealLow) {
  const svg = byId('wiring');
  svg.replaceChildren();
  svg.setAttribute(
    'aria-label',
    revealLow
      ? `高压 ABC、低压 ${phaseOrder(low.offset)
          .map((phase) => 'abc'[phase])
          .join(
            '',
          )}。高压 XYZ 和低压 xyz 分别接星点。低压同名端在${low.flipped ? '星点侧' : '出线侧'}。`
      : '高压 ABC 出线，XYZ 共接星点，同名端在出线侧。低压侧待确定。',
  );
  const columns = [143, 240, 337];
  columns.forEach((x) =>
    line(svg, [x, 20], [x, 256], {
      stroke: '#d9e3dc',
      'stroke-dasharray': '4 5',
    }),
  );
  [high, low].forEach((side, index) => {
    const isHigh = index === 0;
    const y = isHigh ? 23 : 154;
    const group = element(
      'g',
      { class: isHigh ? 'phasor-high' : 'phasor-low' },
      svg,
    );
    label(group, isHigh ? '高压 Y' : '低压 y', {
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
    const tails = isHigh ? 'XYZ' : 'xyz';
    line(group, [columns[0], y + 102], [columns[2], y + 102], {
      'stroke-width': 2,
    });
    phaseOrder(side.offset).forEach((phase, column) => {
      const x = columns[column];
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
          cy: y + (side.flipped ? 77 : 31),
          r: 4.1,
          fill: '#173b3b',
        },
        group,
      );
      label(group, heads[phase], { x, y: y + 3, 'font-size': 19 });
      label(group, tails[phase], { x: x - 16, y: y + 86, 'font-size': 17 });
    });
    label(group, isHigh ? 'N' : 'n', { x: 361, y: y + 102, 'font-size': 16 });
  });
}

function drawPhasors(
  { high: highVoltages, low: lowVoltages, clock },
  step,
  forward,
) {
  const svg = byId('phasors');
  svg.replaceChildren();
  svg.setAttribute(
    'aria-label',
    step < forwardSteps.length
      ? forwardSteps[step - 1][2]
      : forward
        ? 'A、a 等电位并在图中重合。紫色低压相量较短，与对应高压相量同向，重合的线段上紫色在上层。两支 AB 线相量都朝 12 点。'
        : clock === 0
          ? 'A 与 a 同在左下，B、b 在各自三角形上方，C、c 在右下。高压线电动势沿 A 到 B 到 C 再回到 A，低压方向对应。各相电动势从出线端指向星点。'
          : `高、低压相量共用星点绘制，各相电动势指向星点。低压 Eab 位于时钟 ${clock} 点。`,
  );
  // E_AB is drawn from A to B, opposite to the model's voltage vector.
  const [refX, refY] = forward
    ? highVoltages.line[0].map((component) => -component)
    : highVoltages.phase[1];
  const radius = Math.hypot(refX, refY);
  const project = ([x, y]) => [
    (x * refY - y * refX) / radius,
    -(x * refX + y * refY) / radius,
  ];
  const highCenter = forward ? [190, 181] : [216, 208];
  const highScale = 158;
  const lowScale = 88;
  const overlapAtA = clock === 0;
  const forwardWithLowSide = forward && step >= 4;
  const highA = project(highVoltages.phase[0]);
  const phaseLabels = [];
  const lowCenter = overlapAtA
    ? highA.map((value, i) => highCenter[i] + (highScale - lowScale) * value)
    : highCenter;
  if (forwardWithLowSide) {
    const a = highA.map((value, i) => highCenter[i] + highScale * value);
    label(svg, '低压幅值按示意比例绘制', {
      x: a[0],
      y: a[1] + 37,
      'text-anchor': 'start',
      color: '#47665d',
      'font-size': 16,
    });
  }
  [
    [highVoltages, highCenter, highScale, 'ABC', 'N', 'phasor-high'],
    [lowVoltages, lowCenter, lowScale, 'abc', 'n', 'phasor-low'],
  ].forEach(([voltages, center, scale, names, neutral, className], side) => {
    if (side && step < 4) return;
    const showPhase = step >= (side ? 4 : 3);
    const showLine = step >= (side ? 5 : 2);
    const group = element('g', { class: className }, svg);
    const tips = voltages.phase.map((value) =>
      project(value).map((component, i) => center[i] + scale * component),
    );
    tips.forEach((to, i) => {
      if (step === 1 && i === 2) return;
      if (showPhase) {
        arrow(
          group,
          to,
          center,
          forward ? (side ? 2.8 : 4) : 2,
          0.86,
          true,
          forward ? 16 : 10,
        );
        if (forward) {
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
      }
      if ((showLine && !(forward && side)) || (!side && i === 0)) {
        arrow(
          group,
          to,
          tips[(i + 1) % 3],
          forward && !side && (i === 0 || (i === 2 && forwardWithLowSide))
            ? 7
            : i === 0
              ? side
                ? 3
                : 6
              : 2.4,
          i === 0 ? 0.66 : 0.65,
          false,
          forward ? (!side && i === 0 ? 26 : 19) : 10,
        );
      }
      const sharedA = overlapAtA && i === 0 && step >= 4;
      if (!sharedA || !side) {
        const [x, y] = to.map(
          (value, axis) => value + (value - center[axis]) * 0.14,
        );
        const adjacentToHighEdge = overlapAtA && side === 1;
        label(group, sharedA ? 'A = a' : names[i], {
          x: x - (adjacentToHighEdge && i === 1 ? 9 : 0),
          y: y + (adjacentToHighEdge && i === 2 ? 15 : 0),
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
      if (clock === 0 || !side) {
        label(group, clock !== 0 ? 'N = n' : neutral, {
          x: center[0] - (clock === 0 ? 14 : 27),
          y: center[1] - 11,
          'font-size': 16,
        });
      }
    }
    if (!showLine && side) return;
    if (forward && side) {
      // Draw the purple line voltages after both sets of phase voltages.
      const lineVoltages = element('g', { class: 'low-line-voltages' }, group);
      tips.forEach((from, i) => {
        arrow(
          lineVoltages,
          from,
          tips[(i + 1) % 3],
          4.8,
          i === 0 ? 0.66 : 0.65,
          false,
          21,
        );
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
  arrow(element('g', { class: 'phasor-high' }, svg), center, point(0, 65), 7);
  if (clock !== null) {
    arrow(
      element('g', { class: 'phasor-low' }, svg),
      center,
      point(clock, 44),
      3.5,
    );
  }
  element(
    'circle',
    { cx: center[0], cy: center[1], r: 4, fill: '#173b3b' },
    svg,
  );
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
    '右图中 A/a、B/b、C/c 分别同柱，两侧出线均在同名端。以 A、a 等电位为基准，将两点重合。较短的紫色相量 E<sub>a</sub>、E<sub>b</sub>、E<sub>c</sub> 分别与对应高压相量同向。',
    'A、a 等电位，画在同一点。低压相电动势较短，与对应高压相量平行同向。',
  ],
  [
    '由低压相电动势求线电动势并读组号',
    'E<sub>ab</sub> = E<sub>a</sub> − E<sub>b</sub>，画成 a → b。同理画 b → c 和 c → a。E<sub>AB</sub> 与 E<sub>ab</sub> 都竖直指向 12 点。两侧星接，组别为 Yy0。',
  ],
];

const reverseSteps = [
  [
    '① 由 0 点定线电动势',
    'E<sub>AB</sub> 与 E<sub>ab</sub> 同向，在时钟上都指向 12 点。两侧星接且均为正相序，线电动势各超前对应相电动势 30°。',
  ],
  [
    '② 从线电动势反求相电动势',
    '从两支线相量各沿滞后方向转 30°，得 A、a 相的相电动势方向。再按正相序依次滞后 120°，B/b、C/c 也分别同向。',
  ],
  [
    '③ 由相电动势定接线',
    '高压按 ABC 排列时，低压同柱按 abc 排列，出线都接同名端。XYZ、xyz 分别共接星点，引出 ABC、abc。',
  ],
];

function render() {
  const reverse = mode === 'reverse';
  const trial = reverse && checked && !showAnswer;
  const low = trial
    ? {
        ...high,
        offset: Number(order.value),
        flipped: polarity.value === 'tail',
      }
    : high;
  const result = vectorGroup(high, low);
  const revealed = reverse ? checked || showAnswer : forwardStep > 0;
  const clockRevealed = reverse || forwardStep === forwardSteps.length;
  byId('question').textContent = reverse
    ? '已知联结组 Yy0，两侧均为星接。固定高压 ABC，保持正相序，如何选低压绕组的同柱排列和同名端方向？'
    : '已知右图的三相变压器接线，画出高、低压侧相量图，并用时钟法判断联结组别。';
  byId('phasors').toggleAttribute('hidden', !revealed);
  byId('phasor-title').textContent = reverse ? '相量叠图' : '相量图';
  const awaitingLowLines = !reverse && forwardStep === forwardSteps.length - 1;
  byId('phasor-status').hidden = !awaitingLowLines;
  byId('phasor-prompt').hidden = revealed;
  byId('phasor-prompt').querySelector('p').innerHTML = reverse
    ? '先从组号定低压线电动势的方向，再倒推相电动势。'
    : '以高压 E<sub>AB</sub> 为基线，逐步画出两侧相量。';
  byId('reveal').hidden = reverse;
  byId('forward-controls').hidden = reverse || !revealed;
  byId('previous-step').disabled = forwardStep <= 1;
  byId('next-step').textContent = clockRevealed
    ? '从头推导'
    : awaitingLowLines
      ? '画低压线相量'
      : '下一步';
  byId('reverse-controls').hidden = !reverse;
  byId('wiring-title').textContent = reverse
    ? showAnswer
      ? '答案 · 绕组接线图'
      : trial
        ? '所选 · 绕组接线图'
        : '待求 · 低压侧接线'
    : '已知 · 绕组接线图';
  byId('group-result').textContent =
    revealed && clockRevealed
      ? `Yy${result.clock} · ${result.clock || 12} 点`
      : reverse
        ? '已知 Yy0 · 12 点'
        : '待求 · 低压钟点';
  drawWiring(low, !reverse || revealed);
  drawClock(clockRevealed ? result.clock : null);
  if (revealed) {
    drawPhasors(result, reverse ? forwardSteps.length : forwardStep, !reverse);
  }
  const steps = byId('steps');
  if (!reverse && revealed) {
    const [heading, body] = forwardSteps[forwardStep - 1];
    steps.innerHTML = `<article><h2>第 ${forwardStep} / ${forwardSteps.length} 步 · ${heading}</h2><p>${body}</p></article>`;
  } else if (trial && result.clock !== 0) {
    steps.innerHTML = `<p>这组接法得到 Yy${result.clock}，低压线电动势指向 ${result.clock} 点。循环换位使对应相量转过 120° 或 240°，反转一侧同名端再转过 180°。请调整接法，使 E<sub>ab</sub> 回到 12 点。</p>`;
  } else if (revealed) {
    steps.innerHTML = reverseSteps
      .map(
        ([heading, body]) =>
          `<article><h2>${heading}</h2><p>${body}</p></article>`,
      )
      .join('');
  } else {
    steps.innerHTML = reverse
      ? '<p>把高压出线端的同名端作为基准。低压 xyz 共接，可按正相序循环换位，并可整体改变同名端相对于星点的方向。</p>'
      : '<p>作图约定：实线表示线电动势，虚线表示相电动势。</p>';
  }
}

document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document
      .querySelectorAll('[data-mode]')
      .forEach((tab) =>
        tab.setAttribute('aria-pressed', String(tab === button)),
      );
    render();
  });
});
byId('reveal').addEventListener('click', () => {
  forwardStep = 1;
  render();
  byId('next-step').focus();
});
byId('previous-step').addEventListener('click', () => {
  forwardStep--;
  render();
  if (forwardStep === 1) byId('next-step').focus();
});
byId('next-step').addEventListener('click', () => {
  forwardStep = (forwardStep % forwardSteps.length) + 1;
  render();
});
[order, polarity].forEach((control) => {
  control.addEventListener('change', () => {
    byId('check').disabled = !order.value || !polarity.value;
    checked = false;
    showAnswer = false;
    render();
  });
});
byId('check').addEventListener('click', () => {
  checked = true;
  showAnswer = false;
  render();
});
byId('answer').addEventListener('click', () => {
  order.value = '0';
  polarity.value = 'head';
  byId('check').disabled = false;
  showAnswer = true;
  render();
});
initConnectionNavigation();
render();
