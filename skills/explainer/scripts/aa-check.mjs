#!/usr/bin/env node
// TUI（端末）に出す AA（テキストの図）を、実物の端末エミュレータ（xterm.js）に描かせて検査し、目で見る画像を作る。
//
//   node aa-check.mjs <fig.txt | -> [--cols 80] [--ascii] [--out dir]
//
// 端末は、全角（CJK）を 2 桁、罫線（─│┌…）を 1 桁として並べる。この幅の数え方がずれると、箱の右の辺がずれる。
// 検査は、xterm.js が実際に並べたセルの格子の上で行う（どの文字が何桁目に来たか）。
//   ✗ wrap      --cols より長い行（端末で折り返される）
//   ✗ tab       タブ（端末ごとに幅が変わる）
//   ✗ joint     角・T 字・十字の罫線が、つながるべき向きの隣につながっていない（箱の辺がずれている）
//   ✗ ascii     --ascii のとき、ASCII 以外の文字で線を引いている
//   △ ambiguous 全角の文字と罫線（幅が「あいまい」な文字）が混ざっている。CJK 向けの設定で罫線を 2 桁に数える端末では崩れる。
//               崩したくないなら --ascii（+ - | で描く）にする
//   △ touch     文字が、箱の辺ではない線に接している（どの線のラベルか読みにくい）
//   △ emoji     絵文字（端末によって 1 桁か 2 桁かが違う）
// 出力：<out>/<name>.term.png（端末の見た目）。Read で開いて、目で確かめる
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: { cols: { type: 'string', default: '80' }, ascii: { type: 'boolean', default: false }, out: { type: 'string' }, json: { type: 'string' } },
});
const arg = positionals[0];
if (!arg) { console.error('usage: aa-check.mjs <fig.txt | -> [--cols 80] [--ascii] [--out dir]'); process.exit(2); }
const text = (arg === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(arg), 'utf8')).replace(/\r\n/g, '\n').replace(/\n+$/, '');
const cols = Number(opt.cols);
const name = arg === '-' ? 'stdin' : basename(arg).replace(/\.[^.]+$/, '');
const out = resolve(opt.out ?? (arg === '-' ? join(tmpdir(), 'aa-check', name) : join(dirname(resolve(arg)), '.figure-check', name)));
mkdirSync(out, { recursive: true });

function findUp(d, f) { for (; d !== dirname(d); d = dirname(d)) if (existsSync(join(d, f))) return d; return null; }
const root = findUp(arg === '-' ? process.cwd() : dirname(resolve(arg)), 'package.json') ?? findUp(process.cwd(), 'package.json') ?? process.cwd();
const req = createRequire(join(root, 'package.json'));
let xtermDir, unicodeDir, chromium;
try {
  xtermDir = dirname(req.resolve('@xterm/xterm/package.json'));
  unicodeDir = dirname(req.resolve('@xterm/addon-unicode11/package.json'));
  ({ chromium } = req('playwright'));
} catch { console.error('install in this project: npm i -D @xterm/xterm @xterm/addon-unicode11 playwright'); process.exit(2); }

let failures = 0;
const summary = { fail: [], look: [] };
const ok = (m) => console.log(`  ✓ ${m}`);
const ng = (m, fix) => { failures++; summary.fail.push(m); console.log(`  ✗ ${m}${fix ? `\n    → ${fix}` : ''}`); };
const look = (m) => { summary.look.push(m); console.log(`  △ ${m}`); };
console.log(`aa ${arg === '-' ? '(stdin)' : basename(arg)}（${cols} 桁の端末）`);

