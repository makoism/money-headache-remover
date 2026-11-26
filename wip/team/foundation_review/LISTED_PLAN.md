# A check-in remembers what it listed (lane/listed, LANE O, 26 Nov 2026)

Serves: M1, M4 (day to day he mostly talks to the assistant), M3 (full control over the numbers), M7 and M12 (what is safe to spend, clarity), M36 and M37 (the picture adds up to the bank today), M44 and M45 (worked out from real dates, nothing counted twice), M98 (walk it as a person). Touches: the check-in record (SCHEMA_V3 7.2, one line), the assistant's bank and card figure steps.

Source: qc-foundation on the candidate, F1 (qc_reports/2026-11-25_ai_first/qc-foundation.md, worked example confirmed by MAIN 24). Coordinator 18's order: its own slice, plan first with qc-foundation.

## The person and the moment (M98)
Mako, 30 Nov. Main bank 286,000 the app last knew. Rent 72,000 really left on 27 Nov and he spent about 10,000 that he never logged. He does not open the Check your bank screen; he tells the assistant "my bank shows 204,000".

What he needs: the app to agree with his bank (204,000), Rent shown as paid, and his Free to spend down by about 10,000, not by 82,000. Next day, if the app asks or he says "rent came out on the 27th", it must land on the 27th, in the figure he gave, never after it.

What the build does today: the assistant writes the figure with nothing ticked and never mentions Rent. All 82,000 counts as everyday spending (Free to spend 50,000 overspent). Then "rent came out" the next day is dated 1 Dec, after the figure, because the engine assumes every saved check was made with the list of expected items in front of the person (BI1). Main then reads 132,000 while the bank shows 204,000. Asking with the date 27 Nov is refused. The same for a weekly earner back after three weeks: three pays can only land after the figure.

What else could be true:
- He gives the figure and Rent has NOT come out yet (it bounced, or it is due today and not taken). Then Rent stays expected and the whole gap is everyday money, as today. The app must ask, not assume either way.
- Several things are expected (Rent, Phone, his pay). One question names them all, each with its amount and day, and he can answer "all of them", "none", or name the ones that did.
- He says "rent came out" first, then the figure. Today that already works (the tick has no check before it).
- A card figure ("Card A shows 31,000"): the card's payment that was due before today is the expected item (did it go through?), the same way.
- He answers nothing about them ("I don't know, just put the figure in"). Then the figure is written with those items not listed (not in front of him): a later tick may land on its own day, before the figure. The gap is everyday money until he ticks, then it shrinks (the check gap rule: a record dated before a check only changes the gap, never moves safe to spend up).
- Two devices: the check-in record is written once and never changed, so `listed` joins like the rest of the record.
- An older build (or the other device on an older build) reading the new field: it does not use it, and ticks there keep the old, later date. Named in scope.

## The rule (engine, checkin.js)
1. A check-in record gains `listed: [occ]`: the expected items that were in front of the person when the figure was given (the screen: every row of the list, ticked or not; the assistant: every item it asked about). Written by checkIn from a new argument `listed`.
2. landedFrom (BI1) counts a previous check of the item's account only when that check's check-in listed the item. A check whose check-in did not list it does not bound it: the tick is dated its landing day or the day typed, even before that check. A check-in with no `listed` field (written before this change) counts as having listed everything, the old behaviour, so nothing already saved changes.
3. The check-in screen passes listed = every item it showed (check3.list), so the screen's behaviour does not change at all.
4. Nothing in lookahead changes: a tick dated before a check is already handled by the check gap rule (it shrinks that check's gap, and the item is no longer expected, so it is not taken off twice). In Mako's moment safe to spend goes from 0 to 48,000 when Rent is ticked, which is right (qc-foundation C2): the CHECKGAP words "never moves safe to spend up" were about a spend changed after a check, not an expected item settled; ASKED of the coordinator for one line. The reference model and the checker are untouched.

2b. [qc-foundation F1] A card payment is bounded by the checks of BOTH its paying bank and the card itself, each only when its check-in listed the payment. A card figure answered "not yet" for its payment then keeps the later tick after that figure.
2c. [qc-foundation F2] When the newest check before the tick did NOT list the item (the person did not say), the day is not picked silently: checkIn refuses a tick with no typed day and no answer to "before or after you looked?" (`afterFigure: { occ: true|false }`, the same word move_money already takes). Before: dated its landing day (inside the figure). After: dated the day after that check, as BI1. landedFrom returns that check's day so the screen and the assistant can ask. The screen asks it on the row only in that case (it never arises from the screen's own check-ins, which list everything).
2d. [qc-foundation C1] A check with no check-in record (the setup opening check with its "not yet" bills, the opening check of an account added on Plan, a move's or an import's check) keeps bounding everything, as today. Only a check whose check-in record exists and has `listed` is read for rule 2.

