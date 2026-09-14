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
  svg += `<g data-rotor-angle="${state.angle}">`;
  for (let k = 0; k < 8; k++) {
    const center = 180 - k * 45 - state.angle,
      a = center + 22,
      b = center - 22;
    const contacted = state.brushA.includes(k) || state.brushB.includes(k);
    const path = `${arc(52, a, b, 1)}L${pair(point(39, b))}A39 39 0 0 0 ${pair(point(39, a))}Z`;
    svg += `<path data-segment="${k + 1}" d="${path}" fill="${contacted ? '#e3a64e' : '#c98228'}"/>`;
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
  // Brushes stay fixed; only copper segments, winding leads and coils rotate.
  svg +=
    '<g data-brush="A"><rect x="74" y="83" width="12" height="14" fill="#334b65"/><path d="M86 90H104" stroke="#306caf" stroke-width="2"/><circle cx="104" cy="90" r="2.5" fill="white" stroke="#306caf" stroke-width="1.5"/></g>';
  svg +=
    '<g data-brush="B"><rect x="164" y="83" width="12" height="14" fill="#334b65"/><path d="M146 90H164" stroke="#288466" stroke-width="2"/><circle cx="146" cy="90" r="2.5" fill="white" stroke="#288466" stroke-width="1.5"/></g>';
  svg +=
    text(104, 78, 'A ＋', colors.upper, 14, 'middle') +
    text(146, 78, 'B −', colors.lower, 14, 'middle');
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
  svg += text(278, 47, '上支路 · 1 A', colors.upper, 14);
  svg += text(
    278,
    66,
    `A → ${state.upper.map((c) => c.id).join(' → ')} → B`,
    colors.upper,
    14,
  );
  svg += text(278, 92, '下支路 · 1 A', colors.lower, 14);
  svg += text(
    278,
    111,
    `A → ${state.lower.map((c) => c.id).join(' → ')} → B`,
    colors.lower,
    14,
  );
  svg += text(
    278,
    137,
    state.commuting.length
      ? `短接换向：线圈 ${state.commuting.map((c) => c.id).join(' / ')}`
      : '无短接线圈 · 每支路 4 个线圈',
    state.commuting.length ? colors.comm : '#60796f',
    12,
  );
  if (state.commuting.length)
    svg += text(
      278,
      153,
      state.commuting
        .map((c) => `${c.id}：${c.current.toFixed(2)} A`)
        .join('　'),
      colors.comm,
      11,
    );
  svg += text(
    278,
    173,
    `接触片　A：${state.brushA.map((k) => k + 1).join('/')}　B：${state.brushB.map((k) => k + 1).join('/')}`,
    '#60796f',
    12,
  );
  return svg;
}
