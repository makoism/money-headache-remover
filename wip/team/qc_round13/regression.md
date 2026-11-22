FAIL

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zf.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

Build judged: /tmp/qc_build/build.html (1966207 bytes, byte-identical to wip/money-map-team.html, footer "Version 38.31").

BLOCKERS

1. No clean `./check.sh full` exists for this build. wip/team/qc_round13/full_check.md is a summary, not the pasted output, and says: "Run on f7ce6e6. Result: SOMETHING FAILED." The fixes it lists land on later commits (978119f, 27f9990, e0b943f), and the full suite was not run again on them. It also records "guard: idle CPU on goals 1.56% against a 1.5% limit. Timing." My section requires check.sh to end "GUARD ALL PASS" and "ALL GOOD". The only "ALL GOOD" cited is the fast check, which my section says "misses number checks". The caller must run `./check.sh full` once on the commit that built this file and paste the raw tail.

2. Number audit has a mismatch. `PAGE=/tmp/qc_build/build.html node tests/qc/home_dom.js 120 1322`, run twice, both times:
"plans on screen 120 | screen checks 4599 | mismatches 1
#85 ₱ 2027-08-28 chest week: screen lacks "₱5,022 a week to stay inside it for the 4 days left""
The screen says "Spent ₱0 of ₱3,000. ₱5,022 a week to stay inside the safe part for the 4 day[s left]". The build has a branch for this (`held > 0 ? 'the safe part' : 'it'`), so the wording change looks deliberate and the test is behind. Either way the audit is red, and per my section someone must decide whether to fix the app or update the test, then rerun.

3. ./artcheck.sh was not run. It calls ./build.sh, which my brief forbids. The caller must run it and paste the "ART CHECK PASS" line. full_check.md does not mention it.

CONFUSING

4. Home, Free to spend card, plan #85 above (peso, 28 Aug, 4 days left): "₱5,022 a week to stay inside the safe part for the 4 days left" shows next to "Spent ₱0 of ₱3,000". A weekly figure larger than the whole ₱3,000 is jarring, and "the safe part" is not named on the card. Replace with: "₱2,870 is safe to spend in the 4 days left, about ₱717 a day." (use the real safe figure; when fewer than 7 days are left, give a per-day amount, not a per-week one).

5. Home, 390 yen-overdrawn screen pack: "Not safe to spend yet" is a 7-line paragraph ("Your bank starts the month below zero. Leave the ¥80,000 not placed yet in the bank until it is back above zero. ¥30,000 is left in Free to spend, not safe to spend yet: ... Wait for pay before spending it."). Visual-first: this job belongs to a picture, a bank pile drawn below a zero line with the pay coins filling it back up. Shorten the text to: "Your bank is below zero (−¥15,000). Wait for pay before spending."

POLISH

6. Full-page screenshot 390-yen-overdrawn-1-home.png shows a dark band with the "?" button over the "This month" picture, hiding "left to pay". Likely the fixed help bar caught by the full-page capture; layout reviewer to confirm.

What passed (run by me on this build, one at a time)
- `PAGE=/tmp/qc_build/build.html node tests/qc/scenario_yen.js`: "SCENARIO ALL PASS", including "healthy month: Home says "You are okay"" and "no page errors and an empty error log" for both months.
- `node tests/qc/fuzz_model.js 4000`: "checks 11097237 fails 0 / FUZZ PASS".
- Fresh load with empty storage at 390x844, 320x640 and 1300x900: welcome then "Finish later" to sample numbers, then reload. Page errors: none at each size. The plan survived the reload. A filled plan with no page errors is covered by scenario_yen.
Screenshots: /tmp/qc/regression/fresh-<width>-{0,1,2-reload}.png. Script: /tmp/qc/regression/fresh.js.
