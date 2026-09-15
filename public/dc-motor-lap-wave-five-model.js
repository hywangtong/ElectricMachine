export const SLOT_COUNT = 5;
export const SEGMENT_COUNT = 5;
export const POLE_COUNT = 4;
export const ARMATURE_CURRENT = 2;
export const COMMUTATION_HALF_WIDTH = 5;
export const MODES = ['lap', 'wave'];

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

export const coils = Array.from({ length: SLOT_COUNT }, (_, index) => ({
  id: index + 1,
  slots: [index, modIndex(index + 1)],
}));

export function brushCount(mode = 'lap') {
  return mode === 'wave' ? 2 : 4;
}

export function windingSections(mode = 'lap') {
  const safeMode = MODES.includes(mode) ? mode : 'lap';
  const commutatorPitch = safeMode === 'wave' ? 2 : 1;
  return coils.map((coil, index) => ({
    key: `Q${coil.id}`,
    family: safeMode,
    id: coil.id,
    coilId: coil.id,
    slots: coil.slots,
    terminals: [index, modIndex(index + commutatorPitch)],
  }));
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
  const slotStep = 360 / SLOT_COUNT;
  const startAngle = 180 - section.slots[0] * slotStep - rotorAngle;
  const endAngle = 180 - section.slots[1] * slotStep - rotorAngle;
  const terminalAngle = (segment) =>
    180 - segment * (360 / SEGMENT_COUNT) - rotorAngle;
  const arc = (from, to, radius, axial) => {
    let sweep = mod(to - from);
    if (sweep > 180) sweep -= 360;
    return Array.from({ length: 9 }, (_, index) => {
      const fraction = index / 8;
      return toothPoint(from + sweep * fraction, radius, 0, axial);
    });
  };
  return [
    toothPoint(terminalAngle(section.terminals[0]), 82, 0, 196),
    toothPoint(startAngle, 212, 0, 112),
    toothPoint(startAngle, 190, 0, 92),
    toothPoint(startAngle, 190, 0, -92),
    ...arc(startAngle, endAngle, 212, -112).slice(1),
    toothPoint(endAngle, 174, 0, 92),
    toothPoint(endAngle, 212, 0, 112),
    toothPoint(terminalAngle(section.terminals[1]), 82, 0, 196),
  ];
}

export function windingState(angle, mode = 'lap') {
  const rotorAngle = mod(angle);
  const safeMode = MODES.includes(mode) ? mode : 'lap';
  const count = brushCount(safeMode);
  const brushes = Array.from({ length: count }, (_, index) => {
    const positive = index % 2 === 0;
    return {
      id: `${positive ? 'B+' : 'B-'}${Math.floor(index / 2) + 1}`,
      index,
      position: mod(180 - index * (360 / count)),
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
        angularDistance(
          180 - index * (360 / SEGMENT_COUNT) - rotorAngle,
          brush.position,
        ) <=
        180 / SEGMENT_COUNT + COMMUTATION_HALF_WIDTH,
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
    coils: coils.map((coil) => ({
      ...coil,
      section: sections[coil.id - 1],
    })),
    totalCurrent: ARMATURE_CURRENT,
  };
}

export function advanceAngle(angle, seconds, degreesPerSecond, running) {
  return mod(angle + (running ? seconds * degreesPerSecond : 0));
}
