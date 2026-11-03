import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_DURATION,
  transformerFrame,
  transformerMmfArrows,
} from '../public/transformer-working-principle-model.mjs';

await test('open-circuit stages keep secondary current zero while showing induction', () => {
  for (const stage of [0, 1]) {
    for (const time of [0, 3000, 6000, STAGE_DURATION]) {
      const state = transformerFrame(stage, time, Math.PI / 4);
      assert.equal(state.i2, 0);
      assert.equal(state.switchClosed, false);
    }
  }
  assert.equal(transformerFrame(0, 0, 1).trace, 0);
  assert.equal(transformerFrame(0, 6000, 1).trace, 1);
  assert.equal(transformerFrame(1, 0, 1).emf, 0);
  assert.equal(transformerFrame(1, 6000, 1).emf, 1);
});

await test('load closes before demagnetizing tendency and primary compensation', () => {
  assert.equal(transformerFrame(2, 2100, 0).switchClosed, false);
  const demagnetizing = transformerFrame(2, 4500, 0);
  assert.equal(demagnetizing.switchClosed, true);
  assert.equal(demagnetizing.load, 1);
  assert.equal(demagnetizing.compensation, 0);
  assert.ok(demagnetizing.fluxScale < 1);
  const compensating = transformerFrame(2, 6500, 0);
  assert.ok(compensating.deltaI1 > 0);
  assert.ok(compensating.fluxScale > demagnetizing.fluxScale);
});

await test('final periodic state balances load ampere-turns at all phases', () => {
  for (const stage of [2, 3]) {
    for (let index = 0; index < 48; index++) {
      const state = transformerFrame(
        stage,
        STAGE_DURATION,
        (index * Math.PI) / 24,
      );
      assert.equal(state.fluxScale, 1);
      // Diagram uses N2 / N1 = 1/2, so i1 - (N2/N1)i2 = i0.
      assert.ok(Math.abs(state.i1 - 0.5 * state.i2 - state.i0) < 1e-12);
    }
  }
});

await test('main and the two leakage paths are traced in sequence', () => {
  const main = transformerFrame(3, 2800, 1);
  assert.equal(main.trace, 1);
  assert.equal(main.primaryLeak, 0);
  assert.equal(main.secondaryLeak, 0);
  const primary = transformerFrame(3, 5900, 1);
  assert.equal(primary.primaryLeak, 1);
  assert.equal(primary.secondaryLeak, 0);
  assert.equal(transformerFrame(3, 9000, 1).secondaryLeak, 1);
  assert.equal(transformerFrame(3, -1, 1).time, 0);
  assert.equal(transformerFrame(3, 99999, 1).time, STAGE_DURATION);
});

await test('primary MMF arrow includes excitation and both signed arrows retain the magnetizing remainder', () => {
  const unloaded = transformerFrame(2, 0, Math.PI / 4);
  const unloadedArrows = transformerMmfArrows(unloaded);
  assert.ok(unloadedArrows.primaryEnd > unloadedArrows.primaryStart);
  assert.equal(unloadedArrows.secondaryStart, unloadedArrows.secondaryEnd);
  for (let index = 0; index < 48; index++) {
    const state = transformerFrame(2, STAGE_DURATION, (index * Math.PI) / 24);
    const arrows = transformerMmfArrows(state);
    const primary = arrows.primaryEnd - arrows.primaryStart;
    const secondary = arrows.secondaryEnd - arrows.secondaryStart;
    assert.ok(Math.abs(primary + secondary - 210 * state.i0) < 1e-10);
  }
  const positive = transformerMmfArrows({ i1: 0.7, i2: 1 });
  const negative = transformerMmfArrows({ i1: -0.7, i2: -1 });
  assert.ok(positive.primaryEnd > positive.primaryStart);
  assert.ok(positive.secondaryEnd < positive.secondaryStart);
  assert.ok(negative.primaryEnd < negative.primaryStart);
  assert.ok(negative.secondaryEnd > negative.secondaryStart);
});
