---
type: regex
weight: 2
target: { source: file, path: docs/buildkit-cache/README.md }
match: not_contains
flags: m
pattern: '^#{1,6}[^\n]*(Docker\s*とは|コンテナとは|イメージとは|Dockerfile\s*(とは|の基本|の書き方)|レイヤー\s*(とは|の仕組み)|マルチステージビルド\s*(とは|の基本)|インストール|docker\s*コマンドの基本)'
---
読み手の既知（Docker、イメージ、Dockerfile、レイヤー、マルチステージビルド）に見出しを割いていないか。
「BuildKit とは」は既知に含めない（読み手はそこで迷っている）。
