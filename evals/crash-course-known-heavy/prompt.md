---
description: 読み手の既知に節を割きやすい題材で、既知を省き、未知の核心を正しく説明するか（crash-course の既知の省略は、金額計算の題材ではあり・なしとも満たしたため）
tags: [explainer, known-heavy]
runs: 3
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

読み手は次の人です。

- Docker と Kubernetes を 5 年以上本番で運用しているインフラエンジニア。
- Dockerfile、イメージのレイヤー、マルチステージビルドは毎日書いている。この辺りの説明は不要。
- CI のイメージビルドが遅く、BuildKit のキャッシュ（`RUN --mount=type=cache`、`--cache-to` / `--cache-from`、レジストリキャッシュ）の違いが分からなくなっている。
- 読む時間は 15 分。

この人向けに、BuildKit のキャッシュの使い分けの速習資料を `docs/buildkit-cache/README.md` に書いてください。
