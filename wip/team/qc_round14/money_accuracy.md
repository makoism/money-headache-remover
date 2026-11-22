(QC round 14 money accuracy, on the build staged from c45f8d0. Copied from the reviewer's reply.)

FAIL

The report is also saved at /tmp/qc/money-accuracy/REPORT.md.

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

Rechecked by hand and correct: dollar, yen-overdrawn and sample pay, Left, Not placed, bank at month end, Total, every All months row and goal full month; receipts totals and overspend carried into later months; pay 0; bank below zero; bank under minimum; saved above target (adds nothing); loan payoff month (Nov 2027).

BLOCKERS
1. Two percent rules. Plan > Month "pay, by place" rounds so the list adds to 100; Home burrow bars floor.
   - 390 yen-overdrawn, Plan > Month: "Investing ¥10,000 4%" (3.57%) and "Not placed yet ¥80,000 28%" (28.57%). The same fraction goes up on one line and down on the next.
   - 390 dollar plan: "Goal burrows $350 11%" and Burrows "Goals get $350 in Nov, 11% of pay" (10.77%, floored 10%). "Used for spending past plan $62.75 2%" (1.93%). "Education $50 2%" (1.54%).
   - My dollar plan, pay $3,000: Plan shows "Emergency fund $200 7%" while Home shows "$200, 6% full" (6.67% both times).
   Pick one rule, floored, everywhere.
2. A loan payment can be counted twice with no warning. Setup: bill line "Loan or debt payment" $100 (its hint says "Car loan, personal loan, card installments"), plus the same loan under Cards and loans (min $100). Plan > Month, 390: "Monthly bills $1,800" and, as a separate line, "Cards and loans $100". Home shows "Bills and basics $1,900". The bank at month end is $100 too low every month. Cards and loans also says "Their monthly payments are part of Bills and basics", which pushes people toward entering the loan in both places. Fix: when a card or loan is added, offer to move or zero the matching bill line, or warn if both are set. Screenshot /tmp/qc/money/s8-debt-plan.png

CONFUSING
1. 412 panel 48 (3 Dec): "In your bank now ¥412,000 ... Bank at month end is planned from ¥477,000 ... Your bank now is ¥412,000, ¥393,600 after the cards are paid, so the two can differ." The gap (¥65,000, or ¥83,400 after the cards) is never named, and Home still says "¥30,000 safe to spend". It also happens with a bank below zero: 390, "Bank at month end $1,200" and "Total $1,500" stay as they are while the bank now is "−$200". Replace with: "Your bank now is ¥65,000 less than the plan expected (¥477,000). If pay has not come in yet, that is normal. If it has, tap Check your bank to update the plan."
2. Plan > Burrows, goal due 15 Dec 2026, made in Nov: "Trip $1,000 of $1,000 by the end of Nov / Full / Plan adds $1,000 in Nov". All of it lands in Nov and makes Nov a "Tight month", and the card does not say why. Add: "Due 15 Dec, so it is saved by the end of Nov."

POLISH
1. Plan > Burrows, loan of $1,200 at 12% a year, paying $100 a month: "About $86 interest in all." Charged to the cent, the total is $84.78. $86 comes from rounding each month's interest to whole dollars. Say "About $85" (keep cents inside the maths).
2. Visual first: on Home, debt is only the sentence "You owe $1,112 at the end of Nov planned". It has no picture beside the burrows (for example a hole that fills in as it is paid off). The four boxes "Total / Free to spend / Bills left / Saved" repeat numbers that the stacked bar right above them already shows.

How I tested: the dollar-plan scenarios, the loan and the due-date goal were built by loading my own saved plan into the browser before the page started. Because of that, the minimum balance had to be set by hand: without it the page showed a sample minimum of $3,000, which I did not count as a finding.

Screenshots: /tmp/qc/money/ (s1 to s8, *-home.png, *-plan.png, *-burrows.png).
