const shortCircuit =
  new URLSearchParams(location.search).get('test') === 'short-circuit';
const lesson = document.querySelector('.three-phase-test');
const buttons = [...document.querySelectorAll('[data-step-button]')];
const play = document.querySelector('#play');
const circuit = document.querySelector('#circuit');
const measurements = document.querySelector('#measurements');
const stageHeading = document.querySelector('#stage-heading');
const stageContent = document.querySelector('#stage-content');
const note = document.querySelector('#step-note');

const title = shortCircuit ? '短路试验' : '空载试验';
const inputSide = shortCircuit ? '高压侧' : '低压侧';
const outputSide = shortCircuit ? '低压侧' : '高压侧';
const voltage = shortCircuit ? 48 : 400;
const ratedVoltage = shortCircuit ? 800 : 400;
const current = shortCircuit ? 10 : 0.5;
const power = shortCircuit ? 360 : 45;
const outputVoltage = 800;
const phaseVoltage = voltage / Math.sqrt(3);
const impedance = phaseVoltage / current;
const resistance = power / (3 * current ** 2);
const reactance = Math.sqrt(impedance ** 2 - resistance ** 2);
// For ABC phase order and lagging current, Wₐ = U_L I_L cos(30° + φ).
const apparentPower = Math.sqrt(3) * voltage * current;
const difference = Math.sqrt(apparentPower ** 2 - power ** 2) / Math.sqrt(3);
const wattsA = ((power - difference) / 2).toFixed(1).replace('-', '−');
const wattsC = ((power + difference) / 2).toFixed(1);
const voltageSymbol = shortCircuit ? 'Uₛ' : 'U₁L';
const currentSymbol = shortCircuit ? 'I₁N' : 'I₀L';
const energizeLabel = shortCircuit ? '升至额定电流' : '施加额定电压';

document.title = `三相变压器的${title}`;
document.querySelector('#lesson-title').textContent = document.title;
document.querySelector('#lesson-intro').textContent = shortCircuit
  ? '低压侧三端短接，高压侧接额定频率的三相可调电源。'
  : '低压侧接额定频率、额定线电压的三相电源，高压侧开路。';
document.querySelector('#energize').textContent = `2　${energizeLabel}`;

function meter(type, x, y, label, scan, wiring = '', extra = '') {
  return `<g class="meter meter-${type} scan-${scan} ${extra}">
    ${wiring}
    <circle class="meter-dial" cx="${x}" cy="${y}" r="24" />
    <text x="${x}" y="${y + 1}">${label}</text>
  </g>`;
}

function junction(x, y) {
  return `<circle class="junction" cx="${x}" cy="${y}" r="4.5" />`;
}

function voltageMeter(x, symbol, scan, extra) {
  return meter(
    'voltage',
    x,
    150,
    'V',
    scan,
    `<path d="M${x} 105V195" />
    ${junction(x, 105)}${junction(x, 195)}
    <text class="diagram-note symbol" x="${x + 36}" y="157">${symbol}</text>`,
    extra,
  );
}

function powerMeter(y, lead, label) {
  return meter(
    'power',
    300,
    y,
    label,
    'third',
    `<path class="potential-wire" d="M235 ${y}V${lead}H300V${y}
      M300 ${y}V195" />
    ${junction(235, y)}`,
  );
}

const winding =
  'c0-14 20-14 20 0 c0-14 20-14 20 0 c0-14 20-14 20 0 c0-14 20-14 20 0';
const phases = [105, 195, 285];
const phaseWires = phases.map((y, index) => {
  const input = `M80 ${y}H520 ${winding} H650`;
  const output = `M710 ${y}H745 ${winding} H920`;
  const outputLabel = ['a', 'b', 'c'][index];
  const inputLabel = ['A', 'B', 'C'][index];
  return `<path class="wire" d="${input} ${output}" />
    <path class="current-trace" style="--phase-delay:${index * 500}ms"
      d="${input}${shortCircuit ? ` ${output}` : ''}" />
    <text class="phase-label" x="53" y="${y + 7}">${inputLabel}</text>
    <text class="phase-label" x="943" y="${y + 7}">${outputLabel}</text>
    <circle class="wire terminal" cx="80" cy="${y}" r="5" />`;
});

