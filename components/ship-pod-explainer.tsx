import { podSources, type PodSourceId, type PodView } from '@/content/ship-pod';

// Inline SVG diagrams need an image role and a text alternative, not an img tag.
/* oxlint-disable jsx-a11y/prefer-tag-over-role */

function Citations({ ids }: { ids: PodSourceId[] }) {
  return (
    <div className="pod-citations">
      <span>资料依据</span>
      {ids.map((id) => {
        const source = podSources.find((item) => item.id === id)!;
        return (
          <a key={id} href={source.url} target="_blank" rel="noreferrer">
            {source.label} ↗
          </a>
        );
      })}
    </div>
  );
}

function Propeller({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pod-propeller">
      <path d="M0 0C-52-82 29-85 0 0C52 82-29 85 0 0Z" />
      <circle r="11" />
    </g>
  );
}

function Pod({ offset = false }: { offset?: boolean }) {
  return (
    <g>
      <path
        className="pod-strut"
        d={offset ? 'M292 72v154h-88' : 'M200 72v154'}
      />
      <path
        className="pod-shell"
        d="M96 192h151c62 0 84 30 84 40s-22 40-84 40H96Z"
      />
      <rect
        className="pod-motor"
        x="135"
        y="210"
        width="106"
        height="44"
        rx="12"
      />
      <path className="pod-shaft" d="M61 232h207" />
      <Propeller x={78} y={232} />
    </g>
  );
}

function Anatomy() {
  return (
    <div className="pod-split">
      <figure className="pod-ocean">
        <div className="pod-anatomy-stage">
          <svg
            viewBox="0 0 850 470"
            role="img"
            aria-label="船底吊舱剖面：电缆穿过支架，水下密封壳体内的电机通过短轴驱动前方螺旋桨；水向后，船向前。"
          >
            <path className="pod-hull" d="M95 90h625l-50 103H160Z" />
            <path className="pod-deck" d="M243 90V40h250v50M309 40V13h108v27" />
            <path
              className="pod-wave"
              d="M20 164q30-18 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0"
            />
            <g transform="translate(206 118)">
              <Pod />
            </g>
            <path className="pod-cable" d="M469 62h-63v260" />
            <path
              className="pod-guide"
              d="M406 244h231M450 350l118 64h120M323 336H147"
            />
            <path
              className="pod-water-arrow"
              d="M573 347h161m-22-15 22 15-22 15"
            />
            <path
              className="pod-force-arrow"
              d="M242 218H85m22-15-22 15 22 15"
            />
          </svg>
          <div aria-hidden="true" className="pod-anatomy-labels">
            <span className="pod-label-strut">① 支架 + 电缆</span>
            <span className="pod-label-motor">② 密封舱内的电机</span>
            <span className="pod-label-prop">③ 螺旋桨</span>
            <span className="pod-label-water">水向后</span>
            <span className="pod-label-force">船向前</span>
          </div>
        </div>
        <figcaption>示意剖面 · 拉式单桨方案 · 非产品工程图</figcaption>
      </figure>
      <div className="pod-story">
        <span className="pod-tag">像一只装在船底的电动脚</span>
        <h2>
          电机藏在水下，
          <br />
          螺旋桨就在旁边。
        </h2>
        <p>电机带着桨转，桨把水往后送，水就把船往前推。</p>
        <div className="pod-takeaway">
          它还能转方向：
          <br />
          <strong>一套装置，负责推进和转向。</strong>
        </div>
      </div>
    </div>
  );
}

function Energy() {
  const chain = [
    ['⚡', '船上电网', '把电送到推进系统'],
    ['∿', '变频驱动器', '像调光旋钮，调节电机'],
    ['↻', '水下电机', '电能变成转动'],
    ['≋', '螺旋桨', '转动变成推水'],
  ];
  return (
    <>
      <div className="pod-supply">
        <section>
          <b>燃料 → 发电机</b>
          <span>柴油 / LNG 等：船上有“小电站”</span>
        </section>
        <span className="pod-or">或 / 混合</span>
        <section>
          <b>岸上充电 → 电池</b>
          <span>适合具备充电条件的航线</span>
        </section>
      </div>
      <div className="pod-flow">
        {chain.map(([icon, name, detail], i) => (
          <section key={name}>
            <span className="pod-flow-icon" aria-hidden="true">
              {icon}
            </span>
            <span className="pod-step">0{i + 1}</span>
            <h2>{name}</h2>
            <p>{detail}</p>
            {i < 3 && (
              <span className="pod-flow-arrow" aria-hidden="true">
                →
              </span>
            )}
          </section>
        ))}
      </div>
      <div className="pod-banner">
        “电推进”说的是<strong>桨由电机带动</strong>；发电端仍可能消耗燃料。
      </div>
    </>
  );
}

