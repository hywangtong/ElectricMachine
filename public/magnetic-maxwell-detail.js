let law = new URLSearchParams(location.search).get('law') || 'electric';
if (law === 'ampere') law = 'ampere-current';
const $ = (id) => document.getElementById(id);
const svg = $('diagram');
const faradaySegmentCount = 24;
const faradayAnimationSeconds = 5;
const displacementCycleSeconds = 12;
const state = {
  step: 0,
  count: 0,
  frame: 0,
  faradayProgress: 0,
  displacementProgress: 0,
  displacementPaused: false,
  irregularInside: true,
};

const pages = {
  electric: {
    eyebrow: '磁路 / 麦克斯韦图解 01 · 电场的高斯定律',
    title: '电荷怎样产生电场？',
    lead: '把封闭面想成透明气球，逐块数穿过它的电场。',
    formula: '∯<sub>S</sub> E · dA = Q<sub>内</sub> / ε<sub>0</sub>',
    boundary:
      'E 是电场强度；dA 是朝外的面积矢量。电场散度 ∇·E = ρ/ε₀ 描述局部电荷源；图中的求和是它的封闭面版本。',
    takeaway: '电荷是电场的源：有净电荷包在里面，净电通量就不为零。',
    courseLink: '下一条：磁场的封闭面净通量总为零',
  },
  magnetic: {
    eyebrow: '磁路 / 麦克斯韦图解 02 · 磁场的高斯定律',
    title: '磁场为什么没有起点和终点？',
    lead: '沿着磁场箭头走一圈：穿入多少，就会穿出多少。',
    formula: '∯<sub>S</sub> B · dA = 0',
    boundary:
      'B 是磁感应强度；dA 总朝外。局部说法是 ∇·B = 0：磁场没有孤立的源；环量和旋度将在后两页出现。',
    takeaway: '任意封闭面中，磁通的穿入量与穿出量相抵。',
    courseLink: '下一条：变化的磁场激发环绕电场',
  },
  faraday: {
    eyebrow: '磁路 / 麦克斯韦图解 03 · 法拉第电磁感应定律',
    title: '变化的磁场怎样产生电场？',
    lead: '先认清穿过环面的磁通，再让它变化，沿环形路径逐段相加。',
    formula: '∮<sub>C</sub> E · dl = −dΦ<sub>B</sub>/dt',
    boundary:
      '蓝色箭头表示 B 向上穿过环面、朝向观察者。面积法向朝向观察者，逆时针为路径正向；负号来自这对右手方向。局部形式：∇×E = −∂B/∂t。',
    takeaway: '磁通变化产生环绕电场；变化停下，感应环量就为零。',
    courseLink: '联系后续：发电机与变压器的感应电动势',
  },
  'faraday-irregular': {
    eyebrow: '磁路 / 麦克斯韦图解 03B · 法拉第定律的非圆回路',
    title: '线圈不是圆环，仍会产生感生电场吗？',
    lead: '把圆环换成不规则闭合线圈，仍沿实际路径逐段累加。',
    formula: '∮<sub>C</sub> E · dl = −dΦ<sub>B</sub>/dt',
    boundary:
      'C 可以是任意固定闭合路径，不要求是圆。蓝色 B 穿过 C 所围面积 S；绿色箭头表示沿不规则路径的感生电场。局部形式仍为 ∇×E = −∂B/∂t。',
    takeaway: '回路形状可以不规则；只要所围磁通随时间变化，就有感生电场环量。',
    courseLink: '下一条：真实电流激发环绕磁场',
  },
  'ampere-current': {
    eyebrow: '磁路 / 麦克斯韦图解 04A · 安培环路定律',
    title: '真实电流怎样产生磁场？',
    lead: '先看铜导线中的电流矢量，再沿导体外的虚拟闭合路径逐段积分。',
    formula: '∮<sub>C</sub> H · dl = I<sub>导</sub>',
    boundary:
      'H 是磁场强度，dl 是沿积分正方向的有向线元。右手拇指指向电流 I，四指弯曲方向就是 H 与路径 C 的正方向。',
    takeaway: '真实电流穿过环面，就在导体周围建立环绕的磁场强度 H。',
    courseLink: '下一页：极板间没有导电电流，为什么仍有磁场？',
  },
  'ampere-displacement': {
    eyebrow: '磁路 / 麦克斯韦图解 04B · 麦克斯韦位移电流',
    title: '位移电流怎样产生磁场？',
    lead: '观察电容器连续充放电：电荷不穿过间隙，但变化的电位移通量仍建立环绕磁场。',
    formula: '∮<sub>C</sub> H · dl = dΦ<sub>D</sub>/dt',
    boundary:
      'ΦD = ∫S D·dA。位移电流是电位移通量的变化率，不是自由电荷穿过电介质；完整形式为 ∮H·dl = I导 + dΦD/dt。',
    takeaway: '变化的电位移通量与导电电流一样，都是环绕磁场 H 的来源。',
    courseLink: '联系下一页：线圈电流怎样建立电机磁场',
  },
};

let page = pages[law] || pages.electric;

function isFaradayLaw() {
  return law === 'faraday' || law === 'faraday-irregular';
}

function isIrregularFaraday() {
  return law === 'faraday-irregular';
}

const defs = `
  <defs>
    <marker id="arrow" markerWidth="11" markerHeight="11" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L10 5L1 9Z" fill="#217e70" /></marker>
    <marker id="orange-arrow" markerWidth="11" markerHeight="11" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L10 5L1 9Z" fill="#c97236" /></marker>
    <marker id="blue-arrow" markerWidth="11" markerHeight="11" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L10 5L1 9Z" fill="#5872b5" /></marker>
    <radialGradient id="ball" cx="31%" cy="22%" r="78%"><stop stop-color="#ffffff" stop-opacity=".92" /><stop offset=".48" stop-color="#d6f1e9" stop-opacity=".74" /><stop offset=".82" stop-color="#75b6a8" stop-opacity=".72" /><stop offset="1" stop-color="#286b64" stop-opacity=".86" /></radialGradient>
    <radialGradient id="charge" cx="30%" cy="22%"><stop stop-color="#fff9e6" /><stop offset=".58" stop-color="#f6ba66" /><stop offset="1" stop-color="#ad522b" /></radialGradient>
    <clipPath id="electric-plot"><rect x="20" y="72" width="860" height="282" /></clipPath>
  </defs>`;

function circleRayPoint(cx, cy, r, angle) {
  return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
}