## The assistant (chat3_core.js only: ask3_core.js has no figure steps)
5. bank_figure and card_figure take two more fields: `landed: [refs]` and `notYet: [refs]`, the expected items for that account due on or before today (res.checkIn.toConfirm, for a card its payment from its paying account).
6. If any such item is in neither list, the step is refused with a question to ask first, one question naming each item with its amount and day: "Before I put in 204,000: has Rent (72,000, due 27 Nov) come out already?" (wording to qc-voice). Same pattern as the "card or bank?" question that exists today. An answer "I don't know" lets the assistant send the figure with `unsure: true`: those items are not listed (rule 2) and stay expected.
7. The step writes ONE check-in: the figure, the items in `landed` ticked at their landing day (or a day he named), all asked items in `listed`. One change card, one Undo for the whole of it. The card names each ticked item with its amount and day ("Rent 72,000 paid on 27 Nov") beside the figure line [C4].
7b. The `landed` step, when rule 2c asks, needs `afterFigure` (true or false): the assistant asks "Did it come out before or after you looked at your bank on 30 Nov?" and passes the answer.
8. The `landed` step (a tick on its own, "rent came out on the 27th") is unchanged; with rule 2 it can now be dated the 27th after a figure given without a list.

## Tests (failing first)
- engine/test/checkin.test.js: (F1) Card A 31,000 on 12 Dec, card figure with the payment listed and not ticked, tick on 14 Dec: dated 13 Dec, never 10 Dec. (F2) figure with listed [] on 30 Nov, Rent leaves 1 Dec, tick on 1 Dec with no day and no afterFigure: refused; with afterFigure true: dated 1 Dec, Main 204,000, Free to spend 48,000 left; with afterFigure false: dated 27 Nov. (C1) a "not yet" bill at setup ticked later: after the opening check, as today. (a) MAIN 24's worked example: a figure check-in with listed [] on 30 Nov, then a tick of Rent: dated 27 Nov (its landing day), and the bank in lookahead stays 204,000; Free to spend down by the unlogged 10,000 only (worked by hand from the book). (b) The same with listed [Rent] and Rent left unticked: the tick is dated 1 Dec, as BI1 today. (c) A check-in without `listed` (an old record): the old date. (d) Nine record orders give the same dates.
- app3/tests (node, the chat core's real handle with a fake tool call, as in act3 tests): bank_figure with Rent expected and no answer is refused with the question naming Rent, 72,000 and 27 Nov; with landed [Rent] it writes one check-in with the tick on 27 Nov and listed [Rent]; Undo removes both; with unsure it writes listed [] and Rent stays expected. A weekly earner three weeks away: the question names all three pays (joins item B).
- The screen check-in still writes listed = its whole list (a page test that reads the saved record).

## SCHEMA_V3 7.2, one line
"A check-in lists the expected items that were in front of the person (`listed: [occ]`); a later tick of an item is dated after a check only when that check's check-in listed it [BI1]. A check-in with no `listed` (written before 26 Nov) counts as having listed everything."

## Not in this slice (scope)
- "I got paid" after three weeks away ticking every pay since the last check (item B, next).
- A debit that came out before its day (item C, next): the assistant's `landed` step refuses an item not yet due.
- A statement or screenshot reader (M99, not built): it must pass `listed` the same way when it is built.
- Two devices: a device that has not yet received the other's check-in can date a tick inside that figure (true of BI1 today; WATCH).
- Figure check-ins the assistant saved before this change read as listed everything (the old fault stays in those books; WATCH).
- The weekly earner back after three weeks: under the settled check gap rule all unlogged spending lands in the current week (the real engine: that week 1,050,000 over against 300,000 a week). Settled; the example to show Mako at his run.
- An older build ticking an item on the other device dates it the old way (later); it never loses money, only the day. WATCH.

## qc-novice on the plan (FAIL, qc-novice.md) taken in. These replace rules 2c, 6 and 7b where they differ.
- N1 (B3, the figure is never lost): the figure is written at once (M6, change then Undo), as a check-in with `listed` = the items not yet answered = none listed. The same reply asks about the expected items. Nothing waits on an answer.
- N2 (B1, no "before or after you looked"): the question is asked at the figure moment, so it means "already in that figure": "Has Rent (72,000, due 27 Nov) gone out of Main bank yet? Yes / Not yet / I don't know". Yes ticks it dated its landing day (or the day they say), inside the figure. Not yet: one more check-in listing Rent (so a later tick lands after the figure, BI1). I don't know: nothing more is written.
- N3 (B1, a later tick after "I don't know" or after no answer): the assistant asks "What day does your bank app show next to it?"; on or before the figure's day it lands inside the figure, after it lands after. "I don't know" files it the day after the figure, the safe side (the app never thinks they have more than they do), and says in one line that a new bank figure will set it right. This is `afterFigure` in rule 2c, always with this defined default, never a refusal the person cannot get past. The screen row asks the same way.
- N4 (B2, C2, C5, the figures in words): after a figure with items unanswered, the reply gives both readings in one line ("If Rent has gone, about 48,000 is left to spend; if not, you are 50,000 over"), and Rent stays on the list until answered. When a later tick raises safe to spend the change card says why ("Rent was already in your bank figure, so it is not taken off again"). The rest of the gap gets the check screen's choice: "Log it as a spend now" or "Leave it".
- N5 (C1, C3, C6): answers as the chat's choice buttons where the chat has them; up to three items in one question, more as a tick list in the chat (all ticked, untick what did not happen, plus I don't know); a card's payment is asked in the card's words ("Has Card A's 31,000 been paid off yet?").
- N6 (C4): each landed item may carry its own amount ("yes, but it was 73,000").
- WATCH: an item answered "not yet" that is days late is asked about again (the late list already exists; the nudge is for later).
- For Mako's run: on the "I don't know" path, which reading is the big number until they answer.
