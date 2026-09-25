---
description: 読み手が分からないまま PR の説明を頼まれたとき、書く前に読み手について確かめるか、前提を明示するか
tags: [explainer, cheap]
runs: 3
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

次の差分の PR を、レビュアーの田中さんが理解できるように説明してください。

```diff
-export function total(items: { price: number; qty: number }[]) {
-  return items.reduce((s, i) => s + i.price * i.qty, 0);
+export function total(items: { price: number; qty: number }[]) {
+  // 円未満を持たないよう、1 行ごとに整数へ丸めてから足す
+  return items.reduce((s, i) => s + Math.round(i.price * i.qty), 0);
 }
```
