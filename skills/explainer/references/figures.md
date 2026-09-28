# 図：問い → 種類 → 事実シート → 検査

図は `@mizchi/vlmkit-anim` のシーン（JSON）で描く。
座標は書かない。書くのは「種類（kind）」と「意図」。
書き方の詳細は vlmkit の `docs/anim-ir.md` と `vlmkit-anim schema --kind <kind>` を参照する。

## 描くか

次の場合は描く。
- 4 つ以上の要素とその関係がある
- 時間の順序がある
- 包含関係・前後の比較がある

次の場合は描かない。
- 答えが 1 文で済む
- 1 つの関数の中身
- 値を 1 つ聞かれている

## 問いから種類を選ぶ

| 読み手の問い | kind | 事実の出どころ |
|---|---|---|
| どういう状態があり、何で移るか | `state-machine` | TLC `-dump dot,actionlabels` → `scripts/tlc-to-scene.mjs` |
| 反例はどういう順序で起きたか | `state-machine` の `trace` / `sequence` / `distributed` | TLC・Apalache・Quint の反例トレース |
| A は B に含まれるか（集合・範囲） | `diagram` の入れ子 `groups` | 道具の出力（到達可能状態の一覧、型の定義） |
| どう分岐するか | `flowchart` の `walk` | 条件分岐のコード |
| どういう構造か（モジュール） | `modules` | `vlmkit-anim facts <dir> --depth 1` |
| この PR で何が変わるか | `vlmkit-anim pr --base origin/main` | git |

1 つの問いに図は 1 枚。

## 手順

```
1. 事実シート  <name>.expect.json を道具の出力から作る（手で書くなら、出どころを本文に書く）
2. シーン     <name>.scene.json。id は ASCII、表示は label に
3. check      vlmkit-anim check <name>.scene.json --expect <name>.expect.json   ✗ を 0 に
4. layout     vlmkit-anim layout <name>.scene.json                              重なり・はみ出し 0 に
5. explain    vlmkit-anim explain <name>.scene.json                             キャプションが「なぜ」を言っているか
6. still      vlmkit-anim still <name>.scene.json --out <name>.svg              一度は目で見る（.png で Read）
```

`verify-doc.mjs` は 3・4・6 を毎回やり直す。
SVG がシーンより古ければ落ちる。

## 事実シートは道具から

- 状態グラフ：`tlc-to-scene.mjs` が TLC の dot から scene と expect を同時に作る。
  - `checks.json` に「作り直して、コミット済みのものと diff」を入れておく。図が TLC とずれたら検証が落ちる。
- 手で描いた図（例：包含関係の図）：図の一部を道具の出力と照合する小さなスクリプトを `checks.json` に入れる（例：`figures/check-induction.mjs`）。

## よくある kickback

- `canvas ... over 2000px`：ラベルが長い。`tlc-to-scene.mjs --bare --abbrev read=R,...` で短くし、凡例を本文に書く。`layout` を `tb` / `lr` で比べる。
- `state ... drawn but the trace never enters it`：全状態を描き、反例だけを歩く図では想定内の警告。本文で「描いたが歩かない状態」の意味を説明する。
- GIF は重い（13 状態で 5 MB）。README には SVG を置く。動きは `build-html.mjs` が作る再生ページ（`vlmkit-anim html`）で見せる。

## 手で描く図（Mermaid / D2 / SVG / HTML）と、目で見るループ

vlmkit-anim の kind に当てはまらない概念図（包含関係、使い分けの図、コードと箱が混ざる図）は、直接マークアップで書く。
形式は **Mermaid → D2 → SVG / HTML** の順に当て、足りるものを使う（測った結果は `docs/figure-cheatsheet/`）。

1. **Mermaid で済むなら Mermaid**：フロー・シーケンス・状態遷移など。GitHub の Markdown（PR 本文・Issue）がそのまま描くので、PR の説明に置く図はこれが一番安い。
2. **Mermaid で足りない構造なら D2**：次のどれかに当たるとき。
   - サブグラフの中の向きを変えたいが、中の箱が外とつながる（Mermaid は中の `direction` を黙って無視する）
   - 箱の名前の上を線が通る（Mermaid・ELK・dagre で起きた。TALA で避けられた）
   - 位置の固定や `near` が要る
   - エンジン（TALA / ELK）を選びたい
3. **D2 の「箱と線」に乗らない自由な図なら SVG / HTML**：位置そのものに意味があるなら SVG、文字とコードが主なら HTML。

