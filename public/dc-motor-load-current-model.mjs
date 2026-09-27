// Constant flux, ideal bidirectional armature supply, no mechanical losses.
// SI units: E = kω, T = kI; ω is rad/s (not rpm).
export const parameters = { k: 1.2, ra: 0.8, inductance: 0.18, inertia: 0.65 };
export const defaults = { voltage: 220, resistance: 0.5, load: 18 };

export function equilibrium(input) {
  const current = input.load / parameters.k;
  const omega =
    (input.voltage - (parameters.ra + input.resistance) * current) /
    parameters.k;
  return { current, omega };
}

export function readings(state) {
  return {
    current: state.current,
    emf: parameters.k * state.omega,
    speed: (state.omega * 60) / (2 * Math.PI),
    torque: parameters.k * state.current,
  };
}

export function derivative(state, input) {
  return {
    current:
      (input.voltage -
        parameters.k * state.omega -
        (parameters.ra + input.resistance) * state.current) /
      parameters.inductance,
    omega: (parameters.k * state.current - input.load) / parameters.inertia,
  };
}

export function step(state, input, dt) {
  const offset = (slope, scale) => ({
    current: state.current + slope.current * scale,
    omega: state.omega + slope.omega * scale,
  });
  const a = derivative(state, input);
  const b = derivative(offset(a, dt / 2), input);
  const c = derivative(offset(b, dt / 2), input);
  const d = derivative(offset(c, dt), input);
  return {
    current:
      state.current +
      (dt / 6) * (a.current + 2 * b.current + 2 * c.current + d.current),
    omega:
      state.omega + (dt / 6) * (a.omega + 2 * b.omega + 2 * c.omega + d.omega),
  };
}
