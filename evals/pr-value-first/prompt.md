---
description: 差分だけでは影響が見えない PR で、読み手にとって何が変わるか（価値）を先に書き、差分と仕組みを根拠として後に置くか
tags: [explainer, cheap]
runs: 3
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

次の差分の PR を、オンコール担当の SRE の佐藤さんに説明してください。
佐藤さんは TypeScript のコードを細かくは追いません。障害対応で何が変わるかを知りたい人です。

```diff
 export async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
-  for (let attempt = 0; attempt < 5; attempt++) {
+  for (let attempt = 0; attempt < 5; attempt++) {
     try {
       const res = await fetch(url, init);
       if (res.status < 500) return res;
     } catch {}
-    await sleep(100);
+    const base = Math.min(100 * 2 ** attempt, 3200);
+    await sleep(base / 2 + Math.random() * (base / 2));
   }
   throw new Error(`gave up after 5 attempts: ${url}`);
 }
```
