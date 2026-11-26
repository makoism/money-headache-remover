VERDICT: FAIL

CHECK: check3.txt ends "(full level, 3 at a time, 787 s in all)" / "ALL GOOD". Scope read.

OWNER'S WORDS (C, D)
- M26 MET. M27 MET: two cards on the 10th and 11th, holiday and weekend moves right (Jan 10 Sun and Jan 11 holiday give 12 Jan). M28 MET: one pay number. M29 MET. M30 KNOWN (IN SCOPE FILE). M31 MET. M32 MET. M33 COULD NOT TELL (Chrome desktop engine only). M34 MET. M35 MET.
- M36 NOT MET (blocker 1). M37 MET. M38 MET (no fixed pay: KNOWN). M39 MET. M40 NOT MET (finding 3). M41 MET. M42 MET. M43 NOT CHECKED. M44 NOT MET (blocker 1: a past period rewritten). M45 NOT MET (blocker 1: one removed 5,000 counted twice). M46 NOT BUILT (IN SCOPE FILE). M47 NOT CHECKED. M48 NOT MET (finding 5). M49, M50 COULD NOT TELL. M51 NOT MET (finding 7). M88, M89, M90 NOT BUILT (IN SCOPE FILE).

COUNT: lives walked 6 (monthly with two cards, 3 Dec to 13 Jan; every 2 weeks in dollars, 2 to 14 Dec; weekly, 2 to 5 Dec; no fixed pay, 2 to 21 Dec; set up the day after pay with bills gone, 11 to 29 Dec; three accounts with cash, 2 to 8 Dec). None reached six weeks except the monthly one. About 95 steps compared, about 600 figures. Tied: all but these. Wrong 3 kinds (blocker 1, finding 2, finding 5). Unexplained 2 (finding 3, finding 6). Bad input: 20 boxes tried. Time zones: Tokyo, Honolulu and Kiritimati gave the same screens in 4 books. Reloads: same figures. Assistant change_spend (made-up AI): 2 changes, both match the screens.

BLOCKERS
1. A spend removed before a later bank check makes up money when the check falls in the next pay period. Phone 390. New phone, today 1 Dec 2026, Set up on the screens: bank 100,000, pay 200,000 on day 25, Everyday spending 30,000. 3 Dec: Receipts, log 5,000 from Main bank, tap it, Remove, "Yes, remove it". 28 Dec: Check your bank, pay ticked, type 299,800 (the "Expected now" figure). Home: "¥35,000 is safe to spend until pay on 25 Jan". It should be ¥30,000: a full new period, nothing spent, bank exactly as expected. Receipts now: "spent −¥5,000 of ¥30,000", row "Removed on 3 Dec ... it was ¥5,000 at your bank check on 28 Dec, so the change counts here / back ¥5,000". The check on 28 Dec never held that spend; it was gone on 3 Dec. Earlier, 25 Nov to 24 Dec: "spent ¥5,200 of ¥24,000" (it was ¥200), so a past period is rewritten too. In the dollar life the same steps with $1,234.56 and $0.01 gave "$1,634.57 is safe to spend" and "Free to spend left $1,634.57 of $400.00" (should be $400.00). Happened in two separate books. A check in the same period did not do it, and neither did an amount change (2,000 to 200).

FINDINGS ON FIGURES
2. Removing a "Money came in" row that a bank check held raises safe to spend. Three accounts life: 2 Dec, Main bank 200,000, Savings 500,000, Wallet (cash) 15,000, Everyday spending 40,000, pay on the 25th. Logged a 2,000 cash spend, moved 20,000 Main to Wallet, logged a 3,000 gift into Main bank, moved 50,000 Savings to Main. 7 Dec check: 233,000 / 450,000 / 31,000, giving ¥26,666. 8 Dec, removed the gift: "¥29,666 is safe to spend", "spent ¥1,000", gap row "−¥8,000". The check held the gift, so it should stay ¥26,666, by this round's own rule. Undo brings back ¥26,666.
3. A card payment nobody typed. Day-after-pay life: 11 Dec, Rakuten owed 30,000, paid day 27, closes day 15. Logged 5,000 on 12 Dec and 4,000 on 16 Dec on Rakuten. 29 Dec check: bank 351,000, Rakuten 4,000. Home: "¥3,889 comes out on 27 Jan 2027", owed ¥4,000, and after the cards ¥499,111. Nothing typed gives 3,889. With the card at 4,000 and no split known, the payment should be one plain figure the person can follow, with a line saying why.
4. Messages say safe to spend went down when it did not. (a) Dollar life, 9 Dec: logged $20 dated 5 Dec, before the 7 Dec check. The message was "Logged $20 on Free to spend. Safe to spend goes down with it". It stayed $167.29, and the row says "already in your bank figure of 7 Dec". (b) Monthly life: lowered a spend from 7,000 to 300 after a check. The message was "Changed. Safe to spend goes down with it". It stayed ¥6,500. The words should give the real effect ("Safe to spend stays ¥6,500: your bank check of 8 Dec already had it").
5. In dollars, one amount is written two ways. "Logged $10" and Receipts row "$10", while Home shows "$10.00 (out, logged since)". Also "spent $0 of $257.14", and on the check sheet "last checked $2,500 on 2 Dec" and "Expected now $350" where Home shows $2,500.00 and $350.00. Always write two decimals in dollars.
6. No fixed pay (next to the KNOWN M38 line; this is more than that line says). 21 Dec: "Due in the next 30 days: Nothing is due in the next 30 days", but the sum just above takes off "¥70,000 (Rent 20 Jan)". One unexplained "¥1,990 (Free to spend by day)" sits among the ¥1,972 lines. The sum lists "¥1,972 (Free to spend by day)" about 50 times on one line.

CONFUSING
7. Cash is called a bank: "Bank today: Wallet". A 2,000 cash gap says "¥2,000 more left your bank than you logged". Money in shows as "back ¥3,000", like a refund. Moves sit in the Free to spend list as "¥20,000" with nothing saying they are not spending. Replace with "Wallet today", "more left Wallet", "in ¥3,000", "moved, not spent".
8. Pay-day morning, monthly life, 10 Dec: "Safe to spend until the pay after today's, on 8 Jan 2027, includes today's pay of ¥250,000" over "¥6,500". That ¥6,500 is the old period's leftover ("10 Nov to today's pay"), so the heading says it must last until 8 Jan. The scope leaves the pay-day words to Mako. This is about the date contradicting the figure.
9. Bad amounts: dollars "45.678" gives "Type the amount, like 1200" (say "two decimals, like 45.68"). Yen "12.5" in setup gives "Type what Main bank shows today" (say whole yen). "12,34" is taken as ¥1,234 without a word.

POLISH
- After cards, Home says "as their close days are not sure" when Amex has close day 15.
- A check gap reads "4 Dec to 8 Dec" when the gap covers the spend logged on 3 Dec, the setup day.
- Setup on a pay day: "See my money" does nothing visible at the bottom. The question "Has today's pay already landed in that figure?" sits up in the bank part.
- One "undefined" line showed on Receipts once, after the first change of a spend after a check (monthly life). Two repeats on their own did not show it again.

FOR MAKO'S EYE
- A weekly overspend (¥286 over) does not carry into the next week.

NOT CHECKED (token limit): statement import; goals (M43); bank below zero shown in amber (M47); two pay days a month and every 3 or 4 weeks; second income; loans; reminders and Settings figures; the Ask panel; two devices; the same spend entered twice; dates far in the future and in the past on Receipts; Undo after a check; six full weeks for lives 2 to 6.
