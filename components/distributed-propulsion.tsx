'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Animated SVG needs an accessible graphic role and cannot be replaced by img. */

import { useId, useRef, useState } from 'react';
import type { Topic } from '@/content/course';

const steps = [
  { id: 'energy', label: '① 电怎么走' },
  { id: 'takeoff', label: '② 起飞降落' },
  { id: 'cruise', label: '③ 空中巡航' },
  { id: 'fault', label: '④ 坏一个呢' },
] as const;

const motors = [
  { x: 88, y: 202, tip: true },
  ...[180, 230, 280, 330, 380, 420, 540, 580, 630, 680, 730, 780].map((x) => ({
    x,
    y: 175 + Math.abs(x - 480) / 20,
    tip: false,
  })),
  { x: 872, y: 202, tip: true },
];

export function DistributedPropulsion({ points }: { points: Topic[] }) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const step = steps[selected].id;
  const point = points[selected];

  return (
    <section className="distributed-propulsion" data-step={step}>
      <div
        className="dep-tabs"
        role="tablist"
        tabIndex={-1}
        aria-label="分布式电推进分项展示"
        onKeyDown={(event) => {
          let next = selected;
          if (event.key === 'ArrowRight') next = (selected + 1) % steps.length;
          else if (event.key === 'ArrowLeft')
            next = (selected + steps.length - 1) % steps.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = steps.length - 1;
          else return;
          event.preventDefault();
          event.stopPropagation();
          setSelected(next);
          tabs.current[next]?.focus();
        }}
      >
        {steps.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            id={`${id}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls={`${id}-panel`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${step}`}
      >
        <svg
          className="dep-stage"
          viewBox="0 0 960 430"
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
        >
          <title id={`${id}-title`}>NASA X-57 分布式电推进俯视示意</title>
          <desc id={`${id}-desc`}>
            {step === 'energy'
              ? '电池通过电线给十二个小电机和两个翼尖巡航电机供电。'
              : step === 'takeoff'
                ? '十四个螺旋桨全部旋转，小桨气流吹过机翼，增加低速升力。'
                : step === 'cruise'
                  ? '十二个小桨停转折叠，仅两个翼尖大桨旋转。'
                  : '一个小桨停止并标有叉号，其余十三个桨继续旋转。'}
          </desc>
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" fill="var(--dep-small)" />
            </marker>
          </defs>
          <g aria-hidden="true">
            {motors.map((motor, index) => (
              <g
                key={`flow-${motor.x}`}
                className={`dep-airflow ${motor.tip ? 'dep-airflow-tip' : ''} ${index === 4 ? 'dep-airflow-failed' : ''}`}
              >
                <path
                  d={`M${motor.x - (motor.tip ? 40 : 22)} ${motor.y + 10} h${motor.tip ? 80 : 44} l15 116 h-${motor.tip ? 110 : 74} z`}
                  fill={motor.tip ? 'var(--dep-tip)' : 'var(--dep-small)'}
                  fillOpacity="0.14"
                />
              </g>
            ))}
            <path
              d="M65 205L420 178L452 28Q480 8 508 28L540 178L895 205V250L535 235L520 385H440L425 235L65 250Z"
              fill="#e7eee9"
              stroke="#466154"
              strokeWidth="4"
            />
            <path
              d="M424 179H536L533 235H427Z"
              fill="#fff"
              fillOpacity="0.55"
            />
            <g
              className="dep-power-line"
              fill="none"
              stroke="var(--dep-power)"
              strokeWidth="4"
            >
              <path d="M480 290V245H88M480 245H872" />
              {motors.map((motor) => (
                <path
                  key={`wire-${motor.x}`}
                  d={`M${motor.x} 245V${motor.y}`}
                />
              ))}
            </g>
            <rect
              x="446"
              y="258"
              width="68"
              height="72"
              rx="12"
              fill="var(--dep-power)"
            />
            <path
              d="M460 294H500M480 274V314"
              stroke="#fff"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {motors.map((motor, index) => {
              const failed = step === 'fault' && index === 4;
              const folded = step === 'cruise' && !motor.tip;
              const running = step !== 'energy' && !failed && !folded;
              return (
                <g
                  key={motor.x}
                  className={`dep-motor ${motor.tip ? 'dep-tip' : 'dep-small'}`}
                  data-running={running}
                  data-folded={folded}
                  data-failed={failed}
                  transform={`translate(${motor.x} ${motor.y})`}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                >
                  <circle
                    r={motor.tip ? 29 : 19}
                    fill="#fff"
                    strokeWidth={motor.tip ? 4 : 3}
                  />
                  <path
                    className="dep-blades"
                    d={
                      folded
                        ? 'M-5-16V16M5-16V16'
                        : motor.tip
                          ? 'M-26 0H26M0-26V26'
                          : 'M-16 0H16M0-16V16'
                    }
                    strokeWidth="6"
                  />
                </g>
              );
            })}
            <g
              className="dep-fault"
              stroke="#b64040"
              strokeWidth="10"
              strokeLinecap="round"
            >
              <path d="M314 167L346 199M346 167L314 199" />
            </g>
            <g
              className="dep-lift"
              fill="none"
              stroke="var(--dep-small)"
              strokeWidth="8"
              markerEnd={`url(#${id}-arrow)`}
            >
              <path d="M920 340V260" />
            </g>
          </g>
        </svg>
        <div className="dep-status" aria-live="polite" aria-atomic="true">
          <strong>{point.title}</strong>
          <p>{point.description}</p>
        </div>
      </div>
      <p className="dep-takeaway">
        NASA X-57：12 小 + 2 大 ·
        不是“多装几个桨”，而是让桨吹出的风也帮机翼干活。
      </p>
    </section>
  );
}
