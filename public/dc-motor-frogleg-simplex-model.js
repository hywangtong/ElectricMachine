export const SLOT_COUNT = 8;
export const SEGMENT_COUNT = 8;
export const POLE_COUNT = 4;
export const BRUSH_COUNT = 4;
export const ARMATURE_CURRENT = 2;
export const COMMUTATION_HALF_WIDTH = 6;
export const MODES = ['frogleg', 'simplex'];

export const mod = (value, period = 360) =>
  ((value % period) + period) % period;
export const radians = (degrees) => (degrees * Math.PI) / 180;
export const modIndex = (value) => mod(value, SEGMENT_COUNT);

function angularDistance(a, b) {
  return Math.abs(mod(a - b + 180) - 180);
}

export function toothPoint(degrees, radius, tangent, axial) {
  const phi = radians(degrees);
  return [
    radius * Math.cos(phi) - tangent * Math.sin(phi),
    radius * Math.sin(phi) + tangent * Math.cos(phi),
    axial,
  ];
}

export const compositeCoils = Array.from(
  { length: SLOT_COUNT },
  (_, index) => ({
    id: index + 1,
    lapId: index + 1,
    waveId: modIndex(index - 1) + 1,
    slots: [index, modIndex(index + 2)],
  }),
);

export function windingSections(mode = 'frogleg') {
  const safeMode = MODES.includes(mode) ? mode : 'frogleg';
  const lap = Array.from({ length: SLOT_COUNT }, (_, index) => ({
    key: `L${index + 1}`,
    family: 'lap',
    id: index + 1,
    compositeId: index + 1,
    slots: [index, modIndex(index + 2)],
    terminals: [index, modIndex(index + 1)],
  }));
  const wave = Array.from({ length: SLOT_COUNT }, (_, index) => ({
    key: `W${index + 1}`,
    family: 'wave',
    id: index + 1,
    compositeId: modIndex(index + 1) + 1,
    slots: [modIndex(index + 1), modIndex(index + 3)],
    terminals:
      safeMode === 'frogleg'
        ? [index, modIndex(index + 3)]
        : [modIndex(index + 1), modIndex(index + 2)],
  }));
  return [...lap, ...wave];
}

function solveLinear(matrix, right) {
  const size = right.length;
  const augmented = matrix.map((row, index) => [...row, right[index]]);
  for (let column = 0; column < size; column++) {
    let pivot = column;
    for (let row = column + 1; row < size; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column]))
        pivot = row;
    }
    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];
    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-10) continue;
    for (let entry = column; entry <= size; entry++)
      augmented[column][entry] /= divisor;
    for (let row = 0; row < size; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let entry = column; entry <= size; entry++)
        augmented[row][entry] -= factor * augmented[column][entry];
    }
  }
  return augmented.map((row, index) =>
    Math.abs(row[index]) < 1e-10 ? 0 : row[size],
  );
}

function solveNetwork(sections, fixedPotentials) {
  const unknown = Array.from(
    { length: SEGMENT_COUNT },
    (_, index) => index,
  ).filter((index) => !fixedPotentials.has(index));
  const unknownIndex = new Map(unknown.map((node, index) => [node, index]));
  const matrix = unknown.map(() => Array(unknown.length).fill(0));
  const right = unknown.map(() => 0);
  for (const section of sections) {
    const [start, end] = section.terminals;
    for (const [node, other] of [
      [start, end],
      [end, start],
    ]) {
      if (!unknownIndex.has(node)) continue;
      const row = unknownIndex.get(node);
      matrix[row][row] += 1;
      if (unknownIndex.has(other)) matrix[row][unknownIndex.get(other)] -= 1;
      else right[row] += fixedPotentials.get(other);
    }
  }
  const solved = solveLinear(matrix, right);
  return Array.from({ length: SEGMENT_COUNT }, (_, node) =>
    fixedPotentials.has(node)
      ? fixedPotentials.get(node)
      : solved[unknownIndex.get(node)],
  );
}