function electricSphere(cx, cy, r) {
  const turn = state.frame * 0.09;
  const nearMeridian = r * 0.52 * Math.cos(turn);
  const farMeridian = r * 0.52 * Math.sin(turn);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ball)" stroke="#347d71" stroke-width="3" />
    <path d="M${cx - r} ${cy} A${r} ${r * 0.32} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#377f73" stroke-width="2" stroke-dasharray="6 7" opacity=".65" />
    <path d="M${cx - r} ${cy} A${r} ${r * 0.32} 0 0 0 ${cx + r} ${cy}" fill="none" stroke="#f5fffa" stroke-width="2.5" opacity=".85" />
    <path d="M${cx} ${cy - r} C${cx - farMeridian} ${cy - r * 0.48} ${cx - farMeridian} ${cy + r * 0.48} ${cx} ${cy + r}" fill="none" stroke="#4e9485" stroke-width="2" stroke-dasharray="5 7" opacity=".58" />
    <path d="M${cx} ${cy - r} C${cx + nearMeridian} ${cy - r * 0.48} ${cx + nearMeridian} ${cy + r * 0.48} ${cx} ${cy + r}" fill="none" stroke="#f8fffc" stroke-width="2" opacity=".75" />
    <ellipse cx="${cx - r * 0.33}" cy="${cy - r * 0.42}" rx="${r * 0.28}" ry="${r * 0.15}" fill="#fff" opacity=".25" transform="rotate(-30 ${cx - r * 0.33} ${cy - r * 0.42})" />`;
}

function electricCharge(x, y) {
  return `<circle cx="${x + 6}" cy="${y + 9}" r="25" fill="#5d776c" opacity=".18" />
    <circle cx="${x}" cy="${y}" r="24" fill="url(#charge)" stroke="#aa542e" stroke-width="2.5" />
    <text x="${x}" y="${y + 10}" text-anchor="middle" font-size="32" font-weight="700" fill="#73361d">+</text>`;
}

function electricInside() {
  const cx = 434;
  const cy = 211;
  const r = 116;
  const rays = Array.from({ length: 12 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 12;
    const [x0, y0] = circleRayPoint(cx, cy, 39, angle);
    const [x, y] = circleRayPoint(cx, cy, r, angle);
    const [x1, y1] = circleRayPoint(cx, cy, r + 28, angle);
    const tx = -Math.sin(angle) * 10;
    const ty = Math.cos(angle) * 10;
    const lit = i < state.count;
    return `<path d="M${x0} ${y0}Q${x} ${y} ${x1} ${y1}" class="field-line" stroke-width="${lit ? 3.5 : 2.3}" marker-end="url(#arrow)" opacity="${lit ? 0.95 : 0.43}" />
      <path d="M${x - tx} ${y - ty}L${x + tx} ${y + ty}L${x + tx + 5} ${y + ty + 5}L${x - tx + 5} ${y - ty + 5}Z" fill="${lit ? '#f4bd69' : '#c4e4d9'}" stroke="${lit ? '#b66d31' : '#74aa9b'}" stroke-width="2" opacity="${lit ? 1 : 0.68}" />`;
  }).join('');
  return `${defs}
    <text x="52" y="48" class="label">正电荷在封闭球面内</text>
    <g clip-path="url(#electric-plot)">
      <ellipse cx="${cx + 14}" cy="${cy + 119}" rx="124" ry="15" fill="#438b78" opacity=".13" />
      ${electricSphere(cx, cy, r)}
      ${rays}
      ${electricCharge(cx, cy)}
      <path d="M588 144L639 111" stroke="#c97236" stroke-width="3" marker-end="url(#orange-arrow)" />
      <text x="648" y="113" class="small-label">dA 朝外</text>
      <text x="591" y="231" class="small-label">E 从电荷出发</text>
    </g>
    <rect x="48" y="368" width="350" height="52" rx="11" fill="#edf6f2" />
    <text x="66" y="400" class="label">E·dA &gt; 0 · 穿出记正</text>
    <rect x="505" y="368" width="350" height="52" rx="11" fill="#edf6f2" />
    <text x="523" y="400" class="small-label">逐块点亮面积元，再对整个球面求和</text>`;
}

function rayIntersections(originX, originY, cx, cy, radius, angle) {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const dx = originX - cx;
  const dy = originY - cy;
  const b = 2 * (dx * ux + dy * uy);
  const c = dx * dx + dy * dy - radius * radius;
  const discriminant = b * b - 4 * c;
  if (discriminant <= 0) return null;
  const enter = (-b - Math.sqrt(discriminant)) / 2;
  const leave = (-b + Math.sqrt(discriminant)) / 2;
  if (enter < 0 || leave < 0) return null;
  return [
    [originX + enter * ux, originY + enter * uy],
    [originX + leave * ux, originY + leave * uy],
  ];
}

function rayPlotEnd(originX, originY, angle) {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const distances = [
    ux > 0 ? (846 - originX) / ux : (36 - originX) / ux,
    uy > 0 ? (338 - originY) / uy : (88 - originY) / uy,
  ];
  const distance = Math.min(...distances.filter((value) => value > 0));
  return [originX + distance * ux, originY + distance * uy];
}

const crossingAngles = [-0.26, -0.13, 0, 0.13, 0.26];
const outwardAngles = [
  ...Array.from({ length: 16 }, (_, i) => -Math.PI + (i * Math.PI) / 8).filter(
    (angle) => Math.abs(angle) > 0.3,
  ),
  ...crossingAngles,
];

function electricOutside() {
  const source = [150, 208];
  const cx = 559;
  const cy = 208;
  const r = 116;
  const active = Math.floor(state.frame / 3) % crossingAngles.length;
  const rays = outwardAngles
    .map((angle) => {
      const [endX, endY] = rayPlotEnd(...source, angle);
      const hit = rayIntersections(...source, cx, cy, r, angle);
      const highlighted = crossingAngles.indexOf(angle) === active;
      const marks =
        hit && highlighted
          ? `
      <circle cx="${hit[0][0]}" cy="${hit[0][1]}" r="10" class="in pulse" />
      <circle cx="${hit[1][0]}" cy="${hit[1][1]}" r="10" class="out pulse" />`
          : '';
      return `<line x1="${source[0]}" y1="${source[1]}" x2="${endX}" y2="${endY}" class="field-line" opacity="${highlighted ? 0.98 : 0.6}" marker-end="url(#arrow)" />${marks}`;
    })
    .join('');
  return `${defs}
    <text x="52" y="48" class="label">正电荷在球面外</text>
    <g clip-path="url(#electric-plot)">
      <ellipse cx="${cx + 14}" cy="${cy + 119}" rx="124" ry="15" fill="#438b78" opacity=".13" />
      ${electricSphere(cx, cy, r)}
      ${rays}
      ${electricCharge(...source)}
    </g>
    <rect x="48" y="368" width="350" height="52" rx="11" fill="#e9effb" /><text x="66" y="400" class="label">蓝：穿入，E·dA &lt; 0</text>
    <rect x="505" y="368" width="350" height="52" rx="11" fill="#fff0df" /><text x="523" y="400" class="label">橙：穿出，E·dA &gt; 0</text>`;
}

function electricIrregular() {
  const inside = state.irregularInside;
  const source = inside ? [518, 212] : [150, 212];
  const path =
    'M498 91 C572 74 673 121 692 198 C718 272 634 326 543 331 C450 338 379 301 363 239 C339 154 412 98 498 91Z';
  const angles = inside
    ? Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8)
    : outwardAngles;
  const rays = angles
    .map((angle) => {
      const [x2, y2] = rayPlotEnd(...source, angle);
      return `<line x1="${source[0]}" y1="${source[1]}" x2="${x2}" y2="${y2}" class="field-line" marker-end="url(#arrow)" opacity=".7" />`;
    })
    .join('');
  return `${defs}
    <text x="52" y="48" class="label">换成任意形状的封闭面</text>
    <g clip-path="url(#electric-plot)">
      <ellipse cx="545" cy="339" rx="161" ry="13" fill="#438b78" opacity=".14" />
      <path d="${path}" transform="translate(7 11)" fill="#387d71" opacity=".25" />
      <path d="${path}" fill="url(#ball)" stroke="#347d71" stroke-width="3" />
      <path d="M363 239 C442 183 617 186 692 198" fill="none" stroke="#438d7e" stroke-width="2" stroke-dasharray="6 7" opacity=".55" />
      <path d="M363 239 C449 287 617 281 692 198" fill="none" stroke="#f7fffc" stroke-width="2.5" opacity=".8" />
      ${rays}
      ${electricCharge(...source)}
    </g>
    <rect x="48" y="368" width="350" height="52" rx="11" fill="#edf6f2" /><text x="66" y="400" class="label">只看面内的净电荷</text>
    <rect x="505" y="368" width="350" height="52" rx="11" fill="#edf6f2" /><text x="523" y="400" class="small-label">虚拟封闭面不需要真实材料</text>`;
}

function cubicPoint(points, t) {
  const u = 1 - t;
  return [0, 1].map(
    (axis) =>
      u ** 3 * points[0][axis] +
      3 * u ** 2 * t * points[1][axis] +
      3 * u * t ** 2 * points[2][axis] +
      t ** 3 * points[3][axis],
  );
}

const irregularSurface = [
  [
    [350, 94],
    [389, 32],
    [487, 42],
    [535, 69],
  ],
  [
    [535, 69],
    [595, 88],
    [592, 140],
    [548, 185],
  ],
  [
    [548, 185],
    [518, 230],
    [449, 255],
    [385, 226],
  ],
  [
    [385, 226],
    [341, 207],
    [314, 148],
    [350, 94],
  ],
];

const irregularOutline =
  irregularSurface
    .map(
      (segment, i) =>
        `${i ? '' : `M${segment[0].join(' ')}`}C${segment
          .slice(1)
          .map((point) => point.join(' '))
          .join(' ')}`,
    )
    .join('') + 'Z';
const irregularPolygon = irregularSurface.flatMap((segment) =>
  Array.from({ length: 32 }, (_, i) => cubicPoint(segment, i / 32)),
);

function inMagneticSurface(point) {
  if (state.step === 0) {
    return (point[0] - 450) ** 2 + (point[1] - 150) ** 2 < 112 ** 2;
  }
  let inside = false;
  for (
    let i = 0, j = irregularPolygon.length - 1;
    i < irregularPolygon.length;
    j = i++
  ) {
    const a = irregularPolygon[i];
    const b = irregularPolygon[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function magneticLoop(index, lower) {
  const y = lower ? 243 : 195;
  const apex = lower ? 344 - index * 21 : 76 + index * 18;
  const left = 136 + index * 24;
  const outerY = lower ? 285 : 139;
  const returnY = y + ((y - outerY) * 50) / (330 - left);
  const segments = [
    [
      [330, y],
      [left, outerY],
      [260, apex],
      [450, apex],
    ],
    [
      [450, apex],
      [640, apex],
      [900 - left, outerY],
      [570, y],
    ],
    [
      [570, y],
      [520, returnY],
      [380, returnY],
      [330, y],
    ],
  ];
  const path = `M330 ${y}${segments
    .map(
      (segment) =>
        `C${segment
          .slice(1)
          .map((point) => point.join(' '))
          .join(' ')}`,
    )
    .join('')}Z`;
  return { segments, path };
}

function magneticCrossings(segments) {
  const crossings = [];
  for (const segment of segments.slice(0, 2)) {
    let wasInside = inMagneticSurface(cubicPoint(segment, 0));
    for (let i = 1; i <= 120; i++) {
      const t = i / 120;
      const point = cubicPoint(segment, t);
      const nowInside = inMagneticSurface(point);
      if (nowInside !== wasInside) {
        let lo = (i - 1) / 120;
        let hi = t;
        for (let n = 0; n < 14; n++) {
          const mid = (lo + hi) / 2;
          if (inMagneticSurface(cubicPoint(segment, mid)) === wasInside)
            lo = mid;
          else hi = mid;
        }
        crossings.push({
          point: cubicPoint(segment, (lo + hi) / 2),
          entering: nowInside,
        });
      }
      wasInside = nowInside;
    }
  }
  return crossings;
}

function magneticArrow(segment, t) {
  const a = cubicPoint(segment, t - 0.035);
  const b = cubicPoint(segment, t + 0.035);
  return `<path d="M${a.join(' ')}L${b.join(' ')}" class="magnetic-arrow" marker-end="url(#magnetic-arrow)" />`;
}

function magneticDiagram() {
  const loops = [
    ...Array.from({ length: 4 }, (_, i) => magneticLoop(i, false)),
    ...Array.from({ length: 3 }, (_, i) => magneticLoop(i, true)),
  ];
  const lines = loops
    .map(({ segments, path }, i) => {
      const bead = cubicPoint(
        segments[Math.floor(state.frame / 14) % 3],
        (state.frame % 14) / 14,
      );
      return `<path d="${path}" class="magnetic-field" opacity="${i < 4 ? 0.94 : 0.76}" />
      ${magneticArrow(segments[0], 0.72)}${magneticArrow(segments[1], 0.53)}
      ${magneticArrow(segments[2], 0.53)}
      <circle cx="${bead[0]}" cy="${bead[1]}" r="4" fill="#b8e6fb" opacity=".85" />`;
    })
    .join('');
  const crossings = loops
    .slice(0, 4)
    .flatMap((loop) => magneticCrossings(loop.segments));
  const marks = crossings
    .map(({ point, entering }, i) => {
      const active = i < state.count;
      return `<circle cx="${point[0]}" cy="${point[1]}" r="${active ? 10 : 5}"
      class="${entering ? 'in' : 'out'} ${active ? 'pulse' : ''} magnetic-crossing"
      opacity="${active ? 1 : 0.35}" />`;
    })
    .join('');
  const surface =
    state.step === 0
      ? `<circle cx="450" cy="150" r="112" fill="url(#magnetic-surface)" class="magnetic-rim" />
       <path d="M338 150 A112 35 0 0 1 562 150" class="magnetic-rear" />
       <path d="M338 150 A112 35 0 0 0 562 150" class="magnetic-front" />
       <path d="M450 38 C392 89 392 211 450 262" class="magnetic-rear" />
       <path d="M450 38 C508 89 508 211 450 262" class="magnetic-front" />`
      : `<path d="${irregularOutline}" fill="url(#magnetic-surface)" class="magnetic-rim" />
       <path d="M350 94 C414 121 499 111 548 185" class="magnetic-rear" />
       <path d="M385 226 C435 171 509 182 548 185" class="magnetic-front" />
       <path d="M395 51 C370 105 391 181 448 241" class="magnetic-rear" />
       <path d="M510 56 C551 111 528 184 482 244" class="magnetic-front" />`;
  return `${defs}<defs>
      <marker id="magnetic-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L11 6L1 11Z" fill="#91cce9" /></marker>
      <radialGradient id="magnetic-surface" cx="28%" cy="20%" r="85%">
        <stop stop-color="#fff" stop-opacity=".28" />
        <stop offset=".65" stop-color="#a7ded7" stop-opacity=".19" />
        <stop offset="1" stop-color="#468f9a" stop-opacity=".35" />
      </radialGradient>
    </defs>
    <text x="52" y="46" class="label">N → S（磁铁外） · S → N（磁铁内）</text>
    <ellipse cx="450" cy="297" rx="235" ry="19" fill="#4b8f87" opacity=".09" />
    <path d="M320 190L340 173H580L560 190Z" fill="#f5ddac" fill-opacity=".26" class="magnetic-magnet-edge" />
    <path d="M560 190L580 173V248L560 265Z" fill="#a8d9e1" fill-opacity=".26" class="magnetic-magnet-edge" />
    <rect x="320" y="190" width="120" height="75" fill="#f3c988" fill-opacity=".21" />
    <rect x="440" y="190" width="120" height="75" fill="#83c9d5" fill-opacity=".21" />
    ${lines}
    ${surface}
    <path d="M320 265V190H560V265Z M440 190V265 M320 190L340 173H580V248L560 265 M560 190L580 173"
      class="magnetic-magnet-edge" fill="none" />
    <text x="347" y="255" class="magnetic-pole magnetic-n">N</text>
    <text x="515" y="255" class="magnetic-pole magnetic-s">S</text>
    ${marks}
    <rect x="55" y="363" width="345" height="54" rx="11" fill="#e9effb" />
    <text x="74" y="397" class="label">蓝：穿入，B·dA &lt; 0</text>
    <rect x="500" y="363" width="345" height="54" rx="11" fill="#fff0df" />
    <text x="519" y="397" class="label">橙：穿出，B·dA &gt; 0</text>`;
}

const ampereSegmentCount = 16;

function ellipsePoint(cx, cy, rx, ry, angle) {
  return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
}

function ellipseSegmentPath(cx, cy, rx, ry, start, end, samples = 5) {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const angle = start + ((end - start) * index) / samples;
    const [x, y] = ellipsePoint(cx, cy, rx, ry, angle);
    return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join('');
}

function amperePathSegments(
  count,
  half = 'all',
  direction = 1,
  markerId = 'ampere-h-arrow',
  extraClass = '',
) {
  const angleStep = (Math.PI * 2) / ampereSegmentCount;
  return Array.from({ length: ampereSegmentCount }, (_, index) => {
    const start = -Math.PI / 2 - direction * index * angleStep;
    const end = start - direction * angleStep * 0.7;
    const isFront = Math.sin((start + end) / 2) > 0;
    if (half !== 'all' && (half === 'front') !== isFront) return '';
    const lit = index < count;
    return `<path d="${ellipseSegmentPath(445, 220, 205, 82, start, end)}"
      class="ampere-dl ${extraClass} ${lit ? 'lit' : ''}"
      ${lit ? `marker-end="url(#${markerId})"` : ''} />`;
  }).join('');
}

function ampereDefs() {
  return `<defs>
    <linearGradient id="ampere-copper" x1="0" x2="1">
      <stop stop-color="#8f431f" />
      <stop offset=".25" stop-color="#e9a15b" />
      <stop offset=".53" stop-color="#ffd39a" />
      <stop offset=".78" stop-color="#c66c35" />
      <stop offset="1" stop-color="#773419" />
    </linearGradient>
    <linearGradient id="ampere-plate" x1="0" x2="0" y1="0" y2="1">
      <stop stop-color="#f4bd79" />
      <stop offset="1" stop-color="#9f4e27" />
    </linearGradient>
    <radialGradient id="ampere-surface" cx="42%" cy="35%" r="70%">
      <stop stop-color="#d8f3ed" stop-opacity=".5" />
      <stop offset="1" stop-color="#5aa496" stop-opacity=".12" />
    </radialGradient>
    <marker id="ampere-h-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1L11 6L1 11Z" fill="#176e62" stroke="#f8fbf7" stroke-width="1.2" />
    </marker>
    <marker id="ampere-loop-arrow" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1L15 8L1 15Z" fill="#176e62" stroke="#f8fbf7" stroke-width="1.4" />
    </marker>
    <marker id="displacement-h-arrow" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1L15 8L1 15Z" fill="#3f6ea4" stroke="#f8fbf7" stroke-width="1.4" />
    </marker>
    <marker id="ampere-i-arrow" markerWidth="13" markerHeight="13" refX="11" refY="6.5" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1L12 6.5L1 12Z" fill="#b95f2f" stroke="#fff5e8" stroke-width="1" />
    </marker>
    <marker id="ampere-d-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1L11 6L1 11Z" fill="#28966a" />
    </marker>
  </defs>`;
}

function ampereFieldLoops(
  opacity = 1,
  direction = 1,
  half = 'all',
  extraClass = '',
  markerId = 'ampere-loop-arrow',
) {
  if (
    direction === 1 &&
    half === 'all' &&
    !extraClass &&
    markerId === 'ampere-loop-arrow'
  ) {
    return [
      [122, 47, 0.45],
      [164, 64, 0.68],
      [205, 82, 1],
    ]
      .map(
        ([rx, ry, alpha]) => `
    <path d="M${445 + rx} 220 A${rx} ${ry} 0 0 0 ${445 - rx} 220"
      class="ampere-h-loop rear" opacity="${alpha * opacity}" />
    <path d="M${445 - rx} 220 A${rx} ${ry} 0 0 0 ${445 + rx} 220"
      class="ampere-h-loop front" opacity="${alpha * opacity}"
      marker-end="url(#ampere-loop-arrow)" />`,
      )
      .join('');
  }
  return [
    [122, 47, 0.45],
    [164, 64, 0.68],
    [205, 82, 1],
  ]
    .map(([rx, ry, alpha]) => {
      const rearPath =
        direction > 0
          ? ellipseSegmentPath(445, 220, rx, ry, 0, -Math.PI, 32)
          : ellipseSegmentPath(445, 220, rx, ry, -Math.PI, 0, 32);
      const frontPath =
        direction > 0
          ? ellipseSegmentPath(445, 220, rx, ry, Math.PI, 0, 32)
          : ellipseSegmentPath(445, 220, rx, ry, 0, Math.PI, 32);
      return `
    ${half === 'front' ? '' : `<path d="${rearPath}" class="ampere-h-loop rear ${extraClass}" opacity="${alpha * opacity}" />`}
    ${half === 'rear' ? '' : `<path d="${frontPath}" class="ampere-h-loop front ${extraClass}" opacity="${alpha * opacity}" marker-end="url(#${markerId})" />`}`;
    })
    .join('');
}

function faradayLoopPoint(angle, yOffset = 0) {
  if (!isIrregularFaraday()) {
    return {
      x: 455 + 184 * Math.cos(angle),
      y: 229 + 77 * Math.sin(angle) + yOffset,
    };
  }
  const radial =
    1 + 0.13 * Math.sin(3 * angle + 0.35) + 0.055 * Math.cos(5 * angle - 0.45);
  const vertical = 1 + 0.08 * Math.cos(2 * angle + 0.2);
  return {
    x: 455 + 184 * radial * Math.cos(angle),
    y: 229 + 77 * radial * vertical * Math.sin(angle) + yOffset,
  };
}

function faradayLoopPath(start, end, samples = 48, yOffset = 0) {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const angle = start + ((end - start) * i) / samples;
    const point = faradayLoopPoint(angle, yOffset);
    return `${i ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join('');
}

