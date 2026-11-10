const lesson = document.querySelector('.lesson');
const buttons = [...document.querySelectorAll('.stages button')];
const steps = document.querySelectorAll('.step');
const winding = document.querySelector('.art');
const phasors = document.querySelector('.phasor-art');
const diagramLabel = document.getElementById('diagram-label');
const caption = document.getElementById('diagram-caption');
const count = document.getElementById('step-count');
const next = document.getElementById('next-step');
const replay = document.getElementById('replay');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let active = 0;

function selectStep(index) {
  active = index;
  const showPower = index === steps.length - 1;
  lesson.dataset.step = String(index + 1);
  buttons.forEach((button, position) => {
    button.setAttribute('aria-pressed', String(position === index));
    steps[position].hidden = position !== index;
  });
  winding.toggleAttribute('hidden', showPower);
  phasors.toggleAttribute('hidden', !showPower);
  diagramLabel.textContent = showPower
    ? '同一变比 · 对比折算前后的电压和电流矢量'
    : '用同一铁芯，对比折算前后的二次绕组';
  caption.children[0].textContent = showPower
    ? '蓝色为电压，青绿为电流。折算前后同一物理量使用相同标尺。'
    : '青绿色对应二次绕组；蓝色环线标示磁动势的参考方向。';
  caption.children[1].textContent = showPower
    ? '电流始终滞后电压 φ ≈ 36.9°，功率因数 cos φ = 0.8。'
    : '绕组匝数与磁路均为示意。';
  count.textContent = `第 ${index + 1} 步 / 共 ${steps.length} 步`;
  next.textContent = showPower ? '回到第一步 ↺' : '下一步 →';
  delete lesson.dataset.phasorsPaused;
  updatePlayback();
}

function updatePlayback() {
  replay.disabled = reducedMotion.matches || active === 2;
  replay.textContent =
    active === steps.length - 1
      ? lesson.hasAttribute('data-phasors-paused')
        ? '继续矢量动画'
        : '暂停矢量动画'
      : '重播图示';
}

buttons.forEach((button, index) => {
  button.addEventListener('click', () => selectStep(index));
});
next.addEventListener('click', () => selectStep((active + 1) % steps.length));
replay.addEventListener('click', () => {
  if (active === steps.length - 1) {
    lesson.toggleAttribute('data-phasors-paused');
    updatePlayback();
    return;
  }
  for (const animation of winding.getAnimations({ subtree: true })) {
    animation.currentTime = 0;
    animation.play();
  }
});
reducedMotion.addEventListener('change', updatePlayback);
updatePlayback();
