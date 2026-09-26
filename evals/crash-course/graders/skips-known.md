---
type: regex
weight: 2
target: { source: file, path: docs/money/README.md }
match: not_contains
flags: m
pattern: "^#{1,6}[^\\n]*(型注釈|型エイリアス|ジェネリクス|型システム|TypeScript\\s*の型|number\\s*型とは|数値型とは|number\\s*型の基本|整数と小数の区別|演算子の(使い方|基本)|Math\\.(round|floor)\\s*の使い方|toFixed\\s*の使い方|インストール|実行方法|実行のしかた|Node\\.?js\\s*(とは|の使い方)|console\\.log|基本構文)"
---
読み手の既知（依頼文の「型システムや number 型の基本は説明不要」）に、見出しを割いていないか。

LLM の判定は 3 回目に 2 対 1 で割れ、4 回目は全件 FAIL だったが、保存済みの 14 の資料のどれにも既知を説明する見出しは無かった。
そのため、判定を機械的にした。見出しに次の語が出たら FAIL：
- K1 型システム：型注釈、型エイリアス、ジェネリクス、型システム、TypeScript の型
- K2 number 型の基本：number 型とは、数値型とは、number 型の基本、整数と小数の区別
- K3 関数の呼び方：演算子の使い方、Math.round / Math.floor / toFixed の使い方
- K4 実行と基本構文：インストール、実行方法、Node.js とは / の使い方、console.log、基本構文

見出しだけを見るので、本文の段落で既知を長く説明していても検出できない。
