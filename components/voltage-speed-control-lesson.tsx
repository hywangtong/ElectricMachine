'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { speedLoadTorque, speedSlope } from '@/lib/speed-control-model.mjs';
import { voltageEquilibrium } from '@/lib/voltage-speed-control-model.mjs';

type Load = 'constant-torque' | 'fan' | 'constant-power';
type Point = { torque: number; speed: number };
const loads: Array<{
  id: Load;
  label: string;
  formula: string;
  result: string;
}> = [
  {
    id: 'constant-torque',
    label: '恒转矩负载',
    formula: 'Tₗ = 常数',
    result: '降压后转速下降，负载转矩不变，稳态电枢电流不变。',
  },
  {
    id: 'fan',
    label: '风机泵类负载',
    formula: 'Tₗ ∝ n²',
    result: '降压后转速下降，负载转矩减小，稳态电枢电流减小。',
  },
  {
    id: 'constant-power',
    label: '恒功率负载',
    formula: 'Tₗn = 常数',
    result: '降压后转速下降，转矩、电流增大；先过载，再到临界点。',
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

const plot = { left: 64, bottom: 280, width: 580, height: 250, maxTorque: 3 };
function xy(point: Point) {
  return {
    x: plot.left + (point.torque / plot.maxTorque) * plot.width,
    y: plot.bottom - (point.speed / 1.1) * plot.height,
  };
}
function coord(point: Point) {
  const { x, y } = xy(point);
  return `${x},${y}`;
}
function motorPath(voltage: number) {
  const torque = Math.min(plot.maxTorque, voltage / speedSlope(0));
  return `M ${coord({ torque: 0, speed: voltage })} L ${coord({ torque, speed: voltage - speedSlope(0) * torque })}`;
}
function loadPath(load: Load) {
  if (load === 'constant-torque') {
    return `M ${coord({ torque: 0.8, speed: 0 })} L ${coord({ torque: 0.8, speed: 1.08 })}`;
  }
  const start = load === 'constant-power' ? 0.5 / plot.maxTorque : 0;
  return Array.from({ length: 120 }, (_, index) => {
    const speed = start + ((1.08 - start) * index) / 119;
    return `${index ? 'L' : 'M'} ${coord({ torque: speedLoadTorque(load, speed), speed })}`;
  }).join(' ');
}
function WorkPoint({
  point,
  label,
  hollow = false,
}: {
  point: Point;
  label: string;
  hollow?: boolean;
}) {
  const { x, y } = xy(point);
  return (
    <g className={`speed-work-point${hollow ? ' hollow' : ''}`}>
      <circle cx={x} cy={y} r="6" />
      <text x={x + 10} y={y + (hollow ? 24 : -12)}>
        {label}
      </text>
    </g>
  );
}
function VoltagePlot({ voltage, load }: { voltage: number; load: Load }) {
  const result = voltageEquilibrium(load, voltage);
  const a = voltageEquilibrium(load, 1).stable!;
  const c = result.stable;
  const unstable = result.unstable;
  return (
    <svg
      className="speed-control-chart voltage-control-chart"
      viewBox="0 0 720 335"
      aria-label={`${loads.find((item) => item.id === load)?.label}降压调速曲线：固有特性与所选电压特性平行；${result.status === 'none' ? '无稳态交点' : result.status === 'critical' ? '临界切点' : '实心交点为稳定工作点'}`}
    >
      <defs>
        <marker
          id="voltage-axis-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="#52746b" />
        </marker>
      </defs>
      <g className="speed-control-grid">
        <path d="M64 98H644 M64 189H644 M257 30V280 M451 30V280 M644 30V280" />
      </g>
      <g className="speed-control-axis">
        <path d="M64 280H680 M64 280V15" markerEnd="url(#voltage-axis-arrow)" />
      </g>
      {[0.2, 0.4, 0.6, 0.8].map((value) => (
        <path
          key={value}
          className="voltage-family-line"
          d={motorPath(value)}
        />
      ))}
      <path className="speed-natural-line" d={motorPath(1)} />
      <path className="speed-load-line" d={loadPath(load)} />
      {voltage < 0.9999 && (
        <path className="speed-artificial-line" d={motorPath(voltage)} />
      )}
      <path className="speed-control-guide" d={`M64 ${xy(a).y}H${xy(a).x}`} />
      <WorkPoint point={a} label="a" />
      {c && voltage < 0.9999 && (
        <>
          <path
            className="speed-control-guide"
            d={`M64 ${xy(c).y}H${xy(c).x}V280`}
          />
          <WorkPoint
            point={c}
            label={result.status === 'critical' ? 'c（临界）' : 'c'}
          />
          <circle
            className="speed-moving-point"
            cx={xy(c).x}
            cy={xy(c).y}
            r="4"
          />
        </>
      )}
      {unstable && unstable.torque <= plot.maxTorque && (
        <WorkPoint point={unstable} label="不稳定" hollow />
      )}
      <g className="speed-graph-labels">
        <text x="37" y="22">
          n
        </text>
        <text x="684" y="288">
          T
        </text>
        <text x="40" y="303">
          O
        </text>
        <text className="speed-natural-text" x="477" y="48">
          Uₙ · 固有
        </text>
        <text
          className="speed-artificial-text"
          x="477"
          y={Math.min(xy({ torque: 2.2, speed: voltage - 0.22 }).y + 26, 267)}
        >
          Uₐ = {(voltage * 220).toFixed(0)} V
        </text>
      </g>
      <g className="speed-graph-ticks">
        <text x="43" y="58">
          1.0
        </text>
        <text x="43" y="192">
          0.4
        </text>
        <text x="249" y="303">
          1.0
        </text>
        <text x="442" y="303">
          2.0
        </text>
        <text x="635" y="303">
          3.0
        </text>
        <text x="75" y="21">
          转速 n / n₀ₙ
        </text>
        <text x="553" y="330">
          转矩 T / Tₙ
        </text>
        <text x="84" y="324">
          浅线：0.2 / 0.4 / 0.6 / 0.8 Uₙ
        </text>
      </g>
    </svg>
  );
}

export function VoltageSpeedControlLesson() {
  const [voltage, setVoltage] = useState(154);
  const [shownVoltage, setShownVoltage] = useState(0.7);
  const [load, setLoad] = useState<Load>('constant-torque');
  const [run, setRun] = useState(0);
  const current = useRef(0.7);
  const replay = useRef(false);
  useEffect(() => {
    const isReplay = replay.current;
    const from = isReplay ? 1 : current.current;
    const duration = isReplay ? 2200 : 450;
    replay.current = false;
    const target = voltage / 220;
    // Suppress automatic motion for this preference; explicitly requesting
    // replay still plays the lesson's animation without changing OS settings.
    const reducedMotion =
      !isReplay &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let start: number | undefined;
    const animate = (time: number) => {
      start ??= time;
      const progress = reducedMotion
        ? 1
        : Math.min(1, (time - start) / duration);
      current.current = from + (target - from) * (progress * (2 - progress));
      setShownVoltage(current.current);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [voltage, run]);
  const result = voltageEquilibrium(load, shownVoltage);
  const work = result.stable;
  const selected = loads.find((item) => item.id === load)!;
  const warning = result.status !== 'stable' || (work && work.torque > 1);
  return (
    <div className="speed-control-body voltage-control-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>他励直流电动机 / 改变电枢电压</b>
      </div>
      <div className="speed-control-heading">
        <div>
          <h1>改变电枢电压，机械特性怎样移动？</h1>
          <p>磁通与电枢电阻不变；降压时，机械特性向下平行移动。</p>
        </div>
        <span>电压 · 负载 · 工作点</span>
      </div>
      <div className="speed-equation-band">
        <div className="speed-equation">
          n = <Fraction top="Uₐ" bottom="CₑΦₙ" /> −{' '}
          <Fraction top="Rₐ" bottom="CₑCₜΦₙ²" /> T = n₀ − γT
        </div>
        <div>
          <b>Uₐ ↓ → n₀ ↓，γ、α 不变</b>
          <span>n₀ ∝ Uₐ · α = 1/γ · Rᵣ = 0</span>
        </div>
      </div>
      <div className="speed-control-layout">
        <section className="speed-control-panel voltage-control-panel">
          <div className="speed-panel-title">
            <span>01</span>
            <h2>连续调节直流电源</h2>
            <small>Φ = Φₙ</small>
          </div>
          <div
            className="voltage-supply-diagram"
            aria-label="可调直流电源向电枢供电，励磁由独立电源保持恒定"
          >
            <div>
              <b>可调直流电源</b>
              <strong>Uₐ</strong>
            </div>
            <span>→</span>
            <div>
              <b>电枢 Rₐ · M</b>
              <strong>Iₐ → T</strong>
            </div>
          </div>
          <p className="voltage-field-note">独立励磁电源 → Φₙ 保持不变</p>
          <div className="speed-resistance-control">
            <div className="speed-control-label-row">
              <label htmlFor="armature-voltage">电枢电压 Uₐ</label>
              <strong>{voltage} V</strong>
            </div>
            <input
              id="armature-voltage"
              type="range"
              min="22"
              max="220"
              step="1"
              value={voltage}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) => setVoltage(Number(event.target.value))}
            />
            <div className="speed-slider-scale">
              <span>22 V · 0.1 Uₙ</span>
              <span>220 V · 额定电压</span>
            </div>
          </div>
          <div className="speed-step-explanation">
            <p>
              <b>a</b>
              <span>额定电压下的原稳态工作点。</span>
            </p>
            <p>
              <b>↓</b>
              <span>减小 Uₐ，平行下移；增大 Uₐ，平行上移。</span>
            </p>
            <p>
              <b>c</b>
              <span>与负载曲线的交点，决定新的稳态转速。</span>
            </p>
          </div>
          <button
            className="speed-demo-button"
            disabled={voltage === 220}
            onClick={() => {
              replay.current = true;
              setRun((value) => value + 1);
            }}
          >
            ↘ 重播：从额定电压降至所选电压
          </button>
          <p className="speed-model-note">
            动画为缓慢调压的准稳态示意，逐点求取交点；不表示突变电压下的瞬态轨迹。n₀ₙ
            为额定电压下的理想空载转速。
          </p>
        </section>
        <section className="speed-control-panel speed-control-plot-panel">
          <div className="speed-load-tabs" aria-label="选择负载类型">
            {loads.map((option) => (
              <button
                key={option.id}
                aria-pressed={load === option.id}
                className={load === option.id ? 'active' : ''}
                onClick={() => setLoad(option.id)}
              >
                <b>{option.label}</b>
                <small>{option.formula}</small>
              </button>
            ))}
          </div>
          <VoltagePlot voltage={shownVoltage} load={load} />
          <div className="speed-control-legend">
            <span>
              <i className="natural" />
              额定电压特性
            </span>
            <span>
              <i />
              当前电压特性
            </span>
            <span>
              <i className="load" />
              负载特性 Tₗ
            </span>
          </div>
          <div
            className={`speed-control-readout${warning ? ' warning' : ''}`}
            aria-live="polite"
          >
            {work ? (
              <>
                <span>
                  n / n₀ₙ <b>{(work.speed * 100).toFixed(1)}%</b>
                </span>
                <span>
                  Iₐ / Iₐₙ = T / Tₙ <b>{work.torque.toFixed(2)}</b>
                </span>
                <span>
                  {result.status === 'critical'
                    ? '临界 · 无稳定裕量'
                    : work.torque > 1
                      ? '超过额定电流 / 转矩'
                      : '稳态工作点'}
                </span>
              </>
            ) : (
              <strong>无稳态交点：该电压无法维持此恒功率负载。</strong>
            )}
          </div>
          <p className="speed-control-caption">
            {load === 'constant-power'
              ? `${selected.result}本例约 98.4 V 相切，再降压则无交点；空心交点不稳定。`
              : selected.result}
          </p>
        </section>
      </div>
      <div className="speed-bottom-note">
        <b>读图要点</b>平行特性：同一转矩下，转速降落 Δn = γT 不变。
        <span>
          沿用前页：Uₙ = 220 V · Rₐ = 0.5 Ω · n₀ₙ = 1000 r/min · Iₐₙ = 44 A
        </span>
      </div>
    </div>
  );
}

export function VoltageSpeedControlSummary() {
  return (
    <div className="speed-summary-body voltage-summary-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>改变电枢电压 / 六项性能指标</b>
      </div>
      <div className="speed-summary-heading">
        <div>
          <h1>电压调速：硬度不变，低速仍有静差</h1>
          <p>恒磁通、无外串电阻；在额定电压与基速以下调节。</p>
        </div>
        <span>方向 · 品质 · 允许负载</span>
      </div>
      <div className="voltage-summary-grid">
        <section className="speed-summary-card">
          <div className="speed-card-index">01 / 调速方向</div>
          <h2>基速以下，向下调节</h2>
          <div className="speed-card-equation">Uₐ ↓ → n ↓，Uₐ ↑ → n ↑</div>
          <p>
            Uₐ ≤
            Uₙ；升压可回到同负载的固有特性工作点。额定磁通下，不超额定电压调速。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">02 / 转速稳定性</div>
          <h2>α、γ 不变；低速静差率增大</h2>
          <div className="speed-card-equation">
            δ = <Fraction top="n₀ − n_f" bottom="n₀" /> × 100%
          </div>
          <p>
            同一满载转矩下，Δn = γT 不变；降压使 n₀ 减小，故 δ
            增大，转速稳定性变差。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">03 / 调速范围</div>
          <h2>最低转速受允许静差限制</h2>
          <div className="speed-card-equation">D = nₘₐₓ / nₘᵢₙ，D ≤ 8</div>
          <p>
            沿用附图的传统开环调速范围表述；并非所有调压系统的上限，闭环控制可扩大范围。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">04 / 调速平滑性</div>
          <h2>连续调压，可无级调速</h2>
          <div className="speed-card-equation">σ = nᵢ / nᵢ₋₁ → 1</div>
          <p>
            相邻两级转速越接近，调速越平滑。直流电源连续可调时，可实现无级调速。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">05 / 调速经济性</div>
          <h2>需要专用可调直流电源</h2>
          <div className="speed-card-equation">无外接调速电阻损耗</div>
          <p>
            可采用可控整流或直流斩波电源；电枢铜耗 RₐIₐ²
            仍存在，实际效率还取决于电源与电机损耗。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">06 / 调速时的允许负载</div>
          <h2>恒转矩调速</h2>
          <div className="speed-card-equation">
            T<sub>allow</sub> = CₜΦₙIₐₙ ≈ Tₙ
          </div>
          <p>
            恒磁通、额定电流限制下，允许转矩基本不变；允许功率随转速降低，低速还须校核散热。
          </p>
        </section>
      </div>
      <div className="speed-summary-footer">
        <b>负载判断</b>
        <span>恒转矩：Iₐ 不变；风机：Iₐ ↓；恒功率：Iₐ ↑。</span>
        <strong>允许负载能力 ≠ 实际负载需求</strong>
      </div>
      <p className="speed-summary-notation">
        γ = |dn/dT|（附图记作 β），α = 1/γ；n_f
        为同一特性上的满载转速。静差率衡量转速稳定性，不等同于动态稳定判据。
      </p>
    </div>
  );
}
