export const torqueParameters = Object.freeze({
  totalFlux: 0.08,
  turnsPerBranch: 240,
  armatureCurrent: 12,
  parallelPathPairs: 2,
  radius: 0.16,
  activeLength: 0.22,
});

export function torqueState(polePairs, overrides = {}) {
  if (!Number.isInteger(polePairs) || polePairs < 1) {
    throw new RangeError('polePairs must be a positive integer');
  }

  const values = { ...torqueParameters, ...overrides };
  const {
    totalFlux,
    turnsPerBranch,
    armatureCurrent,
    parallelPathPairs,
    radius,
    activeLength,
  } = values;

  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be positive`);
    }
  }

  const poleCount = polePairs * 2;
  const perPoleFlux = totalFlux / poleCount;
  const polePitch = (Math.PI * radius) / polePairs;
  const averageFluxDensity = perPoleFlux / (polePitch * activeLength);
  const conductorCurrent = armatureCurrent / (2 * parallelPathPairs);
  const conductorForce = averageFluxDensity * activeLength * conductorCurrent;
  const totalConductors = 4 * parallelPathPairs * turnsPerBranch;
  const torqueFromConductors = totalConductors * conductorForce * radius;
  const torqueFromFormula =
    ((2 * polePairs * turnsPerBranch) / Math.PI) *
    perPoleFlux *
    armatureCurrent;

  return {
    polePairs,
    poleCount,
    perPoleFlux,
    polePitch,
    averageFluxDensity,
    conductorCurrent,
    conductorForce,
    totalConductors,
    torqueFromConductors,
    torqueFromFormula,
  };
}
