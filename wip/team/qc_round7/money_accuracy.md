# QC round 7, Money accuracy: FAIL

Saved by MAIN 12 from the agent's reply. Recomputed by hand and correct: every figure in the dollar, yen-overdrawn and sample packs; goal due next month and mid-month; saved above the goal; bills above pay; negative bank; the 1,000,000,000 limit; weekly and daily figures on 30 Nov, 1 Nov and 29 Feb 2028; month rollover.

## Blockers (one right answer each)
1. A burrow that holds money disappears from Home while its money still counts. 390x844: setup $2,000 pay, $3,000 balance, rent 900, food 300, emergency fund 3 months with $200 saved; Plan > Burrows > Edit goal, clear Goal amount, Done. Plan says "No goal amount yet / Unset ... Saved so far: $200"; Home's bar and Burrows grid show only Education $180, Investing $180, Giving $80 ($440) while Saved says $640 and "Bank $3,145 + burrows $640 = $3,785". Same with tiny amounts ("3 months of your bills is $0.06"). Fix: always show a burrow that holds money ("Emergency fund $200, no goal yet").
2. A debt is called "full": Plan > All months "Oct 2027 Loan from Sam full". Burrows says "Paid off Oct 2027". Fix: "Loan from Sam paid off".

## Confusing
1. Total leaves out what you owe (For Mako: round 6 money accuracy 5).
2. Home asks "What does your bank app show today?" with an empty box while Settings shows "Money today (bank plus cash) $1,840.25" (For Mako: bank now vs plan start).
3. After counting November's leftover in the bank, "In your bank now" stays $3,000 while "planned from $3,100" changed. Suggest "Your December plan now starts from $3,100."
4. Burrow screen after Add money $30: "$200 saved now" does not move; say "+$30 added today" (or what the plan already shows).

## Polish
1. Pack panel 48 "¥20,000 of Free to spend isn't logged as spent" vs ¥27,400 unspent in panels 38 and 45 (could not recompute; own run correct).
2. Bills above pay: "This counts your planned Free to spend as already spent." when Free to spend is $0: drop it then.
3. Visual first: the proof line repeats the bar (For Mako).
