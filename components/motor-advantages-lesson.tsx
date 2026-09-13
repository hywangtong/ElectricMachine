'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ExternalLink, Play, X } from 'lucide-react';

export type MotorAdvantage =
  | 'environment'
  | 'convenience'
  | 'performance'
  | 'adaptability';

type Props = { advantage: MotorAdvantage };

const ExternalLinks = ({
  links,
}: {
  links: { label: string; href: string }[];
}) => (
  <nav className="advantage-links" aria-label="视频与参考资料">
    {links.map((link) => (
      <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
        {link.label}
        <ExternalLink />
      </a>
    ))}
  </nav>
);

const EnvironmentLesson = () => (
  <div className="advantage-body advantage-environment">
    <div className="eyebrow">
      <span />
      电机的优势 <b>01 环保 · ELI5</b>
    </div>
    <h1>把风和海的力量，送到你身边</h1>
    <p className="advantage-lead">先变成电，再送过去，最后变成运动。</p>
    <div className="environment-steps">
      <section>
        <span>01 / 接住自然的力</span>
        <svg
          viewBox="0 0 360 190"
          aria-label="风能、海浪能和潮汐能经捕获装置汇入发电机"
        >
          <path d="M25 45h44m-35 15h32M145 60q16-15 32 0t32 0t32 0M272 40h50m-40 17h37" />
          <path d="M67 38v50m0-50-24-17m24 17 25-17m-25 17V14M176 48v42M296 30v58m-26-29h52m-42-20 32 40m0-40-32 40" />
          <circle cx="67" cy="38" r="7" />
          <rect x="160" y="29" width="32" height="25" rx="7" />
          <circle cx="296" cy="59" r="30" />
          <path
            className="accent"
            d="M67 100v17h111m-2-17v17m120-17v17H178v10"
          />
          <rect
            x="123"
            y="135"
            width="112"
            height="36"
            rx="9"
            className="fill"
          />
          <text x="39" y="130">
            风能
          </text>
          <text x="146" y="130">
            海浪能
          </text>
          <text x="269" y="130">
            潮汐能
          </text>
          <text x="149" y="158">
            发电机
          </text>
        </svg>
        <p>
          风在吹，海浪在起伏，潮水在流。<b>发电机把这些运动变成电。</b>
        </p>
      </section>
      <section>
        <span>02 / 沿着电网送出去</span>
        <svg
          viewBox="0 0 360 190"
          aria-label="发电装置经输电、变电和配电送往家庭与工厂"
        >
          <path d="M43 30v86m-20-66 20-20 20 20M26 48h34m-34 13h34M43 61l-18 42m18-42 18 42M68 51h82v45h72m0 0h47V49h53m-100 47v52h47" />
          <path
            className="accent"
            d="M68 51h82v45h72m0 0h47V49h53m-100 47v52h47"
          />
          <rect x="158" y="63" width="54" height="55" rx="8" className="fill" />
          <path d="M283 49V29l25-18 25 18v20zM294 49V32h17v17M278 148v-30l26-15v15l28-15v45z" />
          <text x="10" y="146">
            发电
          </text>
          <text x="169" y="95">
            变电
          </text>
          <text x="280" y="75">
            家庭
          </text>
          <text x="282" y="180">
            工厂
          </text>
        </svg>
        <p>
          风和海浪留在原地。<b>电能沿电网走，再分给许多地方。</b>
        </p>
      </section>
      <section>
        <span>03 / 在各处变成运动</span>
        <svg
          viewBox="0 0 360 190"
          aria-label="电动机驱动风扇、洗衣机、水泵、电动车和机器人"
        >
          <circle cx="51" cy="43" r="25" />
          <path className="accent" d="M51 43 34 30m17 13 19-10m-19 10v20" />
          <rect x="134" y="13" width="47" height="59" rx="6" />
          <circle cx="157" cy="43" r="17" className="accent" />
          <circle cx="280" cy="43" r="22" className="accent" />
          <path d="M258 43h-19m63 0h31v22" />
          <path d="M24 133h72v18H24zM119 148v-19h18l12-17h27l15 17h10v19zM271 145l20-23 24 11 27-20m-51 9-13-21m37 32-3 22" />
          <circle cx="139" cy="149" r="9" className="accent" />
          <circle cx="181" cy="149" r="9" className="accent" />
          <circle cx="291" cy="122" r="6" className="accent" />
          <circle cx="315" cy="133" r="6" className="accent" />
          <text x="25" y="98">
            风扇
          </text>
          <text x="127" y="98">
            洗衣机
          </text>
          <text x="263" y="98">
            水泵
          </text>
          <text x="19" y="181">
            传送带
          </text>
          <text x="132" y="181">
            电动车
          </text>
          <text x="276" y="181">
            机器人
          </text>
        </svg>
        <p>
          电送到了。<b>电动机让风扇转、衣服洗、水流动、机器跑。</b>
        </p>
      </section>
    </div>
    <div className="environment-applications" aria-label="自然能源发电应用">
      <figure>
        <Image
          unoptimized
          src="/images/motor-advantages/offshore-wind.png"
          alt="海面上的多台风力发电机组"
          width={1448}
          height={1086}
        />
        <figcaption>风能｜海上风电</figcaption>
      </figure>
      <figure>
        <Image
          unoptimized
          src="/images/motor-advantages/tidal-power.png"
          alt="潮汐电站堤坝及通过闸口的水流"
          width={1448}
          height={1086}
        />
        <figcaption>潮汐能｜潮汐电站</figcaption>
      </figure>
      <figure>
        <Image
          unoptimized
          src="/images/motor-advantages/wave-power.png"
          alt="在海浪中浮动的红黄色分节波浪能发电装置"
          width={1448}
          height={1086}
        />
        <figcaption>海浪能｜波浪能发电装置</figcaption>
      </figure>
    </div>
    <p className="advantage-chain">
      自然的运动 → <b>发电机</b> → 电网 → <b>电动机</b> → 身边的运动
    </p>
    <p className="advantage-note">
      发电机：运动变成电；电动机：电变成运动，二者都属于电机。光伏直接产生电；清洁电力可避免用电现场的燃烧尾气，但制造、建设和电网能源结构仍有环境影响。
    </p>
    <ExternalLinks
      links={[
        {
          label: '美国能源部：海洋能基础',
          href: 'https://www.energy.gov/cmei/water/marine-energy-basics',
        },
        {
          label: '风机与远距离输电图解',
          href: 'https://www.energy.gov/cmei/systems/explore-wind-turbine-text-version',
        },
        {
          label: '核能的优势与环境边界',
          href: 'https://www.energy.gov/ne/articles/advantages-and-challenges-nuclear-energy',
        },
      ]}
    />
  </div>
);

