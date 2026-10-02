---
type: tool_used
tool: Write
input_match: '"file_path"\s*:\s*"[^"]*\.(?:json|svg|html|py|mjs|js|ts|d2|mmd)".*(?:strokeDash|stroke-dash|dasharray|linestyle|ls=|dashed)'
weight: 1
---
図のファイルで、合格の基準の線（対角線・陽性率・±2SE のバンドなど）を破線で描くよう指定している。
破線が基準の線に使われているかまでは見ていない。
