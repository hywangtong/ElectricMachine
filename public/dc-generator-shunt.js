import {
  defaults,
  emf,
  readings,
  derivative,
  step,
  equilibrium,
  effectiveResistance,
  critical,
  externalCurve,
} from './dc-generator-shunt-model.mjs';

const pages = {
  principle: {
    title: '并励发电机：自己的电压，供给自己的励磁',
    lead: '先有剩磁，再有小电压；励磁接成助磁，电压才会逐步建立。',
    concept:
      'Φᵣ → Eᵣ → Iᶠ → Φ ↑ → E ↑ → Iᶠ ↑。磁路饱和后，增磁放缓，最终停在稳态点 Q。',
    label: '01 / 剩磁启动正反馈',
    presets: [
      ['normal', '正向建压'],
      ['reverse', '反向剩磁'],
      ['zero', '没有剩磁'],
      ['opposing', '接成去磁'],
    ],
  },
  buildup: {
    title: '建压停在哪里？空载特性与场阻线的交点',
    lead: '空载是负载电流 I = 0；励磁支路仍通电，所以电枢电流 Iₐ = Iᶠ。',
    concept:
      '稳态：E = (Rᶠ + Rₐ)Iᶠ，U = RᶠIᶠ。曲线高于场阻线时 Iᶠ 增大；低于时 Iᶠ 减小；到 Q 时两者相等。',
    label: '02 / 两个约束，共同决定 Q',
    presets: [
      ['normal', '重新看建压'],
      ['weak', '小剩磁 · 慢起励'],
      ['rf-up', '增大 Rᶠ'],
      ['ra-up', '增大 Rₐ'],
    ],
  },
  critical: {
    title: '电阻太大，或转速太低，为什么难以建压？',
    lead: 'Rᶠ、Rₐ 改变场阻线斜率；转速改变整条空载磁化曲线的高度。',
    concept:
      '课件判据：Rᶠ < Rₖ（通常忽略 Rₐ）。保留 Rₐ 后，比较 Rᶠ + Rₐ 与临界总电阻；同一电阻下，需 n > nₖ。',
    label: '03 / 临界电阻与临界转速',
    presets: [
      ['normal', '可建压'],
      ['critical', '临界附近'],
      ['high-r', '电阻过大'],
      ['low-n', '转速过低'],
    ],
  },
  load: {
    title: '并励发电机带载：电压下降，又会削弱励磁',
    lead: '逐步减小 RＬ，观察外特性回弯；灰色虚线对照：保持原空载励磁的他励发电机。',
    concept:
      'RＬ ↓ → IₐRₐ ↑ → U ↓ → Iᶠ ↓ → Φ ↓ → E ↓。低饱和区电压急降，I = U / RＬ 也会转而下降。',
    label: '04 / 外特性、回弯与稳态短路',
    presets: [
      ['normal', '空载建压'],
      ['light', '轻载'],
      ['heavy', '重载 · 回弯'],
      ['short', '稳态短路'],
    ],
  },
};
const key = new URLSearchParams(location.search).get('page');
let page = Object.hasOwn(pages, key) ? key : 'principle';
let config = pages[page];
const $ = (id) => document.getElementById(id);
const modelNote =
  '依据附件 §7.9 并励发电机（第 1—4 页）。教学参数：E = 7.5nΦ，Φ = Φᵣ + 0.020 tanh(sIᶠ/1.5) Wb，s = ±1；Lᶠ = 90 H，Lᶠ dIᶠ/dt = U − RᶠIᶠ。Rᶠ 包含励磁绕组与调节电阻。非实测曲线／完整磁滞模型；转速外部给定，电枢准稳态，忽略电刷压降、电枢反应及短路瞬间峰值。';

let input = { ...defaults };
try {
  const saved = JSON.parse(sessionStorage.getItem('dc-shunt-parameters'));
  if (
    saved &&
    ['residual', 'speed', 'rf', 'ra', 'aiding'].every((name) =>
      Number.isFinite(saved[name]),
    )
  ) {
    input = { ...input, ...saved, load: Infinity };
  }
} catch {
  /* Storage is optional in restricted browsers. */
}
let current = 0;
let time = 0;
let angle = 0;
let paused = false;
let previous = performance.now();
let paint = 0;
let samples = [];
let events = [];
let target;
let curve;
let phase = { armature: 0, field: 0, load: 0 };
const fmt = (value, digits = 1) =>
  (Math.abs(value) < 0.00005 ? 0 : value).toFixed(digits);
