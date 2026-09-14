'use client';

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG apparatus diagrams need accessible image names. */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { getExperimentState } from './motor-history-experiment-model';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Bench() {
  return (
    <g aria-hidden="true">
      <path
        d="m12 221 18-12h209l13 12v12H12z"
        fill="#ddc7a5"
        stroke="#b69671"
        strokeWidth="1.5"
      />
      <path d="M12 221h240" stroke="#b69671" strokeWidth="1.5" />
      <path d="M26 233v6m212-6v6" stroke="#9e7957" strokeWidth="5" />
    </g>
  );
}

function Battery({ reverse = false }: { reverse?: boolean }) {
  return (
    <g>
      <rect
        x="23"
        y="172"
        width="43"
        height="39"
        rx="4"
        fill="#efe3cb"
        stroke="#9e7957"
        strokeWidth="2"
      />
      <path d="M34 172v-8m22 8v-8" stroke="#566862" strokeWidth="4" />
      <text x="28" y="188">
        {reverse ? '−' : '+'}
      </text>
      <text x="50" y="188">
        {reverse ? '+' : '−'}
      </text>
      <text x="28" y="205" className="mh-apparatus-small">
        电池
      </text>
    </g>
  );
}

function OerstedExperiment({ seconds }: { seconds: number }) {
  const state = getExperimentState(seconds);
  return (
    <div className="mh-experiment-card">
      <h3>电流 → 磁场</h3>
      <svg
        viewBox="0 0 264 246"
        role="img"
        aria-label="奥斯特实验：电池和开关连接南北向铜导线，导线位于指南针上方；通电偏转，断电复位，反接电源时反向偏转"
      >
        <Bench />
        <path
          d="M34 164V64h17m32 0h62v-9m0 118v29H77v-55H56v17"
          className="mh-lead-wire"
        />
        <Battery reverse={seconds % 12 >= 8 && seconds % 12 < 10} />
        <path d="M51 64h32" stroke="#a6b5ae" strokeWidth="2" />
        <path
          d={state.current ? 'M51 64h32' : 'M51 64l28-17'}
          stroke="#c08041"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="51" cy="64" r="3" fill="#244b44" />
        <circle cx="83" cy="64" r="3" fill="#244b44" />
        <text x="25" y="36">
          开关
        </text>
        <ellipse cx="145" cy="164" rx="44" ry="10" fill="#d8ded3" />
        <circle
          cx="145"
          cy="131"
          r="39"
          fill="#c6ac7d"
          stroke="#9e7957"
          strokeWidth="2"
        />
        <circle
          cx="145"
          cy="131"
          r="34"
          fill="#fffdf5"
          stroke="#244b44"
          strokeWidth="1.5"
        />
        <path
          d="M145 101v7m0 46v7m-30-30h7m46 0h7"
          stroke="#a6b5ae"
          strokeWidth="1.5"
        />
        <text x="139" y="90">
          N
        </text>
        <text x="139" y="189">
          S
        </text>
        <g transform={`rotate(${state.compassAngle} 145 131)`}>
          <path d="m145 106-7 25h14z" fill="#b75d48" />
          <path d="m145 156-7-25h14z" fill="#6e9d98" />
        </g>
        <circle cx="145" cy="131" r="3" fill="#c6ac7d" />
        <path
          d="M145 58v115"
          stroke="#805333"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M144 58v115" stroke="#d9a16c" strokeWidth="2" />
        <g opacity={state.current ? 0.75 : 0}>
          <ellipse
            cx="145"
            cy="77"
            rx="29"
            ry="9"
            fill="none"
            stroke="#6e9d98"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <path
            d={
              state.current === 1
                ? 'm155 66 0-20-5 7m5-7 5 7'
                : 'm155 46 0 20-5-7m5 7 5-7'
            }
            className="mh-current-arrow"
          />
          <text x="166" y="54">
            I
          </text>
        </g>
        <path d="m188 119-13 6m-3-78-17 12" className="mh-label-line" />
        <text x="188" y="119">
          磁针
        </text>
        <text x="176" y="39">
          铜导线
        </text>
        <text x="94" y="211" className="mh-apparatus-small">
          导线在指南针上方
        </text>
      </svg>
      <div className="mh-experiment-status">{state.compassStatus}</div>
      <p>奥斯特 · 1820</p>
    </div>
  );
}

