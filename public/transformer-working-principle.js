import {
  CUE_STARTS,
  STAGE_DURATION,
  transformerFrame,
  transformerMmfArrows,
} from './transformer-working-principle-model.mjs';

// Sign convention: terminal voltages are positive at the dotted ends;
// i1 enters the primary dot and i2 leaves the secondary dot.
// Faraday emf is measured around each winding in the dot-entering direction.
// Background: MIT Open Learning Library, 3.15.3x, Tutorial #2, Transformers:
// https://openlearninglibrary.mit.edu/courses/course-v1%3AMITx%2B3.15.3x%2B2T2017/courseware/c4cf31e00b0b4ee8b89bc9515cb451ae/5791928e9f1f4f7089068a0a3548f4ca/
const stages = [
  {
    title: '先由电压确定磁通的变化',
    body: `<p>每匝 e<sub>匝</sub> = −dΦ/dt；N₁ 匝串联，<strong>e₁ = N₁e<sub>匝</sub></strong>。</p>
      <div class="formula">u₁ ≈ −e₁ = N₁ dΦ/dt<br>Φ(t) = Φ(0) + (1/N₁)∫₀ᵗ u₁(τ)dτ</div>
      <p>空载 i₂ = 0，一次侧仍有励磁电流 i₀。<br>磁动势 F₁ = N₁i₀，故 <strong>Φ = N₁i₀ / ℜ</strong>。</p>
      <p class="note">ℜ 为磁阻。磁路固定且未饱和时，i₀ ∝ Φ；正弦稳态下，Φ 滞后 u₁ 四分之一周期。</p>`,
    takeaway: '电压积分对应每匝磁通：先除以匝数 N₁，再对时间积分。',
  },
  {
    title: '同一主磁通，在两侧感应电压',
    body: `<p>主磁通 Φ 随时间变化，穿过二次侧每一匝；<strong>每匝感应电动势相同</strong>，串联后相加。</p>
      <div class="formula">e₂ = N₂e<sub>匝</sub> = −N₂ dΦ/dt<br>U₂ ≈ E₂，U₂ / U₁ ≈ N₂ / N₁</div>
      <p><strong>开路也有电压</strong>，但回路未接通，i₂ = 0。改变匝数比，即可升压或降压。</p>
      <p class="note">U、E 表示有效值。圆点为同名端，u₁、u₂以上端为正；按绕组回路方向定义 e，瞬时 u₂ ≈ −e₂。</p>`,
    takeaway: '主磁通把两侧耦合起来：电压比近似等于匝数比。',
  },
  {
    title: '二次侧去磁，一次侧增流补偿',
    body: `<p>接通电阻负载，u₂ 使 i₂ 流动；<strong>N₂i₂ 产生去磁作用</strong>，趋向削弱原有主磁通。</p>
      <p>Φ 的变化使一次侧反电动势暂时减小，i₁ 随之增加；新增磁动势补偿二次侧去磁作用。</p>
      <div class="formula">N₁i₁ − N₂i₂ ≈ ℜΦ = N₁i₀<br>i₁ ≈ i₀ + Δi₁，Δi₁ = (N₂/N₁)i₂</div>
      <p class="note">周期稳态下，N₁i₁ 与 N₂i₂ 大部分抵消，剩余 N₁i₀ 建立主磁通；电压、频率不变时，Φ 幅值近似不变。</p>`,
    takeaway: '负载越重，一次侧供给的电流越大；主磁通由两侧磁动势合成。',
  },
  {
    title: '按交链范围，分清三部分磁通',
    body: `<div class="flux-row"><b>Φ</b><span><strong>主磁通</strong>：同时交链两侧绕组，负责电磁耦合。</span></div>
      <div class="flux-row"><b>Φσ₁</b><span><strong>一次侧漏磁通</strong>：由 i₁ 产生，仅交链一次侧 → 漏感 Lσ₁。</span></div>
      <div class="flux-row"><b>Φσ₂</b><span><strong>二次侧漏磁通</strong>：由 i₂ 产生，仅交链二次侧 → 漏感 Lσ₂。</span></div>
      <p>两侧电流各有主磁通分量与漏磁通；<strong>两侧主磁通分量叠加为图中 Φ</strong>。</p>
      <p class="note">主磁通主要沿磁芯；漏磁通的闭合路径部分经过空气。仅交链本侧为工程近似，漏感带来电抗压降。</p>`,
    takeaway: '主磁通同时交链两侧；漏磁通分别交链本侧，形成两侧漏感。',
  },
];

