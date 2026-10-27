'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  speedEquilibrium,
  speedLoadTorque,
  speedSlope,
} from '@/lib/speed-control-model.mjs';

type SpeedLoad = 'constant-torque' | 'fan' | 'constant-power';
type WorkPoint = { torque: number; speed: number };

const loads: Array<{
  id: SpeedLoad;
  label: string;
  formula: string;
  result: string;
}> = [
  {
    id: 'constant-torque',
    label: '恒转矩负载',
    formula: 'Tₗ = 常数',
    result: 'c 与 a 的转矩相同：降速后电枢电流恢复原值。',
  },
  {
    id: 'fan',
    label: '风机泵类负载',
    formula: 'Tₗ ∝ n²',
    result: 'c 位于 a 的左下方：降速后负载转矩与电流均减小。',
  },
  {
    id: 'constant-power',
    label: '恒功率负载',
    formula: 'Tₗn = 常数',
    result: 'c 位于 a 的右下方：降速后转矩与电流增大，须防止过载。',
  },
];

function Fraction({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <span className="speed-fraction">
      <span>{top}</span>
      <span>{bottom}</span>
    </span>
  );
}

const graph = { left: 64, top: 30, width: 592, height: 235, maxTorque: 1.6 };
const xy = ({ torque, speed }: WorkPoint) => ({
  x: graph.left + (torque / graph.maxTorque) * graph.width,
  y: graph.top + ((1.1 - speed) / 1.1) * graph.height,
});
const coordinates = (p: WorkPoint) => {
  const { x, y } = xy(p);
  return `${x},${y}`;
};
const motorPath = (slope: number) => {
  const torque = Math.min(graph.maxTorque, 1 / slope);
  return `M ${coordinates({ torque: 0, speed: 1 })} L ${coordinates({ torque, speed: 1 - slope * torque })}`;
};
const loadPath = (load: SpeedLoad) => {
  if (load === 'constant-torque') {
    return `M ${coordinates({ torque: 0.8, speed: 0 })} L ${coordinates({ torque: 0.8, speed: 1.08 })}`;
  }
  // Draw the visible part of the true load curve, without limiting torque.
  const start = load === 'constant-power' ? 0.5 / graph.maxTorque : 0;
  return Array.from({ length: 100 }, (_, index) => {
    const speed = start + ((1.08 - start) * index) / 99;
    return `${index ? 'L' : 'M'} ${coordinates({ torque: speedLoadTorque(load, speed), speed })}`;
  }).join(' ');
};

function PlotPoint({
  point,
  label,
  hollow = false,
  dx = 12,
  dy = -12,
}: {
  point: WorkPoint;
  label: string;
  hollow?: boolean;
  dx?: number;
  dy?: number;
}) {
  const { x, y } = xy(point);
  return (
    <g className={`speed-work-point${hollow ? ' hollow' : ''}`}>
      <circle cx={x} cy={y} r="6" />
      <text x={x + dx} y={y + dy}>
        {label}
      </text>
    </g>
  );
}

