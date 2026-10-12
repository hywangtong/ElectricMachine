import {
  commutationState,
  flowPowerParts,
  powerParts,
} from './dc-motor-power-anatomy-model.mjs';

export function generatorCommutationState(angle) {
  const state = commutationState(angle);
  return { ...state, current: state.current === 0 ? 0 : -state.current };
}

// Physical part names belong to the shared drawing: output is the shaft,
// input is the electrical terminal. Their roles reverse in generation.
export const generatorPowerParts = {
  ...powerParts,
  P1: { color: '#16a34a', parts: ['output'] },
  P2: { color: '#2563eb', parts: ['input'] },
};

export const generatorFlowPowerParts = {
  ...generatorPowerParts,
  Pe: { color: '#0d9488', parts: ['armature', 'field', 'input'] },
  P0: flowPowerParts.P0,
};

export const generatorDescriptions = {
  P1: [
    '输入机械功率 · 原动机驱动轴',
    'P₁ = T₁Ω = (2π/60)T₁n',
    '原动机以转矩 T₁ 驱动转轴，机械功率从轴端进入发电机。',
  ],
  P2: [
    '输出电功率 · 负载端口',
    'P₂ = UI',
    '端电压 U 与流向外部负载的电流 I 决定输出电功率；并励时 Iₐ = I + If。',
  ],
  Pe: [
    '电磁功率 · 转换为电功率',
    'Pₑ = TₑΩ = EIₐ = P₂ + PCu',
    '轴输入扣除 P₀ 后转为电功率，再分为两类绕组铜耗与负载电输出。',
  ],
  P0: [
    '空载损耗 · 铁耗、机械耗与附加耗',
    'P₀ = PFe + Pme + Pad = P₁ − Pₑ',
    '铁芯、轴承、风扇、电刷摩擦与杂散区域高亮；这一组损耗在电磁转换之前扣除。',
  ],
};
