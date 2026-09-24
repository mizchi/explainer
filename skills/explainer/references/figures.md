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