const humanoidJoints = [
  { x: 320, y: 75 },
  { x: 280, y: 110 },
  { x: 360, y: 110 },
  { x: 245, y: 165 },
  { x: 395, y: 165 },
  { x: 225, y: 220 },
  { x: 415, y: 220 },
  { x: 320, y: 190 },
  { x: 295, y: 235 },
  { x: 345, y: 235 },
  { x: 285, y: 280 },
  { x: 355, y: 280 },
  { x: 280, y: 330 },
  { x: 360, y: 330 },
];

const ConvenienceLesson = () => {
  const [handsConnected, setHandsConnected] = useState(false);
  const joints = handsConnected
    ? [...humanoidJoints, { x: 205, y: 250 }, { x: 435, y: 250 }]
    : humanoidJoints;
  return (
    <div className="advantage-body advantage-convenience">
      <div className="eyebrow">
        <span />
        电机的优势 <b>02 应用便捷 · ELI5</b>
      </div>
      <h1>一块电池带动全身，电机直接住进关节</h1>
      <p className="advantage-lead">
        像给积木接电：沿两根供电线加分支；像搭积木：把电机做进手臂和腿里。
      </p>
      <div className="robot-advantages-grid">
        <section className="robot-advantage-panel">
          <h2>
            <span>01</span> 两根供电线，分给许多关节
          </h2>
          <p>肩、肘、腕、髋、膝、踝……不用每个关节放一块电池。</p>
          <svg
            className="humanoid-power"
            viewBox="0 0 700 360"
            aria-label={`一块电池的正负两根直流母线并联分支到人形机器人${joints.length}个示意关节的驱动器，再驱动电机；四足机器人也采用同样的分支供电原理`}
          >
            <rect
              className="robot-shell"
              x="294"
              y="9"
              width="52"
              height="45"
              rx="16"
            />
            <path
              className="robot-limb"
              d="M320 54v21M280 110h80M280 110l-35 55-20 55-20 30M360 110l35 55 20 55 20 30M295 235l-10 45-5 50M345 235l10 45 5 50M280 330h-24m104 0h24"
            />
            <path
              className="robot-shell"
              d="M283 111h74l-9 73h-56zM320 184v20m-30 2h60l-5 29h-50z"
            />
            <path d="M306 31h5m18 0h5" />
            <rect
              className="battery-shell"
              x="15"
              y="23"
              width="84"
              height="57"
              rx="10"
            />
            <text x="57" y="48" textAnchor="middle">
              一块电池
            </text>
            <text x="57" y="69" textAnchor="middle">
              ＋　−
            </text>
            <path className="power-positive" d="M39 80v15h86V45m0 50v248" />
            <path
              className="power-negative"
              d="M75 80v24h45m10 0h7V45m0 59v234"
            />
            <text className="positive-label" x="110" y="22">
              ＋
            </text>
            <text className="negative-label" x="138" y="22">
              −
            </text>
            <text x="21" y="140">
              两根线
            </text>
            <text x="21" y="165">
              一直延伸
            </text>
            <text x="21" y="190">
              就近分支
            </text>
            {joints.map(({ x, y }, index) => (
              <g
                key={`${x}-${y}`}
                className={index >= 14 ? 'new-hand-motor' : undefined}
              >
                <path
                  className="power-positive"
                  d={`M125 ${y - 17}h7m10 0H${x - 27}`}
                />
                <path
                  className="power-negative"
                  d={`M137 ${y - 12}H${x - 27}`}
                />
                <circle
                  className="positive-junction"
                  cx="125"
                  cy={y - 17}
                  r="2"
                />
                <circle
                  className="negative-junction"
                  cx="137"
                  cy={y - 12}
                  r="2"
                />
                <rect
                  className="joint-driver"
                  x={x - 27}
                  y={y - 21}
                  width="20"
                  height="14"
                  rx="3"
                />
                <path
                  className="driver-output"
                  d={`M${x - 7} ${y - 14}H${x}v5`}
                />
                <circle className="joint-motor" cx={x} cy={y} r="10" />
              </g>
            ))}
            <text x="446" y="84">
              颈
            </text>
            <text x="446" y="117">
              肩
            </text>
            <text x="446" y="172">
              肘
            </text>
            <text x="446" y="197">
              腰
            </text>
            <text x="446" y="224">
              腕
            </text>
            <text x="446" y="244">
              髋
            </text>
            <text x="446" y="287">
              膝
            </text>
            <text x="446" y="337">
              踝
            </text>
            {handsConnected && (
              <text className="positive-label" x="465" y="257">
                ＋双手
              </text>
            )}
            <g transform="translate(510 40)">
              <rect className="joint-driver" width="20" height="14" rx="3" />
              <text x="28" y="13">
                驱动器
              </text>
              <circle className="joint-motor" cx="10" cy="42" r="10" />
              <text x="28" y="48">
                关节电机
              </text>
              <text x="0" y="84">
                每台各自控制
              </text>
            </g>
            <g transform="translate(510 240)">
              <path
                className="robot-limb"
                d="M12 22h126M22 22 9 52 24 80M58 22 45 52 60 80M101 22 87 52 101 80M134 22 121 52 135 80"
              />
              <rect
                className="battery-shell"
                x="56"
                y="0"
                width="46"
                height="25"
                rx="5"
              />
              <text x="79" y="18" textAnchor="middle">
                电池
              </text>
              <path
                className="power-positive"
                d="M67 25v8H9v19m58-19H121v19M45 33v19m42-19v19"
              />
              <path
                className="power-negative"
                d="M80 25v14H15v13m65-13h47v13M51 39v13m42-13v13"
              />
              {[9, 45, 87, 121].map((x) => (
                <circle key={x} className="joint-motor" cx={x} cy="52" r="7" />
              ))}
              <text x="77" y="107" textAnchor="middle">
                四足也一样（驱动器略）
              </text>
            </g>
          </svg>
          <div className="robot-expand-row">
            <button
              type="button"
              aria-pressed={handsConnected}
              onClick={() => setHandsConnected((connected) => !connected)}
            >
              {handsConnected ? '撤下新增的双手电机' : '＋ 再接上双手电机'}
            </button>
            <span aria-live="polite">
              {handsConnected ? '16 处共用电池' : '14 处共用电池'}
              <small>仅为教学示意</small>
            </span>
          </div>
        </section>
        <section className="robot-advantage-panel joint-integration-panel">
          <h2>
            <span>02</span> 一部分固定，一部分带着手臂转
          </h2>
          <p>电磁主体：定子 + 转子（旋转的动子）。无框电机可融入关节。</p>
          <svg
            className="joint-integration"
            viewBox="0 0 610 360"
            aria-label="肘关节结构示意：定子固定在上臂结构内，转子与前臂连接；装在一起后，外圈不动，内圈旋转并带动前臂，无需另挂一个完整电机外壳"
          >
            <text x="110" y="30" textAnchor="middle">
              定子：固定在上臂里
            </text>
            <path className="fixed-arm" d="M110 62v67" />
            <circle className="stator-section" cx="110" cy="160" r="48" />
            <circle className="stator-gap" cx="110" cy="160" r="31" />
            <text x="110" y="242" textAnchor="middle">
              外圈不动
            </text>
            <text x="302" y="30" textAnchor="middle">
              转子：连着前臂
            </text>
            <path className="moving-arm" d="M302 160l36 94" />
            <circle className="rotor-section" cx="302" cy="160" r="27" />
            <path className="rotor-spoke" d="M285 160h34m-17-17v34" />
            <text x="302" y="290" textAnchor="middle">
              内圈带着前臂转
            </text>
            <path
              className="assembly-arrow"
              d="M174 160h79m-12-10 12 10-12 10M365 160h48m-12-10 12 10-12 10"
            />
            <text x="211" y="128" textAnchor="middle">
              套进去
            </text>
            <text x="497" y="30" textAnchor="middle">
              就是机器人的肘关节
            </text>
            <path className="fixed-arm" d="M497 62v67" />
            <circle className="stator-section" cx="497" cy="160" r="48" />
            <circle className="stator-gap" cx="497" cy="160" r="31" />
            <g className="integrated-forearm">
              <path className="moving-arm" d="M497 160l36 94" />
              <circle className="rotor-section" cx="497" cy="160" r="27" />
              <path className="rotor-spoke" d="M480 160h34m-17-17v34" />
            </g>
            <path
              className="rotation-arrow"
              d="M551 190q26 49-15 80m2-16-2 16 16-2"
            />
            <text x="497" y="316" textAnchor="middle">
              电机与本体融为一体
            </text>
            <text x="497" y="345" textAnchor="middle">
              肩、髋、膝也可这样集成
            </text>
          </svg>
          <div className="joint-integration-legend">
            <span>绿色：定子 + 上臂</span>
            <span>橙色：转子 + 前臂</span>
          </div>
        </section>
      </div>
      <p className="robot-convenience-note">
        两根线指直流母线的正、负供电导体；各支路经保护与驱动器供电，控制和反馈接线省略。可继续扩展，但受电源功率、线缆载流量等限制。结构图为集成原理示意，实际还需轴承、传感器，可能配减速器。
      </p>
      <nav className="robot-video-links" aria-label="机器人案例视频">
        <a
          href="https://www.bilibili.com/video/BV1gvt2eCE83/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="robot-video-play">
            <Play />
          </span>
          <span>
            <small>视频 01 · 看供能装置</small>
            <strong>内燃机动力四足机器人</strong>
          </span>
          <ExternalLink />
        </a>
        <a
          href="https://www.bilibili.com/video/BV1CK4y1R7FF/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="robot-video-play">
            <Play />
          </span>
          <span>
            <small>视频 02 · 看关节布置</small>
            <strong>波士顿动力公司机器人进化史</strong>
          </span>
          <ExternalLink />
        </a>
      </nav>
      <div className="robot-reference-links">
        <a
          className="robot-history-source"
          href="https://bostondynamics.com/about/history/"
          target="_blank"
          rel="noreferrer"
        >
          参考：Boston Dynamics 历史与产品 ↗
        </a>
        <a
          className="robot-history-source"
          href="https://www.kollmorgen.com/en-us/products/motors/technologies-explained/what-is-a-frameless-motor"
          target="_blank"
          rel="noreferrer"
        >
          结构依据：Kollmorgen 无框电机 ↗
        </a>
      </div>
    </div>
  );
};

