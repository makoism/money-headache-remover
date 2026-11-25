FAIL (two small id and reader points, both cheap now; everything else from review 2 is answered)

Plan: wip/team/foundation_review/CASH_PLAN.md, section 13 read as winning. MAKO_SAYS.md to M99.

## Review 2, finding by finding
- N1 cash: MET. Ordinary ids tagged `cm: { occ, acct }`, a second Done is a second record, and a two-phone double is asked, never dropped (M36, M45, M61, M67).
- N1 extra: MET for the id. `ex:<income>` names the money answered, so two phones meet on one id and go to "which to keep" (sync.js:214). A bonus or a freelancer's money in has its own record id, so no month name is needed. periodOcc reads only `pe:` and `ps:` (ids.js:24 to 28), so an `ex:` record is never taken for a period end (lookahead.js:370). Good. But see N7.
- N1 `lt:`, prefixes in ids.js `built` and sync.js:76 `BUILT`, realistic-ids tests: MET.
- N1 `gp:`: see N8.
- N2: MET. A `pct` step carries its own `per`, the line's `per` is untouched, and the Ramil test pins past periods to the yen.
- N3: MET. `each` is new in this plan (section 3), so steps cost no migration. Ending is a 0 step with a door and Undo.
- N4, N5, N6, M16, currency door: MET. N6 keeps the period named by one occurrence, so `ex:<occ>` stays the same on both phones.

## OWNER'S WORDS
M12, M20, M45 now met apart from N7 and N8. M16 now met. M36, M61, M67 at risk only through N8. M27, M28, M37, M77, M88, M89, M90 (R5 goes to Mako as a question), M91 and M92 (watch kept): still met. M42, M48, M50 silent, as before (section 13 does not touch them). Nothing review 2 found met is broken.

## GRID
Review 2's 80 cells: the 6 empty ones are now covered (second withdrawal x2, bonus answer x2, goal end x2). Covered 74, not applicable 6, empty 0.
New pair: a second answer to the same income on a later day (Ben splits 30,000 of 80,000, taps Later, splits the rest on the 20th). Same id `ex:<occ>`, so act3.js:113 refuses an add. The shape holds it if the second answer edits the record (act3 `edit` exists). Builder: say "a later answer to the same income edits its record", both doors, with Undo. Empty 2.

## FOUNDATIONAL
N7. The `ex:` record's place 'extra' is a place nothing fills.
Who: anyone who taps Split. What the engine does: sync.js:499 takes every move off `e.place`, so 'extra' goes below zero, and sharesQuestions (sync.js:508) skips only 'free', so every join raises a "shares" question for 'extra' with nothing to undo (its undo list reads only `move` records). The ledger does the same at ledger.js:124: a negative place 'extra' appears, while Waiting, where the money with no job really sits (ledger.js:65 to 97), stays too high by the same amount.
Needs: the source written as 'waiting' (the word the ledger and sync already use for money with no job), and `ex:` records left out of sharesQuestions because the new after-join check judges them. Add a two-book join test that expects no shares question.
Cost: one saved word now. Later: rewriting `place` on every saved extra answer.

N8. `gp:` is one record per period, but for a goal in its own account (M43, and "split my bank", section 11 item 2) it is real money moved.
Who: Ben and his partner. Savings is its own account. Each moves 10,000 more into it on the 20th, offline on their own phones. Both edit `gp:<period>:savings` from the same base, the join keeps one, and one real transfer sits only in the Undo copy: the bank figure is 10,000 off (M36, M67).
Needs: when the goal has its own account, `gp` moves follow the cash rule (ordinary ids tagged `gp: { period, goal }`, an after-join check that asks); the built id stays only for a place move inside one account.
Cost: an id rule now. Later: lost transfers in real books.

## WATCH
- Freelancers' `lt:<YYYY-MM>`: fine while "no fixed pay" means calendar months. If a freelancer later adds a pay schedule mid-month, two `lt:` names can cover one stretch. Read both.
- The rest of review 2's watch list stands (monthly cash trip for weekly pay, R5, the cards plan review before slice 1).

## Checked and sound
- periodOcc, namedDues (lookahead.js:233) and peEnd (lookahead.js:370) ignore `ex:`, `cm`-tagged and `gp:` records.
- The goal reader (lookahead.js:939) already counts periodEnd moves into a goal. The line reader widening is planned.
- The cash double-count question asks and drops nothing.
- No new outside piece.
