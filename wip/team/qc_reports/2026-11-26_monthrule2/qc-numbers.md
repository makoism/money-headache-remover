VERDICT: FAIL

CHECK: check3.txt ends "(full level, 3 at a time, 823 s in all)" / "ALL GOOD" (last five lines are two [x] lines, a blank, those two).

OWNER'S WORDS (C and D)
- M26 MET: one main bank, all figures tie.
- M27 MET for paid in full on the day (shifts seen: 10 Jan Sun and 11 Jan holiday go to 12 Jan). Mako's own 10th/11th shape was walked last round, not again.
- M28 COULD NOT TELL: second income not walked this round.
- M29 M39 MET: setup asks "after tax"; pay counted as typed.
- M30 KNOWN (IN SCOPE FILE): card spends paid after next pay do not lower the spare figure.
- M31 M38 MET: periods pay to pay, dates on Home, late pay stretches the period, uneven periods from holiday moves add up.
- M32 M41 MET: "not sure" offered and used; a known close day (15) splits payments right.
- M33 COULD NOT TELL (no Android). M34 MET. M35 MET.
- M36 MET: bank figures add up and say "checked N days ago".
- M37 MET: bank = last check plus what happened since, every step.
- M40 NOT MET: finding 4.
- M42 MET: box empty, blank = none.
- M43 M49 COULD NOT TELL: goals not walked.
- M44 NOT MET: findings 1 and 3, figures depend on which door and order.
- M45 MET: statement matched 4 typed lines, nothing counted twice; unseen pay and bills never counted.
- M46 NOT BUILT (IN SCOPE FILE).
- M47 COULD NOT TELL: no life went below zero.
- M48 MET: USD cents tie ($1,234.56 - $0.30 = $1,234.26; 3 decimals refused); yen whole.
- M50 COULD NOT TELL.
- M51 NOT MET (small): cash is "bank" (CONFUSING 3).

COUNT: lives walked 4 of 6 (every 2 weeks, weekly, set up the day after pay, two banks and cash) plus a short dollar life. Monthly on the 10th and freelance not walked again (done last round). Steps compared 58 (setup 5, spends 12, refunds 3, moves 3, checks 9 incl. 4 not matching, late pays 3, bill changes 3, statement import 1, change/remove/Undo/reload 6, bad input 13). Figures compared about 270: tied about 261, wrong 2, unexplained 7 (143, 857, 444, 556, 536, 1,250, 5,714). No NaN, undefined, Infinity or minus zero seen; no page errors.

BLOCKERS
1. Statement import drops a typed refund and rewrites the past period. Life every 2 weeks, phone 390x844. Setup 4 Dec (bank 200,000, pay 120,000 every 2 weeks from 11 Dec, Free to spend 40,000, Visa 30,000 paid day 27, Rent 70,000 day 25, Phone 5,000 day 15, keep 10,000). Logged 6 Dec 3,000 bank, 7 Dec 8,000 Visa, 8 Dec Refund 2,000 back to Free to spend. 14 Dec Check your bank: pay ticked, bank 318,500. Past period read "27 Nov to 10 Dec, spent ¥9,300 of ¥20,000" (my working 3,000+8,000-2,000+300 found = 9,300, tied). 18 Dec Add statements, Use any AI, pasted a bank statement with the same rows plus SALARY 14 Dec, PHONE 6,000, KONBINI 1,200, COFFEE 500; screen "4 are ones you typed", Add 6 lines. Now: past period is "27 Nov to 13 Dec, spent ¥11,500 of ¥20,000"; the refund is gone (search "refund" and "2,000": "Nothing matches"). Should be 3,000+8,000-2,000+500 = 9,500. The refund's 2,000 back to Free to spend is lost, and a closed period's dates and figure changed. The same late pay starts the period on 11 Dec when ticked at a check and on 14 Dec when it comes from a statement, so period figures depend on the door used.
2. A move into the main account cannot be logged. Life two banks and cash (Main Bank, Savings, Wallet cash), Receipts, Moved, 390x844 and 1300 wide. "To" lists only "Savings, Wallet" and never changes when From changes. From Savings, To has no Main Bank; From Savings to Savings gives "Pick two different accounts". Savings to Main and Wallet to Main are impossible, so a person topping up the main bank must log it wrongly. Should list every account except the From one.

3. A bank check difference is spread by days across periods, giving figures nobody typed. Every 2 weeks life, 9 Jan check: expected 443,300, typed 444,300. Screen: "¥40,143 is safe to spend", Plan "¥40,143 of ¥40,000", Receipts "spent −⁠¥143 of ¥40,000", and the closed period 25 Dec to 7 Jan changed from spent 5,000 to "¥4,143" (−857). Weekly life 14 Dec: 1,000 short split 556/444, headline ¥14,556. Two-account life: editing a ¥700 spend to ¥7,000 dated 20 Dec (before the 29 Dec check) raised safe to spend from ¥46,063 to ¥48,013, via a new line "less went out than you logged ... −⁠¥1,250". Adding a forgotten spend must never raise safe to spend, and an unknown difference should sit in one place (the check day's period), not split into made-up shares that change closed periods.
4. "After your cards are paid" contradicts its own words. Every 2 weeks life, 30 Dec, after a 5,000 Visa spend with 38,000 overdue: "Still owed ¥43,000", "After your cards are paid today: Kumo Bank ... It counts everything on the cards now, as their close days are not sure ... ¥323,300". 361,300 - 38,000 = 323,300 leaves out the 5,000. Counting everything: 318,300. Either the figure or the words are wrong.

CONFUSING
1. Home, 16 Dec, every 2 weeks: Phone 15 Dec ¥5,000 is listed twice, under "Late, not ticked off yet" and "May still go through". Show it once.
2. Toast "Bank checked. ¥500 more left your bank than you logged" while this period's Receipts shows "¥200"; the other ¥300 sits in the old period. Say where it went.
3. Cash under "Your bank today: What does Wallet show today?" and "¥3,000 more left your bank" for cash. Use "your money" or the account's name.
4. Weekly, 6 Dec: a refund of an old-period card spend gives "Free to spend left ¥15,500 of ¥15,000". Say "includes a ¥500 refund".
5. Home working lines write minus as "−⁠" (with a hidden joiner) in the bank line and "−" in the safe-to-spend lines.

POLISH
1. "8 Jan" and "8 Jan 2027" on one Home screen (26 Dec).
2. Plan's Rent row shows only the next amount; the ¥72,000 from Jan is not visible until Jan.
3. Weekly card toast (3 Dec) does not say when the ¥2,000 leaves the bank, unlike the Visa toast.

FOR MAKO'S EYE: none.

ASSISTANT (made-up AI): what the page sends ties to the screen: "Safe to spend until next pay: ¥40,143", "¥444,300", "¥429,300", same working lines.

NOT CHECKED: monthly on the 10th and freelance (last round); goals, loans, second income; time zones and time of day (every open used the page's today); 29 Feb as a typed date (date box refuses it; day 31 bills move right: 31 Jan to 1 Feb, 28 Feb to 1 Mar); the assistant changing figures; Undo after import; screens under 390 wide.
