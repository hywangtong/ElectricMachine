import test from 'node:test';
import assert from 'node:assert/strict';
import {
  circuit,
  motor,
  speedAtTorque,
  step,
} from '../public/dc-motor-shunt-drive-model.mjs';

function run(mode, setting, initial = 0) {
  let omega = initial;
  for (let i = 0; i < 12000; i++) omega = step(mode, setting, omega, 0.005);
  return omega;
}

await test('armature resistance limits starting current while keeping full excitation', () => {
  const state = circuit('resistance-start', 5.2);
  assert.equal(state.uf, motor.u);
  assert.equal(state.phi, 1);
  assert.ok(Math.abs(state.current - 220 / 6) < 1e-10);
  assert.ok(state.torque > motor.load);
  assert.ok(state.current < circuit('resistance-start', 0).current);
});

await test('common-source voltage reduction loses torque through the field as well', () => {
  const shared = circuit('shared-voltage', 20);
  const separate = circuit('separate-voltage', 20);
  assert.equal(shared.ua, separate.ua);
  assert.equal(shared.current, separate.current);
  assert.ok(Math.abs(shared.torque / separate.torque - 0.2) < 1e-10);
  assert.equal(run('shared-voltage', 20), 0);
  assert.ok(run('separate-voltage', 20) > 0);
});

await test('speed controls preserve their respective circuit constraints and equilibria', () => {
  const natural = circuit('resistance', 0);
  const resistance = circuit('resistance', 2);
  const voltage = circuit('voltage', 70);
  const field = circuit('field', 100);
  assert.equal(resistance.phi, natural.phi);
  assert.equal(voltage.phi, natural.phi);
  assert.equal(field.ua, natural.ua);
  assert.equal(field.uf, natural.uf);
  assert.ok(Math.abs(field.fieldCurrent - 220 / 320) < 1e-10);
  assert.equal(speedAtTorque(resistance, 0), speedAtTorque(natural, 0));
  assert.ok(
    speedAtTorque(voltage, motor.load) < speedAtTorque(natural, motor.load),
  );
  assert.ok(
    speedAtTorque(field, motor.load) > speedAtTorque(natural, motor.load),
  );
  for (const [mode, setting] of [
    ['resistance', 2],
    ['voltage', 70],
    ['field', 100],
  ]) {
    const actual = (run(mode, setting, 160) * 60) / (2 * Math.PI);
    assert.ok(
      Math.abs(actual - speedAtTorque(circuit(mode, setting), motor.load)) < 1,
    );
  }
});

await test('three brakes keep field, oppose forward rotation, and conserve converted power', () => {
  for (const [mode, setting] of [
    ['dynamic', 4],
    ['plugging', 5],
    ['regenerative', 65],
  ]) {
    const state = circuit(mode, setting, 160);
    assert.equal(state.separate, true);
    assert.equal(state.phi, 1);
    assert.ok(state.current < 0);
    assert.ok(state.torque < 0);
    const copper = state.current ** 2 * (motor.ra + state.resistance);
    assert.ok(
      Math.abs(state.ua * state.current - state.torque * 160 - copper) < 1e-8,
    );
  }
  assert.ok(
    circuit('regenerative', 65, 160).ua *
      circuit('regenerative', 65, 160).current <
      0,
  );
});

await test('stopping brakes reach rest, plugging opens at zero, voltage-step regeneration resumes motoring', () => {
  assert.equal(run('dynamic', 4, 160), 0);
  assert.equal(run('plugging', 5, 160), 0);
  assert.equal(circuit('plugging', 5, 0).disconnected, true);
  assert.equal(circuit('plugging', 5, 0).current, 0);
  const final = run('regenerative', 65, 160);
  assert.ok(final > 0 && final < 160);
  assert.ok(circuit('regenerative', 65, final).current > 0);
});
