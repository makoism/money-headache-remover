# qc-numbers, lane/cash-1, 26 Nov 2026

VERDICT: FAIL

CHECK: check3.txt ends "(full level, 3 at a time, 905 s in all) / ALL GOOD" (last test lines: e3_setup PASS, e3_layout PASS).

OWNER'S WORDS
- M26 MET. M27 MET (two cards, 10th and 11th, holidays moved right: 11 Jan 2027 to 12 Jan, 11 Feb to 12 Feb). M28 COULD NOT TELL (typed one pay). M29 MET. M30 MET (no Free to spend: cards come off). M31 MET. M32 MET. M33 COULD NOT TELL (Chrome phone size only). M34 MET. M35 MET.
- M36 NOT MET (B1, B2). M37 MET. M38 MET. M39 MET. M40 MET (wording C1). M41 MET. M42 MET. M43 COULD NOT TELL (no goal walked). M44 MET (same text in three time zones, after reload, after Undo). M45 MET (a statement line I had already logged was not counted again; moves never counted as spending). M46 NOT BUILT (IN SCOPE FILE). M47 COULD NOT TELL (words plain, colour not checked). M48 MET (polish P1). M49 COULD NOT TELL. M50 MET (pay landed 88,000, usual stayed 90,000). M51 NOT MET (C3).
- M88 M89 NOT BUILT (IN SCOPE FILE). M90 (in part) NOT MET: on pay-day morning cards are not taken off (B1). M91 (stop play money) COULD NOT TELL: no "Stop play money" anywhere on Home, Plan, Receipts, Settings or the Free to spend sheet (its choices are only "From the next pay period / This pay period and after / This pay period only").

COUNT: lives walked 7 (monthly 10th with two cards 5 Dec to 15 Jan; every 2 weeks 3 to 25 Dec; weekly 27 Jan to 3 Feb; no fixed pay 3 to 27 Dec; set up the day after pay; two banks and cash 1 to 9 Dec; dollars with cents). Steps compared 48. Figures tied about 170, wrong 5, unexplained 2. Bad inputs tried 27 (16 amounts in yen, 5 in dollars, 6 dates), 2 wrong. Statement import 1 (pasted answer). Assistant: figures it is sent tied to Home (made-up AI only).

BLOCKERS
B1. Pay-day morning safe to spend leaves out the cards and a late bill. Phone 390. Life: monthly pay 250,000 on the 10th, Card A 40,000 (not sure), Card B 25,000 (closes 15th, 15,000 on statement), Keep at least 20,000, no Free to spend.
 - 9 Dec: ¥207,500 (294,500 - 42,000 - 25,000 - 20,000), tied. 10 Dec, nothing changed, pay not ticked: "¥274,500", sum "¥294,500 (Main bank today) − ¥20,000 (minimum)". The ¥67,000 on the cards is gone from the sum, against R1 (no play amount, everything on the cards comes off). After ticking the pay it reads ¥371,500 (tied).
 - 8 Jan 2027 (pay day, Rent 80,000 of 28 Dec not ticked): screen "¥460,700" = "¥480,700 − ¥20,000", while the same screen says "Late, not ticked off yet. Safe to spend takes these off today: Rent ¥80,000". My working: 480,700 - 80,000 - 10,000 - 22,000 - 20,000 = ¥348,700 (what it showed on 29 Dec). If the person spends 460,700 that morning and the rent leaves before the pay, the bank is at minus 60,000. Seen on two separate days, so not timing.
B2. "At the end of the day" figure contradicts Check your bank. Same life, 10 Dec: Home "= ¥477,500 at the end of the day" takes off all ¥25,000 of Card B, which is paid 11 Dec and only 15,000 of it; Check your bank the same morning: "Expected now ¥502,500". 8 Jan: Home "¥618,700 at the end of the day" takes off both cards paid 12 Jan; Check your bank "Expected now ¥650,700". Should be 502,500 and 650,700.
B3. A misplaced comma gives a confident wrong amount. Receipts, Log spend: "12,34" in yen is logged as "¥1,234" with no word. In dollars "1,5" (one fifty, comma decimal) is logged as "$15", ten times too much. Should refuse with "Type the amount, like 1200" as it does for "abc" and "1.23456".
B4. Set up the day after pay, a bill due on pay day is assumed paid without asking. 11 Dec, pay on the 10th, Rent 80,000 on the 10th, Water 4,000 on the 8th. No "Did the Rent of 10 Dec leave your bank?" appears (probing the day box: only day 11 asks; days 1, 5, 8, 9, 10 never ask). Home: "¥388,000 = ¥400,000 − ¥12,000 (Insurance 4 Jan)". If the rent is still pending: 308,000. The rule: not seen is not seen yet, never assumed paid.
B5. No fixed pay: words and figure disagree. Setup says "Safe to spend then looks at the next 30 days"; Home lists "Due in the next 30 days" ¥64,000, but the figure takes off ¥128,000 (bills through 25 Jan, 53 days ahead); on 27 Dec it takes off through 25 Feb. Not explained by anything typed. Not the listed M38 month-rule fault (no plan amount changed).

CONFUSING
C1. Home "After your cards are paid": "It counts everything on the cards now, as their close days are not sure" when Card B has a close day and only its ¥15,000 statement part is counted (¥495,000 = 300,000 + 250,000 - 40,000 - 15,000). Say "It counts what is due on each card's next payment".
C2. "Pay periods gone by" promises "with what was spent" but shows only Money in, Bills paid, Card payments; 27 Nov to 10 Dec shows "¥0 ¥0 ¥0" though ¥4,000 was spent.
C3. The assistant is told "No play amount is set"; every screen says "Free to spend". One name.
C4. Statement preview says "1 is one you typed" then "Add 2 lines" and "Added 2 lines from statements"; only one was added to the figures (correctly). Say "Add 1 new line".
C5. The same spend (¥4,321, "lunch") logged twice in a row goes in twice with no word.
C6. A cash account is headed "Bank today: Wallet".

POLISH
P1. Dollars: whole amounts written "$15", others "$15.80". Write "$15.00".
P2. Card rows say "checked 5 Dec" under a figure that includes spends logged after.
P3. After a refused amount, "Type the amount, like 1200" stays under "That is more than Main bank holds (¥170,000). Save it anyway?".
P4. The assistant is not sent the "bank after the cards are paid" figure, so it cannot give the Home value.

Tied and held (no finding): spends, refund, Undo and reload on every life; bank checks with less and more than expected; late pay (121,500 and 11,000 worked and tied); bill changed from a date (past pay period unchanged); bill after next pay but before the one after (101,000, reachable rule); move between banks (safe unchanged at 244,000); cash spend; past-dated spend "already in your bank figure"; future date refused; empty date refused; 29 Feb refused by the box; 999,999,999 asks first, then no NaN or minus zero; weekly short case "−¥35,000"; three time zones same text; cents sum 1,234.56 - 15.80 - 99.99 - 100.50 = 1,018.27.

FOR MAKO'S EYE: none.

NOT CHECKED
- Assistant making or changing a figure and its Undo (only the figures it is sent were tied; made-up AI only).
- Goals, loans, budget lines, second income, two pays a month, every 3 and 4 weeks.
- Free to spend set from "This pay period only" and the period after; stop play money (not found).
- Desktop and 320 wide; light scheme.
- Order of entry swapped (same items entered in another order).
- Two devices and the cloud copy.
- Life after six weeks for the weekly, two-bank and day-after-pay lives (walked 1 to 3 weeks each, by budget).
