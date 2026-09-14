import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(
  new URL('../public/dc-machine-uses-types.js', import.meta.url),
  'utf8',
);
const handlers = new Map();
const lesson = { dataset: { mode: 'motor' } };
const labels = new Map(
  ['machine-role', 'electrical-port', 'mechanical-port'].map((id) => [
    id,
    { textContent: '' },
  ]),
);
const buttons = ['motor', 'generator'].map((mode) => ({
  dataset: { mode },
  pressed: mode === 'motor' ? 'true' : 'false',
  addEventListener(type, handler) {
    this[type] = handler;
  },
  setAttribute(_name, value) {
    this.pressed = value;
  },
}));
const forwarded = [];
const document = {
  querySelector: () => lesson,
  querySelectorAll: () => buttons,
  getElementById: (id) => labels.get(id),
  addEventListener: (type, handler) => handlers.set(type, handler),
};
vm.runInNewContext(source, {
  document,
  window: {
    parent: { document: { body: { dispatchEvent: (e) => forwarded.push(e) } } },
  },
  KeyboardEvent: class {
    constructor(type, options) {
      this.type = type;
      Object.assign(this, options);
    }
  },
});

for (const [button, role, electrical, mechanical] of [
  [buttons[1], '发电机', '输出', '输入'],
  [buttons[0], '电动机', '输入', '输出'],
]) {
  button.click();
  assert.equal(lesson.dataset.mode, button.dataset.mode);
  assert.equal(labels.get('machine-role').textContent, role);
  assert.equal(labels.get('electrical-port').textContent, electrical);
  assert.equal(labels.get('mechanical-port').textContent, mechanical);
  assert.equal(button.pressed, 'true');
  assert.equal(
    buttons.find((candidate) => candidate !== button).pressed,
    'false',
  );
}

const plainTarget = { closest: () => null };
const buttonTarget = { closest: () => buttons[0] };
const key = (value, target = plainTarget, extra = {}) =>
  handlers.get('keydown')({
    key: value,
    target,
    preventDefault() {},
    ...extra,
  });
key('ArrowRight', buttonTarget);
assert.equal(forwarded.at(-1).key, 'ArrowRight');
const before = forwarded.length;
key(' ', buttonTarget);
key('Enter', buttonTarget);
key('ArrowRight', plainTarget, { ctrlKey: true });
assert.equal(forwarded.length, before);

const swipe = (dx, dy = 0, target = plainTarget) => {
  handlers.get('touchstart')({
    target,
    touches: [{ clientX: 200, clientY: 100 }],
  });
  handlers.get('touchend')({
    changedTouches: [{ clientX: 200 + dx, clientY: 100 + dy }],
  });
};
swipe(-100);
assert.equal(forwarded.at(-1).key, 'ArrowRight');
swipe(100);
assert.equal(forwarded.at(-1).key, 'ArrowLeft');
const after = forwarded.length;
swipe(60);
swipe(90, 60);
swipe(-100, 0, buttonTarget);
assert.equal(forwarded.length, after);
console.log('DC machine role switching, keyboard and swipe checks passed.');
