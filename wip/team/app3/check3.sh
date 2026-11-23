#!/bin/bash
# app3's own check (DECISIONS_ROUND2 AZ1, AZ2): build, the engine tests, the screen tests, no maths in screens, the
# idle and long-task guard, the offline load, and FEATURES.json kept honest. Prints ALL GOOD only when nothing failed.
#   ./check3.sh
cd "$(dirname "$0")" || exit 1
BAD=0; RESULTS=$(mktemp)
step() { echo; echo "== $1"; }
run() {   # run <test file> <pass word>: one line per test in $RESULTS, "<file> PASS|FAIL"
  local f=$1 word=$2 out rc
  out=$(timeout 300 node "$f" 2>&1); rc=$?
  # The browser itself going away under load from other lanes (a detached frame, a closed session, a failed launch)
  # is not a test result: that one case runs again once, and says so. A FAIL line is never run again.
  if [ $rc -ne 0 ] && ! echo "$out" | grep -q "^FAIL [^c]" && echo "$out" | grep -q "detached Frame\|Session closed\|Target closed\|Failed to launch the browser"; then
    echo "(the browser went away under load, not a test failure: running $f once more)"; out=$(timeout 300 node "$f" 2>&1); rc=$?
  fi
  echo "$out" | grep -v "^PASS" | tail -12
  if [ $rc -eq 0 ] && echo "$out" | grep -q "$word"; then echo "$f PASS" >> "$RESULTS"; else echo "$f FAIL" >> "$RESULTS"; echo "FAILED: $f (exit $rc)"; BAD=1; fi
}
step "build"; ./build3.sh || exit 1
node -e "const h=require('fs').readFileSync('index.html','utf8');const s=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)];if(s.length!==2)throw new Error('expected 2 scripts, found '+s.length);s.forEach(m=>new Function(m[1]));console.log('syntax ok')" || { echo "SYNTAX ERROR"; exit 1; }

step "the engine's own tests (failures already on wip-38.31 are listed in engine_known.txt; any other is a failure)"
OUT=$(node ../engine/test/run_all.js 2>&1); echo "$OUT" | tail -3
NEW=$(echo "$OUT" | grep "^FAIL" | cut -c1-60 | sort -u | grep -v -x -F -f <(grep -v '^#' engine_known.txt | cut -c1-60))
if echo "$OUT" | grep -q "ENGINE CHECKS ALL PASS"; then echo "engine: all pass"; [ -n "$(grep -v '^#' engine_known.txt)" ] && echo "NOTE engine_known.txt can be emptied now"
elif [ -n "$NEW" ]; then echo "NEW ENGINE FAILURES:"; echo "$NEW"; BAD=1; else echo "engine: only the known failures (engine_known.txt, lane A)"; fi

step "the shared screen pieces (screens/test/run_all.sh)"
OUT=$(bash ../screens/test/run_all.sh 2>&1); echo "$OUT" | tail -1; echo "$OUT" | tail -1 | grep -q "every file passed" || { echo "SCREENS TESTS FAILED"; BAD=1; }

step "the try book through the engine check-in writer"; run tests/checkin_book.test.js "CHECKIN BOOK PASS"
step "act3, the one write door (pure)"; run tests/e3_act_unit.js "e3_act_unit: ALL PASS"
step "the cloud copy's core, two devices on a local fake vault"; run tests/cloud3.test.js "cloud3: ALL PASS"
step "statements, the reading half (pure)"; run tests/e3_stmt_read.js "e3_stmt_read: ALL PASS"
step "statements, the writing half (pure): lines, matching, records"; run tests/e3_stmt_plan.js "e3_stmt_plan: ALL PASS"
step "the Plan tab's steps (pure)"; run tests/plan3_write.test.js "plan3_write: ALL PASS"
step "the backup file's core"; run tests/backup3.test.js "backup3: ALL PASS"
step "Ask, the pure half (the summary sent, the reply checked, steps through act3, Undo)"; run tests/ask3_core.test.js "ask3_core: ALL PASS"
step "reminders, the pure half (days from the engine's calendar, the calendar file, Google and Outlook links)"; run tests/remind3.test.js "remind3: ALL PASS"
step "no money maths in screens"; run tests/no_maths.js "NO MATHS PASS"
[ "$(pgrep -fc check3.sh)" -le 1 ] && pkill -f chrome-linux64/chrome 2>/dev/null   # leftover test browsers, only when no other lane is checking (it killed their tests)
step "the try book"; run tests/e3_try.js "e3_try: ALL PASS"
step "Home, the new top"; run tests/e3_home.js "e3_home: ALL PASS"
step "Check your bank"; run tests/e3_checkin.js "e3_checkin: ALL PASS"
step "Add statements (the AI route, any AI, review, Add, duplicates once, the relay)"; run tests/e3_stmt.js "e3_stmt: ALL PASS"
step "the period by its dates"; run tests/e3_period.js "e3_period: ALL PASS"
step "Receipts"; run tests/e3_receipts.js "e3_receipts: ALL PASS"
step "the Plan tab"; run tests/e3_plan.js "e3_plan: ALL PASS"
step "as a plain file: the first screen, the try book and its day box"; run tests/e3_file.js "e3_file: ALL PASS"
step "setup3"; run tests/e3_setup.js "e3_setup: ALL PASS"
step "guard (idle CPU, long tasks, outside requests, errors)"; run tests/guard3.js "guard3: ALL PASS"
step "offline load"; run tests/offline.js "offline: ALL PASS"
step "the private publish (a made-up path, a copy of public/ served by the worker's rules)"; run tests/e3_publish.js "e3_publish: ALL PASS"
step "two tabs on one device"; run tests/e3_tabs.js "e3_tabs: ALL PASS"
step "Settings and the backup file"; run tests/e3_backup.js "e3_backup: ALL PASS"
step "Ask on the page (recorded replies: the viewer's Claude and the relay)"; run tests/e3_ask.js "e3_ask: ALL PASS"
step "Reminders on the page (check-ins and bills, the calendar file, Google and Outlook, nothing sent)"; run tests/e3_remind.js "e3_remind: ALL PASS"
step "the cloud copy, two devices through the page (local fake vault)"; run tests/e3_cloud.js "e3_cloud: ALL PASS"
step "the service worker (precache, offline, 3 s timeout, a new build)"; run tests/e3_sw.js "e3_sw: ALL PASS"

step "FEATURES.json (a feature marked passing must have its test green in this run)"
node -e "
const fs=require('fs');const F=JSON.parse(fs.readFileSync('FEATURES.json','utf8'));const R=Object.fromEntries(fs.readFileSync('$RESULTS','utf8').trim().split('\n').filter(Boolean).map(l=>l.split(' ')));
let bad=0;for(const f of F.features){const r=R[f.test];const tag=r||'not run';console.log((f.passes?'[x] ':'[ ] ')+f.name+'  ('+f.test+': '+tag+')');if(f.passes&&r!=='PASS'){console.log('  MARKED PASSING BUT '+tag);bad=1;}if(!f.passes&&r==='PASS')console.log('  its test is green: it may be marked passing');}
process.exit(bad)" || BAD=1
rm -f "$RESULTS"
echo; [ $BAD -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED, see above"
exit $BAD
