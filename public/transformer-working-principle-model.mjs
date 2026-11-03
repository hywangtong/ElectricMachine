// Visual teaching timeline; elapsed time is playback time, not physical time.
export const STAGE_DURATION = 12000;
export const CUE_STARTS = [
  [0, 1800, 5000, 8500],
  [0, 2200, 5600, 8700],
  [0, 2200, 5000, 8500],
  [0, 3000, 6000, 9000],
];

function ramp(time, start, end) {
  const value = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return value * value * (3 - 2 * value);
}

// Both arrows share the same scale. i2 leaves the dotted terminal, so its
// magnetomotive force opposes the primary reference direction (N2/N1 = 1/2).
export function transformerMmfArrows({ i1, i2 }) {
  const primary = 210 * i1;
  const secondary = 210 * 0.5 * i2;
  return {
    primaryStart: 365 - primary / 2,
    primaryEnd: 365 + primary / 2,
    secondaryStart: 365 + secondary / 2,
    secondaryEnd: 365 - secondary / 2,
  };
}

export function transformerFrame(stage, elapsed, phase) {
  const time = Math.max(0, Math.min(STAGE_DURATION, elapsed));
  const cue = CUE_STARTS[stage].findLastIndex((start) => time >= start);
  const load = stage === 2 ? ramp(time, 2200, 3800) : stage === 3 ? 1 : 0;
  const compensation =
    stage === 2 ? ramp(time, 5000, 8500) : stage === 3 ? 1 : 0;
  const excitation = stage === 0 ? ramp(time, 1800, 5000) : 1;
  // A temporary dip illustrates the tendency before compensation, not a solved
  // transient waveform. Only the final state enforces the ideal ampere-turn law.
  const fluxScale = excitation * (1 - 0.28 * load * (1 - compensation));
  const flux = fluxScale * Math.sin(phase);
  const i0 = 0.2 * flux;
  const i2 = load * Math.cos(phase);
  const deltaI1 = 0.5 * compensation * Math.cos(phase);
  return {
    time,
    cue,
    load,
    compensation,
    excitation,
    fluxScale,
    flux,
    i0,
    i2,
    i1: i0 + deltaI1,
    deltaI1,
    switchClosed: stage === 3 || (stage === 2 && time >= 2200),
    trace:
      stage === 0
        ? ramp(time, 1800, 5000)
        : stage === 1
          ? ramp(time, 0, 2200)
          : stage === 3
            ? ramp(time, 0, 2800)
            : 1,
    emf: stage === 1 ? ramp(time, 2200, 5600) : stage >= 2 ? 1 : 0,
    primaryLeak: stage === 3 ? ramp(time, 3000, 5800) : 0,
    secondaryLeak: stage === 3 ? ramp(time, 6000, 8800) : 0,
  };
}