const loadFromSlider = (value) =>
  value === 101
    ? Infinity
    : value === 0
      ? 0
      : 10 ** (-1.4 + ((value - 1) * 3.4) / 99);

function updateParameters() {
  target = equilibrium(input);
  curve = page === 'load' ? externalCurve(input) : null;
  const reverse = input.residual < 0;
  $('chart-heading').textContent =
    page === 'load'
      ? `外特性 U–I${reverse ? ' · 幅值图' : ''} · 固定 n、Rᶠ`
      : `空载磁化曲线 E–Iᶠ${reverse ? ' · 幅值图，读数保留负号' : ' · 动画工作点'}`;
  for (const name of ['residual', 'speed', 'rf', 'ra'])
    $(name).value = input[name];
  $('residual-value').textContent =
    `${input.residual > 0 ? '+' : ''}${fmt(input.residual)} mWb`;
  $('speed-value').textContent = `${input.speed} r/min`;
  $('rf-value').textContent = `${fmt(input.rf, 0)} Ω`;
  $('ra-value').textContent = `${fmt(input.ra)} Ω`;
  $('load-value').textContent =
    input.load === Infinity
      ? '∞ · 空载'
      : input.load === 0
        ? '0 Ω · 短路'
        : `${fmt(input.load, 2)} Ω`;
  $('connection').textContent =
    input.aiding === 1 ? '接线：助磁 ✓' : '接线：去磁 ✕';
  $('connection').setAttribute('aria-pressed', String(input.aiding === -1));
  $('field-sign').textContent = input.aiding === 1 ? '助磁 Φᶠ' : '去磁 Φᶠ';
  $('mode').textContent =
    input.load === Infinity
      ? '空载 I = 0'
      : input.load === 0
        ? '稳态短路实验'
        : '带载';
  $('speed-note').textContent = `原动机 n = ${input.speed} r/min`;
  $('load-symbol').style.display =
    input.load > 0 && input.load < Infinity ? '' : 'none';
  $('load-open').style.display = input.load === Infinity ? '' : 'none';
  $('load-short').style.display = input.load === 0 ? '' : 'none';
  try {
    sessionStorage.setItem(
      'dc-shunt-parameters',
      JSON.stringify({
        residual: input.residual,
        speed: input.speed,
        rf: input.rf,
        ra: input.ra,
        aiding: input.aiding,
      }),
    );
  } catch {
    /* Optional. */
  }
}

function restart(clear = false) {
  current = 0;
  if (clear) {
    time = 0;
    samples = [];
    events = [];
    phase = { armature: 0, field: 0, load: 0 };
  }
  samples.push({ time, ...readings(current, input) });
}

for (const name of ['residual', 'speed', 'rf', 'ra', 'load']) {
  $(name).addEventListener('input', () => {
    input[name] =
      name === 'load'
        ? loadFromSlider(Number($(name).value))
        : Number($(name).value);
    events.push({
      time,
      label: {
        residual: '剩磁',
        speed: '转速',
        rf: 'Rᶠ',
        ra: 'Rₐ',
        load: 'RＬ',
      }[name],
    });
    if (name === 'residual') restart();
    updateParameters();
    render();
  });
}
$('connection').addEventListener('click', () => {
  input.aiding *= -1;
  restart();
  events.push({ time, label: '接线' });
  updateParameters();
  render();
});
$('restart').addEventListener('click', () => {
  restart();
  events.push({ time, label: '起励' });
  render();
});
$('reset').addEventListener('click', () => {
  input = { ...defaults };
  $('load').value = 101;
  setPaused(false);
  restart(true);
  updateParameters();
  render();
});
function setPaused(value) {
  paused = value;
  $('pause').textContent = paused ? '继续' : '暂停';
  $('pause').setAttribute('aria-pressed', String(paused));
  for (const element of document.querySelectorAll(
    'input, #connection, #restart, #presets button',
  ))
    element.disabled = paused;
}
$('pause').addEventListener('click', () => setPaused(!paused));
function renderPresets() {
  $('presets').replaceChildren();
  for (const [preset, label] of config.presets) {
    const button = document.createElement('button');
    button.textContent = label;
    button.dataset.preset = preset;
    button.addEventListener('click', () => {
      if (
        [
          'normal',
          'reverse',
          'zero',
          'opposing',
          'weak',
          'critical',
          'high-r',
          'low-n',
        ].includes(preset)
      )
        input = { ...defaults };
      if (preset === 'reverse') input.residual = -1.2;
      if (preset === 'zero') input.residual = 0;
      if (preset === 'opposing') input.aiding = -1;
      if (preset === 'weak') input.residual = 0.1;
      if (preset === 'rf-up') input.rf = Math.min(300, input.rf + 40);
      if (preset === 'ra-up') input.ra = 20;
      if (preset === 'critical') input.rf = 149;
      if (preset === 'high-r') input.rf = 260;
      if (preset === 'low-n') input.speed = 500;
      if (preset === 'normal') $('load').value = 101;
      if (['light', 'heavy', 'short'].includes(preset)) {
        $('load').value = { light: 60, heavy: 22, short: 0 }[preset];
        input.load = loadFromSlider(Number($('load').value));
      } else if (['rf-up', 'ra-up'].includes(preset)) {
        /* Continue from actual current. */
      } else restart();
      events.push({ time, label: '对照' });
      updateParameters();
      render();
    });
    $('presets').append(button);
  }
}

