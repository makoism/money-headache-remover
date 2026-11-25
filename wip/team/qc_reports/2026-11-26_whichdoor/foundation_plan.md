# qc-foundation: WHICH_DOOR_PLAN.md (plan review, 26 Nov 2026)

FAIL

Routing every "which to keep" answer through the one door is right, and most of the plan is sound. One part of it writes a fault into the door: `swap(where, of, undefined)` takes a record out of its list. That is a real delete, and in this base a real delete does not last. The record comes back after a reload (from the store) and after the other device syncs (from the three-way join). Fixing it needs a door rule change (and maybe an engine one), so it has to be settled before building. I checked this by running the engine, not only by reading it.

## OWNER'S WORDS
- M61 nobody loses data: mostly met. **Broken** for a whole-copy answer and for the Undo of "move what is left" (F1).
- M14 Undo everywhere: met for item answers, including after a reload, which is new. **Broken** for a whole-copy answer after a reload: the refusal tells the person to use "the other copy in Settings", and that button does not exist (F2).
- M20 ask which to keep, the other stays for Undo: met for plan records. **Silent** on settings items and the whole copy, which have no "Use the other one" (cloud3_page.js:502-503).
- M67 money that happened joins up: met.
- M69 safety first: met (engine check, stale-row check, whole-book mark).
- M44 one dataset: met (one writer). M45 no coin counted twice: **broken** by F1.
- M66 mark deletes: **broken** in spirit. The door's own rule is "marks gone, never deletes" (act3.js:14), and swap-undefined is the first true delete through the door.
- M36 the picture adds up: broken by F1 (a closing transfer that was undone comes back).
- M1, M3, M17 AI first, full control, ask anything: **silent, said so on purpose** (plan, "The main way in"). The assistant cannot see waiting questions at all: no ask3 or chat3 file reads keptVersions or afterSync. "Why is my rent there twice?" gets no answer. Fine for a plumbing fix; it goes on the queue.
- M5 screens for checking, M13: not touched. Sections C and D money rules: not touched, because no money is worked out in the door.

## GRID (answer kinds by what a person needs)
Kinds: plan-record answer, settings-item answer, whole copy, x8, closed (reopen or move), minimum, main view. Columns: answer from the screen, answer from the assistant, Undo in the same visit, Undo after a reload, change the choice later.
Out of 35 cells: **22 covered** (2 of them faulty), **3 not applicable** (changing your mind later on x8, closed and minimum, where Undo covers it), **10 empty**:
- Assistant answer: all 7 empty. A builder finding, not foundational: the door action `answerSync` makes it cheap to add as a named action later.
- Undo after a reload, whole copy (more than 50 swaps): empty. The plan refuses it by design.
- Change the choice later, settings item: empty (otherLines3 skips anything that is not a list, cloud3_page.js:503).
- Change the choice later, whole copy: empty (skipped at cloud3_page.js:502). See F2.
Covered but faulty: Undo in the same visit for the whole copy and for closed "move" (F1).

## FOUNDATIONAL

