import assert from 'node:assert/strict';
import {
  parameters as p,
  loads,
  initialState,
  readings,
  trajectory,
  stallTorque,
  characteristic,
  derivative,
  step,
} from '../public/dc-motor-field-loss-model.mjs';

for (const load of Object.values(loads)) {
  const initial = initialState(load);
  const value = readings(initial);
  assert.ok(Math.abs(value.torque - load) < 1e-10);
  assert.ok(Math.abs(p.voltage - value.emf - initial.current) < 1e-10);
  const rate = derivative(initial, load, 0.001);
  assert.ok(Math.abs(rate.current) < 1e-10);
  assert.ok(Math.abs(rate.omega) < 1e-10);
  assert.ok(
    rate.flux < 0,
    'field starts decaying without jumping speed/current',
  );
}
for (const fraction of [0.02, 0.05, 0.08]) {
  const residual = p.flux * fraction;
  assert.ok(stallTorque(residual) > loads.light);
  assert.ok(stallTorque(residual) < loads.heavy);
  assert.ok(characteristic(residual, loads.heavy) < 0);
  assert.ok(characteristic(residual, loads.light) > p.dangerSpeed);
  const light = trajectory(loads.light, fraction);
  const heavy = trajectory(loads.heavy, fraction);
  assert.equal(light.outcome, 'overspeed');
  assert.equal(heavy.outcome, 'stalled');
  const stopped = heavy.samples.at(-1);
  assert.equal(stopped.speed, 0);
  assert.ok(stopped.current > 219.5, 'stall current tends to Ua/Ra');
  assert.ok(
    stopped.torque < loads.heavy,
    'large current cannot restore lost flux',
  );
  assert.ok(heavy.samples.every((sample) => sample.omega >= 0));
  assert.ok(light.samples.some((sample) => sample.torque > loads.light));
  for (const sample of light.samples.concat(heavy.samples)) {
    assert.ok(
      Math.abs(sample.emf * sample.current - sample.torque * sample.omega) <
        1e-7,
    );
  }
}
// At fixed flux the quasi-steady curve is the same n–T relation as last slide.
for (const flux of [0.02, 0.01, 0.001]) {
  for (const torque of [0, stallTorque(flux) / 2, stallTorque(flux)]) {
    const speed = characteristic(flux, torque);
    const emf = p.ce * flux * speed;
    assert.ok(Math.abs(p.voltage - emf - torque / (p.ct * flux)) < 1e-9);
  }
}
// Convergence away from the passive-load stopping discontinuity.
function run(dt) {
  let state = initialState(loads.heavy);
  for (let i = 0; i < Math.round(0.5 / dt); i++)
    state = step(state, loads.heavy, 0.001, dt);
  return state;
}
const fine = run(1 / 600);
const coarse = run(1 / 300);
for (const key of ['current', 'omega', 'flux'])
  assert.ok(Math.abs(fine[key] - coarse[key]) < 1e-5);
console.log(
  'Field loss: continuity, both load outcomes, stall current, energy identity, curves and convergence passed.',
);
