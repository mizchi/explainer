// 二分探索の mid = (lo + hi) / 2 は、0 <= lo <= hi のとき lo <= mid <= hi か？
// Int32Array や Wasm の i32 のように 32bit で足し算が回り込む世界で確かめる。
import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, BitVec, Or } = new Context('main');

const lo = BitVec.const('lo', 32);
const hi = BitVec.const('hi', 32);
const i32 = (n) => BitVec.val(n, 32);

async function check(name, mid) {
  const s = new Solver();
  s.add(lo.sge(i32(0)), hi.sge(lo));             // 前提
  s.add(Or(mid.slt(lo), mid.sgt(hi)));      // 性質の否定: mid が範囲外
  const r = await s.check();
  console.log(`${name}: ${r}`);
  if (r === 'sat') {
    const m = s.model();
    const l = Number(m.eval(lo).value()) | 0;
    const h = Number(m.eval(hi).value()) | 0;
    const i32 = new Int32Array(1);
    i32[0] = l + h;               // 32bit で回り込ませる
    console.log(`  counterexample found; replayed in JS: mid = ${(i32[0] / 2) | 0}, lo = ${l}, hi = ${h}`);
    console.log(`  mid < lo: ${((i32[0] / 2) | 0) < l}`);
  }
}

await check('(lo + hi) / 2', lo.add(hi).sdiv(i32(2)));
await check('lo + (hi - lo) / 2', lo.add(hi.sub(lo).sdiv(i32(2))));
process.exit(0);
