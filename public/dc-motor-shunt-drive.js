import {
  circuit,
  motor,
  speedAtTorque,
  step,
} from './dc-motor-shunt-drive-model.mjs';

const $ = (id) => document.getElementById(id);
const starting = new URLSearchParams(location.search).get('mode') !== 'control';
const settings = {
  'resistance-start': {
    label: '串电阻起动',
    title: '只给电枢串入起动电阻',
    copy: '励磁支路仍接全电压，磁通不变。Rₛₜ 限制电枢起动电流，转速升高后再逐步切除电阻。',
    formula: 'n = 0 时：Iₐₛₜ = U / (Rₐ + Rₛₜ)',
    takeaway:
      '起动步骤：先建立励磁，再接通电枢；随加速逐级切除 Rₛₜ。电阻计算与他励电动机相同。',
    slider: '起动电阻 Rₛₜ',
    min: 0,
    max: 10,
    step: 0.2,
    value: 5.2,
    unit: 'Ω',
  },
  'shared-voltage': {
    label: '共用电源降压 · 对照',
    title: '降电压，励磁也跟着变弱',
    copy: '仍采用并励接线时，Uₐ 与 U_f 同时下降。I_f 和 Φ 随之减小，起动转矩会比保持励磁时更低。',
    formula: 'Tₛₜ = CₜΦIₐₛₜ；线性区 Φ ∝ U_f',
    takeaway:
      '拖到 20% 电压再播放：本例的起动转矩小于负载转矩，轴不能起动。降压时要保住励磁。',
    slider: '共同端电压 U / U_N',
    min: 20,
    max: 100,
    step: 1,
    value: 40,
    unit: '%',
  },
  'separate-voltage': {
    label: '改他励后降压',
    title: '只降 Uₐ，让 U_f 保持额定值',
    copy: '励磁回路改为独立供电，保持 I_f、Φ 不变；再降低电枢电压，以限制起动电流。',
    formula: 'Iₐₛₜ = Uₐ / Rₐ；Φ = Φ_N',
    takeaway:
      '对比相同的 20% 电枢电压：改他励后磁通不变，起动转矩更大。需按负载与允许电流选择电压。',
    slider: '电枢电压 Uₐ / U_N',
    min: 20,
    max: 100,
    step: 1,
    value: 40,
    unit: '%',
  },
  resistance: {
    label: '串电阻调速',
    title: '电枢串 R：并励接线可保留',
    copy: '励磁支路的端电压不变，磁通基本不变。增大电枢电阻，机械特性变软，负载下转速降低。',
    formula: 'n = U / (CₑΦ) − (Rₐ + R)T / (CₑCₜΦ²)',
    takeaway:
      '起动电阻换为调速电阻即可；串阻调速向下调速、损耗大，负载变化时转速变化明显。',
    slider: '电枢串联电阻 R',
    min: 0,
    max: 6,
    step: 0.2,
    value: 2,
    unit: 'Ω',
  },
  voltage: {
    label: '降压调速',
    title: '改变 Uₐ：改他励，保持 Φ',
    copy: '励磁回路保持额定电压，单独调节电枢电压。降低 Uₐ 后，机械特性近似平行下移。',
    formula: 'Φ 不变：n₀ = Uₐ / (CₑΦ)',
    takeaway:
      '改为他励后分别调节 Uₐ 和 U_f，才能独立控制电枢与励磁；两者配合可扩大调速范围。',
    slider: '电枢电压 Uₐ / U_N',
    min: 40,
    max: 100,
    step: 1,
    value: 70,
    unit: '%',
  },
  field: {
    label: '弱磁调速',
    title: '励磁串 R_f：减小 I_f，提高转速',
    copy: '要求不高时，可保持并励接线，在励磁支路串调速电阻 R_f。电枢仍接全电压，励磁减弱。',
    formula: 'I_f = U / (R_绕组 + R_f)；Φ ↓ → n₀ ↑',
    takeaway:
      '高要求场合改他励，通过调节励磁电压改变 I_f。弱磁升速时，还需校验电枢电流和允许转速。',
    slider: '励磁调速电阻 R_f',
    min: 0,
    max: 180,
    step: 5,
    value: 100,
    unit: 'Ω',
  },
  dynamic: {
    label: '能耗制动',
    title: '改他励：电枢断电，接入 Rᵦ',
    copy: '励磁方向与大小保持不变。电枢脱离电源并接制动电阻，E 驱动反向电流，产生制动转矩。',
    formula: 'Iₐ = −E / (Rₐ + Rᵦ)；T·n < 0',
    takeaway:
      '并励电动机制动前改为他励。能耗制动把机械能变为电阻热；转速降至零，电磁制动转矩也为零。',
    slider: '制动电阻 Rᵦ',
    min: 2,
    max: 8,
    step: 0.2,
    value: 4,
    unit: 'Ω',
  },
  plugging: {
    label: '反接制动',
    title: '改他励：只反接电枢，串入限流电阻',
    copy: '励磁极性保持不变，仅反接电枢电源。U 与 E 共同驱动制动电流，需串入足够的限流电阻。',
    formula: 'Iₐ = (−U − E) / (Rₐ + Rᵦ)',
    takeaway:
      '停机反接制动到零速应断开电枢，否则会反向起动。本动画在零速自动断开；励磁保持供电。',
    slider: '制动限流电阻 Rᵦ',
    min: 3,
    max: 10,
    step: 0.2,
    value: 5,
    unit: 'Ω',
  },
  regenerative: {
    label: '回馈制动',
    title: '改他励：降低 Uₐ，使 E > Uₐ',
    copy: '保持励磁，突然降低电枢电压。转速不能突变，初始 E > Uₐ，Iₐ 反向，机械能经电机回送电源。',
    formula: 'Iₐ = (Uₐ − E) / Rₐ < 0；T·n < 0',
    takeaway:
      '此处演示降压调速中的暂态回馈：减速后恢复电动运行。回馈要求电源能接收能量，不能靠此方法停至零速。',
    slider: '降压后 Uₐ / U_N',
    min: 40,
    max: 80,
    step: 1,
    value: 65,
    unit: '%',
  },
};

