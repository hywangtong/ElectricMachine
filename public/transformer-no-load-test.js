const lesson = document.querySelector('.no-load');
const steps = [...document.querySelectorAll('[data-step-button]')];
const playButton = document.querySelector('#play');
const stepNote = document.querySelector('#step-note');
const circuitHeading = document.querySelector('#circuit-heading');
const circuitCaption = document.querySelector('#circuit-caption');
const diagramDesc = document.querySelector('#diagram-desc');
const wiringDesc = diagramDesc.textContent.trim();
const equivalentDesc =
  '保留试验接线的四只仪表。T 形电路左臂为 R₁ 和 jX₁，右臂为 R₂′ 和 jX₂′，中间支路为串联的 R₀ 和 jX₀。右端经变比 1:k 的理想变压器还原实际高压端，电压表仍读 U₂。';
const notes = [
  '在低压侧接电源和测量仪表。高压侧虽开路，端子间仍有感应电压。',
  '保持仪表接法：低压侧读取 U₁、I₀、P₀，高压侧电压表仍读取实际端电压 U₂。',
  '二次侧近似无电流，I₀ 流过励磁支路。忽略一次绕组的空载压降与铜耗后，由读数求励磁参数。',
  '折算至高压侧，电压乘 k，电流除以 k，因此由电压与电流之比得到的阻抗乘 k²。',
];

const primaryVoltage = 220;
const secondaryVoltage = 440;
const current = 0.5;
const power = 22;
const impedance = primaryVoltage / current;
const resistance = power / current ** 2;
const reactance = Math.sqrt(impedance ** 2 - resistance ** 2);
const ratio = secondaryVoltage / primaryVoltage;
const factor = ratio ** 2;
const values = {
  primaryVoltage: `${primaryVoltage} V`,
  secondaryVoltage: `${secondaryVoltage} V`,
  current: `${current.toFixed(2)} A`,
  power: `${power} W`,
  impedance: `${impedance} Ω`,
  resistance: `${resistance} Ω`,
  reactance: `${reactance.toFixed(1)} Ω`,
  ratio,
  factor,
  referredImpedance: `${impedance * factor} Ω`,
  referredResistance: `${resistance * factor} Ω`,
  referredReactance: `${(reactance * factor).toFixed(1)} Ω`,
};

for (const output of document.querySelectorAll('[data-value]')) {
  output.textContent = values[output.dataset.value];
}

let step = 0;
let timer = null;

function showStep(index) {
  step = index;
  lesson.dataset.step = index;
  stepNote.textContent = notes[index];
  const isWiring = index === 0;
  const isReferral = index === steps.length - 1;
  circuitHeading.textContent = isWiring
    ? '单相变压器试验接线'
    : isReferral
      ? '励磁参数折算'
      : '空载试验的 T 形等效电路';
  circuitCaption.textContent = isWiring ? '高压侧仅接电压表' : '额定工况示例';
  diagramDesc.textContent = isWiring ? wiringDesc : equivalentDesc;
  for (const [position, button] of steps.entries()) {
    if (position === index) button.setAttribute('aria-current', 'step');
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
  }, 5500);
});
