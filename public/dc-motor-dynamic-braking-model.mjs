// Constant field; n in r/min, T in N·m. Armature inductance and T0 omitted.
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

export function brakingPoint(speed, rb) {
  const emf = parameters.ce * speed;
  const current = -emf / (parameters.ra + rb);
  return {
    speed,
    emf,
    current,
    torque: parameters.ct * current,
    heat: current * current * rb,
  };
}

export function equilibriumSpeed(rb) {
  return (
    (-parameters.load * (parameters.ra + rb)) / (parameters.ce * parameters.ct)
  );
}

// Exact solution of J dΩ/dt = T − TL. At zero, a passive load cannot
// drive reversal; a suspended weight continues to apply its driving torque.
export function advanceSpeed(speed, rb, seconds, mode) {
  if (mode === 'stop' && speed <= 0) return 0;
  const equilibrium = equilibriumSpeed(rb);
  const decay =
    (60 * parameters.ce * parameters.ct) /
    (2 * Math.PI * parameters.inertia * (parameters.ra + rb));
  const next = equilibrium + (speed - equilibrium) * Math.exp(-decay * seconds);
  return mode === 'stop' ? Math.max(0, next) : next;
}

export function stopTime(rb) {
  const equilibrium = equilibriumSpeed(rb);
  const decay =
    (60 * parameters.ce * parameters.ct) /
    (2 * Math.PI * parameters.inertia * (parameters.ra + rb));
  return Math.log((initialSpeed - equilibrium) / -equilibrium) / decay;
}
