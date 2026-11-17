const curveImpedance = { resistance: 0.025, reactance: 0.075 };
const schematicImpedance = { resistance: 0.125, reactance: 0.375 };

function voltagePhasors(
  current,
  degrees,
  { resistance, reactance } = curveImpedance,
) {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const resistor = [current * resistance * cos, current * resistance * sin];
  const inductor = [-current * reactance * sin, current * reactance * cos];
  const transverse = resistor[1] + inductor[1];
  // U₂ lies on the real axis. The sum of U₂ and both drops has unit magnitude.
  const source = [Math.sqrt(1 - transverse ** 2), transverse];
  const terminal = source[0] - resistor[0] - inductor[0];
  return { terminal, resistor, source, cos, sin };
}

const maxCurrent = 1.25;
const chartX = (current) => 100 + 560 * current;
const chartY = (voltage) => 230 + 1520 * (1 - voltage);

function characteristicPath(degrees) {
  const points = [];
  const samples = 50;
  for (let index = 0; index <= samples; index += 1) {
    const current = (index / samples) * maxCurrent;
    const { terminal } = voltagePhasors(current, degrees);
    points.push(`${chartX(current).toFixed(2)} ${chartY(terminal).toFixed(2)}`);
  }
  return `M${points.join('L')}`;
}

const byId = (id) => document.getElementById(id);
const loadAngle = byId('load-angle');
const loadCurrent = byId('load-current');
const angleValue = byId('angle-value');
const powerFactorValue = byId('power-factor-value');
const currentValue = byId('current-value');
const terminalValue = byId('terminal-value');
const voltageNote = byId('voltage-note');
const activeCurve = byId('active-curve');
const operatingPoint = byId('operating-point');
const operatingGuides = byId('operating-guides');
const sourcePhasor = byId('source-phasor');
const terminalPhasor = byId('terminal-phasor');
const resistancePhasor = byId('resistance-phasor');
const reactancePhasor = byId('reactance-phasor');
const currentPhasor = byId('current-phasor');
const currentPhasorLabel = byId('current-phasor-label');
const currentDirections = byId('current-directions');
const loadAngleArc = byId('load-angle-arc');
const phasorAngleLabel = byId('phasor-angle-label');
const sourceLeader = byId('source-leader');
const resistanceLeader = byId('resistance-leader');
const reactanceLeader = byId('reactance-leader');
const presets = document.querySelectorAll('.presets button');
const phasorScale = 208;

function phasorPoint([real, imaginary]) {
  return [28 + phasorScale * real, 122 - phasorScale * imaginary];
}

const midpoint = ([x1, y1], [x2, y2]) => [(x1 + x2) / 2, (y1 + y2) / 2];

function setEndpoint(line, endpoint, suffix = 2) {
  line.setAttribute(`x${suffix}`, endpoint[0]);
  line.setAttribute(`y${suffix}`, endpoint[1]);
}

const phasorOrigin = phasorPoint([0, 0]);
setEndpoint(terminalPhasor, phasorOrigin, 1);
setEndpoint(sourcePhasor, phasorOrigin, 1);
setEndpoint(currentPhasor, phasorOrigin, 1);
const [arcStart, arcEnd] = [0.54, -0.29].map((sine) =>
  phasorPoint([Math.sqrt(1 - sine ** 2), sine]),
);
byId('source-arc').setAttribute(
  'd',
  `M${arcStart.join(' ')} A${phasorScale} ${phasorScale} 0 0 1 ${arcEnd.join(' ')}`,
);

