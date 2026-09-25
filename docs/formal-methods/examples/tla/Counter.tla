---- MODULE Counter ----
EXTENDS Naturals

Procs == {"a", "b"}

VARIABLES (* @type: Int; *) count, (* @type: Str -> Int; *) tmp, (* @type: Str -> Str; *) pc
vars == <<count, tmp, pc>>

Init ==
  /\ count = 0
  /\ tmp = [p \in Procs |-> 0]
  /\ pc  = [p \in Procs |-> "read"]

Read(p) ==
  /\ pc[p] = "read"
  /\ tmp' = [tmp EXCEPT ![p] = count]
  /\ pc'  = [pc  EXCEPT ![p] = "write"]
  /\ UNCHANGED count

Write(p) ==
  /\ pc[p] = "write"
  /\ count' = tmp[p] + 1
  /\ pc'    = [pc EXCEPT ![p] = "done"]
  /\ UNCHANGED tmp

Done == \A p \in Procs : pc[p] = "done"

Next ==
  \/ \E p \in Procs : Read(p) \/ Write(p)
  \/ (Done /\ UNCHANGED vars)

Spec == Init /\ [][Next]_vars

NoLostUpdate == Done => count = 2

NotDone == ~Done
====
