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
4. Nothing in lookahead changes: a tick dated before a check is already handled by the check gap rule (it shrinks the gap of that check). The reference model and the checker are untouched.

## The assistant (chat3_core.js and the same in ask3_core.js)
5. bank_figure and card_figure take two more fields: `landed: [refs]` and `notYet: [refs]`, the expected items for that account due on or before today (res.checkIn.toConfirm, for a card its payment from its paying account).
6. If any such item is in neither list, the step is refused with a question to ask first, one question naming each item with its amount and day: "Before I put in 204,000: has Rent (72,000, due 27 Nov) come out already?" (wording to qc-voice). Same pattern as the "card or bank?" question that exists today. An answer "I don't know" lets the assistant send the figure with `unsure: true`: those items are not listed (rule 2) and stay expected.
7. The step writes ONE check-in: the figure, the items in `landed` ticked at their landing day (or a day he named), all asked items in `listed`. One change card, one Undo for the whole of it. The card shows "Rent paid on 27 Nov" beside the figure line.
8. The `landed` step (a tick on its own, "rent came out on the 27th") is unchanged; with rule 2 it can now be dated the 27th after a figure given without a list.

## Tests (failing first)
- engine/test/checkin.test.js: (a) MAIN 24's worked example: a figure check-in with listed [] on 30 Nov, then a tick of Rent: dated 27 Nov (its landing day), and the bank in lookahead stays 204,000; Free to spend down by the unlogged 10,000 only (worked by hand from the book). (b) The same with listed [Rent] and Rent left unticked: the tick is dated 1 Dec, as BI1 today. (c) A check-in without `listed` (an old record): the old date. (d) Nine record orders give the same dates.
- app3/tests (node, the chat core's real handle with a fake tool call, as in act3 tests): bank_figure with Rent expected and no answer is refused with the question naming Rent, 72,000 and 27 Nov; with landed [Rent] it writes one check-in with the tick on 27 Nov and listed [Rent]; Undo removes both; with unsure it writes listed [] and Rent stays expected. A weekly earner three weeks away: the question names all three pays (joins item B).
- The screen check-in still writes listed = its whole list (a page test that reads the saved record).

## SCHEMA_V3 7.2, one line
"A check-in lists the expected items that were in front of the person (`listed: [occ]`); a later tick of an item is dated after a check only when that check's check-in listed it [BI1]. A check-in with no `listed` (written before 26 Nov) counts as having listed everything."

## Not in this slice (scope)
- "I got paid" after three weeks away ticking every pay since the last check (item B, next).
- A debit that came out before its day (item C, next): the assistant's `landed` step refuses an item not yet due.
- A statement or screenshot reader (M99, not built): it must pass `listed` the same way when it is built.
- An older build ticking an item on the other device dates it the old way (later); it never loses money, only the day. WATCH.
