---
type: llm
weight: 2
focus: { source: file, path: docs/buildkit-cache/README.md }
---
PASS の条件：次の 3 点を、どれも正しく説明している。
1. `RUN --mount=type=cache` のキャッシュは、そのビルダー（BuildKit のインスタンス）の手元に残るもので、イメージのレイヤーには入らない。
2. `--cache-to` / `--cache-from`（`type=registry` や `type=gha` など）が書き出し・読み込みするのはレイヤーのキャッシュで、キャッシュマウントの中身は含まれない。
3. したがって、実行のたびにビルダーが作り直される CI（使い捨てのランナー）では、何もしなければキャッシュマウントは次のビルドに残らない。レイヤーキャッシュはレジストリなどへの書き出しで持ち越せる。
どれか 1 つでも誤っているか、欠けていれば FAIL。
