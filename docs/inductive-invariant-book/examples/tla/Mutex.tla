---- MODULE Mutex ----
\* ロック変数 1 つで 2 プロセスの相互排他を守る
Procs == {"a", "b"}

VARIABLES (* @type: Str -> Str; *) pc, (* @type: Str; *) lock
vars == <<pc, lock>>

Init ==
  /\ pc = [p \in Procs |-> "idle"]
  /\ lock = "free"

Acquire(p) ==
  /\ pc[p] = "idle"
  /\ lock = "free"
  /\ lock' = p
  /\ pc' = [pc EXCEPT ![p] = "cs"]

Release(p) ==
  /\ pc[p] = "cs"
  /\ lock' = "free"
  /\ pc' = [pc EXCEPT ![p] = "idle"]

Next == \E p \in Procs : Acquire(p) \/ Release(p)
Spec == Init /\ [][Next]_vars

\* 守りたい性質: 2 人同時に cs に入らない
Mutex == ~(pc["a"] = "cs" /\ pc["b"] = "cs")

TypeOK ==
  /\ pc \in [Procs -> {"idle", "cs"}]
  /\ lock \in Procs \cup {"free"}

\* 性質そのままを帰納法にかける
IndNaive == TypeOK /\ Mutex

\* cs にいるなら、ロックを持っているのは自分
IndInv == TypeOK /\ Mutex /\ \A p \in Procs : pc[p] = "cs" => lock = p
====
