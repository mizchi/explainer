---- MODULE MutexRacy ----
\* Mutex の Acquire を「確かめる」と「取る」の 2 歩に分けた版 (check-then-act)
Procs == {"a", "b"}

VARIABLES (* @type: Str -> Str; *) pc, (* @type: Str; *) lock
vars == <<pc, lock>>

Init ==
  /\ pc = [p \in Procs |-> "idle"]
  /\ lock = "free"

Check(p) ==
  /\ pc[p] = "idle"
  /\ lock = "free"
  /\ pc' = [pc EXCEPT ![p] = "checked"]
  /\ UNCHANGED lock

Take(p) ==
  /\ pc[p] = "checked"
  /\ lock' = p
  /\ pc' = [pc EXCEPT ![p] = "cs"]

Release(p) ==
  /\ pc[p] = "cs"
  /\ lock' = "free"
  /\ pc' = [pc EXCEPT ![p] = "idle"]

Next == \E p \in Procs : Check(p) \/ Take(p) \/ Release(p)
Spec == Init /\ [][Next]_vars

Mutex == ~(pc["a"] = "cs" /\ pc["b"] = "cs")

TypeOK ==
  /\ pc \in [Procs -> {"idle", "checked", "cs"}]
  /\ lock \in Procs \cup {"free"}

IndNaive == TypeOK /\ Mutex
====