function faradayPathSegments(count, direction) {
  if (!direction) return '';
  const angleStep = (Math.PI * 2) / faradaySegmentCount;
  const elementAngle = angleStep * 0.72;
  return Array.from({ length: faradaySegmentCount }, (_, i) => {
    const start = -Math.PI / 2 + direction * i * angleStep;
    const end = start + direction * elementAngle;
    const path = faradayLoopPath(start, end, 4);
    const lit = i < count;
    return `<path d="${path}" class="faraday-segment ${lit ? 'lit' : ''}" ${lit ? 'marker-end="url(#faraday-e-arrow)"' : ''} />`;
  }).join('');
}

function faradayDiagram() {
  const irregular = isIrregularFaraday();
  const changing = state.step === 1 || state.step === 3;
  const strength =
    state.step === 1
      ? state.faradayProgress
      : state.step === 3
        ? 1 - state.faradayProgress
        : 0.68;
  const fieldCount =
    strength < 0.005 ? 0 : Math.max(1, Math.round(strength * 7));
  const halfLength = 78 + 18 * strength;
  const strokeWidth = 1.5 + strength * 2;
  const opacity = 0.3 + strength * 0.7;
  const fieldLines = Array.from({ length: fieldCount }, (_, i) => {
    const x = 455 + (i - (fieldCount - 1) / 2) * 37;
    return `<path d="M${x} ${229 + halfLength}V${229 - halfLength}" class="faraday-field" stroke-width="${strokeWidth.toFixed(2)}" opacity="${opacity.toFixed(2)}" marker-end="url(#faraday-b-arrow)" />`;
  }).join('');
  const direction = state.step === 1 ? 1 : state.step === 3 ? -1 : 0;
  const surface = irregular
    ? `<path d="${faradayLoopPath(0, Math.PI * 2, 96)}Z" fill="url(#faraday-plane)" stroke="#90b9cd" stroke-width="2" stroke-dasharray="5 6" />`
    : '<ellipse cx="455" cy="229" rx="176" ry="69" fill="url(#faraday-plane)" stroke="#90b9cd" stroke-width="2" stroke-dasharray="5 6" />';
  const shadow = irregular
    ? `<path d="${faradayLoopPath(0, Math.PI * 2, 96, 22)}Z" fill="#526579" opacity=".11" />`
    : '<ellipse cx="455" cy="251" rx="190" ry="79" fill="#526579" opacity=".11" />';
  const rearCoil = irregular
    ? `<path d="${faradayLoopPath(Math.PI, Math.PI * 2)}" class="faraday-coil-rear" />`
    : '<path d="M271 229 A184 77 0 0 1 639 229" class="faraday-coil-rear" />';
  const frontCoil = irregular
    ? `<path d="${faradayLoopPath(0, Math.PI)}" class="faraday-coil-front" />`
    : '<path d="M271 229 A184 77 0 0 0 639 229" class="faraday-coil-front" />';
  const frontHighlight = irregular
    ? `<path d="${faradayLoopPath(0, Math.PI, 48, 6)}" class="faraday-coil-highlight" />`
    : '<path d="M275 236 A180 71 0 0 0 635 236" class="faraday-coil-highlight" />';
  return `${defs}
    <defs>
      <linearGradient id="faraday-plane" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#dceff9" stop-opacity=".57" /><stop offset="1" stop-color="#d4e9f1" stop-opacity=".19" /></linearGradient>
      <linearGradient id="faraday-coil" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#e4ad66" /><stop offset="1" stop-color="#a9562e" /></linearGradient>
      <marker id="faraday-b-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L11 6L1 11Z" fill="#327fbd" /></marker>
      <marker id="faraday-e-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1L11 6L1 11Z" fill="#176e62" stroke="#f8fbf7" stroke-width="1.4" /></marker>
    </defs>
    <text x="52" y="52" class="label">${irregular ? '不规则闭合线圈 C 围出面积 S' : '环形线圈 C 围出面积 S'}</text>
    ${shadow}
    ${surface}
    ${rearCoil}
    ${fieldLines}
    <text x="510" y="198" class="faraday-b-label">B</text>
    ${frontCoil}
    ${frontHighlight}
    ${faradayPathSegments(changing ? state.count : 0, direction)}
    <text x="455" y="422" text-anchor="middle" class="label">${state.step === 0 ? '静态定义：ΦB = ∫S B·dA（蓝色 B 向上穿过环面）' : state.step === 1 ? '磁通增加 → E 沿线圈顺时针环绕' : state.step === 2 ? '磁通不变 → E 的感应环量为 0' : '磁通减少 → E 沿线圈逆时针环绕'}</text>
    <text x="681" y="221" class="small-label">线圈路径 C</text>
    <path d="M676 228L630 250" stroke="#8ab6aa" stroke-width="2" />
    <text x="50" y="217" class="small-label">${changing ? '绿色箭头：感生电场 E；短弧元 dl' : '环内磁通：B·dA'}</text>`;
}

