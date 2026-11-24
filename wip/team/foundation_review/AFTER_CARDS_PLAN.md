# The bank after the cards are paid: every card's next payment

LANE B, 24 Nov 2026. Half a page, for qc-foundation before the engine line changes. Branch lane/twofig-engine (after the three values). Replaces the day rule of BK3 and BK5 (DECISIONS_ROUND2); agreed by the coordinator, 24 Nov.

## Mako's line
M40 "Cards: what is on each now, when it is paid, and the bank after the cards are paid." Also M36 (the picture adds up) and M13 (he can add a card after setup, and the figures must stay true when he does).

## The fault (qc-north-star on candidate 2, blocker 1)
The figure runs from the earliest unpaid card payment (D1) to the first counted pay landing after D1, and takes only the card payments in that stretch (lookahead.js, "each bank after its cards are paid", BK3, BK5). Made-up yen, set up 24 Nov: bank 168,000, pay 300,000 on the 10th, Card A 54,000 paid on the 10th, Card B 23,000 on the 11th: 391,000 after 10 and 11 Dec, right. Add Card C 12,000 paid on the 27th: D1 is 27 Nov, the first pay after it lands 10 Dec, so the stretch ends 10 Dec and Card B on 11 Dec is left out: 402,000 "on 27 Nov and 10 Dec". A new debt of 12,000 raised the figure by 11,000. Right is 379,000 after 27 Nov, 10 Dec and 11 Dec. For Mako's own two cards today the figure is right; it breaks the day a card paid before the pay is added.

## The rule
Per bank: **one next unpaid payment for each card paid from that bank** (an overdue one is taken today, as now), and the day is the **latest of those days**. The figure starts from the bank today, adds the counted pays landing on or before that day (a pay on the day itself counted first, the walk's order), and takes off bills, moves, loan parts and those card payments up to that day. Never plan lines, never goals. A second payment of a card that falls before the latest day (a card paid twice inside the stretch) is taken off as well and its day is listed: money that leaves the bank by that day is never left out. A late or not seen pay is still not counted and is named (BH1). The dip before the day, the money set aside, and "close days not sure" are worked out as now, over the new stretch.

## What changes in the answer
`res.bankAfterCards[bank]` keeps every field. `cardDays`, `cards`, `day`, `amount`, `pays`, `billsTaken`, `dip` cover the new stretch. No saved-shape change. Home's words read the same fields (home3.js afterCards3), so no screen change.

## Failing test (committed, 08642c4) and what it grows to
engine/test/bank_after_cards.test.js: the three-card case above (402,000 against 379,000), a new debt never raises the figure, the same in any card order. Grows to: a card paid after the pay only (unchanged from today); a card whose next payment is after the NEXT pay as well (two pays counted: say which, by hand); a card with nothing owed (left out); an overdue payment; a pay late and not counted; a bill between the first and last card day; two banks each with its own cards; a card paid twice before the latest day; nine record orders.

## Slices
1. The grown test, red. 2. The stretch from each card's first unpaid step (one function), green; the 779 asks listed where they differ, each explained. 3. DECISIONS_ROUND2 gains BK6 (this rule) and the two-pays rule, on this branch. 4. tests/e3_cardline.js and e3_ns.js rerun; a page check of the three-card case on Home.
