import type { LoadCharacteristicKind } from '@/content/course';

type LoadCharacteristicData = {
  title: string;
  lead: string;
  formula: string;
  examples: string;
  points: string[];
  curve: string;
  motion: string;
  curveLabel: string;
  note: string;
  tag: string;
  axisMode: 'reaction' | 'potential' | 'positive';
};

const loadData: Record<LoadCharacteristicKind, LoadCharacteristicData> = {
  'resistive-constant-torque': {
    title: '反抗性恒转矩负载',
    lead: '负载转矩方向总与旋转方向相反，大小与转速无关。',
    formula: 'Tₗ = ±Tₗ₀',
    examples: '金属压延机构、机床的平移机构、传送带',
    points: [
      '顺时针旋转时 n 为正，负载转矩取负；反转时 n 为负，负载转矩取正。',
      '转矩极性随转速方向改变，特性位于第一、第三象限。',
      '启动和稳态运行都需要克服近似恒定的阻力转矩。',
    ],
    curve: 'M 230 250 V 410 M 510 250 V 90',
    motion: 'M 510 245 L 510 105',
    curveLabel: '±Tₗ₀',
    note: '转速方向改变，负载转矩的符号也改变。',
    tag: '方向相关',
    axisMode: 'reaction',
  },
  'potential-constant-torque': {
    title: '位能性恒转矩负载',
    lead: '负载转矩方向固定，与运动方向无关，大小近似保持恒定。',
    formula: 'Tₗ = Tₗ₀ = 常数',
    examples: '起重机、提升机、卷扬机、矿井提升设备',
    points: [
      '负载转矩由重力或储存的位能决定，方向始终指向阻碍提升的一侧。',
      '正转提升和反转下放都受同一个恒定转矩约束，位于第一、第四象限。',
      '下放时电机可能进入制动或回馈运行，需校核制动转矩与安全裕量。',
    ],
    curve: 'M 430 80 V 420',
    motion: 'M 430 410 L 430 90',
    curveLabel: 'Tₗ₀',
    note: '负载转矩方向固定，重物不会因电机反转而改变“重量”。',
    tag: '位能约束',
    axisMode: 'potential',
  },
  fan: {
    title: '通风机类负载',
    lead: '转矩随转速平方增加，低速轻载、高速时负载迅速增大。',
    formula: 'Tₗ = Tₗ₀ + Kn² ；理想时 Tₗ₀ ≈ 0',
    examples: '离心式通风机、水泵、油泵、压缩机',
    points: [
      '叶轮与流体的阻力基本随转速平方变化，曲线从原点向上弯曲。',
      '相似定律：流量 Q∝n、扬程 H∝n²、功率 P∝n³。',
      '调速比节流更节能；降低转速会显著降低所需功率。',
    ],
    curve: 'M 175 410 C 220 350 275 285 330 225 C 395 155 480 105 585 55',
    motion: 'M 205 370 C 250 315 295 260 350 205 C 415 145 490 95 560 70',
    curveLabel: 'Tₗ = Kn²',
    note: '沿曲线向右上移动，转速和转矩同时增加。',
    tag: '平方转矩',
    axisMode: 'positive',
  },
  'constant-power': {
    title: '恒功率负载',
    lead: '负载功率基本保持不变，因此转矩与转速成反比。',
    formula: 'Pₗ = TₗΩ = 常数 ；Tₗ = 9.55Pₗ / n',
    examples: '车床、铣床、卷绕机的切削或卷绕过程',
    points: [
      '切削量大时降低转速、提高转矩；切削量小时提高转速、降低转矩。',
      '曲线为双曲线，低速端需要较大的转矩储备。',
      '调速范围和电机弱磁区要匹配，避免低速过载或高速超速。',
    ],
    curve: 'M 195 70 C 225 135 260 205 325 270 C 395 340 480 380 585 405',
    motion: 'M 220 95 C 250 160 285 225 340 285 C 410 345 490 380 560 397',
    curveLabel: 'Pₗ = 常数',
    note: '向右移动表示转矩增加，曲线同时压低转速以保持功率。',
    tag: '反比转矩',
    axisMode: 'positive',
  },
};

const loadOrder: LoadCharacteristicKind[] = [
  'resistive-constant-torque',
  'potential-constant-torque',
  'fan',
  'constant-power',
];

