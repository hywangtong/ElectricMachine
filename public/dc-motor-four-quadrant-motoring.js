import {
  parameters,
  characteristicParameters,
  operatingPoint,
  tabConfigs,
  brakingConfigs,
  fourQuadrantConfigs,
  brakingOperatingPoint,
  getBrakingCurveDefinitions,
  renderLatex,
} from './dc-motor-four-quadrant-motoring-model.mjs';

// SVG 坐标系映射常量
const svgConfig = {
  width: 820,
  height: 450,
  originX: 410,
  originY: 225,
  maxT: 120, // N·m
  maxN: 1550, // r/min
  scaleX: 350 / 120, // 约 2.9167 px / (N·m)
  scaleY: 190 / 1550, // 约 0.12258 px / (r/min)
};

function xCoord(torque) {
  return svgConfig.originX + torque * svgConfig.scaleX;
}

function yCoord(speed) {
  return svgConfig.originY - speed * svgConfig.scaleY;
}

// 解析 URL 查询参数支持默认模式
const urlParams = new URLSearchParams(window.location.search);
const initialMode = urlParams.get('mode');

// 状态管理
const state = {
  mode:
    initialMode === 'motoring' || initialMode === 'four-quadrant'
      ? initialMode
      : 'braking', // 默认进入制动状态（能耗制动）
  activeTab: 'natural', // for motoring: 'natural' | 'resistance' | 'voltage' | 'field'
  activeBrakingTab: 'dynamic', // for braking: 默认进入能耗制动
  activeFqTab: 'all', // for four-quadrant: 'all' | 'motoring' | 'braking' | 'compare'
  showAllMotoring: false,
  direction: 'both', // 'both' | 'fwd' | 'rev'
  isPlaying: true,
  baseLoadTorque: 40,
  animTime: 0,
  fwdRotorAngle: 0,
  revRotorAngle: 0,
  tabParams: {
    natural: 0,
    resistance: 2.0,
    voltage: 140,
    field: 0.8,
  },
  brakingParams: {
    all: 40,
    dynamic: 4.0,
    plugging: 10.5,
    regenerative: 1250,
  },
};

// DOM 元素引用
const el = {
  pageTitle: document.getElementById('page-title'),
  pageDesc: document.getElementById('page-desc'),
  pageScopeTag: document.getElementById('page-scope-tag'),
  modeTabFourQuadrant: document.getElementById('mode-tab-four-quadrant'),
  modeTabMotoring: document.getElementById('mode-tab-motoring'),
  modeTabBraking: document.getElementById('mode-tab-braking'),
  fourQuadrantSubtabs: document.getElementById('four-quadrant-subtabs'),
  motoringSubtabs: document.getElementById('motoring-subtabs'),
  brakingSubtabs: document.getElementById('braking-subtabs'),
  fourQuadrantTabs: document.querySelectorAll(
    '#four-quadrant-subtabs .tab-btn',
  ),
  motoringTabs: document.querySelectorAll('#motoring-subtabs .tab-btn'),
  brakingTabs: document.querySelectorAll('#braking-subtabs .tab-btn'),
  btnShowAll: document.getElementById('btn-show-all'),
  btnTogglePlay: document.getElementById('btn-toggle-play'),
  chartTitle: document.getElementById('chart-title'),
  chartSubtitle: document.getElementById('chart-subtitle'),
  dirPills: document.querySelectorAll('.dir-pill'),
  dirPillBoth: document.getElementById('dir-pill-both'),
  dirPillPos: document.getElementById('dir-pill-pos'),
  dirPillNeg: document.getElementById('dir-pill-neg'),
  badgeQuad1: document.getElementById('badge-quad1'),
  badgeQuad3: document.getElementById('badge-quad3'),
  badgeQuad2: document.getElementById('badge-quad2'),
  badgeQuad4: document.getElementById('badge-quad4'),
  motorVisualCardTitle: document.getElementById('motor-visual-card-title'),
  motoringStatusBadge: document.getElementById('motoring-status-badge'),
  fwdDiagBox: document.getElementById('fwd-diag-box'),
  revDiagBox: document.getElementById('rev-diag-box'),
  fwdDiagTitle: document.getElementById('fwd-diag-title'),
  revDiagTitle: document.getElementById('rev-diag-title'),
  fwdDiagStat: document.getElementById('fwd-diag-stat'),
  revDiagStat: document.getElementById('rev-diag-stat'),
  paramSlider: document.getElementById('param-slider'),
  paramSliderLabel: document.getElementById('param-slider-label'),
  paramSliderOutput: document.getElementById('param-slider-output'),
  readoutSpeed: document.getElementById('readout-speed'),
  readoutTorque: document.getElementById('readout-torque'),
  readoutCurrent: document.getElementById('readout-current'),
  readoutEmf: document.getElementById('readout-emf'),
  readoutPmech: document.getElementById('readout-pmech'),
  readoutPa: document.getElementById('readout-pa'),
  theoryTitle: document.getElementById('theory-title'),
  theoryEquation: document.getElementById('theory-equation'),
  theoryAnalysis: document.getElementById('theory-analysis'),
  theoryConclusion: document.getElementById('theory-conclusion'),
  footerParams: document.getElementById('footer-params'),
  footerTips: document.getElementById('footer-tips'),
  gridGroup: document.getElementById('grid-group'),
  axesGroup: document.getElementById('axes-group'),
  curvesBgGroup: document.getElementById('curves-background-group'),
  curvesActiveGroup: document.getElementById('curves-active-group'),
  curvesLoadGroup: document.getElementById('curves-load-group'),
  curveLabelsGroup: document.getElementById('curve-labels-group'),
  pointsGroup: document.getElementById('points-group'),
  motorFwdSvg: document.getElementById('motor-fwd-svg'),
  motorRevSvg: document.getElementById('motor-rev-svg'),
};

/**
 * 绘制坐标轴、刻度与背景象限高亮
 */
function renderAxes() {
  const { originX, originY } = svgConfig;
  const isBraking = state.mode === 'braking';

  // 网格线
  let gridHtml = '';
  // 转矩垂直参考线
  [-100, -50, 50, 100].forEach((t) => {
    const x = xCoord(t);
    gridHtml += `<line class="grid-line" x1="${x}" y1="25" x2="${x}" y2="425" />`;
  });
  // 转速水平参考线
  [-1100, -500, 500, 1100].forEach((n) => {
    const y = yCoord(n);
    gridHtml += `<line class="grid-line" x1="40" y1="${y}" x2="780" y2="${y}" />`;
  });

  if (state.mode === 'four-quadrant') {
    // 四象限全貌：背景四个象限均轻微着色并标明象限名称与运行性质
    gridHtml += `
      <rect x="${originX}" y="25" width="370" height="${originY - 25}" fill="#f2f9f4" opacity="0.38" />
      <rect x="40" y="25" width="${originX - 40}" height="${originY - 25}" fill="#f2f7fc" opacity="0.38" />
      <rect x="40" y="${originY}" width="${originX - 40}" height="200" fill="#fdf4f8" opacity="0.38" />
      <rect x="${originX}" y="${originY}" width="370" height="200" fill="#fcf3f5" opacity="0.38" />
      <text x="590" y="55" fill="#1b5e20" font-size="13" font-weight="700" opacity="0.8">第Ⅰ象限 · 电动区 (T>0, n>0)</text>
      <text x="60" y="55" fill="#880e4f" font-size="13" font-weight="700" opacity="0.8">第Ⅱ象限 · 制动区 (T<0, n>0)</text>
      <text x="60" y="415" fill="#4a154b" font-size="13" font-weight="700" opacity="0.8">第Ⅲ象限 · 电动区 (T<0, n<0)</text>
      <text x="590" y="415" fill="#1b5e20" font-size="13" font-weight="700" opacity="0.8">第Ⅳ象限 · 制动区 (T>0, n<0)</text>
    `;
  } else if (!isBraking) {
    // 电动状态：高亮第Ⅰ象限（正向电动）与第Ⅲ象限（反向电动）
    gridHtml += `
      <rect x="${originX}" y="25" width="370" height="${originY - 25}" fill="#f2f9f4" opacity="0.38" />
      <rect x="40" y="${originY}" width="${originX - 40}" height="200" fill="#fdf4f8" opacity="0.38" />
      <text x="160" y="70" fill="#8ca59e" font-size="14" font-weight="600" opacity="0.7">第Ⅱ象限 · 制动状态区</text>
      <text x="600" y="380" fill="#8ca59e" font-size="14" font-weight="600" opacity="0.7">第Ⅳ象限 · 制动状态区</text>
    `;
  } else {
    // 制动状态：高亮第Ⅱ象限（减速停机制动）与第Ⅳ象限（位能下放制动）
    gridHtml += `
      <rect x="40" y="25" width="${originX - 40}" height="${originY - 25}" fill="#f2f7fc" opacity="0.45" />
      <rect x="${originX}" y="${originY}" width="370" height="200" fill="#fcf3f5" opacity="0.45" />
      <!-- 参照附图左上方醒目标题 -->
      <text x="56" y="48" fill="#15325b" font-size="28" font-weight="900" font-family="'SimHei', 'Microsoft YaHei', sans-serif">二、制动状态</text>
      <text x="600" y="70" fill="#8ca59e" font-size="14" font-weight="600" opacity="0.6">第Ⅰ象限 · 正向电动区</text>
      <text x="160" y="380" fill="#8ca59e" font-size="14" font-weight="600" opacity="0.6">第Ⅲ象限 · 反向电动区</text>
    `;
  }
  el.gridGroup.innerHTML = gridHtml;

  // 坐标轴与原点
  let axesHtml = `
    <!-- 横轴 T -->
    <line class="axis-line" x1="30" y1="${originY}" x2="790" y2="${originY}" marker-end="url(#axis-arrow)" />
    <!-- 纵轴 n -->
    <line class="axis-line" x1="${originX}" y1="435" x2="${originX}" y2="15" marker-end="url(#axis-arrow)" />
    <!-- 原点与轴标签 (参照附图风格：原点斜粗体 O) -->
    <text class="axis-label" x="${originX - 18}" y="${originY + 24}" font-style="italic" font-weight="bold">O</text>
    <text class="axis-label" x="786" y="${originY + 28}" font-style="italic" font-weight="bold">T</text>
    <text class="axis-label" x="${originX - 26}" y="22" font-style="italic" font-weight="bold">n</text>
  `;

  // 坐标刻度与数字
  [-100, -50, 50, 100].forEach((t) => {
    const x = xCoord(t);
    axesHtml += `
      <line class="axis-tick" x1="${x}" y1="${originY - 4}" x2="${x}" y2="${originY + 4}" />
      <text class="axis-tick-text" x="${x}" y="${originY + 18}" text-anchor="middle">${t}</text>
    `;
  });

  [-1100, -700, 700, 1100].forEach((n) => {
    const y = yCoord(n);
    axesHtml += `
      <line class="axis-tick" x1="${originX - 4}" y1="${y}" x2="${originX + 4}" y2="${y}" />
      <text class="axis-tick-text" x="${originX - 8}" y="${y + 4}" text-anchor="end">${n}</text>
    `;
  });

  el.axesGroup.innerHTML = axesHtml;
}

