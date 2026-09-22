import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(
  new URL('../public/dc-generator-nameplate-example.html', import.meta.url),
  'utf8',
);

for (const value of ['90', '230', '1450', '89.6']) {
  const escaped = value.replace('.', '\\.');
  assert.match(
    html,
    new RegExp(` ${escaped}</b\\s*>`),
    `nameplate includes ${value}`,
  );
}

for (const symbol of ['P₁ = ?', 'T₁ = ?', 'Iₙ = ?']) {
  assert.ok(html.includes(symbol), `generator diagram includes ${symbol}`);
}

for (const result of ['100.45 kW', '661.51 N·m', '391.3 A']) {
  assert.ok(html.includes(result), `solution includes ${result}`);
}

assert.match(html, /机械能输入 → 电磁转换 → 电能输出/);
assert.match(html, /发电机铭牌[^<]*<i>P<sub>N<\/sub><\/i> 是电端额定输出功率/);

console.log(
  'Generator nameplate example: values, energy flow and results verified.',
);
