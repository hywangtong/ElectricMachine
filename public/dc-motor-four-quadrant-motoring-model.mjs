export const parameters = {
  un: 220, // 额定电枢电压 (V)
  ra: 1.0, // 电机固有电枢电阻 (Ω)
  fluxN: 0.02, // 额定励磁磁通 (Wb) = 20 mWb
  ce: 10, // 电动势常数比例项 Ce = 10 -> Ce*PhiN = 0.2 V/(r/min)
  get ct() {
    return (60 * this.ce) / (2 * Math.PI); // approx 95.492965855 N·m/(Wb·A)
  },
  get kePhiN() {
    return this.ce * this.fluxN; // 0.2 V/(r/min)
  },
  get ktPhiN() {
    return this.ct * this.fluxN; // approx 1.909859 N·m/A
  },
  get betaN() {
    return this.ra / (this.kePhiN * this.ktPhiN); // approx 2.61799 r/(min·N·m)
  },
  get n0N() {
    return this.un / this.kePhiN; // 1100 r/min
  },
  defaultLoadTorque: 40, // 典型额定负载转矩 (N·m)
};

/**
 * 计算给定参数下的理想空载转速与斜率
 * @param {object} [options]
 * @param {number} [options.voltage] 电枢端电压大小 (V)
 * @param {number} [options.resistance] 电枢回路总电阻 Ra + Rext (Ω)
 * @param {number} [options.fluxRatio] 磁通相对额定磁通的比例 Phi / PhiN
 * @param {number} [options.direction] 运行方向: +1 为正向 (第Ⅰ象限), -1 为反向 (第Ⅲ象限)
 */
export function characteristicParameters(options = {}) {
  const voltage = options.voltage ?? parameters.un;
  const resistance = options.resistance ?? parameters.ra;
  const fluxRatio = options.fluxRatio ?? 1.0;
  const direction = options.direction ?? 1;
  const p = parameters;
  const kePhi = p.ce * (p.fluxN * fluxRatio);
  const ktPhi = p.ct * (p.fluxN * fluxRatio);
  // 正向 n0 > 0; 反向 n0 < 0
  const n0 = (direction * voltage) / kePhi;
  // 斜率 beta = R / (KePhi * KtPhi) > 0
  const beta = resistance / (kePhi * ktPhi);
  return { n0, beta, kePhi, ktPhi, direction, voltage, resistance, fluxRatio };
}

/**
 * 机械特性方程: n = n0 - beta * T
 * 对于第Ⅰ象限 (direction=+1): T > 0, n = n0 - beta * T > 0
 * 对于第Ⅲ象限 (direction=-1): T < 0, n = -|n0| - beta * T = -|n0| + beta * |T| < 0
 */
export function speedAtTorque(torque, config) {
  const { n0, beta } = characteristicParameters(config);
  return n0 - beta * torque;
}

/**
 * 计算工作点运行数据
 * @param {number} loadTorque 机械负载转矩绝对值 (N·m)
 * @param {object} config
 */
export function operatingPoint(loadTorque, config) {
  const params = characteristicParameters(config);
  const dir = params.direction;
  // 电磁转矩与方向同号
  const torque = dir * Math.abs(loadTorque);
  const speed = params.n0 - params.beta * torque;
  const emf = params.kePhi * speed; // E = KePhi * n
  // 电流 Ia = (U - E) / R = T / KtPhi
  const current = torque / params.ktPhi;
  const terminalVoltage = dir * params.voltage;
  const pElectrical = terminalVoltage * current; // Pa = Ua * Ia
  const omega = (2 * Math.PI * speed) / 60; // rad/s
  const pMechanical = torque * omega; // Pmech = T * Omega

  // 电动状态判定:
  // 在第Ⅰ象限: T > 0, n > 0 -> T*n > 0
  // 在第Ⅲ象限: T < 0, n < 0 -> T*n > 0
  // 两个象限均吸收电能 (Pa > 0)、输出机械能 (Pmech > 0)
  const isMotoring = torque * speed > 0 && pElectrical > 0 && pMechanical > 0;

  return {
    torque,
    speed,
    emf,
    current,
    terminalVoltage,
    pElectrical,
    pMechanical,
    isMotoring,
    direction: dir,
    quadrant: dir > 0 ? 'I' : 'III',
    ...params,
  };
}

