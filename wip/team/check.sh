#!/bin/bash
# One command to build and check the page.
#   ./check.sh          fast checks (about 2 minutes): build, syntax, main suite, idle and speed guard
#   ./check.sh full     fast checks, then every regression script, the number checks and the app package
# Edit one source file, run ./check.sh, publish when ./check.sh full says ALL GOOD and both QC agents pass. See ARCHITECTURE.md and RESUME.md.
# On a fresh machine or session run  bash tests/setup_env.sh  first: it rebuilds everything the checks need from the repo.
cd "$(dirname "$0")" || exit 1
MODE=${1:-fast}; BAD=0
step() { echo; echo "== $1"; }
step "build"; ./build.sh || exit 1
node -e "const fs=require('fs');const h=fs.readFileSync('../money-map-team.html','utf8');fs.writeFileSync('/tmp/chk.js',h.slice(h.lastIndexOf('<script>')+8,h.lastIndexOf('</script>')))" && node --check /tmp/chk.js && echo "syntax ok" || { echo "SYNTAX ERROR"; exit 1; }
# a stray brace in the stylesheet silently drops every rule after it on some screens: the braces must balance
node -e "const s=require('fs').readFileSync('style.css','utf8');let d=0,l=1,bad=0;for(const c of s){if(c==='{')d++;else if(c==='}')d--;if(c==='\\n')l++;if(d<0&&!bad)bad=l;}if(d!==0||bad){console.log('CSS BRACES UNBALANCED (depth '+d+(bad?', negative at line '+bad:'')+')');process.exit(1);}console.log('css braces ok')" || exit 1
step "main suite (test_team)"; OUT=$(node test_team.js 2>&1); echo "$OUT" | tail -2; echo "$OUT" | grep -q "^FAIL" && BAD=1
# ---- the numbers gate (38.31): runs in the fast check too, because a wrong number is the one thing this app may never ship ----
[ -f /tmp/v25/oracle.js ] && [ -d /home/claude/work/tools/node_modules/acorn ] || { echo "The test environment is missing. Run: bash tests/setup_env.sh"; exit 1; }
cp tests/qc/real.js /tmp/v39/real.js 2>/dev/null; cp ../../tests/regression/v25/oracle.js /tmp/v25/oracle.js 2>/dev/null
step "independent oracle (a second calculation written apart from the app, in whole numbers)"; OUT=$(N=1500 node /tmp/v25/oracle.js 2>&1); echo "$OUT" | head -4 | cut -c1-200; echo "$OUT" | head -1 | grep -q "mismatches 0$" || { echo "ORACLE DISAGREES WITH THE APP"; BAD=1; }
step "the proof (where the money sits = where it came from, to the cent)"; OUT=$(node tests/qc/proof_fuzz.js 800 21 2>&1); echo "$OUT" | grep "^FAIL" | head -4 | cut -c1-220; echo "$OUT" | tail -1; echo "$OUT" | grep -q "PROOF PASS" || BAD=1
step "screens do no money maths (the count may only go down; the goal is 0)"; OUT=$(node tests/qc/display_math.js 2>&1); echo "$OUT" | tail -2 | head -1
DMAX=$(cat tests/qc/display_math.max 2>/dev/null || echo 0); DN=$(echo "$OUT" | grep -o "screen maths: [0-9]*" | grep -o "[0-9]*$"); [ "${DN:-999}" -le "$DMAX" ] || { echo "SCREEN MATHS WENT UP: $DN open, the limit is $DMAX. Move the sum into model.js."; BAD=1; }
step "safety copy and backup reminder (v24.2)"
# timing-sensitive under load (fresh IndexedDB per run): one quiet retry before it counts as a failure
safe_once() { node /tmp/v28/safe.js 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" | grep "^FAIL\|CRASH\|SAFE:\|^PASS no page errors"; return ${PIPESTATUS[0]}; }
if ! safe_once; then echo "(retrying once)"; sleep 3; safe_once || BAD=1; fi
step "guard (idle CPU, tab speed, no outside requests, no errors)"; node tests/guard.js 2>&1 | grep -v "^\[agent\|^- \|^Allowed\|^For det" ; [ ${PIPESTATUS[0]} -ne 0 ] && BAD=1
if [ "$MODE" = "full" ]; then
  # look_test.js (and HANDOFF.md) expect the built page served on 8788: the exact build, with the welcome video next to it
  rm -rf /tmp/site8788 && mkdir -p /tmp/site8788 && cp ../money-map-team.html /tmp/site8788/index.html && cp /home/claude/work/hello/* /tmp/site8788/ 2>/dev/null; cp -r /home/claude/work/fonts /tmp/site8788/ 2>/dev/null
  (cd /tmp/site8788 && python3 -m http.server 8788 >/dev/null 2>&1 & echo $! > /tmp/site8788.pid); sleep 1
  # a script that cannot even start (syntax error, crash, timeout) counts as a failure, not a quiet skip
  for f in /tmp/team_inter2.js /tmp/team_help.js /tmp/team_month.js /tmp/team_card.js /tmp/v22/video.js /tmp/v22/home.js /tmp/v22/walk.js /tmp/v22/snd.js /tmp/v22/cal.js /tmp/v22/scan.js /tmp/v31/music_test.js /tmp/v31/split_test.js /tmp/v34/purpose_test.js /tmp/v35/look_test.js /tmp/v35/upgrade_test.js /tmp/v36/ux_test.js /tmp/v36/undo_test.js /tmp/v37/sync_test.js /tmp/v37/onb_test.js; do
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
  step "money fuzz, debts fuzz, Home screen against the model, debts screen, click sweep"
  qc() { OUT=$(timeout 900 node "$@" 2>&1); RC=$?; echo "$OUT" | grep -v "^\[agent\|^- \|^Allowed\|^For det" | tail -3; { [ $RC -ne 0 ] || echo "$OUT" | grep -q "FAIL [1-9]\|mismatches [1-9]\|^FAIL"; } && { echo "QC FAILED: $*"; BAD=1; }; }
  qc tests/qc/fuzz_model.js 3000 11; qc tests/qc/fuzz_debts.js 3000 12; qc tests/qc/home_dom.js 40 13; qc tests/qc/home_map.js 24 7; qc tests/qc/currency_ui.js; qc tests/qc/scenario_yen.js; qc tests/qc/debts_ui.js; qc tests/qc/recurring_ui.js; qc tests/qc/debts_rate_ui.js; qc tests/qc/pay_ui.js; qc tests/qc/leftover_choice.js; qc tests/qc/leftover_thin.js; qc tests/qc/leftover_stale.js; qc tests/qc/leftover_cents.js; qc tests/qc/leftover_reload.js; qc tests/qc/reset_undo.js; qc tests/qc/number_findings.js; qc tests/qc/cents_plan.js; qc tests/qc/below_zero.js; qc tests/qc/first_entry.js; qc tests/qc/goal_agree.js; qc tests/qc/remove_undo.js; qc tests/qc/home_v1.js; qc tests/qc/compare_3828.js; qc tests/qc/save_fail.js; qc tests/qc/typo_big.js; qc tests/qc/setup_undo.js; qc tests/qc/receipt_undo.js; qc tests/qc/keep_unknown.js; qc tests/qc/number_gate2.js; qc tests/qc/typo_letter.js; qc tests/qc/setup_cents.js; qc tests/qc/neg_bank.js; qc tests/qc/number_gate3.js; qc tests/qc/badge_hold.js; qc tests/qc/bills_scroll.js; qc tests/qc/restore_label.js; qc tests/qc/round4.js; qc tests/qc/goal_agree.js; qc tests/qc/click_sweep.js
  step "number checks (about 6 minutes)"; OUT=$(bash /tmp/v26/num.sh 2>&1); echo "$OUT" | grep -v "^\[agent\|^- \|^Allowed\|^For det"
  echo "$OUT" | grep -q "mismatches [1-9]\|FAIL [1-9]\|^FAIL" && { echo "NUMBER CHECKS FAILED"; BAD=1; }
  echo "$OUT" | grep -q "NUMDONE" || { echo "NUMBER CHECKS DID NOT FINISH"; BAD=1; }
  step "installable app (service worker, offline, update offer)"
  (cd /home/claude/work/pwa && python3 make_pwa.py >/dev/null 2>&1) || { echo "PWA BUILD FAILED"; BAD=1; }
  (cd /home/claude/work/pwa/dist && python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > /tmp/pwa_http.pid); sleep 1
  OUT=$(timeout 300 node /tmp/team_pwa.js 2>&1); RC=$?; echo "$OUT" | grep -v "^\[agent\|^- \|^Allowed\|^For det" | grep "FAIL\|PASS" | head -14
  { [ $RC -ne 0 ] || echo "$OUT" | grep -q "^FAIL\|Error:"; } && { echo "PWA TEST FAILED"; BAD=1; }
  [ "$(echo "$OUT" | grep -c '^PASS')" -ge 10 ] || { echo "PWA TEST SHORT ($(echo "$OUT" | grep -c '^PASS') PASS, 10 expected)"; BAD=1; }
  kill $(cat /tmp/pwa_http.pid) 2>/dev/null; rm -f /tmp/pwa_http.pid
  kill $(cat /tmp/site8788.pid) 2>/dev/null; rm -f /tmp/site8788.pid
fi
echo; [ $BAD -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED, see above"
exit $BAD
