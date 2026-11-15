# この資料で検査したこと

作成・検査日: 2026-11-16。Node.js v24.22.2。対象資料は `README.md`、元実装は Metalic commit `99eee23`。

## 数値と来歴

`examples/import-evidence.mjs` で固定commitの7計測JSONから必要な標本を抜き出した。元ファイルのパス・SHA-256・測定日時・commit固定URLを `evidence/measurements.json` に保存した。

通常の再検査は `examples/verify-evidence.mjs` だけを使う。元checkoutやGPUを要求しない。省いた元ファイル全体の内容まで、この抜粋だけで暗号学的に検証できるという意味ではない。

検査した範囲は次の通り。

- 協調実験の同一入力・同一dispatch数／signatureと、全標本からのp50再集計。
- slot実験のnative／API時間・保持容量と、480件の成功traceでのGPU完了→CPU消費→同一slotの再準備の順序。
- CPU改善前後のcompactionの同一入力と、単一／GCDの速い中央値を対照にした比率。
- fit 8ケースの各96 auto選択、対照との出力一致、定常766/766、全体766/768、探索込み推定regret。
- 失敗した試行2／3の数値が、失敗したまま本文に残っていること。
- 表の行、引用したコード、引用出力が同梱データ／実行結果と一致すること。

`verify-evidence.mjs` が未作成の状態でcheckを失敗させ、実装とデータを追加して通した。抜粋の真正性は元repoへのアクセスとgitの記録で別途確認する。

## 図とHTML

所有期間はMermaid、性能比はVega-Liteで描いた。性能比の数値と両図の事実シートは再集計コードから生成する。成功traceの図は成功経路だけを示し、例外経路の証明に使わない。

`figure-check.mjs` の事実シート・配置・矢印・contrast検査を通し、light／dark／mobileのシートを目視した。最初の性能図では長いcase名が省略されていたため、短い日本語ラベルへ変えて再描画した。

HTMLの初回検査は、inlineの40桁commit SHAがmobile幅ではみ出して失敗した。本文の表示を短いcommitリンクへ変え、全回答を開いたHTMLと閉じたHTMLのintegrity、およびcontrastが通ることを確認した。検査の除外条件を増やして通したわけではない。

## 読み手による参照性の点検

2名の模擬読者を、本文をまだ読んでいない別のagentとして起動した。資料は設計判断の参照用なので、全編のtimed readではなく、scanner viewから見出しを選んで答えを探すlookupを使った。翌日のrecallや実際の人間の読了を測定してはいない。

「GPU完了通知で再利用できるか」「766/766はcompiler全体の高速化か」「8byteの確認から一往復の定数を出せるか」は、それぞれ該当節で答えが見つかった。別の読み手はCPU改善・回収出力・fit失敗を探した。

点検で出た「CPU bestの定義が表の近くにない」「autoが固定GPUより速い行の理由を説明できない」を受け、単一／GCDの中央値の小さい方であることと、別々の呼出し群の差の原因を分離できていないことを追記した。模擬読者の証言は本文の正しさの証明として扱わない。

## 再実行

```sh
pnpm verify:metalic
pnpm build:metalic
```

最終の機械検査結果は `verdict: VERIFIED`。日本語の任意リンター yomiyasu は未インストールで省略される。Metalic本体の56テスト／804 GPU validationという実装時の報告は、このdocsの検査として再実行していない。
