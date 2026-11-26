VERDICT: PASS (confirming run 5 against run4_qc-data-safety.md, build lane/ai-join at 0384e837. The run 4 blocker is gone. No new blocker.)

CHECK: (full level, 4 at a time, 695 s in all) / ALL GOOD

OWNER'S WORDS: M61 MET, M69 MET (on the walks below). M20 MET (two devices, made-up server). M67, M66 carried over from run 3. M19 carried over from run 4 (restore counts now agree). M62 to M65, M68 carried over from run 2, not walked again.

COUNT: 4 confirm checks, 4 DONE, 0 STUCK. Kinds of change across reload and 10 s: 5 (bank, pay, spend, bank check, which-to-keep answer). Removes checked: 3 (restore, Put it back, restore on a half-done setup), all ask.

What held:
1. Which to keep, two browser profiles on one cloud copy, phone 390 wide. Pay 240,000 changed to 250,000 on A and 260,000 on B while B was offline. Both show "Pay was changed on two devices. Which one should stay? The other is kept, so it can come back." with amount and device on each row; Home shows "Something was changed on two devices. Choose which to keep". B Keep 260,000: "Pay: you kept ¥260,000 from this device - the other was ¥250,000 ... Use the other one". Undo right after Keep brings the question back, nothing lost. After reloads (at once and after 10 s) both devices show the same Pay and the "Use the other one" line.
2. Run 4 blocker, three orders (tab 1 finishes first, tab 2 saves first, both press See my money at the same moment), plus tab 2 with figures typed and not saved. The finished book and the 4,321 "groceries test" spend survive in every order, in both tabs, after reload and after 10 s. Tab 2 says "Your money was set up in another tab, so this tab shows it now. What you typed here was not saved".
3. Restore count, book with 3 spends (1 before the backup), a bank check and a pay change. Ask: "3 things here now are not in it (money in or out: 2, bank checks: 1). 1 thing here now goes back". Put it back: "1 thing changed since goes back ... 3 things taken out since come back (money in or out: 2, bank checks: 1)". Same counts. Figures matched the backup after restore and the newer ones after Put it back (290,000, three spends, pay 250,000), both across a reload.
4. Restore in tab 1 while tab 2 is on setup, with and without a saved setup section in tab 2: both tabs end on the backup (298,889, pay 240,000) after reload; tab 2's later typing never reaches the book.

BLOCKERS: none.

CONFUSING
1. Stale answer on the other device. After B chose 260,000, A (not reloaded) still showed the old question; A chose its own 250,000. Both devices then took 250,000 and showed the question again with no word on why. Nothing lost, both amounts still offered. Say "Your other device already chose ¥260,000. Keep that, or use ¥250,000?"
2. The "set up in another tab ... not saved" line shows for about 3 seconds, also when that tab is in the background, so a person coming back to it later finds Home and their typing gone with no word. Keep it until tapped away.
3. After a restore in another tab the same line says "set up in another tab" and "What you typed here was not saved", though that tab's bank section had shown "Saved". Say "A backup was restored in another tab. What you had entered here in setup was replaced."
4. Restore on a device part way through setup asks "This puts the money from the backup on this device" but does not say the saved setup answers (bank 777,000, pay 100,000) go, and there is no Put it back for them.

POLISH: turning on the cloud copy logs a console error "Failed to load resource: 404" (the first look for a copy that does not exist yet).

FOR MAKO'S EYE: none.

NOT CHECKED: "Use the other one" tapped after a reload; a settings item or whole copy in which-to-keep (KNOWN, scope); Drop it; everything else carried over. Made-up server only, no AI used. Scripts in /tmp/qc/qc-data-safety/ (w2.js, w3.js, t1.js to t4.js, b3.js, s1.js, s2.js).
