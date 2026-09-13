'use client';

import { useState } from 'react';
import {
  BatteryCharging,
  Bolt,
  CarFront,
  CheckCircle2,
  Droplets,
  Factory,
  Fuel,
  Gauge,
  PlugZap,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Wind,
  Zap,
} from 'lucide-react';

export type RouteId = 'bev' | 'hev' | 'phev' | 'erev' | 'fcev';
type EnergyStep = { label: string; icon: typeof Zap };
type VehicleRoute = {
  id: RouteId;
  short: string;
  name: string;
  nickname: string;
  color: string;
  summary: string;
  analogy: string;
  steps: EnergyStep[];
  engineRole: string;
  refill: string;
  energyStore: string;
  wheelDriver: string;
  plug: string;
  bestAt: string;
  watchOut: string;
};

const routes: VehicleRoute[] = [
  {
    id: 'bev',
    short: '纯电',
    name: '纯电动汽车',
    nickname: '大号充电玩具车',
    color: '#76e7ff',
    summary: '只带电池和电机，不烧油。',
    analogy: '像手机一样：先充满电，再用电池里的电一路跑。',
    steps: [
      { label: '充电桩', icon: PlugZap },
      { label: '大电池', icon: BatteryCharging },
      { label: '电控', icon: Gauge },
      { label: '电机', icon: Bolt },
      { label: '车轮', icon: CarFront },
    ],
    engineRole: '没有发动机，电机直接负责转动车轮。',
    refill: '插电充电',
    energyStore: '大电池',
    wheelDriver: '只有电机',
    plug: '必须',
    bestAt: '安静、加速快、能量利用率高，适合充电方便的人。',
    watchOut: '补能比加油慢；低温和高速会让续航缩水。',
  },
  {
    id: 'hev',
    short: '油混',
    name: '混合动力汽车',
    nickname: '会互相帮忙的双人自行车',
    color: '#ffd36e',
    summary: '油箱是主粮，小电池帮发动机省油。',
    analogy: '像两个小朋友一起蹬车：费劲时电机来帮，刹车时顺便把能量捡回来。',
    steps: [
      { label: '油箱', icon: Fuel },
      { label: '发动机', icon: Factory },
      { label: '小电池', icon: BatteryCharging },
      { label: '电机', icon: Bolt },
      { label: '车轮', icon: CarFront },
    ],
    engineRole: '发动机通常能直接驱动车轮，电机在起步和加速时帮忙。',
    refill: '只加油，不插电',
    energyStore: '油箱 + 小电池',
    wheelDriver: '发动机和电机',
    plug: '不能',
    bestAt: '没有充电条件也能比普通燃油车省油。',
    watchOut: '纯电行驶很短；按中国常用分类，普通油混通常不算新能源汽车。',
  },
  {
    id: 'phev',
    short: '插混',
    name: '插电式混合动力汽车',
    nickname: '带两份午餐的远足车',
    color: '#a9f49c',
    summary: '能充电，也能加油；电机和发动机都能出力。',
    analogy: '先吃电池这份午餐，路远了再打开油箱那份，不容易饿在半路。',
    steps: [
      { label: '充电 / 加油', icon: PlugZap },
      { label: '电池 + 油箱', icon: BatteryCharging },
      { label: '电机 + 发动机', icon: Factory },
      { label: '一起协作', icon: Sparkles },
      { label: '车轮', icon: CarFront },
    ],
    engineRole: '发动机可以直接驱动车轮，也可以和电机一起出力。',
    refill: '可充电，也可加油',
    energyStore: '油箱 + 中等电池',
    wheelDriver: '发动机和电机',
    plug: '可以',
    bestAt: '短途用电、长途用油，适合偶尔远行又能经常充电的人。',
    watchOut: '系统更复杂、更重；不充电就难发挥节能优势。',
  },
  {
    id: 'erev',
    short: '增程',
    name: '增程式电动汽车',
    nickname: '自带小发电站的电动车',
    color: '#ff9a78',
    summary: '车轮只听电机的，发动机主要负责发电。',
    analogy: '像背着充电宝出门：电池快没电时，小发电机边发电边续上。',
    steps: [
      { label: '充电 / 加油', icon: PlugZap },
      { label: '电池', icon: BatteryCharging },
      { label: '增程器发电', icon: RotateCcw },
      { label: '电机', icon: Bolt },
      { label: '车轮', icon: CarFront },
    ],
    engineRole: '典型增程系统里，发动机不直接推动车轮，只带着发电机发电。',
    refill: '可充电，也可加油',
    energyStore: '油箱 + 中大电池',
    wheelDriver: '只有电机',
    plug: '可以',
    bestAt: '开起来像纯电车，又少了长途充电焦虑。',
    watchOut: '高速长途时“油→电→运动”多转一次，效率不一定占优。',
  },
  {
    id: 'fcev',
    short: '氢能',
    name: '氢燃料电池汽车',
    nickname: '会用氢气现场做电的车',
    color: '#c6b8ff',
    summary: '氢气和空气在燃料电池里变成电，再由电机驱动。',
    analogy: '车上有一座安静的“发电厨房”，把氢和氧组合起来，做出电和水。',
    steps: [
      { label: '氢气罐', icon: Fuel },
      { label: '空气', icon: Wind },
      { label: '燃料电池', icon: Zap },
      { label: '电机', icon: Bolt },
      { label: '车轮 + 水', icon: Droplets },
    ],
    engineRole: '没有传统发动机；燃料电池负责发电，电机负责转动车轮。',
    refill: '加氢',
    energyStore: '氢气罐 + 小电池',
    wheelDriver: '只有电机',
    plug: '通常不用',
    bestAt: '补能快、行驶时只排水，适合固定线路和重载场景探索。',
    watchOut: '制氢、运氢和加氢站都不容易，整体成本目前较高。',
  },
];

