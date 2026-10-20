import {
  exampleData as data,
  exampleDesign as design,
} from './dc-motor-starting-resistance-model.mjs';

const fmt = (value, places = 3) => value.toFixed(places);
const colors = ['#974f67', '#557ca1', '#7b70a8', '#50917e', '#ba893b'];
const charts = document.querySelectorAll('.resistance-chart');
const x = (current) => 64 + current * 13.2;
const y = (speed) => 260 - speed / 7.5;
const speed = (emf) => (emf * data.ratedSpeed) / data.ratedEmf;
const n0 = speed(data.voltage);
let selected = design.count;

function drawChart() {
  const grid = [0, 500, 1000, 1500]
    .map(
      (n) =>
        `<path class="grid-line" d="M64 ${y(n)}H516"/><text x="56" y="${y(n) + 7}" text-anchor="end">${n}</text>`,
    )
    .join('');
  const limits = [
    [
      data.load,
      'I<tspan baseline-shift="sub" font-size="16">L</tspan> / T<tspan baseline-shift="sub" font-size="16">L</tspan>',
    ],
    [design.switchingCurrent, 'I₂ / T₂'],
    [data.upper, 'I₁ / T₁'],
  ]
    .map(
      ([current, label], index) =>
        `<path class="limit-line" d="M${x(current)} 27V260"/><path d="M${x(current)} 260V${index === 0 ? 281 : 296}" stroke="#a6b4a7"/><text x="${index === 0 ? x(current) - 20 : x(current)}" y="${index === 0 ? 282 : 312}" text-anchor="middle">${label}</text>`,
    )
    .join('');
  const curves = design.totals
    .map((total, i) => {
      const endCurrent = Math.min(33.5, data.voltage / total);
      const labelCurrent = i === design.count ? endCurrent - 1 : endCurrent;
      const endSpeed = speed(data.voltage - total * labelCurrent);
      return `<path class="characteristic" stroke="${colors[i]}" d="M64 ${y(n0)}L${x(endCurrent)} ${y(speed(data.voltage - total * endCurrent))}"/><text class="curve-label" x="${x(labelCurrent) + 12}" y="${y(endSpeed) - (i === 0 ? 15 : 9)}" style="fill:${colors[i]}">${i === 0 ? '固有 Rₐ₀' : `Rₐ${i}`}</text>`;
    })
    .join('');
  const arrows = design.sections
    .map((section) => {
      const level = y(speed(section.switchingEmf));
      const fromSpeed =
        section.i === design.count
          ? 0
          : speed(design.sections[section.i].switchingEmf);
      return `<path class="trajectory" d="M${x(data.upper)} ${y(fromSpeed)}L${x(design.switchingCurrent)} ${level}"/><path class="switch-arrow ${section.i === selected ? 'selected' : ''}" d="M${x(design.switchingCurrent)} ${level}H${x(data.upper)}" marker-end="url(#switch-arrow-${section.i === selected ? 'active' : 'muted'})"/>${section.i === selected ? `<circle class="switch-point" cx="${x(design.switchingCurrent)}" cy="${level}" r="4"/><circle class="switch-point" cx="${x(data.upper)}" cy="${level}" r="4"/>` : ''}`;
    })
    .join('');
  for (const chart of charts) {
    chart.innerHTML = `<defs><marker id="switch-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#c37927"/></marker><marker id="switch-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#87948c"/></marker></defs>${grid}${limits}<path d="M64 36V260H523" stroke="#5e796a" fill="none" stroke-width="1.7"/><path d="M59 44 64 34 69 44M515 255 525 260 515 265" stroke="#5e796a" fill="none"/><text class="axis-label" x="64" y="23">n / (r/min)</text><text class="axis-label" x="535" y="287">Iₐ ∝ T</text>${curves}${arrows}<path class="trajectory" d="M${x(data.upper)} ${y(speed(design.sections[0].switchingEmf))}L${x(data.load)} ${y(data.ratedSpeed)}"/><circle cx="${x(data.load)}" cy="${y(data.ratedSpeed)}" r="4" fill="#39796f"/><text x="${x(data.load) - 15}" y="${y(data.ratedSpeed) - 8}">p</text>`;
  }
}

function selectSection(i) {
  selected = i;
  drawChart();
  for (const button of document.querySelectorAll('[data-section]')) {
    const active = Number(button.dataset.section) === i;
    button.setAttribute('aria-pressed', String(active));
    button.closest('tr').classList.toggle('selected', active);
  }
  const detail = document.querySelector('#switch-detail');
  const section = design.sections[i - 1];
  if (detail)
    detail.textContent = `第 ${design.count - i + 1} 次：切除 RST${i} = ${fmt(section.resistance)} Ω；n ≈ ${fmt(speed(section.switchingEmf), 0)} r/min 不变，电流 ${fmt(design.switchingCurrent, 2)} → ${fmt(data.upper, 1)} A。`;
}

const rows = document.querySelector('#resistance-rows');
if (rows) {
  const set = (id, text) => {
    document.getElementById(id).textContent = text;
  };
  set('initial-ratio', `β₀ = 28.5 / 16.5 = ${fmt(design.initialRatio)}`);
  set('initial-total', `Rₐₘ = 220 / 28.5 = ${fmt(design.initialTotal)} Ω`);
  set(
    'stage-calculation',
    `m* = lg ${fmt(design.initialTotal)} / lg ${fmt(design.initialRatio)} ≈ ${fmt(design.rawStages)}`,
  );
  set(
    'corrected-ratio',
    `β = ⁴√${fmt(design.initialTotal)} ≈ ${fmt(design.ratio)}`,
  );
  set(
    'corrected-current',
    `I₂ ≈ ${fmt(design.switchingCurrent, 2)} A ∈ [16.5, 18.0] ✓`,
  );
  rows.innerHTML = design.sections
    .toReversed()
    .map(
      (section, index) =>
        `<tr><td><button type="button" data-section="${section.i}" aria-pressed="false">${index + 1} · 切 R<sub>ST${section.i}</sub></button></td><td>${fmt(section.before)}</td><td>${fmt(section.after)}</td><td>${fmt(section.resistance)}</td></tr>`,
    )
    .join('');
  set(
    'resistance-check',
    `ΣRSTi = ${fmt(design.sections.reduce((sum, section) => sum + section.resistance, 0))} Ω = Rₐₘ − Rₐ ✓`,
  );
  for (const button of rows.querySelectorAll('button'))
    button.addEventListener('click', () =>
      selectSection(Number(button.dataset.section)),
    );
}
selectSection(selected);
