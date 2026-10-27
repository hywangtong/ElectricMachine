/** @typedef {'constant-torque' | 'fan' | 'constant-power'} SpeedLoad */

// q = n/n0, t = T/TN. Ua = 220 V, Ra = 0.5 Ω, n0 = 1000 r/min,
// IaN = 44 A, CTΦ = (60/2π) × 0.22, TN ≈ 92.4 N·m.
export const speedParameters = { voltage: 220, armatureResistance: 0.5 };
export const constantPower = 0.5; // t × q = 0.5; not defined at q = 0.

/** @param {number} resistance */
export function speedSlope(resistance) {
  return 0.1 * (1 + resistance / speedParameters.armatureResistance);
}

/** @param {SpeedLoad} load @param {number} speed */
export function speedLoadTorque(load, speed) {
  if (load === 'constant-torque') return 0.8;
  if (load === 'fan') return speed ** 2;
  return speed > 0 ? constantPower / speed : Infinity;
}

/** @param {SpeedLoad} load @param {number} resistance */
export function speedEquilibrium(load, resistance) {
  const slope = speedSlope(resistance);
  if (load === 'constant-power') {
    // q² − q + slope × constantPower = 0. Only the high-speed
    // root has d(Tmotor − Tload)/dn < 0 in the quasi-static model.
    const discriminant = 1 - 4 * slope * constantPower;
    if (discriminant < -1e-10) {
      return { status: 'none', stable: null, unstable: null };
    }
    const root = Math.sqrt(Math.max(0, discriminant));
    const speed = (1 + root) / 2;
    const lowSpeed = (1 - root) / 2;
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
      ? 1 - slope * 0.8
      : 2 / (1 + Math.sqrt(1 + 4 * slope));
  return {
    status: 'stable',
    stable: { speed, torque: speedLoadTorque(load, speed) },
    unstable: null,
  };
}