/**
 * 4 个子标签页的配置预设与教学说明
 */
export const tabConfigs = {
  natural: {
    id: 'natural',
    title: '固有特性',
    shortName: '固有特性',
    description:
      '保持额定电压 Ua = UN，额定励磁 If = IfN，电枢回路不外串电阻。',
    color: '#b72828', // Crimson red (matching the slide)
    defaultParam: 0,
    paramLabel: '基准状态',
    paramUnit: '',
    getConfig: (_param, dir) => ({
      voltage: parameters.un,
      resistance: parameters.ra,
      fluxRatio: 1.0,
      direction: dir,
    }),
    summary:
      '固有特性是比较的基准。正向固有特性在第Ⅰ象限，反向固有特性在第Ⅲ象限，关于坐标原点中心对称。斜率小、硬度高。',
    formula:
      'n = \\pm \\frac{U_N}{C_E\\Phi_N} - \\frac{R_a}{C_E C_T \\Phi_N^2} T',
    formulaHtml:
      '<i>n</i> = ± <span class="fraction"><span><i>U</i><sub>N</sub></span><span><i>C</i><sub>E</sub><i>Φ</i><sub>N</sub></span></span> − <span class="fraction"><span><i>R</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sub>N</sub><sup>2</sup></span></span> <i>T</i>',
  },
  resistance: {
    id: 'resistance',
    title: '增加 Ra 的人为特性',
    shortName: '增加 Ra（串电阻）',
    description: '保持 Ua = UN、If = IfN，电枢回路外串附加电阻 Rext。',
    color: '#d46b08', // Ochre / orange (matching the slide)
    minParam: 0.5,
    maxParam: 4.0,
    defaultParam: 2.0,
    paramLabel: '外串电阻 Rext',
    paramUnit: 'Ω',
    getConfig: (rExt, dir) => ({
      voltage: parameters.un,
      resistance: parameters.ra + (rExt ?? 2.0),
      fluxRatio: 1.0,
      direction: dir,
    }),
    summary:
      '理想空载转速 ±n₀ 不变（与固有特性共用纵轴交点）；回路总电阻增大，使转速降落系数 β 增大，机械特性变陡变软。',
    formula: 'n = \\pm n_{0N} - \\frac{R_a + R_{ext}}{C_E C_T \\Phi_N^2} T',
    formulaHtml:
      '<i>n</i> = ± <i>n</i><sub>0N</sub> − <span class="fraction"><span><i>R</i><sub>a</sub> + <i>R</i><sub>ext</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sub>N</sub><sup>2</sup></span></span> <i>T</i>',
  },
  voltage: {
    id: 'voltage',
    title: '降低 Ua 的人为特性',
    shortName: '降低 Ua（调压）',
    description: '保持 If = IfN、回路仅有 Ra，降低电枢端电压 Ua < UN。',
    color: '#1d8348', // Forest green (matching the slide)
    minParam: 100,
    maxParam: 200,
    defaultParam: 140,
    paramLabel: '电枢端电压 Ua',
    paramUnit: 'V',
    getConfig: (v, dir) => ({
      voltage: v ?? 140,
      resistance: parameters.ra,
      fluxRatio: 1.0,
      direction: dir,
    }),
    summary:
      '理想空载转速随电压降低成正比减小（正向下移、反向上移）；特性斜率不变，与固有特性严格平行，硬度不变。',
    formula:
      'n = \\pm \\frac{U_a}{C_E\\Phi_N} - \\frac{R_a}{C_E C_T \\Phi_N^2} T',
    formulaHtml:
      '<i>n</i> = ± <span class="fraction"><span><i>U</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>Φ</i><sub>N</sub></span></span> − <span class="fraction"><span><i>R</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sub>N</sub><sup>2</sup></span></span> <i>T</i>',
  },
  field: {
    id: 'field',
    title: '减小 If 的人为特性',
    shortName: '减小 If（弱磁）',
    description:
      '保持 Ua = UN、回路仅有 Ra，减小励磁电流 If < IfN（弱磁 Φ < ΦN）。',
    color: '#1a5276', // Deep blue / cobalt (matching the slide)
    minParam: 0.65,
    maxParam: 0.95,
    defaultParam: 0.8,
    paramLabel: '磁通比例 Φ/ΦN',
    paramUnit: '',
    getConfig: (flux, dir) => ({
      voltage: parameters.un,
      resistance: parameters.ra,
      fluxRatio: flux ?? 0.8,
      direction: dir,
    }),
    summary:
      '磁通减小使理想空载转速绝对值 |n₀| 升高；且转速降落系数 β ∝ 1/Φ² 显著变大，特性显著变陡变软。',
    formula: 'n = \\pm \\frac{U_N}{C_E\\Phi} - \\frac{R_a}{C_E C_T \\Phi^2} T',
    formulaHtml:
      '<i>n</i> = ± <span class="fraction"><span><i>U</i><sub>N</sub></span><span><i>C</i><sub>E</sub><i>Φ</i></span></span> − <span class="fraction"><span><i>R</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sup>2</sup></span></span> <i>T</i>',
  },
};

