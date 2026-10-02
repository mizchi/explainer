// ロジスティック回帰の診断 4 パネル（JS 版）。data.csv から値を計算し、Python 版（glm.py.json）と照合して、
// Vega-Lite の spec を figures/glm.vl.json に書く。SVG にするのは figure-check.mjs（verify-doc が呼ぶ）
//
//   node samples/glm.mjs          値を照合し、spec が最新かを確かめる
//   node samples/glm.mjs --write  spec を書き直す
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Matrix, inverse } from 'ml-matrix';

const here = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(here, 'data.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',').map(Number));
const n = rows.length, y = rows.map((r) => r[2]), fold = rows.map((r) => r[3]);
const X = rows.map((r) => [1, r[0], r[1]]);
const sig = (z) => 1 / (1 + Math.exp(-z));

// IRLS（statsmodels の GLM と同じ推定）。SE は (XᵀWX)⁻¹ の対角から
function glm(Xs, ys) {
  let b = new Matrix([[0], [0], [0]]);
  for (let it = 0; it < 50; it++) {
    const A = new Matrix(Xs), mu = A.mmul(b).to1DArray().map(sig);
    const H = A.transpose().mulRowVector(mu.map((m) => m * (1 - m))).mmul(A);
    const step = inverse(H).mmul(A.transpose().mmul(Matrix.columnVector(ys.map((v, i) => v - mu[i]))));
    b = b.add(step);
    if (step.norm() < 1e-10) return { b: b.to1DArray(), cov: inverse(H) };
  }
  throw new Error('IRLS did not converge');
}
const full = glm(X, y);                      // 係数は全データで
const p = new Array(n);                      // 性能の値は out-of-fold の予測で（fold は data.csv の列）
for (let k = 0; k < 5; k++) {
  const tr = [...Array(n).keys()].filter((i) => fold[i] !== k);
  const m = glm(tr.map((i) => X[i]), tr.map((i) => y[i]));
  for (let i = 0; i < n; i++) if (fold[i] === k) p[i] = sig(X[i].reduce((s, v, j) => s + v * m.b[j], 0));
}

// ROC・PR と AUC・AP（scikit-learn と同じ定義：同じ予測値はまとめ、AP = Σ(Rₙ − Rₙ₋₁)Pₙ）
const idx = [...Array(n).keys()].sort((a, b) => p[b] - p[a]);
const P = y.reduce((s, v) => s + v, 0), N = n - P;
let tp = 0, fp = 0, ap = 0, auc = 0, prevR = 0, prevF = 0, prevT = 0;
const roc = [{ f: 0, t: 0 }], pr = [];
for (let j = 0; j < n; j++) {
  const i = idx[j]; y[i] ? tp++ : fp++;
  if (j < n - 1 && p[idx[j + 1]] === p[i]) continue;
  const t = tp / P, f = fp / N, prec = tp / (tp + fp);
  roc.push({ f, t }); pr.push({ r: t, p: prec });
  auc += ((f - prevF) * (t + prevT)) / 2; prevF = f; prevT = t;
  ap += (t - prevR) * prec; prevR = t;
}
const brier = p.reduce((s, v, i) => s + (y[i] - v) ** 2, 0) / n;

// 予測確率の分位でビンに分ける：キャリブレーション（10）と binned residual（20、±2SE）
const order = [...Array(n).keys()].sort((a, b) => p[a] - p[b] || a - b);
const bins = (K) => {
  const b = new Array(n); order.forEach((i, r) => (b[i] = Math.floor((r * K) / n)));
  return [...Array(K).keys()].map((k) => {
    const m = [...Array(n).keys()].filter((i) => b[i] === k);
    const mp = m.reduce((s, i) => s + p[i], 0) / m.length, my = m.reduce((s, i) => s + y[i], 0) / m.length;
    const se = Math.sqrt(m.reduce((s, i) => s + p[i] * (1 - p[i]), 0)) / m.length;
    return { mp, my, resid: my - mp, hi: 2 * se, lo: -2 * se };
  });
};
const cal = bins(10), bin = bins(20), out = bin.filter((d) => Math.abs(d.resid) > d.hi).length;

// Python 版との照合（小数 6 桁）
const vals = { b0: full.b[0], b1: full.b[1], b2: full.b[2], se_b1: Math.sqrt(full.cov.get(1, 1)), auc, ap, brier, rate: P / n, binned_out: out };
const py = JSON.parse(readFileSync(join(here, 'glm.py.json'), 'utf8'));
let diff = 0;
for (const [k, v] of Object.entries(vals)) {
  const same = Math.abs(v - py[k]) < 5e-7;
  if (!same) diff++;
  console.log(`${k.padEnd(10)} ${v.toFixed(6).padStart(10)}  python ${py[k].toFixed(6).padStart(10)}  ${same ? '一致' : '不一致'}`);
}

// 図：1 手法 1 枚。パネルの題は「何を見る図か — 何が見えれば合格か」、基準の線は破線。
// スマホで読めるよう 1 列に積む（2 列にすると、375px 幅で目盛りが 6px になる）
const f3 = (x) => x.toFixed(3);
const dash = { strokeDash: [5, 4], color: '#6e7781' };
const q = (field, title, extra = {}) => ({ field, type: 'quantitative', ...(title ? { title } : {}), ...extra });
const diag = { data: { values: [{ a: 0, b: 0 }, { a: 1, b: 1 }] }, mark: { type: 'line', ...dash }, encoding: { x: q('a'), y: q('b') } };
const W = 320, H = 220;
const spec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
  config: { font: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif', axis: { labelFontSize: 13, titleFontSize: 14 }, title: { fontSize: 15 } },
  vconcat: [
    { title: `ROC — 対角線から離れる（AUC ${f3(auc)}）`, width: W, height: H, layer: [
      { data: { values: roc }, mark: 'line', encoding: { x: q('f', '偽陽性率'), y: q('t', '真陽性率') } }, diag] },
    { title: `PR — 陽性率の破線から離れる（AP ${f3(ap)}）`, width: W, height: H, layer: [
      { data: { values: pr }, mark: 'line', encoding: { x: q('r', '再現率'), y: q('p', '適合率', { scale: { domain: [0, 1] } }) } },
      { data: { values: [{ v: P / n }] }, mark: { type: 'rule', ...dash }, encoding: { y: q('v') } }] },
    { title: 'キャリブレーション — 対角線に沿う', width: W, height: H, layer: [
      { data: { values: cal }, mark: { type: 'line', point: true }, encoding: { x: q('mp', '予測確率'), y: q('my', '実際の陽性率') } }, diag] },
    { title: `binned residual — 破線の外が 3 個以下で、形がない（外 ${out}）`, width: W, height: H, data: { values: bin }, layer: [
      { mark: 'point', encoding: { x: q('mp', '予測確率'), y: q('resid', '平均残差') } },
      { mark: { type: 'line', ...dash }, encoding: { x: q('mp'), y: q('hi') } },
      { mark: { type: 'line', ...dash }, encoding: { x: q('mp'), y: q('lo') } }] },
  ],
};
const specPath = join(here, '../figures/glm.vl.json');
const text = `${JSON.stringify(spec, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(6) : v))}\n`;
if (process.argv.includes('--write')) { writeFileSync(specPath, text); console.log('spec: wrote figures/glm.vl.json'); }
else console.log(readFileSync(specPath, 'utf8') === text ? 'spec: figures/glm.vl.json is up to date' : 'spec: figures/glm.vl.json is STALE (run with --write)');
process.exit(diff ? 1 : 0);
