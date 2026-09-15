import {
  BRUSH_COUNT,
  COMMUTATION_HALF_WIDTH,
  advanceAngle,
  mod,
  radians,
  toothPoint,
  windingState,
} from './dc-motor-frogleg-simplex-model.js';
import { connectionDiagram } from './dc-motor-frogleg-simplex-diagram.js';

const $ = (id) => document.getElementById(id);
const canvas = $('machine');
const ctx = canvas.getContext('2d');
const colors = {
  lap: '#2f6eb5',
  wave: '#8459a6',
  comm: '#bc6830',
  ink: '#214e4a',
  arrow: '#f2b84b',
  positive: '#306caf',
  negative: '#288466',
};
let angle = 0;
let mode = 'frogleg';
let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let selected = 1;
let speed = 18;
let yaw = -0.58;
let pitch = 0.3;
let isolate = false;
let lastTime = null;
let commutationDemo = null;
let pointer = null;
let geometry = [];
const flow = Object.fromEntries(
  ['L', 'W'].flatMap((family) =>
    Array.from({ length: 8 }, (_, index) => [`${family}${index + 1}`, 0]),
  ),
);
const wavePoints = new Map();

function project([x, y, z]) {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  const scale = 580 / (950 - z2);
  return { x: 405 + x1 * scale, y: 188 - y1 * scale, z: z2 };
}

const radial = (radius, degrees, axial) => [
  radius * Math.cos(radians(degrees)),
  radius * Math.sin(radians(degrees)),
  axial,
];

