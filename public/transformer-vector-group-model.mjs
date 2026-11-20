import { PHASES } from './transformer-three-phase-model.mjs';

const indices = [0, 1, 2];
const radians = Math.PI / 180;

export function phaseOrder(offset) {
  return indices.map((index) => (index + offset) % 3);
}

// For each tail, return the head it meets in the delta loop.
export function deltaLinks(reversed) {
  return phaseOrder(reversed ? 2 : 1);
}

function difference([x1, y1], [x2, y2]) {
  return [x1 - x2, y1 - y2];
}

function sideVoltages(side, windings) {
  if (side.connection === 'delta') {
    // U_AB follows winding A if X meets B, or opposes winding B if Y meets A.
    const line = side.reversed
      ? deltaLinks(false).map((index) => windings[index].map((v) => -v))
      : windings;
    return { phase: windings, line };
  }
  const phase = side.reversed ? windings.map(([x, y]) => [-x, -y]) : windings;
  return {
    phase,
    line: phase.map((value, index) =>
      difference(value, phase[(index + 1) % 3]),
    ),
  };
}

export function vectorGroup(primary, secondary) {
  const induced = PHASES.map(({ shift }) => [
    Math.cos(shift * radians),
    Math.sin(shift * radians),
  ]);
  const highOrder = phaseOrder(primary.offset);
  const lowOrder = phaseOrder(secondary.offset);
  const high = sideVoltages(
    primary,
    indices.map((phase) => induced[highOrder.indexOf(phase)]),
  );
  const polarity =
    Boolean(primary.flipped) === Boolean(secondary.flipped) ? 1 : -1;
  const low = sideVoltages(
    secondary,
    indices.map((phase) =>
      induced[lowOrder.indexOf(phase)].map((component) => polarity * component),
    ),
  );
  const angle = ([x, y]) => Math.atan2(y, x);
  const displacement = angle(low.line[0]) - angle(high.line[0]);
  const clock = (12 - (Math.round(displacement / (30 * radians)) % 12)) % 12;
  return { high, low, clock };
}
