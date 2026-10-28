import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parameters as p,
  initialSpeed,
  operatingPoint,
  equilibriumSpeed,
  zeroTime,
  speedAt,
  minimumStopResistance,
  loweringResistance,
} from '../public/dc-motor-plugging-braking-model.mjs';

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);

await test('voltage reversal preserves speed/EMF but reverses current/torque', () => {
  for (const rb of [5, 7, 9]) {
    const b = operatingPoint(initialSpeed, rb, 'stop');
    close(b.speed, initialSpeed);
    close(b.emf, p.ua - (p.load / p.ct) * p.ra);
    assert.ok(b.current < 0 && b.torque < 0);
    assert.ok(-b.current <= p.maxCurrent);
    close(b.speed, -p.ua / p.ce - ((p.ra + rb) / (p.ce * p.ct)) * b.torque);
  }
  close(
    -operatingPoint(initialSpeed, minimumStopResistance(), 'stop').current,
    p.maxCurrent,
  );
});

await test('zero-speed cutoff stops; without cutoff c leads to reverse motoring', () => {
  for (const rb of [5, 7, 9]) {
    const crossing = zeroTime(rb, 'stop');
    assert.ok(speedAt(crossing / 2, rb, 'stop') > 0);
    close(speedAt(crossing, rb, 'stop'), 0);
    close(speedAt(60, rb, 'stop'), 0);
    const c = operatingPoint(0, rb, 'stop');
    assert.ok(c.current < 0 && c.torque < -p.load);
    const reverse = speedAt(60, rb, 'stop', false);
    assert.ok(reverse < 0);
    const d = operatingPoint(equilibriumSpeed(rb, 'stop', true), rb, 'stop');
    close(d.torque, -p.load);
    assert.ok(d.convertedPower > 0);
  }
  assert.ok(zeroTime(5, 'stop') < zeroTime(9, 'stop'));
});

await test('lowering retains voltage/current/torque direction and passes c to d', () => {
  for (const rb of [12, 16, 20]) {
    const b = operatingPoint(initialSpeed, rb, 'lowering');
    assert.ok(b.current > 0 && b.torque < p.load);
    const c = operatingPoint(0, rb, 'lowering');
    assert.ok(c.torque > 0 && c.torque < p.load);
    close(speedAt(zeroTime(rb, 'lowering'), rb, 'lowering'), 0);
    assert.ok(speedAt(zeroTime(rb, 'lowering') + 1, rb, 'lowering') < 0);
    const nd = equilibriumSpeed(rb, 'lowering');
    const d = operatingPoint(nd, rb, 'lowering');
    assert.ok(nd < 0 && d.emf < 0 && d.current > 0);
    close(d.torque, p.load);
    close(d.speed, p.ua / p.ce - ((p.ra + rb) / (p.ce * p.ct)) * d.torque);
    close(loweringResistance(-nd), rb);
    close(speedAt(300, rb, 'lowering'), nd);
  }
  assert.ok(
    Math.abs(equilibriumSpeed(20, 'lowering')) >
      Math.abs(equilibriumSpeed(12, 'lowering')),
  );
});

await test('both plugging states dissipate source plus mechanical power in Ra/Rb', () => {
  for (const [mode, rb, n] of [
    ['stop', 7, initialSpeed],
    ['lowering', 16, -500],
  ]) {
    const point = operatingPoint(n, rb, mode);
    assert.ok(point.sourcePower > 0 && point.convertedPower < 0);
    close(
      point.sourcePower - point.convertedPower,
      point.resistorHeat + point.copperHeat,
    );
    close(point.convertedPower, (point.torque * n * 2 * Math.PI) / 60);
  }
});

await test('insufficient lowering resistance does not falsely produce reversal', () => {
  assert.equal(zeroTime(5, 'lowering'), Infinity);
  assert.ok(speedAt(100, 5, 'lowering') > 0);
  close(speedAt(100, 20, 'stop', false), 0);
});