/**
 * 生成单条机械特性路径 d 属性
 */
function getCurvePathData(config, minT, maxT) {
  const steps = 40;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = minT + ((maxT - minT) * i) / steps;
    const { n0, beta } = characteristicParameters(config);
    const n = n0 - beta * t;
    const x = xCoord(t);
    const y = yCoord(n);
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}

/**
 * 渲染负载的机械特性曲线
 * 特点：
 * 1. 电动状态与四象限全貌：使用反抗性恒转矩负载，负载转矩方向总与旋转方向相反，
 *    位于第Ⅰ象限 (n>0, T=+TL) 与第Ⅲ象限 (n<0, T=-TL)；
 * 2. 制动状态下：不应使用反抗性负载，应该显示位能型负载！
 *    位能型恒转矩负载转矩方向恒定（如提升机构重物重力），位于 +TL 垂直线（贯穿第Ⅰ与第Ⅳ象限）。
 */
function renderLoadCharacteristicCurve() {
  if (!el.curvesLoadGroup) return;

  const absTl = Math.abs(state.baseLoadTorque);
  const isBrakingLoad =
    state.mode === 'braking' ||
    (state.mode === 'four-quadrant' && state.activeFqTab === 'braking');

  const xPos = xCoord(absTl);
  const yTop = yCoord(1500); // 纵坐标上限
  const yBot = yCoord(-1500); // 纵坐标下限
  const y0 = svgConfig.originY; // n = 0 处基准线

  if (isBrakingLoad) {
    // 制动状态：位能型恒转矩负载（方向恒定，位于 T = +TL 垂直线）
    const showPos = state.direction === 'both' || state.direction === 'fwd';
    const showNeg = state.direction === 'both' || state.direction === 'rev';

    let pathD = '';
    if (showPos && showNeg) {
      pathD = `M ${xPos.toFixed(1)} ${yTop.toFixed(1)} L ${xPos.toFixed(1)} ${yBot.toFixed(1)}`;
    } else if (showPos) {
      // 停机制动第Ⅱ象限：对应制动前第Ⅰ象限提升重物电动状态
      pathD = `M ${xPos.toFixed(1)} ${yTop.toFixed(1)} L ${xPos.toFixed(1)} ${y0.toFixed(1)}`;
    } else if (showNeg) {
      // 位能下放第Ⅳ象限：重物下放运行
      pathD = `M ${xPos.toFixed(1)} ${y0.toFixed(1)} L ${xPos.toFixed(1)} ${yBot.toFixed(1)}`;
    }

    let loadHtml = `
      <!-- 位能型恒转矩负载特性曲线路径 (垂直线 T = +TL) -->
      <path class="curve-path load-curve-path" d="${pathD}" stroke="#0f766e" stroke-width="3.2" stroke-dasharray="6 3" stroke-linecap="round" fill="none" opacity="0.92" />
    `;

    if (showPos) {
      loadHtml += `
        <g transform="translate(${xPos.toFixed(1)}, ${yTop.toFixed(1)})">
          <rect x="6" y="2" width="170" height="20" rx="3" fill="#ffffff" fill-opacity="0.9" stroke="#0f766e" stroke-width="1" />
          <text class="curve-label load-curve-label" x="12" y="16" fill="#0f766e" font-size="12" font-weight="700">
            +T_L 位能型负载 (${absTl.toFixed(1)} N·m)
          </text>
        </g>
      `;
    } else if (showNeg) {
      loadHtml += `
        <g transform="translate(${xPos.toFixed(1)}, ${yBot.toFixed(1)})">
          <rect x="6" y="-22" width="170" height="20" rx="3" fill="#ffffff" fill-opacity="0.9" stroke="#0f766e" stroke-width="1" />
          <text class="curve-label load-curve-label" x="12" y="-8" fill="#0f766e" font-size="12" font-weight="700">
            +T_L 位能型负载 (${absTl.toFixed(1)} N·m)
          </text>
        </g>
      `;
    }

    el.curvesLoadGroup.innerHTML = loadHtml;
    return;
  }

  // 象限与方向可见性 (反抗性负载)
  const showPos =
    state.mode === 'four-quadrant' ||
    state.direction === 'both' ||
    state.direction === 'fwd';
  const showNeg =
    state.mode === 'four-quadrant' ||
    state.direction === 'both' ||
    state.direction === 'rev';

  const xNeg = xCoord(-absTl);

  let pathD = '';
  if (showPos && showNeg) {
    pathD = `M ${xPos.toFixed(1)} ${yTop.toFixed(1)} L ${xPos.toFixed(1)} ${y0.toFixed(1)} L ${xNeg.toFixed(1)} ${y0.toFixed(1)} L ${xNeg.toFixed(1)} ${yBot.toFixed(1)}`;
  } else if (showPos) {
    pathD = `M ${xPos.toFixed(1)} ${yTop.toFixed(1)} L ${xPos.toFixed(1)} ${y0.toFixed(1)}`;
  } else if (showNeg) {
    pathD = `M ${xNeg.toFixed(1)} ${y0.toFixed(1)} L ${xNeg.toFixed(1)} ${yBot.toFixed(1)}`;
  }

  let loadHtml = `
    <!-- 反抗性恒转矩负载特性曲线路径 -->
    <path class="curve-path load-curve-path" d="${pathD}" stroke="#0f766e" stroke-width="3.2" stroke-dasharray="6 3" stroke-linecap="round" fill="none" opacity="0.92" />
  `;

  // 曲线文字说明标签 (带半透明背景与描边防重叠)
  if (showPos) {
    loadHtml += `
      <g transform="translate(${xPos.toFixed(1)}, ${yTop.toFixed(1)})">
        <rect x="6" y="2" width="170" height="20" rx="3" fill="#ffffff" fill-opacity="0.9" stroke="#0f766e" stroke-width="1" />
        <text class="curve-label load-curve-label" x="12" y="16" fill="#0f766e" font-size="12" font-weight="700">
          +T_L 反抗性负载 (${absTl.toFixed(1)} N·m)
        </text>
      </g>
    `;
  }
  if (showNeg) {
    loadHtml += `
      <g transform="translate(${xNeg.toFixed(1)}, ${yBot.toFixed(1)})">
        <rect x="-176" y="-22" width="170" height="20" rx="3" fill="#ffffff" fill-opacity="0.9" stroke="#0f766e" stroke-width="1" />
        <text class="curve-label load-curve-label" x="-170" y="-8" fill="#0f766e" font-size="12" font-weight="700">
          -T_L 反抗性负载 (-${absTl.toFixed(1)} N·m)
        </text>
      </g>
    `;
  }

  el.curvesLoadGroup.innerHTML = loadHtml;
}

/**
 * 渲染机械特性曲线与文字标签
 */
function renderCurves() {
  if (state.mode === 'four-quadrant') {
    renderFourQuadrantCurves();
  } else if (state.mode === 'motoring') {
    renderMotoringCurves();
  } else {
    renderBrakingCurves();
  }
  renderLoadCharacteristicCurve();
}

/**
 * 渲染四象限全貌特性曲线 (同时显示第Ⅰ、Ⅲ象限电动状态与第Ⅱ、Ⅳ象限制动状态的全部曲线)
 */
