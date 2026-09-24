#!/bin/sh
# TLC (TLA+ model checker) を .tools/ に取得する。Java 11+ が必要。
set -eu
mkdir -p .tools
[ -f .tools/tla2tools.jar ] || curl -fsSL -o .tools/tla2tools.jar \
  https://github.com/tlaplus/tlaplus/releases/download/v1.8.0/tla2tools.jar
echo ".tools/tla2tools.jar ready"
