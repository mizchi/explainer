#!/usr/bin/env node
// samples/*.d2 を TALA / ELK / dagre で描き、比べる。チートシートの表は、この出力から書く。
//
//   node samples/compare.mjs            （docs/figure-cheatsheet で実行。d2 はリポジトリの .tools/d2）
//
// 測るもの
//   support   そのエンジンで描けるか（固定位置・near・箱ごとの direction）
//   check     figure-check.mjs の ✗ の種類と数（線が文字を通る・重なり など）
//   entry     入口の箱が、流れの先頭（down なら一番上、right なら一番左）に来たか
//   nested    箱ごとの direction: down が守られたか（中の箱が縦に並んだか）
//   stable    arch.d2 に 1 行足したとき、元からある箱がどれだけ動いたか（図の対角線に対する割合）
//   seeds     TALA は同じ入力・同じ seed で同じ図になるか。seed を変えると変わるか
//   mermaid   同じサンプルを Mermaid で描いたときの figure-check の ✗ と、サブグラフの direction
//   time      箱の数を増やしたときの描画時間（中央値 3 回）。時間は環境で変わるので、倍率だけ見る
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const d2 = join(repo, '.tools/d2');
const figureCheck = join(repo, 'skills/explainer/scripts/figure-check.mjs');
const { chromium } = createRequire(join(repo, 'package.json'))('playwright');
const tmp = mkdtempSync(join(process.env.TMP ?? tmpdir(), 'd2cmp-'));
const ENGINES = ['tala', 'elk', 'dagre'];

const render = (file, engine, extra = []) => {
  const out = join(tmp, `${Math.random().toString(36).slice(2)}.svg`);
  const t = process.hrtime.bigint();
  const r = spawnSync(d2, [`--layout=${engine}`, '--pad=16', ...extra, file, out], { encoding: 'utf8' });
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  if (r.status !== 0) return { error: (r.stderr.match(/err: (.*)/)?.[1] ?? r.stderr).trim(), ms };
  return { svg: readFileSync(out, 'utf8'), ms };
};
const sample = (name) => join(here, `${name}.d2`);

