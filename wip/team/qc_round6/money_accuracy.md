# QC round 6, Money accuracy: FAIL

Saved by MAIN 12 from the agent's reply (it could not read RESUME, so some items are on the For Mako list already). Rechecked by hand and correct: pay splits, Money out and Left, bank at month end, All months rows (dollar, yen, sample), receipt totals and over amounts, goal finish months, weekly Free to spend, debt payoff month and still owed, bills above pay, saved above goal (stops adding).
**MAIN 12 note:** blocker 1 has one right answer (a starting balance below zero gets the below-zero warning and Free to spend is not "safe" whether or not cfg.bankAt is set); same family as money accuracy round 5 C3 and the regression round 5 C2. Blocker 2 is "two percent rules", closed by DECISIONS 6 (keep).

## Blockers
1. Overdrawn start balance with no saved date: Home "Free to spend ¥30,000 safe to spend", no below-zero warning (pack 390-yen-overdrawn-1-home: "planned from −¥15,000"). Steps 390x844: Set all to zero, pay 280,000, rent 140,000, Settings balance −15000, remove cfg.bankAt (older saved data has none), reload. With the date kept the same −15,000 gives "left, not safe to spend yet". Opposite answers for one fact.
2. Percents: Plan > Month splits pushed to add up to 100 (Investing ¥10,000 of ¥280,000 shows 4% in one plan, 3% in another; Goal burrows $350 11%, Giving $25 1%, Not placed ¥80,000 28%); goal bars floored. (DECISIONS 6: keep.)

## Confusing
3. Bank today −15,000, pay 280,000, rent 140,000: Home says "your bills are covered", "your bank is less than your bills still to pay", and "The next 3 months look fine." Suggest: "Your pay covers the plan, but your bank today is below zero (−¥15,000). Wait for pay before spending Free to spend."
4. Two bank figures on Home: "Bank at month end ¥110,000 ... planned from ¥0 ... Your bank now is −¥15,000, so the two can differ." (For Mako: Check your bank vs the plan's start figure.)
5. Home "Total" leaves debt out ("Total ¥290,000 ... bank and burrows" with "You owe ¥110,000" apart). Suggest "Total before debt" and "After debt: ¥180,000".
6. Settings "Your numbers were set to zero ... Put them back" while a full plan is in use; does not say it replaces the plan on screen. Suggest "Put back the numbers from before 21 Nov (this replaces your plan now)".

## Polish
7. Saved above the goal not said ("Trip ¥150,000 of ¥100,000"); All months marks "Trip full" in Nov though full before.
8. Debt card: "¥120,000 owed" (start of Nov) next to a bar 8% filled (after the Nov payment).
9. Visual first: debt has no picture on Home; Over plan card is text; Forecast "No burrows to chart yet" with a debt.
10. display_math.max and .allow not checked by this role.
