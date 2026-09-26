---
type: regex
weight: 1
target: { source: file, path: docs/buildkit-cache/README.md }
match: not_contains
flags: m
pattern: '^(?!#)[^\n]*(Docker|コンテナ|Docker\s*イメージ|Dockerfile|マルチステージビルド)\s*とは'
---
見出し以外の本文で、読み手の既知を「〜とは」と定義し直していないか。
