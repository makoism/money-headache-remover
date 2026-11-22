# QC round 11, Regression: PASS

Saved by MAIN 14 from the agent's reply (second run; the first was stopped). Build 675841b. fuzz_model 4000: checks 11097237 fails 0; scenario_yen SCENARIO ALL PASS; home_dom 120 3811: 4481 checks, mismatches 0. Fresh loads at 390x844, 1300x900, 320x640 (empty storage and a 14-line plan, with reload): no errors, plan kept. Not run by the agent (brief): artcheck (the art director got ART CHECK PASS) and check.sh full (passed, qc_round10/full_check.md).

## Blockers
None.

## Confusing
1. Home yen overdrawn 390: "What does your bank app show today?" empty box, and below "Bank at month end is planned from -¥15,000, the balance your plan starts Nov with." Suggested: "Your plan starts Nov at -¥15,000 (from Plan). Type your bank balance above to check it." (MAKO_RUN 1.1 area.)
2. Home: four number cards, then "Bank ¥65,000 + burrows ¥30,000 = ¥95,000 at the end of Nov." repeats the bar; cut it or make it the bar's caption.

## Polish
1. The screen pack's full-page capture 390-yen-overdrawn-1-home.png shows the "?" shelf a sixth of the way down: a capture problem in screen_pack.js, not the app. Fix in staging so reviewers do not report it.
2. Goals and Basics tabs show only inside Plan (expected).
