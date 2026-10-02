---
type: tool_used
tool: Write
input_match: '"file_path"\s*:\s*"[^"]*(?:\.vl\.json|\.svg|\.html|\.mmd|\.d2)"|svg\.fonttype'
weight: 1
---
図の文字が、機械で読める形式で書かれている：Vega-Lite の spec、SVG、HTML、Mermaid、D2、または svg.fonttype を指定した matplotlib のコード。
（SVG は、文字を <text> で書いたかまでは見ていない。手で書く SVG はふつう <text> を使う）
