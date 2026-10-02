---
type: tool_used
tool: Write
input_match: '"file_path"\s*:\s*"[^"]*\.(?:json|svg|html|py|mjs|js|ts|d2|mmd)".*\s[—–]\s[^"<\\]{0,40}(?:沿|離れ|以下|以内|未満|超え|形が|なら|合格|良い|べき|ほど|無い|ない)'
weight: 1
---
図のファイル（Vega-Lite の spec、SVG、HTML、描画コードなど）のパネルの題に、「何を見る図か — 何が見えれば合格か」の形がある。

LLM の判定（focus: trace）は、記録の最初と最後の 12 件しか見ないので、図のファイルを書いた Write が見えなかった（15 回目）。Write の入力を正規表現で見る。
1 か所でもあれば通るので、すべてのパネルに付いているかは見ていない。
