import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  generatorState,
  GeneratorSimulation,
  clampRpm,
  generatorParameters,
} from '../public/dc-generator-model.js';

const near = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );
const peak = 0.02 * 2 * Math.PI;
near(generatorState(90, 60).coilEmf, peak);
near(generatorState(270, 60).coilEmf, -peak);
near(generatorState(90, 120).coilEmf, 2 * peak);
near(generatorState(90, 30).frequency, 0.5);
for (let angle = 0; angle <= 360; angle++) {
  const fixed = generatorState(angle, 60);
  const switched = generatorState(angle, 60, true);
  near(switched.outputEmf, Math.abs(fixed.coilEmf));
  near(fixed.outputEmf, fixed.coilEmf);
  near(generatorState(angle, 0).coilEmf, 0);
  near(generatorState(angle, 0, true).outputEmf, 0);
  // Independently differentiate linkage with respect to time.
  const dt = 1e-5;
  const before = generatorState(angle - 360 * dt, 60).linkage;
  const after = generatorState(angle + 360 * dt, 60).linkage;
  near(fixed.coilEmf, -(after - before) / (2 * dt), 1e-8);
}
for (const angle of [0, 180, 360]) {
  near(generatorState(angle, 60).coilEmf, 0);
  assert.equal(generatorState(angle, 60, true).contact, 0);
}
assert.equal(generatorState(179.9, 60, true).contact, 1);
assert.equal(generatorState(180.1, 60, true).contact, -1);
assert.equal(generatorState(359.9, 60, true).contact, -1);
assert.equal(generatorState(0.1, 60, true).contact, 1);
assert.equal(clampRpm(-10), 0);
assert.equal(clampRpm(999), 120);
assert.equal(clampRpm(NaN), 60);

for (const commutated of [false, true]) {
  const sim = new GeneratorSimulation(commutated);
  sim.advance(0.25);
  near(sim.angle, 90);
  near(sim.state.coilEmf, peak);
  near(sim.samples.at(-1).output, sim.state.outputEmf);
  sim.paused = true;
  const frozen = JSON.stringify(sim);
  sim.advance(30);
  assert.equal(JSON.stringify(sim), frozen);
  sim.paused = false;
  sim.advance(0.25);
  near(sim.angle, 180);
  near(sim.elapsed, 0.5);
  sim.setRpm(120);
  sim.advance(0.125);
  near(sim.angle, 270);
  sim.setRpm(0);
  const angle = sim.angle;
  sim.advance(1);
  near(sim.angle, angle);
  near(sim.samples.at(-1).output, 0);
  sim.setRpm(60);
  const oldHistory = JSON.stringify(sim.samples);
  sim.setRpm(30);
  assert.equal(JSON.stringify(sim.samples), oldHistory);
  sim.advance(12);
  assert.ok(sim.samples.length <= 970, 'history remains bounded');
  assert.ok(sim.samples[1].t >= sim.elapsed - 8);
  near(sim.samples.at(-1).t, sim.elapsed);
  sim.reset();
  assert.equal(sim.angle, 0);
  assert.equal(sim.elapsed, 0);
  assert.equal(sim.rpm, 60);
  assert.equal(sim.paused, false);
  assert.equal(sim.samples.length, 1);
}
console.log(
  'DC generator: Faraday signs, speed scaling, commutation, synchronized pause/resume, zero speed, history and reset passed.',
);

