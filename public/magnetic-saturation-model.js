// Weighted relay ensemble: a small, rate-independent teaching model with
// irreversible switching, saturation and return-point memory (minor loops).
// H and B are dimensionless illustrative values, not a material data fit.
const relays = [];
for (let i = 0; i < 40; i++) {
  const center = (i + 0.5) * 0.035;
  for (let j = 0; j < 30; j++) {
    const width = 0.22 + j * 0.034;
    const weight = Math.exp(
      -((center / 0.6) ** 2) - ((width - 0.65) / 0.23) ** 2,
    );
    // Paired centers and opposite initial states cancel exactly at H=B=0.
    for (const sign of [-1, 1]) {
      relays.push({
        up: sign * center + width,
        down: sign * center - width,
        initial: -sign,
        weight,
      });
    }
  }
}
const totalWeight = relays.reduce((sum, relay) => sum + relay.weight, 0);

export function createMagneticState() {
  return {
    field: 0,
    magnetization: 0,
    b: 0,
    states: relays.map((relay) => relay.initial),
  };
}

export function advanceField(state, field) {
  const nextField = Math.max(-3, Math.min(3, field));
  if (nextField === state.field) return state;
  let sum = 0;
  for (let i = 0; i < relays.length; i++) {
    const relay = relays[i];
    if (nextField > state.field && nextField >= relay.up) state.states[i] = 1;
    if (nextField < state.field && nextField <= relay.down)
      state.states[i] = -1;
    sum += relay.weight * state.states[i];
  }
  state.field = nextField;
  state.magnetization = sum / totalWeight;
  // Small reversible contribution: B can still grow slowly after saturation.
  state.b = state.magnetization + 0.02 * nextField;
  return state;
}

export function sampleCurve(start, end, state = createMagneticState()) {
  const count = Math.max(1, Math.round(Math.abs(end - start) / 0.01));
  advanceField(state, start);
  const points = [{ h: state.field, b: state.b }];
  for (let i = 1; i <= count; i++) {
    advanceField(state, start + ((end - start) * i) / count);
    points.push({ h: state.field, b: state.b });
  }
  return points;
}

// Equal-size illustrative domains: mirrored directions cancel vertically.
// Different easy-axis directions rotate differently, so remanence leaves
// a majority retaining the old direction, not an artificially uniform array.
export function domainDirections(magnetization) {
  const m = Math.max(-1, Math.min(1, magnetization));
  const angles = Array.from({ length: 24 }, (_, i) => {
    const index = (i * 7) % 24;
    const theta =
      ([5, 25, 45, 65, 80, 88][Math.floor(index / 4)] * Math.PI) / 180;
    return [theta, -theta, Math.PI - theta, Math.PI + theta][index % 4];
  });
  const biases = angles.map((angle) => Math.atanh(Math.cos(angle)));
  let low = -16;
  let high = 16;
  for (let i = 0; i < 40; i++) {
    const bias = (low + high) / 2;
    const mean =
      biases.reduce((sum, value) => sum + Math.tanh(value + bias), 0) / 24;
    if (mean < m) low = bias;
    else high = bias;
  }
  return angles.map((angle, i) => {
    const cosine =
      Math.abs(m) === 1 ? m : Math.tanh(biases[i] + (low + high) / 2);
    const sine =
      Math.sqrt(Math.max(0, 1 - cosine * cosine)) * Math.sign(Math.sin(angle));
    return {
      cosine,
      sine,
      rotation: (Math.atan2(sine, cosine) * 180) / Math.PI,
    };
  });
}
