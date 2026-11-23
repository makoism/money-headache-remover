(qc-foundation review of the version one sync, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

No saved-shape change is needed: every fix below fits the existing fields (`gone`/`goneBy`, `kept`, `sync.base`/`baseRev`, the `kept` store). But the sync spec and the reference are missing three rules the engine needs, and two decided answers (AT2, AT3) were never applied. If the engine is wired to the current reference, it will need changing later. All of these are cheap to fix now.

## FOUNDATIONAL (spec and reference, not the saved shape)

**1. Money counted twice when a tick or a typed spend on one device meets a statement read on the other.**
- The life: Mako opens the phone on the train with a poor signal and ticks rent (80,000) at his check-in. He also types a 1,200 coffee. Before the phone has pushed, he imports the bank CSV on the desktop.
- What happens: on the desktop, matching (SCHEMA 6.4) settles rent with the import line, because it never saw the phone's `set:` tick or the coffee. After the sync, both pairs stay live. The bank shows 162,400 out instead of 81,200. Rent's occurrence is settled by two records. No question is asked, and the H9 possible-double check does not catch it (it compares typed lines only, matching_ref.js:216).
- Reproduced in /tmp/foundation_sync/double.js, with the desktop side worked by matching_ref.applyImports.
- Cause: the AQ4 after-sync checks (sync_v1_ref.js afterSync; SCHEMA section 0 "After a sync") cover X8, closed accounts, the minimum and places over what they hold. They do not re-run matching, and they do not check that one occurrence is settled only once. sy-46 only covers the case where the importing device already knew the coffee.
- The fuzz cannot see this: its `importStatement` never matches and its `tick` never meets an import.
- Needed: after a sync, run 6.4 matching between import lines and typed or `set:` records that came from the other device. It is the same rule as on one device, so the same `gone`/`goneBy` writes and no new field. Also add the invariant "no occurrence settled by two live records".
- Cost: about 2 to 4 hours now. Later it would mean an engine change plus repairing doubled ledgers on real copies.

**2. A first sync with no base silently doubles the whole setup.**
- The life: Mako sets up on the desktop, then on the phone goes through setup before turning the cloud on.
- What happens: `sync(undefined, phone, desktop)` joins two banks, two Pay schedules and two openings (800,000 instead of 400,000). Its only question is about `home.main`. Reproduced in /tmp/foundation_sync/nobase.js.
- Cause: AQ1 and SCHEMA 2.3 never say what a device with its own data and no `sync.base` does. The fuzz always starts from a common base.
- Needed: a rule that "a copy with no base meeting a cloud copy asks which whole copy to keep", with the other copy going to the existing `kept` store. AB1 already covers the 38.31 move.
- Cost: about 1 hour now.

**3. AT2 contradicts itself, and the reference still follows the pre-AT2 rule.**
- AT2's rule is "the day after the old rule's next occurrence after the last settled one". Applied to the insurance paid 31 May 2027, that gives an offer from 1 Jun 2028.
- AT2's own worked example says "from 1 Jun 2027, first new payment 15 Jun 2027". That is a second ¥60,000 two weeks after paying it, which is exactly what the rule is meant to prevent.
- sync_v1_ref.js x8Questions still offers due+1, and sy-23, sy-24 and sy-25 expect it. So the quarterly bill paid 5 Mar is offered again on 20 Mar, and the June bonus paid 10 Jun again on 10 Jul. The look ahead would hold back an extra payment that never comes, so the amount set aside is wrong, though too much rather than too little.
- Fix the AT2 text, then the reference and those three cases.

**4. AT3 (one question for a main-bank switch plus a minimum change) is not in the reference.**
- In 200 seeds the pair was asked as separate questions 4 times; in 5,000 seeds, 57 times.
- Seed 77 asks three questions about one situation ("minimum", "which account", "which home.main"). Answered one by one, picks that do not fit together can produce a fourth question.
- AT1 to AT3 appear nowhere outside DECISIONS_ROUND2.md.

## Question 1: the fuzz invariants
The five invariants are right, but they do not cover these:
- **Money once.** Each real purchase or occurrence is one live record across typed, ticked and imported. Missing; finding 1.
- **No common base.** Missing; finding 2.
- **A refused write.** syncDevice in the reference fetches, joins and writes in one step, so a write refused partway through is never tested. I added it to the copy and it passes when the retry uses the copy it took as its base.
  - In a hand case (/tmp/foundation_sync/race.js), an engine that kept the older base would ask Mako "which rent?" about two edits he made himself on the desktop. The spec ("the revision it last took") is right, but no case pins it.
  - Add sy-62, and save the base together with the joined copy before pushing.
- **Only items both devices changed are asked.** Added to the copy; passes.
- **A device away for several of the other's syncs.** The fuzz always syncs both devices every round. In /tmp/foundation_sync/away.js the phone does 2 to 4 edit, sync and answer rounds while the desktop is away, then the desktop returns. 500 seeds pass: nothing lost, and nothing asked about items only the phone changed.

The extended copy, /tmp/foundation_sync/fuzz_copy.js, passes 5,000 seeds.

## Question 2: how many questions per sync
In 200 seeds there were 406 syncs:
- no question: 293 (72%)
- one: 71
- two: 35
- three or more: 7 (at most 5)

This is a stress mix: most schedule edits hit the same three schedules. Over 5,000 seeds the shape is the same. The "which" questions by kind: schedules 38, accounts 34, events 26, home 17, budgets 7, places 5, limits 3, shares 2, cats 2, check-ins 1.

Questions Mako cannot really answer:
- **Which closing transfer** (`close:<acct>` with two amounts, seed 100). The right figure comes from the joined events, so neither version may be right. It should be worked out again, not asked.
- **Which version of a check-in**, where the two differ only in their `settled` lists. He cannot judge lists of ticked ids.
- **A schedule changed two compatible ways** (renamed on one device, a new amount step on the other). He has to pick one whole record, but the true answer is "both". The per-entry `at`/`by` is still written (AQ5), so "keep both" can be offered without a shape change.
- **The "shares" question** offers only "undo the newer placing". If he wants the older one undone instead, the check keeps failing.

## Question 3: ten cases hand-checked
- sy-06, sy-14, sy-21, sy-36 (8,000 - 7,300 = 700 left), sy-41 (Waiting at -100,000, undo 12:03) and sy-54: correct by my own working.
- sy-46: the merged `told` values are right.
- sy-23, sy-24 and sy-25: correct against the old rule, wrong against AT2 (finding 3).
- Side note on sy-54: its restore drops a `steps` entry outright instead of marking it `gone`, which SCHEMA 2.3.1 forbids. That is harmless while v1 joins whole records, but the input is not a valid restore.

## Question 4: saved shape
Nothing needs a saved-shape change. Two things to watch:
- The shared `kept` list is missing from the SCHEMA 2.1 shape block, and IndexedDB also has a store named `kept` that means something else. Rename one of them before the engine is wired.
- While a "which" question about money waits, the newer version shows (SCHEMA 2.3), so a higher pay or a lower bill can make safe to spend too high. Count the safe side across the kept versions, as AR1 does for `once`. That is an engine rule; the data is already there.

## WATCH
- **Restore.** Restoring a backup gives every record a new `at`, so everything the other device edited since the last sync becomes a question, even where the backup's content equals the base.
- **Stage 2 rich merge.** The data needed for it is still written (per-entry `at`/`by`/`gone`), so it can come later without a data move.

## Checked and sound
- Compare and swap with the right base.
- Symmetry, and merging twice changing nothing.
- Import ids being stable across CSV and PDF, and the same statement read on two devices.
- A device back after weeks away.
- Answers made on both devices while offline being asked again.
- A shop lesson beating a reader's guess.
- The closing check.

Files are in /tmp/foundation_sync/:
- fuzz_copy.js
- double.js
- nobase.js
- race.js
- away.js
