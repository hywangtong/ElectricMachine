const steps = [
  [
    '选定二次端电压为基准',
    'U̇₂ = U₂∠0°，U̇₂′ = kU̇₂',
    '先画出水平向右的 U̇₂。电路标出与它同相的折算量 U̇₂′。下一步按滑块选定的相角画出 İ₂′。',
  ],
  [
    '画出二次电流',
    'İ₂′ = İ₂/k',
    '相量图改用折算量 U̇₂′。电路箭头标出 İ₂′ 的参考方向。',
  ],
  [
    '接上二次侧的两段压降',
    'R₂′İ₂′ ∥ İ₂′\njX₂′İ₂′ ⟂ İ₂′',
    '从 U̇₂′ 的箭头端先画同向的电阻压降，再把 İ₂′ 逆时针转 90°，画出垂直的漏抗压降。',
  ],
  [
    '合成折算后的二次电动势',
    'Ė₂′ = U̇₂′ + R₂′İ₂′ + jX₂′İ₂′',
    '从原点连到二次漏抗压降的箭头端。T 形电路中，Ė₂′ 对应中间节点与公共端之间的电压。',
  ],
  [
    '画出空载电流',
    'İ₀ = −Ė₂′ / (R₀ + jX₀)',
    'İ₀ 流过中间的励磁支路。按图中极性，该支路的上端对下端电压为 −Ė₂′，İ₀ 滞后于这个电压。',
  ],
  [
    '由电流关系合成一次电流',
    'İ₁ + İ₂′ = İ₀\nİ₁ = İ₀ + (−İ₂′)',
    '把 İ₂′ 反向得到 −İ₂′，再与 İ₀ 作平行四边形。对角线就是 İ₁。',
  ],
  [
    '标出一次电动势及其反向量',
    'Ė₁ = Ė₂′，U̇₁ = −Ė₁ + (R₁ + jX₁)İ₁',
    'Ė₁ 与 Ė₂′ 完全重合。把 Ė₁ 反向画出 −Ė₁，作为一次侧电压合成的起点。',
  ],
  [
    '接上一次侧的两段压降',
    'R₁İ₁ ∥ İ₁\njX₁İ₁ ⟂ İ₁',
    '从 −Ė₁ 的箭头端先画与 İ₁ 同向的电阻压降，再画相对 İ₁ 逆时针转 90° 的漏抗压降。',
  ],
  [
    '合成一次端电压',
    'U̇₁ = −Ė₁ + R₁İ₁ + jX₁İ₁',
    '从原点连到一次漏抗压降的箭头端，得到一次端电压 U̇₁。电路同步标出输入端的参考极性。',
  ],
];

// Use Cartesian phasors with positive imaginary values pointing up.
const origin = [530, 240];
const zero = [0, 0];
const add = ([x, y], [a, b]) => [x + a, y + b];
const scale = ([x, y], factor) => [x * factor, y * factor];
const rotate = ([x, y]) => [-y, x];
const screen = ([x, y]) => [origin[0] + x, origin[1] - y];
const midpoint = (start, end) => scale(add(start, end), 0.5);

const u2 = [236, 0];
const r0 = 0.75;
const x0 = 3.75;
const i2Magnitude = Math.hypot(100, 72);

function segment(start, end) {
  const [x1, y1] = screen(start);
  const [x2, y2] = screen(end);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
}

function vector(step, color, start, end, label, labelPosition) {
  const [tipX, tipY] = screen(end);
  const [x, y] = screen(labelPosition);
  const angle = Math.atan2(start[1] - end[1], end[0] - start[0]);
  const degrees = (angle * 180) / Math.PI;
  return `<g class="vector ${color}" data-step="${step}">
    ${segment(start, end)}
    <polygon points="0,0 -12,-5 -12,5"
      transform="translate(${tipX} ${tipY}) rotate(${degrees})" />
    <text x="${x}" y="${Math.max(28, y)}">${label}</text>
  </g>`;
}

function rightAngle(step, color, corner, resistanceDrop, reactanceDrop) {
  const back = scale(resistanceDrop, -11 / Math.hypot(...resistanceDrop));
  const across = scale(reactanceDrop, 11 / Math.hypot(...reactanceDrop));
  const points = [back, add(back, across), across]
    .map((offset) => screen(add(corner, offset)).join(','))
    .join(' ');
  return `<polyline class="corner ${color}" data-step="${step}" points="${points}" />`;
}

function angleArc(angle) {
  if (angle === 0) return '';
  const radius = 66;
  const [x, y] = screen([radius, 0]);
  const [tipX, tipY] = screen([
    radius * Math.cos(angle),
    radius * Math.sin(angle),
  ]);
  const [labelX, labelY] = screen([
    86 * Math.cos(angle / 2),
    86 * Math.sin(angle / 2) - 8,
  ]);
  return `<g class="angle secondary" data-step="1">
    <path d="M${x} ${y} A${radius} ${radius} 0 0 ${angle < 0 ? 1 : 0} ${tipX} ${tipY}" />
    ${Math.abs(angle) >= Math.PI / 18 ? `<text x="${labelX}" y="${labelY}">φ₂</text>` : ''}
  </g>`;
}

const plot = document.getElementById('vectors');
const circuitMarks = document.querySelectorAll('.phasor-circuit [data-step]');
const loadAngle = document.getElementById('load-angle');
const loadStatus = document.getElementById('load-status');
const count = document.getElementById('step-count');
const title = document.getElementById('step-title');
const formula = document.getElementById('step-formula');
const detail = document.getElementById('step-detail');
const previous = document.getElementById('previous-step');
const next = document.getElementById('next-step');
let active = 0;

