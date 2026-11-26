FAIL (qc-foundation, plan wip/team/foundation_review/LISTED_PLAN.md on lane/listed, 26 Nov 2026)

The rule is right for Mako's own moment and for the weekly earner, and the saved shape (`listed` on the check-in, missing means "listed everything") holds old records without a migration. But two cases go wrong inside the very function the plan changes (checkin.js landedFrom and checkIn's default day). If the plan is built as written, ticks get saved with the wrong day, and a later fix could not tell those records from good ones. Both should go into the plan now.

Worked figures come from the checkout's real engine (build_book, checkin, lookahead, periods). Scripts: /tmp/claude-0/listed_qcf/ (h.js, mako.js, d.js, card.js, weekly.js). The new dating is simulated by passing the day the rule would give.

## FOUNDATIONAL

F1. A card payment ticked after a card figure that said "not yet" is still dated before that figure.
Who: Mako (M27, M30), anyone with a card.
The moment: Card A owes 31,000, paid from Main on 10 Dec. On 12 Dec he says "Card A shows 31,000". The assistant asks, he says the payment has not gone through, and the plan writes listed [card payment], unticked. On 14 Dec he says "the card payment went through".
What the plan does: landedFrom looks only at checks on the paying account (checkin.js:80, `acct = s ? s.acct : card ? card.payFrom`). The card's own 12 Dec check, which listed the payment, is never read. So the tick is dated 10 Dec (engine: landedFrom gives 12 Nov from Main's opening), before the card figure that showed it unpaid. Result: Card A still owes 31,000 when it owes 0, and Free to spend drops from 60,000 to 29,000 (card.js). Plan rule 5 says the card_figure question works "the same way", but whatever the answer, it can never bound the tick.
Why it is in the base: the bound is worked out in the engine and frozen into the saved record's `date`.
What it needs: for a `repay`, landedFrom reads the checks of both sides (payFrom and the card), each counted only when its check-in listed the item. Add a test for this exact chain. Cost now: about an hour, same function. Later: wrongly dated card payments already saved, which can only be found by hand.

F2. After "I don't know" (or any check-in that did not list the item), the app silently picks the day.
Who: anyone who gives a figure by chat and answers "not sure", then says "rent came out" with no day. Also the screen check-in after it.
The moment: 30 Nov, Main really holds 276,000 (rent not out yet, 10,000 spent). He says "my bank shows 276,000, not sure about rent". Rent leaves on 1 Dec. That evening he tells the assistant "rent came out".
What the plan does: with the check unlisted, checkIn's default (checkin.js:45-47) dates the tick on its landing day, 27 Nov, inside the 276,000 figure. The engine (d.js) then shows Main 276,000 when the bank has 204,000, and Free to spend 58,000 instead of 48,000. The 62,000 "gain" also becomes a large-gain question about a figure that was right. Dated 1 Dec, everything is correct. Showing more money than there is is the unsafe direction. The Check your bank screen does the same: with no bound, checkin3.js:10 and :14 give no `from`, so the row is ticked by default at 27 Nov.
Why it is in the base: "the person did not know" is exactly the case where the engine must not choose. The default lives in checkIn, and the saved date cannot later show it was a guess (M6, M61: never guess money silently).
What it needs: when the default day would fall on or before a check whose check-in did not list the item, landedFrom also returns that check's day, and checkIn refuses the tick unless it gets a typed day or an answer "before or after you looked at 276,000 on 30 Nov?". The assistant's `landed` step takes that answer the way move_money already takes `afterFigure`, and the screen asks it on the row. Cost now: half a day with tests. Later: guessed days already saved.

## Plan corrections (no base change, fix in the plan before building)

