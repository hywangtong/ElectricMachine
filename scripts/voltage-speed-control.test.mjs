import assert from 'node:assert/strict';
import test from 'node:test';
import {
  speedEquilibrium,
  speedLoadTorque,
  speedSlope,
} from '../lib/speed-control-model.mjs';
import { voltageEquilibrium } from '../lib/voltage-speed-control-model.mjs';

await test('voltage-controlled intersections satisfy the parallel motor lines and true load laws', () => {
  for (const load of ['constant-torque', 'fan', 'constant-power']) {
    assert.deepEqual(voltageEquilibrium(load, 1), speedEquilibrium(load, 0));
    for (let volts = 22; volts <= 220; volts++) {
      const u = volts / 220;
      const result = voltageEquilibrium(load, u);
      for (const point of [result.stable, result.unstable].filter(Boolean)) {
        assert.ok(
          Math.abs(point.speed + speedSlope(0) * point.torque - u) < 1e-9,
        );
        assert.ok(
          Math.abs(point.torque - speedLoadTorque(load, point.speed)) < 1e-9,
        );
      }
    }
  }
});

await test('reducing voltage gives the correct speed and current trends for all three loads', () => {
  for (const load of ['constant-torque', 'fan', 'constant-power']) {
    const a = voltageEquilibrium(load, 1).stable;
    const c = voltageEquilibrium(load, 0.7).stable;
    assert.ok(c.speed < a.speed);
    if (load === 'constant-torque') assert.equal(c.torque, a.torque);
    if (load === 'fan') assert.ok(c.torque < a.torque);
    if (load === 'constant-power') assert.ok(c.torque > a.torque);
  }
  // Same rated torque: absolute speed drop is fixed while static slip increases.
  const drop = speedSlope(0);
  assert.equal(1 - (1 - drop), 0.7 - (0.7 - drop));
  assert.ok(drop / 0.7 > drop / 1);
});

await test('constant-power control distinguishes overload, critical, and absent equilibrium', () => {
  const critical = Math.sqrt(0.2);
  assert.equal(
    voltageEquilibrium('constant-power', critical).status,
    'critical',
  );
  assert.equal(
    voltageEquilibrium('constant-power', critical - 0.001).status,
    'none',
  );
  assert.equal(voltageEquilibrium('constant-power', 0.1).stable, null);
  assert.ok(voltageEquilibrium('constant-power', 0.5).stable.torque > 1);
  const pair = voltageEquilibrium('constant-power', 0.6);
  for (const [point, sign] of [
    [pair.stable, -1],
    [pair.unstable, 1],
  ]) {
    assert.equal(Math.sign(-1 / speedSlope(0) + 0.5 / point.speed ** 2), sign);
  }
});
