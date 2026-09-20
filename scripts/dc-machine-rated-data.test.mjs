import assert from 'node:assert/strict';
import { ratedMetrics } from '../public/dc-machine-rated-data-model.mjs';

assert.deepEqual(Object.keys(ratedMetrics), [
  'power',
  'voltage',
  'current',
  'speed',
  'efficiency',
]);

for (const [name, metric] of Object.entries(ratedMetrics)) {
  for (const machine of ['motor', 'generator']) {
    const labels = metric[machine];
    assert.ok(
      Object.values(labels).some(Boolean),
      `${name}: ${machine} has a mapped location`,
    );
  }
}

assert.equal(ratedMetrics.power.detail, 'power');
assert.equal(ratedMetrics.efficiency.detail, 'efficiency');
assert.match(ratedMetrics.power.motor.shaft, /Pₙ/);
assert.match(ratedMetrics.power.generator.electrical, /Pₙ.*UₙIₙ/);
assert.match(ratedMetrics.efficiency.generator.shaft, /P轴入,ₙ/);
assert.match(ratedMetrics.speed.motor.shaft, /nₙ/);
assert.match(ratedMetrics.speed.generator.shaft, /nₙ/);

console.log('Rated-data mappings: five selectors and both machines verified.');
