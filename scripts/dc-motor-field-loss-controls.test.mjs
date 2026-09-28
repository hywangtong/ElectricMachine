import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as model from '../public/dc-motor-field-loss-model.mjs';

// Exercise the actual page's event handlers and animation frames with a small
// DOM harness. Numerical physics is checked by dc-motor-field-loss.test.mjs.
const html = readFileSync('public/dc-motor-field-loss.html', 'utf8');
const elements = new Map();
for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
  const listeners = new Map();
  const attributes = new Map();
  elements.set(id, {
    value: id === 'residual' ? '5' : '0',
    disabled: false,
    checked: false,
    dataset: {},
    textContent: '',
    classList: { toggle() {} },
    style: { setProperty() {} },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    emit(type) {
      if (this.disabled) return;
      listeners.get(type)?.();
    },
  });
}
const $ = (id) => elements.get(id);
let scheduledFrame;
let now = 0;
const source = readFileSync('public/dc-motor-field-loss.js', 'utf8');
runInNewContext(source.replace(/^import[\s\S]*?;\r?\n/gm, ''), {
  ...model,
  p: model.parameters,
  document: { hidden: false, getElementById: $, addEventListener() {} },
  matchMedia: () => ({ matches: false }),
  requestAnimationFrame: (callback) => {
    scheduledFrame = callback;
  },
});
function advance(seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) {
    now += 1000 / 60;
    scheduledFrame(now);
  }
}
function assertIntersection(scenario) {
  const point = $('point');
  const expectedX = 65 + (model.loads[scenario] / 80) * 740;
  assert.equal(
    Number(point.getAttribute('cx')),
    expectedX,
    'working point must stay on TL',
  );
  if (point.getAttribute('visibility') === 'hidden') {
    assert.match($('offscreen').textContent, /无正转速工作点/);
    return;
  }
  const [x1, y1, x2, y2] = $('current-curve')
    .getAttribute('d')
    .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)
    .map(Number);
  const cy = Number(point.getAttribute('cy'));
  const area = (expectedX - x1) * (y2 - y1) - (cy - y1) * (x2 - x1);
  assert.ok(
    Math.abs(area) < 1e-6,
    'working point must also lie on the current mechanical curve',
  );
}
assert.equal(
  $('time').disabled,
  false,
  'timeline must be usable before playing',
);
for (const scenario of ['light', 'heavy']) {
  $(scenario).emit('click');
  assert.equal(
    $('field-state').textContent,
    '已断开',
    'scenario button must start field loss',
  );
  assert.equal($('pause').disabled, false);
  const initialCurve = $('current-curve').getAttribute('d');
  const initialPoint = $('point').getAttribute('cy');
  advance(1);
  assert.notEqual(
    $('current-curve').getAttribute('d'),
    initialCurve,
    'curve must animate',
  );
  assert.notEqual(
    $('point').getAttribute('cy'),
    initialPoint,
    'operating point must move',
  );
  assert.ok(Number($('time').value) > 0, 'timeline must advance');
  assertIntersection(scenario);
  $('pause').emit('click');
  const frozenTime = $('time').value;
  advance(1);
  assert.equal($('time').value, frozenTime, 'pause must freeze the animation');
  $('time').value = $('time').max;
  $('time').emit('input');
  assert.match(
    $('status').textContent,
    scenario === 'light' ? /飞车风险/ : /已堵转/,
  );
  assertIntersection(scenario);
  for (const fraction of [0.05, 0.15, 0.3, 0.5, 0.75]) {
    $('time').value = fraction * Number($('time').max);
    $('time').emit('input');
    assertIntersection(scenario);
  }
}
$('reset').emit('click');
assert.equal($('time').disabled, false, 'reset must not disable replay');
$('time').value = $('time').max;
$('time').emit('input');
assert.match(
  $('status').textContent,
  /已堵转/,
  'scrub must work without a separate fault click',
);
console.log(
  'Field-loss controls: one-click scenarios, curve/point motion, timeline, pause and reset passed.',
);
