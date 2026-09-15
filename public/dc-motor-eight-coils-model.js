// Closed electrical ring: coil k joins segments k and (k + 1) mod 8.
// Positive current runs from the first to the second terminal of that coil.
export const COIL_COUNT = 8;
export const COMMUTATION_HALF_WIDTH = 6;
export const ARMATURE_CURRENT = 2;
export const POLE_PAIR_OPTIONS = [1, 2, 4];
export const mod = (value, period = 360) =>
  ((value % period) + period) % period;
export const radians = (degrees) => (degrees * Math.PI) / 180;

function angularDistance(a, b) {
  return Math.abs(mod(a - b + 180) - 180);
}

// Local radial/tangential/axial frame of a tooth on the cylindrical rotor.
export function toothPoint(degrees, radius, tangent, axial) {
  const phi = radians(degrees);
  return [
    radius * Math.cos(phi) - tangent * Math.sin(phi),
    radius * Math.sin(phi) + tangent * Math.cos(phi),
    axial,
  ];
}

export function radialCoilGeometry(coil, rotorAngle) {
  const phi = radians(coil.degrees);
  const normal = [Math.cos(phi), Math.sin(phi), 0];
  // Each closed turn lies in the tangential-axial plane. The positive
  // terminal-to-terminal current gives an outward radial magnetic moment.
  const turns = [168, 178, 188].map((radius) =>
    [
      [-34, 98],
      [-34, -98],
      [34, -98],
      [34, 98],
      [-34, 98],
    ].map(([tangent, axial]) =>
      toothPoint(coil.degrees, radius, tangent, axial),
    ),
  );
  const terminal = (k) => toothPoint(180 - k * 45 - rotorAngle, 82, 0, 193);
  return {
    normal,
    moment: normal.map((value) => value * coil.current),
    turns,
    points: [terminal(coil.id - 1), ...turns.flat(), terminal(coil.id % 8)],
  };
}

export function windingState(angle, requestedPolePairs = 1) {
  const rotorAngle = mod(angle);
  const polePairs = POLE_PAIR_OPTIONS.includes(requestedPolePairs)
    ? requestedPolePairs
    : 1;
  const brushCount = polePairs * 2;
  const brushStep = 360 / brushCount;
  const branchCurrent = ARMATURE_CURRENT / brushCount;
  const brushes = Array.from({ length: brushCount }, (_, index) => {
    const positive = index % 2 === 0;
    return {
      id: `${positive ? 'A' : 'B'}${Math.floor(index / 2) + 1}`,
      index,
      position: mod(180 - index * brushStep),
      positive,
      contacts: [],
    };
  });
  const coils = Array.from({ length: COIL_COUNT }, (_, k) => {
    const degrees = mod(157.5 - k * 45 - rotorAngle);
    // Follow the ring from A1 in the decreasing-angle direction. Each
    // successive fixed brush reverses the voltage impressed on the winding.
    const distanceFromA1 = mod(180 - degrees);
    const nearestBrushIndex = Math.round(distanceFromA1 / brushStep);
    const brushOffset = distanceFromA1 - nearestBrushIndex * brushStep;
    const polarityAfterBrush = nearestBrushIndex % 2 === 0 ? 1 : -1;
    const normalizedCurrent = Math.max(
      -1,
      Math.min(1, (polarityAfterBrush * brushOffset) / COMMUTATION_HALF_WIDTH),
    );
    const commuting = Math.abs(brushOffset) < COMMUTATION_HALF_WIDTH;
    return {
      id: k + 1,
      degrees,
      current: normalizedCurrent * branchCurrent,
      normalizedCurrent,
      commuting,
      commutingBrushIndex: commuting
        ? mod(nearestBrushIndex, brushCount)
        : null,
      intervalIndex: mod(Math.floor(distanceFromA1 / brushStep), brushCount),
      distanceFromA1,
      terminals: [k, (k + 1) % COIL_COUNT],
    };
  });
  for (const brush of brushes) {
    brush.contacts = Array.from({ length: COIL_COUNT }, (_, k) => k).filter(
      (k) =>
        angularDistance(180 - k * 45 - rotorAngle, brush.position) <=
        22.5 + COMMUTATION_HALF_WIDTH,
    );
  }
  const branches = Array.from({ length: brushCount }, (_, index) => {
    const positiveDirection = index % 2 === 0;
    const branchCoils = coils
      .filter((coil) => !coil.commuting && coil.intervalIndex === index)
      .sort((a, b) => a.distanceFromA1 - b.distanceFromA1);
    if (!positiveDirection) branchCoils.reverse();
    return {
      id: index + 1,
      direction: positiveDirection ? 1 : -1,
      current: branchCurrent,
      coils: branchCoils,
      from: positiveDirection
        ? brushes[index]
        : brushes[(index + 1) % brushCount],
      to: positiveDirection
        ? brushes[(index + 1) % brushCount]
        : brushes[index],
    };
  });
  return {
    angle: rotorAngle,
    polePairs,
    poleCount: brushCount,
    brushCount,
    branchCurrent,
    coils,
    brushes,
    branches,
    brushA: [
      ...new Set(
        brushes.filter((brush) => brush.positive).flatMap((b) => b.contacts),
      ),
    ],
    brushB: [
      ...new Set(
        brushes.filter((brush) => !brush.positive).flatMap((b) => b.contacts),
      ),
    ],
    upper: coils
      .filter((c) => !c.commuting && c.current > 0)
      .sort((a, b) => b.degrees - a.degrees),
    lower: coils
      .filter((c) => !c.commuting && c.current < 0)
      .sort((a, b) => a.degrees - b.degrees),
    commuting: coils.filter((c) => c.commuting),
  };
}

export function advanceAngle(angle, seconds, degreesPerSecond, running) {
  return mod(angle + (running ? seconds * degreesPerSecond : 0));
}
