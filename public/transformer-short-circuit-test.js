const lesson = document.querySelector('.short-circuit');
const steps = [...document.querySelectorAll('[data-step-button]')];
const stages = [...document.querySelectorAll('[data-stage]')];
const playButton = document.querySelector('#play');
const stepNote = document.querySelector('#step-note');
const circuitHeading = document.querySelector('#circuit-heading');
const circuitCaption = document.querySelector('#circuit-caption');
const diagramDesc = document.querySelector('#diagram-desc');
const wiringHeading = circuitHeading.textContent;
const wiringCaption = circuitCaption.textContent;
const wiringDesc = diagramDesc.textContent.trim();
const equivalentDesc =
  'T 形等效电路统一折算到一次侧（高压侧）。左臂为 R₁ 和 jX₁，右臂为 R₂′ 和 jX₂′，中间支路为串联的 R₀ 和 jX₀，折算后的输出端直接短接。';
const notes = [
  stepNote.textContent.trim(),
  '试验电压低，励磁电流很小。折算至高压侧，短路电阻 Rₛ ≈ R₁ + R₂′，短路电抗 Xₛ ≈ X₁ + X₂′。',
  '阻抗电压回答的是：低压侧短接时，高压侧加到额定电压的百分之几，才能让绕组流过额定电流？',
  '温度折算统一电阻的参考温度。侧别折算统一阻抗的电压等级。',
];

let step = 0;
let timer = null;

function showStep(index) {
  step = index;
  lesson.dataset.step = index;
  stepNote.textContent = notes[index];
  const showEquivalent = index === 1 || index === 2;
  circuitHeading.textContent = showEquivalent
    ? '短路试验的 T 形等效电路'
    : wiringHeading;
  circuitCaption.textContent = showEquivalent
    ? '折算至一次侧（高压侧）'
    : wiringCaption;
  diagramDesc.textContent = showEquivalent ? equivalentDesc : wiringDesc;

  for (const [position, button] of steps.entries()) {
    const active = position === index;
    stages[position].hidden = !active;
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}

function stopPlayback() {
  clearInterval(timer);
  timer = null;
  playButton.textContent = step === steps.length - 1 ? '重新播放' : '播放演示';
}

for (const [index, button] of steps.entries()) {
  button.addEventListener('click', () => {
    showStep(index);
    stopPlayback();
  });
}

playButton.addEventListener('click', () => {
  if (timer !== null) {
    stopPlayback();
    return;
  }

  if (step === steps.length - 1) showStep(0);
  playButton.textContent = '暂停演示';
  timer = setInterval(() => {
    showStep(step + 1);
    if (step === steps.length - 1) stopPlayback();
  }, 9000);
});
