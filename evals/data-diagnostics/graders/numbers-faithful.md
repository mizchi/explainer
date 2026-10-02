---
type: llm
weight: 1
focus: { source: file, path: docs/model-check/README.md }
---
PASS の条件：資料に出てくる診断の数値（AUC・AP・Brier・陽性率・係数・ビンの値・外れたビンの数）が、依頼文の表と一致する（丸め方の違いは可）。
依頼文に無い数値（例：x2 の SE、p 値、別の指標の値）を、計算したかのように書いていない。
依頼文の値から計算できるもの（Brier のベースライン 0.314 × 0.686 ≈ 0.215、外れたビンの数など）は可。
