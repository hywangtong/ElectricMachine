import assert from 'node:assert/strict';
import {
  defaults,
  equilibrium,
  readings,
  step,
  derivative,
  parameters,
} from '../public/dc-motor-load-current-model.mjs';

function simulate(input, initial = equilibrium(defaults), duration = 30) {
  let state = initial;
  for (let t = 0; t < duration * 240; t++) state = step(state, input, 1 / 240);
  return state;
}
const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );
const initial = equilibrium(defaults);
for (const voltage of [160, 220, 260]) {
  for (const resistance of [0, 0.5, 2]) {
    for (const load of [6, 18, 30]) {
      const input = { voltage, resistance, load };
      const actual = readings(simulate(input));
      const target = readings(equilibrium(input));
      near(actual.current, load / parameters.k);
      near(actual.torque, load);
      near(actual.speed, target.speed);
      near(voltage, actual.emf + (parameters.ra + resistance) * actual.current);
      assert.ok(actual.speed > 0);
    }
  }
}
for (const input of [
  { ...defaults, voltage: 180 },
  { ...defaults, resistance: 1.8 },
]) {
  const slope = derivative(initial, input);
  assert.ok(
    slope.current < 0,
    'voltage drop / resistance rise first decreases current',
  );
  near(slope.omega, 0);
  const transient = step(initial, input, 1 / 240);
  assert.ok(transient.current < initial.current);
  assert.ok(transient.omega < initial.omega);
  const final = simulate(input);
  near(final.current, initial.current);
  assert.ok(final.omega < initial.omega);
}
const loaded = { ...defaults, load: 27 };
near(derivative(initial, loaded).current, 0);
assert.ok(derivative(initial, loaded).omega < 0);
near(simulate(loaded).current, 22.5);
const fine = simulate({ ...defaults, voltage: 160 }, initial, 1);
let coarse = initial;
for (let i = 0; i < 120; i++)
  coarse = step(coarse, { ...defaults, voltage: 160 }, 1 / 120);
near(fine.current, coarse.current, 1e-5);
near(fine.omega, coarse.omega, 1e-5);
console.log(
  'DC load/current: equilibria, transient causality, load response and timestep convergence passed.',
);
