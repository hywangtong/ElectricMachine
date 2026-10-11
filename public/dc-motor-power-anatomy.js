import {
  commutationState,
  flowPowerParts,
  powerParts as anatomyPowerParts,
  rotorFrameField,
} from './dc-motor-power-anatomy-model.mjs';

const $ = (id) => document.getElementById(id);
const canvas = $('machine');
const ctx = canvas.getContext('2d');
const inset = $('field-inset');
const fieldCtx = inset.getContext('2d');
const lesson = document.querySelector('.lesson');
const powerParts =
  lesson.dataset.mode === 'flow' ? flowPowerParts : anatomyPowerParts;
const tau = Math.PI * 2;
const descriptions = {
  P1: [
    '输入电功率 · 电源端口',
    'P₁ = UI',
    '端电压 U 与输入电流 I 对应电源向两条支路供电的功率。',
  ],
  P2: [
    '轴端输出功率 · 输出轴',
    'P₂ = T₂Ω',
    '轴端向负载传递转矩 T₂，并以角速度 Ω（转速 n）旋转。',
  ],
  Pal: [
    '总损耗 · 内部损耗合计',
    'Pₐₗ = PFe + PCu + Pme + Pad',
    '铁芯、两类绕组、轴承、风扇和电刷一起高亮；杂散损耗分散于内部。',
  ],
  PFe: [
    '铁损耗 · 旋转电枢铁芯',
    'PFe = 磁滞损耗 + 涡流损耗',
    '定子磁场固定，但铁芯材料点随转子转动，所经历的磁场交替变化。',
  ],
  PCu: [
    '铜损耗 · 两类绕组',
    'PCu = RₐIₐ² + RfIf²',
    '电枢线圈与定子励磁线圈都通电，电阻使电能转化为热。',
  ],
  Pme: [
    '机械损耗 · 摩擦与通风',
    'Pme = 摩擦损耗 + 通风损耗',
    '两端轴承、电刷接触面的摩擦，以及同轴散热风扇的通风风阻。',
  ],
  Pad: [
    '附加损耗 · 杂散损耗',
    'Pad = 杂散负载损耗',
    '负载下磁场畸变、漏磁等引起；虚线示意分布范围，不代表独立零件。',
  ],
  Pe: [
    '电磁功率 · 空载损耗与轴输出之和',
    'Pₑ = EIₐ = TₑΩ = P₀ + P₂',
    '转换后的机械功率分为内部损耗 P₀ 与轴输出 P₂；铁芯、轴承、风扇、电刷、杂散区域和输出轴同时高亮。',
  ],
  P0: [
    '空载损耗 · 铁耗、机械耗与附加耗',
    'P₀ = PFe + Pme + Pad = Pₑ − P₂',
    '铁芯、轴承、风扇、电刷摩擦处与杂散区域同时高亮；两类绕组的铜耗已在前一级扣除。',
  ],
};
let selected = 'P1';
let angle = (25 * Math.PI) / 180;
let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let yaw = -0.32;
let pitch = 0.27;
let pointer = null;
let lastTime = null;
let shapes = [];
let labels = [];

const active = (part) => powerParts[selected].parts.includes(part);
const partColor = (part, ordinary) =>
  active(part) ? powerParts[selected].color : ordinary;
const highlightInk = (part) =>
  active(part)
    ? selected === 'P1'
      ? '#15803d'
      : selected === 'P2'
        ? '#2563eb'
        : selected === 'Pe'
          ? '#0f766e'
          : '#946b00'
    : '#55736d';
