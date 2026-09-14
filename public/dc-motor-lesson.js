import { motorState } from './dc-motor-model.js';

const $ = (id) => document.getElementById(id);
const commutated = document.body.dataset.mode === 'commutated';
let angle = 45;
let scanning = false;
let frozen = false;
let elapsed = 0;
let lastTime = null;
let lastSample = -1;
let samples = [];

if (commutated) {
  $('eyebrow').textContent = '直流电机 / 02 电刷与换向器 · 交互实验';
  $('title').textContent = '每半圈换一次电流，力矩就能保持同向';
  $('lead').textContent =
    '电源极性保持不变；固定电刷接触随轴旋转的两片换向片，使线圈电流每半圈反向。';
  $('circuit-tag').textContent = '固定电刷 · 旋转换向片';
  $('torque-formula').textContent = 'T = Tₘ |sin θ|';
  $('conclusion').textContent =
    '换向使电流和安培力同时反向，抵消力臂位置的变号。力矩保持同向，但仍有脉动；死点靠惯性越过，多线圈可减小脉动。';
}

const colours = {
  field: '#397f73',
  current: '#356eaf',
  force: '#be632c',
  ink: '#214e4a',
};
let diagramId = 'motor';
function defs(prefix) {
  diagramId = prefix;
  return `<defs>${Object.entries(colours)
    .map(
      ([name, colour]) =>
        `<marker id="${prefix}-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="${colour}"/></marker>`,
    )
    .join('')}</defs>`;
}
function arrow(x1, y1, x2, y2, type, width = 3) {
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${colours[type]}" stroke-width="${width}" fill="none" marker-end="url(#${diagramId}-${type})"/>`;
}
function text(x, y, copy, colour = colours.ink, size = 14) {
  return `<text x="${x}" y="${y}" fill="${colour}" font-size="${size}">${copy}</text>`;
}
function symbol(x, y, into, active) {
  return `<circle cx="${x}" cy="${y}" r="13" fill="white" stroke="${active ? colours.current : '#99aaa4'}" stroke-width="2.5"/>${active ? (into ? `<path d="M${x - 5} ${y - 5}l10 10m0-10l-10 10" stroke="${colours.current}" stroke-width="2.5"/>` : `<circle cx="${x}" cy="${y}" r="4" fill="${colours.current}"/>`) : ''}`;
}
function point(cx, cy, radius, degrees) {
  const t = (degrees * Math.PI) / 180;
  return [cx + radius * Math.cos(t), cy - radius * Math.sin(t)];
}
function arc(cx, cy, radius, start, end) {
  const a = point(cx, cy, radius, start);
  const b = point(cx, cy, radius, end);
  return `M${a[0]} ${a[1]}A${radius} ${radius} 0 ${Math.abs(end - start) > 180 ? 1 : 0} 0 ${b[0]} ${b[1]}`;
}

