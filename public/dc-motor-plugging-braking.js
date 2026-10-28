import {
  parameters as p,
  initialSpeed,
  operatingPoint,
  equilibriumSpeed,
  zeroTime,
  speedAt,
  minimumStopResistance,
  loweringResistance,
} from './dc-motor-plugging-braking-model.mjs';

const requested = new URLSearchParams(location.search).get('mode');
const page = [
  'stop',
  'stop-resistance',
  'lowering',
  'lowering-resistance',
].includes(requested)
  ? requested
  : 'stop';
const isLowering = page.startsWith('lowering');
const isResistance = page.endsWith('resistance');
const mode = isLowering ? 'lowering' : 'stop';
const limits = isLowering ? [12, 20] : [5, 9];
const title = `反接制动 · ${isLowering ? '下放重物' : '迅速停机'}${isResistance ? '：制动效果与电阻选择' : ''}`;
const fraction = (top, bottom) =>
  `<span class="fraction"><span>${top}</span><span>${bottom}</span></span>`;
document.title = title;
document.querySelector('main').innerHTML = `
  <header class="page-head">
    <div class="eyebrow">直流拖动 / 8.4 · 反接制动 · ${isLowering ? '位能性负载' : '反抗性负载'}</div>
    <h1 id="page-title">${title}</h1>
    <p>${isLowering ? '电源极性不变，串入较大电阻；重物先停止提升，再由重力带动反向下放。' : '电枢电压反接，励磁保持；电流与转矩反向，减速到零时立即切断电枢电源。'}</p>
    <span class="scope-tag">他励 · Φ 恒定 · 忽略电枢电感<small>Uₐ = 220 V · Rₐ = 1 Ω · CᴇΦ = 0.2 V/(r/min)</small></span>
  </header>
  <section class="braking-controls" aria-label="反接制动动画控制">
    <button id="motor" type="button" aria-pressed="true">电动状态</button>
    <button id="brake" type="button" aria-pressed="false">${isLowering ? '串阻并下放' : '反接电压并制动'}</button>
    <button id="pause" type="button" aria-pressed="false">暂停</button>
    <button id="replay" type="button">重播 ↺</button>
    ${isLowering ? '' : '<label class="cut-control"><input id="auto-cut" type="checkbox" checked />零速自动断电</label>'}
    <label class="resistance-control" for="rb"><span>电阻 R<sub>b</sub></span>
      <input id="rb" type="range" min="${limits[0]}" max="${limits[1]}" step="0.1" value="${isLowering ? 16 : 7}" />
      <output id="rb-value" for="rb"></output>
    </label>
  </section>
  <section class="braking-layout">
    <article class="braking-panel">
      <div class="panel-heading"><h2>等效电路</h2><span id="circuit-state"></span></div>
      <svg id="circuit" viewBox="0 0 440 290" role="img" aria-label="电源、电枢电阻与串联制动电阻，右侧独立励磁始终接通">
        <defs>${[
          ['current', '#bc742a'],
          ['speed', '#39796f'],
          ['torque', '#ac4c54'],
          ['load', '#7d89ae'],
        ]
          .map(
            ([id, color]) =>
              `<marker id="${id}-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="${color}"/></marker>`,
          )
          .join('')}</defs>
        <path d="M60 119V52H142M176 52H234V119M234 191V246H60V181" class="wire"/>
        <path id="flow" d="M60 119V52H234V246H60V181" class="current-flow"/>
        <rect x="142" y="43" width="34" height="18" fill="white" stroke="#47635f" stroke-width="2.5"/>
        <text x="143" y="30" class="math">Rₐ</text>
        <circle cx="60" cy="150" r="31" fill="#eff3f8" stroke="#47635f" stroke-width="3"/>
        <text id="source-top" x="53" y="143">+</text><text id="source-bottom" x="54" y="170">−</text>
        <text x="6" y="157" class="math">Uₐ</text>
        <g id="resistor-symbol"><rect x="137" y="236" width="49" height="20" fill="#fcf3e5" stroke="#bc742a" stroke-width="3"/>
          <text x="145" y="282" class="math">R<tspan baseline-shift="sub" font-size="16">b</tspan></text>
          <path id="heat" d="M143 230q-9-10 0-20M161 230q-9-10 0-20M179 230q-9-10 0-20" fill="none" stroke="#bc742a" stroke-width="2"/>
        </g>
        <path d="M84 246H119" stroke="#fff" stroke-width="8"/><path id="switch" d="M84 246H119" class="wire"/>
        <circle cx="84" cy="246" r="3" fill="#47635f"/><circle cx="119" cy="246" r="3" fill="#47635f"/>
        <circle cx="234" cy="155" r="36" fill="#f5f8f3" stroke="#47635f" stroke-width="3"/>
        <g id="rotor" stroke="#39796f" stroke-width="3"><circle cx="234" cy="155" r="28" fill="none"/><path d="M234 127V183M206 155H262"/><circle cx="234" cy="127" r="5" fill="#bc742a" stroke="#fff" stroke-width="1.5"/></g>
        <circle cx="234" cy="155" r="17" fill="#fff"/><text x="221" y="165">M</text>
        <text id="emf-top" x="184" y="146" class="motor-color">+</text><text id="emf-bottom" x="184" y="180" class="motor-color">−</text>
        <text x="155" y="163" class="math motor-color">E</text>
        <path id="current-arrow" d="M102 77H165" stroke="#bc742a" stroke-width="3" marker-end="url(#current-head)"/><text x="112" y="103" class="math" style="fill:#bc742a">Iₐ</text>
        <path id="speed-arrow" d="M279 200A65 65 0 0 1 194 207" fill="none" stroke="#39796f" stroke-width="3"/><text x="276" y="228" class="math brake-color">n</text>
        <path id="torque-arrow" d="M194 106A65 65 0 0 1 280 112" fill="none" stroke="#ac4c54" stroke-width="3"/><text x="281" y="100" class="math motor-color">T</text>
        <path id="load-arrow" d="M292 96A83 83 0 0 0 177 95" fill="none" stroke="#7d89ae" stroke-width="3"/><text x="280" y="68" class="math" style="fill:#7d89ae">T<tspan baseline-shift="sub" font-size="16">L</tspan></text>
        <path d="M401 52H340V97q-22 0 0 19q-22 0 0 19q-22 0 0 19q-22 0 0 19q-22 0 0 19V246H401" class="wire"/>
        <circle cx="401" cy="52" r="4" fill="white" stroke="#47635f" stroke-width="2"/><circle cx="401" cy="246" r="4" fill="white" stroke="#47635f" stroke-width="2"/>
        <text x="389" y="82">+</text><text x="389" y="234">−</text><text x="369" y="158" class="math brake-color">U<tspan baseline-shift="sub" font-size="16">f</tspan></text>
        <text x="294" y="278" class="small" style="font-size:14px">励磁保持 · Φ 恒定</text>
      </svg>
      <p id="circuit-caption" class="circuit-caption"></p>
    </article>
    <article class="braking-panel">
      <div class="panel-heading"><h2>机械特性与工作点</h2><span>横轴 T / N·m　纵轴 n / (r/min)</span></div>
      <svg id="plot" viewBox="0 0 850 320" role="img" aria-label="电动特性1与反接制动特性2，a到b同速切换，c为零速点，d为未断电反转或稳定下放点"></svg>
      <div class="readings" aria-label="实时运行数据"><span>转速 n<b id="speed-value"></b></span><span>感生电动势 E<b id="emf-value"></b></span><span>电枢电流 Iₐ<b id="current-value"></b></span><span>电磁转矩 T<b id="torque-value"></b></span></div>
    </article>
  </section>
  <section class="braking-notes" aria-label="制动过程、效果与电阻选择">
    <article><h2 id="phase-title" aria-live="polite"></h2><p id="phase-description"></p><p id="process-note" class="minor"></p></article>
    <article><h2>${isResistance ? '制动效果与 Rb 的选择' : '电路切换 → 机械特性切换'}</h2><p id="formula" class="formula"></p><p id="effect" class="minor"></p></article>
    <article class="energy-note"><svg id="scene" viewBox="0 0 104 120" role="img" aria-label="${isLowering ? '卷筒旋转与重物先提升后下放' : '电机转子减速与反向启动示意'}"></svg><div><h2 id="energy-title"></h2><p id="energy-description"></p></div></article>
  </section>`;
await import('./dc-generator-emf-controls.js');

const el = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const xMin = isLowering ? -12 : -150;
const xMax = isLowering ? 90 : 100;
const yMin = -1300;
const yMax = 1400;
const x = (t) => 58 + ((t - xMin) / (xMax - xMin)) * 742;
const y = (n) => 18 + ((yMax - n) / (yMax - yMin)) * 261;
const point = (t, n) => `${x(t)},${y(n)}`;
const line = (intercept, slope) =>
  `M${point(xMin, intercept - slope * xMin)}L${point(xMax, intercept - slope * xMax)}`;
const intercept = ((isLowering ? 1 : -1) * p.ua) / p.ce;
const slopeFor = (r) => (p.ra + r) / (p.ce * p.ct);
const dot = (id, label) =>
  `<g id="point-${id}"><circle r="5" fill="#fff9db" stroke="#39796f" stroke-width="2"/><text x="10" y="-10" class="math">${label}</text></g>`;
el('plot').innerHTML = `
  <defs><clipPath id="chart-clip"><rect x="58" y="18" width="742" height="261"/></clipPath><marker id="axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#47635f"/></marker></defs>
  ${(isLowering ? [0, 20, 40, 60, 80] : [-100, -50, 0, 50]).map((t) => `<path d="M${x(t)} 18V279" stroke="#edf1eb"/><text x="${x(t) - 10}" y="305" class="small">${t}</text>`).join('')}
  ${[-1000, -500, 0, 500, 1000].map((n) => `<path d="M58 ${y(n)}H800" stroke="#edf1eb"/><text x="5" y="${y(n) + 5}" class="small">${n}</text>`).join('')}
  <path d="M58 ${y(0)}H822M${x(0)} 284V8" stroke="#47635f" stroke-width="2" fill="none" marker-end="url(#axis-arrow)"/><text x="826" y="${y(0) - 10}" class="math">T</text><text x="${x(0) + 10}" y="22" class="math">n</text><text x="${x(0) - 24}" y="${y(0) + 22}" class="math">O</text>
  <g clip-path="url(#chart-clip)">
    <path d="${line(p.ua / p.ce, slopeFor(0))}" class="curve motor" opacity="0.25"/>
    ${limits.map((r) => `<path d="${line(intercept, slopeFor(r))}" class="curve reference"/>`).join('')}
    <path id="active-curve" class="curve motor"/><path id="brake-ghost" class="curve brake" opacity="0.2"/>
    <path d="M${x(p.load)} 18V${isLowering ? 279 : y(0)}" stroke="#7d89ae" stroke-width="2"/>
    ${isLowering ? '' : `<path d="M${x(-p.load)} ${y(0)}V279" stroke="#7d89ae" stroke-width="2" stroke-dasharray="5 5"/>`}
    <path id="jump-guide" class="guide"/><path id="trace" class="trace"/>
  </g>
  <text x="${x(p.load) + 8}" y="${y(0) + 23}" class="small">T<tspan baseline-shift="sub" font-size="12">L</tspan> = 40</text>
  <text x="${isLowering ? 575 : 560}" y="34" class="motor-color">1 · 电动</text>
  <text x="${isLowering ? 535 : 60}" y="260" class="brake-color">2 · ${isLowering ? '+n₀ 截距' : '−n₀ 截距'}</text>
  <text id="reference-label" x="${isLowering ? 560 : 70}" y="${isLowering ? 105 : 235}" class="small">虚线：Rb = ${limits[0]} / ${limits[1]} Ω</text>
  ${dot('a', 'a')}${dot('b', 'b')}${dot('c', 'c')}${dot('d', 'd')}
  <g id="live-point"><circle r="11" fill="#bc742a" opacity="0.16"/><circle r="6" fill="#bc742a" stroke="white" stroke-width="2"/></g>`;
el('scene').innerHTML = isLowering
  ? '<path d="M8 9H96" class="wire"/><circle cx="47" cy="25" r="15" fill="white" stroke="#47635f" stroke-width="2"/><path id="scene-rotor" d="M32 25H62M47 10V40" class="wire"/><path id="rope" d="M62 25V70" stroke="#39796f" stroke-width="3" stroke-dasharray="4 4"/><g id="weight"><rect x="49" y="0" width="26" height="24" rx="3" fill="#e6bd72" stroke="#bc742a"/><text x="54" y="17" font-size="12" fill="#173b3b">mg</text></g><path id="weight-arrow" d="M87 90V65" stroke="#39796f" stroke-width="2" marker-end="url(#speed-head)"/>'
  : '<circle cx="50" cy="60" r="32" fill="white" stroke="#47635f" stroke-width="3"/><g id="scene-rotor" stroke="#39796f" stroke-width="4"><path d="M50 31V89M21 60H79"/><circle cx="50" cy="34" r="5" fill="#bc742a" stroke="#fff" stroke-width="1.5"/></g><circle cx="50" cy="60" r="8" fill="#bc742a"/>';

let rb = isLowering ? 16 : 7;
let braking = false;
let paused = false;
let elapsed = 0;
let speed = initialSpeed;
let angle = 0;
let travel = 0;
let flowOffset = 0;
let lastTimestamp;
let lastPhase = '';
const switchDuration = reduceMotion ? 0.01 : 0.8;
const hold = 0.8;
const format = (v, digits = 1) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(digits);
const autoCut = () => !isLowering && el('auto-cut').checked;
const place = (id, t, n) =>
  el(id).setAttribute(
    'transform',
    `translate(${point(t, n).replace(',', ' ')})`,
  );

function setPhase(key, heading, description) {
  if (key === lastPhase) return;
  lastPhase = key;
  el('phase-title').textContent = heading;
  el('phase-description').innerHTML = description.replaceAll(
    'T_L',
    'T<sub>L</sub>',
  );
}

function render() {
  const connected = braking && elapsed >= switchDuration;
  const physicalTime = Math.max(0, elapsed - switchDuration - hold);
  const crossing = zeroTime(rb, mode);
  const zeroHold =
    connected && physicalTime >= crossing && physicalTime < crossing + hold;
  const cut = connected && autoCut() && physicalTime >= crossing;
  const time =
    physicalTime < crossing
      ? physicalTime
      : Math.max(crossing, physicalTime - hold);
  speed = connected ? speedAt(time, rb, mode, autoCut()) : initialSpeed;
  if (zeroHold || cut) speed = 0;
  const dSpeed = equilibriumSpeed(rb, mode, !isLowering);
  if (connected && !zeroHold && !cut && Math.abs(speed - dSpeed) < 0.5)
    speed = dSpeed;
  const state = connected
    ? cut
      ? { current: 0, torque: 0, resistorHeat: 0 }
      : operatingPoint(speed, rb, mode)
    : { current: p.load / p.ct, torque: p.load, resistorHeat: 0 };
  const atB = operatingPoint(initialSpeed, rb, mode);
  const atC = operatingPoint(0, rb, mode);
  const isReverseMotor = connected && speed < 0 && !isLowering;

  el('resistor-symbol').setAttribute('opacity', connected ? 1 : 0);
  el('source-top').textContent = connected && !isLowering ? '−' : '+';
  el('source-bottom').textContent = connected && !isLowering ? '+' : '−';
  el('switch').setAttribute('d', cut ? 'M84 246 112 228' : 'M84 246H119');
  el('emf-top').textContent = speed < -0.05 ? '−' : '+';
  el('emf-bottom').textContent = speed < -0.05 ? '+' : '−';
  el('current-arrow').setAttribute(
    'd',
    state.current < 0 ? 'M165 77H102' : 'M102 77H165',
  );
  el('current-arrow').setAttribute(
    'opacity',
    Math.abs(state.current) < 0.05 ? 0 : 1,
  );
  el('flow').setAttribute('opacity', Math.min(1, Math.abs(state.current) / 12));
  el('flow').style.strokeDashoffset = flowOffset;
  el('heat').setAttribute('opacity', Math.min(1, state.resistorHeat / 300));
  el('rotor').setAttribute('transform', `rotate(${angle} 234 155)`);
  el('scene-rotor').setAttribute(
    'transform',
    `rotate(${isLowering ? -angle : angle} ${isLowering ? '47 25' : '50 60'})`,
  );
  for (const [id, value, marker] of [
    ['speed-arrow', speed, 'speed'],
    ['torque-arrow', state.torque, 'torque'],
  ]) {
    el(id).setAttribute(
      'marker-end',
      value > 0.05 ? `url(#${marker}-head)` : 'none',
    );
    el(id).setAttribute(
      'marker-start',
      value < -0.05 ? `url(#${marker}-head)` : 'none',
    );
    el(id).setAttribute('opacity', Math.abs(value) < 0.05 ? 0 : 1);
  }
  // Gravity keeps its direction; a passive load opposes either rotation.
  const reverseLoad = !isLowering && speed < 0;
  el('load-arrow').setAttribute(
    'marker-end',
    reverseLoad ? 'none' : 'url(#load-head)',
  );
  el('load-arrow').setAttribute(
    'marker-start',
    reverseLoad ? 'url(#load-head)' : 'none',
  );
  el('load-arrow').setAttribute('opacity', cut ? 0 : 1);
  el('circuit-state').textContent = cut
    ? '零速断电 · 电枢开路'
    : connected
      ? isReverseMotor
        ? '反向电动运行'
        : speed < 0
          ? '倒拉反接制动'
          : '已切换 · 正向减速'
      : `电动状态 · ${isLowering ? '正向提升' : '正向转动'}`;
  el('circuit-caption').textContent = cut
    ? 'c 点仍有制动电流；检测到零速立即断电，电流、转矩随即降为零。'
    : connected
      ? isLowering
        ? 'Iₐ = (Uₐ − E)/(Rₐ + Rb) > 0；反转后 E < 0，与电源共同供能。'
        : 'Iₐ = (−Uₐ − E)/(Rₐ + Rb) < 0；电源极性已反接，励磁不变。'
      : 'Uₐ = E + IₐRₐ；n、E、Iₐ、T 为正，电动机带动负载。';

  el('active-curve').setAttribute(
    'd',
    connected ? line(intercept, slopeFor(rb)) : line(p.ua / p.ce, slopeFor(0)),
  );
  el('active-curve').setAttribute(
    'class',
    `curve ${connected ? 'brake' : 'motor'}`,
  );
  el('brake-ghost').setAttribute('d', line(intercept, slopeFor(rb)));
  el('jump-guide').setAttribute(
    'd',
    `M${point(p.load, initialSpeed)}L${point(atB.torque, initialSpeed)}`,
  );
  place('point-a', p.load, initialSpeed);
  place('point-b', atB.torque, initialSpeed);
  place('point-c', atC.torque, 0);
  place('point-d', isLowering ? p.load : -p.load, dSpeed);
  el('point-d').setAttribute('opacity', !isLowering && autoCut() ? 0.3 : 1);
  place('live-point', state.torque, speed);
  const mix = Math.min(1, elapsed / switchDuration);
  const jumpTorque = p.load + (atB.torque - p.load) * mix;
  if (braking && !connected) place('live-point', jumpTorque, initialSpeed);
  el('trace').setAttribute(
    'd',
    !braking
      ? ''
      : !connected
        ? `M${point(p.load, initialSpeed)}L${point(jumpTorque, initialSpeed)}`
        : `M${point(p.load, initialSpeed)}L${point(atB.torque, initialSpeed)}L${point(cut ? atC.torque : state.torque, speed)}${cut ? `L${point(0, 0)}` : ''}`,
  );
  for (const [id, value, unit] of [
    ['speed-value', speed, 'r/min'],
    ['emf-value', p.ce * speed, 'V'],
    ['current-value', state.current, 'A'],
    ['torque-value', state.torque, 'N·m'],
  ])
    el(id).textContent = `${format(value)} ${unit}`;

  if (!braking)
    setPhase(
      'motor',
      'a · 正向电动运行',
      isLowering
        ? '正方向取提升。n > 0，T = T_L；重力转矩始终指向下放方向。'
        : 'n > 0，T = T_L > 0。负载转矩反对运动，准备反接电枢电压。',
    );
  else if (!connected)
    setPhase(
      'switch',
      'a → b · 同速切换（慢放）',
      isLowering
        ? '电源不反接，只增大回路电阻。nₐ = nᵦ，Eₐ = Eᵦ；Iₐ、T 减小但不反向。'
        : '电枢电压反接并串阻。nₐ = nᵦ，Eₐ = Eᵦ；Iₐ、T 立即反向。',
    );
  else if (cut)
    setPhase(
      'cut',
      'c · 到零速，立即断电',
      'c 点 n = 0，但断电前 T ≠ 0。自动断开后，Iₐ = T = 0，电机停在 O。',
    );
  else if (zeroHold)
    setPhase(
      'zero',
      'c · 零速瞬间（教学停帧）',
      isLowering
        ? 'n = E = 0，Iₐ、T 仍为正，但 T < T_L；重力将使其反转，实际不停留。'
        : 'n = E = 0，Iₐ、T 仍为负。本次未断电，将克服反向负载阻力而反向启动。',
    );
  else if (speed < 0)
    setPhase(
      speed === dSpeed ? 'steady' : 'reverse',
      speed === dSpeed ? 'd · 稳定运行' : 'c → d · 反向启动',
      isLowering
        ? 'n、E 为负，Iₐ、T 始终为正；|E| 增大使 Iₐ、T 增大，最终 T = T_L。'
        : 'n、E、T 均为负，T 与 n 同向；反向电动运行，已经离开制动状态。',
    );
  else
    setPhase(
      'decelerate',
      'b → c · 正向减速',
      isLowering
        ? '串阻后 T < T_L，提升速度下降。E 减小使 Iₐ 回升，但直到零速仍有 T < T_L。'
        : 'Iₐ < 0，T < 0；电磁转矩与负载阻力共同减速，到 c 点必须断电。',
    );

  el('process-note').textContent = isLowering
    ? '下放条件：Rₐ + Rb > UₐCᴛΦ / T_L。本例 Rb > 9.50 Ω。'
    : '取消“零速自动断电”可观察 c → d；d 点为反向电动运行。';
  el('formula').innerHTML = !isResistance
    ? `1：n = ${fraction('Uₐ', 'CᴇΦ')} − ${fraction('RₐT', 'CᴇCᴛΦ²')}<br>2：n = ${fraction(isLowering ? 'Uₐ' : '−Uₐ', 'CᴇΦ')} − ${fraction('(Rₐ + Rb)T', 'CᴇCᴛΦ²')}`
    : isLowering
      ? `Rₐ + Rb = ${fraction('Uₐ + |E<sub>d</sub>|', 'I<sub>ad</sub>')} = ${fraction('C<sub>T</sub>Φ(Uₐ + C<sub>E</sub>Φ|n<sub>L</sub>|)', 'T<sub>L</sub> − T₀')}<br>Rb = ${format(loweringResistance(Math.abs(dSpeed)), 2)} Ω → |n<sub>L</sub>| = ${format(-dSpeed, 0)} r/min`
      : `Rₐ + Rb ≥ ${fraction('|Uₐ| + |E<sub>b</sub>|', 'I<sub>amax</sub>')}<br>Rb ≥ ${format(minimumStopResistance(), 2)} Ω；|I<sub>b</sub>| = ${format(-atB.current)} A`;
  el('effect').innerHTML = isResistance
    ? isLowering
      ? '各量取大小，E<sub>d</sub>、I<sub>ad</sub> 取稳定 d 点；T₀ 为下放时的空载阻力矩，动画取 T₀ = 0。Rb ↑ → |斜率| ↑ → |n<sub>L</sub>| ↑。'
      : `E<sub>b</sub> 取制动瞬间；本例 I<sub>amax</sub> = 75 A。Rb ↓ → |斜率| ↓ → |Tᵦ| ↑ → 停车更快（${format(crossing, 2)} s）。`
    : isLowering
      ? '特性 2 保持 +n₀ 截距；c 在 T 轴正半轴。进入第四象限后，T 与 n 反向。'
      : '特性 2 截距为 −n₀；c 在 T 轴负半轴。零速仍有电流，与能耗制动不同。';
  el('energy-title').textContent = !connected
    ? '电能 → 机械能'
    : cut
      ? '断电停机'
      : isReverseMotor
        ? '电能 → 机械能'
        : isLowering
          ? speed < 0
            ? '势能 ＋ 电能 → 热'
            : '电能 → 机械能＋热'
          : '动能 ＋ 电能 → 热';
  el('energy-description').textContent = !connected
    ? '正转 / 提升为正方向。旋转按转速比例慢放。'
    : cut
      ? '零速前仍有电源供能，及时断电避免反转。'
      : isReverseMotor
        ? '电源驱动反向旋转，负载阻力也随之反向。'
        : isLowering
          ? speed < 0
            ? '重力与电源共同供能；热耗在 Rb 与 Rₐ。'
            : '串阻减速尚属电动；反向下放才是反接制动。'
          : '电源电能与转子动能共同耗在 Rb 与 Rₐ。';
  if (isLowering) {
    const height = 68 - 22 * Math.tanh(travel / 1500);
    el('weight').setAttribute('transform', `translate(0 ${height})`);
    el('rope').setAttribute('d', `M62 25V${height}`);
    el('rope').style.strokeDashoffset = angle / 10;
    el('weight-arrow').setAttribute('d', speed < 0 ? 'M87 65V90' : 'M87 90V65');
    el('weight-arrow').setAttribute('opacity', Math.abs(speed) < 0.05 ? 0 : 1);
  }
  el('pause').disabled = cut;
}