function SpeedPlot({
  resistance,
  load,
  progress,
}: {
  resistance: number;
  load: SpeedLoad;
  progress: number;
}) {
  const slope = speedSlope(resistance);
  const result = speedEquilibrium(load, resistance);
  const a = speedEquilibrium(load, 0).stable!;
  const b = { speed: a.speed, torque: (1 - a.speed) / slope };
  const c = result.stable;
  const movingSpeed = c ? a.speed + (c.speed - a.speed) * progress : a.speed;
  const moving = { speed: movingSpeed, torque: (1 - movingSpeed) / slope };
  const n0 = xy({ torque: 0, speed: 1 }).y;
  const aXY = xy(a);
  const bXY = xy(b);
  return (
    <svg
      className="speed-control-chart"
      viewBox="0 0 720 320"
      aria-label={`${loads.find((item) => item.id === load)?.label}的转速—转矩曲线；${result.status === 'none' ? '无稳态交点' : result.status === 'critical' ? '临界切点' : 'a 为原工作点，b 为切换后瞬时点，c 为新稳态点'}`}
    >
      <defs>
        <marker
          id="speed-axis-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill="#52746b" />
        </marker>
        <marker
          id="speed-motion-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="#c18a4d" />
        </marker>
      </defs>
      <g className="speed-control-grid">
        <path d="M64 94H656 M64 158H656 M64 222H656 M212 30V265 M360 30V265 M508 30V265" />
      </g>
      <g className="speed-control-axis">
        <path d="M64 265H680" markerEnd="url(#speed-axis-arrow)" />
        <path d="M64 265V15" markerEnd="url(#speed-axis-arrow)" />
      </g>
      <path className="speed-control-guide" d={`M64 ${n0}H656`} />
      <path className="speed-natural-line" d={motorPath(speedSlope(0))} />
      {resistance > 0 && (
        <path className="speed-artificial-line" d={motorPath(slope)} />
      )}
      <path className="speed-load-line" d={loadPath(load)} />
      {resistance > 0 && c && (
        <>
          <path
            className="speed-change-line"
            d={`M ${aXY.x - 9} ${aXY.y} H ${bXY.x + 9}`}
            markerEnd="url(#speed-motion-arrow)"
          />
          <path
            className="speed-change-line"
            d={`M ${coordinates(b)} L ${coordinates(c)}`}
          />
          <PlotPoint point={b} label="b" dx={-22} dy={18} />
          <PlotPoint
            point={c}
            label={result.status === 'critical' ? 'c（临界）' : 'c'}
            dy={24}
          />
          {result.status === 'stable' && progress < 1 && (
            <circle
              className="speed-moving-point"
              cx={xy(moving).x}
              cy={xy(moving).y}
              r="9"
            />
          )}
        </>
      )}
      <PlotPoint point={a} label="a" />
      {result.unstable && result.unstable.torque <= graph.maxTorque && (
        <PlotPoint
          point={result.unstable}
          label="不稳定交点"
          hollow
          dx={-100}
          dy={25}
        />
      )}
      {c && (
        <path
          className="speed-control-guide"
          d={`M64 ${xy(c).y}H${xy(c).x}V265`}
        />
      )}
      <g className="speed-graph-labels">
        <text x="37" y={n0 + 7}>
          n₀
        </text>
        <text x="37" y="22">
          n
        </text>
        <text x="684" y="273">
          T
        </text>
        <text x="44" y="287">
          O
        </text>
        <text className="speed-natural-text" x="567" y="70">
          Rₐ · 固有
        </text>
        {resistance > 0 && (
          <text className="speed-artificial-text" x="490" y="245">
            Rₐ + Rᵣ
          </text>
        )}
      </g>
      <g className="speed-graph-ticks">
        <text x="48" y="302">
          0
        </text>
        <text x="340" y="302">
          0.8
        </text>
        <text x="636" y="302">
          1.6
        </text>
        <text x="564" y="319">
          转矩 T / Tₙ
        </text>
        <text x="75" y="21">
          转速 n / n₀
        </text>
      </g>
    </svg>
  );
}

