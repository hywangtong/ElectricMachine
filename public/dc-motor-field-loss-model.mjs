// Same Ua, Ra, CE, CT and initial flux as the mechanical-characteristic slide.
// Ideal fixed armature voltage; no current limiting or protective trip.
export const parameters = {
  voltage: 220,
  resistance: 1,
  ce: 10,
  ct: 600 / (2 * Math.PI),
  flux: 0.02,
  inductance: 0.18,
  inertia: 0.25,
  fieldTime: 0.28,
  dangerSpeed: 3300,
};
export const loads = { light: 4, heavy: 50 };
export const duration = 30;

export function characteristic(flux, torque) {
  const p = parameters;
  return (
    p.voltage / (p.ce * flux) -
    (p.resistance * torque) / (p.ce * p.ct * flux ** 2)
  );
}

export function stallTorque(flux) {
  return (parameters.ct * flux * parameters.voltage) / parameters.resistance;
}

export function initialState(load) {
  return {
    current: load / (parameters.ct * parameters.flux),
    omega: (characteristic(parameters.flux, load) * 2 * Math.PI) / 60,
    flux: parameters.flux,
  };
}

export function readings(state) {
  return {
    speed: (state.omega * 60) / (2 * Math.PI),
    emf: parameters.ct * state.flux * state.omega,
    torque: parameters.ct * state.flux * state.current,
  };
}

export function derivative(state, load, residual) {
  const p = parameters;
  const { emf, torque } = readings(state);
  // A passive constant resisting load holds the shaft at rest if Te < TL;
  // it must not drive the rotor backwards (unlike an overhauling load).
  return {
    current: (p.voltage - emf - p.resistance * state.current) / p.inductance,
    omega: state.omega <= 0 && torque <= load ? 0 : (torque - load) / p.inertia,
    flux: -(state.flux - residual) / p.fieldTime,
  };
}

export function step(state, load, residual, dt) {
  const offset = (slope, scale) => ({
    current: state.current + slope.current * scale,
    omega: Math.max(0, state.omega + slope.omega * scale),
    flux: state.flux + slope.flux * scale,
  });
  const a = derivative(state, load, residual);
  const b = derivative(offset(a, dt / 2), load, residual);
  const c = derivative(offset(b, dt / 2), load, residual);
  const d = derivative(offset(c, dt), load, residual);
  const next = {};
  for (const key of ['current', 'omega', 'flux']) {
    next[key] =
      state[key] + (dt / 6) * (a[key] + 2 * b[key] + 2 * c[key] + d[key]);
  }
  next.omega = Math.max(0, next.omega);
  return next;
}

// Precompute a reproducible trajectory, so scrubbing and replay show the same
// continuous electrical/mechanical transient. The demo freezes at overspeed;
// this is an observation boundary, not a simulated protective shutdown.
export function trajectory(load, residualFraction, dt = 1 / 600) {
  const residual = parameters.flux * residualFraction;
  let state = initialState(load);
  const samples = [{ time: 0, ...state, ...readings(state) }];
  let outcome = 'running';
  for (let i = 1; i <= Math.ceil(duration / dt); i++) {
    state = step(state, load, residual, dt);
    const values = readings(state);
    samples.push({ time: i * dt, ...state, ...values });
    if (values.speed >= parameters.dangerSpeed) {
      outcome = 'overspeed';
      break;
    }
    if (state.omega === 0 && i * dt > 2 && state.current > 219.5) {
      outcome = 'stalled';
      break;
    }
  }
  return { samples, outcome, residual, dt };
}