// figure-check の ✗ を種類ごとにまとめる。事実シートが無いことは、比べる対象ではないので数えない
function tally(stdout) {
  const kinds = {};
  const KIND = [[/text overlap/, 'overlap'], [/outside the figure/, 'clipped'], [/cross a box edge/, 'crossing'], [/line runs through/, 'through'], [/under 9px/, 'tiny'], [/^vlmkit/, 'vlmkit'], [/^mermaid/, 'mermaid']];
  for (const m of stdout.matchAll(/^ {2}✗ (?:(light|dark|mobile): )?(.*)$/gm)) {
    const k = KIND.find(([re]) => re.test(m[2]))?.[1];
    if (!k) continue;
    (kinds[k] ??= { views: [], what: m[2].match(/: (".*)$/)?.[1] ?? '' }).views.push(m[1] ?? '-');
  }
  const s = Object.entries(kinds).map(([k, v]) => `${k}（${v.views.join(', ')}）${v.what ? ` ${v.what}` : ''}`).join(' / ');
  return s ? `✗ ${s}` : '✓ 0';
}

const browser = await chromium.launch();
const page = await browser.newPage();
// D2 の SVG では、各オブジェクトが class=base64(id) の <g> になっている
async function boxes(svg) {
  await page.setContent(svg);
  return page.evaluate(() => {
    const out = {};
    const root = document.querySelector('svg').getBBox();
    for (const g of document.querySelectorAll('g[class]')) {
      let id; try { id = atob(g.getAttribute('class').split(' ')[0]); } catch { continue; }
      const s = g.querySelector(':scope > .shape'); if (!s) continue;
      const b = s.getBBox(); out[id] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }
    out.__diag = Math.hypot(root.width, root.height);
    return out;
  });
}

// ---- support ----
console.log('support（描けるか）');
for (const [name, what] of [['pinned', '固定位置（top / left）'], ['nested-dir', '箱ごとの direction']]) {
  for (const e of ENGINES) {
    const r = render(sample(name), e);
    console.log(`  ${what.padEnd(14)} ${e.padEnd(5)} ${r.error ? `✗ ${r.error.replace(/ See https.*/, '').replace(/^failed to compile [^:]+: /, '')}` : '✓ 描ける'}`);
  }
}
const nearFile = join(tmp, 'near.d2');
writeFileSync(nearFile, 'a -> b\nnote: 注\nnote.near: a\n');
for (const e of ENGINES) {
  const r = render(nearFile, e);
  console.log(`  ${'near: 別の箱'.padEnd(14)} ${e.padEnd(5)} ${r.error ? `✗ ${r.error.replace(/ See https.*/, '').replace(/^failed to compile [^:]+: /, '')}` : '✓ 描ける'}`);
}

// ---- nested ----
console.log('\nnested（箱ごとの direction: down が守られたか）');
for (const e of ENGINES) {
  const b = await boxes(render(sample('nested-dir'), e).svg);
  const col = ['build.fetch', 'build.compile', 'build.pack'].map((k) => b[k]);
  const vertical = col.every((p) => Math.abs(p.x - col[0].x) < 5) && col[0].y < col[1].y && col[1].y < col[2].y;
  console.log(`  ${e.padEnd(5)} ${vertical ? '✓ 中が縦に並んだ' : '✗ 中も横に並んだ（外の direction: right に従った）'}`);
}
// 箱の中の箱同士を、箱をまたいでつないでも守られるか（Mermaid はここで崩れる。下の mermaid 節）
const crossFile = join(tmp, 'nested-cross.d2');
writeFileSync(crossFile, readFileSync(sample('nested-dir'), 'utf8').replace('build -> deploy', 'build.pack -> deploy.push'));
{
  const b = await boxes(render(crossFile, 'tala').svg);
  const col = ['build.fetch', 'build.compile', 'build.pack'].map((k) => b[k]);
  const vertical = col.every((p) => Math.abs(p.x - col[0].x) < 5) && col[0].y < col[1].y && col[1].y < col[2].y;
  console.log(`  tala  中の箱同士を箱をまたいでつなぐ（固める -> 送る）と ${vertical ? '✓ 中が縦に並んだ' : '✗ 中も横に並んだ'}`);
}
// 代わりの手：箱の中を grid-columns: 1 にする（辺はそのまま引かれる）
const gridFile = join(tmp, 'nested-grid.d2');
writeFileSync(gridFile, readFileSync(sample('nested-dir'), 'utf8').replaceAll('direction: down', 'grid-columns: 1'));
for (const e of ['elk', 'dagre']) {
  const b = await boxes(render(gridFile, e).svg);
  const col = ['build.fetch', 'build.compile', 'build.pack'].map((k) => b[k]);
  const vertical = col.every((p) => Math.abs(p.x - col[0].x) < 5) && col[0].y < col[1].y && col[1].y < col[2].y;
  console.log(`  ${e.padEnd(5)} grid-columns: 1 に替えると ${vertical ? '✓ 中が縦に並んだ' : '✗ 並ばない'}`);
}

// ---- entry ----
console.log('\nentry（入口が流れの先頭に来たか）');
for (const [name, entry, axis] of [['loop', 'start', 'y'], ['pipeline', 'checkout', 'x'], ['arch', 'browser', 'y']]) {
  for (const e of ENGINES) {
    const b = await boxes(render(sample(name), e).svg);
    const ids = Object.keys(b).filter((k) => k !== '__diag');
    // 箱（コンテナ）は数えない。入口は葉の箱
    const leaves = ids.filter((k) => !ids.some((o) => o.startsWith(`${k}.`)));
    const first = leaves.reduce((m, k) => (b[k][axis] < b[m][axis] ? k : m));
    const where = axis === 'y' ? '一番上' : '一番左';
    console.log(`  ${name.padEnd(8)} ${e.padEnd(5)} ${first === entry ? `✓ ${entry} が${where}` : `✗ ${where}は ${first}（入口 ${entry} ではない）`}`);
  }
}

// ---- check ----
console.log('\ncheck（figure-check の ✗）');
for (const name of ['arch', 'pipeline', 'loop']) {
  for (const e of ENGINES) {
    const f = join(tmp, `${name}-${e}.d2`);
    writeFileSync(f, `vars: {d2-config: {layout-engine: ${e}}}\n${readFileSync(sample(name), 'utf8')}`);
    spawnSync(d2, ['fmt', f]);
    const r = spawnSync('node', [figureCheck, f, '--write', '--out', join(tmp, `${name}-${e}`)], { encoding: 'utf8', cwd: repo, env: { ...process.env, NO_COLOR: '1' } });
    console.log(`  ${name.padEnd(8)} ${e.padEnd(5)} ${tally(r.stdout)}`);
    copyFileSync(join(tmp, `${name}-${e}`, `${name}-${e}.sheet.png`), join(tmp, `${name}-${e}.sheet.png`));
  }
}

// ---- mermaid ----
// 同じサンプルを Mermaid の flowchart で描き、figure-check に通す。中の並びは、描いた SVG の箱の位置で見る
console.log('\nmermaid（同じサンプルを Mermaid の flowchart で）');
const mermaidJs = join(dirname(createRequire(join(repo, 'package.json')).resolve('mermaid/package.json')), 'dist/mermaid.min.js');
for (const name of ['arch', 'pipeline', 'loop']) {
  const f = join(tmp, `${name}-mermaid.mmd`);
  copyFileSync(join(here, `${name}.mmd`), f);
  const r = spawnSync('node', [figureCheck, f, '--write', '--out', join(tmp, `${name}-mermaid`)], { encoding: 'utf8', cwd: repo, env: { ...process.env, NO_COLOR: '1' } });
  console.log(`  ${name.padEnd(8)} check ${tally(r.stdout)}`);
}
for (const [name, what] of [['nested-dir', 'サブグラフ同士を辺でつなぐ'], ['nested-dir-cross', '中の箱同士をサブグラフをまたいでつなぐ']]) {
  await page.setContent('<body></body>');
  await page.addScriptTag({ path: mermaidJs });
  const pos = await page.evaluate(async (src) => {
    mermaid.initialize({ startOnLoad: false, htmlLabels: false, flowchart: { htmlLabels: false }, deterministicIds: true });
    document.body.innerHTML = (await mermaid.render('fig', src)).svg;
    const at = (id) => { const r = document.querySelector(`g.node[id*="-${id}-"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
    return ['fetch', 'compile', 'pack'].map(at);
  }, readFileSync(join(here, `${name}.mmd`), 'utf8'));
  const vertical = pos.every((p) => Math.abs(p.x - pos[0].x) < 5) && pos[0].y < pos[1].y && pos[1].y < pos[2].y;
  console.log(`  ${what}：${vertical ? '✓ サブグラフの中が縦に並んだ（direction TB が効いた）' : '✗ サブグラフの中も横に並んだ（direction TB が無視された）'}`);
}

// ---- stable ----
// arch.d2 に 1 行ずつ足した 3 通り。元からある箱が動いた距離の平均を、図の対角線で割る
console.log('\nstable（arch に 1 つ足したとき、元の箱が動いた距離 / 図の対角線）');
const variants = [['箱を 1 つ（通知）', 'data.mq -> svc.notify'], ['外に箱を 1 つ（管理画面）', 'admin: 管理画面\nadmin -> edge.gw'], ['線を 1 本', 'svc.auth -> data.pg']];
for (const e of ENGINES) {
  const a = await boxes(render(sample('arch'), e).svg);
  const cells = [];
  for (const [label, add] of variants) {
    const f = join(tmp, `arch-${e}-${cells.length}.d2`);
    writeFileSync(f, `${readFileSync(sample('arch'), 'utf8')}${add}\n`);
    const b = await boxes(render(f, e).svg);
    const ids = Object.keys(a).filter((k) => k !== '__diag' && b[k]);
    const mean = ids.map((k) => Math.hypot(a[k].x - b[k].x, a[k].y - b[k].y) / a.__diag).reduce((s, x) => s + x, 0) / ids.length;
    cells.push(`${label} ${mean < 0.05 ? 'ほぼ動かない' : mean < 0.2 ? '少し動く' : '大きく動く'}`);
  }
  console.log(`  ${e.padEnd(5)} ${cells.join(' / ')}`);
}
console.log('  （ほぼ動かない < 5%、少し動く 5〜20%、大きく動く ≥ 20%）');

// ---- seeds ----
console.log('\nseeds（TALA）');
const s1 = render(sample('arch'), 'tala').svg, s2 = render(sample('arch'), 'tala').svg;
console.log(`  同じ入力・既定の seed で 2 回：${s1 === s2 ? '同じ SVG' : '違う SVG'}`);
const layouts = new Set();
for (let seed = 1; seed <= 9; seed++) {
  const b = await boxes(render(sample('arch'), 'tala', [`--tala-seeds=${seed}`]).svg);
  layouts.add(JSON.stringify(Object.entries(b).filter(([k]) => k !== '__diag').map(([k, p]) => [k, Math.round(p.x / 10), Math.round(p.y / 10)])));
}
console.log(`  seed を 1 つずつ 1〜9 に変える：${layouts.size} 通りの配置`);
const inFile = join(tmp, 'seed-in-file.d2');
writeFileSync(inFile, 'vars: {\n  d2-config: {\n    tala-seeds: [5]\n  }\n}\na -> b\n');
const r = render(inFile, 'tala');
console.log(`  ファイルの vars に tala-seeds: [5]：${r.error ? `✗ ${r.error.replace(/^.*\d+:\d+: /, '')}` : '✓ 描ける'}`);

// ---- time ----
// 箱 n 個・辺 1.5n 本のグラフ（決まった擬似乱数で作る）
console.log('\ntime（描画時間の倍率。箱 10 個のときを 1 とする）');
const gen = (n) => {
  let x = 42; const rnd = () => ((x = (x * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const lines = []; for (let i = 1; i < n; i++) lines.push(`n${Math.floor(rnd() * i)} -> n${i}`);
  for (let i = 0; i < n / 2; i++) { const a = Math.floor(rnd() * n), b = Math.floor(rnd() * n); if (a !== b) lines.push(`n${a} -> n${b}`); }
  const f = join(tmp, `gen${n}.d2`); writeFileSync(f, lines.join('\n') + '\n'); return f;
};
const median = (f, e) => [0, 1, 2].map(() => render(f, e).ms).sort((a, b) => a - b)[1];
const sizes = [10, 20, 40];
const times = Object.fromEntries(ENGINES.map((e) => [e, sizes.map((n) => median(gen(n), e))]));
for (const e of ENGINES) {
  const r = times[e].map((t) => t / times[e][0]);
  const grow = r[2] >= 8 ? '急に伸びる（40 個で 8 倍以上）' : r[2] >= 3 ? 'ゆるく伸びる（40 個で 3〜8 倍）' : 'ほぼ伸びない（40 個で 3 倍未満）';
  console.log(`  ${e.padEnd(5)} ${grow}`);
}
const vsElk = times.tala[2] / times.elk[2];
console.log(`  箱 40 個で TALA は ELK の ${vsElk >= 10 ? '10 倍以上' : vsElk >= 3 ? '3〜10 倍' : '3 倍未満'}`);
console.log(`\n  （参考・この回の実測 ms）${ENGINES.map((e) => `${e} ${times[e].map((t) => Math.round(t)).join('/')}`).join(', ')}`);
console.log(`  sheets: ${tmp}/*.sheet.png`);
await browser.close();
