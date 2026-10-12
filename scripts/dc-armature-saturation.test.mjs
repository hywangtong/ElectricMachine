import assert from 'node:assert/strict';
import {
  ArmatureSaturationSimulation,
  saturationState,
} from '../public/dc-armature-saturation-model.js';

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≈ ${expected}`);
near(saturationState(90, 0).fluxRatio, 1);
near(saturationState(90, 0).emfPeak, 60);
let previous = 1;
for (let current = 1; current <= 100; current++) {
  const state = saturationState(90, current);
  assert.ok(
    state.fluxRatio < previous,
    'nonlinear pole flux strictly decreases with current',
  );
  assert.ok(
    state.gain < state.loss,
    'integrated flux lost exceeds flux gained',
  );
  assert.ok(
    state.increase < state.decrease,
    'equal opposite MMF produces unequal B changes',
  );
  near(state.fluxRatio, 1 + state.gain - state.loss);
  near(state.emfPeak / 60, state.fluxRatio);
  near(state.emf, state.emfPeak);
  near(saturationState(270, current).emf, -state.emfPeak);
  const linear = saturationState(90, current, false);
  near(linear.gain, linear.loss);
  near(linear.fluxRatio, 1);
  near(linear.emfPeak, 60);
  previous = state.fluxRatio;
}
const simulation = new ArmatureSaturationSimulation();
simulation.setArmatureCurrent(100);
simulation.advance(12);
assert.ok(simulation.samples.some((sample) => Math.abs(sample.emf) > 50));
assert.ok(simulation.samples.every((sample) => Math.abs(sample.emf) <= 60));
simulation.paused = true;
const frozen = JSON.stringify(simulation);
simulation.advance(1);
simulation.setArmatureCurrent(0);
simulation.setNonlinear(false);
assert.equal(
  JSON.stringify(simulation),
  frozen,
  'pause freezes animation and controls',
);
simulation.paused = false;
simulation.setNonlinear(false);
simulation.advance(13);
near(simulation.state.emfPeak, 60);
assert.ok(
  simulation.samples.length <= 12 * 120 + 2,
  'scope history is bounded',
);
console.log(
  'Armature saturation: nonlinear flux integral, monotonic emf amplitude, linear cancellation, synchronous pause and bounded history passed.',
);
