// R_ai includes the armature resistance; i counts remaining resistor sections.
// At constant flux and speed, U - E = I2 * R_ai = I1 * R_a(i-1).
export function calculateStartingResistance({
  voltage,
  armature,
  upper,
  lower,
  stages,
}) {
  if (
    ![voltage, armature, upper, lower].every(
      (value) => Number.isFinite(value) && value > 0,
    ) ||
    upper <= lower ||
    voltage / upper <= armature ||
    (stages !== undefined && (!Number.isInteger(stages) || stages < 1))
  )
    throw new RangeError('Expected positive data, I1 > I2 and Ua/I1 > Ra.');
  const initialTotal = voltage / upper;
  const initialRatio = upper / lower;
  const rawStages = Math.log(initialTotal / armature) / Math.log(initialRatio);
  const count = stages ?? Math.ceil(rawStages);
  const ratio = (initialTotal / armature) ** (1 / count);
  const switchingCurrent = upper / ratio;
  const totals = Array.from(
    { length: count + 1 },
    (_, i) => armature * ratio ** i,
  );
  const sections = totals.slice(1).map((total, index) => ({
    i: index + 1,
    before: total,
    after: totals[index],
    resistance: total - totals[index],
    switchingEmf: voltage - switchingCurrent * total,
  }));
  return {
    initialTotal,
    initialRatio,
    rawStages,
    count,
    ratio,
    switchingCurrent,
    totals,
    sections,
  };
}

// Same motor and current ceiling as the preceding stepped-starting lesson.
export const exampleData = {
  voltage: 220,
  armature: 1,
  upper: 28.5,
  lower: 16.5,
  load: 15,
  ratedSpeed: 1500,
  ratedEmf: 205,
};
export const exampleDesign = calculateStartingResistance(exampleData);
