export const powerParts = {
  P1: { color: '#16a34a', parts: ['input'] },
  P2: { color: '#2563eb', parts: ['output'] },
  Pal: {
    color: '#facc15',
    parts: ['iron', 'armature', 'field', 'bearings', 'fan', 'brushes', 'stray'],
  },
  PFe: { color: '#facc15', parts: ['iron'] },
  PCu: { color: '#facc15', parts: ['armature', 'field'] },
  Pme: { color: '#facc15', parts: ['bearings', 'fan', 'brushes'] },
  Pad: { color: '#facc15', parts: ['stray'] },
};

const idleLossParts = ['iron', 'bearings', 'fan', 'brushes', 'stray'];

export const flowPowerParts = {
  P1: powerParts.P1,
  P2: powerParts.P2,
  PCu: powerParts.PCu,
  Pe: { color: '#0d9488', parts: [...idleLossParts, ...powerParts.P2.parts] },
  P0: {
    color: '#facc15',
    parts: idleLossParts,
  },
};

export function commutationState(angle) {
  const cosine = Math.cos(angle);
  const commuting = Math.abs(cosine) <= Math.sin((3 * Math.PI) / 180) + 1e-12;
  return { commuting, current: commuting ? 0 : Math.sign(cosine) };
}

// Stator B = -y. Rotor basis vectors rotate by angle about the shaft x.
export function rotorFrameField(angle) {
  return { y: -Math.cos(angle), z: Math.sin(angle) };
}
