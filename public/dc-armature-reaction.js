import {
  ArmatureReactionSimulation,
  armatureReactionParameters,
} from './dc-armature-reaction-model.js';

const simulation = new ArmatureReactionSimulation();
const $ = (id) => document.getElementById(id);
const blue = '#2d72c4';
const blueSoft = '#74a6df';
const ink = '#173b3b';
const copper = '#bd7236';
const orange = '#c27532';
const trackedGold = '#d7a62b';

const point = (cx, cy, radius, degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy - radius * Math.sin(radians)];
};

const signed = (value, digits = 1) =>
  `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;

function label(x, y, copy, options = '') {
  return `<text x="${x}" y="${y}" ${options}>${copy}</text>`;
}

function arcPath(cx, cy, radius, start, end) {
  const from = point(cx, cy, radius, start);
  const to = point(cx, cy, radius, end);
  return `M${from[0]} ${from[1]}A${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 0 ${to[0]} ${to[1]}`;
}

function conductorSymbol(x, y, into, active, tracked) {
  const colour = into ? '#356eaf' : '#c45c49';
  let svg = `<circle cx="${x}" cy="${y}" r="${tracked ? 10 : 8}" fill="#fff" stroke="${active ? colour : '#9aa8a3'}" stroke-width="${tracked ? 3 : 2}"/>`;
  if (!active) return svg;
  svg += into
    ? `<path d="M${x - 4} ${y - 4}l8 8m0-8l-8 8" stroke="${colour}" stroke-width="2.4"/>`
    : `<circle cx="${x}" cy="${y}" r="3.2" fill="${colour}"/>`;
  return tracked
    ? `${svg}<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#e4a744" stroke-width="2" stroke-dasharray="3 3"/>`
    : svg;
}

function renderFieldLines(state, cx, cy) {
  const active = state.resultantField > 0.001;
  if (!active)
    return label(
      cx,
      cy - 8,
      '无励磁、Iₐ = 0：气隙磁场为 0',
      'text-anchor="middle" fill="#71867f" font-size="16" font-weight="700"',
    );

  const weight = Math.min(1.4, state.resultantField);
  let svg = '';
  if (state.mainField > 0) {
    const bow = state.armatureField * 82;
    for (let index = -3; index <= 3; index++) {
      const x = cx + index * 29;
      const edgeBias = index * state.armatureField * 4.5;
      svg += `<path d="M${x - bow * 0.25} ${cy - 173}C${x + bow + edgeBias} ${cy - 94},${x - bow + edgeBias} ${cy + 94},${x + bow * 0.25} ${cy + 173}" fill="none" stroke="${blue}" stroke-width="${(1.7 + weight + (index < 0 ? state.armatureField : -state.armatureField) * 0.8).toFixed(2)}" opacity="${0.64 + (3 - Math.abs(index)) * 0.055}" marker-end="url(#field-arrow)"/>`;
    }
  }

  if (state.armatureField > 0.001) {
    const opacity = 0.25 + state.armatureField * 0.65;
    for (let index = 0; index < 3; index++) {
      const halfWidth = 137 + index * 13;
      const innerReach = 72 - index * 20;
      const poleReach = 158 + index * 19;
      const left = cx - halfWidth;
      const right = cx + halfWidth;
      const upperOuter = cy - poleReach;
      const upperInner = cy - innerReach;
      const upperMiddle = (upperOuter + upperInner) / 2;
      const lowerOuter = cy + poleReach;
      const lowerInner = cy + innerReach;
      const lowerMiddle = (lowerOuter + lowerInner) / 2;
      const horizontalControl = halfWidth * 0.62;
      const upperTangent = (upperInner - upperOuter) * 0.28;
      const lowerTangent = (lowerOuter - lowerInner) * 0.28;

      // Each armature-field line is a four-quadrant closed loop. Increasing
      // index expands every boundary outwards, so the loops remain nested
      // without self-intersection or crossing one another.
      svg += `<path d="M${right} ${upperMiddle}C${right} ${upperMiddle - upperTangent},${cx + horizontalControl} ${upperOuter},${cx} ${upperOuter}C${cx - horizontalControl} ${upperOuter},${left} ${upperMiddle - upperTangent},${left} ${upperMiddle}C${left} ${upperMiddle + upperTangent},${cx - horizontalControl} ${upperInner},${cx} ${upperInner}C${cx + horizontalControl} ${upperInner},${right} ${upperMiddle + upperTangent},${right} ${upperMiddle}Z" fill="none" stroke="${blueSoft}" stroke-width="2" stroke-dasharray="7 6" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" marker-end="url(#armature-arrow)"/>`;

      // The lower family mirrors the geometry and reverses circulation.
      svg += `<path d="M${left} ${lowerMiddle}C${left} ${lowerMiddle + lowerTangent},${cx - horizontalControl} ${lowerOuter},${cx} ${lowerOuter}C${cx + horizontalControl} ${lowerOuter},${right} ${lowerMiddle + lowerTangent},${right} ${lowerMiddle}C${right} ${lowerMiddle - lowerTangent},${cx + horizontalControl} ${lowerInner},${cx} ${lowerInner}C${cx - horizontalControl} ${lowerInner},${left} ${lowerMiddle - lowerTangent},${left} ${lowerMiddle}Z" fill="none" stroke="${blueSoft}" stroke-width="2" stroke-dasharray="7 6" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" marker-end="url(#armature-arrow)"/>`;
    }
  }
  return svg;
}

