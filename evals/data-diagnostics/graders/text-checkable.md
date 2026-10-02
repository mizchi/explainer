---
type: llm
weight: 1
focus: trace
---
作業の記録から、資料に付けた図の形式を見る。
PASS の条件：図の文字が、画像の中の文字として機械で読める形式になっている。
- PASS の例：Vega-Lite / Vega の spec、<text> 要素で文字を書いた SVG、HTML、Mermaid、
  svg.fonttype を "none" にした matplotlib のコード
- FAIL の例：svg.fonttype を指定しない matplotlib のコード（SVG の文字が輪郭になる）、PNG だけ、図が無い
