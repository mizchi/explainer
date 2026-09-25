# explainer

AI から人間へ概念を説明するための、スキルと道具です。

コーディングエージェントが書く速さに、人間の理解が追いつかなくなっています（[Geoffrey Litt, *Understanding is the new bottleneck*](https://www.geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck)）。
このリポジトリは、読み手 1 人のために、**その人が知らないことだけ**を、**道具で検証した主張と図**で書くためのものです。

## 何をするか

```
ペルソナ ─→ 問い ─→ 実物（実行できる例・モデル） ─→ 本文 + 図 ─→ 検証 ─→ HTML
  │                          │                          │           │
  質問 + 公開情報        出力は貼る。打ち直さない     vlmkit-anim   verify-doc.mjs
                                                   事実シート照合  (checks / 図 / 引用 / vlmkit)
```

- **ペルソナ**（`personas/`）：読み手が既に知っていることと、怪しいところ。資料から何を削るかを決める。
- **スキル**（`skills/explainer/`）：手順、文体、図の選び方、検証の仕方。
- **検証**：本文に引用した出力は `checks.json` で再実行して照合します。図は [`@mizchi/vlmkit-anim`](https://github.com/mizchi/vlmkit) で事実シートと照合し、ページは `vlmkit check integrity` / `check a11y contrast` に通します。

[ELI5](https://github.com/dreambigou/eli5) は、読み手を型（年齢・職種）で扱います。
このスキルは、実在の 1 人をペルソナとして扱い、書いた主張を道具で検査します。

## 例：mizchi 向けの形式手法の速習資料

- ペルソナ：[`personas/mizchi.md`](personas/mizchi.md)（公開情報から作成。事実と推測を分けて記載）
- 資料：[`docs/formal-methods/README.md`](docs/formal-methods/README.md)「緑を読む：Z3 と TLA+ の『OK』は何を保証したのか」

ペルソナを作ってみると、読み手は形式手法の初心者ではありませんでした。
約 10 種の検証器をエージェント経由で既に回しています。
そこで資料は、ツールの入門ではなく、**検査器の結果が何を保証したかを自分で判定する基準**に絞りました。

## 使い方

```sh
npm install            # Node 24+（vlmkit の要件）
npm run setup:tla      # TLC と Apalache を .tools/ に取得（Java 17+）
npm run verify         # docs/formal-methods を検証 → verdict: VERIFIED
npm run build          # docs/formal-methods/dist/index.html を生成
```

スキルを他のリポジトリで使う場合：

```sh
cp -r skills/explainer ~/.claude/skills/explainer
```

このリポジトリの中では、`.claude/skills/explainer` から自動で読み込まれます。

## 構成

| パス | 内容 |
|---|---|
| `skills/explainer/SKILL.md` | スキル本体 |
| `skills/explainer/references/` | ペルソナ・文体・図のガイド |
| `skills/explainer/scripts/verify-doc.mjs` | 検証（checks / vlmkit-anim / 引用照合 / vlmkit ゲート） |
| `skills/explainer/scripts/build-html.mjs` | Markdown → 自己完結 HTML |
| `skills/explainer/scripts/tlc-to-scene.mjs` | TLC の状態グラフ・反例 → vlmkit-anim の図と事実シート |
| `personas/` | 読み手のペルソナ |
| `docs/<topic>/` | 資料：`README.md`, `checks.json`, `examples/`, `figures/` |
| `evals/evals.json` | スキルの評価ケース（eli5 と同じ形式） |
