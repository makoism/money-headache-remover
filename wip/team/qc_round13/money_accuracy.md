FAIL (QC round 13 money accuracy, on the build staged from 0423226. The reviewer replied with the report text and wrote no file, so it is copied here.)

verify: VERIFY OK, golden 3831zf, 0 screens differ.

BLOCKERS

1. Two equal amounts get different percents on the same card. Plan > Month, 390, pay ¥210,000, sample plan. In "¥210,000 pay, by place", Goal burrows ¥20,000 shows 10% and Free to spend ¥20,000 shows 10%, but Education ¥20,000 and Investing ¥20,000 show 9%. 20,000 / 210,000 = 9.52%. The split is spread so the rows add to 100, and ties are broken by row order. Screenshot /tmp/qc/money/minbank2-month.png. Seen on two runs.

2. The pay split does not use the floor rule. Goal bars and Home floor their percents ("Trip $150, 12% full" is 12.5%; "26% full" is 26.67%). The pay split rounds up:
   - Dollar plan: "Goal burrows $350 11%" and "Goals get $350 in Nov, 11% of pay" (10.77%). "Giving $25 1%" (0.77%). "Used for spending past plan $62.75 2%" (1.93%).
   - Yen overdrawn: "Free to spend ¥30,000 11%" (10.71%), "Investing ¥10,000 4%" (3.57%).
   - Goal above target: "Goals get ¥17,500 in Nov, 6% of pay" (5.83%).
   This breaks "one rule, same percent everywhere".

3. "Safe to spend" shows next to "Short" when the bank is under the minimum. Pay ¥210,000, bank ¥50,000, minimum ¥100,000. Plan > Month: "¥10,000 of your pay not placed yet in Nov · Short", then the chip "Free to spend: ¥20,000 safe to spend, Nov". The body says "Balance would end at ¥60,000, ¥40,000 under your ¥100,000 minimum balance" and offers "Borrow ¥40,000 from emergency fund". Home: "Free to spend ¥20,000 safe to spend". The held amount is ¥40,000, so safe to spend should be ¥0. Below zero already holds it back ("¥30,000 left, not safe to spend yet"). Seen twice.

CONFUSING

4. Home gives two verdicts at once (same run): "Your bank ends at ¥60,000 in Nov, under your minimum balance of ¥100,000. Open Plan to pick a fix." and the headline "Building your cushion". Suggested: "Short of your minimum: the bank ends Nov at ¥60,000, ¥40,000 under your ¥100,000 minimum. Hold off on Free to spend until it is back above."

5. Two left-over figures for one month. Dollar plan, Plan > Month Details: "Left $854.75" while the bar says "Not placed yet $792". Suggested line under Left: "$62.75 of it already went to spending past the plan, so $792 is not placed yet."

6. A goal's monthly amount changes with pay. Pay ¥0: "Home or move ... Plan adds ¥5,625", "Yearly cost ... ¥2,860". Pay ¥100,000 or ¥300,000: ¥5,700 and ¥2,900. One rounding rule, or say "rounded up to ¥100".

7. Pay ¥0 hides the whole picture. Bank ¥100,000, pay ¥0: Home drops In your bank now, This month planned and the month-end bar; only "No pay entered ... your bank would end at −¥99,885" is left. Keep the picture and put the warning under it.

8. Month-end question (panel 48, 412): "Nov: ¥20,000 of Free to spend isn't logged as spent", while earlier panels show "Free to spend left ¥27,400" (¥30,000 planned, ¥2,600 spent). Not rebuilt, not certain. Confirm it is planned minus logged.

POLISH

9. "Yearly cost full" in May 2027, then saving stops; Jun 2027 on shows "Not placed ¥2,900". A yearly cost comes back every year.

Checked correct: bank at month end, bank + burrows = total, not placed, all-months bank chain, goal full months and months to go, overspend carry-over, goal above target, goal due next month, bills above pay, ¥999,999,999 with no crash, Ask preview, card ¥18,400 off ¥412,000 = ¥393,600, Add money chips capped at ¥27,400. Debts not checked.
