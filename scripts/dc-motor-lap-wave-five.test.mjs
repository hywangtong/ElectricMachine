import assert from 'node:assert/strict';
import {
  ARMATURE_CURRENT,
  POLE_COUNT,
  SEGMENT_COUNT,
  SLOT_COUNT,
  advanceAngle,
  brushCount,
  commutatorAngle,
  coils,
  sectionPath,
  windingSections,
  windingState,
} from '../public/dc-motor-lap-wave-five-model.js';
import { connectionDiagram } from '../public/dc-motor-lap-wave-five-diagram.js';

const round = (value) => Math.round(value * 1e9) / 1e9;

assert.equal(SLOT_COUNT, 5);
assert.equal(SEGMENT_COUNT, 5);
assert.equal(POLE_COUNT, 4);
assert.equal(brushCount('lap'), 4);
assert.equal(brushCount('wave'), 2);
assert.deepEqual(
  coils.map((coil) => [`Q${coil.id}`, coil.slots.map((slot) => slot + 1)]),
  [
    ['Q1', [1, 2]],
    ['Q2', [2, 3]],
    ['Q3', [3, 4]],
    ['Q4', [4, 5]],
    ['Q5', [5, 1]],
  ],
);

const lap = windingSections('lap');
const wave = windingSections('wave');
assert.equal(lap.length, 5);
assert.equal(wave.length, 5);
for (let index = 0; index < 5; index++) {
  assert.deepEqual(lap[index].terminals, [index, (index + 1) % 5]);
  assert.deepEqual(wave[index].terminals, [index, (index + 2) % 5]);
  assert.deepEqual(lap[index].slots, [index, (index + 1) % 5]);
  assert.deepEqual(wave[index].slots, [index, (index + 1) % 5]);
  const lapPath = sectionPath(lap[index], 0);
  const wavePath = sectionPath(wave[index], 0);
  assert.ok(lapPath.length >= 14);
  assert.ok(wavePath.length >= 14);
  const endLeadLength = (path) =>
    Math.hypot(...path.at(-1).map((value, axis) => value - path.at(-2)[axis]));
  assert.deepEqual(lapPath[0], wavePath[0]);
  assert.ok(endLeadLength(wavePath) < endLeadLength(lapPath));
}
assert.equal(commutatorAngle(2, 0), 108);

for (const mode of ['lap', 'wave']) {
  const brushTotal = brushCount(mode);
  const signs = Array.from({ length: 5 }, () => new Set());
  for (let angle = 0; angle < 360; angle += 0.5) {
    const state = windingState(angle, mode);
    assert.equal(state.poles.length, 4);
    assert.equal(state.brushes.length, brushTotal);
    assert.equal(state.sections.length, 5);
    assert.equal(state.coils.length, 5);
    assert.ok(state.sections.every((item) => Number.isFinite(item.current)));
    assert.ok(
      state.sections.every(
        (item) => Math.abs(item.current) <= ARMATURE_CURRENT + 1e-9,
      ),
    );
    const positiveSupply = state.sections.reduce((total, item) => {
      const [start, end] = item.terminals;
      if (state.potentials[start] === 1) total += item.current;
      if (state.potentials[end] === 1) total -= item.current;
      return total;
    }, 0);
    assert.ok(
      round(positiveSupply) === 0 ||
        round(positiveSupply) === ARMATURE_CURRENT,
    );
    state.sections.forEach((item, index) => {
      if (item.current > 1e-6) signs[index].add('positive');
      if (item.current < -1e-6) signs[index].add('negative');
    });
  }
  signs.forEach((values) =>
    assert.deepEqual(
      [...values].sort((a, b) => a.localeCompare(b)),
      ['negative', 'positive'],
    ),
  );
}

const lapDiagram = connectionDiagram('lap');
const waveDiagram = connectionDiagram('wave');
for (const diagram of [lapDiagram, waveDiagram]) {
  assert.equal([...diagram.matchAll(/data-topology=/g)].length, 2);
  assert.equal([...diagram.matchAll(/data-lap=/g)].length, 5);
  assert.equal([...diagram.matchAll(/data-wave=/g)].length, 5);
  assert.equal([...diagram.matchAll(/>C[1-5]</g)].length, 10);
}
assert.match(lapDiagram, /Yc = 1 · A = 4/);
assert.match(waveDiagram, /Yc = 2 · A = 2/);
assert.equal(advanceAngle(359, 1, 18, true), 17);
assert.equal(advanceAngle(45, 1, 18, false), 45);

console.log(
  'Lap/Wave model: 4P/5S/5C geometry, one-slot coils, Yc=1/Yc=2 commutator topology, mode-specific brushes and current reversal passed.',
);
