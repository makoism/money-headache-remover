(saved by LANE F from the reviewer's reply; the reviewer did not write the file)

FAIL (narrow). F1 is fixed for records, and I proved it by running it. One part of F1's own cause is still there: a whole-copy answer still deletes settings items and other keys that are not records, and those come back at the next join. Nothing else around the fix broke.

This text is for foundation_confirm.md in /home/user/whichdoor/wip/team/qc_reports/2026-11-26_whichdoor/. I did not write the file, because my role says the caller saves it.

## (1) Is F1 gone?
**Plan:** yes. The plan now says the door marks a record gone and never deletes it, including on Undo.

**Build, records:** yes.
- `swap` turns "take it out" into `gone`, `goneBy` and a moved `at` (act3.js:168-173).
- Undo of a record an answer added marks it gone (act3.js:403).
- I ran the chain the first report asked for: a whole-copy answer through the door, then the other device logs a spend, then `S.sync`. The record left out stays gone and no question comes back. Script: /tmp/claude-0/-home-user-money-headache-remover/80262f40-2458-5016-9e4f-87ab1f713f3a/scratchpad/wc2.js. The F1 test in act3_sync.test.js:125 checks the mark and Undo, but it never runs a join. That chain should be added as a test.

**Build, settings items: still broken (FOUNDATIONAL).**
- A whole-copy answer deletes every non-record key the picked copy lacks. For a settings item, `swap` with nothing to put back deletes the key (act3.js:204).
- At the next join, sync.js:188 fills a missing side from the base, so the cloud's key returns.
- Run: the cloud copy has `home.zzExtra` and the picked local copy does not. After the answer the key is gone. After the other device's next sync it is back with the cloud's value.
- Who it hits: a person who set up on two devices, has a fuller cloud copy and picks the other one. The cloud's `home` items (main bank, minimum, mode, country) and any top-level map entries (`imports`, `ui`, plan maps) return and mix into the copy they chose. A returning `home.main` can point at an account the answer marked gone.
- This breaks M20 (the choice does not hold), M42 (a minimum they chose against comes back), M61 and M36.
- Why it is in the base: the saved data has no way to say "this setting is not set any more" that survives a join.
- What it needs: the door writes a marker instead of deleting (for example `{ v: null, at, by }` for a settings item), readers treat that as not set, and SCHEMA_V3 says so. Or the engine's whole-copy answer keeps the key and marks it. Add a chained test: answer, then the other device syncs.
- Cost: about half a day now. Later it means untangling mixed copies.

## (2) The places the fix touched
- **answerSync** (act3.js:440): the engine makes the answer and the door writes what differs. The engine check, journal, queue and listeners all run. Sound.
- **The which-to-keep answers** (answer3, cloud3_page.js:563-574): the stale-row check still runs first. Sound.
- **Use the other one** (useOther3, cloud3_page.js:521-529): it finds the version by content on the current book and refuses with STALE3 if it is not there. Sound.
- **The check answers** (answerCheck, cloud3_page.js:570-572): they go through the same door. One gap the builder should close (it does not need a base change): plan item 6 says the whole-book mark (`ver`) is passed from paint time, but neither call passes it. A check question with no row stamps (x8, closed) is answered against whatever the book is now, even if another tab answered it first.
- **undoAnswer3 and pickVersion3** are gone. Undo after a reload works for item answers. A whole-copy Undo after a reload is refused in the plan's words and names no button (F2 closed).
- **Tests:** act3_sync passes 12 of 12 when I run it. The check3 log shows e3_cloudwhich (26) and e3_cloudwhich2 (23) passing, and the full run shows ALL GOOD.

## WATCH
- **An already-gone record gets marked again.** `swap` does not check `old.gone` (act3.js:170). If a whole-copy answer leaves out a record that was already gone, its `goneBy` and `at` change, so the earlier Remove's Undo is refused. Skip records that are already gone.
- **The assistant cannot see or answer waiting questions** (queued, M1 and M17).
- **The open data-safety blocker** (Delete the cloud copy) is outside this branch.

## OWNER'S WORDS
- M61: met for records, broken for settings items.
- M14: met.
- M20: met for plan records, broken for a whole copy's settings.
- M67, M69 and M44: met.
- M1 and M17: silent on purpose, and queued.