function drawPhasors(current, degrees) {
  const { terminal, resistor, source, cos, sin } = voltagePhasors(
    current,
    degrees,
    schematicImpedance,
  );
  const terminalTip = phasorPoint([terminal, 0]);
  const resistanceTip = phasorPoint([terminal + resistor[0], resistor[1]]);
  const sourceTip = phasorPoint(source);
  setEndpoint(terminalPhasor, terminalTip);
  setEndpoint(sourcePhasor, sourceTip);
  setEndpoint(resistancePhasor, terminalTip, 1);
  setEndpoint(resistancePhasor, resistanceTip);
  setEndpoint(reactancePhasor, resistanceTip, 1);
  setEndpoint(reactancePhasor, sourceTip);
  const [originX, originY] = phasorOrigin;
  const currentLength = 66;
  const radius = 31;
  const currentTip = [
    originX + currentLength * cos,
    originY - currentLength * sin,
  ];
  const inPhase = degrees === 0;
  const leading = degrees > 0;
  setEndpoint(currentPhasor, currentTip);
  currentPhasor.classList.toggle('coincident', inPhase);
  currentPhasorLabel.setAttribute('x', currentTip[0] + 8);
  currentPhasorLabel.setAttribute('y', currentTip[1] + (leading ? -6 : 18));
  loadAngleArc.setAttribute(
    'd',
    inPhase
      ? ''
      : `M${originX + radius} ${originY} A${radius} ${radius} 0 0 ${leading ? 0 : 1} ${originX + radius * cos} ${originY - radius * sin}`,
  );
  const halfAngle = (degrees * Math.PI) / 360;
  const angleLabelRadius = radius + 10;
  const labelOffset = Math.max(
    15,
    angleLabelRadius * Math.abs(Math.sin(halfAngle)),
  );
  phasorAngleLabel.setAttribute(
    'x',
    originX + (inPhase ? 14 : angleLabelRadius * Math.cos(halfAngle)),
  );
  phasorAngleLabel.setAttribute(
    'y',
    originY + 5 + (leading ? -labelOffset : labelOffset),
  );
  phasorAngleLabel.textContent = inPhase ? 'φ₂ = 0°' : 'φ₂';
  currentDirections.style.visibility = current === 0 ? 'hidden' : '';

  const guideX = sourceLeader.x1.baseVal.value;
  const fraction = (guideX - originX) / (sourceTip[0] - originX);
  setEndpoint(sourceLeader, [
    guideX,
    originY + fraction * (sourceTip[1] - originY),
  ]);
  setEndpoint(resistanceLeader, midpoint(terminalTip, resistanceTip));
  setEndpoint(reactanceLeader, midpoint(resistanceTip, sourceTip));

  resistancePhasor.classList.toggle(
    'short-drop',
    current * schematicImpedance.resistance * phasorScale < 8,
  );
  reactancePhasor.classList.toggle(
    'short-drop',
    current * schematicImpedance.reactance * phasorScale < 8,
  );
  for (const line of [
    resistancePhasor,
    reactancePhasor,
    resistanceLeader,
    reactanceLeader,
  ]) {
    line.style.visibility = current === 0 ? 'hidden' : '';
  }
}

function render() {
  const degrees = loadAngle.valueAsNumber;
  const current = loadCurrent.valueAsNumber;
  const phasors = voltagePhasors(current, degrees);
  const { terminal, cos } = phasors;
  const x = chartX(current);
  const y = chartY(terminal);

  activeCurve.setAttribute('d', characteristicPath(degrees));
  operatingPoint.setAttribute('cx', x);
  operatingPoint.setAttribute('cy', y);
  operatingGuides.setAttribute('d', `M100 ${y}H${x}V382`);
  drawPhasors(current, degrees);

  const phase = degrees < 0 ? '滞后' : degrees > 0 ? '超前' : '同相';
  const sign = degrees < 0 ? '−' : degrees > 0 ? '+' : '';
  angleValue.value = `${sign}${Math.abs(degrees).toFixed(1)}° ${phase}`;
  powerFactorValue.textContent = cos.toFixed(2);
  currentValue.value = current.toFixed(2);
  terminalValue.value = terminal.toFixed(3);
  loadAngle.setAttribute(
    'aria-valuetext',
    `${angleValue.value}，功率因数 ${powerFactorValue.textContent}`,
  );
  voltageNote.textContent =
    Math.abs(terminal - 1) < 0.0005
      ? current === 0
        ? '空载时，各条曲线都从额定二次电压出发。'
        : '此工作点的端电压接近空载电压。'
      : terminal < 1
        ? '此工作点的端电压低于空载电压。'
        : '此工作点的端电压高于空载电压。';
  for (const button of presets) {
    button.setAttribute(
      'aria-pressed',
      degrees === Number(button.dataset.angle),
    );
  }
}

for (const [index, id] of ['lagging', 'resistive', 'leading'].entries()) {
  const button = presets[index];
  byId(`${id}-curve`).setAttribute(
    'd',
    characteristicPath(Number(button.dataset.angle)),
  );
  button.addEventListener('click', () => {
    loadAngle.value = button.dataset.angle;
    render();
  });
}
loadAngle.addEventListener('input', render);
loadCurrent.addEventListener('input', render);
render();
