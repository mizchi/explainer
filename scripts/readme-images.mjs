#!/usr/bin/env node
// README の「指示 → 生成された図」の画像を作り直す。すべてリポジトリの中のファイルから作る。
//
//   node scripts/readme-images.mjs      → docs/readme/*.png
//
// 必要なもの：.tools/d2（npm run setup:d2）、playwright、mermaid
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(repo, 'docs/readme');
mkdirSync(out, { recursive: true });
const tmp = mkdtempSync(join(process.env.TMP ?? tmpdir(), 'readme-'));
const d2 = join(repo, '.tools/d2');
const scripts = join(repo, 'skills/explainer/scripts');
const { chromium } = createRequire(join(repo, 'package.json'))('playwright');
const sh = (cmd, args, cwd = repo) => spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
const svg = (f) => readFileSync(join(repo, f), 'utf8').replace(/<\?xml[^>]*>/, '');

// D2 を指定のエンジンで描く
const d2svg = (file, engine, flags = []) => {
  const o = join(tmp, `${Math.random().toString(36).slice(2)}.svg`);
  sh(d2, [`--layout=${engine}`, '--pad=16', ...flags, resolve(repo, file), o]);
  return readFileSync(o, 'utf8').replace(/<\?xml[^>]*>/, '');
};
// Mermaid は figure-check に描かせる（本番と同じ設定で SVG になる）
const mmdsvg = (file) => {
  const f = join(tmp, file.split('/').pop());
  copyFileSync(join(repo, file), f);
  sh('node', [join(scripts, 'figure-check.mjs'), f, '--write', '--out', join(tmp, 'fc')]);
  return readFileSync(f.replace(/\.mmd$/, '.svg'), 'utf8');
};

const browser = await chromium.launch();
// 図を横に並べる。見出しは README に書く（日本語版と英語版で同じ画像を使うため、画像には文字を足さない）
async function tile(name, cells) {
  const p = await browser.newPage({ viewport: { width: 1300, height: 800 }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:#fff">
<div id="w" style="display:inline-flex;gap:16px;padding:16px;align-items:flex-start;background:#fff">
${cells.map(([html, width], n) => `<div style="width:${width}px;border:1px solid #d0d7de;border-radius:6px;padding:28px 6px 6px;position:relative">
<div style="position:absolute;top:6px;left:8px;font:700 16px system-ui;color:#57606a">${String.fromCharCode(65 + n)}</div>
${html.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ')}</div>`).join('')}
</div></body>`);
  await (await p.$('#w')).screenshot({ path: join(out, `${name}.png`) });
  await p.close();
  console.log(`wrote docs/readme/${name}.png`);
}
// 大きい PNG（figure-check のシート）を、幅をそろえて縮める
async function shrink(name, png, width = 1200) {
  const p = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0"><img id="i" src="data:image/png;base64,${readFileSync(png).toString('base64')}" style="width:${width}px;display:block"></body>`);
  await (await p.$('#i')).screenshot({ path: join(out, `${name}.png`) });
  await p.close();
  console.log(`wrote docs/readme/${name}.png`);
}

// 1. 形式手法の速習資料
await tile('formal-methods', [
  [svg('docs/formal-methods/figures/lost-update.svg'), 300],
  [svg('docs/formal-methods/figures/induction.svg'), 560],
  [svg('docs/formal-methods/figures/coverage.svg'), 380],
]);

// 2. 章立ての本
await tile('book', [
  [svg('docs/inductive-invariant-book/figures/book-map.svg'), 380],
  [svg('docs/inductive-invariant-book/figures/cti-triage.svg'), 460],
]);

// 3. D2 のエンジンの比較
const arch = 'docs/figure-cheatsheet/samples/arch.d2';
await tile('engines', [[d2svg(arch, 'tala'), 380], [d2svg(arch, 'elk'), 380], [d2svg(arch, 'dagre'), 380]]);

// 4. Mermaid と TALA：サブグラフをまたぐ辺があるとき
const cross = join(tmp, 'nested-cross.d2');
writeFileSync(cross, readFileSync(join(repo, 'docs/figure-cheatsheet/samples/nested-dir.d2'), 'utf8').replace('build -> deploy', 'build.pack -> deploy.push'));
await tile('mermaid-vs-tala', [
  [mmdsvg('docs/figure-cheatsheet/figures/loop.mmd'), 340],
  [mmdsvg('docs/figure-cheatsheet/samples/nested-dir-cross.mmd'), 480],
  [d2svg(cross, 'tala'), 340],
]);

// 5. 目で見て直すループ：辺のシートと、配置の候補
const bad = join(repo, 'tests/figure-check/fixtures/arrows-shared.d2');
sh('node', [join(scripts, 'figure-check.mjs'), bad, '--out', join(tmp, 'shared')]);
await shrink('arrows-edges', join(tmp, 'shared', 'arrows-shared.edges.png'));
sh('node', [join(scripts, 'figure-variants.mjs'), bad, '--out', join(tmp, 'variants')]);
await shrink('arrows-variants', join(tmp, 'variants', 'arrows-shared.variants.png'));

// 6. 端末の中の AA：D2 が日本語のラベルで崩した AA と、手で描いた AA
for (const [name, file] of [['aa-broken', 'aa-d2-ja-broken'], ['aa-good', 'aa-ja-boxes']]) {
  sh('node', [join(scripts, 'aa-check.mjs'), join(repo, `tests/figure-check/fixtures/${file}.txt`), '--out', join(tmp, file)]);
  await shrink(name, join(tmp, file, `${file}.term.png`), 720);
}

await browser.close();
