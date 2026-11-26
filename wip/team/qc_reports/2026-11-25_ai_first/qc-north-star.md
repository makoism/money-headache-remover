VERDICT: FAIL (check 4 and check 5 fail; no line in A, B, D or F is NOT MET or NOT BUILT outside scope.txt; the two STUCK jobs are both scope.txt lines)

CHECK: check3.txt ends "(full level, 3 at a time, 857 s in all) / ALL GOOD". Build lane/ai-join, wip/team/app3/index.html. Assistant tested with the made-up AI only (MAKO_SETUP and my own steps).

OWNER'S WORDS (NBS = NOT BUILT, IN SCOPE FILE)
A: M1 MET (new phone opens on the setup chat; "Ask or tell me something" bar on every tab, a side panel on desktop). M2 NBS (no uploads). M3 NBS ("Keep at least for your main bank cannot be changed after setup yet"). M4 NBS (files). M5 MET. M6 MET as built (removes ask, then Undo). M7 KNOWN (card spends). M8 COULD NOT TELL. M9 NBS. M10 NBS (no picture; Home shows about 15 figures, nothing hidden). M11 MET. M12 COULD NOT TELL.
B: M13 NBS/KNOWN. M14 MET (KNOWN after reload). M15 MET (End this bill asks, Undo works; empty amount says "Nothing changed", Back works). M16 MET. M17 MET. M18 NBS (3 help marks, Home only). M19 MET. M20 COULD NOT TELL. M21 NBS. M22 MET. M23 NBS (pay-later). M24 NBS. M25 MET.
C: M26 to M29 MET. M30 KNOWN. M31 MET (10 Nov to 9 Dec). M32 MET. M33 COULD NOT TELL. M34 MET. M35 MET.
D: M36 to M45 MET (bank 286,000 checked today; after the cards 364,400 = 286,000 - 84,600 + 240,000 - 77,000; goal: "In my bank, set aside" first). M46 NBS. M47 MET (amber, "short by ¥34,600"). M48 MET. M49 COULD NOT TELL. M50 COULD NOT TELL. M51 MET.
E: M52 NBS. M53 MET in the chat (the screens setup is one long page). M54 MET. M55 MET. M56 NOT MET: Home's first card a new person meets is headed "Add your everyday spending". M57 NBS (art). M58 MET. M59 MET. M60 NOT BUILT, his "Later" (typed 1234567, box shows 1234567). M88 M89 M90 NBS. M91 COULD NOT TELL.
F: M61 MET (KNOWN typing lost). M62 MET. M63 to M66 COULD NOT TELL (server side). M67 MET (an 800 spend on phone B showed on phone A). M68 KNOWN. M69 MET.

COUNT: 73 lines. MET 41, NOT MET 1 (M56, section E), NOT BUILT 17 (16 in scope.txt, M60 his own "Later"), KNOWN 3, COULD NOT TELL 11.
Jobs: 6 DONE, 2 STUCK (both scope.txt M13 lines).
1 DONE. Chat (MAKO_SETUP) gives Home ¥201,400 safe, ¥286,000 bank. The screens alone give the same figures.
2 STUCK (IN SCOPE FILE, M13). Changing works for the bank name, bank figure, pay, card and bill. Ending a bill works, with Undo. Not possible: removing a card, a bank, or a second income, and changing Keep at least (no screen; the assistant answers "cannot be changed after setup yet").
3 DONE. Typed 250,000: Home "¥250,000 checked today, on 24 Nov", safe ¥165,400. Plan and Receipts agree, and so does a reload.
4 STUCK (IN SCOPE FILE). Card C added: safe falls by ¥10,000 and the bank after the cards reads ¥354,400. The card sheet has no Remove.
5 DONE in under 1 second of taps. Log, find, change 1,200 to 12,000, remove (asks), Undo, reload: all hold.
6 DONE. On 12 Dec: "Safe to spend, not counting the 10 Dec pay (not seen yet)", late bills listed, Check your bank first. After ticking the pay with Rent unticked: ¥436,400 bank, ¥275,000 safe, Rent "late". All correct.
7 DONE. Home, Plan and Receipts figures are the same on both phones.
8 DONE. Restore asks first. Put it back (Settings, two taps) brings the changed figures back and they hold after a reload.

North star (check 2): PASS with KNOWN. In 10 seconds you see the bank, the day it was checked, and safe to spend until a named pay day. The bank figure is the bank app's. The cards sit apart from safe to spend (KNOWN M7/M30).
Way in (check 3): PASS. A new phone opens on the chat with "Set up on the screens instead", "See it with made-up numbers first" and "I already use the burrow on another device". A returning phone opens on Home with the chat bar.
Fresh eyes (check 4): FAIL, B1.
Nothing lies or breaks (check 5): FAIL, B2 and B3.
Safe with data (check 6): PASS (KNOWN M61 and M14 only).

BLOCKERS
B1. Wrong help on the first card. Phone 390, Home after setup with no Free to spend. The card reads "Add your everyday spending ... Set Free to spend". Its "?" opens "How things stand today, in one line. It changes when you check your bank or log a spend." That explains something else, on the first thing a new person meets. It should say what Free to spend is and why safe to spend leaves room for it.
B2. A stale message after a restore, with an Undo that does nothing. Settings, Save a backup file. Check your bank, type 100,000, Save. Settings, Restore from a file, Restore it, Done. Home still shows "Bank checked. ¥186,000 more left your bank than you logged. It counts as spending / Undo", about a bank check the restore removed. Tapping Undo answers "Something changed it since. Undo that change first". The real way back is Put it back in Settings, which nothing on Home names. Seen twice. A restore should clear old Undo messages and offer its own "Restored. Put it back".
B3. Words cut off. Phone 320: the chat placeholder "Ask or tell me something" wraps and its second line is clipped (box 44 tall, text 67). This is the main way in, on every screen.

CONFUSING
- Home on 12 Dec shows the same three late bills twice: "Late, not ticked off yet" and "Not seen yet". Keep one list.
- After that check: "1 thing to tick off since 12 Dec", but the thing is Rent from 27 Nov. Say "1 thing still to tick off".
- "Not safe to spend / You're short by ¥34,600 before pay on 10 Dec" gives no next step. Add one, for example "Move money in, or ask me".
- "Free to spend" next to "Safe to spend", with "everyday spending" naming the first: three names, two of them nearly the same (M56, Not settled 6).
- Add a card from Home lands on Plan. The bank after the cards is on Home.

POLISH
- On the served page, phone A logged "console: Failed to load resource: 404" (could be the made-up server).
- Check your bank tick boxes measure 22x22 (the label may carry the tap).

PICTURE FIRST (check 7)
- The safe-to-spend sum is a long sentence ("¥286,000 (Main bank today) − ¥7,400 (Power 26 Nov) − ..."). It is the clearest place for a picture: the bank as a pile, bills taking their bites, and what is left.
- "This pay period 10 Nov to 9 Dec, in 16 days" fits a pay-to-pay bar with today on it.
- The cards and the bank after the cards fit a before-and-after pile. The art waits for Mako.

FOR MAKO'S EYE
- The desktop welcome is a full chat. On a phone the top "Ask" stays a small link, but the bottom chat bar does the main job.
- As the section H person, a play-money cash wallet can be added only as a plain cash account. Envelopes are not there yet (scope).

NOT CHECKED
- The real AI (made-up only). M20 (two phones changing one plan item). Install to the home screen (M33). Light scheme. The whole 320 grid (check3 covers it; I looked at Home only). No fixed pay (KNOWN). Weeks 2 to 4 after a restore.