// ---- 端末に描かせる ----
const lines = text.split('\n');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#1e1e1e} .xterm *{-webkit-font-smoothing:antialiased;font-smooth:grayscale;text-rendering:geometricPrecision}</style></head><body><div id="t"></div></body></html>`);
await page.addStyleTag({ path: join(xtermDir, 'css/xterm.css') });
await page.addScriptTag({ path: join(xtermDir, 'lib/xterm.js') });
await page.addScriptTag({ path: join(unicodeDir, 'lib/addon-unicode11.js') });
const grid = await page.evaluate(async ({ text, cols, rows }) => {
  const term = new Terminal({ cols, rows, allowProposedApi: true, fontSize: 15, customGlyphs: false,
    fontFamily: '"DejaVu Sans Mono", "WenQuanYi Zen Hei Mono", "Noto Sans Mono CJK JP", monospace',
    theme: { background: '#1e1e1e', foreground: '#e6e6e6', cursor: '#1e1e1e', cursorAccent: '#1e1e1e' }, scrollback: 0 });
  term.loadAddon(new Unicode11Addon.Unicode11Addon());
  term.unicode.activeVersion = '11';
  term.open(document.getElementById('t'));
  await new Promise((r) => term.write(text.replace(/\n/g, '\r\n'), r));
  // 端末の行（折り返しを含む）を、元の行ごとにまとめて返す
  const buf = term.buffer.active, rowsOut = [];
  for (let y = 0; y < buf.length; y++) {
    const line = buf.getLine(y);
    if (!line) continue;
    const cells = [];
    for (let x = 0; x < cols; x++) { const c = line.getCell(x); cells.push({ ch: c.getChars(), w: c.getWidth() }); }
    rowsOut.push({ wrapped: line.isWrapped, cells });
  }
  // 画像は、使った行までに縮める
  let last = rowsOut.length - 1;
  while (last > 0 && rowsOut[last].cells.every((c) => !c.ch.trim())) last--;
  term.resize(cols, last + 1);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return rowsOut;
}, { text, cols, rows: lines.length * 2 + 2 });
const shot = join(out, `${name}.term.png`);
await (await page.$('#t .xterm-screen')).screenshot({ path: shot });
await browser.close();

// ---- 検査 ----
// 元の行 i → 端末の行（折り返しがあれば 2 行以上）
const logical = [];
for (const r of grid) { if (r.wrapped && logical.length) logical.at(-1).push(r); else logical.push([r]); }
const used = logical.slice(0, lines.length);

const wrapped = used.map((rs, i) => [rs.length, i]).filter(([n]) => n > 1);
wrapped.length ? ng(`wrap: ${wrapped.length} line(s) wider than ${cols} columns: ${wrapped.slice(0, 5).map(([, i]) => `line ${i + 1}`).join(', ')}`, `keep every line within ${cols} columns (a full-width character counts as 2)`) : ok(`wrap: every line fits in ${cols} columns`);
const tabs = lines.map((l, i) => [l, i]).filter(([l]) => l.includes('\t'));
tabs.length ? ng(`tab: tabs on ${tabs.map(([, i]) => `line ${i + 1}`).join(', ')}`, 'replace tabs with spaces') : ok('tab: no tabs');

// 格子：端末の 1 行目のセルだけを使う（折り返した行は wrap で落としている）
const at = (y, x) => (y >= 0 && y < used.length && x >= 0 && x < cols ? used[y][0].cells[x].ch : '');
const H_RIGHT = new Set([...'─━═┬┴┼┐┘┤╮╯┳┻╋┓┛┫-+>▶►→']); // x の右隣が、左からの線を受ける
const H_LEFT = new Set([...'─━═┬┴┼┌└├╭╰┳┻╋┏┗┣-+<◀◄←']);
const V_DOWN = new Set([...'│┃║├┤┼┴└┘╰╯┣┫╋┻┗┛|+v▼↓']);  // y の下が、上からの線を受ける
const V_UP = new Set([...'│┃║├┤┼┬┌┐╭╮┣┫╋┳┏┓|+^▲↑']);
const NEED = {
  '┌': 'rd', '┐': 'ld', '└': 'ru', '┘': 'lu', '╭': 'rd', '╮': 'ld', '╰': 'ru', '╯': 'lu',
  '├': 'udr', '┤': 'udl', '┬': 'lrd', '┴': 'lru', '┼': 'lrud',
  '┏': 'rd', '┓': 'ld', '┗': 'ru', '┛': 'lu', '┣': 'udr', '┫': 'udl', '┳': 'lrd', '┻': 'lru', '╋': 'lrud',
};
const joints = [];
for (let y = 0; y < used.length; y++)
  for (let x = 0; x < cols; x++) {
    const c = at(y, x);
    const need = NEED[c];
    const conn = { r: H_RIGHT.has(at(y, x + 1)), l: H_LEFT.has(at(y, x - 1)), d: V_DOWN.has(at(y + 1, x)), u: V_UP.has(at(y - 1, x)) };
    if (need) {
      // T 字（├ ┤ ┬ ┴）は、枝の向きと、通り抜ける 2 方向のどちらか 1 つがあればよい（木の最初の ├ は上に何も無い）
      const TEE = { '├': ['r', 'ud'], '┤': ['l', 'ud'], '┬': ['d', 'lr'], '┴': ['u', 'lr'], '┣': ['r', 'ud'], '┫': ['l', 'ud'], '┳': ['d', 'lr'], '┻': ['u', 'lr'] }[c];
      const miss = TEE ? [...TEE[0]].filter((d) => !conn[d]).concat([...TEE[1]].some((d) => conn[d]) ? [] : [...TEE[1]]) : [...need].filter((d) => !conn[d]);
      if (miss.length) joints.push(`line ${y + 1} col ${x + 1} "${c}" has nothing ${miss.map((d) => ({ r: 'to the right', l: 'to the left', d: 'below', u: 'above' })[d]).join(' / ')}`);
    } else if (c === '+') {
      // ASCII の角：線が 2 方向以上から来ているか
      if (Object.values(conn).filter(Boolean).length < 2 && (conn.r || conn.l || conn.u || conn.d)) joints.push(`line ${y + 1} col ${x + 1} "+" connects on one side only`);
    }
  }
