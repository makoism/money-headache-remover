
## MAIN 14 full check on 5f8631e (2026-11-22, about 15:40 to 17:20 JST)

Ran in two parts because the first run hit this session's one-hour job limit. Part 1 (./check.sh full) ran from the build through qc test 146 of 213 in the full list: no failure (test_team, oracle, proof, E6, v1, display_math, safe, guard, script checks, all 19 regression scripts, fuzz, debts fuzz, home_dom, home_map and the qc list up to setup_undo all passed). Part 2 ran the same commands for tests 147 to 213, the number checks and the app package.
- One failure: tests/qc/numbers_round4.js check 3. Test-side: the Home warning now says "Keep Free to spend to the ¥263,000 that is safe to spend" (7b0f75d, round 10 numbers fix) and the test still looked for "... shown". The figures agreed (263,000 both). The test now accepts the new words; ALL PASS alone.
- Number checks: viewtest, oracle, display (tests/regression/v25/display.js passed here, no old-wording failure), monkey, backup PASS 80 FAIL 0, contrast 0 low-contrast spots, dl PASS 6 FAIL 0, NUMDONE.
- Installable app: 10 PASS of 10.
- ./check.sh fast after the test fix: ALL GOOD.
