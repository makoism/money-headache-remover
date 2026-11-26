VERDICT: FAIL

CHECK: check3.txt ends "(full level, 3 at a time, 853 s in all)" / "ALL GOOD" (the line before is the layout test: PASS).

OWNER'S WORDS (C and D)
- M26 MET: one main bank. M27 MET: two cards paid on the 10th and 11th. A 10 Jan payment moved to 12 Jan (a Sunday, then a holiday on the 11th). M28 MET: one number. M29 M39 MET: it asks for the after-tax amount.
- M30 KNOWN (IN SCOPE FILE): life 1 setup showed ¥280,000 = 300,000 − 20,000, with ¥50,000 on the cards left out.
- M31 M37 M38 MET for fixed pay. A late pay moved the period start (12 Dec to 7 Jan). For no fixed pay, two figures contradict each other (B3).
- M32 M41 MET. M34 M35 MET.
- M36 MET for the sums. M40 MET: every "after your cards are paid" figure tied.
- M42 MET: blank means none. M44 MET for what I tried: the same figures after a reload and in three time zones (Tokyo, Honolulu, Kiritimati). M45 MET: moves are not counted as spends, and a spend dated before the bank check is not counted twice.
- M48 NOT MET (B1). M51 NOT MET (C1, C2).
- M43 M49 M50 NOT CHECKED. M47 COULD NOT TELL: I did not check the colour. M46 M88 M89 M90 NOT BUILT (IN SCOPE FILE).

COUNT
- Lives walked: 6. Full: life 1 (monthly on the 10th, two cards; 1 Dec to 9 Jan) and life 6 (two banks and cash). Shortened: life 2 (every 2 weeks, dollars), life 3 (weekly), life 4 (no fixed pay), life 5 (set up the day after pay). Lives 3, 4 and 5 are 1 or 2 steps each, not six weeks.
- Steps compared: 58. Covered: setups, spends, a refund, moves, a late pay, a bill change, bank checks that did not match (−500 and +1,000.50), a remove, Undo, a reload, a plan change against past periods, 11 bad amounts, 9 bad bills or days, 3 time zones, 1 assistant setup.
- Figures: about 150 tied, 4 wrong or contradicting (B1 to B4), 1 that cannot be explained (B5).

BLOCKERS
B1. One amount is written two ways (M48, the "written the same way" rule). Phone 390. Life 2, dollars, "Somewhere else".
- After the 12 Dec check, Home's top line reads "$300 is safe to spend until pay on 25 Dec" and the card under it reads "$300.00".
- With free to spend used up, Home shows "$0.00" and Receipts shows "Safe to spend $0".
- Log 5: the message says "Logged $5" and the list shows "$5", while Plan says "$300.00".
- It should be $300.00, $0.00 and $5.00 everywhere.

B2. The message for a spend dated before the bank check states something false. Life 6, 3 Dec, last check 1 Dec.
- Steps: Money went out, ¥5,000, Main bank, Day 30 Nov.
- The message says "Safe to spend goes down with it". Safe to spend stays ¥37,000, and the row says "already in your bank figure of 1 Dec".
- The figure is right. The message should say it changes nothing.

B3. No fixed pay: two figures on one Home screen contradict each other. Life 4, 1 Dec: bank 500,000, Free to spend 100,000 a month, Rent 80,000 on the 27th, keep 50,000.
- The screen says "Lasts about 12 weeks at this rate" and also "Later on: Main bank goes below zero in Jun 2027".
- My working: 500,000 ÷ (80,000 + 100,000) is about 2.8 months, so below zero around late Feb 2027. Jun 2027 only comes out if Free to spend is left out (500,000 ÷ 80,000 = 6.25 months).
- After logging 200,000 in: "16 weeks" and "Aug 2027". The same split.
- The working line lists "− ¥3,287 (Free to spend by day)" 27 times and takes off "Rent 27 Jan". The list above it is headed "Due in the next 30 days" and shows only Rent 28 Dec.
- This is not the month-rule fault in scope.txt: no plan amount was changed.

B4. A wrong amount gives a confident figure.
- Steps: Plan, Add a bill, amount "1,0000", day 31.
- It saves "Gym ¥10,000" with no question. "1,0000" is a misplaced comma or an extra zero: 1,000 or 10,000.
- It should ask, the way it already refuses "3000.5".

