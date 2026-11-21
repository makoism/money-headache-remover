#!/bin/bash
# Stage the exact build the QC agents judge (run this, then start every agent fresh, in parallel).
#   bash tests/qc/stage_build.sh
# 1. runs tests/verify.sh (it builds ../money-map-team.html) and keeps its output in /tmp/qc_build/verify.txt
# 2. copies that build to /tmp/qc_build/build.html, with the fonts next to it, and checks the copy is identical
# 3. clears old screenshots in /tmp/qc so no agent sees an earlier round
# 4. runs the script checks (tests/qc/script_run.sh) into /tmp/qc_build/scripts.txt
# 5. saves a screen pack (screenshots and screen text of every tab, made-up situations) in /tmp/qc_build/screens for the agents
# The agents in .claude/agents read /tmp/qc_build/build.html and paste the last lines of verify.txt. Nothing else is handed to them.
cd "$(dirname "$0")/../.." || exit 1
TEAM=$(pwd); REPO=$(cd ../.. && pwd)
rm -rf /tmp/qc_build /tmp/qc && mkdir -p /tmp/qc_build /tmp/qc
bash tests/verify.sh $(ls tests/qc/golden/*.json | sort | tail -1) > /tmp/qc_build/verify.txt 2>&1; RC=$?
cp ../money-map-team.html /tmp/qc_build/build.html
[ -d "$REPO/public/fonts" ] && cp -r "$REPO/public/fonts" /tmp/qc_build/fonts
cmp -s ../money-map-team.html /tmp/qc_build/build.html || { echo "STAGE FAILED: the copy differs from the build"; exit 1; }
bash tests/qc/script_run.sh > /tmp/qc_build/scripts.txt 2>&1 || RC=1
node tests/qc/screen_pack.js /tmp/qc_build/screens || RC=1
echo "staged /tmp/qc_build/build.html ($(wc -c < /tmp/qc_build/build.html) bytes, version $(sed -n 1p VERSION)); verify: $(tail -1 /tmp/qc_build/verify.txt)"
exit $RC
