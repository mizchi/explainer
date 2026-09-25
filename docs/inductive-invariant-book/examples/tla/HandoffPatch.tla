---- MODULE HandoffPatch ----
EXTENDS Handoff

\* CTI の State0 だけを名指しで締め出した (一般化していない) 版
IndPatch == IndStart /\ ~(grant = "b" /\ holder = "a")
====
