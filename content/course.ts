import { podPages, type PodView } from '@/content/ship-pod';
import {
  motorHistoryPages,
  type MotorHistoryPage,
} from '@/content/motor-history';

export type Topic = { title: string; description: string };
export type TeacherProfile = {
  name: string;
  role: string;
  details: Topic[];
};
export type Chapter = {
  id: string;
  title: string;
  english: string;
  category: string;
  question: string;
  objectives: string[];
  topics: Topic[];
  teachers?: TeacherProfile[];
};
export const chapters: Chapter[] = [
  {
    id: 'introduction',
    title: '绪论',
    english: 'INTRODUCTION',
    category: '课程基础',
    question: '电能如何转化为我们需要的运动？',
    teachers: [
      {
        name: '王彤',
        role: '《电机与拖动》授课教师',
        details: [
          {
            title: '学历',
            description: '2019 年，浙江大学电气工程博士（电机与电器）毕业',
          },
          {
            title: '经历',
            description:
              '2019—2023 年，美的威灵（上海）电机技术有限公司，MVD&LVD研究室软件组长',
          },
          { title: '方向', description: '电机设计、电机驱动器、电机控制算法' },
          {
            title: '联系',
            description:
              '电话：18758566499\n邮箱：wangtong@hzcu.edu.cn\n办公地点：理工 5 楼 A 座 409-3',
          },
        ],
      },
      {
        name: '王雪洁',
        role: '电气系主任 · 电气系专任教师',
        details: [
          {
            title: '职务',
            description:
              '浙大城市学院信息与电气工程学院电气系主任，同时担任学院课程思政建设中心主任',
          },
          {
            title: '经历',
            description: '2003 年入职浙大城市学院，已在教育教学一线耕耘30余年',
          },
          {
            title: '课程',
            description:
              '国家级一流课程《电机与拖动》负责人，国家级一流专业自动化建设的核心成员',
          },
          {
            title: '荣誉',
            description:
              '杭州市教学名师、杭州市教育系统优秀教师、浙大城市学院首届胡建雄奖教金杰出教学奖、“我最喜爱的老师”、优秀共产党员等',
          },
        ],
      },
    ],
    objectives: [
      '认识电机与电力拖动系统',
      '建立能量转换的整体视角',
      '了解本课程的知识结构',
    ],
    topics: [
      {
        title: '课程考核与学习要求',
        description: '平时作业、课堂练习、实验与期末考试',
      },
      {
        title: '电机应用与电动化',
        description: '新能源汽车、分布式电推进、吊舱推进与舰船综合电力系统',
      },
      {
        title: '电机的四大优势',
        description: '环保、应用便捷、高性能与适应性强',
      },
      {
        title: '电机的发展历史',
        description: '从电磁原理发现到实用电机、三相系统与现代电驱',
      },
    ],
  },
  {
    id: 'magnetic-circuits',
    title: '磁路',
    english: 'MAGNETIC CIRCUITS',
    category: '课程基础',
    question: '电流怎样建立磁场，铁心、气隙与交流励磁又会带来什么变化？',
    objectives: [
      '从电磁规律认识 H、B、Φ 与磁导率，解释铁心作用和磁饱和',
      '用磁通势、磁阻与磁路定律计算磁通，分析气隙对励磁的影响',
      '理解交流感应电动势、磁滞与涡流损耗，解释硅钢片叠片降损',
    ],
    topics: [
      {
        title: '电与磁的基本规律',
        description: '麦克斯韦四条规则；电流建立磁场，认识 H、B、Φ 与磁导率',
      },
      {
        title: '铁心与磁饱和',
        description: '铁心为什么导磁；磁畴、B-H 曲线与饱和边界',
      },
      {
        title: '磁路计算与气隙',
        description: '磁通势、磁阻、磁路欧姆定律与 KCL / KVL；气隙的励磁需求',
      },
      {
        title: '交流磁路与叠片降损',
        description: '感应电动势与 U/f；磁滞、涡流铁耗和硅钢片叠片',
      },
    ],
  },
  {
    id: 'dc-machines',
    title: '直流电机理论',
    english: 'DC MACHINES',
    category: '直流电机',
    question: '直流电机怎样实现发电与电动运行？',
    objectives: [
      '认识直流电机的结构和工作原理',
      '建立电动势与转矩的基本关系',
      '分析直流电机的运行特性',
    ],
    topics: [
      { title: '结构与工作原理', description: '磁极、电枢、换向器与电刷' },
      { title: '磁场与电枢反应', description: '励磁方式及负载磁场的变化' },
      { title: '基本方程', description: '电动势、转矩与功率平衡' },
      { title: '运行特性', description: '发电机与电动机的外部特性' },
    ],
  },
  {
    id: 'dc-drives',
    title: '直流电机的电力拖动',
    english: 'DC ELECTRIC DRIVES',
    category: '直流电机',
    question: '如何让直流电动机按要求起动、调速和制动？',
    objectives: [
      '理解机械特性与稳定运行条件',
      '掌握起动和制动的基本方法',
      '比较不同调速方式的特点',
    ],
    topics: [
      { title: '拖动系统动力学', description: '运动方程与负载机械特性' },
      {
        title: '机械特性与运行点',
        description: '固有特性、人为特性与稳定运行',
      },
      { title: '起动与制动', description: '起动电流限制及典型制动方式' },
      { title: '调速与过渡过程', description: '调压、弱磁与电枢串电阻调速' },
    ],
  },
  {
    id: 'transformers',
    title: '变压器',
    english: 'TRANSFORMERS',
    category: '交流电机',
    question: '静止的电磁装置如何改变电压并传递能量？',
    objectives: [
      '理解变压器的电磁工作原理',
      '掌握等效电路与参数测定方法',
      '分析负载运行与性能指标',
    ],
    topics: [
      { title: '结构与基本原理', description: '铁芯、绕组与电磁感应' },
      { title: '运行分析与等效电路', description: '空载、负载及参数折算' },
      { title: '试验与运行性能', description: '空载试验、短路试验与效率' },
      { title: '三相变压器', description: '联结组别与并联运行条件' },
    ],
  },
  {
    id: 'induction-machines',
    title: '异步电机理论',
    english: 'INDUCTION MACHINES',
    category: '交流电机',
    question: '旋转磁场怎样带动转子旋转？',
    objectives: [
      '理解旋转磁场与转差率',
      '建立异步电机的等效电路',
      '分析电磁转矩与工作特性',
    ],
    topics: [
      { title: '结构与旋转磁场', description: '三相绕组与旋转磁场的形成' },
      { title: '工作原理与转差率', description: '转子感应电流与电磁转矩' },
      { title: '等效电路与功率', description: '参数折算、功率传递与损耗' },
      { title: '转矩与工作特性', description: '转矩关系及额定运行性能' },
    ],
  },
  {
    id: 'induction-drives',
    title: '异步电机的电力拖动',
    english: 'INDUCTION MOTOR DRIVES',
    category: '交流电机',
    question: '如何实现异步电动机的可控运行？',
    objectives: [
      '分析异步电动机的机械特性',
      '掌握典型起动与制动方式',
      '理解异步电动机的调速方法',
    ],
    topics: [
      { title: '机械特性', description: '固有机械特性与参数变化的影响' },
      { title: '起动方法', description: '直接起动、降压起动与转子串电阻' },
      { title: '制动运行', description: '能耗制动、反接制动与回馈制动' },
      { title: '调速方法', description: '变频、变极与变转差率调速' },
    ],
  },
];
export type Slide =
  | { id: string; kind: 'home'; title: string }
  | {
      id: string;
      kind: 'motor-history';
      title: string;
      chapterId: string;
      page: MotorHistoryPage;
    }
  | {
      id: string;
      kind: 'motor-advantage';
      title: string;
      chapterId: string;
      advantage: 'environment' | 'convenience' | 'performance' | 'adaptability';
    }
  | {
      id: string;
      kind: 'ev';
      title: string;
      chapterId: string;
      page:
        | 'bev'
        | 'hev'
        | 'phev'
        | 'erev'
        | 'fcev'
        | 'principle'
        | 'compare'
        | 'memory';
    }
  | {
      id: string;
      kind: 'pod';
      title: string;
      chapterId: string;
      view: PodView;
    }
  | {
      id: string;
      kind: 'chapter' | 'teachers' | 'outline';
      title: string;
      chapterId: string;
    }
  | {
      id: string;
      kind: 'content';
      title: string;
      chapterId: string;
      lead: string;
      points: Topic[];
      explainer?: 'distributed-propulsion';
      links?: {
        title: string;
        url: string;
        kind: 'video' | 'reference';
      }[];
      note?: string;
    }
  | {
      id: string;
      kind: 'video';
      title: string;
      chapterId: string;
      lead: string;
      videoUrl: string;
      externalUrl: string;
    }
  | {
      id: string;
      kind: 'question';
      title: string;
      chapterId: string;
      prompt: string;
    }
  | {
      id: string;
      kind: 'embed';
      title: string;
      chapterId: string;
      embedUrl: string;
    }
  | {
      id: string;
      kind: 'trend';
      title: string;
      chapterId: string;
    }
  | {
      id: string;
      kind: 'assessment';
      title: string;
      chapterId: string;
      rows: {
        stage: string;
        requirement: string;
        weight: string;
      }[];
      platform: {
        webUrl: string;
        appName: string;
        firstPassword: string;
        loginGuide: string;
        courseGuide: string;
        returningGuide: string;
      };
    };
