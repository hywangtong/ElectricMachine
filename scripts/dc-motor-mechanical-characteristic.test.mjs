import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = (
  await readFile(
    new URL('../public/dc-motor-mechanical-characteristic.js', import.meta.url),
    'utf8',
  )
).replace(/^import .*;\r?\n/gm, '');

function lesson(isDrive) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        value: { voltage: 220, resistance: isDrive ? 0 : 1, flux: 20 }[id],
        textContent: '',
        attributes: {},
        dataset: {},
        listeners: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        addEventListener(name, callback) {
          this.listeners[name] = callback;
        },
      });
    }
    return elements.get(id);
  };
  vm.runInNewContext(source, {
    document: {
      getElementById: element,
      querySelector: () => ({
        dataset: { characteristic: isDrive ? 'drive' : undefined },
      }),
    },
  });
  return {
    element,
    change(id, value) {
      element(id).value = value;
      element(id).listeners.input();
    },
    reset() {
      element('reset').listeners.click();
    },
  };
}

const slope = (resistance, fluxMilli) =>
  (resistance / (10 * (600 / (2 * Math.PI)) * (fluxMilli / 1000) ** 2)).toFixed(
    2,
  ) + ' (r/min)/(N·m)';

await test('drive baseline uses fixed armature resistance and zero external resistance', () => {
  const page = lesson(true);
  assert.equal(page.element('resistance-value').textContent, '0.0 Ω');
  assert.equal(page.element('no-load').textContent, '1100 r/min');
  assert.equal(page.element('slope').textContent, slope(1, 20));
  assert.equal(
    page.element('current-curve').attributes.d,
    page.element('reference-curve').attributes.d,
  );
  assert.equal(page.element('slope-ratio').textContent, 'γ / γ固有 = 1.00');
  assert.match(
    page.element('chart-description').textContent,
    /外串电阻 0.0 Ω.*固有曲线/,
  );
});

await test('adding external resistance preserves intercept and increases slope by total resistance', () => {
  const page = lesson(true);
  const reference = page.element('reference-curve').attributes.d;
  page.change('resistance', 2);
  assert.equal(page.element('no-load').textContent, '1100 r/min');
  assert.equal(page.element('slope').textContent, slope(3, 20));
  assert.equal(page.element('slope-ratio').textContent, 'γ / γ固有 = 3.00');
  assert.equal(page.element('hardness').dataset.kind, 'soft');
  assert.equal(page.element('reference-curve').attributes.d, reference);
});

await test('lowering voltage moves curve in parallel; weakening flux raises intercept and slope', () => {
  const page = lesson(true);
  page.change('voltage', 110);
  assert.equal(page.element('no-load').textContent, '550 r/min');
  assert.equal(page.element('slope').textContent, slope(1, 20));
  assert.equal(page.element('hardness').dataset.kind, 'same');
  page.reset();
  page.change('flux', 10);
  assert.equal(page.element('no-load').textContent, '2200 r/min');
  assert.equal(page.element('slope').textContent, slope(1, 10));
  assert.equal(page.element('slope-ratio').textContent, 'γ / γ固有 = 4.00');
  assert.equal(page.element('hardness').dataset.kind, 'soft');
});

await test('reset restores all natural parameters after combined adjustments', () => {
  const page = lesson(true);
  page.change('voltage', 80);
  page.change('resistance', 5);
  page.change('flux', 10);
  assert.equal(page.element('slope').textContent, slope(6, 10));
  page.reset();
  assert.equal(page.element('voltage').value, 220);
  assert.equal(page.element('resistance').value, 0);
  assert.equal(page.element('flux').value, 20);
  assert.equal(
    page.element('current-curve').attributes.d,
    page.element('reference-curve').attributes.d,
  );
  assert.equal(page.element('hardness').dataset.kind, 'same');
});

await test('theory chapter retains original adjustable armature resistance, labels and defaults', () => {
  const page = lesson(false);
  assert.equal(page.element('resistance-value').textContent, '1.0 Ω');
  assert.equal(page.element('slope-ratio').textContent, 'k / k默认 = 1.00');
  page.change('resistance', 0.2);
  assert.equal(page.element('slope').textContent, slope(0.2, 20));
  assert.equal(page.element('hardness').dataset.kind, 'hard');
  page.reset();
  assert.equal(page.element('resistance').value, 1);
  assert.match(page.element('chart-description').textContent, /默认曲线/);
});
