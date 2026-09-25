# 01 クイックスタート：帰納法の検査を 3 回まわす

> 10 分。
> ゴールは、Apalache の 3 つの `check` で「不変条件が何歩でも成り立つ」ことを示すことです。
> TLA+ が読めて、`npm run setup:tla` で Apalache が入っていることを前提にします。

## 題材：ロック 1 つの相互排他

2 つのプロセス `a` と `b` が、ロック変数 `lock` を取ってから `cs`（クリティカルセクション）に入ります。

<!-- source: examples/tla/Mutex.tla -->
```tla
Acquire(p) ==
  /\ pc[p] = "idle"
  /\ lock = "free"
  /\ lock' = p
  /\ pc' = [pc EXCEPT ![p] = "cs"]

Release(p) ==
  /\ pc[p] = "cs"
  /\ lock' = "free"
  /\ pc' = [pc EXCEPT ![p] = "idle"]
```

守りたい性質は `Mutex`（2 人同時に `cs` にいない）です。
証明に使う条件 `IndInv` は、仕様の最後に用意してあります。

<!-- source: examples/tla/Mutex.tla -->
```tla
\* cs にいるなら、ロックを持っているのは自分
IndInv == TypeOK /\ Mutex /\ \A p \in Procs : pc[p] = "cs" => lock = p
```

## 3 つのコマンド

`examples/tla/` で、次の 3 つを実行します。

```sh
apalache-mc check --init=Init   --inv=IndInv --length=0 Mutex.tla   # 基底
apalache-mc check --init=IndInv --inv=IndInv --length=1 Mutex.tla   # 一歩
apalache-mc check --init=IndInv --inv=Mutex  --length=0 Mutex.tla   # 含意
```

<!-- output: apa-mutex-base -->
```
Checker reports no error up to computation length 0
EXITCODE: OK
```

<!-- output: apa-mutex-step -->
```
Checker reports no error up to computation length 1
EXITCODE: OK
```

<!-- output: apa-mutex-implies -->
```
Checker reports no error up to computation length 0
EXITCODE: OK
```

3 つとも `OK` です。

## 何が示されたか

`--init=X` は「X を満たす**任意の**状態から始める」という意味です。
初期状態から辿れるかどうかは問いません。

| コマンド | 示したこと |
|---|---|
| 基底 | `Init` を満たす状態は `IndInv` を満たす |
| 一歩 | `IndInv` を満たす任意の状態から一歩進んでも、`IndInv` を満たす |
| 含意 | `IndInv` を満たす状態は `Mutex` を満たす |

基底と一歩がそろうと、`IndInv` は何歩進んでも破れません。
このような条件を**帰納的不変条件**と呼びます。
含意があるので、`Mutex` も何歩進んでも破れません。

3 つのうち 1 つでも欠けると、何も示せません。

## 同じ文面、違う意味

`--init` を付けずに実行すると、Apalache は初期状態から 10 歩だけ調べます（有界モデル検査）。

```sh
apalache-mc check --inv=Mutex Mutex.tla
```

<!-- output: apa-mutex-bmc -->
```
Checker reports no error up to computation length 10
EXITCODE: OK
```

こちらは「10 歩以内には反例がない」だけです。
11 歩目のことは何も言っていません。

**出力の文面だけでは、どちらの検査か分かりません。**
結果を報告するときは、コマンドも一緒に残してください。

## 理解度チェック

<!-- quiz: run-three -->
<details><summary>Q1. 一歩の check（<code>--init=IndInv --inv=IndInv --length=1</code>）だけが通った。<code>Mutex</code> は何歩でも成り立つと言えるか？</summary>

言えません。
基底がなければ、初期状態が `IndInv` を満たすか分かりません。
含意がなければ、`IndInv` が `Mutex` を守るか分かりません。
</details>

<!-- quiz: read-length -->
<details><summary>Q2. 同僚が「Apalache で length 10 まで no error」と報告してきた。まず何を聞く？</summary>

`--init` に何を渡したかを聞きます。
`Init`（または指定なし）なら、10 歩以内に反例がないだけです。
帰納的不変条件を渡した一歩の検査なら、length は 1 のはずです。
</details>

次の章では、帰納法の検査が**落ちた**ときの読み方を扱います。→ [02 反例を読む](02-reading-cti.md)
