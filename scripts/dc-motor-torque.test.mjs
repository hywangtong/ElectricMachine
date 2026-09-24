import assert from 'node:assert/strict';
import {
  torqueParameters,
  torqueState,
} from '../public/dc-motor-torque-model.mjs';

const near = (actual, expected, tolerance = 1e-12) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );

for (const polePairs of [1, 2, 3, 4]) {
  const state = torqueState(polePairs);
  assert.equal(state.poleCount, 2 * polePairs);
  near(state.perPoleFlux, torqueParameters.totalFlux / (2 * polePairs));
  assert.equal(
    state.totalConductors,
    4 * torqueParameters.parallelPathPairs * torqueParameters.turnsPerBranch,
  );
  near(
    state.conductorCurrent,
    torqueParameters.armatureCurrent / (2 * torqueParameters.parallelPathPairs),
  );
  near(state.torqueFromConductors, state.torqueFromFormula);
  near(
    state.torqueFromFormula,
    (torqueParameters.turnsPerBranch / Math.PI) *
      torqueParameters.totalFlux *
      torqueParameters.armatureCurrent,
  );
}

assert.throws(() => torqueState(0), RangeError);
assert.throws(() => torqueState(1.5), RangeError);
assert.throws(() => torqueState(1, { totalFlux: 0 }), RangeError);

console.log(
  'DC motor torque: conductor count, flux-per-pole split and torque identities passed.',
);
