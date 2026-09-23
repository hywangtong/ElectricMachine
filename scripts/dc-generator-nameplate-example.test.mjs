import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(
  new URL('../public/dc-generator-nameplate-example.html', import.meta.url),
  'utf8',
);

for (const value of ['90', '230', '1450', '89.6']) {
  assert.match(html, new RegExp(`= <b>${value.replace('.', '\\.')}</b>`));
}

for (const result of ['100.45 kW', '661.51 N·m', '391.3 A']) {
  assert.ok(html.includes(result), `solution includes ${result}`);
}

assert.match(html, /class="solution-panel"[\s\S]*hidden/);
assert.match(html, /aria-expanded="false"/);
assert.match(html, /显示计算过程与答案/);
assert.match(
  html,
  /发电机铭牌上的 <i>P<sub>N<\/sub><\/i>[\s\S]*电端额定输出功率/,
);

console.log(
  'Generator exercise: hidden solution and reveal interaction verified.',
);
