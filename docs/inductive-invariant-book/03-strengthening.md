# 03 不変条件を強める：CTI から条件を読み取る

> 15 分（演習を含む）。
> ゴールは、到達できない CTI を締め出す条件を自分で書き、1 章の 3 つの check を通すことです。

## やり方は 4 手

条件を足して、帰納法の一歩を通るようにすることを**帰納的強化**と呼びます。
手順は毎回同じです。

1. CTI の `State0` を読む。
2. 「なぜこの状態には着けないのか」を、ドメインの言葉で 1 文にする。
3. その 1 文を式にして、不変条件に `/\` で足す。
4. 1 章の 3 つの check を回す。落ちたら、新しい CTI で 1 に戻る。

2 の 1 文が書けないなら、2 章の手順で先に到達可能性を確かめます。着けるなら、足すべき条件はありません。

## 例：1 章の IndInv はこうして作った

2 章の `Mutex` の CTI は、次の `State0` でした。

```
State0 == lock = "free" /\ pc = SetAsFun({ <<"a", "cs">>, <<"b", "idle">> })
```

1. `a` は `cs` にいるのに、ロックが空いている。
2. 「`cs` にいるプロセスは、ロックを持っている」から、この状態には着けない。
3. 式にすると `\A p \in Procs : pc[p] = "cs" => lock = p`。
4. 1 章の 3 つの check が通る。

## 演習：許可をメッセージで渡すロック

`Handoff.tla` では、ロックを持っているプロセスが、相手に「許可」を送って渡します。
許可が届くまでの間は、誰もロックを持っていません。

<!-- source: examples/tla/Handoff.tla -->
```tla
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
```

TLC で `Mutex` を検査すると、破れません。

<!-- output: tlc-handoff -->
```
No error has been found.
6 distinct states found
```

出発点として、`Mutex` と同じ形の条件を用意しました。

<!-- source: examples/tla/Handoff.tla -->
```tla
\* 演習の出発点: 2 章の Mutex と同じ形の強化
IndStart == TypeOK /\ Mutex /\ \A p \in Procs : pc[p] = "cs" => holder = p
```

これは一歩の検査に落ちます。

```sh
apalache-mc check --init=IndStart --inv=IndStart --length=1 Handoff.tla
```

<!-- output: apa-handoff-start -->
```
State 1: state invariant 4 violated.
EXITCODE: ERROR (12)
grant = "b"
/\ holder = "a"
/\ pc = SetAsFun({ <<"a", "cs">>, <<"b", "idle">> })
```

<!-- exercise: ex-handoff -->
**問い**：`HandoffSolution.tla` に `IndInv == IndStart /\ …` を書き、1 章の 3 つの check をすべて通してください。
足した条件を、ドメインの言葉で 1 文で説明してください。

```sh
apalache-mc check --init=Init   --inv=IndInv --length=0 HandoffSolution.tla
apalache-mc check --init=IndInv --inv=IndInv --length=1 HandoffSolution.tla
apalache-mc check --init=IndInv --inv=Mutex  --length=0 HandoffSolution.tla
```

<details><summary>答え</summary>

`State0` では、`a` がロックを持ったまま、`b` 宛ての許可が飛んでいます。
許可が届くと `b` も持ち主になり、`a` は `cs` にいるのにロックを持っていない状態になります。

この状態に着けないのは、`Send` がロックを手放してから許可を送るからです。
1 文にすると「**許可が飛んでいる間は、誰もロックを持っていない**」です。

<!-- source: examples/tla/HandoffSolution.tla -->
```tla
\* 許可が転送中なら、誰も持っていない
IndInv == IndStart /\ (grant /= "none" => holder = "none")
```

基底：

<!-- output: apa-handoff-base -->
```
Checker reports no error up to computation length 0
```

一歩：

<!-- output: apa-handoff-step -->
```
Checker reports no error up to computation length 1
```

含意：

<!-- output: apa-handoff-implies -->
```
Checker reports no error up to computation length 0
```

言い換えると、「ロックの権利は、持ち主か転送中の許可の、どちらか 1 か所にしかない」ということです。
二重 writer のような「権利が 2 か所に同時にある」バグを探すとき、帰納的不変条件はこの形になることが多いです。
</details>

## AI が書いた強化をレビューするとき

- 足された条件ごとに、手順 2 の「1 文」があるか。
- その 1 文は、仕様の action（ここでは `Send` の順序）で説明できるか。
- 3 つの check が、コマンドごと報告されているか（1 章）。

1 文にできない条件は、たまたま検査を通っただけかもしれません。
その場合は、条件を 1 つずつ外して、どの CTI が戻ってくるかを見ます。

## 理解度チェック

<!-- quiz: strengthen -->
<details><summary>Q1. 条件を足したら一歩の検査は通ったが、基底が落ちた。何が起きている？</summary>

足した条件が強すぎて、初期状態でも成り立っていません。
到達できる状態まで締め出しています。
`Init` を満たす状態で、足した条件がどう破れるかを見て、条件を緩めます。
</details>

<!-- quiz: explain-lemma -->
<details><summary>Q2. <code>grant /= "none" => holder = "none"</code> を、仕様を読まない人に 1 文で説明すると？</summary>

「許可を送っている間は、ロックは誰の手にもない」です。
だからロックの権利は、いつも 1 か所にしかありません。
</details>

<!-- quiz: strengthen -->
<details><summary>Q3. CTI の <code>State0</code> を締め出す条件として、<code>~(grant = "b" /\ holder = "a")</code> をそのまま足した。何がまずい？</summary>

その 1 状態しか締め出せません。
実際に足して回すと、`a` と `b` を入れ替えた CTI が出ます（`examples/tla/HandoffPatch.tla`）。

<!-- output: apa-handoff-patch -->
```
State 1: state invariant 4 violated.
grant = "a"
/\ holder = "b"
/\ pc = SetAsFun({ <<"a", "idle">>, <<"b", "cs">> })
```

手順 2 の「なぜ着けないか」を一般化した条件（`grant /= "none" => holder = "none"`）を足します。
</details>

← [目次](README.md)
