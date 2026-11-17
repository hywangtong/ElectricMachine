const lesson = document.querySelector('.no-load');
const steps = [...document.querySelectorAll('[data-step-button]')];
const playButton = document.querySelector('#play');
const stepNote = document.querySelector('#step-note');
const voltageSlider = document.querySelector('#test-voltage');
const voltageStatus = document.querySelector('#voltage-status');
const outputs = document.querySelectorAll('[data-value]');
const circuitHeading = document.querySelector('#circuit-heading');
const circuitCaption = document.querySelector('#circuit-caption');
const diagramDesc = document.querySelector('#diagram-desc');
const wiringDesc = diagramDesc.textContent.trim();
const equivalentDesc =
  'T 形等效电路统一折算到一次侧（低压侧）。左臂为 R₁ 和 jX₁，右臂为 R₂′ 和 jX₂′，中间支路为串联的 R₀ 和 jX₀，折算后的输出端开路。';
const notes = [
  '拖动滑块调节模拟电压。加压后，高压侧开路端子间会出现感应电压。',
  '低压侧读取 U₁、I₀、P₀，高压侧读取 U₂。模拟仪表在调压过程中也显示当前值。',
  '忽略低压绕组的空载压降与铜耗，按当前模拟读数计算励磁参数。',
  '按当前工况折算。电压乘 k、电流除以 k，阻抗乘 k²。',
];

const ratedVoltage = 220;
const turnsRatio = 2;
const stepDuration = 5500;
const rampDuration = 3800;
const voltageLabels = {
  below: '未到额定电压',
  rated: '可读数',
  above: '超出额定电压',
};
const numberFormat = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 1,
  useGrouping: false,
});

function formatReading(value, unit = '') {
  return Number.isFinite(value) ? `${numberFormat.format(value)}${unit}` : '—';
}

function showVoltage(primaryVoltage) {
  voltageSlider.value = primaryVoltage;
  const perUnit = primaryVoltage / ratedVoltage;
  const secondaryVoltage = turnsRatio * primaryVoltage;
  // Teaching approximation anchored to 220 V, 0.50 A and 22 W. The
  // magnetizing component rises faster near and above rated voltage.
  const activeCurrent = 0.1 * perUnit;
  const magnetizingCurrent =
    Math.sqrt(0.24) * perUnit * (0.7 + 0.3 * perUnit ** 6);
  const current = Math.hypot(activeCurrent, magnetizingCurrent);
  const power = primaryVoltage * activeCurrent;
  const impedance = primaryVoltage / current;
  const resistance = power / current ** 2;
  const reactance = Math.sqrt(impedance ** 2 - resistance ** 2);
  const ratio = secondaryVoltage / primaryVoltage;
  const factor = ratio ** 2;

  const values = {
    primaryVoltage: `${primaryVoltage} V`,
    secondaryVoltage: `${secondaryVoltage} V`,
    current: `${current.toFixed(current > 0 && current < 0.1 ? 3 : 2)} A`,
    power:
      power > 0 && power < 0.1
        ? `${Number(power.toPrecision(2))} W`
        : formatReading(power, ' W'),
    impedance: formatReading(impedance, ' Ω'),
    resistance: formatReading(resistance, ' Ω'),
    reactance: formatReading(reactance, ' Ω'),
    ratio: formatReading(ratio),
    factor: formatReading(factor),
    referredImpedance: formatReading(impedance * factor, ' Ω'),
    referredResistance: formatReading(resistance * factor, ' Ω'),
    referredReactance: formatReading(reactance * factor, ' Ω'),
  };

  for (const output of outputs) {
    output.textContent = values[output.dataset.value];
  }

  const state = perUnit < 1 ? 'below' : perUnit > 1 ? 'above' : 'rated';
  if (lesson.dataset.voltageState !== state) {
    lesson.dataset.voltageState = state;
    voltageStatus.textContent = voltageLabels[state];
  }
  lesson.style.setProperty('--voltage-fraction', perUnit);
  lesson.style.setProperty('--current-fraction', current / 0.5);
  lesson.dataset.energized = primaryVoltage > 0;
  voltageSlider.setAttribute(
    'aria-valuetext',
    `${values.primaryVoltage}，${voltageLabels[state]}`,
  );
}

let step = 0;
let timer = null;
let rampFrame = null;

function showStep(index) {
  step = index;
  lesson.dataset.step = index;
  stepNote.textContent = notes[index];
  const isReferral = index === steps.length - 1;
  const isWiring = index === 0 || isReferral;
  circuitHeading.textContent = isReferral
    ? '试验接线与励磁参数折算'
    : isWiring
      ? '单相变压器试验接线'
      : '空载试验的 T 形等效电路';
  circuitCaption.textContent = isReferral
    ? '当前模拟工况'
    : isWiring
      ? '高压侧仅接电压表'
      : '折算至一次侧（低压侧）';
  diagramDesc.textContent = isWiring ? wiringDesc : equivalentDesc;
  for (const [position, button] of steps.entries()) {
    if (position === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}

function stopPlayback() {
  clearInterval(timer);
  cancelAnimationFrame(rampFrame);
  timer = null;
  rampFrame = null;
  playButton.textContent = step === steps.length - 1 ? '重新播放' : '播放演示';
}

for (const [index, button] of steps.entries()) {
  button.addEventListener('click', () => {
    showStep(index);
    stopPlayback();
  });
}

voltageSlider.addEventListener('input', () => {
  stopPlayback();
  showVoltage(voltageSlider.valueAsNumber);
});

playButton.addEventListener('click', () => {
  if (timer !== null) {
    stopPlayback();
    return;
  }
  if (step === steps.length - 1) showStep(0);
  if (step === 0 && voltageSlider.valueAsNumber !== ratedVoltage) {
    const initialVoltage = voltageSlider.valueAsNumber;
    const start = performance.now();
    const ramp = (now) => {
      const progress = Math.min((now - start) / rampDuration, 1);
      const voltage = Math.round(
        initialVoltage + (ratedVoltage - initialVoltage) * progress,
      );
      if (voltage !== voltageSlider.valueAsNumber) showVoltage(voltage);
      rampFrame = progress < 1 ? requestAnimationFrame(ramp) : null;
    };
    rampFrame = requestAnimationFrame(ramp);
  }
  playButton.textContent = '暂停演示';
  timer = setInterval(() => {
    if (step === 0) {
      cancelAnimationFrame(rampFrame);
      rampFrame = null;
      showVoltage(ratedVoltage);
    }
    showStep(step + 1);
    if (step === steps.length - 1) stopPlayback();
  }, stepDuration);
});

showVoltage(voltageSlider.valueAsNumber);
