# qc-numbers, v1 QC run 2026-11-19 (on 11c1e7e): PASS, no blockers, 7 should-fix

Gates: oracle 3000 plans, 0 mismatches. proof_fuzz 1500 plans, 0 failures. display maths 0 open. home_dom 40 plans, 0 mismatches. Six situations agree on every screen (spending past plan, borrow, Education and Giving past their pile, past months, dollars with cents, no pay with bills logged).

1. SF1: with the clock in Jan 2027, after answering December's month-end question, Home says "¥15,000 of Free to spend is left out until you answer the question on Home" but November's question does not show until a reload.
2. SF2: the Home status line follows the month picked on Plan. After picking January on Plan, Home reads "All of the sample pay has a place in Jan · On plan" above November figures ("Free to spend −¥5,000 over"). It stays after two reloads.
3. SF3: Home shows "Free to spend −¥5,000 planned: over in Nov" under "This month planned". The −¥5,000 is real overspend, not a plan.
4. SF4: paste "1,234,567" (gets the "Tap again to log it anyway" warning), then paste "1.23456": the field goes back to 1234567 with no message and the next tap logs ¥1,234,567, the earlier warning counting as the confirmation.
5. SF5: "Keep saving" on the longer emergency goal changes months already over: Nov, Dec and Jan all show ¥0 / ¥85,500 and the fund gets 3 x ¥8,900, two of them in months that had ended. The total stays the same.
6. SF6: a borrow stays after the plan stops needing it (Free to spend lowered, bank would end at ¥65,500 without it, still takes ¥31,500 from the Emergency fund). The same piece is named "Borrowed ... stays in the bank ¥11,500" on the bar and "Left ¥11,500" in its tooltip.
7. SF7: the month-end goal choice preselects the goal with the least room (Yearly cost, ¥200). The button says "Put it toward the goal" with no amount, so nothing says beforehand that ¥16,800 will stay in the bank.

The agent could not write its own report file; this is its list as it came back.
