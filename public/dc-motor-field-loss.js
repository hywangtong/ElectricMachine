import './dc-generator-emf-controls.js';
import './dc-machine-basics.js';
import {
  parameters as p,
  loads,
  initialState,
  readings,
  trajectory,
  stallTorque,
  characteristic,
} from './dc-motor-field-loss-model.mjs';

const $ = (id) => document.getElementById(id);
const x = (torque) => 65 + (torque / 80) * 740;
// Keep the full light-load intersection visible across the residual-flux range.
const maxSpeed = 33000;
const y = (speed) => 254 - (speed / maxSpeed) * 234;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let scenario = 'light';
let experiment;
let time = 0;
let faulted = false;
let playing = false;
let angle = 0;
let lastFrame = null;

const grid = [];
for (let speed = 0; speed <= maxSpeed; speed += 5500) {
  grid.push(
    `<path d="M65 ${y(speed)}H805" stroke="#e5ece7"/><text x="54" y="${y(speed) + 5}" text-anchor="end">${speed}</text>`,
  );
}
for (let torque = 0; torque <= 80; torque += 20) {
  grid.push(
    `<path d="M${x(torque)} 20V254" stroke="#e5ece7"/><text x="${x(torque)}" y="275" text-anchor="middle">${torque}</text>`,
  );
}
$('grid').innerHTML = grid.join('');
$('danger-line').setAttribute('d', `M65 ${y(p.dangerSpeed)}H805`);
$('danger-label').setAttribute('y', y(p.dangerSpeed) - 7);

function curve(flux) {
  const intercept = characteristic(flux, 0);
  const slope = p.resistance / (p.ce * p.ct * flux ** 2);
  const start = Math.max(0, (intercept - maxSpeed) / slope);
  const end = Math.min(80, stallTorque(flux));
  return `M${x(start)} ${y(Math.min(maxSpeed, intercept))}L${x(end)} ${y(Math.max(0, characteristic(flux, end)))}`;
}

function reset() {
  experiment = trajectory(loads[scenario], Number($('residual').value) / 100);
  time = 0;
  faulted = false;
  playing = false;
  angle = 0;
  $('time').max = Math.ceil(experiment.samples.at(-1).time * 100) / 100;
  $('time').value = 0;
  $('time').disabled = false;
  $('light').setAttribute('aria-pressed', String(scenario === 'light'));
  $('heavy').setAttribute('aria-pressed', String(scenario === 'heavy'));
  $('light-conclusion').classList.toggle('selected', scenario === 'light');
  $('heavy-conclusion').classList.toggle('selected', scenario === 'heavy');
  $('load-name').textContent = scenario === 'light' ? '轻载' : '持续重载';
  $('load-number').textContent = `${loads[scenario]} N·m`;
  $('reference-curve').setAttribute('d', curve(p.flux));
  $('residual-curve').setAttribute('d', curve(experiment.residual));
  $('load-line').setAttribute('d', `M${x(loads[scenario])} 20V254`);
  $('load-label').setAttribute('x', x(loads[scenario]) + 6);
  $('load-label').textContent = `TL=${loads[scenario]}`;
  const initial = readings(initialState(loads[scenario]));
  $('initial-point').setAttribute('cx', x(loads[scenario]));
  $('initial-point').setAttribute('cy', y(initial.speed));
  $('residual-value').textContent = `${$('residual').value}%`;
  $('capacity').textContent =
    `剩磁零速转矩：${stallTorque(experiment.residual).toFixed(1)} N·m`;
  render();
}

function currentSample() {
  const index = Math.min(
    experiment.samples.length - 1,
    Math.round(time / experiment.dt),
  );
  return { index, sample: experiment.samples[index] };
}

