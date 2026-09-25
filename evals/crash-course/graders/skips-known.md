---
type: llm
weight: 2
focus: { source: file, path: docs/money/README.md }
---
読み手は TypeScript 歴 10 年で、型システムや number 型の基本は説明不要と明示されている。
PASS の条件：資料が「number 型とは何か」「TypeScript の型注釈の書き方」「JavaScript の基本構文」の説明に段落を割いていない。
IEEE 754 の丸めなど、読み手が自信を失った部分の説明はしてよい。
既知の基本の説明が 1 段落でもあれば FAIL。