const modes = starting
  ? ['resistance-start', 'shared-voltage', 'separate-voltage']
  : ['resistance', 'voltage', 'field', 'dynamic', 'plugging', 'regenerative'];
let mode = modes[0];
let setting = settings[mode].value;
let omega = 0;
let time = 0;
let angle = 0;
let running = false;
let previous = null;
let history = [];
let flow = 0;
let lastPlotTime = 0;
let lastReadoutTime = 0;

if (!starting) {
  $('page-title').textContent = '并励电动机：调速与制动';
  $('page-description').textContent =
    '励磁保持不变时，机械特性与他励相同；沿用各类拖动方法，先判断励磁能否独立保持。';
  $('chart-title').textContent = '机械特性 · n–T 工作点';
  $('chart-description').textContent =
    '灰虚线为额定励磁固有特性，绿线为当前特性，金色轨迹显示调节后的工作点移动。';
}
document.title = `8.6 ${$('page-title').textContent}`;

for (const id of modes) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.mode = id;
  button.textContent = settings[id].label;
  button.addEventListener('click', () => selectMode(id));
  $('mode-bar').append(button);
}

const rpm = (speed) => (speed * 60) / (2 * Math.PI);
const x = (value) => 64 + (starting ? value / 12 : (value + 240) / 620) * 514;
const y = (value) => 174 - (value / 3600) * 162;
const point = (a, b) => `${x(a).toFixed(2)},${y(b).toFixed(2)}`;
function path(points) {
  return points.map(([a, b], i) => `${i ? 'L' : 'M'}${point(a, b)}`).join(' ');
}

function drawGrid() {
  const xs = starting ? [0, 3, 6, 9, 12] : [-240, 0, 180, 380];
  $('chart-grid').innerHTML =
    [0, 1200, 2400, 3600]
      .map(
        (n) =>
          `<line x1="64" x2="578" y1="${y(n)}" y2="${y(n)}"/><text x="55" y="${y(n) + 5}" text-anchor="end">${n}</text>`,
      )
      .join('') +
    xs
      .map(
        (n) =>
          `<line x1="${x(n)}" x2="${x(n)}" y1="12" y2="174"/><text x="${x(n)}" y="194" text-anchor="middle">${n}</text>`,
      )
      .join('') +
    `<text x="64" y="6">n / r·min⁻¹</text><text x="578" y="211" text-anchor="end">${starting ? 't / s' : 'T / N·m'}</text>`;
}

