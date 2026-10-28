'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  activePower,
  disturbanceEnd,
  disturbanceStart,
  motorTorque,
  stabilityDuration,
  stabilityPower,
  stabilityRoots,
  stabilitySlope,
  stabilityTrajectory,
} from '@/lib/constant-power-stability.mjs';
import './constant-power-stability.css';

type Point = 'stable' | 'unstable';
const roots = stabilityRoots();
const plot = { left: 62, top: 28, width: 826, height: 344, maxTorque: 3.7 };
const xy = (speed: number, torque = motorTorque(speed)) => ({
  x: plot.left + (torque / plot.maxTorque) * plot.width,
  y: plot.top + ((1.06 - speed) / 1.06) * plot.height,
});
const coord = (speed: number, torque = motorTorque(speed)) => {
  const p = xy(speed, torque);
  return `${p.x},${p.y}`;
};
const loadCurve = (power: number) =>
  Array.from({ length: 120 }, (_, i) => {
    const speed =
      power / plot.maxTorque + ((1.06 - power / plot.maxTorque) * i) / 119;
    return `${i ? 'L' : 'M'} ${coord(speed, power / speed)}`;
  }).join(' ');

function Fraction({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="speed-fraction">
      <span>{top}</span>
      <span>{bottom}</span>
    </span>
  );
}

