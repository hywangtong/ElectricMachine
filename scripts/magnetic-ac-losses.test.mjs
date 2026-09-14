import assert from 'node:assert/strict';
import test from 'node:test';
import {
  magneticSample,
  cycleSamples,
  cycleEnergy,
  eddySample,
  loopArea,
} from '../public/magnetic-ac-losses-model.js';

await test('settled hysteresis loop closes, has remanence and opposite coercivity', () => {
  const samples = cycleSamples(400);
  assert.ok(Math.abs(samples[0].b - samples.at(-1).b) < 1e-12);
  assert.ok(magneticSample(Math.PI, 400).b > 0.7);
  assert.ok(magneticSample(0, 400).b < -0.7);
  const crossing = samples.findIndex(
    (s, i) => i > 0 && s.b >= 0 && samples[i - 1].b < 0,
  );
  assert.ok(
    samples[crossing].h > 0,
    'ascending branch needs positive H to erase negative remanence',
  );
  for (let i = 0; i < 360; i++) {
    assert.ok(Math.abs(samples[i].b + samples[i + 360].b) < 1e-12);
  }
});

await test('loop is continuous at reversals and saturation flattens its tips', () => {
  for (const amplitude of [0, 30, 100, 400, 600]) {
    for (const phase of [Math.PI / 2, Math.PI * 1.5]) {
      const left = magneticSample(phase - 1e-6, amplitude);
      const right = magneticSample(phase + 1e-6, amplitude);
      assert.ok(Math.abs(left.b - right.b) < 1e-6);
    }
  }
  const high = magneticSample(Math.PI / 2, 600).b;
  const middle = magneticSample(Math.PI / 2, 400).b;
  assert.ok(high > middle && high - middle < 0.03);
});

await test('shaded-loop integral is positive, converges, grows with amplitude and vanishes at zero', () => {
  const low = cycleEnergy(cycleSamples(100));
  const high = cycleEnergy(cycleSamples(400));
  assert.ok(high > low && low > 0);
  assert.equal(cycleEnergy(cycleSamples(0)), 0);
  assert.ok(
    Math.abs(high - cycleEnergy(cycleSamples(400, 2880))) / high < 0.001,
  );
});

await test('induced emf follows the signed flux derivative, including zero and peak limits', () => {
  for (const f of [0, 0.6, 3]) {
    for (const amplitude of [0, 1, 1.5]) {
      for (const phase of [0, 0.4, Math.PI / 2, Math.PI, 4.6]) {
        const delta = 1e-6;
        const numerical =
          ((eddySample(phase + delta, f, amplitude).b -
            eddySample(phase - delta, f, amplitude).b) /
            (2 * delta)) *
          2 *
          Math.PI *
          f;
        assert.ok(
          Math.abs(eddySample(phase, f, amplitude).e + loopArea * numerical) <
            1e-9,
        );
      }
    }
  }
  assert.ok(
    eddySample(0, 1, 1).e < 0,
    'increasing upward B induces clockwise current',
  );
  assert.ok(eddySample(Math.PI, 1, 1).e > 0);
  assert.ok(Math.abs(eddySample(Math.PI / 2, 1, 1).e) < 1e-12);
  assert.ok(
    Math.abs(eddySample(0, 2, 1).e / eddySample(0, 1, 1).e - 2) < 1e-12,
  );
});