/**
 * 制动状态（二、制动状态）子标签页配置与教学说明
 * 顺序要求：01 能耗制动、02 反接制动、03 回馈制动、04 附图全貌（附图全貌置于第四位，默认进入能耗制动）
 */
export const brakingConfigs = {
  dynamic: {
    id: 'dynamic',
    title: '01 能耗制动（过程与运行）',
    shortName: '能耗制动',
    description: '电枢断开电源接到制动电阻 RB (Ua = 0)，机械特性必通过原点 O。',
    color: '#d81b60',
    colorQuad2: '#d81b60', // 能耗制动过程
    colorQuad4: '#1b5e20', // 能耗制动运行
    defaultParam: 4.0,
    paramLabel: '制动电阻 RB',
    paramUnit: 'Ω',
    minParam: 1.0,
    maxParam: 10.0,
    summary:
      '电枢脱离电网接制动电阻 (U=0)，机械特性必过坐标原点 O。第Ⅱ象限为能耗制动过程（减速停机，n>0, T<0）；第Ⅳ象限为能耗制动运行（位能重物倒拉反转运行，n<0, T>0）。电网输入功率 Pa = 0，机械能全部转为电能消耗在电阻上。',
    formula:
      'n = - \\frac{R_a + R_B}{C_E C_T \\Phi_N^2} T = -\\beta_B T \\quad (U_a = 0, n_0 = 0)',
    formulaHtml:
      '<i>n</i> = − <span class="fraction"><span><i>R</i><sub>a</sub> + <i>R</i><sub>B</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sub>N</sub><sup>2</sup></span></span> <i>T</i> = −<i>β</i><sub>B</sub> <i>T</i>&emsp;<span class="eq-note">(<i>U</i><sub>a</sub> = 0, <i>n</i><sub>0</sub> = 0)</span>',
  },
  plugging: {
    id: 'plugging',
    title: '02 反接制动（电压反向与电动势反向）',
    shortName: '反接制动',
    description:
      '电压反向反接用于迅速减速停机；电动势反向反接用于位能负载低速稳定下放。',
    color: '#1565c0',
    colorQuad2: '#1565c0', // 电压反向反接制动
    colorQuad4: '#1565c0', // 电动势反向反接制动
    defaultParam: 10.5,
    paramLabel: '反接制动电阻 RB',
    paramUnit: 'Ω',
    minParam: 5.0,
    maxParam: 15.0,
    summary:
      '① 电压反向反接制动（第Ⅱ象限）：倒换电源极性并串入大电阻 RB，电网电压与反电动势同向顺极叠加，产生极大制动转矩使电机快速停机，电网电能与动能同时化为热能；② 电动势反向反接制动（第Ⅳ象限）：位能负载倒拉转子反转使 E 反向，平衡重物位能实现稳定下放。',
    formula:
      'n = \\mp \\frac{U_N}{C_E\\Phi_N} - \\frac{R_a + R_B}{C_E C_T \\Phi_N^2} T \\quad (|R_B| \\text{ 较大})',
    formulaHtml:
      '<i>n</i> = ∓ <span class="fraction"><span><i>U</i><sub>N</sub></span><span><i>C</i><sub>E</sub><i>Φ</i><sub>N</sub></span></span> − <span class="fraction"><span><i>R</i><sub>a</sub> + <i>R</i><sub>B</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sub>N</sub><sup>2</sup></span></span> <i>T</i>&emsp;<span class="eq-note">(|<i>R</i><sub>B</sub>| 较大)</span>',
  },
  regenerative: {
    id: 'regenerative',
    title: '03 回馈制动（正向与反向回馈）',
    shortName: '回馈制动',
    description:
      '当电机转速超过理想空载转速 (|n| > |n0|) 时，反电动势超过电源电压，电能回馈电网。',
    color: '#a01830',
    colorQuad2: '#a01830', // 正向回馈制动
    colorQuad4: '#a01830', // 反向回馈制动
    defaultParam: 1250,
    paramLabel: '超速转速 |n|',
    paramUnit: 'r/min',
    minParam: 1120,
    maxParam: 1500,
    summary:
      '当外力或位能驱动电机使转速绝对值超过理想空载转速 (|n| > |n₀|) 时，感应电动势 E 超过电源电压，电枢电流 Ia 与电磁转矩 T 自发反向，产生制动作用。正向回馈在第Ⅱ象限（电车下坡或降压降速），反向回馈在第Ⅳ象限（重物下放加速超速）。机械能转化为电能回送电网，经济高效。',
    formula:
      'n = \\pm \\frac{U_a}{C_E\\Phi_N} - \\frac{R_a}{C_E C_T \\Phi_N^2} T \\quad (|n| > |n_0|)',
    formulaHtml:
      '<i>n</i> = ± <span class="fraction"><span><i>U</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>Φ</i><sub>N</sub></span></span> − <span class="fraction"><span><i>R</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sub>N</sub><sup>2</sup></span></span> <i>T</i>&emsp;<span class="eq-note">(|<i>n</i>| &gt; |<i>n</i><sub>0</sub>|)</span>',
  },
  all: {
    id: 'all',
    title: '04 附图全貌（三种制动方法对比）',
    shortName: '附图全貌',
    description:
      '完整展示第Ⅱ象限与第Ⅳ象限中的三种典型制动方法（能耗制动、反接制动、回馈制动）共 6 条机械特性。',
    summary:
      '直流电机在第Ⅱ与第Ⅳ象限均为制动状态。电磁转矩方向与转速相反，起到阻碍转动或限制下放速度的作用。三种制动方法在能量流向、特性斜率及应用场景上各具鲜明特点。',
    formula: 'T \\cdot n < 0 \\implies P_{\\text{mech}} = T\\Omega < 0',
    formulaHtml:
      '<i>T</i> · <i>n</i> &lt; 0 ⇒ <i>P</i><sub>mech</sub> = <i>T</i><i>Ω</i> &lt; 0',
    defaultParam: 40,
    paramLabel: '负载转矩 TL',
    paramUnit: 'N·m',
    minParam: 10,
    maxParam: 60,
  },
};

