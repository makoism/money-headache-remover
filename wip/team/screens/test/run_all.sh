#!/bin/sh
# Runs every test file under screens/test (node ones and the Chromium ones). Exits non-zero when any file fails and
# names each failing file. The last line says PASS only when every file passed.
cd "$(dirname "$0")" || exit 2
bad=""
for f in *.test.js; do
  node "$f" || bad="$bad $f"
done
if [ -n "$bad" ]; then echo "FAIL screens tests:$bad"; exit 1; fi
echo "PASS screens tests: every file passed"
