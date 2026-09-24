# mizchi

- 作成日: 2026-09-24
- 材料: 公開情報のみ（質問なし）。出典は各行と末尾
- 読み手と書き手が同一人物か: おそらく yes（依頼者のメールアドレスが本人名と一致）。未確認

## 背景（事実）

- 長く JavaScript / TypeScript / React を中心にしてきた。フリーランスで Web パフォーマンス改善を請け負う — [職務経歴 gist](https://gist.github.com/mizchi/4e097923bb92399d03ced9da44f15cfa), [CodeZine](https://codezine.jp/article/detail/21327)
- 2025〜2026 年は MoonBit が主言語（`actrun`, `luna.mbt`, `crater` など）。Rust、Pkl、Nix も使う — [GitHub](https://github.com/mizchi?tab=repositories), [MoonBit 最高 2025](https://zenn.dev/mizchi/articles/moonbit-is-good-2025)
- コーディングエージェントを多用する。約 80 個のスキルを公開し、`vlmkit` などの検証ツールを作っている — [mizchi/skills](https://github.com/mizchi/skills), [mizchi/vlmkit](https://github.com/mizchi/vlmkit)
- 大学は文系入学。プログラミングは独学 — [kyonmm-lt](https://mizchi.github.io/kyonmm-lt/)

## この分野で既に知っていること（事実）

- 2026-07 から、約 10 種の検証器を同じ実務的な題材で比較している。対象は Alloy 6、Z3、TLA+（TLC / Apalache / TLAPS）、Quint、Dafny、Lean 4 など — [formal-methods-playground](https://github.com/mizchi/formal-methods-playground)
- 個人の選択基準：「Alloyで構造を探索し、Quintで振る舞いを探索し、Leanで安定した法則を証明する」。Z3 は純粋な述語や新旧の等価性確認に使う — 同 `docs/personal-tool-selection.md`
- 実装コードから仕様を抜き出し、Z3 / TLA+ で反例を出す手順を書いている。「何も検証していない緑」を警戒している — [gist: 実践プレイブック](https://gist.github.com/mizchi/db7817e6fc077d567c41cd9d41bb1c53)
- Quint と Apalache / TLC で、実在のプロジェクトの二重 writer バグを見つけた。記事は「AIに分散システムのバグを探させて、そのレポートを自分が理解できるように整形させたもの」 — [Zenn](https://zenn.dev/mizchi/articles/quint-application-modeling)
- `veri`（MoonBit の検証基盤、Why3 経由で Z3 / CVC5）では「`unknown` / timeout は未証明。真偽の結論にはしない」と明記している — [mizchi/veri](https://github.com/mizchi/veri)
- Dafny で詰まった点として「非線形算術や高階の量化子が要る証明責務で摩擦が始まる」と書いている — formal-methods-playground `findings.md`
- 「LLM が提案し、ソルバが決める」という立場のスキルを持つ（`formal-methods-reconciler`, `formal-methods-drift-guard`） — [mizchi/skills](https://github.com/mizchi/skills)

## 怪しいところ（推測。資料の芯）

- **ツールを回せることと、結果の意味を自分で判定できることの差。** 幅広い検証器をエージェントと速く回しているので、背後の理論に手で触れた量が、幅に追いついていない可能性がある。本人も「自分で書いていて自信がなくなった」と言っている（依頼文）。
- 具体的には、次の区別を自分の言葉で説明できるか。
  - sat / unsat / unknown の意味。`unknown` が出る理由（非線形算術・量化子、決定可能性）
  - モデルの世界（型・定数の大きさ）と実装の世界の差
  - 有界検査（BMC）、有限インスタンスの全探索、帰納法。それぞれの「OK」の守備範囲
  - 帰納的不変条件と CTI（帰納法の反例）、不変条件の強化
  - 空虚な真（vacuity）
  - 安全性と活性、stuttering、公平性の仮定
- 手書きの証明の経験を示す公開情報は見つからなかった。Lean の作業は AI 支援に見える（推測）。

## 読み方

- 日本語で書く。コードから入る。
- 段落は短い。本人の文章は平均 1.4 文/段落、64% が 1 文の段落 — mizchi/skills の `mizchi-blog-style`
- 例は実務寄り（分散システムのバグ、TS の関数）。数学記号は最小限にし、コードと出力で示す。
- 読む時間：20 分程度を想定（推測）

## この資料で省くもの

- 各ツールの紹介、「TLA+ とは」、インストール手順
- ツールの選び方（本人の基準が既にある）
- 形式手法を使う意義の一般論

## 出典

- https://github.com/mizchi
- https://github.com/mizchi/formal-methods-playground
- https://gist.github.com/mizchi/db7817e6fc077d567c41cd9d41bb1c53
- https://zenn.dev/mizchi/articles/quint-application-modeling
- https://github.com/mizchi/veri
- https://github.com/mizchi/skills
- https://gist.github.com/mizchi/4e097923bb92399d03ced9da44f15cfa
- https://mizchi.github.io/kyonmm-lt/