function reset(shouldBrake) {
  braking = shouldBrake;
  paused = false;
  elapsed = 0;
  speed = initialSpeed;
  travel = 0;
  el('motor').setAttribute('aria-pressed', String(!braking));
  el('brake').setAttribute('aria-pressed', String(braking));
  el('pause').textContent = '暂停';
  el('pause').setAttribute('aria-pressed', 'false');
  el('rb-value').textContent = `${rb.toFixed(1)} Ω`;
  render();
}
el('motor').addEventListener('click', () => reset(false));
el('brake').addEventListener('click', () => reset(true));
el('replay').addEventListener('click', () => reset(true));
el('pause').addEventListener('click', () => {
  paused = !paused;
  el('pause').textContent = paused ? '继续' : '暂停';
  el('pause').setAttribute('aria-pressed', String(paused));
});
el('rb').addEventListener('input', (event) => {
  rb = Number(event.target.value);
  el('rb').setAttribute('aria-valuetext', `${rb.toFixed(1)} 欧姆`);
  reset(braking);
});
el('auto-cut')?.addEventListener('change', () => reset(braking));

function tick(timestamp) {
  const dt =
    lastTimestamp === undefined
      ? 0
      : Math.min(0.05, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;
  if (!paused && !document.hidden) {
    if (braking) elapsed += dt;
    render();
    angle += speed * dt * 0.12;
    travel += speed * dt;
    if (!reduceMotion) {
      const current = Number.parseFloat(el('current-value').textContent);
      flowOffset -=
        Math.sign(current) * Math.min(65, Math.abs(current) * 2) * dt;
    }
  }
  requestAnimationFrame(tick);
}
reset(false);
requestAnimationFrame(tick);
