#!/bin/bash
# app3's own check (DECISIONS_ROUND2 AZ1, AZ2, BR5): build, the engine tests, the screen tests, no maths in screens, the
# idle and long-task guard, the offline load, and FEATURES.json kept honest. Prints ALL GOOD only when nothing failed.
#   ./check3.sh                 the full level, before every merge: every test below
#   ./check3.sh quick           the per-commit level: build, the engine, the screens tests, every node test, no_maths,
#                               and the page tests for the files this branch changed since it left origin/wip-38.31,
#                               committed or not (the map from a file to its tests is page_tests_for below)
#   ./check3.sh quick e3_home e3_plan   the same, with the page tests named instead of worked out from the changes
#   CHECK3_JOBS=3               how many tests run side by side (each has its own browser, temp profile and port)
# How it runs (app3/CHECK3.md has the timings): the engine first and on its own (it has a speed test), then every other
# test in a pool of CHECK3_JOBS, slowest first, then the guard on its own (idle CPU and paint times). Every result is
# collected; a failing test's own output is printed in full; any FAIL fails the gate. Nothing kills browsers it did not
# start: every process a test starts carries CHECK3_JOB in its environment, and only those are cleaned up.
cd "$(dirname "$0")" || exit 1
MODE=full; [ "$1" = full ] && shift; [ "$1" = quick ] && { MODE=quick; shift; }
JOBS=${CHECK3_JOBS:-3}; [[ "$JOBS" =~ ^[1-9][0-9]*$ ]] || { echo "CHECK3_JOBS must be a whole number, 1 or more"; exit 1; }
RUN_ID="c3-$$-$(date +%s%N)"; WORK=$(mktemp -d); RESULTS=$WORK/results; : > "$RESULTS"; BAD=0; T_START=$SECONDS
step() { echo; echo "== $1"; }

# --- the processes this run started, found by the CHECK3_JOB=<run>.<n> each test's processes inherit (a browser too)
ours() { grep -l -z -s "^CHECK3_JOB=$RUN_ID\.${1:+$1\.}" /proc/[0-9]*/environ 2>/dev/null | cut -d/ -f3 | grep -v -x -e "$$" -e "${BASHPID:-$$}"; }
reap() {   # reap <job>|"" : kill what is left of one test (or of the whole run), and say so
  local p; p=$(ours "$1" | tr '\n' ' '); [ -z "$p" ] && return 0
  kill -9 $p 2>/dev/null; echo "(cleaned up $(echo $p | wc -w) leftover processes this run started: $p)"
}
on_exit() { local j; for j in $(jobs -p); do kill "$j" 2>/dev/null; done; reap "" >/dev/null; rm -rf "$WORK"; }
trap on_exit EXIT; trap 'echo "check3 stopped"; exit 130' INT TERM

