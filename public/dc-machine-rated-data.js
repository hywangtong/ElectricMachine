import { ratedMetrics } from './dc-machine-rated-data-model.mjs';

const buttons = [...document.querySelectorAll('[data-metric]')];
const diagrams = {
  motor: document.querySelector('[data-machine="motor"]'),
  generator: document.querySelector('[data-machine="generator"]'),
};
const summary = document.querySelector('#metric-summary');
const details = [...document.querySelectorAll('[data-detail]')];

function selectMetric(metricId) {
  const metric = ratedMetrics[metricId];
  if (!metric) return;

  for (const button of buttons) {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.metric === metricId),
    );
  }

  for (const [machineId, diagram] of Object.entries(diagrams)) {
    for (const location of ['electrical', 'conversion', 'shaft']) {
      const spot = diagram.querySelector(`[data-spot="${location}"]`);
      const label = metric[machineId][location];
      spot.textContent = label;
      spot.hidden = !label;
      diagram
        .querySelector(`[data-node="${location}"]`)
        .classList.toggle('is-focused', Boolean(label));
    }
  }

  summary.textContent = metric.summary;
  for (const detail of details) {
    detail.hidden = detail.dataset.detail !== metric.detail;
  }
}

for (const button of buttons) {
  button.addEventListener('click', () => selectMetric(button.dataset.metric));
}

// The parent player uses Space for next slide; keep Space on these buttons native.
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key === ' ' && event.target.closest?.('[data-metric]')) {
      event.stopImmediatePropagation();
    }
  },
  true,
);

selectMetric('power');