function SpeedCircuit() {
  return (
    <svg
      className="speed-control-circuit"
      viewBox="0 0 500 195"
      aria-label="独立励磁电源；电枢电源串联调速电阻 Rr、电枢内阻 Ra 和电动机 M"
    >
      <defs>
        <marker
          id="speed-current-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="#b56840" />
        </marker>
      </defs>
      <g className="speed-circuit-wire">
        <path d="M40 43H110 M176 43H211 M261 43H292V80 M292 132V170H40 M382 43H460 M382 170H460 M382 43V70 M382 142V170" />
        <rect
          className="speed-rheostat"
          x="110"
          y="31"
          width="66"
          height="24"
          rx="2"
        />
        <rect x="211" y="31" width="50" height="24" rx="2" />
        <path d="M142 19V31 M142 19H192V43 M138 25L142 31L146 25" />
        <path d="M382 70c-24 0-24 18 0 18s-24 18 0 18-24 18 0 18-24 18 0 18" />
        <circle cx="292" cy="106" r="26" />
        <circle cx="40" cy="43" r="4" />
        <circle cx="40" cy="170" r="4" />
        <circle cx="460" cy="43" r="4" />
        <circle cx="460" cy="170" r="4" />
      </g>
      <path
        className="speed-circuit-current"
        d="M57 43H91 M440 43H408"
        markerEnd="url(#speed-current-arrow)"
      />
      <g className="speed-circuit-labels">
        <text x="128" y="81">
          Rᵣ
        </text>
        <text x="222" y="81">
          Rₐ
        </text>
        <text x="280" y="114">
          M
        </text>
        <text x="8" y="112">
          Uₐ
        </text>
        <text x="464" y="112">
          U
          <tspan baselineShift="sub" fontSize="14">
            f
          </tspan>
        </text>
        <text x="66" y="29">
          Iₐ
        </text>
        <text x="413" y="29">
          I
          <tspan baselineShift="sub" fontSize="14">
            f
          </tspan>
        </text>
        <text x="23" y="33">
          +
        </text>
        <text x="23" y="185">
          −
        </text>
        <text x="470" y="33">
          +
        </text>
        <text x="470" y="185">
          −
        </text>
      </g>
      <text className="speed-circuit-note" x="355" y="190">
        独立励磁 · Φ 不变
      </text>
    </svg>
  );
}

