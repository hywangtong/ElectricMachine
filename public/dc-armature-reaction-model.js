export const armatureReactionParameters = Object.freeze({
  rpm: 5,
  maxCurrent: 100,
  defaultCurrent: 55,
  windowSeconds: 12,
  baseEmf: 60,
  armatureFieldRatio: 0.55,
  commutatorSegments: 12,
  commutationHalfWidth: 4,
  trackedCoilSides: [0, 6],
  // When coil A-B lies on the horizontal geometric centreline, the seam
  // between its two commutator segments is centred under a fixed brush.
  trackedCoilSegments: [11, 0],
});

const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

export function commutationState(degrees) {
  const { commutatorSegments, commutationHalfWidth } =
    armatureReactionParameters;
  const pitch = 360 / commutatorSegments;
  const phase = modulo(degrees, pitch);
  const distanceToBoundary = Math.min(phase, pitch - phase);
  const rightBoundary = modulo(
    Math.round(-degrees / pitch),
    commutatorSegments,
  );
  const leftBoundary = modulo(
    rightBoundary + commutatorSegments / 2,
    commutatorSegments,
  );
  const adjacentPair = (boundary) => [
    modulo(boundary - 1, commutatorSegments),
    boundary,
  ];

  return {
    shorted: distanceToBoundary <= commutationHalfWidth,
    distanceToBoundary,
    rightSegments: adjacentPair(rightBoundary),
    leftSegments: adjacentPair(leftBoundary),
  };
}

export function clampArmatureCurrent(value) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(armatureReactionParameters.maxCurrent, value))
    : armatureReactionParameters.defaultCurrent;
}

export function armatureReactionState(
  degrees,
  armatureCurrent,
  fieldEnabled = true,
) {
  const theta = (degrees * Math.PI) / 180;
  const current = clampArmatureCurrent(armatureCurrent);
  const mainField = fieldEnabled ? 1 : 0;
  const armatureField =
    (current / armatureReactionParameters.maxCurrent) *
    armatureReactionParameters.armatureFieldRatio;
  const resultantField = Math.hypot(mainField, armatureField);
  const fieldAngle =
    resultantField === 0
      ? 0
      : (Math.atan2(armatureField, mainField) * 180) / Math.PI;
  const neutralAngle = -fieldAngle;

  // A tracked rotor coil cuts the two stationary air-gap field components.
  // Expressing emf from the signed physical-neutral angle guarantees that
  // the tracked coil has zero internal emf whenever it lies on that line.
  const emf =
    armatureReactionParameters.baseEmf *
    resultantField *
    Math.sin(theta - (neutralAngle * Math.PI) / 180);
  const emfPeak = armatureReactionParameters.baseEmf * resultantField;
  const commutation = commutationState(degrees);
  const trackedCoilShorted =
    commutation.shorted &&
    [commutation.rightSegments, commutation.leftSegments].some((pair) =>
      armatureReactionParameters.trackedCoilSegments.every((segment) =>
        pair.includes(segment),
      ),
    );

  return {
    current,
    mainField,
    armatureField,
    resultantField,
    fieldAngle,
    neutralShift: fieldEnabled ? fieldAngle : null,
    neutralAngle: fieldEnabled ? neutralAngle : null,
    emf: Math.abs(emf) < 1e-10 ? 0 : emf,
    emfPeak,
    commutation,
    trackedCoilShorted,
  };
}

export class ArmatureReactionSimulation {
  constructor() {
    this.reset();
  }

  reset() {
    this.angle = 24;
    this.elapsed = 0;
    this.armatureCurrent = armatureReactionParameters.defaultCurrent;
    this.fieldEnabled = true;
    this.paused = false;
    const state = this.state;
    this.samples = [
      { t: 0, emf: state.emf, shorted: Number(state.trackedCoilShorted) },
    ];
  }

  get state() {
    return armatureReactionState(
      this.angle,
      this.armatureCurrent,
      this.fieldEnabled,
    );
  }

  setArmatureCurrent(value) {
    if (!this.paused) this.armatureCurrent = clampArmatureCurrent(value);
  }

  setFieldEnabled(enabled) {
    if (!this.paused) this.fieldEnabled = Boolean(enabled);
  }

  advance(seconds) {
    if (this.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    const steps = Math.ceil(seconds * 120);
    const dt = seconds / steps;
    for (let index = 0; index < steps; index++) {
      this.elapsed += dt;
      this.angle = (this.angle + armatureReactionParameters.rpm * 6 * dt) % 360;
      const state = this.state;
      this.samples.push({
        t: this.elapsed,
        emf: state.emf,
        shorted: Number(state.trackedCoilShorted),
      });
    }
    const cutoff = this.elapsed - armatureReactionParameters.windowSeconds;
    while (this.samples.length > 1 && this.samples[1].t < cutoff)
      this.samples.shift();
  }
}