// Exercise the real page controller against a minimal DOM, including its RAF
// loop. This catches pause regressions that model-only tests cannot detect.
const controller = await readFile(
  new URL('../public/dc-generator-lesson.js', import.meta.url),
  'utf8',
);
for (const mode of ['slip-rings', 'commutated']) {
  const html = await readFile(
    new URL(
      `../public/dc-generator-${mode === 'commutated' ? 'commutator' : mode}.html`,
      import.meta.url,
    ),
    'utf8',
  );
  const handlers = new Map();
  const forwarded = [];
  let raf;
  function element(dataset = {}) {
    const listeners = new Map();
    const attrs = new Map();
    const captures = new Set();
    return {
      dataset,
      textContent: '',
      innerHTML: '',
      value: '',
      style: { setProperty() {} },
      addEventListener: (type, handler) => listeners.set(type, handler),
      setAttribute: (name, value) => attrs.set(name, value),
      attr: (name) => attrs.get(name),
      fire: (type, event = {}) => listeners.get(type)(event),
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      }),
      setPointerCapture: (id) => captures.add(id),
      hasPointerCapture: (id) => captures.has(id),
      releasePointerCapture: (id) => captures.delete(id),
      focus() {},
    };
  }
  const nodes = new Map(
    [...html.matchAll(/id="([^"]+)"/g)].map((match) => [match[1], element()]),
  );
  const presets = [0, 30, 60, 120].map((speed) =>
    element({ speed: String(speed) }),
  );
  const document = {
    body: { dataset: { mode } },
    documentElement: { style: { setProperty() {} } },
    hidden: false,
    activeElement: null,
    getElementById: (id) => nodes.get(id),
    querySelectorAll: () => presets,
    addEventListener: (type, handler) => handlers.set(type, handler),
  };
  vm.runInNewContext(
    controller.replace(/^import\s*\{[\s\S]*?\}\s*from[^;]+;/, ''),
    {
      document,
      GeneratorSimulation,
      generatorParameters,
      innerWidth: 1444,
      innerHeight: 744,
      requestAnimationFrame: (callback) => {
        raf = callback;
      },
      window: {
        addEventListener() {},
        parent: {
          document: { body: { dispatchEvent: (e) => forwarded.push(e) } },
        },
      },
      KeyboardEvent: class {
        constructor(type, options) {
          this.type = type;
          Object.assign(this, options);
        }
      },
    },
  );
  const node = (id) => nodes.get(id);
  raf(0);
  raf(100);
  assert.match(node('angle-reading').textContent, /36°/);
  assert.match(node('scope').innerHTML, /output-trace/);
  assert.equal(
    node('scope').innerHTML.includes('coil-trace'),
    mode === 'commutated',
  );
  node('pause').fire('click');
  const frozenMotor = node('motor').innerHTML;
  const frozenScope = node('scope').innerHTML;
  const frozenClock = node('clock').textContent;
  const frozenEmf = node('emf').textContent;
  raf(10000);
  presets[3].fire('click');
  raf(20000);
  assert.equal(node('motor').innerHTML, frozenMotor);
  assert.equal(node('scope').innerHTML, frozenScope);
  assert.equal(node('clock').textContent, frozenClock);
  assert.equal(node('emf').textContent, frozenEmf);
  assert.equal(node('knob').attr('aria-valuenow'), '120');
  node('pause').fire('click');
  raf(30000); // First resumed frame ignores the paused wall-clock interval.
  raf(30100);
  assert.match(node('angle-reading').textContent, /108°/);
  assert.match(node('clock').textContent, /t = 0.2 s/);
  presets[0].fire('click');
  raf(30200);
  assert.equal(node('emf').textContent, '+0.000 V');
  node('reset').fire('click');
  assert.equal(node('knob').attr('aria-valuenow'), '60');
  assert.equal(node('pause').attr('aria-pressed'), 'false');
  assert.match(node('angle-reading').textContent, /0°/);
  assert.match(node('clock').textContent, /t = 0.0 s/);
  const keyEvent = {
    key: 'ArrowRight',
    shiftKey: true,
    preventDefault() {},
    stopPropagation() {},
  };
  node('knob').fire('keydown', keyEvent);
  assert.equal(node('knob').attr('aria-valuenow'), '70');
  node('knob').fire('pointerdown', {
    button: 0,
    pointerId: 1,
    clientX: 15,
    clientY: 85,
    preventDefault() {},
  });
  assert.equal(node('knob').attr('aria-valuenow'), '0');
  node('knob').fire('pointermove', { pointerId: 1, clientX: 85, clientY: 85 });
  assert.equal(node('knob').attr('aria-valuenow'), '120');
  node('knob').fire('pointercancel', { pointerId: 1 });
  assert.equal(node('knob').hasPointerCapture(1), false);
  const plainTarget = { closest: () => null };
  const controlTarget = { closest: () => node('knob') };
  handlers.get('keydown')({ ...keyEvent, target: plainTarget });
  assert.equal(forwarded.at(-1).key, 'ArrowRight');
  const before = forwarded.length;
  for (const key of ['ArrowRight', ' ', 'Enter', 'Home'])
    handlers.get('keydown')({ ...keyEvent, key, target: controlTarget });
  assert.equal(forwarded.length, before);
  function swipe(target) {
    handlers.get('touchstart')({
      target,
      touches: [{ clientX: 200, clientY: 100 }],
    });
    handlers.get('touchend')({
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
  }
  swipe(controlTarget);
  assert.equal(forwarded.length, before);
  swipe(plainTarget);
  assert.equal(forwarded.at(-1).key, 'ArrowRight');
}
console.log(
  'DC generator page controller: RAF synchronization, frozen DOM, next-run speed, pointer/keyboard controls, reset and navigation passed.',
);