function ampereCurrentDiagram() {
  const showField = state.step >= 1;
  const visibleCount = state.step === 2 ? state.count : 0;
  const particles = Array.from({ length: 4 }, (_, index) => {
    const y = 318 - ((state.frame * 13 + index * 62) % 220);
    return `<circle cx="445" cy="${y}" r="5" class="ampere-charge" />`;
  }).join('');
  return `${defs}${ampereDefs()}
    <text x="48" y="48" class="label">铜导线中的真实电流 I<tspan baseline-shift="sub" font-size="14">导</tspan></text>
    <ellipse cx="455" cy="366" rx="76" ry="13" fill="#173e3a" opacity=".12" />
    <path d="M240 220 A205 82 0 0 1 650 220 A205 82 0 0 1 240 220Z"
      fill="url(#ampere-surface)" opacity="${state.step === 2 ? 0.72 : 0.34}" />
    ${showField ? ampereFieldLoops(state.step === 1 ? 1 : 0.5) : ''}
    <path d="M650 220 A205 82 0 0 0 240 220" class="ampere-path" />
    ${state.step === 2 ? amperePathSegments(visibleCount, 'rear') : ''}
    <rect x="410" y="87" width="70" height="270" fill="url(#ampere-copper)" />
    <ellipse cx="445" cy="87" rx="35" ry="12" fill="#ffd49b" stroke="#93451f" stroke-width="2.5" />
    <ellipse cx="445" cy="357" rx="35" ry="12" fill="#7f391d" stroke="#672b15" stroke-width="2.5" />
    <path d="M417 93V351 M474 93V351" stroke="#fff1d8" stroke-width="2" opacity=".35" />
    <line x1="445" y1="316" x2="445" y2="118" class="ampere-current-vector"
      marker-end="url(#ampere-i-arrow)" />
    ${particles}
    <text x="466" y="140" class="ampere-i-label">I<tspan baseline-shift="sub" font-size="14">导</tspan></text>
    <path d="M240 220 A205 82 0 0 0 650 220" class="ampere-path" />
    ${state.step === 2 ? amperePathSegments(visibleCount, 'front') : ''}
    <path d="M675 167L626 183" class="ampere-callout" />
    <text x="684" y="164" class="small-label">虚拟积分路径 C</text>
    <text x="664" y="196" class="muted-label">虚线，不是真实线圈</text>
    <text x="445" y="423" text-anchor="middle" class="label">${
      [
        '电流矢量穿过环面，方向由导线中的箭头给出',
        '右手拇指指向 I，四指给出 H 的环绕方向',
        '沿 C 依次累加 H·dl：亮起的短弧就是有向线元 dl',
      ][state.step]
    }</text>`;
}