function StabilityPlot({
  point,
  direction,
  seconds,
}: {
  point: Point;
  direction: number;
  seconds: number;
}) {
  const trajectory = useMemo(
    () => stabilityTrajectory(point, direction),
    [point, direction],
  );
  const sample =
    trajectory[Math.min(Math.round(seconds / 0.005), trajectory.length - 1)];
  const power = activePower(seconds, direction);
  const disturbed = seconds >= disturbanceStart && seconds < disturbanceEnd;
  const speed = sample.speed;
  const motor = xy(speed);
  const load = xy(speed, power / speed);
  const delta = motorTorque(speed) - power / speed;
  const moving = seconds > disturbanceStart;
  const displacedRoot = stabilityRoots(
    stabilityPower + direction * 0.06,
  ).stable;
  const shiftedLabel =
    point === 'unstable' ? 'b′' : direction > 0 ? 'a′' : 'a″';
  const motionPath = `M ${coord(roots[point])} L ${coord(speed)}`;
  return (
    <svg
      className="stability-chart"
      viewBox="0 0 960 432"
      role="img"
      aria-label={`电枢串电阻与恒功率负载的机械特性；a 为高速稳定点，b 为低速不稳定点。当前转速 ${(speed * 1000).toFixed(0)} 转每分。`}
    >
      <defs>
        <marker
          id="stability-axis"
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
          id="stability-motion"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="#bb7540" />
        </marker>
        <clipPath id="stability-clip">
          <rect x="62" y="28" width="826" height="344" />
        </clipPath>
      </defs>
      <g className="stability-grid">
        <path d="M62 112H888 M62 198H888 M62 284H888 M285 28V372 M508 28V372 M731 28V372" />
      </g>
      <g className="stability-axis">
        <path d="M62 372H916 M62 372V13" markerEnd="url(#stability-axis)" />
      </g>
      <g className="stability-axis-label">
        <text x="24" y="24">
          n / n₀
        </text>
        <text x="884" y="413">
          T / Tₙ
        </text>
        <text x="40" y="393">
          0
        </text>
        <text x="34" y={xy(1).y + 6}>
          1
        </text>
        {[1, 2, 3].map((t) => (
          <text key={t} x={xy(0, t).x - 5} y="396">
            {t}
          </text>
        ))}
      </g>
      <g clipPath="url(#stability-clip)">
        <path
          className="stability-natural"
          d={`M ${coord(1, 0)} L ${coord(0.63, 3.7)}`}
        />
        <path className="stability-motor" d={`M ${coord(1)} L ${coord(0)}`} />
        <path className="stability-load" d={loadCurve(stabilityPower)} />
        {disturbed && (
          <path className="stability-shifted" d={loadCurve(power)} />
        )}
        {moving && <path className="stability-trail" d={motionPath} />}
        {[roots.stable, roots.unstable].map((q, index) => (
          <g
            key={q}
            className={index === 0 ? 'stability-attract' : 'stability-repel'}
          >
            {[-1, 1].map((sign) => {
              const start = q + sign * 0.11;
              const end = q + sign * 0.045;
              return (
                <path
                  key={sign}
                  d={
                    index === 0
                      ? `M ${coord(start)} L ${coord(end)}`
                      : `M ${coord(end)} L ${coord(start)}`
                  }
                  markerEnd="url(#stability-motion)"
                />
              );
            })}
          </g>
        ))}
        {disturbed && (
          <g className="stability-shift-point">
            <circle cx={xy(displacedRoot).x} cy={xy(displacedRoot).y} r="5" />
            <text
              x={xy(displacedRoot).x + 13}
              y={xy(displacedRoot).y + (direction > 0 ? 24 : -13)}
            >
              {shiftedLabel}
            </text>
          </g>
        )}
        {moving && !sample.stalled && (
          <>
            <path
              className="stability-gap"
              d={`M ${motor.x} ${motor.y} H ${load.x}`}
            />
            <circle
              className="stability-load-dot"
              cx={load.x}
              cy={load.y}
              r="6"
            />
          </>
        )}
      </g>
      <g className="stability-fixed-point">
        <circle cx={xy(roots.stable).x} cy={xy(roots.stable).y} r="7" />
        <text x={xy(roots.stable).x - 26} y={xy(roots.stable).y - 20}>
          a · 稳定
        </text>
        <circle
          className="unstable"
          cx={xy(roots.unstable).x}
          cy={xy(roots.unstable).y}
          r="7"
        />
        {point === 'unstable' && moving && (
          <circle
            className="stability-unstable-focus"
            cx={xy(roots.unstable).x}
            cy={xy(roots.unstable).y}
            r="16"
          />
        )}
        <text x={xy(roots.unstable).x - 22} y={xy(roots.unstable).y + 33}>
          b · 不稳定
        </text>
      </g>
      <text className="stability-natural-label" x="665" y="76">
        Rᵣ = 0 · 固有特性
      </text>
      <text className="stability-motor-label" x="400" y="160">
        Rᵣ = 1 Ω · 串电阻后
      </text>
      <text className="stability-load-label" x="310" y="260">
        Tₗn = 常数
      </text>
      <g className="stability-live-point">
        <circle className="stability-halo" cx={motor.x} cy={motor.y} r="17" />
        <circle cx={motor.x} cy={motor.y} r="8" />
        {moving && Math.abs(delta) > 0.004 && !sample.stalled && (
          <g className="stability-speed-arrow">
            <path
              d={`M ${motor.x - 30} ${motor.y} v ${delta > 0 ? -30 : 30}`}
              markerEnd="url(#stability-motion)"
            />
            <text x={motor.x - 70} y={motor.y + (delta > 0 ? -20 : 25)}>
              {delta > 0 ? 'n ↑' : 'n ↓'}
            </text>
          </g>
        )}
      </g>
      {sample.stalled && (
        <text className="stability-stop-label" x="480" y="420">
          低速失稳 → 趋向堵转（模型止于 n/n₀ = 0.025）
        </text>
      )}
    </svg>
  );
}

