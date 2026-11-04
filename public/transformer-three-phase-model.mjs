// Linear, lossless excitation model. Each quantity uses its own peak as base.
export const PHASES = [
  { name: 'A', terminal: 'U/u', shift: 0, color: '#b65c37', dash: '' },
  { name: 'B', terminal: 'V/v', shift: -120, color: '#297e70', dash: '8 4' },
  { name: 'C', terminal: 'W/w', shift: 120, color: '#536cac', dash: '2 4' },
];

export function sample(degrees) {
  const phases = PHASES.map(({ shift }) => {
    const angle = ((degrees + shift) * Math.PI) / 180;
    const phi = Math.sin(angle);
    return { u: Math.cos(angle), i: phi, phi };
  });
  const [a, b, c] = phases.map(({ phi }) => phi);
  return {
    phases,
    sum: a + b + c,
    // Upper yoke, positive left → right; lower yoke carries the opposite flux.
    yokes: [a, a + b],
  };
}
