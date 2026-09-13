# 轮船电动吊舱 · ELI5 教学模块

内容查阅日期：2026-09-13。模块使用大图、短句，分成 8 个 1600 × 900 教学页面，已接在绪论的“电动化浪潮”之后。沿用现有目录、键盘、触屏、全屏和 hash 导航。

## 向主仓库整合

合并以下文件及对应接入改动即可：

- `content/ship-pod.ts`：页面 ID、页面顺序、带依据说明的资料索引。
- `components/ship-pod-explainer.tsx`：独立教学组件，参数为 `view: PodView`。
- `public/ship-pod.css`：带 `pod-` 前缀的模块样式，供网站与 HTML 共用。
- `content/course.ts`：`Slide` 的 `pod` 分支和绪论中的页面数组展开。
- `components/course-player.tsx`：组件导入与 `pod` 渲染分支。
- `app/globals.css`：模块 CSS 导入。
- `scripts/export-ship-pod.mjs`、`package.json`：独立 HTML 导出命令及 lint 范围。
- `public/ship-pod.html`：独立、无运行依赖的 HTML 交付文件。

网站入口为 `/#ship-pod-anatomy`，资料入口为 `/#ship-pod-sources`。页面 ID 固定，便于教师分享直达链接。

只需独立嵌入时，可使用 `public/ship-pod.html`；可通过 HTTP 访问 `/ship-pod.html#ship-pod-anatomy`，也可直接打开本地文件。独立版支持下拉选页、方向键、Home/End、左右滑动及 F 全屏。小屏等比缩放，建议横屏。

内容或样式更新后运行：

```sh
npm run export:ship-pod
npm run typecheck
npm run lint
npm run build
```

导出器从同一份 React 组件生成静态 HTML 并内联模块 CSS，避免维护第二份教学内容。SVG 为原创原理示意，无外部图片、字体或视频加载；只有点击资料链接时需要网络。独立版含少量原生 JavaScript 用于翻页，不依赖 React 运行时。

## 讲解顺序

1. 水下电动脚：电机在舱内，短轴带桨；水向后、船向前。
2. 能量链：发电机 / 电池 → 电网 → 变频驱动器 → 电机 → 螺旋桨。
3. 两种旋转：桨轴旋转产生推力，吊舱绕竖直轴旋转改变推力方向。
4. 分辨结构：水下电动吊舱、机械全回转、轮缘驱动。
5. 国产进展：10 MW 的功率等级、T 型布局、2024 和 2025 两个节点。
6. 实船应用：邮轮、破冰船、科考与作业船。
7. 系统取舍：水下可靠性、供电冗余、船型与工况匹配。
8. 资料入口：9 个原始报道、制造商或船东资料链接，加用户视频。

## 核查笔记与授课边界

### 国产事件

[国防科工局，信息来源：中国船舶，2024-07-20](https://www.sastind.gov.cn/n10086200/n10086331/c10580560/content.html)明确记载：国产首台套 10 MW T 型吊舱完成全负荷动态试验；此前已有 2 MW 级实船应用。这里的“成功”有具体试验依据，不能外推为 10 MW 产品已经多年运行，也不是全球首次出现 10 MW 吊舱。

[科技日报，2025-12-02](https://www.stdaily.com/web/gdxw/2025-12/02/content_441042.html)报道 2025-12-01 发布 S-POD 系列，覆盖 400 kW—10 MW，并报道实现 100% 国产化、2 MW 产品用于“珠海云”“同济”号。“100%”按发布报道归属到系列产品，不扩展为整船设备、全供应链所有原材料或制造设备均国产的独立审计结论。

T 型示意图解释支架更居中时回转空间的几何原理，属于教学推理。图中不表达精确尺寸、双桨数量或实物内部结构；不提供未经原始产品数据证明的回转半径或节能百分比。Siemens 的 POD-T 是双桨产品名，与国产 T 型支架的含义不同。

### 原理与结构

[ABB Azipod 产品页](https://www.abb.com/global/en/industries/marine/solutions/marine-electric-propulsion/azipod)说明电机位于船外水下舱体、直接驱动与 360° 全回转。Azipod 是商标，正文采用通用名“电动吊舱”。“没有长轴系”不意味着没有短桨轴和轴承。

[Siemens Energy 产品页](https://www.siemens-energy.com/global/en/home/products-services/product/podded-propulsion.html)提供永磁同步电机、单桨 / 双桨路线与冷却、可靠性资料。[Kongsberg 直接电驱资料](https://www.kongsbergmaritime.com/products/propulsors-and-propulsion-systems/thrusters/direct-electric-drive/)用于说明轮缘驱动这一独立路线。[Kongsberg 机械传动实例](https://www.kongsberg.com/contentassets/6dc4ca1c03ff4462b8eb8bc014f63cca/21.azimuth_2p_31.08.17.pdf)记载通过齿轮向桨传递动力；该实例操纵角度受限，不能用来证明所有机械推进器都可 360° 回转。教学图仅比较传动路径。

发电机与电机像一对“接力队员”：前者把机械能转成电能，后者把电能转回机械能。这样更容易安排设备位置和控制转速，但电能转换环节本身也存在损耗。变频驱动器不只是改变频率，还按控制需求调节电压和电流；“调光旋钮”是易懂的控制类比。

### 案例与效率

[中国船舶大型邮轮建造资料](https://www.cssc.net.cn/n135/n171/n179/c21170/content.html)记载柴油发电机和两台 16.8 MW 吊舱，体现电推进与燃料发电可以同时存在。访问时该站存在间歇性 502，搜索索引仍能读到对应配置。

[ABB 雪龙 2 系统文章，2020-09-24](https://new.abb.com/news/detail/67897/system-health-management-boosts-intelligence-of-chinese-polar-research-vessel)记载双 Azipod、双向破冰与健康监测。不把普通开水域吊舱画成天然可破冰，也不把这条船写成使用国产 S-POD。

[Yara 船东资料包](https://www.yara.com/news-and-media/media-library/press-kits/yara-birkeland-press-kit/)用于确认电池动力船确实存在。其资料使用 “Azipull pods” 一词，本模块不据此认定其为水下电机、无齿轮吊舱，也不将电池动力与特定推进器结构绑定。

[ABB 服务资料](https://www.abb.com/global/en/industries/marine/solutions/marine-electric-propulsion/azipod/azipod-services)明确要求维护、干坞服务和状态监测。系统冗余、海水环境、密封和船型匹配页面是工程原理归纳，不是对这款国产设备故障状况的判断。供应商的节能宣传与具体船型、比较对象和工况有关，本模块不使用统一节能百分比。

用户视频页正文未能直接读取；本模块保留[原视频观看入口](https://www.bilibili.com/video/BV1FkvQefEKX/)，不声称已逐帧分析或听取其解说。
