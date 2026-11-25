VERDICT: FAIL

Round finding first: `wip/team/app3/tests/fake_ai_page.js` and `tests/README.md` are missing from this build. I used the stand-in at the top of `tests/e3_ask.js` instead. It proves the doors only, not a real AI.

CHECK (last five lines of check3.txt):
```
[x] The real-page walk (walk 4 run A) as a gate: ... (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): ... (tests/e3_setup.js: PASS)

(full level, 3 at a time, 410 s in all)
ALL GOOD
```

Is this the app he described? No. He described an assistant that sets the app up by talking. This build opens on a six-part form, and the assistant is a 32 px "Ask" link that says "Set up first" on a new phone. scope.txt says that is on purpose.

OWNER'S WORDS
A. M1, M2, M3, M4, M9 NOT BUILT (IN SCOPE FILE): setup is a form; Ask can only log a spend, change a line, set Free to spend, set aside. M5 MET. M6 NOT BUILT (IN SCOPE FILE): "End this bill" and "Remove" on a spend act at once, with Undo. M7 MET. M10 NOT BUILT (IN SCOPE FILE), no picture. M11 MET. M8, M12 COULD NOT TELL (his to judge).
B. M13 NOT BUILT (IN SCOPE FILE): after setup there is no way to remove a card, bank or goal, or change Keep at least. M14 NOT BUILT (IN SCOPE FILE) beyond one step; one-step Undo worked everywhere I tried. M15 MET. M16 MET. **M17 NOT MET**: on a new phone Ask shows "Set up first"; an empty question does nothing. **M19 NOT MET**: the second phone gets one line, "Type the cloud code from your other device, or restore a backup file you saved there", and nothing says where on the old phone the code is (Settings, Show code). M18 NOT BUILT (IN SCOPE FILE): four "?" on Home, none on Plan, Receipts, setup or Check your bank. M20 COULD NOT TELL. M21 COULD NOT TELL (scope). M22 MET. M23 MET for bank, cash, e-wallet; pay-later in scope. M24 NOT BUILT (IN SCOPE FILE). M25 MET.
C. M26 to M32, M34, M35 MET. M33 COULD NOT TELL (install not tried).
D. M36, M37, M38, M39, M41, M42, M43, M48 (yen), M50 MET. **M40 NOT MET** (blocker 1). **M51 NOT MET**: setup says "Keep at least", Home's sum says "(minimum)"; setup says "Everyday spending", everywhere else "Free to spend". M46 NOT BUILT (IN SCOPE FILE). M44, M45, M47, M49 COULD NOT TELL.
E. M52, M57 NOT BUILT (art, in scope). M53 NOT MET: setup is one long page of six parts; Home on a late day is nine cards. M56 NOT MET: the heading "Everyday spending" is still in setup, and Home says "Add your everyday spending". M58, M59 MET. M60 later by his own words. M54, M55 COULD NOT TELL (for his eye).
F. M61, M69 MET in every flow tried. M62 to M68 COULD NOT TELL: not visible from the page, or only a made-up server.

COUNT: 69 lines. MET 30, NOT MET 6, NOT BUILT 15 (all in scope.txt or "later" in his words), COULD NOT TELL 18. Gate lines failing: M17, M19, M40, M51. Jobs: 6 DONE, 2 STUCK.

JOBS (phone 390, made-up numbers, 24 Nov)
1. DONE on the screens. The way he wants to start (by chat): not there (scope).
2. STUCK. Pay: done. Bill: changed, ended, Undo. Card: name and days only; what is on it only through Check your bank; no Remove. Bank: only through Check your bank, which treats a correction as money spent ("¥18,500 more left your bank than you logged. It counts as spending", safe to spend fell from ¥21,333 to ¥2,833). Lowest the bank should go: no way after setup. All in scope.txt under M13.
3. DONE. "Bank today: Main bank ¥281,500, checked today, on 24 Nov", same after reload.
4. STUCK at remove (scope), and the figure is wrong with a third card (blocker 1).
5. DONE in a few taps. Typo fixed, removed, Undo, same after reload.
6. DONE. 1 Dec: "Time to check in", Rent under "Not seen yet". 11 Dec: "Pay not in yet", pay left out of safe to spend. After the check: new period, next pay 8 Jan.
7. DONE. Home, Plan and Receipts word for word the same on the second phone.
8. DONE. Restore asks first, keeps what was there, "Put it back" works after a reload.

CHECKS
2 North star: PASS. Bank, safe to spend and "checked today" lead Home.
3 The way in: FAIL (M1, M2, in scope). A returning person lands on Home, or back in setup if it was unfinished.
4 Fresh eyes: FAIL (confusing 1 to 3).
5 Nothing lies or breaks: FAIL (blockers 1, 2, 3). No cut-off text or sideways scroll at 320, 390 or 1300, dark or light. One console 404 on the served page, no page errors.
6 Safe with data: PASS.
7 Picture first: Home is all numbers. The sum lines under safe to spend, "Due before next pay" and the cards list are each a picture's job.

BLOCKERS
1. Wrong figure, M40. Set up with Card A (¥54,000, day 10) and Card B (¥23,000, day 11). Home, "Add a card": Card C, 12000, day 27. Home now says "After your cards are paid on 27 Nov and 10 Dec: Main bank ¥402,000". Card B on 11 Dec is listed right above and is left out. Before Card C it said "on 10 and 11 Dec ... ¥391,000". Adding a debt of ¥12,000 raised the figure by ¥11,000. It should be ¥379,000 and name all three days. Seen at 320, 390 and 1300.
2. Two figures for one thing after a restore. Log ¥5,000, Settings, restore a backup made before it, "Restore it", "Done". Receipts still shows "Logged ¥5,000 on Free to spend, Undo" and "Safe to spend ¥16,333, was ¥21,333". Home says ¥21,333. Changing tab clears it. That stale Undo is refused, so nothing is lost.
3. Ask, empty box, tap "Ask": nothing happens, no message.
4. M17 and M19 as above.

CONFUSING
1. Home: "¥208,000 (what your accounts can spare) − ¥186,667 (held back: Free to spend has only ¥21,333 left this period) = ¥21,333". Replace with: "Your bank could spare ¥208,000. Your everyday money left until pay is ¥21,333, so that is what is safe to spend".
2. 11 Dec Home: Card A appears three times ("Still owed", "Card and loan payments overdue", "May still go through") and Rent twice (scope, homefix).
3. "Bank today: Main bank ¥300,000, checked 17 days ago". Say "Bank when last checked" once it is not today.
4. Ask: "a change Ask can't make (set_pay)". Drop "(set_pay)".
5. Bill sheet, letters in the amount: "Type amount as an amount". Use "Type the amount, like 1200".

POLISH
An ended bill stays listed as "ended 24 Nov".

FOR MAKO'S EYE
Which is the headline when the bank can spare ¥208,000 and everyday money left is ¥21,333. The new word for "Everyday spending".

NOT CHECKED
M20. A spend on the second phone reaching the first (known fault in scope.txt). Locked backup file. Reading a statement. Money came in, Refund, Moved. Loans, budget lines, goal percents (M49). Bank below zero (M47). Cents. Install (M33). iPhone. Reminders file. Weekly or irregular pay. A real AI.
