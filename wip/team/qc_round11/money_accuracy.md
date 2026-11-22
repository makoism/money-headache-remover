# QC round 11, Money accuracy: FAIL

Saved by MAIN 14 from the agent's reply. Build 675841b, 390x844, made-up numbers (pay 3,250.50, balance 1,840.25, rent 1,150, food 420.75, emergency fund 900 saved).

## Blockers
1. (fixed e39abb2) Setup done "Right now $389.75 of it is safe to spend" under "Not safe to spend yet"; Home "$389.75 left, not safe to spend yet". Also with huge inputs.

## Confusing
2. Home status line "Bills went past the plan. Utilities is $80 over. Food and groceries is $100 over. Free to spend is $110.25 over. Education is $45 over." Free to spend and Education are not bills. Suggested: "Spending went past the plan by $335.25: Utilities $80, Food and groceries $100, Free to spend $110.25, Education $45. It came out of your bank."
3. Two rounding rules for percents: burrow fill floored (150 of 1,200 "12% full"); pay shares rounded to add to 100 (Education 1.54% shows "2%"; "Goals get $350 in Nov, 11% of pay" is 10.77%; ¥10,000 of ¥280,000 shows "4%"). One rule, or write the second down.
4. Loan interest rounded to whole dollars every month: 1,200 at 12%, 100 a month; true interest $84.78, app "About $86"; All months Nov 2027 "$299" not placed; bank from Nov 2027 on $1.22 too low ($1,747.25 vs $1,748.47).
5. Long numbers cut with no message: 987654321987 pay keeps 987654321; balance 123456789123.45 becomes $123,456,789. Say "The most this box takes is 999,999,999".

## Polish
6. Receipts table mixes "$100.00 over" with "$80 over"; "$500.00 spent" with "$400".
7. "12% of pay" goes from the Burrows tab after adding a loan ("Goals get $385 in Nov.").
8. Visual first: All months bank as a small line; Forecast chart could draw the shrinking loan.

## Owner questions noted (MAKO_RUN 1.11, 1.6, 1.1, 1.9)
Checked correct by hand: every screen pack figure, overspend carry into Dec, leap day, bills above pay, goal months.
