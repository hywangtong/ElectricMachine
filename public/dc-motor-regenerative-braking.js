import {
  parameters as p,
  scenario,
  operatingPoint,
  speedAt,
  timeAt,
  phase,
  loweringResistance,
  minimumResistance,
} from './dc-motor-regenerative-braking-model.mjs';
import {
  circuitDiagram,
  updateCircuit,
} from './dc-motor-regenerative-braking-diagram.js';

const pages = {
  downhill: {
    mode: 'downhill',
    title: '回馈制动 · 电车下坡',
    description:
      '下坡时重力带动电机加速，越过理想空载转速后，电流与电磁转矩反向。',
    action: '进入下坡',
    range: [-70, 70, 800, 1400],
    theory: '回馈制动的条件',
    formula: '|n| > |n₀| → |E| > |Uₐ|<br>Iₐ = (Uₐ − E) / Rₐ < 0 → T < 0',
    effect: '正转时 n > n₀；电机处于发电状态，将机械能转成电能回馈电网。',
    process: 'a → n₀ → b；负载由 T_L1 = +40 变为 T_L2 = −40 N·m。',
  },
  voltage: {
    mode: 'voltage',
    title: '回馈制动 · 降低电枢电压调速',
    description:
      '电压从 Uₐ₁ 降为 Uₐ₂，转速来不及改变；工作点先同速跳到第二象限，再减速。',
    action: '降压至 170 V',
    range: [-110, 80, 650, 1250],
    theory: '先回馈，再进入新的电动稳态',
    formula: 'Uₐ₂ < E → Iₐ < 0 → T < 0<br>n₀₂ = Uₐ₂ / (CᴇΦ) < n₀₁',
    effect: 'Φ、Rₐ 不变，两条特性平行；b → c 为回馈制动，c → d 为电动减速。',
    process: 'a → b：n 不突变；b → c：回馈；c → d：T < T_L，继续减速。',
  },
  field: {
    mode: 'field',
    title: '回馈制动 · 增加励磁电流调速',
    description:
      '从弱磁提高到额定励磁，磁通增大使 E 升高，电机短时回馈并减速。',
    action: '增磁至额定值',
    range: [-80, 90, 850, 1450],
    theory: '磁通增大，截距与斜率都减小',
    formula: 'Φ₂ > Φ₁ → E = CᴇΦn ↑<br>n₀₂ < n₀₁；γ ∝ 1 / Φ² ↓',
    effect: '图示 Φ₁ = 0.8ΦN → Φ₂ = ΦN；忽略励磁暂态，快速增磁按同速切换示意。',
    process: 'a → b → c → d；b → c 为回馈制动，c → d 恢复电动并继续减速。',
  },
  lowering: {
    mode: 'lowering',
    title: '回馈制动 · 下放重物的电路切换',
    description:
      '反接电枢电压并串入电阻，励磁不变；重物先停止提升，再反向启动，最后回馈下放。',
    action: '反接电压并串阻',
    theory: '先限流，再越过反向空载转速',
    formula:
      'a → b：n、E 不突变；Uₐ 反向<br>b → c：反接制动；c → d：反向启动<br>d → e：|E| > |Uₐ| → 回馈制动',
    effect:
      '反接瞬间 E 仍保持原极性，必须串 Rb 限制 Iₐmax；不能把全过程都叫回馈制动。',
    process: '提升方向为正；重力的实际方向始终向下，动力学写为 JΩ̇ = T − T_L。',
  },
  'lowering-process': {
    mode: 'lowering',
    title: '回馈制动 · 下放重物的 a→b→c→d→e',
    description:
      '沿同一条反向机械特性，区分第二、第三、第四象限的能量转换与转矩方向。',
    action: '播放完整过程',
    theory: '工作点的三段运行',
    formula:
      'b → c：n > 0，T < 0，反接制动<br>c → d：n < 0，T < 0，反向电动<br>d → e：n < 0，T > 0，回馈制动',
    effect: 'd 点 n = −n₀，Iₐ = T = 0；e 点 T = T_L，重物匀速下放。',
    process: 'a→b 为同速跳变；c 点 n = 0；d 点 E = Uₐ；e 点为稳定平衡。',
  },
  'lowering-resistance': {
    mode: 'lowering',
    title: '回馈制动 · 下放速度与电阻选择',
    description:
      '先按稳定 e 点的转矩平衡选择电阻；Rb 增大，特性变陡，稳定下放速度的大小增大。',
    action: '播放下放过程',
    theory: 'Rb 的选择 · 各量取绝对值',
    formula: '',
    effect: 'Eₑ、Iₐₑ 取稳定 e 点；T₀ 为空载阻力矩。动画取 T₀ = 0。',
    process: 'Rₐ + Rb 越大 → |斜率| 越大 → 稳态 |n_L| 越大。',
  },
  'lowering-check': {
    mode: 'lowering',
    title: '回馈制动 · 制动瞬间的电流校验',
    description:
      '稳态电阻选好后，还要校验 a→b 的瞬间电流；此时电源电压与原有电动势共同驱动反向电流。',
    action: '观察反接瞬间',
    theory: '限流校验 · 各量取绝对值',
    formula: '',
    effect:
      'Eᵦ 必须取电压反接后瞬间 b 点的 E；此时转速尚未变化，不能使用稳定 e 点。',
    process:
      'Rb 小：b′ 点电流更大、e′ 点下放更慢；Rb 大：b 点电流更小、e 点下放更快。',
  },
  comparison: {
    title: '电压反向反接制动与反向回馈制动',
    description:
      '同样保持励磁方向，关键看转速、转矩以及电源功率的符号；两种制动都满足 T 与 n 反向。',
  },
};
const requested = new URLSearchParams(location.search).get('mode');
const page = Object.hasOwn(pages, requested) ? requested : 'downhill';
const copy = pages[page];
const isComparison = page === 'comparison';
const isLowering = copy.mode === 'lowering';
const el = (id) => document.getElementById(id);
const format = (value, digits = 1) =>
  (Math.abs(value) < 0.05 ? 0 : value).toFixed(digits);
