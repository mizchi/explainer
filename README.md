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

## 例：章立ての学習資料（本）

1 本の資料に収まらないときは、`explainer-book` スキルで章立てにします。

- 本：[`docs/inductive-invariant-book/`](docs/inductive-invariant-book/README.md)「帰納的不変条件を自分で見つける」（全 3 章）
  - `01-quickstart.md`：Apalache の 3 つの check で、不変条件が何歩でも成り立つことを示す
  - `02-reading-cti.md`：帰納法の反例（CTI）が、条件の弱さかバグかを TLC で切り分ける
  - `03-strengthening.md`：CTI から足すべき条件を読み取る演習
- 本全体の検査（`verify-book.mjs`）：学習目標と理解度チェックの対応、概念を導入前に使っていないか、章の読了時間、演習の出発点が落ちて答えが通るか、章の依存図

## 使い方

```sh
npm install            # Node 24+（vlmkit の要件）
npm run setup:tla      # TLC と Apalache を .tools/ に取得（Java 17+）
npm run verify         # docs/formal-methods を検証 → verdict: VERIFIED
npm run build          # docs/formal-methods/dist/index.html を生成
npm run verify:book    # docs/inductive-invariant-book を検証 → book verdict: VERIFIED
npm run build:book     # docs/inductive-invariant-book/dist/*.html を生成
```

## インストール（Claude Code プラグイン）

このリポジトリは、そのまま Claude Code のプラグインマーケットプレイスです。
1 つのプラグイン `explainer` に、3 つのスキルが入っています。

```
/plugin marketplace add mizchi/explainer
/plugin install explainer@explainer
```

シェルからは `claude plugin marketplace add mizchi/explainer` と `claude plugin install explainer@explainer` です。

| スキル | 使う場面 |
|---|---|
| `explainer` | 1 人の読み手に向けた速習資料。主張と図を道具で検証する |
| `explainer-book` | 章立ての学習資料。学習目標・概念の順序・読了時間・演習を検査する |
| `first-reader` | 公開前の下書きを、模擬読者に 1 段落ずつ読ませる。どこで離脱し、翌日何が残ったかを報告する。書き直しはしない |

スクリプトの依存は、資料を置くリポジトリに入れます（`npm i -D @mizchi/vlmkit @mizchi/vlmkit-anim marked playwright`、Node 24+）。
`first-reader` は Python 3 の標準ライブラリだけで動きます。

`first-reader` は [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/agent_skills/first-reader) からの同梱です（Apache-2.0、`skills/first-reader/LICENSE` と `NOTICE`）。
日本語の下書きでも 1 段落ずつ読ませられるよう、`feed.py` の語数の数え方を変えています。

## スキルの効果を測る（evals）

`evals/<case>/prompt.md` と `graders/*.md` が、`claude plugin eval` のケースです。
各ケースを、プラグインあり・なしの 2 つの条件で実行し、スコアの差（Δ）を出します。

```sh
claude plugin eval . --trust-plugin --allow-tools Bash Write Edit Agent -j 4
```

| ケース | 見ること |
|---|---|
| `crash-course` | 読み手の既知を省くか。コードを実行して出力を載せるか。理解度チェックがあるか |
| `crash-course-known-heavy` | 専門家向けでも「〜とは」から始めがちな題材（BuildKit のキャッシュ）で、既知を省き、核心を正しく説明するか |
| `crash-course-persona-implicit` | 同じ題材で、既知を依頼文に書かず、ペルソナのファイルにだけ書いたとき |
| `book` | 1 章が quickstart か。各章に学習目標と答えつきの問いがあるか。演習の答えを実行して確かめるか |
| `pr-reader-first` | 読み手が分からないとき、書く前に確かめるか、前提を明示するか |
| `one-liner-control` | 対照。1 文で済む質問で、スキルを呼ばず、資料を作らないか |
| `first-reader-no-rewrite` | 下書きのレビューで、読み手の体験を報告し、書き直さないか |

最新の結果と、その読み方の注意は [`evals/RESULTS.md`](evals/RESULTS.md) にあります。
2026-09-25〜26 の回は、シェルに依存しない grader で `crash-course` が +0.43（各 3 回、5 回目）、`crash-course-known-heavy` が +0.25、`crash-course-persona-implicit` が +0.12、`pr-reader-first` が +0.50、`book` が +0.28、対照ケースは差なし（過剰発火なし）でした。実行できなかったコードを報告したのは、スキルありで 6 回中 6 回、なしで 6 回中 1 回です。読み手の情報（依頼文でもペルソナのファイルでも）があるときの既知の省略は、スキルなしでもできていました。
その回の環境では eval のサンドボックス内でシェルが動かず、コード実行を見る grader は無効でした。

`first-reader` のスクリプトの単体テストは `python3 tests/first-reader/test_first_reader.py` と `test_cjk.py` です。

## 構成

| パス | 内容 |
|---|---|
| `skills/explainer/SKILL.md` | スキル本体（1 本の速習資料） |
| `skills/explainer-book/SKILL.md` | 本版（章立ての学習資料）。`scripts/verify-book.mjs` が本全体を検査 |
| `skills/explainer/references/` | ペルソナ・文体・図のガイド |
| `skills/explainer/scripts/verify-doc.mjs` | 検証（checks / vlmkit-anim / 引用照合 / vlmkit ゲート） |
| `skills/explainer/scripts/build-html.mjs` | Markdown → 自己完結 HTML |
| `skills/explainer/scripts/tlc-to-scene.mjs` | TLC の状態グラフ・反例 → vlmkit-anim の図と事実シート |
| `personas/` | 読み手のペルソナ |
| `docs/<topic>/` | 資料：`README.md`, `checks.json`, `examples/`, `figures/` |
| `docs/<topic>-book/` | 本：`README.md`（目次）, `book.json`, `NN-*.md`, `checks.json`, `examples/`, `figures/` |
| `skills/first-reader/` | 模擬読者（同梱、Apache-2.0） |
| `.claude-plugin/` | プラグインとマーケットプレイスの定義 |
| `evals/` | `claude plugin eval` のケース |
| `tests/first-reader/` | first-reader のスクリプトの単体テスト |
