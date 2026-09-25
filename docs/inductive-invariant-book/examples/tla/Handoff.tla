---- MODULE Handoff ----
\* ロックを「許可メッセージ」で相手に渡す。渡している間は誰も持っていない
Procs == {"a", "b"}

VARIABLES (* @type: Str -> Str; *) pc, (* @type: Str; *) holder, (* @type: Str; *) grant
vars == <<pc, holder, grant>>

Init ==
  /\ pc = [p \in Procs |-> "idle"]
  /\ holder = "a"
  /\ grant = "none"

Enter(p) ==
  /\ pc[p] = "idle"
  /\ holder = p
  /\ pc' = [pc EXCEPT ![p] = "cs"]
  /\ UNCHANGED <<holder, grant>>

Exit(p) ==
  /\ pc[p] = "cs"
  /\ pc' = [pc EXCEPT ![p] = "idle"]
  /\ UNCHANGED <<holder, grant>>

\* 持っている p が、cs の外で q に許可を送る
Send(p, q) ==
  /\ holder = p
  /\ pc[p] = "idle"
  /\ p /= q
  /\ holder' = "none"
  /\ grant' = q
  /\ UNCHANGED pc

\* 許可が届く
Recv(q) ==
  /\ grant = q
  /\ holder' = q
  /\ grant' = "none"
  /\ UNCHANGED pc

Next == \E p, q \in Procs : Enter(p) \/ Exit(p) \/ Send(p, q) \/ Recv(q)
Spec == Init /\ [][Next]_vars

Mutex == ~(pc["a"] = "cs" /\ pc["b"] = "cs")

TypeOK ==
  /\ pc \in [Procs -> {"idle", "cs"}]
  /\ holder \in Procs \cup {"none"}
  /\ grant \in Procs \cup {"none"}

\* 演習の出発点: 2 章の Mutex と同じ形の強化
IndStart == TypeOK /\ Mutex /\ \A p \in Procs : pc[p] = "cs" => holder = p
====
