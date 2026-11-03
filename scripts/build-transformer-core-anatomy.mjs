// Optional artwork regeneration; requires the MIT-licensed Anatomy skill.
// ANATOMY_SKILL_DIR overrides the default ~/.agents/skills/anatomy location.
// The course serves the generated SVG without this development dependency.
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const skill =
  process.env.ANATOMY_SKILL_DIR ||
  join(homedir(), '.agents', 'skills', 'anatomy');
const k = await import(pathToFileURL(join(skill, 'kit/iso-kit.mjs')));
const A = await import(pathToFileURL(join(skill, 'kit/audit.mjs')));

// Figure concept: two concentric winding sets surround a closed two-limb core.
// Section removes the near quadrant of the coils, never the magnetic core.
// Physical parts: 4 feet, 2 rails, 4 core members, 4 clamp bars, 8 bolt heads,
// 4 insulating end rings, 32 winding packs (8 per winding), 4 insulating tubes.
// Ring sectors are drawing subdivisions, not extra physical parts or turns.
const W = 640;
const H = 258;
const P = k.fitProjection(
  k.boxCorners({ x: -188, y: -57, w: 376, d: 114, r: 0 }, 0, 192),
  W,
  H,
  { pad: 10, azimuth: 65, elevation: 22 },
);
const poses = [];
const recorders = [];

for (const section of [false, true]) {
  const R = A.recorder(P);
  const put = (name, paths, shape, material, part, inner = '') => {
    const centre = shape.poly.reduce(
      (sum, point) => [
        sum[0] + point[0] / shape.poly.length,
        sum[1] + point[1] / shape.poly.length,
      ],
      [0, 0],
    );
    R.put({
      name,
      at: [...centre, (shape.s0 + shape.s1) / 2],
      shapes: [R.solid(shape)],
      svg: `<g class="material ${material}" data-part="${part}">${k.solidSvg(paths, { inner })}</g>`,
    });
  };
  const slab = (name, plan, z, height, material, part, inner = '') => {
    put(
      name,
      k.slabOf(plan, z, height, P, 5, 0.5),
      A.slab(plan, z, height, { name, ground: name.startsWith('foot') }, 5),
      material,
      part,
      inner,
    );
  };
  const line = (a, b) => k.lineSvg(k.segment(a, b, P), { tone: 'faint' });
  const ring = (name, cx, ri, ro, z, height, material, part) => {
    // Three back/side quadrants plus a separately removable near quadrant.
    // Split at real radial planes so a core or an inner coil can occlude it.
    // The view tangencies (155°, 335°) split front and back surfaces too;
    // a whole quadrant can wrap another part and cannot share one depth key.
    const angles = [0, 90, 155, 180, 270, 335, 360];
    const first = section ? 1 : 0;
    for (let q = first; q < angles.length - 1; q++) {
      const steps = Math.ceil((angles[q + 1] - angles[q]) / 11.25);
      const polar = (radius, i) => {
        const angle =
          ((angles[q] + ((angles[q + 1] - angles[q]) * i) / steps) * Math.PI) /
          180;
        return [cx + radius * Math.cos(angle), radius * Math.sin(angle)];
      };
      const poly = [
        ...Array.from({ length: steps + 1 }, (_, i) => polar(ro, i)),
        ...Array.from({ length: steps + 1 }, (_, i) => polar(ri, steps - i)),
      ];
      put(
        `${name}.${q}`,
        k.extrude(poly, z, height, P, { convex: false }),
        A.extruded(poly, z, height, { name: `${name}.${q}` }),
        material,
        part,
      );
    }
  };

  for (const x of [-154, 154]) {
    for (const y of [-40, 40]) {
      slab(
        `foot.${x}.${y}`,
        { x: x - 13, y: y - 10, w: 26, d: 20, r: 3 },
        0,
        6,
        'mount',
        'core',
      );
    }
    slab(
      `rail.${x}`,
      { x: x - 18, y: -53, w: 36, d: 106, r: 2 },
      6,
      8,
      'mount',
      'core',
    );
  }
  const corePlan = { x: -168, y: -18, w: 336, d: 36, r: 0 };
  const laminations = (z, h) =>
    Array.from({ length: 8 }, (_, i) => {
      const y = -14 + i * 4;
      return line([-168, y, z + h], [168, y, z + h]);
    }).join('');
  slab('core.bottom', corePlan, 14, 30, 'steel', 'core', laminations(14, 30));
  slab('core.top', corePlan, 162, 30, 'steel', 'core', laminations(162, 30));

  for (const cx of [-150, 150]) {
    const plan = { x: cx - 18, y: -18, w: 36, d: 36, r: 0 };
    const seams = Array.from({ length: 8 }, (_, i) => {
      const y = -14 + i * 4;
      return line([cx + 18, y, 44], [cx + 18, y, 162]);
    }).join('');
    slab(`core.limb.${cx}`, plan, 44, 118, 'steel', 'core', seams);
    ring(`insulation.inner.${cx}`, cx, 26, 28, 48, 110, 'paper', 'core');
    ring(`insulation.between.${cx}`, cx, 37, 40, 48, 110, 'paper', 'core');
    for (const z of [44, 158]) {
      ring(`end-ring.${cx}.${z}`, cx, 26, 53, z, 4, 'paper', 'core');
    }
    for (let i = 0; i < 8; i++) {
      // Touching packs form continuous windings; the fine seams show packs,
      // not a specified number of electrical turns.
      const z = 48 + i * 13.75;
      ring(`inner.${cx}.${i}`, cx, 28, 37, z, 13.75, 'inner', 'inner');
      ring(`outer.${cx}.${i}`, cx, 40, 51, z, 13.75, 'outer', 'outer');
    }
  }
  for (const z of [19, 167]) {
    for (const y of [-23, 18]) {
      slab(
        `clamp.${y}.${z}`,
        { x: -174, y, w: 348, d: 5, r: 1 },
        z,
        14,
        'mount',
        'core',
      );
      for (const x of [-158, 158]) {
        slab(
          `bolt.${x}.${y}.${z}`,
          { x: x - 3, y, w: 6, d: 5, r: 1 },
          z + 14,
          3,
          'bolt',
          'core',
        );
      }
    }
  }

  console.log(
    `${section ? 'Section' : 'Full'} pose: sorting ${R.items.length} solids…`,
  );
  A.settle(R, P, { step: 0.8 });
  recorders.push(R);
  const art = R.items
    .slice()
    .sort((a, b) => a.key - b.key)
    .map((item) => item.svg)
    .join('');
  poses.push(`<g data-pose="${section ? 'section' : 'full'}">${art}</g>`);
}

