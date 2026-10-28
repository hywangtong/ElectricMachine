import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activePower,
  disturbanceEnd,
  minimumSpeed,
  motorTorque,
  stabilityPower,
  stabilityRoots,
  stabilitySlope,
  stabilityTrajectory,
} from '../lib/constant-power-stability.mjs';

void test('both intersections balance torque and have opposite local stability', () => {
  const roots = stabilityRoots();
  for (const [name, speed] of Object.entries(roots)) {
    assert.ok(Math.abs(motorTorque(speed) - stabilityPower / speed) < 1e-12);
    const derivative = -1 / stabilitySlope + stabilityPower / speed ** 2;
    assert.equal(derivative < 0, name === 'stable');
    for (const delta of [-0.001, 0.001]) {
      const force =
        motorTorque(speed + delta) - stabilityPower / (speed + delta);
      assert.equal(force * delta < 0, name === 'stable');
    }
  }
});

void test('stable point returns after either load pulse, with restoring acceleration', () => {
  for (const direction of [-1, 1]) {
    const samples = stabilityTrajectory('stable', direction);
    const initial = samples[0].speed;
    const beforeRelease = samples.find(
      (sample) => sample.seconds === disturbanceEnd,
    );
    assert.ok((beforeRelease.speed - initial) * direction < 0);
    assert.ok(Math.abs(samples.at(-1).speed - initial) < 0.0001);
    assert.ok(samples.every((sample) => !sample.stalled));
    assert.equal(activePower(disturbanceEnd, direction), stabilityPower);
  }
});

void test('increased load at unstable point collapses to the low-speed boundary', () => {
  const samples = stabilityTrajectory('unstable', 1);
  assert.ok(samples.at(-1).stalled);
  assert.equal(samples.at(-1).speed, minimumSpeed);
  assert.ok(
    samples.every(
      (sample, index) =>
        index === 0 || sample.speed <= samples[index - 1].speed,
    ),
  );
});

void test('decreased load leaves unstable point and settles on the high-speed branch', () => {
  const samples = stabilityTrajectory('unstable', -1);
  const roots = stabilityRoots();
  const shifted = stabilityRoots(activePower(2, -1)).stable;
  const beforeRelease = samples.find(
    (sample) => sample.seconds === disturbanceEnd,
  );
  assert.ok(beforeRelease.speed > roots.stable);
  assert.ok(Math.abs(beforeRelease.speed - shifted) < 0.003);
  assert.ok(Math.abs(samples.at(-1).speed - roots.stable) < 0.0001);
  assert.ok(
    samples.every((sample) => !sample.stalled && Number.isFinite(sample.speed)),
  );
});