C1. A check with no check-in record must keep bounding everything. That covers the setup opening check (build_book.js:63-66, grp with no check-in, carrying `notYet` from "has it come out already?"), the opening checks of accounts added on Plan (plan3_write.js:306, 368, 380, 397, 490) and move.js checks. Rule 2 only covers "a check-in with no listed". Otherwise a bill answered "not yet" at setup and ticked later lands inside the opening. Add the rule and a test.
C2. The plan says a later tick "never moves safe to spend up". The engine does move it up, and correctly: Mako's case goes 0 to 48,000 (mako.js B), because the gap shrinks by 72,000 and Rent stops being expected, which removes a double count. That contradicts the CHECKGAP wording ("never moves safe to spend up"). Ask the coordinator for one line in CHECKGAP saying that a settle of an expected item explains the gap and frees what it held. Otherwise qc-numbers will flag the plan's own test (a).
C3. ask3_core.js has no bank_figure or card_figure (grep). Say which file carries rule 5, or drop "and the same in ask3_core.js".
C4. Rule 7's single change card must name each ticked item and its amount. The question itself is the ask-first for amounts he never typed (M6), so the card must not tick anything he did not say.

## OWNER'S WORDS
A: M1, M4 met (the assistant asks before writing). M3 met for the bank, broken for cards (F1). M6 met by the question, broken by F2's silent day. M7, M12 met for the bank, broken for cards (F1) and after "not sure" (F2). M5, M17 met. M9 silent (reader, scope noted). M2, M8, M10, M11 silent.
B: M13, M14 met (one Undo for the figure and its ticks). Changing or removing a tick or figure is still empty (grid). M22 silent. M23: card figure broken (F1). Others not touched.
C: M27, M30 broken (F1). M31 met. M32 met (the close day is not needed for the question).
D: M36, M44, M45 met for the bank, broken for cards (F1) and after "not sure" (F2). M37 met for "today". A figure seen yesterday is still stamped today (silent; earlier builder item 2). M38 met: weekly pays dated 9, 16 and 23 Nov in one check-in, the same whether ticked with the figure or later (weekly.js). M40 broken (F1).
F: M61 met (no migration; old check-ins keep the old rule), at risk by F2. M67 see WATCH. Others silent.
H: M91 met ("not sure" is offered). M98 walked, but the "it left after I looked" and card cases were missing.

## GRID
Kinds touched: bank or card figure (check-in), tick (settle). 2 kinds x add, change, remove, Undo x screen and assistant = 16 cells. Covered 8 (add and Undo of each, both sides). Not applicable 0. Empty 8: change and remove of a figure (screen, assistant), and change and remove of a tick (screen, assistant). These were known from the 25 Nov report. The base can do all of them (gone plus a new record through the door), so they are for the builder. A wrong "yes it came out" can today only be fixed by Undo of the whole check-in and saying it again.

## WATCH
- Two devices: a tick's day is frozen at write. A phone that has not yet received the other device's check-in listing "Rent, not yet" dates the tick before that figure, and after the join Main reads 72,000 high. Already true of BI1; fixable later at read time without changing saved data.
- Assistant figure check-ins saved before this change carry no `listed` and are read as "listed everything", so F1 of 25 Nov stays in any book that already has them. If a real book exists on the private address, the coordinator decides whether to mark them.
- `unsure: true` relies on the AI having asked. Nothing in the door proves the question was shown. Log it on the change card ("you weren't sure about Rent").
- The weekly earner back after three weeks: by the settled CHECKGAP rule, all three weeks of unlogged spending land in this week (current week free left -1,050,000 against 300,000 a week, past weeks 0; weekly.js). Settled; show Mako at his run.
- The statement or screenshot reader (M99) and bank imports must pass `listed`, and their import-written non-statement checks (stmt3_plan.js:258) need C1's rule.

## Checked and sound
- Mako's moment: a figure of 204,000 with Rent ticked in the same check-in, dated 27 Nov: Main 204,000, Free to spend spent 10,000, left 48,000 (mako.js C). The same with Rent ticked the next day after a check-in that did not list it (mako.js B). Today's build gives 132,000 and -24,000 (mako.js A, matches the 25 Nov finding).
- A check-in that listed Rent unticked still bounds it (BI1 unchanged).
- Weekly: three pays ticked with the figure, or later, give the same periods and the same bank (930,000).
- Old saved check-ins: no field means the old behaviour, so no data changes. Sync keeps whole records (sync.js:163-170 compares all content), so `listed` travels.
- Early debits (item C): an item not yet due is never listed, so a typed earlier day is allowed. The rule helps there.
