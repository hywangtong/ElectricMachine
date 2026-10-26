import { useMemo, useState } from 'react';

type SpeedLoad = 'constant-torque' | 'fan' | 'constant-power';

const loadOptions: Array<{
  id: SpeedLoad;
  label: string;
  short: string;
  color: string;
}> = [
  {
    id: 'constant-torque',
    label: '恒转矩负载',
    short: '车床 / 传送带',
    color: '#b76a35',
  },
  {
    id: 'fan',
    label: '通风机类负载',
    short: '风机 / 水泵',
    color: '#2e7a6a',
  },
  {
    id: 'constant-power',
    label: '恒功率负载',
    short: '卷绕 / 切削',
    color: '#5b63a7',
  },
];

const plot = { left: 68, top: 28, width: 440, height: 260 };

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const point = (torque: number, speed: number) =>
  `${plot.left + torque * plot.width},${plot.top + (1 - speed) * plot.height}`;

const pathFrom = (points: string[]) => `M ${points.join(' L ')}`;

const loadTorque = (load: SpeedLoad, speed: number) => {
  if (load === 'constant-torque') return 0.58;
  if (load === 'fan') return clamp(0.08 + 0.8 * speed ** 2, 0, 0.98);
  return clamp(0.56 / Math.max(speed, 0.2), 0, 0.98);
};

const workPointFor = (
  load: SpeedLoad,
  motorSpeed: (torque: number) => number,
) => {
  if (load === 'constant-torque') {
    const torque = loadTorque(load, 0);
    return { torque, speed: motorSpeed(torque) };
  }
  let low = 0;
  let high = 1;
  for (let i = 0; i < 36; i += 1) {
    const speed = (low + high) / 2;
    const difference = motorSpeed(loadTorque(load, speed)) - speed;
    if (difference > 0) low = speed;
    else high = speed;
  }
  const speed = (low + high) / 2;
  return { speed, torque: loadTorque(load, speed) };
};

const loadPath = (load: SpeedLoad) => {
  if (load === 'constant-torque') {
    return pathFrom([point(0.58, 0), point(0.58, 1)]);
  }
  const points = Array.from({ length: 25 }, (_, index) => {
    const speed = index / 24;
    return point(loadTorque(load, speed), speed);
  });
  return pathFrom(points);
};

function SpeedPlot({
  resistance,
  load,
}: {
  resistance: number;
  load: SpeedLoad;
}) {
  const model = useMemo(() => {
    const noLoadSpeed = 0.94;
    const slope = 0.22 + 0.58 * (resistance / 4);
    const motorSpeed = (torque: number) =>
      clamp(noLoadSpeed - slope * torque, 0.06, 0.98);
    const workPoint = workPointFor(load, motorSpeed);
    const motor = pathFrom([point(0, motorSpeed(0)), point(1, motorSpeed(1))]);
    return { motor, workPoint, load: loadPath(load), slope };
  }, [load, resistance]);

  const selected = loadOptions.find((option) => option.id === load);
  const work = point(model.workPoint.torque, model.workPoint.speed);

  return (
    <div className="speed-control-chart-wrap">
      <div className="speed-control-chart-heading">
        <span>n — T 机械特性</span>
        <small>工作点 = 电机特性 ∩ 负载特性</small>
      </div>
      <svg
        className="speed-control-chart"
        viewBox="0 0 560 350"
        aria-label="串接电阻改变时的人为机械特性和负载工作点"
      >
        <g className="speed-control-grid">
          <path d="M68 93H508 M68 158H508 M68 223H508" />
          <path d="M178 28V288 M288 28V288 M398 28V288" />
        </g>
        <g className="speed-control-axis">
          <path d="M68 288H520" />
          <path d="M68 288V17" />
          <path d="M510 280L520 288L510 296" />
          <path d="M60 27L68 17L76 27" />
        </g>
        <path className="speed-control-motor-shadow" d={model.motor} />
        <path className="speed-control-motor" d={model.motor} />
        <path
          className="speed-control-load"
          d={model.load}
          style={{ stroke: selected?.color }}
        />
        <path
          className="speed-control-guide"
          d={`M ${work} V 288 M 68 ${work.split(',')[1]} H ${work.split(',')[0]}`}
        />
        <circle
          className="speed-control-point"
          cx={work.split(',')[0]}
          cy={work.split(',')[1]}
          r="9"
        />
        <text className="speed-control-axis-label" x="526" y="297">
          T
        </text>
        <text className="speed-control-axis-label" x="54" y="25">
          n
        </text>
        <text className="speed-control-small-label" x="58" y="306">
          0
        </text>
        <text className="speed-control-small-label" x="475" y="319">
          Tₑ
        </text>
        <text className="speed-control-motor-label" x="310" y="80">
          人为特性
        </text>
        <text
          className="speed-control-load-label"
          x="367"
          y="251"
          style={{ fill: selected?.color }}
        >
          {selected?.label}
        </text>
        <text
          className="speed-control-point-label"
          x={Number(work.split(',')[0]) + 13}
          y={Number(work.split(',')[1]) - 12}
        >
          P
        </text>
      </svg>
      <div className="speed-control-legend">
        <span>
          <i className="speed-legend-motor" /> 电机人为特性
        </span>
        <span>
          <i
            className="speed-legend-load"
            style={{ background: selected?.color }}
          />{' '}
          负载特性
        </span>
        <span>
          <i className="speed-legend-point" /> 实际工作点
        </span>
      </div>
      <div className="speed-control-readout">
        <span>
          n ≈ <b>{Math.round(model.workPoint.speed * 100)}%</b> n₀
        </span>
        <span>
          T ≈ <b>{Math.round(model.workPoint.torque * 100)}%</b> Tₙ
        </span>
        <span>
          斜率 β⁻¹ ≈ <b>{model.slope.toFixed(2)}</b>
        </span>
      </div>
    </div>
  );
}

