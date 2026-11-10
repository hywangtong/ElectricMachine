import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const kitPath = process.argv[2];
if (!kitPath) {
  throw new Error('Pass the path to the Anatomy kit/iso-kit.mjs');
}
const k = await import(pathToFileURL(resolve(kitPath)).href);

const width = 760;
const height = 360;
const plan = (x, y, w, d, r = 0) => ({ x, y, w, d, r });
const base = plan(-158, -53, 316, 145, 5);
const camera = k.fitProjection(
  [
    ...k.boxCorners(base, -15, 0),
    ...k.boxCorners(plan(-127, -17, 254, 34), 0, 153),
  ],
  width,
  height,
  { pad: 18, azimuth: 47, elevation: 24 },
);
const at = (point) => k.iso(point, camera);
const route = (points, closed) => k.pathOf(points.map(at), closed);
const detail = (points, closed) =>
  k.lineSvg(route(points, closed), { tone: 'faint' });
const solid = (shape, z, h, material, inner = '') =>
  k.solidSvg(k.slabOf(shape, z, h, camera, 4, 0.55), {
    className: material,
    inner,
  });

function yoke(left, right, z) {
  const x = left - 15;
  const w = right - left + 30;
  const laminations = Array.from({ length: 8 }, (_, i) => {
    const y = -12 + i * 3.5;
    return detail([
      [x, y, z + 22],
      [x + w, y, z + 22],
      [x + w, y, z],
    ]);
  }).join('');
  return solid(plan(x, -17, w, 34, 1.5), z, 22, 'steel', laminations);
}

function winding(x, z, h, material) {
  const bobbin = plan(x - 32, -30, 64, 60, 4);
  const turns = Array.from({ length: Math.floor(h / 5) - 1 }, (_, i) => {
    const level = z + 5 + i * 5;
    return k.lineSvg(k.sideSeam(bobbin, level, camera, 4), { tone: 'faint' });
  }).join('');
  return [
    solid(plan(x - 34, -32, 68, 64, 4), z - 3, 3, 'insulator'),
    solid(bobbin, z, h, material, turns),
    solid(plan(x - 34, -32, 68, 64, 4), z + h, 3, 'insulator'),
  ].join('');
}

function terminalBoard(center, count, material, names) {
  const y = 68;
  const xs = Array.from(
    { length: count },
    (_, i) => center + (i - (count - 1) / 2) * 24,
  );
  const pins = xs.map((x, i) => {
    const [sx, sy] = at([x, y + 13, 8]);
    return [
      solid(plan(x - 7, y - 7, 14, 14, 2), 8, 5, 'insulator'),
      solid(plan(x - 3.5, y - 3.5, 7, 7, 1), 13, 7, material),
      solid(plan(x - 5, y - 5, 10, 10, 2), 20, 3, material),
      `<text class="terminal-label" x="${sx}" y="${sy}">${names[i]}</text>`,
    ].join('');
  });
  return {
    xs,
    y,
    svg:
      solid(plan(center - 43, y - 13, 86, 32, 3), 0, 8, 'board') +
      pins.join(''),
  };
}

function probes({ xs, y }) {
  const [a, b] = xs;
  const c = xs.at(-1);
  const voltage = route([
    [a, y, 24],
    [a, y, 40],
    [b, y, 40],
    [b, y, 24],
  ]);
  const run = 28;
  const current = route([
    [c, y, 24],
    [c + run, y, 24],
  ]);
  const arrow = route([
    [c + run * 0.72, y, 29],
    [c + run, y, 24],
    [c + run * 0.72, y, 19],
  ]);
  return `<path class="probe voltage" d="${voltage}"/><path class="probe current" d="${current}${arrow}"/>`;
}

