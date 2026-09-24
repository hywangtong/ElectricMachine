import { torqueState } from './dc-motor-torque-model.mjs';

const svg = document.querySelector('#pole-machine');
const select = document.querySelector('#pole-pairs');
const poleCountOutput = document.querySelector('#pole-count');
const perPoleOutput = document.querySelector('#per-pole-flux');
const torqueOutput = document.querySelector('#torque-reading');
const svgNamespace = 'http://www.w3.org/2000/svg';

function polar(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function sectorPath(cx, cy, innerRadius, outerRadius, start, end) {
  const outerStart = polar(cx, cy, outerRadius, start);
  const outerEnd = polar(cx, cy, outerRadius, end);
  const innerEnd = polar(cx, cy, innerRadius, end);
  const innerStart = polar(cx, cy, innerRadius, start);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function element(name, attributes = {}) {
  const node = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function render(polePairs) {
  const state = torqueState(polePairs);
  const cx = 310;
  const cy = 195;
  const innerPoleRadius = 145;
  const outerPoleRadius = 178;
  const rotorRadius = 124;
  const poleAngle = (Math.PI * 2) / state.poleCount;
  const gap = Math.min(0.08, poleAngle * 0.08);

  svg.replaceChildren();

  const stator = element('circle', {
    cx,
    cy,
    r: outerPoleRadius + 13,
    class: 'machine-stator',
  });
  const statorOpening = element('circle', {
    cx,
    cy,
    r: outerPoleRadius - 3,
    fill: '#fff',
  });
  svg.append(stator, statorOpening);

  for (let index = 0; index < state.poleCount; index += 1) {
    const centerAngle = -Math.PI / 2 + index * poleAngle;
    const start = centerAngle - poleAngle / 2 + gap;
    const end = centerAngle + poleAngle / 2 - gap;
    const isNorth = index % 2 === 0;

    svg.append(
      element('path', {
        d: sectorPath(cx, cy, innerPoleRadius, outerPoleRadius, start, end),
        class: `pole-sector ${isNorth ? 'north' : 'south'}`,
      }),
    );

    const labelPoint = polar(cx, cy, 162, centerAngle);
    const label = element('text', {
      x: labelPoint.x,
      y: labelPoint.y,
      class: 'pole-text',
    });
    label.textContent = isNorth ? 'N' : 'S';
    svg.append(label);

    const fluxStart = polar(cx, cy, innerPoleRadius - 6, centerAngle);
    const fluxEnd = polar(cx, cy, 61, centerAngle);
    const line = element('path', {
      d: `M ${fluxStart.x} ${fluxStart.y} Q ${
        cx + (fluxStart.x - cx) * 0.45
      } ${cy + (fluxStart.y - cy) * 0.45} ${fluxEnd.x} ${fluxEnd.y}`,
      class: `flux-path ${isNorth ? 'inward' : 'outward'}`,
    });
    line.style.animationDelay = `${-index * 0.13}s`;
    svg.append(line);

    const chipPoint = polar(cx, cy, 214, centerAngle);
    const chip = element('g', { class: 'flux-chip' });
    chip.append(
      element('rect', {
        x: chipPoint.x - 37,
        y: chipPoint.y - 13,
        width: 74,
        height: 26,
        rx: 9,
      }),
    );
    const chipText = element('text', {
      x: chipPoint.x,
      y: chipPoint.y + 1,
    });
    chipText.textContent = `ΦΣ/${state.poleCount}`;
    chip.append(chipText);
    svg.append(chip);
  }

  svg.append(
    element('circle', {
      cx,
      cy,
      r: rotorRadius,
      class: 'machine-rotor',
    }),
    element('circle', {
      cx,
      cy,
      r: 40,
      class: 'machine-shaft',
    }),
  );

  poleCountOutput.textContent = `2p = ${state.poleCount}`;
  perPoleOutput.textContent = `Φ = ${(state.perPoleFlux * 1000).toFixed(1)} mWb`;
  torqueOutput.innerHTML = `T<sub>e</sub> = ${state.torqueFromFormula.toFixed(1)} N·m`;
  svg.setAttribute(
    'aria-label',
    `${state.polePairs} 对极、${state.poleCount} 个磁极；总磁通 80 毫韦伯平均分配后，每极磁通为 ${(state.perPoleFlux * 1000).toFixed(1)} 毫韦伯。`,
  );
}

select.addEventListener('change', () => render(Number(select.value)));
render(Number(select.value));
