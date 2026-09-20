import {
  defaultConditions,
  evaluateExcitation,
  voltageLevelAt,
} from '/dc-generator-self-excitation-model.mjs';

const conditions = { ...defaultConditions };
const switches = [...document.querySelectorAll('.condition-switch')];
const panels = {
  shunt: document.getElementById('shunt-machine'),
  series: document.getElementById('series-machine'),
};
const words = {
  residual: ['有', '无'],
  aiding: ['助磁', '去磁'],
  speed: ['足够', '偏低'],
  resistance: ['合适', '过大'],
  load: ['闭合', '断开'],
};
const names = {
  residual: '剩磁',
  aiding: '励磁方向',
  speed: '转速',
  resistance: '回路电阻',
  load: '负载回路',
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pauseButton = document.getElementById('pause');
pauseButton.disabled = reduceMotion;
let elapsed = reduceMotion ? 5000 : 0;
let lastFrame = null;
let playing = !reduceMotion;
const outcomes = {};

function renderSwitches() {
  for (const button of switches) {
    const key = button.dataset.condition;
    const on = conditions[key];
    const value = words[key][on ? 0 : 1];
    button.setAttribute('aria-checked', String(on));
    button.setAttribute('aria-label', `${names[key]}：${value}`);
    button.querySelector('.switch-state').textContent = value;
  }
}

function renderOutcomes() {
  for (const mode of ['shunt', 'series']) {
    const panel = panels[mode];
    const outcome = evaluateExcitation(mode, conditions);
    outcomes[mode] = outcome;
    panel.dataset.result = outcome.success ? 'success' : 'failure';
    panel.dataset.load = conditions.load ? 'closed' : 'open';
    panel.classList.toggle('has-residual', conditions.residual);
    panel.classList.toggle('speed-low', !conditions.speed);
    panel.classList.toggle('field-flow', outcome.fieldCurrent);
    panel.classList.toggle('load-flow', conditions.load && outcome.success);
    panel.classList.toggle('is-paused', !playing);
    panel.style.setProperty(
      '--flow-opacity',
      outcome.success ? '1' : outcome.fieldCurrent ? '0.25' : '0',
    );
    panel.querySelector('.result-badge').textContent = outcome.success
      ? '自励成功'
      : '自励失败';
    panel.querySelector('.result-reason').textContent = outcome.reason;
  }

  document.getElementById('shunt-path').textContent = conditions.load
    ? '并励支路与轻载支路并联；励磁不靠负载回路'
    : '负载已断开；并励支路仍闭合';
  document.getElementById('series-path').textContent = conditions.load
    ? '负载闭合；串励绕组有电流路径'
    : '负载已断开；串励绕组无电流路径';
}

function renderVoltage() {
  for (const mode of ['shunt', 'series']) {
    const level = voltageLevelAt(outcomes[mode], elapsed);
    document.getElementById(`${mode}-voltage`).style.width = `${level * 100}%`;
    document.getElementById(`${mode}-voltage-label`).textContent =
      outcomes[mode].success
        ? level > outcomes[mode].level * 0.88
          ? '已建立'
          : '建立中'
        : level > 0
          ? '仅微弱'
          : '为零';
    panels[mode].style.setProperty(
      '--glow-opacity',
      (0.08 + level * 0.65).toFixed(3),
    );
  }
}

function syncPlayButton() {
  pauseButton.textContent = playing ? '暂停' : '继续';
  pauseButton.setAttribute('aria-pressed', String(!playing));
  for (const panel of Object.values(panels)) {
    panel.classList.toggle('is-paused', !playing);
  }
}

function restart() {
  elapsed = reduceMotion ? 5000 : 0;
  playing = !reduceMotion;
  lastFrame = null;
  renderSwitches();
  renderOutcomes();
  renderVoltage();
  syncPlayButton();
}

for (const button of switches) {
  button.addEventListener('click', () => {
    const key = button.dataset.condition;
    conditions[key] = !conditions[key];
    restart();
  });
}

document.getElementById('replay').addEventListener('click', restart);
document.getElementById('reset').addEventListener('click', () => {
  Object.assign(conditions, defaultConditions);
  restart();
});
pauseButton.addEventListener('click', () => {
  playing = !playing;
  lastFrame = null;
  syncPlayButton();
});

function frame(time) {
  if (playing && !document.hidden && lastFrame !== null) {
    elapsed = Math.min(5000, elapsed + Math.min(time - lastFrame, 80));
    renderVoltage();
  }
  lastFrame = time;
  requestAnimationFrame(frame);
}

restart();
requestAnimationFrame(frame);
