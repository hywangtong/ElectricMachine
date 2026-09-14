import assert from 'node:assert/strict';
import { motorState, parameters } from '../public/dc-motor-model.js';

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
near(motorState(90).torque, 0.04);
near(motorState(270).torque, -0.04);
for (const angle of [0, 180, 360]) {
  near(motorState(angle).torque, 0);
  near(motorState(angle).current, parameters.I);
  near(motorState(angle).force, 0.2);
  near(motorState(angle, true).current, 0);
}
for (let angle = 0; angle <= 360; angle++) {
  const fixed = motorState(angle),
    switched = motorState(angle, true);
  near(fixed.current, 2);
  near(switched.torque, Math.abs(fixed.torque));
  assert.ok(switched.torque >= 0);
  // Independently compute the z component of r_A x F_A + r_B x F_B.
  const y = parameters.r * Math.sin((angle * Math.PI) / 180);
  near(fixed.torque, 2 * y * parameters.B * fixed.current * parameters.l);
  near(switched.torque, 2 * y * parameters.B * switched.current * parameters.l);
}
assert.equal(motorState(179.9, true).polarity, 1);
assert.equal(motorState(180.1, true).polarity, -1);
assert.equal(motorState(359.9, true).polarity, -1);
assert.equal(motorState(0.1, true).polarity, 1);
console.log(
  'DC motor: fixed current, torque signs, force moments and commutation boundaries passed.',
);
