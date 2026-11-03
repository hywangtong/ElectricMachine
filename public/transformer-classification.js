const assets = '/transformer-classification-assets/';
const commons = 'https://commons.wikimedia.org/wiki/File:';
const licenses = {
  bysa3: 'https://creativecommons.org/licenses/by-sa/3.0/',
  bysa4: 'https://creativecommons.org/licenses/by-sa/4.0/',
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
};
function link(url, title) {
  return `<a href="${url}" target="_blank" rel="noreferrer">${title} ↗</a>`;
}
function credit(file, author, license, licenseUrl) {
  return `<span class="credit">${link(commons + file, author + ' / Wikimedia Commons')} · ${link(licenseUrl, license)} · 等比缩放、转 WebP</span>`;
}
const coreCredit = credit(
  'Philips_N4422_-_power_supply_transformer-2098.jpg',
  'Raimond Spekking',
  'CC BY-SA 4.0',
  licenses.bysa4,
);
const shellCredit = credit(
  'Transformer.filament.agr.jpg',
  'Arnold Reinhold',
  'CC BY-SA 3.0',
  licenses.bysa3,
);
const resinCredit = credit(
  'Cast_resine_transformer.jpg',
  'STM guanajuato',
  'CC0',
  licenses.cc0,
);
const isolationCredit = credit(
  'Trenntransformator.jpg',
  'wdwd',
  'CC BY-SA 3.0',
  licenses.bysa3,
);
const powerCredit = `<span class="credit">${link('https://www.alldatasheetcn.com/datasheet-pdf/view/536104/PULSE/PA2047NL.html', 'Pulse / PA2047NL 手册系列图')} · © Pulse</span>`;
const oilCredit = `<span class="credit">${link('https://www.hitachi-ies.com/products/power/transformer/oil-immersed/', 'Hitachi Industrial Equipment Systems / 产品图')} · © 原厂家 · 等比缩放、转 WebP</span>`;
const applicationPowerCredit = `<span class="credit">${link('https://www.hitachienergy.cn/cn/zh/news-and-events/events-and-webinars/2026/05/customer-transformer-training-webinar-series-2026', 'Hitachi Energy / 官网实物图')} · © 原厂家 · 缩放、转 WebP</span>`;
const applicationCurrentCredit = `<span class="credit">${link('https://www.gecdurham.com/instrument_transformers', 'GEC Durham / 产品实物图')} · © 原厂家 · 转 WebP</span>`;
const applicationFurnaceCredit = credit(
  'Arc_Furnace_transformer_bus.jpg',
  'Wtshymanski',
  'CC BY-SA 3.0',
  licenses.bysa3,
);
function applicationPhoto(name, alt, caption, attribution) {
  return `<figure class="application-photo"><div class="application-photo-image"><img src="${assets}${name}.webp" alt="${alt}" /></div><figcaption>${caption}${attribution}</figcaption></figure>`;
}
function photo(name, alt, caption, attribution) {
  return `<figure class="panel photo"><div class="photo-image"><img src="${assets}${name}.webp" alt="${alt}" /></div><figcaption>${caption}${attribution}</figcaption></figure>`;
}
function classificationDiagram(label, drawing) {
  return `<svg class="classification-diagram" viewBox="0 0 360 130" role="img" aria-label="${label}">${drawing}</svg>`;
}
function waveform(x, cycles, phase = 0) {
  return Array.from({ length: 281 }, (_, i) => {
    const y = 61 - 28 * Math.sin((i / 280) * cycles * 2 * Math.PI + phase);
    return `${i ? 'L' : 'M'}${x + i / 2} ${y.toFixed(2)}`;
  }).join(' ');
}
const phaseDiagram = classificationDiagram(
  '单相是一组正弦电压；三相是三组相差120度的正弦电压',
  `<path class="axis" d="M15 61h140M205 61h140"/>
   <path class="signal" d="${waveform(15, 2)} ${waveform(205, 2)}"/>
   <path class="signal gold" d="${waveform(205, 2, (-2 * Math.PI) / 3)}"/>
   <path class="signal violet" d="${waveform(205, 2, (2 * Math.PI) / 3)}"/>
   <text x="85" y="119">单相 · 一组</text><text x="275" y="119">三相 · 三组相差 120°</text>`,
);
const windingDiagram = classificationDiagram(
  '分离绕组之间没有导线连接；自耦绕组有公共部分；双绕组与三绕组按每相绕组数区分',
  `<g class="winding"><path d="M22 15v8q22 0 0 12q22 0 0 12q22 0 0 12v10M80 15v8q-22 0 0 12q-22 0 0 12q-22 0 0 12v10"/>
   <path class="axis" d="M47 16v52M54 16v52"/>
   <path d="M140 13v8q22 0 0 12q22 0 0 12q22 0 0 12v12M140 45h27"/>
   <circle cx="140" cy="45" r="3" fill="currentColor"/>
   <path d="M235 15v8q18 0 0 12q18 0 0 12q18 0 0 12v10M289 13v7q-18 0 0 12v7M289 46v7q-18 0 0 12v7"/>
   <path class="axis" d="M259 15v55M266 15v55"/></g>
   <text x="51" y="94">分离绕组</text><text x="146" y="94">自耦</text><text x="266" y="94">三绕组示意</text>
   <text class="diagram-note" x="180" y="121">连接关系：分离／共用　数量：双／三／多绕组</text>`,
);
const frequencyDiagram = classificationDiagram(
  '同一时间窗内，工频波形周期少，中高频波形周期多',
  `<path class="axis" d="M15 61h140M205 61h140"/>
   <path class="signal" d="${waveform(15, 2)}"/>
   <path class="signal gold" d="${waveform(205, 9)}"/>
   <text x="85" y="108">工频 · 50 / 60 Hz</text><text x="275" y="108">中高频 · 周期更多</text>
   <text class="diagram-note" x="180" y="129">两图的时间窗相同</text>`,
);
const voltageDiagram = classificationDiagram(
  '按指定输入到输出方向比较电压：输出更高为升压，更低为降压，相同为等电压',
  `<g class="voltage-bars"><path d="M27 79V51h19v28M87 79V23h19v56M147 79V23h19v56M207 79V51h19v28M267 79V39h19v40M327 79V39h19v40"/></g>
   <g class="flow-arrows"><path d="M54 53h23m-7-6 7 6-7 6M174 53h23m-7-6 7 6-7 6M294 53h23m-7-6 7 6-7 6"/></g>
   <text x="66" y="105">升压</text><text x="186" y="105">降压</text><text x="306" y="105">等电压</text>
   <text class="diagram-note" x="180" y="129">柱高表示电压大小；箭头：输入 → 输出</text>`,
);
const pages = {
  overview: {
    title: '变压器分类，先问“按什么分？”',
    lead: '结构、介质与用途回答不同的问题；同一台设备可以同时属于多个类别。',
    body: `<div class="body three">
      <article class="panel tint"><div class="tag">01 / 铁芯结构</div><h2>铁芯与绕组怎样布置？</h2><p class="big">心式 · 壳式</p><p>看绕组套在铁芯的什么位置，磁路怎样闭合。</p><hr class="rule"/><p class="note">心式也写作“芯式”。<br/>环形铁芯作为常见结构补充认识。</p></article>
      <article class="panel warm"><div class="tag">02 / 绝缘与冷却介质</div><h2>内部靠什么绝缘、传热？</h2><p class="big">液浸式 · 干式</p><p>液浸式以油浸式最常见；干式包括树脂浇注、浸渍等结构。</p><hr class="rule"/><p class="note">自然冷却、风冷是进一步的冷却方式；“干式”不等于没有绝缘材料。</p></article>
      <article class="panel purple"><div class="tag">03 / 用途与功能</div><h2>放在哪里，完成什么任务？</h2><p class="big">输配电 · 测量 · 设备供电</p><p>电力变压器、互感器，以及控制、隔离、整流、焊接等用途。</p><hr class="rule"/><p class="note">用途名称可能交叉：电源变压器也可以提供电气隔离。</p></article>
    </div>`,
    takeaway:
      '先说分类依据，再说类别：不要把“心式、干式、隔离”当成互斥的三个选项。',
  },
  core: {
    title: '心式变压器：绕组套在铁芯柱上',
    lead: '先看实物，再用单相结构示意识别铁芯柱、铁轭与绕组。',
    body: `<div class="body structure">${photo('core', '小型心式电源变压器，两组可见铜线线圈分置于闭合铁芯的两侧', '小型心式实物：两组线圈分置两侧铁芯柱。', coreCredit)}
      <div class="stack"><article class="panel tint"><h2>识别重点：绕组包围铁芯柱</h2><p>上、下铁轭连接铁芯柱，构成闭合磁路。<br/>常见电力心式结构在每柱上同心套装高、低压绕组。</p></article>
      <figure class="panel diagram core-anatomy">
        <div class="core-figure-heading"><span>FIG. 01 / 单相心式</span><button type="button" class="core-section" aria-pressed="true">剖视：开</button></div>
        <object class="core-model" type="image/svg+xml" data="${assets}core-anatomy.svg" aria-label="两柱心式变压器同心绕组模型，可切换剖视并聚焦部件">单相心式：两根铁芯柱由上下铁轭连接，每柱套装内、外两层绕组。</object>
        <div class="core-figure-controls"><div class="core-legend" role="group" aria-label="聚焦模型部件">
          <button type="button" data-core-part="core" aria-pressed="false"><i class="key-core"></i>铁芯与铁轭</button>
          <button type="button" data-core-part="inner" aria-pressed="false"><i class="key-inner"></i>N₁ 内层</button>
          <button type="button" data-core-part="outer" aria-pressed="false"><i class="key-outer"></i>N₂ 外层</button>
        </div><span class="core-readout" aria-live="polite">同心套装 · 剖视</span></div>
        <figcaption>单相心式教学示意；蓝色虚线为交变主磁路的透视投影，不按匝数比例绘制。<br/><small>左侧实物为分置线圈；右图为同心绕组。剖口仅用于观察，实际绕组连续。三相心式常见三柱。</small></figcaption>
      </figure></div></div>`,
    takeaway: '判断心式看铁芯与绕组的位置关系；单相／三相是另一个分类维度。',
  },
  shell: {
    title: '单相壳式变压器：铁芯从两侧包围绕组',
    lead: '“壳式”的“壳”指铁芯布局，与外面有没有金属保护罩无关。',
    body: `<div class="body structure">${photo('shell', '单相叠片壳式变压器，线圈位于中部，可见上铁轭叠片与两侧铁芯', '单相壳式实物：观察中部线圈与两侧回磁铁芯。', shellCredit)}
      <div class="stack"><article class="panel warm"><h2>识别重点：两绕组同在中柱</h2><p>典型单相结构为三柱、两窗口。<br/>中柱主磁通在两侧分流，经侧柱与铁轭闭合。</p></article>
      <figure class="panel diagram core-anatomy shell-anatomy">
        <div class="core-figure-heading"><span>FIG. 02 / 单相壳式 · 中柱绕组</span><button type="button" class="core-section" aria-pressed="true">剖视：开</button></div>
        <object class="core-model" type="image/svg+xml" data="${assets}shell-anatomy.svg" aria-label="三柱双窗口壳式变压器，两绕组同在中柱，可切换剖视并聚焦部件">单相壳式：原、副绕组同在中柱，上下铁轭与两侧铁芯构成两条回磁支路。</object>
        <div class="core-figure-controls"><div class="core-legend" role="group" aria-label="聚焦模型部件">
          <button type="button" data-core-part="core" aria-pressed="false"><i class="key-core"></i>铁芯与铁轭</button>
          <button type="button" data-core-part="inner" aria-pressed="false"><i class="key-inner"></i>N₁ 原绕组</button>
          <button type="button" data-core-part="outer" aria-pressed="false"><i class="key-outer"></i>N₂ 副绕组</button>
        </div><span class="core-readout" aria-live="polite">中柱同心套装 · 剖视</span></div>
        <figcaption>点击图例聚焦部件；蓝色虚线为交变主磁路投影：中柱 Φ，两侧各约 Φ / 2（对称、忽略漏磁）。<br/><small>剖口仅用于观察；示例为同心绕组，实际也可交错布置。匝数、尺寸与动画时间不按实际比例；壳式不限于小容量。</small></figcaption>
      </figure></div></div>`,
    takeaway:
      '心式与壳式的区别在磁路和绕组布置；“单相壳式”同时给出了相数与结构。',
  },
  cooling: {
    title: '油浸式与干式：分的是绝缘与冷却介质',
    lead: '油浸式是液浸式的一种；树脂浇注是干式的一种。',
    body: `<div class="body two">
      <article class="panel media-card"><h2>油浸式变压器</h2>${photo('oil', '油浸式变压器，外部可见封闭油箱和散热片', '封闭油箱与外部散热片；铁芯、绕组位于箱内。', oilCredit)}<p>绝缘油包围绕组，兼顾绝缘与传热。<br/>常见于输配电、工厂及户外设施。</p><p class="note">可分油浸自冷、风冷、强迫油循环等。液浸式也可采用酯类等其他绝缘液体。</p></article>
      <article class="panel media-card"><h2>干式变压器</h2>${photo('resin', '三相树脂浇注干式变压器，三个浇注线圈与铁芯、底架清晰可见', '树脂浇注干式实物：绕组由固化树脂包封。', resinCredit)}<p>铁芯、绕组不浸绝缘液体，常用空气散热。<br/>常见于建筑配电等场所。</p><p class="note">含树脂浇注、浸渍式（如 VPI）；可自然空气冷却或强迫风冷。选用需核对环境与散热条件。</p></article>
    </div>`,
    takeaway:
      '看见裸露线圈不能直接判为油浸式；应结合油箱、结构资料与铭牌确认。',
  },
  applications: {
    title: '按用途分类：它在系统里负责什么？',
    lead: '以主要任务组织名称；同一设备的供电、隔离、测量等功能可能交叉。',
    body: `<div class="body two application-grid">
      <article class="panel tint"><div class="application-copy"><h2><span class="number">01</span>电力变压器</h2><p>在电力系统中传输、分配电能。发电机升压、变电站变压、末端配电降压。</p><small>本章后续运行分析的主要对象。</small></div>${applicationPhoto('application-power', '变电站中的日立能源电力变压器，可见高压套管、油箱和冷却风扇', '应用实例｜变电站电力变压器', applicationPowerCredit)}</article>
      <article class="panel warm"><div class="application-copy"><h2><span class="number">02</span>仪用互感器</h2><p>电压互感器（PT / VT）、电流互感器（CT）。按已知比例输出测量、计量或保护所需信号。</p><small>重点是信号比例与测量性能。</small></div>${applicationPhoto('application-current', 'GEC Durham 穿心式电流互感器，蓝色壳体中央有一次导体穿孔，顶部为二次接线端子', '应用实例｜穿心式电流互感器 CT', applicationCurrentCredit)}</article>
      <article class="panel purple"><div class="application-copy"><h2><span class="number">03</span>设备供电、控制与隔离</h2><p>电源变压器为电子设备等提供所需交流电压；控制变压器用于控制回路；隔离变压器强调隔离。</p><small>“电源变压器”在此指设备内部供电用途，区别于电网的“电力变压器”。</small></div>${applicationPhoto('isolation', '设备用单相隔离变压器实物，铭牌标注原边和副边均为230伏、容量100伏安', '应用实例｜230 V / 230 V 隔离变压器', isolationCredit)}</article>
      <article class="panel"><div class="application-copy"><h2><span class="number">04</span>其他专用变压器</h2><p>整流、电焊、电炉、试验等变压器。围绕负载特点、工作周期或试验任务设计。</p><small>名称描述应用，不能据名称推断必然是心式、壳式、油浸式或干式。</small></div>${applicationPhoto('application-furnace', '电弧炉变压器检修时取出油箱的器身，可见粗大的铜母排、铁芯和绕组', '应用实例｜电弧炉变压器（检修器身）', applicationFurnaceCredit)}</article>
    </div>`,
    takeaway:
      '用途分类的主线：传送电能、取得测量信号、为设备供电，或完成专门任务。',
  },
  isolation: {
    title: '隔离变压器与电源变压器，可以是同一台',
    lead: '“隔离”强调原、副边的电气关系；“电源”强调给设备供电的用途。',
    body: `<div class="body two functional">
      <article class="panel tint"><h2>隔离变压器：原、副绕组电气分离</h2>
        <div class="functional-intro"><div><p>两绕组无导线相连，靠交变磁通传能。</p><p>常见 1∶1，也可升压或降压。<br/>实物：230 V / 230 V、100 VA。</p></div><figure><img src="${assets}isolation.webp" alt="隔离变压器，铭牌原边与副边均为230伏，额定容量100伏安"/>${isolationCredit}</figure></div>
        <figure class="principle isolation-principle"><img src="${assets}isolation-principle.svg" alt="交流源接原绕组，交变磁通沿铁芯耦合到副绕组，副边连接负载；两侧没有导线跨接"/><figcaption>交流输入 → 交变磁通 → 副边感应电压</figcaption></figure>
        <p class="note">电气隔离不自动等同“安全隔离”；<br/>自耦变压器有公共绕组，不提供这种隔离。</p>
        <a class="appendix-link" href="/isolation-transformer-eli5.html#s3" target="_blank" rel="noreferrer">附页二 · 分步看隔离传能 ↗</a>
      </article>
      <article class="panel warm power-panel"><h2>电源变压器：为设备内部供电</h2>
        <div class="functional-intro"><div><p>图示为 Pulse 高频绕线变压器，<br/>用于开关电源，常用铁氧体磁芯。</p><p>分离绕组既能变压，也能隔离。</p></div><figure><img src="${assets}power-pa2047nl.webp" alt="Pulse PA2047NL 所属 EFD20 系列手册的贴片高频变压器实物图"/>${powerCredit}</figure></div>
        <iframe class="power-animation" src="/transformer-eli5.html?embed=flyback" title="反激开关电源工作原理动画：导通储能、关断释能"></iframe>
        <a class="appendix-link" href="/transformer-eli5.html#working-principle" target="_blank" rel="noreferrer">附页一 · 04 工作原理完整说明 ↗</a>
      </article>
    </div>`,
    takeaway:
      '“隔离”和“电源”可以同时成立；电压是否改变，与原、副边是否直接导通是两回事。',
  },
  synthesis: {
    title: '一台变压器，可以贴上多个分类标签',
    lead: '看波形、看接线、比电压：每个分类维度各答一个问题，标签可以组合。',
    body: `<div class="body synthesis"><div class="dimensions">
      <article class="panel dimension"><h2><span>01</span>相数：几组交流电？</h2>${phaseDiagram}<small>三相：一台三相变压器，或单相变压器组。</small></article>
      <article class="panel dimension"><h2><span>02</span>绕组：怎样连接？有几组？</h2>${windingDiagram}<small>连接关系与数量分别说明；图为简化接线。</small></article>
      <article class="panel dimension"><h2><span>03</span>频率：变化有多快？</h2>${frequencyDiagram}<small>磁芯材料与结构随频率、用途选择。</small></article>
      <article class="panel dimension"><h2><span>04</span>变压作用：电压怎样变？</h2>${voltageDiagram}<small>升、降、等电压均相对于指定输入与输出侧。</small></article>
    </div><article class="panel tint label-example"><div><div class="tag">把标签贴到同一台设备 / 假设示例</div><h2>一台建筑配电用变压器</h2></div>
      <figure class="label-map"><div class="device-tags"><span><small>相数</small>三相</span><span><small>铁芯结构</small>心式</span><span><small>绝缘介质</small>树脂浇注干式</span></div><img src="${assets}resin.webp" alt="三相树脂浇注干式变压器实物；周围标签为建筑配电假设示例，并非由照片确认的铭牌参数"/><div class="device-tags"><span><small>绕组数量</small>双绕组</span><span><small>工作频率</small>50 Hz</span><span><small>变压作用</small>降压</span></div><figcaption><b>用途：配电用</b><span>同一台设备 · 七个维度</span>${resinCredit}</figcaption></figure>
      <div class="classification-question"><h3>课堂判断</h3><p>单相 ＋ 壳式 ＋ 干式 ＋ 电源用 ＋ 带隔离功能？</p><p class="note"><b>可以同时成立。</b>实际分类需核对结构资料与铭牌，照片仅辅助认识外形。</p></div>
    </article></div>`,
    takeaway:
      '认识实物 → 说出分类依据 → 组合多个标签，再进入结构、原理与运行分析。',
  },
};
const requestedPage = new URLSearchParams(location.search).get('page');
const pageKey = Object.hasOwn(pages, requestedPage)
  ? requestedPage
  : 'overview';
