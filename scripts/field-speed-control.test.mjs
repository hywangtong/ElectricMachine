import assert from 'node:assert/strict';
import test from 'node:test';
import { fieldEquilibrium } from '../lib/field-speed-control-model.mjs';
import {
  speedEquilibrium,
  speedLoadTorque,
} from '../lib/speed-control-model.mjs';

const loads = ['constant-torque', 'fan', 'constant-power'];
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

await test('field-controlled intersections obey motor voltage, torque and load laws throughout the slider', () => {
  for (const load of loads) {
    const rated = fieldEquilibrium(load, 1);
    near(rated.stable.speed, speedEquilibrium(load, 0).stable.speed);
    near(rated.stable.torque, speedEquilibrium(load, 0).stable.torque);
    for (let percent = 50; percent <= 100; percent++) {
      const f = percent / 100;
      const result = fieldEquilibrium(load, f);
      for (const point of [result.stable, result.unstable].filter(Boolean)) {
        near(f * point.speed + 0.1 * (point.torque / f), 1);
        near(point.torque, speedLoadTorque(load, point.speed));
      }
      near(result.current * f, result.stable.torque);
    }
  }
});

await test('weakening raises speed; constant torque and fan loads exceed current limits before constant power does', () => {
  for (const load of loads) {
    const a = fieldEquilibrium(load, 1);
    const c = fieldEquilibrium(load, 0.5);
    assert.ok(c.stable.speed > a.stable.speed);
    if (load === 'constant-torque') {
      near(c.stable.torque, a.stable.torque);
      near(c.current, 1.6);
    } else if (load === 'fan') {
      assert.ok(c.stable.torque > a.stable.torque);
      assert.ok(c.current > 3);
    } else {
      near(c.stable.torque, a.stable.torque / 2);
      near(c.current, a.current);
      near(c.stable.speed * c.stable.torque, 0.5);
    }
  }
});

await test('constant-power branch stability and the rated-current constant-power envelope agree with the summary', () => {
  for (const f of [0.5, 0.75, 1]) {
    const result = fieldEquilibrium('constant-power', f);
    for (const [point, sign] of [
      [result.stable, -1],
      [result.unstable, 1],
    ]) {
      assert.equal(Math.sign(-(f ** 2) / 0.1 + 0.5 / point.speed ** 2), sign);
    }
    const noLoad = 1 / f;
    const fullLoadSpeed = noLoad - (0.1 / f ** 2) * f;
    near((noLoad - fullLoadSpeed) / noLoad, 0.1);
    near(fullLoadSpeed * result.allowedTorque, 0.9);
    // Fixed torque is a different comparison: relative speed drop grows.
    near(((0.1 / f ** 2) * 0.8) / noLoad, 0.08 / f);
  }
  for (const invalid of [0, 0.49, 1.01, NaN, Infinity]) {
    assert.throws(() => fieldEquilibrium('fan', invalid), RangeError);
  }
});