const performanceCases = [
  {
    id: 'semiconductor',
    label: '半导体应用集锦',
    title: '高性能伺服在半导体行业中的应用',
    text: '观察不同应用中的运动方式，思考哪些动作需要快速响应、准确定位或稳定停靠。',
    src: '/videos/servo-semiconductor-applications.mp4',
    href: '/videos/servo-semiconductor-applications.mp4',
  },
  {
    id: 'bonder',
    label: '高速固晶机',
    title: '快速运动，也要准确到位',
    text: '观察机构如何反复移动、到位和返回。慢动作展示不代表设备实际运行速度。',
    src: 'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1Gu411C7qs&p=1&high_quality=1&danmaku=0',
    href: 'https://www.bilibili.com/video/BV1Gu411C7qs/',
  },
  {
    id: 'vibration',
    label: '振动抑制',
    title: '伺服负载振动抑制演示',
    text: '观察负载到位后是否继续摆动；本案例说明驱动器控制功能可改善停止后的振动。',
    src: '/videos/servo-vibration-suppression.mp4',
    href: '/videos/servo-vibration-suppression.mp4',
  },
  {
    id: 'research',
    label: '校企合作成果',
    title: '高动态伺服电机响应',
    text: '授课教师王彤 · 校企合作成果展示。观察电机响应运动指令时的变化。',
    src: '/videos/servo-high-dynamic-response.mp4',
    href: '/videos/servo-high-dynamic-response.mp4',
  },
] as const;

