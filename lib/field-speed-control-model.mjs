import {
  constantPower,
  speedLoadTorque,
  speedSlope,
} from './speed-control-model.mjs';

/**
 * Same motor and loads as the preceding lessons. Unsaturated approximation:
 * f = Φ/ΦN ≈ If/IfN, q = n/n0N, t = T/TN; Ua = UN, no added resistance.
 * The teaching slider is limited to 0.5 ≤ f ≤ 1, away from loss of field.
 * @param {'constant-torque' | 'fan' | 'constant-power'} load
 * @param {number} flux
 */
export function fieldEquilibrium(load, flux) {
  if (!Number.isFinite(flux) || flux < 0.5 || flux > 1) {
    throw new RangeError('Field ratio must be between 0.5 and 1.');
  }
  const slope = speedSlope(0);
  // Motor line: f²q = f − γN t. For constant power, q scales as 1/f.
  const speed =
    load === 'constant-torque'
      ? (flux - slope * 0.8) / flux ** 2
      : load === 'fan'
        ? (2 * flux) / (flux ** 2 + Math.sqrt(flux ** 4 + 4 * slope * flux))
        : (1 + Math.sqrt(1 - 4 * slope * constantPower)) / (2 * flux);
  const torque = speedLoadTorque(load, speed);
  const lowSpeed =
    load === 'constant-power'
      ? (1 - Math.sqrt(1 - 4 * slope * constantPower)) / (2 * flux)
      : null;
  return {
    stable: { speed, torque },
    unstable:
      lowSpeed === null
        ? null
        : { speed: lowSpeed, torque: constantPower / lowSpeed },
    current: torque / flux,
    allowedTorque: flux,
    noLoadSpeed: 1 / flux,
    slope: slope / flux ** 2,
  };
}