function RotationExperiment({ seconds }: { seconds: number }) {
  const { orbitX, orbitY } = getExperimentState(seconds);
  const wire = (
    <g>
      <path
        d={`M136 49  ${orbitX} ${orbitY}`}
        stroke="#805333"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d={`M135 49  ${orbitX - 1} ${orbitY}`}
        stroke="#dda570"
        strokeWidth="1.5"
      />
      <circle cx={orbitX} cy={orbitY} r="3" fill="#c08041" />
    </g>
  );
  return (
    <div className="mh-experiment-card">
      <h3>电 + 磁 → 运动</h3>
      <svg
        viewBox="0 0 264 246"
        role="img"
        aria-label="法拉第电磁旋转实验：电池连接悬挂接点和导电液槽，导线下端保持液体接触并绕固定磁铁连续旋转；历史液槽含汞，仅作动画展示"
      >
        <Bench />
        <path
          d="M34 164V29h56m46 20V29H90m-34 135v-10h17"
          className="mh-lead-wire"
        />
        <Battery />
        <path
          d="M85 208V26h51v17"
          stroke="#62746b"
          strokeWidth="7"
          fill="none"
          strokeLinejoin="round"
        />
        <path d="M85 208V26h51" stroke="#b2bbb1" strokeWidth="2" fill="none" />
        <ellipse cx="136" cy="208" rx="69" ry="10" fill="#d8ded3" />
        <path
          d="M70 137v57c0 24 132 24 132 0v-57"
          fill="#e5efeb"
          fillOpacity="0.6"
          stroke="#86a49c"
          strokeWidth="2"
        />
        <ellipse
          cx="136"
          cy="137"
          rx="66"
          ry="18"
          fill="#f8fcfa"
          stroke="#86a49c"
          strokeWidth="2"
        />
        <path
          d="M71 148v45c0 23 130 23 130 0v-45"
          fill="#abbab8"
          fillOpacity="0.5"
        />
        <ellipse
          cx="136"
          cy="148"
          rx="65"
          ry="18"
          fill="#c4cfcd"
          stroke="#91a4a0"
          strokeWidth="1.5"
        />
        <ellipse
          cx="136"
          cy="148"
          rx="43"
          ry="12"
          fill="none"
          stroke="#fffdf5"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {orbitY < 148 && wire}
        <rect
          x="126"
          y="115"
          width="20"
          height="80"
          rx="2"
          fill="#6e9d98"
          stroke="#244b44"
          strokeWidth="1.5"
        />
        <path d="M127 116h18v28h-18z" fill="#b75d48" />
        <text x="130" y="133" fill="#fff">
          N
        </text>
        <text x="131" y="182" fill="#fff">
          S
        </text>
        {orbitY >= 148 && wire}
        <circle
          cx="136"
          cy="49"
          r="5"
          fill="#c6ac7d"
          stroke="#805333"
          strokeWidth="2"
        />
        <path
          d="M70 168v26c0 24 132 24 132 0v-26"
          fill="none"
          stroke="#86a49c"
          strokeWidth="2"
        />
        <path
          d="m164 148c-4 10-43 15-59 4l8-1m-8 1 4 7"
          className="mh-current-arrow"
        />
        <path
          d="m190 29-47 17m47 53-23 9m38 82-23 9"
          className="mh-label-line"
        />
        <text x="172" y="25">
          悬挂接点
        </text>
        <text x="177" y="91">
          导线
        </text>
        <text x="202" y="181">
          液槽
        </text>
        <text x="102" y="227" className="mh-apparatus-small">
          磁铁固定 · 下端浸液
        </text>
      </svg>
      <div className="mh-experiment-status">持续通电 · 导线绕磁铁旋转</div>
      <p>法拉第 · 1821</p>
    </div>
  );
}