export function LoadCharacteristicLesson({
  load,
}: {
  load: LoadCharacteristicKind;
}) {
  const data = loadData[load];
  const page = loadOrder.indexOf(load) + 1;

  return (
    <div className="load-characteristic-body">
      <div className="eyebrow">
        <span />
        直流拖动 <b>实际生产负载 · 机械特性</b>
      </div>
      <div className="load-characteristic-heading">
        <div>
          <h1>{data.title}</h1>
          <p>{data.lead}</p>
        </div>
        <span>
          {String(page).padStart(2, '0')} / 04 · {data.tag}
        </span>
      </div>
      <div className="load-characteristic-layout">
        <section className="load-characteristic-copy">
          <div className="load-formula">{data.formula}</div>
          <div className="load-copy-block">
            <strong>典型生产机械</strong>
            <p>{data.examples}</p>
          </div>
          <ul>
            {data.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="load-animation-note">
            <span className="load-pulse" />
            <div>
              <strong>动画读图</strong>
              <p>{data.note}</p>
            </div>
          </div>
        </section>
        <section className="load-characteristic-chart">
          <div className="chart-heading">
            <span>n — Tₗ 机械特性</span>
            <small>工作点沿曲线循环运动</small>
          </div>
          <svg
            className="load-curve-svg"
            viewBox="0 0 700 500"
            aria-label={`${data.title}的转速 n 与负载转矩 Tₗ 机械特性曲线`}
          >
            <defs>
              <linearGradient id="load-curve-glow" x1="0" x2="1">
                <stop offset="0" stopColor="#2c7667" stopOpacity="0.15" />
                <stop offset="1" stopColor="#b86d37" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <g className="load-chart-grid">
              <path d="M 105 100 H 620 M 105 200 H 620 M 105 300 H 620" />
              <path d="M 220 50 V 445 M 340 50 V 445 M 460 50 V 445" />
            </g>
            <g className="load-chart-axis">
              {data.axisMode === 'reaction' ? (
                <>
                  <path d="M 105 250 H 635" />
                  <path d="M 370 445 V 48" />
                  <path d="M 625 241 L 635 250 L 625 259" />
                  <path d="M 361 58 L 370 48 L 379 58" />
                </>
              ) : data.axisMode === 'potential' ? (
                <>
                  <path d="M 105 250 H 635" />
                  <path d="M 210 445 V 48" />
                  <path d="M 625 241 L 635 250 L 625 259" />
                  <path d="M 201 58 L 210 48 L 219 58" />
                </>
              ) : (
                <>
                  <path d="M 105 445 H 635" />
                  <path d="M 105 445 V 48" />
                  <path d="M 625 436 L 635 445 L 625 454" />
                  <path d="M 96 58 L 105 48 L 114 58" />
                </>
              )}
            </g>
            <path className="load-curve-shadow" d={data.curve} />
            <path className="load-curve" d={data.curve} />
            <path className="load-curve-sweep" d={data.motion} pathLength="1" />
            <circle className="load-work-point" r="10">
              <animateMotion
                dur="4.8s"
                repeatCount="indefinite"
                path={data.motion}
                rotate="auto"
              />
            </circle>
            <text
              className="load-axis-label"
              x="650"
              y={data.axisMode === 'positive' ? 457 : 262}
            >
              Tₗ
            </text>
            <text
              className="load-axis-label"
              x={
                data.axisMode === 'reaction'
                  ? 349
                  : data.axisMode === 'potential'
                    ? 189
                    : 84
              }
              y="60"
            >
              n
            </text>
            <text
              className="load-curve-label"
              x={
                data.axisMode === 'reaction'
                  ? 390
                  : data.axisMode === 'potential'
                    ? 445
                    : 390
              }
              y={data.axisMode === 'positive' ? 91 : 80}
            >
              {data.curveLabel}
            </text>
            <text
              className="load-origin-label"
              x={
                data.axisMode === 'reaction'
                  ? 360
                  : data.axisMode === 'potential'
                    ? 200
                    : 95
              }
              y={data.axisMode === 'positive' ? 470 : 275}
            >
              0
            </text>
            {data.axisMode === 'reaction' ? (
              <>
                <text className="load-direction-label" x="188" y="429">
                  −Tₗ₀
                </text>
                <text className="load-direction-label" x="505" y="80">
                  +Tₗ₀
                </text>
              </>
            ) : data.axisMode === 'potential' ? (
              <text className="load-direction-label" x="445" y="80">
                Tₗ₀
              </text>
            ) : (
              <text className="load-direction-label" x="122" y="83">
                正转速方向
              </text>
            )}
          </svg>
          <div className="load-curve-legend">
            <span>
              <i className="legend-line" /> 负载机械特性
            </span>
            <span>
              <i className="legend-point" /> 动态工作点
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