const page = pages[pageKey];
document.title = page.title;
document.querySelector('.lesson').innerHTML =
  `<header><div class="eyebrow">变压器 / 分类导入</div><span class="counter">${String(Object.keys(pages).indexOf(pageKey) + 1).padStart(2, '0')} / 07</span><h1>${page.title}</h1><p class="lead">${page.lead}</p></header>${page.body}<footer class="takeaway">${page.takeaway}</footer>`;

if (pageKey === 'core' || pageKey === 'shell') {
  const figure = document.querySelector('.core-anatomy');
  const model = figure.querySelector('.core-model');
  const sectionButton = figure.querySelector('.core-section');
  const partButtons = [...figure.querySelectorAll('[data-core-part]')];
  const readout = figure.querySelector('.core-readout');
  let section = true;
  let focus = 'all';
  let visible = false;
  const arrangement = pageKey === 'shell' ? '中柱同心套装' : '同心套装';
  const update = () => {
    const svg = model.contentDocument?.documentElement;
    if (svg?.localName !== 'svg') return;
    svg.dataset.view = section ? 'section' : 'full';
    svg.dataset.focus = focus;
    svg.dataset.running = String(visible && !document.hidden);
  };
  model.addEventListener('load', update);
  sectionButton.addEventListener('click', () => {
    section = !section;
    sectionButton.setAttribute('aria-pressed', String(section));
    sectionButton.textContent = `剖视：${section ? '开' : '关'}`;
    readout.textContent = `${arrangement} · ${section ? '剖视' : '完整'}`;
    update();
  });
  for (const button of partButtons) {
    button.addEventListener('click', () => {
      focus =
        focus === button.dataset.corePart ? 'all' : button.dataset.corePart;
      for (const other of partButtons) {
        other.setAttribute(
          'aria-pressed',
          String(other.dataset.corePart === focus),
        );
      }
      update();
    });
  }
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    update();
  }).observe(figure);
  document.addEventListener('visibilitychange', update);
  // Keep focus inside the course document so its navigation stays available.
  model.setAttribute('tabindex', '-1');
  update();
}

