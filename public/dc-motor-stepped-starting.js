import {
  automaticState,
  cutSpeeds,
  duration,
  emfConstant,
  loadCurrent,
  lowerCurrent,
  masks,
  motor,
  overloadCurrent,
  phases,
  sections,
  speedAtCurrent,
  stateAt,
  upperCurrent,
} from './dc-motor-stepped-starting-model.mjs';

const $ = (id) => document.getElementById(id);
const colors = ['#b17b36', '#8e6bae', '#4580a8', '#448a73', '#b45261'];
const names = ['a', 'b', 'c', 'd', 'e'];
const subscript = ['₁', '₂', '₃', '₄'];
let axisMaximum = 36;
const x = (current) => 68 + (current / axisMaximum) * 610;
const y = (speed) => 319 - (speed / 1750) * 277;
const point = (state) =>
  `${x(state.current).toFixed(2)},${y(state.speed).toFixed(2)}`;
const line = (mask) =>
  `M${x(0)},${y(speedAtCurrent(mask, 0))}L${x(axisMaximum)},${y(speedAtCurrent(mask, axisMaximum))}`;
const graph = $('graph');
function drawGraph() {
  const limits = [
    { key: 'load', sub: 'L', current: loadCurrent, color: '#287f70' },
    { key: 'lower', sub: '2', current: lowerCurrent, color: '#4580a8' },
    { key: 'upper', sub: '1', current: upperCurrent, color: '#b17b36' },
    { key: 'overload', sub: 'M', current: overloadCurrent, color: '#b45261' },
  ];
  graph.innerHTML = `
  <defs>
    <clipPath id="plot-clip"><rect x="68" y="42" width="610" height="277" /></clipPath>
    <marker id="jump-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#b48d45" /></marker>
  </defs>
  ${[0, 500, 1000, 1500].map((n) => `<path class="grid" d="M68 ${y(n)}H678" /><text x="58" y="${y(n) + 5}" text-anchor="end">${n}</text>`).join('')}
  <path class="axis" d="M68 35V319H695 M64 43L68 35 72 43 M687 315L695 319 687 323" />
  <text x="12" y="20" class="math-label">n</text><text x="34" y="20">/ r·min⁻¹</text>
  <text x="697" y="325" class="math-label">T (Iₐ)</text>
  <text id="overload-caption" x="${x(overloadCurrent)}" y="24" text-anchor="${axisMaximum > 36 ? 'start' : 'end'}" class="overload-caption">T<tspan baseline-shift="sub" font-size="10">M</tspan>：短时过载转矩（临界点）</text>
  ${limits
    .map(({ key, sub, current, color }, i) => {
      const expanded = axisMaximum > 36;
      const labelX = expanded
        ? 170 + i * 150
        : x(current) + (i === 0 ? -7 : i === 1 ? 7 : 0);
      const anchor = expanded || i > 1 ? 'middle' : i === 0 ? 'end' : 'start';
      return `<g data-limit="${key}" data-current="${current}" style="--limit-color:${color}">
      <path class="limit" d="M${x(current)} 42V319" />
      <path class="limit-leader" d="M${x(current)} 319V326${expanded ? `L${labelX} 336` : ''}" />
      <text class="limit-label" x="${labelX}" y="351" text-anchor="${anchor}">T<tspan baseline-shift="sub" font-size="13">${sub}</tspan></text>
      <text class="limit-label current-limit-label" x="${labelX}" y="374" text-anchor="${anchor}">(I<tspan baseline-shift="sub" font-size="12">${sub}</tspan>)</text>
    </g>`;
    })
    .join('')}
  <g clip-path="url(#plot-clip)">
    ${masks.map((mask, i) => `<path d="${line(mask)}" fill="none" stroke="${colors[i]}" stroke-width="2" opacity="0.25" />`).join('')}
    <path id="active-curve" fill="none" stroke-width="3.5" />
    <path id="trajectory" fill="none" stroke="#b48d45" stroke-width="2.5" stroke-dasharray="5 4" />
    <path id="jump" fill="none" stroke="#b48d45" stroke-width="2.5" marker-end="url(#jump-arrow)" />
  </g>
  <text x="82" y="${y(motor.voltage / emfConstant) - 9}">n₀</text>
  <circle class="overload-point" cx="${x(overloadCurrent)}" cy="${y(speedAtCurrent(15, overloadCurrent))}" r="5" />
  <text class="overload-caption" x="${x(overloadCurrent) + 10}" y="${y(speedAtCurrent(15, overloadCurrent)) - 8}">M</text>
  <text x="74" y="401" class="limit-example">本例：I<tspan baseline-shift="sub">L</tspan>=15 A，I₂≈${lowerCurrent.toFixed(1)} A，I₁=${upperCurrent.toFixed(1)} A，I<tspan baseline-shift="sub">M</tspan>=${overloadCurrent.toFixed(0)} A（教学示例边界）</text>
  <text x="74" y="421" class="limit-example">横轴按 Iₐ / A 标度，T = CₜΦₙIₐ${axisMaximum > 36 ? ' · 已自动扩展量程' : ''}</text>
  <g id="point-labels"></g>
  <circle id="operating-halo" r="12" fill="#b48d45" opacity="0.16" />
  <circle id="operating-point" r="6.5" fill="#287f70" stroke="#fff" stroke-width="2" />
  <text id="point-caption" class="point-label"></text>`;
}
drawGraph();
$('curve-legend').innerHTML = masks
  .map(
    (_, i) =>
      `<span style="--curve-color:${colors[i]}">${i === 4 ? 'e · 固有特性' : `${names[i]} · 切除 ${i} 段`}</span>`,
  )
  .join('');