export function SpeedControlLesson() {
  const [resistance, setResistance] = useState(1);
  const [load, setLoad] = useState<SpeedLoad>('constant-torque');
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(1);
  const selected = loads.find((item) => item.id === load)!;
  const result = speedEquilibrium(load, resistance);
  const work = result.stable;
  const isStable = result.status === 'stable';
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let frame = 0;
    let start: number | undefined;
    const animate = (time: number) => {
      start ??= time;
      const elapsed = Math.min((time - start) / 2600, 1);
      // Schematic timing; every moving point stays on the new motor line.
      setProgress(
        elapsed === 1 ? 1 : (1 - Math.exp(-4 * elapsed)) / (1 - Math.exp(-4)),
      );
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [run, resistance, load]);
  return (
    <div className="speed-control-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>他励直流电动机 / 电枢串电阻</b>
      </div>
      <div className="speed-control-heading">
        <div>
          <h1>改变电枢电阻，怎样实现调速？</h1>
          <p>电压与磁通保持不变；机械特性绕同一个理想空载点 n₀ 向下转动。</p>
        </div>
        <span>原理 · 负载 · 工作点</span>
      </div>
      <div className="speed-equation-band">
        <div className="speed-equation">
          n = <Fraction top="Uₐ" bottom="CₑΦ" /> −{' '}
          <Fraction top="Rₐ + Rᵣ" bottom="CₑCₜΦ²" /> T = n₀ − γT
        </div>
        <div>
          <b>n₀ 不变</b>
          <span>Rᵣ ↑ → γ ↑ → 硬度 α = 1/γ ↓</span>
        </div>
      </div>
      <div className="speed-control-layout">
        <section className="speed-control-panel">
          <div className="speed-panel-title">
            <span>01</span>
            <h2>电阻串在哪里？</h2>
            <small>Uₐ = Uₙ，Φ = Φₙ</small>
          </div>
          <SpeedCircuit />
          <div className="speed-resistance-control">
            <div className="speed-control-label-row">
              <label htmlFor="armature-resistance">外接调速电阻 Rᵣ</label>
              <strong>{resistance.toFixed(1)} Ω</strong>
            </div>
            <input
              id="armature-resistance"
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={resistance}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) => {
                setResistance(Number(event.target.value));
                setProgress(1);
                setRun(0);
              }}
            />
            <div className="speed-slider-scale">
              <span>0 Ω · 固有特性</span>
              <span>4 Ω · 更软的特性</span>
            </div>
          </div>
          <div className="speed-step-explanation">
            <p>
              <b>a</b>
              <span>原稳态：T = Tₗ，n = nₐ。</span>
            </p>
            <p>
              <b>b</b>
              <span>串入电阻：转速来不及改变，电流与转矩先减小。</span>
            </p>
            <p>
              <b>c</b>
              <span>
                {isStable
                  ? 'T < Tₗ，电机减速，直到新的 T = Tₗ。'
                  : '临界切点无稳定裕量；无交点时不能达到新稳态。'}
              </span>
            </p>
          </div>
          <button
            className="speed-demo-button"
            disabled={!isStable || resistance === 0}
            onClick={() => {
              setProgress(
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 1
                  : 0,
              );
              setRun((value) => value + 1);
            }}
          >
            ↗ 重播 a → b → c 调速过程
          </button>
          <p className="speed-model-note">
            演示从 Rᵣ = 0
            切换到所选电阻；忽略电枢电感与机械损耗，动画时间仅为示意。
          </p>
        </section>
        <section className="speed-control-panel speed-control-plot-panel">
          <div className="speed-load-tabs" aria-label="选择负载类型">
            {loads.map((option) => (
              <button
                key={option.id}
                aria-pressed={load === option.id}
                className={load === option.id ? 'active' : ''}
                onClick={() => {
                  setLoad(option.id);
                  setProgress(1);
                  setRun(0);
                }}
              >
                <b>{option.label}</b>
                <small>{option.formula}</small>
              </button>
            ))}
          </div>
          <SpeedPlot resistance={resistance} load={load} progress={progress} />
          <div className="speed-control-legend">
            <span>
              <i className="natural" />
              固有特性
            </span>
            <span>
              <i className="artificial" />
              所选电阻特性
            </span>
            <span>
              <i className="load" />
              负载特性 Tₗ
            </span>
          </div>
          <div
            className={`speed-control-readout${!isStable || (work && work.torque > 1) ? ' warning' : ''}`}
            aria-live="polite"
          >
            {work ? (
              <>
                <span>
                  n / n₀ <b>{(work.speed * 100).toFixed(1)}%</b>
                </span>
                <span>
                  T / Tₙ <b>{work.torque.toFixed(2)}</b>
                </span>
                <span>
                  {result.status === 'critical'
                    ? '临界切点 · 无稳定裕量'
                    : work.torque > 1
                      ? '超过额定转矩'
                      : '稳态工作点'}
                </span>
              </>
            ) : (
              <strong>无稳态交点：电阻过大，电机无法维持该恒功率负载。</strong>
            )}
          </div>
          <p className="speed-control-caption">
            {load === 'constant-power'
              ? '降速后转矩、电流增大；双曲线不经过原点，空心交点不稳定。本例 Rᵣ = 2 Ω 时相切，再增大则无交点。'
              : selected.result}
          </p>
        </section>
      </div>
      <div className="speed-bottom-note">
        <b>读图要点</b>同一电阻下，工作点由电机与负载共同决定。
        <span>
          示例：Uₐ = 220 V · Rₐ = 0.5 Ω · n₀ = 1000 r/min · Iₐₙ = 44 A · Tₙ ≈
          92.4 N·m
        </span>
      </div>
    </div>
  );
}

