const $ = (id) => document.getElementById(id);
const current = $('current');
const turns = $('turns');
const area = $('area');
const mu = 0.01;
const length = 0.5;
const maximumProduct = 8 * 2 * 4;
let validTurns = 6;

function signed(value, digits) {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;
}

function line(id, x, y, dx, dy, magnitude) {
  const element = $(id);
  element.setAttribute('x1', x - (dx * magnitude) / 2);
  element.setAttribute('y1', y - (dy * magnitude) / 2);
  element.setAttribute('x2', x + (dx * magnitude) / 2);
  element.setAttribute('y2', y + (dy * magnitude) / 2);
  element.style.visibility = magnitude === 0 ? 'hidden' : 'visible';
}

function winding(n, width) {
  const left = 194 - width / 2 - 13;
  const right = 194 + width / 2 + 13;
  const pitch = 158 / n;
  const back = [];
  const front = [];
  for (let i = 0; i < n; i++) {
    const y = 265 - i * pitch;
    // Continuous helix: front left→right, rear right→left, up one pitch.
    front.push(
      `<path d="M${left} ${y} C${left - 8} ${y + 13} ${right + 8} ${y + 13} ${right} ${y - pitch / 2}" />`,
    );
    back.push(
      `<path d="M${right} ${y - pitch / 2} C${right + 8} ${y - pitch / 2 - 16} ${left - 8} ${y - 16} ${left} ${y - pitch}" />`,
    );
  }
  $('coil-back').innerHTML = back.join('');
  $('coil-front').innerHTML = front.join('');
  $('coil-leads').setAttribute(
    'd',
    `M${left} 265H110V310H40 M${left} 107H110V60H40`,
  );
}

function render() {
  const i = Number(current.value);
  const a = Number(area.value);
  const n = validTurns;
  const h = (n * i) / length;
  const b = mu * h;
  const phi = b * a * 1e-4;
  const direction = Math.sign(i);
  // One proportional scale for the whole domain, without clipping or a minimum.
  const fluxLength = (180 * Math.abs(n * i * a)) / maximumProduct;
  const width = 64 * Math.sqrt(a / 3);
  $('core-face').setAttribute('stroke-width', width);
  $('core-depth').setAttribute('stroke-width', width);
  winding(n, width);
  line('flux-top', 369, 75, direction, 0, fluxLength);
  line('flux-right', 544, 187, 0, direction, fluxLength);
  line('flux-bottom', 369, 299, -direction, 0, fluxLength);
  line('flux-left', 194, 187, 0, -direction, fluxLength);
  line('current-arrow', 75, 310, direction, 0, (66 * Math.abs(i)) / 2);
  const sectionSize = 72 * Math.sqrt(a / 3);
  $('section-area').setAttribute('width', sectionSize);
  $('section-area').setAttribute('height', sectionSize);
  $('section-area').setAttribute('x', 44 - sectionSize / 2);
  $('section-area').setAttribute('y', 44 - sectionSize / 2);
  $('current-value').textContent = `${signed(i, 1)} A`;
  $('area-value').textContent = `${a.toFixed(1)} cm²`;
  $('area-label').textContent = `${a.toFixed(1)} cm²`;
  $('turns-label').textContent = `N = ${n} 匝`;
  $('direction-label').textContent =
    i === 0
      ? 'I = 0 → Φ = 0'
      : i > 0
        ? '正电流 → 顺时针磁通'
        : '负电流 → 逆时针磁通';
  $('h-value').textContent = `H = ${signed(h, 1)} A/m`;
  $('b-value').textContent = `B = ${signed(b, 2)} T`;
  $('phi-value').textContent = `Φ = ${signed(phi * 1000, 3)} mWb`;
  $('experiment-result').textContent =
    `主磁通 Φ = ${signed(phi * 1000, 3)} mWb　·　${i === 0 ? '无励磁，箭头归零' : '箭头越长，所表示的量越大'}`;
  $('core-diagram').setAttribute(
    'aria-label',
    `${n} 匝线圈，电流 ${signed(i, 1)} 安培，截面积 ${a.toFixed(1)} 平方厘米，主磁通 ${signed(phi * 1000, 3)} 毫韦伯。${$('direction-label').textContent}`,
  );
}

function validateTurns() {
  const n = Number(turns.value);
  const valid =
    turns.value.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= 8;
  turns.setAttribute('aria-invalid', String(!valid));
  $('turns-hint').textContent = valid ? '整数 · 同步增减' : '请输入 1—8 的整数';
  if (valid) {
    validTurns = n;
    render();
  }
}

current.addEventListener('input', render);
area.addEventListener('input', render);
turns.setAttribute('aria-describedby', 'turns-hint');
turns.addEventListener('input', validateTurns);
turns.addEventListener('change', validateTurns);
$('reset').addEventListener('click', () => {
  current.value = '1.5';
  area.value = '3';
  turns.value = '6';
  validateTurns();
});

function fit() {
  $('lesson').style.setProperty(
    '--lesson-scale',
    Math.min(window.innerWidth / 1444, window.innerHeight / 744),
  );
}
window.addEventListener('resize', fit);
// Browsers may restore native input values after initial module execution.
window.addEventListener('pageshow', () => {
  window.requestAnimationFrame(() => {
    validateTurns();
    render();
    fit();
  });
});
fit();
render();