function renderCommutator(angle, currentActive, commutation) {
  const cx = 690;
  const cy = 336;
  const radius = 54;
  const highlighted = new Set(
    commutation.shorted
      ? [...commutation.rightSegments, ...commutation.leftSegments]
      : [],
  );
  const trackedSegments = new Set(
    armatureReactionParameters.trackedCoilSegments,
  );
  const trackedShorted = simulation.state.trackedCoilShorted;
  let svg = `<g aria-label="与转子同步旋转的十二片换向器，C1 和 C2 接线圈 A-B，${trackedShorted ? 'C1 和 C2 正在被同一电刷短接' : 'C1 和 C2 当前没有被同一电刷短接'}">`;
  svg += `<circle cx="${cx}" cy="${cy}" r="66" fill="#f7f2e7" stroke="#d7c49e"/>`;
  for (let index = 0; index < 12; index++) {
    const start = angle + index * 30 + 2;
    const end = angle + (index + 1) * 30 - 2;
    const isShorted = highlighted.has(index);
    const isTracked = trackedSegments.has(index);
    const colour =
      isShorted && isTracked
        ? '#ed6f2d'
        : isShorted
          ? '#f0a33a'
          : isTracked
            ? trackedGold
            : currentActive
              ? copper
              : '#b8b8b1';
    svg += `<path d="${arcPath(cx, cy, radius, start, end)}" fill="none" stroke="${colour}" stroke-width="${isShorted && isTracked ? 21 : isShorted || isTracked ? 18 : 15}" ${isShorted ? 'filter="url(#commutation-glow)"' : ''}/>`;
  }
  for (const [
    position,
    segment,
  ] of armatureReactionParameters.trackedCoilSegments.entries()) {
    const p = point(cx, cy, radius, angle + (segment + 0.5) * 30);
    svg += label(
      p[0],
      p[1] + 3,
      `C${position + 1}`,
      'text-anchor="middle" fill="#fff" font-size="8" font-weight="800"',
    );
  }
  svg += `<circle cx="${cx}" cy="${cy}" r="15" fill="#dbe5df" stroke="#55736d" stroke-width="3"/>`;
  const marker = point(cx, cy, 35, angle);
  svg += `<path d="M${cx} ${cy}L${marker[0]} ${marker[1]}" stroke="#fff" stroke-width="4"/>`;
  const brushFill = commutation.shorted ? '#ef8f2f' : ink;
  const brushStroke = commutation.shorted ? '#fff1ca' : 'none';
  svg += `<rect x="${cx - 80}" y="${cy - 13}" width="25" height="26" rx="4" fill="${brushFill}" stroke="${brushStroke}" stroke-width="3"/><rect x="${cx + 55}" y="${cy - 13}" width="25" height="26" rx="4" fill="${brushFill}" stroke="${brushStroke}" stroke-width="3"/>`;
  svg += label(
    cx,
    cy + 86,
    '换向片 ↺ 与转子同相位',
    'text-anchor="middle" fill="#55736d" font-size="13"',
  );
  svg += label(
    cx,
    commutation.shorted ? cy - 112 : cy - 78,
    '固定电刷',
    'text-anchor="middle" fill="#55736d" font-size="13"',
  );
  if (commutation.shorted) {
    svg += `<rect x="${cx - 69}" y="${cy - 105}" width="138" height="23" rx="11.5" fill="#fff0d4" stroke="#ef9a32"/>`;
    svg += label(
      cx,
      cy - 89,
      trackedShorted ? 'A–B 接片短接 · q_AB = 1' : '其他线圈换向 · q_AB = 0',
      'text-anchor="middle" fill="#a85c1f" font-size="12" font-weight="700"',
    );
  }
  return `${svg}</g>`;
}