function capacitorPlate(y, front) {
  return `<ellipse cx="445" cy="${y + 10}" rx="126" ry="34" fill="#713317" opacity=".32" />
    <rect x="319" y="${y - 1}" width="252" height="12" fill="url(#ampere-plate)" />
    <ellipse cx="445" cy="${y - 1}" rx="126" ry="34" fill="${front ? '#f0b671' : '#d9894d'}" stroke="#8f431f" stroke-width="2.5" />
    <ellipse cx="414" cy="${y - 9}" rx="69" ry="13" fill="#fff0d6" opacity=".28" />`;
}

function displacementMotion() {
  const angle = state.displacementProgress * Math.PI * 2;
  const chargeLevel = (1 - Math.cos(angle)) / 2;
  const changeRate = Math.sin(angle);
  const charging = state.displacementProgress < 0.5;
  const halfProgress = charging
    ? state.displacementProgress * 2
    : (state.displacementProgress - 0.5) * 2;
  return {
    chargeLevel,
    changeStrength: Math.abs(changeRate),
    charging,
    halfProgress,
    loopDirection: charging ? -1 : 1,
  };
}

function ampereDisplacementDiagram() {
  const motion = displacementMotion();
  const fieldOpacity = Math.pow(motion.chargeLevel, 0.72);
  const visibleCount =
    motion.changeStrength < 0.035
      ? 0
      : Math.min(
          ampereSegmentCount,
          Math.floor(motion.halfProgress * (ampereSegmentCount + 5)) + 1,
        );
  const dArrows = [-72, -48, -24, 0, 24, 48, 72]
    .map(
      (offset) => `
    <line x1="${445 + offset}" y1="164" x2="${445 + offset}" y2="266"
      class="ampere-d-vector" opacity="${fieldOpacity.toFixed(3)}"
      stroke-width="${(2 + motion.chargeLevel * 3.8).toFixed(2)}"
      marker-end="url(#ampere-d-arrow)" />`,
    )
    .join('');
  const currentArrows =
    motion.changeStrength < 0.035
      ? ''
      : `<line x1="445" y1="${motion.charging ? 69 : 104}" x2="445" y2="${motion.charging ? 104 : 69}" class="ampere-lead-current" opacity="${motion.changeStrength.toFixed(3)}" marker-end="url(#ampere-i-arrow)" />
    <line x1="445" y1="${motion.charging ? 338 : 374}" x2="445" y2="${motion.charging ? 374 : 338}" class="ampere-lead-current" opacity="${motion.changeStrength.toFixed(3)}" marker-end="url(#ampere-i-arrow)" />`;
  const rearField = ampereFieldLoops(
    motion.changeStrength,
    motion.loopDirection,
    'rear',
    'displacement-h',
    'displacement-h-arrow',
  );
  const frontField = ampereFieldLoops(
    motion.changeStrength,
    motion.loopDirection,
    'front',
    'displacement-h',
    'displacement-h-arrow',
  );
  const rearSegments = amperePathSegments(
    visibleCount,
    'rear',
    motion.loopDirection,
    'displacement-h-arrow',
    'displacement-integral',
  );
  const frontSegments = amperePathSegments(
    visibleCount,
    'front',
    motion.loopDirection,
    'displacement-h-arrow',
    'displacement-integral',
  );
  const actionText = motion.charging ? '充电' : '放电';
  const directionText = motion.charging ? '顺时针' : '逆时针';
  return `${defs}${ampereDefs()}
    <text x="48" y="48" class="label">电容器连续充放电：I<tspan baseline-shift="sub" font-size="14">d</tspan> = dΦ<tspan baseline-shift="sub" font-size="14">D</tspan>/dt</text>
    <path d="M445 61V108 M445 330V382" class="ampere-wire" />
    ${currentArrows}
    <path d="M240 220 A205 82 0 0 1 650 220 A205 82 0 0 1 240 220Z"
      fill="url(#ampere-surface)" opacity="${(0.22 + motion.changeStrength * 0.42).toFixed(3)}" />
    ${rearField}
    <path d="M650 220 A205 82 0 0 0 240 220" class="ampere-path" />
    <g opacity="${(0.22 + motion.changeStrength * 0.78).toFixed(3)}">${rearSegments}</g>
    ${capacitorPlate(132, true)}
    ${dArrows}
    ${capacitorPlate(298, false)}
    <text x="579" y="139" class="ampere-charge-label plus" opacity="${fieldOpacity.toFixed(3)}">+ + + +</text>
    <text x="579" y="307" class="ampere-charge-label minus" opacity="${fieldOpacity.toFixed(3)}">− − − −</text>
    ${frontField}
    <path d="M240 220 A205 82 0 0 0 650 220" class="ampere-path" />
    <g opacity="${(0.22 + motion.changeStrength * 0.78).toFixed(3)}">${frontSegments}</g>
    <path d="M674 168L625 184" class="ampere-callout" />
    <text x="683" y="165" class="small-label">虚拟积分路径 C</text>
    <text x="92" y="185" class="small-label">极板间没有</text>
    <text x="92" y="209" class="small-label">自由电荷穿越</text>
    <path d="M205 201L316 211" class="ampere-callout" />
    <text x="445" y="423" text-anchor="middle" class="label">${actionText}：绿色电场${motion.charging ? '增强' : '减弱'}，从上方看 H ${directionText}环绕</text>`;
}

