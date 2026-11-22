# QC round 10, Regression runner: PASS (no blockers)

Saved by MAIN 13 from the agent's reply. Build 39c9c88 at /tmp/qc_build/build.html. VERIFY OK, golden 0 differ vs 3831zc. scenario_yen SCENARIO ALL PASS; fuzz_model 4000 FUZZ PASS (11,097,237 checks); home_dom 120 seed 2211 0 mismatches (4,525 checks); fresh loads at 390, 320, 1280, empty and filled, then reload: 0 page errors, 0 console errors, plan survives.
Owed by the main session: artcheck (ART CHECK PASS on this build's art, unchanged since round 9) and a clean full check (see qc_round9/full_check.md: act_keep once late in the run, passed alone 3 times; safe.js passed on its retry).

## Confusing
1. Setup with bank −5,000, pay 300,000, bills 130,000: setup says Free to spend ¥38,800 a month, Home says ¥3,800, not safe to spend yet. The ¥35,000 gap is a ¥30,000 minimum balance setup never asked about (MAKO_RUN 1.6); Home names it only inside "How is this worked out?". Suggested: "Your bank starts Nov ¥5,000 below zero, and you keep at least ¥30,000 in it (change this in Settings). To get there, spend only ¥3,800 of Free to spend this month."
2. Setup done says "On plan" and "yours to spend on whatever you want", then Home says Below zero. Suggested: "Your emergency fund is on plan. Your bank starts below zero, so wait for pay before you spend Free to spend."
3. Plan, line 1: "All of your pay has a place in Nov · Short". Suggested: "Nov is short: your bank ends under your minimum."

## Polish
- Setup done: the small step label still reads "Free to spend"; should read "Done" (also pack 412-panel-36).
- First name accepts "250000" and Home greets "250000".
- −5,000 plan: the red box and the Below zero card say the same thing twice.
- Visual first: the month-end bar has no part for "Bank at month end −¥5,000 (short)"; draw a red stub.
- Screen pack 390-first-open-1-home.png is cut under the This month chests (capture fault, not the app).
Files: /tmp/qc/regression/.
