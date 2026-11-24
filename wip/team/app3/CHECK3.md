# check3: the two levels and their times

Check-speed lane, 24 Nov 2026. DECISIONS_ROUND2 BR5: the quick level after each commit, the full level before each merge.

## How to run it

- `./check3.sh quick` after each commit (about 1 minute). It builds, runs the engine's tests, the screens tests,
  every node test and no_maths, and the page tests for the files this branch changed since it left origin/wip-38.31,
  committed or not. The map from a file to its page tests is `page_tests_for` in check3.sh: a screen's src file names
  its own tests; a shared piece (e3.js, money3.js, act3.js, lib3.js, the engine, screens, store, build3.sh) names a
  smoke set of eight page tests; a changed test file runs itself.
- `./check3.sh quick e3_home e3_plan` runs the same with the page tests named.
- `./check3.sh` before each merge: every test, as before. Nothing was dropped or loosened.
- `CHECK3_JOBS=4 ./check3.sh` sets how many tests run side by side (default 3).

## What the full level does now

- The engine's tests run first, alone (they hold a speed test with a 1,000 ms budget).
- Every other test runs in a pool of CHECK3_JOBS, the slowest first (the three walks, then the lives). Each test has
  its own browser and its own temp profile (every test already made its own with mkdtemp), and any server a test
  starts listens on port 0, so no two tests share a port.
- guard3 runs last, alone (it measures idle CPU, paint time and long tasks).
- Every result is collected. A failing test's whole output is printed, not its last 12 lines (the old tail hid the
  error of the walk that failed in the timing run below). A line starting with FAIL fails the test even if it exits 0.
  Any failure exits 1 and the last line says SOMETHING FAILED, with the failed tests listed above it.
- The one retry rule is kept: only a browser going away (no FAIL line, and a detached frame, a closed session or
  target, or a failed launch) runs again once. It is printed as RETRIED with the first run's last lines.
