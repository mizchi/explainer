// figure-check.mjs の回帰テスト：悪い図はそれぞれの検査で落ち、良い図は通る
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const tool = join(here, '../../skills/explainer/scripts/figure-check.mjs');
const aaTool = join(here, '../../skills/explainer/scripts/aa-check.mjs'); // .txt（端末に出す AA）
const cases = [
  ['good.svg', null],
  ['line-through.svg', /a line runs through/],
  ['crosses-edge.svg', /cross a box edge/],
  ['overlap.svg', /text overlap/],
  ['clipped.svg', /outside the figure/],
  ['nested-edges.d2', null],
  ['wrong-edges.d2', /edges differ/],
  ['mermaid-good.mmd', null],
  ['mermaid-edges.mmd', /edges differ/],
  ['arrows-shared.d2', /重なって走る/],
  ['arrows-through.svg', /の中を通る/],
  ['aa-ja-boxes.txt', null],
  ['aa-ja-tree.txt', null],
  ['aa-d2-ja-broken.txt', /joint/],
  ['aa-too-wide.txt', /wrap/],
  ['aa-tab.txt', /tab:/],
];
let bad = 0;
for (const [file, want] of cases) {
  const r = spawnSync('node', [file.endsWith('.txt') ? aaTool : tool, join(here, 'fixtures', file), '--out', join(here, '.out', file)], { encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  const fails = out.split('\n').filter((l) => l.includes('✗'));
  const pass = want ? fails.some((l) => want.test(l)) : r.status === 0;
  if (!pass) bad++;
  console.log(`${pass ? 'ok ' : 'NG '} ${file}: ${want ? `expected ✗ ${want}` : 'expected CLEAN'}${pass ? '' : `\n    got: ${fails.join(' | ') || 'CLEAN'}`}`);
}
console.log(bad ? `${bad} FAILED` : 'figure-check tests passed');
process.exit(bad ? 1 : 0);