export function ConstantPowerStabilityLesson() {
  const [point, setPoint] = useState<Point>('stable');
  const [direction, setDirection] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timeRef = useRef(0);
  const trajectory = useMemo(
    () => stabilityTrajectory(point, direction),
    [point, direction],
  );
  const sample =
    trajectory[Math.min(Math.round(seconds / 0.005), trajectory.length - 1)];
  const disturbed = seconds >= disturbanceStart && seconds < disturbanceEnd;
  const power = activePower(seconds, direction);
  const delta = motorTorque(sample.speed) - power / sample.speed;
  const initial = seconds < disturbanceStart;
  const done = seconds >= stabilityDuration;
  const phase = initial
    ? '原平衡'
    : disturbed
      ? '施加扰动'
      : done
        ? '最终状态'
        : '撤去扰动';
  const mechanisms =
    point === 'stable'
      ? direction > 0
        ? [
            'Tₗ ↑ → T < Tₗ → n ↓ → T ↑',
            '趋近 a′；撤扰后 T > Tₗ → n ↑ → 回到 a。',
          ]
        : [
            'Tₗ ↓ → T > Tₗ → n ↑ → T ↓',
            '趋近 a″；撤扰后 T < Tₗ → n ↓ → 回到 a。',
          ]
      : direction > 0
        ? [
            'Tₗ ↑ → T < Tₗ → n ↓ → T ↑',
            '但 Tₗ 增得更快，转矩缺额扩大，继续减速，趋向堵转。',
          ]
        : [
            'Tₗ ↓ → T > Tₗ → n ↑ → T ↓',
            '但 Tₗ 降得更快，继续加速至 b′；撤扰后减速至 a，不回 b。',
          ];
  let feedback = '电机与负载转矩相等；选择扰动并播放。';
  if (!initial) {
    feedback = sample.stalled
      ? '转矩缺额持续扩大，已到低速边界；撤扰也无法自行返回 b。'
      : point === 'unstable' && done
        ? '落到高速稳定点 a；回不到原不稳定点 b。'
        : done
          ? '重新满足 T = Tₗ，回到原稳定点 a。'
          : Math.abs(delta) < 0.004
            ? disturbed
              ? '接近扰动负载下的新平衡；接下来撤去扰动。'
              : '正在接近高速稳定点 a。'
            : `${delta > 0 ? 'T > Tₗ：加速，n ↑、T ↓。' : 'T < Tₗ：减速，n ↓、T ↑。'}${disturbed ? '虚线是扰动后的负载曲线。' : '负载已恢复，沿原负载特性判断运动。'}`;
  }
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last: number | undefined;
    const animate = (now: number) => {
      if (last !== undefined)
        timeRef.current = Math.min(
          stabilityDuration,
          timeRef.current + Math.min((now - last) / 1000, 0.1),
        );
      last = now;
      setSeconds(timeRef.current);
      if (timeRef.current < stabilityDuration)
        frame = requestAnimationFrame(animate);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const seek = (time: number) => {
    setPlaying(false);
    timeRef.current = time;
    setSeconds(time);
  };
  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      seek(initial ? 3 : disturbed ? 6 : stabilityDuration);
      return;
    }
    if (seconds >= stabilityDuration) {
      timeRef.current = 0;
      setSeconds(0);
    }
    setPlaying(true);
  };
  return (
    <div className="stability-body">
      <div className="eyebrow">
        <span />
        8.3 调速 <b>电枢串电阻 / 恒功率负载的工作点稳定性</b>
      </div>
      <div className="speed-control-heading">
        <div>
          <h1>同样满足 T = Tₗ，为什么一个稳、一个不稳？</h1>
          <p>看一次短时负载扰动：工作点是回到原处，还是越走越远？</p>
        </div>
      </div>
      <div className="stability-criterion">
        <div>
          <b>稳定运行的充分条件</b>
          <span>
            <Fraction top="dT" bottom="dn" /> &lt;{' '}
            <Fraction top="dTₗ" bottom="dn" />
          </span>
        </div>
        <p>
          平衡点附近，Δn 与 Δ(T − Tₗ) 异号
          <br />
          <strong>转速偏高就减速，偏低就加速。</strong>
        </p>
        <div className="stability-dynamics">
          J <Fraction top="dΩ" bottom="dt" /> = T − Tₗ
          <small>在平衡点处比较两条曲线的 dT/dn</small>
        </div>
      </div>
      <div className="stability-layout">
        <section className="stability-controls" aria-label="工作点与扰动控制">
          <div className="stability-section-label">01 / 选择原工作点</div>
          <div className="stability-choices">
            {(['stable', 'unstable'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={point === value}
                onClick={() => {
                  setPoint(value);
                  seek(0);
                }}
              >
                <b>{value === 'stable' ? 'a · 稳定点' : 'b · 不稳定点'}</b>
                <small>
                  {value === 'stable'
                    ? '高速交点 · 816 r/min'
                    : '低速交点 · 184 r/min'}
                </small>
              </button>
            ))}
          </div>
          <div className="stability-section-label">
            02 / 短时改变负载，再恢复
          </div>
          <div className="stability-choices">
            {[1, -1].map((value) => (
              <button
                key={value}
                aria-pressed={direction === value}
                onClick={() => {
                  setDirection(value);
                  seek(0);
                }}
              >
                <b>{value > 0 ? '负载增大 ↑' : '负载减小 ↓'}</b>
                <small>Pₗ {value > 0 ? '+12%' : '−12%'}</small>
              </button>
            ))}
          </div>
          <div
            className={`stability-mechanism ${point === 'unstable' ? 'warning' : ''}`}
          >
            <strong>{mechanisms[0]}</strong>
            <p>{mechanisms[1]}</p>
          </div>
          <div className="stability-slope-readout">
            <b>
              {point === 'stable' ? 'a：dT/dn < dTₗ/dn' : 'b：dT/dn > dTₗ/dn'}
            </b>
            <p>
              {point === 'stable'
                ? '电机的转矩调节更强，产生恢复作用。'
                : '负载转矩变化更强，产生偏离作用。'}
            </p>
            <small>图中纵轴是 n；判据中的导数是 dT/dn。</small>
          </div>
          <div className="stability-actions">
            <button onClick={play}>
              {playing
                ? 'Ⅱ 暂停'
                : done
                  ? '↻ 重播动画'
                  : point === 'unstable'
                    ? '▶ 播放 b 点偏离过程'
                    : '▶ 播放 a 点恢复过程'}
            </button>
            <button onClick={() => seek(0)}>复位</button>
          </div>
        </section>
        <section
          className="stability-plot-panel"
          aria-label="机械特性与工作点动画"
        >
          <div className="stability-plot-heading">
            <b>机械特性 n = n₀ − γT</b>
            <span>Uₐ、Φ、Rᵣ 不变 · Pₗ 短时变化</span>
          </div>
          <StabilityPlot
            point={point}
            direction={direction}
            seconds={seconds}
          />
          <div className="stability-legend">
            <span>
              <i />
              电机转矩 T
            </span>
            <span>
              <i className="load" />
              负载转矩 Tₗ
            </span>
            <span>
              <i className="shifted" />
              扰动负载
            </span>
            <span>
              <i className="moving" />
              运动点 / 橙色轨迹
            </span>
          </div>
          <div className="stability-readout">
            <b>{phase}</b>
            <span>
              n = <strong>{(sample.speed * 1000).toFixed(0)}</strong> r/min
            </span>
            <span>
              T − Tₗ = <strong>{delta.toFixed(3)}</strong> Tₙ
            </span>
          </div>
          <p
            className="stability-feedback"
            aria-live={playing ? 'off' : 'polite'}
          >
            {feedback}
          </p>
        </section>
      </div>
      <div className="stability-timeline">
        <label htmlFor="stability-time">过程进度</label>
        <input
          id="stability-time"
          aria-label="动画过程进度"
          type="range"
          min="0"
          max={stabilityDuration}
          step="0.01"
          value={seconds}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => seek(Number(event.target.value))}
        />
        {[
          { time: 0, label: '原平衡' },
          { time: 3, label: '扰动中' },
          { time: 6, label: '撤去扰动' },
          { time: 12, label: '看结果' },
        ].map((step) => (
          <button key={step.time} onClick={() => seek(step.time)}>
            {step.label}
          </button>
        ))}
      </div>
      <p className="stability-note">
        沿用前页参数：Rₐ = 0.5 Ω，Rᵣ = 1 Ω，n₀ = 1000 r/min；Tₗn = 0.5
        Tₙn₀。忽略电枢电感，动画时间为示意。
        <br />
        恒功率规律仅适用于 n &gt;
        0；低速失稳在模型边界停止。判据用于平衡点附近的小扰动，低速点的额定电流与发热另需校核。
      </p>
    </div>
  );
}