function renderFourQuadrantCurves() {
  const showQ1Q3 = state.direction === 'both' || state.direction === 'fwd';
  const showQ2Q4 = state.direction === 'both' || state.direction === 'rev';
  const fqTab = state.activeFqTab || 'all';

  let activeHtml = '';
  let labelsHtml = '';

  // 1. 渲染电动状态特性曲线 (第Ⅰ与第Ⅲ象限：4 种特性)
  if (showQ1Q3) {
    const tabKeys = ['field', 'natural', 'resistance', 'voltage'];
    tabKeys.forEach((key) => {
      const tConf = tabConfigs[key];
      const pVal = state.tabParams[key];
      const isEmphasized =
        fqTab === 'all' ||
        fqTab === 'motoring' ||
        (fqTab === 'compare' && key === 'natural');
      const strokeW = isEmphasized ? (key === 'natural' ? 4.2 : 3.2) : 2.0;
      const opacity = isEmphasized ? 0.95 : 0.38;

      // 第Ⅰ象限 (正向电动)
      const cfgFwd = tConf.getConfig(pVal, 1);
      const dFwd = getCurvePathData(cfgFwd, 0, 100);
      activeHtml += `<path class="curve-path" d="${dFwd}" stroke="${tConf.color}" stroke-width="${strokeW}" opacity="${opacity}" />`;

      // 第Ⅲ象限 (反向电动)
      const cfgRev = tConf.getConfig(pVal, -1);
      const dRev = getCurvePathData(cfgRev, -100, 0);
      activeHtml += `<path class="curve-path" d="${dRev}" stroke="${tConf.color}" stroke-width="${strokeW}" opacity="${opacity}" />`;
    });

    // 绘制第Ⅰ象限曲线文字标签
    labelsHtml += `
      <g transform="translate(435, 76)">
        <text class="curve-label" fill="${tabConfigs.field.color}" transform="rotate(7)">减小 I_f 的人为特性</text>
      </g>
      <g transform="translate(450, 102)">
        <text class="curve-label" fill="${tabConfigs.natural.color}" transform="rotate(5)">正向固有特性</text>
      </g>
      <g transform="translate(490, 142)">
        <text class="curve-label" fill="${tabConfigs.resistance.color}" transform="rotate(13)">增加 R_a 的人为特性</text>
      </g>
      <g transform="translate(415, 172)">
        <text class="curve-label" fill="${tabConfigs.voltage.color}" transform="rotate(5)">降低 U_a 的人为特性</text>
      </g>
    `;

    // 绘制第Ⅲ象限曲线文字标签
    labelsHtml += `
      <g transform="translate(220, 276)">
        <text class="curve-label" fill="${tabConfigs.voltage.color}" transform="rotate(5)">降低 U_a 的人为特性</text>
      </g>
      <g transform="translate(150, 316)">
        <text class="curve-label" fill="${tabConfigs.resistance.color}" transform="rotate(14)">增加 R_a 的人为特性</text>
      </g>
      <g transform="translate(200, 350)">
        <text class="curve-label" fill="${tabConfigs.natural.color}" transform="rotate(5)">反向固有特性</text>
      </g>
      <g transform="translate(185, 396)">
        <text class="curve-label" fill="${tabConfigs.field.color}" transform="rotate(7)">减小 I_f 的人为特性</text>
      </g>
    `;
  }

  // 2. 渲染制动状态特性曲线 (第Ⅱ与第Ⅳ象限：6 条典型特性)
  if (showQ2Q4) {
    const brakingCurves = getBrakingCurveDefinitions({
      rbDynamic: state.brakingParams.dynamic,
      rbPlugging: state.brakingParams.plugging,
    });

    brakingCurves.forEach((curve) => {
      const isEmphasized =
        fqTab === 'all' || fqTab === 'braking' || fqTab === 'compare';
      const strokeW = isEmphasized ? 3.6 : 2.0;
      const opacity = isEmphasized ? 0.95 : 0.38;

      const x1 = xCoord(curve.start.torque);
      const y1 = yCoord(curve.start.speed);
      const x2 = xCoord(curve.end.torque);
      const y2 = yCoord(curve.end.speed);
      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;

      activeHtml += `<path class="curve-path" d="${d}" stroke="${curve.color}" stroke-width="${strokeW}" opacity="${opacity}" />`;

      // 绘制制动文字标注
      const lx = xCoord(curve.labelPos.torque);
      const ly = yCoord(curve.labelPos.speed);
      labelsHtml += `
        <g transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)})">
          <text class="curve-label" fill="${curve.color}" transform="rotate(${curve.labelRotation})" font-weight="bold" font-size="14" text-anchor="middle">
            ${curve.name}
          </text>
        </g>
      `;
    });
  }

  el.curvesBgGroup.innerHTML = '';
  el.curvesActiveGroup.innerHTML = activeHtml;
  el.curveLabelsGroup.innerHTML = labelsHtml;
}

/**
 * 渲染电动状态特性曲线 (第Ⅰ与第Ⅲ象限)
 */
function renderMotoringCurves() {
  const tab = tabConfigs[state.activeTab];
  const param = state.tabParams[state.activeTab];

  let bgHtml = '';
  let activeHtml = '';
  let labelsHtml = '';

  const showFwd = state.direction === 'both' || state.direction === 'fwd';
  const showRev = state.direction === 'both' || state.direction === 'rev';

  // 1. 如果不是固有特性，且未开启 showAll，则以淡红色虚线绘制基准“固有特性”
  if (state.activeTab !== 'natural' && !state.showAllMotoring) {
    if (showFwd) {
      const natFwdCfg = tabConfigs.natural.getConfig(0, 1);
      const d = getCurvePathData(natFwdCfg, 0, 100);
      bgHtml += `<path class="curve-path faint" d="${d}" stroke="${tabConfigs.natural.color}" stroke-width="2.5" />`;
    }
    if (showRev) {
      const natRevCfg = tabConfigs.natural.getConfig(0, -1);
      const d = getCurvePathData(natRevCfg, -100, 0);
      bgHtml += `<path class="curve-path faint" d="${d}" stroke="${tabConfigs.natural.color}" stroke-width="2.5" />`;
    }
  }

  // 2. 如果开启了“叠加全部特性”，则依次绘制全部 4 种特性
  if (state.showAllMotoring) {
    const tabKeys = ['field', 'natural', 'resistance', 'voltage'];
    tabKeys.forEach((key) => {
      const tConf = tabConfigs[key];
      const pVal = state.tabParams[key];
      const isCur = key === state.activeTab;
      const strokeW = isCur ? 4.5 : 3.0;
      const opacity = isCur ? 1.0 : 0.78;

      if (showFwd) {
        const cfg = tConf.getConfig(pVal, 1);
        const d = getCurvePathData(cfg, 0, 100);
        bgHtml += `<path class="curve-path" d="${d}" stroke="${tConf.color}" stroke-width="${strokeW}" opacity="${opacity}" />`;
      }
      if (showRev) {
        const cfg = tConf.getConfig(pVal, -1);
        const d = getCurvePathData(cfg, -100, 0);
        bgHtml += `<path class="curve-path" d="${d}" stroke="${tConf.color}" stroke-width="${strokeW}" opacity="${opacity}" />`;
      }
    });

    if (showFwd) {
      labelsHtml += `
        <g transform="translate(425, 76)">
          <text class="curve-label" fill="${tabConfigs.field.color}" transform="rotate(7)">减小 I_f 的人为特性</text>
        </g>
        <g transform="translate(450, 102)">
          <text class="curve-label" fill="${tabConfigs.natural.color}" transform="rotate(5)">正向固有特性</text>
        </g>
        <g transform="translate(490, 142)">
          <text class="curve-label" fill="${tabConfigs.resistance.color}" transform="rotate(13)">增加 R_a 的人为特性</text>
        </g>
        <g transform="translate(415, 172)">
          <text class="curve-label" fill="${tabConfigs.voltage.color}" transform="rotate(5)">降低 U_a 的人为特性</text>
        </g>
      `;
    }

    if (showRev) {
      labelsHtml += `
        <g transform="translate(220, 276)">
          <text class="curve-label" fill="${tabConfigs.voltage.color}" transform="rotate(5)">降低 U_a 的人为特性</text>
        </g>
        <g transform="translate(150, 316)">
          <text class="curve-label" fill="${tabConfigs.resistance.color}" transform="rotate(14)">增加 R_a 的人为特性</text>
        </g>
        <g transform="translate(200, 350)">
          <text class="curve-label" fill="${tabConfigs.natural.color}" transform="rotate(5)">反向固有特性</text>
        </g>
        <g transform="translate(185, 396)">
          <text class="curve-label" fill="${tabConfigs.field.color}" transform="rotate(7)">减小 I_f 的人为特性</text>
        </g>
      `;
    }
  } else {
    // 3. 单标签页高亮模式
    if (showFwd) {
      const cfgFwd = tab.getConfig(param, 1);
      const dFwd = getCurvePathData(cfgFwd, 0, 100);
      activeHtml += `<path class="curve-path" d="${dFwd}" stroke="${tab.color}" stroke-width="4.5" />`;

      const fwdLabelText =
        state.activeTab === 'natural' ? '正向固有特性' : `${tab.title}（正向）`;
      const fwdParams = characteristicParameters(cfgFwd);
      const labelY = yCoord(fwdParams.n0 - fwdParams.beta * 30) - 12;
      const labelX = xCoord(30);
      labelsHtml += `
        <text class="curve-label" x="${labelX}" y="${labelY}" fill="${tab.color}">${fwdLabelText}</text>
      `;
    }

    if (showRev) {
      const cfgRev = tab.getConfig(param, -1);
      const dRev = getCurvePathData(cfgRev, -100, 0);
      activeHtml += `<path class="curve-path" d="${dRev}" stroke="${tab.color}" stroke-width="4.5" />`;

      const revLabelText =
        state.activeTab === 'natural' ? '反向固有特性' : `${tab.title}（反向）`;
      const revParams = characteristicParameters(cfgRev);
      const labelY = yCoord(revParams.n0 - revParams.beta * -60) + 24;
      const labelX = xCoord(-75);
      labelsHtml += `
        <text class="curve-label" x="${labelX}" y="${labelY}" fill="${tab.color}">${revLabelText}</text>
      `;
    }
  }

  el.curvesBgGroup.innerHTML = bgHtml;
  el.curvesActiveGroup.innerHTML = activeHtml;
  el.curveLabelsGroup.innerHTML = labelsHtml;
}

/**
 * 渲染制动状态特性曲线 (参照附图：第Ⅱ与第Ⅳ象限 6 条曲线)
 */
