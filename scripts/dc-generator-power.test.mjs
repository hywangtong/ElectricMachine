import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  generatorCommutationState,
  generatorFlowPowerParts,
  generatorPowerParts,
} from '../public/dc-generator-power-model.mjs';
import { commutationState } from '../public/dc-motor-power-anatomy-model.mjs';

await test('generation transfers shaft input to electrical output and copper heat', () => {
  assert.deepEqual(generatorPowerParts.P1.parts, ['output']);
  assert.deepEqual(generatorPowerParts.P2.parts, ['input']);
  const converted = new Set([
    ...generatorFlowPowerParts.PCu.parts,
    ...generatorFlowPowerParts.P2.parts,
  ]);
  assert.deepEqual(new Set(generatorFlowPowerParts.Pe.parts), converted);
  for (const part of generatorFlowPowerParts.P0.parts)
    assert.ok(!converted.has(part));
  assert.ok(!converted.has('output'));
});

await test('generator current reverses each half turn and torque opposes shaft rotation', () => {
  for (let degrees = 0; degrees < 360; degrees++) {
    const angle = (degrees * Math.PI) / 180;
    const generator = generatorCommutationState(angle);
    const motor = commutationState(angle);
    const halfTurn = generatorCommutationState(angle + Math.PI);
    assert.equal(generator.commuting, motor.commuting);
    assert.ok(generator.current === -motor.current);
    assert.ok(generator.current === -halfTurn.current);
    // F = I dl × B with B = -y: torque is along +x while Ω is along -x.
    assert.ok(-generator.current * Math.cos(angle) >= 0);
  }
  assert.equal(generatorCommutationState(Math.PI / 2).current, 0);
  assert.equal(generatorCommutationState((3 * Math.PI) / 2).current, 0);
});