function machine(count) {
  const xs = count === 3 ? [-103, 0, 103] : [-70, 70];
  const left = xs[0];
  const right = xs.at(-1);
  const primary = terminalBoard(
    -76,
    count,
    'copper',
    count === 3 ? 'ABC' : 'AB',
  );
  const secondary = terminalBoard(
    76,
    count,
    'green',
    count === 3 ? 'abc' : 'ab',
  );
  const feet = k
    .corners(base, 17)
    .sort(
      (a, b) => k.depthOf([...a, 0], camera) - k.depthOf([...b, 0], camera),
    );
  const mount = [
    `<path class="halo" d="${k.haloOf(base, -14, 4, camera)}"/>`,
    ...feet.map(([x, y]) =>
      solid(plan(x - 9, y - 9, 18, 18, 4), -14, 6, 'insulator'),
    ),
    solid(base, -8, 8, 'base'),
    ...feet.map(([x, y]) => solid(plan(x - 3, y - 3, 6, 6, 1), 0, 2, 'steel')),
    solid(plan(left - 22, -27, right - left + 44, 54, 2), 0, 9, 'base'),
    yoke(left, right, 9),
  ];
  const legs = [...xs].sort(
    (a, b) => k.depthOf([a, 0, 0], camera) - k.depthOf([b, 0, 0], camera),
  );
  for (const x of legs) {
    mount.push(solid(plan(x - 15, -17, 30, 34), 31, 96, 'steel'));
    if (count === 3) {
      mount.push(winding(x, 37, 34, 'green'), winding(x, 78, 40, 'copper'));
    } else {
      mount.push(winding(x, 42, 73, x === left ? 'copper' : 'green'));
    }
  }
  mount.push(yoke(left, right, 127));
  for (const z of [14, 133]) {
    mount.push(
      solid(plan(left - 21, 17, right - left + 42, 6, 1), z, 10, 'base'),
    );
    for (const x of xs) {
      mount.push(solid(plan(x - 3.5, 23, 7, 2.5, 1), z + 2, 6, 'steel'));
    }
  }
  mount.push(primary.svg, secondary.svg);
  return { art: mount.join('\n'), probes: probes(primary) + probes(secondary) };
}

const single = machine(2);
const three = machine(3);
const flux = [
  [-70, 24, 138],
  [70, 24, 138],
  [70, 31, 21],
  [-70, 31, 21],
];
const fluxArrow = (sign) =>
  route([
    [-10 * sign, 24, 143],
    [1 * sign, 24, 138],
    [-10 * sign, 24, 133],
  ]);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
<!-- Generated from scripts/build-transformer-rated-diagram.mjs with Anatomy. -->
<style>
.iso-solid{--face:#9caeb0;--top:#d5e0df;--edge:#50686a}
.base{--face:#788b8e;--top:#bccac9;--edge:#42595d}
.board,.insulator{--face:#5f7476;--top:#9fb1af;--edge:#334c50}
.copper{--face:#bf8757;--top:#f1c794;--edge:#825634}
.green{--face:#6a9990;--top:#c3dcd1;--edge:#406760}
.iso-fill{fill:var(--face)} .iso-top{fill:var(--top)}
.iso-shade{fill:#1d3437} .iso-shade[data-shade="0"]{opacity:.05}
.iso-shade[data-shade="1"]{opacity:.13} .iso-shade[data-shade="2"]{opacity:.23}
.iso-shade[data-shade="3"]{opacity:.34}
.iso-line{fill:none;stroke:var(--edge);stroke-width:.9;stroke-linejoin:round}
.iso-line[data-tone="faint"]{opacity:.45}
.halo{fill:#385b57;opacity:.12}
.terminal-label{fill:#fff;font:700 15px sans-serif;text-anchor:middle}
.probe{fill:none;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.voltage{stroke:#21689a} .current{stroke:#a24c22}
.flux-path{fill:none;stroke:currentColor;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
</style>
<defs>
<g id="single-art">${single.art}</g>
<g id="single"><use href="#single-art"/>${single.probes}</g>
<g id="three">${three.art}${three.probes}</g>
<path id="flux-loop" class="flux-path" d="${route(flux, true)}"/>
<path id="flux-forward" class="flux-path" d="${fluxArrow(1)}"/>
<path id="flux-reverse" class="flux-path" d="${fluxArrow(-1)}"/>
</defs>
</svg>
`;
writeFileSync(
  new URL('../public/transformer-rated-diagram.svg', import.meta.url),
  svg,
);
