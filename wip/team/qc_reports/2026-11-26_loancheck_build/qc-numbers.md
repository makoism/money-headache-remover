VERDICT: FAIL (two wrong loan figures, both from a payment answered "No, not yet")

CHECK: check3.txt ends "(full level, 3 at a time, 940 s in all) / ALL GOOD / EXIT 0". Build: worktree c6, lane/controls-6 at d895eb30, app3/index.html, phone 390x844, Asia/Tokyo unless said. Assistant: the made-up AI (fake_ai_page.js), not the real one.

OWNER'S WORDS (C and D, plus the round's line)
- M13 M40 (loan still owed): NOT MET. The door works in all three places, but blockers 1 and 2 give wrong figures.
- M26 MET. M27 MET. M28 MET. M29 MET. M31 MET. M32 MET. M34 MET. M35 MET.
- M30: KNOWN (IN SCOPE FILE), the card spends fault. I did not walk card spends.
- M33: COULD NOT TELL. Only a headless Chrome phone was used.
- M36: NOT MET for loans. Blockers 1 and 2. Also no line on Plan or Home says when a loan was last checked, while cards say "checked 24 Nov".
- M37 MET. M38 MET. M39 MET. M41 MET. M42 MET. M47 MET (no minus bank seen). M48 MET for yen. M50 MET.
- M44: NOT MET. In blocker 1 the same facts give 812,400 or 782,400 depending on which day the tick was entered.
- M45: MET. No coin was counted twice. In blocker 1 a payment is missed, not doubled.
- M51: MET apart from the date in CONFUSING 1.
- M43, M49: not touched by loans, not walked.
- M46, M88, M89, M90: NOT BUILT (IN SCOPE FILE).
- M13 (interest), M13 (loan payment), M23 (loan statements): NOT BUILT (IN SCOPE FILE). No door a person can reach sets interest or a percentage minimum. Add a loan has no such box, the assistant's add_loan takes only name, owed, amount and payDay, and setup adds no loans (KNOWN).

COUNT
- Lives walked: 2.
  - Kenji: 20 Nov to 10 Feb, nine branches.
  - Mako's shape by chat with a Student loan added: 24 Nov to 20 Jan, three loan checks (Check your bank, Plan, assistant), a check on a payment day both ways, a second bank paying a second loan.
- Steps compared: 52.
- Figures tied by hand: 171. Wrong: 3. Unexplained: 0.
- Bad input grid on the loan box: 16 cells, 16 done. Plain words for empty, minus, letters and decimals. Past, future, before-opening and before-earlier-check dates are refused with plain words.
- Undo: from the bar, from Settings > Recent changes after a reload, and on the assistant's card: 3 of 3 right.
- Time zones: Tokyo, Los Angeles, Kiritimati and UTC show the same figures.

BLOCKERS

