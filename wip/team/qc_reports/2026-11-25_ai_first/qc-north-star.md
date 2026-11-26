VERDICT: PASS (confirming run, per confirm_qc-north-star.txt; earlier report renamed run1_qc-north-star.md)

CHECK: check3.txt ends "[x] Setup, short ... (tests/e3_setup.js: PASS) / [x] The layout holds at 320, 390, 412 and 1300 wide ... (tests/e3_layout.js: PASS) / (blank) / (full level, 3 at a time, 857 s in all) / ALL GOOD". The file does not name the commit it ran at; HEAD 6a748918 contains 9718f79e. Assistant tested with the made-up AI only.

OWNER'S WORDS: carried over from run1_qc-north-star.md, not walked again. Changed by this run: M18 the Home "?" on the first card now explains its own card (still NBS for every screen); M19 restore now clears old Undo bars; M17 the chat box reads whole at 320.

COUNT: carried over (73 lines: MET 41, NOT MET 1 (M56, section E), NOT BUILT 17, KNOWN 3, COULD NOT TELL 11; jobs 6 DONE, 2 STUCK IN SCOPE FILE). Blockers rechecked 3 of 3, all gone. Touched places checked 4 of 4.

BLOCKERS from run 1
- B1 GONE. Phone 390, Home after setup, no Free to spend. The first card's "?" now opens "Free to spend is what you plan to spend on food and everyday things each pay period. Set it, and safe to spend leaves room for it."
- B2 GONE, both doors. (a) Save a backup file, Check your bank 100,000 (Home: "Bank checked. ¥186,000 more left your bank than you logged ... Undo"), Restore from a file, Restore it, Done: Home has no Undo bar, bank ¥286,000, safe ¥201,400, same after a reload; "Put it back" is in Settings. (b) Two served phones: phone B logs ¥800 ("Logged ¥800 on Free to spend / Undo"), at once Settings, Earlier versions, Restore this one, Restore it: Home and Receipts show no Undo bar, Settings says "Restored the earlier copy from the cloud".
- B3 GONE. "Ask or tell me something" and "Your answer" fit on one line at 320, 390 and 1300 (box 44 tall, no overflow), set-up and new phone. No page errors.

NEW, none blocking
- Assistant, 27 Nov (day after Power, Rent and Internet due today), phone 390, "my bank shows 200,000": the card reads "Main bank shows ¥200,000 today. Already through, so ticked: Rent 27 Nov ¥72,000, Power 26 Nov ¥7,400, Internet 27 Nov ¥5,200 / This is more than safe to spend. Do it?". After Do it: bank ¥200,000 "checked today, on 27 Nov", safe ¥200,000, "Nothing is due before next pay", after the cards ¥363,000; all hold after a reload. As a stranger the tick list makes sense and the sums are right. The "more than safe to spend" line does not (nothing is being spent): KNOWN in scope.txt LATER.

CONFUSING
- The same card ticks bills due today as "Already through" with only "Do it / Not now". If Rent has not left yet, the only way to say so is to type it; safe to spend would read 77,200 too high after Do it. Offer a tap per bill: "Not out yet".
- Phone B, after taking phone A's ¥1,500 (about 60 s after A logged it), Home showed "A change is waiting to go to the cloud copy" for over 60 s while A said "In step with the cloud". Seen once, not repeated.
- Home on 27 Nov lists Power twice, under "Late, not ticked off yet" and "May still go through" (as in run 1).

POLISH
- The B1 help repeats the card's own line under it ("Add what you spend on everyday things so safe to spend leaves room for it").
- Earlier versions lists two rows reading the same "Sent 24 Nov, 16:00".
- Served phone A logs "console: Failed to load resource: 404" (as in run 1; may be the made-up server).

FOR MAKO'S EYE: none new.

NOT CHECKED: everything outside the confirm file (carried over). The B1, B2(a) and B3 set-up runs used a phone profile left in /tmp from an earlier run (the setup chat answered "There is already a book on this device"); its figures match the made-up setup exactly. The cloud runs used new phones.