// IDs are stable URL fragments. Keep each chapter's pages together.
export const slides: Slide[] = [
  { id: 'home', kind: 'home', title: '课程封面' },
  ...chapters.flatMap((chapter): Slide[] => {
    const chapterSlides: Slide[] = [
      {
        id: chapter.id,
        kind: 'chapter',
        title: chapter.title,
        chapterId: chapter.id,
      },
    ];

    if (chapter.id === 'introduction') {
      chapterSlides.push(
        {
          id: 'introduction-teachers',
          kind: 'teachers',
          title: '教师简介',
          chapterId: chapter.id,
        },
        {
          id: 'introduction-outline',
          kind: 'outline',
          title: '本章内容',
          chapterId: chapter.id,
        },
        {
          id: 'introduction-assessment',
          kind: 'assessment',
          title: '课程考核方案',
          chapterId: chapter.id,
          rows: [
            {
              stage: '平时作业',
              requirement: '智慧树平台在线学习',
              weight: '15%',
            },
            {
              stage: '课堂练习',
              requirement: '随堂小练习',
              weight: '15%',
            },
            {
              stage: '实验成绩',
              requirement:
                '实验表现 + 实验报告，重点考察实践动手能力和解决实际问题能力',
              weight: '30%',
            },
            {
              stage: '期末考试',
              requirement:
                '闭卷；卷面 50 分为基准分。50 分及以上计算平时成绩；50 分以下只算卷面成绩，根据评分标准进行评分',
              weight: '40%',
            },
            { stage: '合计', requirement: '—', weight: '100%' },
          ],
          platform: {
            webUrl: 'https://www.zhihuishu.com',
            appName: '知到',
            firstPassword: 'Zhihuishu@学号后六位',
            loginGuide: '使用学号 + 密码直接登录，无需注册',
            courseGuide:
              '登录成功后，学习频道会弹出课程；点击确认课程即可加入学习。考试在“作业考试”栏目查看。',
            returningGuide:
              '若之前已登录平台并修改过密码，请使用手机号或学号及修改后的密码登录，即可看到弹出的已导入课程；账号一直处于登录状态的，请退出后重新登录，待课程弹出后加入学习。',
          },
        },
        {
          id: 'introduction-electric-everywhere',
          kind: 'video',
          title: '电机无处不在',
          chapterId: chapter.id,
          lead: '电机在当今生产、生活等经济活动中极其重要、不可或缺，并仍在以非常快的速度取代其他原动机。',
          videoUrl:
            'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1GN4y1Q75T&p=1&high_quality=1&danmaku=0',
          externalUrl: 'https://www.bilibili.com/video/BV1GN4y1Q75T/',
        },
        {
          id: 'introduction-opening-question',
          kind: 'question',
          title: '课堂思考',
          chapterId: chapter.id,
          prompt:
            '大家能不能举出当下现实存在的任何一个可以动但是不使用电机的东西？',
        },
        {
          id: 'introduction-electrification-trend',
          kind: 'trend',
          title: '电动化浪潮',
          chapterId: chapter.id,
        },
        ...(
          [
            ['principle', '新能源汽车：共同原理'],
            ['bev', '纯电动汽车'],
            ['hev', '混合动力汽车'],
            ['phev', '插电式混合动力汽车'],
            ['erev', '增程式电动汽车'],
            ['fcev', '氢燃料电池汽车'],
            ['compare', '新能源汽车：路线对比'],
            ['memory', '新能源汽车：五句话记忆'],
          ] as const
        ).map(
          ([page, title]): Slide => ({
            id: 'introduction-ev-' + page,
            kind: 'ev',
            title,
            chapterId: chapter.id,
            page,
          }),
        ),

        {
          id: 'introduction-distributed-electric-propulsion',
          kind: 'content',
          title: '电机上天：分布式电推进',
          chapterId: chapter.id,
          lead: '像给机翼装一排小风扇：螺旋桨不仅提供推力，还让吹出的风帮助机翼产生升力。',
          explainer: 'distributed-propulsion',
          points: [
            {
              title: '一块电池',
              description: '像插线板一样，把电送给机翼上的许多小电机。',
            },
            {
              title: '大家一起吹',
              description: '小螺旋桨把气流加速，机翼慢慢飞也托得住飞机。',
            },
            {
              title: '只留两个大桨',
              description: '小桨停转并折叠；窄机翼阻力小，飞得更省电。',
            },
            {
              title: '少一个也能干活',
              description:
                '其余电机还能继续推；但电池、母线和软件也要有隔离与备份。',
            },
          ],
          links: [
            {
              title: '分布式电推进系统简述',
              url: 'https://www.bilibili.com/video/BV1RH4y1q7yd/',
              kind: 'video',
            },
            {
              title: 'NASA X57 分布式电推进飞行器',
              url: 'https://www.bilibili.com/video/BV1hK4y197uE/',
              kind: 'video',
            },
            {
              title: 'NASA X-57 官方资料',
              url: 'https://www.nasa.gov/x-57-maxwell/',
              kind: 'reference',
            },
          ],
          note: '工程边界：冗余依赖供电隔离与控制备份，电池重量和散热仍是难题。X-57 为全电研究方案，项目于 2024 年首飞前结束，不能把设计目标当作飞行实测结果。',
        },
        ...podPages.map(
          (page): Slide => ({
            ...page,
            kind: 'pod',
            chapterId: chapter.id,
          }),
        ),
        {
          id: 'introduction-ship-integrated-power',
          kind: 'embed',
          title: '舰船综合电力系统 ELI5',
          chapterId: chapter.id,
          embedUrl: '/ship-power-eli5.html',
        },
      );
    }

    if (chapter.id !== 'introduction') {
      chapterSlides.push({
        id: `${chapter.id}-outline`,
        kind: 'outline',
        title: '本章内容',
        chapterId: chapter.id,
      });
    }

    if (chapter.id === 'introduction') {
      chapterSlides.push(
        {
          id: 'introduction-motor-advantages-environment',
          kind: 'motor-advantage',
          title: '电机的优势：环保',
          chapterId: chapter.id,
          advantage: 'environment',
        },
        {
          id: 'introduction-motor-advantages-convenience',
          kind: 'motor-advantage',
          title: '电机的优势：应用便捷',
          chapterId: chapter.id,
          advantage: 'convenience',
        },
        {
          id: 'introduction-motor-advantages-performance',
          kind: 'motor-advantage',
          title: '电机的优势：高性能',
          chapterId: chapter.id,
          advantage: 'performance',
        },
        {
          id: 'introduction-motor-advantages-adaptability',
          kind: 'motor-advantage',
          title: '电机的优势：适应性强',
          chapterId: chapter.id,
          advantage: 'adaptability',
        },
      );
      chapterSlides.push(
        ...motorHistoryPages.map(
          ({ page, title }): Slide => ({
            id: `introduction-motor-history-${page}`,
            kind: 'motor-history',
            title,
            chapterId: chapter.id,
            page,
          }),
        ),
      );
    }

    if (chapter.id === 'magnetic-circuits') {
      chapterSlides.push(
        {
          id: 'magnetic-circuits-maxwell-eli5',
          kind: 'embed',
          title: '麦克斯韦方程组：电和磁的四条规则',
          chapterId: chapter.id,
          embedUrl: '/magnetic-maxwell-eli5.html',
        },
        {
          id: 'magnetic-circuits-field-basics',
          kind: 'embed',
          title: '为什么有磁场？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-field-basics.html',
        },
        {
          id: 'magnetic-circuits-iron-core',
          kind: 'embed',
          title: '为什么要铁心？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-iron-core.html',
        },
        {
          id: 'magnetic-circuits-saturation',
          kind: 'embed',
          title: '铁心为什么会饱和？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-saturation.html',
        },
        {
          id: 'magnetic-circuits-calculation',
          kind: 'embed',
          title: '怎样算磁路？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-calculation.html',
        },
        {
          id: 'magnetic-circuits-air-gap',
          kind: 'embed',
          title: '为什么气隙最关键？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-air-gap.html',
        },
        {
          id: 'magnetic-circuits-ac-losses',
          kind: 'embed',
          title: '交流为什么产生铁耗？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-ac-losses.html',
        },
        {
          id: 'magnetic-circuits-lamination',
          kind: 'embed',
          title: '为什么采用硅钢片叠片铁芯？',
          chapterId: chapter.id,
          embedUrl: '/magnetic-lamination.html',
        },
      );
    }

    if (chapter.id === 'dc-machines') {
      chapterSlides.push(
        {
          id: 'dc-machines-uses-types',
          kind: 'embed',
          title: '直流电机的用途与种类',
          chapterId: chapter.id,
          embedUrl: '/dc-machine-uses-types.html',
        },
        {
          id: 'dc-motor-fixed-current',
          kind: 'embed',
          title: '直流电动机原理：不换向的线圈',
          chapterId: chapter.id,
          embedUrl: '/dc-motor-fixed-current.html',
        },
        {
          id: 'dc-motor-commutator',
          kind: 'embed',
          title: '直流电动机原理：电刷与换向器',
          chapterId: chapter.id,
          embedUrl: '/dc-motor-commutator.html',
        },
        {
          id: 'dc-motor-reversibility',
          kind: 'embed',
          title: '换向装置与直流电机的可逆原理',
          chapterId: chapter.id,
          embedUrl: '/dc-motor-reversibility.html',
        },
        {
          id: 'dc-generator-slip-rings',
          kind: 'embed',
          title: '直流发电机原理：没有换向器',
          chapterId: chapter.id,
          embedUrl: '/dc-generator-slip-rings.html',
        },
        {
          id: 'dc-generator-commutator',
          kind: 'embed',
          title: '直流发电机原理：电刷与换向器',
          chapterId: chapter.id,
          embedUrl: '/dc-generator-commutator.html',
        },
        ...[
          ['overview', '直流电机真实结构：总体结构'],
          ['stator', '直流电机真实结构：定子'],
          ['rotor', '直流电机真实结构：转子与电枢'],
          ['contact', '直流电机真实结构：电刷与换向器'],
          ['assembly', '直流电机真实结构：装配关系'],
          ['function', '直流电机真实结构：功能链'],
          ['sources', '直流电机真实结构：资料与术语'],
        ].map(
          ([page, title]): Slide => ({
            id: `dc-motor-structure-${page}`,
            kind: 'embed',
            title,
            chapterId: chapter.id,
            embedUrl: `/dc-motor-structure.html?page=${page}`,
          }),
        ),
        {
          id: 'dc-motor-eight-coils',
          kind: 'embed',
          title: '八线圈电枢：多极换向与并联支路',
          chapterId: chapter.id,
          embedUrl: '/dc-motor-eight-coils.html',
        },
        {
          id: 'dc-motor-frogleg-simplex',
          kind: 'embed',
          title: '4P·8S·8C：Frog-Leg 与 Simplex 可重构电枢',
          chapterId: chapter.id,
          embedUrl: '/dc-motor-frogleg-simplex.html',
        },
      );
    }

    return chapterSlides;
  }),
];