function render() {
  const { index, sample } = currentSample();
  const load = loads[scenario];
  const ended = faulted && index === experiment.samples.length - 1;
  const stalled = faulted && sample.omega === 0;
  const overspeed = ended && experiment.outcome === 'overspeed';
  const rawDelta = sample.torque - load;
  const delta = Math.abs(rawDelta) < 0.05 ? 0 : rawDelta;
  $('field-switch').setAttribute(
    'd',
    faulted ? 'M96 30L135 4' : 'M96 30L141 30',
  );
  $('field-state').textContent = faulted ? '已断开' : '接通';
  $('field-glow').setAttribute('opacity', Math.max(0.06, sample.flux / p.flux));
  $('flux-value').textContent = `${((100 * sample.flux) / p.flux).toFixed(1)}%`;
  $('emf-value').textContent = `${sample.emf.toFixed(0)} V`;
  $('current-value').textContent = `${sample.current.toFixed(1)} A`;
  $('speed-value').textContent = `${sample.speed.toFixed(0)}`;
  $('speed-value').title = '单位：r/min';
  $('torque-value').textContent =
    `Te ${sample.torque.toFixed(1)} − TL ${load} = ${delta.toFixed(1)} N·m`;
  $('motion').textContent = stalled
    ? '静阻力保持零速'
    : Math.abs(delta) < 0.1
      ? '转矩平衡'
      : delta > 0
        ? '加速 ↑'
        : '减速 ↓';
  $('current-curve').setAttribute('d', curve(sample.flux));
  // A mechanical operating point satisfies BOTH n = f(Te) and Te = TL.
  // The motor's transient speed/current remain in the separate live readings.
  const workingSpeed = characteristic(sample.flux, load);
  const hasWorkingPoint = workingSpeed >= 0;
  const pointX = x(load);
  $('point').setAttribute('cx', pointX);
  $('point').setAttribute('cy', y(workingSpeed));
  $('point').setAttribute('visibility', hasWorkingPoint ? 'visible' : 'hidden');
  $('point-label').setAttribute('x', Math.min(700, pointX + 10));
  $('point-label').setAttribute('y', Math.max(36, y(workingSpeed) - 10));
  $('point-label').setAttribute(
    'visibility',
    hasWorkingPoint ? 'visible' : 'hidden',
  );
  $('point-label').textContent = '工作点（曲线 × TL）';
  $('offscreen').textContent = hasWorkingPoint
    ? `当前交点：T = ${load} N·m，n = ${Math.round(workingSpeed).toLocaleString()} r/min`
    : '当前曲线与 TL 无正转速工作点 → 无法维持旋转';
  $('time').value = time;
  $('time').style.setProperty(
    '--time-progress',
    `${(time / Number($('time').max)) * 100}%`,
  );
  $('time-value').textContent = faulted ? `${time.toFixed(2)} s` : '可直接拖动';
  $('fault').disabled = faulted && !ended;
  $('fault').textContent = ended ? '重播断电' : '断开励磁';
  $('pause').disabled = !faulted || ended;
  $('pause').textContent = playing ? '暂停' : '继续';
  $('status').dataset.danger = String(ended);
  $('status').textContent = !faulted
    ? '正常运行'
    : overspeed
      ? '飞车风险 · 定格观察'
      : stalled
        ? '已堵转 · 电枢仍通电'
        : playing
          ? '励磁断电中'
          : '暂停 / 回看';
  let title;
  let copy;
  if (!faulted) {
    title = '① 点击一种负载，播放励磁断电';
    copy =
      '点击图旁的轻载／重载演示按钮即可播放；也可直接拖动时间轴，观察曲线与红点的变化。';
  } else if (time < 0.65) {
    title = '② 磁通衰减 → 反电势下降 → 电流增大';
    copy =
      '电流、转速不会突跳；Te = CTΦIa 中，Φ 下降与 Ia 增大同时起作用。此时看净转矩判断方向。';
  } else if (scenario === 'light') {
    title = overspeed
      ? '④ 已越过危险线：飞车风险'
      : '③ 剩磁转矩仍带得动轻载 → 加速';
    copy = overspeed
      ? '仅冻结演示，电枢没有断电。平衡转速仍在更高处，实际还受损耗、换向与保护影响。'
      : 'Te > TL，转速上升；剩磁很小，要达到新的反电势平衡，需要远高于原来的转速。';
  } else {
    title = stalled
      ? '④ 停转后 E = 0，电流趋向 220 A'
      : '③ 剩磁转矩不足 → 持续减速';
    copy = stalled
      ? '大电流也弥补不了磁通不足，Te < TL；电枢铜耗约 48.4 kW，持续通电有烧损风险。'
      : '即使降到零速，剩磁最大转矩仍小于 TL，无法维持旋转。过程中可能先短暂加速，再转为减速。';
  }
  $('stage-title').textContent = title;
  $('stage-copy').textContent = copy;
  $('chart-description').textContent =
    `${scenario === 'light' ? '轻载' : '重载'}；断电后 ${time.toFixed(2)} 秒；${$('offscreen').textContent}。红点为当前机械特性曲线与 TL 线的交点。右侧暂态转速 ${sample.speed.toFixed(0)} r/min，电流 ${sample.current.toFixed(1)} A；${$('motion').textContent}。`;
}

function startFault() {
  time = 0;
  faulted = true;
  playing = true;
  render();
}

for (const name of ['light', 'heavy']) {
  $(name).addEventListener('click', () => {
    scenario = name;
    reset();
    startFault();
  });
}
$('residual').addEventListener('input', reset);
$('reset').addEventListener('click', reset);
$('fault').addEventListener('click', startFault);
$('pause').addEventListener('click', () => {
  playing = !playing;
  render();
});
$('time').addEventListener('input', () => {
  faulted = true;
  playing = false;
  time = Number($('time').value);
  render();
});
const dialog = $('source-dialog');
$('sources').addEventListener('click', () => {
  playing = false;
  render();
  dialog.showModal();
});
dialog.addEventListener('keydown', (event) => event.stopPropagation());
$('slow').checked = true;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    playing = false;
    render();
  }
});
function frame(now) {
  const dt = lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (playing && !document.hidden) {
    time = Math.min(
      experiment.samples.at(-1).time,
      time + dt * ($('slow').checked ? 0.25 : 1),
    );
    if (time === experiment.samples.at(-1).time) playing = false;
    render();
  }
  if (
    (!faulted || playing) &&
    !reducedMotion &&
    !dialog.open &&
    !document.hidden
  ) {
    angle =
      (angle +
        ((((currentSample().sample.omega * 180) / Math.PI) * dt) / 60) *
          ($('slow').checked ? 0.25 : 1)) %
      360;
    $('shaft').setAttribute('transform', `translate(339 85) rotate(${angle})`);
  }
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
