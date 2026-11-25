# Loan check plan: "still owed today" for a loan, after setup

Written by LANE H, 26 Nov 2026, on lane/controls-6 (stacked on lane/controls-5). Engine rule agreed by the coordinator (26 Nov, ruling 2 to LANE E): **a check on a loan sets what is owed from its day, as for cards.** This plan goes through qc-foundation before anything is built.

## Lines it serves
- M13 (change every kind of thing after setup): a loan's "still owed" cannot be changed today. The only number is the one typed when it was added.
- M7, M36 (nothing unknown; the picture adds up to what is really there and says how fresh it is): after a few months the loan figure drifts from the lender's statement (interest the app does not know, an extra payment, a fee), and there is no way to put it right.
- M3 (the assistant has full control over the numbers): the assistant can type a card's figure (card_figure) but not a loan's.
- M6, M14 (Undo), M61 (nobody loses data): a check is a new record, never an edit of the past.
- Touches, does not change: M40 (cards), M44 (one dataset from real dates), M45 (no coin counted twice).

## A person's moment (M98)
Kenji has a car loan. He added it in November with 900,000 still owed and 30,000 a month on the 27th. In February the lender's app says 812,400 (there was interest, and he paid a little extra once). The Burrow says 810,000. He opens the loan on Plan, types 812,400 in "Still owed today", saves. From today on the app counts from 812,400. The payments that came before stay as they were. He can Undo. He can also say it to the assistant: "the car loan is at 812,400 now".
What else could be true in that moment: (a) he has not ticked January's payment, which did leave his bank; (b) he types the figure on the same day the payment leaves; (c) he typed it wrong and fixes it the same day; (d) the loan is paid off and the lender says 0; (e) he looks at a statement from last week, not today.

## The rule (engine/lookahead.js loanInfo)
1. A loan check is a `check` event on the loan account (`k: 'check', acct: <loan>, date, a: owed`), not a statement and not the opening's own check. Today a loan reads only its opening (loanInfo uses `openingOf(id)`); later checks are ignored.
2. The latest live loan check dated on or before `knownTo` sets `owed` on its day: the walk of `changes` and interest starts from it instead of from the opening (records inside the check, by `inside(e, check, id)` as for a bank or card check, are not counted again). Interest (`a.apr`) runs from the check day.
3. Payments before the check (a). Two ways; the recommendation is (i):
   (i) An unticked payment that landed before the check stays an item to tick (overdue, with its usual amount), because it is money that left, or will leave, the paying bank: the bank side still expects it. When it is ticked later, its repay record is dated before the check, so it is inside the check and does not lower what is owed again (no coin counted twice, M45). Its amount on the loan side is already in the figure typed.
   (ii) The check covers it, as the opening covers what lands on or before it. Simpler, but the bank then no longer expects that payment: if it did leave the bank, the bank's next check finds a gap and counts it as spending, which is untrue.
   A payment already ticked keeps its record either way.
4. Same day as a payment (b): a check is read at its `told` moment; a payment ticked before the check on that day is inside it (the existing `sameMoment` / key order, as for cards). An unticked payment landing that day follows rule 3 (i).
5. Two checks: the latest by date, then by told, wins (c). Earlier ones stay as history; Undo of the latest brings the one before back.
6. A check of 0 (d): owed 0, no more payment items; Close this loan is then allowed (closeLoan already requires owedNow 0). No automatic close.
7. A check dated in the past (e): allowed back to the loan's opening day and never before a check that already exists (it would never win), and never after today. Records after it count on top, as for cards.
8. Nothing else reads a loan check: safe to spend changes only through the loan's payment items (the next payment's amount may now be smaller when what is left is less than the usual payment, which is the existing `Math.min(bal, asks)`).

## Saved data
No new field. A loan check is the same `check` event a bank or card uses, written through ACT3 with id, told, at, by, grp. Old books have none, so nothing changes for them. Undo is the door's own (the event marked gone).

## Doors (screens and assistant, M3, M13)
- Plan, a loan's sheet: a "Still owed today" box with today's figure filled in, and a day box (today by default). Save writes PLAN3W.checkLoan(w, id, { amount, date }). Empty or the same figure: "Nothing changed". A wrong value: the form's usual words.
- Check your bank: each live loan gets an optional "Still owed today" box, like a card's; blank means not looked (no check written).
- Assistant: card_figure accepts a loan A ref (renamed in the words "a card or loan figure"), and Check your bank's step through CK.checkIn passes it on. The change card shows before and after.
- Undo: the change card, the Undo bar, Settings > Recent changes (slice 4), and after a reload.

## Tests first (one commit each)
1. engine: tests in engine tests for rules 2 to 7 with worked figures (Kenji's month by hand: 900,000 from 20 Nov, 30,000 on 27 Nov ticked, 27 Dec ticked, 27 Jan not ticked, check 812,400 on 3 Feb: owed 812,400, 27 Jan still to tick (30,000 from the bank) and ticking it leaves owed at 812,400, next payment 30,000 on 27 Feb, apr 0); a check of 0 ends the payments; a past check; two checks and Undo; the nine-orders test (lesson 4 addendum) on a book with a loan check.
2. plan3_write checkLoan (refusals: before the opening, after today, before an existing check, not a loan, closed).
3. Plan loan sheet box, page test (e3_loancheck.js): type, save, figure shown, Undo, reload.
4. Check your bank loan box and the assistant's card_figure on a loan (chat3_core.test.js).
Then check3 quick after each, full at the end; reviewers qc-controls and qc-foundation (engine changed), qc-numbers is the coordinator's call.

## Not in this plan
- A loan's usual payment changing from a date (it is one field today, changed on its sheet).
- Statements for loans (the import reads banks and cards).
- Interest set up after setup (apr is setup-only today).