function selectPage(next, updateAddress = false) {
  if (!Object.hasOwn(pages, next)) return;
  const changed = page !== next;
  const previousLoad = input.load;
  page = next;
  config = pages[page];
  // Keep the field state and history. Only the load topic connects the saved RL.
  input.load =
    page === 'load' ? loadFromSlider(Number($('load').value)) : Infinity;
  document.querySelector('main').dataset.page = page;
  document.title = config.title;
  $('lead').textContent = config.lead;
  $('concept-heading').textContent = config.label;
  $('concept').textContent = config.concept;
  $('load-control').hidden = page !== 'load';
  $('curve-legend').textContent =
    page === 'load' ? '并励外特性 U(I)' : '空载磁化曲线 E(Iᶠ)';
  $('line-legend').textContent =
    page === 'load' ? '灰虚线：恒励磁他励对照' : '场阻线 (Rᶠ + Rₐ)Iᶠ';
  $('model-note').textContent =
    modelNote +
    (page === 'critical'
      ? ' 临界值采用零剩磁初始切线近似；有限剩磁曲线平滑过渡，不将临界点读数强制置零。'
      : '');
  $('shunt-panel').setAttribute('aria-labelledby', `shunt-tab-${page}`);
  for (const tab of document.querySelectorAll('[role="tab"]')) {
    const active = tab.dataset.page === page;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  if (previousLoad !== input.load) {
    events.push({ time, label: page === 'load' ? '带载' : '空载' });
    samples.push({ time, ...readings(current, input) });
  }
  renderPresets();
  updateParameters();
  setPaused(paused);
  render();
  if (updateAddress && changed) {
    if (window.parent !== window)
      window.parent.postMessage(
        { type: 'dc-shunt-select', page },
        location.origin,
      );
    else {
      const url = new URL(location.href);
      url.searchParams.set('page', page);
      history.pushState(null, '', url);
    }
  }
}

const tabs = [...document.querySelectorAll('[role="tab"]')];
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectPage(tab.dataset.page, true));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft')
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    tabs[next].focus();
    selectPage(tabs[next].dataset.page, true);
  });
}
window.addEventListener('message', (event) => {
  if (
    event.source === window.parent &&
    event.origin === location.origin &&
    event.data?.type === 'dc-shunt-page' &&
    event.data.page !== page
  )
    selectPage(event.data.page);
});
window.addEventListener('popstate', () => {
  selectPage(new URLSearchParams(location.search).get('page') || 'principle');
});

const text = (x, y, value, color = '#60776f', size = 14, anchor = 'start') =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${value}</text>`;
const path = (points, color, width = 3, dashed = false) =>
  `<path d="${points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="6 5"' : ''} />`;