**F1. A record "taken out of its list" comes back.**
Who: Ana, cash and e-wallet. Her old e-wallet is closed with 1,240 left. She answers "move what is left to my main bank" (sync.js:601-605 adds the event `close:<acct>:1`). Then she remembers she took it out as cash, so she taps Undo. Under the plan, Undo puts back `before`, which is undefined, so the record is taken out of `events`.
- **Reload.** act3 saves through E3.put, which calls saveR() with no `replace` (e3.js:156). store/idb.js:141 and 155-162 write only the records that changed and never delete stored events. load() reads back every stored event (idb.js:124). After a reload the 1,240 transfer is back, and her bank is 1,240 too high.
- **The other device.** Mako sets up on his phone and his desktop before turning on the cloud copy. The desktop asks which whole copy to keep (AW2) and he keeps the phone's. The engine's answer deletes the desktop's records (sync.js:562-565). I ran it: with the cloud unchanged, the pick holds. If the desktop copy logged one spend before the answer arrived, the next sync gives `ev-d1, ev-d2, ev-p1`. The 500 spend he chose not to keep is back next to the phone's copy of the same spend, so it is counted twice. The cause is sync.js:186-189: "a side that lacks it never changed it". Script: /tmp/claude-0/-home-user-money-headache-remover/1dda7473-2237-5ea7-bb3e-f14edcc6155a/scratchpad/wc.js.
- **Why this is in the base.** The saved data has no way to say "this record left". Only `gone` does that, and both the store and the join honour it. The plan makes delete-by-absence a door operation, which is the opposite of the door's rule.
- **What the base needs.** syncDiff turns "in cur, missing from next" into "marked gone" (with `goneBy` set to the step and the step's `at`). Undo of an added record marks it gone, as Undo does today (act3.js:336). The engine's whole-copy answer should do the same: mark the dropped records gone instead of deleting the keys. The plan's risk test then compares the records that are not gone, not deep equality. Add a test that chains these: answer, reload, the other device logs something, sync.
- **Cost.** About half a day now. Later it means cleaning up books that already have resurrected duplicates, with no way to tell which copy is the real one.

**F2. The refusal for a whole-copy Undo points to nothing.**
Plan item 5 says "Use the other copy in Settings to go back", but no such control exists (cloud3_page.js:502). After a reload the whole-copy choice cannot be reversed from any screen, though both copies sit in keptVersions. This one is a screen to build, not a base change. The plan must either build "Use the other copy" (through answerSync, with gone-marking per F1) or keep a local copy with rec('copy') before the answer, so the backup screen's Put it back works. Otherwise M14 is broken exactly where the most data moves at once.

## WATCH
- **Journal size.** The 50-item rule counts items, not bytes. A whole-copy answer where the two copies differ by 50 items or fewer (the likely case: the same data with a few edits) journals `before` of `kept:copy`. That is two whole books, each with its own 200-entry journal (strip at sync.js:353 keeps `journal`). If `after` is journaled too, it doubles. The journal goes to the cloud, which caps at 3,000,000 base64 characters (functions/api/vault/[id].js:11). Gzip makes this safe today, but it will not stay safe with a year of statement imports plus a second currency. Never journal `kept:copy` whole (it is already kept), and cap entries by size as well as count.
- **New journal entry shape** (`swapped`). An older build on the other device that reads it in fromJournal (act3.js:240) sees no added, removed or edited records, so its Undo says "Nothing changed". That is harmless, but say so in SCHEMA_V3's journal notes before the multi-account work adds more entry kinds.
- **keptVersions joining PATHS** (plan risk 2). The Undo-by-`grp` scan (act3.js:329) will walk kept records too. They carry no `grp`, so this is fine, but a test should prove it.
- **Server pieces.** The plan names none. It depends on the vault being on, VAULT_WRITES_PER_DAY (1,500) and MAX_BLOB. An answer is one write, so the cap is fine. List them in the plan.

## Checked and sound
- One step per answer: one save, one cloud send, one Undo bar (act3.js:277-301). The engine stays the only judge of what an answer means, and the lookahead check runs (act3.js:267).
- Undo of an item answer: putting back `before` with a new `at` wins the three-way join on the other device (sync.js:193-195). It is refused when the record changed since. Restoring kept:<of> brings the question back with ask set.
- The stale-row check plus `ver` covers keptVersions already (act3.js:354-367 skips only `rev` and `journal`).
- E3.put's "behind" path joins and refuses on a new conflict (e3.js:159-170).
- Lives: paid on the 10th, twice a month, every two weeks, weekly, freelance with a zero month, set up on the 20th, a couple on one phone. None of their money rules pass through this change: the door carries engine books and works out no sums. Cash and e-wallet is the one life it hits (F1). Cents against yen: no amounts are made here.

## NOT CHECKED
- I did not run the existing e3_cloudwhich tests or check3.sh.
- I did not walk answerCheck 'shares' through the plan (it is not in the plan's list, but it is in sync.js:623).
- I did not confirm the vault binding and settings on the live site.
- I did not read the persona files on side/persona-walks for this plumbing plan.