function reset() {
  running = false;
  previous = null;
  time = 0;
  angle = 0;
  flow = 0;
  omega = starting
    ? 0
    : (motor.u - (motor.ra * motor.load) / motor.k) / motor.k;
  history = [];
  lastPlotTime = -1;
  lastReadoutTime = -1;
  $('play').textContent = starting ? '播放起动' : '播放过渡';
  draw(true);
}

function selectMode(id) {
  mode = id;
  const spec = settings[mode];
  setting = spec.value;
  $('experiment-title').textContent = spec.title;
  $('experiment-copy').textContent = spec.copy;
  $('formula').textContent = spec.formula;
  $('takeaway').textContent = spec.takeaway;
  $('setting-label').textContent = spec.slider;
  const slider = $('setting');
  slider.min = spec.min;
  slider.max = spec.max;
  slider.step = spec.step;
  slider.value = setting;
  for (const button of $('mode-bar').children) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  }
  $('circuit-title').textContent = spec.title.split('：')[0];
  updateCircuit();
  reset();
}

function updateCircuit() {
  const state = circuit(mode, setting, omega);
  const dynamic = mode === 'dynamic';
  const separate = state.separate;
  $('separate-source').style.display = separate ? '' : 'none';
  $('separate-label').style.display = separate ? '' : 'none';
  $('shared-wire').style.display = separate ? 'none' : '';
  $('brake-loop').style.display = dynamic ? '' : 'none';
  $('brake-label').style.display = dynamic ? '' : 'none';
  $('source-label').textContent = separate ? 'Uₐ' : 'U';
  $('source-label').style.display = dynamic ? 'none' : '';
  $('positive-terminal').textContent = mode === 'plugging' ? '−' : '+';
  $('negative-terminal').textContent = mode === 'plugging' ? '+' : '−';
  $('positive-terminal').style.display = dynamic ? 'none' : '';
  $('negative-terminal').style.display = dynamic ? 'none' : '';
  document.querySelector('.terminals').style.display = dynamic ? 'none' : '';
  const wire = dynamic
    ? 'M300 48V92M300 144V183M300 257V287'
    : 'M110 48H300V92M300 144V183M300 257V287H110';
  $('armature-wire').setAttribute('d', wire);
  $('armature-flow').setAttribute(
    'd',
    dynamic ? `${wire}M300 287H166V48H300` : wire,
  );
  $('field-flow').setAttribute(
    'd',
    separate
      ? 'M510 287H613V193M613 143V48H510V89M510 135V158M510 254V287'
      : 'M300 48H510V89M510 135V158M510 254V287H300',
  );
  $('resistance-label').textContent = [
    'resistance-start',
    'resistance',
  ].includes(mode)
    ? starting
      ? 'Rₛₜ'
      : 'R'
    : mode === 'plugging'
      ? 'Rᵦ'
      : 'Rₐ';
  $('connection-badge').textContent = separate
    ? '他励 · 励磁独立供电'
    : mode === 'shared-voltage'
      ? '并励 · 两支路同时降压'
      : '并励 · 共用电源';
  $('circuit-description').textContent =
    `${settings[mode].title}。${settings[mode].copy}`;
  $('setting-value').textContent =
    `${setting}${settings[mode].unit === 'Ω' ? ' Ω' : '%'}`;
  $('setting').setAttribute('aria-valuetext', $('setting-value').textContent);
  if (!starting) {
    const torques = [-240, 380];
    $('reference-curve').setAttribute(
      'd',
      path(torques.map((t) => [t, speedAtTorque(circuit('resistance', 0), t)])),
    );
    $('main-curve').setAttribute(
      'd',
      path(torques.map((t) => [t, speedAtTorque(state, t)])),
    );
  }
}