function renderBrakingCurves() {
  const showQ2 = state.direction === 'both' || state.direction === 'fwd';
  const showQ4 = state.direction === 'both' || state.direction === 'rev';
  const activeTab = state.activeBrakingTab;

  const curves = getBrakingCurveDefinitions({
    rbDynamic: state.brakingParams.dynamic,
    rbPlugging: state.brakingParams.plugging,
  });

  let bgHtml = '';
  let activeHtml = '';
  let labelsHtml = '';

  curves.forEach((curve) => {
    const isCurveInQ2 = curve.quadrant === 'II';
    const isVisibleByDir = isCurveInQ2 ? showQ2 : showQ4;
    if (!isVisibleByDir) return;

    // 是否为当前选中的制动方法（当选中“附图全貌”all 时全显）
    const isCurMethod = activeTab === 'all' || curve.method === activeTab;

    // 绘制曲线路径
    const x1 = xCoord(curve.start.torque);
    const y1 = yCoord(curve.start.speed);
    const x2 = xCoord(curve.end.torque);
    const y2 = yCoord(curve.end.speed);
    const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;

    if (isCurMethod) {
      const strokeW = 4.2;
      activeHtml += `<path class="curve-path" d="${d}" stroke="${curve.color}" stroke-width="${strokeW}" />`;

      // 绘制附图标注文字
      const lx = xCoord(curve.labelPos.torque);
      const ly = yCoord(curve.labelPos.speed);
      labelsHtml += `
        <g transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)})">
          <text class="curve-label" fill="${curve.color}" transform="rotate(${curve.labelRotation})" font-weight="bold" font-size="15" text-anchor="middle">
            ${curve.name}
          </text>
        </g>
      `;
    } else {
      // 非当前制动方法以淡色虚线作为背景参考
      bgHtml += `<path class="curve-path faint" d="${d}" stroke="${curve.color}" stroke-width="2.2" stroke-dasharray="4 4" opacity="0.32" />`;
    }
  });

  // 观察停机制动（第Ⅱ象限）时，同步绘制第Ⅰ象限正向固有特性作为制动前的电动运行基准
  if (showQ2) {
    const natCfg = tabConfigs.natural.getConfig(0, 1);
    const dNat = getCurvePathData(natCfg, 0, 85);
    bgHtml += `<path class="curve-path faint" d="${dNat}" stroke="${tabConfigs.natural.color}" stroke-width="2.6" stroke-dasharray="5 3" opacity="0.75" />`;
    const natParams = characteristicParameters(natCfg);
    const natLabelY = yCoord(natParams.n0 - natParams.beta * 35) - 12;
    const natLabelX = xCoord(35);
    labelsHtml += `
      <g transform="translate(${natLabelX.toFixed(1)}, ${natLabelY.toFixed(1)})">
        <text class="curve-label" fill="${tabConfigs.natural.color}" font-weight="700" opacity="0.9">正向固有特性（制动前基准）</text>
      </g>
    `;
  }

  el.curvesBgGroup.innerHTML = bgHtml;
  el.curvesActiveGroup.innerHTML = activeHtml;
  el.curveLabelsGroup.innerHTML = labelsHtml;
}

/**
 * 渲染动态工作点与投影参考线
 */
function renderPoints() {
  if (state.mode === 'four-quadrant') {
    renderFourQuadrantPoints();
  } else if (state.mode === 'motoring') {
    renderMotoringPoints();
  } else {
    renderBrakingPoints();
  }
}

/**
 * 渲染四象限全貌工作点
 */
function renderFourQuadrantPoints() {
  const showQ1Q3 = state.direction === 'both' || state.direction === 'fwd';
  const showQ2Q4 = state.direction === 'both' || state.direction === 'rev';

  const currentLoad = state.baseLoadTorque;

  let pointsHtml = '';

  // 1. 第Ⅰ与第Ⅲ象限电动工作点
  if (showQ1Q3) {
    const natCfgFwd = tabConfigs.natural.getConfig(0, 1);
    const ptFwd = operatingPoint(currentLoad, natCfgFwd);
    const x1 = xCoord(ptFwd.torque);
    const y1 = yCoord(ptFwd.speed);
    pointsHtml += `
      <line class="grid-line" x1="${x1}" y1="${y1}" x2="${x1}" y2="${svgConfig.originY}" stroke="${tabConfigs.natural.color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x1}" y1="${y1}" x2="${svgConfig.originX}" y2="${y1}" stroke="${tabConfigs.natural.color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x1}, ${y1})">
        <circle class="halo" r="8" stroke="${tabConfigs.natural.color}" />
        <circle class="core" r="6" fill="${tabConfigs.natural.color}" />
      </g>
      <g transform="translate(${x1 + 12}, ${y1 - 12})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="118" height="22" fill="#173b3b" />
        <text class="point-tooltip" x="3" y="0">A₁ (${ptFwd.torque.toFixed(1)}, ${ptFwd.speed.toFixed(0)}) 电动</text>
      </g>
    `;

    const natCfgRev = tabConfigs.natural.getConfig(0, -1);
    const ptRev = operatingPoint(currentLoad, natCfgRev);
    const x3 = xCoord(ptRev.torque);
    const y3 = yCoord(ptRev.speed);
    pointsHtml += `
      <line class="grid-line" x1="${x3}" y1="${y3}" x2="${x3}" y2="${svgConfig.originY}" stroke="${tabConfigs.natural.color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x3}" y1="${y3}" x2="${svgConfig.originX}" y2="${y3}" stroke="${tabConfigs.natural.color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x3}, ${y3})">
        <circle class="halo" r="8" stroke="${tabConfigs.natural.color}" />
        <circle class="core" r="6" fill="${tabConfigs.natural.color}" />
      </g>
      <g transform="translate(${x3 - 128}, ${y3 + 20})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="124" height="22" fill="#4a154b" />
        <text class="point-tooltip" x="3" y="0">A₃ (${ptRev.torque.toFixed(1)}, ${ptRev.speed.toFixed(0)}) 电动</text>
      </g>
    `;
  }

  // 2. 第Ⅱ与第Ⅳ象限制动工作点
  if (showQ2Q4) {
    const ptQ2 = brakingOperatingPoint('dynamic', 'II', {
      param: 4.0,
      loadTorque: currentLoad,
    });
    const x2 = xCoord(ptQ2.torque);
    const y2 = yCoord(ptQ2.speed);
    const q2Color = '#c2185b';
    pointsHtml += `
      <line class="grid-line" x1="${x2}" y1="${y2}" x2="${x2}" y2="${svgConfig.originY}" stroke="${q2Color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x2}" y1="${y2}" x2="${svgConfig.originX}" y2="${y2}" stroke="${q2Color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x2}, ${y2})">
        <circle class="halo" r="8" stroke="${q2Color}" />
        <circle class="core" r="6" fill="${q2Color}" />
      </g>
      <g transform="translate(${x2 - 128}, ${y2 - 12})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="124" height="22" fill="#880e4f" />
        <text class="point-tooltip" x="3" y="0">B₂ (${ptQ2.torque.toFixed(1)}, ${ptQ2.speed.toFixed(0)}) 制动</text>
      </g>
    `;

    const ptQ4 = brakingOperatingPoint('dynamic', 'IV', {
      param: 4.0,
      loadTorque: currentLoad,
    });
    const x4 = xCoord(ptQ4.torque);
    const y4 = yCoord(ptQ4.speed);
    const q4Color = '#1b5e20';
    pointsHtml += `
      <line class="grid-line" x1="${x4}" y1="${y4}" x2="${x4}" y2="${svgConfig.originY}" stroke="${q4Color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x4}" y1="${y4}" x2="${svgConfig.originX}" y2="${y4}" stroke="${q4Color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x4}, ${y4})">
        <circle class="halo" r="8" stroke="${q4Color}" />
        <circle class="core" r="6" fill="${q4Color}" />
      </g>
      <g transform="translate(${x4 + 12}, ${y4 + 20})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="124" height="22" fill="#1b5e20" />
        <text class="point-tooltip" x="3" y="0">B₄ (${ptQ4.torque.toFixed(1)}, ${ptQ4.speed.toFixed(0)}) 制动</text>
      </g>
    `;

    // 四象限全景下，从 A1 延伸到 B2 的等速度虚线
    if (showQ1Q3) {
      const natCfgFwd = tabConfigs.natural.getConfig(0, 1);
      const ptFwd = operatingPoint(currentLoad, natCfgFwd);
      const x1 = xCoord(ptFwd.torque);
      const ySpeed = yCoord(ptFwd.speed);
      pointsHtml += `
        <line class="guide-line" x1="${x2}" y1="${ySpeed}" x2="${x1}" y2="${ySpeed}" stroke="#c2185b" stroke-width="2.0" stroke-dasharray="4 3" opacity="0.8" />
      `;
    }
  }

  el.pointsGroup.innerHTML = pointsHtml;
  updateFourQuadrantReadouts(currentLoad);
}

/**
 * 电动状态工作点
 */