const lesson = document.querySelector('.lesson');
const buttons = [...document.querySelectorAll('.stages button')];
const svgNamespace = 'http://www.w3.org/2000/svg';
const byId = (id) => document.getElementById(id);
let stage = 0;
let phase = Math.PI / 4;
let paused = false;
let visible = true;
let lastTime = null;
let animation = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Respect the initial preference, while allowing explicit teaching playback.
let motionAllowed = !reducedMotion.matches;
let elapsed = 0;
let lastCue = -1;
const cues = [
  [
    '施加交流电压 u₁，逐匝标示一次侧电动势',
    '磁通沿闭合磁芯建立，励磁电流开始交变',
    '各匝电动势相加：e₁ = N₁ e匝',
    '电压积分确定 Φ；线性磁路中 i₀ ∝ Φ',
  ],
  [
    '跟随主磁通：同一 Φ 穿过两侧绕组',
    '逐匝标示 e匝（各匝实际同时感应）',
    '将 N₂ 匝电动势相加，形成 e₂',
    '二次侧端电压建立；开路仍然 i₂ = 0',
  ],
  [
    '二次侧尚未接通，先观察空载状态',
    '闭合开关：i₂ 出现，二次侧磁动势去磁',
    '一次侧电流增大，新增磁动势逐渐补偿',
    '补偿完成：主磁通恢复，进入周期稳态',
  ],
  [
    '沿磁芯描出主磁通：同时交链两侧',
    '描出一次侧漏磁通：仅交链一次侧',
    '描出二次侧漏磁通：仅交链二次侧',
    '三部分同时显示：主磁通是两侧作用的合成',
  ],
];
const callouts = [
  [
    ['一次侧逐匝标示', '每匝 e匝'],
    ['交流励磁', 'F₁ = N₁ i₀'],
    ['串联求和', 'e₁ = N₁ e匝'],
    ['线性磁路', 'Φ = N₁ i₀ / ℜ'],
  ],
  [
    ['共同的主磁通', '同时交链两侧'],
    ['各匝同时感应', '逐匝标示 e匝'],
    ['串联求和', 'e₂ = N₂ e匝'],
    ['开路有电压', 'i₂ = 0'],
  ],
  [],
  [
    ['主磁通 Φ', '同时交链两侧'],
    ['一次侧 Φσ₁', '仅交链一次侧'],
    ['二次侧 Φσ₂', '仅交链二次侧'],
    ['两侧共同作用', '合成主磁通 Φ'],
  ],
];
const revealTimes = [
  [0, 1800, 5000, 8500],
  [0, 5600, 8700, 8700],
  [2200, 5000, 8500, 8500],
  [0, 3000, 6000, 9000, 9000],
];

// The rear return segments are dashed so each turn visibly wraps a core limb.
for (const [id, x, turns] of [
  ['primary-coil', 209, 8],
  ['secondary-coil', 521, 4],
]) {
  const direction = id === 'primary-coil' ? 1 : -1;
  const pitch = 126 / turns;
  for (let turn = 0; turn < turns; turn++) {
    const y = 127 + turn * pitch;
    const front = document.createElementNS(svgNamespace, 'path');
    front.setAttribute(
      'd',
      `M${x} ${y} C${x + direction * 68} ${y - 8},${x + direction * 68} ${y + pitch + 8},${x} ${y + pitch}`,
    );
    front.setAttribute('class', 'coil');
    const back = document.createElementNS(svgNamespace, 'path');
    back.setAttribute(
      'd',
      `M${x} ${y} Q${x - direction * 18} ${y + pitch / 2},${x} ${y + pitch}`,
    );
    back.setAttribute('class', 'coil coil-back');
    byId(id).append(back, front);
  }
}

