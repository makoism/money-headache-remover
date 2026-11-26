FAIL

qc-foundation, confirming run on lane amounthist at 917d4442 (engine and write-door change since ab42da59). Two new engine faults, both shown by running the engine on made-up yen. Neither needs a saved-data change: the `was` history the door now keeps is enough, so each fix is engine-only and small now. They still fail the run because each would need an engine change later.

OWNER'S WORDS (lines this change touches)
- M14 Undo everywhere: met. Undo of a removal puts `was` back (act3.js:171). Undo of a check-in removes it whole (act3.js:350-351).
- M36 picture adds up: met for the bank figures. In both faults below, "bank today" stays right.
- M44 one stable dataset, a past period never rewritten: broken (finding 2).
- M45 no coin counted twice: broken (finding 1: a move between own accounts counts on one side only).
- M61 and M69 nobody loses data: met. Every removal of a money record keeps its amount in `was`. Removed records are marked gone and never deleted, including the records an Undone check-in removes.
- M67 money joins across devices: met. sync.js item() keeps whole records, and the losing version is kept for Undo (sync.js:209-215), so `was` stays consistent with its own record.
- M23 several accounts with cash and e-wallets, plus M98(b) cash taken out is a move: broken in effect by finding 1.
- M1 to M4 (the assistant): met. The assistant and the screens use the same door (act3), so the same history rule applies to both.
- M7, M12 and M90 (safe to spend): broken by findings 1 and 2. Safe to spend moves when nothing really changed.

GRID (kinds this change touches: money records, meaning spend, in, transfer, convert, borrow, hand and repay, plus check figures; through the one door, from the screens and the assistant, on any later day)
- Money record: add, change, remove, Undo of each: 6 cells covered at the door.
- Check figure: add, change, Undo of add, Undo of change: 4 covered. Remove a single check: not applicable, because a wrong figure is corrected, and the whole check-in is removed through Undo. Undo of that removal: covered by the journal.
- Count: 11 covered, 1 not applicable, 0 empty. The cells hold the data, but findings 1 and 2 make two of them count wrong.

FOUNDATIONAL

1. A move between own accounts, removed after a check that held both sides, counts on one side only, and which side depends on account order.
- Who: anyone with two accounts, including section H's cash way. Example: Mako logs a 10,000 cash withdrawal (bank to wallet). On 13 Dec he checks the bank and counts the wallet, and both match. On 14 Dec he sees it was logged twice and removes one.
- What it shows: safe to spend goes from 60,000 to 70,000. With the two accounts listed the other way round in the book, it goes to 50,000. The bank figures stay right.
- Run: banks [Main, Other], checks on 6 and 13 Dec, transfer of 10,000 on 8 Dec, removed on 14 Dec. Result: safe 70,000 and this period spent -10,000. Reverse the banks and it is 50,000 and +10,000.
- Cause, lookahead.js:519: `for (const e of goneMoves) if (!heldAt.has(e.id) && ...) { holdAt(...); holdAcct(e.id, id, ...) }`. `heldAt` is shared by all accounts. Once the first account's bankInfo holds the record, the second account never gets its `heldAcct` entry. lineless() (lookahead.js:1116-1126) then cancels only one side's gap, while both sides' fillers count (lookahead.js:1096-1100).
- Fix (engine only): test the guard per account, `!(heldAcct.get(e.id) && heldAcct.get(e.id).has(id))`. holdAt already keeps the earliest. I made this one-line change in a scratch copy and all four cases gave 60,000.
- Same root, card side, reasoned from the code but not run (my harness did not get a card payment to land on the card): the card check holds only records whose `account` is the card (lookahead.js:670) and never calls holdAcct. So a card payment (bank to card) removed after both a bank check and a card check cancels the bank side through lineless, but the card's gap change stays uncancelled. Safe to spend would rise by the payment. Before this branch the two sides' fillers cancelled each other. Needs a test with Mako's shape (two cards paid on the 10th and 11th, M27).
- Cost: about an hour now, with tests across the account orders. Later: wrong headlines in a live book, with no data to repair.

2. A bank check figure corrected before the next check is written moves spending out of a closed period when that next check comes.
- Who: anyone who fixes a mistyped bank figure within a few days. Example: on 6 Dec the bank is checked at 300,000. On 8 Dec it is corrected to 299,000, the real figure. Pay lands on the 10th. On 13 Dec the bank is checked and matches exactly.
- What it shows: on 8 and 9 Dec the 10 Nov to 9 Dec period shows 1,000 spent, which is right. After the 13 Dec check, that closed period shows 0 and the new period shows 1,000, so safe to spend is 59,000 instead of 60,000.
- Run: fix.js in the scratchpad.
- Cause, lookahead.js:489-490 and 522-526: `carry` adds minus d on the fix day to the next gap for every fix. A minus part is only right when the fix was told after the next check was written. When the next check was written after the fix, its gap was already worked out from the corrected figure, so the carry pulls d out of the old period and the own part puts it on the new check's day.
- Fix (engine only): carry a fix only when keyOf(w.told) is after the next check's key. Add a test where the fix comes before the next check and pay falls between them.
- Smaller, same lines: the plus part goes on this check's line (fillerPlaceOf(c)) and the minus part goes on the next check's line. When two check-ins placed their gaps on different lines, a fix moves money between lines on the fix day. Keep both parts on the corrected check's line.

WATCH
- Undo of an older check-in after a newer one: act3.js:350 removes all its records with no history. If a later check holds its ticks (a pay ticked at check-in 1 sits inside check 2's figure), that money leaves its own period and check 2's gap grows on check 2's day. That can be a closed period, or a large gain the screens then ask about. Today nothing stops this Undo, because `later` only looks at the step's own records. Either refuse it while a later check exists, or keep `was`. Nothing typed is lost: the records are marked gone, not deleted.
- Undo of a removal after a reload: the journal path calls restore without `before` (act3.js:342 and 354), so the live record keeps the removal's `was` entry at its unchanged amount. The amounts are equal so nothing counts wrong, but res.splits (lookahead.js:865) can list a change of 0. Check it when the Receipts screens reach Undo after a reload (KNOWN M14 screens item).
- fixesOf takes the fix day from told.slice(0,10). That is right while told carries the device's offset. If a day ever arrives as UTC 'Z', a fix near midnight would land on the wrong day.
- Statement import and several currencies: lineless skips other currencies, and the card side has no hold (finding 1). Both need the cross-account hold to be right before convert or statement lines are removed after checks.

What I checked and found sound
- The removal history rule at the door is decided by the step, not by the record's shape (act3.js:149-152). The only exception is Undo of a step that added a check, and there is no other door that removes a check.
- Removed records that settled a bill keep it settled while a check written before the removal holds them (lookahead.js:221-229), and they use numeric keys (dates.js:40).
- A check fix made after the next check, and a fix on the latest check, behave as ruled (A): the parts cancel, and only the plus part counts on the latest check.
- A single-account removal and correction of money in follow the spend rule (lineless, splits now include all money in).
- Backup and restore carry `was` as an ordinary field. sync keeps one coherent version and the other for Undo.
- Nothing here needs a saved-data migration, and no server setting is involved.

Scratch scripts (not committed): /tmp/claude-0/-home-user-money-headache-remover/232925eb-a47e-564e-94fb-38f48731cae3/scratchpad/tr.js and fix.js