function highlightStep(labels) {
  for (const label of labels) {
    const step = Number(label.dataset.step);
    label.classList.toggle('is-shown', step <= active);
    label.classList.toggle('is-current', step === active);
  }
}

function drawPhasors(degrees) {
  const angle = (degrees * Math.PI) / 180;
  const loadDirection = [Math.cos(angle), Math.sin(angle)];
  const i2 = scale(loadDirection, i2Magnitude);
  const r2Drop = scale(i2, 0.58);
  const x2Drop = scale(rotate(i2), 0.73);
  const secondaryCorner = add(u2, r2Drop);
  const e2 = add(secondaryCorner, x2Drop);
  const negativeE1 = scale(e2, -1);
  const i0 = scale(
    add(scale(negativeE1, r0), scale(rotate(negativeE1), -x0)),
    1 / (r0 ** 2 + x0 ** 2),
  );
  const negativeI2 = scale(i2, -1);
  const i1 = add(i0, negativeI2);
  const r1Drop = scale(i1, 0.22);
  const x1Drop = scale(rotate(i1), 0.46);
  const primaryCorner = add(negativeE1, r1Drop);
  const u1 = add(primaryCorner, x1Drop);

  plot.innerHTML = [
    angleArc(angle),
    vector(
      0,
      'reference',
      zero,
      u2,
      active === 0 ? 'U̇₂' : 'U̇₂′',
      add(u2, [-28, -30]),
    ),
    vector(
      1,
      'secondary',
      zero,
      i2,
      'İ₂′',
      add(i2, [19, degrees > 0 ? 15 : -29]),
    ),
    vector(
      2,
      'secondary',
      u2,
      secondaryCorner,
      'R₂′İ₂′',
      add(midpoint(u2, secondaryCorner), [40, -36]),
    ),
    vector(
      2,
      'secondary',
      secondaryCorner,
      e2,
      'jX₂′İ₂′',
      add(midpoint(secondaryCorner, e2), [72, 8]),
    ),
    rightAngle(2, 'secondary', secondaryCorner, r2Drop, x2Drop),
    vector(
      3,
      'emf',
      zero,
      e2,
      active >= 6 ? 'Ė₁ = Ė₂′' : 'Ė₂′',
      add(e2, [0, 42]),
    ),
    vector(4, 'excitation', zero, i0, 'İ₀', add(i0, [25, 11])),
    `<g class="construction excitation" data-step="5">${segment(negativeI2, i1)}</g>`,
    `<g class="construction secondary" data-step="5">${segment(i0, i1)}</g>`,
    vector(
      5,
      'secondary',
      zero,
      negativeI2,
      '−İ₂′',
      add(negativeI2, [-22, -25]),
    ),
    vector(5, 'primary', zero, i1, 'İ₁', add(i1, [-22, 16])),
    vector(
      6,
      'emf',
      zero,
      negativeE1,
      '−Ė₁',
      add(negativeE1, [64, 13 - Math.max(0, degrees - 48)]),
    ),
    vector(
      7,
      'primary',
      negativeE1,
      primaryCorner,
      'R₁İ₁',
      add(midpoint(negativeE1, primaryCorner), [9, 24]),
    ),
    vector(
      7,
      'primary',
      primaryCorner,
      u1,
      'jX₁İ₁',
      add(midpoint(primaryCorner, u1), [-39, 12]),
    ),
    rightAngle(7, 'primary', primaryCorner, r1Drop, x1Drop),
    vector(8, 'input', zero, u1, 'U̇₁', add(u1, [0, -29])),
  ].join('');
  plot.classList.toggle('coincident', degrees === 0 && active >= 1);
  highlightStep(plot.querySelectorAll('[data-step]'));
  if (active === 6)
    plot.querySelector('.vector[data-step="3"]').classList.add('is-current');
}

function updateLoad() {
  const degrees = loadAngle.valueAsNumber;
  const magnitude = Math.abs(degrees);
  const status =
    degrees < 0
      ? `感性 · 滞后 ${magnitude}°`
      : degrees > 0
        ? `容性 · 超前 ${magnitude}°`
        : '阻性 · 同相 0°';
  loadStatus.textContent = status;
  loadAngle.setAttribute('aria-valuetext', status);
  drawPhasors(degrees);
  if (active === 1) {
    const signed =
      degrees < 0 ? `−${magnitude}` : degrees > 0 ? `+${magnitude}` : '0';
    formula.textContent = `${steps[1][1]}\n∠İ₂′ − ∠U̇₂′ = ${signed}°`;
  }
}

function selectStep(index) {
  active = index;
  highlightStep(circuitMarks);
  count.textContent = `第 ${active + 1} 步 / 共 ${steps.length} 步`;
  const [heading, equation, explanation] = steps[active];
  title.textContent = heading;
  formula.textContent = equation;
  detail.textContent = explanation;
  previous.disabled = active === 0;
  next.textContent = active === steps.length - 1 ? '从头演示 ↺' : '下一步 →';
  updateLoad();
}

loadAngle.addEventListener('input', updateLoad);
previous.addEventListener('click', () => {
  selectStep(active - 1);
  if (previous.disabled) next.focus();
});
next.addEventListener('click', () => selectStep((active + 1) % steps.length));
selectStep(0);
