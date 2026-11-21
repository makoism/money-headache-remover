# QC round 8, Regression runner: PASS with one condition

Saved by MAIN 12 from the agent's reply. scenario_yen SCENARIO ALL PASS; fuzz_model 4000 FUZZ PASS (11,097,237 checks); home_dom 120 seed 8121 0 mismatches (4,559 checks); fresh loads at 390, 320, 1300 empty and filled: 0 page errors, no error log, a reload keeps receipts and pay; pack text has no NaN, undefined, error or "do not add up".

## Condition (blocker until closed)
1. One `./check.sh full` on the exact build, ending "GUARD ALL PASS" and "ALL GOOD", with the output pasted. (MAIN 12 runs it on a quiet machine after the round 8 fixes are merged, and pastes the end into this file.)

## Confusing
1. Home idle CPU sits on its limit (1.38%, 1.17%, 1.54% against 1.5%): take a quiet guard run before shipping; over again when quiet means a real cost on Home.
2. Plan > Month: a card "Trip / 8 months to go / Free to spend: ¥25,000 safe to spend, Nov" reads as if the Trip has money to spend; put the Free to spend line on its own line or card. (Layout: For Mako.)

## Polish
1. Header at 320: "Saved in this / browser" wraps. (MAKO_RUN.)

## Full check after the round 8 merges (MAIN 13, 2026-11-22 04:41 to 06:16 JST)
One quiet `./check.sh full` on 2857cfd (all four helper branches merged, nothing else running). It ended "SOMETHING FAILED" with two failures, both tests left behind by intended changes, not the app:
- `tests/qc/qc12_bank_hint.js`: a source pattern for the setup bank box expected the old value expression (changed on purpose in 0d762a2). The placeholder "Rough is fine" is unchanged. Test fixed in b957d3b; rerun: "qc12_bank_hint: ALL PASS".
- `/tmp/team_inter2.js`: "play receipts are measured against spending money" expected "₱3,800 planned"; the line also holds ₱1,450.50, so every amount in it now has cents (number gate round 8 finding 4, merged in 2857cfd). Test fixed in a9333f7; rerun: 0 FAIL.
Everything else passed, including the guard on a quiet machine (Home idle CPU 1.12%, under 1.5%, so no separate guard run is needed). The app files did not change after this run; only those two tests did.

Last lines of the run:
```
== guard (idle CPU, tab speed, no outside requests, no errors)
PASS idle CPU on home: 1.12% (limit 1.5%)
PASS idle CPU on receipts: 1.16% (limit 1.5%)
PASS idle CPU on goals: 1.06% (limit 1.5%)
PASS idle CPU on month: 1.13% (limit 1.5%)
PASS idle CPU on basics: 1.15% (limit 1.5%)
PASS tab switch to next paint, median 21.2 ms (limit 60)
PASS long tasks: [109,51] (limit 200 ms each)
PASS outside requests: none
PASS page errors: none
GUARD ALL PASS
SCRIPT FAILED (/tmp/team_inter2.js, exit 1)
QC FAILED: tests/qc/qc12_bank_hint.js
...
NUMDONE
SOMETHING FAILED, see above
```