for (const [id, signal] of [
  ['voltage-wave', Math.cos],
  ['flux-wave', Math.sin],
]) {
  byId(id).setAttribute(
    'd',
    Array.from({ length: 161 }, (_, index) => {
      const angle = (index / 160) * Math.PI * 2;
      return `${index ? 'L' : 'M'}${12 + (index / 160) * 414} ${43 - 29 * signal(angle)}`;
    }).join(' '),
  );
}

function createMarkers(id, count, color, arrows = false) {
  return Array.from({ length: count }, () => {
    const marker = document.createElementNS(
      svgNamespace,
      arrows ? 'path' : 'circle',
    );
    marker.setAttribute('fill', color);
    if (arrows) marker.setAttribute('d', 'M-6 -4 4 0 -6 4Z');
    else marker.setAttribute('r', '4');
    byId(id).append(marker);
    return marker;
  });
}
function circuitPath(primary) {
  const path = document.createElementNS(svgNamespace, 'path');
  const x = primary ? 209 : 521;
  const count = primary ? 8 : 4;
  const pitch = 126 / count;
  const direction = primary ? 1 : -1;
  let d = primary ? 'M107 127H209' : 'M521 127H656V253H521';
  for (let index = 0; index < count; index++) {
    const y = primary ? 127 + index * pitch : 253 - index * pitch;
    const end = y + (primary ? pitch : -pitch);
    d += `C${x + direction * 68} ${y + (primary ? -8 : 8)},${x + direction * 68} ${end + (primary ? 8 : -8)},${x} ${end}`;
  }
  d += primary ? 'H107V210A26 26 0 0 1 107 158V127' : '';
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'none');
  byId('animation-overlay').prepend(path);
  return path;
}
const primaryPath = circuitPath(true);
const secondaryPath = circuitPath(false);
const primaryMarkers = createMarkers('primary-flow', 10, '#c68b46');
const secondaryMarkers = createMarkers('secondary-flow', 9, '#3f9d87');
const fluxMarkers = createMarkers('flux-markers', 7, '#466f99', true);
const primaryLeakMarkers = createMarkers(
  'primary-leak-markers',
  3,
  '#7c68a6',
  true,
);
const secondaryLeakMarkers = createMarkers(
  'secondary-leak-markers',
  3,
  '#bc8a32',
  true,
);
const mainPath = byId('flux-trace');
const primaryTurns = [
  ...byId('primary-coil').querySelectorAll('.coil:not(.coil-back)'),
];
const secondaryTurns = [
  ...byId('secondary-coil').querySelectorAll('.coil:not(.coil-back)'),
];
byId('primary-particle').setAttribute('hidden', '');
byId('secondary-particle').setAttribute('hidden', '');

function placeMarkers(
  path,
  markers,
  travel,
  strength,
  trace = 1,
  arrows = false,
) {
  const length = path.getTotalLength();
  markers.forEach((marker, index) => {
    const distance =
      ((((index / markers.length) * length + travel) % length) + length) %
      length;
    const point = path.getPointAtLength(distance);
    const next = path.getPointAtLength((distance + 0.5) % length);
    const angle =
      (Math.atan2(next.y - point.y, next.x - point.x) * 180) / Math.PI +
      (strength < 0 ? 180 : 0);
    marker.setAttribute(
      'transform',
      `translate(${point.x} ${point.y})${arrows ? ` rotate(${angle})` : ''}`,
    );
    marker.style.opacity = String(
      distance / length <= trace ? Math.min(1, Math.abs(strength) * 3) : 0,
    );
  });
}