joints.length ? ng(`joint: ${joints.length} broken joint(s): ${joints.slice(0, 3).join('; ')}`, 'a box edge is out of line; usually a full-width character was counted as 1 column, or padding was added after it') : ok('joint: every corner, tee and cross connects');

// 文字が、箱の辺ではない線（辺・矢印の線）に左右から接している：どの線のラベルか読みにくい
// 箱の辺かどうかは、縦線を上へたどって角（┌ ┐ ╭ ╮ +）に着くかで見る
const VERT = new Set([...'│┃║|']);
// 箱の上の角：横線でたどった反対側が、もう一方の上の角（┌──┐）。線の曲がり角（┌──┘）は箱ではない
const HLINE = new Set([...'─━═-']);
const OPEN = { '┌': '┐', '╭': '╮', '┏': '┓', '+': '+' }, CLOSE = { '┐': '┌', '╮': '╭', '┓': '┏', '+': '+' };
function isBoxTop(y, x) {
  const c = at(y, x);
  for (const [dir, want] of [[1, OPEN[c]], [-1, CLOSE[c]]]) {
    if (!want) continue;
    let k = x + dir;
    while (HLINE.has(at(y, k)) || at(y, k) === '┬') k += dir;
    if (k !== x + dir && at(y, k) === want) return true;
  }
  return false;
}
const isBoxEdge = (y, x) => { let k = y; while (k > 0 && VERT.has(at(k - 1, x))) k--; return isBoxTop(k - 1, x); };
const isText = (c) => /[\p{L}\p{N}]/u.test(c);
const touches = [];
for (let y = 0; y < used.length; y++)
  for (let x = 0; x < cols; x++) {
    if (!VERT.has(at(y, x)) || isBoxEdge(y, x)) continue;
    // 全角の右半分は空（''）なので、左隣は 2 つ前まで見る
    const left = at(y, x - 1) || at(y, x - 2), right = at(y, x + 1);
    if (isText(left) || isText(right)) touches.push(`line ${y + 1} col ${x + 1}`);
  }
if (touches.length) look(`touch: ${touches.length} place(s) where text touches a connecting line (${touches.slice(0, 3).join(', ')}). Which line the label belongs to is hard to read; leave a space, or move the label`);

const nonAsciiLine = /[─━═│┃║┌┐└┘├┤┬┴┼╭╮╰╯┏┓┗┛┣┫┳┻╋▶►◀◄▼▲→←↑↓]/;
if (opt.ascii) {
  const bad = lines.map((l, i) => [l, i]).filter(([l]) => nonAsciiLine.test(l));
  bad.length ? ng(`ascii: non-ASCII line characters on ${bad.slice(0, 5).map(([, i]) => `line ${i + 1}`).join(', ')}`, 'draw with + - | and > < v ^ only') : ok('ascii: lines drawn with ASCII only');
}
const wide = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;
if (wide.test(text) && nonAsciiLine.test(text)) look('ambiguous: full-width text and box-drawing characters are mixed. Terminals set to treat ambiguous-width characters as wide (common in CJK setups) will draw the lines 2 columns wide and break the boxes; use --ascii (+ - |) if that matters');
if (/\p{Extended_Pictographic}/u.test(text)) look('emoji: emoji take 1 or 2 columns depending on the terminal; avoid them in aligned drawings');

console.log(`\n  look at it: ${shot}`);
console.log(failures === 0 ? 'aa verdict: CLEAN (now look at the image)' : `aa verdict: ${failures} FAILURE(S)`);
summary.image = shot;
if (opt.json) writeFileSync(opt.json, JSON.stringify(summary, null, 2));
process.exit(failures ? 1 : 0);
