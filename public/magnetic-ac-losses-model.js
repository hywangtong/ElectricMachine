// Quasistatic symmetric play ensemble. Each element retains its previous
// magnetization until H has traversed its pinning interval. These expressions
// describe a settled sinusoidal cycle, not a material fit or transient solver.
export const mu0 = 4 * Math.PI * 1e-7;
export const loopArea = 0.01;
export const maxEmf = loopArea * 2 * Math.PI * 3 * 1.5;
export const thresholds = Array.from({ length: 24 }, (_, i) => 20 + i * 4);

export function playValue(h, amplitude, rising, threshold) {
  if (amplitude <= threshold) return 0;
  return rising
    ? Math.max(-amplitude + threshold, h - threshold)
    : Math.min(amplitude - threshold, h + threshold);
}

export function magneticSample(phase, amplitude) {
  const h = amplitude * Math.sin(phase);
  const rising = Math.cos(phase) >= 0;
  const magnetizations = thresholds.map((threshold) =>
    Math.tanh(playValue(h, amplitude, rising, threshold) / 70),
  );
  const m = magnetizations.reduce((sum, value) => sum + value, 0) / 24;
  const b = 1.4 * m + 0.15 * Math.tanh(h / 180) + mu0 * h;
  return { h, b, magnetizations };
}

export function eddySample(phase, frequency, amplitude) {
  const b = amplitude * Math.sin(phase);
  const dbdt = 2 * Math.PI * frequency * amplitude * Math.cos(phase);
  return { b, e: -loopArea * dbdt };
}

export function cycleSamples(amplitude, count = 720) {
  return Array.from({ length: count + 1 }, (_, i) =>
    magneticSample((i / count) * 2 * Math.PI, amplitude),
  );
}

export function cycleEnergy(samples) {
  // Trapezoidal line integral ∮ H dB, in J/m³. Counterclockwise physical
  // (H,B) traversal gives positive energy.
  return samples.slice(1).reduce((sum, sample, i) => {
    const previous = samples[i];
    return sum + ((sample.h + previous.h) / 2) * (sample.b - previous.b);
  }, 0);
}
