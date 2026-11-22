# QC round 11, Numbers gate: PASS

Saved by MAIN 14 from the agent's reply. Build 675841b. Hard gates: oracle N=3000 comparisons 15040847 mismatches 0; proof_fuzz 1500 21 PROOF PASS; display_math 0 open; home_dom 40 13 mismatches 0. Six situations (390x844, dpr 2) all agree by hand: past plan in Free to spend, a bill and Other; borrowed from the emergency fund; Education and Giving past their piles; past months answered (Keep in bank, toward a goal, receipts logged after); dollars with cents; no pay with bills logged. Odd plans, dates and receipts: no wrong figure, no NaN, no page errors.

## Blockers
None.

## Should fix
1. Receipts 390x844: for about 8 s after a save, the "Logged ... Undo Close" bar covers Log spend; tapping Log spend for the next receipt does nothing (overlay.png). Undo sits next to it.
2. Extra decimals cut, not rounded: "12.345" logs as $12.34; "1,234.567" becomes 1234.56. Should be 12.35 and 1234.57, or ask.
3. One column writes amounts two ways: Receipts "Rent or mortgage $0" next to "Food and groceries $0.00"; "$1,100" next to "$400.00"; Receipts "$250.00 planned" vs Plan "Planned $250".
4. Changing currency (Settings, ¥ to $) after pay, bills and goals were marked done but still held sample amounts zeroes every bill, goal target and Saved so far (Emergency fund ¥140,000). Keep confirmed amounts or ask first.
5. A goal past its due date (1 Oct 2026, seen Nov 2026) says nothing about it.
6. No pay with bills logged: Home has no total line and no bank box (the -$1,185.40 shown is right).
7. A $2,500 Free to spend receipt against a $250 plan logs with no question; it only asks above the whole pay.

## Owner question (MAKO_RUN 1.1)
Bank typed on 22 Nov after ¥104,750 of Nov receipts is treated as the start of Nov; if the bank already reflects them they come off twice.