function draw() {
  const state = transformerFrame(stage, elapsed, phase);
  const flux = state.flux;
  const loadCurrent = state.i2;
  const primaryCurrent = state.i1;
  lesson.dataset.cue = String(state.cue);
  lesson.dataset.complete = String(elapsed >= STAGE_DURATION);
  byId('main-flux').style.opacity = String(
    state.trace * (0.15 + 0.5 * Math.abs(flux)),
  );
  byId('flux-trace').style.strokeDashoffset = String(1 - state.trace);
  byId('flux-trace').style.opacity = String(0.25 + 0.6 * Math.abs(flux));
  byId('flux-trace').style.strokeWidth = String(2 + 4 * Math.abs(flux));
  byId('source-highlight').style.opacity = String(
    stage === 0 ? 0.35 + 0.4 * Math.abs(Math.cos(phase)) : 0,
  );
  byId('opposing-flux').style.opacity = String(
    stage === 2 ? 0.7 * state.load * (1 - 0.7 * state.compensation) : 0,
  );
  byId('opposing-flux').style.strokeDashoffset = String(
    -0.06 * Math.sin(phase),
  );
  byId('main-flux').setAttribute('stroke-dashoffset', String(-26 * flux));
  byId('flux-direction').setAttribute(
    'd',
    flux >= 0 ? 'M326 72H399' : 'M399 72H326',
  );
  byId('flux-direction').style.opacity = String(
    state.trace * Math.min(1, Math.abs(flux) * 4),
  );
  byId('primary-current').setAttribute(
    'd',
    primaryCurrent >= 0 ? 'M137 127H179' : 'M179 127H137',
  );
  byId('secondary-current').setAttribute(
    'd',
    loadCurrent >= 0 ? 'M615 127H644' : 'M644 127H615',
  );
  placeMarkers(
    primaryPath,
    primaryMarkers,
    -32 * state.fluxScale * Math.cos(phase) +
      80 * state.compensation * Math.sin(phase),
    primaryCurrent,
  );
  placeMarkers(
    secondaryPath,
    secondaryMarkers,
    100 * state.load * Math.sin(phase),
    loadCurrent,
  );
  placeMarkers(
    mainPath,
    fluxMarkers,
    -60 * state.fluxScale * Math.cos(phase),
    flux,
    state.trace,
    true,
  );
  placeMarkers(
    byId('primary-leak-path'),
    primaryLeakMarkers,
    -16 * state.fluxScale * Math.cos(phase) +
      40 * state.compensation * Math.sin(phase),
    primaryCurrent,
    state.primaryLeak,
    true,
  );
  placeMarkers(
    byId('secondary-leak-path'),
    secondaryLeakMarkers,
    40 * Math.sin(phase),
    loadCurrent,
    state.secondaryLeak,
    true,
  );
  byId('primary-flow').style.opacity = String(state.excitation);
  byId('secondary-flow').style.opacity = String(state.load);
  byId('primary-current').style.opacity = String(state.excitation);
  byId('primary-current-label').style.opacity = String(state.excitation);
  byId('primary-emf').style.opacity = String(
    stage === 0 && state.cue < 2 ? 0.2 : 1,
  );
  byId('secondary-emf').style.opacity = String(state.emf);
  byId('secondary-voltage').style.opacity = String(
    stage === 1 ? Math.max(0, (elapsed - 5600) / 3100) : stage >= 2 ? 1 : 0.15,
  );
  byId('load-resistor').classList.toggle('load-active', state.load > 0);
  byId('primary-current-label').textContent =
    (stage === 2 && !state.switchClosed) || stage < 2 ? 'i₀' : 'i₁';
  byId('load-switch').setAttribute(
    'd',
    state.switchClosed ? 'M573 127H606' : 'M573 127 603 105',
  );
  byId('secondary-current-group').toggleAttribute(
    'hidden',
    !state.switchClosed,
  );
  byId('mmf').toggleAttribute('hidden', stage !== 2);
  const mmf = transformerMmfArrows(state);
  byId('primary-mmf-arrow').setAttribute(
    'd',
    `M${mmf.primaryStart} 191H${mmf.primaryEnd}`,
  );
  byId('secondary-mmf-arrow').setAttribute(
    'd',
    `M${mmf.secondaryStart} 233H${mmf.secondaryEnd}`,
  );
  byId('primary-mmf-arrow').style.opacity = String(
    Math.min(1, Math.abs(state.i1) * 5),
  );
  byId('secondary-mmf-arrow').style.opacity = String(
    Math.min(1, Math.abs(0.5 * state.i2) * 5),
  );
  byId('secondary-mmf-label').style.opacity = String(state.load);
  byId('leakage').toggleAttribute('hidden', stage !== 3);
  for (const [selector, amount] of [
    ['.leak-primary', state.primaryLeak],
    ['.leak-secondary', state.secondaryLeak],
  ]) {
    const path = document.querySelector(selector);
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    path.style.strokeDashoffset = String(length * (1 - amount));
    path.style.opacity = String(amount);
  }
  document.querySelector('.leak-primary-label').style.opacity = String(
    state.primaryLeak,
  );
  document.querySelector('.leak-secondary-label').style.opacity = String(
    state.secondaryLeak,
  );
  const highlight = stage === 0 ? primaryTurns : secondaryTurns;
  const scanning =
    (stage === 0 && state.cue < 3) || (stage === 1 && state.cue === 1);
  const activeTurn =
    Math.floor((elapsed - CUE_STARTS[stage][state.cue]) / 380) %
    highlight.length;
  [...primaryTurns, ...secondaryTurns].forEach((turn) =>
    turn.classList.remove('turn-active'),
  );
  if (scanning) highlight[activeTurn].classList.add('turn-active');
  byId('sum-callout').toggleAttribute('hidden', stage === 2);
  if (stage !== 2) {
    byId('sum-label').textContent = callouts[stage][state.cue][0];
    byId('sum-value').textContent = callouts[stage][state.cue][1];
  }
  const x = 12 + ((phase % (Math.PI * 2)) / (Math.PI * 2)) * 414;
  byId('wave-cursor').setAttribute('d', `M${x} 7V79`);
  for (const [id, signal] of [
    ['voltage-dot', Math.cos],
    ['flux-dot', Math.sin],
  ]) {
    byId(id).setAttribute('cx', String(x));
    byId(id).setAttribute('cy', String(43 - 29 * signal(phase)));
  }
  byId('timeline').value = String(elapsed);
  byId('timeline').setAttribute(
    'aria-valuetext',
    `${Math.round((elapsed / STAGE_DURATION) * 100)}%，${cues[stage][state.cue]}`,
  );
  byId('progress-label').textContent =
    `${Math.round((elapsed / STAGE_DURATION) * 100)}%`;
  if (lastCue !== state.cue) {
    lastCue = state.cue;
    byId('diagram-caption').textContent = cues[stage][state.cue];
    byId('playback-step').textContent = `${state.cue + 1} / 4`;
    byId('circuit-state').textContent = state.switchClosed
      ? '二次侧接通负载 · 定性过程慢放'
      : '二次侧开路 · i₂ = 0';
  }
  [...byId('stage-content').children].forEach((element, index) => {
    const pending = elapsed < revealTimes[stage][index];
    element.classList.toggle('pending', pending);
    element.setAttribute('aria-hidden', String(pending));
    element.classList.toggle(
      'current-explanation',
      !pending && index === state.cue,
    );
  });
}

