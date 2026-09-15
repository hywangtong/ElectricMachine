import { mod, radians } from './dc-motor-eight-coils-model.js';

const cx = 125;
const cy = 90;
const colors = {
  upper: '#306caf',
  lower: '#288466',
  comm: '#bc6830',
  ink: '#214e4a',
};
const point = (radius, degrees) => [
  cx + radius * Math.cos(radians(degrees)),
  cy - radius * Math.sin(radians(degrees)),
];
const pair = (p) => p.map((v) => v.toFixed(3)).join(' ');
function text(
  x,
  y,
  copy,
  color = colors.ink,
  size = 13,
  anchor = 'start',
  attributes = '',
) {
  return `<text ${attributes} x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${copy}</text>`;
}
function arc(radius, start, end, sweep) {
  return `M${pair(point(radius, start))}A${radius} ${radius} 0 0 ${sweep} ${pair(point(radius, end))}`;
}

export function windingDiagram(state, selected, flows) {
  let svg =
    '<defs><marker id="ring-current-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#d28a27"/></marker></defs>';
  const poleStep = 360 / state.poleCount;
  for (let index = 0; index < state.poleCount; index++) {
    const center = 180 - index * poleStep;
    const halfWidth = poleStep * 0.31;
    const start = center + halfWidth;
    const end = center - halfWidth;
    const north = index % 2 === 0;
    const path = `${arc(104, start, end, 1)}L${pair(point(94, end))}A94 94 0 0 0 ${pair(point(94, start))}Z`;
    svg += `<path data-pole="${index + 1}" d="${path}" fill="${north ? '#bd6859' : '#5f83ad'}" opacity="0.78"/>`;
    const [x, y] = point(99, center);
    svg += text(
      x.toFixed(3),
      (y + 3).toFixed(3),
      `${north ? 'N' : 'S'}${state.polePairs > 1 ? Math.floor(index / 2) + 1 : ''}`,
      'white',
      state.polePairs === 4 ? 8 : 10,
      'middle',
    );
  }
  svg += `<g data-rotor-angle="${state.angle}">`;
  for (let k = 0; k < 8; k++) {
    const center = 180 - k * 45 - state.angle,
      a = center + 22,
      b = center - 22;
    const segmentBrushes = state.brushes.filter((brush) =>
      brush.contacts.includes(k),
    );
    const hasPositive = segmentBrushes.some((brush) => brush.positive);
    const hasNegative = segmentBrushes.some((brush) => !brush.positive);
    const segmentFill =
      hasPositive && hasNegative
        ? colors.comm
        : hasPositive
          ? colors.upper
          : hasNegative
            ? colors.lower
            : '#c98228';
    const path = `${arc(52, a, b, 1)}L${pair(point(39, b))}A39 39 0 0 0 ${pair(point(39, a))}Z`;
    svg += `<path data-segment="${k + 1}" d="${path}" fill="${segmentFill}"/>`;
    svg += `<path d="M${pair(point(52, center))}L${pair(point(66, center))}" stroke="#294a49" stroke-width="1.7"/>`;
  }
  for (const coil of state.coils) {
    const color = coil.commuting
      ? colors.comm
      : coil.current > 0
        ? colors.upper
        : colors.lower;
    const vertices = Array.from({ length: 49 }, (_, i) => {
      const fraction = i / 48;
      return point(
        66 + 5 * Math.abs(Math.sin(4 * Math.PI * fraction)),
        coil.degrees + 22.5 - 45 * fraction,
      );
    });
    svg += `<path data-coil="${coil.id}" data-degrees="${coil.degrees}" d="${vertices.map((p, i) => `${i ? 'L' : 'M'}${pair(p)}`).join('')}" fill="none" stroke="${color}" stroke-width="${coil.id === selected ? 3.2 : 2.2}" stroke-linecap="round"/>`;
    const [x, y] = point(83, coil.degrees);
    svg += text(
      x.toFixed(3),
      (y + 5).toFixed(3),
      String(coil.id),
      color,
      coil.id === selected ? 18 : 16,
      'middle',
      `data-coil-label="${coil.id}"`,
    );
    if (Math.abs(coil.current) > 0.025) {
      const progress = 0.15 + (0.7 * mod(flows[coil.id - 1], 110)) / 110;
      const theta =
        coil.current > 0
          ? coil.degrees + 22.5 - 45 * progress
          : coil.degrees - 22.5 + 45 * progress;
      const delta = coil.current > 0 ? -5 : 5;
      svg += `<path data-current="${coil.id}" d="${arc(68, theta, theta + delta, coil.current > 0 ? 1 : 0)}" stroke="#d28a27" stroke-width="2" fill="none" marker-end="url(#ring-current-arrow)"/>`;
    }
  }
  svg += '</g>';
  // Brushes and poles stay fixed; only the copper and winding rotate.
  for (const brush of state.brushes) {
    const width = Math.min(7, poleStep * 0.12);
    const a = brush.position + width;
    const b = brush.position - width;
    const color = brush.positive ? colors.upper : colors.lower;
    const path = `M${pair(point(47, a))}L${pair(point(61, a))}L${pair(point(61, b))}L${pair(point(47, b))}Z`;
    svg += `<g data-brush="${brush.id}" data-position="${brush.position}"><path d="${path}" fill="#334b65"/><path d="M${pair(point(46, brush.position))}L${pair(point(38, brush.position))}" stroke="${color}" stroke-width="2"/></g>`;
    const [x, y] = point(state.polePairs === 4 ? 29 : 32, brush.position);
    const brushLabel =
      state.polePairs === 1
        ? `${brush.positive ? 'A' : 'B'}${brush.positive ? '＋' : '−'}`
        : `${brush.id}${brush.positive ? '＋' : '−'}`;
    svg += text(
      x.toFixed(3),
      (y + 4).toFixed(3),
      brushLabel,
      color,
      state.polePairs === 4 ? 8 : 10,
      'middle',
    );
  }
  svg +=
    text(234, 96, '↻', colors.lower, 28, 'middle') +
    text(234, 115, '顺时针', '#60796f', 11, 'middle');
  svg += text(
    278,
    23,
    `与主动画同步 · θ = ${state.angle.toFixed(1)}°`,
    '#60796f',
    13,
  );
  const branchText = (branch) => {
    const coils = branch.coils.map((coil) => coil.id).join('→') || '换向中';
    return `${branch.from.id}→${coils}→${branch.to.id}`;
  };
  const positiveBranches = state.branches.filter(
    (branch) => branch.direction > 0,
  );
  const negativeBranches = state.branches.filter(
    (branch) => branch.direction < 0,
  );
  const branchSize = state.polePairs === 1 ? 12 : 10;
  svg += text(
    278,
    43,
    `首端→末端（＋） · ${state.branchCurrent.toFixed(2)} A`,
    colors.upper,
    11,
  );
  svg += text(
    414,
    43,
    `末端→首端（−） · ${state.branchCurrent.toFixed(2)} A`,
    colors.lower,
    11,
  );
  positiveBranches.forEach((branch, index) => {
    svg += text(
      278,
      59 + index * 15,
      branchText(branch),
      colors.upper,
      branchSize,
    );
  });
  negativeBranches.forEach((branch, index) => {
    svg += text(
      414,
      59 + index * 15,
      branchText(branch),
      colors.lower,
      branchSize,
    );
  });
  svg += text(
    278,
    126,
    state.commuting.length
      ? `短接换向：线圈 ${state.commuting.map((c) => c.id).join(' / ')}`
      : `无短接线圈 · ${state.brushCount} 条并联支路`,
    state.commuting.length ? colors.comm : '#60796f',
    12,
  );
  if (state.commuting.length)
    svg += text(
      278,
      142,
      state.commuting
        .map((c) => `${c.id}：${c.current.toFixed(2)} A`)
        .join('　'),
      colors.comm,
      11,
    );
  const contactText = (positive) =>
    state.brushes
      .filter((brush) => brush.positive === positive)
      .map(
        (brush) =>
          `${brush.id}:${brush.contacts.map((segment) => segment + 1).join('/')}`,
      )
      .join('　');
  svg += text(278, 159, `正电刷接触片　${contactText(true)}`, colors.upper, 10);
  svg += text(
    278,
    174,
    `负电刷接触片　${contactText(false)}`,
    colors.lower,
    10,
  );
  return svg;
}