function renderMachine() {
  const state = simulation.state;
  const cx = 326;
  const cy = 236;
  const currentActive = state.current > 0.5;
  let svg = `<defs>
    <marker id="field-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="${blue}"/></marker>
    <marker id="armature-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="${blueSoft}"/></marker>
    <marker id="rotation-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="#b75b32"/></marker>
    <filter id="commutation-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="rotor-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7f4e8"/><stop offset="1" stop-color="#dbe7e1"/></linearGradient>
  </defs>`;

  svg += `<circle cx="${cx}" cy="${cy}" r="215" fill="#f6faf8" stroke="#9bb5ac" stroke-width="3"/>`;
  svg += `<path d="M${cx - 148} ${cy - 205}Q${cx} ${cy - 254} ${cx + 148} ${cy - 205}L${cx + 126} ${cy - 145}Q${cx} ${cy - 190} ${cx - 126} ${cy - 145}Z" fill="${state.mainField ? '#ead8cf' : '#e3e6e3'}" stroke="#8e5c55" stroke-width="2"/>`;
  svg += `<path d="M${cx - 148} ${cy + 205}Q${cx} ${cy + 254} ${cx + 148} ${cy + 205}L${cx + 126} ${cy + 145}Q${cx} ${cy + 190} ${cx - 126} ${cy + 145}Z" fill="${state.mainField ? '#d8e5ee' : '#e3e6e3'}" stroke="#527089" stroke-width="2"/>`;
  svg += label(
    cx,
    cy - 186,
    'N',
    'text-anchor="middle" fill="#a9433d" font-size="28" font-weight="800"',
  );
  svg += label(
    cx,
    cy + 207,
    'S',
    'text-anchor="middle" fill="#356eaf" font-size="28" font-weight="800"',
  );

  for (const side of [-1, 1]) {
    const x = cx + side * 185;
    for (let index = -2; index <= 2; index++) {
      svg += `<rect x="${x - 9}" y="${cy - 62 + index * 25}" width="18" height="18" rx="5" fill="${state.mainField ? '#b96b4c' : '#b8beb9'}"/>`;
    }
  }
  svg += label(
    66,
    50,
    state.mainField ? '励磁 I_f：ON' : '励磁 I_f：OFF',
    `fill="${state.mainField ? '#39796f' : '#8b9892'}" font-size="14" font-weight="700"`,
  );
  svg += `<circle cx="${cx}" cy="${cy}" r="127" fill="url(#rotor-metal)" stroke="#55736d" stroke-width="3"/>`;
  svg += renderFieldLines(state, cx, cy);

  const neutralAngle = state.neutralAngle ?? 90;
  const neutralA = point(cx, cy, 190, neutralAngle);
  const neutralB = point(cx, cy, 190, neutralAngle + 180);
  svg += `<path d="M${neutralA[0]} ${neutralA[1]}L${neutralB[0]} ${neutralB[1]}" stroke="${orange}" stroke-width="2.5" stroke-dasharray="8 6"/>`;
  svg += label(
    neutralA[0] - 8,
    neutralA[1] - 8,
    state.neutralShift === null
      ? '仅示交轴'
      : `物理中性线 ${state.neutralShift.toFixed(1)}°`,
    'text-anchor="end" fill="#a35d27" font-size="13" font-weight="700"',
  );

  svg += `<g transform="rotate(${-simulation.angle} ${cx} ${cy})">`;
  const trackedSidePoints = armatureReactionParameters.trackedCoilSides.map(
    (slot) => point(cx, cy, 108, slot * 30),
  );
  svg += `<path d="M${trackedSidePoints[0][0]} ${trackedSidePoints[0][1]}L${trackedSidePoints[1][0]} ${trackedSidePoints[1][1]}" stroke="${trackedGold}" stroke-width="5" stroke-dasharray="7 5" opacity="0.78"/>`;
  for (let index = 0; index < 12; index++) {
    const slotAngle = index * 30;
    const p = point(cx, cy, 108, slotAngle);
    const into = Math.sin(((slotAngle + simulation.angle) * Math.PI) / 180) < 0;
    const trackedPosition =
      armatureReactionParameters.trackedCoilSides.indexOf(index);
    svg += conductorSymbol(
      p[0],
      p[1],
      into,
      currentActive,
      trackedPosition >= 0,
    );
    if (trackedPosition >= 0)
      svg += label(
        p[0],
        p[1] - 17,
        trackedPosition === 0 ? 'A' : 'B',
        `text-anchor="middle" fill="${trackedGold}" font-size="13" font-weight="800"`,
      );
  }
  for (let index = 0; index < 6; index++) {
    const p1 = point(cx, cy, 80, index * 30);
    const p2 = point(cx, cy, 80, index * 30 + 180);
    svg += `<path d="M${p1[0]} ${p1[1]}L${p2[0]} ${p2[1]}" stroke="#b9c7c1" stroke-width="2"/>`;
  }
  svg += `</g>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="19" fill="#496961"/><circle cx="${cx}" cy="${cy}" r="7" fill="#f7f2e7"/>`;
  svg += `<path d="${arcPath(cx, cy, 143, 18, 105)}" fill="none" stroke="#b75b32" stroke-width="3" marker-end="url(#rotation-arrow)"/>`;
  svg += label(
    cx + 92,
    cy - 115,
    '恒速 ↺',
    'fill="#b75b32" font-size="15" font-weight="700"',
  );
  svg += label(
    cx - 110,
    cy + 12,
    '几何中性线',
    'fill="#71867f" font-size="12"',
  );
  svg += `<path d="M${cx - 170} ${cy}H${cx + 170}" stroke="#9badb6" stroke-width="1.5" stroke-dasharray="4 5"/>`;

  svg += renderCommutator(simulation.angle, currentActive, state.commutation);
  svg += `<path d="M452 306C512 319 548 326 615 332" fill="none" stroke="#9aadad" stroke-dasharray="4 5"/>`;
  svg += label(
    578,
    286,
    `θ = ${simulation.angle.toFixed(0)}°`,
    'fill="#55736d" font-size="13"',
  );
  $('machine').innerHTML = svg;
  $('machine').setAttribute(
    'aria-label',
    `两极直流电机剖面，金色高亮线圈 A-B 及其换向片 C1、C2；转子相位 ${simulation.angle.toFixed(0)} 度，${state.trackedCoilShorted ? 'C1 和 C2 正在被同一电刷短接' : 'C1 和 C2 当前未被同一电刷短接'}`,
  );
}