// A transparent, explicitly identified projection of the main magnetic path.
// Alternate the whole closed path's direction together; there is no DC flux.
const flux = k.pathOf(
  [
    [-150, 0, 29],
    [-150, 0, 177],
    [150, 0, 177],
    [150, 0, 29],
    [-150, 0, 29],
  ].map((point) => k.iso(point, P)),
  true,
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc" data-view="section" data-focus="all" data-running="false">
<title id="title">单相心式变压器：两柱同心绕组剖视</title>
<desc id="desc">灰色上下铁轭连接两根铁芯柱；每柱内层绿色 N₁ 与外层铜色 N₂ 同心套装。前侧四分之一绕组剖开，显露铁芯、绝缘及两层绕组。蓝色虚线为闭合交变主磁路的透视投影。</desc>
<style>
.material{--fill:#718481;--top:#c3ceca;--s0:#596e6b;--s1:#6b7f7a;--s2:#8b9e97;--s3:#a2b4ac;--edge:#3e5c55;transition:opacity .3s}
.inner{--fill:#428d7b;--top:#a4d5c0;--s0:#286555;--s1:#39836d;--s2:#5ca088;--s3:#7eb79f;--edge:#2c6f5a}
.outer{--fill:#b37c47;--top:#f3ce99;--s0:#88582e;--s1:#a66c37;--s2:#c38d50;--s3:#dfad6d;--edge:#916134}
.paper{--fill:#d7c7a0;--top:#f6ebcc;--s0:#b6a57f;--s1:#c6b48c;--s2:#d9c99f;--s3:#e7dcb7;--edge:#ac9a73}
.mount{--fill:#65756b;--top:#acbbb0;--s0:#485e51;--s1:#607367;--s2:#7d9182;--s3:#94a596;--edge:#52675a}
.bolt{--fill:#a6b4a8;--top:#e3e8d8;--s0:#7a8b7e;--s1:#93a493;--s2:#acbca6;--s3:#c7d2ba;--edge:#5c7360}
.iso-fill{fill:var(--fill)}.iso-top{fill:var(--top)}
.iso-shade[data-shade="0"]{fill:var(--s0)}.iso-shade[data-shade="1"]{fill:var(--s1)}
.iso-shade[data-shade="2"]{fill:var(--s2)}.iso-shade[data-shade="3"]{fill:var(--s3)}
.iso-line{fill:none;stroke:var(--edge);stroke-width:.55;stroke-linecap:round;stroke-linejoin:round}
.iso-crease,.iso-bevel{opacity:.45}.iso-line[data-tone="faint"]{opacity:.32}
[data-view="section"] [data-pose="full"],[data-view="full"] [data-pose="section"]{display:none}
[data-focus="core"] [data-part]:not([data-part="core"]),
[data-focus="inner"] [data-part]:not([data-part="inner"]),
[data-focus="outer"] [data-part]:not([data-part="outer"]){opacity:.22}
.flux{fill:none;stroke:#357db2;stroke-width:2;stroke-dasharray:5 5;stroke-linecap:round;opacity:.8;animation:flux 6s infinite;animation-play-state:paused}
[data-running="true"] .flux{animation-play-state:running}
@keyframes flux{0%{stroke-dashoffset:0;opacity:.18}25%{stroke-dashoffset:-16;opacity:.9}50%{stroke-dashoffset:-32;opacity:.18}75%{stroke-dashoffset:-16;opacity:.9}100%{stroke-dashoffset:0;opacity:.18}}
@media(prefers-reduced-motion:reduce){.flux{animation:none;opacity:.65}.material{transition:none}}
</style>
${poses.join('')}
<path class="flux" d="${flux}"/>
</svg>`;
writeFileSync(
  new URL(
    '../public/transformer-classification-assets/core-anatomy.svg',
    import.meta.url,
  ),
  svg,
);
console.log(`Saved core-anatomy.svg (${Math.round(svg.length / 1024)} KB)`);
for (const R of recorders) {
  console.log('Checking geometry…');
  A.auditOrExit(R, P);
}
