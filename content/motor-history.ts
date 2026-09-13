export const motorHistoryPages = [
  { page: 'overview', title: '两百多年，电机怎样改变世界？' },
  { page: 'principles', title: '电与磁，让运动成为可能' },
  { page: 'practical', title: '从能转，到能干活' },
  { page: 'ac-system', title: '不用机械换向，也能让转子转起来' },
  { page: 'adoption', title: '电机进入工厂，也进入家庭' },
  { page: 'electronic-control', title: '给电机装上可调电源和控制大脑' },
  { page: 'modern-drive', title: '今天的发展，是整套电驱系统的发展' },
] as const;

export type MotorHistoryPage = (typeof motorHistoryPages)[number]['page'];

export const motorHistorySources = {
  ri: {
    title: '皇家研究所 · 电磁实验',
    url: 'https://www.rigb.org/explore-science/explore/blog/birth-electric-motion',
  },
  early: { title: 'KIT · 早期电机', url: 'https://www.eti.kit.edu/1376.php' },
  industrial: {
    title: 'KIT · 直流与三相系统',
    url: 'https://www.eti.kit.edu/1390.php',
  },
  vde: {
    title: 'VDE · 驱动技术年表',
    url: 'https://www.vde.com/de/etg/arbeitsgebiete/informationen/chronik-motoren-antriebe',
  },
  danfoss: {
    title: '丹佛斯 · 1968 年交流驱动',
    url: 'https://www.danfoss.com/en-gb/about-danfoss/news/dds/50-years-of-passion-for-drives/',
  },
  foc: {
    title: 'Blaschke · 磁场定向控制专利',
    url: 'https://patents.google.com/patent/US3805135A/en',
  },
  magnets: {
    title: 'QEPrize · 高性能永磁材料',
    url: 'https://qeprize.org/winners/the-worlds-strongest-permanent-magnet',
  },
  doe: {
    title: '美国能源部 · 电驱研发',
    url: 'https://www.energy.gov/cmei/vehicles/electric-drive-systems-research-and-development',
  },
} as const;

export const motorHistoryStages = [
  {
    name: '电磁原理发现',
    period: '1820—1830 年代初',
    verb: '让电变成运动',
    breakthrough: '电流的磁效应、电磁旋转、电磁感应',
    application: '实验室里的运动与发电演示',
    question: '看不见的电，怎样推动看得见的东西？',
    lead: '先发现电与磁的联系，才有电动和发电的可能。',
    events: [
      ['1820', '奥斯特：通电导线使指南针偏转'],
      ['1821', '法拉第：通电导线绕磁铁旋转'],
      ['1831', '法拉第：发现电磁感应'],
    ],
    conclusion: '电机的起点，是电与磁的联系。',
    note: '教学示意，不复原含汞的历史装置；有磁铁不等于持续发电，关键是磁通变化等感应条件。',
    sources: ['ri', 'early'],
  },
  {
    name: '走向实用电机',
    period: '1830—1870 年代',
    verb: '从能转到能干活',
    breakthrough: '机械输出提高，发电与电枢结构改进',
    application: '电动船试验 → 可带负载的直流机器',
    question: '能转的装置，为什么还不一定是好用的机器？',
    lead: '像从小玩具变成小帮手：要有力气，也要供得起、用得久。',
    events: [
      ['1834 / 1838', '雅可比：旋转电动机 / 电动船试验'],
      ['1866', '西门子：自励发电机'],
      ['1870 年代', '电枢结构与绕组继续改进'],
    ],
    conclusion: '能转只是起点，还要能干活、能持续用。',
    note: '两图不是同一型号的升级；船是早期试验，自励发电机并非首个发电机，也未一次解决所有实用问题。',
    sources: ['early', 'industrial'],
  },
  {
    name: '交流电机与三相系统',
    period: '1880—1890 年代',
    verb: '把动力送到远处',
    breakthrough: '旋转磁场、笼型感应电机、三相供电',
    application: '发电 → 变压输电 → 远处的电机',
    question: '磁铁不用真的转，磁场也能转起来吗？',
    lead: '三相电流配合，让合成磁场转起来，带动感应转子。',
    events: [
      ['1880 年代', '费拉里斯与特斯拉分别研究旋转磁场和感应电机'],
      ['1889—1891', '多利沃—多布罗沃尔斯基推动三相笼型异步电机与系统实用化'],
      ['1891', '劳芬—法兰克福三相远距离输电示范'],
    ],
    conclusion: '三相系统把电机发展推进到系统电气化。',
    note: '此处以笼型感应电机为例：转子不是永磁体，电动时通常比磁场慢；多位研究者贡献不同。',
    sources: ['industrial'],
  },
  {
    name: '普及与调速发展',
    period: '1890 年代—20 世纪中叶',
    verb: '各处都能出力',
    breakthrough: '电力拖动扩展，并发展机组调压调速',
    application: '生产机械、洗衣机、吸尘器',
    question: '工厂和家庭需要的运动，都是一样的吗？',
    lead: '不仅要转起来，还要按任务转快、转慢。电子变频器之前，已有调速。',
    events: [
      ['1891', 'Ward–Leonard 机组调速系统'],
      ['20 世纪初', '电动家用电器逐步出现与普及'],
      ['应用需求', '从带动工作机构，走向按任务调节运动'],
    ],
    conclusion: '电机不只是出力，还需要按任务调节运动。',
    note: '机械轴与电气连接分开画；家电普及因地区而异，示例年份不等于所有家庭开始使用的年份。',
    sources: ['vde'],
  },
  {
    name: '电力电子与数字控制',
    period: '1960—1990 年代',
    verb: '运动听懂指令',
    breakthrough: '功率半导体、变频驱动、磁场定向与数字控制',
    application: '可控交流驱动与精准伺服运动',
    question: '怎样让电机不仅能转，还能按要求运动？',
    lead: '驱动器像可调水龙头，反馈像眼睛，控制系统边看边调整。',
    events: [
      [
        '1960 年代 / 1968',
        '功率半导体推动电子驱动；丹佛斯开始批量生产交流驱动器',
      ],
      ['1970 年代', '磁场定向控制发展；Blaschke 专利是技术实例'],
      ['1980—1990 年代', '功率器件与数字控制推动交流调速、伺服'],
    ],
    conclusion: '电机 + 驱动器 + 反馈，让运动按要求进行。',
    note: '闭环是带传感器反馈的示例，并非所有变频驱动的统一接法；“大脑”不表示电机内部必有计算机。',
    sources: ['vde', 'danfoss', 'foc'],
  },
  {
    name: '高性能材料与系统集成',
    period: '1980 年代至今',
    verb: '整套系统一起进步',
    breakthrough: '高性能永磁材料与电机、电控、冷却协同',
    application: '新能源汽车、机器人、航空、船舶',
    question: '只有更强的磁铁，整套电驱就一定更好吗？',
    lead: '像一支配合默契的队伍：材料、电机、供电、控制、冷却缺一不可。',
    events: [
      ['1980 年代以来', '佐川真人等推动高性能钕铁硼材料实用化'],
      ['今天的研发方向', '宽禁带功率器件、低稀土电机设计'],
      ['系统协同', '封装、热管理与电机—驱动器集成'],
    ],
    conclusion: '从发现规律到实用动力，再到高效、精准、可靠的受控运动。',
    note: '研发方向不等于所有量产产品的实测性能；永磁电机早已存在，也不会必然取代所有电机路线。',
    sources: ['magnets', 'doe'],
  },
] as const;