function Steering() {
  return (
    <>
      <div className="pod-card-grid">
        {[
          { title: '向前推', angle: 0, detail: '推力朝船头' },
          { title: '向后推', angle: 180, detail: '吊舱调转，可产生向后推力' },
          { title: '向旁边推', angle: 90, detail: '多台推进器配合，帮助靠泊' },
        ].map(({ title, angle, detail }) => (
          <section className="pod-card" key={title}>
            <svg
              viewBox="0 0 360 300"
              role="img"
              aria-label={`${title}的俯视推力示意图`}
            >
              <path
                className="pod-plan-hull"
                d="M180 19Q233 51 233 109v159H127V109q0-58 53-90Z"
              />
              <circle className="pod-turn-circle" cx="180" cy="207" r="65" />
              <g transform={`translate(180 207) rotate(${angle})`}>
                <rect
                  className="pod-motor"
                  x="-17"
                  y="-30"
                  width="34"
                  height="62"
                  rx="17"
                />
                <path className="pod-prop-line" d="M-30-35h60" />
                <path
                  className="pod-force-arrow"
                  d="M0-49V-119m-13 20 13-20 13 20"
                />
              </g>
            </svg>
            <span className="pod-direction" aria-hidden="true">
              俯视 · 船头 ↑
            </span>
            <h2>{title}</h2>
            <p>{detail}</p>
          </section>
        ))}
      </div>
      <div className="pod-banner">
        <strong>360°</strong> 是吊舱绕竖直轴转向；桨叶同时绕自己的轴旋转。
      </div>
      <p className="pod-fineprint">
        绿色箭头表示推力，示意图未模拟整船运动。实际操纵角度和功率需遵守运行限制。
      </p>
    </>
  );
}

function Layouts() {
  return (
    <>
      <div className="pod-card-grid">
        <section className="pod-card">
          <svg
            viewBox="0 0 400 320"
            role="img"
            aria-label="电动吊舱：电机在水下，短轴直接带桨"
          >
            <Pod />
          </svg>
          <span className="pod-tag">这次的主角</span>
          <h2>电动吊舱</h2>
          <p>电机在水下舱体内，短轴直接带桨。</p>
        </section>
        <section className="pod-card">
          <svg
            viewBox="0 0 400 320"
            role="img"
            aria-label="机械全回转推进器：电机在船内，竖轴及齿轮将动力送至水下"
          >
            <Pod offset />
            <rect
              className="pod-motor"
              x="252"
              y="33"
              width="80"
              height="49"
              rx="9"
            />
            <path className="pod-mechanical" d="M292 80v151H99" />
            <rect
              className="pod-shell"
              x="126"
              y="209"
              width="122"
              height="46"
              rx="5"
            />
            <circle className="pod-gear" cx="151" cy="232" r="16" />
            <circle className="pod-gear" cx="181" cy="232" r="16" />
          </svg>
          <span className="pod-tag">另一种传动路径</span>
          <h2>机械全回转</h2>
          <p>电机或发动机在船内，通过轴和齿轮带桨。</p>
        </section>
        <section className="pod-card">
          <svg
            viewBox="0 0 400 320"
            role="img"
            aria-label="轮缘驱动推进器：电机沿桨外圈布置"
          >
            <circle className="pod-rim-shell" cx="200" cy="180" r="100" />
            <circle className="pod-rim-motor" cx="200" cy="180" r="82" />
            {[0, 90, 180, 270].map((angle) => (
              <path
                key={angle}
                className="pod-rim-blade"
                transform={`rotate(${angle} 200 180)`}
                d="M200 180q-44-40-25-81l39 1q-26 35-14 80Z"
              />
            ))}
          </svg>
          <span className="pod-tag">电机围着桨</span>
          <h2>轮缘驱动</h2>
          <p>把电机放在桨的外圈，也是直接电驱的一条路线。</p>
        </section>
      </div>
      <div className="pod-banner">
        看到“全回转”，先问：<strong>电机在哪里？动力怎样送到桨？</strong>
      </div>
      <p className="pod-fineprint">
        三图仅说明传动路径。Azipod 是 ABB 商标；Siemens 的 POD-T 双桨命名与国产
        T 型支架含义不同。
      </p>
    </>
  );
}

