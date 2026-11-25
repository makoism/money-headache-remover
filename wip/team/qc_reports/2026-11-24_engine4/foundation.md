# qc-foundation on lane/twofig-engine 94af457: FAIL (narrow)

Saved by LANE B from the reviewer's own answer (25 Nov 2026). The reviewer wrote no file. It stopped at the 150,000 token limit; what it did not reach is listed at the end.

## Verdict
FAIL, narrow: one engine finding, no saved-data change. The three plans built on this branch (card gaps, three values, bank after the cards) are sound. The finding is not caused by this branch: it is the part CARDGAP_PLAN item 4 left "unchanged on purpose", and it does not touch "not sure" cards (Mako's).

## How it was checked
A made-up "real world" for each life (real bank, cash and card balances moving day by day) run beside the engine for 12 months through build_book, checkin and lookahead; the person opens the app about weekly, ticks what is due and types the real figures. About 430 opens. Eight lives: paid on the 10th with two cards (three ways: payments equal all owed; real statements with the app's amounts ticked; real amounts typed); twice a month with a late pay, an overspent month, a refund, a yearly bill and a minimum; every two weeks in dollars with three-pay months and three weeks away; weekly with cash from the machine; freelance with a zero month; a couple with two pays set up on the 20th after pay; cash, e-wallet and bank in pesos.

## Owner's words
- M7, M12, M51 MET in the engine: headline = max(0, min(canSpare, everyday.left)) held at every open in every life.
- M11, M30 MET: with nothing logged, the periods' "spent" added up to the real spending to the unit in six lives.
- M27, M32 MET. M31, M38 MET for a fixed pay. M36, M37 MET: after every check the app's bank, cash, e-wallet and card equalled the real ones.
- M40 MET for "not sure" cards (his). BROKEN for a card with a known close day (the finding). M41 touched by it.
- M44 MET for money figures (shuffled events, check-ins, accounts, schedules: no figure moved). M45, M48, M61 MET.
- M1 to M6 NOT BUILT on this branch (the readers are MAIN 16's lanes); the base gives both screens and assistant one answer.
- M13, M14 partly (grid). M46 silent for no fixed pay. M28, M43, M47, M49, M50 not reached.

## Grid
17 kinds by add, change, end or remove, undo, on a later day: covered 45, not applicable 11, empty 8, not verified 4. The 8 empty are all for the builder (the saved shape and engine hold each): add a bank, cash or e-wallet after setup; rename one; close one; close a card; add a pay after setup; go back to no Free to spend; end or remove a goal; a card payment outside its day and topping up an e-wallet from a card (the door refuses any move that names a card, act3.js:37; the engine holds both rightly when written as records).

## Foundational
1. A card with a known close day and spending not logged: which statement a gap falls on still uses the check's day (lookahead.js, the card loop: the filler line is pushed on the check day). Spending before the close is put after it. One card, closes the 15th, paid the 10th, 2,000 a day, nothing logged, figure typed weekly: the next payment read 56,000 where the real one was 64,000 (10 Jan), 56,000 against 62,000 (10 Mar), 50,000 against 62,000 (10 May). The card's next payment, the bank after the cards and what the bank can spare read too kind by up to one logging stretch. Needs: each part of a card gap goes on the statement its days fall in, cut at the close day by the same makeFiller; a failing test first in that shape. About half a day; no saved data changes.

## Watch
1. No fixed pay: no period and no past month is kept as a figure; unspent everyday money drops at the 1st with nothing said (the end-of-period plan must cover this life, M46).
2. Removing an account through the door's generic remove rewrites the past (a card removed moved the headline from 17,500 to 36,500). "Remove a card or bank" must be built as close, never as remove.
3. The engine takes a move into a card without a word; the door blocks it today, import and the assistant's addRecords could write it.
4. A bill that changed without the app being told is counted as everyday spending; the check-in could ask.
5. Bank after the cards for a couple counts two pays and no everyday money (for Mako's run).
6. The order of rows on the check-in list follows the saved schedule order (no figure moved).
7. Which side of a same-day check a spend falls on still follows the told clock time; travel across time zones not tested.
8. Second currency: an account added later is kept beside and left out of what can be spared.

## Sound
No throw, no figure off from the real accounts, no gap whose parts failed to add up, in eight lives over 12 months. What the bank can spare never sat above the real lowest point ahead except by the close-day finding. Later-day changes through the write door gave an Undo step. No new server setting.

## Not reached
The built page. Statement import. Two devices and the cloud copy. Goals, loans and budget lines inside the walks. Weekend and holiday shifts. Two incomes as one number (M28). Time zones. SCHEMA_V3 in full.
