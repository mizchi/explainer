---
type: llm
weight: 2
focus: { source: file, path: docs/model-check/README.md }
---
PASS の条件：資料に、診断項目ごとに「実測値」「合格の基準」「判定」「次にやること」が分かる表（列名は問わない）がある。
かつ、binned residual で 2SE の外に出たビン（20 個中 5 個。外れ方に U 字のような形がある）を、問題あり（要対処など）と判定し、
具体的な次の手（x1 の非線形の項・スプラインを足す、など）を書いている。
表が無い、または binned residual の外れを問題なしとしていれば FAIL。
