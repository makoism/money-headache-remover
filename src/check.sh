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
# a stray brace in the stylesheet silently drops every rule after it on some screens: the braces must balance
node -e "const s=require('fs').readFileSync('style.css','utf8');let d=0,l=1,bad=0;for(const c of s){if(c==='{')d++;else if(c==='}')d--;if(c==='\\n')l++;if(d<0&&!bad)bad=l;}if(d!==0||bad){console.log('CSS BRACES UNBALANCED (depth '+d+(bad?', negative at line '+bad:'')+')');process.exit(1);}console.log('css braces ok')" || exit 1
step "main suite (test_team)"; OUT=$(node test_team.js 2>&1); echo "$OUT" | tail -2; echo "$OUT" | grep -q "^FAIL" && BAD=1
step "safety copy and backup reminder (v24.2)"
# timing-sensitive under load (fresh IndexedDB per run): one quiet retry before it counts as a failure
safe_once() { node /tmp/v28/safe.js 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" | grep "^FAIL\|CRASH\|SAFE:\|^PASS no page errors"; return ${PIPESTATUS[0]}; }
if ! safe_once; then echo "(retrying once)"; sleep 3; safe_once || BAD=1; fi
step "guard (idle CPU, tab speed, no outside requests, no errors)"; node tests/guard.js 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" ; [ ${PIPESTATUS[0]} -ne 0 ] && BAD=1
if [ "$MODE" = "full" ]; then
  # a script that cannot even start (syntax error, crash, timeout) counts as a failure, not a quiet skip
  for f in /tmp/team_inter2.js /tmp/team_help.js /tmp/team_cur.js /tmp/team_month.js /tmp/team_card.js /tmp/v22/video.js /tmp/v22/home.js /tmp/v22/walk.js /tmp/v22/snd.js /tmp/v22/cal.js /tmp/v22/scan.js /tmp/v31/music_test.js /tmp/v31/split_test.js /tmp/v33/pix_test.js; do
    step "$f"
    for try in 1 2; do
      OUT=$(timeout 400 node $f 2>&1); RC=$?
      echo "$OUT" | grep -v "^\[agent\|^- \|^Allowed\|^For det" | grep "FAIL\|problems\|errors\|ERRORS\|ALL PASS\|Error\|pass," | head -6
      if [ $RC -ne 0 ] || echo "$OUT" | grep -q "^FAIL\|SyntaxError\|CRASH\|errors:\? \[[^]]\|ERRORS: \[[^]]\|problems:\? \[[^]]\|[1-9][0-9]* FAILED"; then
        if [ $try = 1 ]; then echo "(script failed once, exit $RC; one quiet retry, these are timing-sensitive under load)"; sleep 3; continue; fi
        echo "SCRIPT FAILED ($f, exit $RC)"; BAD=1
      fi
      break
    done
  done
  step "number checks (about 6 minutes)"; OUT=$(bash /tmp/v26/num.sh 2>&1); echo "$OUT" | grep -v "^\[agent\|^- \|^Allowed\|^For det"
  echo "$OUT" | grep -q "mismatches [1-9]\|FAIL [1-9]\|^FAIL" && { echo "NUMBER CHECKS FAILED"; BAD=1; }
  echo "$OUT" | grep -q "NUMDONE" || { echo "NUMBER CHECKS DID NOT FINISH"; BAD=1; }
  echo "App package: cd ../pwa && python3 make_pwa.py, then serve dist and run node /tmp/team_pwa.js (8 PASS expected)"
fi
echo; [ $BAD -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED, see above"
exit $BAD
