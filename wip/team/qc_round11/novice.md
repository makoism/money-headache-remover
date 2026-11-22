# QC round 11, Novice: FAIL

Saved by MAIN 14 from the agent's reply. Build 675841b, 390x844 dpr 2, empty storage, made-up numbers (pay $3,200, bank $1,500, rent $1,100, food $400). Jobs 1 to 7 done; 8 (Help) stuck on the burrow screen and setup (MAKO_RUN 3.4, not failed on).

## Blockers
1. Setup done screen contradicts itself and Home: badge "Not safe to spend yet", text "Free to spend is $385 a month in the plan. Right now $385 of it is safe to spend. Home shows why and what to do." Home: "Free to spend $385 left, not safe to spend yet". Right answer: $0 safe today (bank $1,500, bills $1,500 plus $385). Suggested: "Right now none of it is safe to spend: your pay is not in yet. Home shows what to do." (pay-day question MAKO_RUN 1.2 stays open.)

## Confusing
- Home after Check your bank: "Total $2,815 planned for the end of Nov" under "In your bank now $4,700" (MAKO_RUN 1.1). Suggests "(from your plan, not your bank today)".
- "Your minimum balance $320" never asked for (MAKO_RUN 1.6). Suggests "(set for you, 10% of pay; change it in Settings)".
- Setup Split the rest: "12%" unclear, of pay or of the 53%. Suggests "12% of pay".
- Setup Emergency fund: long homework sentence about lowering the balance. Suggests "Is this inside the balance you typed? Yes / No".
- Plan: only "Undo all" after a wrong amount; reads as wiping other edits. Suggests "Undo".
- Receipts opens on "Scan receipts ... Photos can't be read here" (MAKO_RUN 3.10).

## Polish
- "A trip" prefills "Trip"; typing adds to it: "TripLisbon trip" (j7-07.png).
- After one $500 spend three messages stack: "Logged. Free to spend is $127 over for this month.", the Logged bar with Undo, and "Logged $500: Free to spend" again.
- Currency step: "¥ Yen or yuan" preselected for a user who never picked it.

## Visual first
- Burrow screen fullness only as a thin bar and "8% full"; the picture could fill with coins.
- "Coming up: Dec is tight, Jan is tight, Feb is tight" text only; month tiles coloured by tightness.
- Free to spend chest looks the same at $373 safe and $127 over.

Screenshots were in /tmp/qc/novice/.
