#!/bin/sh
# TLC と Apalache を .tools/ に取得する。Java 17+ が必要 (Apalache の要件)。
set -eu
mkdir -p .tools
[ -f .tools/tla2tools.jar ] || curl -fsSL -o .tools/tla2tools.jar \
  https://github.com/tlaplus/tlaplus/releases/download/v1.8.0/tla2tools.jar
if [ ! -x .tools/apalache/bin/apalache-mc ]; then
  curl -fsSL -o .tools/apalache.tgz \
    https://github.com/apalache-mc/apalache/releases/download/v0.62.2/apalache.tgz
  tar xzf .tools/apalache.tgz -C .tools && rm .tools/apalache.tgz
fi
echo ".tools/tla2tools.jar, .tools/apalache/bin/apalache-mc ready"