/**
 * 四象限全貌子标签页配置与教学说明
 */
export const fourQuadrantConfigs = {
  all: {
    id: 'all',
    title: '四象限全貌（电动与制动全部特性）',
    shortName: '四象限全景',
    summary:
      '四象限坐标系完整呈现他励直流电动机的全部运行状态：第Ⅰ象限（正向电动）与第Ⅲ象限（反向电动）中 T·n > 0，为电动状态；第Ⅱ象限（停机制动过程）与第Ⅳ象限（位能下放制动运行）中 T·n < 0，为制动状态。',
    formula:
      'T \\cdot n > 0 \\implies P_{\\text{mech}} > 0 \\quad | \\quad T \\cdot n < 0 \\implies P_{\\text{mech}} < 0',
    formulaHtml:
      '<i>T</i> · <i>n</i> &gt; 0 ⇒ <i>P</i><sub>mech</sub> &gt; 0&emsp;|&emsp;<i>T</i> · <i>n</i> &lt; 0 ⇒ <i>P</i><sub>mech</sub> &lt; 0',
  },
  motoring: {
    id: 'motoring',
    title: '电动特性对比（第Ⅰ、Ⅲ象限）',
    shortName: '电动特性（Ⅰ/Ⅲ）',
    summary:
      '聚焦第Ⅰ象限与第Ⅲ象限的 4 种特性（固有特性、外串电阻、降压调速、减小磁通），电磁转矩均为驱动转矩，吸收电能输出机械能。',
    formula:
      'n = \\pm \\frac{U_a}{C_E\\Phi} - \\frac{R_a + R_{ext}}{C_E C_T \\Phi^2} T',
    formulaHtml:
      '<i>n</i> = ± <span class="fraction"><span><i>U</i><sub>a</sub></span><span><i>C</i><sub>E</sub><i>Φ</i></span></span> − <span class="fraction"><span><i>R</i><sub>a</sub> + <i>R</i><sub>ext</sub></span><span><i>C</i><sub>E</sub><i>C</i><sub>T</sub><i>Φ</i><sup>2</sup></span></span> <i>T</i>',
  },
  braking: {
    id: 'braking',
    title: '制动特性对比（第Ⅱ、Ⅳ象限）',
    shortName: '制动特性（Ⅱ/Ⅳ）',
    summary:
      '聚焦第Ⅱ象限与第Ⅳ象限的三种制动方法（能耗制动、反接制动、回馈制动），电磁转矩为阻碍转矩，电机从轴上吸收机械能。',
    formula: 'P_{\\text{mech}} = T\\Omega < 0 \\quad (T \\text{ 为阻力性质})',
    formulaHtml:
      '<i>P</i><sub>mech</sub> = <i>T</i><i>Ω</i> &lt; 0&emsp;<span class="eq-note">(<i>T</i> 为阻力性质)</span>',
  },
  compare: {
    id: 'compare',
    title: '四象限能量流动与物理本质对比',
    shortName: '四象限能量本质',
    summary:
      '根据 T·n 符号判别状态：同向（T·n > 0）为电动，从电网取用电能（Pa > 0）；反向（T·n < 0）为制动，轴输入机械能（Pmech < 0），回送电网（回馈制动）或消耗在回路电阻上（能耗、反接制动）。',
    formula:
      'P_a = U_a I_a, \\quad P_{\\text{mech}} = T\\Omega, \\quad P_a = P_{\\text{mech}} + \\Delta P',
    formulaHtml:
      '<i>P</i><sub>a</sub> = <i>U</i><sub>a</sub><i>I</i><sub>a</sub>,&emsp;<i>P</i><sub>mech</sub> = <i>T</i><i>Ω</i>,&emsp;<i>P</i><sub>a</sub> = <i>P</i><sub>mech</sub> + Δ<i>P</i>',
  },
};

