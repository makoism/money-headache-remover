(Saved by LANE C from the reviewer's reply: the fourth qc-foundation review of foundation_review/ENDPERIOD_PLAN.md, on lane/endperiod 3cf8131c, 25 Nov 2026 about 21:45 JST. Shortened in layout only.)

VERDICT: FAIL, small. Nothing found needs a saved-data or engine rework. Three rule gaps must go into the plan text and tests before slices 0 and 1 are built. The card-gap fix holds: the figures the plan reads are now sound.

## Mako's example, worked on this branch
Pay 240,000 on the 10th, Food 40,000, Free 60,000, two cards, weekly checks, Food receipts 31,000 logged on Card A, the rest unlogged.
- 13 Dec, pay and cards ticked and typed: periods().past[0] gives Food 40,000 / 31,000 / left 9,000 and Free left 11,000. The true Free figure is 12,000; the 1,000 is the day-split of the gap across the 10th (CA1, decided).
- Food 9,000 to Trip: Trip 9,000, canSpare 640,000 to 631,000, noJob 588,000 to 579,000, everyday left 52,000 unchanged. A "waiting" answer: no figure moves. Reversed record order: the same figures.
- Both answers raise an unanswerable `shares` question today (undo: []), so the slice 0 test is red for the right reason.

## Blockers
B1. A "Leave it in my bank" answer given on stale figures swallows another line's money (M46, Mako's own shape; slice 1 rule). 10 Dec, pay ticked, cards last checked 4 Dec: Food left 19,000 and Free 21,000. He answers Food: the record holds { to: 'waiting', a: 19000 }. 13 Dec, figures arrive: Food 9,000, Free 11,000. Section 4's rule gives 20,000 less answers 19,000 = 1,000, so Free is offered 1,000 of its 11,000; the other 10,000 is never asked about, and no Take back shows because 19,000 is under 20,000. Fix, in EP3 only: a `waiting` move marks the place as decided and takes nothing off what the period can give; only goal moves come off. Also say plainly that a place is offered its own left less its own goal answers. Both cases into the slice 1 test.
B2. The goal cap is the wrong figure (slice 1 output, slice 2 refusal). Section 4 caps at canSetAside (lookahead.js:1420), which does not take off this period's lines or everyday money. Bank 10,000 on 13 Dec: canSpare minus 168,000, noJob 0, canSetAside 10,000: the plan would offer Food's 9,000 to Trip; after it canSpare is minus 177,000. The cap is the least of: what the period can give, noJob (lookahead.js:1404), and canSetAside. EP3.waiting must return that cap, so the prompt never says "9,000 left, where should it go" when nothing is spare. This case into the slice 1 test.
B3. Slice 0's test lacks the case the plan itself requires (builder point 2), and the answer is not decided. sync.js:508 offers only `move` records for undo; the `shares` answer at sync.js:623 to 625 can only mark moves gone. Trip filled by an answer, device B spends 9,000 from Trip, device A takes back (moves: []): Trip is minus 9,000 with undo: [], and the question stays for ever. The same hole exists with no period end at all (a fill removed on A, a spend from the goal on B). "Put the answer back" cannot be built as planned: a record with moves: [] no longer says which goal it fed. Decide before building: (a) the question also lists the spends naming the place and offers "count this spend as everyday money" (no saved-shape change; recommended, it closes the older hole too); or (b) Take back keeps the old moves in a new field (an added field, to be agreed before slice 2 writes its first Take back). Add the two-device test to sync_period_end.test.js.

## Slice 0, the rule itself: sound
Skip keys that are not in book.places and are not `waiting`. Read book.places with removed places included, so a removed goal is still judged. The goal side at sync.js:499 stays. The five written tests are right and order-free.

## Answers
1. Figures at a period's end: true for Mako's shape once the cards are checked after the end. Late pay: the period ends the day before the tick's date (lookahead.js:379). Set up mid-period: the part period reports its day-shared amounts (Food 21,935, Free 32,903). Away two periods: each past period keeps its own occurrence. Every two weeks and weekly were read, not run.
3. Slice 1: order-free if the overspend order is as point 3 says; not yet safe when figures arrive later (B1).
4. Rework later: none forced.
5. Whole-book mark: yes. A goal answer, Change and Take back should carry the `ver` mark, because the offer is worked out from every record. EP3.answer must also work the cap out again inside the step from w.book and refuse, since the mark only protects the offer shown.

## Smaller
- Figures move after "fresh": a receipt dated 8 Dec logged on 20 Dec turned Food from 9,000 to minus 3,000 and Free from 11,000 to 17,667. The rule copes: 14,667 less the 9,000 answered leaves 5,667. The card should say "about" while a gap crosses the pay day.
- Builder point 4 confirmed: past lines come from live budgets only (lookahead.js:853, 1076), so count answers by record.
- In version one offer only goals kept in the line's own bank account.

## Watch
When holding out (q7) arrives, old `waiting` amounts typed on stale figures must not be held as written. A pay unticked after an answer leaves the next period started (lookahead.js:378). Two devices with different end dates for one period: the earlier date wins (lookahead.js:367), order-free but should be said on screen. No fixed pay stays NOT MET for M46.

## Owner's words
M24, M46 met by the plan once B1 is fixed. M36, M45 met. M20 met only after B3. M11, M30, M32 met by the freshness rule. M68 met (scripted prompt).

## Grid (period-end answer)
9 cells covered in the plan, 2 not applicable (no fixed pay, same-line carry), 1 empty: the answer to the goal `shares` question (B3).
