// Signed, saturating teaching model; no full hysteresis or armature reaction.
// n in r/min, residual flux in mWb. E = CE * flux * n, CE = 7.5.
export const defaults = Object.freeze({
  residual: 1.2,
  speed: 1500,
  rf: 90,
  ra: 0.8,
  aiding: 1,
  load: Infinity,
});
export const constants = Object.freeze({
  ce: 7.5,
  saturation: 20,
  knee: 1.5,
  lf: 90,
});

export function flux(current, input) {
  return (
    input.residual +
    constants.saturation * Math.tanh((input.aiding * current) / constants.knee)
  );
}

export function emf(current, input) {
  return (constants.ce * input.speed * flux(current, input)) / 1000;
}

export function effectiveResistance(input) {
  if (input.load === 0) return Infinity;
  return input.rf + input.ra * (1 + input.rf / input.load);
}

export function readings(current, input) {
  const e = emf(current, input);
  const u =
    input.load === 0
      ? 0
      : (e - input.ra * current) / (1 + input.ra / input.load);
  const loadCurrent =
    input.load === 0 ? e / input.ra - current : u / input.load;
  return {
    current,
    flux: flux(current, input),
    e,
    u,
    loadCurrent,
    ia: loadCurrent + current,
  };
}

export function derivative(current, input) {
  return (readings(current, input).u - input.rf * current) / constants.lf;
}

// RK4 with bounded substeps preserves the unstable zero-remanence equilibrium.
export function step(current, input, dt) {
  const count = Math.max(1, Math.ceil(dt / 0.005));
  const h = dt / count;
  for (let i = 0; i < count; i++) {
    const a = derivative(current, input);
    const b = derivative(current + (h * a) / 2, input);
    const c = derivative(current + (h * b) / 2, input);
    const d = derivative(current + h * c, input);
    current += (h * (a + 2 * b + 2 * c + d)) / 6;
  }
  return current;
}

// The reachable equilibrium when starting at If = 0 on the residual's branch.
export function equilibrium(input) {
  if (input.residual === 0 || input.speed === 0 || input.load === 0)
    return readings(0, input);
  const sign = Math.sign(input.residual);
  let low = 0;
  let high =
    (constants.ce *
      input.speed *
      (Math.abs(input.residual) + constants.saturation)) /
      1000 /
      effectiveResistance(input) +
    1;
  for (let i = 0; i < 70; i++) {
    const mid = (low + high) / 2;
    if (sign * emf(sign * mid, input) > effectiveResistance(input) * mid)
      low = mid;
    else high = mid;
  }
  return readings((sign * (low + high)) / 2, input);
}

// Critical slope uses the zero-remanence initial tangent, not a sharp cutoff
// of the finite-remanence tanh curve. The UI explicitly labels this approximation.
export function critical(input) {
  const slopePerRpm =
    (constants.ce * constants.saturation) / 1000 / constants.knee;
  return {
    resistance: slopePerRpm * input.speed,
    speed: (input.rf + input.ra) / slopePerRpm,
  };
}

export function externalCurve(input) {
  const points = [equilibrium({ ...input, load: Infinity })];
  for (let i = 0; i <= 260; i++) {
    const load = 10 ** (4 - (i * 7) / 260);
    points.push(equilibrium({ ...input, load }));
  }
  points.push(equilibrium({ ...input, load: 0 }));
  return points;
}