export function SpeedControlLesson() {
  const [resistance, setResistance] = useState(0);
  const [load, setLoad] = useState<SpeedLoad>('constant-torque');
  const selected = loadOptions.find((option) => option.id === load);

  return (
    <div className="speed-control-body">
      <div className="eyebrow">
        <span />
        直流拖动 <b>他励直流电动机 · 电枢串电阻调速</b>
      </div>
      <div className="speed-control-heading">
        <div>
          <h1>电阻变大，工作点怎样移动？</h1>
          <p>滑动调节 Rᵣ，观察人为特性变陡，以及三类负载下的稳态转速变化。</p>
        </div>
        <span>17 / 18 · 交互实验</span>
      </div>
      <div className="speed-control-layout">
        <section className="speed-control-panel">
          <div className="speed-control-circuit-title">
            <span>01</span> 先看控制量：串接电阻 Rᵣ
          </div>
          <svg
            className="speed-control-circuit"
            viewBox="0 0 420 132"
            aria-label="他励直流电动机串电阻电路示意图"
          >
            <path d="M35 32H116 M191 32H258V102H35V32 M258 32H350V102H258" />
            <rect x="116" y="20" width="75" height="24" rx="4" />
            <circle cx="155" cy="77" r="22" />
            <text x="147" y="84">
              M
            </text>
            <path d="M329 47c-18 0-18 35 0 35s18-35 0-35Z" />
            <path
              className="speed-circuit-arrow"
              d="M60 32h27 M78 25l10 7-10 7"
            />
            <text x="136" y="16">
              Rₐ + Rᵣ
            </text>
            <text x="302" y="45">
              Uᶠ
            </text>
            <text x="16" y="25">
              Uₐ
            </text>
            <text x="142" y="112">
              他励电动机
            </text>
          </svg>
          <div className="speed-resistance-control">
            <div className="speed-control-label-row">
              <label htmlFor="armature-resistance">串接电阻 Rᵣ</label>
              <strong>{resistance.toFixed(1)} Ω</strong>
            </div>
            <input
              id="armature-resistance"
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={resistance}
              onChange={(event) => setResistance(Number(event.target.value))}
            />
            <div className="speed-slider-scale">
              <span>0 Ω · 固有特性</span>
              <span>4 Ω · 人为特性</span>
            </div>
          </div>
          <div className="speed-control-formula">
            <span>n = n₀ −</span>
            <b>Rₐ + Rᵣ</b>
            <span>T</span>
            <small> CₑCₜΦ²</small>
          </div>
          <div className="speed-control-tip">
            <span className="speed-tip-dot" /> Rᵣ ↑ → 特性斜率变陡 → 同一负载下
            n ↓
          </div>
        </section>
        <section className="speed-control-panel speed-control-plot-panel">
          <div className="speed-load-tabs" role="tablist" aria-label="负载类型">
            {loadOptions.map((option) => (
              <button
                key={option.id}
                className={load === option.id ? 'active' : ''}
                onClick={() => setLoad(option.id)}
                role="tab"
                aria-selected={load === option.id}
              >
                <span style={{ background: option.color }} />
                {option.label}
                <small>{option.short}</small>
              </button>
            ))}
          </div>
          <SpeedPlot resistance={resistance} load={load} />
          <p className="speed-control-caption">
            <b>{selected?.label}</b>
            ：调速时负载特性保持不变，电阻只改变电机侧人为特性，新的交点就是新的稳态工作点。
          </p>
        </section>
      </div>
    </div>
  );
}

const indicators = [
  [
    '01',
    '调速方向',
    '串电阻只能降速：Rᵣ 增大，n 下降；适合 nₙ 以下运行。',
    'n ↓',
  ],
  [
    '02',
    '调速稳定性',
    '电阻使特性变软，斜率 β 变小，负载扰动引起的转速波动增大。',
    'β ↓',
  ],
  [
    '03',
    '调速范围',
    '受稳定性与允许电流限制，低速端范围有限，不能无限增大 Rᵣ。',
    'D 较小',
  ],
  [
    '04',
    '调速平滑性',
    '连续改变 Rᵣ 可无级调速；实际常用分级电阻，平滑性取决于级数。',
    '连续 / 分级',
  ],
  [
    '05',
    '调速经济性',
    '串联电阻消耗电枢铜耗，低速时效率低，长期运行不经济。',
    'η ≈ n / n₀',
  ],
  [
    '06',
    '允许负载',
    '调速电阻发热且特性变软，通常按额定电流限制负载转矩。',
    'T ≤ Tₙ',
  ],
] as const;

export function SpeedControlSummary() {
  return (
    <div className="speed-summary-body">
      <div className="eyebrow">
        <span />
        直流拖动 <b>他励直流电动机 · 调速特性指标</b>
      </div>
      <div className="speed-summary-heading">
        <div>
          <h1>评价一种调速方法，要看六件事</h1>
          <p>串电阻调速原理直观，但“能不能用好”取决于这些工程指标。</p>
        </div>
        <span>18 / 18 · 课堂归纳</span>
      </div>
      <div className="speed-summary-grid">
        {indicators.map(([number, title, description, metric]) => (
          <section key={number} className="speed-summary-card">
            <div className="speed-summary-card-top">
              <span>{number}</span>
              <b>{metric}</b>
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <div className="speed-summary-footer">
        <span>串电阻调速的核心取舍</span>
        <strong>实现简单、调速方向明确</strong>
        <i>↔</i>
        <strong>能耗增加、低速稳定性变差</strong>
      </div>
    </div>
  );
}