/**
 * 计算制动状态下的工作点物理量与能量平衡
 * 物理准则：
 * 1. 停机的象限（第Ⅱ象限）：
 *    电机在制动前在第Ⅰ象限拖动位能型负载（TL > 0）在固有特性稳定运行，
 *    交点为 A(TL, nA)，其中 nA = n0N - betaN * TL。
 *    制动开始瞬间由于机械惯性转速不能突变，沿等速度虚线（n = nA）水平延伸
 *    与制动特性曲线相交，该交点决定第Ⅱ象限初始制动工作点！
 * 2. 位能下放象限（第Ⅳ象限）：
 *    重物在重力作用下倒拉电机反转，达到稳态下放时电磁转矩平衡位能负载转矩（T = +TL > 0），
 *    工作点由位能负载线 T = +TL 与第Ⅳ象限制动特性曲线交点决定。
 *
 * @param {'dynamic' | 'plugging' | 'regenerative' | 'all'} method
 * @param {'II' | 'IV'} quadrant 第Ⅱ象限 (T < 0, n > 0) 或 第Ⅳ象限 (T > 0, n < 0)
 * @param {object} [options]
 * @param {number} [options.param] 当前调节参数 (Rb / 超速转速等)
 * @param {number} [options.loadTorque] 负载转矩大小 (N·m)
 */
