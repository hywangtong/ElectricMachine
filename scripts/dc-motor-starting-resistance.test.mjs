import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateStartingResistance,
  exampleData,
  exampleDesign,
} from '../public/dc-motor-starting-resistance-model.mjs';

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

await test('integer-stage correction meets the selected current bounds and total resistance', () => {
  const { count, switchingCurrent, sections, initialTotal } = exampleDesign;
  assert.equal(count, 4);
  assert.ok(
    switchingCurrent >= 1.1 * exampleData.load &&
      switchingCurrent <= 1.2 * exampleData.load,
  );
  close(
    sections.reduce((sum, section) => sum + section.resistance, 0),
    initialTotal - exampleData.armature,
  );
  close(initialTotal * exampleData.upper, exampleData.voltage);
});

await test('every section preserves back EMF and restores I1 at the same speed', () => {
  let previousEmf = 0;
  for (const section of exampleDesign.sections.toReversed()) {
    assert.ok(section.resistance > 0);
    assert.ok(
      section.switchingEmf > previousEmf &&
        section.switchingEmf < exampleData.ratedEmf,
    );
    close(
      section.before * exampleDesign.switchingCurrent,
      section.after * exampleData.upper,
    );
    close(
      (exampleData.voltage - section.switchingEmf) / section.after,
      exampleData.upper,
    );
    previousEmf = section.switchingEmf;
  }
  close(exampleDesign.sections[0].after, exampleData.armature);
});

await test('rounding up can require returning to the flowchart check', () => {
  const rejected = calculateStartingResistance({
    ...exampleData,
    lower: 1.15 * exampleData.load,
  });
  assert.equal(rejected.count, 5);
  assert.ok(rejected.switchingCurrent > 1.2 * exampleData.load);
  const corrected = calculateStartingResistance({
    ...exampleData,
    lower: 1.15 * exampleData.load,
    stages: 4,
  });
  close(corrected.switchingCurrent, exampleDesign.switchingCurrent);
  assert.throws(
    () => calculateStartingResistance({ ...exampleData, stages: 0 }),
    RangeError,
  );
});