function renderScope() {
  const state = simulation.state;
  const left = 46;
  const right = 497;
  const top = 10;
  const emfBottom = 103;
  const emfMiddle = (top + emfBottom) / 2;
  const flagTop = 116;
  const flagBottom = 145;
  const emfRange = 90;
  const duration = armatureReactionParameters.windowSeconds;
  const start = Math.max(0, simulation.elapsed - duration);
  const end = start + duration;
  const x = (time) => left + ((time - start) / duration) * (right - left);
  const emfY = (value) =>
    emfMiddle - (value / emfRange) * ((emfBottom - top) / 2);
  const flagY = (value) => (value ? flagTop + 5 : flagBottom - 5);
  let svg = `<defs><clipPath id="scope-clip"><rect x="${left}" y="${top}" width="${right - left}" height="${flagBottom - top}" rx="5"/></clipPath></defs><rect x="${left}" y="${top}" width="${right - left}" height="${emfBottom - top}" rx="5" fill="#f4f8f6"/><rect x="${left}" y="${flagTop}" width="${right - left}" height="${flagBottom - flagTop}" rx="4" fill="#fff7e8"/>`;
  for (const value of [-90, -45, 0, 45, 90]) {
    svg += `<path d="M${left} ${emfY(value)}H${right}" stroke="${value === 0 ? '#8da29a' : '#dce7e2'}" ${value === 0 ? '' : 'stroke-dasharray="3 4"'}/>`;
    svg += label(
      2,
      emfY(value) + 4,
      String(value),
      'fill="#607870" font-size="10"',
    );
  }
  for (let index = 0; index <= 8; index++) {
    const time = start + (duration * index) / 8;
    svg += `<path d="M${x(time)} ${top}V${flagBottom}" stroke="#e1eae6"/>`;
    if (index % 2 === 0)
      svg += label(
        x(time) - 9,
        166,
        time.toFixed(1),
        'fill="#607870" font-size="10"',
      );
  }
  const trace = simulation.samples
    .map(
      (sample, index) =>
        `${index ? 'L' : 'M'}${x(sample.t).toFixed(2)} ${emfY(sample.emf).toFixed(2)}`,
    )
    .join(' ');
  const flagTrace = simulation.samples.reduce(
    (path, sample, index, samples) => {
      const xx = x(sample.t).toFixed(2);
      const yy = flagY(sample.shorted).toFixed(2);
      if (index === 0) return `M${xx} ${yy}`;
      const previousY = flagY(samples[index - 1].shorted).toFixed(2);
      return `${path}H${xx}V${yy === previousY ? previousY : yy}`;
    },
    '',
  );
  svg += `<g clip-path="url(#scope-clip)"><path d="${trace}" fill="none" stroke="${blue}" stroke-width="2.5"/><path d="${flagTrace}" fill="none" stroke="${orange}" stroke-width="2.3"/><path d="M${x(simulation.elapsed)} ${top}V${flagBottom}" stroke="#8da29a" stroke-dasharray="4 4"/></g>`;
  svg += `<circle cx="${x(simulation.elapsed)}" cy="${emfY(state.emf)}" r="4.5" fill="${blue}"/>`;
  svg += `<rect x="${x(simulation.elapsed) - 3.5}" y="${flagY(state.trackedCoilShorted) - 3.5}" width="7" height="7" rx="1" fill="${orange}"/>`;
  svg += label(18, flagY(1) + 4, '1', 'fill="#a85c1f" font-size="10"');
  svg += label(18, flagY(0) + 4, '0', 'fill="#a85c1f" font-size="10"');
  svg += label(
    2,
    flagTop + 18,
    'q_AB',
    'fill="#a85c1f" font-size="11" font-weight="700"',
  );
  svg += label(500, 166, 's', 'fill="#607870" font-size="10"');
  $('scope').innerHTML = svg;
  $('scope').setAttribute(
    'aria-label',
    `最近十二秒线圈 A-B 的反电势与自身换向片短接标志波形，当前反电势 ${signed(state.emf)} 伏，q A B 等于 ${state.trackedCoilShorted ? 1 : 0}，${simulation.paused ? '动画已暂停并保持读数' : '动画运行中'}`,
  );
}

