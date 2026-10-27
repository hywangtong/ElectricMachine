import {
  parameters as p,
  initialSpeed,
  brakingPoint,
  equilibriumSpeed,
  advanceSpeed,
  stopTime,
} from './dc-motor-dynamic-braking-model.mjs';

const requestedMode = new URLSearchParams(location.search).get('mode');
const mode = ['stop', 'lowering'].includes(requestedMode)
  ? requestedMode
  : 'principle';
const isLowering = mode === 'lowering';
const isPrinciple = mode === 'principle';
const titles = {
  principle: '能耗制动：从电动状态切换到制动状态',
  stop: '能耗制动 · 迅速停机',
  lowering: '能耗制动 · 下放重物',
};
document.title = titles[mode];
const root = document.querySelector('main');
root.innerHTML = `
  <header class="page-head">
    <div class="eyebrow">直流拖动 / 8.4 · 能耗制动 · ${isPrinciple ? '01 原理' : isLowering ? '03 位能性负载' : '02 反抗性负载'}</div>
    <h1 id="page-title">${titles[mode]}</h1>
    <p>${isPrinciple ? '电枢脱离电源、接入制动电阻；励磁保持，机械能经发电转为电阻热。' : isLowering ? '先停止提升，再反向启动；重力势能持续转为电能，并在电阻中消耗。' : '电磁转矩反向，与负载阻力共同减速；到零速后，电磁制动转矩也降为零。'}</p>
    <span class="scope-tag">他励 · Φ 恒定 · 忽略电枢电感<small>Uₐ = 220 V · Rₐ = 1 Ω · CᴇΦ = 0.2 V/(r/min)</small></span>
  </header>
  <section class="braking-controls" aria-label="能耗制动动画控制">
    <button id="motor" type="button" aria-pressed="true">电动状态</button>
    <button id="brake" type="button" aria-pressed="false">${isPrinciple ? '切换为能耗制动' : '开始能耗制动'}</button>
    <button id="pause" type="button" aria-pressed="false">暂停</button>
    <button id="replay" type="button">重播 ↺</button>
    <label class="resistance-control" for="rb">
      <span>制动电阻 R<sub>b</sub></span>
      <input id="rb" type="range" min="2" max="10" step="0.1" value="5" />
      <output id="rb-value" for="rb">5.0 Ω</output>
    </label>
  </section>
  <section class="braking-layout">
    <article class="braking-panel">
      <div class="panel-heading"><h2>等效电路</h2><span id="circuit-state">电动状态 · 电源供电</span></div>
      <svg id="circuit" viewBox="0 0 440 290" role="img" aria-label="电动与能耗制动等效电路，独立励磁电源始终接通">
        <defs>
          ${[
            ['current', '#bc742a'],
            ['speed', '#39796f'],
            ['torque', '#ac4c54'],
          ]
            .map(
              ([id, color]) =>
                `<marker id="${id}-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="${color}" /></marker>`,
            )
            .join('')}
        </defs>
        <path d="M60 119V52H142M176 52H234V119M234 191V246H60V181" class="wire" />
        <path id="flow" d="M60 119V52H234V246H60V181" class="current-flow" />
        <rect x="142" y="43" width="34" height="18" fill="white" stroke="#47635f" stroke-width="2.5" />
        <text x="143" y="30" class="math">Rₐ</text>
        <g id="source-symbol">
          <circle cx="60" cy="150" r="31" fill="#eff3f8" stroke="#47635f" stroke-width="3" />
          <text x="53" y="143">+</text><text x="54" y="170">−</text>
          <text x="6" y="157" class="math">Uₐ</text>
        </g>
        <g id="resistor-symbol" opacity="0">
          <rect x="48" y="119" width="24" height="62" fill="#fcf3e5" stroke="#bc742a" stroke-width="3" />
        <text x="7" y="157" class="math">R<tspan baseline-shift="sub" font-size="16">b</tspan></text>
          <path id="heat" d="M42 105q-9-10 0-20M61 105q-9-10 0-20M80 105q-9-10 0-20" fill="none" stroke="#bc742a" stroke-width="2" />
        </g>
        <circle cx="234" cy="155" r="36" fill="#f5f8f3" stroke="#47635f" stroke-width="3" />
        <g id="rotor" stroke="${isPrinciple ? '#a8bdb3' : '#39796f'}" stroke-width="${isPrinciple ? 2 : 3}">
          ${
            isPrinciple
              ? '<path d="M234 127V183M206 155H262M214 135 254 175M214 175 254 135" />'
              : '<circle cx="234" cy="155" r="28" fill="none"/><path d="M234 127V183M206 155H262"/><circle cx="234" cy="127" r="5" fill="#bc742a" stroke="#fff" stroke-width="1.5"/>'
          }
        </g>
        <circle cx="234" cy="155" r="${isPrinciple ? 20 : 17}" fill="#fff" />
        <text id="machine-letter" x="221" y="165" font-size="28">M</text>
        <text id="emf-polarity" x="184" y="146" class="motor-color">+</text>
        <text id="emf-minus" x="184" y="180" class="motor-color">−</text>
        <text x="155" y="163" class="math motor-color">E</text>
        <path id="current-arrow" d="M102 77H165" stroke="#bc742a" stroke-width="3" marker-end="url(#current-head)" />
        <text x="112" y="103" class="math" style="fill:#bc742a">Iₐ</text>
        <path id="speed-direction" d="M279 200A65 65 0 0 1 194 207" fill="none" stroke="#39796f" stroke-width="3" marker-end="url(#speed-head)" />
        <text x="276" y="228" class="math brake-color">n</text>
        <path id="torque-arrow-path" d="M194 106A65 65 0 0 1 280 112" fill="none" stroke="#ac4c54" stroke-width="3" marker-end="url(#torque-head)" />
        <text x="281" y="100" class="math motor-color">T</text>
        <path d="M401 52H340V97q-22 0 0 19q-22 0 0 19q-22 0 0 19q-22 0 0 19q-22 0 0 19V246H401" class="wire" />
        <circle cx="401" cy="52" r="4" fill="white" stroke="#47635f" stroke-width="2" />
        <circle cx="401" cy="246" r="4" fill="white" stroke="#47635f" stroke-width="2" />
        <text x="389" y="82" class="brake-color">+</text><text x="389" y="234" class="brake-color">−</text>
        <text x="369" y="158" class="math brake-color">U<tspan baseline-shift="sub" font-size="16">f</tspan></text>
        <text x="294" y="278" class="small" style="font-size:14px">励磁保持 · Φ 恒定</text>
        <text id="armature-caption" x="57" y="278" class="small">电枢接直流电源</text>
      </svg>
      <p id="circuit-caption" class="circuit-caption">Uₐ = E + IₐRₐ；电流、转矩均为正，电机带动负载。</p>
    </article>
    <article class="braking-panel">
      <div class="panel-heading"><h2>机械特性与工作点</h2><span>横轴 T / N·m　纵轴 n / (r/min)</span></div>
      <svg id="plot" viewBox="0 0 850 320" role="img" aria-label="电动和能耗制动的机械特性，以及工作点变化轨迹"></svg>
      <div class="readings" aria-label="实时运行数据">
        <span>转速 n<b id="speed-value"></b></span><span>感生电动势 E<b id="emf-value"></b></span>
        <span>电枢电流 Iₐ<b id="current-value"></b></span><span>电磁转矩 T<b id="torque-value"></b></span>
      </div>
    </article>
  </section>
  <section class="braking-notes" aria-label="过程与公式">
    <article><h2 id="phase-title" aria-live="polite">a · 电动运行</h2><p id="phase-description"></p><p class="minor">拖动 Rb 后以相同初速重演；虚线为 2 Ω / 10 Ω 对照。</p></article>
    <article><h2 id="formula-title">${isPrinciple ? '切换前后，方程一起变' : 'Rb 越小，制动作用越强'}</h2><p id="formula" class="formula"></p><p id="effect" class="minor"></p></article>
    <article class="energy-note${isLowering ? ' lowering-note' : ''}"><svg id="scene" viewBox="0 0 104 88" role="img" aria-label="${isLowering ? '卷筒与重物先提升再下放' : '转子减速运动示意'}"></svg><div><h2 id="energy-title">电能 → 机械能</h2><p id="energy-description"></p></div></article>
  </section>`;

// Install native control key/gesture protection after the controls exist.
await import('./dc-generator-emf-controls.js');

const el = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const yMin = mode === 'stop' ? -300 : -1300;
const yMax = 1350;
const x = (torque) => 55 + ((torque + 150) / 245) * 750;
const y = (speed) => 15 + ((yMax - speed) / (yMax - yMin)) * 265;
const point = (torque, speed) => `${x(torque)},${y(speed)}`;
const line = (intercept, slope) =>
  `M${point(-150, intercept + slope * 150)}L${point(95, intercept - slope * 95)}`;
const dot = (id, label, torque, speed, dx = 10, dy = -10) =>
  `<g id="${id}"><circle cx="${x(torque)}" cy="${y(speed)}" r="5" fill="#fff9db" stroke="#39796f" stroke-width="2"/><text x="${x(torque) + dx}" y="${y(speed) + dy}" class="math">${label}</text></g>`;
el('plot').innerHTML = `
  <defs><clipPath id="chart-clip"><rect x="55" y="15" width="750" height="265"/></clipPath>
  <marker id="axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#47635f"/></marker></defs>
  ${[-100, -50, 0, 50].map((t) => `<path d="M${x(t)} 15V280" stroke="#edf1eb"/><text x="${x(t) - 10}" y="305" class="small">${t}</text>`).join('')}
  ${[-1000, -500, 0, 500, 1000]
    .filter((n) => n >= yMin)
    .map(
      (n) =>
        `<path d="M55 ${y(n)}H805" stroke="#edf1eb"/><text x="8" y="${y(n) + 5}" class="small">${n}</text>`,
    )
    .join('')}
  <path d="M55 ${y(0)}H824M${x(0)} 286V8" stroke="#47635f" stroke-width="2" fill="none" marker-end="url(#axis-arrow)"/>
  <text x="826" y="${y(0) - 10}" class="math">T</text><text x="${x(0) + 12}" y="22" class="math">n</text>
  <g clip-path="url(#chart-clip)">
    <path d="${line(p.ua / p.ce, p.ra / (p.ce * p.ct))}" class="curve motor" opacity="0.25"/>
    <path id="brake-ghost" class="curve brake" opacity="0.2"/>
    <path d="${line(0, (p.ra + 2) / (p.ce * p.ct))}" class="curve reference"/>
    <path d="${line(0, (p.ra + 10) / (p.ce * p.ct))}" class="curve reference"/>
    <path id="active-curve" class="curve motor"/>
    <path id="jump-guide" class="guide"/>
    <path d="M${x(p.load)} 15V280" stroke="#7d89ae" stroke-width="2" opacity="0.7"/>
    <path id="trace" class="trace"/>
  </g>
  <text x="${x(p.load) + 8}" y="${y(0) + 23}" class="small">T<tspan baseline-shift="sub" font-size="12">L</tspan> = 40</text>
  <text x="${x(66)}" y="${y(1100) - 13}" class="motor-color">1 · 电动</text>
  ${[2, 10].map((resistance) => `<text x="${x((-650 * p.ce * p.ct) / (p.ra + resistance)) - 25}" y="${y(650) - 10}" class="small">${resistance} Ω</text>`).join('')}
  <text id="brake-label" class="brake-color">2 · 制动</text>
  ${dot('point-a', 'a', p.load, initialSpeed)}
  ${dot('point-b', 'b', 0, initialSpeed, -22)}
  ${dot('point-o', 'O', 0, 0, -25, 22)}
  ${dot('point-c', 'c', p.load, 0, 12, 7)}
  <g id="live-point"><circle r="11" fill="#bc742a" opacity="0.16"/><circle r="6" fill="#bc742a" stroke="white" stroke-width="2"/></g>
  <text id="point-hint" class="small" x="66" y="34">橙点＝当前工作点</text>`;

el('scene').innerHTML = isLowering
  ? `<path d="M8 9H96" class="wire"/><circle cx="47" cy="25" r="15" fill="white" stroke="#47635f" stroke-width="2"/><path id="scene-rotor" d="M32 25H62M47 10V40" class="wire"/><path id="rope" d="M62 25V60" stroke="#39796f" stroke-width="3" stroke-dasharray="4 4"/><g id="weight"><rect x="49" y="0" width="26" height="19" rx="3" fill="#e6bd72" stroke="#bc742a"/><text x="54" y="14" font-size="12" fill="#173b3b">mg</text></g><path id="weight-arrow" d="M87 66V44" stroke="#39796f" stroke-width="2" marker-end="url(#speed-head)"/>`
  : `<circle cx="50" cy="44" r="32" fill="white" stroke="#47635f" stroke-width="3"/><g id="scene-rotor" stroke="#39796f" stroke-width="4"><path d="M50 15V73M21 44H79${isPrinciple ? 'M29 23 71 65M29 65 71 23' : ''}"/>${isPrinciple ? '' : '<circle cx="50" cy="18" r="5" fill="#bc742a" stroke="#fff" stroke-width="1.5"/>'}</g><circle cx="50" cy="44" r="8" fill="#bc742a"/>`;

let rb = 5;
let braking = false;
let paused = false;
let elapsed = 0;
let speed = initialSpeed;
let angle = 0;
let flowOffset = 0;
let travel = 0;
let lastPhase = '';
let lastTimestamp;
const switchDuration = reduceMotion ? 0.01 : 0.85;
const holdDuration = 0.7;
const zeroHoldDuration = 0.8;
const format = (value, digits = 1) =>
  (Math.abs(value) < 0.05 ? 0 : value).toFixed(digits);

function reset(shouldBrake) {
  braking = shouldBrake;
  paused = false;
  elapsed = 0;
  speed = initialSpeed;
  travel = 0;
  el('motor').setAttribute('aria-pressed', String(!braking));
  el('brake').setAttribute('aria-pressed', String(braking));
  updatePause();
  render();
}

function updatePause() {
  el('pause').textContent = paused ? '继续' : '暂停';
  el('pause').setAttribute('aria-pressed', String(paused));
}

function setPhase(phase, title, description) {
  if (phase === lastPhase) return;
  lastPhase = phase;
  el('phase-title').textContent = title;
  el('phase-description').innerHTML = description.replaceAll(
    'T_L',
    'T<sub>L</sub>',
  );
}

function render() {
  const mix = braking ? Math.min(1, elapsed / switchDuration) : 0;
  const brakePoint = brakingPoint(speed, rb);
  const motorCurrent = p.load / p.ct;
  const current = motorCurrent * (1 - mix) + brakePoint.current * mix;
  const torque = current * p.ct;
  const atB = brakingPoint(initialSpeed, rb);
  const nc = equilibriumSpeed(rb);
  const finished =
    braking &&
    !isPrinciple &&
    (isLowering ? Math.abs(speed - nc) < 1 : speed === 0);
  const direction = current < 0 ? -1 : 1;
  const atZeroHold =
    isLowering &&
    braking &&
    elapsed >= switchDuration + holdDuration + stopTime(rb) &&
    elapsed < switchDuration + holdDuration + stopTime(rb) + zeroHoldDuration;

  el('source-symbol').setAttribute('opacity', 1 - mix);
  el('resistor-symbol').setAttribute('opacity', mix);
  el('machine-letter').textContent = mix === 1 ? 'G' : 'M';
  el('rotor').setAttribute('transform', `rotate(${angle} 234 155)`);
  el('scene-rotor').setAttribute(
    'transform',
    `rotate(${isLowering ? -angle : angle} ${isLowering ? '47 25' : '50 44'})`,
  );
  el('flow').style.strokeDashoffset = flowOffset;
  el('flow').style.opacity = String(Math.min(1, Math.abs(current) / 12));
  el('current-arrow').setAttribute(
    'd',
    direction < 0 ? 'M165 77H102' : 'M102 77H165',
  );
  el('current-arrow').setAttribute('opacity', Math.abs(current) < 0.05 ? 0 : 1);
  const speedPath = 'M279 200A65 65 0 0 1 194 207';
  const torquePath = 'M194 106A65 65 0 0 1 280 112';
  for (const [id, value, path, marker] of [
    ['speed-direction', speed, speedPath, 'speed'],
    ['torque-arrow-path', torque, torquePath, 'torque'],
  ]) {
    const arrow = el(id);
    arrow.setAttribute('d', path);
    arrow.setAttribute(
      'marker-end',
      value > 0.05 ? `url(#${marker}-head)` : 'none',
    );
    arrow.setAttribute(
      'marker-start',
      value < -0.05 ? `url(#${marker}-head)` : 'none',
    );
    arrow.setAttribute('opacity', Math.abs(value) < 0.05 ? 0 : 1);
  }
  el('emf-polarity').textContent = speed < 0 ? '−' : '+';
  el('emf-minus').textContent = speed < 0 ? '+' : '−';
  el('heat').setAttribute('opacity', Math.min(1, brakePoint.heat / 300));
  el('armature-caption').textContent =
    mix === 1
      ? '电源断开 · Rb 闭合'
      : mix > 0
        ? '切换电枢回路（慢放示意）'
        : '电枢接直流电源';
  el('circuit-state').textContent =
    mix === 1
      ? speed < -0.5
        ? '制动运行 · 反向下放'
        : speed === 0
          ? '零速 · 无电磁制动力'
          : '制动状态 · 发电耗能'
      : mix > 0
        ? '电动 → 制动'
        : '电动状态 · 电源供电';
  el('circuit-caption').textContent =
    mix === 1
      ? 'Iₐ = −E / (Rₐ + Rb)，T 与 n 反向；励磁电源仍独立供电。'
      : 'Uₐ = E + IₐRₐ；电流、转矩均为正，电机带动负载。';

  const slope = (p.ra + rb) / (p.ce * p.ct);
  el('active-curve').setAttribute(
    'd',
    line(((1 - mix) * p.ua) / p.ce, (p.ra + mix * rb) / (p.ce * p.ct)),
  );
  el('active-curve').setAttribute(
    'class',
    `curve ${mix > 0.5 ? 'brake' : 'motor'}`,
  );
  el('brake-ghost').setAttribute('d', line(0, slope));
  el('jump-guide').setAttribute(
    'd',
    `M${point(atB.torque, initialSpeed)}L${point(p.load, initialSpeed)}`,
  );
  el('point-b').setAttribute(
    'transform',
    `translate(${x(atB.torque) - x(0)} 0)`,
  );
  el('point-c').setAttribute('transform', `translate(0 ${y(nc) - y(0)})`);
  el('point-c').style.display = isLowering ? '' : 'none';
  el('brake-label').setAttribute('x', x(isLowering ? 12 : -20));
  el('brake-label').setAttribute(
    'y',
    y(isLowering ? -slope * 12 : slope * 20) + 25,
  );
  el('live-point').setAttribute(
    'transform',
    `translate(${x(torque)} ${y(speed)})`,
  );
  const path = braking
    ? `M${point(p.load, initialSpeed)}L${point(mix < 1 ? torque : atB.torque, initialSpeed)}${mix === 1 ? `L${point(torque, speed)}` : ''}`
    : '';
  el('trace').setAttribute('d', path);
  for (const [id, value, unit] of [
    ['speed-value', speed, 'r/min'],
    ['emf-value', p.ce * speed, 'V'],
    ['current-value', current, 'A'],
    ['torque-value', torque, 'N·m'],
  ])
    el(id).textContent = `${format(value)} ${unit}`;

  if (!braking)
    setPhase(
      'motor',
      'a · 电动运行',
      isLowering
        ? '正转提升：n > 0，T = T_L > 0；重力始终趋向下放。'
        : 'n > 0，T = T_L > 0；点击切换，观察电路与特性同步变化。',
    );
  else if (mix < 1)
    setPhase(
      'switch',
      'a → b · 同速切换',
      'nₐ = nᵦ，Eₐ = Eb；电流和转矩反向。横向跳转已作慢放。',
    );
  else if (isPrinciple || elapsed < switchDuration + holdDuration)
    setPhase(
      'b',
      'b · 已进入能耗制动',
      '电源不再向电枢供能；n > 0，Iₐ < 0，T < 0。',
    );
  else if (atZeroHold)
    setPhase(
      'zero',
      'O · 瞬时零速（教学停帧）',
      'E = Iₐ = T = 0，但重力仍在。实际不会停留，将立即反向启动。',
    );
  else if (finished)
    setPhase(
      'finished',
      isLowering ? 'c · 稳定能耗制动运行' : 'O · 已停车',
      isLowering
        ? 'n < 0，E < 0，Iₐ > 0，T = T_L；制动转矩平衡重力驱动转矩。'
        : 'n = E = Iₐ = T = 0；反抗性负载不驱动反转，电机停止。',
    );
  else if (speed >= 0)
    setPhase(
      'decelerate',
      'b → O · 正向减速',
      isLowering
        ? 'T < 0，重力驱动转矩也指向负向；提升速度下降，经过零速。'
        : 'T < 0，负载阻力也反对转动；两者共同使转速下降至零。',
    );
  else
    setPhase(
      'reverse',
      'O → c · 反向启动并下放',
      '零速时电磁转矩为零，重力仍在；反转后 E、Iₐ、T 再次反向。',
    );

  el('formula').innerHTML = isPrinciple
    ? mix === 1
      ? 'Uₐ = 0，n₀ = 0<br>n = −(Rₐ + R<sub>b</sub>)T / (C<sub>E</sub>C<sub>T</sub>Φ²)'
      : 'n = Uₐ / (C<sub>E</sub>Φ) − RₐT / (C<sub>E</sub>C<sub>T</sub>Φ²)<br>T = C<sub>T</sub>ΦIₐ，E = C<sub>E</sub>Φn'
    : isLowering
      ? `|n<sub>c</sub>| = (Rₐ + R<sub>b</sub>)T<sub>L</sub> / (C<sub>E</sub>C<sub>T</sub>Φ²)<br>稳定下放：${format(-nc, 0)} r/min`
      : `|I<sub>b</sub>| = E<sub>b</sub> / (Rₐ + R<sub>b</sub>) = ${format(-atB.current)} A<br>停车 ${format(stopTime(rb), 2)} s（J = 1.4 kg·m²）`;
  el('effect').textContent = isPrinciple
    ? '制动特性过原点；Rb 越小，|dn/dT| 越小，同速制动转矩越大。'
    : `Rₐ + Rb ≥ Eb / Iₐmax；本例 Iₐmax = 75 A，Rb ≥ ${format((p.ce * initialSpeed) / p.maxCurrent - p.ra, 2)} Ω。`;
  el('energy-title').textContent =
    mix === 1
      ? isLowering && speed < 0
        ? '重力势能 → 电阻热'
        : '动能 → 电阻热'
      : '电能 → 机械能';
  el('energy-description').textContent =
    mix === 1
      ? isLowering
        ? 'Rb ↓ → |n_c| ↓。零速保载需要机械抱闸。'
        : isPrinciple
          ? '电阻消耗发出的电能；零速没有电磁制动力。'
          : 'Rb ↓ → |Ib|、|Tb| ↑ → 停车更快。'
      : isPrinciple
        ? '正方向：提升 / 正转。转子与流动虚线为运动示意。'
        : '正方向：提升 / 正转。橙点随转子旋转，转速按比例慢放。';
  if (isLowering) {
    const height = 48 - 22 * Math.tanh(travel / 1500);
    el('weight').setAttribute('transform', `translate(0 ${height})`);
    el('rope').setAttribute('d', `M62 25V${height}`);
    el('rope').style.strokeDashoffset = angle / 10;
    el('weight-arrow').setAttribute(
      'd',
      speed >= 0 ? 'M87 66V44' : 'M87 44V66',
    );
  }
  el('pause').disabled = finished && !isLowering;
}

