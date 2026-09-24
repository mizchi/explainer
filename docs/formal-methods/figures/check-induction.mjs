// induction.scene.json の「到達可能」グループが、TLC が列挙した CounterAtomic の状態と一致するか。
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

const scene = JSON.parse(readFileSync(new URL('./induction.scene.json', import.meta.url), 'utf8'));
const reach = scene.groups.find((g) => g.id === 'reach').nodes;
const want = scene.nodes.filter((n) => reach.includes(n.id)).map((n) => n.label).sort();

if (JSON.stringify(got) === JSON.stringify(want)) console.log('reach group matches TLC');
else { console.log('MISMATCH', JSON.stringify({ tlc: got, figure: want })); process.exit(1); }
