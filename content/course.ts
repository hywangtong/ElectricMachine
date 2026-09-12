export type Topic = { title: string; description: string };
export type TeacherProfile = {
  name: string;
  role: string;
  education: string;
  experience: string;
  research: string;
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
      education: '2019 年，浙江大学电气工程博士毕业',
      experience:
        '2019—2023 年，在美的威灵（上海）电机技术有限公司从事电机控制软件方面的工作',
      research: '电机设计、电机驱动器、电机控制算法',
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
    };
// IDs are stable URL fragments. Add lesson pages after each chapter's outline.
export const slides: Slide[] = [
  { id: 'home', kind: 'home', title: '课程封面' },
  ...chapters.flatMap((chapter): Slide[] => [
    {
      id: chapter.id,
      kind: 'chapter',
      title: chapter.teacher ? '教师简介' : chapter.title,
      chapterId: chapter.id,
    },
    {
      id: `${chapter.id}-outline`,
      kind: 'outline',
      title: '本章内容',
      chapterId: chapter.id,
    },
  ]),
];
