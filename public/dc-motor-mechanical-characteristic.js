import './dc-generator-emf-controls.js';
import './dc-machine-basics.js';

const $ = (id) => document.getElementById(id);
const defaults = { voltage: 220, resistance: 1, flux: 20 };
const ce = 10;
const ct = (60 * ce) / (2 * Math.PI);
const baselineSlope =
  defaults.resistance / (ce * ct * (defaults.flux / 1000) ** 2);
// Fixed axes preserve visual slope comparisons across all slider settings.
const x = (torque) => 80 + (torque / 80) * 750;
const y = (speed) => 308 - (speed / 2800) * 280;
function curve(noLoad, slope) {
  const endTorque = Math.min(80, noLoad / slope);
  return `M${x(0)} ${y(noLoad)}L${x(endTorque)} ${y(Math.max(0, noLoad - slope * endTorque))}`;
}

const grid = [];
for (let speed = 0; speed <= 2800; speed += 400) {
  grid.push(
    `<path d="M80 ${y(speed)}H830" stroke="#e5ece7"/><text x="68" y="${y(speed) + 6}" text-anchor="end">${speed}</text>`,
  );
}
for (let torque = 0; torque <= 80; torque += 20) {
  grid.push(
    `<path d="M${x(torque)} 28V308" stroke="#e5ece7"/><text x="${x(torque)}" y="332" text-anchor="middle">${torque}</text>`,
  );
}
$('grid').innerHTML = grid.join('');
$('reference-curve').setAttribute('d', curve(1100, baselineSlope));

function render() {
  const voltage = Number($('voltage').value);
  const resistance = Number($('resistance').value);
  const fluxMilli = Number($('flux').value);
  const flux = fluxMilli / 1000;
  const noLoad = voltage / (ce * flux);
  const slope = resistance / (ce * ct * flux ** 2);
  const ratio = slope / baselineSlope;
  const kind =
    Math.abs(ratio - 1) < 1e-9 ? 'same' : ratio > 1 ? 'soft' : 'hard';
  const label = { same: '软硬不变', soft: '偏软', hard: '偏硬' }[kind];
  $('voltage-value').textContent = `${voltage} V`;
  $('resistance-value').textContent = `${resistance.toFixed(1)} Ω`;
  $('flux-value').textContent = `${fluxMilli} mWb`;
  $('no-load').textContent = `${noLoad.toFixed(0)} r/min`;
  $('slope').textContent = `${slope.toFixed(2)} (r/min)/(N·m)`;
  $('current-curve').setAttribute('d', curve(noLoad, slope));
  $('intercept').setAttribute('cy', y(noLoad));
  $('intercept-label').setAttribute('y', y(noLoad) - 12);
  $('intercept-label').textContent = `n₀ = ${noLoad.toFixed(0)}`;
  $('hardness').dataset.kind = kind;
  $('hardness-label').textContent = label;
  $('slope-ratio').textContent = `k / k默认 = ${ratio.toFixed(2)}`;
  $('hardness-description').textContent = {
    same: '相同转矩增量下，转速下降量与默认相同。',
    soft: '相同转矩增量下，转速下降更多。',
    hard: '相同转矩增量下，转速下降更少。',
  }[kind];
  $('chart-description').textContent =
    `当前电压 ${voltage} V，电阻 ${resistance.toFixed(1)} Ω，磁通 ${fluxMilli} mWb；理想空载转速 ${noLoad.toFixed(0)} r/min，斜率绝对值 ${slope.toFixed(2)} (r/min)/(N·m)，相对默认曲线${label}。灰色虚线为默认曲线。`;
}
for (const key of Object.keys(defaults)) {
  $(key).addEventListener('input', render);
}
$('reset').addEventListener('click', () => {
  for (const [key, value] of Object.entries(defaults)) $(key).value = value;
  render();
});
render();
