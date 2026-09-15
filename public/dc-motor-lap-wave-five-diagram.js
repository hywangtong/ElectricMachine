import { radians } from './dc-motor-lap-wave-five-model.js';

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
  const angle = radians(180 - index * 72);
  return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
}

function line(a, b, color, width, attributes = '') {
  return `<path d="M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${attributes}/>`;
}

function panel(x, mode, active) {
  const cx = x + 124;
  const cy = 99;
  const color = mode === 'lap' ? colors.lap : colors.wave;
  const step = mode === 'lap' ? 1 : 2;
  let svg = `<g data-topology="${mode}">`;
  svg += `<rect x="${x}" y="4" width="248" height="202" rx="12" fill="${active ? colors.active : '#fbfdfc'}" stroke="${active ? '#39796f' : '#c8d9d4'}" stroke-width="${active ? 2 : 1}"/>`;
  svg += text(
    x + 14,
    25,
    mode === 'lap' ? '单叠顺叠绕组' : '单波绕组',
    colors.ink,
    15,
    'start',
  );
  if (active) {
    svg += `<rect x="${x + 194}" y="12" width="40" height="19" rx="9.5" fill="#39796f"/>`;
    svg += text(x + 214, 26, '当前', '#fff', 10);
  }
  const nodes = Array.from({ length: 5 }, (_, index) =>
    point(cx, cy, 53, index),
  );
  for (let index = 0; index < 5; index++) {
    svg += line(
      nodes[index],
      nodes[(index + step) % 5],
      color,
      2.6,
      `data-${mode}="Q${index + 1}"`,
    );
  }
  nodes.forEach(([nodeX, nodeY], index) => {
    svg += `<circle cx="${nodeX.toFixed(2)}" cy="${nodeY.toFixed(2)}" r="9" fill="#fff" stroke="#c98228" stroke-width="1.8"/>`;
    svg += text(nodeX, nodeY + 3.5, `C${index + 1}`, '#624322', 8.5);
  });
  svg += text(
    x + 14,
    174,
    mode === 'lap' ? 'Qi：Ci → C(i+1)' : 'Qi：Ci → C(i+2)',
    color,
    11,
    'start',
  );
  svg += text(
    x + 14,
    191,
    mode === 'lap' ? 'Yc = 1 · A = 4' : 'Yc = 2 · A = 2',
    colors.muted,
    10.5,
    'start',
  );
  svg += text(
    x + 234,
    191,
    mode === 'lap' ? '4 刷臂' : '2 刷臂',
    colors.muted,
    10.5,
    'end',
  );
  svg += '</g>';
  return svg;
}

export function connectionDiagram(mode) {
  return (
    panel(4, 'lap', mode === 'lap') +
    panel(264, 'wave', mode === 'wave') +
    text(
      256,
      217,
      '同一组 Q1—Q5 实体线圈 · 节点为 C1—C5 换向片',
      colors.muted,
      10.5,
    )
  );
}
