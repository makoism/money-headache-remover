# qc-foundation, confirming run on AMOUNT_HISTORY_PLAN.md (way in only, 26 Nov 2026, lane/amounthist at 7fd46ccd)

FAIL, on one point that is cheap now. The new assistant step goes through act3 `edit`, so the assistant's correction and the screen's write the same record and the same `was`, and give the same figures. Removing a record is now a correction to 0 in the rule sentence. But the saved data cannot tell when a removal happened as exactly as it tells when a correction happened. A removal saves only a day (`gone = s.day`, act3.js:140). A correction saves the step's `told`, and checks are ordered by `told` (lookahead.js:128-130). So on the day of a check, removing and correcting down can give different answers. Add one word to the plan and the FAIL goes. Everything else below is for the builder.

## OWNER'S WORDS
- M1, M3, M4 (AI first, full control, "here are my new receipts"): met by the plan in intent (taken-in point 1). Three builder points are needed for the step to work in the plan's own walk (see Builder points 1 to 3).
- M6 (change, then show what changed, Undo, ask first for deletes, for changes over safe to spend and for amounts never typed): partly met. The step is an edit, and Undo comes from the journal. The plan does not say which figure the "over safe to spend" test uses, which figure counts as typed, or what the card shows when nothing moves (Builder points 2 and 3).
- M13, M14 (change every kind of thing, Undo everywhere): met for the amount. Changing a spend's date, account or line through the assistant is still missing, and the plan does not name it (Builder point 4).
- M36, M45 (adds up, no coin counted twice): met for corrections. On the day of a check, removal is not met (FOUNDATIONAL).
- M61 (nobody loses data): met. Removal still keeps `a` (act3.js:134-142).
- M98 (walk as a person): met. The walk now includes the person who tells the assistant.

## GRID (spend and refund amounts after a check, way in only)
Actions: change amount, remove, Undo of each. Ways in: screens and assistant. Kinds: bank spend, card spend, refund. 18 cells.
- Covered by the plan: 16. Change amount on screen 3 and through the assistant 3 (act3 `edit`, one writer). Remove on screen 3 and through the assistant 3 (both use act3 `remove`, chat3_core.js:617-621 and 677). Undo of a change 2 (the journal keeps `before.was`, which is the same for both ways in, so it counts once per action).
- Empty: 2. Undo of a removal made after a check, on screen and through the assistant. The record's removal moment is not saved (FOUNDATIONAL), so the engine cannot tell whether a removal it is undoing happened before or after the check.
- Outside this grid, named for scope: changing a date, account or line through the assistant (Builder point 4).

## FOUNDATIONAL
1. The removal moment is saved as a day only.
   - Who and when: Mako does his Sunday bank check on 29 Dec. It shows 700 more in the bank than the app expected, because he logged one lunch twice. That afternoon he removes the copy, or tells the assistant "that lunch is in twice".
   - What the base holds: act3 `remove` sets `r.gone = s.day` and a new `at` (act3.js:140). The step's `told` goes only into the journal (act3.js:272), and the journal is not the record. The engine leaves out every removed record (`live()`, lookahead.js:215). It orders checks by `told` (lookahead.js:128-130).
   - So the engine cannot know whether a removal on 29 Dec came before or after the 29 Dec check. If the record is treated as removed before the check, its period drops by 700. If it is treated as removed after, its period keeps the 700 and the check's period takes the minus 700. Correcting the same record to 0 that afternoon writes `was: [{a: 700, told}]` and lands without doubt on the second answer. So correcting down and removing do not agree on a check day, and a check day is exactly when people find copies.
   - The `at` clock cannot stand in: the plan already ruled it out (taken-in point 3).
   - Needed in the plan: when act3 `remove` removes a spend or a refund, it also saves the step's `told` on the record. Either add a `was` entry `{a, a2?, told}` so that a removal is a correction to 0 by construction (my recommendation), or add a field such as `goneTold`.
   - The engine walks removed records with a removal moment the way it walks corrected ones: live up to that moment, 0 after it.
   - Restore and Undo of a removal: the journal's `before` must carry that entry, so putting the record back takes the entry away again.
   - Removals saved before this slice have no moment. They keep today's "never happened" rule. Name this in scope.
   - Cost: now, one field and one test, "removed the same afternoon as the check equals corrected to 0 the same afternoon". Later, every removal saved before the fix has only a day, and its period's figures stay uncertain for good.

## Builder points (no saved-shape change; put them in the plan's text and tests)
1. The way to the record. The assistant finds a spend only through `list spends`. That list shows only typed records, and only the last 30 on one account (chat3_core.js:535). In the plan's own walk, the card's lunch from 20 Dec, corrected on 12 Jan, is past the last 30 for anyone with about two card spends a day. Then the assistant has no S ref and falls back to a new record. Add a day or a range of days, and an amount, to that list. Add a test in which the record is older than the last 30.
2. The ask-first figures (M6). The step's `amount`, which the "more than safe to spend" test reads (chat3_core.js:837), should be what the correction moves safe to spend by. That is the engine's figure before and after, not the new amount: 7,000 would ask even though nothing moves. `figs` should be the new amount only, so that "7,000" counts as typed and "add a zero" asks first. A correction to 0 should count as a delete and ask first, the same as `remove`.
3. Showing what changed (M6, M12). After a check, the correction moves nothing on the card (rowsOf, chat3_core.js:680-695). That is right, but it reads as if nothing happened. Show the same split that Receipts shows (`res.splits`, taken-in point 4): "Lunch 20 Dec: 700 stays in 10 Dec to 9 Jan, +6,300 counted at the 29 Dec check". Then the assistant, Receipts and the card all say one thing. Add `edit` to the door's direct actions (`ACT`, chat3_core.js:677). Today `edit` would fall through to `door.run` with a write kind that does not exist.
4. Scope: through the assistant, a spend's date, account and line still cannot be changed. The write door can do it, so this is a screen-level gap and not part of the base. Name it in "Not in this slice" with its follow-up, so that it is not lost (M13).

## WATCH
- A record removed before a check and put back after it is a record told late. The engine should hold it by the restore's `told`, the same as CHECKGAP's late rule. The `restore` path (act3.js:154-160) also saves no moment today. Cover it in the same fix as FOUNDATIONAL 1.
- M99 receipt batches: one Undo for the batch must take back the `was` entries of every corrected record in that batch.

## Checked and sound
- The assistant's correction and the screen's go through one writer (act3 `edit`, act3.js:196-208). The `was` entry is written there, so the figures are the same by construction. The plan's test "assistant equals screen" guards this.
- The assistant's remove and the screen's remove are the same act3 `remove`, so the removal rule applies the same way to both.
- The `seen` stamp refusal (act3.js:80) also covers an assistant edit of a record that changed on another device.
- Restricting the new step to amounts only matches the plan's scope ruling (date and account after a check keep today's rule).

## NOT CHECKED
- ask3_core.js (the other assistant path), which only shares the action list.
- Whether the plan's `res.splits` reaches engine/periods.js the same way (the money side, outside this run).
- The money rule and the saved shape beyond removal (told not to re-review).
