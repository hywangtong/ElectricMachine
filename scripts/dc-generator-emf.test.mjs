import assert from 'node:assert/strict';
import { emfState } from '../public/dc-generator-emf-model.mjs';
import { torqueState } from '../public/dc-motor-torque-model.mjs';

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

for (const polePairs of [1, 2, 3, 4]) {
  for (const speedRpm of [0, 60, 600, 1200]) {
    for (const parallelPathPairs of [1, 2, 4]) {
      const state = emfState(polePairs, { speedRpm, parallelPathPairs });
      const torque = torqueState(polePairs, { parallelPathPairs });
      near(state.emfFromConductors, state.emfFromFormula);
      near(state.emfFromFormula, (384 * speedRpm) / 600);
      // Independent energy-conversion check against the existing torque lesson.
      near(
        state.emfFromFormula * 12,
        (torque.torqueFromFormula * 2 * Math.PI * speedRpm) / 60,
      );
    }
  }
}

near(emfState(1).conductorEmf, (0.04 * 600) / 30);
near(emfState(2, { totalFlux: 0.16 }).emfFromFormula, 768);
near(emfState(2, { turnsPerBranch: 120 }).emfFromFormula, 192);
console.log(
  'DC emf: zero speed, series/parallel paths, flux/speed scaling and EIa = TΩ passed.',
);