function renderMotoringPoints() {
  const tab = tabConfigs[state.activeTab];
  const param = state.tabParams[state.activeTab];
  const showFwd = state.direction === 'both' || state.direction === 'fwd';
  const showRev = state.direction === 'both' || state.direction === 'rev';

  const currentLoad = state.baseLoadTorque;

  let pointsHtml = '';

  if (showFwd) {
    const cfgFwd = tab.getConfig(param, 1);
    const ptFwd = operatingPoint(currentLoad, cfgFwd);
    const x = xCoord(ptFwd.torque);
    const y = yCoord(ptFwd.speed);
    const originY = svgConfig.originY;
    const originX = svgConfig.originX;

    pointsHtml += `
      <line class="grid-line" x1="${x}" y1="${y}" x2="${x}" y2="${originY}" stroke="${tab.color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x}" y1="${y}" x2="${originX}" y2="${y}" stroke="${tab.color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x}, ${y})">
        <circle class="halo" r="8" stroke="${tab.color}" />
        <circle class="core" r="6" fill="${tab.color}" />
      </g>
      <g transform="translate(${x + 12}, ${y - 12})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="108" height="22" fill="#173b3b" />
        <text class="point-tooltip" x="3" y="0">A+ (${ptFwd.torque.toFixed(1)}, ${ptFwd.speed.toFixed(0)})</text>
      </g>
    `;
  }

  if (showRev) {
    const cfgRev = tab.getConfig(param, -1);
    const ptRev = operatingPoint(currentLoad, cfgRev);
    const x = xCoord(ptRev.torque);
    const y = yCoord(ptRev.speed);
    const originY = svgConfig.originY;
    const originX = svgConfig.originX;

    pointsHtml += `
      <line class="grid-line" x1="${x}" y1="${y}" x2="${x}" y2="${originY}" stroke="${tab.color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x}" y1="${y}" x2="${originX}" y2="${y}" stroke="${tab.color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x}, ${y})">
        <circle class="halo" r="8" stroke="${tab.color}" />
        <circle class="core" r="6" fill="${tab.color}" />
      </g>
      <g transform="translate(${x - 124}, ${y + 20})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="116" height="22" fill="#4a154b" />
        <text class="point-tooltip" x="3" y="0">A- (${ptRev.torque.toFixed(1)}, ${ptRev.speed.toFixed(0)})</text>
      </g>
    `;
  }

  el.pointsGroup.innerHTML = pointsHtml;
  updateMotoringReadouts(currentLoad);
}

/**
 * 制动状态工作点
 */
function renderBrakingPoints() {
  const showQ2 = state.direction === 'both' || state.direction === 'fwd';
  const showQ4 = state.direction === 'both' || state.direction === 'rev';
  const activeTab = state.activeBrakingTab;
  const param = state.brakingParams[activeTab];

  const currentParam = param;

  let pointsHtml = '';
  const ptQ2 = brakingOperatingPoint(activeTab, 'II', {
    param: currentParam,
    loadTorque: state.baseLoadTorque,
  });
  const ptQ4 = brakingOperatingPoint(activeTab, 'IV', {
    param: currentParam,
    loadTorque: state.baseLoadTorque,
  });

  const q2Color = '#c2185b';
  const q4Color = '#1b5e20';

  if (showQ2) {
    const xA = xCoord(ptQ2.pointA.torque);
    const yA = yCoord(ptQ2.pointA.speed);
    const xB = xCoord(ptQ2.torque);
    const yB = yCoord(ptQ2.speed);

    // 1. 位能型负载与固有特性的交点 A（制动前稳态运行点）
    pointsHtml += `
      <line class="grid-line" x1="${xA}" y1="${yA}" x2="${xA}" y2="${svgConfig.originY}" stroke="${tabConfigs.natural.color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${xA}, ${yA})">
        <circle class="halo" r="8" stroke="${tabConfigs.natural.color}" />
        <circle class="core" r="6" fill="${tabConfigs.natural.color}" />
      </g>
      <g transform="translate(${xA + 12}, ${yA - 12})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="134" height="22" fill="#173b3b" />
        <text class="point-tooltip" x="3" y="0">A (${ptQ2.pointA.torque.toFixed(1)}, ${ptQ2.pointA.speed.toFixed(0)}) 制动前</text>
      </g>
    `;

    // 2. 从交点 A 水平拉出的等速度虚线，交于制动特性曲线确定初始制动工作点
    pointsHtml += `
      <line class="guide-line" x1="${xB}" y1="${yA}" x2="${xA}" y2="${yA}" stroke="${q2Color}" stroke-width="2.2" stroke-dasharray="5 3" />
      <text x="${(xA + xB) / 2}" y="${yA - 8}" fill="${q2Color}" font-size="12" font-weight="700" text-anchor="middle">等速度虚线 (n = ${ptQ2.pointA.speed.toFixed(0)} r/min)</text>
    `;

    // 3. 停机象限初始制动工作点 B_II
    pointsHtml += `
      <line class="grid-line" x1="${xB}" y1="${yB}" x2="${xB}" y2="${svgConfig.originY}" stroke="${q2Color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${xB}" y1="${yB}" x2="${svgConfig.originX}" y2="${yB}" stroke="${q2Color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${xB}, ${yB})">
        <circle class="halo" r="8" stroke="${q2Color}" />
        <circle class="core" r="6" fill="${q2Color}" />
      </g>
      <g transform="translate(${xB - 138}, ${yB - 12})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="136" height="22" fill="#880e4f" />
        <text class="point-tooltip" x="3" y="0">B_II (${ptQ2.torque.toFixed(1)}, ${ptQ2.speed.toFixed(0)}) 停机制动</text>
      </g>
    `;
  }

  if (showQ4) {
    const x4 = xCoord(ptQ4.torque);
    const y4 = yCoord(ptQ4.speed);
    pointsHtml += `
      <line class="grid-line" x1="${x4}" y1="${y4}" x2="${x4}" y2="${svgConfig.originY}" stroke="${q4Color}" stroke-dasharray="3 3" />
      <line class="grid-line" x1="${x4}" y1="${y4}" x2="${svgConfig.originX}" y2="${y4}" stroke="${q4Color}" stroke-dasharray="3 3" />
      <g class="work-point" transform="translate(${x4}, ${y4})">
        <circle class="halo" r="8" stroke="${q4Color}" />
        <circle class="core" r="6" fill="${q4Color}" />
      </g>
      <g transform="translate(${x4 + 12}, ${y4 + 20})">
        <rect class="point-tooltip-bg" x="-4" y="-15" width="134" height="22" fill="#1b5e20" />
        <text class="point-tooltip" x="3" y="0">B_IV (+${ptQ4.torque.toFixed(1)}, ${ptQ4.speed.toFixed(0)}) 位能下放</text>
      </g>
    `;
  }

  el.pointsGroup.innerHTML = pointsHtml;
  updateBrakingReadouts(ptQ2, ptQ4);
}

/**
 * 更新电动状态读数
 */
function updateMotoringReadouts(torqueVal) {
  const tab = tabConfigs[state.activeTab];
  const param = state.tabParams[state.activeTab];
  const cfg = tab.getConfig(param, 1);
  const pt = operatingPoint(torqueVal, cfg);

  el.readoutSpeed.textContent = `±${Math.abs(pt.speed).toFixed(1)}`;
  el.readoutTorque.textContent = `±${Math.abs(pt.torque).toFixed(1)}`;
  el.readoutCurrent.textContent = `±${Math.abs(pt.current).toFixed(1)}`;
  el.readoutEmf.textContent = `±${Math.abs(pt.emf).toFixed(1)}`;
  el.readoutPmech.textContent = `${(pt.pMechanical / 1000).toFixed(2)} kW`;
  el.readoutPa.textContent = `${(pt.pElectrical / 1000).toFixed(2)} kW`;
  el.motoringStatusBadge.textContent =
    '电动状态：T 与 n 同号 · 吸收电能，输出机械能';
}

/**
 * 更新制动状态读数
 */
function updateBrakingReadouts(ptQ2, ptQ4) {
  const isAll = state.activeBrakingTab === 'all';
  const isDyn = state.activeBrakingTab === 'dynamic';
  const isRegen = state.activeBrakingTab === 'regenerative';

  el.readoutSpeed.textContent = `${ptQ2.speed > 0 ? '+' : ''}${ptQ2.speed.toFixed(0)} / ${ptQ4.speed.toFixed(0)}`;
  el.readoutTorque.textContent = `${ptQ2.torque.toFixed(1)} / +${ptQ4.torque.toFixed(1)}`;
  el.readoutCurrent.textContent = `${ptQ2.current.toFixed(1)} / +${ptQ4.current.toFixed(1)}`;
  el.readoutEmf.textContent = `+${ptQ2.emf.toFixed(1)} / ${ptQ4.emf.toFixed(1)}`;
  el.readoutPmech.textContent = `${(ptQ2.pMechanical / 1000).toFixed(2)} kW (吸收)`;

  if (isDyn || isAll) {
    el.readoutPa.textContent = '0.00 kW (脱离电网)';
  } else if (isRegen) {
    el.readoutPa.textContent = `${(ptQ2.pElectrical / 1000).toFixed(2)} kW (回馈网)`;
  } else {
    // plugging
    el.readoutPa.textContent = `${(ptQ2.pElectrical / 1000).toFixed(2)} kW (电网输入)`;
  }

  el.motoringStatusBadge.textContent =
    '制动状态：T 与 n 异号 · 产生制动阻转矩，吸收机械能';
}

/**
 * 更新四象限全貌读数
 */
function updateFourQuadrantReadouts(loadTorque) {
  const natCfg = tabConfigs.natural.getConfig(0, 1);
  const ptFwd = operatingPoint(loadTorque, natCfg);
  const ptQ2 = brakingOperatingPoint('dynamic', 'II', {
    param: 4.0,
    loadTorque,
  });

  el.readoutSpeed.textContent = `±${ptFwd.speed.toFixed(0)} / ${ptQ2.speed.toFixed(0)}`;
  el.readoutTorque.textContent = `±${ptFwd.torque.toFixed(1)} N·m`;
  el.readoutCurrent.textContent = `±${ptFwd.current.toFixed(1)} A`;
  el.readoutEmf.textContent = `±${ptFwd.emf.toFixed(1)} V`;
  el.readoutPmech.textContent = `${(ptFwd.pMechanical / 1000).toFixed(2)} kW (电动)`;
  el.readoutPa.textContent = `${(ptFwd.pElectrical / 1000).toFixed(2)} kW (电网)`;
  el.motoringStatusBadge.textContent =
    '四象限全貌：Ⅰ/Ⅲ象限电动 (T·n>0) · Ⅱ/Ⅳ象限制动 (T·n<0)';
}

