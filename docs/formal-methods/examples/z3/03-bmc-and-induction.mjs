// TLA+ の Counter / CounterAtomic と同じ遷移系を Z3 に直接書き、
// (1) 有界モデル検査 (BMC)  … k ステップ以内に不変条件が破れる実行があるか
// (2) 帰納法              … 「Inv が成り立つ任意の状態」から 1 ステップで破れるか
// を比べる。Apalache が TLA+ に対してやっていることの手書き版。
import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Not, Implies, If } = new Context('main');

const READ = 0, WRITE = 1, DONE = 2;           // pc の値
const INCR = 0;                                 // CounterAtomic の pc は INCR | DONE

// 状態 = 変数の組。i 番目の状態の変数を作る
const mk = (i) => ({
  count: Int.const(`count_${i}`),
  pa: Int.const(`pa_${i}`), pb: Int.const(`pb_${i}`),
  ta: Int.const(`ta_${i}`), tb: Int.const(`tb_${i}`),
});

// ---- 2 つのモデル ------------------------------------------------------
const models = {
  // 読んで (tmp := count)、書く (count := tmp + 1) の 2 ステップ
  Counter: {
    pcDomain: (s) => And(s.pa.ge(READ), s.pa.le(DONE), s.pb.ge(READ), s.pb.le(DONE)),
    init: (s) => And(s.count.eq(0), s.ta.eq(0), s.tb.eq(0), s.pa.eq(READ), s.pb.eq(READ)),
    done: (s) => And(s.pa.eq(DONE), s.pb.eq(DONE)),
    actions: {
      'Read(a)':  (s, t) => And(s.pa.eq(READ),  t.ta.eq(s.count), t.pa.eq(WRITE), t.count.eq(s.count), t.tb.eq(s.tb), t.pb.eq(s.pb)),
      'Read(b)':  (s, t) => And(s.pb.eq(READ),  t.tb.eq(s.count), t.pb.eq(WRITE), t.count.eq(s.count), t.ta.eq(s.ta), t.pa.eq(s.pa)),
      'Write(a)': (s, t) => And(s.pa.eq(WRITE), t.count.eq(s.ta.add(1)), t.pa.eq(DONE), t.ta.eq(s.ta), t.tb.eq(s.tb), t.pb.eq(s.pb)),
      'Write(b)': (s, t) => And(s.pb.eq(WRITE), t.count.eq(s.tb.add(1)), t.pb.eq(DONE), t.ta.eq(s.ta), t.tb.eq(s.tb), t.pa.eq(s.pa)),
    },
  },
  // 読み書きを 1 ステップにした版 (tmp は使わないので 0 に固定)
  CounterAtomic: {
    pcDomain: (s) => And(Or(s.pa.eq(INCR), s.pa.eq(DONE)), Or(s.pb.eq(INCR), s.pb.eq(DONE)), s.ta.eq(0), s.tb.eq(0)),
    init: (s) => And(s.count.eq(0), s.ta.eq(0), s.tb.eq(0), s.pa.eq(INCR), s.pb.eq(INCR)),
    done: (s) => And(s.pa.eq(DONE), s.pb.eq(DONE)),
    actions: {
      'Incr(a)': (s, t) => And(s.pa.eq(INCR), t.count.eq(s.count.add(1)), t.pa.eq(DONE), t.pb.eq(s.pb), t.ta.eq(s.ta), t.tb.eq(s.tb)),
      'Incr(b)': (s, t) => And(s.pb.eq(INCR), t.count.eq(s.count.add(1)), t.pb.eq(DONE), t.pa.eq(s.pa), t.ta.eq(s.ta), t.tb.eq(s.tb)),
    },
  },
};

// Next == 各 action の OR。どの action を使ったかを act_i で覚えておく
function step(m, s, t, act) {
  const names = Object.keys(m.actions);
  const stutter = And(m.done(s), t.count.eq(s.count), t.pa.eq(s.pa), t.pb.eq(s.pb), t.ta.eq(s.ta), t.tb.eq(s.tb));
  return And(act.ge(0), act.le(names.length),
    ...names.map((n, j) => Implies(act.eq(j), m.actions[n](s, t))),
    Implies(act.eq(names.length), stutter));
}

const NoLostUpdate = (m) => (s) => Implies(m.done(s), s.count.eq(2));
// 強めた不変条件: count = 終わったプロセスの数
const CountIsDone = (m) => (s) => And(m.pcDomain(s),
  s.count.eq(If(s.pa.eq(DONE), 1, 0).add(If(s.pb.eq(DONE), 1, 0))), NoLostUpdate(m)(s));

async function bmc(name, k) {
  const m = models[name];
  const ss = Array.from({ length: k + 1 }, (_, i) => mk(i));
  const acts = Array.from({ length: k }, (_, i) => Int.const(`act_${i}`));
  const solver = new Solver();
  solver.add(m.init(ss[0]));
  for (let i = 0; i < k; i++) solver.add(step(m, ss[i], ss[i + 1], acts[i]));
  solver.add(Or(...ss.map((s) => Not(NoLostUpdate(m)(s))))); // どこかで破れる
  const r = await solver.check();
  console.log(`BMC  ${name}, k=${k}: ${r}`);
  if (r === 'sat') {
    const names = [...Object.keys(m.actions), 'Stutter'];
    const md = solver.model();
    const trace = acts.map((a) => names[Number(md.eval(a).value())]);
    console.log(`  trace: ${trace.join(' -> ')}  (count = ${md.eval(ss[k].count).value()})`);
  }
}

async function induction(name, invName, inv) {
  const m = models[name];
  const s = mk('s'), t = mk('t'), act = Int.const('act');
  const solver = new Solver();
  // 帰納法 = 基底 (Init ⇒ Inv) + 帰納段階 (Inv ∧ Next ⇒ Inv')
  const base = new Solver();
  base.add(m.init(s), Not(inv(m)(s)));
  const b = await base.check();
  // 帰納段階: Inv(s) ∧ Next(s,t) ∧ ¬Inv(t) を満たす s,t は存在するか？
  // s は「到達可能」とは限らない。Inv を満たすだけの任意の状態。
  solver.add(m.pcDomain(s), inv(m)(s), step(m, s, t, act), Not(inv(m)(t)));
  const r = await solver.check();
  console.log(`IND  ${name}, Inv=${invName}: base ${b}, step ${r}`);
  if (r === 'sat') {
    const md = solver.model();
    const pcName = (v) => ({ 0: name === 'Counter' ? 'read' : 'incr', 1: 'write', 2: 'done' })[Number(md.eval(v).value())];
    const show = (x) => `count=${md.eval(x.count).value()}, pc=[a:${pcName(x.pa)}, b:${pcName(x.pb)}]`;
    console.log(`  CTI: ${show(s)}  --step-->  ${show(t)}`);
  }
}

await bmc('Counter', 4);
await bmc('CounterAtomic', 4);
await induction('CounterAtomic', 'NoLostUpdate', (m) => (s) => And(m.pcDomain(s), NoLostUpdate(m)(s)));
await induction('CounterAtomic', 'CountIsDone', CountIsDone);
process.exit(0);
