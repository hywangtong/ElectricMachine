import {
  COMMUTATION_HALF_WIDTH,
  SEGMENT_COUNT,
  SLOT_COUNT,
  advanceAngle,
  commutatorAngle,
  mod,
  radians,
  toothPoint,
  windingState,
} from './dc-motor-lap-wave-five-model.js';
import { connectionDiagram } from './dc-motor-lap-wave-five-diagram.js';

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
let mode = 'lap';
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
  Array.from({ length: SLOT_COUNT }, (_, index) => [`Q${index + 1}`, 0]),
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
  if (Math.abs(section.current) < 0.01) return;
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

function renderRotor(state) {
  const slotStep = 360 / SLOT_COUNT;
  const segmentStep = 360 / SEGMENT_COUNT;
  ring(158, 72, 88, -88, -angle, 40, '#9fb5af35');
  for (let index = 0; index < SLOT_COUNT; index++) {
    const slotDegrees = 180 - index * slotStep - angle;
    const toothDegrees = slotDegrees - slotStep / 2;
    radialPrism(150, 193, 25, -88, 88, toothDegrees, '#9eb5af70');
    radialPrism(157, 195, 6.5, -90, 90, slotDegrees, '#3249468c');
    label(radial(211, slotDegrees, 102), `S${index + 1}`, '#385f59', 12);
  }
  ring(18, 0, 242, -135, 0, 16, '#8ba29a88');
  for (let index = 0; index < SEGMENT_COUNT; index++) {
    const center = commutatorAngle(index, angle);
    const potential = state.potentials[index];
    const copper =
      potential > 0.5
        ? '#4f7fb4ea'
        : potential < -0.5
          ? '#3e9474ea'
          : '#cb873dea';
    for (let offset = -35; offset < 35; offset += 7) {
      const start = center + offset;
      const end = Math.min(center + offset + 7, center + 35);
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
      radial(22, center + segmentStep / 2, 195),
      radial(84, center + segmentStep / 2, 195),
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
  renderRotor(state);
  for (const section of state.sections) {
    const active = section.coilId === selected;
    const alpha = active ? 1 : isolate ? 0.05 : 0.3;
    const familyColor = mode === 'lap' ? colors.lap : colors.wave;
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
  const slotStep = 360 / SLOT_COUNT;
  for (const coil of state.coils) {
    const coilAngle = 180 - (coil.id - 0.5) * slotStep - angle;
    const active = coil.id === selected;
    if (!isolate || active)
      label(
        radial(229, coilAngle, -108),
        `Q${coil.id}${active ? ' ★' : ''}`,
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
  const selectedSection = state.coils[selected - 1].section;
  if (selectedSection.commuting) {
    const brush = state.brushes.find(
      (candidate) => candidate.id === selectedSection.commutingBrushId,
    );
    label(
      radial(143, brush.position, 226),
      `${selectedSection.key} 短接`,
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
  if (Math.abs(section.current) < 0.01) return '·';
  return section.current > 0 ? '↑' : '↓';
}

function terminals(section) {
  return `C${section.terminals[0] + 1}→C${section.terminals[1] + 1}`;
}

function svgText(x, y, copy, color = colors.ink, size = 12, anchor = 'middle') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${copy}</text>`;
}

function currentCurve(selectedCoil, selectedMode) {
  const key = `${selectedMode}:${selectedCoil}`;
  if (wavePoints.has(key)) return wavePoints.get(key);
  const samples = [];
  let amplitude = 0;
  for (let degree = 0; degree <= 360; degree += 1) {
    const current = windingState(degree, selectedMode).coils[selectedCoil - 1]
      .section.current;
    amplitude = Math.max(amplitude, Math.abs(current));
    samples.push(current);
  }
  amplitude = Math.max(0.25, Math.ceil(amplitude * 4) / 4);
  const points = samples
    .map((current, degree) => {
      const x = 45 + degree * 1.35;
      const y = 60 - (current / amplitude) * 36;
      return `${x},${y}`;
    })
    .join(' ');
  const curve = { amplitude, points };
  wavePoints.set(key, curve);
  return curve;
}

function renderTracking(state) {
  const coil = state.coils[selected - 1];
  const section = coil.section;
  const modeName = mode === 'lap' ? '叠绕组' : '波绕组';
  $('tracking-title').textContent = `跟踪线圈 Q${selected}`;
  $('current-value').innerHTML = `<span class="${mode}-value">${modeName} ${signed(section.current)} A</span>`;
  for (const item of state.coils) {
    const button = $(`coil-${item.id}`);
    button.setAttribute('aria-pressed', String(item.id === selected));
    button.style.setProperty(
      '--coil-color',
      item.id === selected ? '#9a5d22' : '#7b918b',
    );
    button.setAttribute(
      'aria-label',
      `线圈 Q${item.id}，${modeName} ${signed(item.section.current)} 安`,
    );
    button.innerHTML = `<span>Q${item.id}</span><small>I${direction(item.section)}</small>`;
  }
  const curve = currentCurve(selected, mode);
  let svg =
    '<path d="M45 18V102H531M45 60H531" stroke="#b8cec6" stroke-width="1" fill="none"/>';
  svg +=
    svgText(31, 26, `+${curve.amplitude.toFixed(2)}`, colors.ink, 10) +
    svgText(31, 64, '0', colors.ink, 11) +
    svgText(31, 100, `−${curve.amplitude.toFixed(2)}`, colors.ink, 10);
  for (const degree of [0, 90, 180, 270, 360]) {
    const x = 45 + degree * 1.35;
    svg +=
      `<path d="M${x} 18V102" stroke="#dce7e0" stroke-dasharray="3 4"/>` +
      svgText(x, 120, `${degree}°`, '#60796f', 11);
  }
  const curveColor = mode === 'lap' ? colors.lap : colors.wave;
  svg += `<polyline points="${curve.points}" fill="none" stroke="${curveColor}" stroke-width="2.2"/>`;
  const x = 45 + state.angle * 1.35;
  const y = 60 - (section.current / curve.amplitude) * 36;
  svg += `<path d="M${x} 15V102" stroke="#8b9d97" stroke-dasharray="3 3"/>`;
  svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="${curveColor}" stroke="white" stroke-width="2"/>`;
  svg += svgText(
    288,
    13,
    `I / A　　${modeName}　　转子角度 θ`,
    '#60796f',
    10.5,
  );
  $('wave').innerHTML = svg;
  $('tracking-state').textContent = section.commuting
    ? `${section.key} 的两端被同一电刷跨接，电流处于换向区。`
    : `${section.key}：${terminals(section)} · 当前 ${state.brushes.length} 个刷臂`;
  $('slot-summary').textContent =
    `Q${coil.id}：S${coil.slots[0] + 1} 上层 → S${coil.slots[1] + 1} 下层，` +
    `实体线圈跨 1 槽；${modeName}端接 ${terminals(section)}。`;
}

function render() {
  const state = windingState(angle, mode);
  const modeName = mode === 'lap' ? '叠绕组' : '波绕组';
  $('angle').value = String(state.angle);
  $('angle-value').textContent = `${state.angle.toFixed(1)}°`;
  $('machine-tag').textContent =
    mode === 'lap' ? '叠绕组 · 4 刷臂' : '波绕组 · 2 刷臂';
  $('topology-tag').textContent = `当前：${modeName}`;
  $('configuration-summary').innerHTML =
    `4 极 · 5 槽 · 5 片换向片 · 5 个实体线圈　<span>${modeName}；` +
    `每个线圈跨 1 槽，箭头表示传统电流。</span>`;
  $('commutation-summary').textContent =
    mode === 'lap'
      ? '叠绕组按 Ci → C(i+1) 接相邻片，理论并联支路 A = 4。'
      : '波绕组跨 2 片，B 端更短；理论并联支路 A = 2。';
  $('connection-sequence').textContent =
    mode === 'lap'
      ? 'Lap：C1 → C2 → C3 → C4 → C5 → C1'
      : 'Wave：C1 → C3 → C5 → C2 → C4 → C1';
  $('lap-mode').setAttribute('aria-pressed', String(mode === 'lap'));
  $('wave-mode').setAttribute('aria-pressed', String(mode === 'wave'));
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

for (let id = 1; id <= SLOT_COUNT; id++) {
  $('coil').insertAdjacentHTML(
    'beforeend',
    `<option value="${id}">Q${id}</option>`,
  );
  const button = document.createElement('button');
  button.id = `coil-${id}`;
  button.addEventListener('click', () => choose(id));
  $('coil-cards').append(button);
}

$('coil').addEventListener('change', (event) =>
  choose(Number(event.target.value)),
);
$('lap-mode').addEventListener('click', () => setMode('lap'));
$('wave-mode').addEventListener('click', () => setMode('wave'));
$('play').addEventListener('click', () => {
  commutationDemo = null;
  running = !running;
  lastTime = null;
  syncPlay();
});
$('step').addEventListener('click', () => {
  pause();
  angle = mod(angle + 36);
  render();
});
$('commute').addEventListener('click', () => {
  pause();
  let offset = 0;
  let previous = windingState(angle, mode).coils[selected - 1].section.current;
  for (let delta = 0.5; delta < 360; delta += 0.5) {
    const section = windingState(angle + delta, mode).coils[selected - 1]
      .section;
    if (
      section.commuting ||
      Math.abs(section.current) < 0.01 ||
      previous * section.current < 0
    ) {
      offset = delta;
      break;
    }
    if (Math.abs(section.current) >= 0.01) previous = section.current;
  }
  const margin = COMMUTATION_HALF_WIDTH + 3;
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
  mode = 'lap';
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
