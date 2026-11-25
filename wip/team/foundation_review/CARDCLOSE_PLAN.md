# A card with a known close day: unlogged spending goes on the statement its days fall in

LANE B, 25 Nov 2026. One page, for qc-foundation before any engine line changes. Branch lane/cardclose, on top of lane/twofig-engine.

## Mako's lines
M40 "Cards: what is on each now, when it is paid, and the bank after the cards are paid." M41 "Card close day is asked plainly, with a 'not sure' answer." M36 "The picture adds up." M11 and M30 (he logs weekly, nearly all spending is on cards). His own two cards are "not sure" today, so no figure of his moves; it becomes his the day a statement import tells the app his close days.

## The fault (qc-foundation on the engine branch, 25 Nov; the part CARDGAP_PLAN item 4 left "unchanged on purpose")
A card's unlogged spending found at a check (its gap) is now split by days for the pay periods (BZ1). For the card's own statements it is still one line dated the day of the check (engine/lookahead.js, the card loop: `lines.push({ day: e.day, amount: g2, what: 'filler' })`). A statement holds every line dated on or before its close day (statementsTo). So spending from before a close that is found at a check after it lands on the next statement. The card's next payment, the bank after the cards and what the bank can spare read too kind by up to one logging stretch.

## The failing test (committed first)
engine/test/card_gap_statement.test.js, made-up yen. One card, closes the 15th, paid the 10th of the month after, 2,000 a day on it from 25 Nov, nothing logged, the figure typed each Saturday. The statement that closes 15 Dec really holds 25 Nov to 15 Dec: 42,000. The check of 19 Dec finds 14,000 over 13 to 19 Dec, of which 13, 14 and 15 Dec (3 of 7 days, 6,000) are before the close. Today the 10 Jan payment reads 36,000; right is 42,000.

## The fix (one place, the card loop; no saved-shape change, nothing stored)
1. **One line per part, on the part's days.** The gap's stretch is cut at this card's close days as well as at the period starts, by the same day-share rule (makeFiller's: share by days, the last part takes the remainder). Each part cut this way is pushed as its own filler line dated the part's LAST day, so a part that ends on or before a close is on that statement and a part that starts after it is on the next. The lines of one gap still add up to the gap, so what the card owes on the check's day is exactly what was typed, as today.
2. **The parts the screens read do not change.** `fillers[].parts` stay the period parts (cut at pay period starts and month starts only): Receipts and the periods' "spent" read those, and a close day is not a period edge. The statement cut is used for the lines only. A test asserts the period parts are the same before and after.
3. **A statement that is already paid is never reopened.** If a part's days fall on or before a close whose statement has had its payment made (a `repay` that settles it, or its payment day gone by with nothing left on it), that part's line is dated the day after that close instead: it joins the open cycle. Otherwise a long stretch (three weeks away) would put new money on a paid statement, which the engine would carry forward as an unpaid remainder, with interest on a card that has a rate. The real payment for that statement already left the bank, and any difference was caught by the bank's own gap.
4. **Cards "not sure"** have no close days: one line on the check's day, as today. No figure moves for them (Mako's shape; mako_walk and the asks must not change).
5. **A statement check written with the card check** (setup, statement import): its part already sits on its close day; unchanged.
6. **Order.** The card loop already walks the checks in the bank's order (byTime); the lines of earlier checks are in place before a later check's gap is worked out, as today. A line dated inside an earlier stretch never changes what an earlier check found, because each gap's lines are dated after the check before it.

## What a person sees change
For a card with a known close day and spending not logged: the amount of its next payment (and of an overdue one), the bank after the cards, what the bank can spare and so safe to spend, all lower where spending fell before a close. Nothing changes for "not sure" cards or for spending that was logged.

## Real lives
Paid weekly, monthly, no fixed pay: the statement cut is the card's own and does not depend on pay. Away three weeks across a close and a payment day: rule 3. A card added after setup with a close day: its first stretch starts the day after its opening (BZ1), cut the same way. A card that carries a balance: the same lines; interest follows the statement amounts as today. Two cards with different close days: each cut at its own. A minus gap (the card shows less than the app had): the same split, signed, as BZ1. Second currency: marked apart as today.

## Tests the build must add (hand-worked, real-looking ids)
The failing test above; a check on the close day itself (all of it before the close); a stretch across two closes (away five weeks: three parts, the middle statement paid, rule 3); the payment ticked between the close and the check (rule 3: the part joins the open cycle and the ticked payment is not reopened); a minus gap across a close; a carrying card with a rate across a close (interest on the right statement amount); a "not sure" card (no change); nine record orders; and that every gap's lines add up to the gap and `owedNow` on the check day equals the figure typed. The engine suite (25 runs), the 779 asks, check3 full.

## Not in this plan
The month rule (a typed monthly amount charged exactly in every calendar month): its own branch next. Statement import's own reading of close days. What a screen says about a statement that changed after a check (wording, the main build session's).
