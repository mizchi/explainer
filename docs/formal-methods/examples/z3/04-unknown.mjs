// unsat でも sat でもない第三の答え: unknown。
// 非線形な整数算術は一般に決定不能 (ヒルベルトの第 10 問題) なので、Z3 は諦めることがある。
import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And } = new Context('main');

const x = Int.const('x'), y = Int.const('y'), z = Int.const('z');

// x^3 + y^3 = z^3 の正整数解はない (フェルマー n=3)。だが Z3 はそれを示せない。
const s = new Solver();
s.set('timeout', 3000);
s.add(And(x.gt(0), y.gt(0), z.gt(0)), x.mul(x).mul(x).add(y.mul(y).mul(y)).eq(z.mul(z).mul(z)));
const r = await s.check();
console.log(`x^3 + y^3 = z^3 (x,y,z > 0): ${r}`);
if (r === 'unknown') console.log(`  reason: ${s.reasonUnknown()}`);

// 同じ形でも線形 (Presburger 算術) なら決定可能で、答えが必ず返る
const s2 = new Solver();
s2.add(And(x.gt(0), y.gt(0), z.gt(0)), x.mul(3).add(y.mul(3)).eq(z.mul(3).add(1)));
console.log(`3x + 3y = 3z + 1: ${await s2.check()}`);
process.exit(0);
