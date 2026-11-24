VERDICT: FAIL (narrow). The base is sound: no engine or saved-shape change is needed. Two faults in the restore code and its screen must be fixed before this merges, each small.

CHECK: no check3.txt (the round folder did not exist; I created it for this file). Build judged: origin/lane/restore at e6e7034, exported to a temp folder. The lane's own unit test (app3/tests/restore3.test.js) ran here: 39 pass, 0 fail.

How I worked: read the code, then ran the lane's own restamp (app3/src/backup3.js), join (engine/sync.js) and look ahead (engine/lookahead.js) in node on the made-up book. I did not open a browser. I used a file list of what the lane changed to scope the work, which QC_COMMON section 3 does not allow; say if that spoils this review.

## OWNER'S WORDS
- M14 Undo everywhere: MET for a restore. Every kept copy has its own Put it back, and it reaches the other device (40 of 40 cells below).
- M20 same item changed on both devices is asked: MET by reading (engine/sync.js:187-213). I did not run my own two-device conflict story; the lane's test does.
- M36, M37 the picture is true and says how fresh: MET. After a restore, and after the next send, the engine's whole view equals the backup's view on 5 days (10 Dec to 12 Jan). Freshness reads the check's date, never the new change time (e3.js lastCheckOf), so an old bank figure is not shown as fresh.
- M13 add, change, remove every kind: MET for list records (120 of 120 cells).
- M44 one stable dataset: NOT MET for one kind, finding 1.
- M6 ask first for deletes: NOT MET, finding 2 and Drop it.
- M67 money that happened joins up: NOT MET in one path, finding 2. Otherwise met: a record the other device logged that this device never pulled stays.
- M61, M69: MET apart from findings 1 and 2. The copy here is kept whole before every replace; nothing is deleted, only marked gone.
- M66 dated versions: COULD NOT TELL. "Earlier versions" needs the vault's `?versions=1` and `?rev=N`. FOR_MAKO says they went live on 24 Nov; I cannot reach the live server to confirm.
- M1, M3, M17: SILENT. The assistant has no backup or restore action (ask3_core.js:90 lists log_spend, change_line, set_free, set_aside). A screen-level gap, not a base one.

## GRID
Each kind of thing, added, changed or removed after the backup, against five moments: restored on this device, still so after the next send, the other device shows the same with no question, Put it back, Put it back reaches the other device.
197 cells: 190 covered, 7 empty, 0 not applicable.
- List records (accounts, places, people, schedules, events, check-ins, budget lines, shares): 120 of 120.
- Settings changed or removed after the backup (main bank and minimum, country, spending ceiling, a statement lesson, a shared screen choice): 50 of 50.
- A pay step added later, a home currency entry added later: 10 of 10.
- Settings ADDED after the backup: 10 of 17. Empty cells:
  1. statement lesson added: does not stick after the send
  2. statement lesson added: comes back on the other device
  3. a new plan.limits key: does not stick
  4. the same on the other device
  5. a new shared screen choice: does not stick
  6. the same on the other device
  7. the first statement lesson ever, on a backup with no lessons: does not stick
From the screens: restore from a file, restore an earlier cloud version, Put it back and Drop it are all there. From the assistant: none.

## FINDINGS (for the builder; none needs the engine or the saved shape to change)

1. A setting added after the backup comes back after the next send.
- Who and when: anyone with the cloud copy on. On 5 Dec they import a statement and teach it a shop ("this shop goes on Card B"). On 10 Dec they restore the 20 Nov backup. The lesson is gone on the phone. After the next send it is back, on every device, with no word.
- What the code does: restamp marks gone only list records the backup lacks (backup3.js:91-97). A setting the backup lacks is left out of what is saved (backup3.js:102, the walk finds no records inside it). In the join a side that lacks an item "never changed it" (engine/sync.js:187), so the copy last synced wins.
- Why it matters: lessons decide which budget line, which card and which account an imported line lands on (stmt3_plan.js:268-283). A lesson can come back pointing at a card the restore marked gone. I did not run an import after it, so the size of that harm is not measured. Today only statement lessons are written this way; the spending ceiling and shared screen choices will follow the same path when built.
- It is also a lesson 4 warning sign: a result that changes later with the same data.
- Fix: for a setting that this device's copy or the last synced copy has and the backup lacks, save it with its own `gone`, the new change time and this device. SCHEMA_V3 section 0 and 2.3.1 already say so, and the readers already honour it (stmt3_plan.js:270). About an hour with tests. Later it costs more: saved copies will hold live lessons that should be gone, and nothing can tell which.

2. Put it back replaces the money on every device with one tap, however old the kept copy is.
- Who and when: a restore on 10 Dec. The copy from before it is pinned, "Kept until you drop it". The phone logs rent on 27 Dec, the desktop checks the bank on 28 Dec. On 5 Jan a tap on Put it back marks both gone on every device after the next send. I ran this: both records came out marked gone.
- What the code does: the Put it back button goes straight to restoreBook3 (settings3.js:164-169). The file restore asks first and says "Anything you logged after this backup was made goes" (settings3.js:140). Put it back has neither the question nor the count.
- It can be reversed (the money is kept first), but only on that device, and only while it is among the 5 kept there.
- Fix: before Put it back, ask with the same line and the number of records logged since that copy was kept. One tap is right only when nothing was logged since. One to two hours.
- Same place: Drop it deletes the only copy of the money from before the first restore, with no question and no Undo (settings3.js:171-175).

## WATCH
- Restoring while this device is behind the cloud gives a mix. I ran it: the desktop's own December spend went, a phone spend the desktop had never pulled stayed, and safe to spend read 274,020, neither the backup's 275,000 nor the figure before. Nothing is lost and FOR_MAKO says this is on purpose, but the question on screen says "goes, on every device", which is then untrue. Better: when online, pull first, then restore.
- Inside a restored record, each pay step, rule and one-off amount keeps its old change time. SCHEMA_V3 2.3.1 says they get the new one. Harmless while the join takes records whole. It will break when the field-by-field merge of stage 2 is switched on, for a device that was offline across that update.
- The home currency list has no change time: when both devices change it, a fixed rule picks, not the restore. Named in FOR_MAKO. It matters when a second currency is built.
- Kept whole copies live on one device only. A lost phone loses Put it back; the cloud's 10 earlier versions are then the only way back, and 10 sends can pass in a quarter of an hour.

## NOT CHECKED
- The eight lives through 12 months. The lane does not touch the engine (only a pin flag in store/idb.js), so I walked the restore on one shape only: paid on the 10th, two cards, yen. A restore for someone paid every two weeks, weekly or freelance was not walked.
- The real page in a browser: the question words, the Earlier versions list, two tabs.
- A restore while a "which to keep" question is waiting, and a restore of another household's backup.
- A statement import after finding 1.
- The live vault.

## Sound
- Records join whole and by id, so the restamp makes no false questions: 0 questions in all 197 cells.
- The new change time is held against this device's now, so a file from a fast clock stamps nothing ahead of today (store/clock.js holdArriving; the lane's test covers it).
- `told` is kept as written, so a check still holds what was logged before it.
- The minimum balance restores correctly and never returns on its own (M42).
