import { constantPower, speedSlope } from './speed-control-model.mjs';

// Same normalized motor and load as the preceding resistance-control slide.
export const stabilitySlope = speedSlope(1);
export const stabilityPower = constantPower;
export const disturbancePower = 0.06;
export const disturbanceStart = 1;
export const disturbanceEnd = 6;
export const stabilityDuration = 12;
export const minimumSpeed = 0.025;

/** @param {number} speed */
export const motorTorque = (speed) => (1 - speed) / stabilitySlope;

/** @param {number} power */
export function stabilityRoots(power = stabilityPower) {
  const root = Math.sqrt(1 - 4 * stabilitySlope * power);
  return { stable: (1 + root) / 2, unstable: (1 - root) / 2 };
}

/** @param {number} seconds @param {number} direction */
export function activePower(seconds, direction) {
  return seconds >= disturbanceStart && seconds < disturbanceEnd
    ? stabilityPower + direction * disturbancePower
    : stabilityPower;
}

/**
 * Integrate the normalized mechanical equation dq/dτ = Tmotor − Tload.
 * τ = 0.6 × demonstration seconds; this is not a real motor time scale.
 * The constant-power law is singular at zero. Stop at its low-speed boundary
 * rather than invent a finite load torque or a restart from standstill.
 * @param {'stable' | 'unstable'} point
 * @param {number} direction
 */
export function stabilityTrajectory(point, direction) {
  const step = 0.005;
  let speed = stabilityRoots()[point];
  let stalled = false;
  const samples = [{ seconds: 0, speed, stalled }];
  for (let index = 1; index <= stabilityDuration / step; index++) {
    const seconds = index * step;
    const power = activePower((index - 0.5) * step, direction);
    if (!stalled) {
      const force = (/** @type {number} */ q) =>
        motorTorque(q) - power / Math.max(q, minimumSpeed);
      const h = step * 0.6;
      const k1 = force(speed);
      const k2 = force(speed + (h * k1) / 2);
      const k3 = force(speed + (h * k2) / 2);
      const k4 = force(speed + h * k3);
      speed += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
      if (speed <= minimumSpeed) {
        speed = minimumSpeed;
        stalled = true;
      }
    }
    samples.push({ seconds, speed, stalled });
  }
  return samples;
}