function China() {
  return (
    <div className="pod-split pod-china">
      <div className="pod-china-graphic">
        <div className="pod-megawatt">
          <strong>
            10<span>MW</span>
          </strong>
          <p>= 10,000 kW · 功率等级</p>
        </div>
        <svg
          viewBox="0 0 780 330"
          role="img"
          aria-label="L 型与 T 型支架概念对比：L 型支架靠近一端，T 型支架位于舱体中部"
        >
          <g transform="translate(0 0)">
            <Pod offset />
          </g>
          <g transform="translate(390 0)">
            <Pod />
          </g>
        </svg>
        <div className="pod-layout-legend" aria-hidden="true">
          <span>L 型</span>
          <span>T 型</span>
        </div>
        <p className="pod-fineprint">
          支架布局概念图 · 不代表实物尺寸、内部结构或双桨配置
        </p>
      </div>
      <div className="pod-story">
        <span className="pod-tag">七〇四所 · S-POD</span>
        <h2>
          把“大功率水下脚”
          <br />
          掌握在自己手里。
        </h2>
        <div className="pod-timeline">
          <section>
            <b>2024 · 全负荷试验</b>
            <p>国产首台套 10 MW T 型吊舱，完成全负荷动态试验。</p>
          </section>
          <section>
            <b>2025 · 系列发布</b>
            <p>S-POD 覆盖 400 kW—10 MW；发布报道明确实现 100% 国产化。</p>
          </section>
        </div>
        <p className="pod-china-note">
          T
          型把支架布局调整得更居中；从几何上，更有利于减小回转所需空间。这是布局原理解释。
        </p>
        <p className="pod-fineprint">
          2 MW 产品已有实船应用；本页不把 10 MW 试验成功等同于长期实船运行。
        </p>
      </div>
    </div>
  );
}

function Vessel({ kind }: { kind: 'cruise' | 'ice' | 'research' }) {
  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label={`${kind === 'cruise' ? '邮轮' : kind === 'ice' ? '破冰船' : '科考船'}示意图`}
    >
      <path className="pod-hull" d="M28 135h344l-37 63H70Z" />
      <path
        className="pod-deck"
        d={
          kind === 'cruise'
            ? 'M83 135V91h248v44M119 91V58h169v33M145 58V37h115v21'
            : 'M133 135V82h125v53M178 82V54h41v28'
        }
      />
      {kind === 'cruise' ? (
        <path className="pod-window" d="M109 113h185M142 73h122" />
      ) : kind === 'ice' ? (
        <path
          className="pod-ice"
          d="m19 224 48-14 29 24 38-14 31 22m119-8 37-24 42 13 21-22"
        />
      ) : (
        <path className="pod-crane" d="M297 135V52h57v54m0 0-10 13h20Z" />
      )}
      <path
        className="pod-wave"
        d="M18 202q25-13 50 0t50 0t50 0t50 0t50 0t50 0t50 0"
      />
      <path className="pod-strut" d="M240 196v20" />
      <ellipse className="pod-motor" cx="242" cy="225" rx="29" ry="11" />
      <path className="pod-prop-line" d="M207 211v28" />
    </svg>
  );
}

function Applications() {
  return (
    <>
      <div className="pod-card-grid pod-uses">
        <section className="pod-card">
          <Vessel kind="cruise" />
          <span className="pod-tag">邮轮 · 靠泊与舒适性</span>
          <h2>让“大酒店”好转身</h2>
          <p>低速操纵更灵活，减少振动是重要设计目标。</p>
          <div className="pod-example">
            国产大型邮轮建造资料：
            <br />
            <b>两台 16.8 MW 吊舱</b>
          </div>
        </section>
        <section className="pod-card">
          <Vessel kind="ice" />
          <span className="pod-tag">破冰船 · 冰区操纵</span>
          <h2>前进、后退都能干活</h2>
          <p>冰级吊舱要承受冰桨相互作用，支持双向破冰设计。</p>
          <div className="pod-example">
            雪龙 2：
            <br />
            <b>双 Azipod + 双向破冰</b>
          </div>
        </section>
        <section className="pod-card">
          <Vessel kind="research" />
          <span className="pod-tag">科考与作业船 · 精确操纵</span>
          <h2>更容易在目标旁作业</h2>
          <p>推力方向可调；配合定位、控制和其他推进器抵抗风浪。</p>
          <div className="pod-example">
            国产 2 MW S-POD：
            <br />
            <b>“珠海云”“同济”号应用</b>
          </div>
        </section>
      </div>
      <div className="pod-banner">
        当船需要<strong>灵活操纵、紧凑布置或特殊作业</strong>
        ，吊舱更容易发挥优势。
      </div>
    </>
  );
}

