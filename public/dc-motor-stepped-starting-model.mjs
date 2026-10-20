import { motor } from './dc-motor-starting-model.mjs';

export { motor };
export const emfConstant = motor.ratedEmf / motor.ratedSpeed;
export const torqueConstant = (emfConstant * 60) / (2 * Math.PI);
export const upperCurrent = 1.9 * motor.ratedCurrent;
// Illustrative short-time overload boundary, not a universal motor rating.
export const overloadCurrent = 2.2 * motor.ratedCurrent;
const initialTotal = motor.voltage / upperCurrent;
const ratio = (initialTotal / motor.resistance) ** 0.25;
export const lowerCurrent = upperCurrent / ratio;
export const loadCurrent = motor.ratedCurrent;
const totals = Array.from({ length: 5 }, (_, i) => initialTotal / ratio ** i);
// Physical order is R1 … R4; automatic removal starts at the right-hand R4.
export const sections = totals
  .slice(0, 4)
  .map((value, i) => value - totals[i + 1])
  .reverse();
export const masks = [0, 8, 12, 14, 15];
export const cutSpeeds = totals
  .slice(0, 4)
  .map((value) => (motor.voltage - lowerCurrent * value) / emfConstant);

export function stateAt(mask, speed = 0, powered = true) {
  const resistance = sections.reduce(
    (sum, value, i) => sum + (mask & (1 << i) ? 0 : value),
    0,
  );
  const total = motor.resistance + resistance;
  const emf = speed * emfConstant;
  const current = powered ? (motor.voltage - emf) / total : 0;
  return {
    mask,
    speed,
    powered,
    resistance,
    total,
    emf,
    current,
    torque: current * torqueConstant,
  };
}

export function speedAtCurrent(mask, current) {
  return (motor.voltage - current * stateAt(mask).total) / emfConstant;
}

export const phases = [
  { kind: 'start', duration: 1, stage: 0, from: 0, to: 0 },
];
for (let stage = 0; stage < 5; stage += 1) {
  phases.push({
    kind: 'accelerate',
    stage,
    duration: stage === 4 ? 4.5 : 3.2,
    from: stage === 0 ? 0 : cutSpeeds[stage - 1],
    to: stage === 4 ? motor.ratedSpeed : cutSpeeds[stage],
  });
  if (stage < 4)
    phases.push({
      kind: 'switch',
      stage: stage + 1,
      duration: 0.9,
      from: cutSpeeds[stage],
      to: cutSpeeds[stage],
    });
}
export const duration = phases.reduce((sum, phase) => sum + phase.duration, 0);

export function automaticState(time) {
  let remaining = Math.max(0, Math.min(duration, time));
  let phase = phases.at(-1);
  for (const candidate of phases) {
    phase = candidate;
    if (remaining < candidate.duration) break;
    remaining -= candidate.duration;
  }
  const fraction = time >= duration ? 1 : remaining / phase.duration;
  // Rescaled exponential gives a legible slow-motion trajectory, not real time.
  const eased = (1 - Math.exp(-1.8 * fraction)) / (1 - Math.exp(-1.8));
  const speed = phase.from + (phase.to - phase.from) * eased;
  return {
    ...stateAt(masks[phase.stage], speed),
    stage: phase.stage,
    kind: time >= duration ? 'complete' : phase.kind,
    fraction,
  };
}
