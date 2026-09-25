---- MODULE MutexReach ----
EXTENDS Mutex

\* Apalache が返した CTI の最初の状態。TLC で「ここに着けるか」を調べる
NotCTI == ~(lock = "free" /\ pc["a"] = "cs" /\ pc["b"] = "idle")
====
