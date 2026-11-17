const lesson = document.querySelector('.three-phase-test');
const tabs = document.querySelectorAll('[data-test-button]');
const play = document.querySelector('#play');
const slider = document.querySelector('#test-voltage');
const status = document.querySelector('#trial-status');
const circuit = document.querySelector('#circuit');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root3 = Math.sqrt(3);
const tests = {
  'no-load': {
    target: 400,
    maximum: 480,
    current: 0.5,
    power: 45,
    input: '低压侧',
    output: '高压侧',
    currentSymbol: 'I₀L',
    criterion: '额定电压',
    intro:
      '<strong>空载试验在低压侧进行</strong> 高压侧开路，在额定频率下将低压侧调至额定线电压。',
    outputConnection: '高压侧开路，仅在 a、b 两线间接高内阻电压表。',
    note: '拖动滑块调节低压侧线电压。高压侧开路端仍有感应电压。',
    voltage: 0,
  },
  'short-circuit': {
    target: 48,
    maximum: 58,
    current: 10,
    power: 360,
    input: '高压侧',
    output: '低压侧',
    currentSymbol: 'I₁L',
    criterion: '额定电流',
    intro:
      '<strong>短路试验在高压侧进行</strong> 低压侧三端短接，在额定频率下从零升压至额定线电流。',
    outputConnection: '低压侧 a、b、c 三端短接，高压侧接三相可调电源。',
    note: '低压侧三端短接后，从 0 V 升压，观察两侧绕组与三相仪表的联动。',
    voltage: 0,
  },
};
let selectedTest;
let rampFrame = null;
let meterReadings;
let diagramDescription;
let wiringDescription;
const isTest = (test) => Object.hasOwn(tests, test);

function meter(type, x, y, label, scan, reading, wiring = '') {
  const [key, readingX, readingY, alignment = 'start'] = reading;
  return `<g class="meter meter-${type} scan-${scan}">
    ${wiring}
    <circle class="meter-face" cx="${x}" cy="${y}" r="24" />
    <text x="${x}" y="${y + 1}">${label}</text>
    <text class="meter-reading" x="${readingX}" y="${readingY}"
      style="text-anchor:${alignment}" data-value="${key}"></text>
  </g>`;
}

function junction(x, y) {
  return `<circle class="junction" cx="${x}" cy="${y}" r="4.5" />`;
}

function voltageMeter(x, symbol, scan, output = false) {
  const readingX = x + (output ? -34 : 34);
  const alignment = output ? 'end' : 'start';
  return meter(
    'voltage',
    x,
    150,
    'V',
    scan,
    [output ? 'outputVoltage' : 'voltage', readingX, 164, alignment],
    `<path d="M${x} 105V195" />
    ${junction(x, 105)}${junction(x, 195)}
    <text class="diagram-note symbol" x="${readingX}" y="140"
      text-anchor="${alignment}">${symbol}</text>`,
  );
}

function powerMeter(y, lead, label, key) {
  return meter(
    'power',
    300,
    y,
    label,
    'third',
    [key, 333, y + (lead < y ? 36 : -36)],
    `<path class="potential-wire" d="M235 ${y}V${lead}H300V${y}
      M300 ${y}V195" />
    ${junction(235, y)}`,
  );
}

const winding =
  'c0-14 20-14 20 0 c0-14 20-14 20 0 c0-14 20-14 20 0 c0-14 20-14 20 0';