function renderReadings() {
  const state = simulation.state;
  $('current-reading').textContent = `${state.current.toFixed(0)} A`;
  $('field-state').innerHTML = state.mainField
    ? '已接通 · I<sub>f</sub> = 额定值'
    : '已断开 · I<sub>f</sub> = 0';
  $('armature-field-reading').textContent =
    `${state.armatureField.toFixed(2)} p.u.`;
  $('neutral-reading').textContent =
    state.neutralShift === null
      ? '不定义'
      : `${state.neutralShift.toFixed(1)}°`;
  $('animation-state').textContent = simulation.paused
    ? '快照保持'
    : state.trackedCoilShorted
      ? 'A–B 换向'
      : '运行中';
  $('emf-reading').textContent = `${signed(state.emf)} V`;
  $('scope-clock').textContent =
    `最近 12 s · t = ${simulation.elapsed.toFixed(1)} s${simulation.paused ? ' · 快照' : ''}`;
  $('pause').textContent = simulation.paused ? '继续动画 P' : '暂停动画 P';
  $('pause').setAttribute('aria-pressed', String(simulation.paused));
  $('field-switch').disabled = simulation.paused;
  $('armature-current').disabled = simulation.paused;
  $('pause-note').classList.toggle('paused', simulation.paused);
  $('pause-note').textContent = simulation.paused
    ? `快照保持：电机仍按 5 r/min 运行；此刻 e_AB = ${signed(state.emf)} V、q_AB = ${state.trackedCoilShorted ? 1 : 0}。`
    : '按 P 或按钮暂停。暂停冻结转子、换向片、读数与波形；它不是把电机转速降为 0。';
  $('explanation').innerHTML = state.mainField
    ? 'I<sub>a</sub> 增大 → 交轴磁场增强 → 一侧极尖增磁、另一侧去磁 → 物理中性线偏移。'
    : state.current > 0
      ? '励磁断开后主磁场消失；蓝色虚线仅表示电枢磁场，此时不能按正常励磁工况定义物理中性线。'
      : '励磁与电枢电流都为 0，气隙内没有建立磁场。';
}

function renderAll() {
  renderMachine();
  renderScope();
  renderReadings();
}

function togglePause() {
  simulation.paused = !simulation.paused;
  renderAll();
}

$('pause').addEventListener('click', togglePause);
$('field-switch').addEventListener('change', () => {
  simulation.setFieldEnabled($('field-switch').checked);
  renderAll();
});
$('armature-current').addEventListener('input', () => {
  simulation.setArmatureCurrent(Number($('armature-current').value));
  renderAll();
});

document.addEventListener('keydown', (event) => {
  if (
    event.key.toLowerCase() !== 'p' ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  togglePause();
});

let previousTimestamp;
function frame(timestamp) {
  if (previousTimestamp === undefined) previousTimestamp = timestamp;
  const dt = Math.min(0.05, (timestamp - previousTimestamp) / 1000);
  previousTimestamp = timestamp;
  if (!simulation.paused) {
    simulation.advance(dt);
    renderAll();
  }
  requestAnimationFrame(frame);
}

renderAll();
requestAnimationFrame(frame);