$('sections').innerHTML = sections
  .map((value, i) => {
    const left = 60 + i * 96;
    return `<g id="section-${i}">
      <path class="wire" d="M${left} 116h28 m40 0h28" />
      <rect class="resistor" x="${left + 28}" y="109" width="40" height="14" />
      <text x="${left + 48}" y="143" class="resistance-label">R${subscript[i]} ${value.toFixed(2)} Ω</text>
      <path class="bypass-wire" d="M${left + 9} 116V76H${left + 24} M${left + 72} 76H${left + 87}V116" />
      <foreignObject x="${left + 18}" y="34" width="60" height="65">
        <button xmlns="http://www.w3.org/1999/xhtml" type="button" id="q-${i}" class="switch-button" aria-label="Q${i + 1} 旁路开关" aria-pressed="false">
          <span>Q${subscript[i]}</span><svg viewBox="0 0 60 23" aria-hidden="true"><path d="M0 14H6 M54 14H60" /><path id="blade-${i}" d="M6 14L48 3" /><circle cx="6" cy="14" r="2" /><circle cx="54" cy="14" r="2" /></svg><small id="switch-state-${i}">断开</small>
        </button>
      </foreignObject>
    </g>`;
  })
  .join('');
$('readouts').innerHTML = [
  ['剩余电阻 Rᵣ', 'resistance'],
  ['电枢电流 Iₐ', 'current'],
  ['转速 n', 'speed'],
  ['反电势 E', 'emf'],
]
  .map(([label, id]) => `<div><span>${label}</span><b id="${id}"></b></div>`)
  .join('');

let state = stateAt(0, 0, false);
let time = 0;
let running = false;
let mode = 'ready';
let lastFrame;
let flowOffset = 0;
let announcedPhase = '';
let manualJump = null;

function showProcess(title, detail) {
  const key = `${title}|${detail}`;
  if (key === announcedPhase) return;
  announcedPhase = key;
  $('phase-title').textContent = title;
  $('phase-detail').textContent = detail;
}