function setContent() {
  let sceneTitle;
  let meaning;
  let metric;
  let controls;
  let diagram;
  let totalSteps;
  if (law === 'electric') {
    totalSteps = 3;
    if (state.step === 0) {
      sceneTitle = '① 球面内有一个正电荷';
      meaning =
        '每一小块面积元有一个朝外的 <strong>dA</strong>。电场 <strong>E</strong> 穿出时，<strong>E·dA 为正</strong>。把整个球面的小块贡献相加。';
      metric =
        state.count < 12
          ? `正在逐块观察：${state.count}/12 个示意面积元<small>动画走完后显示整个闭合面的积分结果</small>`
          : '整个球面的净电通量：Q/ε₀<small>正电荷在里面，所以结果大于 0</small>';
      controls = [
        ['重播逐块动画', 'replay', false],
        ['电荷移到外面 →', 'next', true],
      ];
      diagram = electricInside();
    } else if (state.step === 1) {
      sceneTitle = '② 电荷移到球面外';
      meaning =
        '同一束电场先<strong>穿入</strong>，再从另一面<strong>穿出</strong>。穿入记负，穿出记正；封闭面内没有电荷。';
      metric =
        '净电通量：穿入 + 穿出 = 0<small>局部 E 可以不为零；为零的是整个封闭面的通量</small>';
      controls = [
        ['上一步', 'back', false],
        ['换任意形状 →', 'next', true],
      ];
      diagram = electricOutside();
    } else {
      sceneTitle = '③ 封闭面换形状';
      meaning =
        '把“球”揉成不规则形状。<strong>每块 E·dA 会变</strong>，但整个封闭面的总和只由里面的<strong>净电荷</strong>决定。';
      metric = state.irregularInside
        ? '电荷在内：净电通量 = Q/ε₀'
        : '电荷在外：净电通量 = 0';
      controls = [
        [
          state.irregularInside ? '把电荷移到外面' : '把电荷移回里面',
          'toggle',
          true,
        ],
        ['从头再看', 'reset', false],
      ];
      diagram = electricIrregular();
    }
  } else if (law === 'magnetic') {
    totalSteps = 2;
    sceneTitle =
      state.step === 0 ? '① 画一个虚拟闭合面' : '② 把闭合面揉成不规则形状';
    meaning =
      '沿着闭合磁感线找出它与曲面的交点：蓝点<strong>穿入记负</strong>，橙点<strong>穿出记正</strong>。磁场线没有孤立的起点或终点。';
    metric =
      state.count < 8
        ? `沿磁感线标出交点：${state.count}/8<small>蓝色 B·dA 为负，橙色 B·dA 为正</small>`
        : '穿出磁通 + 穿入磁通 = 0<small>改变闭合面形状，净磁通仍为零</small>';
    controls = [
      [
        state.step === 0 ? '改变闭合面形状 →' : '恢复圆形闭合面',
        'toggle-step',
        true,
      ],
    ];
    diagram = magneticDiagram();
  } else if (isFaradayLaw()) {
    totalSteps = 4;
    sceneTitle = [
      `① 先定义${isIrregularFaraday() ? '不规则' : ''}线圈内的磁通`,
      '② 磁通正在增加',
      '③ 磁通保持不变',
      '④ 磁通正在减少',
    ][state.step];
    meaning = [
      `先固定${isIrregularFaraday() ? '不规则闭合' : '环形'}线圈及其所围的面。把面上每块的 <strong>B·dA</strong> 加起来，得到磁通 <strong>ΦB</strong>。从环面上方看，逆时针为路径正向，面积法向朝向你。`,
      '让向上穿过环面的磁通<strong>增加</strong>，再沿线圈逐段累加 <strong>E·dl</strong>。逆时针是本图的正向，因此感生电场沿顺时针方向环绕。',
      '磁通虽然存在，但<strong>不随时间变化</strong>；由此产生的电场环量为 0。',
      '让向上穿过环面的磁通<strong>减少</strong>，沿线圈逐段累加 <strong>E·dl</strong>；感生电场改为沿逆时针方向环绕。',
    ][state.step];
    metric = [
      '磁通定义：ΦB = ∫S B·dA<small>S 是线圈 C 所围的面；先数穿过多少</small>',
      `路径求和：${state.count}/${faradaySegmentCount} 个短弧元<small>完整一圈：∮C E·dl = −dΦB/dt</small>`,
      'dΦB/dt = 0 → 感应电场环量为 0',
      `路径求和：${state.count}/${faradaySegmentCount} 个短弧元<small>完整一圈：∮C E·dl = −dΦB/dt</small>`,
    ][state.step];
    controls = [
      ['先定义磁通', 'faraday-0', state.step === 0],
      ['让磁通增加', 'faraday-1', state.step === 1],
      ['保持不变', 'faraday-2', state.step === 2],
      ['让磁通减少', 'faraday-3', state.step === 3],
    ];
    diagram = faradayDiagram();
  } else if (law === 'ampere-current') {
    totalSteps = 3;
    sceneTitle = [
      '① 铜导线中的真实电流',
      '② H 围绕导体形成闭合线',
      '③ 沿虚拟路径逐段积分',
    ][state.step];
    meaning = [
      '铜导线中的自由电荷定向运动形成<strong>真实电流 I导</strong>。图中长箭头直接给出约定电流方向。',
      '按右手定则，磁场强度 <strong>H</strong> 沿导体外侧闭合环绕；离导体越远，圆周上的 H 越弱。',
      '选择虚拟闭合路径 <strong>C</strong>，沿 H 的方向把每一个有向线元 <strong>dl</strong> 上的 H·dl 依次相加。',
    ][state.step];
    metric = [
      '源：穿过环面的真实电流 I导',
      '方向：右手拇指指向 I，四指指向 H',
      state.count < ampereSegmentCount
        ? `路径积分：${state.count}/${ampereSegmentCount} 个线元 dl<small>绿色短弧沿积分正方向依次点亮</small>`
        : '完整一圈：∮C H·dl = I导<small>虚拟路径包围同一电流时，环量由所包围的电流决定</small>',
    ][state.step];
    controls = [
      ['电流矢量', 'ampere-0', state.step === 0],
      ['H 的方向', 'ampere-1', state.step === 1],
      ['逐段积分', 'ampere-2', state.step === 2],
    ];
    diagram = ampereCurrentDiagram();
  } else {
    const motion = displacementMotion();
    totalSteps = 1;
    sceneTitle = `连续动画 · 电容器正在${motion.charging ? '充电' : '放电'}`;
    meaning =
      '绿色电场线随极板电荷连续增强或减弱；<strong>dΦD/dt</strong> 的正负决定蓝色磁场 <strong>H</strong> 的环绕方向。虚线 C 是积分路径，不是真实线圈。';
    metric = motion.charging
      ? '充电：dΦD/dt > 0 → H 顺时针<small>从上方看；极板电荷与电场强度正在增大</small>'
      : '放电：dΦD/dt < 0 → H 逆时针<small>从上方看；极板电荷与电场强度正在减小</small>';
    controls = [
      [
        state.displacementPaused ? '继续动画' : '暂停动画',
        'displacement-toggle',
        true,
      ],
      ['从头播放', 'displacement-replay', false],
    ];
    diagram = ampereDisplacementDiagram();
  }
  $('scene-title').textContent = sceneTitle;
  $('meaning').innerHTML = meaning;
  $('metric').innerHTML = metric;
  $('controls').innerHTML = controls
    .map(
      ([label, action, primary]) =>
        `<button type="button" data-action="${action}" class="${primary ? 'primary' : ''}">${label}</button>`,
    )
    .join('');
  $('step-dots').innerHTML =
    law === 'ampere-displacement'
      ? '<span>充电 ↔ 放电 · 连续循环</span><b class="active"></b>'
      : `<span>${state.step + 1} / ${totalSteps}</span>` +
        Array.from(
          { length: totalSteps },
          (_, i) => `<b class="${i === state.step ? 'active' : ''}"></b>`,
        ).join('');
  svg.innerHTML = diagram;
  updateDiagramDescription();
}

