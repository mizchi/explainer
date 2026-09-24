---- MODULE CounterAtomic ----
EXTENDS Naturals

Procs == {"a", "b"}

VARIABLES count, pc
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
====
