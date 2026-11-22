# QC round 10, final gate 2 (numbers): FAIL (2 blockers)

Saved by MAIN 13 from the agent's reply. Hard gates: oracle N=3000 15,040,847 comparisons, mismatches 0; proof 1500 plans, 24,000 months, failures 0; display_math 0 open; home_dom 40 13, 1,484 checks, mismatches 0. Six situations recomputed by hand: all agree (overspend in three places, borrowing, piles past plan, month-end answers, cents, no pay). No NaN, undefined, Infinity or -0.

## Blockers
1. Home and Plan show two different amounts as the planned Free to spend (balance 10,000, pay 300,000, rent 100,000, food 40,000, minimum 30,000): Home "Free to spend ¥16,200 ... planned" and "Free to spend is lowered to match", but "Bank at month end ¥10,000" only works with ¥36,200; Plan says "Planned ¥36,200 in Nov", "Pick a fix: Spend ¥16,200 instead". Same in $ ($25 vs $325), Plan Dec headline ¥27,400 vs Planned ¥36,200, and Home "Free to spend is lowered to match." while Free to spend is ¥13,800 over (nothing was lowered). One planned figure everywhere. (The Home tile and chest part is fixed in ddd1e43, after this build was staged.)
2. All months says "¥20,000 past pay" for Jan 2027 where the month says "Your plan spends ¥53,800 more than your pay. ¥33,800 of that comes from your emergency fund and your balance covers the other ¥20,000." ¥20,000 is past pay and borrowing.

## Should-fix
1. Letters inside an amount are dropped: "1o0" logs $10, "1e3" $13, "12.3.4" $12.34, "1a2" $12, "12a" $12. Refuse and ask again.
2. Half cents round down: 1.005 -> 1, 1.015 -> 1.01, 2.675 -> 2.67 (floating point).
3. Whole amounts with and without .00 on one screen (Plan Details, Receipts list, Home).
4. After yes to the longer emergency goal, a Burrows card pairs the old target (¥420,000) with the new full date (Dec 2027).
5. Home never says where the rest went when a month-end answer puts more into a goal than it has room for (Plan and Receipts do).
6. Status differs for the same month: Plan Jan "Tight month", All months "On plan".
7. Receipts at 390: the undo bar covers Log spend; a tap there logs nothing.
8. The undo bar goes stale after an edit: "Logged. ¥50,000" after editing to ¥5,000, and Undo removes the ¥5,000 receipt.
9. With no pay, "safe to spend" rests on the sample balance (MAKO_RUN 1.12).
Files: /tmp/qc/numbers/.
