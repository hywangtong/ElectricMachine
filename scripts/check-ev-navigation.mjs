import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
const load = (path, resolve = require, globals = {}) => {
  const context = { exports: {}, require: resolve, ...globals };
  vm.runInNewContext(compile(read(path)), context, { filename: path });
  return context.exports;
};

const pod = load('content/ship-pod.ts');
const course = load('content/course.ts', (id) =>
  id === '@/content/ship-pod' ? pod : require(id),
);
const playerSource = read('components/course-player.tsx');
const setup = playerSource.slice(
  playerSource.indexOf('const introTabAnchorId'),
  playerSource.indexOf('export default function'),
);
const mapping = { slides: course.slides };
vm.runInNewContext(
  compile(
    setup +
      '\nglobalThis.navigation = { courseSlides, findIntroTab, findCourseIndex };',
  ),
  mapping,
);
const { courseSlides, findCourseIndex } = mapping.navigation;
const anchorId = 'introduction-ev-principle';
const evIndex = findCourseIndex(anchorId);
const trendIndex = findCourseIndex('introduction-electrification-trend');
assert.ok(evIndex >= 0, '新能源汽车入口必须存在');
assert.equal(evIndex, trendIndex + 1, '新能源汽车应紧接独立趋势页');
assert.equal(courseSlides[evIndex].title, '新能源汽车技术路线');
assert.equal(courseSlides.filter((slide) => slide.kind === 'ev').length, 1);
assert.equal(
  courseSlides[evIndex + 1].id,
  'introduction-distributed-electric-propulsion',
);

const states = [evIndex, 'principle', false, false, '', 1];
let cursor = 0;
let effects = [];
const listeners = new Map();
const browser = {
  location: new URL('http://127.0.0.1/#' + anchorId),
  addEventListener: (name, listener) => listeners.set(name, listener),
  removeEventListener: (name) => listeners.delete(name),
};
const document = { addEventListener() {}, removeEventListener() {} };
const hooks = {
  ...React,
  useState(initial) {
    const slot = cursor++;
    if (states[slot] === undefined) states[slot] = initial;
    return [
      states[slot],
      (value) => {
        states[slot] = value;
      },
    ];
  },
  useRef: () => ({ current: null }),
  useCallback: (callback) => callback,
  useEffect: (effect) => effects.push(effect),
};
const Empty = () => null;
const Button = ({ children, disabled, ...props }) =>
  React.createElement(
    'button',
    { disabled, 'aria-label': props['aria-label'] },
    children,
  );
const ev = load('components/ev-roadmap.tsx');
const trend = load('components/electrification-trend.tsx');
const Player = load(
  'components/course-player.tsx',
  (id) => {
    if (id === 'react') return hooks;
    if (id === '@/content/course') return course;
    if (id === '@/components/ev-roadmap') return ev;
    if (id === '@/components/electrification-trend') return trend;
    if (id === '@/components/ui/button') return { Button };
    if (id === '@/components/ui/dialog') {
      return {
        Dialog: Empty,
        DialogContent: Empty,
        DialogDescription: Empty,
        DialogTitle: Empty,
      };
    }
    if (id === '@/components/chapter-galaxy') return { ChapterGalaxy: Empty };
    if (id === '@/components/ship-pod-explainer')
      return { ShipPodExplainer: Empty };
    if (id === '@/components/distributed-propulsion')
      return { DistributedPropulsion: Empty };
    return require(id);
  },
  { window: browser, document },
).default;
const render = () => {
  cursor = 0;
  effects = [];
  return renderToStaticMarkup(React.createElement(Player));
};
const findElement = (element, match) => {
  if (!React.isValidElement(element)) return undefined;
  if (match(element)) return element;
  for (const child of React.Children.toArray(element.props.children)) {
    const result = findElement(child, match);
    if (result) return result;
  }
  return undefined;
};

render();
effects[0]();
const syncHash = listeners.get('hashchange');
assert.equal(typeof syncHash, 'function');
const headings = {
  principle: '车轮怎么转？先追踪能量。',
  bev: '纯电动汽车',
  hev: '混合动力汽车',
  phev: '插电式混合动力汽车',
  erev: '增程式电动汽车',
  fcev: '氢燃料电池汽车',
  compare: '五条路线，一眼分清。',
  memory: '把缩写扔掉，把五幅画带走。',
};
for (const [page, heading] of Object.entries(headings)) {
  const id = 'introduction-ev-' + page;
  assert.equal(findCourseIndex(id), evIndex);
  cursor = 0;
  const lesson = findElement(
    Player(),
    (element) => element.type === ev.EvLesson,
  );
  assert.ok(lesson, '新能源汽车组件必须存在');
  lesson.props.onNavigate(id);
  assert.equal(states[0], evIndex, '点击标签必须留在容器');
  assert.equal(states[1], page, '点击标签必须选择对应内容');
  assert.equal(browser.location.hash, '#' + id);
  browser.location.hash = '#' + id;
  syncHash();
  assert.equal(states[0], evIndex, id + '必须留在同一容器');
  assert.equal(states[1], page, id + '必须选中对应标签');
  const html = render();
  assert.ok(html.includes(heading), id + '必须渲染对应内容');
  assert.ok(html.includes('五句话简述'));
  assert.match(
    html,
    /<button[^>]*class="selected"[^>]*>新能源汽车技术路线<\/button>/,
    id + '切换后容器入口必须保持高亮',
  );
  assert.ok(!html.includes('intro-trend-tabbed'));
}
browser.location.hash = '#introduction-electrification-trend';
syncHash();
assert.equal(states[0], trendIndex);
assert.ok(render().includes('电机正在'));
browser.location.hash = '#' + anchorId;
syncHash();
assert.equal(states[1], 'principle', '返回入口必须显示共同原理');
assert.ok(render().includes(headings.principle));
effects[2]();
const keyEvent = (key) => ({
  key,
  target: { closest: () => null },
  preventDefault() {},
});
listeners.get('keydown')(keyEvent('ArrowLeft'));
assert.equal(states[0], trendIndex, '左键必须返回独立趋势页');
render();
effects[2]();
listeners.get('keydown')(keyEvent('ArrowRight'));
assert.equal(states[0], evIndex, '右键必须进入新能源汽车容器');
assert.equal(states[1], 'principle');
assert.ok(render().includes(headings.principle));
console.log('新能源汽车回归检查通过：独立入口、8 个标签、哈希切换及目录高亮。');
