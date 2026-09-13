import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceField,
  createMagneticState,
  domainDirections,
  sampleCurve,
} from '../public/magnetic-saturation-model.js';

await test('starts exactly at H=B=0 and reset creates a fresh demagnetized state', () => {
  const state = createMagneticState();
  assert.equal(state.field, 0);
  assert.equal(state.b, 0);
  assert.equal(state.magnetization, 0);
  advanceField(state, 3);
  assert.equal(createMagneticState().b, 0);
});

await test('domain arrows cancel initially, align at saturation and retain a net remanent direction', () => {
  for (const m of [0, 0.5, 0.85, -0.85, 1, -1]) {
    const domains = domainDirections(m);
    const horizontal =
      domains.reduce((sum, domain) => sum + domain.cosine, 0) / 24;
    const vertical = domains.reduce((sum, domain) => sum + domain.sine, 0) / 24;
    assert.ok(Math.abs(horizontal - m) < 1e-9);
    assert.ok(Math.abs(vertical) < 1e-9);
  }
  const remanent = domainDirections(0.85);
  assert.ok(remanent.filter((domain) => domain.cosine > 0).length > 12);
  assert.ok(
    remanent.some((domain) => domain.cosine < 0),
    'not all domains retain the old direction',
  );
});

await test('virgin curve is nonlinear, monotonic, and flattens after the knee', () => {
  const points = sampleCurve(0, 3);
  for (let i = 1; i < points.length; i++)
    assert.ok(points[i].b >= points[i - 1].b);
  const b = (h) => points[Math.round(h * 100)].b;
  assert.ok(b(1) > 3 * b(0.2));
  assert.ok(b(1.4) - b(0.4) > 8 * (b(3) - b(2)));
  assert.ok(b(1.6) > 0.96);
});

await test('zero-field remanence has the sign of prior saturation', () => {
  const state = createMagneticState();
  advanceField(state, 3);
  advanceField(state, 0);
  const positive = state.b;
  assert.ok(positive > 0.6);
  advanceField(state, -3);
  advanceField(state, 0);
  assert.ok(state.b < -0.6);
  assert.ok(Math.abs(state.b + positive) < 1e-12);
});

await test('coercivity needs opposite H; major loop is symmetric and closes', () => {
  const descending = sampleCurve(3, -3);
  const ascending = sampleCurve(-3, 3);
  const crossing = descending.reduce((a, b) =>
    Math.abs(a.b) < Math.abs(b.b) ? a : b,
  );
  assert.ok(crossing.h < -0.3);
  assert.ok(Math.abs(crossing.b) < 0.03);
  descending.forEach((point, i) => {
    assert.ok(Math.abs(point.b + ascending[i].b) < 1e-12);
  });
  assert.equal(descending[0].b, ascending.at(-1).b);
});

await test('minor reversal is continuous and preserves return-point memory', () => {
  const state = createMagneticState();
  advanceField(state, 1);
  const before = state.b;
  advanceField(state, 0.9999);
  assert.ok(
    Math.abs(state.b - before) < 0.01,
    'must not jump to the other major branch',
  );
  advanceField(state, 0.3);
  const remanent = state.b;
  advanceField(state, 1);
  assert.ok(Math.abs(state.b - before) < 1e-12);
  assert.ok(remanent > sampleCurve(0, 0.3).at(-1).b);
});

await test('large field steps and small steps reach the same history-dependent state', () => {
  const large = createMagneticState();
  const small = createMagneticState();
  for (const target of [1.7, 0, -0.8, 0.5, -3, 0, 3]) {
    advanceField(large, target);
    sampleCurve(small.field, target, small);
    assert.ok(Math.abs(large.b - small.b) < 1e-12);
  }
});
