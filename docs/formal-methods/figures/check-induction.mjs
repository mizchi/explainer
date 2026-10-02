// induction.d2 の「到達可能」コンテナ (reach)が、TLC が列挙した CounterAtomic の状態と一致するか。
// 手で描いた図を、TLC の出力 (-dump dot) に照らして確かめる。
import { readFileSync } from 'node:fs';

const dot = readFileSync(process.argv[2], 'utf8');
const got = [...dot.matchAll(/^-?\d+ \[label="((?:[^"\\]|\\.)*)"/gm)]
  .map((m) => m[1].replace(/\\"/g, '"'))
  .map((l) => {
    const count = l.match(/count = (-?\d+)/)[1];
    const [, a, b] = l.match(/a \|-> "(\w+)", b \|-> "(\w+)"/);
    return `${count} | ${a} ${b}`;
  })
  .sort();

const d2 = readFileSync(new URL('./induction.d2', import.meta.url), 'utf8');
const block = d2.match(/^\s*reach: "[^"]*" \{\n([\s\S]*?)^\s*\}/m);
if (!block) { console.log('MISMATCH: induction.d2 has no reach container'); process.exit(1); }
const want = [...block[1].matchAll(/^\s*\w+: "([^"]*)"/gm)].map((m) => m[1]).sort();

if (JSON.stringify(got) === JSON.stringify(want)) console.log('reach group matches TLC');
else { console.log('MISMATCH', JSON.stringify({ tlc: got, figure: want })); process.exit(1); }
