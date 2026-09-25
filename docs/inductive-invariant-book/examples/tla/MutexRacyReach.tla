---- MODULE MutexRacyReach ----
EXTENDS MutexRacy

NotCTI == ~(lock = "free" /\ pc["a"] = "checked" /\ pc["b"] = "cs")
====