function renderMotor(state) {
  const { theta, current, force, torque, neutral, polarity } = state;
  const cx = 216,
    cy = 164,
    r = 86;
  const ax = cx + r * Math.cos(theta),
    ay = cy - r * Math.sin(theta);
  const bx = 2 * cx - ax,
    by = 2 * cy - ay;
  const fdir = Math.sign(force);
  let svg = defs('motor');
  svg += `<rect x="67" y="10" width="302" height="37" rx="8" fill="#e8d6cf"/><rect x="67" y="280" width="302" height="37" rx="8" fill="#d8e5ee"/>`;
  svg += text(196, 37, 'N', '#a9433d', 25) + text(196, 307, 'S', '#356eaf', 25);
  for (let x = 92; x <= 344; x += 42) svg += arrow(x, 55, x, 270, 'field', 1.5);
  svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffffbb" stroke="#c8d9d4" stroke-dasharray="4 5"/><path d="M${cx} ${cy}H${cx + 110}" stroke="#849e96" stroke-dasharray="4 4"/>`;
  svg += text(325, 169, '0°', colours.ink, 12);
  if (angle > 0 && angle < 360)
    svg += `<path d="${arc(cx, cy, 34, 0, angle)}" stroke="#be632c" stroke-width="2" fill="none"/>`;
  svg += `<path d="M${ax} ${ay}L${bx} ${by}" stroke="#8b7370" stroke-width="8"/><circle cx="${cx}" cy="${cy}" r="7" fill="#214e4a"/>`;
  // A and B are physical conductor identities; symbols never swap on page 1.
  svg +=
    symbol(ax, ay, polarity >= 0, current !== 0) +
    symbol(bx, by, polarity < 0, current !== 0);
  svg +=
    text(ax + 17, ay - 15, 'A', colours.current, 18) +
    text(bx + 17, by + 26, 'B', colours.current, 18);
  if (current !== 0) {
    svg += arrow(ax - fdir * 17, ay, ax - fdir * 76, ay, 'force', 4);
    svg += arrow(bx + fdir * 17, by, bx + fdir * 76, by, 'force', 4);
    svg += text(ax - fdir * 64 - 8, ay - 10, 'F', colours.force, 18);
  }
  // Perpendicular distance to either horizontal force's line of action.
  svg += `<path d="M${cx} ${cy}V${ay}H${ax}" fill="none" stroke="#be632c" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  svg += text(cx + 8, (cy + ay) / 2, 'd', colours.force, 16);
  svg += text(
    8,
    325,
    `θ = ${angle.toFixed(0)}° · T ${torque > 0 ? '↺' : torque < 0 ? '↻' : '= 0'}`,
    colours.force,
    14,
  );
  svg += text(10, 174, 'B ↓', colours.field, 17);
  svg += text(410, 20, '立体线圈 · A / B 为两条有效边', colours.ink, 14);
  const a = point(512, 105, 49, angle),
    b = point(512, 105, 49, angle + 180);
  const depth = [83, -34];
  const rear = (p) => [p[0] + depth[0], p[1] + depth[1]];
  const ar = rear(a),
    br = rear(b);
  svg += `<path d="M${a[0]} ${a[1]}L${ar[0]} ${ar[1]}L${br[0]} ${br[1]}L${b[0]} ${b[1]}Z" fill="#edf6f255" stroke="#8b7370" stroke-width="5"/><path d="M480 119L635 56" stroke="#849e96" stroke-width="6"/>`;
  svg +=
    text(a[0] - 18, a[1] + 20, 'A', colours.current) +
    text(br[0] + 8, br[1], 'B', colours.current);
  if (current !== 0) {
    const edgeArrow = (p, q, forward) => {
      const p1 = [p[0] + (q[0] - p[0]) * 0.25, p[1] + (q[1] - p[1]) * 0.25];
      const p2 = [p[0] + (q[0] - p[0]) * 0.75, p[1] + (q[1] - p[1]) * 0.75];
      return forward
        ? arrow(...p1, ...p2, 'current')
        : arrow(...p2, ...p1, 'current');
    };
    svg += edgeArrow(a, ar, polarity > 0) + edgeArrow(b, br, polarity < 0);
    svg += arrow(
      a[0] + 40,
      a[1] - 16,
      a[0] + 40 - fdir * 45,
      a[1] - 16,
      'force',
    );
    svg += arrow(
      b[0] + 40,
      b[1] - 16,
      b[0] + 40 + fdir * 45,
      b[1] - 16,
      'force',
    );
  }
  svg +=
    arrow(652, 45, 652, 139, 'field', 2) + text(665, 90, 'B', colours.field);
  svg += `<path d="M402 174H700" stroke="#d8e5df"/>`;
  if (commutated) {
    const ccx = 558,
      ccy = 246,
      cr = 34;
    svg += `<path d="${arc(ccx, ccy, cr, angle - 85, angle + 85)}" fill="none" stroke="#a87454" stroke-width="14"/><path d="${arc(ccx, ccy, cr, angle + 95, angle + 265)}" fill="none" stroke="#6a8b99" stroke-width="14"/><circle cx="${ccx}" cy="${ccy}" r="9" fill="#849e96"/>`;
    const pa = point(ccx, ccy, cr, angle),
      pb = point(ccx, ccy, cr, angle + 180);
    svg +=
      text(pa[0] - 5, pa[1] + 5, 'A', 'white', 12) +
      text(pb[0] - 5, pb[1] + 5, 'B', 'white', 12);
    svg += `<rect x="548" y="192" width="20" height="19" rx="3" fill="#214e4a"/><rect x="548" y="281" width="20" height="19" rx="3" fill="#214e4a"/><path d="M548 200H459V292H548" stroke="#849e96" stroke-width="2" fill="none"/><rect x="447" y="232" width="25" height="26" fill="white"/><path d="M447 240H472m-20 10h15" stroke="#be632c" stroke-width="3"/>`;
    svg +=
      text(482, 196, '+', colours.force, 20) +
      text(482, 313, '−', colours.force, 20);
    svg +=
      text(582, 206, '固定电刷', colours.ink, 13) +
      text(608, 250, '换向片 ↺', colours.ink, 13);
    svg += text(
      415,
      322,
      neutral
        ? '换向瞬间：理想断流；T = 0'
        : `上刷接 ${polarity > 0 ? 'A' : 'B'} 片；下刷接 ${polarity > 0 ? 'B' : 'A'} 片`,
      colours.current,
      14,
    );
  } else {
    svg += `<path d="M450 217H615M450 274H615" stroke="#849e96" stroke-width="3"/><rect x="536" y="227" width="88" height="36" rx="7" fill="#edf6f2" stroke="#c8d9d4"/>`;
    svg +=
      text(424, 222, '+', colours.force, 21) +
      text(424, 282, '−', colours.force, 21);
    svg +=
      text(624, 222, 'A', colours.current, 17) +
      text(624, 279, 'B', colours.current, 17);
    svg +=
      text(544, 250, '电枢线圈', colours.ink, 15) +
      text(416, 305, 'U_AB = +U₀；Iₐ 始终由 A 端流入', colours.current, 14);
    svg +=
      arrow(492, 217, 528, 217, 'current') +
      arrow(528, 274, 492, 274, 'current');
  }
  $('motor').innerHTML = svg;
}

function renderHand(state) {
  // Left palm facing the viewer: fingers up, thumb left. B enters the palm.
  // A rigid change of viewing axes maps main-view -z to local +y,
  // main -y to local -z, and main -x to local -x.
  const reversed = state.polarity < 0;
  const transform = reversed ? 'translate(206 202) rotate(180)' : '';
  let svg = defs('hand');
  svg += `<g transform="${transform}"><path d="M79 185L78 154Q60 147 47 129L21 108Q10 96 19 88Q25 83 35 90L65 108L64 54Q64 41 73 41Q83 41 83 54V93L85 31Q85 19 94 19Q104 19 104 32V92L108 38Q108 26 117 27Q127 28 126 40L123 98L128 58Q130 47 138 50Q147 52 145 63L143 124Q141 148 127 160L127 185Z" fill="#f4dcc1" stroke="#9a7452" stroke-width="2.5"/><path d="M82 115Q104 105 126 119M82 135Q100 128 119 138" fill="none" stroke="#c19b77" stroke-width="1.5"/>${arrow(100, 84, 100, 42, 'current')}${arrow(52, 101, 10, 101, 'force')}</g>`;
  svg += `<circle cx="104" cy="121" r="13" fill="white" stroke="${colours.field}" stroke-width="2.5"/><path d="M99 116l10 10m0-10l-10 10" stroke="${colours.field}" stroke-width="2.5"/>`;
  svg += text(150, 127, 'B ⊗', colours.field, 15);
  svg += text(149, 145, '穿入掌心', colours.field, 12);
  svg += text(
    reversed ? 126 : 5,
    reversed ? 85 : 75,
    `拇指 F ${reversed ? '→' : '←'}`,
    colours.force,
    13,
  );
  svg += text(
    72,
    reversed ? 195 : 13,
    `四指 I ${reversed ? '↓' : '↑'}`,
    colours.current,
    13,
  );
  svg += text(
    20,
    218,
    state.current === 0 ? '换向断流瞬间：安培力为零' : '左手掌面 · 对应导体 A',
    colours.ink,
    12,
  );
  $('hand').innerHTML = svg;
}

function renderScope(state) {
  const left = 48,
    right = 556,
    top = 17,
    bottom = 133,
    mid = (top + bottom) / 2;
  const start = elapsed - 8;
  const y = (v) => mid - ((v / 0.04) * (bottom - top)) / 2;
  const x = (t) => left + ((t - start) / 8) * (right - left);
  let svg = `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="4" fill="#f6faf8"/>`;
  for (let i = -2; i <= 2; i++) {
    const v = i * 0.02;
    svg += `<path d="M${left} ${y(v)}H${right}" stroke="${i === 0 ? '#849e96' : '#dce8e2'}" ${i === 0 ? '' : 'stroke-dasharray="3 4"'}/>`;
    svg += text(
      0,
      y(v) + 4,
      `${v > 0 ? '+' : ''}${v.toFixed(2)}`,
      colours.ink,
      11,
    );
  }
  for (let i = 0; i <= 4; i++) {
    const xx = left + (i * (right - left)) / 4;
    svg += `<path d="M${xx} ${top}V${bottom}" stroke="#dce8e2"/>`;
    svg += text(xx - 12, 154, `${(start + i * 2).toFixed(1)}`, colours.ink, 11);
  }
  const history = samples.filter((s) => s.t >= Math.max(0, start));
  if (history.length)
    svg += `<path d="${history.map((s, i) => `${i ? 'L' : 'M'}${x(s.t)} ${y(s.value)}`).join(' ')}L${right} ${y(state.torque)}" stroke="#be632c" stroke-width="2.5" fill="none"/>`;
  svg += `<circle cx="${right}" cy="${y(state.torque)}" r="4" fill="#be632c"/>`;
  svg += text(562, 154, 's', colours.ink, 11);
  $('scope').innerHTML = svg;
  $('clock').textContent =
    `最近 8 s · t = ${elapsed.toFixed(1)} s${frozen ? ' · 冻结' : ''}`;
}

function render() {
  const state = motorState(angle, commutated);
  $('knob-indicator').style.transform = `rotate(${-angle}deg)`;
  $('knob-value').textContent = `${angle.toFixed(0)}°`;
  $('knob').setAttribute('aria-valuenow', angle.toFixed(0));
  $('knob').setAttribute('aria-valuetext', `${angle.toFixed(0)} 度`);
  if (document.activeElement !== $('angle'))
    $('angle').value = angle.toFixed(0);
  $('torque').textContent =
    `${state.torque >= 0 ? '+' : ''}${state.torque.toFixed(4)} N·m`;
  $('current').textContent =
    `Iₐ = ${state.current >= 0 ? '+' : ''}${state.current.toFixed(2)} A；U_AB ${state.current === 0 ? '断开' : `= ${state.polarity > 0 ? '+' : '−'}U₀`}`;
  $('arm').textContent =
    `|F| = ${Math.abs(state.force).toFixed(2)} N；d = ${state.arm.toFixed(3)} m`;
  $('state').textContent = state.neutral
    ? commutated
      ? '死点 / 换向点：理想断流，力矩为零。'
      : '力臂为零，安培力仍在，力矩为零。'
    : state.torque > 0
      ? '正力矩：倾向逆时针转动。'
      : '负力矩：倾向顺时针转动。';
  document
    .querySelectorAll('[data-angle]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(Math.abs(angle - Number(button.dataset.angle)) < 0.5),
      ),
    );
  renderMotor(state);
  renderHand(state);
  renderScope(state);
}
function updateScan() {
  $('scan').textContent = scanning ? '停止扫角' : '自动扫角';
  $('scan').setAttribute('aria-pressed', String(scanning));
}
function setAngle(value) {
  if (!Number.isFinite(value)) return;
  angle = Math.max(0, Math.min(360, value));
  scanning = false;
  updateScan();
  render();
}
document
  .querySelectorAll('[data-angle]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      setAngle(Number(button.dataset.angle)),
    ),
  );
$('angle').addEventListener('input', () => {
  if ($('angle').value.trim() !== '') setAngle(Number($('angle').value));
});
$('angle').addEventListener('blur', () => {
  $('angle').value = angle.toFixed(0);
});
$('knob').addEventListener('keydown', (event) => {
  const step = event.shiftKey ? 10 : 1;
  if (
    ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(
      event.key,
    )
  ) {
    event.preventDefault();
    event.stopPropagation();
    setAngle(
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? 360
          : angle +
            (['ArrowUp', 'ArrowRight'].includes(event.key) ? step : -step),
    );
  }
});
function drag(event) {
  const bounds = $('knob').getBoundingClientRect();
  const dx = event.clientX - (bounds.left + bounds.width / 2),
    dy = event.clientY - (bounds.top + bounds.height / 2);
  if (Math.hypot(dx, dy) < bounds.width * 0.15) return;
  setAngle(((Math.atan2(-dy, dx) * 180) / Math.PI + 360) % 360);
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
$('knob').addEventListener('pointerup', (event) => {
  if ($('knob').hasPointerCapture(event.pointerId))
    $('knob').releasePointerCapture(event.pointerId);
});
$('scan').addEventListener('click', () => {
  scanning = !scanning;
  if (scanning && frozen) toggleFreeze();
  updateScan();
});
function toggleFreeze() {
  frozen = !frozen;
  $('pause').textContent = frozen ? '继续示波器' : '冻结示波器';
  $('pause').setAttribute('aria-pressed', String(frozen));
  render();
}
$('pause').addEventListener('click', toggleFreeze);
$('reset').addEventListener('click', () => {
  angle = 45;
  elapsed = 0;
  scanning = false;
  frozen = false;
  lastTime = null;
  lastSample = -1;
  samples = [];
  $('angle').value = 45;
  $('pause').textContent = '冻结示波器';
  $('pause').setAttribute('aria-pressed', 'false');
  updateScan();
  render();
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
  if (!frozen) {
    elapsed += dt;
    if (scanning) angle = (angle + 45 * dt) % 360;
    if (elapsed - lastSample >= 1 / 30) {
      samples.push({ t: elapsed, value: motorState(angle, commutated).torque });
      samples = samples.filter((s) => s.t >= elapsed - 8.1);
      lastSample = elapsed;
      render();
    }
  }
  requestAnimationFrame(animate);
}
resize();
render();
requestAnimationFrame(animate);
