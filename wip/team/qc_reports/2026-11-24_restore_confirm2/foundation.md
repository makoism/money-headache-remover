# qc-foundation on lane/restore 99209db: PASS

Saved by LANE B from the reviewer's own answer (24 Nov 2026, round 2026-11-24_restore_confirm2). The reviewer wrote no file itself. Build judged: lane/restore at 99209db, wip/team/app3. check3.txt in this folder reads ALL GOOD (full level).

## Verdict
PASS. Both faults from the first restore round are fixed and hold in the reviewer's own runs. Nothing needs an engine or saved-shape change. Two things for the builder (one new), neither in the base.

## How it was checked
A node harness on the real pieces (build_book for setup, act3 and plan3_write for every write, the check-in writer, cloud3 with the fake vault for two devices, backup3 for restore, the look ahead for the figures). Eight lives, each with the cloud copy on (two devices) and off: paid on the 10th with two cards; twice a month; every two weeks; weekly; no fixed pay; set up on the 20th with pay already in and a minimum; a couple with a monthly and a weekly pay; cash and an e-wallet. Each life: setup, spends, a refund, a move, a bill added, a bank check with a gap; backup saved; then an overspend, an old spend changed, an old spend removed on the other device, money in, a bill changed, a card added, Free to spend changed, a statement lesson, another bank check; three weeks away; the restore; more life on both devices; Put it back five days later. At each moment the engine's whole answer was compared with the backup's on days over the next 12 months.
Result: 16 runs, 176 checks, all pass. After a restore, after the send, on the other device and after two more rounds every figure equals the backup's. Put it back equals what was there before, on both devices. The lane's own restore3.test.js was rerun: 62 pass. The page was not opened by the reviewer (tests/e3_restore.js, 49 pass in the log, stands for it).

## Owner's words
- M6 MET: Put it back and Drop it ask, with counts; restore from a file asks with a count. Restore of an earlier cloud version asks but gives no count (builder note 3).
- M14 MET. M13 MET for restore. M19 MET in the model (words are a copy matter). M20 MET by the join, with one gap (builder note 1).
- M36, M37 MET: figures after a restore are the backup's in all eight lives; a restored old bank figure is not shown as fresh.
- M42, M44, M61, M69 MET. M66: the fake vault has dated versions; the live server was not reached.
- M67: not settled 7 covers it. A record the other device logged that this device never pulled stays.
- M1, M3, M17 SILENT: the assistant has no restore, Put it back or Drop it action. The base does not stand in the way.

## Grid
Kinds changed after the backup by moments by lives: 448 cells, all covered by run. Settings: covered by the lane's test. Empty, 5 cells: restore while a "which to keep" question waits (builder note 1); restore, Put it back and Drop it from the assistant; no count before an earlier cloud version is restored.

## Foundational
None.

## For the builder
1. New. A restore leaves an open "which to keep" question open, and the walk keeps counting the question's amount, not the backup's. Run: phone and desktop both change Rent before they sync (73,000 or 74,000 waits); the person restores a backup where Rent is 72,000; the walk still counts 74,000, so the lowest point reads 219,100 where the backup gives 221,100, and any answer writes a figure from after the backup over the restored one. It errs on the safe side and nothing is lost. Fix in backup3.js only (lines 118 to 120): every kept record whose item the restore rewrites is saved not asking, with the restore's change time, versions kept for Undo. About an hour with a test.
2. Still open from last round. Restoring while this device is behind the cloud gives a mix, and "goes, on every device" is then untrue (run: safe to spend 34,906 against the backup's 39,906; six questions at once in another run). Nothing is lost. Fix: when online, take the cloud copy first, then count and restore.
3. Small: the earlier cloud version question gives no count, because the copy is fetched only after the yes (cloud3_page.js verAsk3).

## Watch
- Placings into a removed place read a record's change time as "which came later" (engine/lookahead.js, the place rule); a restore gives every record one change time, so that rule falls back to list order. No screen writes such placings today.
- Inside a restored record each pay step and rule keeps its old change time: right for today, to be looked at before the field-by-field merge of stage 2.
- The currency list has no change time. Kept whole copies live on one device. Undo of Drop it lasts only while Settings is open (the question says so).

## Server settings and outside pieces
Earlier versions needs the vault's ?versions=1 and ?rev=N. Not confirmed against the live server: someone should run the two curl lines in app3/VAULT_DEPLOY.md once.

## Not checked
The real page in a browser; the live vault; a restore of another household's backup or across a currency change; a statement import after a restore.