function chartAxes(xMax, yMax, xTitle, yTitle, sign = 1) {
  let svg = '';
  for (let i = 0; i <= 4; i++) {
    const x = 65 + (695 * i) / 4;
    const y = 200 - (155 * i) / 4;
    svg += `<path d="M65 ${y}H760M${x} 45V200" stroke="#e3e9df" />`;
    svg += text(55, y + 4, fmt((sign * yMax * i) / 4, 0), '#60776f', 13, 'end');
    svg += text(x, 222, fmt((sign * xMax * i) / 4, 1), '#60776f', 13, 'middle');
  }
  svg +=
    '<path d="M65 40V200H772" fill="none" stroke="#88a89c" stroke-width="1.5" />';
  svg += text(8, 26, yTitle, '#315a5c', 15);
  svg += text(780, 243, xTitle, '#315a5c', 14, 'end');
  return svg;
}
function drawChart(r) {
  const sign = Math.sign(input.residual) || 1;
  if (page === 'load') {
    const xMax = Math.max(
      10,
      ...curve.map((point) => Math.abs(point.loadCurrent) * 1.12),
      Math.abs(r.loadCurrent) * 1.12,
    );
    const yMax = Math.max(
      100,
      Math.abs(curve[0].u) * 1.15,
      Math.abs(r.u) * 1.1,
    );
    const x = (i) => 65 + ((sign * i) / xMax) * 695;
    const y = (u) => 200 - ((sign * u) / yMax) * 155;
    let svg = chartAxes(
      xMax,
      yMax,
      sign < 0 ? '负载电流 |I| / A' : '负载电流 I / A',
      sign < 0 ? '端电压 |U| / V' : '端电压 U / V',
    );
    svg += path(
      curve.map((point) => [x(point.loadCurrent), y(point.u)]),
      '#26786b',
      3.5,
    );
    const open = curve[0];
    svg += path(
      Array.from({ length: 81 }, (_, i) => {
        const loadCurrent = (sign * xMax * i) / 80;
        const u = open.e - input.ra * (loadCurrent + open.current);
        return [x(loadCurrent), y(sign * Math.max(0, sign * u))];
      }),
      '#9ba59e',
      2,
      true,
    );
    const visible = samples.filter(
      (sample) =>
        sign * sample.loadCurrent >= 0 &&
        sign * sample.u >= 0 &&
        Math.abs(sample.u) <= yMax &&
        Math.abs(sample.loadCurrent) <= xMax,
    );
    svg += path(
      visible.map((sample) => [x(sample.loadCurrent), y(sample.u)]),
      '#d6a14b',
      1.6,
    );
    svg += `<circle cx="${x(target.loadCurrent)}" cy="${y(target.u)}" r="9" fill="#fffefa" stroke="#be6047" stroke-width="2" /><circle cx="${x(r.loadCurrent)}" cy="${y(r.u)}" r="5" fill="#be6047" />`;
    svg += text(
      95,
      30,
      `Q：I = ${fmt(target.loadCurrent)} A，U = ${fmt(target.u)} V`,
      '#be6047',
      15,
    );
    svg += text(355, 70, 'RＬ 从 ∞ 减至 0：沿绿色曲线运行', '#26786b', 14);
    $('chart').innerHTML = svg;
    return;
  }
  const xMax = Math.max(
    3,
    Math.abs(target.current) * 1.3,
    Math.abs(current) * 1.3,
  );
  const yMax = 350;
  const x = (i) => 65 + ((sign * i) / xMax) * 695;
  const y = (e) => 200 - ((sign * e) / yMax) * 155;
  let svg = chartAxes(
    xMax,
    yMax,
    sign < 0 ? '励磁电流 |Iᶠ| / A' : '励磁电流 Iᶠ / A',
    sign < 0 ? '感生电动势 |E| / V' : '感生电动势 E / V',
  );
  if (page === 'critical') {
    for (const speed of [900, 1500, 1800]) {
      svg += path(
        Array.from({ length: 101 }, (_, i) => {
          const f = (sign * xMax * i) / 100;
          return [x(f), y(emf(f, { ...input, speed }))];
        }),
        '#bacac0',
        1.2,
        true,
      );
    }
    const slope = critical(input).resistance;
    const end = Math.min(xMax, yMax / Math.max(slope, 1));
    svg += path(
      [
        [x(0), y(0)],
        [x(sign * end), y(sign * end * slope)],
      ],
      '#adab83',
      1.5,
      true,
    );
    svg += text(
      310,
      29,
      '灰虚线：900 / 1500 / 1800 r/min；金虚线：临界切线',
      '#71847c',
      12,
    );
  }
  // Crop the opposing-connection branch at the zero-EMF axis.
  const magnetization = [];
  for (let i = 0; i <= 180; i++) {
    const f = (sign * xMax * i) / 180;
    const e = emf(f, input);
    if (sign * e < 0) break;
    magnetization.push([x(f), y(e)]);
  }
  svg += path(magnetization, '#26786b', 3.5);
  const resistance = effectiveResistance(input);
  const end = Math.min(xMax, yMax / resistance);
  svg += path(
    [
      [x(0), y(0)],
      [x(sign * end), y(sign * resistance * end)],
    ],
    '#77649d',
    2.5,
  );
  svg += path(
    [
      [x(current), y(r.e)],
      [x(current), y(sign * Math.min(yMax, Math.abs(resistance * current)))],
    ],
    '#d6a14b',
    2,
    true,
  );
  svg += `<path d="M${x(target.current)} 200V${y(target.e)}H65" fill="none" stroke="#be6047" stroke-dasharray="4 5" opacity=".4" />`;
  svg += `<circle cx="${x(target.current)}" cy="${y(target.e)}" r="9" fill="#fffefa" stroke="#be6047" stroke-width="2" /><circle cx="${x(current)}" cy="${y(r.e)}" r="5" fill="#be6047" />`;
  svg += `<circle cx="65" cy="${y(emf(0, input))}" r="5" fill="#d6a14b" />`;
  svg += text(95, 64, `Eᵣ = ${fmt(emf(0, input))} V`, '#a17a36', 14);
  svg += text(
    95,
    89,
    `Q：Iᶠ = ${fmt(target.current, 2)} A，E = ${fmt(target.e)} V`,
    '#be6047',
    15,
  );
  svg += text(535, 182, `场阻线斜率 ${fmt(resistance)} Ω`, '#77649d', 14);
  $('chart').innerHTML = svg;
}

