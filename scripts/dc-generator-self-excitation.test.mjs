import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultConditions,
  evaluateExcitation,
  voltageLevelAt,
} from '../public/dc-generator-self-excitation-model.mjs';

void test('open load distinguishes shunt and series self-excitation', () => {
  const shunt = evaluateExcitation('shunt', defaultConditions);
  const series = evaluateExcitation('series', defaultConditions);
  assert.equal(shunt.success, true);
  assert.equal(shunt.fieldCurrent, true);
  assert.equal(series.success, false);
  assert.equal(series.fieldCurrent, false);
  assert.match(series.reason, /负载开路/);
  assert.ok(series.level < shunt.level);
});

void test('closing a suitable load allows the series field current to build', () => {
  const conditions = { ...defaultConditions, load: true };
  assert.equal(evaluateExcitation('series', conditions).success, true);
  assert.equal(evaluateExcitation('shunt', conditions).success, true);
});

void test('all five switches produce the expected success boundary', () => {
  for (let mask = 0; mask < 32; mask += 1) {
    const conditions = {
      residual: Boolean(mask & 1),
      aiding: Boolean(mask & 2),
      speed: Boolean(mask & 4),
      resistance: Boolean(mask & 8),
      load: Boolean(mask & 16),
    };
    for (const mode of ['shunt', 'series']) {
      const result = evaluateExcitation(mode, conditions);
      const shouldSucceed =
        conditions.residual &&
        conditions.aiding &&
        conditions.speed &&
        conditions.resistance &&
        (mode === 'shunt' || conditions.load);
      assert.equal(result.success, shouldSucceed, `${mode}, mask=${mask}`);
      assert.equal(
        result.fieldCurrent,
        conditions.residual &&
          (mode === 'shunt' || conditions.load),
        `${mode} current, mask=${mask}`,
      );
      assert.ok(result.level >= 0 && result.level <= 1);
    }
  }
});

void test('voltage indicator rises toward a bounded teaching level', () => {
  const result = evaluateExcitation('shunt', defaultConditions);
  assert.ok(voltageLevelAt(result, 0) < voltageLevelAt(result, 1000));
  assert.ok(voltageLevelAt(result, 1000) < voltageLevelAt(result, 5000));
  assert.ok(voltageLevelAt(result, 5000) <= result.level);
  assert.equal(
    voltageLevelAt(
      evaluateExcitation('shunt', { ...defaultConditions, residual: false }),
      5000,
    ),
    0,
  );
});
