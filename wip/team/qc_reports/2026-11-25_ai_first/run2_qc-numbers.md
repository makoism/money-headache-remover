VERDICT: FAIL (confirming run 2, build lane/ai-join 0384e837; one part of B5 is still there. B2, B4 and C1 are fixed)

CHECK: check3.txt ends "(full level, 4 at a time, 695 s in all)" / "ALL GOOD" (the layout test before it: PASS).

OWNER'S WORDS: carried over from run1_qc-numbers.md, except for these. M51 MET (C1 fixed). M36, M37, M40, M44 and M45 MET again for the life below. M38 NOT MET only for the pay-day list (B5 below). M48 KNOWN (B1). B3 and C2 KNOWN (IN SCOPE FILE), not walked again.

COUNT
- Lives: 1, Mako's shape. Phone 390 wide. Main bank 300,000. Pay 250,000 on the 10th. Free to spend 60,000. Card A 40,000 paid on the 10th, Card B 20,000 paid on the 11th. Rent 72,000 on the 28th, Phone 5,000 on the 25th. Keep at least 20,000. Set up 1 Dec 2026, walked to 12 Jan 2027: two pay periods and a reload.
- Life steps compared: 24. Amount boxes tried with a wrong amount like "1,0000": 22.
- Figures: about 190 tied by hand, 0 wrong, 1 under a label that contradicts it (B5).

CONFIRMED FIXED
- B2: a ¥5,000 spend dated 30 Nov, after a 1 Dec bank check, says "Safe to spend stays ¥18,000", and the figure stays. A 3 Dec spend says "goes down", and the figure goes from 18,000 to 16,000. Card A ¥3,000 goes from 16,000 to 13,000, as the message says.
- B4: every box asks "Did you mean ¥1,000 or ¥10,000?" (or the same question for its own amount), and nothing is saved. Setup: bank, pay, Free to spend, card, bill, Keep at least. Receipts: "1,0000", "12,34" and "1,000,0". Plan: bill, goal, line, account, card, loan, Free to spend, pay, the pay's "Free to spend each pay from the change", and changing Rent. Check sheet: bank, Card A, Card B. Tick sheet: the pay amount. The assistant (made-up AI) sending amount "1,0000" gets "Nothing changed: a log spend I could not read". When it sends 10000, it gets "Safe to spend: 13000 to 3000", which matches the screen.
- B5, heading: 10 Dec, pay not ticked. "Safe to spend until today's pay is in" over ¥3,000. My working: 18,000 − 2,000 − 3,000 − 10,000 = 3,000. "Today: 288,000 + 250,000 − 43,000 = 495,000" is right. After the tick: ¥60,000 until 8 Jan 2027. Spare 378,000 = 495,000 − 20,000 − 5,000 − 72,000 − 20,000. 8 Jan gives the same heading over ¥48,000.
- C1: Home "Wallet today ¥20,000". Plan "Wallet ¥20,000 holds today".

BLOCKERS
B5 (the rest of it). On pay-day morning the list under "Next pay 10 Dec, today" belongs to the next period.
- Steps: the life above, open on 10 Dec, pay not ticked.
- Home shows "This pay period 10 Nov to today's pay" and "Next pay 10 Dec, today". Under "Due before next pay" it lists Card A 10 Dec ¥43,000, Card B 11 Dec ¥20,000, Phone 25 Dec ¥5,000 and Rent 28 Dec ¥72,000, "Together ¥140,000".
- Only Card A (¥43,000) is due by today's pay. The other three come after it.
- 8 Jan is the same: "Next pay 8 Jan, today", with Card A 12 Jan, Phone 25 Jan and Rent 28 Jan, "Together ¥88,000".
- Run 1 named this list as part of B5. scope.txt's rule is that until the pay is ticked, today is the old period's last day in every part.
- It should either list only what is due by today, or be headed "Due before the pay after, on 8 Jan 2027" (and on 8 Jan, before the pay after that, on 10 Feb).

TIED IN THE LIFE (no fault)
- 1 Dec: ¥18,000 = 60,000 × 9/30. Spare 280,000. After cards 490,000.
- 12 Dec: Card B late, still counted, spare 398,000.
- Spends and moves: Wallet spend 4,000 → 56,000. Card A spend 8,000 → 48,000, paid 12 Jan. Refund 1,500 → 49,500 and bank 476,500. A move of 10,000 changes nothing.
- 20 Dec check of 465,000 against 466,500: "¥1,500 more left your bank than you logged", safe 48,000, Receipts "spent ¥12,000 of ¥60,000".
- Rent changed to 75,000 from 26 Dec: spare 391,000. Ticked Phone and reloaded: 460,000. Ticked Rent: 385,000.
- Late pay: "not counting the 8 Jan pay yet (late)". Spare 303,000. The tick sheet expects 627,000.
- Pay ticked "Today, Tue 12 Jan": period 12 Jan to 9 Feb, ¥60,000, spare 553,000.
- Free to spend 50,000 from this period: 50,000 everywhere, then Undo, then reload: 60,000 everywhere.
- Past period 10 Dec to 11 Jan: 12,000 of 60,000, money in 250,000, bills 80,000, card payments 63,000.
- No NaN, minus zero or page errors.

POLISH
- "1,000,0" asks "¥10,000 or ¥1,000,000?". By the rule the other boxes follow, it should ask "¥1,000 or ¥10,000?".
- The tick with a blank bank box says "Bank checked".

NOT CHECKED: desktop and 320 wide; B4 in the setup chat itself (only the assistant's change door); the other five lives (carried from run 1).

Scripts: /tmp/qc/qc-numbers/
