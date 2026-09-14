import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getExperimentState,
  EXPERIMENT_PERIOD,
} from '../components/motor-history-experiment-model.js';

await test('switching current deflects the compass, reversing it reverses deflection', () => {
  assert.equal(getExperimentState(1).current, 0);
  assert.equal(getExperimentState(1).compassAngle, 0);
  assert.equal(getExperimentState(4).current, 1);
  assert.equal(getExperimentState(4).compassAngle, -52);
  assert.equal(getExperimentState(7).compassAngle, 0);
  assert.equal(getExperimentState(9).current, -1);
  assert.equal(getExperimentState(9).compassAngle, 52);
  assert.equal(getExperimentState(11).compassAngle, 0);
});

await test('magnet stops at both ends; only motion causes galvanometer deflection', () => {
  for (const t of [0, 1, 2, 5, 6, 7, 10, 11, 12]) {
    assert.equal(Math.abs(getExperimentState(t).magnetVelocity), 0);
    assert.equal(Math.abs(getExperimentState(t).galvanometerAngle), 0);
  }
  const inward = getExperimentState(3.5);
  const outward = getExperimentState(8.5);
  assert.equal(inward.magnetTravel, outward.magnetTravel);
  assert.ok(inward.galvanometerAngle < 0);
  assert.ok(outward.galvanometerAngle > 0);
  assert.equal(inward.galvanometerAngle, -outward.galvanometerAngle);
  assert.equal(getExperimentState(6).magnetTravel, 78);
});

await test('galvanometer follows velocity, not magnet position', () => {
  const dt = 0.00001;
  for (const t of [2.2, 3, 4.8, 7.2, 8, 9.8]) {
    const derivative =
      (getExperimentState(t + dt).magnetTravel -
        getExperimentState(t - dt).magnetTravel) /
      (2 * dt);
    assert.ok(
      Math.abs(derivative - getExperimentState(t).magnetVelocity) < 1e-6,
    );
  }
});

await test('rotating wire traces a circular orbit projected into the liquid surface', () => {
  for (let t = 0; t < 16; t += 0.05) {
    const { orbitX, orbitY } = getExperimentState(t);
    const radius = ((orbitX - 136) / 43) ** 2 + ((orbitY - 148) / 12) ** 2;
    assert.ok(Math.abs(radius - 1) < 1e-12);
  }
  assert.ok(getExperimentState(1).orbitX < 136);
  assert.ok(getExperimentState(3).orbitX > 136);
});

await test('loop boundaries are continuous and all outputs remain bounded', () => {
  assert.deepEqual(
    getExperimentState(0),
    getExperimentState(EXPERIMENT_PERIOD),
  );
  for (let t = 0; t < 24; t += 0.01) {
    const state = getExperimentState(t);
    assert.ok(state.magnetTravel >= 0 && state.magnetTravel <= 78);
    assert.ok(Math.abs(state.galvanometerAngle) <= 34);
    assert.ok(Math.abs(state.compassAngle) <= 52);
    for (const value of Object.values(state)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value));
    }
  }
});
