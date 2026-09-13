/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG diagrams need an image role and an accessible name. */
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Battery,
  Car,
  CircleGauge,
  Cog,
  Compass,
  Factory,
  Fan,
  FlaskConical,
  Magnet,
  Microchip,
  Plane,
  RadioTower,
  RotateCw,
  Ship,
  Snowflake,
  WashingMachine,
  Zap,
  Bot,
} from 'lucide-react';
import {
  motorHistoryPages,
  motorHistorySources,
  motorHistoryStages,
  type MotorHistoryPage,
} from '@/content/motor-history';
import './motor-history-lesson.css';

const stageIcons = [FlaskConical, Cog, RadioTower, Factory, Microchip, Magnet];

function Node({
  icon,
  label,
  detail,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
}) {
  return (
    <div className="mh-node">
      {icon}
      <strong>{label}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}

function Chain({ children }: { children: ReactNode[] }) {
  return (
    <div className="mh-chain">
      {children.map((child, i) => (
        <div className="mh-chain-part" key={i}>
          {i > 0 && <ArrowRight className="mh-arrow" aria-hidden="true" />}
          {child}
        </div>
      ))}
    </div>
  );
}

function Experiments() {
  return (
    <div className="mh-experiments">
      <div>
        <h3>电流 → 磁场</h3>
        <svg
          viewBox="0 0 240 160"
          role="img"
          aria-label="通电导线旁的指南针发生偏转，环绕线表示磁场"
        >
          <path d="M25 50H205" stroke="#c08041" strokeWidth="9" />
          <path
            d="M80 38h40l-12-9m12 9-12 9"
            fill="none"
            stroke="#244b44"
            strokeWidth="4"
          />
          <ellipse
            cx="127"
            cy="51"
            rx="26"
            ry="38"
            fill="none"
            stroke="#6e9d98"
            strokeWidth="3"
            strokeDasharray="6 5"
          />
          <circle
            cx="126"
            cy="115"
            r="32"
            fill="#fff"
            stroke="#244b44"
            strokeWidth="4"
          />
          <path d="m111 95 30 40-15-9z" fill="#c08041" />
          <path d="m141 135-30-40 15 9z" fill="#6e9d98" />
          <text x="22" y="28">
            电流 I →
          </text>
          <text x="165" y="139">
            指南针
          </text>
        </svg>
        <p>奥斯特 · 1820</p>
      </div>
      <div>
        <h3>电 + 磁 → 运动</h3>
        <svg
          viewBox="0 0 240 160"
          role="img"
          aria-label="通电导线绕磁铁旋转的原理简图，不是历史装置复原"
        >
          <rect x="103" y="55" width="34" height="92" rx="4" fill="#244b44" />
          <text x="113" y="81" fill="white">
            N
          </text>
          <path
            d="M120 14h60v104"
            fill="none"
            stroke="#c08041"
            strokeWidth="7"
          />
          <path
            d="M169 48v27l-7-10m7 10 7-10"
            stroke="#244b44"
            fill="none"
            strokeWidth="3"
          />
          <path
            d="M57 111c-28-49 124-66 151-19l-2-19m2 19-19-3"
            fill="none"
            stroke="#6e9d98"
            strokeWidth="4"
          />
          <text x="20" y="146">
            磁铁
          </text>
          <text x="175" y="142">
            导线
          </text>
          <text x="13" y="32">
            旋转 ↻
          </text>
        </svg>
        <p>法拉第 · 1821</p>
      </div>
      <div>
        <h3>磁通变化 → 感应</h3>
        <svg
          viewBox="0 0 240 160"
          role="img"
          aria-label="磁铁向线圈移动，磁通变化产生感应电动势，闭合回路接检流计"
        >
          <rect x="12" y="54" width="66" height="35" rx="3" fill="#244b44" />
          <text x="22" y="78" fill="white">
            S　N
          </text>
          <path
            d="M25 37h56l-10-7m10 7-10 7"
            fill="none"
            stroke="#c08041"
            strokeWidth="3"
          />
          {[100, 114, 128, 142].map((x) => (
            <ellipse
              key={x}
              cx={x}
              cy="72"
              rx="12"
              ry="33"
              fill="none"
              stroke="#c08041"
              strokeWidth="4"
            />
          ))}
          <path
            d="M100 105v35h94V105h-52"
            fill="none"
            stroke="#244b44"
            strokeWidth="3"
          />
          <circle
            cx="194"
            cy="84"
            r="22"
            fill="white"
            stroke="#244b44"
            strokeWidth="3"
          />
          <path d="m194 95 9-22" stroke="#c08041" strokeWidth="3" />
          <text x="7" y="20">
            移动 →
          </text>
          <text x="160" y="44">
            检流计
          </text>
        </svg>
        <p>法拉第 · 1831</p>
      </div>
      <div className="mh-energy">
        <span>电动：电能 → 机械能</span>
        <span>发电：机械能 → 电能</span>
      </div>
    </div>
  );
}

function FieldSequence() {
  return (
    <>
      <div className="mh-field-sequence">
        {[0, 70, 140].map((angle, i) => (
          <div key={angle}>
            <svg
              viewBox="0 0 220 190"
              role="img"
              aria-label={`状态 ${i + 1}：旋转磁场转过 ${angle} 度，笼型转子稍慢跟随`}
            >
              <circle
                cx="110"
                cy="95"
                r="74"
                fill="#e6efeb"
                stroke="#244b44"
                strokeWidth="3"
              />
              <g transform={`rotate(${angle} 110 95)`}>
                <path
                  d="M45 95H175l-19-12m19 12-19 12"
                  fill="none"
                  stroke="#c08041"
                  strokeWidth="7"
                />
              </g>
              <g transform={`rotate(${angle * 0.8} 110 95)`}>
                <ellipse
                  cx="110"
                  cy="95"
                  rx="33"
                  ry="44"
                  fill="#fff"
                  stroke="#647986"
                  strokeWidth="3"
                />
                {[-16, 0, 16].map((x) => (
                  <path
                    key={x}
                    d={`M${110 + x} 60v70`}
                    stroke="#647986"
                    strokeWidth="4"
                  />
                ))}
              </g>
              <path
                d="M158 25c24 13 38 40 34 64l10-12m-10 12-7-14"
                stroke="#244b44"
                strokeWidth="3"
                fill="none"
              />
              <text x="89" y="184">
                状态 {i + 1}
              </text>
            </svg>
          </div>
        ))}
      </div>
      <div className="mh-legend">
        橙色箭头：旋转磁场　灰色导条：笼型转子（不是磁铁）
      </div>
      <Chain>
        {[
          <Node key="g" icon={<Zap />} label="发电机" />,
          <Node key="t" icon={<RadioTower />} label="变压器与输电" />,
          <Node key="m" icon={<Cog />} label="三相电动机" />,
        ]}
      </Chain>
    </>
  );
}

function MachineSet() {
  return (
    <div className="mh-machine-set">
      <div className="mh-connection-labels">
        <span>机械轴相连</span>
        <span>电气连接 · 可调直流电压</span>
        <span>机械传动</span>
      </div>
      <div className="mh-machines">
        <Node icon={<RotateCw />} label="交流电动机" />
        <i className="mh-shaft" />
        <Node icon={<Zap />} label="直流发电机" />
        <i className="mh-wire" />
        <Node icon={<Cog />} label="直流电动机" />
        <i className="mh-shaft" />
        <Node icon={<Factory />} label="负载" />
      </div>
      <p className="mh-control">
        ↑ 调节发电机励磁 → 改变输出电压 → 调节电动机速度
      </p>
    </div>
  );
}

function Diagram({ page }: { page: MotorHistoryPage }) {
  if (page === 'principles') return <Experiments />;
  if (page === 'practical')
    return (
      <div className="mh-practical">
        <h3>1838 · 早期电动船试验</h3>
        <Chain>
          {[
            <Node key="b" icon={<Battery />} label="电池供能" />,
            <Node key="m" icon={<Cog />} label="电机出力" />,
            <Node
              key="s"
              icon={<Ship />}
              label="传动 → 桨轮"
              detail="推动船（负载）"
            />,
          ]}
        </Chain>
        <h3>逐步实用化的直流机器</h3>
        <Chain>
          {[
            <Node key="g" icon={<Zap />} label="发电与供电改进" />,
            <Node key="c" icon={<Cog />} label="电枢与绕组改进" />,
            <Node key="f" icon={<Factory />} label="带动工作负载" />,
          ]}
        </Chain>
        <div className="mh-chips">
          {['功率：带得动', '电源：供得起', '结构：用得久', '成本：有价值'].map(
            (x) => (
              <span key={x}>{x}</span>
            ),
          )}
        </div>
      </div>
    );
  if (page === 'ac-system') return <FieldSequence />;
  if (page === 'adoption')
    return (
      <>
        <div className="mh-use-cards">
          <Node icon={<Factory />} label="生产机械" detail="电机 → 工作机构" />
          <Node
            icon={<WashingMachine />}
            label="洗衣机"
            detail="电机 → 洗涤机构"
          />
          <Node icon={<Fan />} label="吸尘器" detail="电机 → 风机" />
        </div>
        <h3>在电子变频器之前：Ward–Leonard 机组调速</h3>
        <MachineSet />
      </>
    );
  if (page === 'electronic-control')
    return (
      <>
        <div className="mh-comparison">
          <div>
            <RotateCw />
            <strong>过去：旋转机组</strong>
            <span>电动机带发电机 → 调整供电</span>
          </div>
          <ArrowRight />
          <div>
            <Microchip />
            <strong>后来：电子驱动</strong>
            <span>功率器件开关 → 调整供电</span>
          </div>
        </div>
        <h3>带反馈的受控运动示例</h3>
        <Chain>
          {[
            <Node key="i" icon={<CircleGauge />} label="指令" />,
            <Node key="d" icon={<Microchip />} label="驱动器" />,
            <Node key="m" icon={<Cog />} label="电机" />,
            <Node key="l" icon={<Bot />} label="负载" />,
          ]}
        </Chain>
        <div className="mh-feedback">
          ← 传感器反馈：实际位置 / 速度，从电机或负载返回驱动器
        </div>
      </>
    );
  return (
    <div className="mh-system">
      <div className="mh-system-center">
        <Cog />
        <strong>现代电驱系统</strong>
        <span>高效 · 紧凑 · 可靠 · 精准</span>
      </div>
      <div className="mh-system-team">
        {[
          [Magnet, '材料', '永磁与软磁材料'],
          [Cog, '电机', '结构与电磁设计'],
          [Zap, '功率电子', '匹配需要的电'],
          [Microchip, '控制', '按任务调节运动'],
          [Snowflake, '冷却', '管理发热'],
        ].map(([Icon, title, detail]) => {
          const TeamIcon = Icon as typeof Cog;
          return (
            <div key={String(title)}>
              <TeamIcon />
              <strong>{String(title)}</strong>
              <span>{String(detail)}</span>
            </div>
          );
        })}
      </div>
      <p className="mh-control">
        更强的磁铁 ≠ 自动更好的系统；还要匹配供电、控制、热与机械限制。
      </p>
    </div>
  );
}

export function MotorHistoryLesson({ page }: { page: MotorHistoryPage }) {
  const pageIndex = motorHistoryPages.findIndex((item) => item.page === page);
  const stage = motorHistoryStages[Math.max(0, pageIndex - 1)];
  const sourceKeys =
    pageIndex === 0
      ? (['ri', 'industrial', 'vde', 'doe'] as const)
      : stage.sources;
  return (
    <section
      className="motor-history-lesson"
      aria-label="电机发展历史 ELI5 图解"
    >
      <div className="mh-eyebrow">
        电机发展历史 /{' '}
        {pageIndex === 0
          ? '总览'
          : `${String(pageIndex).padStart(2, '0')} · ${stage.name}`}
        <span>ELI5 · {pageIndex + 1} / 7</span>
      </div>
      <h1>{motorHistoryPages[pageIndex].title}</h1>
      <p className="mh-lead">
        {pageIndex === 0
          ? '从能够转动，到实用、普及、可控，再到高性能电驱系统。'
          : stage.lead}
      </p>
      {pageIndex === 0 ? (
        <div className="mh-overview">
          {motorHistoryStages.map((item, i) => {
            const Icon = stageIcons[i];
            return (
              <article key={item.name}>
                <div className="mh-overview-top">
                  <Icon />
                  <span>
                    0{i + 1} / {item.period}
                  </span>
                </div>
                <h2>{item.name}</h2>
                <strong>{item.verb}</strong>
                <p>突破 · {item.breakthrough}</p>
                <p>应用 · {item.application}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mh-stage-grid">
          <div className="mh-diagram">
            <Diagram page={page} />
          </div>
          <aside className="mh-events">
            <span>代表性突破 / MILESTONES</span>
            {stage.events.map(([year, text]) => (
              <div key={year}>
                <strong>{year}</strong>
                <p>{text}</p>
              </div>
            ))}
          </aside>
        </div>
      )}
      <div className="mh-takeaway">
        <div>
          <span>{pageIndex === 0 ? '历史主线' : '能力 → 应用'}</span>
          <strong>
            {pageIndex === 0
              ? '发现规律 → 实用动力 → 广泛应用 → 受控运动 → 系统协同'
              : stage.application}
          </strong>
        </div>
        {page === 'modern-drive' && (
          <div className="mh-application-icons">
            <Car />
            <Bot />
            <Plane />
            <Ship />
          </div>
        )}
        <p>
          {pageIndex === 0
            ? '能转 ≠ 能广泛应用；功率、电源、结构、成本与控制都需要发展。'
            : stage.conclusion}
        </p>
      </div>
      <div className="mh-question">
        <Compass aria-hidden="true" />
        <span>
          想一想 ·{' '}
          {pageIndex === 0
            ? '最早的电机已经能转，为什么没有马上广泛应用？'
            : stage.question}
        </span>
        {page === 'modern-drive' && <b>下一章：先认识电与磁，再计算磁路 →</b>}
      </div>
      <p className="mh-note">
        {pageIndex === 0
          ? '教学分期：各阶段相互交叠，新技术不代表完全替代旧技术。图解为原创教学简化示意。'
          : stage.note}
      </p>
      <div className="mh-sources">
        <span>资料依据 · </span>
        {sourceKeys.map((key) => (
          <a
            key={key}
            href={motorHistorySources[key].url}
            target="_blank"
            rel="noreferrer"
          >
            {motorHistorySources[key].title} ↗
          </a>
        ))}
        <span>核查：2026-09-13</span>
      </div>
    </section>
  );
}
