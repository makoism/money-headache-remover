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
3. Payments before the check (a) [qc-foundation 2026-11-26_loancheck_plan finding 1]. The engine never guesses. At the moment of the check (Plan sheet, Check your bank, the assistant), for each unticked payment of this loan landing on or before the check day, the person is asked: "Has the 27 Jan payment of 30,000 left your bank?"
   - Yes: it is ticked in the same step (same `grp`, so it is inside the check by sameMoment; the bank still has it leave).
   - No, not yet: the check carries `notYet: [<occurrence>]`, as the opening check already does (lookahead.js notYetOf / inside's AB4 rule, extended from the opening to every loan check); the payment stays to tick, and a later tick of it (dated by landedFrom, maybe after the check) is not inside the check and lowers what is owed once, which is right because the figure typed still held it.
   - Not sure, later (M91): the same as No, not yet (the lender's figure is never lowered twice, and the bank still expects the payment).
   So `unpaid` holds only payments the figure typed still includes. A payment already ticked keeps its record.
   Rejected: covering it with the check, as the opening covers what lands before it: the bank would no longer expect a payment that did leave, and its next check would count it as spending (M45, M36).
2b. Payment days on or before the check day keep the walk from the base before it (the opening or the earlier check); `min(owedThen, owedNow)` applies only to days after the check. A check of 0 asks the same question first [finding 2].
4. Same day as a payment (b): a check is read at its `told` moment; a payment ticked before the check on that day is inside it (the existing `sameMoment` / key order, as for cards). An unticked payment landing that day follows rule 3 (i).
5. Two checks: the latest by date, then by told, wins (c). Earlier ones stay as history; Undo of the latest brings the one before back.
6. A check of 0 (d): owed 0, no more payment items; Close this loan is then allowed (closeLoan already requires owedNow 0). No automatic close.
7. A check dated in the past (e): allowed back to the loan's opening day and never before a check that already exists (it would never win), and never after today. Records after it count on top, as for cards.
8. Nothing else reads a loan check: safe to spend changes only through the loan's payment items (the next payment's amount may now be smaller when what is left is less than the usual payment, which is the existing `Math.min(bal, asks)`).

## Saved data
No new field (`notYet` is already on opening checks). A loan check is the same `check` event a bank or card uses, written through ACT3 with id, told, at, by, grp. Old books can hold checks on a loan already [finding 3]: a moved debt's `mv:check:debt:*` (move.js, no grp, same day and amount as its opening) and closeLoan's check of 0; a test shows owed and items unchanged on such a book before and after the rule. Undo is the door's own (the event marked gone).

## Doors (screens and assistant, M3, M13)
- Plan, a loan's sheet: a "Still owed today" box with today's figure filled in, and a day box (today by default). Save writes PLAN3W.checkLoan(w, id, { amount, date }). Empty or the same figure: "Nothing changed". A wrong value: the form's usual words.
- Check your bank: each live loan gets an optional "Still owed today" box, like a card's; blank means not looked (no check written).
- Assistant: card_figure accepts a loan A ref ("a card or loan figure") and a `date` (today or before), and `paid` answers for the question of rule 3 (occurrence refs: yes, no or later); the change card shows before and after. `remove` takes the loan check's ref so the assistant can take one back [grid gap], besides Undo on its card.
- Undo: the change card, the Undo bar, Settings > Recent changes (slice 4), and after a reload.

## Tests first (one commit each)
1. engine: tests in engine tests for rules 2 to 7 with worked figures (Kenji's month by hand: 900,000 from 20 Nov, 30,000 on 27 Nov ticked, 27 Dec ticked, 27 Jan not ticked, check 812,400 on 3 Feb with 27 Jan answered Yes (ticked in the step) and, in a second book, answered No (then a bank check on 5 Feb and the tick on 10 Feb lower owed once, to 782,400 only because the figure still held it); the next payment 30,000 on 27 Feb, apr 0); a check of 0 ends the payments; a past check; two checks and Undo; the nine-orders test (lesson 4 addendum) on a book with a loan check, two devices' checks on one day included; a moved book with a debt and a closed loan unchanged; a later apr change counts from the latest check.
2. plan3_write checkLoan (refusals: before the opening, after today, before an existing check, not a loan, closed).
3. Plan loan sheet box, page test (e3_loancheck.js): type, save, figure shown, Undo, reload.
4. Check your bank loan box and the assistant's card_figure on a loan (chat3_core.test.js).
Then check3 quick after each, full at the end; reviewers qc-controls and qc-foundation (engine changed), qc-numbers is the coordinator's call.

## Not in this plan
- A loan's usual payment changing from a date (it is one field today, changed on its sheet).
- Statements for loans (the import reads banks and cards).
- Interest set up after setup (apr is setup-only today).
