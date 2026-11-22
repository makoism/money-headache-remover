# QC round 12, Money accuracy: FAIL

Saved by MAIN 14 from the agent's reply. Build 098d0ee. The screen pack (dollar, yen overdrawn, sample, desktop, month-end panels 48 and 49) adds up. Own runs at 390x844 dpr 2: pay ¥3,000, bills ¥1,400, minimum ¥300, Free to spend ¥365.

## Blockers
1. Safe to spend went up as the bank went down. Bank ¥100: "Free to spend is planned, not safe to spend yet" above "¥365 planned, ¥165 safe to spend" (Plan chip ¥165 safe). Bank ¥500: "¥365 left, not safe to spend yet" (0 safe). The minimum-balance hold and the "bank less than bills plus Free to spend" rule disagreed. Right answer: 0 safe at ¥100 too. (MAIN 14: reproduced in qc32_safe_low with the rest of pay in Investing; fix in model.js month row, see the commit.)
2. A bank typed later (Check your bank, 5 Dec, ¥1,000) never feeds the plan: Home "In your bank now ¥1,000" and "Bank at month end ¥500 ... planned from ¥500"; All months runs from ¥500. Owner question MAKO_RUN 1.1, not changed.

## Confusing
3. Percents round on the pay split, floor on goals (MAKO_RUN 1.25).
4. "Total" leaves out debt: "You owe ¥920 at the end of Nov" above "Total ¥1,935 ... bank and burrows". Suggested "After what you owe: ¥1,015" (MAKO_RUN 1.9).
5. Goals keep "Filling, Full Sep 2027" while every month is Short (-¥30,885). Suggested "Full Sep 2027 only if the plan is fixed: your bank goes below zero."
6. Unlogged Free to spend from Nov counted as spent on 5 Dec with no question when there are no receipts (panel 48 asks when there are some).

## Polish
7. Setup Split the rest: Education ¥360 and Investing ¥330 at the same usual share (10% each); expected about ¥355 each.
8. Check your bank: 5000000000 keeps 9 digits and saves ¥500,000,000 (check whether the too-big message shows in this box).
9. Card form: after typing 24, switching "a year"/"a month" changed the rate; one run saved "100% a year" (field showed 288) with no message.
10. Visual first: four number cards and the sum sentence repeat the bar; "$62.75 over" could be a red overflow on the Bills chest.

## Matched
Debt payoff dates and interest, months to full, goal over target, running bank in All months.
