// Research checked on 2026-09-13. Keep source IDs stable for slide citations.
export const podSources = [
  {
    id: 'cssc-2024',
    label: '中国船舶 · 10 MW 全负荷试验',
    publisher: '国防科工局转载中国船舶｜2024-07-20',
    url: 'https://www.sastind.gov.cn/n10086200/n10086331/c10580560/content.html',
    supports: '国产首台套、T 型、全负荷动态试验成功。',
  },
  {
    id: 'spod-2025',
    label: 'S-POD 系列 · 国产化与实船应用',
    publisher: '科技日报｜2025-12-02',
    url: 'https://www.stdaily.com/web/gdxw/2025-12/02/content_441042.html',
    supports: '系列发布、100% 国产化；2 MW 产品实船应用。',
  },
  {
    id: 'abb-pod',
    label: 'ABB · Azipod 工作原理',
    publisher: '制造商产品资料｜查阅于 2026-09-13',
    url: 'https://www.abb.com/global/en/industries/marine/solutions/marine-electric-propulsion/azipod',
    supports: '水下电机、直接驱动、360° 全回转。',
  },
  {
    id: 'siemens-pod',
    label: 'Siemens Energy · 电动吊舱',
    publisher: '制造商产品资料｜查阅于 2026-09-13',
    url: 'https://www.siemens-energy.com/global/en/home/products-services/product/podded-propulsion.html',
    supports: '永磁同步电机、单桨与双桨产品方案。',
  },
  {
    id: 'km-drive',
    label: 'Kongsberg · 直接电驱与轮缘驱动',
    publisher: '制造商产品资料｜查阅于 2026-09-13',
    url: 'https://www.kongsbergmaritime.com/products/propulsors-and-propulsion-systems/thrusters/direct-electric-drive/',
    supports: '吊舱与轮缘驱动是不同结构路线。',
  },
  {
    id: 'cruise',
    label: '中国船舶 · 国产大型邮轮配置',
    publisher: '中国船舶集团｜建造阶段资料',
    url: 'https://www.cssc.net.cn/n135/n171/n179/c21170/content.html',
    supports: '柴油发电供电；两台 16.8 MW 吊舱推进器。',
  },
  {
    id: 'icebreaker',
    label: 'ABB · 雪龙 2 的电力推进系统',
    publisher: '系统供应商技术文章｜2020-09-24',
    url: 'https://new.abb.com/news/detail/67897/system-health-management-boosts-intelligence-of-chinese-polar-research-vessel',
    supports: '双吊舱、双向破冰和设备健康监测。',
  },
  {
    id: 'battery',
    label: 'Yara · 电池动力货船资料',
    publisher: '船东新闻资料包｜查阅于 2026-09-13',
    url: 'https://www.yara.com/news-and-media/media-library/press-kits/yara-birkeland-press-kit/',
    supports: 'Yara Birkeland 是电池动力船；不据此认定吊舱结构。',
  },
  {
    id: 'maintenance',
    label: 'ABB · 维护与设备健康管理',
    publisher: '制造商服务资料｜查阅于 2026-09-13',
    url: 'https://www.abb.com/global/en/industries/marine/solutions/marine-electric-propulsion/azipod/azipod-services',
    supports: '定期维护、干坞服务和状态监测仍然必要。',
  },
] as const;

export type PodSourceId = (typeof podSources)[number]['id'];
export const podPages = [
  { id: 'ship-pod-anatomy', title: '大船的水下电动脚', view: 'anatomy' },
  { id: 'ship-pod-energy', title: '电从哪里来？', view: 'energy' },
  { id: 'ship-pod-steering', title: '脚一转，推力就转', view: 'steering' },
  {
    id: 'ship-pod-layouts',
    title: '会转向，不一定是电动吊舱',
    view: 'layouts',
  },
  { id: 'ship-pod-china', title: '国产 10 兆瓦，突破在哪里？', view: 'china' },
  {
    id: 'ship-pod-applications',
    title: '哪些船最喜欢它？',
    view: 'applications',
  },
  { id: 'ship-pod-tradeoffs', title: '好用，也要过三道关', view: 'tradeoffs' },
  { id: 'ship-pod-sources', title: '继续探索 · 资料入口', view: 'sources' },
] as const;
export type PodView = (typeof podPages)[number]['view'];
