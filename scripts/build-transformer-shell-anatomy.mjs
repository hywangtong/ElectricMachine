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

// Figure concept: both windings surround the centre limb of a three-limb core.
// Section removes the near quadrant of the coils, never the magnetic core.
// Physical parts (43): 4 feet, 2 rails, 5 core members, 4 clamp bars,
// 8 bolt heads, 2 insulating end rings, 16 winding packs, 2 insulating tubes.
// Ring sectors are drawing subdivisions, not extra physical parts or turns.
// Equal depth, centre width 56 and side widths 28 express the symmetric
// flux division Phi = PhiLeft + PhiRight, PhiLeft = PhiRight = Phi / 2.
// These are teaching proportions, not dimensions for manufacturing.
const W = 640;
const H = 258;
const P = k.fitProjection(
  k.boxCorners({ x: -158, y: -65, w: 316, d: 130, r: 0 }, 0, 190),
  W,
  H,
  { pad: 10, azimuth: 70, elevation: 18 },
);
const poses = [];
const recorders = [];
const gradients = new Map();

for (const section of [false, true]) {
  const R = A.recorder(P);
  const put = (name, paths, shape, material, part, inner = '', body = '') => {
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
      svg: `<g class="material ${material}" data-part="${part}">${body || k.solidSvg(paths, { inner })}</g>`,
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
    // The view tangencies (160°, 340°) split front and back surfaces too;
    // a whole quadrant can wrap another part and cannot share one depth key.
    const angles = [0, 90, 160, 180, 270, 340, 360];
    const first = section ? 1 : 0;
    // The kit light is perpendicular to the viewing direction in the floor
    // plane. On a round side its normal/light dot product varies linearly
    // across screen x; one world-aligned gradient removes facet tone bands.
    const camera = k.cameraOf(P);
    const gradient = (radius, inside) => {
      const id = `${material}-${radius}-${inside ? 'inside' : 'outside'}`;
      if (!gradients.has(id)) {
        const x = k.iso([cx, 0, 0], P)[0];
        const tones = inside ? [0, 1, 2, 3] : [3, 2, 1, 0];
        gradients.set(
          id,
          `<linearGradient id="${id}" class="material ${material}" gradientUnits="userSpaceOnUse" x1="${x - radius * camera.k}" x2="${x + radius * camera.k}" y1="0" y2="0">${tones.map((tone, i) => `<stop offset="${i / 3}" stop-color="var(--s${tone})"/>`).join('')}</linearGradient>`,
        );
      }
      return `url(#${id})`;
    };
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
      const paths = k.extrude(poly, z, height, P, { convex: false });
      const atZ = (point, level) => k.iso([...point, level], P);
      const edge = (points, level) =>
        k.pathOf(points.map((point) => atZ(point, level)));
      const sides = [];
      const outlines = [
        edge(poly.slice(0, steps + 1), z + height),
        edge(poly.slice(steps + 1), z + height),
      ];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy);
        const nx = dy / length;
        const ny = -dx / length;
        if (nx * camera.cosA + ny * camera.sinA <= 0) continue;
        const radial = i === steps || i === poly.length - 1;
        const tone = Math.min(
          3,
          Math.max(
            0,
            Math.floor(2 * (1 - nx * camera.sinA + ny * camera.cosA)),
          ),
        );
        const fill = radial
          ? `var(--s${tone})`
          : gradient(i < steps ? ro : ri, i > steps);
        const face = k.pathOf(
          [atZ(a, z), atZ(b, z), atZ(b, z + height), atZ(a, z + height)],
          true,
        );
        sides.push(
          `<path d="${face}" fill="${fill}" stroke="${fill}" stroke-width=".18" stroke-linejoin="round"/>`,
        );
        if (!radial) outlines.push(edge([a, b], z));
      }
      for (const angle of [angles[q], angles[q + 1]]) {
        const cut = section && (angle === 90 || angle === 360);
        const tangent = angle === 160 || angle === 340;
        if (!cut && !tangent) continue;
        const point = (radius) => [
          cx + radius * Math.cos((angle * Math.PI) / 180),
          radius * Math.sin((angle * Math.PI) / 180),
        ];
        // The bore's tangent is inside this same filled sector: drawing it
        // on top would leave a false vertical seam across the outer surface.
        for (const radius of cut ? [ri, ro] : [ro]) {
          outlines.push(
            k.segment([...point(radius), z], [...point(radius), z + height], P),
          );
        }
        if (cut) {
          outlines.push(edge([point(ri), point(ro)], z));
          outlines.push(edge([point(ri), point(ro)], z + height));
        }
      }
      const body = `<g class="iso-solid"><path class="iso-fill" d="${paths.fill}"/>${sides.join('')}<path class="iso-top" d="${paths.top}"/><path class="iso-line iso-edge" d="${outlines.join('')}"/></g>`;
      put(
        `${name}.${q}`,
        paths,
        A.extruded(poly, z, height, { name: `${name}.${q}` }),
        material,
        part,
        '',
        body,
      );
    }
  };

  for (const x of [-136, 136]) {
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
  const corePlan = { x: -152, y: -16, w: 304, d: 32, r: 0 };
  const laminations = (z, h) =>
    Array.from({ length: 7 }, (_, i) => {
      const y = -12 + i * 4;
      return line([-152, y, z + h], [152, y, z + h]);
    }).join('');
  slab('core.bottom', corePlan, 14, 28, 'steel', 'core', laminations(14, 28));
  slab('core.top', corePlan, 162, 28, 'steel', 'core', laminations(162, 28));

  for (const cx of [-138, 0, 138]) {
    const width = cx === 0 ? 56 : 28;
    const plan = { x: cx - width / 2, y: -16, w: width, d: 32, r: 0 };
    const seams = Array.from({ length: 7 }, (_, i) => {
      const y = -12 + i * 4;
      return line([cx + width / 2, y, 42], [cx + width / 2, y, 162]);
    }).join('');
    slab(`core.limb.${cx}`, plan, 42, 120, 'steel', 'core', seams);
    if (cx !== 0) continue;
    ring('insulation.inner', cx, 33, 35, 46, 112, 'paper', 'core');
    ring('insulation.between', cx, 45, 48, 46, 112, 'paper', 'core');
    for (const z of [42, 158]) {
      ring(`end-ring.${z}`, cx, 33, 62, z, 4, 'paper', 'core');
    }
    for (let i = 0; i < 8; i++) {
      // Touching packs form continuous windings; the fine seams show packs,
      // not a specified number of electrical turns.
      const z = 46 + i * 14;
      ring(`inner.${i}`, cx, 35, 45, z, 14, 'inner', 'inner');
      ring(`outer.${i}`, cx, 48, 60, z, 14, 'outer', 'outer');
    }
  }
  for (const z of [19, 167]) {
    for (const y of [-21, 16]) {
      slab(
        `clamp.${y}.${z}`,
        { x: -156, y, w: 312, d: 5, r: 1 },
        z,
        14,
        'mount',
        'core',
      );
      for (const x of [-138, 138]) {
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
const fluxPath = (points) => k.pathOf(points.map((point) => k.iso(point, P)));
const centreFlux = fluxPath([
  [0, 0, 28],
  [0, 0, 176],
]);
const branchFlux = [-138, 138].map((x) =>
  fluxPath([
    [0, 0, 176],
    [x, 0, 176],
    [x, 0, 28],
    [0, 0, 28],
  ]),
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc" data-view="section" data-focus="all" data-running="false">
<title id="title">单相壳式变压器：中柱绕组与两侧回磁铁芯</title>
<desc id="desc">灰色上下铁轭连接中柱与两根侧柱，形成两个窗口；仅中柱套装绿色原绕组 N₁ 和铜色副绕组 N₂。前侧四分之一绕组剖开，显露中柱、绝缘及两层绕组。蓝色虚线为主磁路的透视投影，中柱磁通在对称两侧各分一半并闭合；动画往复表示交变，不表示直流磁通。结构、匝数与时间均不按实际比例。</desc>
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
<defs>${[...gradients.values()].join('')}</defs>
${poses.join('')}
<g class="flux-projection">
<path class="flux flux-centre" d="${centreFlux}" style="stroke-width:2.4"/>
${branchFlux.map((path) => `<path class="flux" d="${path}" style="stroke-width:1.5"/>`).join('')}
</g>
</svg>`;
writeFileSync(
  new URL(
    '../public/transformer-classification-assets/shell-anatomy.svg',
    import.meta.url,
  ),
  svg,
);
console.log(`Saved shell-anatomy.svg (${Math.round(svg.length / 1024)} KB)`);
for (const R of recorders) {
  console.log('Checking geometry…');
  A.auditOrExit(R, P);
}
