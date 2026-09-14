// Closed electrical ring: coil k joins segments k and (k + 1) mod 8.
// Positive current runs from the first to the second terminal of that coil.
export const COIL_COUNT = 8;
export const COMMUTATION_HALF_WIDTH = 6;
export const mod = (value, period = 360) =>
  ((value % period) + period) % period;
export const radians = (degrees) => (degrees * Math.PI) / 180;

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

export function windingState(angle) {
  const rotorAngle = mod(angle);
  const coils = Array.from({ length: COIL_COUNT }, (_, k) => {
    const degrees = mod(157.5 - k * 45 - rotorAngle);
    const distance = Math.min(degrees, Math.abs(degrees - 180), 360 - degrees);
    const commuting = distance < COMMUTATION_HALF_WIDTH;
    // Ideal linear current reversal while the brush shorts two segments.
    const signedDistance = degrees <= 180 ? distance : -distance;
    const current = Math.max(
      -1,
      Math.min(1, signedDistance / COMMUTATION_HALF_WIDTH),
    );
    return {
      id: k + 1,
      degrees,
      current,
      commuting,
      terminals: [k, (k + 1) % 8],
    };
  });
  const contacts = (position) =>
    Array.from({ length: 8 }, (_, k) => k).filter((k) => {
      const delta = mod(180 - k * 45 - rotorAngle - position + 180) - 180;
      return Math.abs(delta) <= 22.5 + COMMUTATION_HALF_WIDTH;
    });
  return {
    angle: rotorAngle,
    coils,
    brushA: contacts(180),
    brushB: contacts(0),
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
