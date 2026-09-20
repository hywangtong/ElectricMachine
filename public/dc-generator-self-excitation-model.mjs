export const defaultConditions = Object.freeze({
  residual: true,
  aiding: true,
  speed: true,
  resistance: true,
  load: false,
});

export function evaluateExcitation(mode, conditions) {
  if (mode !== 'shunt' && mode !== 'series') {
    throw new Error(`Unknown excitation mode: ${mode}`);
  }

  const fieldPathClosed = mode === 'shunt' || conditions.load;
  const fieldCurrent = fieldPathClosed && conditions.residual;

  if (!conditions.residual) {
    return {
      success: false,
      level: 0,
      fieldCurrent: false,
      reason: '没有剩磁：没有启动反馈的小电压。',
    };
  }
  if (!conditions.speed) {
    return {
      success: false,
      level: 0.035,
      fieldCurrent,
      reason: '转速偏低：感应电压不足，无法持续增磁。',
    };
  }
  if (!fieldPathClosed) {
    return {
      success: false,
      level: 0.08,
      fieldCurrent: false,
      reason: '负载开路：串励电流为 0，只剩很小的剩磁电压。',
    };
  }
  if (!conditions.aiding) {
    return {
      success: false,
      level: 0.025,
      fieldCurrent,
      reason: '接成去磁：励磁电流削弱剩磁，电压无法建立。',
    };
  }
  if (!conditions.resistance) {
    return {
      success: false,
      level: 0.11,
      fieldCurrent,
      reason:
        mode === 'shunt'
          ? '并励电阻过大：励磁电流太小，达不到建压条件。'
          : '串联回路电阻过大：电流太小，难以增磁建压。',
    };
  }

  return {
    success: true,
    level: mode === 'shunt' ? (conditions.load ? 0.84 : 0.94) : 0.86,
    fieldCurrent: true,
    reason:
      mode === 'shunt'
        ? conditions.load
          ? '接入合适轻载：并励支路仍闭合，可以自励建压。'
          : '负载开路：并励支路仍闭合，不接负载也能建压。'
        : '负载回路闭合：电枢、串励绕组和负载有同一电流，可以建压。',
  };
}

export function voltageLevelAt(evaluation, elapsedMs) {
  if (evaluation.level === 0) return 0;
  const start = Math.min(0.07, evaluation.level);
  const growth = 1 - Math.exp(-Math.max(0, elapsedMs) / 850);
  return start + (evaluation.level - start) * growth;
}
