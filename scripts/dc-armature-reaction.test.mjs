import assert from 'node:assert/strict';
import {
  ArmatureReactionSimulation,
  armatureReactionParameters,
  armatureReactionState,
  clampArmatureCurrent,
  commutationState,
} from '../public/dc-armature-reaction-model.js';

const near = (actual, expected, tolerance = 1e-9) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );

assert.equal(clampArmatureCurrent(-1), 0);
assert.equal(clampArmatureCurrent(150), 100);
assert.equal(
  clampArmatureCurrent(Number.NaN),
  armatureReactionParameters.defaultCurrent,
);

assert.equal(commutationState(0).shorted, true);
assert.equal(commutationState(3.9).shorted, true);
assert.equal(commutationState(5).shorted, false);
assert.equal(commutationState(15).shorted, false);
assert.equal(commutationState(29).shorted, true);
assert.deepEqual(commutationState(0).rightSegments, [11, 0]);
assert.deepEqual(commutationState(0).leftSegments, [5, 6]);
assert.deepEqual(commutationState(30).rightSegments, [10, 11]);
assert.equal(armatureReactionParameters.rpm, 5);

assert.equal(
  armatureReactionState(0, 55, true).trackedCoilShorted,
  true,
  'C1/C2 seam is centred under the right brush when A-B is on the geometric centreline',
);
assert.equal(armatureReactionState(30, 55, true).trackedCoilShorted, false);
assert.equal(
  armatureReactionState(150, 55, true).trackedCoilShorted,
  false,
  'another coil may commutate without raising q_AB',
);
assert.equal(
  armatureReactionState(180, 55, true).trackedCoilShorted,
  true,
  'C1/C2 seam is centred under the left brush after half a revolution',
);
assert.equal(armatureReactionState(330, 55, true).trackedCoilShorted, false);

const noLoad = armatureReactionState(90, 0, true);
near(noLoad.armatureField, 0);
near(noLoad.neutralShift, 0);
near(noLoad.neutralAngle, 0);
near(noLoad.emf, armatureReactionParameters.baseEmf);

const loaded = armatureReactionState(0, 100, true);
near(loaded.armatureField, armatureReactionParameters.armatureFieldRatio);
assert.ok(loaded.neutralShift > 0 && loaded.neutralShift < 90);
near(loaded.neutralAngle, -loaded.fieldAngle);
near(
  loaded.resultantField,
  Math.hypot(1, armatureReactionParameters.armatureFieldRatio),
);
assert.notEqual(loaded.emf, 0, 'armature field shifts the tracked-coil emf');
near(armatureReactionState(loaded.neutralAngle, 100, true).emf, 0, 1e-8);
near(armatureReactionState(loaded.neutralAngle + 180, 100, true).emf, 0, 1e-8);

const fieldOpen = armatureReactionState(90, 0, false);
near(fieldOpen.resultantField, 0);
near(fieldOpen.emf, 0);
assert.equal(fieldOpen.neutralShift, null);
assert.equal(fieldOpen.neutralAngle, null);

const simulation = new ArmatureReactionSimulation();
const initialAngle = simulation.angle;
simulation.advance(0.25);
near(
  simulation.angle,
  (initialAngle + armatureReactionParameters.rpm * 6 * 0.25) % 360,
);
assert.ok(simulation.samples.length > 1);
assert.ok(simulation.samples.every((sample) => 'shorted' in sample));
const emfBeforePause = simulation.state.emf;
assert.notEqual(emfBeforePause, 0);
simulation.paused = true;
const frozen = JSON.stringify(simulation);
simulation.advance(12);
assert.equal(JSON.stringify(simulation), frozen);
assert.equal(simulation.state.emf, emfBeforePause);
simulation.setArmatureCurrent(0);
simulation.setFieldEnabled(false);
assert.equal(
  JSON.stringify(simulation),
  frozen,
  'pause locks parameter controls',
);
simulation.paused = false;
simulation.advance(0.25);
near(
  simulation.angle,
  (initialAngle + armatureReactionParameters.rpm * 6 * 0.5) % 360,
);
simulation.setArmatureCurrent(100);
assert.equal(simulation.armatureCurrent, 100);
simulation.setFieldEnabled(false);
assert.equal(simulation.fieldEnabled, false);
simulation.advance(20);
assert.ok(
  simulation.samples.length <=
    armatureReactionParameters.windowSeconds * 120 + 2,
  'scope history remains bounded',
);
assert.ok(
  simulation.samples[1].t >=
    simulation.elapsed - armatureReactionParameters.windowSeconds,
);
assert.ok(simulation.samples.some((sample) => sample.shorted === 1));
assert.ok(simulation.samples.some((sample) => sample.shorted === 0));

console.log(
  'DC armature reaction: field summation, neutral shift, tracked coil C1/C2 commutation flag, 5 rpm speed, synchronized pause snapshot and dual-trace scope history passed.',
);