function updateDiagramDescription() {
  svg.setAttribute(
    'aria-label',
    `${$('scene-title').textContent}。${$('meaning').textContent} ${$('metric').textContent}`,
  );
}

$('controls').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'next') state.step += 1;
  if (action === 'back') state.step -= 1;
  if (action === 'replay') state.count = 0;
  if (action === 'toggle') state.irregularInside = !state.irregularInside;
  if (action === 'reset') {
    state.step = 0;
    state.count = 0;
    state.irregularInside = true;
  }
  if (action === 'toggle-step') state.step = 1 - state.step;
  if (action === 'displacement-toggle')
    state.displacementPaused = !state.displacementPaused;
  if (action === 'displacement-replay') {
    state.displacementProgress = 0;
    state.displacementPaused = false;
  }
  if (action?.startsWith('faraday-') || action?.startsWith('ampere-'))
    state.step = Number(action.slice(-1));
  state.frame = 0;
  state.count = 0;
  state.faradayProgress = 0;
  setContent();
});

function selectLaw(nextLaw) {
  if (!Object.hasOwn(pages, nextLaw)) return;
  law = nextLaw;
  page = pages[law];
  state.step = 0;
  state.count = 0;
  state.frame = 0;
  state.faradayProgress = 0;
  state.displacementProgress = 0;
  state.displacementPaused = false;
  state.irregularInside = true;
  document.title = page.title + ' · 麦克斯韦方程图解';
  for (const id of [
    'eyebrow',
    'title',
    'lead',
    'boundary',
    'takeaway',
    'course-link',
  ]) {
    $(id).textContent = page[id === 'course-link' ? 'courseLink' : id];
  }
  $('formula').innerHTML = page.formula;
  $('law-name').textContent = page.eyebrow.split(' · ')[1];
  setContent();
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'maxwell-law')
    return;
  selectLaw(event.data.law);
});