/**
 * 渲染右侧电机图解
 */
function renderMotorDiagrams() {
  const makeMotorSvg = (isFwd, angle, prefix = 'mot') => {
    // 顶部弧线：转速 n 指示箭头（与转子同心，中心 x=70，半径 34）
    // 顺时针 CW：从左向右 (48, 21) -> (92, 21)
    // 逆时针 CCW：从右向左 (92, 21) -> (48, 21)
    const speedArrowPath = isFwd
      ? 'M 48 21 A 34 34 0 0 1 92 21'
      : 'M 92 21 A 34 34 0 0 0 48 21';

    // 底部弧线：电磁转矩 T 指示箭头（与转子同心，中心 x=70，半径 34）
    // 电动状态下电磁转矩为驱动性质，与转向同向！
    // 顺时针 CW（底部从右向左）：(92, 73) -> (48, 73)
    // 逆时针 CCW（底部从左向右）：(48, 73) -> (92, 73)
    const torqueArrowPath = isFwd
      ? 'M 92 73 A 34 34 0 0 1 48 73'
      : 'M 48 73 A 34 34 0 0 0 92 73';

    return `
      <defs>
        <marker id="${prefix}-arrow-spd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="#1565c0" />
        </marker>
        <marker id="${prefix}-arrow-trq" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="#c2185b" />
        </marker>
      </defs>
      <!-- 定子磁极 N (左) 与 S (右) -->
      <path d="M 6 22 C 22 26 22 68 6 72 Z" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" />
      <text x="14" y="52" font-size="14" font-weight="900" fill="#0d47a1" text-anchor="middle">N</text>

      <path d="M 134 22 C 118 26 118 68 134 72 Z" fill="#fce4ec" stroke="#c2185b" stroke-width="2" />
      <text x="126" y="52" font-size="14" font-weight="900" fill="#880e4f" text-anchor="middle">S</text>

      <!-- 磁力线符号与方向线 -->
      <line x1="28" y1="47" x2="112" y2="47" stroke="#90caf9" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="70" y="38" font-size="11" fill="#1976d2" text-anchor="middle" font-style="italic">Φ →</text>

      <!-- 转子电枢圆盘 (中心位于 70, 47) -->
      <circle cx="70" cy="47" r="28" fill="#fff" stroke="#37474f" stroke-width="2.5" />

      <!-- 旋转导体群 -->
      <g transform="rotate(${angle.toFixed(1)}, 70, 47)">
        <line x1="46" y1="47" x2="94" y2="47" stroke="#b0bec5" stroke-width="2" />
        <line x1="70" y1="23" x2="70" y2="71" stroke="#b0bec5" stroke-width="2" />
        <circle cx="48" cy="47" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <circle cx="92" cy="47" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <circle cx="70" cy="25" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <circle cx="70" cy="69" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <text x="70" y="28" font-size="10" font-weight="900" text-anchor="middle" fill="#d32f2f">
          ${isFwd ? '⊙' : '⊗'}
        </text>
        <text x="70" y="72" font-size="10" font-weight="900" text-anchor="middle" fill="#d32f2f">
          ${isFwd ? '⊗' : '⊙'}
        </text>
      </g>

      <!-- 电枢电刷 (上下) -->
      <rect x="66" y="14" width="8" height="6" fill="#424242" rx="1" />
      <rect x="66" y="74" width="8" height="6" fill="#424242" rx="1" />
      <!-- 电源极性 -->
      <text x="70" y="10" font-size="12" font-weight="bold" text-anchor="middle" fill="${isFwd ? '#d32f2f' : '#1976d2'}">
        ${isFwd ? '+Uₐ' : '−Uₐ'}
      </text>
      <text x="70" y="90" font-size="12" font-weight="bold" text-anchor="middle" fill="${isFwd ? '−' : '+'}">
        ${isFwd ? '−' : '+'}
      </text>

      <!-- 旋转速度 n 指示箭头 (顶部蓝色，与转子同心对齐) -->
      <path d="${speedArrowPath}" fill="none" stroke="#1565c0" stroke-width="2.5" marker-end="url(#${prefix}-arrow-spd)" />
      <text x="${isFwd ? '96' : '44'}" y="17" font-size="11" font-weight="bold" fill="#1565c0" text-anchor="${isFwd ? 'start' : 'end'}">
        ${isFwd ? 'n ↷' : '↶ n'}
      </text>

      <!-- 电磁转矩 T 指示箭头 (底部洋红色，与转子同心对齐，电动状态与转向同向驱动) -->
      <path d="${torqueArrowPath}" fill="none" stroke="#c2185b" stroke-width="2.5" marker-end="url(#${prefix}-arrow-trq)" />
      <text x="${isFwd ? '44' : '96'}" y="81" font-size="10.5" font-weight="bold" fill="#c2185b" text-anchor="${isFwd ? 'end' : 'start'}">
        ${isFwd ? 'T ↷ (驱动)' : '↶ T (驱动)'}
      </text>
    `;
  };

  const makeBrakingMotorSvg = (isQuad2, angle, prefix = 'brk') => {
    // 顶部弧线：转速 n 指示箭头（与转子同心，中心 x=70，半径 34）
    // isQuad2 (第Ⅱ象限)：n>0 (顺时针 CW: 48,21 -> 92,21)
    // !isQuad2 (第Ⅳ象限)：n<0 (逆时针 CCW: 92,21 -> 48,21)
    const speedArrowPath = isQuad2
      ? 'M 48 21 A 34 34 0 0 1 92 21'
      : 'M 92 21 A 34 34 0 0 0 48 21';

    // 底部弧线：电磁转矩 T 指示箭头（与转子同心，中心 x=70，半径 34）
    // 制动状态下电磁转矩与转速反向！
    // isQuad2 (第Ⅱ象限)：n 为 CW，则 T 产生逆时针 CCW 阻力 (底部从左向右: 48,73 -> 92,73)
    // !isQuad2 (第Ⅳ象限)：n 为 CCW，则 T 产生顺时针 CW 支承阻力 (底部从右向左: 92,73 -> 48,73)
    const torqueArrowPath = isQuad2
      ? 'M 48 73 A 34 34 0 0 0 92 73'
      : 'M 92 73 A 34 34 0 0 1 48 73';

    const torqueColor = isQuad2 ? '#c2185b' : '#1b5e20';

    return `
      <defs>
        <marker id="${prefix}-arrow-spd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="#1565c0" />
        </marker>
        <marker id="${prefix}-arrow-trq" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="${torqueColor}" />
        </marker>
      </defs>

      <!-- 定子磁极 N (左) 与 S (右) -->
      <path d="M 6 22 C 22 26 22 68 6 72 Z" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" />
      <text x="14" y="52" font-size="14" font-weight="900" fill="#0d47a1" text-anchor="middle">N</text>

      <path d="M 134 22 C 118 26 118 68 134 72 Z" fill="#fce4ec" stroke="#c2185b" stroke-width="2" />
      <text x="126" y="52" font-size="14" font-weight="900" fill="#880e4f" text-anchor="middle">S</text>

      <!-- 磁力线符号与方向线 -->
      <line x1="28" y1="47" x2="112" y2="47" stroke="#90caf9" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="70" y="38" font-size="11" fill="#1976d2" text-anchor="middle" font-style="italic">Φ →</text>

      <!-- 转子电枢圆盘 (中心位于 70, 47) -->
      <circle cx="70" cy="47" r="28" fill="#fff" stroke="#37474f" stroke-width="2.5" />

      <!-- 旋转导体群 -->
      <g transform="rotate(${angle.toFixed(1)}, 70, 47)">
        <line x1="46" y1="47" x2="94" y2="47" stroke="#b0bec5" stroke-width="2" />
        <line x1="70" y1="23" x2="70" y2="71" stroke="#b0bec5" stroke-width="2" />
        <circle cx="48" cy="47" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <circle cx="92" cy="47" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <circle cx="70" cy="25" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <circle cx="70" cy="69" r="4.5" fill="#cfd8dc" stroke="#263238" stroke-width="1.5" />
        <!-- 制动电流方向 -->
        <text x="70" y="28" font-size="10" font-weight="900" text-anchor="middle" fill="${torqueColor}">
          ${isQuad2 ? '⊗' : '⊙'}
        </text>
        <text x="70" y="72" font-size="10" font-weight="900" text-anchor="middle" fill="${torqueColor}">
          ${isQuad2 ? '⊙' : '⊗'}
        </text>
      </g>

      <!-- 电刷 -->
      <rect x="66" y="14" width="8" height="6" fill="#424242" rx="1" />
      <rect x="66" y="74" width="8" height="6" fill="#424242" rx="1" />

      <!-- 旋转速度 n 指示箭头 (顶部蓝色，与转子同心对齐) -->
      <path d="${speedArrowPath}" fill="none" stroke="#1565c0" stroke-width="2.5" marker-end="url(#${prefix}-arrow-spd)" />
      <text x="${isQuad2 ? '96' : '44'}" y="17" font-size="11" font-weight="bold" fill="#1565c0" text-anchor="${isQuad2 ? 'start' : 'end'}">
        ${isQuad2 ? 'n ↷' : '↶ n'}
      </text>

      <!-- 制动电磁转矩 T 指示箭头 (底部，方向与转速相反，与转子同心对齐) -->
      <path d="${torqueArrowPath}" fill="none" stroke="${torqueColor}" stroke-width="2.5" marker-end="url(#${prefix}-arrow-trq)" />
      <text x="${isQuad2 ? '96' : '44'}" y="81" font-size="10.5" font-weight="bold" fill="${torqueColor}" text-anchor="${isQuad2 ? 'start' : 'end'}">
        ${isQuad2 ? '↶ T (制动阻力)' : 'T ↷ (平衡阻力)'}
      </text>
    `;
  };

  if (state.mode === 'four-quadrant') {
    // 四象限模式：左侧展示电动状态 (T与n同向 CW)，右侧展示制动状态 (转速CW与转矩CCW反向)
    el.motorFwdSvg.innerHTML = makeMotorSvg(
      true,
      state.fwdRotorAngle,
      'fq-fwd',
    );
    el.motorRevSvg.innerHTML = makeBrakingMotorSvg(
      true,
      state.revRotorAngle,
      'fq-brk',
    );
  } else if (state.mode === 'motoring') {
    el.motorFwdSvg.innerHTML = makeMotorSvg(
      true,
      state.fwdRotorAngle,
      'mot-fwd',
    );
    el.motorRevSvg.innerHTML = makeMotorSvg(
      false,
      state.revRotorAngle,
      'mot-rev',
    );
  } else {
    el.motorFwdSvg.innerHTML = makeBrakingMotorSvg(
      true,
      state.fwdRotorAngle,
      'brk-q2',
    );
    el.motorRevSvg.innerHTML = makeBrakingMotorSvg(
      false,
      state.revRotorAngle,
      'brk-q4',
    );
  }
}