circuit.innerHTML = `
  <desc id="circuit-desc">
    ${inputSide}接三相三线电源，电压表跨接 A、B 两线，三条线各串联一只电流表。
    两只功率表的电流线圈分别串入 A、C 线，电压线圈分别跨接 A、B 和 C、B。
    两侧绕组均为星形联结。${shortCircuit ? '低压侧 a、b、c 三个线端短接。' : '高压侧开路，仅在 a、b 两端跨接高内阻电压表。'}
  </desc>
  <rect class="low-side" x="10" y="12" width="655" height="346" rx="13" />
  <rect class="high-side" x="695" y="12" width="263" height="346" rx="13" />
  <text class="side-title" x="527" y="47">${inputSide}绕组</text>
  <text class="side-title" x="825" y="47">${outputSide}绕组</text>
  <path class="wire" d="M650 105V285 M710 105V285" />
  ${phaseWires.join('')}
  <circle class="neutral" cx="650" cy="195" r="5" />
  <circle class="neutral" cx="710" cy="195" r="5" />
  ${shortCircuit ? '<path class="wire short-link" d="M920 105V285" />' : ''}
  ${phases.map((y) => `<circle class="wire ${shortCircuit ? 'short-terminal' : 'terminal'}" cx="920" cy="${y}" r="5" />`).join('')}
  ${voltageMeter(147, voltageSymbol, 'first', '')}
  ${powerMeter(105, 65, 'Wₐ')}
  ${powerMeter(285, 325, 'W𝚌')}
  <circle class="meter-power junction" cx="300" cy="195" r="5" />
  ${phases.map((y) => meter('current', 410, y, 'A', 'second')).join('')}
  ${shortCircuit ? '' : voltageMeter(870, 'U₂L', 'fourth', 'output-voltage')}
  <path class="current-arrow" d="M95 105H124 m-7-6 7 6-7 6" />
  <text class="symbol" x="97" y="90">${currentSymbol}</text>
  <text class="side-title" x="148" y="341">三相电源</text>
  <text class="side-title" x="825" y="341">${shortCircuit ? '三端短接' : '开路 · I₂ ≈ 0'}</text>
`;

const readings = [
  ['voltage', 'first', '输入线电压', `${voltageSymbol} = ${voltage} V`],
  [
    'current',
    'second',
    '三线电流（各相）',
    `${currentSymbol} = ${current.toFixed(2)} A`,
  ],
  ['power', 'third', '功率表 Wₐ ／ W𝚌', `${wattsA} W / ${wattsC} W`],
];
if (!shortCircuit) {
  readings.push([
    'voltage',
    'fourth',
    '输出线电压',
    `U₂L = ${outputVoltage} V`,
  ]);
}

function showReadings(visible) {
  measurements.innerHTML = readings
    .map(
      ([type, scan, label, value]) => `<div class="meter-${type} scan-${scan}">
        <dt>${label}</dt><dd>${visible ? value : '—'}</dd>
      </div>`,
    )
    .join('');
}

