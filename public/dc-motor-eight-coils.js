import {
  COMMUTATION_HALF_WIDTH,
  advanceAngle,
  mod,
  radians,
  radialCoilGeometry,
  toothPoint,
  windingState,
} from './dc-motor-eight-coils-model.js';
import { windingDiagram } from './dc-motor-eight-coils-diagram.js';

const $ = (id) => document.getElementById(id);
const canvas = $('machine');
const ctx = canvas.getContext('2d');
const colors = {
  upper: '#306caf',
  lower: '#288466',
  comm: '#bc6830',
  ink: '#214e4a',
  arrow: '#ffcf69',
  excitation: '#8b58ae',
};
let angle = 0;
let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let selected = 1;
let speed = 18;
let polePairs = 1;
let flow = Array(8).fill(0);
let yaw = -0.58;
let pitch = 0.3;
let isolate = false;
let lastTime = null;
let commutationDemo = null;
let pointer = null;
let geometry = [];
const wavePoints = new Map();

const coilColor = (coil) =>
  coil.commuting ? colors.comm : coil.current > 0 ? colors.upper : colors.lower;
function project([x, y, z]) {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  const scale = 580 / (950 - z2);
  return { x: 405 + x1 * scale, y: 188 - y1 * scale, z: z2 };
}
const radial = (r, degrees, z) => [
  r * Math.cos(radians(degrees)),
  r * Math.sin(radians(degrees)),
  z,
];
function polygon(points, fill, stroke = '#758e8838') {
  const projected = points.map(project);
  geometry.push({
    depth: projected.reduce((s, p) => s + p.z, 0) / projected.length,
    draw() {
      ctx.beginPath();
      projected.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    },
  });
}
function line(a, b, color, width = 3, alpha = 1) {
  const pa = project(a),
    pb = project(b);
  geometry.push({
    depth: (pa.z + pb.z) / 2 + 0.8,
    draw() {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
  });
}
function label(point, copy, color, size = 17) {
  const p = project(point);
  geometry.push({
    depth: p.z + 2,
    draw() {
      ctx.font = `600 ${size}px 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#ffffffed';
      ctx.lineWidth = 4;
      ctx.strokeText(copy, p.x, p.y);
      ctx.fillStyle = color;
      ctx.fillText(copy, p.x, p.y);
    },
  });
}
function arrow(a, b, color, width = 2.6, alpha = 1) {
  const pa = project(a),
    pb = project(b);
  geometry.push({
    depth: (pa.z + pb.z) / 2 + 3,
    draw() {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      const t = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pb.x, pb.y);
      ctx.lineTo(pb.x - 8 * Math.cos(t - 0.45), pb.y - 8 * Math.sin(t - 0.45));
      ctx.lineTo(pb.x - 8 * Math.cos(t + 0.45), pb.y - 8 * Math.sin(t + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  });
}
function box(x0, x1, y0, y1, z0, z1, fill) {
  const p = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  for (const ids of [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ])
    polygon(
      ids.map((i) => p[i]),
      fill,
    );
}
function ring(outer, inner, front, back, rotation, sectors, fill) {
  for (let i = 0; i < sectors; i++) {
    const a = (i * 360) / sectors + rotation,
      b = ((i + 1) * 360) / sectors + rotation;
    polygon(
      [
        radial(outer, a, back),
        radial(outer, b, back),
        radial(outer, b, front),
        radial(outer, a, front),
      ],
      fill,
    );
    polygon(
      [
        radial(inner, a, back),
        radial(inner, b, back),
        radial(inner, b, front),
        radial(inner, a, front),
      ],
      fill,
    );
    for (const z of [front, back])
      polygon(
        [
          radial(inner, a, z),
          radial(outer, a, z),
          radial(outer, b, z),
          radial(inner, b, z),
        ],
        fill,
      );
  }
}
function radialPrism(inner, outer, tangent, back, front, degrees, fill) {
  const vertices = [
    [inner, -tangent, back],
    [outer, -tangent, back],
    [outer, tangent, back],
    [inner, tangent, back],
    [inner, -tangent, front],
    [outer, -tangent, front],
    [outer, tangent, front],
    [inner, tangent, front],
  ].map(([radius, offset, axial]) =>
    toothPoint(degrees, radius, offset, axial),
  );
  for (const ids of [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ])
    polygon(
      ids.map((index) => vertices[index]),
      fill,
    );
}
function renderTooth(degrees) {
  const vertices = [
    [150, -24, -86],
    [191, -24, -86],
    [191, 24, -86],
    [150, 24, -86],
    [150, -24, 86],
    [191, -24, 86],
    [191, 24, 86],
    [150, 24, 86],
  ].map(([r, t, z]) => toothPoint(degrees, r, t, z));
  for (const ids of [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ]) {
    polygon(
      ids.map((i) => vertices[i]),
      '#a4bbb52d',
    );
  }
}
function flowingArrows(points, coil, alpha) {
  if (Math.abs(coil.current) < 0.025) return;
  const path = coil.current > 0 ? points : [...points].reverse();
  const lengths = path
    .slice(1)
    .map((p, i) => Math.hypot(...p.map((v, j) => v - path[i][j])));
  const total = lengths.reduce((a, b) => a + b, 0);
  // Current direction controls travel direction, magnitude controls speed.
  for (let d = mod(flow[coil.id - 1], 110); d < total; d += 110) {
    let local = d,
      index = 0;
    while (index < lengths.length - 1 && local > lengths[index]) {
      local -= lengths[index];
      index++;
    }
    if (local < 4) continue;
    const p = path[index],
      q = path[index + 1],
      length = lengths[index];
    const t0 = Math.max(0, local / length - 14 / length),
      t1 = local / length;
    arrow(
      p.map((v, j) => v + (q[j] - v) * t0),
      p.map((v, j) => v + (q[j] - v) * t1),
      colors.arrow,
      2.2,
      alpha,
    );
  }
}
function renderMachine(state) {
  geometry = [];
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 800, 400);
  const poleStep = 360 / state.poleCount;
  const poleWidth = { 1: 190, 2: 102, 4: 46 }[state.polePairs];
  for (let index = 0; index < state.poleCount; index++) {
    const degrees = 180 - index * poleStep;
    const north = index % 2 === 0;
    radialPrism(
      238,
      270,
      poleWidth,
      -112,
      90,
      degrees,
      north ? '#bc665435' : '#557eaa35',
    );
    label(
      radial(282, degrees, 105),
      `${north ? 'N' : 'S'}${state.polePairs > 1 ? Math.floor(index / 2) + 1 : ''}`,
      north ? '#a84f42' : colors.upper,
      state.polePairs === 4 ? 12 : 16,
    );
    arrow(
      radial(north ? 292 : 216, degrees, 0),
      radial(north ? 216 : 292, degrees, 0),
      '#6e9d90aa',
      1.8,
    );
  }
  label(
    [0, -294, 0],
    `${state.polePairs} 对极 · ${state.poleCount} 个固定磁极`,
    '#39796f',
    14,
  );
  ring(156, 118, 86, -86, -angle, 48, '#a4bbb51d');
  state.coils.forEach((coil) => renderTooth(coil.degrees));
  // Laminations and a keyed mark reveal rotation without obscuring the coils.
  for (let z = -75; z <= 75; z += 25) {
    for (let d = 0; d < 360; d += 15)
      line(
        radial(157, d - angle, z),
        radial(157, d + 15 - angle, z),
        '#829e9733',
        0.7,
      );
  }
  ring(18, 0, 242, -135, 0, 16, '#8ba29a88');
  for (let i = 0; i < 8; i++) {
    const center = 180 - i * 45 - angle;
    const segmentBrushes = state.brushes.filter((brush) =>
      brush.contacts.includes(i),
    );
    const hasPositive = segmentBrushes.some((brush) => brush.positive);
    const hasNegative = segmentBrushes.some((brush) => !brush.positive);
    const copper =
      hasPositive && hasNegative
        ? '#bc6830ea'
        : hasPositive
          ? '#4f7fb4ea'
          : hasNegative
            ? '#3e9474ea'
            : '#cb873dea';
    // A narrow insulating slit separates neighboring copper segments.
    for (let j = -22; j < 22; j += 5.5) {
      const a = center + j,
        b = Math.min(center + j + 5.5, center + 22);
      polygon(
        [
          radial(84, a, 148),
          radial(84, b, 148),
          radial(84, b, 193),
          radial(84, a, 193),
        ],
        copper,
        copper,
      );
      polygon(
        [
          radial(22, a, 194),
          radial(84, a, 194),
          radial(84, b, 194),
          radial(22, b, 194),
        ],
        '#d8a452e8',
        '#d8a452e8',
      );
    }
    line(
      radial(22, center + 22.5, 195),
      radial(84, center + 22.5, 195),
      '#f8fbf7',
      2,
    );
    line(
      radial(85, center + 22.5, 148),
      radial(85, center + 22.5, 193),
      '#f8fbf7',
      2,
    );
    label(radial(61, center, 198), `${i + 1}`, '#624322', 12);
  }
  for (const coil of state.coils) {
    const color = coilColor(coil),
      active = coil.id === selected;
    const alpha = isolate && !active ? 0.15 : active ? 1 : 0.7;
    const { points } = radialCoilGeometry(coil, angle);
    for (let i = 0; i < points.length - 1; i++) {
      line(points[i], points[i + 1], '#734c31', active ? 5.8 : 4.2, alpha);
      line(points[i], points[i + 1], color, active ? 4 : 2.5, alpha);
    }
    flowingArrows(points, coil, alpha);
    if (Math.abs(coil.current) > 0.025) {
      const inner = radial(205, coil.degrees, 0);
      const outer = radial(205 + 44 * Math.abs(coil.current), coil.degrees, 0);
      arrow(
        coil.current > 0 ? inner : outer,
        coil.current > 0 ? outer : inner,
        colors.excitation,
        active ? 3.5 : 2.5,
        alpha,
      );
      if (active)
        label(radial(266, coil.degrees, 0), '径向励磁', colors.excitation, 13);
    }
    label(
      radial(217, coil.degrees, 105),
      `${coil.id}${active ? ' ★' : ''}`,
      color,
      active ? 21 : 17,
    );
  }
  // Fixed brushes inject the same DC voltage at equally spaced positions.
  for (const brush of state.brushes) {
    radialPrism(83, 118, 13, 151, 191, brush.position, '#334b65');
    const inner = radial(122, brush.position, 175);
    const outer = radial(176, brush.position, 175);
    arrow(
      brush.positive ? outer : inner,
      brush.positive ? inner : outer,
      brush.positive ? colors.upper : colors.lower,
      state.polePairs === 4 ? 2 : 3,
    );
    label(
      radial(154, brush.position, 205),
      state.polePairs === 1
        ? `${brush.positive ? 'A' : 'B'} ${brush.positive ? '＋' : '−'}`
        : `${brush.id}${brush.positive ? '＋' : '−'}`,
      brush.positive ? colors.upper : colors.lower,
      state.polePairs === 4 ? 11 : 16,
    );
  }
  for (const coil of state.commuting) {
    const position = state.brushes[coil.commutingBrushIndex].position;
    label(radial(140, position, 224), '短接换向', colors.comm, 14);
  }
  geometry.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw());
}
function svgText(x, y, copy, color = colors.ink, size = 14, anchor = 'middle') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${copy}</text>`;
}
function renderCircuit(state) {
  $('circuit').innerHTML = windingDiagram(state, selected, flow);
}
function renderTracking(state) {
  const coil = state.coils[selected - 1],
    color = coilColor(coil);
  $('tracking-title').textContent = `跟踪线圈 ${selected}`;
  $('current-value').textContent =
    `${coil.current >= 0 ? '+' : ''}${coil.current.toFixed(2)} A`;
  $('current-value').style.color = color;
  $('tracking-state').textContent = coil.commuting
    ? '电刷跨接两片 → 线圈短接 → 电流正在反向'
    : coil.current > 0
      ? `首端 → 末端（+${state.branchCurrent.toFixed(2)} A）`
      : `末端 → 首端（−${state.branchCurrent.toFixed(2)} A）`;
  state.coils.forEach((c) => {
    const button = $(`coil-${c.id}`);
    button.style.setProperty('--coil-color', coilColor(c));
    button.setAttribute('aria-pressed', String(c.id === selected));
    button.setAttribute(
      'aria-label',
      `线圈 ${c.id}，${c.current.toFixed(2)} 安，${c.commuting ? '正在换向' : c.current > 0 ? '上支路' : '下支路'}`,
    );
    button.innerHTML = `<span>${c.id}</span><small>${c.current >= 0 ? '+' : ''}${c.current.toFixed(2)}</small>`;
  });
  let svg =
    '<path d="M45 18V102H531M45 60H531" stroke="#b8cec6" stroke-width="1" fill="none"/>';
  const amplitude = state.branchCurrent;
  svg +=
    svgText(32, 26, `+${amplitude.toFixed(2)}`, colors.ink, 11) +
    svgText(32, 64, '0', colors.ink, 12) +
    svgText(32, 100, `−${amplitude.toFixed(2)}`, colors.ink, 11);
  for (const d of [0, 90, 180, 270, 360]) {
    const x = 45 + d * 1.35;
    svg +=
      `<path d="M${x} 18V102" stroke="#dce7e0" stroke-dasharray="3 4"/>` +
      svgText(x, 120, `${d}°`, '#60796f', 12);
  }
  const waveKey = `${state.polePairs}:${selected}`;
  if (!wavePoints.has(waveKey)) {
    wavePoints.set(
      waveKey,
      Array.from({ length: 721 }, (_, i) => {
        const d = i / 2,
          c = windingState(d, state.polePairs).coils[selected - 1];
        return `${45 + d * 1.35},${60 - (c.current / amplitude) * 36}`;
      }).join(' '),
    );
  }
  const points = wavePoints.get(waveKey);
  svg += `<polyline points="${points}" fill="none" stroke="#507b92" stroke-width="2.5"/>`;
  const x = 45 + state.angle * 1.35,
    y = 60 - (coil.current / amplitude) * 36;
  svg += `<path d="M${x} 15V102" stroke="${color}" stroke-dasharray="3 3"/><circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="2"/>`;
  svg += svgText(290, 13, 'I / A　　　　　　　　　转子角度 θ', '#60796f', 11);
  $('wave').innerHTML = svg;
}
function render() {
  const state = windingState(angle, polePairs);
  $('angle').value = String(state.angle);
  $('angle-value').textContent = `${state.angle.toFixed(1)}°`;
  $('configuration-summary').innerHTML =
    `8 个线圈 · 8 片换向片 · ${state.brushCount} 个电刷 · ${state.polePairs} 对磁极　<span>A 组接正极，B 组接负极；箭头表示传统电流。</span>`;
  $('armature-tag').textContent =
    `Iₐ = 2 A · ${state.brushCount} 支路 · ${state.branchCurrent.toFixed(2)} A/支路`;
  $('commutation-summary').textContent =
    `A 组流入、B 组流出；线圈每转过 ${(180 / state.polePairs).toFixed(0)}° 换向，电源极性不变。`;
  $('model-boundary').textContent =
    `保留八线圈闭合连接拓扑，三维绕组采用径向齿绕组教学示意。${state.polePairs} 对极时采用 ${state.brushCount} 个等距电刷与 ${state.brushCount} 条并联支路，恒定支路电流 Iₐ/${state.brushCount} = ${state.branchCurrent.toFixed(2)} A；跨片区 12° 内理想线性换向，忽略电感、反电动势与火花；转速外部设定。`;
  canvas.setAttribute(
    'aria-label',
    `三维八线圈径向齿绕组电枢，${state.polePairs} 对磁极、${state.brushCount} 个固定电刷。拖动改变观察视角；使用下方控件调整转角、选择线圈。`,
  );
  $('circuit').setAttribute(
    'aria-label',
    `与三维动画同步的八线圈圆环简图，显示 ${state.poleCount} 个磁极、${state.brushCount} 个固定电刷、${state.brushCount} 条并联支路及电流换向。`,
  );
  renderMachine(state);
  renderCircuit(state);
  renderTracking(state);
}
function syncPlay() {
  $('play').textContent = running ? '暂停' : '继续';
  $('play').setAttribute('aria-pressed', String(running));
}
function pause() {
  running = false;
  commutationDemo = null;
  syncPlay();
}
function choose(id) {
  if (commutationDemo) pause();
  selected = id;
  $('coil').value = String(id);
  render();
}
for (let id = 1; id <= 8; id++) {
  $('coil').insertAdjacentHTML(
    'beforeend',
    `<option value="${id}">${id}</option>`,
  );
  const button = document.createElement('button');
  button.id = `coil-${id}`;
  button.addEventListener('click', () => choose(id));
  $('coil-cards').append(button);
}
$('coil').addEventListener('change', (e) => choose(Number(e.target.value)));
$('play').addEventListener('click', () => {
  commutationDemo = null;
  running = !running;
  lastTime = null;
  syncPlay();
});
$('step').addEventListener('click', () => {
  pause();
  angle = mod(angle + 45);
  render();
});
$('commute').addEventListener('click', () => {
  pause();
  const phase = 157.5 - (selected - 1) * 45;
  const candidates = windingState(angle, polePairs).brushes.map((brush) =>
    mod(phase - brush.position),
  );
  const center = candidates.sort((a, b) => mod(a - angle) - mod(b - angle))[0];
  const demoMargin = COMMUTATION_HALF_WIDTH + 2;
  angle = mod(center - demoMargin);
  commutationDemo = { remaining: demoMargin * 2 };
  running = true;
  lastTime = null;
  syncPlay();
  render();
});
$('reset').addEventListener('click', () => {
  pause();
  angle = 0;
  flow = Array(8).fill(0);
  yaw = -0.58;
  pitch = 0.3;
  isolate = false;
  speed = 18;
  polePairs = 1;
  $('speed').value = '18';
  $('pole-pairs').value = '1';
  $('focus').setAttribute('aria-pressed', 'false');
  choose(1);
});
$('speed').addEventListener('change', (e) => {
  speed = Number(e.target.value);
});
$('pole-pairs').addEventListener('change', (e) => {
  pause();
  polePairs = Number(e.target.value);
  flow = Array(8).fill(0);
  render();
});
$('angle').addEventListener('input', (e) => {
  pause();
  angle = mod(Number(e.target.value));
  render();
});
$('front').addEventListener('click', () => {
  yaw = 0;
  pitch = 0;
  render();
});
$('perspective').addEventListener('click', () => {
  yaw = -0.58;
  pitch = 0.3;
  render();
});
$('focus').addEventListener('click', () => {
  isolate = !isolate;
  $('focus').setAttribute('aria-pressed', String(isolate));
  render();
});
canvas.addEventListener('pointerdown', (e) => {
  pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointer || pointer.id !== e.pointerId) return;
  yaw = Math.max(-1.35, Math.min(1.35, yaw + (e.clientX - pointer.x) * 0.006));
  pitch = Math.max(
    -0.8,
    Math.min(0.8, pitch + (e.clientY - pointer.y) * 0.006),
  );
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  render();
});
const endPointer = () => {
  pointer = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
// Forward only course navigation; native form inputs keep their arrow keys.
document.addEventListener('keydown', (e) => {
  if (
    e.altKey ||
    e.ctrlKey ||
    e.metaKey ||
    e.target.closest('input, select, textarea')
  )
    return;
  if (e.key === ' ' && e.target.closest('button, a')) return;
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
    ].includes(e.key) ||
    window.parent === window
  )
    return;
  e.preventDefault();
  window.parent.document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: e.key, bubbles: true }),
  );
});
let touchStart = null;
document.addEventListener(
  'touchstart',
  (e) => {
    touchStart = e.target.closest('canvas, button, a, input, select')
      ? null
      : { x: e.touches[0].clientX, y: e.touches[0].clientY };
  },
  { passive: true },
);
document.addEventListener(
  'touchend',
  (e) => {
    const start = touchStart;
    touchStart = null;
    if (!start || window.parent === window) return;
    const dx = e.changedTouches[0].clientX - start.x,
      dy = e.changedTouches[0].clientY - start.y;
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
  lastTime = null;
});
function frame(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  if (running && !document.hidden) {
    if (commutationDemo) {
      const step = Math.min(dt * 6, commutationDemo.remaining);
      angle = advanceAngle(angle, step, 1, true);
      commutationDemo.remaining -= step;
      if (commutationDemo.remaining <= 0) pause();
    } else {
      angle = advanceAngle(angle, dt, speed, true);
    }
    for (const coil of windingState(angle, polePairs).coils) {
      flow[coil.id - 1] += dt * 100 * Math.abs(coil.current);
    }
    render();
  }
  requestAnimationFrame(frame);
}
resize();
syncPlay();
render();
requestAnimationFrame(frame);
