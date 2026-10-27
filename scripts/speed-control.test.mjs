import assert from 'node:assert/strict';
import test from 'node:test';
import {
  speedEquilibrium,
  speedLoadTorque,
  speedSlope,
} from '../lib/speed-control-model.mjs';

await test('all steady points satisfy both the motor equation and the unclipped load law', () => {
  for (const load of ['constant-torque', 'fan', 'constant-power']) {
    for (let resistance = 0; resistance <= 4; resistance += 0.1) {
      const result = speedEquilibrium(load, resistance);
      for (const point of [result.stable, result.unstable].filter(Boolean)) {
        assert.ok(
          Math.abs(point.speed + speedSlope(resistance) * point.torque - 1) <
            1e-9,
        );
        assert.ok(
          Math.abs(point.torque - speedLoadTorque(load, point.speed)) < 1e-9,
        );
      }
    }
  }
});

await test('constant-power load retains the hyperbola and has two, one, or no intersections', () => {
  assert.equal(speedLoadTorque('constant-power', 0), Infinity);
  assert.equal(speedLoadTorque('constant-power', 0.1), 5);
  const normal = speedEquilibrium('constant-power', 1);
  assert.equal(normal.status, 'stable');
  assert.ok(normal.stable.speed > normal.unstable.speed);
  for (const [point, sign] of [
    [normal.stable, -1],
    [normal.unstable, 1],
  ]) {
    const derivative = -1 / speedSlope(1) + 0.5 / point.speed ** 2;
    assert.equal(Math.sign(derivative), sign);
  }
  assert.equal(speedEquilibrium('constant-power', 2).status, 'critical');
  assert.equal(speedEquilibrium('constant-power', 2.1).status, 'none');
  assert.equal(speedEquilibrium('constant-power', 4).stable, null);
});

await test('adding resistance lowers speed with the correct torque trend for each load', () => {
  for (const load of ['constant-torque', 'fan', 'constant-power']) {
    const a = speedEquilibrium(load, 0).stable;
    const c = speedEquilibrium(load, 1).stable;
    assert.ok(c.speed < a.speed);
    if (load === 'constant-torque') assert.equal(c.torque, a.torque);
    if (load === 'fan') assert.ok(c.torque < a.torque);
    if (load === 'constant-power') assert.ok(c.torque > a.torque);
    // b lies on the new motor line while speed is still n_a.
    const torqueB = (1 - a.speed) / speedSlope(1);
    assert.ok(torqueB < speedLoadTorque(load, a.speed));
    assert.ok(Math.abs(1 - speedSlope(1) * torqueB - a.speed) < 1e-9);
    // Armature power balance and efficiency; no mechanical/field losses here.
    assert.ok(Math.abs(c.speed + speedSlope(1) * c.torque - 1) < 1e-9);
  }
});
