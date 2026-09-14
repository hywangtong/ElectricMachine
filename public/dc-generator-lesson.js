import {
  GeneratorSimulation,
  generatorParameters,
} from './dc-generator-model.js';

const $ = (id) => document.getElementById(id);
const commutated = document.body.dataset.mode === 'commutated';
const simulation = new GeneratorSimulation(commutated);
const colours = {
  field: '#397f73',
  emf: '#356eaf',
  motion: '#be632c',
  ink: '#214e4a',
};
const signed = (value, digits = 3) =>
  `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;
const label = (x, y, copy, colour = colours.ink, size = 14) =>
  `<text x="${x}" y="${y}" fill="${colour}" font-size="${size}">${copy}</text>`;
const arrow = (x1, y1, x2, y2, type, width = 3) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${colours[type]}" stroke-width="${width}" fill="none" marker-end="url(#generator-${type})"/>`;
function point(cx, cy, radius, degrees) {
  const t = (degrees * Math.PI) / 180;
  return [cx + radius * Math.cos(t), cy - radius * Math.sin(t)];
}
function arc(cx, cy, radius, start, end) {
  const a = point(cx, cy, radius, start);
  const b = point(cx, cy, radius, end);
  return `M${a[0]} ${a[1]}A${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 0 ${b[0]} ${b[1]}`;
}
function symbol(x, y, into, active) {
  return `<circle cx="${x}" cy="${y}" r="13" fill="white" stroke="${active ? colours.emf : '#99aaa4'}" stroke-width="2.5"/>${active ? (into ? `<path d="M${x - 5} ${y - 5}l10 10m0-10l-10 10" stroke="${colours.emf}" stroke-width="2.5"/>` : `<circle cx="${x}" cy="${y}" r="4" fill="${colours.emf}"/>`) : ''}`;
}

function renderMotor(state) {
  const angle = simulation.angle;
  let svg = `<defs>${Object.entries(colours)
    .map(
      ([name, colour]) =>
        `<marker id="generator-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="${colour}"/></marker>`,
    )
    .join('')}</defs>`;
  const cx = 216,
    cy = 164,
    r = 86;
  const a = point(cx, cy, r, angle),
    b = point(cx, cy, r, angle + 180);
  svg += `<rect x="67" y="10" width="302" height="37" rx="8" fill="#e8d6cf"/><rect x="67" y="280" width="302" height="37" rx="8" fill="#d8e5ee"/>`;
  svg += label(196, 37, 'N', '#a9433d', 25);
  svg += label(196, 307, 'S', colours.emf, 25);
  for (let x = 92; x <= 344; x += 42) svg += arrow(x, 55, x, 270, 'field', 1.5);
  svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffffbb" stroke="#c8d9d4" stroke-dasharray="4 5"/><path d="M${cx} ${cy}H${cx + 110}" stroke="#849e96" stroke-dasharray="4 4"/>`;
  svg += label(324, 169, '0°', colours.ink, 12);
  if (angle > 0.1)
    svg += `<path d="${arc(cx, cy, 32, 0, angle)}" stroke="${colours.motion}" stroke-width="2" fill="none"/>`;
  svg += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#8b7370" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="7" fill="${colours.ink}"/>`;
  const active = Math.abs(state.coilEmf) > 1e-10;
  svg += symbol(...a, state.coilEmf < 0, active);
  svg += symbol(...b, state.coilEmf > 0, active);
  svg += label(a[0] + 17, a[1] - 15, 'A', colours.emf, 18);
  svg += label(b[0] + 17, b[1] + 26, 'B', colours.emf, 18);
  if (simulation.rpm > 0) {
    const length = 22 + (simulation.rpm / 120) * 35;
    for (const degrees of [angle, angle + 180]) {
      const p = point(cx, cy, r + 17, degrees);
      const t = (degrees * Math.PI) / 180;
      svg += arrow(
        ...p,
        p[0] - length * Math.sin(t),
        p[1] - length * Math.cos(t),
        'motion',
        3.5,
      );
    }
  }
  svg += label(10, 174, 'B ↓', colours.field, 17);
  svg += label(
    9,
    327,
    `轴端视图 · θ = ${angle.toFixed(0)}° · n = ${simulation.rpm} r/min`,
    colours.motion,
  );
  svg += label(410, 20, '立体线圈 · 机械带动转轴 ↺');
  const af = point(506, 111, 48, angle),
    bf = point(506, 111, 48, angle + 180);
  const depth = [83, -34];
  const ar = [af[0] + depth[0], af[1] + depth[1]],
    br = [bf[0] + depth[0], bf[1] + depth[1]];
  svg += `<path d="M480 122L633 59" stroke="#849e96" stroke-width="6"/><path d="M${af[0]} ${af[1]}L${ar[0]} ${ar[1]}L${br[0]} ${br[1]}L${bf[0]} ${bf[1]}Z" fill="#edf6f255" stroke="#8b7370" stroke-width="5"/>`;
  svg += label(af[0] - 19, af[1] + 19, 'A', colours.emf);
  svg += label(br[0] + 8, br[1], 'B', colours.emf);
  if (active) {
    const alongEdge = (p, q, forward) => {
      const p1 = p.map((v, i) => v + (q[i] - v) * 0.22);
      const p2 = p.map((v, i) => v + (q[i] - v) * 0.78);
      return forward ? arrow(...p1, ...p2, 'emf') : arrow(...p2, ...p1, 'emf');
    };
    // Positive e_AB: v x B points toward the near end of A (+z).
    svg += alongEdge(af, ar, state.coilEmf < 0);
    svg += alongEdge(bf, br, state.coilEmf > 0);
  }
  svg += arrow(657, 44, 657, 143, 'field', 2);
  svg += label(669, 93, 'B', colours.field);
  svg += `<path d="M402 178H700" stroke="#d8e5df"/>`;
  svg += commutated ? renderCommutator(state) : renderSlipRings(state);
  $('motor').innerHTML = svg;
}