export function SpeedControlSummary() {
  return (
    <div className="speed-summary-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>电枢串电阻 / 六项性能指标</b>
      </div>
      <div className="speed-summary-heading">
        <div>
          <h1>电阻调速：速度降下来，代价是什么？</h1>
          <p>从机械特性看调速品质，从功率平衡看低速损耗。</p>
        </div>
        <span>性能 · 损耗 · 允许负载</span>
      </div>
      <div className="speed-summary-top">
        <section className="speed-summary-card">
          <div className="speed-card-index">01 / 调速方向</div>
          <h2>基速以下，向下降速</h2>
          <div className="speed-card-equation">Rᵣ ↑ → n ↓</div>
          <p>Uₐ、Φ 不变，n₀ 不变。切除电阻可回升至同负载下的固有特性转速。</p>
        </section>
        <section className="speed-summary-card speed-stability-card">
          <div className="speed-stability-heading">
            <div className="speed-card-index">02 / 转速稳定性</div>
            <h2>静差率</h2>
          </div>
          <div
            className="speed-static-slip-equation"
            aria-label="静差率 δ 等于理想空载转速 n0 减去满载转速 nf，除以 n0，再乘以百分之百"
          >
            δ ={' '}
            <Fraction
              top={
                <>
                  n₀ − n<sub>f</sub>
                </>
              }
              bottom="n₀"
            />{' '}
            × 100%
          </div>
          <p className="speed-static-slip-definition">
            在同一机械特性上，理想空载到满载的转速差，占理想空载转速的百分比。
          </p>
          <div className="speed-static-slip-symbols">
            n₀：理想空载转速 · n<sub>f</sub>：满载转速
          </div>
          <div className="speed-static-slip-conclusion">
            <strong>δ 越小，转速稳定性越好</strong>
            <span>R ↑ → γ ↑ → α ↓ → δ ↑</span>
          </div>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">03 / 调速范围</div>
          <h2>允许静差限制最低转速</h2>
          <div className="speed-card-equation">D = nₘₐₓ / nₘᵢₙ，通常较小</div>
          <p>
            还需满足电流与发热限制；恒功率负载在大电阻下可能失去稳定工作点。
          </p>
        </section>
      </div>
      <div className="speed-summary-bottom">
        <section className="speed-economy-card">
          <div className="speed-card-index">05 / 调速经济性</div>
          <div className="speed-economy-heading">
            <h2>降下去的转速，变成了电阻上的热</h2>
            <span>R = Rₐ + Rᵣ · 电枢回路总电阻</span>
          </div>
          <div className="speed-economy-layout">
            <div className="speed-power-derivation">
              <div>P₁ₐ = UₐIₐ = EIₐ + RIₐ²</div>
              <div>
                ΔPᵣ = RIₐ² = UₐIₐ (1 − <Fraction top="n" bottom="n₀" />)
              </div>
              <div className="speed-power-result">
                ηₐ = <Fraction top="EIₐ" bottom="UₐIₐ" /> ={' '}
                <Fraction top="E" bottom="Uₐ" /> ={' '}
                <Fraction top="n" bottom="n₀" />
              </div>
            </div>
            <div className="speed-power-example">
              <b>降至 50% 理想空载转速</b>
              <div className="speed-energy-bar">
                <span>转换 50%</span>
                <span>电阻损耗 50%</span>
              </div>
              <p>
                外接电阻耗热 RᵣIₐ²；
                <br />
                电枢绕组铜耗 RₐIₐ²。
              </p>
              <strong>低速效率低，不宜长期运行。</strong>
            </div>
          </div>
          <p className="speed-efficiency-note">
            ηₐ 为电枢输入到电磁功率的转换比。忽略励磁、铁耗和机械损耗时，整机 η
            ≈ n/n₀；计入这些损耗，实际效率更低。
          </p>
        </section>
        <div className="speed-summary-side">
          <section className="speed-summary-card">
            <div className="speed-card-index">04 / 调速平滑性</div>
            <h2>
              平滑系数 σ = n<sub>i</sub> / n<sub>i−1</sub>
            </h2>
            <p>
              相邻两级正转速之比。σ 越接近 1 越平滑；无级调速时 σ = 1。
              分级切阻有级，连续滑动无级。
            </p>
          </section>
          <section className="speed-summary-card">
            <div className="speed-card-index">06 / 调速时的允许负载</div>
            <div className="speed-card-equation">
              T<sub>allow</sub> = CₜΦₙIₐₙ ≈ Tₙ
            </div>
            <p>
              恒磁通、额定电流限制下属<b>恒转矩调速</b>
              ；允许功率随转速降低。须校核低速散热及电阻功率。
            </p>
          </section>
        </div>
      </div>
      <div className="speed-summary-footer">
        <b>选用判断</b>
        <span>设备简单、投资少；适合短时或间歇低速运行。</span>
        <strong>长期低速：电阻发热大，调速品质差。</strong>
      </div>
      <p className="speed-summary-notation">
        符号沿用本章：γ = |dn/dT| 为转速降落系数（附图记作 β），α = 1/γ
        为硬度；静差增大不等同于必然动态失稳。
      </p>
    </div>
  );
}