| 形式 | 向いているもの | 置き場所 |
|---|---|---|
| Mermaid（`figures/<name>.mmd`） | 箱と線だけで崩れない図。GitHub にそのまま貼る図 | `--write` で `<name>.svg` を作り、それを参照する（`mermaid` をプロジェクトに入れる） |
| SVG（`figures/<name>.svg`） | 位置に意味がある図：包含関係、範囲、平面上の配置 | Markdown から `![…](figures/<name>.svg)` |
| HTML（`figures/<name>.fig.html`） | 文字とコードが主で、箱で区切る図。ページのライト / ダークに従う | Markdown からは `![…](figures/<name>.fig.png)`。HTML に組むときは `.fig.html` が埋め込まれる |
| D2（`figures/<name>.d2`） | 分岐・流れ・依存。レイアウトを道具に任せたい図 | `--write` で `<name>.svg` を作り、それを参照する |

どの形式でも、事実シート `figures/<name>.facts.json` を先に書く。

```json
{ "labels": ["図に必ず出る語"], "forbidden": ["出てはいけない語（過去の誤り）"], "edges": ["a->b"] }
```

`edges` は D2 と Mermaid で使う（ソースの辺と照合する）。

### ループ（1 回 = 描画 → 機械の検査 → 目で見る → 直す）

```
node <skill>/scripts/figure-check.mjs figures/<name>.svg|.fig.html|.d2|.mmd [--write]
```

1. **機械の検査**：✗ を 0 にする。
   - overlap：文字同士の重なり
   - clipped：図の外へのはみ出し
   - crossing：文字が箱の枠線をまたぐ
   - through：線が文字の中を通る（D2 がマスクで切り抜いた部分は数えない）
   - tiny：スマホ幅で 9px 未満の文字
   - facts：事実シート
   - vlmkit：integrity と a11y contrast
2. **目で見る**：出力の `look at it:` にあるシート（ライト・ダーク・スマホの 3 枚を 1 枚にした PNG）を **Read で開く**。機械で見えないものを探す。
   - 読む順序：入口が左上か上にあるか。ループの戻り先が先頭に来ていないか
   - 意味：ラベルが指しているものは正しいか（例：CTI は「Inv の外へ出た状態」ではなく「出発点」）
   - 詰まり・余白：ある部分だけ窮屈ではないか。大きな空白で要素が離れすぎていないか
   - ダーク：色で区別している枠が見分けられるか（非テキストは 3:1 以上。色は計算して確かめる）
3. **直す**：目で見つけた誤りのうち、機械で捉えられる種類のものは、先に `figure-check.mjs` の検査に足す（`tests/figure-check/` に悪い例を 1 つ足す）。意味の誤りは `forbidden` に足す。
4. 上限は 5 回。それでも直らなければ、図をやめて文章にするか、分け方を変える。

### 形式ごとの注意

- **SVG**：`viewBox` を狭く縦長にすると、スマホでも文字が小さくなりにくい（640 幅より 520 幅）。文字は 15px 以上。説明の文字は、矢印が出ていく側と反対に置く。
- **HTML**：色は `var(--fg)` などのページのトークンを使う。固有の色は、ダーク用の値を `:root[data-theme="dark"]` と `@media (prefers-color-scheme: dark)` の両方に書く。スマホ幅（〜520px）では 1 列に落とす。
- **Mermaid**：文字は SVG の `<text>` で描かせる（`figure-check.mjs` がそう設定する）。辺のラベルは線の上に背景つきで置かれるので、`through` では数えない。サブグラフの名前を線が通るのは数える。
- **D2 のエンジン**（測った結果は `docs/figure-cheatsheet/`）：
  - **TALA**（既定）：箱の入れ子（アーキテクチャ）、箱ごとの `direction`、固定位置（`top` / `left`）、`near: 別の箱`。後ろの 3 つは TALA しかできない。
    - direction を書かないと、入口が上に来ないことがある。書く。
    - seed で配置がすべて変わる。線の分かれ目が別の矢印に見えたら、`--tala-seeds=N` を並べて見て選ぶ。v0.9.0 はファイルの `vars` に seed を書けないので、`# d2-flags: --tala-seeds=N` の行を書く（`figure-check.mjs` が d2 に渡す）。
    - 箱の数に対して描画時間が急に伸びる（40 個で ELK の 10 倍以上）。
  - **ELK**：一方向の長い DAG、戻る辺のある手順、何度も描き直す大きい図。1 つ足しても配置があまり動かない。
    - 箱をまたぐ線が箱の名前を通る（`through` で落ちる）。
    - **箱ごとの `direction` を黙って無視する**（エラーにならない）。箱の中を縦にするなら `grid-columns: 1`。
  - **dagre**：ELK より良い場面は見つかっていない。
  - 横に長い流れは、どのエンジンでもスマホで文字が潰れる。縦に流す。
- **D2**：戻る辺があると、TALA は戻り先を上に置くことがあり、入口が上に来ない。入口を上にしたいときは、ファイルの先頭で ELK を選ぶ。
  ```d2
  vars: { d2-config: { layout-engine: elk } }
  ```
  文字は `*.style.font-size: 22` のように大きめにし、ラベルは 2 行以内にする。`d2 fmt` で整形する。