function renderSlipRings(state) {
  let svg = label(
    412,
    198,
    '接线示意 · 两只完整滑环始终各接一端',
    colours.ink,
    13,
  );
  for (const [cx, name, colour] of [
    [470, 'A', '#a87454'],
    [583, 'B', '#6a8b99'],
  ]) {
    const marker = point(cx, 249, 26, simulation.angle);
    svg += `<circle cx="${cx}" cy="249" r="26" fill="none" stroke="${colour}" stroke-width="11"/><circle cx="${cx}" cy="249" r="7" fill="#849e96"/><circle cx="${marker[0]}" cy="${marker[1]}" r="3" fill="white"/><path d="M${cx} 213V223" stroke="${colour}" stroke-width="2"/><rect x="${cx + 28}" y="240" width="19" height="18" rx="3" fill="${colours.ink}"/>`;
    svg += label(cx - 8, 216, name, colour, 16);
    svg += label(cx - 24, 295, `${name} 滑环`, colours.ink, 13);
  }
  svg += `<path d="M517 249H529V216H682V230M630 249H649V286H682V270" fill="none" stroke="#849e96" stroke-width="2"/><circle cx="682" cy="250" r="20" fill="#f6faf8" stroke="${colours.emf}" stroke-width="2"/>`;
  svg += label(674, 256, 'V', colours.emf, 18);
  const polarity = Math.sign(state.outputEmf);
  svg += label(
    665,
    213,
    `P ${polarity > 0 ? '+' : polarity < 0 ? '−' : '0'}`,
    colours.emf,
    13,
  );
  svg += label(
    663,
    305,
    `Q ${polarity > 0 ? '−' : polarity < 0 ? '+' : '0'}`,
    colours.emf,
    13,
  );
  svg += label(
    414,
    326,
    'P 始终接 A，Q 始终接 B · 高阻示波器测量',
    colours.emf,
    13,
  );
  return svg;
}

function renderCommutator(state) {
  const cx = 550,
    cy = 250,
    radius = 31,
    angle = simulation.angle;
  let svg = label(
    412,
    196,
    '接线示意 · 两片换向片随轴同步旋转',
    colours.ink,
    13,
  );
  svg += `<path d="${arc(cx, cy, radius, angle - 86, angle + 86)}" fill="none" stroke="#a87454" stroke-width="13"/><path d="${arc(cx, cy, radius, angle + 94, angle + 266)}" fill="none" stroke="#6a8b99" stroke-width="13"/><circle cx="${cx}" cy="${cy}" r="8" fill="#849e96"/>`;
  for (const [degrees, name] of [
    [angle, 'A'],
    [angle + 180, 'B'],
  ]) {
    const p = point(cx, cy, radius, degrees);
    svg += label(p[0] - 4, p[1] + 4, name, 'white', 12);
  }
  svg += `<rect x="540" y="201" width="20" height="17" rx="3" fill="${colours.ink}"/><rect x="540" y="282" width="20" height="17" rx="3" fill="${colours.ink}"/><path d="M540 209H438V230M540 291H438V270" fill="none" stroke="#849e96" stroke-width="2"/><circle cx="438" cy="250" r="20" fill="#f6faf8" stroke="${colours.motion}" stroke-width="2"/>`;
  svg += label(430, 256, 'V', colours.motion, 18);
  svg += label(465, 209, 'P +', colours.motion, 15);
  svg += label(465, 306, 'Q −', colours.motion, 15);
  svg += label(582, 216, '固定电刷', colours.ink, 13);
  svg += label(596, 253, '换向片 ↺', colours.ink, 13);
  svg += label(
    414,
    326,
    state.neutral
      ? '零点换向 · e_AB = e_PQ = 0'
      : `上刷 P 接 ${state.contact > 0 ? 'A' : 'B'} 片；下刷 Q 接 ${state.contact > 0 ? 'B' : 'A'} 片`,
    colours.emf,
    14,
  );
  return svg;
}

