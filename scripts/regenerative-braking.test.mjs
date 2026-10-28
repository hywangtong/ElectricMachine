import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parameters as p,
  scenario,
  operatingPoint,
  speedAt,
  timeAt,
  phase,
  loweringResistance,
  minimumResistance,
} from '../public/dc-motor-regenerative-braking-model.mjs';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);

await test('downhill accelerates through zero current into regenerative balance', () => {
  const c = scenario('downhill');
  close(operatingPoint(c.initial, c, true).torque, p.load);
  assert.ok(c.initial < c.noLoad && c.noLoad < c.equilibrium);
  close(operatingPoint(c.noLoad, c).current, 0);
  assert.equal(phase(c.noLoad, c), 'no-load');
  assert.equal(phase(c.equilibrium, c), 'regeneration');
  close(operatingPoint(c.equilibrium, c).torque, -p.load);
  assert.ok(speedAt(c.tau, c) > c.initial);
});

await test('lower voltage and stronger field jump at unchanged speed into regeneration', () => {
  for (const mode of ['voltage', 'field']) {
    const c = scenario(mode);
    const a = operatingPoint(c.initial, c, true);
    const b = operatingPoint(c.initial, c);
    close(a.speed, b.speed);
    close(a.torque, p.load);
    assert.ok(b.emf > b.voltage && b.current < 0 && b.torque < 0);
    if (mode === 'voltage') close(a.emf, b.emf);
    else assert.ok(b.emf > a.emf);
    assert.ok(c.equilibrium < c.noLoad && c.noLoad < c.initial);
    assert.equal(phase(c.initial, c), 'regeneration');
    assert.equal(phase(c.equilibrium, c), 'motor');
    close(operatingPoint(c.equilibrium, c).torque, p.load);
    close(speedAt(timeAt(c.noLoad, c), c), c.noLoad);
  }
});

await test('reversed supply and gravity pass through plugging, reverse starting and regeneration', () => {
  for (const rb of [5, 7, 9]) {
    const c = scenario('lowering', rb);
    const a = operatingPoint(c.initial, c, true);
    const b = operatingPoint(c.initial, c);
    close(a.emf, b.emf);
    assert.equal(phase(c.initial, c), 'plugging');
    assert.equal(phase(0, c), 'zero');
    assert.equal(phase(c.noLoad / 2, c), 'motor');
    assert.equal(phase(c.noLoad, c), 'no-load');
    assert.equal(phase(c.equilibrium, c), 'regeneration');
    assert.ok(c.equilibrium < c.noLoad && c.noLoad < 0);
    close(speedAt(timeAt(0, c), c), 0);
    close(speedAt(timeAt(c.noLoad, c), c), c.noLoad);
    close(operatingPoint(c.equilibrium, c).torque, p.load);
    close(speedAt(1000, c), c.equilibrium);
    assert.ok(Math.abs(b.current) <= p.maxCurrent);
  }
});

await test('energy balances and torque power agree for every running quadrant', () => {
  for (const mode of ['downhill', 'voltage', 'field', 'lowering']) {
    const c = scenario(mode);
    for (const time of [0, c.tau / 2, c.tau, 4 * c.tau, 20 * c.tau]) {
      const speed = speedAt(time, c);
      const s = operatingPoint(speed, c);
      close(s.sourcePower, s.convertedPower + s.heat);
      close(s.convertedPower, (s.torque * speed * 2 * Math.PI) / 60);
      if (phase(speed, c) === 'regeneration') {
        assert.ok(s.torque * speed < 0 && s.returnedPower > 0);
        close(-s.convertedPower, s.returnedPower + s.heat);
      }
      const derivative =
        (-(c.initial - c.equilibrium) / c.tau) * Math.exp(-time / c.tau);
      close((p.inertia * derivative * 2 * Math.PI) / 60, s.torque - c.load);
    }
  }
});

await test('resistance uses e for speed choice and b for initial current check', () => {
  for (const rb of [5, 7, 9]) {
    const c = scenario('lowering', rb);
    close(loweringResistance(Math.abs(c.equilibrium)), rb);
    const eb = p.ce * c.initial;
    const minimum = minimumResistance(eb);
    close((p.ua + eb) / (p.ra + minimum), p.maxCurrent);
    assert.ok((p.ua + eb) / (p.ra + minimum - 0.1) > p.maxCurrent);
  }
  assert.ok(
    Math.abs(scenario('lowering', 9).equilibrium) >
      Math.abs(scenario('lowering', 5).equilibrium),
  );
  close(
    loweringResistance(1800, 40, 3),
    (p.ct * (p.ce * 1800 - p.ua)) / 37 - p.ra,
  );
});
