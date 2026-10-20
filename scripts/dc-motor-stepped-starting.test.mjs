import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  automaticState,
  cutSpeeds,
  duration,
  emfConstant,
  loadCurrent,
  lowerCurrent,
  masks,
  motor,
  overloadCurrent,
  phases,
  sections,
  speedAtCurrent,
  stateAt,
  torqueConstant,
  upperCurrent,
} from '../public/dc-motor-stepped-starting-model.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
await test('all 16 switch combinations map to distinct characteristics and obey voltage balance', () => {
  const resistances = new Set();
  for (let mask = 0; mask < 16; mask += 1) {
    const atRest = stateAt(mask);
    resistances.add(atRest.resistance.toFixed(8));
    near(speedAtCurrent(mask, 0), motor.voltage / emfConstant);
    for (const speed of [0, 500, 1000, 1500]) {
      const state = stateAt(mask, speed);
      near(state.emf + state.current * state.total, motor.voltage);
      near(speedAtCurrent(mask, state.current), speed);
      near(stateAt(mask, speed, false).current, 0);
    }
    for (let i = 0; i < 4; i += 1) {
      const after = stateAt(mask ^ (1 << i), 500);
      near(Math.abs(after.resistance - atRest.resistance), sections[i]);
      near(after.speed, 500);
    }
  }
  assert.equal(resistances.size, 16);
});
await test('four automatic cuts preserve speed and restore current within the reference limits', () => {
  assert.ok(upperCurrent >= 1.5 * motor.ratedCurrent);
  assert.ok(upperCurrent <= 2 * motor.ratedCurrent);
  assert.ok(lowerCurrent >= 1.1 * loadCurrent);
  assert.ok(lowerCurrent <= 1.2 * loadCurrent);
  assert.ok(loadCurrent < lowerCurrent);
  assert.ok(lowerCurrent < upperCurrent);
  assert.ok(upperCurrent < overloadCurrent);
  near(
    (upperCurrent * torqueConstant) / (motor.ratedCurrent * torqueConstant),
    1.9,
  );
  cutSpeeds.forEach((speed, i) => {
    const before = stateAt(masks[i], speed);
    const after = stateAt(masks[i + 1], speed);
    near(before.current, lowerCurrent);
    near(after.current, upperCurrent);
    near(before.speed, after.speed);
    near(before.resistance - after.resistance, sections[3 - i]);
  });
  let boundary = 0;
  for (const phase of phases) {
    boundary += phase.duration;
    near(automaticState(boundary - 1e-9).speed, automaticState(boundary).speed);
  }
});
await test('full automatic trajectory accelerates with bounded current and ends at load equilibrium', () => {
  let previousSpeed = 0;
  let previousMask = 0;
  for (let i = 0; i <= 5000; i += 1) {
    const state = automaticState((duration * i) / 5000);
    near(state.emf + state.current * state.total, motor.voltage);
    assert.ok(state.speed >= previousSpeed - 1e-8);
    assert.ok(state.current <= upperCurrent + 1e-8);
    assert.ok(state.torque < overloadCurrent * torqueConstant);
    assert.ok(state.current >= loadCurrent - 1e-8);
    assert.equal(state.mask | previousMask, state.mask);
    previousSpeed = state.speed;
    previousMask = state.mask;
  }
  const end = automaticState(duration);
  assert.equal(end.kind, 'complete');
  assert.equal(end.mask, 15);
  near(end.resistance, 0);
  near(end.speed, 1500);
  near(end.current, loadCurrent);
  near(end.emf, 205);
});
