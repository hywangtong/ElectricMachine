import { radians } from './dc-motor-frogleg-simplex-model.js';

const colors = {
  lap: '#2f6eb5',
  wave: '#8459a6',
  ink: '#214e4a',
  muted: '#60796f',
  active: '#e8f4ef',
};

const escape = (copy) =>
  String(copy)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

function text(x, y, copy, color = colors.ink, size = 11, anchor = 'middle') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${escape(copy)}</text>`;
}

function point(cx, cy, radius, index) {
  const angle = radians(180 - index * 45);
  return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
}

function line(a, b, color, width, attributes = '') {
  return `<path d="M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${attributes}/>`;
}

function panel(x, mode, active) {
  const cx = x + 111;
  const cy = 101;
  let svg = `<g data-topology="${mode}">`;
  svg += `<rect x="${x}" y="4" width="248" height="202" rx="12" fill="${active ? colors.active : '#fbfdfc'}" stroke="${active ? '#39796f' : '#c8d9d4'}" stroke-width="${active ? 2 : 1}"/>`;
  svg += text(
    x + 14,
    25,
    mode === 'frogleg' ? 'Frog-Leg 接法' : 'Simplex-B 接法',
    colors.ink,
    15,
    'start',
  );
  if (active) {
    svg += `<rect x="${x + 194}" y="12" width="40" height="19" rx="9.5" fill="#39796f"/>`;
    svg += text(x + 214, 26, '当前', '#fff', 10);
  }
  const nodes = Array.from({ length: 8 }, (_, index) =>
    point(cx, cy, 53, index),
  );
  for (let index = 0; index < 8; index++) {
    const next = (index + 1) % 8;
    const a = point(cx, cy, mode === 'frogleg' ? 62 : 65, index);
    const b = point(cx, cy, mode === 'frogleg' ? 62 : 65, next);
    svg += line(a, b, colors.lap, 2.4, `data-lap="L${index + 1}"`);
  }
  if (mode === 'frogleg') {
    for (let index = 0; index < 8; index++) {
      svg += line(
        nodes[index],
        nodes[(index + 3) % 8],
        colors.wave,
        1.8,
        `data-wave="W${index + 1}" opacity="0.82"`,
      );
    }
  } else {
    for (let index = 0; index < 8; index++) {
      const a = point(cx, cy, 56, index);
      const b = point(cx, cy, 56, (index + 1) % 8);
      svg += line(
        a,
        b,
        colors.wave,
        2.4,
        `data-wave="W${((index + 7) % 8) + 1}"`,
      );
    }
  }
  nodes.forEach(([nodeX, nodeY], index) => {
    svg += `<circle cx="${nodeX.toFixed(2)}" cy="${nodeY.toFixed(2)}" r="8" fill="#fff" stroke="#c98228" stroke-width="1.8"/>`;
    svg += text(nodeX, nodeY + 3.5, `C${index + 1}`, '#624322', 8.5);
  });
  svg += text(
    x + 14,
    174,
    mode === 'frogleg' ? 'Lx：Cx → C(x+1)' : 'Lx ∥ W(x−1)',
    colors.lap,
    10.5,
    'start',
  );
  svg += text(
    x + 14,
    190,
    mode === 'frogleg' ? 'Wj：Cj → C(j+3)' : '均接 Cx → C(x+1)',
    colors.wave,
    10.5,
    'start',
  );
  svg += text(
    x + 234,
    190,
    mode === 'frogleg' ? '8 条导电支路' : '4 条外部支路',
    colors.muted,
    10,
    'end',
  );
  svg += '</g>';
  return svg;
}

export function connectionDiagram(mode) {
  return (
    '<defs><filter id="active-shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.12"/></filter></defs>' +
    panel(4, 'frogleg', mode === 'frogleg') +
    panel(264, 'simplex', mode === 'simplex') +
    text(
      256,
      217,
      '蓝：Lap section　　紫：Wave section　　节点：换向片',
      colors.muted,
      10.5,
    )
  );
}