function drawScope() {
  const end = Math.max(18, time);
  const start = end - 18;
  const max = Math.max(
    80,
    Math.abs(target.u) * 1.1,
    ...samples.map((sample) => Math.abs(sample.u) * 1.1),
  );
  const x = (t) => 65 + ((t - start) / 18) * 695;
  const y = (u) => 49 - (u / max) * 35;
  let svg = `<path d="M65 14V85H760M65 49H760" stroke="#d6e1d7" fill="none" />`;
  for (const u of [-max, 0, max])
    svg += text(55, y(u) + 4, fmt(u, 0), '#71847c', 11, 'end');
  svg += text(10, 10, 'U / V', '#71847c', 11);
  svg += path(
    [
      [65, y(target.u)],
      [760, y(target.u)],
    ],
    '#77649d',
    1.2,
    true,
  );
  svg += path(
    samples
      .filter((sample) => sample.time >= start)
      .map((sample) => [x(sample.time), y(sample.u)]),
    '#26786b',
    2.5,
  );
  let lastEventX = -100;
  for (const event of events.filter((event) => event.time >= start)) {
    const ex = x(event.time);
    if (ex - lastEventX < 42) continue;
    svg +=
      `<path d="M${ex} 14V85" stroke="#d6a14b" stroke-dasharray="3 4" opacity=".5" />` +
      text(ex + 3, 12, event.label, '#a17a36', 10);
    lastEventX = ex;
  }
  for (let i = 0; i <= 3; i++)
    svg += text(
      65 + (i * 695) / 3,
      101,
      `${fmt(start + i * 6, 0)} s`,
      '#71847c',
      11,
      'middle',
    );
  $('scope').innerHTML = svg;
}

