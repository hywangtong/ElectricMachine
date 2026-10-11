import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  commutationState,
  flowPowerParts,
  powerParts,
  rotorFrameField,
} from '../public/dc-motor-power-anatomy-model.mjs';

await test('flow groups separate winding heat, internal conversion and rotation losses', () => {
  const idleLosses = ['PFe', 'Pme', 'Pad'];
  const union = new Set(idleLosses.flatMap((key) => powerParts[key].parts));
  assert.deepEqual(new Set(flowPowerParts.P0.parts), union);
  for (const part of powerParts.PCu.parts) assert.ok(!union.has(part));
  assert.deepEqual(flowPowerParts.PCu.parts, ['armature', 'field']);
  assert.deepEqual(
    new Set(flowPowerParts.Pe.parts),
    new Set([...flowPowerParts.P0.parts, ...flowPowerParts.P2.parts]),
  );
  for (const part of ['input', 'armature', 'field'])
    assert.ok(!flowPowerParts.Pe.parts.includes(part));
});

await test('total loss highlights the union of loss components, without input/output', () => {
  const losses = ['PFe', 'PCu', 'Pme', 'Pad'];
  const union = new Set(losses.flatMap((key) => powerParts[key].parts));
  assert.deepEqual(new Set(powerParts.Pal.parts), union);
  assert.ok(!union.has('input') && !union.has('output'));
  assert.equal(powerParts.P1.color, '#16a34a');
  assert.equal(powerParts.P2.color, '#2563eb');
  for (const key of [...losses, 'Pal'])
    assert.equal(powerParts[key].color, '#facc15');
});

await test('commutation reverses coil current every half turn and preserves torque direction', () => {
  for (let degrees = 0; degrees < 360; degrees++) {
    const angle = (degrees * Math.PI) / 180;
    const now = commutationState(angle);
    const halfTurn = commutationState(angle + Math.PI);
    assert.equal(now.commuting, halfTurn.commuting);
    assert.ok(now.current === -halfTurn.current);
    // F = I dl × B gives shaft torque along -x, matching the animation.
    assert.ok(-now.current * Math.cos(angle) <= 0);
  }
  assert.equal(commutationState(Math.PI / 2).current, 0);
  assert.equal(commutationState((3 * Math.PI) / 2).current, 0);
});

await test('rotor-frame B varies while reconstructed stator-frame B remains fixed', () => {
  for (let degrees = 0; degrees <= 720; degrees += 3) {
    const angle = (degrees * Math.PI) / 180;
    const b = rotorFrameField(angle);
    const statorY = b.y * Math.cos(angle) - b.z * Math.sin(angle);
    const statorZ = b.y * Math.sin(angle) + b.z * Math.cos(angle);
    assert.ok(Math.abs(statorY + 1) < 1e-12);
    assert.ok(Math.abs(statorZ) < 1e-12);
    assert.ok(Math.abs(Math.hypot(b.y, b.z) - 1) < 1e-12);
  }
  assert.equal(rotorFrameField(0).y, -1);
  assert.equal(rotorFrameField(Math.PI).y, 1);
});