function draw(force = false) {
  const state = circuit(mode, setting, omega);
  if (force || time - lastPlotTime > 0.045) {
    history.push([starting ? time : state.torque, rpm(omega)]);
    lastPlotTime = time;
    $(starting ? 'main-curve' : 'trace-curve').setAttribute('d', path(history));
  }
  $('workpoint').setAttribute('cx', x(starting ? time : state.torque));
  $('workpoint').setAttribute('cy', y(rpm(omega)));
  $('rotor').setAttribute('transform', `rotate(${angle} 45 45)`);
  if (mode === 'plugging') {
    $('armature-wire').setAttribute(
      'd',
      state.disconnected
        ? 'M110 48H160L195 28M205 48H300V92M300 144V183M300 257V287H110'
        : 'M110 48H300V92M300 144V183M300 257V287H110',
    );
  }
  $('armature-flow').style.strokeDashoffset = -flow * Math.sign(state.current);
  $('armature-flow').style.opacity = Math.abs(state.current) > 0.1 ? '1' : '0';
  $('field-flow').style.strokeDashoffset = -flow * 0.5;
  $('current-arrow').style.display =
    Math.abs(state.current) > 0.1 ? '' : 'none';
  $('current-arrow').setAttribute(
    'd',
    state.current >= 0 ? 'M300 153V176' : 'M300 176V153',
  );
  if (!force && time - lastReadoutTime < 0.1) return;
  lastReadoutTime = time;
  $('torque-value').textContent = `${state.torque.toFixed(1)} N·m`;
  $('field-value').textContent = `${state.fieldCurrent.toFixed(2)} A`;
  $('speed-value').textContent = `${Math.round(rpm(omega))} r/min`;
  const braking = state.torque < -0.1 && omega > 0;
  $('status').textContent =
    time === 0
      ? starting
        ? '准备起动'
        : '调节后 t = 0⁺'
      : omega === 0
        ? state.disconnected
          ? '零速 · 电枢已断开'
          : state.torque < motor.load
            ? '零速 · 转矩不足'
            : '起动中'
        : braking
          ? '制动 · T 与 n 反向'
          : running
            ? '电动运行'
            : '已暂停';
  $('energy-strip').textContent = state.disconnected
    ? '零速断开电枢 · 励磁保持供电'
    : omega === 0
      ? '转子静止 · 电枢电流产生转矩与铜耗'
      : braking
        ? mode === 'dynamic'
          ? '机械能 → 电机 → 制动电阻热'
          : mode === 'plugging'
            ? '机械能 + 电源电能 → 电阻热'
            : '机械能 → 电机 → 可接收能量的电源'
        : '电源 → 电机 → 机械负载';
  $('chart-note').textContent = starting
    ? `Iₐ = ${state.current.toFixed(1)} A · Φ / Φ_N = ${state.phi.toFixed(2)} · 负载转矩 26 N·m；${mode === 'resistance-start' ? '本次播放保持所选 Rₛₜ。' : '本次播放保持所选电压。'}`
    : `Iₐ = ${state.current.toFixed(1)} A · Φ / Φ_N = ${state.phi.toFixed(2)}；灰虚线：固有特性，绿线：当前特性，金线：过渡轨迹。`;
}

$('setting').addEventListener('input', () => {
  setting = Number($('setting').value);
  updateCircuit();
  reset();
});
$('play').addEventListener('click', () => {
  if (time >= 12) reset();
  running = !running;
  previous = null;
  $('play').textContent = running ? '暂停' : '继续';
  draw(true);
});
$('reset').addEventListener('click', reset);

// Keep native slider keys and button Space, and do not turn a control gesture
// into a course-page swipe. The shared script handles navigation elsewhere.
document.addEventListener(
  'keydown',
  (event) => {
    if (
      event.target.closest('input, button') &&
      [
        ' ',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    )
      event.stopPropagation();
  },
  true,
);
for (const type of ['touchstart', 'touchend']) {
  document.addEventListener(
    type,
    (event) => {
      if (event.target.closest('input, button')) event.stopPropagation();
    },
    { capture: true, passive: true },
  );
}
document.addEventListener('visibilitychange', () => {
  previous = null;
});
function animate(now) {
  if (running && !document.hidden) {
    const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
    for (let elapsed = 0; elapsed < dt;) {
      const h = Math.min(0.005, dt - elapsed);
      omega = step(mode, setting, omega, h);
      elapsed += h;
    }
    time = Math.min(12, time + dt);
    angle = (angle + omega * dt * 12) % 360;
    flow += dt * 45;
    if (time >= 12) {
      running = false;
      $('play').textContent = '重播';
    }
    draw(time >= 12);
  }
  previous = now;
  requestAnimationFrame(animate);
}
drawGrid();
selectMode(mode);
requestAnimationFrame(animate);
