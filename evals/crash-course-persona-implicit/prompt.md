---
description: 読み手の既知が依頼文に書かれておらず、ペルソナのファイルにだけあるとき、それを読み取って既知を省くか（crash-course-known-heavy と同じ題材・同じ grader。違いは既知の渡し方だけ）
tags: [explainer, persona-implicit]
runs: 3
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

`personas/yamada.md` の人向けに、BuildKit のキャッシュの使い分けの速習資料を `docs/buildkit-cache/README.md` に書いてください。
ペルソナのファイルの中身は次のとおりです。

````markdown
# yamada

- 作成日: 2026-09-20
- 材料: 本人への質問（5 問）、社内の GitHub

## 背景
- インフラエンジニア。Docker と Kubernetes を 5 年以上、本番で運用している。
- 社内の全サービスが使うベースイメージを管理している。Dockerfile、イメージのレイヤー、マルチステージビルドは毎日書く。
- GitHub Actions の CI も担当している。ランナーは毎回作り直される使い捨て。

## 最近の困りごと
- CI のイメージビルドが遅い。
- `RUN --mount=type=cache`、`--cache-to` / `--cache-from`、レジストリキャッシュを試したが、どれが何を持ち越すのか整理できていない。

## 読み方
- 日本語。コードから入る説明が好き。
- 読む時間は 15 分。
````