# --- the tests. kind: node (no browser), page (a browser), alone (run with nothing else of this run beside it).
#     file | pass word | env | timeout in s | step name     (the env is a list of NAME=value, no spaces in a value)
TESTS=$(cat <<'EOF'
node|tests/checkin_book.test.js|CHECKIN BOOK PASS||300|the try book through the engine check-in writer
node|tests/e3_act_unit.js|e3_act_unit: ALL PASS||300|act3, the one write door (pure)
node|tests/cloud3.test.js|cloud3: ALL PASS||300|the cloud copy's core, two devices on a local fake vault
node|../../../tests/vault_server/vault_server.test.mjs|vault_server: ALL PASS||300|the vault server itself in node (the five changes, the old app's calls, today's database)
node|../../../tests/vault_server/fake_parity.test.mjs|fake_parity: ALL PASS||300|the fake vault answers as the server does
node|../../../tests/vault_server/relay_cap.test.mjs|relay_cap: ALL PASS||300|the AI relay's daily call cap per household, in node (M68): the count follows the code word, not the device or the connection
node|tests/e3_stmt_read.js|e3_stmt_read: ALL PASS||300|statements, the reading half (pure)
node|tests/e3_stmt_plan.js|e3_stmt_plan: ALL PASS||300|statements, the writing half (pure): lines, matching, records
node|tests/plan3_write.test.js|plan3_write: ALL PASS||300|the Plan tab's steps (pure)
node|tests/backup3.test.js|backup3: ALL PASS||300|the backup file's core
node|tests/answers3.test.js|answers3: ALL PASS||300|answers3, the one answers-to-book function (BV1): same answers, same book
node|tests/chat3_core.test.js|chat3_core: ALL PASS||300|the assistant's core with the fake model: Mako's setup chat to 201,400, before tax, a side job, a stale draft, a skipped question, changes with Undo (BU, BV, BW)
node|tests/restore3.test.js|restore3: ALL PASS||300|a restore while the cloud copy is on: restamped so it sticks, nothing added after the backup returns, two devices on the fake vault, Put it back reaches both
node|tests/ask3_core.test.js|ask3_core: ALL PASS||300|Ask, the pure half (the summary sent, the reply checked, steps through act3, Undo)
node|tests/remind3.test.js|remind3: ALL PASS||300|reminders, the pure half (days from the engine's calendar, the calendar file, Google and Outlook links)
node|tests/no_maths.js|NO MATHS PASS||300|no money maths in screens
node|tests/m_lines.test.js|m_lines: ALL PASS||300|every line of MAKO_SAYS.md is named by a test, a reviewer brief or a scope file (QC_ROLES scripts e); its KNOWN gaps are in tests/QCSCRIPTS_FOUND.md
node|tests/wording_lint.test.js|wording_lint: ALL PASS||300|a wording lint over the words a person sees (QC_ROLES scripts f): no em dash, VOICE.md's full stop rules, none of the words or marks VOICE.md forbids, no real figures (M54, M55, M62); its KNOWN lines are in tests/QCSCRIPTS_FOUND.md
page|../screens/test/run_all.sh|every file passed||900|the shared screen pieces (screens/test/run_all.sh)
page|tests/e3_try.js|e3_try: ALL PASS||300|the try book
page|tests/e3_home.js|e3_home: ALL PASS||300|Home, the new top
page|tests/e3_payday.js|e3_payday: ALL PASS||300|pay day in two steps: the pay and what it covers, to the end of the day (slice 6, G4)
page|tests/e3_ns.js|e3_ns: ALL PASS||300|the north-star review's small fixes (the glow at 1280, the day a card was checked, Log a spend, the help marks)
page|tests/e3_homeplan.js|e3_homeplan: ALL PASS||300|Home's ways into the plan: goals with what is set aside, Add a card (north star F2, F3)
page|tests/e3_checkin.js|e3_checkin: ALL PASS||300|Check your bank
page|tests/e3_checkgap.js|e3_checkgap: ALL PASS||300|Check your bank names the gap before and after saving (BK2, BK4)
page|tests/e3_warnwords.js|e3_warnwords: ALL PASS||300|Home words the engine's warnings itself: below zero with no minimum, no raw ISO day or month
page|tests/e3_cardline.js|e3_cardline: ALL PASS||300|a card with an overdue payment never says nothing to pay yet
page|tests/e3_bankparts.js|e3_bankparts: ALL PASS||300|bank today in its parts once something is logged after the check
page|tests/e3_cardfig.js|e3_cardfig: ALL PASS||300|a card's figure typed at a check-in (US dollars away until 16 Dec; Mako's 10 Dec)
page|tests/e3_reload.js|e3_reload: ALL PASS||600|a figure typed at Check your bank is the same after a reload: four time zones, morning, mid morning and night (QC numbers blocker 1)
page|tests/e3_stmt.js|e3_stmt: ALL PASS||300|Add statements (the AI route, any AI, review, Add, duplicates once, the relay)
page|tests/e3_stmt_once.js|e3_stmt_once: ALL PASS||300|each record once after a statement (BI2): Receipts
page|tests/e3_period.js|e3_period: ALL PASS||300|the period by its dates
page|tests/e3_receipts.js|e3_receipts: ALL PASS||300|Receipts
page|tests/e3_listfix.js|e3_listfix: ALL PASS||300|the LISTFIX fixes on the page (app3/LISTFIX.md): gaps in Receipts and the rest
page|tests/e3_cardgap.js|e3_cardgap: ALL PASS||300|a card's gap across pay day (CARDGAP): Mako's shape from setup, cards typed 6 and 13 Dec, two rows in Receipts, the rows add up to each period's spent, Plan and Home agree, a reload
page|tests/e3_cardpay.js|e3_cardpay: ALL PASS||300|Check your bank asks whether a card's unticked payment went out when the card shows far less than the app had; Yes ticks it (M11, M27)
page|tests/e3_doors.js|e3_doors: ALL PASS||300|Receipts' two doors at 320 (M22): Money went out and Money came in, Refund and Moved under them, one of each door saved
page|tests/e3_moved1.js|e3_moved1: ALL PASS||300|Moved with one account of your own says a second account is needed, no empty To list and no Save (K18)
page|tests/e3_moneyin.js|e3_moneyin: ALL PASS||300|Receipts: Money in, a client payment or a gift (slice 6)
page|tests/e3_amounts.js|e3_amounts: ALL PASS||300|every amount box: a tap, click or Tab, or a form's own focus, selects, so typing replaces (screens/inputs.js)
page|tests/e3_bigspend.js|e3_bigspend: ALL PASS||300|a spend larger than what its account holds asks first, new or changed (north star F5)
page|tests/e3_panels.js|e3_panels: ALL PASS||300|only the tapped tab's panel shows (every tab after every other, the sheets)
page|tests/e3_lineshare.js|e3_lineshare: ALL PASS||300|a line added mid-period: one amount that counts now, the full one in a sentence, how far over
page|tests/e3_plan.js|e3_plan: ALL PASS||300|the Plan tab
page|tests/e3_rhythms.js|e3_rhythms: ALL PASS||300|Plan names every rhythm: two days, weeks with the weekday, every few months, set months, once a year, once, the last working day, no fixed day (slice 6)
page|tests/e3_names.js|e3_names: ALL PASS||300|one figure, one name on Home, Receipts and Plan (labels from screens/names.js)
page|tests/e3_first.js|e3_first: ALL PASS||300|the ways out of the first screen and the made-up numbers
page|tests/e3_file.js|e3_file: ALL PASS||300|as a plain file:the first screen, the try book and its day box
page|tests/e3_setup.js|e3_setup: ALL PASS||300|setup3
page|tests/e3_setupfix.js|e3_setupfix: ALL PASS||300|setup fixes from Mako's first run: pay after tax, rows removed, empty amounts, each section saved with Undo, today's pay landed, a reload half way
page|tests/e3_overdrawn.js|e3_overdrawn: ALL PASS||300|a bank below zero typed at setup and at Check your bank, the amber line on Home, a reload (M47)
page|tests/e3_back.js|e3_back: ALL PASS||300|the phone's back button on every sheet, form and setup: it closes the top one, the app stays, typing is kept (K34, K35)
page|tests/e3_undobar.js|e3_undobar: ALL PASS||300|the Undo bar never sits over a sheet or form opened after it, and is back when that closes in time (K37)
page|tests/e3_band.js|e3_band: ALL PASS||300|the message band and its Undo are on screen where the person is, at 390, 320, 1300 and with the keyboard up, never over the button just pressed (qc-layout blocker 2, M14)
page|tests/e3_paytoday.js|e3_paytoday: ALL PASS||300|setup on a day the pay lands asks whether it is already in the bank figure (BV2.13; setup3 through answers3)
page|tests/e3_fakeai_page.js|e3_fakeai_page: ALL PASS||300|reviewers' way to the assistant: openWithFakeAI on a plain copy (fake_ai_page.js)
page|tests/e3_chatwalk.js|e3_chatwalk: ALL PASS||600|the setup chat walked through the real page with the fake model: Mako's shape to safe to spend 201,400 and Main bank 286,000 on 24 Nov, Undo the fill, a reload, one spend by chat and its Undo (AI first, slice 1 gate)
page|tests/e3_twodrafts.js|e3_twodrafts: ALL PASS||400|one set of setup answers before the book: a section saved on the setup screens goes into the chat's draft, its Undo too, the newest answer wins both ways, yen and dollars (qc-assistant run 4)
page|tests/e3_chat.js|e3_chat: ALL PASS||300|the assistant panel: the welcome as the first screen, the ways when the AI is off, the relay, cards with Undo and asking first, the bar and the column
page|tests/e3_fillundo.js|e3_fillundo: ALL PASS||300|the setup chat's fill and its Undo: two tabs, the cloud copy held back while it can be undone (BV2.9)
page|tests/e3_ailog.js|e3_ailog: ALL PASS||300|the assistant's error log (AI_JOIN_FIXES J): failed exchanges on this device only, no words or figures, Copy and Clear with Undo in Settings, kept after a reload, never in the book
page|tests/e3_aiwords.js|e3_aiwords: ALL PASS||300|what the assistant is told, on the real page with the real core (AI_JOIN_FIXES H5, H6): a bank figure far from what was expected asks first with the gap in words; a spend with no account asks card or bank once, then remembers
page|tests/e3_fillcard.js|e3_fillcard: ALL PASS||300|the draft card and the fill card with the real core (AI_JOIN_FIXES C, D): no Fill on a part answer; the fill's Undo on a phone leaves one welcome and one chat box; no Start over, the card says how to change things
page|tests/e3_cloudfirst.js|e3_cloudfirst: ALL PASS||300|the cloud copy turned on right after a setup by chat sends the first copy, and a second device with the code has the book (AI_JOIN_FIXES B; M61, M67)
page|tests/e3_aijoin.js|e3_aijoin: ALL PASS||300|the assistant joined to the base, the real core on the real page (AI_JOIN_FIXES A): a bill changed by chat, a reload, Undo on the kept card; a job change by chat on 5 Jan and the period on 20 Mar
page|tests/e3_onepay.js|e3_onepay: ALL PASS||300|two incomes on the 10th entered as one pay (M28): setup 20 Nov, 9 Dec, Check your bank on 10 Dec, hand-worked next pay, period and safe to spend
page|tests/e3_setup6.js|e3_setup6: ALL PASS||300|setup for the other lives: the country chosen, more accounts, pay rhythms, a second income on its own day, cards and bills from their account, once a year (slice 6)
page|tests/e3_income2.js|e3_income2: ALL PASS||300|a second income every n weeks (stepped back to a day on or before setup) or on two days a month (slice 6b)
page|tests/e3_weeks3.js|e3_weeks3: ALL PASS||300|pay every 3 weeks in setup and the pay form (slice 6b)
page|tests/e3_walk2.js|e3_walk2: ALL PASS||300|walk 2 fixes (BI3 bills not gone out yet, BI4 may still go through, a pay by its landing day)
page|tests/e3_walk4.js|e3_walk4: ALL PASS||300|walk 4 fixes (an outstanding pay's own amount on Plan, the typed note beside a statement row in Receipts)
page|tests/e3_life_c.js|e3_life_c: ALL PASS||600|life C, no fixed pay (Kai, yen, Japan): setup 1 Dec to 2 Mar, hand-worked figures at every step (slice 6)
page|tests/e3_life_a.js|e3_life_a: ALL PASS||600|life A, every 2 weeks (Sam, dollars, weekends only): setup 7 Dec to 8 Mar, the pay changed to monthly, hand-worked figures at every step (slice 6)
page|tests/e3_life_a2.js|e3_life_a2: ALL PASS||600|life A given the next pay day: the period holding setup exists, Plan and Receipts show it, Free to spend 11 of 14 days (slice 6, qc-foundation blocker)
page|tests/e3_paychange.js|e3_paychange: ALL PASS||600|the pay form changes how often pay lands to and from two days a month and no fixed pay, each line proposed a month or each pay (slice 6b, BP3)
page|tests/e3_life_d.js|e3_life_d: ALL PASS||600|life D, two days a month changed to no fixed pay mid-period (Noa, dollars, weekends only): setup 1 Dec to 4 Jan, hand-worked figures and a reload at every check-in (slice 6b)
page|tests/e3_life_b.js|e3_life_b: ALL PASS||600|life B, the 15th and the last day, two banks and an e-wallet (Lia, pesos, the Philippines): setup 1 Dec to 1 Mar, the bank after the cards per bank, hand-worked figures at every step (slice 6)
page|tests/e3_walk.js|e3_walk: ALL PASS||600|the real-page walk, walk 4 run A: setup 24 Nov to 15 Feb, hand-worked figures at every step
page|tests/e3_walk.js|e3_walk: ALL PASS|TZ=Asia/Tokyo WALK_CLOCK=04:40|600|the walk again in Tokyo at 04:40 (every figure the same after a reload at each check-in)
page|tests/e3_walk.js|e3_walk: ALL PASS|TZ=Asia/Tokyo WALK_CLOCK=23:30|600|the walk again in Tokyo at 23:30 (every figure the same after a reload at each check-in)
page|tests/e3_walk_cardgap.js|e3_walk_cardgap: ALL PASS||600|the real-page walk, the card gap step (CARDGAP): Mako's month across the pay on the 10th with the cards checked each week, safe to spend and the bank hand-worked at every step
page|tests/e3_walk_cardgap.js|e3_walk_cardgap: ALL PASS|TZ=Asia/Tokyo|600|the card gap walk again in Tokyo
alone|tests/guard3.js|guard3: ALL PASS||300|guard (idle CPU, long tasks, outside requests, errors)
page|tests/offline.js|offline: ALL PASS||300|offline load
page|tests/e3_install.js|e3_install: ALL PASS||300|installed to the home screen (M33): the manifest beside the page, its icons, start_url in the page's own folder, kept by the worker, Chrome's installability check
page|tests/e3_publish.js|e3_publish: ALL PASS||300|the private publish (a made-up path, a copy of public/ served by the worker's rules)
page|tests/e3_tabs.js|e3_tabs: ALL PASS||300|two tabs on one device
page|tests/e3_stalesheet.js|e3_stalesheet: ALL PASS||300|a sheet left open while the same thing changes in another tab: its save is refused, nothing is written, it is shown again as it is (STALE_SHEET_PLAN, M61)
page|tests/e3_backup.js|e3_backup: ALL PASS||300|Settings and the backup file
page|tests/e3_invite.js|e3_invite: ALL PASS||300|the code word for the AI: the box, a word that does not match, Settings, never in the book
page|tests/e3_remind.js|e3_remind: ALL PASS||300|Reminders on the page (check-ins and bills, the calendar file, Google and Outlook, nothing sent)
page|tests/e3_cloud.js|e3_cloud: ALL PASS||300|the cloud copy, two devices through the page (local fake vault)
page|tests/e3_cloudbase.js|e3_cloudbase: ALL PASS||300|the cloud copy's base is saved only with its book: a refused save, a refused write then no signal (CS3, M61, M20)
page|tests/e3_cloudtake.js|e3_cloudtake: ALL PASS||300|the cloud copy taken by itself: a timed check of the revision, coming back into view, two tabs, the timer stopped and said once, a killed page (CS2, B1, B3)
page|tests/e3_cloudsend.js|e3_cloudsend: ALL PASS||600|the cloud copy sent by itself: at once, a burst 5 seconds after, never two in 10 seconds, leaving with a big copy, the day's guard (CS1)
page|tests/e3_cloudhold.js|e3_cloudhold: ALL PASS||300|the cloud copy held back while a form is open or covered by the chat, taken when it closes, and "Last checked" (CS4, B2, B4)
page|tests/e3_removes.js|e3_removes: ALL PASS||300|every remove on the screens asks first: counted in src, and the four that change money walked (M6, M61)
page|tests/e3_cloudwhich.js|e3_cloudwhich: ALL PASS||300|"which to keep": each row says its amount and which device, and the pick ends on both devices (M20)
page|tests/e3_cloudwhich2.js|e3_cloudwhich2: ALL PASS||600|"which to keep": a stale answer from a second tab is refused, a newer change is never overwritten, and Undo right after Keep for a plan item, a setting and a whole copy (M20, M61, M14)
page|tests/e3_cloudstatus.js|e3_cloudstatus: ALL PASS||300|the cloud copy's one status on Settings and Home: never in step while a change waits or after a refusal, a reload too (M36, M61, M67)
page|tests/e3_restore.js|e3_restore: ALL PASS||300|a backup restored with the cloud copy on reaches the other device, and so does Put it back; Put it back and Drop it ask first (local fake vault)
page|tests/e3_sw.js|e3_sw: ALL PASS||300|the service worker (precache, offline, 3 s timeout, a new build)
page|tests/e3_layout.js|e3_layout: ALL PASS||900|the layout at 320, 390, 412 and 1300 wide on a stress book (60-letter names, a 28-letter word, a nine-digit figure) and a new device: no sideways scroll, nothing off its card, no cut drop-down, no narrow date box, nothing to tap under 44 (qc-layout blockers 1, 3 to 6)
page|tests/e3_boxwalk.js|e3_boxwalk: ALL PASS||600|a walker for every box and sheet (QC_ROLES scripts b): left empty, a wrong value, a plain message, nothing saved, a way out, then every box right saves; its KNOWN faults are in tests/QCSCRIPTS_FOUND.md
page|tests/e3_always.js|e3_always: ALL PASS||600|on every screen and sheet (QC_ROLES scripts c): Ask one tap away, no page errors, and no network calls with the cloud copy off and the assistant not used; its KNOWN faults are in tests/QCSCRIPTS_FOUND.md
EOF
)
# The slowest first, so the pool ends together (CHECK3.md has the times these come from). Unlisted tests follow.
SLOW="e3_walk e3_life_b e3_life_d e3_life_a e3_life_c e3_paychange e3_life_a2 e3_reload run_all e3_stmt e3_setup6 e3_setupfix e3_receipts e3_listfix e3_plan e3_amounts"

# --- quick: which page tests go with a change (a src file, a test file, or anything the page is built from)
page_tests_for() {   # page_tests_for <changed path, relative to app3/>
  case "$1" in
    tests/lib3.js|src/e3.js|src/money3.js|src/act3.js|src/shell.html|src/app3.css|build3.sh|../screens/*|../store/*|fixtures/*)
                              echo e3_try e3_home e3_checkin e3_receipts e3_plan e3_panels e3_amounts e3_names e3_band e3_undobar ;;
    ../engine/*)              echo e3_try e3_home e3_checkin e3_receipts e3_plan e3_panels e3_amounts e3_names e3_cardgap ;;
    tests/lives3.js)          echo e3_life_a e3_life_a2 e3_life_b e3_life_c e3_life_d ;;
    tests/e3_act_book.js)     echo e3_home e3_checkin ;;
    tests/fake_vault.js)      echo e3_cloudfirst e3_cloud e3_cloudbase e3_cloudtake e3_cloudsend e3_cloudhold e3_cloudwhich e3_cloudwhich2 e3_cloudstatus e3_listfix e3_restore ;;
    tests/qc_places.js)       echo e3_boxwalk e3_always ;;
    tests/setup_sections.js)  echo e3_setup e3_setupfix e3_setup6 e3_income2 e3_weeks3 e3_walk2 e3_paytoday e3_chatwalk e3_chat ;;   # a helper (setup saved section by section), not a test
    tests/fake_ai.js|tests/fake_ai_page.js) echo e3_fakeai_page e3_chatwalk e3_chat chat3_core.test ;;   # helpers (the fake model, and it behind a made-up relay), not tests
    tests/chat_real.js)       echo e3_ailog e3_aiwords e3_fillcard e3_cloudfirst e3_aijoin ;;   # a helper (the real core and panel with the fake model behind a made-up relay), not a test
    tests/*.js)               [ -f "$1" ] && basename "$1" .js ;;   # a test file removed on purpose has no test to run
    src/home3.js)             echo e3_cloudstatus e3_home e3_ns e3_homeplan e3_warnwords e3_cardline e3_bankparts e3_names e3_payday ;;
    src/checkin3.js)          echo e3_checkin e3_checkgap e3_cardfig e3_reload e3_bankparts e3_payday e3_overdrawn e3_cardpay ;;
    src/receipts3.js)         echo e3_removes e3_receipts e3_listfix e3_moneyin e3_bigspend e3_stmt_once e3_period e3_names e3_doors e3_moved1 e3_cardgap ;;
    src/plan3.js|src/plan3_write.js) echo e3_removes e3_aijoin e3_plan e3_rhythms e3_lineshare e3_homeplan e3_paychange e3_names ;;
    src/setup3.js|src/answers3.js) echo e3_twodrafts e3_fillcard e3_setup e3_setupfix e3_setup6 e3_income2 e3_weeks3 e3_first e3_onepay e3_overdrawn e3_paytoday e3_chatwalk e3_chat ;;
    src/chat3*.js)            echo e3_twodrafts e3_ailog e3_aiwords e3_fillcard e3_cloudfirst e3_aijoin e3_chat e3_chatwalk e3_fakeai_page e3_fillundo e3_invite e3_back e3_cloudhold ;;
    src/start3.js)            echo e3_first e3_file e3_try e3_chat e3_cloudtake ;;
    src/back3.js)             echo e3_back e3_undobar e3_checkin e3_plan e3_receipts e3_setupfix e3_stmt e3_remind e3_backup e3_tabs e3_stalesheet e3_cloudhold ;;
    src/stmt3*.js)            echo e3_stmt e3_stmt_once e3_walk4 e3_invite e3_chat ;;
    src/ask3*.js)             echo e3_chat e3_invite e3_chatwalk ;;   # ask3_core.js: the summary the assistant is sent
    src/backup3.js|src/settings3.js) echo e3_backup e3_tabs e3_ailog e3_invite e3_restore e3_cloudhold ;;
    src/sw3.js|src/settings3_sw.js|sw3.js) echo e3_sw offline e3_install ;;
    src/cloud3*.js)           echo e3_cloudfirst e3_cloud e3_cloudbase e3_cloudtake e3_cloudsend e3_cloudhold e3_cloudwhich e3_cloudwhich2 e3_cloudstatus e3_restore ;;
    src/remind3*.js)          echo e3_remind ;;
    publish3.sh)              echo e3_publish e3_install ;;
    manifest3.webmanifest|make_icons3.js|icon3-*.png) echo e3_install ;;
  esac
}

# --- one test, in the background: its output, exit code, seconds and any note go to $WORK/<n>.*
job() {   # job <n> <file> <timeout> <env...>
  local n=$1 f=$2 t=$3 out rc t0=$SECONDS note=""; shift 3
  local cmd=(node "$f"); [[ "$f" == *.sh ]] && cmd=(bash "$f")
  local tmp="$WORK/tmp/$n"; mkdir -p "$tmp"   # the test's temp profiles and files, removed when it ends (they filled the disk)
  out=$(env CHECK3_JOB="$RUN_ID.$n." TMPDIR="$tmp" "$@" timeout "$t" "${cmd[@]}" 2>&1 < /dev/null); rc=$?
  note=$(reap "$n")
  # The browser itself going away under load from other lanes (a detached frame, a closed session, a failed launch)
  # is not a test result: that one case runs again once, and says so. A FAIL line is never run again.
  # "Target page, context or browser has been closed" is the same case in Playwright's words (the walk and the lives):
  # it is what a walk prints when another session runs pkill -f chrome-linux64/chrome under it.
  if [ $rc -ne 0 ] && ! echo "$out" | grep -q "^FAIL [^c]" && echo "$out" | grep -q "detached Frame\|Session closed\|Target closed\|Target page, context or browser has been closed\|Failed to launch the browser"; then
    note="$note${note:+$'\n'}RETRIED: the browser went away under load (no FAIL line), so $f ran once more. The first run's last lines:"$'\n'"$(echo "$out" | tail -8)"
    out=$(env CHECK3_JOB="$RUN_ID.$n." TMPDIR="$tmp" "$@" timeout "$t" "${cmd[@]}" 2>&1 < /dev/null); rc=$?
    local again; again=$(reap "$n"); [ -n "$again" ] && note="$note"$'\n'"$again"
  fi
  rm -rf "$tmp"
  [ $rc -eq 124 ] && note="$note${note:+$'\n'}TIMED OUT after $t s"
  printf '%s\n' "$out" > "$WORK/$n.out"; printf '%s' "$note" > "$WORK/$n.note"; echo $((SECONDS - t0)) > "$WORK/$n.sec"
  echo "$rc" > "$WORK/$n.rc.tmp" && mv "$WORK/$n.rc.tmp" "$WORK/$n.rc"   # written last: the test is finished
}
passed() {   # passed <n> <word>: exit 0, its pass word, and no FAIL line anywhere in its output
  [ "$(cat "$WORK/$1.rc")" = 0 ] && grep -q -F "$2" "$WORK/$1.out" && ! grep -q "^FAIL" "$WORK/$1.out"
}

# --- build and the engine, on their own
step "build"; ./build3.sh || exit 1
node -e "const h=require('fs').readFileSync('index.html','utf8');const s=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)];if(s.length!==2)throw new Error('expected 2 scripts, found '+s.length);s.forEach(m=>new Function(m[1]));console.log('syntax ok')" || { echo "SYNTAX ERROR"; exit 1; }

step "the engine's own tests (failures already on wip-38.31 are listed in engine_known.txt; any other is a failure)"
T0=$SECONDS; OUT=$(node ../engine/test/run_all.js 2>&1); echo "$OUT" | tail -3
NEW=$(echo "$OUT" | grep "^FAIL" | cut -c1-60 | sort -u | grep -v -x -F -f <(grep -v '^#' engine_known.txt | cut -c1-60))
if echo "$OUT" | grep -q "ENGINE CHECKS ALL PASS"; then echo "engine: all pass"; [ -n "$(grep -v '^#' engine_known.txt)" ] && echo "NOTE engine_known.txt can be emptied now"
elif [ -n "$NEW" ]; then echo "NEW ENGINE FAILURES:"; echo "$OUT"; BAD=1; else echo "engine: only the known failures (engine_known.txt, lane A)"; fi
echo "($((SECONDS - T0)) s)"

# --- which tests this level runs
declare -a K F W E T S
i=0; while IFS='|' read -r k f w e t s; do K[i]=$k; F[i]=$f; W[i]=$w; E[i]=$e; T[i]=$t; S[i]=$s; i=$((i + 1)); done <<< "$TESTS"
N=$i; declare -A WANT=()
if [ $MODE = quick ]; then
  if [ $# -gt 0 ]; then PAGES="$*"; WHY="named"
  else
    # this branch's own changes, committed or not, against where it left origin/wip-38.31 (not what others pushed since)
    BASE=$(git merge-base HEAD origin/wip-38.31) || { echo "check3 quick: no origin/wip-38.31 to compare with; name the page tests instead"; exit 1; }
    CHANGED=$(cd "$(git rev-parse --show-toplevel)" && for c in $( { git diff --name-only "$BASE"; git ls-files --others --exclude-standard; } | sort -u); do realpath -m --relative-to="$OLDPWD" "$c"; done)
    PAGES=$(for c in $CHANGED; do page_tests_for "$c"; done | tr ' ' '\n' | sort -u | tr '\n' ' '); WHY="for the files changed since origin/wip-38.31"
  fi
  for p in $PAGES; do p=${p%.js}; p=${p#tests/}; found=0
    for ((j = 0; j < N; j++)); do [ "$(basename "${F[j]}" .js)" = "$p" ] && { WANT[$j]=1; found=1; }; done
    [ $found = 1 ] || { echo "check3 quick: no test called $p"; BAD=1; }
  done
  for ((j = 0; j < N; j++)); do [ "${K[j]}" = node ] && WANT[$j]=1; [ "${F[j]}" = ../screens/test/run_all.sh ] && WANT[$j]=1; done
  step "quick: the node tests, no_maths, the screens tests, and the page tests $WHY: ${PAGES:-none}"
else
  for ((j = 0; j < N; j++)); do WANT[$j]=1; done
fi
ORDER=(); for s in $SLOW; do for ((j = 0; j < N; j++)); do [ -n "${WANT[$j]}" ] && [ "${K[j]}" != alone ] && [ "$(basename "${F[j]}" | sed 's/\.[a-z]*$//')" = "$s" ] && ORDER+=("$j"); done; done
for ((j = 0; j < N; j++)); do [ -n "${WANT[$j]}" ] && [ "${K[j]}" != alone ] && [[ " ${ORDER[*]} " != *" $j "* ]] && ORDER+=("$j"); done
ALONE=(); for ((j = 0; j < N; j++)); do [ -n "${WANT[$j]}" ] && [ "${K[j]}" = alone ] && ALONE+=("$j"); done

# --- the pool, then the tests that run alone
step "$(( ${#ORDER[@]} + ${#ALONE[@]} )) tests, $JOBS at a time ($MODE level); each line is one finished test"
TP=$SECONDS; started=(); shown=()
progress() { local j; for j in "${started[@]}"; do [ -z "${shown[$j]}" ] && [ -f "$WORK/$j.rc" ] && { shown[$j]=1
  passed "$j" "${W[j]}" && r=PASS || r=FAIL; [ -s "$WORK/$j.note" ] && grep -q '^RETRIED' "$WORK/$j.note" && r="$r (retried once)"
  printf '  [%2d/%d] %-4s %4ss  %s %s%s\n' "${#shown[@]}" "$(( ${#ORDER[@]} + ${#ALONE[@]} ))" "${r%% *}" "$(cat "$WORK/$j.sec")" "${F[j]}" "${E[j]}" "${r#????}"; }; done; }
for j in "${ORDER[@]}"; do
  while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do wait -n; progress; done
  job "$j" "${F[j]}" "${T[j]}" ${E[j]} & started+=("$j")
done
while [ -n "$(jobs -rp)" ]; do wait -n; progress; done; wait; progress
for j in "${ALONE[@]}"; do started+=("$j"); job "$j" "${F[j]}" "${T[j]}" ${E[j]}; progress; done
echo "(the tests took $((SECONDS - TP)) s)"

# --- every result, in the order of the list; a failing test's own output in full
FAILED=""
for ((j = 0; j < N; j++)); do [ -z "${WANT[$j]}" ] && continue
  step "${S[j]}"
  [ -s "$WORK/$j.note" ] && { cat "$WORK/$j.note"; echo; }
  if passed "$j" "${W[j]}"; then
    grep -v "^PASS" "$WORK/$j.out" | tail -12; echo "${F[j]} PASS" >> "$RESULTS"
  else
    echo "--- the whole output of ${F[j]} ${E[j]}:"; cat "$WORK/$j.out"; echo "--- end of ${F[j]}"
    echo "${F[j]} FAIL" >> "$RESULTS"; echo "FAILED: ${F[j]} ${E[j]} (exit $(cat "$WORK/$j.rc"))"; BAD=1; FAILED="$FAILED  ${F[j]} ${E[j]}"$'\n'
  fi
  echo "(${F[j]}: $(cat "$WORK/$j.sec") s)"
done

step "walk/ holds only its README and the kept walks v1 to v4 (the gate is tests/e3_walk.js)"
WALK=$(ls -A walk | sort | tr '\n' ' '); [ "$WALK" = "README.md v1 v2 v3 v4 " ] && echo "walk: tidy" || { echo "walk/ is not tidy: $WALK"; BAD=1; }

if [ $MODE = full ]; then
step "FEATURES.json (a feature marked passing must have its test green in this run)"
node -e "
const fs=require('fs');const F=JSON.parse(fs.readFileSync('FEATURES.json','utf8'));const R={};for(const l of fs.readFileSync('$RESULTS','utf8').trim().split('\n').filter(Boolean)){const [f,r]=l.split(' ');R[f]=R[f]==='FAIL'?'FAIL':r;}
let bad=0;for(const f of F.features){const r=R[f.test];const tag=r||'not run';console.log((f.passes?'[x] ':'[ ] ')+f.name+'  ('+f.test+': '+tag+')');if(f.passes&&r!=='PASS'){console.log('  MARKED PASSING BUT '+tag);bad=1;}if(!f.passes&&r==='PASS')console.log('  its test is green: it may be marked passing');}
process.exit(bad)" || BAD=1
else
step "FEATURES.json is checked by the full level only (quick does not run every test)"
fi

echo; echo "($MODE level, $JOBS at a time, $((SECONDS - T_START)) s in all)"
[ -n "$FAILED" ] && { echo "the failed tests (each one's whole output is above):"; printf '%s' "$FAILED"; }
[ $BAD -eq 0 ] && echo "ALL GOOD" || echo "SOMETHING FAILED, see above"
exit $BAD