selectLaw(law);
setInterval(() => {
  if (document.hidden) return;
  state.frame += 1;
  const isAmperePage =
    law === 'ampere-current' || law === 'ampere-displacement';
  if (
    (law === 'electric' && state.step === 0) ||
    law === 'magnetic' ||
    (isAmperePage && state.step === 2)
  ) {
    state.count = Math.min(
      law === 'magnetic' ? 8 : isAmperePage ? ampereSegmentCount : 12,
      state.count + 1,
    );
    if (law === 'electric') svg.innerHTML = electricInside();
    if (law === 'magnetic') svg.innerHTML = magneticDiagram();
    if (law === 'ampere-current') svg.innerHTML = ampereCurrentDiagram();
    if (law === 'ampere-displacement')
      svg.innerHTML = ampereDisplacementDiagram();
    if (law === 'electric')
      $('metric').innerHTML =
        state.count < 12
          ? `正在逐块观察：${state.count}/12 个示意面积元<small>动画走完后显示整个闭合面的积分结果</small>`
          : '整个球面的净电通量：Q/ε₀<small>正电荷在里面，所以结果大于 0</small>';
    if (law === 'magnetic')
      $('metric').innerHTML =
        state.count < 8
          ? `沿磁感线标出交点：${state.count}/8<small>蓝色 B·dA 为负，橙色 B·dA 为正</small>`
          : '穿出磁通 + 穿入磁通 = 0<small>改变闭合面形状，净磁通仍为零</small>';
    if (isAmperePage) {
      $('metric').innerHTML =
        state.count < ampereSegmentCount
          ? `路径积分：${state.count}/${ampereSegmentCount} 个线元 dl<small>绿色短弧沿积分正方向依次点亮</small>`
          : law === 'ampere-current'
            ? '完整一圈：∮C H·dl = I导<small>虚拟路径包围同一电流时，环量由所包围的电流决定</small>'
            : '完整一圈：∮C H·dl = dΦD/dt<small>位移电流保证安培环路定律在电容间隙中连续</small>';
    }
  }
  if (law === 'electric' && state.step === 1) svg.innerHTML = electricOutside();
  if (law === 'ampere-current' && state.step < 2)
    svg.innerHTML = ampereCurrentDiagram();
  updateDiagramDescription();
}, 430);

let previousFaradayTime;
function animateFaraday(timestamp) {
  const dt =
    previousFaradayTime === undefined
      ? 0
      : Math.min(0.05, (timestamp - previousFaradayTime) / 1000);
  previousFaradayTime = timestamp;
  const changing = isFaradayLaw() && (state.step === 1 || state.step === 3);
  if (!document.hidden && changing && state.faradayProgress < 1 && dt > 0) {
    state.faradayProgress = Math.min(
      1,
      state.faradayProgress + dt / faradayAnimationSeconds,
    );
    state.count = Math.min(
      faradaySegmentCount,
      Math.floor(state.faradayProgress * faradaySegmentCount),
    );
    svg.innerHTML = faradayDiagram();
    $('metric').firstChild.textContent =
      `路径求和：${state.count}/${faradaySegmentCount} 个短弧元`;
    updateDiagramDescription();
  }
  if (
    !document.hidden &&
    law === 'ampere-displacement' &&
    !state.displacementPaused &&
    dt > 0
  ) {
    const wasCharging = state.displacementProgress < 0.5;
    state.displacementProgress =
      (state.displacementProgress + dt / displacementCycleSeconds) % 1;
    const isCharging = state.displacementProgress < 0.5;
    svg.innerHTML = ampereDisplacementDiagram();
    if (wasCharging !== isCharging) setContent();
  }
  requestAnimationFrame(animateFaraday);
}
requestAnimationFrame(animateFaraday);