function render() {
  const widestCurrent = Math.max(
    state.current,
    manualJump?.before.current ?? 0,
  );
  const nextMaximum =
    widestCurrent > 36 ? Math.ceil((widestCurrent * 1.1) / 50) * 50 : 36;
  if (axisMaximum !== nextMaximum) {
    axisMaximum = nextMaximum;
    drawGraph();
  }
  const stage = masks.indexOf(state.mask);
  const color = stage >= 0 ? colors[stage] : '#287f70';
  $('active-curve').setAttribute('d', line(state.mask));
  $('active-curve').setAttribute('stroke', color);
  const px = x(state.current);
  const py = y(state.speed);
  for (const id of ['operating-point', 'operating-halo']) {
    $(id).setAttribute('cx', px);
    $(id).setAttribute('cy', py);
    $(id).style.display = state.powered ? '' : 'none';
  }
  $('point-caption').setAttribute('x', px + 12);
  $('point-caption').setAttribute('y', py - 12);
  $('point-caption').textContent =
    state.powered && mode === 'manual' ? '当前' : '';
  let path = 'M30 116H60';
  sections.forEach((_, i) => {
    const closed = Boolean(state.mask & (1 << i));
    const left = 60 + i * 96;
    $(`section-${i}`).classList.toggle('cut', closed);
    $(`q-${i}`).setAttribute('aria-pressed', String(closed));
    $(`blade-${i}`).setAttribute('d', closed ? 'M6 14H54' : 'M6 14L48 3');
    $(`switch-state-${i}`).textContent = closed ? '闭合' : '断开';
    path += closed
      ? `H${left + 9}V76H${left + 87}V116H${left + 96}`
      : `H${left + 96}`;
  });
  path += 'H464V205 M464 255V279H30';
  $('current-flow').setAttribute('d', path);
  $('current-flow').style.opacity = state.powered ? '0.85' : '0';
  $('current-flow').style.strokeDashoffset = String(-flowOffset);
  $('resistance').textContent = `${state.resistance.toFixed(2)} Ω`;
  $('current').textContent = `${state.current.toFixed(1)} A`;
  $('speed').textContent = `${state.speed.toFixed(0)} r/min`;
  $('emf').textContent = `${state.emf.toFixed(1)} V`;
  const closedNames = sections
    .map((_, i) => (state.mask & (1 << i) ? `Q${subscript[i]}` : null))
    .filter(Boolean);
  $('combination').textContent =
    `${closedNames.length ? `${closedNames.join('、')} 闭合` : 'Q₁～Q₄ 均断开'} · Rₐ + Rᵣ = ${state.total.toFixed(2)} Ω${stage < 0 ? ' · 自选机械特性' : ` · 特性 ${names[stage]}`}${state.current > overloadCurrent ? ' · 当前 T > Tᴹ' : ''}`;
  $('power').setAttribute('aria-pressed', String(state.powered));
  $('power').textContent = state.powered ? '手动断开电枢' : '手动接通电枢';
  $('play').textContent = running
    ? '暂停观察'
    : mode === 'auto' && time < duration
      ? '继续分级启动'
      : mode === 'ready'
        ? '自动分级启动'
        : '重新自动启动';
  $('progress').value = String(time / duration);
  $('percent').textContent = `${Math.round((time / duration) * 100)}%`;
  const trace = [];
  if (mode === 'auto') {
    // Add both sides of each discontinuity so every cut is horizontal.
    let boundary = 0;
    const samples = Array.from(
      { length: Math.ceil(time / 0.06) },
      (_, i) => i * 0.06,
    );
    for (const phase of phases) {
      boundary += phase.duration;
      if (boundary <= time)
        samples.push(Math.max(0, boundary - 1e-7), boundary);
    }
    samples.push(time);
    for (const t of samples.sort((a, b) => a - b))
      trace.push(point(automaticState(t)));
  }
  $('trajectory').setAttribute('d', trace.length ? `M${trace.join('L')}` : '');
  $('point-labels').innerHTML =
    mode === 'auto'
      ? masks
          .map((mask, i) => {
            if (i > state.stage) return '';
            const start = stateAt(mask, i === 0 ? 0 : cutSpeeds[i - 1]);
            const end = stateAt(
              mask,
              i === 4 ? motor.ratedSpeed : cutSpeeds[i],
            );
            return `<text class="point-label" x="${x(start.current) + 9}" y="${y(start.speed) + (i === 0 ? -9 : 18)}">${names[i]}₁</text>${state.stage > i || state.kind === 'complete' ? `<text class="point-label" x="${x(end.current) - 26}" y="${y(end.speed) - 8}">${i === 4 ? 'p' : `${names[i]}₂`}</text>` : ''}`;
          })
          .join('')
      : '';
  const jump =
    mode === 'auto' && state.kind === 'switch'
      ? { before: stateAt(masks[state.stage - 1], state.speed), after: state }
      : manualJump;
  $('jump').setAttribute(
    'd',
    jump && state.powered ? `M${point(jump.before)}L${point(jump.after)}` : '',
  );

  if (mode === 'ready') {
    showProcess(
      '① 全部电阻串入，准备启动',
      '点击自动分级启动；也可点击电路开关，自选电阻组合后手动接通电枢。',
    );
  } else if (mode === 'manual') {
    showProcess(
      state.powered
        ? '手动观察 · 当前转速保持不变'
        : '电枢已断开 · 转速复位为零',
      state.powered
        ? '开关切换只改变电阻与电流；点击自动启动可从静止重新演示完整过程。'
        : '独立励磁保持。点击 Q₁～Q₄ 选择组合，对应曲线同步更新。',
    );
  } else if (state.kind === 'complete') {
    showProcess(
      '⑤ 启动完成 · 到达固有特性上的 p 点',
      '全部启动电阻切除，Iₐ = Iᴸ，T = Tᴸ，n = 1500 r/min，进入稳定运行。',
    );
  } else if (state.kind === 'switch') {
    const q = 5 - state.stage;
    showProcess(
      `③ 闭合 Q${subscript[q - 1]}，短接 R${subscript[q - 1]} · ${names[state.stage - 1]}₂ → ${names[state.stage]}₁`,
      `切换瞬间 n 不变，工作点水平向右跳转；Iₐ 从 ${lowerCurrent.toFixed(1)} A 回升至 ${upperCurrent.toFixed(1)} A。`,
    );
  } else {
    showProcess(
      state.kind === 'start'
        ? '① 全部电阻串入 · 在 a₁ 点启动'
        : `② 沿特性 ${names[state.stage]} 加速 · ${names[state.stage]}₁ → ${state.stage === 4 ? 'p' : `${names[state.stage]}₂`}`,
      state.stage === 4
        ? '进入固有特性后继续加速，电流逐渐降至负载电流 Iᴸ。'
        : 'n ↑ → E ↑ → Iₐ、T ↓；当 Iₐ 降到 I₂ 时，自动闭合下一只旁路开关。',
    );
  }
}

