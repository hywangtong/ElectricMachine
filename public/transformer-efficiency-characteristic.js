const noLoadLoss = 1;
const ratedShortCircuitLoss = 4;
const optimum = Math.sqrt(noLoadLoss / ratedShortCircuitLoss);
const maxLoad = 1.25;
const plotLeft = 64;
const plotBottom = 332;
const chartX = (beta) => plotLeft + (626 * beta) / maxLoad;
const chartY = (eta) => plotBottom - (298 * eta) / 100;

function efficiency(beta, power) {
  const output = beta * power;
  return (
    (100 * output) / (output + noLoadLoss + beta ** 2 * ratedShortCircuitLoss)
  );
}

const byId = (id) => document.getElementById(id);
const slider = byId('rated-active-power');
const powerValue = byId('power-value');
const peakValue = byId('peak-value');
const curve = byId('efficiency-curve');
const peak = byId('efficiency-peak');
const peakVertical = byId('peak-vertical');
const peakHorizontal = byId('peak-horizontal');
const peakX = chartX(optimum);

byId('peak-beta').textContent = optimum.toFixed(2);

function render() {
  const power = slider.valueAsNumber;
  const maxEfficiency = efficiency(optimum, power);
  const peakY = chartY(maxEfficiency);
  const samples = 200;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const beta = (maxLoad * index) / samples;
    return `${chartX(beta).toFixed(2)} ${chartY(efficiency(beta, power)).toFixed(2)}`;
  });

  curve.setAttribute('d', `M${points.join('L')}`);
  peak.setAttribute('cx', peakX);
  peak.setAttribute('cy', peakY);
  peakVertical.setAttribute('d', `M${peakX} ${plotBottom}V${peakY}`);
  peakHorizontal.setAttribute('d', `M${plotLeft} ${peakY}H${peakX}`);
  powerValue.textContent = `${power} kW`;
  slider.setAttribute('aria-valuetext', powerValue.textContent);
  peakValue.textContent = `${maxEfficiency.toFixed(2)}%`;
}

slider.addEventListener('input', render);

// Let the slider handle its native keys and gestures inside the course player.
slider.addEventListener('keydown', (event) => {
  if (
    [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ].includes(event.key)
  ) {
    event.stopPropagation();
  }
});
slider.addEventListener('touchstart', (event) => event.stopPropagation());
slider.addEventListener('touchend', (event) => event.stopPropagation());

render();
