'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, Play } from 'lucide-react';

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

const ConvenienceLesson = () => (
  <div className="advantage-body advantage-convenience">
    <div className="eyebrow">
      <span />
      电机的优势 <b>02 应用便捷</b>
    </div>
    <h1>把电引过来，就能在需要的位置产生运动</h1>
    <p className="advantage-lead">
      供能靠电缆，多个关节可以各自安装电机，并从同一电源获得电能。
    </p>
    <div className="convenience-top">
      <section className="flow-card">
        <b>供能链</b>
        <p>电源 → 电缆 → 驱动器 → 电机 → 运动</p>
        <small>
          直流可用 2 根供电导体；三相电机可用 3
          根相线。实际还需要保护接地、反馈与控制接线。
        </small>
      </section>
      <section className="branch-card">
        <b>公共电源 / 母线</b>
        <div>
          <span>支路保护</span>
          <span>驱动器</span>
          <span>关节电机</span>
        </div>
        <div>
          <span>支路保护</span>
          <span>驱动器</span>
          <span>关节电机</span>
        </div>
        <div>
          <span>支路保护</span>
          <span>驱动器</span>
          <span>关节电机</span>
        </div>
        <small>每台电机由对应驱动器控制；容量、线缆与保护要匹配。</small>
      </section>
      <section className="motor-card">
        <b>电机的电磁主体</b>
        <div className="motor-ring">
          <i>
            定子
            <br />
            <small>固定部分</small>
          </i>
          <em>
            动子
            <br />
            <small>运动部分</small>
          </em>
        </div>
        <small>旋转电机的动子常称转子；完整电机还包括轴承、机壳等。</small>
      </section>
    </div>
    <div className="convenience-bottom">
      <section className="robot-case">
        <span>电驱足式机器人</span>
        <div className="robot-diagram">
          <b>电池</b>
          <i>
            髋<br />
            电机
          </i>
          <i>
            膝<br />
            电机
          </i>
          <i>
            髋<br />
            电机
          </i>
          <i>
            膝<br />
            电机
          </i>
        </div>
        <p>
          电源集中在机身，电缆分支给各腿关节供能；多台电机配合抬腿、迈步与支撑。
        </p>
      </section>
      <section className="drive-compare">
        <span>两条驱动链路</span>
        <p>燃料 → 内燃机 → 液压泵 → 压力油路 → 液压执行器 → 关节</p>
        <p className="electric">
          电池 / 电源 → 电缆分支 → 驱动器 → 电机 → 关节
        </p>
        <small>
          上游供能源与关节执行机构是不同层次；不能只看是否有电池判断驱动方式。
        </small>
      </section>
      <section className="arm-case">
        <span>电驱机械手</span>
        <div className="arm-diagram">
          <b>基座</b>
          <i>肩</i>
          <i>肘</i>
          <i>腕</i>
          <em>抓取</em>
        </div>
        <p>
          在不同关节就地安装电机，电缆沿机械臂引入，各轴配合完成伸手、转腕与抓取。
        </p>
      </section>
    </div>
    <p className="advantage-chain">
      电缆把能量送到各处，电机把能量变成各处的运动。
    </p>
    <ExternalLinks
      links={[
        {
          label: '观看内燃机动力四足机器人',
          href: 'https://www.bilibili.com/video/BV1gvt2eCE83/',
        },
        {
          label: '观看波士顿动力公司机器人进化史',
          href: 'https://www.bilibili.com/video/BV1CK4y1R7FF/',
        },
        {
          label: 'Boston Dynamics：历史与产品',
          href: 'https://bostondynamics.com/about/history/',
        },
      ]}
    />
  </div>
);

const performanceCases = [
  {
    id: 'bonder',
    label: '高速固晶机',
    title: '快速运动，也要准确到位',
    text: '观察机构如何反复移动、到位和返回。慢动作展示不代表设备实际运行速度。',
    src: 'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1Gu411C7qs&p=1&high_quality=1&danmaku=0',
    href: 'https://www.bilibili.com/video/BV1Gu411C7qs/',
  },
  {
    id: 'semiconductor',
    label: '半导体应用集锦',
    title: '高性能伺服在半导体行业中的应用',
    text: '观察不同应用中的运动方式，思考哪些动作需要快速响应、准确定位或稳定停靠。',
    src: '/videos/servo-semiconductor-applications.mp4',
    href: '/videos/servo-semiconductor-applications.mp4',
  },
  {
    id: 'research',
    label: '校企合作成果',
    title: '高动态伺服电机响应',
    text: '授课教师王彤 · 校企合作成果展示。观察电机响应运动指令时的变化。',
    src: '/videos/servo-high-dynamic-response.mp4',
    href: '/videos/servo-high-dynamic-response.mp4',
  },
  {
    id: 'vibration',
    label: '振动抑制',
    title: '伺服负载振动抑制演示',
    text: '观察负载到位后是否继续摆动；本案例说明驱动器控制功能可改善停止后的振动。',
    src: '/videos/servo-vibration-suppression.mp4',
    href: '/videos/servo-vibration-suppression.mp4',
  },
] as const;

const PerformanceLesson = () => {
  const [selected, setSelected] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const active = performanceCases[selected];
  useEffect(() => {
    video.current?.pause();
  }, [selected]);
  const select = (next: number) =>
    setSelected((next + performanceCases.length) % performanceCases.length);
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
                setSelected(0);
              }
              if (event.key === 'End') {
                event.preventDefault();
                event.stopPropagation();
                setSelected(performanceCases.length - 1);
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
                onClick={() => setSelected(itemIndex)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <h2>{active.title}</h2>
          <p>{active.text}</p>
          <div className="performance-player">
            {active.id === 'bonder' ? (
              <iframe
                key={active.id}
                src={active.src}
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