function drawWiring(
  { input: inputSide, output: outputSide, currentSymbol },
  shortCircuit,
) {
  const phases = [105, 195, 285];
  const phaseWires = phases.map((y, index) => {
    const input = `M80 ${y}H520 ${winding} H650`;
    const output = `M710 ${y}H745 ${winding} H920`;
    const outputLabel = ['a', 'b', 'c'][index];
    const inputLabel = ['A', 'B', 'C'][index];
    return `<path class="wire" d="${input} ${output}" />
    <path class="current-trace" style="--phase-delay:${(index - 3) * 450}ms"
      d="${input}${shortCircuit ? ` ${output}` : ''}" />
    <text class="phase-label" x="53" y="${y + 7}">${inputLabel}</text>
    <text class="phase-label" x="943" y="${y + 7}">${outputLabel}</text>
    <circle class="wire terminal" cx="80" cy="${y}" r="5" />`;
  });

  return `
  <rect class="${shortCircuit ? 'high-side' : 'low-side'}" x="10" y="12" width="655" height="346" rx="13" />
  <rect class="${shortCircuit ? 'low-side' : 'high-side'}" x="695" y="12" width="263" height="346" rx="13" />
  <text class="side-title" x="527" y="47">${inputSide}绕组</text>
  <text class="side-title" x="825" y="47">${outputSide}绕组</text>
  <path class="wire" d="M650 105V285 M710 105V285" />
  ${phaseWires.join('')}
  <circle class="neutral" cx="650" cy="195" r="5" />
  <circle class="neutral" cx="710" cy="195" r="5" />
  <path class="core" d="M675 88V302 M685 88V302" />
  ${shortCircuit ? '<path class="wire short-link" d="M920 105V285" />' : '<path class="core excitation" d="M675 88V302 M685 88V302" />'}
  ${phases.map((y) => `<circle class="wire ${shortCircuit ? 'short-terminal' : 'terminal'}" cx="920" cy="${y}" r="5" />`).join('')}
  ${voltageMeter(147, 'U₁L', 'first')}
  ${powerMeter(105, 65, 'Wₐ', 'wattsA')}
  ${powerMeter(285, 325, 'Wᴄ', 'wattsC')}
  <circle class="meter-power junction" cx="300" cy="195" r="5" />
  ${phases.map((y) => meter('current', 430, y, 'A', 'second', ['current', 462, y + 34])).join('')}
  ${shortCircuit ? '' : voltageMeter(870, 'U₂L', 'fourth', true)}
  <path class="current-arrow" d="M95 105H124 m-7-6 7 6-7 6" />
  <text class="symbol" x="97" y="90">${currentSymbol}</text>
  <text class="side-title" x="102" y="341">三相电源</text>
  <g class="source-waves" transform="translate(180 334)">
    <path class="source-wave phase-a" d="M0 0q8-21 16 0t16 0" />
    <path class="source-wave phase-b" d="M0 8q6 1 11-8t16 0t5 8" />
    <path class="source-wave phase-c" d="M0 -8q6-1 11 8t16 0t5-8" />
  </g>
  <text class="side-title" x="825" y="341">${shortCircuit ? '三端短接' : '开路 · I₂ ≈ 0'}</text>
`;
}

const numberFormat = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
  useGrouping: false,
});

function showVoltage(voltage) {
  const test = tests[selectedTest];
  const shortCircuit = selectedTest === 'short-circuit';
  test.voltage = voltage;
  slider.value = voltage;
  const fraction = voltage / test.target;
  const ratedActive = test.power / (root3 * test.target);
  const ratedReactive = Math.sqrt(test.current ** 2 - ratedActive ** 2);
  const active = ratedActive * fraction;
  const reactive =
    ratedReactive * fraction * (shortCircuit ? 1 : 0.7 + 0.3 * fraction ** 6);
  const current = Math.hypot(active, reactive);
  const power = root3 * voltage * active;
  // In ABC phase order with lagging current, Wₐ is the smaller reading.
  const difference = voltage * reactive;
  const formatWatts = (reading) =>
    `${numberFormat.format(reading).replace('-', '−')} W`;
  const values = {
    voltage: `${voltage} V`,
    current: `${current.toFixed(current > 0 && current < 0.1 ? 3 : 2)} A`,
    outputVoltage: `${2 * voltage} V`,
    wattsA: formatWatts((power - difference) / 2),
    wattsC: formatWatts((power + difference) / 2),
  };
  for (const reading of meterReadings) {
    reading.textContent = values[reading.dataset.value];
  }
  diagramDescription.textContent = `${wiringDescription}
    输入线电压 ${values.voltage}，三线各 ${values.current}，功率表 Wₐ 为 ${values.wattsA}，Wᴄ 为 ${values.wattsC}。${shortCircuit ? '' : `输出线电压 ${values.outputVoltage}。`}`;

  const state =
    voltage < test.target ? 'below' : voltage > test.target ? 'above' : 'rated';
  const label =
    state === 'rated'
      ? '可读数'
      : `${state === 'below' ? '未到' : '超出'}${test.criterion}`;
  if (status.textContent !== label) status.textContent = label;
  lesson.dataset.voltageState = state;
  lesson.dataset.energized = voltage > 0;
  lesson.dataset.step = state === 'rated' ? '1' : '0';
  lesson.style.setProperty('--voltage-fraction', fraction);
  lesson.style.setProperty(
    '--current-fraction',
    Math.min(current / test.current, 1.25),
  );
  slider.setAttribute(
    'aria-valuetext',
    `${values.voltage}，${values.current}，${label}`,
  );
}

