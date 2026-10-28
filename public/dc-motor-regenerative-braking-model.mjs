// Signed SI torque/current/voltage; n in r/min. Constant flux in each stage.
// The field-change page idealizes a rapid field increase, neglecting La/Lf.
export const parameters = Object.freeze({
  ua: 220,
  ra: 1,
  ce: 0.2,
  ct: (0.2 * 60) / (2 * Math.PI),
  load: 40,
  inertia: 1.4,
  maxCurrent: 75,
});

export function scenario(mode, rb = 7) {
  const p = parameters;
  const lowering = mode === 'lowering';
  const oldFlux = mode === 'field' ? 0.8 : 1;
  const voltage = lowering ? -p.ua : mode === 'voltage' ? 170 : p.ua;
  const resistance = p.ra + (lowering ? rb : 0);
  const load = mode === 'downhill' ? -p.load : p.load;
  const initial =
    (p.ua - (p.load / (p.ct * oldFlux)) * p.ra) / (p.ce * oldFlux);
  const noLoad = voltage / p.ce;
  const equilibrium = (voltage - (load / p.ct) * resistance) / p.ce;
  const tau = (2 * Math.PI * p.inertia * resistance) / (60 * p.ce * p.ct);
  return {
    mode,
    rb,
    voltage,
    resistance,
    load,
    oldFlux,
    initial,
    noLoad,
    equilibrium,
    tau,
  };
}

export function operatingPoint(speed, config, before = false) {
  const p = parameters;
  const flux = before ? config.oldFlux : 1;
  const voltage = before ? p.ua : config.voltage;
  const resistance = before ? p.ra : config.resistance;
  const emf = p.ce * flux * speed;
  const current = (voltage - emf) / resistance;
  const torque = p.ct * flux * current;
  const sourcePower = voltage * current;
  const convertedPower = emf * current;
  const heat = current ** 2 * resistance;
  return {
    speed,
    voltage,
    emf,
    current,
    torque,
    sourcePower,
    convertedPower,
    heat,
    returnedPower: Math.max(0, -sourcePower),
  };
}

export function speedAt(seconds, config) {
  return (
    config.equilibrium +
    (config.initial - config.equilibrium) *
      Math.exp(-Math.max(0, seconds) / config.tau)
  );
}

export function timeAt(speed, config) {
  const ratio =
    (speed - config.equilibrium) / (config.initial - config.equilibrium);
  return ratio > 0 && ratio <= 1 ? -config.tau * Math.log(ratio) : Infinity;
}

export function phase(speed, config, before = false) {
  if (before) return 'motor';
  const s = operatingPoint(speed, config);
  if (Math.abs(s.current) < 1e-7) return 'no-load';
  if (s.sourcePower < 0) return 'regeneration';
  if (s.convertedPower < 0) return 'plugging';
  if (Math.abs(speed) < 1e-7) return 'zero';
  return 'motor';
}

// Magnitudes for the stable lowering point e, including optional no-load drag.
export function loweringResistance(
  speedMagnitude,
  load = parameters.load,
  drag = 0,
) {
  const p = parameters;
  return (p.ct * (p.ce * speedMagnitude - p.ua)) / (load - drag) - p.ra;
}

export function minimumResistance(
  initialEmf,
  maxCurrent = parameters.maxCurrent,
) {
  return (parameters.ua + Math.abs(initialEmf)) / maxCurrent - parameters.ra;
}