const PerformanceLesson = () => {
  const [selected, setSelected] = useState(() =>
    performanceCases.findIndex((item) => item.id === 'bonder'),
  );
  const [expanded, setExpanded] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const video = useRef<HTMLVideoElement>(null);
  const active = performanceCases[selected];
  const shrink = () => {
    video.current?.pause();
    setExpanded(false);
  };
  const select = (next: number) => {
    shrink();
    setVideoAspectRatio(16 / 9);
    setSelected((next + performanceCases.length) % performanceCases.length);
  };
  useEffect(() => {
    if (!expanded) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      video.current?.pause();
      setExpanded(false);
    };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [expanded]);
  return (
    <div className="advantage-body advantage-performance">
      <div className="eyebrow">
        <span />
        电机的优势 <b>03 高性能</b>
      </div>
      <h1>伺服电机 + 驱动器：运动可以快、准、稳</h1>
      <p className="advantage-lead">
        给定目标，驱动器调节电机，反馈告诉系统实际运动到了哪里。
      </p>
      <div className="performance-layout">
        <section className="servo-intro">
          <div className="servo-loop">
            <span>
              目标位置
              <br />/ 速度
            </span>
            <b>
              伺服
              <br />
              驱动器
            </b>
            <b>
              伺服
              <br />
              电机
            </b>
            <span>负载</span>
            <i>编码器：实际位置 / 速度</i>
          </div>
          <div className="ability-grid">
            <p>
              <b>快</b>快速响应起停与运动指令
            </p>
            <p>
              <b>准</b>按目标定位并重复执行
            </p>
            <p>
              <b>稳</b>到位后抑制振动，平稳停靠
            </p>
          </div>
          <small>
            这些能力依赖电机、驱动器、反馈、机械系统的匹配和调试，不给所有伺服系统统一数值。
          </small>
        </section>
        <section className="performance-media">
          <div
            role="tablist"
            aria-label="高性能伺服案例"
            className="performance-tabs"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                select(selected + 1);
              }
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                select(selected - 1);
              }
              if (event.key === 'Home') {
                event.preventDefault();
                event.stopPropagation();
                select(0);
              }
              if (event.key === 'End') {
                event.preventDefault();
                event.stopPropagation();
                select(performanceCases.length - 1);
              }
            }}
          >
            {performanceCases.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected === itemIndex}
                tabIndex={selected === itemIndex ? 0 : -1}
                onClick={() => select(itemIndex)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <h2>{active.title}</h2>
          <p>{active.text}</p>
          <div className="performance-player-slot">
            {expanded && (
              <button
                type="button"
                className="performance-backdrop"
                aria-label="停止播放并缩回视频"
                onClick={shrink}
              />
            )}
            <div
              className={`performance-player${expanded ? ' is-expanded' : ''}`}
              style={
                expanded
                  ? {
                      width: Math.min(1200, 675 * videoAspectRatio),
                      height: Math.min(675, 1200 / videoAspectRatio),
                    }
                  : undefined
              }
              onKeyDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
            >
              {active.id === 'bonder' ? (
                <iframe
                  key={active.id}
                  src={`${active.src}&autoplay=${expanded ? 1 : 0}`}
                  title={active.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <video
                  key={active.id}
                  ref={video}
                  src={active.src}
                  controls
                  playsInline
                  onLoadedMetadata={(event) => {
                    const { videoWidth, videoHeight } = event.currentTarget;
                    if (videoWidth > 0 && videoHeight > 0) {
                      setVideoAspectRatio(videoWidth / videoHeight);
                    }
                  }}
                  onPlay={() => setExpanded(true)}
                  onEnded={() => setExpanded(false)}
                  onError={() => setExpanded(false)}
                  title={active.title}
                >
                  <track
                    kind="captions"
                    src="/videos/captions-unavailable.vtt"
                    srcLang="zh"
                    label="中文提示"
                  />
                </video>
              )}
              {active.id === 'bonder' && !expanded && (
                <button
                  type="button"
                  className="performance-play-trigger"
                  onClick={() => setExpanded(true)}
                >
                  <Play /> 居中放大播放
                </button>
              )}
              {expanded && (
                <button
                  type="button"
                  className="performance-shrink"
                  onClick={shrink}
                  aria-label="停止播放并缩回原位"
                >
                  <X /> 缩回原位
                </button>
              )}
            </div>
          </div>
          <a
            className="media-link"
            href={active.href}
            target="_blank"
            rel="noreferrer"
          >
            <Play />
            在新标签页打开视频 <ArrowRight />
          </a>
        </section>
      </div>
      <p className="advantage-chain">
        高性能来自电机、驱动器、反馈与机械系统共同配合。
      </p>
      <p className="advantage-note">
        课堂思考：机械手快速抓取后，为什么还要关注停止时的振动？
      </p>
    </div>
  );
};