export function brakingOperatingPoint(method, quadrant, options = {}) {
  const p = parameters;
  const isQuad2 = quadrant === 'II';
  const param = options.param;
  const loadT =
    options.loadTorque !== undefined ? Math.abs(options.loadTorque) : 40;

  // 位能负载与正向固有特性的交点 A(TL, nA)
  const nA = p.n0N - p.betaN * loadT;
  const pointA = { torque: loadT, speed: nA };

  let torque = 0;
  let speed = 0;
  let current = 0;
  let emf = 0;
  let terminalVoltage = 0;
  let resistance = p.ra;
  let pElectrical = 0;

  if (method === 'dynamic') {
    const rb = param ?? brakingConfigs.dynamic.defaultParam;
    resistance = p.ra + rb;
    const beta = resistance / (p.kePhiN * p.ktPhiN);
    if (isQuad2) {
      // 停机过程：等速度虚线 n = nA 与能耗制动特性 n = -beta * T 相交
      speed = nA;
      torque = -speed / beta;
      terminalVoltage = 0;
      emf = p.kePhiN * speed;
      current = torque / p.ktPhiN;
      pElectrical = 0;
    } else {
      // 位能下放：位能负载 T = +loadT 与能耗下放特性 n = -beta * T 相交
      torque = loadT;
      speed = -beta * torque;
      terminalVoltage = 0;
      emf = p.kePhiN * speed;
      current = torque / p.ktPhiN;
      pElectrical = 0;
    }
  } else if (method === 'plugging') {
    const rb = param ?? brakingConfigs.plugging.defaultParam;
    resistance = p.ra + rb;
    const beta = resistance / (p.kePhiN * p.ktPhiN);
    if (isQuad2) {
      // 停机过程：等速度虚线 n = nA 与电压反向反接制动特性 n = -n0N - beta * T 相交
      speed = nA;
      torque = -(p.n0N + speed) / beta;
      terminalVoltage = -p.un;
      emf = p.kePhiN * speed;
      current = (terminalVoltage - emf) / resistance;
      pElectrical = terminalVoltage * current;
    } else {
      // 位能下放：电动势反向反接制动，位能负载 T = +loadT，特性为 n = +n0N - beta * T
      torque = loadT;
      terminalVoltage = p.un;
      speed = p.n0N - beta * torque;
      emf = p.kePhiN * speed;
      current = (terminalVoltage - emf) / resistance;
      pElectrical = terminalVoltage * current;
    }
  } else if (method === 'regenerative') {
    resistance = p.ra;
    if (isQuad2) {
      // 正向回馈制动（电车下坡或降压超速调速，|n| > n0）
      const absSpeed = param ?? brakingConfigs.regenerative.defaultParam;
      terminalVoltage = p.un;
      speed = Math.abs(absSpeed);
      emf = p.kePhiN * speed;
      current = (terminalVoltage - emf) / resistance;
      torque = p.ktPhiN * current;
      pElectrical = terminalVoltage * current;
    } else {
      // 反向回馈制动下放重物（重物倒拉电机超速 |n| > n0N）
      // 稳态下放时平衡位能负载 T = +loadT，处于第Ⅳ象限超速回馈区
      terminalVoltage = -p.un;
      torque = loadT;
      speed = -p.n0N - p.betaN * torque;
      emf = p.kePhiN * speed;
      current = (terminalVoltage - emf) / resistance;
      pElectrical = terminalVoltage * current;
    }
  } else {
    // all: 附图全貌综合视图
    // 停机过程以典型能耗制动 (Rb = 4.0 Ω) 为基准
    const rb = 4.0;
    resistance = p.ra + rb;
    const beta = resistance / (p.kePhiN * p.ktPhiN);
    if (isQuad2) {
      speed = nA;
      torque = -speed / beta;
      terminalVoltage = 0;
      emf = p.kePhiN * speed;
      current = torque / p.ktPhiN;
      pElectrical = 0;
    } else {
      torque = loadT;
      speed = -beta * torque;
      terminalVoltage = 0;
      emf = p.kePhiN * speed;
      current = torque / p.ktPhiN;
      pElectrical = 0;
    }
  }

  const omega = (2 * Math.PI * speed) / 60;
  const pMechanical = torque * omega;
  const isBraking = torque * speed < 0 && pMechanical < 0;

  return {
    method,
    quadrant,
    torque,
    speed,
    emf,
    current,
    terminalVoltage,
    resistance,
    pElectrical,
    pMechanical,
    isBraking,
    pointA,
  };
}

/**
 * 获取附图 6 条制动特性曲线定义
 * @param {object} [options]
 */
