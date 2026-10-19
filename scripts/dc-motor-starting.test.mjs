import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  commutation,
  motor,
  operatingPoint,
} from '../public/dc-motor-starting-model.mjs';

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
}
await test('open armature and stationary starting state', () => {
  const open = operatingPoint('direct', 0, false);
  near(open.current, 0);
  near(open.emf, 0);
  const start = operatingPoint('direct', 0);
  near(start.speed, 0);
  near(start.emf, 0);
  near(start.current, 220);
  near(start.armatureDrop, start.voltage);
  assert.ok(start.ratio > 10 && start.ratio < 20);
});
await test('voltage and series-resistance starting limit the same starting current', () => {
  const voltage = operatingPoint('voltage', 0);
  const resistance = operatingPoint('resistance', 0);
  near(voltage.voltage, 30);
  near(voltage.current, 2 * motor.ratedCurrent);
  near(resistance.current, 2 * motor.ratedCurrent);
  near(resistance.externalResistance, 220 / 30 - 1);
  near(resistance.armatureDrop, 30);
  near(resistance.externalDrop, 190);
});
await test('every trajectory obeys voltage balance and reaches the same rated state', () => {
  for (const mode of ['direct', 'voltage', 'resistance']) {
    let previousEmf = 0;
    let previousCurrent = Infinity;
    for (let step = 0; step <= 140; step += 1) {
      const state = operatingPoint(mode, step / 10);
      near(state.voltage, state.emf + state.armatureDrop + state.externalDrop);
      assert.ok(state.emf >= previousEmf);
      assert.ok(state.current <= previousCurrent + 1e-8);
      if (mode !== 'direct') assert.ok(state.current <= 30 + 1e-8);
      previousEmf = state.emf;
      previousCurrent = state.current;
    }
    const final = operatingPoint(mode, 14);
    near(final.current, motor.ratedCurrent);
    near(final.speed, motor.ratedSpeed);
    near(final.externalResistance, 0);
  }
});
await test('no commutation at rest; brush bridging and high-current sparks are distinct', () => {
  assert.deepEqual(commutation(0, 220, 0), {
    bridging: false,
    sparking: false,
  });
  assert.deepEqual(commutation(15, 220, 100), {
    bridging: true,
    sparking: false,
  });
  assert.deepEqual(commutation(25, 220, 100), {
    bridging: false,
    sparking: true,
  });
  assert.equal(commutation(25, 30, 100).sparking, false);
  for (let angle = 0; angle < 360; angle += 1)
    assert.equal(commutation(angle, 220, 0).sparking, false);
});
