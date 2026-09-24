// TS でよく書く `x % 2 === 1` は「奇数判定」として正しいか？
// 「正しくない入力が存在するか」を Z3 に聞く。存在すれば sat と反例、しなければ unsat。
import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, BitVec } = new Context('main');

// JS のビット演算に合わせて 32bit 符号付き整数として扱う
const x = BitVec.const('x', 32);
const i32 = (n) => BitVec.val(n, 32);

// 仕様 (参照実装): 最下位ビットが 1 なら奇数
const isOddSpec = x.and(i32(1)).eq(i32(1));
// 実装: x % 2 === 1   (BitVec の srem は JS の % と同じく「被除数の符号」を持つ)
const isOddImpl = x.srem(i32(2)).eq(i32(1));

const s = new Solver();
s.add(isOddSpec.neq(isOddImpl)); // 「仕様と実装が食い違う x」を探す
const r = await s.check();
console.log(`x % 2 === 1: ${r}`);
if (r === 'sat') {
  const v = Number(s.model().eval(x).value()) | 0; // 符号付きに戻す
  console.log(`  counterexample: x = ${v}`);
  console.log(`  JS says: ${v} % 2 === 1 -> ${v % 2 === 1}, (${v} & 1) === 1 -> ${(v & 1) === 1}`);
}

// 修正版: x % 2 !== 0
const s2 = new Solver();
s2.add(isOddSpec.neq(x.srem(i32(2)).neq(i32(0))));
console.log(`x % 2 !== 0: ${await s2.check()}`);
process.exit(0);