export type EvPage = RouteId | 'principle' | 'compare' | 'memory';
export type IntroPage = 'trend' | EvPage;

const stepIcon = (label: string): typeof Zap => {
  if (label.includes('充电')) return PlugZap;
  if (label.includes('电池')) return BatteryCharging;
  if (label.includes('油箱') || label.includes('氢气')) return Fuel;
  if (label.includes('发动机')) return Factory;
  if (label.includes('发电')) return RotateCcw;
  if (label.includes('电控')) return Gauge;
  if (label.includes('车轮')) return CarFront;
  if (label.includes('空气')) return Wind;
  return Bolt;
};

export function EvRouteNav({
  page,
  onNavigate,
  className,
}: {
  page: IntroPage;
  onNavigate: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      className={'ev-route-nav' + (className ? ' ' + className : '')}
      aria-label="绪论电动化内容"
    >
      <button
        onClick={() => onNavigate('introduction-electrification-trend')}
        aria-current={page === 'trend' ? 'page' : undefined}
        style={{ '--tab-color': '#a7653b' } as React.CSSProperties}
      >
        电动化浪潮
      </button>
      {routes.map((route) => (
        <button
          key={route.id}
          onClick={() => onNavigate('introduction-ev-' + route.id)}
          aria-current={page === route.id ? 'page' : undefined}
          style={{ '--tab-color': route.color } as React.CSSProperties}
        >
          {route.short}
          <small>{route.id.toUpperCase()}</small>
        </button>
      ))}
      <button
        onClick={() => onNavigate('introduction-ev-principle')}
        aria-current={page === 'principle' ? 'page' : undefined}
        style={{ '--tab-color': '#76e7ff' } as React.CSSProperties}
      >
        共同原理
      </button>
      <button
        onClick={() => onNavigate('introduction-ev-compare')}
        aria-current={page === 'compare' ? 'page' : undefined}
        style={{ '--tab-color': '#76e7ff' } as React.CSSProperties}
      >
        横向对比
      </button>
    </nav>
  );
}