const fraction = (top, bottom) =>
  `<span class="fraction"><span>${top}</span><span>${bottom}</span></span>`;
const mathCopy = (text) =>
  text
    .replace(/T_L([12]?)/g, 'T<sub>L$1</sub>')
    .replaceAll('n_L', 'n<sub>L</sub>');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.title = copy.title;

const header = `<header class="page-head">
  <div class="eyebrow">直流拖动 / 8.4 · 回馈制动（自学）· ${isComparison ? '运行状态比较' : isLowering ? '位能性负载' : '从电动到发电'}</div>
  <h1 id="page-title">${copy.title}</h1><p>${copy.description}</p>
  <span class="scope-tag">他励直流电机 · 箭头表示实际方向<small>教学参数：UₐN = 220 V · Rₐ = 1 Ω · T₀ = 0</small></span>
</header>`;

let rb = 7;
let config = scenario(copy.mode ?? 'lowering', rb);
let running = false;
let paused = false;
let progress = 0;
let angle = 0;
let flowOffset = 0;
let previousTime;
let exactSpeed = null;

if (isComparison) {
  const lower = scenario('lowering', rb);
  const states = [
    operatingPoint(lower.initial, lower, true),
    operatingPoint(lower.initial, lower),
    operatingPoint(lower.equilibrium, lower),
  ];
  const titles = ['a · 正向电动', 'b · 电压反向反接制动', 'e · 反向回馈制动'];
  const descriptions = [
    'n > 0，E > 0，Iₐ > 0，T > 0<br>T 与 n 同向，电源供电。',
    'n > 0，E > 0，Iₐ < 0，T < 0<br>T 与 n 反向，电源仍供电。',
    'n < 0，E < 0，Iₐ > 0，T > 0<br>T 与 n 反向，向电源回馈。',
  ];
  document.querySelector('main').innerHTML = `${header}
    <section class="braking-controls" aria-label="比较动画控制"><button id="pause" aria-pressed="false">播放方向动画</button><span>先看电源极性，再看 E 极性，最后判断 Iₐ、T 与能量方向。</span></section>
    <section class="comparison-layout">${titles.map((title, i) => `<article class="braking-panel"><h2>${title}</h2><div id="compare-${i}">${circuitDiagram(`compare-${i}`)}</div><p>${descriptions[i]}</p></article>`).join('')}</section>
    <section class="braking-notes comparison-notes">
      <article><h2>电动 · Pₐ = UₐIₐ > 0</h2><p>电源 → 电机 → 机械负载</p><p class="formula">Pᴇ = EIₐ = TΩ > 0</p><p class="minor">电磁转矩起驱动作用。</p></article>
      <article><h2>反接 · Pₐ > 0，Pᴇ < 0</h2><p>机械能 ＋ 电源电能 → 电阻热</p><p class="formula">Iₐ = ${fraction('−|Uₐ| − |E|', 'Rₐ + Rb')} < 0</p><p class="minor">此时 n 仍为正；电源继续输出能量。</p></article>
      <article class="energy-note"><h2>回馈 · Pₐ < 0，Pᴇ < 0</h2><p>重力势能 → 电能回馈 ＋ 电阻热</p><p class="formula">Iₐ = ${fraction('|E| − |Uₐ|', 'Rₐ + Rb')} > 0</p><p class="minor">电源已反接：Uₐ < 0；|E| > |Uₐ|。</p></article>
    </section>`;
  paused = true;
  const angles = [0, 0, 0];
  const offsets = [0, 0, 0];
  const draw = (dt = 0) =>
    states.forEach((state, i) => {
      angles[i] += reduceMotion ? 0 : state.speed * dt * 0.12;
      offsets[i] -= reduceMotion ? 0 : Math.sign(state.current) * 40 * dt;
      updateCircuit(el(`compare-${i}`), `compare-${i}`, state, {
        rb: i ? rb : 0,
        angle: angles[i],
        offset: offsets[i],
      });
    });
  el('pause').addEventListener('click', () => {
    paused = !paused;
    el('pause').textContent = paused ? '播放方向动画' : '暂停方向动画';
    el('pause').setAttribute('aria-pressed', String(!paused));
  });
  draw();
  const tick = (time) => {
    const dt =
      previousTime === undefined
        ? 0
        : Math.min(0.05, (time - previousTime) / 1000);
    previousTime = time;
    if (!paused && !document.hidden) draw(dt);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} else {
  document.querySelector('main').innerHTML = `${header}
    <section class="braking-controls" aria-label="回馈制动动画控制">
      <button id="motor" aria-pressed="true">电动状态 a</button>
      <button id="brake" aria-pressed="false">${copy.action}</button>
      <button id="pause" aria-pressed="false">暂停</button><button id="replay">重播 ↺</button>
      <label class="progress-control" for="progress">过程<input id="progress" type="range" min="0" max="1000" step="1" value="0" aria-valuetext="电动状态" /></label>
      ${isLowering ? '<label class="resistance-control" for="rb"><span>电阻 Rb</span><input id="rb" type="range" min="5" max="9" step="0.1" value="7" /><output id="rb-value" for="rb">7.0 Ω</output></label>' : '<span class="control-note">可拖动过程，或点选工作点停帧</span>'}
    </section>
    <section class="braking-layout">
      <article class="braking-panel"><div class="panel-heading"><h2>等效电路</h2><span id="circuit-state"></span></div>
        <div id="circuit">${circuitDiagram('main')}</div><p id="circuit-caption" class="circuit-caption"></p>
      </article>
      <article class="braking-panel"><div class="panel-heading"><h2>机械特性与工作点</h2><span>T / N·m　n / (r/min)</span></div>
        <svg id="plot" viewBox="0 0 850 320" role="img" aria-label="电动特性与回馈制动工作点；橙色为运行轨迹，点选下方工作点可停帧"></svg>
        <div class="readings"><span>转速 n<b id="speed-value"></b></span><span>电动势 E<b id="emf-value"></b></span><span>电流 Iₐ<b id="current-value"></b></span><span>电磁转矩 T<b id="torque-value"></b></span></div>
      </article>
    </section>
    <section class="braking-notes">
      <article><h2 id="phase-title" aria-live="polite"></h2><p id="phase-description"></p><div id="stages" class="stage-row"></div><p class="minor">${mathCopy(copy.process)}</p></article>
      <article><h2>${copy.theory}</h2><p id="formula" class="formula"></p><p id="effect" class="minor"></p></article>
      <article class="energy-note"><h2 id="energy-title"></h2><p id="energy-description"></p><div class="power-strip"><span>回馈电源功率</span><strong id="returned-power"></strong></div><p class="minor">Pₐ = UₐIₐ；Pₐ < 0 表示回馈。电源须能接收能量。</p></article>
    </section>`;

  const [xMin, xMax, yMin, yMax] = copy.range ?? [-160, 100, -2500, 1400];
  const x = (t) => 62 + ((t - xMin) / (xMax - xMin)) * 732;
  const y = (n) => 22 + ((yMax - n) / (yMax - yMin)) * 246;
  const point = (t, n) => `${x(t)},${y(n)}`;
  const path = (voltage, resistance, flux = 1) =>
    `M${point(xMin, voltage / (p.ce * flux) - (resistance * xMin) / (p.ce * p.ct * flux ** 2))}L${point(xMax, voltage / (p.ce * flux) - (resistance * xMax) / (p.ce * p.ct * flux ** 2))}`;
  const axisY = isLowering ? y(0) : 280;
  let points;
  let currentState;

  function buildPlot() {
    const b = operatingPoint(config.initial, config);
    points = isLowering
      ? {
          a: [p.load, config.initial],
          b: [b.torque, config.initial],
          c: [operatingPoint(0, config).torque, 0],
          d: [0, config.noLoad],
          e: [config.load, config.equilibrium],
        }
      : copy.mode === 'downhill'
        ? {
            a: [p.load, config.initial],
            c: [0, config.noLoad],
            b: [config.load, config.equilibrium],
          }
        : {
            a: [p.load, config.initial],
            b: [b.torque, config.initial],
            c: [0, config.noLoad],
            d: [config.load, config.equilibrium],
          };
    const tTicks = isLowering ? [-100, -50, 0, 40, 80] : [-50, 0, 40];
    const nTicks = isLowering
      ? [-2000, -1100, 0, 1000]
      : copy.mode === 'downhill'
        ? [900, 1100, 1300]
        : copy.mode === 'field'
          ? [900, 1100, 1300]
          : [700, 850, 1000, 1150];
    el('plot').innerHTML =
      `<defs><clipPath id="plot-clip"><rect x="62" y="22" width="732" height="246"/></clipPath><marker id="axis-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#47635f"/></marker></defs>
      ${tTicks.map((t) => `<path d="M${x(t)} 22V268" stroke="#edf1eb"/><text x="${x(t) - 9}" y="315" class="small">${t}</text>`).join('')}
      ${nTicks.map((n) => `<path d="M62 ${y(n)}H794" stroke="#edf1eb"/><text x="4" y="${y(n) + 5}" class="small">${n}</text>`).join('')}
      <path d="M62 ${axisY}H818M${x(0)} 280V10" stroke="#47635f" stroke-width="2" fill="none" marker-end="url(#axis-head)"/>
      <text x="824" y="${axisY + 5}" class="math">T</text><text x="${x(0) + 10}" y="20" class="math">n</text>
      ${isLowering ? `<text x="${x(0) - 24}" y="${axisY + 23}" class="math">O</text>` : '<text x="66" y="292" class="small">纵轴截断 · 非零起点</text>'}
      <g clip-path="url(#plot-clip)">
        <path d="${path(p.ua, p.ra, config.oldFlux)}" class="curve motor" opacity="0.5"/>
        ${isLowering ? [5, 9].map((r) => `<path d="${path(-p.ua, p.ra + r)}" class="curve reference"/>`).join('') : ''}
        <path d="${path(config.voltage, config.resistance)}" class="curve brake"/>
        <path d="M${x(p.load)} 22V268${copy.mode === 'downhill' ? `M${x(-p.load)} 22V268` : ''}" stroke="#7d89ae" stroke-width="1.5"/>
        ${isLowering ? `<path d="M${point(...points.b)}L${point(...points.c)}" stroke="#ac4c54" stroke-width="4"/><path d="M${point(...points.c)}L${point(...points.d)}" stroke="#bc742a" stroke-width="4"/>` : ''}
        <path d="M${point(...points.a)}L${point(...(points.b ?? points.a))}" class="guide"/>
        <path id="trace" class="trace"/>
      </g>
      <text x="${x(p.load) + 9}" y="${isLowering ? 252 : 270}" class="small">T<tspan baseline-shift="sub" font-size="12">L${copy.mode === 'downhill' ? '1' : ''}</tspan></text>
      ${copy.mode === 'downhill' ? `<text x="${x(-p.load) + 9}" y="270" class="small">T<tspan baseline-shift="sub" font-size="12">L2</tspan></text>` : ''}
      <text x="75" y="18" class="small">${copy.mode === 'downhill' ? '固有特性 1 · 电动／回馈共线' : '玫红：原电动特性 1'}</text><text x="526" y="18" class="small">${copy.mode === 'downhill' ? '负载反向，特性不变' : `绿色：${isLowering ? '反向特性 2' : '切换后的特性 2'}`}</text>
      <text x="${x(0) + 10}" y="${y(config.noLoad) + (isLowering ? -14 : -10)}" class="small">${isLowering ? '−n₀' : copy.mode === 'downhill' ? 'n₀' : 'n₀₂'}</text>
      ${!isLowering && copy.mode !== 'downhill' ? `<text x="${x(0) + 10}" y="${y(p.ua / (p.ce * config.oldFlux)) - 10}" class="small motor-color">n₀₁</text>` : ''}
      ${Object.entries(points)
        .map(
          ([label, coords]) =>
            `<g transform="translate(${point(...coords).replace(',', ' ')})"><circle r="5" fill="#fff9db" stroke="#39796f" stroke-width="2"/><text x="${label === 'd' && isLowering ? -21 : 9}" y="${label === 'a' ? -12 : 20}" class="math">${label}</text></g>`,
        )
        .join('')}
      <g id="live-point"><circle r="12" fill="#bc742a" opacity="0.18"/><circle r="6" fill="#bc742a" stroke="white" stroke-width="2"/></g>`;
    const labels = isLowering
      ? { a: 'a 提升', b: 'b 反接', c: 'c 零速', d: 'd 空载', e: 'e 稳态' }
      : copy.mode === 'downhill'
        ? { a: 'a 电动', c: 'n₀ 边界', b: 'b 稳态' }
        : { a: 'a 电动', b: 'b 切换', c: 'c 边界', d: 'd 稳态' };
    el('stages').innerHTML = Object.entries(labels)
      .map(
        ([key, label]) =>
          `<button data-stage="${key}" aria-pressed="false">${label}</button>`,
      )
      .join('');
    el('stages')
      .querySelectorAll('button')
      .forEach((button) =>
        button.addEventListener('click', () => {
          const key = button.dataset.stage;
          running = key !== 'a';
          paused = true;
          exactSpeed = points[key][1];
          progress =
            key === 'a' || (key === 'b' && copy.mode !== 'downhill')
              ? 0
              : Math.min(1, timeAt(exactSpeed, config) / (8 * config.tau));
          render();
        }),
      );
  }

  function render() {
    const before = !running;
    const speed = before
      ? config.initial
      : (exactSpeed ??
        (progress >= 1
          ? config.equilibrium
          : speedAt(progress * 8 * config.tau, config)));
    const state = operatingPoint(speed, config, before);
    currentState = state;
    const kind = phase(speed, config, before);
    const steady = running && Math.abs(speed - config.equilibrium) < 0.05;
    const names = {
      motor: '电动运行',
      'no-load': '空载边界 · Iₐ = T = 0',
      regeneration: '回馈制动',
      plugging: '电压反向反接制动',
      zero: '零速 · 随即反向启动',
    };
    el('circuit-state').textContent = names[kind];
    updateCircuit(el('circuit'), 'main', state, {
      rb: before ? 0 : isLowering ? rb : 0,
      load: before ? p.load : config.load,
      angle,
      offset: flowOffset,
    });
    el('circuit-caption').textContent = before
      ? `原电动状态：Uₐ = E + IₐRₐ；${copy.mode === 'field' ? 'Φ₁ = 0.8ΦN。' : '励磁方向保持。'}`
      : isLowering
        ? 'Uₐ = −220 V；Iₐ = (Uₐ − E)/(Rₐ + Rb)。正号按原提升方向定义。'
        : copy.mode === 'field'
          ? 'Φ₂ = ΦN；E = CᴇΦ₂n。电源和励磁极性均未反接。'
          : `Uₐ = ${config.voltage} V；Iₐ = (Uₐ − E)/Rₐ。电源极性不变。`;
    el('live-point').setAttribute(
      'transform',
      `translate(${point(state.torque, speed).replace(',', ' ')})`,
    );
    el('trace').setAttribute(
      'd',
      before
        ? ''
        : `M${point(...points.a)}${copy.mode === 'downhill' ? '' : `L${point(...points.b)}`}L${point(state.torque, speed)}`,
    );
    for (const [id, value, unit] of [
      ['speed', speed, 'r/min'],
      ['emf', state.emf, 'V'],
      ['current', state.current, 'A'],
      ['torque', state.torque, 'N·m'],
    ])
      el(`${id}-value`).textContent = `${format(value)} ${unit}`;
    let heading = 'a · 正向电动运行';
    let description =
      copy.mode === 'downhill'
        ? '平地或上坡，T = T_L1 > 0。下坡后重力成为驱动力。'
        : 'n、E、Iₐ、T 为正；先建立原有稳定工作点。';
    if (running) {
      heading = steady
        ? `${isLowering ? 'e' : copy.mode === 'downhill' ? 'b' : 'd'} · 稳定运行`
        : names[kind];
      description = isLowering
        ? kind === 'plugging'
          ? 'b → c：n > 0，Iₐ、T < 0；电磁转矩与重力共同使提升速度下降。'
          : kind === 'zero'
            ? 'c 点：n = E = 0，Iₐ、T 仍为负；继续接通，进入反向启动。'
            : kind === 'no-load'
              ? 'd 点：n = −n₀，E = Uₐ < 0；Iₐ = T = 0，重力继续加速下放。'
              : kind === 'regeneration'
                ? 'd → e：n < 0，Iₐ、T > 0；T 抵抗下放，最终 T = T_L。'
                : 'c → d：n、E、Iₐ、T 均为负；电磁转矩与转速同向，反向电动。'
        : copy.mode === 'downhill'
          ? kind === 'regeneration'
            ? 'n > n₀，E > Uₐ，Iₐ、T < 0；最终在 b 点 T = T_L2 < 0。'
            : kind === 'no-load'
              ? 'n = n₀，E = Uₐ，Iₐ = T = 0；重力继续驱动，越过边界。'
              : '下坡负载转矩反向，T − T_L2 > 0；n、E 上升，Iₐ、T 逐渐减小。'
          : kind === 'regeneration'
            ? 'b → c：E > Uₐ，Iₐ、T < 0；电机发电回馈，转速下降。'
            : kind === 'no-load'
              ? 'c 点：E = Uₐ，Iₐ = T = 0；负载仍使转速继续下降。'
              : 'c → d：恢复电动，0 < T < T_L 仍减速；最终 T = T_L，达到新稳态。';
    }
    if (el('phase-title').textContent !== heading)
      el('phase-title').textContent = heading;
    el('phase-description').innerHTML = mathCopy(description);
    const total = p.ra + rb;
    const formula =
      page === 'lowering-resistance'
        ? `Rₐ + Rb = ${fraction('|Eₑ| − |Uₐ|', 'Iₐₑ')} = ${fraction('CᴛΦ(CᴇΦ|n_L| − |Uₐ|)', 'T_L − T₀')}<br>Rb = ${format(loweringResistance(Math.abs(config.equilibrium)), 2)} Ω → |n_L| = ${format(-config.equilibrium, 0)} r/min`
        : page === 'lowering-check'
          ? `Rₐ + Rb ≥ ${fraction('|Uₐ| + |Eᵦ|', 'Iₐmax')}<br>Rb ≥ ${format(minimumResistance(p.ce * config.initial), 2)} Ω；|Iₐᵦ| = ${format((p.ua + p.ce * config.initial) / total)} A`
          : copy.formula;
    el('formula').innerHTML = mathCopy(formula);
    const effect =
      page === 'lowering-check'
        ? `${copy.effect} 本例 Iₐmax = 75 A，当前电阻${rb >= minimumResistance(p.ce * config.initial) ? '通过' : '未通过'}校验。`
        : copy.effect;
    el('effect').innerHTML = mathCopy(effect);
    el('energy-title').textContent =
      kind === 'regeneration'
        ? '机械能 → 电能回馈＋热'
        : kind === 'plugging'
          ? '机械能＋电源电能 → 热'
          : kind === 'no-load' || kind === 'zero'
            ? '瞬时电磁功率为零'
            : '电源电能 → 机械能＋热';
    el('energy-description').textContent =
      kind === 'regeneration'
        ? `T 与 n 反向；Pₐ = ${format(state.sourcePower, 0)} W < 0，电源吸收电能。`
        : kind === 'plugging'
          ? '电源仍在供电，转子也释放动能，能量耗在 Rₐ 与 Rb。'
          : kind === 'no-load'
            ? 'Iₐ = T = 0；跨过这一点后，电流与转矩改变方向。'
            : kind === 'zero'
              ? '转速为零但电流不为零；此刻电源电能全部变成电阻热。'
              : 'T 与 n 同向，电磁转矩驱动旋转；部分电能转成电阻热。';
    el('returned-power').textContent = `${format(state.returnedPower, 0)} W`;
    el('motor').setAttribute('aria-pressed', String(before));
    el('brake').setAttribute('aria-pressed', String(running));
    el('pause').textContent = paused ? '继续' : '暂停';
    el('pause').setAttribute('aria-pressed', String(paused));
    el('progress').value = String(Math.round(progress * 1000));
    el('progress').setAttribute(
      'aria-valuetext',
      `${heading}，${Math.round(progress * 100)}%`,
    );
    el('stages')
      .querySelectorAll('button')
      .forEach((button) => {
        const key = button.dataset.stage;
        const selected =
          key === 'a'
            ? before
            : running && Math.abs(speed - points[key][1]) < 0.05;
        button.setAttribute('aria-pressed', String(selected));
      });
  }

  function reset(shouldRun) {
    running = shouldRun;
    paused = false;
    progress = 0;
    exactSpeed = null;
    render();
  }
  el('motor').addEventListener('click', () => reset(false));
  el('brake').addEventListener('click', () => reset(true));
  el('replay').addEventListener('click', () => reset(true));
  el('pause').addEventListener('click', () => {
    paused = !paused;
    if (!paused) exactSpeed = null;
    render();
  });
  el('progress').addEventListener('input', (event) => {
    running = true;
    paused = true;
    exactSpeed = null;
    progress = Number(event.target.value) / 1000;
    render();
  });
  el('rb')?.addEventListener('input', (event) => {
    rb = Number(event.target.value);
    config = scenario(copy.mode, rb);
    el('rb-value').textContent = `${format(rb)} Ω`;
    el('rb').setAttribute('aria-valuetext', `${format(rb)} 欧姆`);
    buildPlot();
    reset(running);
  });
  buildPlot();
  reset(false);
  const tick = (time) => {
    const dt =
      previousTime === undefined
        ? 0
        : Math.min(0.05, (time - previousTime) / 1000);
    previousTime = time;
    if (!paused && !document.hidden) {
      if (running) progress = Math.min(1, progress + dt / 18);
      if (!reduceMotion) {
        angle += currentState.speed * dt * 0.12;
        flowOffset -=
          Math.sign(currentState.current) *
          Math.min(65, Math.abs(currentState.current) * 2) *
          dt;
      }
      render();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Imported after all controls exist, so native control keys/touches stay local.
await import('./dc-generator-emf-controls.js');
