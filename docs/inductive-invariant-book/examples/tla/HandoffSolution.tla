---- MODULE HandoffSolution ----
EXTENDS Handoff

\* 許可が転送中なら、誰も持っていない
IndInv == IndStart /\ (grant /= "none" => holder = "none")
====