const radial = (x, radius, phase) => [
  x,
  radius * Math.cos(phase),
  radius * Math.sin(phase),
];
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function shade(hex, factor) {
  const value = parseInt(hex.slice(1), 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return `rgb(${channels.map((v) => Math.round(Math.min(255, v * factor))).join(',')})`;
}

function project([x, y, z]) {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const depth = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  const scale = 930 / (1050 - depth);
  return { x: 495 + x1 * scale, y: 195 - y1 * scale, z: depth };
}

function polygon(points, fill, stroke = '#566a6945') {
  const vertices = points.map(project);
  shapes.push({
    depth: vertices.reduce((sum, p) => sum + p.z, 0) / vertices.length,
    draw() {
      ctx.beginPath();
      vertices.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    },
  });
}

function line(points, color, width = 2, dashed = false) {
  // Separate segments give wires the same depth ordering as solid surfaces.
  for (let i = 1; i < points.length; i++) {
    const a = project(points[i - 1]),
      b = project(points[i]);
    shapes.push({
      depth: (a.z + b.z) / 2 + 1,
      draw() {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.setLineDash(dashed ? [5, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      },
    });
  }
}

function arrow(a, b, color, width = 2.5) {
  line([a, b], color, width);
  const pa = project(a),
    pb = project(b);
  shapes.push({
    depth: (pa.z + pb.z) / 2 + 2,
    draw() {
      const direction = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      ctx.beginPath();
      ctx.moveTo(pb.x, pb.y);
      ctx.lineTo(
        pb.x - 8 * Math.cos(direction - 0.48),
        pb.y - 8 * Math.sin(direction - 0.48),
      );
      ctx.lineTo(
        pb.x - 8 * Math.cos(direction + 0.48),
        pb.y - 8 * Math.sin(direction + 0.48),
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    },
  });
}

function label(point, text, color = '#55736d', offset = [0, 0], size = 16) {
  labels.push(() => {
    const p = project(point);
    const x = p.x + offset[0],
      y = p.y + offset[1];
    if (Math.hypot(...offset) > 18) {
      ctx.strokeStyle = '#8fa29a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(x, y - 8);
      ctx.stroke();
    }
    ctx.font = `600 ${size}px 'Microsoft YaHei', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffffee';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  });
}

function box(x0, x1, y0, y1, z0, z1, color) {
  const corners = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  [
    [0, 1, 2, 3],
    [4, 7, 6, 5],
    [0, 4, 5, 1],
    [3, 2, 6, 7],
    [0, 3, 7, 4],
    [1, 5, 6, 2],
  ].forEach((face, i) =>
    polygon(
      face.map((index) => corners[index]),
      shade(color, [0.7, 1.04, 0.75, 1.1, 0.82, 0.94][i]),
    ),
  );
}

function tube(x0, x1, outer, inner, color, rotation = 0, pieces = 32) {
  for (let i = 0; i < pieces; i++) {
    const a = rotation + (i * tau) / pieces,
      b = rotation + ((i + 1) * tau) / pieces;
    polygon(
      [
        radial(x0, outer, a),
        radial(x1, outer, a),
        radial(x1, outer, b),
        radial(x0, outer, b),
      ],
      shade(color, 0.76 + 0.25 * Math.cos(a - 0.5)),
    );
    for (const x of [x0, x1])
      polygon(
        [
          radial(x, inner, a),
          radial(x, outer, a),
          radial(x, outer, b),
          radial(x, inner, b),
        ],
        shade(color, x === x1 ? 1.08 : 0.85),
      );
    if (inner)
      polygon(
        [
          radial(x0, inner, a),
          radial(x0, inner, b),
          radial(x1, inner, b),
          radial(x1, inner, a),
        ],
        shade(color, 0.65),
      );
  }
}

function arc(x, radius, start, end, color, width = 2) {
  const points = Array.from({ length: 33 }, (_, i) =>
    radial(x, radius, start + ((end - start) * i) / 32),
  );
  line(points, color, width);
  return points;
}

function renderStator() {
  for (const side of [1, -1]) {
    const y = side * 144;
    box(
      -94,
      94,
      side > 0 ? 108 : -131,
      side > 0 ? 131 : -108,
      -70,
      70,
      side > 0 ? '#b78380' : '#8aabc2',
    );
    box(-57, 57, y - 16, y + 16, -46, 46, '#869e99');
    // Excitation coils wrap the fixed pole necks; both belong to Rf.
    for (let turn = 0; turn < 7; turn++) {
      const coilY = y - 20 + turn * 6;
      const points = [
        [-68, coilY, -56],
        [68, coilY, -56],
        [68, coilY, 56],
        [-68, coilY, 56],
        [-68, coilY, -56],
      ];
      line(points, '#77512f', active('field') ? 7 : 5);
      line(points, partColor('field', '#b76d3c'), active('field') ? 5 : 3.3);
    }
    label(
      [10, side * 112, 73],
      side > 0 ? 'N' : 'S',
      side > 0 ? '#a44840' : '#406c95',
      [0, 0],
      21,
    );
  }
  arrow([90, 92, -70], [90, -92, -70], '#8b58ae', 2.5);
  label([110, 0, -68], 'B 固定', '#8b58ae', [30, 0], 14);
  label([-5, 171, 55], '定子励磁线圈', highlightInk('field'), [0, -23]);
}

function renderBearings() {
  for (const x of [-255, 220]) {
    const color = partColor('bearings', '#a2b4b0');
    box(x - 24, x + 24, -78, -35, -34, 34, color);
    tube(x - 15, x + 15, 40, 15, color, 0, 24);
    // Stationary race with rolling elements, separate from the rotating shaft.
    for (let i = 0; i < 10; i++) {
      const p = project(radial(x + 16, 27, (i * tau) / 10));
      shapes.push({
        depth: p.z + 1,
        draw() {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, tau);
          ctx.fillStyle = active('bearings') ? '#fff3a0' : '#dce6e1';
          ctx.fill();
          ctx.strokeStyle = '#6c807a';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        },
      });
    }
    label(
      [x, -53, 30],
      x < 0 ? '左端轴承' : '右端轴承',
      highlightInk('bearings'),
      [0, 42],
    );
  }
}

function renderRotor(state) {
  tube(-290, 350, 11, 0, partColor('output', '#b4c5c5'), angle, 16);
  tube(-108, 108, 72, 12, partColor('iron', '#8d9fa5'), angle, 36);
  for (let x = -98; x <= 98; x += 15)
    arc(
      x,
      72.7,
      angle,
      angle + tau,
      active('iron') ? '#ba8b19' : '#647f8590',
      0.8,
    );
  // A material stripe turns with the iron, rather than moving on the surface.
  line(
    [radial(-104, 73, angle + 0.55), radial(104, 73, angle + 0.55)],
    active('iron') ? '#fff5b0' : '#425f67',
    4,
  );
  label([0, 0, 75], '转子铁芯', highlightInk('iron'), [0, 0]);
  const sideA = [radial(-112, 80, angle), radial(112, 80, angle)];
  const sideB = [
    radial(112, 80, angle + Math.PI),
    radial(-112, 80, angle + Math.PI),
  ];
  const endTurn = Array.from({ length: 25 }, (_, i) =>
    radial(116, 80, angle + (i * Math.PI) / 24),
  );
  const leadA = [radial(-157, 32, angle), radial(-127, 80, angle), sideA[0]];
  const leadB = [
    sideB[1],
    radial(-127, 80, angle + Math.PI),
    radial(-157, 32, angle + Math.PI),
  ];
  const path = [
    ...leadA,
    ...sideA.slice(1),
    ...endTurn.slice(1),
    ...sideB,
    ...leadB.slice(1),
  ];
  line(path, '#674330', active('armature') ? 8 : 6.5);
  line(path, partColor('armature', '#d48b47'), active('armature') ? 5.8 : 4.5);
  // One coil, two insulated segments. A/B stay attached to the rotor.
  for (let segment = 0; segment < 2; segment++) {
    const center = angle + segment * Math.PI;
    for (let i = 0; i < 18; i++) {
      const a = center - Math.PI / 2 + 0.055 + (i * (Math.PI - 0.11)) / 18;
      const b = a + (Math.PI - 0.11) / 18;
      const fill = shade('#bf7b48', 0.8 + 0.2 * Math.cos(a));
      polygon(
        [
          radial(-202, 33, a),
          radial(-157, 33, a),
          radial(-157, 33, b),
          radial(-202, 33, b),
        ],
        fill,
      );
      polygon(
        [
          radial(-157, 12, a),
          radial(-157, 33, a),
          radial(-157, 33, b),
          radial(-157, 12, b),
        ],
        '#deaa68',
      );
    }
    label(
      radial(-178, 39, center),
      segment === 0 ? 'A' : 'B',
      '#69472b',
      [0, 0],
      12,
    );
  }
  label([-179, 0, -30], '两片换向片', '#55736d', [0, -95], 14);
  // Fixed brushes keep the supply polarity while swapping rotor terminals.
  for (const side of [1, -1]) {
    box(
      -193,
      -167,
      side > 0 ? 32 : -58,
      side > 0 ? 58 : -32,
      -14,
      14,
      partColor('brushes', '#576963'),
    );
    label(
      [-180, side * 57, 14],
      side > 0 ? '正电刷' : '负电刷',
      highlightInk('brushes'),
      side > 0 ? [-35, -15] : [50, 38],
      14,
    );
  }
  if (!state.commuting) {
    const copperCurrent = '#8b46ad';
    for (const [start, end] of [sideA, sideB]) {
      for (const t of [0.28, 0.62]) {
        const a = lerp(start, end, t),
          b = lerp(start, end, t + 0.15);
        arrow(
          state.current > 0 ? a : b,
          state.current > 0 ? b : a,
          copperCurrent,
          3,
        );
      }
    }
    const rotorTerminal = state.current > 0 ? 0 : Math.PI;
    const contact = radial(-178, 34, 0);
    arrow(
      contact,
      radial(-157, 34, rotorTerminal === 0 ? angle : angle + Math.PI),
      '#8b46ad',
      2,
    );
  }
  const coilAnchor = radial(
    25,
    82,
    angle + (Math.sin(angle) < 0 ? Math.PI : 0),
  );
  const coilProjection = project(coilAnchor);
  label(coilAnchor, '电枢线圈', highlightInk('armature'), [
    575 - coilProjection.x,
    275 - coilProjection.y,
  ]);
  // The fan is keyed to the rotating shaft, ahead of the right bearing.
  const fanColor = partColor('fan', '#91aba8');
  tube(142, 157, 19, 11, fanColor, angle, 16);
  for (let i = 0; i < 5; i++) {
    const a = angle + (i * tau) / 5;
    polygon(
      [
        radial(148, 18, a),
        radial(138, 68, a + 0.14),
        radial(158, 68, a + 0.65),
        radial(153, 20, a + 0.55),
      ],
      shade(fanColor, 0.86 + 0.12 * Math.sin(a)),
      active('fan') ? '#b38c13' : '#6f8e88',
    );
  }
  label([150, 65, 0], '散热风扇', highlightInk('fan'), [25, -32]);
  if (active('stray')) {
    for (const x of [-118, 118]) arc(x, 92, angle, angle + tau, '#d6a600', 2.4);
    for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2])
      line([radial(-118, 92, a), radial(118, 92, a)], '#d6a600', 2, true);
  }
}

function renderPorts() {
  const input = partColor('input', '#899e96');
  line(
    [
      [-330, 93, 0],
      [-302, 93, 0],
      [-302, 54, 0],
      [-180, 54, 0],
    ],
    '#7d938b',
    2,
  );
  line(
    [
      [-330, -93, 0],
      [-302, -93, 0],
      [-302, -54, 0],
      [-180, -54, 0],
    ],
    '#7d938b',
    2,
  );
  line(
    [
      [-302, 93, 0],
      [-302, 160, -56],
      [-68, 160, -56],
    ],
    '#9bb0a6',
    1.5,
  );
  line(
    [
      [-68, -160, -56],
      [-302, -160, -56],
      [-302, -93, 0],
    ],
    '#9bb0a6',
    1.5,
  );
  line(
    [
      [68, 160, -56],
      [110, 160, -95],
      [110, -160, -95],
      [68, -160, -56],
    ],
    '#9bb0a6',
    1.5,
  );
  for (const y of [93, -93]) {
    const p = project([-330, y, 0]);
    shapes.push({
      depth: p.z + 2,
      draw() {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, tau);
        ctx.fillStyle = active('input') ? '#bbf7d0' : '#fff';
        ctx.fill();
        ctx.strokeStyle = input;
        ctx.lineWidth = 3;
        ctx.stroke();
      },
    });
    label([-348, y, 0], y > 0 ? '+' : '−', highlightInk('input'), [0, 0], 20);
  }
  arrow([-323, 93, 0], [-267, 93, 0], input, active('input') ? 4 : 2);
  label([-296, 113, 0], 'I 输入', highlightInk('input'), [0, -10], 17);
  line(
    [
      [-369, 76, 0],
      [-369, -76, 0],
    ],
    input,
    active('input') ? 4 : 2,
  );
  label([-392, 0, 0], 'U', highlightInk('input'), [0, 0], 22);
  const output = partColor('output', '#899e96');
  const rotation = arc(
    325,
    39,
    angle,
    angle - Math.PI * 1.55,
    output,
    active('output') ? 4 : 2,
  );
  arrow(rotation.at(-2), rotation.at(-1), output, 3);
  label([320, 65, 0], '转速 n / Ω', highlightInk('output'), [0, -24], 17);
  label([335, -50, 0], '轴端转矩 T₂', highlightInk('output'), [5, 33], 17);
  label([285, 0, 0], '输出轴', highlightInk('output'), [0, 28], 14);
}

function renderMachine() {
  const state = commutationState(angle);
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 1000, 380);
  shapes = [];
  labels = [];
  ctx.fillStyle = '#738f8010';
  ctx.beginPath();
  ctx.ellipse(495, 337, 300, 23, 0, 0, tau);
  ctx.fill();
  renderStator();
  renderBearings();
  renderRotor(state);
  renderPorts();
  shapes.sort((a, b) => a.depth - b.depth).forEach((shape) => shape.draw());
  labels.forEach((draw) => draw());
  canvas.dataset.angle = String(angle);
  canvas.dataset.current = String(state.current);
  canvas.dataset.highlighted = powerParts[selected].parts.join(' ');
  $('current-state').textContent = state.commuting
    ? '线圈电流：电刷跨缝 · 换向区'
    : `线圈电流：${state.current > 0 ? 'A → B（正向）' : 'B → A（反向）'}`;
  $('angle').value = String(Math.round((angle * 180) / Math.PI));
  $('angle-value').value = `${Math.round((angle * 180) / Math.PI)}°`;
  if (active('iron')) renderFieldInset();
}

function insetArrow(x0, y0, x1, y1, color) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  fieldCtx.strokeStyle = color;
  fieldCtx.lineWidth = 3;
  fieldCtx.beginPath();
  fieldCtx.moveTo(x0, y0);
  fieldCtx.lineTo(x1, y1);
  fieldCtx.stroke();
  fieldCtx.beginPath();
  fieldCtx.moveTo(x1, y1);
  fieldCtx.lineTo(x1 - 7 * Math.cos(a - 0.45), y1 - 7 * Math.sin(a - 0.45));
  fieldCtx.lineTo(x1 - 7 * Math.cos(a + 0.45), y1 - 7 * Math.sin(a + 0.45));
  fieldCtx.closePath();
  fieldCtx.fillStyle = color;
  fieldCtx.fill();
}

function renderFieldInset() {
  const b = rotorFrameField(angle);
  fieldCtx.setTransform(2, 0, 0, 2, 0, 0);
  fieldCtx.clearRect(0, 0, 320, 90);
  fieldCtx.font = "12px 'Microsoft YaHei', sans-serif";
  fieldCtx.textAlign = 'center';
  fieldCtx.fillStyle = '#fff0a0';
  fieldCtx.strokeStyle = '#a99041';
  fieldCtx.lineWidth = 1;
  fieldCtx.beginPath();
  fieldCtx.arc(61, 44, 28, 0, tau);
  fieldCtx.fill();
  fieldCtx.stroke();
  fieldCtx.strokeStyle = '#b8ab7b';
  fieldCtx.beginPath();
  fieldCtx.moveTo(23, 44);
  fieldCtx.lineTo(101, 44);
  fieldCtx.moveTo(61, 9);
  fieldCtx.lineTo(61, 80);
  fieldCtx.stroke();
  fieldCtx.fillStyle = '#8b6b16';
  fieldCtx.fillText('yᵣ', 61, 9);
  fieldCtx.fillText('zᵣ', 111, 48);
  fieldCtx.fillStyle = '#774a1b';
  fieldCtx.beginPath();
  fieldCtx.arc(61, 18, 3, 0, tau);
  fieldCtx.fill();
  fieldCtx.fillText('材料点', 26, 17);
  insetArrow(61, 44, 61 + b.z * 25, 44 - b.y * 25, '#8b46ad');
  fieldCtx.fillStyle = '#8b46ad';
  fieldCtx.fillText('B', 61 + b.z * 35, 44 - b.y * 35);
  fieldCtx.fillStyle = '#607e74';
  fieldCtx.fillText('铁芯固定', 61, 88);
  fieldCtx.strokeStyle = '#9da895';
  fieldCtx.beginPath();
  fieldCtx.moveTo(145, 20);
  fieldCtx.lineTo(145, 75);
  fieldCtx.moveTo(145, 45);
  fieldCtx.lineTo(305, 45);
  fieldCtx.stroke();
  fieldCtx.strokeStyle = '#8b46ad';
  fieldCtx.lineWidth = 2;
  fieldCtx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const x = 145 + i,
      y = 45 + 24 * Math.cos((i * tau) / 160);
    if (i) fieldCtx.lineTo(x, y);
    else fieldCtx.moveTo(x, y);
  }
  fieldCtx.stroke();
  const x = 145 + (angle / tau) * 160,
    y = 45 - b.y * 24;
  fieldCtx.fillStyle = '#b48900';
  fieldCtx.beginPath();
  fieldCtx.arc(x, y, 4, 0, tau);
  fieldCtx.fill();
  fieldCtx.fillStyle = '#607e74';
  fieldCtx.fillText('Bᵧᵣ / B₀ = −cos θ', 225, 11);
  fieldCtx.fillText('0°', 145, 88);
  fieldCtx.fillText('360°', 291, 88);
  inset.dataset.fieldY = String(b.y);
  inset.dataset.fieldZ = String(b.z);
}

function selectPower(value) {
  selected = value;
  lesson.dataset.power = value;
  lesson.style.setProperty('--highlight', powerParts[value].color);
  document
    .querySelectorAll('.power-options button')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.power === value),
      ),
    );
  document
    .querySelectorAll('[data-part]')
    .forEach((part) =>
      part.classList.toggle('is-highlighted', active(part.dataset.part)),
    );
  const [title, formula, copy] = descriptions[value];
  $('detail-title').textContent = title;
  $('detail-formula').textContent = formula;
  $('detail-copy').textContent = copy;
  $('rotor-inset').hidden = !active('iron');
  $('inset-placeholder').hidden = active('iron');
  $('stray-note').hidden = !active('stray');
  renderMachine();
}

function updatePlay() {
  $('play').setAttribute('aria-pressed', String(running));
  $('play').textContent = running ? '暂停旋转' : '继续旋转';
}
document
  .querySelectorAll('.power-options button')
  .forEach((button) =>
    button.addEventListener('click', () => selectPower(button.dataset.power)),
  );
$('play').addEventListener('click', () => {
  running = !running;
  lastTime = null;
  updatePlay();
});
$('step').addEventListener('click', () => {
  running = false;
  angle = (angle - Math.PI / 2 + tau) % tau;
  updatePlay();
  renderMachine();
});
$('angle').addEventListener('input', () => {
  running = false;
  angle = (Number($('angle').value) * Math.PI) / 180;
  tauAngle();
  updatePlay();
  renderMachine();
});
function tauAngle() {
  angle = ((angle % tau) + tau) % tau;
}
$('reset-view').addEventListener('click', () => {
  yaw = -0.32;
  pitch = 0.27;
  renderMachine();
});
canvas.addEventListener('pointerdown', (event) => {
  pointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointer) return;
  const scale = canvas.getBoundingClientRect().width / 1000;
  yaw = Math.max(
    -0.8,
    Math.min(0.65, yaw + ((event.clientX - pointer.x) * 0.003) / scale),
  );
  pitch = Math.max(
    -0.35,
    Math.min(0.6, pitch + ((event.clientY - pointer.y) * 0.003) / scale),
  );
  pointer = { x: event.clientX, y: event.clientY };
  renderMachine();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
  canvas.addEventListener(type, () => {
    pointer = null;
  });
// Dragging the 3D view must not also trigger a course-page swipe.
for (const type of ['touchstart', 'touchend'])
  canvas.addEventListener(type, (event) => event.stopPropagation(), {
    passive: true,
  });
document.addEventListener('visibilitychange', () => {
  lastTime = null;
});
function animate(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.06);
  lastTime = time;
  if (running && !document.hidden) {
    // With B = -y and positive coil current along +x on side A,
    // the electromagnetic torque is about -x; rotate in that direction.
    angle = (angle - (dt * Math.PI) / 5 + tau) % tau;
    renderMachine();
  }
  requestAnimationFrame(animate);
}
selectPower('P1');
updatePlay();
requestAnimationFrame(animate);
