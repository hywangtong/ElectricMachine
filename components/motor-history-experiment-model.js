export const EXPERIMENT_PERIOD = 12;

/** @param {number} value */
function smoothStep(value) {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

/** Deterministic, qualitative teaching model; not measured apparatus data.
 * @param {number} seconds
 */
export function getExperimentState(seconds) {
  const t =
    ((seconds % EXPERIMENT_PERIOD) + EXPERIMENT_PERIOD) % EXPERIMENT_PERIOD;
  const current = t >= 2 && t < 6 ? 1 : t >= 8 && t < 10 ? -1 : 0;
  let compassAngle = 0;
  if (t >= 2 && t < 6) compassAngle = -52 * smoothStep((t - 2) / 0.6);
  if (t >= 6 && t < 8) compassAngle = -52 * (1 - smoothStep((t - 6) / 0.6));
  if (t >= 8 && t < 10) compassAngle = 52 * smoothStep((t - 8) / 0.6);
  if (t >= 10) compassAngle = 52 * (1 - smoothStep((t - 10) / 0.6));

  let magnetTravel = 0;
  let magnetVelocity = 0;
  if (t >= 2 && t < 5) {
    const progress = (t - 2) / 3;
    magnetTravel = 78 * smoothStep(progress);
    magnetVelocity = 156 * progress * (1 - progress);
  } else if (t >= 5 && t < 7) {
    magnetTravel = 78;
  } else if (t >= 7 && t < 10) {
    const progress = (t - 7) / 3;
    magnetTravel = 78 * (1 - smoothStep(progress));
    magnetVelocity = -156 * progress * (1 - progress);
  }

  return {
    current,
    compassAngle: compassAngle || 0,
    compassStatus:
      current === 1
        ? '合闸 · 磁针偏转'
        : current === -1
          ? '反接电源 · 反向偏转'
          : '断电 · 磁针复位',
    // Project a circular orbit into an ellipse; the pivot stays fixed.
    orbitX: 136 - 43 * Math.sin((t * Math.PI) / 2),
    orbitY: 148 + 12 * Math.cos((t * Math.PI) / 2),
    magnetTravel,
    magnetVelocity,
    // Deflection sign depends on winding/terminal convention; relative sign is fixed.
    galvanometerAngle: -magnetVelocity * 0.85 || 0,
    inductionStatus:
      t >= 2 && t < 5
        ? '推入 N 极 · 指针偏转'
        : t >= 7 && t < 10
          ? '抽出 N 极 · 反向偏转'
          : '磁铁静止 · 指针归零',
  };
}