function reset() {
  running = false;
  mode = 'ready';
  time = 0;
  flowOffset = 0;
  manualJump = null;
  state = stateAt(0, 0, false);
  render();
}
$('play').addEventListener('click', () => {
  if (running) running = false;
  else {
    if (mode !== 'auto' || time >= duration) time = 0;
    mode = 'auto';
    manualJump = null;
    state = automaticState(time);
    running = true;
  }
  render();
});
$('reset').addEventListener('click', reset);
$('power').addEventListener('click', () => {
  running = false;
  mode = 'manual';
  time = 0;
  manualJump = null;
  state = stateAt(state.mask, 0, !state.powered);
  render();
});
$('progress').addEventListener('input', (event) => {
  running = false;
  mode = 'auto';
  manualJump = null;
  time = Number(event.target.value) * duration;
  state = automaticState(time);
  render();
});
sections.forEach((_, i) => {
  const button = $(`q-${i}`);
  button.addEventListener('click', () => {
    running = false;
    mode = 'manual';
    time = 0;
    const before = state;
    state = stateAt(state.mask ^ (1 << i), state.speed, state.powered);
    manualJump = state.powered ? { before, after: state } : null;
    render();
  });
  for (const type of ['touchstart', 'touchend'])
    button.addEventListener(type, (event) => event.stopPropagation(), {
      passive: true,
    });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    running = false;
    render();
  }
});
function frame(now) {
  const dt =
    lastFrame === undefined ? 0 : Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (running) {
    time = Math.min(duration, time + dt);
    state = automaticState(time);
    flowOffset += dt * Math.min(60, state.current * 1.5);
    if (time >= duration) running = false;
    render();
  }
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