B5. Pay-day morning: the figure does not match its label. Life 1, 10 Dec, pay not ticked.
- The label reads "Safe to spend until the pay after today's, on 8 Jan 2027", over ¥13,000.
- ¥13,000 is what is left of the old period's Free to spend (18,000 − 5,000). It only lasts for today: after the tick, the new period shows ¥59,500 left of ¥60,000.
- The same screen says "Next pay 10 Dec, today", while "Due before next pay" lists Card B 11 Dec, Phone 25 Dec and Rent 28 Dec (together ¥139,000).
- scope.txt's rule is that until the pay is ticked, today is the old period's last day in every part. Here the dates in the label point to the new period. This is not the heading wording that scope.txt lists as known.

B6. A spend over safe to spend goes in without asking (M6 as written in scope.txt: ask first for changes over safe to spend).
- Life 2: logged $1,000.50 with $214.28 safe to spend. It went straight in, and Free to spend went to −$791.22.
- Only an amount over what the bank holds asked first ("That is more than Main bank holds ($1,234.56). Save it anyway?").

CONFUSING
C1. Cash is called a bank (M51). Home: "Bank today: Wallet". Plan: "Wallet / Cash / ¥20,000 / bank today". Suggested words: "Wallet today", "holds today".
C2. Life 1: a refund of ¥1,000 back to Main bank counts on Home as "+ ¥1,000 (in, logged since)". The past period's summary shows "Money in ¥0" for the same period. Suggested words: "Pay in", or count refunds there.
C3. No-fixed-pay setup still shows "How much lands in your bank each pay day, after tax?" Also, Home says "only ¥100,000 of your Free to spend is left this period", while Plan says "there are no pay periods".
C4. The wording "until the pay after today's" (B5) next to "Next pay 10 Dec, today".

POLISH
- 3000.5 yen in a bill gives "Type amount as an amount". It should say "Yen has no decimals, type 3000 or 3001".
- 12.345 dollars gives "Type the amount, like 1200". It should say "two decimals at most".

TIED (no fault)
- Life 1 throughout: 299,000; 496,000; the late pay; 140,000 = 299,000 − 33,000 − 20,000 − 6,000 − 80,000 − 20,000; the check gap of 500 counted as spending; 389,500; rent changed to 85,000 counts from 28 Dec; 640,500; Undo and reload return the figures to the last unit; 529,500.
- Changing Free to spend to 50,000 ("this pay period and after") left the past period at "¥14,500 spent of ¥60,000". The 10 Nov to 11 Dec summary: 5,000 of 18,000, card payments 53,000.
- Life 2: 214.28 of 300 for 10 of 14 days, rounded down. The bank check that found 1,000.50 more asked about it. Removing the spend made the figures right.
- Life 3: the card's statement split (closes the 15th, paid 28 Dec, the 20 Dec spend paid 27 Jan); pays not seen yet are kept apart.
- Life 5: a bill after the next pay that the bank cannot reach. Short by ¥7,000 = 15,000 − 12,000 + 50,000 − 60,000, and safe to spend shows 0.
- Life 6: moves and cash (220,000 / 70,000 / 27,000, safe 37,000).
- Days: 29 Feb becomes 1 Mar 2027. 31 Apr is refused. A future day is refused. Day 31 in December becomes 4 Jan, after the bank holidays.
- Assistant: the made-up AI only (no real AI). After Mako's setup by chat, Home and what the page sent the AI both read 201,400 and 286,000. My working: 286,000 − 7,400 − 72,000 − 5,200 = 201,400; after the cards 364,400. KNOWN card fault (M30).
- No NaN, undefined, Infinity or minus zero anywhere. No page errors.

NOT CHECKED
- Statement import: it needs the AI or a pasted reply, and I did not work out a statement format.
- Six full weeks for lives 3, 4 and 5 (shortened above).
- Two pays a month. Every 3 and every 4 weeks.
- Goals (M43), percents (M49), the first entry becoming the usual amount (M50), the amber colour (M47), budget lines.
- "Change the next one only" and "End this bill". The bad-input list on the setup boxes and the bank check boxes (done on Receipts and Plan only). The same spends entered in a different order.
- What the assistant says or changes after setup. The made-up AI only echoes, so no figure it states could be compared.
- Desktop and 320 wide (phone 390 only).

Scripts: /tmp/qc/qc-numbers/
