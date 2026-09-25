---- MODULE CounterAtomic ----
EXTENDS Integers

Procs == {"a", "b"}

VARIABLES (* @type: Int; *) count, (* @type: Str -> Str; *) pc
vars == <<count, pc>>

Init ==
  /\ count = 0
  /\ pc = [p \in Procs |-> "incr"]

\* 読みと書きを 1 ステップにした（= アトミック / ロック区間）
Incr(p) ==
  /\ pc[p] = "incr"
  /\ count' = count + 1
  /\ pc'    = [pc EXCEPT ![p] = "done"]

Done == \A p \in Procs : pc[p] = "done"

Next ==
  \/ \E p \in Procs : Incr(p)
  \/ (Done /\ UNCHANGED vars)

Spec == Init /\ [][Next]_vars

\* 弱公平性: ずっと実行可能な Next は、いつか必ず実行される
FairSpec == Spec /\ WF_vars(Next)

NoLostUpdate == Done => count = 2

NotDone == ~Done

\* 活性: いつか必ず全員が終わる
Termination == <>Done

\* ---- 帰納法用 (Apalache: --init=X --inv=X --length=1) ----
\* 型だけの制約。count は任意の整数を許す (到達可能かは問わない)
TypeOK ==
  /\ count \in Int
  /\ pc \in [Procs -> {"incr", "done"}]

\* そのままの不変条件を帰納法にかける (CTI が出るはず)
IndNaive == TypeOK /\ NoLostUpdate

\* 強めた不変条件: count = 終わったプロセスの数
DoneCount == IF pc["a"] = "done" THEN IF pc["b"] = "done" THEN 2 ELSE 1
             ELSE IF pc["b"] = "done" THEN 1 ELSE 0
CountIsDone == count = DoneCount
IndInv == TypeOK /\ CountIsDone
====
