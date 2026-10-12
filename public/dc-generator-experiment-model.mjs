// Teaching model: constant speed, positive magnetization branch with remanence.
// Armature is quasi-steady; switching spikes, brush drop and reaction omitted.
export const parameters = {
  speed: 1500,
  uf: 120,
  rf: 60,
  lf: 60,
  ra: 0.8,
  turns: 600,
  length: 1,
  area: 0.02,
  br: 0.06,
  ce: 7.5,
};
export const defaults = { field: 60, load: 20 };
// Last slider position means open circuit, rather than a finite resistance.
export const limits = { field: 410, load: 105 };

export function magnetization(h) {
  return parameters.br + 1.14 * Math.tanh(h / 900);
}

export function equilibrium(input) {
  return {
    fieldCurrent:
      input.field === limits.field
        ? 0
        : parameters.uf / (parameters.rf + input.field),
  };
}

export function readings(state, input) {
  const h = (parameters.turns * state.fieldCurrent) / parameters.length;
  const b = magnetization(h);
  const flux = b * parameters.area;
  const emf = parameters.ce * flux * parameters.speed;
  const current =
    input.load === limits.load ? 0 : emf / (parameters.ra + input.load);
  const voltage = emf - parameters.ra * current;
  return {
    fieldCurrent: state.fieldCurrent,
    h,
    b,
    flux,
    emf,
    current,
    voltage,
  };
}

export function step(state, input, dt) {
  const target = equilibrium(input).fieldCurrent;
  // Disconnected excitation decays through an assumed discharge path (0.25 s).
  const tau =
    input.field === limits.field
      ? 0.25
      : parameters.lf / (parameters.rf + input.field);
  const fieldCurrent =
    target + (state.fieldCurrent - target) * Math.exp(-dt / tau);
  return { fieldCurrent: fieldCurrent < 1e-8 ? 0 : fieldCurrent };
}