function polygon(points, fill, stroke = '#758e8838') {
  const projected = points.map(project);
  geometry.push({
    depth:
      projected.reduce((sum, point) => sum + point.z, 0) / projected.length,
    draw() {
      ctx.beginPath();
      projected.forEach((point, index) =>
        index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
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
  const pa = project(a);
  const pb = project(b);
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
  const projected = project(point);
  geometry.push({
    depth: projected.z + 2,
    draw() {
      ctx.font = `600 ${size}px 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#ffffffed';
      ctx.lineWidth = 4;
      ctx.strokeText(copy, projected.x, projected.y);
      ctx.fillStyle = color;
      ctx.fillText(copy, projected.x, projected.y);
    },
  });
}

function arrow(a, b, color, width = 2.6, alpha = 1) {
  const pa = project(a);
  const pb = project(b);
  geometry.push({
    depth: (pa.z + pb.z) / 2 + 3,
    draw() {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      const theta = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pb.x, pb.y);
      ctx.lineTo(
        pb.x - 8 * Math.cos(theta - 0.45),
        pb.y - 8 * Math.sin(theta - 0.45),
      );
      ctx.lineTo(
        pb.x - 8 * Math.cos(theta + 0.45),
        pb.y - 8 * Math.sin(theta + 0.45),
      );
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  });
}

function ring(outer, inner, front, back, rotation, sectors, fill) {
  for (let index = 0; index < sectors; index++) {
    const start = (index * 360) / sectors + rotation;
    const end = ((index + 1) * 360) / sectors + rotation;
    polygon(
      [
        radial(outer, start, back),
        radial(outer, end, back),
        radial(outer, end, front),
        radial(outer, start, front),
      ],
      fill,
    );
    polygon(
      [
        radial(inner, start, back),
        radial(inner, end, back),
        radial(inner, end, front),
        radial(inner, start, front),
      ],
      fill,
    );
    for (const axial of [front, back])
      polygon(
        [
          radial(inner, start, axial),
          radial(outer, start, axial),
          radial(outer, end, axial),
          radial(inner, end, axial),
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

function flowingArrows(points, section, alpha) {
  if (Math.abs(section.current) < 0.015) return;
  const path = section.current > 0 ? points : [...points].reverse();
  const lengths = path
    .slice(1)
    .map((point, index) =>
      Math.hypot(...point.map((value, axis) => value - path[index][axis])),
    );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  for (
    let distance = mod(flow[section.key], 125);
    distance < total;
    distance += 125
  ) {
    let local = distance;
    let index = 0;
    while (index < lengths.length - 1 && local > lengths[index]) {
      local -= lengths[index];
      index++;
    }
    if (local < 4 || lengths[index] < 1) continue;
    const start = path[index];
    const end = path[index + 1];
    const finish = local / lengths[index];
    const begin = Math.max(0, finish - 14 / lengths[index]);
    arrow(
      start.map((value, axis) => value + (end[axis] - value) * begin),
      start.map((value, axis) => value + (end[axis] - value) * finish),
      colors.arrow,
      2.2,
      alpha,
    );
  }
}

function renderRotorSlots(state) {
  ring(158, 72, 88, -88, -angle, 48, '#9fb5af35');
  for (let index = 0; index < 8; index++) {
    const slotDegrees = 180 - index * 45 - angle;
    const toothDegrees = slotDegrees - 22.5;
    radialPrism(150, 193, 15.5, -88, 88, toothDegrees, '#9eb5af70');
    radialPrism(157, 195, 5.6, -90, 90, slotDegrees, '#3249468c');
    label(radial(211, slotDegrees, 102), `S${index + 1}`, '#385f59', 12);
  }
  ring(18, 0, 242, -135, 0, 16, '#8ba29a88');
  for (let index = 0; index < 8; index++) {
    const center = 180 - index * 45 - angle;
    const potential = state.potentials[index];
    const copper =
      potential > 0.5
        ? '#4f7fb4ea'
        : potential < -0.5
          ? '#3e9474ea'
          : '#cb873dea';
    for (let offset = -22; offset < 22; offset += 5.5) {
      const start = center + offset;
      const end = Math.min(center + offset + 5.5, center + 22);
      polygon(
        [
          radial(84, start, 148),
          radial(84, end, 148),
          radial(84, end, 193),
          radial(84, start, 193),
        ],
        copper,
        copper,
      );
      polygon(
        [
          radial(22, start, 194),
          radial(84, start, 194),
          radial(84, end, 194),
          radial(22, end, 194),
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
    label(radial(61, center, 198), `C${index + 1}`, '#624322', 10);
  }
}

function renderMachine(state) {
  geometry = [];
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 800, 400);
  for (const pole of state.poles) {
    radialPrism(
      238,
      270,
      82,
      -112,
      90,
      pole.position,
      pole.north ? '#bc665440' : '#557eaa40',
    );
    label(
      radial(282, pole.position, 104),
      `${pole.north ? 'N' : 'S'}${Math.ceil(pole.id / 2)}`,
      pole.north ? '#a84f42' : colors.positive,
      15,
    );
  }
  label([0, -294, 0], '固定 4 极 · N—S—N—S', '#39796f', 14);
  renderRotorSlots(state);
  for (const section of state.sections) {
    const active = section.compositeId === selected;
    const alpha = active ? 1 : isolate ? 0.05 : 0.24;
    const familyColor = section.family === 'lap' ? colors.lap : colors.wave;
    const wireColor = section.commuting ? colors.comm : familyColor;
    for (let index = 0; index < section.path.length - 1; index++) {
      line(
        section.path[index],
        section.path[index + 1],
        '#704d34',
        active ? 5.6 : 4,
        alpha,
      );
      line(
        section.path[index],
        section.path[index + 1],
        wireColor,
        active ? 3.7 : 2.3,
        alpha,
      );
    }
    flowingArrows(section.path, section, alpha);
  }
  for (const composite of state.composites) {
    const slotAngle = 135 - (composite.id - 1) * 45 - angle;
    const active = composite.id === selected;
    if (!isolate || active)
      label(
        radial(224, slotAngle, -108),
        `F${composite.id}${active ? ' ★' : ''}`,
        active ? '#9a5d22' : '#55736d',
        active ? 17 : 12,
      );
  }
  for (const brush of state.brushes) {
    radialPrism(83, 118, 13, 151, 191, brush.position, '#334b65');
    const inner = radial(122, brush.position, 175);
    const outer = radial(176, brush.position, 175);
    arrow(
      brush.positive ? outer : inner,
      brush.positive ? inner : outer,
      brush.positive ? colors.positive : colors.negative,
      2.5,
    );
    label(
      radial(154, brush.position, 207),
      `${brush.positive ? 'B＋' : 'B−'}${Math.floor(brush.index / 2) + 1}`,
      brush.positive ? colors.positive : colors.negative,
      12,
    );
  }
  const selectedComposite = state.composites[selected - 1];
  for (const section of [selectedComposite.lap, selectedComposite.wave]) {
    if (!section.commuting) continue;
    const brush = state.brushes.find(
      (candidate) => candidate.id === section.commutingBrushId,
    );
    label(
      radial(143, brush.position, 226),
      `${section.key} 短接`,
      colors.comm,
      13,
    );
  }
  geometry.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw());
}

function signed(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function direction(section) {
  if (Math.abs(section.current) < 0.015) return '·';
  return section.current > 0 ? '↑' : '↓';
}

function terminals(section) {
  return `C${section.terminals[0] + 1}→C${section.terminals[1] + 1}`;
}

function svgText(x, y, copy, color = colors.ink, size = 12, anchor = 'middle') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${copy}</text>`;
}

function renderTracking(state) {
  const composite = state.composites[selected - 1];
  $('tracking-title').textContent = `跟踪复合线圈 F${selected}`;
  $('current-value').innerHTML =
    `<span class="lap-value">${composite.lap.key} ${signed(composite.lap.current)} A</span>` +
    `<span class="wave-value">${composite.wave.key} ${signed(composite.wave.current)} A</span>`;
  for (const item of state.composites) {
    const button = $(`coil-${item.id}`);
    button.setAttribute('aria-pressed', String(item.id === selected));
    button.style.setProperty(
      '--coil-color',
      item.id === selected ? '#9a5d22' : '#7b918b',
    );
    button.setAttribute(
      'aria-label',
      `复合线圈 F${item.id}，${item.lap.key} ${signed(item.lap.current)} 安，${item.wave.key} ${signed(item.wave.current)} 安`,
    );
    button.innerHTML = `<span>F${item.id}</span><small>L${direction(item.lap)} W${direction(item.wave)}</small>`;
  }
  const amplitude = 0.3;
  let svg =
    '<path d="M45 18V102H531M45 60H531" stroke="#b8cec6" stroke-width="1" fill="none"/>';
  svg +=
    svgText(31, 26, '+0.30', colors.ink, 10) +
    svgText(31, 64, '0', colors.ink, 11) +
    svgText(31, 100, '−0.30', colors.ink, 10);
  for (const degree of [0, 90, 180, 270, 360]) {
    const x = 45 + degree * 1.35;
    svg +=
      `<path d="M${x} 18V102" stroke="#dce7e0" stroke-dasharray="3 4"/>` +
      svgText(x, 120, `${degree}°`, '#60796f', 11);
  }
  const key = `${state.mode}:${selected}`;
  if (!wavePoints.has(key)) {
    const lap = [];
    const wave = [];
    for (let degree = 0; degree <= 360; degree += 1) {
      const item = windingState(degree, state.mode).composites[selected - 1];
      const x = 45 + degree * 1.35;
      lap.push(`${x},${60 - (item.lap.current / amplitude) * 36}`);
      wave.push(`${x},${60 - (item.wave.current / amplitude) * 36}`);
    }
    wavePoints.set(key, { lap: lap.join(' '), wave: wave.join(' ') });
  }
  const points = wavePoints.get(key);
  svg += `<polyline points="${points.lap}" fill="none" stroke="${colors.lap}" stroke-width="2.2"/>`;
  svg += `<polyline points="${points.wave}" fill="none" stroke="${colors.wave}" stroke-width="2.2"/>`;
  const x = 45 + state.angle * 1.35;
  const lapY = 60 - (composite.lap.current / amplitude) * 36;
  const waveY = 60 - (composite.wave.current / amplitude) * 36;
  svg += `<path d="M${x} 15V102" stroke="#8b9d97" stroke-dasharray="3 3"/>`;
  svg += `<circle cx="${x}" cy="${lapY}" r="4.5" fill="${colors.lap}" stroke="white" stroke-width="2"/>`;
  svg += `<circle cx="${x}" cy="${waveY}" r="4.5" fill="${colors.wave}" stroke="white" stroke-width="2"/>`;
  svg += svgText(288, 13, 'I / A　　蓝 L　紫 W　　转子角度 θ', '#60796f', 10.5);
  $('wave').innerHTML = svg;
  const shorted = [composite.lap, composite.wave]
    .filter((section) => section.commuting)
    .map((section) => section.key);
  $('tracking-state').textContent = shorted.length
    ? `${shorted.join('、')} 被同一电刷跨片短接，电流过零换向。`
    : `${composite.lap.key} ${terminals(composite.lap)} · ${composite.wave.key} ${terminals(composite.wave)}`;
  $('slot-summary').textContent =
    `F${composite.id} = ${composite.lap.key} + ${composite.wave.key}：两组独立 section 同槽嵌入 ` +
    `S${composite.slots[0] + 1}—S${composite.slots[1] + 1}，均为 2 槽整距。`;
}

function render() {
  const state = windingState(angle, mode);
  const modeName = mode === 'frogleg' ? 'Frog-Leg' : 'Simplex-B';
  $('angle').value = String(state.angle);
  $('angle-value').textContent = `${state.angle.toFixed(1)}°`;
  $('machine-tag').textContent =
    mode === 'frogleg' ? 'Frog-Leg · 8 条导电支路' : 'Simplex-B · 4 条外部支路';
  $('topology-tag').textContent = `当前：${modeName}`;
  $('configuration-summary').innerHTML =
    `4 极 · 8 槽 · 8 片换向片 · 8 个复合线圈　<span>${modeName}；每个线圈跨 2 槽，箭头表示传统电流。</span>`;
  $('commutation-summary').textContent =
    mode === 'frogleg'
      ? 'Lap 永久接相邻片；Wave 按 Cj → C(j+3) 构成 duplex retrogressive wave。'
      : 'Lap 不动；Wave 改接为 C(j+1) → C(j+2)，与同槽 Lap section 同相并联。';
  $('connection-sequence').textContent =
    mode === 'frogleg'
      ? 'simplex progressive lap + duplex retrogressive wave'
      : 'Lx ∥ W(x−1) · 全铜利用 simplex progressive lap';
  $('frogleg-mode').setAttribute('aria-pressed', String(mode === 'frogleg'));
  $('simplex-mode').setAttribute('aria-pressed', String(mode === 'simplex'));
  $('circuit').innerHTML = connectionDiagram(mode);
  renderMachine(state);
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

function setMode(nextMode) {
  pause();
  mode = nextMode;
  render();
}

for (let id = 1; id <= 8; id++) {
  $('coil').insertAdjacentHTML(
    'beforeend',
    `<option value="${id}">F${id}</option>`,
  );
  const button = document.createElement('button');
  button.id = `coil-${id}`;
  button.addEventListener('click', () => choose(id));
  $('coil-cards').append(button);
}

$('coil').addEventListener('change', (event) =>
  choose(Number(event.target.value)),
);
$('frogleg-mode').addEventListener('click', () => setMode('frogleg'));
$('simplex-mode').addEventListener('click', () => setMode('simplex'));
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
  let offset = 0;
  for (let delta = 0; delta < 360; delta += 0.5) {
    const composite = windingState(angle + delta, mode).composites[
      selected - 1
    ];
    if (composite.lap.commuting || composite.wave.commuting) {
      offset = delta;
      break;
    }
  }
  const margin = COMMUTATION_HALF_WIDTH + 2;
  angle = mod(angle + offset - margin);
  commutationDemo = { remaining: margin * 2 };
  running = true;
  lastTime = null;
  syncPlay();
  render();
});
$('reset').addEventListener('click', () => {
  pause();
  angle = 0;
  mode = 'frogleg';
  yaw = -0.58;
  pitch = 0.3;
  isolate = false;
  speed = 18;
  Object.keys(flow).forEach((key) => {
    flow[key] = 0;
  });
  $('speed').value = '18';
  $('focus').setAttribute('aria-pressed', 'false');
  choose(1);
});
$('speed').addEventListener('change', (event) => {
  speed = Number(event.target.value);
});
$('angle').addEventListener('input', (event) => {
  pause();
  angle = mod(Number(event.target.value));
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
canvas.addEventListener('pointerdown', (event) => {
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  yaw = Math.max(
    -1.35,
    Math.min(1.35, yaw + (event.clientX - pointer.x) * 0.006),
  );
  pitch = Math.max(
    -0.8,
    Math.min(0.8, pitch + (event.clientY - pointer.y) * 0.006),
  );
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  render();
});
const endPointer = () => {
  pointer = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

document.addEventListener('keydown', (event) => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.closest('input, select, textarea')
  )
    return;
  if (event.key === ' ' && event.target.closest('button, a')) return;
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
    ].includes(event.key) ||
    window.parent === window
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
    touchStart = event.target.closest('canvas, button, a, input, select')
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
    for (const section of windingState(angle, mode).sections)
      flow[section.key] += dt * 180 * Math.abs(section.current);
    render();
  }
  requestAnimationFrame(frame);
}

resize();
syncPlay();
render();
requestAnimationFrame(frame);
