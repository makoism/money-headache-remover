VERDICT: FAIL (confirming run 4 against run3_qc-data-safety.md. Run 3's blocker is gone. New blocker next to it: a setup left open in a second tab replaces a finished book without asking.)

CHECK: (full level, 3 at a time, 853 s in all) / ALL GOOD

OWNER'S WORDS: M61 NOT MET, M69 NOT MET (blocker 1). M66, M67 carried over from run 3 (MET on the made-up server). M62 to M65, M68 carried over from run 2, not walked again.

COUNT: 4 confirm checks. 3 DONE: run-3 blocker (one after the other both ways, and at the same moment); a restore of a backup made without Keep at least, then Put it back; nothing typed lost by these. 1 STUCK: which-to-keep on two devices (not reached). Kinds of change across reload and 10 s: 4 (bank, pay, Free to spend, Keep at least). Removes checked: 2 (restore, Put it back), both ask.

BLOCKERS
1. A second tab's setup replaces the finished book, with no ask and no Undo (repeated twice). 390 wide, new device, "Set up on the screens instead" in tab 1 and tab 2. Tab 1: bank 300,000 Save, pay 240,000 Save, See my money; Receipts, log 4,321 "groceries test". Tab 2 (still on setup): bank 777,000 Save ("Your bank: saved"), pay 100,000 Save, See my money. Tab 2 says nothing about a book already being there. Reload tab 1: Home "¥777,000 (Main bank today) = ¥777,000", pay 100,000; the 4,321 spend is no longer taken off, and its receipt line reads "10 Dec, rlqjd8-8iympi49m7-3, groceries test" (a raw code where the line name was). The chat refuses the same thing ("There is already a book on this device"); the screens should too, or ask and keep the old book for Undo. Also: tab 2's "Keep at least: saved" with Undo, pressed after tab 1 finished, never reaches the book (Home shows no minimum). Script /tmp/qc/qc-data-safety/t7.js, t4.js.

What held:
- Run-3 blocker gone: bank Saved in tab 1, pay and Free to spend in tab 2, all three orders (tab 1 first, tab 2 first, same moment). After reloading each tab and again after 10 s, both tabs show 286,000 / 240,000 / 30,000. A pay typed but not saved in tab 1 stayed on its screen while tab 2 saved the bank, and both were kept.
- Restore of a backup without Keep at least asked first ("This replaces the money on this device ... Put it back brings it back"). After a reload Home shows no minimum (300,000), not the old 5,000. Put it back asked ("Put this copy back? 4 things added since ...") and, after a reload, brought back "− ¥5,000 (minimum) = ¥290,679" and the 4,321 spend. No page errors.

CONFUSING
1. The restore ask says "5 things here now are not in it (money in or out: 2 ...)". Put it back then says "4 things added since it was kept go (money in or out: 1 ...)". Only one spend was logged. Say the same count both times.

POLISH: none new.

FOR MAKO'S EYE: none.

NOT CHECKED: which-to-keep answers on two devices and Undo right after Keep (stopped at the token limit); a settings item missing from one device in which-to-keep; everything else carried over from run 3 and run 2. Made-up server only, no AI used.