const AdaptabilityLesson = () => (
  <div className="advantage-body advantage-adaptability">
    <div className="eyebrow">
      <span />
      电机的优势 <b>04 适应性强</b>
    </div>
    <h1>速度在变，出力也能快速跟着调</h1>
    <p className="advantage-lead">
      电机配合驱动器，在较宽速度范围内灵活调速、调力，使同一套运动系统适应不同任务与负载。
    </p>
    <div className="adaptability-layout">
      <section className="adaptability-concepts">
        <p>
          <b>调速</b>改变运动速度
        </p>
        <p>
          <b>调力</b>改变电机出力
        </p>
        <p>
          <b>适应</b>按负载与运动过程调整控制
        </p>
        <small>旋转电机的出力通常用转矩描述，直线电机的出力用推力描述。</small>
      </section>
      <section className="launch-case">
        <span>电磁弹射 · 直线电机案例</span>
        <div className="launch-stages">
          <p>
            <b>低速起动</b>
            <i>推力可调</i>
          </p>
          <p>
            <b>持续加速</b>
            <i>推力可调</i>
          </p>
          <p>
            <b>接近目标速度</b>
            <i>推力可调</i>
          </p>
        </div>
        <div className="launch-chain">
          <b>供电与储能</b>
          <ArrowRight />
          <b>功率变换与控制</b>
          <ArrowRight />
          <b>直线电机</b>
          <ArrowRight />
          <b>弹射滑块</b>
          <ArrowRight />
          <b>飞机</b>
        </div>
        <p>
          直线电机沿轨道直接产生推力。控制系统参考速度反馈，在加速过程中调节出力并控制终端速度。
        </p>
      </section>
    </div>
    <div className="adaptability-video">
      <iframe
        src="https://player.bilibili.com/player.html?isOutside=true&bvid=BV1FD4y1z7qe&p=1&high_quality=1&danmaku=0"
        title="电磁弹射案例"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div>
        <h2>不同任务，匹配不同的加速过程</h2>
        <p>
          面对不同质量和目标起飞速度的飞机，系统需要匹配推力与加速过程。观察速度变化，并思考轻飞机与重飞机要达到相同速度时，出力需求会一样吗？
        </p>
        <a
          className="media-link"
          href="https://www.bilibili.com/video/BV1FD4y1z7qe/"
          target="_blank"
          rel="noreferrer"
        >
          <Play />在 Bilibili 打开 <ArrowRight />
        </a>
      </div>
    </div>
    <p className="advantage-note">
      教学示意不表示速度越高、推力必然越大，也不代表具体装备的实测曲线。调节范围受电机、驱动器、供电、散热和机械系统能力限制。
    </p>
    <ExternalLinks
      links={[
        {
          label: 'NAVAIR：EMALS 系统介绍',
          href: 'https://www.navair.navy.mil/product/Electromagnetic-Aircraft-Launch-System-EMALS',
        },
        {
          label: 'NAVAIR：EMALS 系统演示',
          href: 'https://www.navair.navy.mil/node/10161',
        },
      ]}
    />
  </div>
);

export function MotorAdvantagesLesson({ advantage }: Props) {
  if (advantage === 'environment') return <EnvironmentLesson />;
  if (advantage === 'convenience') return <ConvenienceLesson />;
  if (advantage === 'performance') return <PerformanceLesson />;
  return <AdaptabilityLesson />;
}
