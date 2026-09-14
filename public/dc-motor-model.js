// End view: +z points toward the viewer, B = -B y.
// Conductor A is at (r cos(theta), r sin(theta)); +Ia flows into page.
// F_A = -B Ia l x, so T_z = 2 r B Ia l sin(theta).
export const parameters = Object.freeze({ B: 0.5, I: 2, l: 0.2, r: 0.1 });
export function motorState(degrees, commutated = false) {
  const theta = (degrees * Math.PI) / 180;
  const sine = Math.sin(theta);
  const neutral = Math.abs(sine) < 1e-10;
  const polarity = commutated ? (neutral ? 0 : Math.sign(sine)) : 1;
  const current = parameters.I * polarity;
  const force = parameters.B * current * parameters.l;
  const torque = neutral ? 0 : 2 * parameters.r * force * sine;
  return {
    theta,
    sine,
    neutral,
    polarity,
    current,
    force,
    torque,
    arm: parameters.r * Math.abs(sine),
    peak: 2 * parameters.r * parameters.B * parameters.I * parameters.l,
  };
}