function resize() {
  document.documentElement.style.setProperty(
    '--lesson-scale',
    Math.min(innerWidth / 1444, innerHeight / 744),
  );
}
window.addEventListener('resize', resize);
resize();

// Keep native source-link activation; forward course navigation from the iframe.
document.addEventListener('keydown', (event) => {
  if (
    window.parent === window ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (
    event.key === ' ' &&
    event.target.closest('a, button, input, select, textarea')
  )
    return;
  const keys = [
    'ArrowRight',
    'ArrowLeft',
    'ArrowUp',
    'ArrowDown',
    'PageDown',
    'PageUp',
    'Home',
    'End',
    ' ',
    'f',
    'F',
    'm',
    'M',
    'Escape',
  ];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  window.parent.document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: event.key, bubbles: true }),
  );
});
let touchStart = null;
document.addEventListener(
  'touchstart',
  (event) => {
    if (event.target.closest('a, button, input, select, textarea')) return;
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  },
  { passive: true },
);
document.addEventListener(
  'touchend',
  (event) => {
    const start = touchStart;
    touchStart = null;
    if (!start || window.parent === window) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) <= 60 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    window.parent.document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: dx < 0 ? 'ArrowRight' : 'ArrowLeft',
        bubbles: true,
      }),
    );
  },
  { passive: true },
);
document.addEventListener(
  'touchcancel',
  () => {
    touchStart = null;
  },
  { passive: true },
);
