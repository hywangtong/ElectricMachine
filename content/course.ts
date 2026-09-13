import { podPages, type PodView } from '@/content/ship-pod';

export type Topic = { title: string; description: string };
export type TeacherProfile = {
  name: string;
  role: string;
  education: string;
  experience: string;
  research: string;
  phone: string;
  email: string;
  office: string;
};
export type Chapter = {
  id: string;
  title: string;
  english: string;
  category: string;
  question: string;
  objectives: string[];
  topics: Topic[];
  teacher?: TeacherProfile;
};
export const chapters: Chapter[] = [
  {
    id: 'introduction',
    title: '绪论',
    english: 'INTRODUCTION',
    category: '课程基础',
    question: '电能如何转化为我们需要的运动？',
    teacher: {
      name: '王彤',
      role: '《电机与拖动》授课教师',
      education: '2019 年，浙江大学电气工程博士（电机与电器）毕业',
      experience:
        '2019—2023 年，美的威灵（上海）电机技术有限公司，MVD&LVD研究室软件组长',
      research: '电机设计、电机驱动器、电机控制算法',
      phone: '18758566499',
      email: 'wangtong@hzcu.edu.cn',
      office: '理工 5 楼 A 座 409-3',
    },
    objectives: [
      '认识电机与电力拖动系统',
      '建立能量转换的整体视角',
      '了解本课程的知识结构',
    ],
    topics: [
      { title: '电机与电力拖动', description: '电机的作用、分类与典型应用' },
      { title: '机电能量转换', description: '电能、磁场与机械能之间的联系' },
      { title: '电力拖动系统', description: '电源、电机、传动机构与生产机械' },
      { title: '课程学习路线', description: '从基本原理到运行分析与控制' },
    ],
  },
  {
    id: 'magnetic-circuits',
    title: '磁路',
    english: 'MAGNETIC CIRCUITS',
    category: '课程基础',
    question: '如何描述和计算电机中的磁场？',
    objectives: [
      '理解磁路的基本物理量',
      '掌握磁路分析的基本方法',
      '认识铁磁材料的特性与损耗',
    ],
    topics: [
      { title: '磁场与磁路', description: '磁感应强度、磁通与磁场强度' },
      { title: '磁路基本定律', description: '安培环路定律与磁路计算' },
      { title: '铁磁材料', description: '磁化曲线、磁饱和与磁滞' },
      { title: '交流磁路', description: '感应电动势与铁芯损耗' },
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
      kind: 'chapter' | 'outline';
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
        title: chapter.teacher ? '教师简介' : chapter.title,
        chapterId: chapter.id,
      },
    ];

    if (chapter.id === 'introduction') {
      chapterSlides.push(
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

    chapterSlides.push({
      id: `${chapter.id}-outline`,
      kind: 'outline',
      title: '本章内容',
      chapterId: chapter.id,
    });

    return chapterSlides;
  }),
];
