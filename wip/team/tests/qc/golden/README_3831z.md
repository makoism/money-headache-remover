# Golden baseline 3831z (2026-11-21)

Recorded on wip-38.31 at 0371661 plus this commit, with `node tests/qc/golden_screens.js record tests/qc/golden/3831z.json`.
Two records in a row gave the same file byte for byte.

## Why 13 of 14 plans were MISSING

Not a wording change and not a date. The plans themselves changed. golden_screens.js draws its plans with `randomState()` from
`tests/regression/v25/oracle.js`. 38b5d81 (SF5 Keep saving counts from its month) added one more `rnd()` call there
(`g.stretchFrom`). Every draw after it shifted, so from plan #1 on the golden script built other plans with other currencies and
dates. Their keys (`#1 ¥ 2027-07-22` and so on) no longer matched 3831y, so compare printed MISSING. Plan #0 drew no
emergency stretch, so it kept its key and showed only the real screen changes.

Fix (test only): `stretchFrom` now comes from its own stream (`rngOf(seed * 7 + 13)`), so `rnd()` is drawn exactly as before
and the golden plans are the same plans as in 3831y again. The oracle still makes stretchFrom plans (128 of 500 checked) and
still reports mismatches 0 on N=1500; fuzz_model and proof_fuzz pass.

Also: golden_screens.js now defaults PAGE and MODEL to its own checkout (it used `/home/claude/work`, which points at the main
checkout, so a worktree compared someone else's build). stage_build.sh picks the newest `*.json` only, so this README is never
taken for the baseline.

## Every difference from 3831y, and the commit behind it

3831y was recorded at a209449, so commits from a209449 on are counted, not only 75969af on. 98 screens differed. No number on
any screen changed. Numbers only came in where a commit adds a figure (checked: each "over the goal" amount is saved minus goal;
each new "Spent past the plan" row makes start + left in the month - spent past plan = end; the new "planned from X" is the
"Balance at the start" of the Where you stand panel; the named bill lines add up to the old "Bills and basics are X over").

| Screen | Was | Now | Commit |
|---|---|---|---|
| Home | In your bank now now | In your bank now | 9a0d2fc |
| Home | Bank at month end is planned from your balance at the start of Mar, so it can differ from your bank now. | Bank at month end is planned from -X, the balance your plan starts Mar with. | eb81d42 |
| Home | planned: yours to spend over the whole of Mar | planned: left to spend in Mar | b7c4719, 9a0d2fc |
| Home | X, 100% full | X, Y over the goal | 93180ec |
| Home | Bills and basics are X over. | each bill line named with its own amount over (they add up to X) | c5b2682 |
| Home | ...answer the question on Home. | ...answer the month-end question, which comes after the Emergency fund question on Home. | f9809a8 |
| Home | Your bank balance doesn't include it yet. ... goal, you can undo either one. | The plan counted it as spent. ... goal. You can undo either one. | 1410230, 167b195 |
| Home | Emergency fund is full. | Emergency fund is full at the end of Feb, as planned. | 24f4ea7 |
| Home | ...is not placed yet and your bills are covered, so give it... | Your bills fit in your pay and X of it is not placed yet, so give that... | 7f23ef0 |
| Home | (status card hidden, plans #5 and #13) | Later on: Oct 2028 ends below zero / Apr 2028 is short. Open Plan to see why. (with the card's You are okay line and How is this worked out?) | 75969af, e981992 |
| Home, Why | Where you stand rows did not add up | Spent past the plan in Mar -X row, and "Spending past the plan came out of the bank." | f4f2355 |
| Why | (no note) | Your minimum balance is the least you want in the bank: ... Change it in Settings. | bbebdb6 |
| Receipts, Goals, Plan | Free to spend: X left, Mar | Free to spend: X safe to spend, Mar | 128bfa7 (with 4e4945b, 7f23ef0) |
| Receipts | Lines with no receipts aren't listed | ..., except Free to spend. | 077a508 |
| Receipts | Like a gym fee or a weekly top-up - it gets logged for you on its day | Like a gym fee or a weekly top-up: it gets logged for you on its day. | 0c99aba, 1ce2bec |
| Goals | Goals get X this month(, N% of pay). | Goals get X in Mar(, N% of pay). | 134cdf2 |
| Goals | X of Y | X of Y by the end of Mar (and ", Z over the goal" when over) | daa3e7d, 93180ec |
| Goals | Cards and loans ... Bills and basics | same with a full stop | 1ce2bec |
| Goals | Nothing here yet - add a card or loan ... interest it costs | Nothing here yet: add a card or loan ... interest it costs. | 0c99aba, 1ce2bec |
| Plan month and All months | Free to spend: X left | Free to spend: X safe to spend | 128bfa7 |
| Plan | Planned X this month, about Y a week. / across the whole month. | Planned X in Mar ... / across the whole of Mar. | 134cdf2 |
| Plan | Bank ends at X: Y planned, less Z spent over plan so far. | Bank at month end: X. Y planned, less Z spent over plan since your plan started. | afd2464, 34fc2d1 |
| Plan | Bank goes from X to Y this month. | Bank at month end: Y planned, from X at the start of Nov. | afd2464 |
| Plan | All pay is placed. | All pay is used: X that had no place went to spending past plan. | e36afd1 |
| Plan | Your plan spends X more than your pay. Lower a bill or another place. | ... Your balance covers it. | ba67d44 |
| Plan | X of pay not placed yet. Raise a goal or another place to use it, or leave it where it is. | ... To use it, raise a goal or another place. Or leave it in the bank. | 29b2c67 |
| Plan | 0% | under 1% | c6a8159, 4e60386 |
| Settings | Fun for you and your family, spend it ... / You never spend this, it grows over time. | two sentences each | 167b195 |
| Settings | ...Your burrows are in here. | ...Your goals are in here. | c6a9448 |
| Settings | Free to spend cap hint, minimum balance hint | full stops | 1ce2bec, 0368090 |
| Settings | ...when you ask for that - Ask sends... | ...when you ask for that: Ask sends... | 0c99aba |
| Settings (plans #4, #9, #11) | (no Set all to zero) | Set all to zero button and "To start from zero use Set all to zero." (blank-preset plans with amounts typed are not at zero) | 9333e75 |
