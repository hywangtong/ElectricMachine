export const emfParameters = Object.freeze({
  totalFlux: 0.08,
  turnsPerBranch: 240,
  parallelPathPairs: 2,
  radius: 0.16,
  activeLength: 0.22,
  speedRpm: 600,
});

export function emfState(polePairs, overrides = {}) {
  if (!Number.isInteger(polePairs) || polePairs < 1) {
    throw new RangeError('polePairs must be a positive integer');
  }
  const values = { ...emfParameters, ...overrides };
  for (const [name, value] of Object.entries(values)) {
    if (
      !Number.isFinite(value) ||
      (name === 'speedRpm' ? value < 0 : value <= 0)
    ) {
      throw new RangeError(`${name} is outside the model range`);
    }
  }
  const {
    totalFlux,
    turnsPerBranch,
    parallelPathPairs,
    radius,
    activeLength,
    speedRpm,
  } = values;
  const poleCount = 2 * polePairs;
  const perPoleFlux = totalFlux / poleCount;
  const polePitch = (Math.PI * radius) / polePairs;
  const averageFluxDensity = perPoleFlux / (polePitch * activeLength);
  const velocity = (2 * Math.PI * radius * speedRpm) / 60;
  const conductorEmf = averageFluxDensity * activeLength * velocity;
  const totalConductors = 4 * parallelPathPairs * turnsPerBranch;
  return {
    polePairs,
    poleCount,
    perPoleFlux,
    polePitch,
    averageFluxDensity,
    speedRpm,
    velocity,
    conductorEmf,
    totalConductors,
    emfFromConductors:
      (totalConductors / (2 * parallelPathPairs)) * conductorEmf,
    emfFromFormula:
      ((4 * polePairs * turnsPerBranch) / 60) * perPoleFlux * speedRpm,
  };
}
