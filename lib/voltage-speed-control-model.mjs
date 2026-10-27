import {
  constantPower,
  speedLoadTorque,
  speedSlope,
} from './speed-control-model.mjs';

/**
 * Same motor and loads as the resistance-control lesson; q = n/n0N,
 * t = T/TN, u = Ua/UN. Constant rated flux, no external resistance.
 * @param {'constant-torque' | 'fan' | 'constant-power'} load
 * @param {number} voltageRatio
 */
export function voltageEquilibrium(load, voltageRatio) {
  const slope = speedSlope(0);
  if (load === 'constant-power') {
    // q² − uq + γp = 0. High-speed root is stable; low-speed root is not.
    const discriminant = voltageRatio ** 2 - 4 * slope * constantPower;
    if (discriminant < -1e-10) {
      return { status: 'none', stable: null, unstable: null };
    }
    const root = Math.sqrt(Math.max(0, discriminant));
    const speed = (voltageRatio + root) / 2;
    const lowSpeed = (voltageRatio - root) / 2;
    return {
      status: root < 1e-7 ? 'critical' : 'stable',
      stable: { speed, torque: constantPower / speed },
      unstable:
        root < 1e-7
          ? null
          : { speed: lowSpeed, torque: constantPower / lowSpeed },
    };
  }
  const speed =
    load === 'constant-torque'
      ? voltageRatio - slope * 0.8
      : (2 * voltageRatio) / (1 + Math.sqrt(1 + 4 * slope * voltageRatio));
  if (speed <= 0) {
    return { status: 'none', stable: null, unstable: null };
  }
  return {
    status: 'stable',
    stable: { speed, torque: speedLoadTorque(load, speed) },
    unstable: null,
  };
}