function stopRamp() {
  if (rampFrame !== null) cancelAnimationFrame(rampFrame);
  rampFrame = null;
  play.textContent =
    tests[selectedTest].voltage === tests[selectedTest].target
      ? '重播升压'
      : '播放升压';
}

function showTest(test) {
  if (!isTest(test) || selectedTest === test) return;
  selectedTest = test;
  stopRamp();
  const mode = tests[test];
  lesson.dataset.test = test;
  document.querySelector('#lesson-intro').innerHTML = mode.intro;
  document.querySelector('#voltage-label').textContent = `${mode.input}加压`;
  document.querySelector('#rated-voltage').textContent =
    `${mode.target} V · ${mode.criterion}`;
  document.querySelector('#maximum-voltage').textContent = `${mode.maximum} V`;
  document.querySelector('#step-note').textContent = mode.note;
  slider.max = mode.maximum;
  lesson.style.setProperty(
    '--target-position',
    `${(mode.target / mode.maximum) * 100}%`,
  );
  for (const tab of tabs) {
    tab.setAttribute('aria-pressed', String(tab.dataset.testButton === test));
  }
  document.querySelector('#output-connection').textContent =
    mode.outputConnection;
  wiringDescription = `${mode.input}接三相三线电源，三线各串联一只电流表。两只功率表的电流线圈分别串入 A、C 线，电压线圈分别跨接 A、B 和 C、B。图中两侧绕组以星形联结为例。${mode.outputConnection}`;
  circuit.innerHTML = `<desc id="circuit-desc"></desc><g class="three-phase-wiring">${drawWiring(mode, test === 'short-circuit')}</g>`;
  meterReadings = circuit.querySelectorAll('.meter-reading');
  diagramDescription = circuit.querySelector('#circuit-desc');
  showVoltage(mode.voltage);
}

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    const test = tab.dataset.testButton;
    if (test === selectedTest) return;
    showTest(test);
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: 'transformer-phase-test-select', test },
        location.origin,
      );
    } else {
      const url = new URL(location.href);
      url.searchParams.set('test', test);
      history.replaceState(null, '', url);
    }
  });
}

window.addEventListener('message', (event) => {
  if (
    event.origin === location.origin &&
    event.source === window.parent &&
    event.data?.type === 'transformer-phase-test'
  )
    showTest(event.data.test);
});

slider.addEventListener('input', () => {
  showVoltage(slider.valueAsNumber);
  stopRamp();
});

play.addEventListener('click', () => {
  if (rampFrame !== null) {
    stopRamp();
    return;
  }
  const { target, voltage } = tests[selectedTest];
  const initial = voltage >= target ? 0 : voltage;
  showVoltage(initial);
  if (reducedMotion.matches) {
    showVoltage(target);
    stopRamp();
    return;
  }
  play.textContent = '暂停升压';
  const start = performance.now();
  const ramp = (time) => {
    const fraction = Math.max(0, Math.min((time - start) / 3800, 1));
    const nextVoltage = Math.round(initial + (target - initial) * fraction);
    if (nextVoltage !== tests[selectedTest].voltage) showVoltage(nextVoltage);
    if (fraction < 1) rampFrame = requestAnimationFrame(ramp);
    else stopRamp();
  };
  rampFrame = requestAnimationFrame(ramp);
});

const initialTest = new URLSearchParams(location.search).get('test');
showTest(isTest(initialTest) ? initialTest : 'no-load');
