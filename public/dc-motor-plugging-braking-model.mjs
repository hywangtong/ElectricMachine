// Constant field; signed speed in r/min, torque in N·m. Neglect La and T0.
export const parameters = Object.freeze({
  ua: 220,
  ra: 1,
  ce: 0.2,
  ct: (0.2 * 60) / (2 * Math.PI),
  load: 40,
  inertia: 1.4,
  maxCurrent: 75,
});
export const initialSpeed =
  (parameters.ua - (parameters.load / parameters.ct) * parameters.ra) /
  parameters.ce;

export function operatingPoint(speed, rb, mode) {
  const voltage = mode === 'stop' ? -parameters.ua : parameters.ua;
  const emf = parameters.ce * speed;
  const current = (voltage - emf) / (parameters.ra + rb);
  return {
    speed,
    emf,
    current,
    torque: parameters.ct * current,
    sourcePower: voltage * current,
    convertedPower: emf * current,
    resistorHeat: current ** 2 * rb,
    copperHeat: current ** 2 * parameters.ra,
  };
}

export function equilibriumSpeed(rb, mode, reversing = false) {
  const voltage = mode === 'stop' ? -parameters.ua : parameters.ua;
  const loadTorque = reversing ? -parameters.load : parameters.load;
  return (
    (voltage - (loadTorque / parameters.ct) * (parameters.ra + rb)) /
    parameters.ce
  );
}

function decay(rb) {
  return (
    (60 * parameters.ce * parameters.ct) /
    (2 * Math.PI * parameters.inertia * (parameters.ra + rb))
  );
}

export function zeroTime(rb, mode) {
  const equilibrium = equilibriumSpeed(rb, mode);
  if (equilibrium >= 0) return Infinity;
  return Math.log((initialSpeed - equilibrium) / -equilibrium) / decay(rb);
}

// Piecewise exact solution of J dΩ/dt = T − TL. For a passive load,
// TL reverses after zero; for a suspended weight it keeps its direction.
export function speedAt(seconds, rb, mode, cutAtZero = true) {
  const crossing = zeroTime(rb, mode);
  const equilibrium = equilibriumSpeed(rb, mode);
  if (seconds < crossing)
    return (
      equilibrium +
      (initialSpeed - equilibrium) * Math.exp(-decay(rb) * seconds)
    );
  if (mode === 'stop' && cutAtZero) return 0;
  const reverseEquilibrium = equilibriumSpeed(rb, mode, mode === 'stop');
  // A passive load cannot reverse if the standstill torque is too small.
  if (mode === 'stop' && reverseEquilibrium >= 0) return 0;
  return reverseEquilibrium * (1 - Math.exp(-decay(rb) * (seconds - crossing)));
}

export function minimumStopResistance() {
  return (
    (parameters.ua + parameters.ce * initialSpeed) / parameters.maxCurrent -
    parameters.ra
  );
}

export function loweringResistance(
  speedMagnitude,
  loadTorque = parameters.load,
) {
  return (
    (parameters.ct * (parameters.ua + parameters.ce * speedMagnitude)) /
      loadTorque -
    parameters.ra
  );
}