export function EvLesson({
  page,
  onNavigate,
}: {
  page: EvPage;
  onNavigate: (id: string) => void;
}) {
  const active = routes.find((route) => route.id === page) ?? routes[0];
  const paths: string[][] =
    active.id === 'hev'
      ? [
          ['油箱', '发动机', '传动机构', '车轮'],
          ['发动机发电 / 刹车回收', '小电池', '电控', '电机', '车轮'],
        ]
      : active.id === 'phev'
        ? [
            ['充电桩', '电池', '电控', '电机', '车轮'],
            ['油箱', '发动机', '传动机构', '车轮'],
          ]
        : active.id === 'erev'
          ? [
              ['充电桩', '电池', '电控', '电机', '车轮'],
              ['油箱', '发动机 + 发电机', '电控', '电机', '车轮'],
            ]
          : active.id === 'fcev'
            ? [
                ['氢气 + 空气中的氧', '燃料电池发电', '电控', '电机', '车轮'],
                ['燃料电池发电', '小电池缓冲', '电控', '电机', '车轮'],
              ]
            : [active.steps.map((step) => step.label)];
  const [showRecovery, setShowRecovery] = useState(false);
  const isRoute = routes.some((route) => route.id === page);

  return (
    <div
      className="ev-lesson"
      style={
        {
          '--ev-color': isRoute ? active.color : '#76e7ff',
        } as React.CSSProperties
      }
    >
      <div className="ev-heading">
        <div>
          <p>新能源汽车 · ELI5 能量实验台</p>
          <h1>
            {page === 'principle'
              ? '车轮怎么转？先追踪能量。'
              : page === 'compare'
                ? '五条路线，一眼分清。'
                : page === 'memory'
                  ? '把缩写扔掉，把五幅画带走。'
                  : active.name}
          </h1>
        </div>
        <span>{isRoute ? active.id.toUpperCase() : 'ENERGY → MOTION'}</span>
      </div>
      <EvRouteNav page={page} onNavigate={onNavigate} />

      {isRoute ? (
        <>
          <div className="ev-paths">
            {paths.map((path, pathIndex) => (
              <div
                className="ev-path"
                key={pathIndex}
                aria-label={path.join('到')}
              >
                <span className="ev-path-label">
                  {paths.length === 1
                    ? '用电行驶'
                    : active.id === 'fcev'
                      ? pathIndex === 0
                        ? '现场发电'
                        : '电池缓冲'
                      : pathIndex === 0
                        ? active.id === 'hev'
                          ? '燃油直驱'
                          : '插电行驶'
                        : active.id === 'phev'
                          ? '燃油直驱'
                          : active.id === 'hev'
                            ? '电机助力'
                            : '燃油发电'}
                </span>
                <div className="ev-path-nodes">
                  {path.map((label, index) => {
                    const Icon = stepIcon(label);
                    return (
                      <div className="ev-flow-piece" key={label}>
                        <div className="ev-node">
                          <Icon aria-hidden="true" />
                          <span>{label}</span>
                        </div>
                        {index < path.length - 1 && <b aria-hidden="true">→</b>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {active.id === 'fcev' && (
            <p className="ev-path-note">
              <Droplets size={20} />{' '}
              氢与氧发生电化学反应，生成电、水和热；不是把氢气点燃来开车。
            </p>
          )}
          <div className="ev-explain">
            <div className="ev-analogy">
              <Sparkles />
              <div>
                <small>{active.nickname}</small>
                <p>{active.analogy}</p>
              </div>
            </div>
            <div className="ev-facts">
              <p>
                <span>一句话</span>
                {active.summary}
              </p>
              <p>
                <span>发动机</span>
                {active.engineRole}
              </p>
              <p>
                <span>补能</span>
                {active.refill}
              </p>
            </div>
          </div>
          <div className="ev-verdict">
            <div>
              <CheckCircle2 />
              <p>
                <small>它擅长</small>
                {active.bestAt}
              </p>
            </div>
            <div>
              <TriangleAlert />
              <p>
                <small>要留意</small>
                {active.watchOut}
              </p>
            </div>
          </div>
        </>
      ) : page === 'principle' ? (
        <div className="ev-common">
          <p className="ev-lead">
            只问两个问题：能量装在哪里？最后是谁推动车轮？
          </p>
          <div className="ev-secret-grid">
            <article>
              <BatteryCharging />
              <small>01 · 仓库</small>
              <h2>先把能量带上车</h2>
              <p>电池装电，油箱装油，氢气罐装氢。就像不同形状的“饭盒”。</p>
            </article>
            <article>
              <Gauge />
              <small>02 · 水龙头</small>
              <h2>给电机合适的电</h2>
              <p>电控像聪明水龙头，决定给电机多少电，让车加速、减速或倒车。</p>
            </article>
            <article>
              <RotateCcw />
              <small>03 · 捡回来</small>
              <h2>刹车还能回收能量</h2>
              <p>
                电机反过来当发电机，把一部分运动能量送回电池，而不是全变成热。
              </p>
            </article>
          </div>
          <button
            className="ev-recovery"
            onClick={() => setShowRecovery(!showRecovery)}
            aria-pressed={showRecovery}
          >
            <span>{showRecovery ? '减速：车轮' : '行驶：电池'}</span>
            <b>→</b>
            <span>{showRecovery ? '电机变发电机' : '电控'}</span>
            <b>→</b>
            <span>{showRecovery ? '电控' : '电机'}</span>
            <b>→</b>
            <span>{showRecovery ? '电池' : '车轮'}</span>
            <small>点击切换行驶 / 能量回收</small>
          </button>
          <p className="ev-footnote">
            回收不是“永动机”：能量会有损耗，电池满电、低温或急刹车时，回收也会受限。
          </p>
        </div>
      ) : page === 'compare' ? (
        <div className="ev-comparison">
          <p className="ev-lead">
            关键判断：发动机能不能直接驱动车轮？增程是插电式混合动力中的一种技术形式。
          </p>
          <table>
            <thead>
              <tr>
                <th>路线</th>
                <th>能量仓库</th>
                <th>谁直接推车轮</th>
                <th>能否插电</th>
                <th>补能</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <th scope="row" style={{ color: route.color }}>
                    {route.short} <small>{route.id.toUpperCase()}</small>
                  </th>
                  <td>{route.energyStore}</td>
                  <td>{route.wheelDriver}</td>
                  <td>{route.plug}</td>
                  <td>{route.refill}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ev-compare-key">
            <span>插混：发动机能直接推车轮</span>
            <b>≠</b>
            <span>典型增程：发动机只发电</span>
          </div>
          <p className="ev-footnote">
            表中“插混”指可发动机直驱的常见插混方案。油混 HEV
            仅为比较而列入，按中国常用分类通常不属于新能源汽车；电池大小是典型特征，并非固定标准。
          </p>
        </div>
      ) : (
        <div className="ev-memory">
          {routes.map((route, index) => (
            <article
              key={route.id}
              style={{ '--memory-color': route.color } as React.CSSProperties}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <small>{route.short}</small>
                <h2>{route.nickname}</h2>
              </div>
              <p>{route.summary}</p>
            </article>
          ))}
          <p className="ev-memory-end">
            没有“万能路线”，只有更适合补能条件与出行场景的路线。
          </p>
        </div>
      )}
    </div>
  );
}