/**
 * 界面标签与理论卡片更新
 */
function updateTabUI() {
  const isFourQuadrant = state.mode === 'four-quadrant';
  const isMotoring = state.mode === 'motoring';
  const isBraking = state.mode === 'braking';

  // 1. 页面标题：统一为教材标准章节名，绝不包含“一、电动状态”或“二、制动状态”
  el.pageTitle.textContent = '8.5 他励电动机在四象限中的运行状态';

  // 2. 更新一级模式药丸激活状态与子导航栏显示
  el.modeTabFourQuadrant.classList.toggle('active', isFourQuadrant);
  el.modeTabFourQuadrant.setAttribute('aria-selected', String(isFourQuadrant));
  el.modeTabMotoring.classList.toggle('active', isMotoring);
  el.modeTabMotoring.setAttribute('aria-selected', String(isMotoring));
  el.modeTabBraking.classList.toggle('active', isBraking);
  el.modeTabBraking.setAttribute('aria-selected', String(isBraking));

  el.fourQuadrantSubtabs.style.display = isFourQuadrant ? 'flex' : 'none';
  el.motoringSubtabs.style.display = isMotoring ? 'flex' : 'none';
  el.brakingSubtabs.style.display = isBraking ? 'flex' : 'none';

  // 3. 象限徽章切换
  if (isFourQuadrant) {
    el.badgeQuad1.style.display = '';
    el.badgeQuad2.style.display = '';
    el.badgeQuad3.style.display = '';
    el.badgeQuad4.style.display = '';
  } else if (isMotoring) {
    el.badgeQuad1.style.display = '';
    el.badgeQuad2.style.display = 'none';
    el.badgeQuad3.style.display = '';
    el.badgeQuad4.style.display = 'none';
  } else {
    el.badgeQuad1.style.display = 'none';
    el.badgeQuad2.style.display = '';
    el.badgeQuad3.style.display = 'none';
    el.badgeQuad4.style.display = '';
  }

  if (isFourQuadrant) {
    el.pageDesc.textContent =
      '四象限全貌：同时展示电动状态（第Ⅰ、Ⅲ象限）与三种制动状态（第Ⅱ、Ⅳ象限）的全部机械特性曲线。';
    el.pageScopeTag.innerHTML =
      '他励直流电动机 · 四象限运行特性全貌 (10条特性)<small>基准：UₐN = 220 V · Rₐ = 1 Ω · ΦN = 20 mWb</small>';
    el.chartSubtitle.textContent =
      'n = f(T) · 四个象限全景特性（涵盖电动与制动全部运行区）';
    el.dirPillBoth.textContent = '四象限全显';
    el.dirPillPos.textContent = '电动区（第Ⅰ/Ⅲ象限）';
    el.dirPillNeg.textContent = '制动区（第Ⅱ/Ⅳ象限）';
    el.btnShowAll.style.display = '';
    el.btnShowAll.textContent = '👁 叠加全部特性';
    el.btnShowAll.classList.toggle('active', true);
    el.btnShowAll.setAttribute('aria-pressed', 'true');
    el.motorVisualCardTitle.textContent = '四象限运行状态可视化';
    el.fwdDiagTitle.innerHTML =
      '<span style="color: #1565c0">●</span> Ⅰ/Ⅲ 象限 · 电动状态';
    el.fwdDiagStat.innerHTML =
      '转矩与转向同向: <b>T·n &gt; 0</b> · 吸收电能输出机械能';
    el.revDiagTitle.innerHTML =
      '<span style="color: #c2185b">●</span> Ⅱ/Ⅳ 象限 · 制动状态';
    el.revDiagStat.innerHTML =
      '转矩与转向反向: <b>T·n &lt; 0</b> · 电磁转矩为制动阻力';
    el.footerTips.textContent =
      '提示：已全部显示电动（第Ⅰ、Ⅲ象限）与制动（第Ⅱ、Ⅳ象限）特性曲线；可点击“一、电动状态”或“二、制动状态”查看分项详解。';

    el.fourQuadrantTabs.forEach((btn) => {
      const isCur = btn.dataset.tab === state.activeFqTab;
      btn.classList.toggle('active', isCur);
      btn.setAttribute('aria-selected', String(isCur));
    });

    const fqConf =
      fourQuadrantConfigs[state.activeFqTab] || fourQuadrantConfigs.all;
    el.paramSliderLabel.innerHTML = '负载转矩 T<sub>L</sub>';
    el.paramSlider.min = '10';
    el.paramSlider.max = '60';
    el.paramSlider.step = '1';
    el.paramSlider.value = String(state.baseLoadTorque);
    el.paramSliderOutput.textContent = `${state.baseLoadTorque.toFixed(1)} N·m`;

    el.theoryTitle.textContent = `${fqConf.title} · 物理特征与方程`;
    el.theoryEquation.innerHTML =
      fqConf.formulaHtml || renderLatex(fqConf.formula);
    el.theoryAnalysis.textContent = fqConf.summary;
    el.theoryConclusion.innerHTML =
      '★ 四象限核心结论：第Ⅰ、Ⅲ象限中 T·n &gt; 0，电磁转矩为驱动性质，为<b>电动状态</b>；第Ⅱ、Ⅳ象限中 T·n &lt; 0，电磁转矩为阻力性质，吸收轴机械能，为<b>制动状态</b>！全象限曲线完整覆盖电动机全部运行工况！';
  } else if (isMotoring) {
    el.pageDesc.textContent =
      '比较固有特性与三种人为特性的两象限运行：第Ⅰ象限（正向电动）与第Ⅲ象限（反向电动）。';
    el.pageScopeTag.innerHTML =
      '他励直流电动机 · 电动状态两象限运行 (T·n > 0)<small>基准：UₐN = 220 V · Rₐ = 1 Ω · ΦN = 20 mWb</small>';
    el.chartSubtitle.textContent = 'n = f(T) · 第一与第三象限电动区';
    el.dirPillBoth.textContent = '双向两象限联动';
    el.dirPillPos.textContent = '正向（第Ⅰ象限）';
    el.dirPillNeg.textContent = '反向（第Ⅲ象限）';
    el.btnShowAll.style.display = '';
    el.btnShowAll.textContent = '👁 叠加全部特性';
    el.btnShowAll.classList.toggle('active', state.showAllMotoring);
    el.btnShowAll.setAttribute('aria-pressed', String(state.showAllMotoring));
    el.motorVisualCardTitle.textContent = '电动机运行状态可视化';
    el.fwdDiagTitle.innerHTML =
      '<span style="color: #1565c0">●</span> 第Ⅰ象限 · 正向电动';
    el.fwdDiagStat.innerHTML =
      '转向: <b>顺时针 CW</b> · 电压: <b>+U<sub>a</sub></b>';
    el.revDiagTitle.innerHTML =
      '<span style="color: #ad1457">●</span> 第Ⅲ象限 · 反向电动';
    el.revDiagStat.innerHTML =
      '转向: <b>逆时针 CCW</b> · 电压: <b>-U<sub>a</sub></b>';
    el.footerTips.textContent =
      '提示：点击上方“二、制动状态”切换到制动两象限运行，或点击“四象限”查看全部特性曲线。';

    el.motoringTabs.forEach((btn) => {
      const isCur = btn.dataset.tab === state.activeTab;
      btn.classList.toggle('active', isCur);
      btn.setAttribute('aria-selected', String(isCur));
    });

    const tab = tabConfigs[state.activeTab];
    if (state.activeTab === 'natural') {
      el.paramSliderLabel.innerHTML = '负载转矩 T<sub>L</sub>';
      el.paramSlider.min = '10';
      el.paramSlider.max = '60';
      el.paramSlider.step = '1';
      el.paramSlider.value = String(state.baseLoadTorque);
      el.paramSliderOutput.textContent = `${state.baseLoadTorque.toFixed(1)} N·m`;
    } else {
      el.paramSliderLabel.textContent = tab.paramLabel;
      el.paramSlider.min = String(tab.minParam);
      el.paramSlider.max = String(tab.maxParam);
      el.paramSlider.step = state.activeTab === 'voltage' ? '5' : '0.05';
      el.paramSlider.value = String(state.tabParams[state.activeTab]);
      el.paramSliderOutput.textContent = `${state.tabParams[state.activeTab]} ${tab.paramUnit}`;
    }

    el.theoryTitle.textContent = `${tab.title} · 物理特征与方程`;
    el.theoryEquation.innerHTML = tab.formulaHtml || renderLatex(tab.formula);
    el.theoryAnalysis.textContent = tab.summary;
    el.theoryConclusion.innerHTML =
      '★ 核心结论：第Ⅰ象限（T>0, n>0）与第Ⅲ象限（T<0, n<0）中，转矩与转速均同向，电磁转矩均为驱动转矩，P<sub>mech</sub>>0且P<sub>a</sub>>0，电机吸收电能输出机械能，均为<b>电动状态</b>！';
  } else {
    el.pageDesc.textContent =
      '分析三种典型制动方法：第Ⅱ象限（减速停机过程）与第Ⅳ象限（限制下放位能负载运行）。';
    el.pageScopeTag.innerHTML =
      '他励直流电动机 · 制动状态两象限运行 (T·n < 0)<small>基准：UₐN = 220 V · Rₐ = 1 Ω · ΦN = 20 mWb</small>';
    el.chartSubtitle.textContent =
      'n = f(T) · 第二与第四象限制动区（参照教材附图）';
    el.dirPillBoth.textContent = '双向两象限联动';
    el.dirPillPos.textContent = '停机制动（第Ⅱ象限）';
    el.dirPillNeg.textContent = '位能下放（第Ⅳ象限）';
    // 制动状态已提供“04 附图全貌”子标签页完整展示全部制动特性，删除与附图全貌重复的“叠加全部制动”按钮
    el.btnShowAll.style.display = 'none';
    el.motorVisualCardTitle.textContent = '制动运行状态可视化';
    el.fwdDiagTitle.innerHTML =
      '<span style="color: #c2185b">●</span> 第Ⅱ象限 · 停机制动过程';
    el.fwdDiagStat.innerHTML =
      '转向: <b>顺时针 n&gt;0</b> · 转矩: <b>逆时针 T&lt;0 (制动阻力)</b>';
    el.revDiagTitle.innerHTML =
      '<span style="color: #1b5e20">●</span> 第Ⅳ象限 · 位能下放运行';
    el.revDiagStat.innerHTML =
      '转向: <b>逆时针 n&lt;0</b> · 转矩: <b>顺时针 T&gt;0 (平衡阻力)</b>';
    el.footerTips.textContent =
      '提示：点击上方“一、电动状态”可返回电动两象限，或点击“四象限”查看全部特性曲线。';

    el.brakingTabs.forEach((btn) => {
      const isCur = btn.dataset.tab === state.activeBrakingTab;
      btn.classList.toggle('active', isCur);
      btn.setAttribute('aria-selected', String(isCur));
    });

    const bConf = brakingConfigs[state.activeBrakingTab];
    if (state.activeBrakingTab === 'all') {
      el.paramSliderLabel.innerHTML = '负载转矩 T<sub>L</sub>';
      el.paramSlider.min = '10';
      el.paramSlider.max = '60';
      el.paramSlider.step = '1';
      el.paramSlider.value = String(state.baseLoadTorque);
      el.paramSliderOutput.textContent = `${state.baseLoadTorque.toFixed(1)} N·m`;
    } else {
      el.paramSliderLabel.textContent = bConf.paramLabel;
      el.paramSlider.min = String(bConf.minParam);
      el.paramSlider.max = String(bConf.maxParam);
      el.paramSlider.step =
        state.activeBrakingTab === 'regenerative' ? '10' : '0.1';
      el.paramSlider.value = String(
        state.brakingParams[state.activeBrakingTab],
      );
      el.paramSliderOutput.textContent = `${state.brakingParams[state.activeBrakingTab]} ${bConf.paramUnit}`;
    }

    el.theoryTitle.textContent = `${bConf.title} · 物理特征与方程`;
    el.theoryEquation.innerHTML = bConf.formulaHtml || renderLatex(bConf.formula);
    el.theoryAnalysis.textContent = bConf.summary;
    el.theoryConclusion.innerHTML =
      '★ 核心结论：第Ⅱ象限（T<0, n>0）与第Ⅳ象限（T>0, n<0）中，电磁转矩与转速反向（T·n < 0），电磁转矩均为<b>制动转矩</b>，P<sub>mech</sub> < 0，电机从轴上吸收机械能，均为<b>制动状态</b>！';
  }

  renderAxes();
  renderCurves();
  renderPoints();
  renderMotorDiagrams();
}

