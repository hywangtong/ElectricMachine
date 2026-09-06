'use client';

import { useState, type CSSProperties } from 'react';
import { chapters } from '@/content/course';

const stars = Array.from({ length: 100 }, (_, i) => ({
  x: (i * 137.508 + 31) % 920,
  y: (i * i * 7.31 + 53) % 590,
  radius: i % 9 === 0 ? 1.8 : 0.8,
}));

const positions: Record<
  string,
  { x: number; y: number; color: string; symbol: string }
> = {
  introduction: { x: 125, y: 125, color: '#9adfd7', symbol: '起点' },
  'magnetic-circuits': { x: 370, y: 100, color: '#9adfd7', symbol: 'Φ' },
  'dc-machines': { x: 625, y: 160, color: '#f0bf83', symbol: 'E' },
  'dc-drives': { x: 775, y: 320, color: '#f0bf83', symbol: 'T' },
  transformers: { x: 135, y: 360, color: '#b9b4ff', symbol: 'U' },
  'induction-machines': { x: 375, y: 460, color: '#b9b4ff', symbol: 's' },
  'induction-drives': { x: 665, y: 485, color: '#b9b4ff', symbol: 'n' },
};

// Directed links describe the recommended conceptual learning paths.
const connections = [
  {
    from: 'introduction',
    to: 'magnetic-circuits',
    path: 'M 157 122 Q 250 75 335 97',
  },
  {
    from: 'magnetic-circuits',
    to: 'dc-machines',
    path: 'M 402 104 Q 510 100 590 146',
  },
  { from: 'dc-machines', to: 'dc-drives', path: 'M 650 181 Q 740 215 768 284' },
  {
    from: 'magnetic-circuits',
    to: 'transformers',
    path: 'M 343 120 Q 175 175 141 325',
  },
  {
    from: 'magnetic-circuits',
    to: 'induction-machines',
    path: 'M 350 128 C 285 235 290 355 352 431',
  },
  {
    from: 'transformers',
    to: 'induction-machines',
    path: 'M 164 375 Q 245 443 340 454',
  },
  {
    from: 'induction-machines',
    to: 'induction-drives',
    path: 'M 409 463 Q 520 500 630 487',
  },
];

export function ChapterGalaxy({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const active = hovered ?? focused;
  const selected = chapters.find((chapter) => chapter.id === active);

  return (
    <section className="chapter-galaxy" aria-labelledby="galaxy-title">
      <div className="galaxy-heading">
        <h2 id="galaxy-title">课程知识星系</h2>
        <span>KNOWLEDGE GALAXY / 07</span>
      </div>
      <nav
        className="galaxy-map"
        aria-label="星系章节索引"
        aria-describedby="galaxy-help"
      >
        <svg className="galaxy-space" viewBox="0 0 920 590" aria-hidden="true">
          <defs>
            <radialGradient id="galaxy-nebula">
              <stop offset="0" stopColor="#6dbfc2" stopOpacity=".24" />
              <stop offset=".55" stopColor="#7178b8" stopOpacity=".09" />
              <stop offset="1" stopColor="#7178b8" stopOpacity="0" />
            </radialGradient>
            <marker
              id="galaxy-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M 1 1 L 8 5 L 1 9"
                fill="none"
                stroke="context-stroke"
                strokeWidth="1.5"
              />
            </marker>
          </defs>
          <ellipse
            cx="440"
            cy="300"
            rx="450"
            ry="275"
            fill="url(#galaxy-nebula)"
          />
          {stars.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.radius}
              fill="#d4e8f4"
              opacity={i % 3 === 0 ? '.55' : '.22'}
            />
          ))}
          <g className="galaxy-orbits" transform="rotate(-18 440 295)">
            <ellipse cx="440" cy="295" rx="355" ry="205" />
            <ellipse cx="440" cy="295" rx="270" ry="150" />
            <ellipse cx="440" cy="295" rx="175" ry="95" />
            <path d="M 46 295 C 120 55 715 15 819 240 C 908 475 317 590 175 360 C 69 180 570 105 652 270 C 721 410 384 445 348 317" />
          </g>
          {connections.map((connection) => (
            <path
              key={connection.from + connection.to}
              d={connection.path}
              className={
                'galaxy-connection ' +
                (active &&
                (connection.from === active || connection.to === active)
                  ? 'is-active'
                  : '')
              }
              markerEnd="url(#galaxy-arrow)"
            />
          ))}
        </svg>
        <div className="galaxy-core" aria-hidden="true">
          <span className="galaxy-core-symbol">Φ</span>
          <strong>电磁能量转换</strong>
          <small>电磁 · 能量 · 运动</small>
        </div>
        {chapters.map((chapter, index) => {
          const position = positions[chapter.id];
          if (!position) return null;
          return (
            <button
              key={chapter.id}
              className={
                'galaxy-chapter ' + (active === chapter.id ? 'is-active' : '')
              }
              style={
                {
                  left: position.x,
                  top: position.y,
                  '--star-color': position.color,
                } as CSSProperties
              }
              onClick={() => onNavigate(chapter.id)}
              onMouseEnter={() => setHovered(chapter.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setFocused(chapter.id)}
              onBlur={() => setFocused(null)}
              aria-label={
                '第 ' + (index + 1) + ' 章：' + chapter.title + '，进入章节'
              }
            >
              <span className="galaxy-planet" aria-hidden="true">
                {position.symbol}
              </span>
              <span className="galaxy-chapter-title">
                <small>{String(index + 1).padStart(2, '0')}</small>
                {chapter.title}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="galaxy-legend" aria-label="星系颜色图例">
        <span>
          <i />
          课程基础
        </span>
        <span>
          <i />
          直流电机
        </span>
        <span>
          <i />
          交流电机
        </span>
        <span className="galaxy-relation-key">↗ 知识进阶关系</span>
      </div>
      <p className="galaxy-help" id="galaxy-help">
        {selected
          ? selected.question
          : '点击星球进入章节 · 沿连线探索知识之间的联系'}
      </p>
    </section>
  );
}