function selectStage(index) {
  stage = index;
  elapsed = motionAllowed ? 0 : STAGE_DURATION;
  phase = Math.PI / 4;
  lastCue = -1;
  paused = false;
  const selected = stages[stage];
  lesson.dataset.stage = String(stage);
  buttons.forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === stage));
  });
  byId('stage-kicker').textContent =
    `阶段 ${String(stage + 1).padStart(2, '0')} / 04`;
  byId('stage-title').textContent = selected.title;
  byId('stage-content').innerHTML = selected.body;
  byId('stage-count').textContent =
    `${String(stage + 1).padStart(2, '0')} / 04`;
  byId('takeaway').textContent = selected.takeaway;
  byId('diagram-model-note').textContent =
    stage === 2
      ? '箭头随瞬时磁动势变化 · 两侧总磁动势之差为 N₁i₀（稳态）'
      : stage === 3
        ? '漏磁通穿过本侧绕组内部，在线圈外闭合返回'
        : '分置绕组便于讲解 · 匝数与磁通线不按比例绘制';
  byId('next-stage').textContent = stage === 3 ? '回到空载 ↺' : '下一阶段 →';
  draw();
  updateAnimation();
}

buttons.forEach((button, index) => {
  button.addEventListener('click', () => {
    motionAllowed = true;
    selectStage(index);
  });
});
byId('next-stage').addEventListener('click', () => {
  motionAllowed = true;
  selectStage((stage + 1) % stages.length);
});
byId('replay').addEventListener('click', () => {
  motionAllowed = true;
  selectStage(stage);
});
byId('timeline').addEventListener('input', (event) => {
  elapsed = Number(event.target.value);
  phase = (Math.PI / 4 + elapsed * 0.0012) % (Math.PI * 2);
  paused = true;
  draw();
  updateAnimation();
});