/**
 * 绑定交互事件
 */
function bindEvents() {
  // 一级模式大类切换 (四象限 vs 电动 vs 制动)
  el.modeTabFourQuadrant.addEventListener('click', () => {
    state.mode = 'four-quadrant';
    updateTabUI();
  });
  el.modeTabMotoring.addEventListener('click', () => {
    state.mode = 'motoring';
    updateTabUI();
  });
  el.modeTabBraking.addEventListener('click', () => {
    state.mode = 'braking';
    updateTabUI();
  });

  // 四象限子标签页切换
  el.fourQuadrantTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeFqTab = btn.dataset.tab;
      updateTabUI();
    });
  });

  // 电动状态子标签页切换
  el.motoringTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      updateTabUI();
    });
  });

  // 制动状态子标签页切换
  el.brakingTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeBrakingTab = btn.dataset.tab;
      updateTabUI();
    });
  });

  // 叠加全部特性按钮（电动状态与四象限全貌）
  el.btnShowAll.addEventListener('click', () => {
    if (state.mode === 'four-quadrant') {
      state.activeFqTab = 'all';
      updateTabUI();
    } else if (state.mode === 'motoring') {
      state.showAllMotoring = !state.showAllMotoring;
      el.btnShowAll.classList.toggle('active', state.showAllMotoring);
      el.btnShowAll.setAttribute('aria-pressed', String(state.showAllMotoring));
      renderCurves();
      renderPoints();
    }
  });

  // 暂停 / 继续动画
  el.btnTogglePlay.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    el.btnTogglePlay.setAttribute('aria-pressed', String(state.isPlaying));
    el.btnTogglePlay.textContent = state.isPlaying
      ? '⏸ 暂停动画'
      : '▶ 播放动画';
  });

  // 象限过滤单选胶囊
  el.dirPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      state.direction = pill.dataset.direction;
      el.dirPills.forEach((p) => {
        const isCur = p === pill;
        p.classList.toggle('active', isCur);
        p.setAttribute('aria-checked', String(isCur));
      });
      el.fwdDiagBox.classList.toggle(
        'active',
        state.direction === 'both' || state.direction === 'fwd',
      );
      el.revDiagBox.classList.toggle(
        'active',
        state.direction === 'both' || state.direction === 'rev',
      );
      renderCurves();
      renderPoints();
    });
  });

  // 滑块调节
  el.paramSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (state.mode === 'four-quadrant') {
      state.baseLoadTorque = val;
      el.paramSliderOutput.textContent = `${val.toFixed(1)} N·m`;
    } else if (state.mode === 'motoring') {
      if (state.activeTab === 'natural') {
        state.baseLoadTorque = val;
        el.paramSliderOutput.textContent = `${val.toFixed(1)} N·m`;
      } else {
        state.tabParams[state.activeTab] = val;
        const tab = tabConfigs[state.activeTab];
        el.paramSliderOutput.textContent = `${val} ${tab.paramUnit}`;
      }
    } else {
      if (state.activeBrakingTab === 'all') {
        state.baseLoadTorque = val;
        state.brakingParams.all = val;
        el.paramSliderOutput.textContent = `${val.toFixed(1)} N·m`;
      } else {
        state.brakingParams[state.activeBrakingTab] = val;
        const bConf = brakingConfigs[state.activeBrakingTab];
        el.paramSliderOutput.textContent = `${val} ${bConf.paramUnit}`;
      }
    }
    renderCurves();
    renderPoints();
  });

  el.paramSlider.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'PageUp' || e.key === 'PageDown') {
      e.stopPropagation();
    }
  });
}

/**
 * 动画主循环
 */
let lastTimestamp = 0;
function animate(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  if (state.isPlaying) {
    state.animTime += dt;

    let speedRatio = 1.0;
    if (state.mode === 'four-quadrant') {
      const ptFwd = operatingPoint(
        state.baseLoadTorque,
        tabConfigs.natural.getConfig(0, 1),
      );
      speedRatio = Math.max(0.3, Math.abs(ptFwd.speed) / 1000);
    } else if (state.mode === 'motoring') {
      const tab = tabConfigs[state.activeTab];
      const param = state.tabParams[state.activeTab];
      const ptFwd = operatingPoint(
        state.baseLoadTorque,
        tab.getConfig(param, 1),
      );
      speedRatio = Math.max(0.3, Math.abs(ptFwd.speed) / 1000);
    } else {
      const ptQ2 = brakingOperatingPoint(state.activeBrakingTab, 'II', {
        param: state.brakingParams[state.activeBrakingTab],
      });
      speedRatio = Math.max(0.3, Math.abs(ptQ2.speed) / 1000);
    }

    state.fwdRotorAngle = (state.fwdRotorAngle + dt * 140 * speedRatio) % 360;
    state.revRotorAngle = (state.revRotorAngle - dt * 140 * speedRatio) % 360;

    renderMotorDiagrams();
  }

  requestAnimationFrame(animate);
}

// 初始化启动
updateTabUI();
bindEvents();
requestAnimationFrame(animate);
