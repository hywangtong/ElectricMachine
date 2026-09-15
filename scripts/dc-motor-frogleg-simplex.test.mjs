import assert from 'node:assert/strict';
import {
  ARMATURE_CURRENT,
  BRUSH_COUNT,
  POLE_COUNT,
  SLOT_COUNT,
  advanceAngle,
  compositeCoils,
  sectionPath,
  windingSections,
  windingState,
} from '../public/dc-motor-frogleg-simplex-model.js';
import { connectionDiagram } from '../public/dc-motor-frogleg-simplex-diagram.js';

const round = (value) => Math.round(value * 1e9) / 1e9;
const section = (sections, key) => sections.find((item) => item.key === key);
const distance = (a, b) =>
  Math.hypot(...a.map((value, index) => value - b[index]));

assert.equal(SLOT_COUNT, 8);
assert.equal(POLE_COUNT, 4);
assert.equal(BRUSH_COUNT, 4);
assert.equal(compositeCoils.length, 8);
assert.deepEqual(
  compositeCoils.map((coil) => [
    `F${coil.id}`,
    `L${coil.lapId}`,
    `W${coil.waveId}`,
    coil.slots.map((slot) => slot + 1),
  ]),
  [
    ['F1', 'L1', 'W8', [1, 3]],
    ['F2', 'L2', 'W1', [2, 4]],
    ['F3', 'L3', 'W2', [3, 5]],
    ['F4', 'L4', 'W3', [4, 6]],
    ['F5', 'L5', 'W4', [5, 7]],
    ['F6', 'L6', 'W5', [6, 8]],
    ['F7', 'L7', 'W6', [7, 1]],
    ['F8', 'L8', 'W7', [8, 2]],
  ],
);

const frogleg = windingSections('frogleg');
const simplex = windingSections('simplex');
assert.equal(frogleg.length, 16);
assert.equal(simplex.length, 16);
for (let index = 0; index < 8; index++) {
  assert.deepEqual(section(frogleg, `L${index + 1}`).terminals, [
    index,
    (index + 1) % 8,
  ]);
  assert.deepEqual(section(frogleg, `W${index + 1}`).terminals, [
    index,
    (index + 3) % 8,
  ]);
  assert.deepEqual(section(simplex, `W${index + 1}`).terminals, [
    (index + 1) % 8,
    (index + 2) % 8,
  ]);
  assert.equal(section(frogleg, `L${index + 1}`).slots[1], (index + 2) % 8);
  assert.equal(section(frogleg, `W${index + 1}`).slots[1], (index + 3) % 8);
}

for (const mode of ['frogleg', 'simplex']) {
  const initial = windingState(0, mode);
  assert.equal(initial.poles.length, 4);
  assert.equal(initial.brushes.length, 4);
  assert.deepEqual(
    initial.brushes.map((brush) => [
      brush.positive,
      brush.contacts.map((contact) => contact + 1),
    ]),
    [
      [true, [1]],
      [false, [3]],
      [true, [5]],
      [false, [7]],
    ],
  );
  const positiveSupply = initial.sections.reduce((total, item) => {
    const [start, end] = item.terminals;
    if (initial.potentials[start] === 1) total += item.current;
    if (initial.potentials[end] === 1) total -= item.current;
    return total;
  }, 0);
  assert.equal(round(positiveSupply), ARMATURE_CURRENT);
  assert.deepEqual(
    initial.sections.map((item) => round(item.current)),
    [
      0.25, 0.25, -0.25, -0.25, 0.25, 0.25, -0.25, -0.25, 0.25, -0.25, -0.25,
      0.25, 0.25, -0.25, -0.25, 0.25,
    ],
  );
  const opposite = windingState(90, mode);
  initial.sections.forEach((item, index) => {
    assert.equal(round(item.current + opposite.sections[index].current), 0);
    assert.ok(sectionPath(item, 0).length >= 12);
  });
  for (let angle = 0; angle < 360; angle += 0.5) {
    const state = windingState(angle, mode);
    assert.equal(state.sections.length, 16);
    assert.equal(state.composites.length, 8);
    assert.ok(state.sections.every((item) => Number.isFinite(item.current)));
    assert.ok(
      state.sections.every((item) => Math.abs(item.current) <= 0.25 + 1e-9),
    );
  }
}

const separatedFrogleg = windingState(0, 'frogleg');
const l1Path = sectionPath(section(separatedFrogleg.sections, 'L1'), 0);
const w8Path = sectionPath(section(separatedFrogleg.sections, 'W8'), 0);
const l7Path = sectionPath(section(separatedFrogleg.sections, 'L7'), 0);
assert.ok(distance(l1Path[2], w8Path[2]) >= 15);
assert.ok(distance(l1Path[2], l7Path[10]) >= 15);

const froglegDiagram = connectionDiagram('frogleg');
const simplexDiagram = connectionDiagram('simplex');
for (const diagram of [froglegDiagram, simplexDiagram]) {
  assert.equal([...diagram.matchAll(/data-topology=/g)].length, 2);
  assert.equal([...diagram.matchAll(/data-lap=/g)].length, 16);
  assert.equal([...diagram.matchAll(/data-wave=/g)].length, 16);
}
assert.match(froglegDiagram, /Frog-Leg 接法/);
assert.match(froglegDiagram, /Wj：Cj → C\(j\+3\)/);
assert.match(simplexDiagram, /Simplex-B 接法/);
assert.match(simplexDiagram, /Lx ∥ W\(x−1\)/);
assert.equal(advanceAngle(359, 1, 18, true), 17);
assert.equal(advanceAngle(45, 1, 18, false), 45);

console.log(
  'Frog-Leg/Simplex model: 4P/8S/8C geometry, two-slot composite pairing, both commutator topologies, brush injection, current reversal and dual diagrams passed.',
);