1. A payment answered "No, not yet" and then ticked at Check your bank, with the bank last checked before its due day, never lowers what is owed.
- Steps (Kenji, the plan's own numbers): new phone 20 Nov 2026.
  - Main 500,000, pay 300,000 on the 25th. Plan > Add a loan: Car loan 900,000, 30,000 on day 27.
  - Tick 27 Nov on 28 Nov (bank 770,000). Tick 25 Dec and 28 Dec on 29 Dec (bank 1,027,655). Leave 27 Jan unticked.
  - 3 Feb: Plan > Car loan > Still owed today 812,400 > "No, not yet" > Save. The screen shows 812,400 with 27 Jan overdue, which is right.
  - 5 Feb: Check your bank. Keep Pay 25 Jan and Car loan 27 Jan ticked. No "Landed on" box is offered. Main 1,297,655, loan box blank. Save.
- Screen: Plan "Car loan ... ¥812,400 still owed". The assistant is told the same.
- By hand: the 812,400 the person typed still held the 30,000 that had not gone. It has gone now, so 812,400 − 30,000 = 782,400.
- The same happens when only the loan is ticked on 5 Feb, and when the No came through the assistant (card "Car loan still owed ¥812,400 today, the 27 Jan payment not gone yet").
- Ticked later with a landed day after 3 Feb (pay ticked 5 Feb, loan ticked 10 Feb dated 6 Feb), it is right: 782,400.
- Every later payment carries the extra 30,000. On 2 Mar the screen would be 30,000 too high again.
- Where: the tick that Check your bank dates on the due day (27 Jan, before the check), with the No answer on the check.

2. A loan check lower than a payment answered "No" leaves the full payment due, then shows a minus still owed.
- Steps: Kenji's book as above, at 3 Feb before any check. Plan > Car loan > 10,000 > "No, not yet" > Save.
- Screen: "¥30,000 due 27 Jan has not been seen". Home: "¥1,027,655 (Main today) − ¥30,000 (Car loan 27 Jan, late) = ¥997,655".
- By hand: the lender says only 10,000 is owed in all, so at most 10,000 can leave. Safe to spend should be 1,027,655 − 10,000 = 1,017,655.
- With 0 instead of 10,000:
  - 4 Feb: Check your bank, untick Car loan, Main 1,327,655.
  - 10 Feb: tick it, Main 1,297,655.
  - Plan shows "Car loan −⁠¥30,000 still owed" and the assistant is told "Car loan | −¥30,000".
  - The loan sheet loses its figure ("A loan closes once it is paid off", with no amount before it).
  - Its Still owed box is filled with "-30000", which the same box refuses.
  - Close this loan says "Car loan still owes money. Tick its last payment at Check your bank first".
- Should: never below 0. Either ask "the lender's figure is less than the 30,000 payment still to go, is that right?" or cap the payment at what is owed.

CONFUSING
1. One payment, two dates. Plan, Check your bank and Plan's question say "Has the 28 Dec payment of ¥20,000 left your bank?" (27 Dec 2026 is a Sunday, moved to Monday). The refusal for the same payment says "The 27 Dec payment is recorded as leaving on 29 Dec". Use the moved day everywhere.
2. At Check your bank, next to a ticked loan payment, the box says "The app has ¥600,000". Once that tick saves, the app has 580,000. Say "¥580,000 after the ticks above".
3. No loan line on Plan or Home says how fresh it is. Add "checked 28 Nov" as cards have.
4. Nothing asks before a loan jumps tenfold. "5617000" over 561,700, and "999999999", are saved at once (Undo works). Suggest asking when a check is far above the last figure.
5. Home: "¥1,027,655 (checked 29 Dec 2026) − ¥30,000 (out, logged since)". Receipts for that stretch says "Nothing logged in this stretch". Either list the ticked loan payment in Receipts, or say "ticked since".
6. Pay-day morning (25 Nov, Kenji): the heading says "Safe to spend until the pay after today's, on 25 Dec, includes today's pay of ¥300,000". The figure is ¥500,000, the bank before the pay. That is right as the lowest point, but the words say the pay is in it.

POLISH
- "−⁠ ¥12,345" on the bank line has a different gap from "− ¥30,000" on the safe line.

FOR MAKO'S EYE
- None.

WHAT IS SOUND (by hand = screen)
- Yes on Plan: 3 Feb, 812,400, Yes. Bank 997,655, owed 812,400, next 30,000 on 1 Mar (27 Feb is a Saturday), safe 997,655. Undo brings back 840,000 with 27 Jan overdue.
- Not now: "Nothing saved yet. ¥812,400 is kept here on this device ...". It is refilled marked "Not saved yet". Saving the 3 Feb draft after the 27 Jan tick dated 5 Feb is refused with plain words. Saving it dated 9 Feb gives 812,400.
- Mako's shape with the Student loan, 600,000, 20,000 on day 27:
  - 24 Nov: safe 286,000 − 7,400 − 72,000 − 5,200 − 20,000 = 181,400; after the cards 344,400.
  - 28 Nov: loan 581,200 (interest), bank 180,900 with "¥500 more left your bank than you logged", next 20,000 on 28 Dec.
  - 28 Dec, unticked with check 581,700: overdue none, safe 226,500. Ticked the next day: 561,700, next 27 Jan.
  - 28 Dec ticked with 561,700: 561,700.
  - 5 Jan, assistant, 540,000: the card shows before and after. Undo after a reload gives 561,700.
  - 20 Jan, check 15,000: next payment 15,000, safe 357,100 to 362,100, together 104,600 to 99,600.
- Phone loan paid from Sub bank, 60,000 at 5,000, checked 40,000 with Yes: Sub bank 45,000, safe 117,100 + 40,000 = 157,100. "Sub bank goes below zero in Nov 2027" goes away (45,000 is at least 40,000).
- The assistant's figures (FIGURES block, change cards) equal the screen at every step checked: 8 of 8.

NOT CHECKED
- The four other lives the brief names, with a loan: every two weeks, weekly, freelance, set up the day after pay. Time went to the loan cases.
- Interest and a percentage minimum: no door reaches them (above).
- Two devices: foundation did the engine side.
- Sizes 320 and 1300.
- Statement import: banks and cards only (in scope).
- A refund and a move between own accounts next to a loan.
