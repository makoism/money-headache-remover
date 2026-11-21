# QC round 8, Regression runner: PASS with one condition

Saved by MAIN 12 from the agent's reply. scenario_yen SCENARIO ALL PASS; fuzz_model 4000 FUZZ PASS (11,097,237 checks); home_dom 120 seed 8121 0 mismatches (4,559 checks); fresh loads at 390, 320, 1300 empty and filled: 0 page errors, no error log, a reload keeps receipts and pay; pack text has no NaN, undefined, error or "do not add up".

## Condition (blocker until closed)
1. One `./check.sh full` on the exact build, ending "GUARD ALL PASS" and "ALL GOOD", with the output pasted. (MAIN 12 runs it on a quiet machine after the round 8 fixes are merged, and pastes the end into this file.)

## Confusing
1. Home idle CPU sits on its limit (1.38%, 1.17%, 1.54% against 1.5%): take a quiet guard run before shipping; over again when quiet means a real cost on Home.
2. Plan > Month: a card "Trip / 8 months to go / Free to spend: ¥25,000 safe to spend, Nov" reads as if the Trip has money to spend; put the Free to spend line on its own line or card. (Layout: For Mako.)

## Polish
1. Header at 320: "Saved in this / browser" wraps. (MAKO_RUN.)