el('motor').addEventListener('click', () => reset(false));
el('brake').addEventListener('click', () => reset(true));
el('replay').addEventListener('click', () => reset(true));
el('pause').addEventListener('click', () => {
  paused = !paused;
  updatePause();
});
el('rb').addEventListener('input', (event) => {
  rb = Number(event.target.value);
  el('rb-value').textContent = `${rb.toFixed(1)} Ω`;
  el('rb').setAttribute('aria-valuetext', `${rb.toFixed(1)} 欧姆`);
  reset(braking);
});

function tick(timestamp) {
  const dt =
    lastTimestamp === undefined
      ? 0
      : Math.min(0.05, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;
  if (!paused && !document.hidden) {
    if (braking) elapsed += dt;
    const dynamicsStart = switchDuration + holdDuration;
    if (braking && !isPrinciple && elapsed > dynamicsStart) {
      let physicalTime = elapsed - dynamicsStart;
      const zeroTime = stopTime(rb);
      if (isLowering && physicalTime >= zeroTime)
        physicalTime =
          physicalTime < zeroTime + zeroHoldDuration
            ? zeroTime
            : physicalTime - zeroHoldDuration;
      speed = advanceSpeed(initialSpeed, rb, physicalTime, mode);
      if (isLowering && Math.abs(physicalTime - zeroTime) < 1e-8) speed = 0;
      if (isLowering && Math.abs(speed - equilibriumSpeed(rb)) < 1)
        speed = equilibriumSpeed(rb);
    }
    travel += speed * dt;
    // Rotor motion is essential to these two demonstrations, including when
    // reduced motion is preferred. Keep decorative flow under that preference.
    if (!reduceMotion || !isPrinciple)
      angle += speed * dt * (isPrinciple ? 0.08 : 0.12);
    if (!reduceMotion) {
      const current =
        braking && elapsed >= switchDuration
          ? brakingPoint(speed, rb).current
          : p.load / p.ct;
      flowOffset -=
        Math.sign(current) * Math.min(65, Math.abs(current) * 2) * dt;
    }
    render();
  }
  requestAnimationFrame(tick);
}
reset(false);
requestAnimationFrame(tick);
