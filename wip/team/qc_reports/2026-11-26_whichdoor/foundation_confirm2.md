PASS. The open finding is gone, both builder points are closed, and nothing around the fix broke. Two small builder points are left. Neither needs a change to the engine or the saved data.

Confirming run on lane/whichdoor at 0b04cb81 (fix commits 983c0e0a and 0b04cb81), against foundation_confirm.md.

## (1) Is the open finding gone? A whole-copy answer deleted settings items, and they came back at the next join.
**Yes.**
- `swap` no longer deletes a settings item that the kept copy lacks. It writes `{ v: null, at, by, gone }` with a new `at` (act3.js:178-181). `syncDiff` now walks into a holder that one copy lacks (act3.js:228), so a whole `plan.limits` or `ui` that the kept copy never had is marked item by item.
- SCHEMA_V3 2.1 now names the marker and the rule that readers treat `v: null` as not set.
- I ran the chains myself (script: /tmp/claude-0/-home-user-money-headache-remover/789e255b-c0db-5f9f-a72c-2afd00748993/scratchpad/c2.js):
  - **The other device pulls the answered copy the way it really would** (`syncDevice` with its own base, after logging a spend): the ceiling stays not set and no question comes back.
  - **Undo after that join:** the value comes back with a new `at` and stays after the next join. The whole-copy question returns, which is what Undo should do. So the Undo holds (M14).
  - **The other device changed the same ceiling before it saw the answer:** one "which to keep" question about the ceiling, and the look-ahead runs. That is the right outcome under M20, not a fault.
- **Readers of the marker.** Every field reader I found goes through `fieldValue` and then `||`, so null is read as not set:
  - lookahead.js:71-72, ledger.js:35, periods.js:73/116/150/161, move.js:583, ask3_core.js:134, chat3_core.js:509, plan3_write.js:34/270, remind3.js:28.
  - The `imports.cats` readers skip entries marked `gone` (stmt3_plan.js:270-283).
  - `ui` has no reader in app3.
  - The writers (stmt3.js:215, catsToKeep) write fresh entries, so a later real value never carries an old `gone`.
- The tests in act3_sync now include the chain asked for last time, as `[F1 chain]` and `[marker]`. I ran them: 16 of 16 pass. check3.txt at 0b04cb81 ends with ALL GOOD. The build (index.html) carries both fixes.

## (2) The two builder points from last time
- **A record that was already gone got marked again.** Closed: act3.js:174 returns the record unchanged. I checked that the `[WATCH]` test really reaches its checks (its early returns do not fire), so it is not passing by skipping.
- **Check questions did not carry the paint-time mark.** Closed:
  - paintQuestions3 takes `ACT3.ver()` at paint time for every check question (cloud3_page.js:549-550).
  - answer3 passes it as `ver` (cloud3_page.js:576).
  - The door refuses with `other` when the book changed (act3.js:328), and the page shows the STALE3 words (cloud3_page.js:577).
  - The "which" rows still use their own row stamps (cloud3_page.js:567).

## Builder points left (no change to the base)
1. **A settings item that is already not set gets marked again.** `swap` does not check whether `old.v` is already null, so a second whole-copy answer that leaves the item out gives the marker a new `at`. An earlier answer's Undo is then refused with "Something changed it since". This is the same fault as the record one just closed, on the settings side. Fix: when `old.v === null && old.gone`, return `old`.
2. **Two places in the engine still read `.v.min` without a guard:** `copy.home.main.v.min` at sync.js:529 and `out.home.main.v.min` at sync.js:609. They would throw if `home.main` were ever the marker. Today that cannot happen: setup always writes `home.main` (build_book.js:60-61, 107), so a copy with no `home.main` would have no setup at all. Guard them the same way as sync.js:521 and 527 so the SCHEMA rule ("every reader") holds without exceptions.

## OWNER'S WORDS
- M61 (nobody loses data): **met**. Records and settings items are marked, never deleted, and a join keeps what the person chose.
- M14 (Undo everywhere): **met**. Undo of a marked item stamps it newer and lasts across a join. Undo of an item the answer added now marks that item rather than deleting it.
- M20 (asks which to keep): **met**. A whole-copy choice holds. A real two-sided change to one item is still asked.
- M42 (minimum never set for the person): **met**. A minimum the person chose against does not come back.
- M36, M44, M67, M69: **met**.
- M1 and M17: **silent, on purpose and queued**. The assistant still cannot see or answer the waiting questions.
- Sections A to D and F have no other lines this fix touches.

## GRID (kinds of record this fix touches: records in lists and settings items, through the "which to keep" answer)
- Actions checked for each kind: add, change, remove or end, and undo of each. Each checked from the screens and from the assistant's named actions.
- 16 cells: 8 covered, 0 not applicable, 8 empty.
- All 8 empty cells are the assistant's way in. It has no named action to answer a waiting question. That is a builder item and already queued. It does not need a base change, because `answerSync` is the door it would call.

## FOUNDATIONAL
None.

## WATCH
- **Restore from a backup and the copy pulled from the cloud.** The SCHEMA says a restore gives every field the backup's value. I did not check what a restore does with a settings item the backup lacks. If it deletes the item, the cloud's value comes back at the next join, the same fault as the one just fixed. The restore should use the same marker. This is not in this branch. It should be checked when the restore door is next touched.
- The open data-safety blocker (Delete the cloud copy has no Undo and deletes the kept versions) is outside this branch and still open.

## Checked and sound
- `swap`'s three paths: records marked, records already gone left alone, settings items marked.
- `syncDiff` walking into a missing holder.
- The Undo journal: the `own` stamps and `laterSwap` still match after a marker is written.
- The merge in sync.js (`walk`, `item`): the newer `at` wins, and a change on both sides is asked.
- The tests and the check3 log.

## NOT CHECKED
- The full check3 run by my own hand: I read the log at 0b04cb81 and did not run it again.
- The browser tests e3_cloudwhich and e3_cloudwhich2: I did not run them myself.
- The restore door (see WATCH).
