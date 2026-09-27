#!/bin/sh
# D2（TALA / ELK / dagre を同梱）を .tools/ に取得する。figure-check.mjs が .tools/d2 を使う。
set -eu
V=v0.9.0
mkdir -p .tools
if [ ! -x .tools/d2 ]; then
  curl -fsSL -o .tools/d2.tgz "https://github.com/terrastruct/d2/releases/download/$V/d2-$V-linux-amd64.tar.gz"
  tar xzf .tools/d2.tgz -C .tools && rm .tools/d2.tgz
  ln -sfn "d2-$V/bin/d2" .tools/d2
fi
.tools/d2 --version
