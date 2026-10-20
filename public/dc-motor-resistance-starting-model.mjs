import { motor } from './dc-motor-starting-model.mjs';

export const maximumCurrent = 2 * motor.ratedCurrent;
const initialTotal = motor.voltage / maximumCurrent;
const ratio = initialTotal ** (1 / 4);
export const minimumCurrent = maximumCurrent / ratio;
const totals = [initialTotal, initialTotal / ratio, ratio ** 2, ratio, 1];
export const sections = totals
  .slice(0, -1)
  .map((total, index) => total - totals[index + 1]);
export const cutEmfs = totals
  .slice(0, -1)
  .map((total) => motor.voltage - minimumCurrent * total);

// Shared speed trajectory for comparison, not elapsed physical starting time.
// Constant rated flux; quasi-steady armature circuit without inductance.
export function resistanceStarting(mode, progress, powered = true) {
  const fraction = Math.max(0, Math.min(1, (progress - 0.08) / 0.92));
  const emf = powered ? motor.ratedEmf * fraction : 0;
  const cutCount =
    powered && mode === 'stepped'
      ? cutEmfs.filter((threshold) => emf >= threshold).length
      : 0;
  const resistance =
    mode === 'stepped'
      ? sections.slice(cutCount).reduce((sum, value) => sum + value, 0)
      : Math.max(0, (motor.voltage - emf) / maximumCurrent - motor.resistance);
  const current = powered
    ? (motor.voltage - emf) / (motor.resistance + resistance)
    : 0;
  return {
    emf,
    speed: (motor.ratedSpeed * emf) / motor.ratedEmf,
    resistance,
    current,
    armatureDrop: current * motor.resistance,
    externalDrop: current * resistance,
    cutCount,
    sectionDrops: sections.map((value, index) =>
      index < cutCount ? 0 : current * value,
    ),
  };
}
