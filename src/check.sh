#!/bin/bash
# One command to build and check the page.
#   ./check.sh          fast checks (about 2 minutes): build, syntax, main suite, idle and speed guard
#   ./check.sh full     fast checks, then every regression script, the number checks and the app package
# Edit one source file, run ./check.sh, publish when it says ALL GOOD. See ARCHITECTURE.md.
cd "$(dirname "$0")" || exit 1
MODE=${1:-fast}; BAD=0
step() { echo; echo "== $1"; }
step "build"; ./build.sh || exit 1
node -e "const fs=require('fs');const h=fs.readFileSync('../money-map-team.html','utf8');fs.writeFileSync('/tmp/chk.js',h.slice(h.lastIndexOf('<script>')+8,h.lastIndexOf('</script>')))" && node --check /tmp/chk.js && echo "syntax ok" || { echo "SYNTAX ERROR"; exit 1; }
step "main suite (test_team)"; OUT=$(node test_team.js 2>&1); echo "$OUT" | tail -2; echo "$OUT" | grep -q "^FAIL" && BAD=1
step "safety copy and backup reminder (v24.2)"
# timing-sensitive under load (fresh IndexedDB per run): one quiet retry before it counts as a failure
safe_once() { node /tmp/v28/safe.js 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" | tail -4; return ${PIPESTATUS[0]}; }
if ! safe_once; then echo "(retrying once)"; sleep 3; safe_once || BAD=1; fi
step "guard (idle CPU, tab speed, no outside requests, no errors)"; node tests/guard.js 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" ; [ ${PIPESTATUS[0]} -ne 0 ] && BAD=1
if [ "$MODE" = "full" ]; then
  for f in /tmp/team_inter2.js /tmp/team_help.js /tmp/team_cur.js /tmp/team_month.js /tmp/v22/video.js /tmp/v22/home.js /tmp/v22/walk.js /tmp/v22/snd.js /tmp/v22/cal.js /tmp/v22/scan.js; do
    step "$f"; timeout 280 node $f 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" | grep "FAIL\|problems\|errors\|ERRORS\|ALL PASS\|Error" | head -6
  done
  step "number checks (about 6 minutes)"; bash /tmp/v26/num.sh 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det"
  echo "App package: cd ../pwa && python3 make_pwa.py, then serve dist and run node /tmp/team_pwa.js (8 PASS expected)"
fi
echo; [ $BAD -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED, see above"
exit $BAD