export function getBrakingCurveDefinitions(options = {}) {
  const p = parameters;
  const rbDynamic = options.rbDynamic ?? 4.0;
  const rbPlugging = options.rbPlugging ?? 10.5;

  const betaDynamic = (p.ra + rbDynamic) / (p.kePhiN * p.ktPhiN);
  const betaPlugging = (p.ra + rbPlugging) / (p.kePhiN * p.ktPhiN);
  const betaNatural = p.betaN;

  return [
    {
      id: 'fwd-regenerative',
      name: '正向回馈制动',
      method: 'regenerative',
      quadrant: 'II',
      color: '#a01830',
      minT: -80,
      maxT: 0,
      fn: (t) => p.n0N - betaNatural * t,
      start: { torque: 0, speed: p.n0N },
      end: { torque: -80, speed: p.n0N - betaNatural * -80 },
      labelPos: { torque: -40, speed: p.n0N - betaNatural * -40 + 55 },
      labelRotation: -4.5,
    },
    {
      id: 'dynamic-process',
      name: '能耗制动过程',
      method: 'dynamic',
      quadrant: 'II',
      color: '#d81b60',
      minT: -84,
      maxT: 0,
      fn: (t) => -betaDynamic * t,
      start: { torque: 0, speed: 0 },
      end: { torque: -84, speed: -betaDynamic * -84 },
      labelPos: { torque: -45, speed: -betaDynamic * -45 + 50 },
      labelRotation: -28,
    },
    {
      id: 'voltage-plugging',
      name: '电压反向反接制动',
      method: 'plugging',
      quadrant: 'II',
      color: '#1565c0',
      minT: -88.4,
      maxT: -p.n0N / betaPlugging,
      fn: (t) => -p.n0N - betaPlugging * t,
      start: { torque: -p.n0N / betaPlugging, speed: 0 },
      end: { torque: -88.4, speed: -p.n0N - betaPlugging * -88.4 },
      labelPos: { torque: -66, speed: -p.n0N - betaPlugging * -66 + 60 },
      labelRotation: -46,
    },
    {
      id: 'rev-regenerative',
      name: '反向回馈制动',
      method: 'regenerative',
      quadrant: 'IV',
      color: '#a01830',
      minT: 0,
      maxT: 80,
      fn: (t) => -p.n0N - betaNatural * t,
      start: { torque: 0, speed: -p.n0N },
      end: { torque: 80, speed: -p.n0N - betaNatural * 80 },
      labelPos: { torque: 40, speed: -p.n0N - betaNatural * 40 - 70 },
      labelRotation: -4.5,
    },
    {
      id: 'dynamic-running',
      name: '能耗制动运行',
      method: 'dynamic',
      quadrant: 'IV',
      color: '#1b5e20',
      minT: 0,
      maxT: 84,
      fn: (t) => -betaDynamic * t,
      start: { torque: 0, speed: 0 },
      end: { torque: 84, speed: -betaDynamic * 84 },
      labelPos: { torque: 45, speed: -betaDynamic * 45 - 50 },
      labelRotation: -28,
    },
    {
      id: 'emf-plugging',
      name: '电动势反向反接制动',
      method: 'plugging',
      quadrant: 'IV',
      color: '#1565c0',
      minT: p.n0N / betaPlugging,
      maxT: 88.4,
      fn: (t) => p.n0N - betaPlugging * t,
      start: { torque: p.n0N / betaPlugging, speed: 0 },
      end: { torque: 88.4, speed: p.n0N - betaPlugging * 88.4 },
      labelPos: { torque: 66, speed: p.n0N - betaPlugging * 66 - 60 },
      labelRotation: -46,
    },
  ];
}

/**
 * 将公式 LaTeX 语法转换为优雅的 HTML 结构（支持分式、上下标、特殊希腊字符与条件标注）
 * 作为 formulaHtml 的自动兜底转换器
 */
export function renderLatex(str) {
  if (!str) return '';
  return str
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\cdot/g, '·')
    .replace(/\\implies/g, '⇒')
    .replace(/\\Omega/g, '<i>Ω</i>')
    .replace(/\\Delta P/g, 'Δ<i>P</i>')
    .replace(/\\beta_B/g, '<i>β</i><sub>B</sub>')
    .replace(/\\Phi_N\^2/g, '<i>Φ</i><sub>N</sub><sup>2</sup>')
    .replace(/\\Phi\^2/g, '<i>Φ</i><sup>2</sup>')
    .replace(/\\Phi_N/g, '<i>Φ</i><sub>N</sub>')
    .replace(/\\Phi/g, '<i>Φ</i>')
    .replace(/\\quad/g, '&emsp;')
    .replace(/\\text\{([^{}]+)\}/g, '<span class="eq-note">$1</span>')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, num, den) => {
      return `<span class="fraction"><span>${num.trim()}</span><span>${den.trim()}</span></span>`;
    })
    .replace(/([A-Za-z])_([A-Za-z0-9]+)/g, '$1<sub>$2</sub>')
    .replace(/\^2/g, '<sup>2</sup>');
}
