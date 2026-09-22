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
  const escaped = value.replace('.', '\\.');
  assert.match(
    html,
    new RegExp(` ${escaped}</b\\s*>`),
    `nameplate includes ${value}`,
  );
}

for (const symbol of ['P₁ = ?', 'Iₙ = ?', 'Tₙ = ?']) {
  assert.ok(html.includes(symbol), `motor diagram includes unknown ${symbol}`);
}

for (const result of ['11.29 kW', '51.3 A', '63.66 N·m']) {
  assert.ok(html.includes(result), `solution includes ${result}`);
}

assert.match(html, /known-tag/);
assert.match(html, /unknown-tag/);
assert.match(js, /page === 'solution'/);

console.log(
  'Nameplate example: plate values, colored mappings and results verified.',
);
