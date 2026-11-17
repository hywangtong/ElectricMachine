const lesson = document.querySelector('.short-circuit');
const steps = [...document.querySelectorAll('[data-step-button]')];
const stages = [...document.querySelectorAll('[data-stage]')];
const playButton = document.querySelector('#play');
const voltageSlider = document.querySelector('#test-voltage');
const currentStatus = document.querySelector('#current-status');
const impedanceVoltageNote = document.querySelector('#impedance-voltage-note');
const outputs = document.querySelectorAll('[data-value]');
const stepNote = document.querySelector('#step-note');
const circuitHeading = document.querySelector('#circuit-heading');
const circuitCaption = document.querySelector('#circuit-caption');
const diagramDesc = document.querySelector('#diagram-desc');
const wiringHeading = circuitHeading.textContent;
const wiringCaption = circuitCaption.textContent;
const wiringDesc = diagramDesc.textContent.trim();
const equivalentDesc =
  '单相简化等效电路折算到高压侧，省略励磁支路。两侧绕组的阻抗合并为串联的 Rₛ 和 jXₛ，折算后的输出端直接短接。';
const notes = [
  stepNote.textContent.trim(),
  '试验电压低，励磁电流很小。折算至高压侧，短路电阻 Rₛ ≈ R₁ + R₂′，短路电抗 Xₛ ≈ X₁ + X₂′。',
  '阻抗电压回答的是：低压侧短接时，高压侧加到额定电压的百分之几，才能让绕组流过额定电流？',
  '温度折算统一电阻的参考温度。侧别折算统一阻抗的电压等级。',
];

const ratedVoltage = 500;
const ratedCurrent = 5;
const turnsRatio = 2;
// Constant series impedance at the example's measurement temperature (25 °C).
const modelResistance = 4.8;
const modelReactance = 6.4;
const modelImpedance = Math.hypot(modelResistance, modelReactance);
const ratedTestVoltage = ratedCurrent * modelImpedance;
const copperCorrection = (234.5 + 75) / (234.5 + 25);
const numberFormat = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 3,
  useGrouping: false,
});
const statusLabels = {
  below: '未到额定电流',
  rated: '可读数',
  above: '超出额定电流',
};

function formatReading(value, unit) {
  return Number.isFinite(value) ? `${numberFormat.format(value)}${unit}` : '—';
}

function showVoltage(voltage) {
  voltageSlider.value = voltage;
  const current = voltage / modelImpedance;
  const power = current ** 2 * modelResistance;
  const impedance = voltage / current;
  const resistance = power / current ** 2;
  const reactance = Math.sqrt(impedance ** 2 - resistance ** 2);
  const warmResistance = resistance * copperCorrection;
  const voltagePercent = (voltage / ratedVoltage) * 100;
  const factor = turnsRatio ** 2;
  const values = {
    voltage: formatReading(voltage, ' V'),
    current: formatReading(current, ' A'),
    power: formatReading(power, ' W'),
    impedance: formatReading(impedance, ' Ω'),
    resistance: formatReading(resistance, ' Ω'),
    reactance: formatReading(reactance, ' Ω'),
    voltagePercent: formatReading(voltagePercent, '%'),
    warmResistance: formatReading(warmResistance, ' Ω'),
    warmImpedance: formatReading(Math.hypot(warmResistance, reactance), ' Ω'),
    warmPower: formatReading(power * copperCorrection, ' W'),
    referredVoltage: formatReading(voltage / turnsRatio, ' V'),
    referredCurrent: formatReading(current * turnsRatio, ' A'),
    referredImpedance: formatReading(impedance / factor, ' Ω'),
    referredResistance: formatReading(resistance / factor, ' Ω'),
    referredReactance: formatReading(reactance / factor, ' Ω'),
  };
  for (const output of outputs) {
    output.textContent = values[output.dataset.value];
  }

  const state =
    current < ratedCurrent
      ? 'below'
      : current > ratedCurrent
        ? 'above'
        : 'rated';
  if (lesson.dataset.currentState !== state) {
    lesson.dataset.currentState = state;
    currentStatus.textContent = statusLabels[state];
    impedanceVoltageNote.textContent =
      state === 'rated'
        ? '此时可读出阻抗电压百分数。'
        : '达到额定电流时才可直接读出阻抗电压。';
  }
  lesson.dataset.energized = voltage > 0;
  lesson.style.setProperty('--current-fraction', current / ratedCurrent);
  voltageSlider.setAttribute(
    'aria-valuetext',
    `${values.voltage}，${values.current}，${statusLabels[state]}`,
  );
}

let step = 0;
let timer = null;
let rampFrame = null;

function showStep(index) {
  step = index;
  lesson.dataset.step = index;
  stepNote.textContent = notes[index];
  const showEquivalent = index === 1 || index === 2;
  circuitHeading.textContent = showEquivalent
    ? '短路试验的简化等效电路'
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

  if (step === steps.length - 1) {
    showStep(0);
    showVoltage(0);
  }
  if (step === 0 && voltageSlider.valueAsNumber !== ratedTestVoltage) {
    const initialVoltage = voltageSlider.valueAsNumber;
    const start = performance.now();
    const ramp = (now) => {
      const progress = Math.min((now - start) / 3800, 1);
      const voltage = Math.round(
        initialVoltage + (ratedTestVoltage - initialVoltage) * progress,
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
      showVoltage(ratedTestVoltage);
    }
    showStep(step + 1);
    if (step === steps.length - 1) stopPlayback();
  }, 9000);
});

showVoltage(voltageSlider.valueAsNumber);
