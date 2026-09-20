export const ratedMetrics = {
  power: {
    summary: '额定功率 Pₙ 总指有用输出：电动机看转轴，发电机看输出端。',
    detail: 'power',
    motor: {
      electrical: 'Uₙ 输入电压 · Iₙ 输入电流',
      conversion: 'ηₙ 电→机转换效率',
      shaft: 'Pₙ 轴输出机械功率',
    },
    generator: {
      electrical: 'Pₙ = UₙIₙ 输出电功率',
      conversion: '',
      shaft: '',
    },
  },
  voltage: {
    summary: '同样是 Uₙ：电动机在电源输入端，发电机在负载输出端。',
    detail: 'plain',
    motor: {
      electrical: 'Uₙ 输入端额定电压',
      conversion: '',
      shaft: '',
    },
    generator: {
      electrical: 'Uₙ 输出端额定电压',
      conversion: '',
      shaft: '',
    },
  },
  current: {
    summary: '同样是 Iₙ：电动机从电源吸收，发电机向负载送出。',
    detail: 'plain',
    motor: {
      electrical: 'Iₙ 输入端额定电流',
      conversion: '',
      shaft: '',
    },
    generator: {
      electrical: 'Iₙ 输出负载额定电流',
      conversion: '',
      shaft: '',
    },
  },
  speed: {
    summary: 'nₙ 都在旋转轴上测量；电动机带动负载，发电机由原动机带动。',
    detail: 'plain',
    motor: {
      electrical: '',
      conversion: '',
      shaft: 'nₙ 输出轴额定转速',
    },
    generator: {
      electrical: '',
      conversion: '',
      shaft: 'nₙ 输入轴额定转速',
    },
  },
  efficiency: {
    summary: 'ηₙ = 有用输出 ÷ 总输入；发电机的机械输入不是铭牌 Pₙ。',
    detail: 'efficiency',
    motor: {
      electrical: 'UₙIₙ 端口输入电功率',
      conversion: 'ηₙ 电→机转换效率',
      shaft: 'Pₙ 轴输出机械功率',
    },
    generator: {
      electrical: 'Pₙ = UₙIₙ 输出电功率',
      conversion: 'ηₙ 机→电转换效率',
      shaft: 'P轴入,ₙ 机械输入功率',
    },
  },
};
