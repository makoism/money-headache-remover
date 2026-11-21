# QC round 6, Regression runner: FAIL (one stale test)

Saved by MAIN 12 from the agent's reply. scenario_yen SCENARIO ALL PASS; fuzz_model 4000 FUZZ PASS (11,097,237 checks); home_dom 120 seed 5 0 mismatches; fresh loads at 320, 390, 1280 (empty and filled yen plan, reload) 0 errors.
**MAIN 12 note:** blocker 1 is a test change with one right answer: teach home_dom.js the later-month "Coming up" rule (75969af, QC round 4 north-star 3), then run several seeds. The confusing item ("Coming up" for a month 17 months away) is wording with a clear fix: name how far, or say "Later on".

## Blockers
1. `PAGE=/tmp/qc_build/build.html node tests/qc/home_dom.js 120 61` fails every time: "#93 none 2027-01-27 status ahead: screen lacks "The next 3 months look fine."" while the screen says "Coming up: Jun 2028 ends below zero. Open Plan to see why." The app follows the newer rule (names the first later month below zero or the minimum when the next 3 are fine); the test does not know it.

## Confusing
1. "Coming up: Jun 2028 ends below zero." under "You are okay", 17 months away (today 2027-01-27). Suggest "Later on: Jun 2028 ends below zero. Open Plan to see why." or "In 17 months, Jun 2028 ends below zero."

## Polish
1. Plan's inner tabs (#tab-goals, #tab-basics) are hidden until Plan is open; scripts clicking every #tab-* get "hidden" (not a user issue).
