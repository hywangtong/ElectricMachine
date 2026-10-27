'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fieldEquilibrium } from '@/lib/field-speed-control-model.mjs';
import { speedLoadTorque } from '@/lib/speed-control-model.mjs';

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
    result: '弱磁升速，转矩不变；Iₐ = Tₗ / (CₜΦ) 增大，须校核过流。',
  },
  {
    id: 'fan',
    label: '风机泵类负载',
    formula: 'Tₗ ∝ n²',
    result: '弱磁升速，风机转矩随 n² 增大，电枢电流增长更快。',
  },
  {
    id: 'constant-power',
    label: '恒功率负载',
    formula: 'Tₗn = 常数',
    result: '弱磁后 n ∝ 1/Φ、Tₗ ∝ Φ，本模型中稳态电枢电流不变。',
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

const plot = { left: 64, bottom: 280, width: 580, height: 250 };
const maxTorque = 3;
const maxSpeed = 2.15;
function xy({ torque, speed }: Point) {
  return {
    x: plot.left + (torque / maxTorque) * plot.width,
    y: plot.bottom - (speed / maxSpeed) * plot.height,
  };
}
function coord(point: Point) {
  const { x, y } = xy(point);
  return `${x},${y}`;
}
function motorPath(flux: number) {
  const torque = Math.min(maxTorque, flux / 0.1);
  return `M ${coord({ torque: 0, speed: 1 / flux })} L ${coord({ torque, speed: 1 / flux - (0.1 / flux ** 2) * torque })}`;
}
function loadPath(load: Load) {
  if (load === 'constant-torque') {
    return `M ${coord({ torque: 0.8, speed: 0 })} L ${coord({ torque: 0.8, speed: 2.1 })}`;
  }
  const start = load === 'constant-power' ? 0.5 / maxTorque : 0;
  const end = load === 'fan' ? Math.sqrt(maxTorque) : 2.1;
  return Array.from({ length: 120 }, (_, index) => {
    const speed = start + ((end - start) * index) / 119;
    return `${index ? 'L' : 'M'} ${coord({ torque: speedLoadTorque(load, speed), speed })}`;
  }).join(' ');
}
function WorkPoint({ point, label }: { point: Point; label: string }) {
  const { x, y } = xy(point);
  return (
    <g className="speed-work-point">
      <circle cx={x} cy={y} r="6" />
      <text x={x + 11} y={y - 12}>
        {label}
      </text>
    </g>
  );
}
function FieldPlot({ flux, load }: { flux: number; load: Load }) {
  const a = fieldEquilibrium(load, 1).stable;
  const c = fieldEquilibrium(load, flux).stable;
  return (
    <svg
      className="speed-control-chart voltage-control-chart"
      viewBox="0 0 720 335"
      aria-label={`${loads.find((item) => item.id === load)?.label}弱磁调速：a 为额定励磁工作点，c 为当前稳定工作点；弱磁使空载转速升高、斜率增大`}
    >
      <defs>
        <marker
          id="field-axis-arrow"
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
        {[0.5, 1, 1.5, 2].map((speed) => (
          <path key={speed} d={`M64 ${xy({ torque: 0, speed }).y}H644`} />
        ))}
        {[1, 2, 3].map((torque) => (
          <path key={torque} d={`M${xy({ torque, speed: 0 }).x} 30V280`} />
        ))}
      </g>
      <g className="speed-control-axis">
        <path d="M64 280H680" markerEnd="url(#field-axis-arrow)" />
        <path d="M64 280V15" markerEnd="url(#field-axis-arrow)" />
      </g>
      {[0.5, 0.6, 0.7, 0.8, 0.9].map((value) => (
        <path
          key={value}
          className="voltage-family-line"
          d={motorPath(value)}
        />
      ))}
      <path className="speed-natural-line" d={motorPath(1)} />
      <path className="speed-load-line" d={loadPath(load)} />
      {flux < 0.9999 && (
        <>
          <path className="speed-artificial-line" d={motorPath(flux)} />
          <path
            className="speed-control-guide"
            d={`M64 ${xy(c).y}H${xy(c).x}V280`}
          />
        </>
      )}
      <WorkPoint point={a} label="a" />
      {flux < 0.9999 && <WorkPoint point={c} label="c" />}
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
        <text className="speed-natural-text" x="485" y="199">
          Φₙ · 固有
        </text>
        {flux < 0.9999 && (
          <text className="speed-artificial-text" x="425" y="52">
            Φ = {(flux * 100).toFixed(0)}% Φₙ
          </text>
        )}
      </g>
      <g className="speed-graph-ticks">
        {[0.5, 1, 1.5, 2].map((speed) => (
          <text key={speed} x="39" y={xy({ torque: 0, speed }).y + 4}>
            {speed.toFixed(1)}
          </text>
        ))}
        {[1, 2, 3].map((torque) => (
          <text key={torque} x={xy({ torque, speed: 0 }).x - 8} y="303">
            {torque.toFixed(1)}
          </text>
        ))}
        <text x="75" y="21">
          转速 n / n₀ₙ
        </text>
        <text x="553" y="330">
          转矩 T / Tₙ
        </text>
        <text x="84" y="324">
          浅线：Φ / Φₙ = 0.5 ～ 0.9
        </text>
      </g>
    </svg>
  );
}

export function FieldSpeedControlLesson() {
  const [field, setField] = useState(75);
  const [flux, setFlux] = useState(0.75);
  const [load, setLoad] = useState<Load>('constant-torque');
  const [run, setRun] = useState(0);
  const current = useRef(0.75);
  const replay = useRef(false);
  useEffect(() => {
    const isReplay = replay.current;
    const from = isReplay ? 1 : current.current;
    replay.current = false;
    const reduced =
      !isReplay &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let start: number | undefined;
    let frame = 0;
    const animate = (time: number) => {
      start ??= time;
      const progress = reduced
        ? 1
        : Math.min(1, (time - start) / (isReplay ? 2400 : 450));
      current.current = from + (field / 100 - from) * progress * (2 - progress);
      setFlux(current.current);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [field, run]);
  const result = fieldEquilibrium(load, flux);
  const selected = loads.find((item) => item.id === load)!;
  const overloaded = result.current > 1 + 1e-9;
  return (
    <div className="speed-control-body field-control-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>他励直流电动机 / 改变励磁电流</b>
      </div>
      <div className="speed-control-heading">
        <div>
          <h1>减小励磁电流，机械特性怎样变化？</h1>
          <p>电枢电压与电阻不变；弱磁时，空载转速升高，机械特性变软。</p>
        </div>
        <span>励磁 · 负载 · 工作点</span>
      </div>
      <div className="speed-equation-band">
        <div className="speed-equation">
          n = <Fraction top="Uₙ" bottom="CₑΦ" /> −{' '}
          <Fraction top="Rₐ" bottom="CₑCₜΦ²" /> T = n₀ − γT
        </div>
        <div>
          <b>I_f ↓ → Φ ↓ → n₀ ↑，γ ↑</b>
          <span>n₀ ∝ 1/Φ · γ ∝ 1/Φ² · α = 1/γ ↓</span>
        </div>
      </div>
      <div className="speed-control-layout">
        <section className="speed-control-panel voltage-control-panel">
          <div className="speed-panel-title">
            <span>01</span>
            <h2>连续调节励磁电流</h2>
            <small>Uₐ = Uₙ</small>
          </div>
          <div
            className="voltage-supply-diagram"
            aria-label="独立可调励磁回路控制磁通，电枢接额定电压"
          >
            <div>
              <b>独立励磁回路</b>
              <strong>I_f → Φ</strong>
            </div>
            <span>→</span>
            <div>
              <b>电枢 Rₐ · M</b>
              <strong>T = CₜΦIₐ</strong>
            </div>
          </div>
          <p className="voltage-field-note">
            电枢电压固定为 220 V · 无外串电阻
          </p>
          <div className="speed-resistance-control">
            <div className="speed-control-label-row">
              <label htmlFor="field-current">励磁电流 I_f / I_fₙ</label>
              <strong>{field}%</strong>
            </div>
            <input
              id="field-current"
              type="range"
              min="50"
              max="100"
              step="1"
              value={field}
              aria-valuetext={`${field}% 额定励磁电流`}
              onKeyDown={(event) => event.stopPropagation()}
              onChange={(event) => setField(Number(event.target.value))}
            />
            <div className="speed-slider-scale">
              <span>50% · 弱磁</span>
              <span>100% · 额定励磁</span>
            </div>
          </div>
          <div className="speed-step-explanation">
            <p>
              <b>a</b>
              <span>额定励磁时，与所选负载曲线相交的工作点。</span>
            </p>
            <p>
              <b>↗</b>
              <span>减小 I_f，截距升高、斜率增大，曲线不再平行。</span>
            </p>
            <p>
              <b>c</b>
              <span>当前励磁特性与负载曲线的新稳态交点。</span>
            </p>
          </div>
          <button
            className="speed-demo-button"
            disabled={field === 100}
            onClick={() => {
              replay.current = true;
              setRun((value) => value + 1);
            }}
          >
            ↗ 重播：从额定励磁缓慢减至所选值
          </button>
          <p className="speed-model-note">
            采用 Φ / Φₙ ≈ I_f / I_fₙ
            的线性磁化近似；动画逐点求稳态交点，不表示励磁突变的瞬态。滑块范围为教学示例。
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
          <FieldPlot flux={flux} load={load} />
          <div className="speed-control-legend">
            <span>
              <i className="natural" />
              额定励磁特性
            </span>
            <span>
              <i />
              当前励磁特性
            </span>
            <span>
              <i className="load" />
              负载特性 Tₗ
            </span>
          </div>
          <div
            className={`speed-control-readout${overloaded ? ' warning' : ''}`}
          >
            <span>
              n / n₀ₙ <b>{result.stable.speed.toFixed(3)}</b>
            </span>
            <span>
              T / Tₙ <b>{result.stable.torque.toFixed(2)}</b>
            </span>
            <span>
              Iₐ / Iₐₙ <b>{result.current.toFixed(2)}</b>
            </span>
          </div>
          <div
            className={`field-current-status${overloaded ? ' warning' : ''}`}
            aria-live="polite"
          >
            {overloaded
              ? '超过额定电枢电流：此交点不能作为长期允许运行点。'
              : '电枢电流在额定值内；最高转速仍须满足机械强度与换向限制。'}
          </div>
          <p className="speed-control-caption">
            {selected.result}
            {load === 'constant-power' &&
              '图中显示高速稳定分支；本例低速不稳定交点在横轴显示范围外。'}
          </p>
        </section>
      </div>
      <div className="speed-bottom-note">
        <b>允许负载</b>Iₐ ≤ Iₐₙ → T_allow = CₜΦIₐₙ
        随弱磁减小，允许功率基本不变。
        <span>沿用：Rₐ = 0.5 Ω · n₀ₙ = 1000 r/min · Iₐₙ = 44 A</span>
      </div>
    </div>
  );
}

export function FieldSpeedControlSummary() {
  return (
    <div className="speed-summary-body voltage-summary-body field-summary-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>改变励磁电流 / 六项性能指标</b>
      </div>
      <div className="speed-summary-heading">
        <div>
          <h1>弱磁调速：基速以上，允许功率基本不变</h1>
          <p>电枢接额定电压；减小励磁电流，使磁通减小、转速升高。</p>
        </div>
        <span>方向 · 品质 · 允许负载</span>
      </div>
      <div className="voltage-summary-grid field-summary-grid">
        <section className="speed-summary-card">
          <div className="speed-card-index">01 / 调速方向</div>
          <h2>基速以上，向上调节</h2>
          <div className="speed-card-equation">I_f ≤ I_fₙ，Φ ↓ → n ↑</div>
          <p>
            在额定励磁以下调节，通常从基速向上升速；基速为额定电压、额定磁通下的运行转速。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">02 / 调速平滑性</div>
          <h2>连续调励磁，可无级调速</h2>
          <div className="speed-card-equation">
            调节 U_f 或 R_f → I_f 连续可调
          </div>
          <p>
            连续调节励磁电压或励磁回路电阻，即可连续改变磁通与转速，调速平滑。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">03 / 转速稳定性</div>
          <h2>额定电流下，静差率不变</h2>
          <div className="speed-card-equation">
            δ = <Fraction top="Δn" bottom="n₀" /> ={' '}
            <Fraction top="RₐIₐₙ" bottom="Uₙ" />
          </div>
          <p>
            按允许转矩 CₜΦIₐₙ 比较：Δn、n₀ 均 ∝ 1/Φ，δ
            不变，稳定性好。同一转矩下则 δ 增大。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">04 / 调速范围</div>
          <h2>最高转速受机械强度限制</h2>
          <div className="speed-card-equation">
            D = nₘₐₓ / nₘᵢₙ ≈ 2；特殊设计 ≈ 4
          </div>
          <p>
            普通电机与特殊设计电机的典型范围；实际还受换向与最小允许磁通等条件限制。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">05 / 调速经济性</div>
          <h2>励磁功率小，调节较经济</h2>
          <div className="speed-card-equation">
            调 R_f 较经济；调 U_f 需专用电源
          </div>
          <p>
            调节励磁回路电阻比较经济；调节励磁电压需专用直流电源。电枢回路无附加调速电阻损耗。
          </p>
        </section>
        <section className="speed-summary-card">
          <div className="speed-card-index">06 / 调速时的允许负载</div>
          <h2>恒功率调速</h2>
          <div className="speed-card-equation">
            Φ ↓ → T_allow ↓，n ↑，P_allow ≈ 常数
          </div>
          <p>
            Iₐ = Iₐₙ 时，允许转矩 ∝ Φ、转速 ∝
            1/Φ，因此允许功率基本不变；实际负载仍须单独校核。
          </p>
        </section>
      </div>
      <div className="speed-summary-footer">
        <b>三种负载</b>
        <span>恒转矩：Iₐ ↑；风机泵类：Iₐ ↑↑；恒功率：Iₐ 基本不变。</span>
        <strong>允许负载能力 ≠ 实际负载需求</strong>
      </div>
      <p className="speed-summary-notation">
        δ 比较条件：额定电枢电流与相应允许转矩；γ ∝ 1/Φ²、α = 1/γ
        随弱磁减小。静差率描述转速稳定性，不等同于工作点的动态稳定判据。
      </p>
    </div>
  );
}