function render() {
  const r = readings(current, input);
  $('time').textContent = `${fmt(time)} s${paused ? ' · 已暂停' : ''}`;
  for (const [name, value, unit, digits] of [
    ['e', r.e, 'V', 1],
    ['u', r.u, 'V', 1],
    ['if', current, 'A', 2],
    ['i', r.loadCurrent, 'A', 1],
  ])
    $(name + '-meter').textContent = `${fmt(value, digits)} ${unit}`;
  $('balance').textContent =
    `Iₐ = ${fmt(r.ia, 2)} A；U = E − IₐRₐ = ${fmt(r.e)} − (${fmt(r.ia, 2)}) × ${fmt(input.ra)} = ${fmt(r.u)} V`;
  const polarity = r.e < 0 ? ['−', '+'] : ['+', '−'];
  $('emf-plus').textContent = polarity[0];
  $('emf-minus').textContent = polarity[1];
  const terminals = r.u < 0 ? ['−', '+'] : ['+', '−'];
  $('terminal-plus').textContent = Math.abs(r.u) < 0.01 ? '0' : terminals[0];
  $('terminal-minus').textContent = Math.abs(r.u) < 0.01 ? '0' : terminals[1];
  $('rotor').setAttribute('transform', `rotate(${angle} 85 119)`);
  for (const [id, value, p] of [
    ['armature-flow', r.ia, 'armature'],
    ['field-flow', current, 'field'],
    ['load-flow', r.loadCurrent, 'load'],
  ]) {
    $(id).style.strokeDashoffset = -phase[p];
    $(id).style.opacity = Math.abs(value) < 0.002 ? 0 : 0.9;
  }
  const c = critical(input);
  let status;
  let detail;
  if (input.speed === 0) {
    status = '停转：没有感生电动势';
    detail = 'n = 0 → E = 0；原有励磁电流经电阻逐渐衰减。';
  } else if (input.residual === 0) {
    status = '没有剩磁：不能从零自行起励';
    detail =
      '初始 Iᶠ = 0、Eᵣ = 0，正反馈缺少启动信号；正向剩磁按钮可恢复建压。';
  } else if (input.load === 0) {
    status = '稳态短路：U = 0，励磁最终消失';
    detail = `Iᶠ → 0、E → Eᵣ = ${fmt(emf(0, input))} V；Isc = Eᵣ / Rₐ = ${fmt(target.ia)} A。本图不模拟短路瞬间的大电流。`;
  } else if (input.aiding === -1) {
    status = '接成去磁：正反馈被破坏';
    detail =
      '励磁磁通抵消剩磁，电动势减小，只建立低电压；剩磁反向与接线反接是两个不同的操作。';
  } else if (page === 'critical') {
    const margin = input.rf + input.ra - c.resistance;
    status =
      Math.abs(margin) < 4
        ? '临界附近：电压对参数变化敏感'
        : margin < 0
          ? '场阻线较平：可放大剩磁电压'
          : '场阻线较陡：只能形成较低电压';
    detail = `Rᶠ + Rₐ = ${fmt(input.rf + input.ra)} Ω；临界总电阻 ≈ ${fmt(c.resistance)} Ω；nₖ ≈ ${fmt(c.speed, 0)} r/min。有限剩磁下为平滑过渡。`;
  } else if (page === 'load') {
    status = '固定 n、Rᶠ：负载变化同时改变励磁';
    detail = `当前 RＬ：${input.load === Infinity ? '∞' : fmt(input.load, 2) + ' Ω'}。稳态 If = U/Rᶠ；灰线励磁固定，仅体现 Ra 压降。课件另计电枢反应，会进一步降低 U。`;
  } else {
    const growing = Math.sign(input.residual) * derivative(current, input);
    status =
      Math.abs(current - target.current) < 0.005
        ? '已到 Q：磁化曲线与场阻线同时满足'
        : growing > 0
          ? '正在建压：电流与磁通逐步增强'
          : '正在回落：工作点向新的 Q 移动';
    detail =
      page === 'buildup'
        ? `暂态 U = RᶠIᶠ + Lᶠ dIᶠ/dt，不能直接把 U/Rᶠ 当作瞬时 If。稳态 U = ${fmt(target.u)} V，比 E 少 IᶠRₐ。`
        : `剩磁${input.residual > 0 ? '正向' : '反向'} → 稳态端电压 ${fmt(target.u)} V；方向决定极性，小剩磁主要延缓起励。`;
  }
  $('status').textContent = status;
  $('detail').textContent = detail;
  drawChart(r);
  drawScope();
}

function frame(now) {
  const dt = Math.min(0.06, (now - previous) / 1000);
  previous = now;
  if (!paused && !document.hidden) {
    current = step(current, input, dt);
    time += dt;
    angle = (angle + (input.speed / 1500) * 65 * dt) % 360;
    const r = readings(current, input);
    for (const [name, value] of [
      ['armature', r.ia],
      ['field', current],
      ['load', r.loadCurrent],
    ])
      phase[name] += Math.sign(value) * Math.min(70, Math.abs(value) * 25) * dt;
    samples.push({ time, ...r });
    while (samples.length > 1 && samples[1].time < time - 18) samples.shift();
    events = events.filter((event) => event.time >= time - 18);
  }
  if (now - paint > 50) {
    render();
    paint = now;
  }
  requestAnimationFrame(frame);
}
// Keep native control keys and drags; forward course navigation elsewhere.
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
restart(true);
selectPage(page);
requestAnimationFrame(frame);
