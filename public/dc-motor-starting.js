import {
  commutation,
  motor,
  operatingPoint,
} from './dc-motor-starting-model.mjs';

const get = (id) => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const modeButtons = [...document.querySelectorAll('[data-mode]')];
let mode = 'direct';
let powered = false;
let running = false;
let progress = 0;
let angle = 0;
let flowOffset = 0;
let previousTime = 0;
const segments = [];

function point(radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return [
    160 + radius * Math.cos(radians),
    120 + radius * Math.sin(radians),
  ].join(' ');
}
for (let index = 0; index < 12; index += 1) {
  const start = index * 30 - 13;
  const end = index * 30 + 13;
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute(
    'd',
    `M${point(80, start)}A80 80 0 0 1 ${point(80, end)}L${point(51, end)}A51 51 0 0 0 ${point(51, start)}Z`,
  );
  path.setAttribute('fill', index % 2 ? '#c98c46' : '#dda352');
  path.setAttribute('stroke', '#a77438');
  get('segments').append(path);
  segments.push(path);
}
function number(value, digits = 0) {
  return value.toFixed(digits);
}
function write(id, value) {
  const element = get(id);
  if (element.textContent !== value) element.textContent = value;
}
function render() {
  const state = operatingPoint(mode, progress, powered);
  const contact = commutation(angle, state.current, state.speed);
  const high = state.ratio > 4;
  get('play').textContent = running
    ? '暂停观察'
    : !powered
      ? '接通并慢放'
      : progress >= 14
        ? '重新演示'
        : '继续慢放';
  get('play').setAttribute('aria-pressed', String(running));
  get('progress').value = progress;
  write(
    'phase-label',
    !powered
      ? '电枢待接通 · n = 0，E = 0'
      : progress <= 2
        ? '启动瞬间 · n = 0，E = 0'
        : progress < 14
          ? '加速 · E 上升，电流逐渐受限'
          : '正常运行 · 反电势已建立',
  );
  get('switch').setAttribute('d', powered ? 'M134 35H178' : 'M134 35 178 14');
  write('source-value', `Ua = ${number(state.voltage, 1)} V`);
  write(
    'external-drop',
    mode === 'resistance' ? `IaRr = ${number(state.externalDrop, 1)} V` : '',
  );
  write('emf-value', `${number(state.emf)} V`);
  write('resistor-value', `IaRa = ${number(state.armatureDrop)} V`);
  write(
    'external-value',
    mode === 'resistance'
      ? `Rr = ${number(state.externalResistance, 2)} Ω`
      : '',
  );
  document.querySelector('.extra-resistor').style.opacity =
    mode === 'resistance' ? '1' : '0';
  get('resistor-bypass').style.opacity = mode === 'resistance' ? '0' : '1';
  get('flow').style.opacity = powered ? '0.9' : '0';
  get('flow').style.strokeWidth = Math.min(8, 2 + state.ratio / 2);
  get('flow').style.strokeDashoffset = -flowOffset;
  get('voltage-bar').style.width = `${(100 * state.voltage) / motor.voltage}%`;
  for (const [id, value] of [
    ['emf-bar', state.emf],
    ['armature-bar', state.armatureDrop],
    ['external-bar', state.externalDrop],
  ]) {
    get(id).style.width = `${powered ? (100 * value) / state.voltage : 0}%`;
  }
  get('open-bar').style.width = powered ? '0%' : '100%';
  write(
    'balance',
    powered
      ? `Ua ${number(state.voltage)} V = E ${number(state.emf)} + IaRa ${number(state.armatureDrop)}${mode === 'resistance' ? ` + IaRr ${number(state.externalDrop)}` : ''} V`
      : '待接通：开关承担电源电压',
  );
  write(
    'circuit-note',
    !powered
      ? '选择启动方式，再接通电枢，观察电压如何分配。'
      : progress <= 2
        ? mode === 'direct'
          ? 'E = 0：全部电枢电压落在很小的 Ra 上 → 启动电流过大！'
          : mode === 'voltage'
            ? '降低 Ua 至 30 V：即使 E = 0，也将启动电流限制为 2 IN。'
            : '外串 Rr = 6.33 Ω 分担电压：Ra 仅承受 30 V，启动电流为 2 IN。'
        : mode === 'direct'
          ? '转速升高 → E 增大 → Ra 上的电压变小 → Ia 降低。'
          : mode === 'voltage'
            ? '加速时逐步升高 Ua；达到额定电压后，E 继续增大，Ia 降至 IN。'
            : '加速时逐步减小 Rr；切除完毕后，E 继续增大，Ia 降至 IN。',
  );
  write('speed', `${number(state.speed)} r/min`);
  write('current', `${number(state.current, 1)} A`);
  write('ratio', `${number(state.ratio, 1)} IN`);
  for (const id of ['current', 'ratio'])
    get(id).classList.toggle('high-current', high);
  get('segments').setAttribute('transform', `rotate(${angle} 160 120)`);
  get('rotor-mark').setAttribute('transform', `rotate(${angle} 160 120)`);
  const first = Math.floor(-angle / 30);
  const involved = [((first % 12) + 12) % 12, (((first + 1) % 12) + 12) % 12];
  segments.forEach((segment, index) => {
    segment.setAttribute(
      'fill',
      contact.bridging && involved.includes(index)
        ? '#f5c459'
        : index % 2
          ? '#c98c46'
          : '#dda352',
    );
  });
  const from = point(51, first * 30 + angle);
  const to = point(51, (first + 1) * 30 + angle);
  get('shorted-coil').setAttribute('d', `M${from}Q164 120 ${to}`);
  get('shorted-coil').setAttribute(
    'stroke',
    contact.bridging ? '#df7c2b' : '#bda679',
  );
  get('sparks').setAttribute('opacity', contact.sparking ? '1' : '0');
  write(
    'contact-label',
    state.speed === 0
      ? '静止 · 未跨片'
      : contact.bridging
        ? '电刷跨片 · 线圈换向'
        : contact.sparking
          ? '脱离接触 · 火花风险'
          : '电刷与单片接触',
  );
  get('contact-label').style.color = contact.sparking ? '#c04f2c' : '#287f70';
  write(
    'contact-note',
    state.speed === 0
      ? '换向片没有转动，电刷未跨片；此时没有正在换向的线圈。'
      : contact.bridging
        ? '电刷短接相邻两片，与之相连的线圈电流需要反向。'
        : contact.sparking
          ? '电流过大，换向不良；脱离的片与电刷间可能拉弧。'
          : high
            ? '电流仍大；继续观察跨片和离片时的换向过程。'
            : '电流已受限；正常换向仍随转动周期性发生。',
  );
  write(
    'method-note',
    mode === 'direct'
      ? '示例：UN = 220 V，Ra = 1 Ω，IN = 15 A → 直接启动电流约 14.7 IN。'
      : mode === 'voltage'
        ? '示例：启动 Ua = 30 V → IST = 30 A = 2 IN；允许值按具体电机选取。'
        : '示例：启动 Rr = 6.33 Ω → IST = 30 A = 2 IN；图中采用无级切除示意。',
  );
}
function reset() {
  powered = false;
  running = false;
  progress = 0;
  angle = 0;
  flowOffset = 0;
  render();
}
modeButtons.forEach((button) =>
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    modeButtons.forEach((candidate) =>
      candidate.setAttribute('aria-pressed', String(candidate === button)),
    );
    reset();
  }),
);
get('play').addEventListener('click', () => {
  if (progress >= 14) reset();
  powered = true;
  running = !running;
  render();
});
get('reset').addEventListener('click', reset);
function seek(value) {
  powered = true;
  running = false;
  progress = value;
  angle = progress <= 2 ? 0 : progress >= 14 ? 30 : 15;
  render();
}
get('progress').addEventListener('input', (event) =>
  seek(Number(event.target.value)),
);
for (const button of document.querySelectorAll('[data-stage]')) {
  button.addEventListener('click', () => seek(Number(button.dataset.stage)));
}
function tick(time) {
  const elapsed = previousTime
    ? Math.min(0.06, (time - previousTime) / 1000)
    : 0;
  previousTime = time;
  if (running && !document.hidden) {
    progress = Math.min(14, progress + elapsed);
    const state = operatingPoint(mode, progress, powered);
    angle += (elapsed * 100 * state.speed) / motor.ratedSpeed;
    flowOffset += elapsed * (25 + state.ratio * 9);
    if (progress >= 14) running = false;
    render();
  }
  requestAnimationFrame(tick);
}
render();
requestAnimationFrame(tick);