export function sectionPath(section, rotorAngle) {
  // Four electrical sides share each mechanical slot. Separate the start and
  // return sides radially, then separate Lap/Wave tangentially within each
  // layer so parallel conductors remain legible in both camera views.
  const offset = section.family === 'lap' ? -8 : 8;
  const startRadius = 190;
  const returnRadius = 174;
  const endTurnRadius = section.family === 'lap' ? 205 : 217;
  const startSlotAngle = 180 - section.slots[0] * 45 - rotorAngle;
  const endSlotAngle = 180 - section.slots[1] * 45 - rotorAngle;
  const terminalAngle = (segment) => 180 - segment * 45 - rotorAngle;
  const arc = (from, to, radius, axial, reverse = false) => {
    let sweep = mod(to - from);
    if (sweep > 180) sweep -= 360;
    if (reverse) sweep = sweep > 0 ? sweep - 360 : sweep + 360;
    return Array.from({ length: 7 }, (_, index) => {
      const fraction = index / 6;
      return toothPoint(from + sweep * fraction, radius, offset, axial);
    });
  };
  const frontA = toothPoint(startSlotAngle, startRadius, offset, 92);
  const backA = toothPoint(startSlotAngle, startRadius, offset, -92);
  const frontB = toothPoint(endSlotAngle, returnRadius, offset, 92);
  return [
    toothPoint(terminalAngle(section.terminals[0]), 82, offset * 0.45, 196),
    toothPoint(startSlotAngle, endTurnRadius, offset, 112),
    frontA,
    backA,
    ...arc(startSlotAngle, endSlotAngle, endTurnRadius, -112).slice(1),
    frontB,
    toothPoint(endSlotAngle, endTurnRadius, offset, 112),
    toothPoint(terminalAngle(section.terminals[1]), 82, offset * 0.45, 196),
  ];
}

export function windingState(angle, mode = 'frogleg') {
  const rotorAngle = mod(angle);
  const safeMode = MODES.includes(mode) ? mode : 'frogleg';
  const brushStep = 360 / BRUSH_COUNT;
  const brushes = Array.from({ length: BRUSH_COUNT }, (_, index) => {
    const positive = index % 2 === 0;
    return {
      id: `${positive ? 'B+' : 'B-'}${Math.floor(index / 2) + 1}`,
      index,
      position: mod(180 - index * brushStep),
      positive,
      contacts: [],
    };
  });
  for (const brush of brushes) {
    brush.contacts = Array.from(
      { length: SEGMENT_COUNT },
      (_, index) => index,
    ).filter(
      (index) =>
        angularDistance(180 - index * 45 - rotorAngle, brush.position) <=
        22.5 + COMMUTATION_HALF_WIDTH,
    );
  }
  const fixedPotentials = new Map();
  for (const brush of brushes) {
    for (const segment of brush.contacts)
      fixedPotentials.set(segment, brush.positive ? 1 : -1);
  }
  const baseSections = windingSections(safeMode);
  const potentials = solveNetwork(baseSections, fixedPotentials);
  const rawSupply = baseSections.reduce((total, section) => {
    const [start, end] = section.terminals;
    if (fixedPotentials.get(start) === 1)
      total += potentials[start] - potentials[end];
    if (fixedPotentials.get(end) === 1)
      total += potentials[end] - potentials[start];
    return total;
  }, 0);
  const scale = rawSupply > 1e-10 ? ARMATURE_CURRENT / rawSupply : 0;
  const sections = baseSections.map((section) => {
    const [start, end] = section.terminals;
    const current = (potentials[start] - potentials[end]) * scale;
    const commutingBrush = brushes.find(
      (brush) => brush.contacts.includes(start) && brush.contacts.includes(end),
    );
    return {
      ...section,
      current,
      commuting: Boolean(commutingBrush),
      commutingBrushId: commutingBrush?.id ?? null,
      path: sectionPath(section, rotorAngle),
    };
  });
  const composites = compositeCoils.map((composite) => ({
    ...composite,
    lap: sections.find(
      (section) =>
        section.family === 'lap' && section.compositeId === composite.id,
    ),
    wave: sections.find(
      (section) =>
        section.family === 'wave' && section.compositeId === composite.id,
    ),
  }));
  return {
    angle: rotorAngle,
    mode: safeMode,
    poles: Array.from({ length: POLE_COUNT }, (_, index) => ({
      id: index + 1,
      position: mod(180 - index * 90),
      north: index % 2 === 0,
    })),
    brushes,
    potentials,
    sections,
    composites,
    totalCurrent: ARMATURE_CURRENT,
  };
}

export function advanceAngle(angle, seconds, degreesPerSecond, running) {
  return mod(angle + (running ? seconds * degreesPerSecond : 0));
}
