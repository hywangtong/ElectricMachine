import assert from 'node:assert/strict';
import {
  defaults,
  equilibrium,
  limits,
  parameters,
  readings,
  step,
} from '../public/dc-generator-experiment-model.mjs';

const near = (actual, expected, tolerance = 1e-8) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );
const sample = (input) => readings(equilibrium(input), input);
for (const field of [0, 60, 200, 400, limits.field]) {
  let lastCurrent = Infinity;
  for (const load of [5, 20, 100, limits.load]) {
    const input = { field, load };
    const actual = sample(input);
    assert.ok(actual.current < lastCurrent);
    lastCurrent = actual.current;
    near(actual.emf, actual.voltage + parameters.ra * actual.current);
    near(actual.emf, parameters.ce * actual.flux * parameters.speed);
    assert.ok(actual.voltage > 0);
    if (load === limits.load) {
      near(actual.current, 0);
      near(actual.voltage, actual.emf);
    } else {
      near(actual.voltage, load * actual.current);
    }
  }
}
const zeroField = { field: limits.field, load: limits.load };
const residual = sample(zeroField);
near(residual.fieldCurrent, 0);
near(residual.b, parameters.br);
assert.ok(
  residual.emf > 0,
  'Rotating with remanence generates open-circuit EMF',
);
near(residual.emf, 13.5);
assert.ok(sample({ ...defaults, field: 0 }).emf > sample(defaults).emf);
assert.ok(sample({ ...defaults, field: 400 }).emf < sample(defaults).emf);
// Positive magnetization saturates: equal current increments give smaller ΔB.
const b = (fieldCurrent) => readings({ fieldCurrent }, defaults).b;
assert.ok(b(2) - b(1.5) < b(0.5) - b(0));
let state = equilibrium(defaults);
const before = state.fieldCurrent;
state = step(state, zeroField, 1 / 240);
assert.ok(state.fieldCurrent > 0 && state.fieldCurrent < before);
for (let i = 0; i < 2400; i++) state = step(state, zeroField, 1 / 240);
near(state.fieldCurrent, 0);
near(readings(state, zeroField).emf, 13.5);
// Exact exponential integration agrees across frame rates and reconnection.
let fine = equilibrium(zeroField);
for (let i = 0; i < 240; i++) fine = step(fine, defaults, 1 / 240);
near(fine.fieldCurrent, step(equilibrium(zeroField), defaults, 1).fieldCurrent);
console.log(
  'Generator: no-load, remanence, saturation, load law and field response passed.',
);
