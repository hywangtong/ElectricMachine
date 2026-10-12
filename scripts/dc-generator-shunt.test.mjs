import assert from 'node:assert/strict';
import {
  defaults,
  emf,
  readings,
  derivative,
  step,
  equilibrium,
  critical,
  externalCurve,
} from '../public/dc-generator-shunt-model.mjs';

const close = (a, b, tolerance = 1e-7) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const normal = equilibrium(defaults);
assert.ok(normal.u > 200);
close(normal.ia, normal.current);
close(normal.u, defaults.rf * normal.current);
close(normal.e, normal.u + defaults.ra * normal.ia);
assert.ok(normal.u < normal.e); // Empty load still draws field current.
const negative = { ...defaults, residual: -defaults.residual };
close(equilibrium(negative).u, -normal.u);
close(equilibrium(negative).current, -normal.current);
close(step(0, negative, 8), -step(0, defaults, 8));
close(step(0, { ...defaults, residual: 0 }, 30), 0);
close(equilibrium({ ...defaults, speed: 0 }).u, 0);
assert.ok(step(1, { ...defaults, speed: 0 }, 1) < 1);
const opposing = equilibrium({ ...defaults, aiding: -1 });
assert.ok(opposing.e > 0 && opposing.e < emf(0, defaults));
assert.ok(equilibrium({ ...defaults, rf: 260 }).u < normal.u / 4);
assert.ok(equilibrium({ ...defaults, ra: 20 }).u < normal.u);
assert.ok(equilibrium({ ...defaults, speed: 500 }).u < normal.u / 10);
const weak = { ...defaults, residual: 0.1 };
assert.ok(step(0, weak, 2) < step(0, defaults, 2));
assert.ok(equilibrium(weak).u > 180);
close(critical(defaults).resistance, 150);
close(critical(defaults).speed, 908);
for (const load of [Infinity, 100, 10, 1, 0.1, 0]) {
  const input = { ...defaults, load };
  const q = equilibrium(input);
  close(q.ia, q.current + q.loadCurrent);
  close(q.u, q.e - input.ra * q.ia);
  close(q.u, input.rf * q.current);
  close(derivative(q.current, input), 0);
  if (load > 0 && load < Infinity) close(q.loadCurrent, q.u / load);
  const r = readings(1, input);
  close(r.u, r.e - input.ra * r.ia);
}
const short = equilibrium({ ...defaults, load: 0 });
close(short.u, 0);
close(short.current, 0);
close(short.ia, emf(0, defaults) / defaults.ra);
const curve = externalCurve(defaults);
const peak = Math.max(...curve.map((p) => p.loadCurrent));
assert.ok(peak > short.ia * 2); // Current falls again after the knee.
for (let i = 1; i < curve.length; i++)
  assert.ok(curve[i].u <= curve[i - 1].u + 1e-8);
let fine = 0;
let coarse = 0;
for (let i = 0; i < 2400; i++) fine = step(fine, defaults, 0.01);
for (let i = 0; i < 400; i++) coarse = step(coarse, defaults, 0.06);
close(fine, coarse, 1e-8);
close(fine, normal.current, 0.0001);
// Every slider extreme remains finite and converges towards the reachable Q.
for (const residual of [-2, -0.1, 0, 0.1, 2]) {
  for (const speed of [0, 500, 1500, 1800]) {
    for (const rf of [20, 150, 300]) {
      for (const ra of [0.1, 20]) {
        for (const aiding of [-1, 1]) {
          const input = { ...defaults, residual, speed, rf, ra, aiding };
          const q = equilibrium(input);
          assert.ok(Object.values(q).every(Number.isFinite));
          close(derivative(q.current, input), 0, 1e-8);
          const actual = step(0, input, 1);
          assert.ok(Number.isFinite(actual));
          assert.ok(actual * residual >= 0);
        }
      }
    }
  }
}
console.log(
  'Shunt generator: feedback, polarity, critical slope, load knee, short circuit and integration checks passed.',
);
