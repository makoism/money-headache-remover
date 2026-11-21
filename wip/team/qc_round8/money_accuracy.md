# QC round 8, Money accuracy: FAIL

Saved by MAIN 12 from the agent's reply. Recomputed by hand and correct: dollar, yen-overdrawn and first-open packs; pay split; Left, Not placed, bank at month end; all 24 months; full months; debt (¥300,000 at 15%, debt free Dec 2029); saved above target; pay 0, 1 and 999,999,999; spending past plan stays out of the bank.

## Blockers
1. Check your bank to a figure below zero gets no below-zero warning. 390x844: setup pay ¥250,000; Settings Money today ¥300,000; Home Check your bank -500000, Save: toast "Bank updated: −¥500,000 today." but Home still "Bank at month end ¥350,000", "The next 3 months look fine.", only "Your bank is less than your bills still to pay and Free to spend"; "below zero" never appears; Settings Money today still 300000. (One right answer: a bank today below zero gets the plain below-zero warning on Home and the "next 3 months look fine" line goes. Which figure the plan starts from stays Mako's question.)
2. Sample numbers mixed with real ones after a skipped tour: Finish later, Home bank box 50000, Save ("It shows here once you use your own numbers"), Enter pay 100000: Home "planned from ¥85,500" (the sample start), "−¥14,500 (short)", Plan "¥31,500 under your ¥17,000 minimum balance"; Settings boxes hold sample values (Money today 85500, minimum 17000, cap 28500); the typed ¥50,000 is not used. (One right answer: when the person's own numbers start, sample start, minimum and cap do not carry over; a bank typed during sample mode is used.)

## Confusing
3. "planned from ¥412,000 ... Your bank now is ¥412,000 ... so the two can differ" when equal (MAKO_RUN: bank now vs start).
4. Two percent rules (DECISIONS 6: keep).
5. Status words: Home "Not safe to spend yet" vs All months Nov "Not placed yet" while the start is below zero; suggest "Bank below zero".

## Polish
6. Pay ¥999,999,999: six rows "under 1%" then "Not placed yet ... 100%"; show "over 99%".
7. A goal due 15 Dec puts all ¥60,000 into Nov (MAKO_RUN design).
8. Goal monthly amounts change with pay with no word why.
9. Settings "Your numbers were set to zero ... Put them back" in the dollar and yen packs (fixed by the round 8 words helper).
Visual first: All months as a line chart (MAKO_RUN).