function InductionExperiment({ seconds }: { seconds: number }) {
  const state = getExperimentState(seconds);
  return (
    <div className="mh-experiment-card">
      <h3>磁通变化 → 感应</h3>
      <svg
        viewBox="0 0 264 246"
        role="img"
        aria-label="法拉第电磁感应实验：条形磁铁的 N 极推入或抽出固定线圈，闭合回路的检流计反向偏转；磁铁停住时指针归零"
      >
        <Bench />
        <path d="M110 132v67h84m-18-67h62v15" className="mh-lead-wire" />
        <path
          d="m109 146-9 51h15l8-51m44 0 9 51h15l-10-51"
          fill="#c6ac7d"
          stroke="#9e7957"
          strokeWidth="1.5"
        />
        <path d="M108 74h66v62h-66z" fill="#e5e9df" />
        <ellipse
          cx="108"
          cy="105"
          rx="11"
          ry="31"
          fill="#d9dfd6"
          stroke="#8b9a8c"
          strokeWidth="2"
        />
        <ellipse cx="108" cy="105" rx="6" ry="21" fill="#75887e" />
        <g transform={`translate(${state.magnetTravel} 0)`}>
          <rect
            x="10"
            y="94"
            width="72"
            height="22"
            rx="2"
            fill="#6e9d98"
            stroke="#244b44"
            strokeWidth="1.5"
          />
          <path d="M46 95h35v20H46z" fill="#b75d48" />
          <text x="20" y="110" fill="#fff">
            S
          </text>
          <text x="62" y="110" fill="#fff">
            N
          </text>
        </g>
        {/* The near halves of the turns occlude a magnet inserted in the bore. */}
        {[110, 121, 132, 143, 154, 165].map((x) => (
          <path
            key={x}
            d={`M${x} 132c-15-10-15-53 0-59 15-6 26 53 11 59`}
            fill="none"
            stroke="#b77a42"
            strokeWidth="3"
          />
        ))}
        <circle
          cx="218"
          cy="177"
          r="29"
          fill="#c6ac7d"
          stroke="#9e7957"
          strokeWidth="2"
        />
        <circle
          cx="218"
          cy="177"
          r="25"
          fill="#fffdf5"
          stroke="#244b44"
          strokeWidth="1.5"
        />
        <path
          d="m199 165 3 3m16-13v5m16 5-3 3"
          stroke="#83958b"
          strokeWidth="1.5"
        />
        <text x="192" y="156" className="mh-apparatus-small">
          −
        </text>
        <text x="214" y="152" className="mh-apparatus-small">
          0
        </text>
        <text x="237" y="156" className="mh-apparatus-small">
          +
        </text>
        <g transform={`rotate(${state.galvanometerAngle} 218 181)`}>
          <path d="M218 187v-27" stroke="#b75d48" strokeWidth="2.5" />
        </g>
        <circle cx="218" cy="181" r="3" fill="#9e7957" />
        <text x="211" y="198">
          G
        </text>
        <g opacity={Math.abs(state.magnetVelocity) > 0.01 ? 1 : 0}>
          <path
            d={
              state.magnetVelocity >= 0
                ? 'M27 65h45l-8-5m8 5-8 5'
                : 'M72 65H27l8-5m-8 5 8 5'
            }
            className="mh-current-arrow"
          />
        </g>
        <path d="m144 46 0 24" className="mh-label-line" />
        <text x="119" y="36">
          固定线圈
        </text>
        <text x="176" y="227" className="mh-apparatus-small">
          检流计
        </text>
        <text x="28" y="227" className="mh-apparatus-small">
          闭合回路
        </text>
      </svg>
      <div className="mh-experiment-status">{state.inductionStatus}</div>
      <p>法拉第 · 1831</p>
    </div>
  );
}

export function MotorHistoryExperiments() {
  const [seconds, setSeconds] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => true,
  );
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !reducedMotion;
  const elapsed = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let frameId = 0;
    let previous: number | null = null;
    const animate = (now: number) => {
      if (previous !== null)
        elapsed.current += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      setSeconds(elapsed.current);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    // Do not skip experimental phases after switching browser tabs.
    const onVisibility = () => {
      previous = null;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [playing]);

  return (
    <div className="mh-experiments">
      <div className="mh-experiment-toolbar">
        <span>历史实验装置 · 动画示意</span>
        <div>
          <button
            type="button"
            onClick={() => setUserPlaying(!playing)}
            aria-label={playing ? '暂停三个实验动画' : '继续三个实验动画'}
          >
            {playing ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            {playing ? '暂停' : '继续'}
          </button>
          <button
            type="button"
            onClick={() => {
              elapsed.current = 0;
              setSeconds(0);
              setUserPlaying(true);
            }}
            aria-label="从头重播三个实验动画"
          >
            <RotateCcw aria-hidden="true" />
            重播
          </button>
        </div>
      </div>
      <OerstedExperiment seconds={seconds} />
      <RotationExperiment seconds={seconds} />
      <InductionExperiment seconds={seconds} />
      <div className="mh-energy">
        <span>电动：电能 → 机械能</span>
        <span>发电：机械能 → 电能</span>
      </div>
    </div>
  );
}