const stages = [
  {
    heading: '接线',
    cards: [
      ['电压表 V', '跨接 A、B 两线，测线电压'],
      ['电流表 A', '三条线各串联一只，测线电流'],
      [
        '功率表 Wₐ、W𝚌',
        '电流线圈串入 A、C 线，虚线为电压线圈接线，两表共用 B 线',
      ],
    ],
    note: shortCircuit
      ? '确认低压侧三个线端已短接，再从高压侧施加试验电压。'
      : '高压侧仅跨接高内阻电压表。两侧星点各自独立，均未引出。',
  },
  {
    heading: energizeLabel,
    cards: [
      [
        '输入线电压',
        `<output id="voltage-value"></output>
        <progress id="voltage-progress" max="${ratedVoltage}" value="0" aria-label="输入线电压占额定值的比例"></progress>`,
      ],
      ['输入线电流', '<output id="current-value"></output>'],
      shortCircuit
        ? ['本例升压终点', 'I₁L = I₁N，记下此时的 Uₛ']
        : ['高压侧感应电压', 'U₂L = 800 V，负载电流近似为零'],
    ],
    note: shortCircuit
      ? '随高压侧线电压上升，两侧绕组均流过电流。输入线电流达到额定值时停止升压。'
      : '三相绕组依次高亮，示意三相励磁电流的相位差。高压侧开路时仍有感应电压。',
  },
  {
    heading: '读取仪表',
    cards: [
      [
        '线电压换算为相电压',
        `Uφ = ${voltageSymbol} / √3 = ${phaseVoltage.toFixed(1)} V`,
      ],
      ['线电流等于相电流', `Iφ = ${current.toFixed(2)} A`],
      ['两表读数取代数和', `P = ${wattsA} + (${wattsC}) = ${power} W`],
    ],
    note: '在本例的平衡工况下，三只电流表读数相同。两瓦特表法求三相总功率时保留负读数的符号。',
  },
  {
    heading: shortCircuit ? '每相短路参数' : '每相励磁参数（串联形式）',
    cards: [
      ['阻抗模 |Z| = Uφ / Iφ', `${impedance.toFixed(2)} Ω`],
      ['电阻 R = P / (3Iφ²)', `${resistance.toFixed(2)} Ω`],
      ['电抗 X = √(|Z|² − R²)', `${reactance.toFixed(2)} Ω`],
      shortCircuit
        ? [
            '阻抗电压 Uₛ / U₁N',
            `${((voltage / ratedVoltage) * 100).toFixed(1)}%`,
          ]
        : ['铁耗 PFe ≈ P₀', `${power} W（三相合计）`],
    ],
    note: shortCircuit
      ? '参数以高压侧为基准。忽略低试验电压下的铁耗，额定电流时测得的三相短路功率近似为额定铜耗。'
      : '参数以低压侧为基准。忽略空载时低压绕组的压降与铜耗，由相电压、相电流和每相功率求励磁参数。',
  },
];

let step = 0;
let timer = null;
let rampFrame = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function animateVoltage() {
  const volts = document.querySelector('#voltage-value');
  const amps = document.querySelector('#current-value');
  const progress = document.querySelector('#voltage-progress');
  const duration = shortCircuit && !reducedMotion.matches ? 2400 : 0;
  const start = performance.now();

  function update(time) {
    const fraction = duration ? Math.min((time - start) / duration, 1) : 1;
    const applied = voltage * fraction;
    volts.value = `${applied.toFixed(shortCircuit ? 1 : 0)} V`;
    amps.value = `${(current * fraction).toFixed(2)} A`;
    progress.value = applied;
    rampFrame = fraction < 1 ? requestAnimationFrame(update) : null;
  }

  update(start);
}

function showStep(index) {
  if (rampFrame !== null) cancelAnimationFrame(rampFrame);
  rampFrame = null;
  step = index;
  lesson.dataset.step = index;
  const { heading, cards, note: instruction } = stages[index];
  stageHeading.textContent = heading;
  stageContent.innerHTML = `<dl class="stage-cards">${cards
    .map(
      ([label, value]) =>
        `<div class="stage-card"><dt>${label}</dt><dd>${value}</dd></div>`,
    )
    .join('')}</dl>`;
  note.textContent = instruction;
  showReadings(index >= 2);
  if (index === 1) animateVoltage();
  for (const [position, button] of buttons.entries()) {
    if (position === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}

function stopPlayback() {
  clearInterval(timer);
  timer = null;
  play.textContent = step === stages.length - 1 ? '重新播放' : '播放演示';
}

for (const [index, button] of buttons.entries()) {
  button.addEventListener('click', () => {
    if (index !== step) showStep(index);
    stopPlayback();
  });
}

play.addEventListener('click', () => {
  if (timer !== null) {
    stopPlayback();
    return;
  }
  if (step === stages.length - 1) showStep(0);
  play.textContent = '暂停演示';
  timer = setInterval(() => {
    showStep(step + 1);
    if (step === stages.length - 1) stopPlayback();
  }, 5500);
});

showStep(0);