- No pkill of every chrome any more. Each test's processes carry `CHECK3_JOB=<run>.<n>` in their environment (a
  browser inherits it), so check3 finds exactly the processes it started. After each test it kills what that test
  left behind and prints the pids; on exit or when stopped it kills what is left of the run. Browsers of other lanes
  are never touched (checked: stopping a run mid-way left the other lanes' 30 browsers running).
- build3.sh now writes index.html and sw3.js to a temp file and moves it into place, so e3_publish (which rebuilds)
  never leaves a half-written page under a test that is loading it.
- FEATURES.json: the walk runs three times; its feature counts as passing only if all three passed (before, the last
  run's result won).
- Each test gets its own TMPDIR inside the run's folder, removed when the test ends. The tests make their browser
  profiles with mkdtemp and never removed them: about 3,000 of them (15 GB) in /tmp filled the disk during a gate run
  (every build then failed). build3.sh now stops on a part it cannot read instead of moving an empty page into place.
- Playwright's words for a browser that went away ("Target page, context or browser has been closed") now count as
  the browser going away, like puppeteer's "Target closed": retried once, printed as RETRIED.
- e3_setup6 and e3_amounts waited a fixed 400 ms and 30 ms; under load they now also wait for the button to appear
  and for the focus to land (up to 10 s and 2 s). What they check is the same.

## For the coordinator: what still kills other lanes' browsers

CLAUDE.md (the last rule) and older RESUME entries still say to run `pkill -f chrome-linux64/chrome` before a check.
/usr/bin/google-chrome runs /opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome, so that kill takes every
lane's browsers, including the walks and lives. In one gate run all three walks died at the same second from it. The
new check3 never needs that kill (it cleans up only its own processes), so that line in CLAUDE.md can go; only Mako
or the coordinator changes CLAUDE.md. Older copies of check3.sh in other worktrees still hold the guarded pkill until
they take this branch.

## The gate runs on this branch (the full level, 3 at a time)

| run | load (4 cores) | time | result |
|-----|----------------|------|--------|
| 1 | about 8 | 5 min 45 s | 2 FAIL: e3_setup6 and e3_amounts, fixed sleeps too short under load (fixed, see above) |
| 2 | about 9 | 5 min 46 s | ALL GOOD |
| 3 | about 10 | 6 min 2 s | FAIL: the engine's speed test, 1,321 ms against a 1,000 ms budget (it ran alone in this run; the load was other lanes) |
| 4 | about 10 | 5 min 42 s | ALL GOOD |
| 5 | about 12 | 5 min 18 s | FAIL: the three walks, their browser killed by another session's pkill (now retried once) |
| 6, 7 | 19 | | the disk filled up (15 GB of old test profiles in /tmp; old ones over an hour old were removed) |
| 8 | about 15 | 6 min 35 s | ALL GOOD |
| 9 | about 16 | 6 min 2 s | ALL GOOD |

engine/test/run_all.js after run 9: ENGINE CHECKS ALL PASS (18 runs).

## Times on this machine (4 cores, other lanes' checks running at the same time)

| | old check3, one test after another | new full level, 3 at a time | new quick level |
|---|---|---|---|
| whole run | 13 min 22 s (802 s) | 5 min 46 s (346 s) | 1 min 1 s (after a change to build3.sh: 12 page tests) |

The "about an hour" was the old check3 with several other lanes' checks on the same 4 cores. The old run above also
failed twice under that load (the Tokyo 23:30 walk and e3_remind; both pass alone and in the new runs).

Most of the walk's 103 s is waiting (6 s of CPU), so CHECK3_JOBS=4 may be faster still on a quiet machine; 3 is the
default because other lanes share the 4 cores.

Each step, in seconds. The old column is the serial run (its time is the whole step). The new column is the same
test's own time inside the pool, a little longer under the load of its neighbours; the steps overlap, so the new
column does not add up to the whole run.

| step | old (s) | new, in the pool (s) |
|------|---------|----------------------|
| build | 0 |  |
| the engine's own tests (failures already on wip-38.31 are listed in engine_known.txt; a... | 16 | 15 |
| the shared screen pieces (screens/test/run_all.sh) | 3 | 4 |
| the try book through the engine check-in writer | 0 | 0 |
| act3, the one write door (pure) | 0 | 0 |
| the cloud copy's core, two devices on a local fake vault | 0 | 1 |
| the vault server itself in node (the five changes, the old app's calls, today's database) | 0 | 0 |
| the fake vault answers as the server does | 0 | 0 |
| statements, the reading half (pure) | 1 | 0 |
| statements, the writing half (pure): lines, matching, records | 0 | 0 |
| the Plan tab's steps (pure) | 0 | 1 |
| the backup file's core | 0 | 1 |
| Ask, the pure half (the summary sent, the reply checked, steps through act3, Undo) | 1 | 0 |
| reminders, the pure half (days from the engine's calendar, the calendar file, Google an... | 0 | 0 |
| no money maths in screens | 0 | 1 |
| the try book | 2 | 2 |
| Home, the new top | 5 | 7 |
| pay day in two steps: the pay and what it covers, to the end of the day (slice 6, G4) | 2 | 3 |
| the north-star review's small fixes (the glow at 1280, the day a card was checked, Log ... | 8 | 8 |
| Home's ways into the plan: goals with what is set aside, Add a card (north star F2, F3) | 7 | 9 |
| Check your bank | 8 | 10 |
| Check your bank names the gap before and after saving (BK2, BK4) | 9 | 9 |
| Home words the engine's warnings itself: below zero with no minimum, no raw ISO day or ... | 18 | 21 |
| a card with an overdue payment never says nothing to pay yet | 4 | 5 |
| bank today in its parts once something is logged after the check | 5 | 6 |
| a card's figure typed at a check-in (US dollars away until 16 Dec; Mako's 10 Dec) | 7 | 10 |
| a figure typed at Check your bank is the same after a reload: four time zones, morning,... | 48 | 49 |
| Add statements (the AI route, any AI, review, Add, duplicates once, the relay) | 10 | 11 |
| each record once after a statement (BI2): Receipts | 6 | 7 |
| the period by its dates | 3 | 4 |
| Receipts | 17 | 19 |
| the LISTFIX fixes on the page (app3/LISTFIX.md): gaps in Receipts and the rest | 22 | 27 |
| Receipts: Money in, a client payment or a gift (slice 6) | 5 | 6 |
| every amount box: a tap, click or Tab, or a form's own focus, selects, so typing replac... | 22 | 27 |
| a spend larger than what its account holds asks first, new or changed (north star F5) | 7 | 8 |
| only the tapped tab's panel shows (every tab after every other, the sheets) | 12 | 13 |
| a line added mid-period: one amount that counts now, the full one in a sentence, how fa... | 5 | 5 |
| the Plan tab | 22 | 26 |
| Plan names every rhythm: two days, weeks with the weekday, every few months, set months... | 3 | 3 |
| one figure, one name on Home, Receipts and Plan (labels from screens/names.js) | 4 | 5 |
| the ways out of the first screen and the made-up numbers | 9 | 11 |
| as a plain file:the first screen, the try book and its day box | 5 | 6 |
| setup3 | 14 | 17 |
| setup for the other lives: the country chosen, more accounts, pay rhythms, a second inc... | 10 | 12 |
| a second income every n weeks (stepped back to a day on or before setup) or on two days... | 7 | 8 |
| pay every 3 weeks in setup and the pay form (slice 6b) | 5 | 5 |
| walk 2 fixes (BI3 bills not gone out yet, BI4 may still go through, a pay by its landin... | 7 | 10 |
| walk 4 fixes (an outstanding pay's own amount on Plan, the typed note beside a statemen... | 4 | 6 |
| life C, no fixed pay (Kai, yen, Japan): setup 1 Dec to 2 Mar, hand-worked figures at ev... | 27 | 28 |
| life A, every 2 weeks (Sam, dollars, weekends only): setup 7 Dec to 8 Mar, the pay chan... | 39 | 38 |
| life A given the next pay day: the period holding setup exists, Plan and Receipts show ... | 11 | 11 |
| the pay form changes how often pay lands to and from two days a month and no fixed pay,... | 7 | 7 |
| life D, two days a month changed to no fixed pay mid-period (Noa, dollars, weekends onl... | 32 | 31 |
| life B, the 15th and the last day, two banks and an e-wallet (Lia, pesos, the Philippin... | 31 | 32 |
| the real-page walk, walk 4 run A: setup 24 Nov to 15 Feb, hand-worked figures at every ... | 103 | 103 |
| the walk again in Tokyo at 04:40 (every figure the same after a reload at each check-in) | 103 | 104 |
| the walk again in Tokyo at 23:30 (every figure the same after a reload at each check-in) | 32 (failed under load at 32 s; 101 s when run alone) | 103 |
| guard (idle CPU, long tasks, outside requests, errors) | 20 | 20 |
| offline load | 2 | 2 |
| the private publish (a made-up path, a copy of public/ served by the worker's rules) | 3 | 8 |
| two tabs on one device | 9 | 11 |
| Settings and the backup file | 10 | 13 |
| Ask on the page (recorded replies: the viewer's Claude and the relay) | 10 | 11 |
| Reminders on the page (check-ins and bills, the calendar file, Google and Outlook, noth... | 5 (failed under load: LifecycleWatcher disposed) | 8 |
| the cloud copy, two devices through the page (local fake vault) | 7 | 9 |
| the service worker (precache, offline, 3 s timeout, a new build) | 8 | 9 |
| walk/ holds only its README and the kept walks v1 to v4 (the gate is tests/e3_walk.js) | 0 |  |
| FEATURES.json (a feature marked passing must have its test green in this run) | 0 |  |
