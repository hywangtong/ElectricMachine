export const motor = {
  voltage: 220,
  resistance: 1,
  ratedCurrent: 15,
  ratedSpeed: 1500,
  ratedEmf: 205,
};

// Quasi-steady electrical states along a teaching trajectory, not a time-domain solver.
// Field flux is established and constant. Ignore brush drop and armature inductance.
export function operatingPoint(mode, progress, powered = true) {
  const fraction = Math.max(0, Math.min(1, (progress - 2) / 12));
  const speed = powered ? motor.ratedSpeed * fraction : 0;
  const emf = (motor.ratedEmf * speed) / motor.ratedSpeed;
  const voltage =
    mode === 'voltage'
      ? Math.min(motor.voltage, 2 * motor.ratedCurrent * motor.resistance + emf)
      : motor.voltage;
  const externalResistance =
    mode === 'resistance'
      ? Math.max(
          0,
          (voltage - emf) / (2 * motor.ratedCurrent) - motor.resistance,
        )
      : 0;
  const current = powered
    ? (voltage - emf) / (motor.resistance + externalResistance)
    : 0;
  return {
    speed,
    emf,
    voltage,
    externalResistance,
    current,
    armatureDrop: current * motor.resistance,
    externalDrop: current * externalResistance,
    ratio: current / motor.ratedCurrent,
  };
}

export function commutation(angle, current, speed) {
  // Twelve segments; the fixed brush covers ±9° at the right-hand contact.
  // At 0° it sits in the middle of copper, away from the insulating gaps.
  const boundary = ((((angle + 15) % 30) + 30) % 30) - 15;
  return {
    bridging: Math.abs(boundary) > 8 && speed > 0,
    sparking:
      boundary > -7 &&
      boundary < -3 &&
      speed > 0 &&
      current > 4 * motor.ratedCurrent,
  };
}
