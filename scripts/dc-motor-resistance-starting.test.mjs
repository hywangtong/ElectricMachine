import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resistanceStarting,
  cutEmfs,
  sections,
  minimumCurrent,
  maximumCurrent,
} from '../public/dc-motor-resistance-starting-model.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
await test('both starting methods obey voltage balance and end at rated operation', () => {
  for (const mode of ['continuous', 'stepped']) {
    const open = resistanceStarting(mode, 0, false);
    near(open.current, 0);
    near(open.emf, 0);
    near(resistanceStarting(mode, 0).current, 30);
    let previousResistance = Infinity;
    for (let index = 0; index <= 2000; index += 1) {
      const state = resistanceStarting(mode, index / 2000);
      near(state.emf + state.armatureDrop + state.externalDrop, 220);
      assert.ok(state.current <= maximumCurrent + 1e-8);
      assert.ok(state.current >= 15 - 1e-8);
      assert.ok(state.resistance <= previousResistance + 1e-8);
      previousResistance = state.resistance;
      if (mode === 'stepped')
        near(
          state.sectionDrops.reduce((a, b) => a + b, 0),
          state.externalDrop,
        );
    }
    const end = resistanceStarting(mode, 1);
    near(end.current, 15);
    near(end.resistance, 0);
    near(end.emf, 205);
    near(end.speed, 1500);
  }
});
await test('four bypass switches remove only their matching sections and restore upper current', () => {
  cutEmfs.forEach((emf, index) => {
    const progress = 0.08 + (0.92 * emf) / 205;
    const before = resistanceStarting('stepped', progress - 1e-10);
    const after = resistanceStarting('stepped', progress + 1e-10);
    assert.equal(before.cutCount, index);
    assert.equal(after.cutCount, index + 1);
    near(before.current, minimumCurrent);
    near(after.current, maximumCurrent);
    near(before.resistance - after.resistance, sections[index]);
    after.sectionDrops.slice(0, index + 1).forEach((drop) => near(drop, 0));
  });
});
await test('continuous rheostat maintains current until fully removed, without a current jump', () => {
  for (let emf = 0; emf <= 190; emf += 1) {
    const state = resistanceStarting('continuous', 0.08 + (0.92 * emf) / 205);
    near(state.current, 30);
    near(state.resistance, (220 - emf) / 30 - 1);
  }
});
