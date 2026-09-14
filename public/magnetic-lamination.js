const $ = (id) => document.getElementById(id);
const countInput = $('sheet-count');
const frequency = 0.25;
let count = 6;
let elapsed = 0;
let lastTime = null;
let paused = false;
let phase = Math.PI / 4;
let eddyTravel = 0;

function resizeLesson() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(window.innerWidth / 1444, window.innerHeight / 744),
  );
}

function defs(id) {
  return `<defs><marker id="${id}-field" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="14" markerHeight="14" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 0L10 5L0 10Z" fill="#397f73"/></marker></defs>`;
}

// In the front x-y section B is along z. Sheets extend along y and z.
// Each loop starts at its top centre; increasing path distance is clockwise.
function loop(x, y, width, height, sheets) {
  const inset = Math.min(12, width * 0.18);
  const left = x + inset;
  const right = x + width - inset;
  const top = y + 20;
  const bottom = y + height - 20;
  const centre = (left + right) / 2;
  const radius = Math.min(12, (right - left) / 3);
  const d = `M${centre} ${top} H${right - radius} Q${right} ${top} ${right} ${top + radius} V${bottom - radius} Q${right} ${bottom} ${right - radius} ${bottom} H${left + radius} Q${left} ${bottom} ${left} ${bottom - radius} V${top + radius} Q${left} ${top} ${left + radius} ${top} Z`;
  return `<g class="eddy" data-sheets="${sheets}"><path class="eddy-loop" d="${d}"/><path class="eddy-loop" d="${d}" opacity="0.22" stroke-width="1"/><path class="eddy-track" d="${d}" fill="none" stroke="none"/><path class="eddy-arrow" d="M-5 -3L2 0L-5 3" fill="none" stroke="#bf632c" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function symbol(x, y) {
  return `<g class="b-symbol" transform="translate(${x} ${y})"><circle class="field-symbol" r="7"/><circle class="b-dot" r="2.5" fill="#287e70"/><path class="b-cross" d="M-3 -3L3 3M-3 3L3 -3" stroke="#287e70" stroke-width="1.7"/></g>`;
}

function core(id, sheets) {
  const width = 260 / sheets;
  let faces = '';
  let loops = '';
  for (let index = 0; index < sheets; index++) {
    const x = 48 + index * width;
    const gap = sheets === 1 ? 0 : Math.min(3, width * 0.12);
    const w = width - gap;
    faces += `<path d="M${x} 100l52 -42h${w}l-52 42Z" fill="#cfe3d8" stroke="#718680" stroke-width="1"/><rect x="${x}" y="100" width="${w}" height="185" fill="#c3d7cc" stroke="#718680" stroke-width="1"/>`;
    loops += loop(x, 100, w, 185, sheets);
  }
  // A single row of parallel z-directed lines has uniform screen-space
  // separation. White underlays distinguish B from the eddy loops below.
  const fields = Array.from(
    { length: 7 },
    () =>
      `<g class="b-field"><path class="field-halo"/><path class="field-line b-line"/><path class="vector-halo"/><path class="field-line b-vector" marker-end="url(#${id}-field)"/></g>`,
  ).join('');
  $(id).innerHTML =
    `${defs(id)}<path d="M308 100l52 -42v185l-52 42Z" fill="#b3c7bc" stroke="#718680"/>${faces}${loops}${fields}<path d="M48 305v8h260v-8" fill="none" stroke="#718680"/><text x="178" y="337" text-anchor="middle" class="diagram-caption">${sheets === 1 ? '总铁厚 D · 大回路' : `${sheets} 片 · 单片厚度 D/${sheets}`}</text><text x="345" y="38" text-anchor="middle" font-size="20">B(t)</text>`;
}

function circuits() {
  const width = 420 / count;
  let drawing = '';
  for (let index = 0; index < count; index++) {
    const x = 15 + index * width;
    const w = width - (count === 1 ? 0 : Math.min(4, width * 0.12));
    drawing += `<rect x="${x}" y="18" width="${w}" height="118" fill="#cfe3d8" stroke="#718680"/>${loop(x, 8, w, 138, count)}`;
    if (count <= 12 || index % 3 === 1) drawing += symbol(x + w / 2, 77);
  }
  $('sheet-circuits').innerHTML =
    `${drawing}<text x="455" y="49" font-size="16">B ⟂ 截面</text><text x="455" y="85" font-size="16">片面 ∥ B</text><text x="455" y="121" font-size="16">d = D/n</text>`;
}

function waveform() {
  const curve = (fn) =>
    Array.from(
      { length: 121 },
      (_, index) =>
        `${index === 0 ? 'M' : 'L'}${20 + index * 2.6} ${44 - 27 * fn((index / 120) * 2 * Math.PI)}`,
    ).join(' ');
  $('waveform').innerHTML =
    `<path d="M20 44H332M20 12V77" stroke="#b7cbc3" fill="none"/><path d="${curve(Math.sin)}" stroke="#287e70" stroke-width="2.5" fill="none"/><path d="${curve((p) => -Math.cos(p))}" stroke="#bf632c" stroke-dasharray="5 3" stroke-width="2" fill="none"/><path id="phase-cursor" d="M0 10V78" stroke="#173b3b"/><circle id="b-point" r="4" fill="#287e70"/><circle id="e-point" r="3.5" fill="#bf632c"/><text x="340" y="28" font-size="13">B / Bₘ</text><text x="340" y="57" font-size="13">−dB/dt</text><text x="20" y="91" font-size="11">0</text><text x="327" y="91" font-size="11">T</text>`;
}

let eddies = [];
let fieldLines = [];
let fieldMarkers = [];
let symbols = [];
function rebuild() {
  core('solid-core', 1);
  core('laminated-core', count);
  circuits();
  eddies = Array.from(document.querySelectorAll('.eddy'), (group) => ({
    group,
    track: group.querySelector('.eddy-track'),
    arrow: group.querySelector('.eddy-arrow'),
    length: group.querySelector('.eddy-track').getTotalLength(),
    sheets: Number(group.dataset.sheets),
  }));
  fieldLines = Array.from(
    document.querySelectorAll('.b-field'),
    (group, index) => ({
      group,
      index: index % 7,
      line: group.querySelector('.b-line'),
      vector: group.querySelector('.b-vector'),
      halo: group.querySelector('.field-halo'),
      vectorHalo: group.querySelector('.vector-halo'),
    }),
  );
  symbols = Array.from(document.querySelectorAll('.b-symbol'));
  fieldMarkers = Array.from(document.querySelectorAll('marker'));
  const loss = 100 / (count * count);
  const formatted = `${loss.toFixed(count === 1 ? 0 : 2)}%`;
  $('current-ratio').textContent = count === 1 ? '1' : `1/${count}`;
  $('loss-ratio').textContent = formatted;
  $('bar-value').textContent = formatted;
  $('loss-bar').style.width = `${loss}%`;
  render();
}

function render() {
  const b = Math.sin(phase);
  // Positive B points out of the section. Positive dB/dt induces clockwise I.
  const rate = Math.cos(phase);
  const fieldStrength = Math.abs(b);
  const fieldCount =
    fieldStrength < 0.005 ? 0 : Math.max(1, Math.round(7 * fieldStrength));
  for (const marker of fieldMarkers) {
    const size = 14 * Math.sqrt(fieldStrength);
    marker.setAttribute('markerWidth', size);
    marker.setAttribute('markerHeight', size);
  }
  for (const { group, index, line, vector, halo, vectorHalo } of fieldLines) {
    group.style.display = index < fieldCount ? '' : 'none';
    if (index >= fieldCount) continue;
    const x = 178 + (index - (fieldCount - 1) / 2) * 29;
    const y = 190;
    const path = `M${x + 97} ${y - 78}L${x - 48} ${y + 39}`;
    line.setAttribute('d', path);
    halo.setAttribute('d', path);
    // The vector lies on the same depth direction as the penetrating line.
    // Its total length is 130 |B/Bm|, with the sign setting its direction.
    const dx = (52 / Math.hypot(52, 42)) * 65 * b;
    const dy = (42 / Math.hypot(52, 42)) * 65 * b;
    const arrowPath = `M${x + dx} ${y - dy}L${x - dx} ${y + dy}`;
    vector.setAttribute('d', arrowPath);
    vectorHalo.setAttribute('d', arrowPath);
    group.style.opacity = 0.3 + 0.7 * fieldStrength;
  }
  for (const group of symbols) {
    group.style.opacity = fieldStrength;
    group.querySelector('.b-dot').style.display = b >= 0 ? '' : 'none';
    group.querySelector('.b-cross').style.display = b < 0 ? '' : 'none';
  }
  for (const { group, track, arrow, length, sheets } of eddies) {
    const strength = Math.abs(rate) / sheets;
    const stroke = 0.7 + 6 * strength;
    group.style.opacity = Math.sqrt(strength);
    group.querySelector('.eddy-loop').setAttribute('stroke-width', stroke);
    arrow.setAttribute('stroke-width', Math.min(3.5, stroke));
    const travel = eddyTravel / sheets;
    const distance = (((travel % 1) + 1) % 1) * length;
    const position = track.getPointAtLength(distance);
    const ahead = track.getPointAtLength((distance + 0.5) % length);
    const angle =
      (Math.atan2(ahead.y - position.y, ahead.x - position.x) * 180) / Math.PI +
      (rate < 0 ? 180 : 0);
    arrow.setAttribute(
      'transform',
      `translate(${position.x} ${position.y}) rotate(${angle})`,
    );
  }
  const x = 20 + ((phase % (2 * Math.PI)) / (2 * Math.PI)) * 312;
  $('phase-cursor').setAttribute('transform', `translate(${x} 0)`);
  $('b-point').setAttribute('cx', x);
  $('b-point').setAttribute('cy', 44 - 27 * b);
  $('e-point').setAttribute('cx', x);
  $('e-point').setAttribute('cy', 44 + 27 * rate);
  $('field-state').textContent =
    `B/Bₘ = ${b.toFixed(2)} · ${fieldStrength < 0.01 ? '磁场过零' : b > 0 ? '出截面 ⊙' : '入截面 ⊗'}`;
  $('eddy-state').textContent =
    Math.abs(rate) < 0.01
      ? 'B 达到峰值，变化率为零，涡流暂时为零'
      : `${b * rate >= 0 ? '|B| 正在增大' : '|B| 正在减小'} · 涡流${rate > 0 ? '顺时针' : '逆时针'}`;
}

function updateCount() {
  if (countInput.value.trim() === '') return;
  const value = Number(countInput.value);
  if (!Number.isFinite(value)) return;
  count = Math.max(1, Math.min(24, Math.round(value)));
  countInput.value = count;
  rebuild();
}
countInput.addEventListener('input', updateCount);
countInput.addEventListener('blur', () => {
  countInput.value = count;
});
$('pause').addEventListener('click', () => {
  paused = !paused;
  $('pause').textContent = paused ? '继续动画' : '暂停动画';
});
$('reset').addEventListener('click', () => {
  count = 6;
  countInput.value = 6;
  elapsed = 0;
  phase = Math.PI / 4;
  eddyTravel = 0;
  paused = false;
  $('pause').textContent = '暂停动画';
  rebuild();
});
window.addEventListener('resize', resizeLesson);
document.addEventListener('visibilitychange', () => {
  lastTime = null;
});

function animate(time) {
  const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  if (!paused) {
    elapsed += dt;
    phase = (Math.PI / 4 + 2 * Math.PI * frequency * elapsed) % (2 * Math.PI);
    eddyTravel += dt * 0.65 * Math.cos(phase);
    render();
  }
  requestAnimationFrame(animate);
}
resizeLesson();
waveform();
rebuild();
requestAnimationFrame(animate);
