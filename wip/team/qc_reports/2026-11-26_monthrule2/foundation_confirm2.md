FAIL

qc-foundation, second confirming run on lane/monthrule at db13ac5b (changes 9b5404f8, 953bf874, 4036b27a, 351bf964), 26 Nov 2026. Earlier: foundation.md (FAIL), foundation_confirm.md (FAIL at 0d7d587e). Engine untouched since then; only app3/src changed. Walks run through the engine and the app's own modules in node. Lines not walked again keep their marks from the earlier reports.

## F2 (no fixed pay, Free to spend through the assistant): GONE
- Kai, no fixed pay, Free to spend 60,000 set 18 Dec, Food 31,000 added 18 Dec, ended 22 Dec, a new Food 20,000 added 22 Dec. On 24 Dec: headline 27,096; the assistant is sent "Free to spend this month: 27,096 (part of 60,000 a month, for the days left), 27,096 left." (ask3_core.js:77). It matches the headline.
- The change card reads the month when there is no period (ask3_core.js:199, chat3_core.js:647). The test for a 2,000 spend shows 27,096 then 25,096 on both rows.
- Lines through the assistant: one Food with a ref (L1, the new one, 6,451 left). The ended Food has no ref (ask3_core.js:70, chat3_core.js:497).
- M1, M3, M7 for this life: MET.

## Ended line, no fixed pay (Kai): GONE
- Receipts offers only the live Food. A receipt already filed to the ended Food opens with "Food (ended)" kept (receipts3.js:18 to 26).
- The write door refuses a spend or refund dated after the end, in plain words ("Food ended on 22 Dec 2026. Pick another line", act3.js:76 to 78). Moving an old receipt's date past the end is refused too. A spend on or before the end day is kept.
- Undo of the end brings the old record back without `ends`, so the picker, the assistant and the door all offer it again (they read `ends` live).

## NEW: the fix breaks the fixed-pay life (the owner's own shape)
Who: Mako, paid on the 10th (M27, M28, M31). On 22 Nov, in the period 10 Nov to 9 Dec, he ends Food (40,000 a month) and adds a new Food (30,000).

What the base holds: `endLine` writes a step to 0 from today and `ends: today` (plan3_write.js:80). With fixed pay the engine reads that as "nothing from the next period", so the old Food still holds its full part this period. Engine run on 25 Nov: old Food counts 26,666, left 26,666; new Food counts 20,000, left 20,000. The Plan screen says so to him: "Ends after this pay period", 26,666 left (plan3.js:59, plan3.js:66).

What the new code does with that: Receipts hides the old Food from 22 Nov (receipts3.js:21, `ends <= today`), the assistant drops it from its lines (ask3_core.js:70, chat3_core.js:497), and the write door refuses any spend on it dated 23 Nov to 9 Dec (act3.js:78). Run: a 5,000 receipt to the old Food dated 22 Nov is kept; one dated 23 Nov is refused.

The real-life moment: from 23 Nov to his next pay, the Plan screen shows a Food with 26,666 left that nothing can be filed to, by screen or by voice. The assistant is not told that the line exists, yet its money is held back from what the bank can spare. His Food receipts go to the new Food, which runs out early while 26,666 sits locked. Before 351bf964 he could keep filing to the old Food until the period ended, which matches what the screen promises. So the brief's check "a person paid on a fixed day is unchanged" does not hold.

Why it is not in the base: the saved shape holds everything needed (`ends`, the steps). The fault is that the screens and the door use a different meaning of "ended" from the engine's. Fix for the builder: decide whether a line can take a spend on a given day from the engine's own figure, not from `ends` alone. For fixed pay the line stays open until the end of the pay period it ended in, as the engine and the Plan screen already say. For no fixed pay it closes on the day it ends, as now. Apply the same rule in receipts3.js:21, ask3_core.js:70, chat3_core.js:497 and act3.js:78. One test: Mako ends Food on 22 Nov and files a receipt on 25 Nov. The other way (end means now for everyone) is an engine change to the period rule and needs a place for the released money (M46), so it is not the cheap path. Cost now: small. Later: every fixed-pay person who ends a line meets money they cannot use. M7, M51 (and M3 for the assistant): BROKEN for fixed pay.

## GRID (touched cells only)
Kind: a budget line. Through the screens and through the assistant, on a later day: change, end, add again after it ended, file a spend to it, and undo each.
- No fixed pay: 10 covered, 0 empty.
- Fixed pay: "file a spend to an ended line that still has money this period" is EMPTY on both the screens and the assistant, and the door refuses it. This is a builder fix, not a saved-shape fix.
- Read Free to spend through the assistant, no fixed pay: now covered.
Count: 11 covered, 2 empty (fixed pay: file a spend to an ended line that is still open, by screen and by assistant), 0 not applicable.

## OWNER'S WORDS
- M1, M3, M7: MET for no fixed pay. M3 and M7 are BROKEN for fixed pay (the ended line holds money that the assistant does not see and that nothing can use).
- M4: MET for no fixed pay; BROKEN for fixed pay (he cannot tell it "here are my food receipts" for the old line).
- M13, M14: MET (end, add again, Undo of the end).
- M27, M31: the life they describe is the one now broken.
- M45: MET. M46: watch, see below.
- M51: MET for no fixed pay. BROKEN for fixed pay ("ended" means "after this pay period" on the Plan screen and "today" in Receipts, in the assistant and at the door).
- Others: carried over from foundation.md.

## FOUNDATIONAL
None. Every remaining fault is a builder fix on a base that already holds the figures. FAIL because a D line (M51) and the owner's own life (M7, M31) are broken by the new code.

## WATCH
- A late receipt dated before a line began. Kai files a 3,000 receipt dated 20 Dec to the new Food (added 22 Dec): the door takes it, and it comes off nothing, while the new Food shows its full 6,451 left. This follows the coordinator's CA10 ruling (earlier spends sit before the plan). But the door now refuses "after the end" and still accepts "before the start", which is the mirror case. Worth the same plain refusal or a note on the receipt. It matters most for the three-weeks-without-opening-the-app life.
- Kai's ended Food shows 4,000 over (an amount of 0 with 4,000 spent before the end). The headline is unaffected because it is capped by Free to spend. This is unchanged from before, but once the ledger shows history it reads as an overspend that never happened.

## Checked and sound
- Engine unchanged since 0d7d587e, so the period figures for fixed pay, twice a month and every two weeks are as confirmed earlier.
- ask3_core and the change card still read the period first, so a fixed-pay person's Free to spend text is unchanged.
- A receipt already filed to an ended line can still be opened, changed and kept. Changing its date past the end is refused, with nothing saved.
- A refund to an ended line dated after the end is refused. It can still come back to the account with "Nothing".
