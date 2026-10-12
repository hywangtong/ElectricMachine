import {
  ArmatureReactionSimulation,
  armatureReactionParameters,
  clampArmatureCurrent,
} from './dc-armature-reaction-model.js';

export const saturationParameters = Object.freeze({
  fieldMmf: 1.2,
  maxArmatureMmf: 0.85,
  poleSamples: 120,
});

// Normalized, single-valued magnetization curve. This is a teaching model,
// not a measured B-H curve or a hysteresis model. Equal-area pole strips
// receive equal and opposite armature MMF before nonlinear magnetization.
export function magnetization(mmf, nonlinear = true) {
  const { fieldMmf } = saturationParameters;
  return nonlinear ? Math.tanh(mmf) / Math.tanh(fieldMmf) : mmf / fieldMmf;
}

export function saturationState(degrees, armatureCurrent, nonlinear = true) {
  const current = clampArmatureCurrent(armatureCurrent);
  const { fieldMmf, maxArmatureMmf, poleSamples } = saturationParameters;
  const armatureMmf =
    (current / armatureReactionParameters.maxCurrent) * maxArmatureMmf;
  const strips = Array.from({ length: poleSamples }, (_, index) => {
    const position = -1 + (2 * (index + 0.5)) / poleSamples;
    return {
      position,
      mmf: fieldMmf + armatureMmf * position,
      b: magnetization(fieldMmf + armatureMmf * position, nonlinear),
    };
  });
  const fluxRatio =
    strips.reduce((sum, strip) => sum + strip.b, 0) / poleSamples;
  const gain =
    strips.reduce((sum, strip) => sum + Math.max(0, strip.b - 1), 0) /
    poleSamples;
  const loss =
    strips.reduce((sum, strip) => sum + Math.max(0, 1 - strip.b), 0) /
    poleSamples;
  const emfPeak = armatureReactionParameters.baseEmf * fluxRatio;
  // Retain only the fundamental to isolate the amplitude change caused by
  // the integrated pole flux; the local distorted waveform is not modeled.
  const emf = emfPeak * Math.sin((degrees * Math.PI) / 180);
  return {
    current,
    mainField: 1,
    armatureField:
      (current / armatureReactionParameters.maxCurrent) *
      armatureReactionParameters.armatureFieldRatio,
    resultantField: fluxRatio,
    armatureMmf,
    strips,
    fluxRatio,
    gain,
    loss,
    increase: magnetization(fieldMmf + armatureMmf, nonlinear) - 1,
    decrease: 1 - magnetization(fieldMmf - armatureMmf, nonlinear),
    emf: Math.abs(emf) < 1e-10 ? 0 : emf,
    emfPeak,
    nonlinear,
  };
}

export class ArmatureSaturationSimulation extends ArmatureReactionSimulation {
  get state() {
    return saturationState(
      this.angle,
      this.armatureCurrent,
      this.nonlinear !== false,
    );
  }

  setNonlinear(enabled) {
    if (!this.paused) this.nonlinear = Boolean(enabled);
  }
}
