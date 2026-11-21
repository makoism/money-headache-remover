# QC round 5, Regression runner: FAIL

Saved by MAIN 12 from the agent's reply. scenario_yen ALL PASS; fuzz_model 4000 FUZZ PASS (11,097,237 checks); home_dom 120 plans 0 mismatches (two "detached Frame" crashes under load, passed on rerun); fresh loads at 320, 390, 1280 no errors.

## Blockers
1. verify.sh prints "golden screens: 14 plans, 20 screens differ", "FAIL the screens changed", MISSING plan #1 to #13, then ends VERIFY OK. Someone must confirm the 20 differences were meant and refresh the golden file.
2. check.sh full and artcheck.sh output not staged for this build. (check.sh full ALL GOOD on 83a514b, the staged build plus test-only changes before c2fab77; the art director ran artcheck: ART CHECK PASS.)
3. Two "spent past plan" figures for the same month (yen March 2027): Plan "¥178,482 spent over plan so far" vs why text "Spent past the plan so far −¥97,425". Same as money accuracy C1.

## Confusing
1. Basics text "Your burrows are in here." became "Your goals are in here."; glossary says burrows.
2. A bank below zero at the start is easy to miss (yen overdrawn: "You are okay", #hStatus hidden; only "planned from −¥15,000"). Same as money accuracy C3.
3. "Free to spend, Education, Investing, Giving −¥70,000" one line, "Goal burrows" its own line.

## Polish
1. voice lint counts do not add up ("177 flagged: 0 strong, 179 weak").
2. verify.txt oracle line cut off mid-sentence.
3. home_dom.js line 38 fixed 1300 ms wait crashes with "detached Frame" under load.
4. Screen pack paints the fixed Help bar over the middle of full-page shots (capture, not app).
