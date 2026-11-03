# 变压器分类：图片与技术资料

查阅日期：2026-11-03。实物图用于变压器章的分类导入，全部由本地 WebP 文件加载。
仅作原图提取、等比缩放和格式转换，没有重绘、生成或增删设备部件。完整下载地址见 `sources.json`。

## 实物图片

- `core.webp`：[Philips N4422 电源变压器](https://commons.wikimedia.org/wiki/File:Philips_N4422_-_power_supply_transformer-2098.jpg)。Raimond Spekking，CC BY-SA 4.0。下载原图 3178 × 3178，课件图 1600 × 1600。由可见的两侧线圈与闭合铁芯位置关系识别为心式实物；不由照片推断额定参数。该实物为分置线圈，课件另绘电力心式常见的同心绕组示意，明确两者布置差别。
- `shell.webp`：[Transformer.filament.agr.jpg](https://commons.wikimedia.org/wiki/File:Transformer.filament.agr.jpg)。Arnold Reinhold，CC BY-SA 3.0（同时另有其他许可，课件采用此许可）。原图 769 × 550。单相叠片壳式、电子管灯丝供电实例。作者说明 115 V AC / 6.3 V AC。依据中心线圈与两侧回磁铁芯识别结构；不把“壳式”等同金属外罩。
- `oil.webp`：[Hitachi Industrial Equipment Systems — Oil-immersed Transformers](https://www.hitachi-ies.com/products/power/transformer/oil-immersed/)。716 × 716 厂家公开产品图，© 原厂家，未声明开放许可。来源明确标注油浸式；课件不把它误称为大型输电变压器。保留厂家署名和原页面链接，厂家版权不因下载或格式转换而改变。
- `resin.webp`：[Cast resine transformer.jpg](https://commons.wikimedia.org/wiki/File:Cast_resine_transformer.jpg)。STM guanajuato，CC0。使用共享资源提供的 1280 × 1275 缩略图。三相树脂浇注干式，完整三柱正面实物；不据外形指定容量与电压。
- `isolation.webp`：[Trenntransformator.jpg](https://commons.wikimedia.org/wiki/File:Trenntransformator.jpg)。wdwd，CC BY-SA 3.0。1155 × 1262。实物铭牌 230 V / 230 V、100 VA，用于说明等电压隔离实例。
- `power-pa2047nl.webp`：用户指定 [PA2047NL 数据手册页面](https://www.alldatasheetcn.com/datasheet-pdf/view/536104/PULSE/PA2047NL.html)，内容为 Pulse P666、EFD20 SMT 高频绕线变压器系列。指定站点返回访问验证页，实际图片从 [Pulse P666.A（03/08）原厂手册的公开镜像](https://prod-parts-data.s3.amazonaws.com/PA1736NLT/datasheet/1_PA1736NLT-Pulse-datasheet-8617364.pdf) 首页直接提取，228 × 217，转 WebP；该手册包含 PA2047NL。© Pulse，未声明开放许可。标注为“手册系列图”，不将系列首页照片当成 PA2047NL 独立型号的实拍鉴定，也未声称已逐像素比对无法读取的指定站点版本。
- `application-power.webp`：[Hitachi Energy — Customer Transformer Training Webinar Series](https://www.hitachienergy.cn/cn/zh/news-and-events/events-and-webinars/2026/05/customer-transformer-training-webinar-series-2026)。厂家官网展示的变电站电力变压器照片，2048 × 1097，课件图 1920 × 1028。© Hitachi Energy，未声明开放许可；保留厂家署名及原页面链接。用途分类第一块的电力变压器实例，不由照片指定电压、容量或项目名称。
- `application-current.webp`：[GEC Durham — Instrument Transformers](https://www.gecdurham.com/instrument_transformers)。Type TCW 穿心式电流互感器产品实物图，实际下载 1500 × 1626（CDN 文件名含 1920w，不作为实际分辨率）。© GEC Durham Industries，未声明开放许可；保留厂家署名及原页面链接。用途分类第二块的 CT 实例，不将它标成电压互感器。
- 用途分类第三块复用上述 `isolation.webp`，作为设备供电／控制／隔离中的隔离用途实例，不表示每台控制或电源变压器都具有图示参数。
- `application-furnace.webp`：[Arc Furnace transformer bus.jpg](https://commons.wikimedia.org/wiki/File:Arc_Furnace_transformer_bus.jpg)。Wtshymanski，CC BY-SA 3.0，1600 × 1200。用途分类第四块的电弧炉变压器实例：原作者说明为检修时取出绝缘油的器身，可见粗铜母排、铁芯和绕组，不能将裸露器身误称为正常运行的干式产品。仅转 WebP，未裁切或改动设备内容。

图片署名、来源和许可链接也显示在相应课堂页面。BY-SA 图片的缩放与转码版本沿用对应许可；许可不扩展到网站中其他独立内容。

## 技术核查

- `isolation-principle.svg`：从本工程附页二 `public/isolation-transformer-eli5.html#s3` 的 `#mech` 原图提炼，保留交流源、分离绕组、共用铁芯、交变磁通和副边负载；省略分步交互和外围文案，补充“无导线跨接”标注。分类页保留到原分步图的导航。
- 分类页开关电源流程复用本工程附页一 `public/transformer-eli5.html` 第 2 节的五步链路与 SVG 图标，省略特定示例的 48 V、5 V / 9 A，避免误当成 PA2047NL 的参数。为该节新增 `#power-chain` 锚点；下一节之后的反激导通／关断动画保留在完整附页。
- `shell-anatomy.svg`：本课程用 Anatomy 的 MIT SVG kit 自绘的单相壳式教学模型。上下铁轭、中柱及两侧柱形成三柱双窗口；两层绕组均套在中柱，本例用同心套装表达原、副绕组位置关系，实际也可交错布置。蓝色虚线为交变主磁路透视投影；在对称、忽略漏磁的教学假设下，中柱 Φ、每侧约 Φ/2。中柱截面示意为侧柱的两倍，非产品尺寸。四分之一剖口仅用于观察，绕组分段不代表指定匝数，动画时间也非实际电气周期。生成与几何校核入口为 `node scripts/build-transformer-shell-anatomy.mjs --audit`，依赖本机 Anatomy 技能（默认 `~/.agents/skills/anatomy`，或 `ANATOMY_SKILL_DIR`）；站点仅加载本地 SVG。
- [Hitachi Energy — Shell type transformers](https://www.hitachienergy.com/us/en/products-and-solutions/transformers/power-transformers/generator-step-up-transformers-gsu/shell-type-transformers)：核对原、副绕组位于同一柱并由铁芯包围的结构关系；模型不复刻其产品或指定尺寸。
- `core-anatomy.svg`：本课程用 Anatomy 的 MIT SVG kit 自绘的等轴测单相心式结构模型，并非厂家产品图。两柱各套内外同心绕组，默认前侧四分之一剖视；剖口、绕组分段和蓝色主磁路投影仅用于结构教学，不代表实际缺口、指定匝数或尺寸比例。生成入口为 `scripts/build-transformer-core-anatomy.mjs`，可用 `node scripts/build-transformer-core-anatomy.mjs --audit` 重新生成与校核；需要本机 Anatomy 技能（默认 `~/.agents/skills/anatomy`，或通过 `ANATOMY_SKILL_DIR` 指定）。站点运行仅使用已生成的本地 SVG。
- [Hitachi Energy — Core type transformers](https://www.hitachienergy.com/me/en/products-and-solutions/transformers/power-transformers/generator-step-up-transformers-gsu/core-type-transformers)：核对叠片硅钢铁芯与柱外圆筒绕组的基本位置关系；本课程未照搬其产品图片或指定设备尺寸。

- [Hitachi Energy — Dry-type distribution transformers](https://www.hitachienergy.com/products-and-solutions/transformers/distribution-transformers/dry-type-transformers)：干式不止树脂浇注，还包括开放绕组等结构。
- [Hitachi Energy — Open wound transformers](https://www.hitachienergy.cn/in/en/products-and-solutions/transformers/distribution-transformers/dry-type-transformers/open-wound-transformers)：VPI、VPE 等工艺及通风干式应用。
- [Hammond Power Solutions — What is an isolation transformer?](https://americas.hammondpowersolutions.com/resources/faq/general/isolation-transformer)：分离绕组通过共同磁场耦合，自耦结构不提供同类原副边电气隔离。
- [Hammond Manufacturing — 169S](https://www.hammfg.com/electronics/transformers/line/169s)：115 V / 115 V 工频隔离变压器实例。
- [Hammond Manufacturing — 166](https://www.hammfg.com/electronics/transformers/power/166)：设备供电用工频变压器、低压交流输出及分离骨架实例。
- [Hitachi Energy — Instrument transformers](https://www.hitachienergy.com/uk-ie/en/products-and-solutions/instrument-transformers)：电流、电压按已知比例转换，用于测量、计量、保护。
- [LD DIDACTIC / Leybold — Transformer core, demountable](https://www.leybold-shop.com/transformer-core-demountable-59321.html)：U 形铁芯、铁轭和绕组套装的实物结构核对。

用户参考图只作为教学意图参考，没有把图内标题视为可靠的设备鉴定依据。尤其图三没有展示油箱或油浸状态，不能据此确认“油浸式”；已替换为明确标注的油浸产品图。图四仅凭低清外观无法确定工艺，不将所有干式都称为树脂浇注。
