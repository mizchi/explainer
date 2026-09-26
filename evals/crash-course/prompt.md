---
description: 読み手のペルソナが与えられたとき、既知を省き、実行した出力と理解度チェックつきの速習資料を書くか
tags: [explainer, heavy]
runs: 3
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Write, Edit, Bash, Glob, Grep, Skill]
---

読み手は次の人です。

- 10 年以上 TypeScript を書いているフロントエンドエンジニア。型システムや `number` 型の基本は説明不要。
- 先週、請求金額の合計が 1 円ずれるバグを出して、浮動小数点に自信がなくなった。
- 読む時間は 15 分。コードから入る説明が好き。

この人向けに、JavaScript の数値計算で金額を扱うときの落とし穴の速習資料を
`docs/money/README.md` に書いてください。コード例を含めてください。