function renderScope(state) {
  const left = 44,
    right = 555,
    top = 14,
    bottom = 155,
    middle = (top + bottom) / 2;
  const duration = generatorParameters.windowSeconds;
  const start = Math.max(0, simulation.elapsed - duration);
  const end = start + duration;
  const x = (t) => left + ((t - start) / duration) * (right - left);
  const y = (v) => middle - (v / 0.3) * ((bottom - top) / 2);
  let svg = `<defs><clipPath id="scope-clip"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}"/></clipPath></defs><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="4" fill="#f6faf8"/>`;
  for (let i = -2; i <= 2; i++) {
    const value = i * 0.15;
    svg += `<path d="M${left} ${y(value)}H${right}" stroke="${i === 0 ? '#849e96' : '#dce8e2'}" ${i === 0 ? '' : 'stroke-dasharray="3 4"'}/>`;
    svg += label(0, y(value) + 4, signed(value, 2), colours.ink, 11);
  }
  for (let i = 0; i <= 8; i++) {
    const xx = x(start + i);
    svg += `<path d="M${xx} ${top}V${bottom}" stroke="#dce8e2"/>`;
    if (i % 2 === 0)
      svg += label(xx - 10, 176, (start + i).toFixed(1), colours.ink, 11);
  }
  const path = (key) =>
    simulation.samples
      .map(
        (sample, i) =>
          `${i ? 'L' : 'M'}${x(sample.t).toFixed(2)} ${y(sample[key]).toFixed(2)}`,
      )
      .join(' ');
  svg += `<g clip-path="url(#scope-clip)">`;
  if (commutated)
    svg += `<path id="coil-trace" d="${path('coil')}" stroke="${colours.emf}" stroke-width="2" stroke-dasharray="5 4" fill="none"/>`;
  svg += `<path id="output-trace" d="${path('output')}" stroke="${commutated ? colours.motion : colours.emf}" stroke-width="2.5" fill="none"/>`;
  // The cursor follows actual sampled time; future data is not fabricated.
  svg += `<path d="M${x(simulation.elapsed)} ${top}V${bottom}" stroke="#849e96" stroke-dasharray="3 4"/>`;
  svg += '</g>';
  svg += `<circle id="scope-point" cx="${x(simulation.elapsed)}" cy="${y(state.outputEmf)}" r="4" fill="${commutated ? colours.motion : colours.emf}"/>`;
  svg += label(565, 176, 's', colours.ink, 11);
  $('scope').innerHTML = svg;
  $('scope').setAttribute(
    'aria-label',
    `${commutated ? '线圈交变电动势与电刷端脉动直流' : '滑环端交变电动势'}波形，时间窗 ${start.toFixed(1)} 至 ${end.toFixed(1)} 秒，当前 ${signed(state.outputEmf)} 伏`,
  );
  $('clock').textContent =
    `最近 8 s · t = ${simulation.elapsed.toFixed(1)} s${simulation.paused ? ' · 已暂停' : ''}`;
}

function renderControls() {
  const rpm = simulation.rpm;
  // A bounded 270-degree sweep has distinct zero and maximum endpoints.
  $('knob-indicator').style.transform = `rotate(${135 + (rpm / 120) * 270}deg)`;
  $('knob-value').textContent = rpm.toFixed(0);
  $('knob').setAttribute('aria-valuenow', rpm.toFixed(0));
  $('knob').setAttribute('aria-valuetext', `${rpm.toFixed(0)} 转每分钟`);
  if (document.activeElement !== $('speed')) $('speed').value = rpm;
  document
    .querySelectorAll('[data-speed]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(Number(button.dataset.speed) === rpm),
      ),
    );
  $('pause').textContent = simulation.paused ? '继续实验' : '暂停实验';
  $('pause').setAttribute('aria-pressed', String(simulation.paused));
}

