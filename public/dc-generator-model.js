// Same end-view coordinates as the motor experiment: B points down, A starts
// on the right, and positive shaft rotation is counterclockwise. The coil's
// oriented normal is parallel to B at theta = 0. Terminal A is at the near
// end of conductor A, so e_AB = -d(N Phi)/dt = N B (2 r l) omega sin(theta).
export const generatorParameters = Object.freeze({
  N: 1,
  B: 0.5,
  l: 0.2,
  r: 0.1,
  defaultRpm: 60,
  maxRpm: 120,
  windowSeconds: 8,
});

export function clampRpm(value) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(generatorParameters.maxRpm, value))
    : generatorParameters.defaultRpm;
}

export function generatorState(degrees, rpm, commutated = false) {
  const theta = (degrees * Math.PI) / 180;
  const omega = (clampRpm(rpm) * 2 * Math.PI) / 60;
  const { N, B, r, l } = generatorParameters;
  const linkagePeak = N * B * 2 * r * l;
  const neutral = Math.abs(Math.sin(theta)) < 1e-10;
  const coilEmf = neutral ? 0 : linkagePeak * omega * Math.sin(theta);
  // Fixed top/bottom brushes exchange coil terminals at each emf zero.
  const contact = neutral ? 0 : Math.sign(Math.sin(theta));
  return {
    theta,
    omega,
    linkage: linkagePeak * Math.cos(theta),
    peak: linkagePeak * omega,
    coilEmf,
    outputEmf: commutated ? Math.abs(coilEmf) : coilEmf,
    contact,
    neutral,
    frequency: clampRpm(rpm) / 60,
  };
}

// A single simulation clock drives the shaft, instantaneous readings and
// sampled history. Pause does not accumulate wall time or rewrite history.
export class GeneratorSimulation {
  constructor(commutated = false) {
    this.commutated = commutated;
    this.reset();
  }

  reset() {
    this.rpm = generatorParameters.defaultRpm;
    this.angle = 0;
    this.elapsed = 0;
    this.paused = false;
    this.samples = [{ t: 0, coil: 0, output: 0 }];
  }

  get state() {
    return generatorState(this.angle, this.rpm, this.commutated);
  }

  setRpm(value) {
    if (Number.isFinite(value)) this.rpm = clampRpm(value);
  }

  advance(seconds) {
    if (this.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    // Subdivide frames to avoid aliasing even at the maximum 2 rev/s.
    const steps = Math.ceil(seconds * 120);
    const dt = seconds / steps;
    for (let i = 0; i < steps; i++) {
      this.elapsed += dt;
      this.angle = (this.angle + this.rpm * 6 * dt) % 360;
      const state = this.state;
      this.samples.push({
        t: this.elapsed,
        coil: state.coilEmf,
        output: state.outputEmf,
      });
    }
    const cutoff = this.elapsed - generatorParameters.windowSeconds;
    // Retain one predecessor to interpolate exactly at the window boundary.
    while (this.samples.length > 1 && this.samples[1].t < cutoff)
      this.samples.shift();
  }
}
