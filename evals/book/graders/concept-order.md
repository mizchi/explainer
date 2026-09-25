---
type: llm
weight: 2
focus: { source: file, path: docs/regex-book/01-quickstart.md }
---
これは 3 章立ての本の最初の章である。
PASS の条件：この章の本文（コード例を除く）が、その場で定義していない正規表現の発展的な用語を使っていない。
対象の用語は、先読み・後読み（lookahead / lookbehind）、後方参照（backreference）、貪欲・非貪欲（greedy / lazy）、名前付きキャプチャ、Unicode プロパティエスケープなど。
使う場合は、同じ章の中で 1 文以上の定義か具体例がある。
「次の章で扱う」と名前だけ予告するのは PASS。定義なしで説明や演習に使っていれば FAIL。
