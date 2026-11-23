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
step "pay day in two steps: the pay and what it covers, to the end of the day (slice 6, G4)"; run tests/e3_payday.js "e3_payday: ALL PASS"
step "the north-star review's small fixes (the glow at 1280, the day a card was checked, Log a spend, the help marks)"; run tests/e3_ns.js "e3_ns: ALL PASS"
step "Home's ways into the plan: goals with what is set aside, Add a card (north star F2, F3)"; run tests/e3_homeplan.js "e3_homeplan: ALL PASS"
step "Check your bank"; run tests/e3_checkin.js "e3_checkin: ALL PASS"
step "Check your bank names the gap before and after saving (BK2, BK4)"; run tests/e3_checkgap.js "e3_checkgap: ALL PASS"
step "Home words the engine's warnings itself: below zero with no minimum, no raw ISO day or month"; run tests/e3_warnwords.js "e3_warnwords: ALL PASS"
step "a card with an overdue payment never says nothing to pay yet"; run tests/e3_cardline.js "e3_cardline: ALL PASS"
step "bank today in its parts once something is logged after the check"; run tests/e3_bankparts.js "e3_bankparts: ALL PASS"
step "a card's figure typed at a check-in (US dollars away until 16 Dec; Mako's 10 Dec)"; run tests/e3_cardfig.js "e3_cardfig: ALL PASS"
step "a figure typed at Check your bank is the same after a reload: four time zones, morning, mid morning and night (QC numbers blocker 1)"; run tests/e3_reload.js "e3_reload: ALL PASS"
step "Add statements (the AI route, any AI, review, Add, duplicates once, the relay)"; run tests/e3_stmt.js "e3_stmt: ALL PASS"
step "each record once after a statement (BI2): Receipts"; run tests/e3_stmt_once.js "e3_stmt_once: ALL PASS"
step "the period by its dates"; run tests/e3_period.js "e3_period: ALL PASS"
step "Receipts"; run tests/e3_receipts.js "e3_receipts: ALL PASS"
step "Receipts: Money in, a client payment or a gift (slice 6)"; run tests/e3_moneyin.js "e3_moneyin: ALL PASS"
step "every amount box: a tap, click or Tab, or a form's own focus, selects, so typing replaces (screens/inputs.js)"; run tests/e3_amounts.js "e3_amounts: ALL PASS"
step "a spend larger than what its account holds asks first, new or changed (north star F5)"; run tests/e3_bigspend.js "e3_bigspend: ALL PASS"
step "only the tapped tab's panel shows (every tab after every other, the sheets)"; run tests/e3_panels.js "e3_panels: ALL PASS"
step "a line added mid-period: one amount that counts now, the full one in a sentence, how far over"; run tests/e3_lineshare.js "e3_lineshare: ALL PASS"
step "the Plan tab"; run tests/e3_plan.js "e3_plan: ALL PASS"
step "Plan names every rhythm: two days, weeks with the weekday, every few months, set months, once a year, once, the last working day, no fixed day (slice 6)"; run tests/e3_rhythms.js "e3_rhythms: ALL PASS"
step "one figure, one name on Home, Receipts and Plan (labels from screens/names.js)"; run tests/e3_names.js "e3_names: ALL PASS"
step "the ways out of the first screen and the made-up numbers"; run tests/e3_first.js "e3_first: ALL PASS"
step "as a plain file:the first screen, the try book and its day box"; run tests/e3_file.js "e3_file: ALL PASS"
step "setup3"; run tests/e3_setup.js "e3_setup: ALL PASS"
step "setup for the other lives: the country chosen, more accounts, pay rhythms, a second income on its own day, cards and bills from their account, once a year (slice 6)"; run tests/e3_setup6.js "e3_setup6: ALL PASS"
step "walk 2 fixes (BI3 bills not gone out yet, BI4 may still go through, a pay by its landing day)"; run tests/e3_walk2.js "e3_walk2: ALL PASS"
step "walk 4 fixes (an outstanding pay's own amount on Plan, the typed note beside a statement row in Receipts)"; run tests/e3_walk4.js "e3_walk4: ALL PASS"
step "life C, no fixed pay (Kai, yen, Japan): setup 1 Dec to 2 Mar, hand-worked figures at every step (slice 6)"; run tests/e3_life_c.js "e3_life_c: ALL PASS"
step "life A, every 2 weeks (Sam, dollars, weekends only): setup 7 Dec to 8 Mar, the pay changed to monthly, hand-worked figures at every step (slice 6)"; run tests/e3_life_a.js "e3_life_a: ALL PASS"
step "life A given the next pay day: the period holding setup exists, Plan and Receipts show it, Free to spend 11 of 14 days (slice 6, qc-foundation blocker)"; run tests/e3_life_a2.js "e3_life_a2: ALL PASS"
step "life B, the 15th and the last day, two banks and an e-wallet (Lia, pesos, the Philippines): setup 1 Dec to 1 Mar, the bank after the cards per bank, hand-worked figures at every step (slice 6)"; run tests/e3_life_b.js "e3_life_b: ALL PASS"
step "the real-page walk, walk 4 run A: setup 24 Nov to 15 Feb, hand-worked figures at every step"; run tests/e3_walk.js "e3_walk: ALL PASS"
step "the walk again in Tokyo at 04:40 (every figure the same after a reload at each check-in)"; TZ=Asia/Tokyo WALK_CLOCK=04:40 run tests/e3_walk.js "e3_walk: ALL PASS"
step "the walk again in Tokyo at 23:30 (every figure the same after a reload at each check-in)"; TZ=Asia/Tokyo WALK_CLOCK=23:30 run tests/e3_walk.js "e3_walk: ALL PASS"
step "guard (idle CPU, long tasks, outside requests, errors)"; run tests/guard3.js "guard3: ALL PASS"
step "offline load"; run tests/offline.js "offline: ALL PASS"
step "the private publish (a made-up path, a copy of public/ served by the worker's rules)"; run tests/e3_publish.js "e3_publish: ALL PASS"
step "two tabs on one device"; run tests/e3_tabs.js "e3_tabs: ALL PASS"
step "Settings and the backup file"; run tests/e3_backup.js "e3_backup: ALL PASS"
step "Ask on the page (recorded replies: the viewer's Claude and the relay)"; run tests/e3_ask.js "e3_ask: ALL PASS"
step "Reminders on the page (check-ins and bills, the calendar file, Google and Outlook, nothing sent)"; run tests/e3_remind.js "e3_remind: ALL PASS"
step "the cloud copy, two devices through the page (local fake vault)"; run tests/e3_cloud.js "e3_cloud: ALL PASS"
step "the service worker (precache, offline, 3 s timeout, a new build)"; run tests/e3_sw.js "e3_sw: ALL PASS"

step "walk/ holds only its README and the kept walks v1 to v4 (the gate is tests/e3_walk.js)"
WALK=$(ls -A walk | sort | tr '\n' ' '); [ "$WALK" = "README.md v1 v2 v3 v4 " ] && echo "walk: tidy" || { echo "walk/ is not tidy: $WALK"; BAD=1; }

step "FEATURES.json (a feature marked passing must have its test green in this run)"
node -e "
const fs=require('fs');const F=JSON.parse(fs.readFileSync('FEATURES.json','utf8'));const R=Object.fromEntries(fs.readFileSync('$RESULTS','utf8').trim().split('\n').filter(Boolean).map(l=>l.split(' ')));
let bad=0;for(const f of F.features){const r=R[f.test];const tag=r||'not run';console.log((f.passes?'[x] ':'[ ] ')+f.name+'  ('+f.test+': '+tag+')');if(f.passes&&r!=='PASS'){console.log('  MARKED PASSING BUT '+tag);bad=1;}if(!f.passes&&r==='PASS')console.log('  its test is green: it may be marked passing');}
process.exit(bad)" || BAD=1
rm -f "$RESULTS"
echo; [ $BAD -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED, see above"
exit $BAD