function animate(time) {
  if (lastTime !== null) {
    const delta = Math.min(time - lastTime, 80);
    phase = (phase + delta * 0.0012) % (Math.PI * 2);
    elapsed = Math.min(STAGE_DURATION, elapsed + delta);
  }
  lastTime = time;
  draw();
  animation = requestAnimationFrame(animate);
}

function updateAnimation() {
  if (animation !== null) cancelAnimationFrame(animation);
  animation = null;
  lastTime = null;
  if (!paused && visible && !document.hidden && motionAllowed) {
    animation = requestAnimationFrame(animate);
  }
  const stopped = paused || !motionAllowed;
  byId('pause').textContent = !motionAllowed
    ? '播放动画'
    : paused
      ? '继续动画'
      : '暂停动画';
  byId('pause').setAttribute('aria-pressed', String(stopped));
}

byId('pause').addEventListener('click', () => {
  if (!motionAllowed) {
    motionAllowed = true;
    if (elapsed >= STAGE_DURATION) {
      elapsed = 0;
      phase = Math.PI / 4;
    }
    paused = false;
    draw();
  } else {
    paused = !paused;
  }
  updateAnimation();
});
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  updateAnimation();
}).observe(lesson);
document.addEventListener('visibilitychange', updateAnimation);
reducedMotion.addEventListener('change', () => {
  motionAllowed = !reducedMotion.matches;
  if (!motionAllowed) elapsed = STAGE_DURATION;
  draw();
  updateAnimation();
});

function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
resize();
selectStage(0);
updateAnimation();

// Keep native button activation and forward course shortcuts from the iframe.
const navigationKeys = new Set([
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
]);
function navigate(key) {
  if (window.parent === window) return;
  window.parent.document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true }),
  );
}
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.closest('input, select, textarea') ||
    (event.key === ' ' &&
      event.target.closest('a, button, input, select, textarea')) ||
    !navigationKeys.has(event.key)
  )
    return;
  event.preventDefault();
  navigate(event.key);
});

let touchStart = null;
document.addEventListener(
  'touchstart',
  (event) => {
    touchStart = null;
    if (event.target.closest('a, button, input, select, textarea')) return;
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  },
  { passive: true },
);
document.addEventListener(
  'touchend',
  (event) => {
    const start = touchStart;
    touchStart = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigate(dx < 0 ? 'ArrowRight' : 'ArrowLeft');
    }
  },
  { passive: true },
);
document.addEventListener(
  'touchcancel',
  () => {
    touchStart = null;
  },
  { passive: true },
);
