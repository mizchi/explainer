// 使った道具の版（package.json を直接読む。どれも exports で package.json を出していないため）
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
for (const p of ['vega', 'vega-lite', 'ml-matrix']) {
  const dir = require.resolve(p).replace(/(node_modules\/[^/]+).*/, '$1');
  console.log(`${p} ${JSON.parse(readFileSync(`${dir}/package.json`, 'utf8')).version}`);
}
