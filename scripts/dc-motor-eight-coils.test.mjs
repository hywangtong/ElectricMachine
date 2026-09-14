import assert from 'node:assert/strict';
import {
  advanceAngle,
  radialCoilGeometry,
  windingState,
} from '../public/dc-motor-eight-coils-model.js';
import { windingDiagram } from '../public/dc-motor-eight-coils-diagram.js';

const ids = (coils) => coils.map((c) => c.id);
const subtract = (a, b) => a.map((value, i) => value - b[i]);
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
assert.deepEqual(ids(windingState(0).upper), [1, 2, 3, 4]);
assert.deepEqual(ids(windingState(0).lower), [8, 7, 6, 5]);
assert.deepEqual(ids(windingState(45).upper), [8, 1, 2, 3]);
assert.deepEqual(ids(windingState(45).lower), [7, 6, 5, 4]);
assert.deepEqual(windingState(0).brushA, [0]);
assert.deepEqual(windingState(0).brushB, [4]);
assert.equal(advanceAngle(359, 1, 18, true), 17);
assert.equal(advanceAngle(45, 1, 18, false), 45);
let checked = 0;
for (let angle = 0; angle < 360; angle += 0.25) {
  const state = windingState(angle),
    opposite = windingState(angle + 180);
  assert.equal(state.coils.length, 8);
  assert.equal(
    state.upper.length + state.lower.length + state.commuting.length,
    8,
  );
  assert.equal(state.brushA.length, state.brushB.length);
  assert.ok([1, 2].includes(state.brushA.length));
  for (const coil of state.coils) {
    assert.ok(Math.abs(coil.current) <= 1);
    const geometry = radialCoilGeometry(coil, angle);
    const tangent = [-geometry.normal[1], geometry.normal[0], 0];
    for (const turn of geometry.turns) {
      const area = cross(
        subtract(turn[1], turn[0]),
        subtract(turn[2], turn[1]),
      );
      assert.ok(dot(area, geometry.normal) > 0);
      assert.ok(Math.abs(dot(area, tangent)) < 1e-8);
      assert.ok(Math.abs(area[2]) < 1e-8);
      for (const point of turn)
        assert.ok(
          Math.abs(dot(subtract(point, turn[0]), geometry.normal)) < 1e-8,
        );
      assert.deepEqual(turn[0], turn[4]);
    }
    // B points +x (left N, right S); m cross B must remain clockwise.
    assert.ok(cross(geometry.moment, [1, 0, 0])[2] <= 1e-10);
    const reverse = radialCoilGeometry(
      { ...coil, current: -coil.current },
      angle,
    );
    assert.ok(
      geometry.moment.every(
        (value, i) => Math.abs(value + reverse.moment[i]) < 1e-10,
      ),
    );
    assert.ok(
      Math.abs(coil.current + opposite.coils[coil.id - 1].current) < 1e-10,
    );
    assert.deepEqual(coil.terminals, [coil.id - 1, coil.id % 8]);
    if (coil.commuting) {
      const contacts =
        coil.degrees > 90 && coil.degrees < 270 ? state.brushA : state.brushB;
      assert.ok(coil.terminals.every((t) => contacts.includes(t)));
    }
  }
  assert.ok(Math.abs(state.coils.reduce((s, c) => s + c.current, 0)) < 1e-10);
  checked++;
}
for (let id = 1; id <= 8; id++) {
  const center = 157.5 - (id - 1) * 45;
  assert.ok(Math.abs(windingState(center).coils[id - 1].current) < 1e-10);
  assert.equal(windingState(center - 6).coils[id - 1].current, 1);
  assert.equal(windingState(center + 6).coils[id - 1].current, -1);
  assert.ok(
    Math.abs(windingState(center - 3).coils[id - 1].current - 0.5) < 1e-10,
  );
  assert.ok(
    Math.abs(windingState(center + 3).coils[id - 1].current + 0.5) < 1e-10,
  );
}
console.log(
  `Eight-coil model: ${checked} angles verified; radial turn normals, excitation reversal, clockwise torque, branches, brush contacts, half-turn reversal, linear commutation, pause and wrap passed.`,
);
const diagrams = [0, 22.5, 45, 90, 180, 359.75].map((angle) => {
  const state = windingState(angle);
  const svg = windingDiagram(state, 1, Array(8).fill(0));
  assert.match(svg, new RegExp(`data-rotor-angle="${state.angle}"`));
  assert.equal([...svg.matchAll(/data-coil="/g)].length, 8);
  assert.equal([...svg.matchAll(/data-segment="/g)].length, 8);
  for (const coil of state.coils) {
    assert.ok(
      svg.includes(`data-coil="${coil.id}" data-degrees="${coil.degrees}"`),
    );
    const label = svg.match(
      new RegExp(`data-coil-label="${coil.id}" x="([^"]+)" y="([^"]+)"`),
    );
    assert.ok(label);
    assert.ok(
      Math.abs(
        Number(label[1]) -
          (125 + 83 * Math.cos((coil.degrees * Math.PI) / 180)),
      ) < 0.001,
    );
    assert.ok(
      Math.abs(
        Number(label[2]) - (95 - 83 * Math.sin((coil.degrees * Math.PI) / 180)),
      ) < 0.001,
    );
  }
  if (state.commuting.length) assert.ok(svg.includes('短接换向'));
  return svg;
});
for (const brush of ['A', 'B']) {
  const extract = (svg) =>
    svg.match(new RegExp(`<g data-brush="${brush}">.*?</g>`))[0];
  diagrams.forEach((svg) => assert.equal(extract(svg), extract(diagrams[0])));
}
console.log(
  'Circular diagram: eight coils/segments, rotor/label synchronization and stationary brushes passed.',
);
