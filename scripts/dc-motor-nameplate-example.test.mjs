import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(
  new URL('../public/dc-motor-nameplate-example.html', import.meta.url),
  'utf8',
);
const js = await readFile(
  new URL('../public/dc-motor-nameplate-example.js', import.meta.url),
  'utf8',
);

for (const value of ['10', '220', '1500', '88.6']) {
  assert.match(html, new RegExp(`= <b>${value.replace('.', '\\.')}</b>`));
}

for (const result of ['11.29 kW', '51.3 A', '63.66 N·m']) {
  assert.ok(html.includes(result), `solution includes ${result}`);
}

assert.match(html, /class="solution-panel"[\s\S]*hidden/);
assert.match(html, /aria-expanded="false"/);
assert.match(html, /显示计算过程与答案/);
assert.match(js, /addEventListener\('click'/);
assert.match(js, /solution\.hidden = !revealed/);

console.log('Motor exercise: hidden solution and reveal interaction verified.');
