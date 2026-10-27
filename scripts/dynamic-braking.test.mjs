import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parameters as p,
  initialSpeed,
  brakingPoint,
  equilibriumSpeed,
  advanceSpeed,
  stopTime,
} from '../public/dc-motor-dynamic-braking-model.mjs';

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);

await test('switching preserves speed and EMF, reverses current and torque', () => {
  for (const rb of [2, 5, 10]) {
    const b = brakingPoint(initialSpeed, rb);
    close(b.speed, initialSpeed);
    close(b.emf, p.ua - (p.load / p.ct) * p.ra);
    assert.ok(b.current < 0 && b.torque < 0);
    assert.ok(Math.abs(b.current) <= p.maxCurrent);
    close(b.speed, -((p.ra + rb) / (p.ce * p.ct)) * b.torque);
  }
});

await test('both rotation directions dissipate mechanical energy in resistances', () => {
  for (const n of [-1000, -200, 0, 200, 1000]) {
    const point = brakingPoint(n, 5);
    close(
      (-point.torque * n * 2 * Math.PI) / 60,
      point.heat + point.current ** 2 * p.ra,
    );
    assert.ok(point.torque * n <= 0);
  }
});

await test('passive load stops at O and never reverses; smaller Rb stops faster', () => {
  assert.ok(stopTime(2) < stopTime(5) && stopTime(5) < stopTime(10));
  for (const rb of [2, 5, 10]) {
    close(advanceSpeed(initialSpeed, rb, stopTime(rb), 'stop'), 0);
    close(advanceSpeed(initialSpeed, rb, 60, 'stop'), 0);
    close(advanceSpeed(0, rb, 1, 'stop'), 0);
    assert.ok(advanceSpeed(initialSpeed, rb, stopTime(rb) / 2, 'stop') > 0);
  }
});

await test('weight passes O, reverses, and settles at T = TL in quadrant IV', () => {
  for (const rb of [2, 5, 10]) {
    assert.ok(advanceSpeed(0, rb, 0.1, 'lowering') < 0);
    const nc = equilibriumSpeed(rb);
    const c = brakingPoint(nc, rb);
    assert.ok(nc < 0 && c.emf < 0 && c.current > 0);
    close(c.torque, p.load);
    close(advanceSpeed(initialSpeed, rb, 180, 'lowering'), nc);
  }
  assert.ok(Math.abs(equilibriumSpeed(2)) < Math.abs(equilibriumSpeed(10)));
});

await test('exact dynamics are independent of animation frame step', () => {
  const full = advanceSpeed(initialSpeed, 5, 2, 'lowering');
  let stepped = initialSpeed;
  for (let i = 0; i < 200; i++)
    stepped = advanceSpeed(stepped, 5, 0.01, 'lowering');
  close(stepped, full);
});
