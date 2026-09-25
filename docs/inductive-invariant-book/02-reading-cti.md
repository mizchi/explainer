# 02 反例を読む：弱すぎるのか、本当に壊れているのか

> 12 分。
> ゴールは、帰納法の一歩の検査が落ちたとき、原因を TLC で切り分けられるようになることです。
> 原因は「条件が弱すぎる」か「性質が本当に破れる」かのどちらかです。

## 性質そのものを帰納法にかける

1 章の `IndInv` を使わず、性質 `Mutex` と型の制約だけで一歩の検査をします。

<!-- source: examples/tla/Mutex.tla -->
```tla
\* 性質そのままを帰納法にかける
IndNaive == TypeOK /\ Mutex
```

```sh
apalache-mc check --init=IndNaive --inv=IndNaive --length=1 Mutex.tla
```

<!-- output: apa-mutex-naive -->
```
State 1: state invariant 2 violated.
EXITCODE: ERROR (12)
State0 == lock = "free" /\ pc = SetAsFun({ <<"a", "cs">>, <<"b", "idle">> })
State1 == lock = "b" /\ pc = SetAsFun({ <<"a", "cs">>, <<"b", "cs">> })
```

`State0` は `IndNaive` を満たします。`b` は `cs` にいないので、`Mutex` は成り立っています。
そこから `b` が空いているロックを取ると、`State1` で `Mutex` が破れます。

このような「条件を満たす状態から一歩で条件が破れる」組を、**CTI**（counterexample to induction：帰納法の反例）と呼びます。

## CTI だけでは、バグかどうか分からない

`State0` は、`a` が `cs` にいるのにロックが空いている状態です。
この状態に初期状態から着けないなら、この CTI は現実には起きません。条件が弱すぎただけです。
着けるなら、性質が本当に破れます。

見るべきは `State0` の**到達可能性**です。
TLC に「`State0` ではない」という不変条件を渡して、破れるかを見ます。

<!-- source: examples/tla/MutexReach.tla -->
```tla
\* Apalache が返した CTI の最初の状態。TLC で「ここに着けるか」を調べる
NotCTI == ~(lock = "free" /\ pc["a"] = "cs" /\ pc["b"] = "idle")
```

<!-- output: tlc-mutex-reach -->
```
No error has been found.
3 distinct states found
```

`NotCTI` は破れません。`State0` には着けないということです。
`Mutex` 自体も TLC で破れません。

<!-- output: tlc-mutex -->
```
No error has been found.
```

結論：`Mutex` は正しく、`IndNaive` が弱すぎただけです。
1 章の `IndInv` は、`IndNaive` に「`cs` にいるならロックを持つ」を足して、この `State0` を締め出したものです。

TLC が見るのは `Procs = {"a", "b"}` の有限の世界だけです。
「着けない」と言えるのは、この大きさの世界の中だけです。

## 判定の手順

| 手順 | 道具 | 結果と次の一手 |
|---|---|---|
| 1. 一歩の検査 | Apalache `--init=X --inv=X --length=1` | 通れば基底と含意へ（1 章）。落ちたら 2 へ |
| 2. CTI の `State0` に着けるか | TLC で `~State0` を不変条件にする | 着けないなら 3 へ。着けるなら 4 へ |
| 3. 条件が弱すぎる | — | `State0` を締め出す条件を足す（3 章） |
| 4. 性質が破れている可能性 | TLC で性質そのものを検査 | 反例トレースが出れば、バグ報告になる |

## 演習：check-then-act 版

`MutexRacy.tla` は、`Acquire` を「ロックが空いているか確かめる（`Check`）」と「取る（`Take`）」の 2 歩に分けた版です。
同じ `IndNaive` で一歩の検査をすると、次の CTI が出ます。

<!-- output: apa-racy-naive -->
```
State 1: state invariant 2 violated.
EXITCODE: ERROR (12)
State0 == lock = "free" /\ pc = SetAsFun({ <<"a", "checked">>, <<"b", "cs">> })
State1 == lock = "a" /\ pc = SetAsFun({ <<"a", "cs">>, <<"b", "cs">> })
```

<!-- exercise: ex-reach -->
**問い**：この `State0` には着けるか。
TLC で確かめる不変条件を書き、弱すぎるだけか、本当に壊れているかを判定してください。

<details><summary>答え</summary>

<!-- source: examples/tla/MutexRacyReach.tla -->
```tla
NotCTI == ~(lock = "free" /\ pc["a"] = "checked" /\ pc["b"] = "cs")
```

<!-- output: tlc-racy-reach -->
```
Error: Invariant NotCTI is violated.
State 5: <Take("b")
/\ pc = [a |-> "cs", b |-> "cs"]
State 6: <Release("a")
State 7: <Check("a")
/\ pc = [a |-> "checked", b |-> "cs"]
```

着けます。
ただし TLC のトレースは、`State0` に着く前の State 5 で、もう 2 人とも `cs` にいます。
`State0` に着けるのは、先に `Mutex` が破れたからです。
手順 4 に進み、`Mutex` そのものを TLC で検査します。

<!-- output: tlc-racy-mutex -->
```
Error: Invariant Mutex is violated.
State 2: <Check("a")
State 3: <Check("b")
State 4: <Take("a")
State 5: <Take("b")
/\ pc = [a |-> "cs", b |-> "cs"]
```

2 人とも空いているのを確かめてから取るので、両方が `cs` に入ります。
これは本物のバグです。条件を足しても直りません。直すのは仕様（`Check` と `Take` を 1 歩にする）です。
</details>

## 理解度チェック

<!-- quiz: classify-cti -->
<details><summary>Q1. CTI が出た。そのまま「不変条件が弱い」として条件を足し始めてよいか？</summary>

よくありません。
先に TLC で `State0` に着けるかを見ます。
着けるなら性質が本当に破れている可能性があり、条件を足しても直りません（`MutexRacy`）。
</details>

<!-- quiz: classify-cti -->
<details><summary>Q2. TLC で「State0 には着けない」と分かった。これで性質は正しいと言えるか？</summary>

まだ言えません。
分かったのは、この CTI が現実には起きないことだけです。
条件を足したあと、1 章の 3 つの check がすべて通って、初めて示せます。
また、TLC の結論は `Procs` が 2 つの世界に限られます。
</details>

次の章では、着けない `State0` を締め出す条件を、自分で見つけます。→ [03 不変条件を強める](03-strengthening.md)
