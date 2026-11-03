// SI teaching model: E = kΦω, T = kΦIa, J dω/dt = T - TL.
export const motor = { u: 220, ra: 0.8, k: 1.3, j: 1.5, load: 26 };

export function circuit(mode, setting, omega = 0) {
  let ua = motor.u;
  let uf = motor.u;
  let resistance = 0;
  let separate = false;
  if (mode === 'resistance-start' || mode === 'resistance')
    resistance = setting;
  if (mode === 'shared-voltage') ua = uf = (motor.u * setting) / 100;
  if (mode === 'separate-voltage' || mode === 'voltage') {
    ua = (motor.u * setting) / 100;
    separate = true;
  }
  if (['dynamic', 'plugging', 'regenerative'].includes(mode)) {
    separate = true;
    if (mode === 'dynamic') {
      ua = 0;
      resistance = setting;
    } else if (mode === 'plugging') {
      ua = -motor.u;
      resistance = setting;
    } else ua = (motor.u * setting) / 100;
  }
  const fieldCurrent = uf / (220 + (mode === 'field' ? setting : 0));
  const phi = fieldCurrent;
  const emf = motor.k * phi * omega;
  const disconnected = mode === 'plugging' && omega <= 0;
  const current = disconnected ? 0 : (ua - emf) / (motor.ra + resistance);
  return {
    ua,
    uf,
    resistance,
    separate,
    phi,
    emf,
    current,
    fieldCurrent,
    torque: motor.k * phi * current,
    disconnected,
  };
}

export function step(mode, setting, omega, dt) {
  const state = circuit(mode, setting, omega);
  // The resisting load holds the shaft at rest; plugging is cut off at zero.
  return Math.max(0, omega + ((state.torque - motor.load) / motor.j) * dt);
}

export function speedAtTorque(state, torque) {
  return (
    (((state.ua -
      ((motor.ra + state.resistance) * torque) / (motor.k * state.phi)) /
      (motor.k * state.phi)) *
      60) /
    (2 * Math.PI)
  );
}
