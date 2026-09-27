import './dc-generator-emf-controls.js';
import { emfState } from './dc-generator-emf-model.mjs';

const svg = document.querySelector('#pole-machine');
const select = document.querySelector('#pole-pairs');
const poleCountOutput = document.querySelector('#pole-count');
const perPoleOutput = document.querySelector('#per-pole-flux');
const emfOutput = document.querySelector('#emf-reading');
const speed = document.querySelector('#speed');
const speedValue = document.querySelector('#speed-value');
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

function fieldLinePath(cx, cy, poleRadius, rotorRadius, lineAngle, isNorth) {
  const polePoint = polar(cx, cy, poleRadius, lineAngle);
  const rotorPoint = polar(cx, cy, rotorRadius, lineAngle);
  const start = isNorth ? polePoint : rotorPoint;
  const end = isNorth ? rotorPoint : polePoint;

  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function render(polePairs) {
  const state = emfState(polePairs, { speedRpm: Number(speed.value) });
  const cx = 310;
  const cy = 195;
  const innerPoleRadius = 145;
  const outerPoleRadius = 178;
  const rotorRadius = 124;
  const poleAngle = (Math.PI * 2) / state.poleCount;
  const gap = Math.min(0.08, poleAngle * 0.08);

  svg.replaceChildren();

  const definitions = element('defs');
  const fieldArrow = element('marker', {
    id: 'pole-field-arrow',
    viewBox: '0 0 10 10',
    refX: 8.5,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: 'auto-start-reverse',
  });
  fieldArrow.append(
    element('path', {
      d: 'M 0 0 L 10 5 L 0 10 Z',
      class: 'flux-arrowhead',
    }),
  );
  definitions.append(fieldArrow);
  svg.append(definitions);

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
  const rotor = element('circle', {
    cx,
    cy,
    r: rotorRadius,
    class: 'machine-rotor',
  });
  const shaft = element('circle', {
    cx,
    cy,
    r: 40,
    class: 'machine-shaft',
  });
  svg.append(stator, statorOpening, rotor, shaft);

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

    const fieldSpan = (end - start) * 0.82;
    const estimatedLineCount = Math.max(
      5,
      Math.round((fieldSpan * innerPoleRadius) / 18),
    );
    const lineCount =
      estimatedLineCount % 2 === 0
        ? estimatedLineCount + 1
        : estimatedLineCount;
    const lineAngles = Array.from(
      { length: lineCount },
      (_, lineIndex) =>
        centerAngle - fieldSpan / 2 + (fieldSpan * lineIndex) / (lineCount - 1),
    );
    for (const lineAngle of lineAngles) {
      svg.append(
        element('path', {
          d: fieldLinePath(
            cx,
            cy,
            innerPoleRadius + 5,
            rotorRadius - 6,
            lineAngle,
            isNorth,
          ),
          class: 'flux-path',
          'marker-end': 'url(#pole-field-arrow)',
        }),
      );
    }

    const conductorPoint = polar(cx, cy, 132, centerAngle + poleAngle * 0.2);
    const conductor = element('g', { class: 'emf-machine-conductor' });
    conductor.append(
      element('circle', { cx: conductorPoint.x, cy: conductorPoint.y, r: 8 }),
    );
    const symbol = element('text', {
      x: conductorPoint.x,
      y: conductorPoint.y + 0.5,
    });
    symbol.textContent = state.speedRpm === 0 ? '' : isNorth ? '×' : '·';
    conductor.append(symbol);
    svg.append(conductor);
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

  const motion = element('path', {
    d: 'M 370 136 A 84 84 0 0 1 390 210',
    fill: 'none',
    stroke: '#c85f2d',
    'stroke-width': 3,
    'marker-end': 'url(#motion-arrow)',
    opacity: state.speedRpm === 0 ? 0.25 : 1,
  });
  const motionArrow = element('marker', {
    id: 'motion-arrow',
    viewBox: '0 0 10 10',
    refX: 8,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: 'auto',
  });
  motionArrow.append(
    element('path', { d: 'M0 0L10 5L0 10Z', fill: '#c85f2d' }),
  );
  definitions.append(motionArrow);
  svg.append(motion);
  const motionLabel = element('text', { x: 405, y: 180, class: 'force-label' });
  motionLabel.textContent = state.speedRpm === 0 ? 'n = 0' : 'n ↻';
  svg.append(motionLabel);
  poleCountOutput.textContent = `2p = ${state.poleCount}`;
  perPoleOutput.textContent = `Φ = ${(state.perPoleFlux * 1000).toFixed(1)} mWb`;
  emfOutput.textContent = `E = ${state.emfFromFormula.toFixed(1)} V`;
  speedValue.textContent = `${speed.value} r/min`;
  svg.setAttribute(
    'aria-label',
    `${state.polePairs} 对极、${state.poleCount} 个磁极；各极磁通大小之和 80 毫韦伯平均分配后，每极磁通为 ${(state.perPoleFlux * 1000).toFixed(1)} 毫韦伯。`,
  );
}

speed.addEventListener('input', () => render(Number(select.value)));
select.addEventListener('change', () => render(Number(select.value)));
render(Number(select.value));