function Tradeoffs() {
  return (
    <>
      <div className="pod-card-grid pod-challenges">
        <section className="pod-card">
          <span className="pod-challenge-icon" aria-hidden="true">
            ≈
          </span>
          <h2>水下关</h2>
          <p>海水会腐蚀，轴在转，舱体必须密封；轴承、冷却都要可靠。</p>
          <div className="pod-example">
            少了长轴系和齿轮环节，
            <br />
            <b>水下设备仍需维护。</b>
          </div>
        </section>
        <section className="pod-card">
          <span className="pod-challenge-icon" aria-hidden="true">
            ⚡
          </span>
          <h2>供电关</h2>
          <p>发电、配电、驱动、保护要配合；失电时，推进也会受影响。</p>
          <div className="pod-example">
            要看整套系统的冗余，
            <br />
            <b>双吊舱不自动等于双保障。</b>
          </div>
        </section>
        <section className="pod-card">
          <span className="pod-challenge-icon" aria-hidden="true">
            ↗
          </span>
          <h2>匹配关</h2>
          <p>船型、速度、桨和航线要一起设计；水流、空化和阻力都影响效率。</p>
          <div className="pod-example">
            节能看船型与运行工况，
            <br />
            <b>不能给所有船同一个百分比。</b>
          </div>
        </section>
      </div>
      <div className="pod-banner">
        带走一句话：<strong>把电机放到桨旁边，再让这只“脚”转方向。</strong>
      </div>
      <p className="pod-fineprint">
        以上是系统工程层面的原理归纳，不是这款国产产品存在故障的判断。低噪声、节能和定位效果均需整船验证。
      </p>
    </>
  );
}

export function ShipPodExplainer({ view }: { view: PodView }) {
  const headings: Record<PodView, [string, string]> = {
    anatomy: ['给大船装一只「水下电动脚」', '电动吊舱推进 · 从一张剖面图开始'],
    energy: [
      '电从哪里来？一路追到螺旋桨',
      '电源可以不同，最后都由电机把桨带起来',
    ],
    steering: ['脚一转，推力就转', '转速管推力大小，吊舱角度管推力方向'],
    layouts: ['会转向，不一定是电动吊舱', '看电机位置，才知道它走哪条传动路线'],
    china: [
      '国产 10 兆瓦，突破在哪里？',
      '从试验成功到系列发布，把两个时间点分清',
    ],
    applications: [
      '哪些船最喜欢这只「脚」？',
      '看船要做什么，再看推进器能帮什么忙',
    ],
    tradeoffs: ['好用，也要过三道关', '大船选推进系统，要把整条能量链一起看'],
    sources: [
      '继续探索 · 资料入口',
      '原理、国产进展、实船案例，均可回到原文核对',
    ],
  };
  const sourceIds: Record<PodView, PodSourceId[]> = {
    anatomy: ['cssc-2024', 'abb-pod'],
    energy: ['cruise', 'battery', 'abb-pod'],
    steering: ['cssc-2024', 'abb-pod'],
    layouts: ['abb-pod', 'siemens-pod', 'km-drive'],
    china: ['cssc-2024', 'spod-2025'],
    applications: ['cruise', 'icebreaker', 'spod-2025'],
    tradeoffs: ['maintenance', 'siemens-pod', 'icebreaker'],
    sources: [],
  };
  return (
    <div className={`pod-lesson pod-view-${view}`}>
      <div className="pod-eyebrow">
        <span />
        MARINE ELECTRIC PROPULSION <b>轮船电动吊舱 · ELI5</b>
      </div>
      <header className="pod-heading">
        <h1>{headings[view][0]}</h1>
        <p>{headings[view][1]}</p>
      </header>
      <div className="pod-main">
        {view === 'anatomy' ? (
          <Anatomy />
        ) : view === 'energy' ? (
          <Energy />
        ) : view === 'steering' ? (
          <Steering />
        ) : view === 'layouts' ? (
          <Layouts />
        ) : view === 'china' ? (
          <China />
        ) : view === 'applications' ? (
          <Applications />
        ) : view === 'tradeoffs' ? (
          <Tradeoffs />
        ) : (
          <div className="pod-source-grid">
            {podSources.map((source, i) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>0{i + 1} ↗</span>
                <h2>{source.label}</h2>
                <p>{source.supports}</p>
                <small>{source.publisher}</small>
              </a>
            ))}
          </div>
        )}
      </div>
      {view === 'sources' ? (
        <p className="pod-research-note">
          资料查阅：2026-09-13 · 原创教学简化图 ·{' '}
          <a
            href="https://www.bilibili.com/video/BV1FkvQefEKX/"
            target="_blank"
            rel="noreferrer"
          >
            观看用户提供的视频 ↗
          </a>
          {' · '}
          <a
            href="https://www.bilibili.com/video/BV1nwQVY6EXM/?share_source=copy_web&vd_source=a43aa07765401d6ab954076fcbe1f0ef"
            target="_blank"
            rel="noreferrer"
          >
            补充视频（Bilibili） ↗
          </a>
        </p>
      ) : (
        <Citations ids={sourceIds[view]} />
      )}
    </div>
  );
}