function renderExperiment() {
  const state = simulation.state;
  $('angle-reading').textContent =
    `θ = ${simulation.angle.toFixed(0)}° · ${simulation.rpm === 0 ? '线圈静止' : '逆时针旋转'}`;
  $('emf').textContent = `${signed(state.outputEmf)} V`;
  $('linkage').textContent = `NΦ = ${signed(state.linkage, 4)} Wb·匝`;
  $('peak').textContent = `Eₘ = ${state.peak.toFixed(3)} V`;
  $('frequency').textContent = commutated
    ? `线圈 ${state.frequency.toFixed(2)} Hz · 脉动 ${(2 * state.frequency).toFixed(2)} Hz`
    : `线圈频率 f = ${state.frequency.toFixed(2)} Hz`;
  $('coil-emf').textContent = `线圈 e_AB = ${signed(state.coilEmf)} V`;
  $('state').textContent =
    simulation.rpm === 0
      ? '转速为零：磁通不再变化，感应电动势为零。'
      : state.neutral
        ? commutated
          ? '零点换向：线圈与输出电动势均为零。'
          : '磁通在极值位置，瞬时电动势为零。'
        : commutated
          ? `线圈${state.coilEmf > 0 ? '正' : '负'}半周：${state.contact > 0 ? 'P 接 A / Q 接 B' : 'P 接 B / Q 接 A'}，输出保持单向。`
          : `${state.coilEmf > 0 ? '正' : '负'}半周：${state.coilEmf > 0 ? 'P 高于 Q' : 'P 低于 Q'}，每半圈输出极性反转。`;
  renderMotor(state);
  renderScope(state);
}

function setSpeed(value) {
  if (!Number.isFinite(value)) return;
  simulation.setRpm(Math.round(value));
  renderControls();
  // While paused, allow the next-run speed to be set without changing the
  // frozen drawing, scope or electrical readings.
  if (!simulation.paused) renderExperiment();
}
$('speed').addEventListener('input', () => {
  if ($('speed').value.trim() !== '') setSpeed(Number($('speed').value));
});
$('speed').addEventListener('blur', () => {
  $('speed').value = simulation.rpm;
});
document
  .querySelectorAll('[data-speed]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      setSpeed(Number(button.dataset.speed)),
    ),
  );
$('knob').addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (
    ![
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
      'ArrowLeft',
      'Home',
      'End',
    ].includes(event.key)
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  const step = event.shiftKey ? 10 : 1;
  setSpeed(
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? 120
        : simulation.rpm +
          (['ArrowUp', 'ArrowRight'].includes(event.key) ? step : -step),
  );
});
function drag(event) {
  const bounds = $('knob').getBoundingClientRect();
  const dx = event.clientX - (bounds.left + bounds.width / 2);
  const dy = event.clientY - (bounds.top + bounds.height / 2);
  if (Math.hypot(dx, dy) < bounds.width * 0.15) return;
  const degrees = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const sweep = (degrees - 135 + 360) % 360;
  setSpeed(sweep <= 270 ? (sweep / 270) * 120 : sweep < 315 ? 120 : 0);
}
$('knob').addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  $('knob').focus();
  $('knob').setPointerCapture(event.pointerId);
  drag(event);
});
$('knob').addEventListener('pointermove', (event) => {
  if ($('knob').hasPointerCapture(event.pointerId)) drag(event);
});
for (const type of ['pointerup', 'pointercancel'])
  $('knob').addEventListener(type, (event) => {
    if ($('knob').hasPointerCapture(event.pointerId))
      $('knob').releasePointerCapture(event.pointerId);
  });

let lastTime = null;
let lastRender = null;
$('pause').addEventListener('click', () => {
  simulation.paused = !simulation.paused;
  lastTime = null;
  renderControls();
  if (!simulation.paused) renderExperiment();
  else $('clock').textContent += ' · 已暂停';
});
$('reset').addEventListener('click', () => {
  simulation.reset();
  lastTime = null;
  lastRender = null;
  $('speed').value = simulation.rpm;
  renderControls();
  renderExperiment();
});
function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  lastTime = null;
});
function animate(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  if (!document.hidden && !simulation.paused) {
    simulation.advance(dt);
    if (lastRender === null || time - lastRender >= 1000 / 30) {
      renderExperiment();
      lastRender = time;
    }
  }
  requestAnimationFrame(animate);
}

// Preserve course shortcuts, but never turn a control gesture into a page turn.
document.addEventListener('keydown', (event) => {
  if (
    event.defaultPrevented ||
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  const control = event.target.closest('input, button, [role="slider"]');
  if (
    control &&
    (event.key === ' ' ||
      event.key === 'Enter' ||
      event.key.startsWith('Arrow') ||
      ['Home', 'End'].includes(event.key))
  )
    return;
  if (
    ![
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
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
    if (
      event.touches.length !== 1 ||
      event.target.closest('input, button, a, [role="slider"]')
    ) {
      touchStart = null;
      return;
    }
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
    if (!start || window.parent === window) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x,
      dy = touch.clientY - start.y;
    if (Math.abs(dx) <= 60 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    window.parent.document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: dx < 0 ? 'ArrowRight' : 'ArrowLeft',
        bubbles: true,
      }),
    );
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

resize();
renderControls();
renderExperiment();
requestAnimationFrame(animate);
