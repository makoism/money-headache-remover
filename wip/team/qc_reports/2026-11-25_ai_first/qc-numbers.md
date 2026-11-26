VERDICT: PASS (confirming run 3, build lane/ai-join 8be688e, per confirm_qc-numbers.txt. Run 2's one blocker, the rest of B5, is gone. The three things changed since run 2 hold, and nothing next to them broke.)

CHECK: check3.txt ends:
[x] Setup, short (setup3): ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide (M52, M33): ... (tests/e3_layout.js: PASS)
(blank line)
(full level, 3 at a time, 857 s in all)
ALL GOOD

OWNER'S WORDS: carried over from run2_qc-numbers.md (now renamed, was qc-numbers.md) and run1_qc-numbers.md, except for these. M38 MET (the pay-day list now has a heading that matches it). M31, M36, M37, M40, M45 MET again for the life below. M48 MET for decimals at Save in yen and dollars. Dollars written two ways is KNOWN (B1, scope.txt) and was seen again ("$180" on Receipts, "$180.00" on Home). Not walked again: B3, C2, the card share at the close day (KNOWN).

COUNT
- Lives: 3. (1) Mako's shape: Main 300,000, pay 250,000 on the 10th, Free to spend 60,000, Card A 40,000 paid on the 10th, Card B 20,000 paid on the 11th, Rent 72,000 on the 28th, Phone 5,000 on the 25th, Keep at least 20,000. Set up on 1 Dec 2026, opened on 10 Dec: before the tick, after ticking both, after ticking only Card A, and after a reload. (2) The same, but pay on the 25th, set up on Fri 10 Sep 2027 (25 Sep 2027 is a Saturday): Home, Plan and the assistant's picture. (3) Dollars, Free to spend 600, Keep at least 100.
- Steps compared: 14. Figures tied by hand: 71. Wrong: 0. Unexplained: 0. Page errors: 0.
- Decimal boxes tried: 15 (Receipts 5 in yen and 4 in dollars; setup bank in yen and dollars, setup Free to spend in yen and dollars; tick sheet pay in yen; Plan Add a bill in yen). All 15 right.

CONFIRMED FIXED
- B5, 10 Dec, pay not ticked (390 wide). Heading "Safe to spend until today's pay is in" over ¥18,000 = 60,000 × 9/30 (10 Nov to 9 Dec is 30 days, 9 left at setup), no spends. "Today: ¥300,000 + ¥250,000 (Pay 10 Dec) − ¥40,000 (Card A) = ¥510,000" is right. The list is headed "Due before the pay after today's" and lists Card A 10 Dec ¥40,000, Card B 11 Dec ¥20,000, Phone 25 Dec ¥5,000, Rent 28 Dec ¥72,000, "Together ¥137,000". The pay after today's is Fri 8 Jan 2027 (10 Jan is a Sunday), so all four belong under that heading and the sum is right.
- After ticking the pay and Card A, with the bank box blank: bank ¥510,000. Safe to spend ¥60,000 until 8 Jan 2027. Spare ¥393,000 = 510,000 − 20,000 (Card B) − 5,000 − 72,000 − 20,000. Period "10 Dec 2026 to 7 Jan 2027". "Due before next pay": Card B, Phone, Rent, "Together ¥97,000". After cards: ¥490,000. After a reload, every figure was the same.
- Pay left unticked and Card A ticked: bank ¥260,000. Spare ¥240,000. Still ¥18,000 "until today's pay is in". "1 thing to tick off". "Today: ¥260,000 + ¥250,000 = ¥510,000". The list is headed "Due before the pay after today's" and lists Card B, Phone and Rent, ¥97,000. Card A shows ¥0, "Nothing to pay yet". The pay is never counted twice and never taken as in.
- Weekend-moved pay. Plan says "day 25 each month, next 24 Sep (25 Sep is a Saturday, so the working day before)". The Phone bill says "next 27 Sep (25 Sep is a Saturday, so the working day after)". The assistant's picture (made-up AI, the page's own request) has the same two lines word for word, plus "Next pay: 24 Sep, in 14 days" and "Safe to spend until next pay: ¥28,000", which matches Home. ¥28,000 = 60,000 × 14/30 (25 Aug to 23 Sep is 30 days, 14 left from 10 Sep). Spare ¥260,000 = 300,000 − 20,000 (Card B, moved to Mon 13 Sep) − 20,000.
- Decimals at Save. Yen: "1500.5", "1500.50", "1,500.5" and "0.5" each say "Yen has no decimals. Type a whole amount". Nothing is saved, the typing stays in the box and the figures do not move. The setup bank, setup Free to spend, the tick sheet's pay amount and Plan's Add a bill all say the same. Dollars: "12.345", "0.001" and the setup bank "3000.125" each say "That has too many decimals. Use 2 at most", and nothing is saved. "12.3" saves as $12.30, and Free to spend left goes from $180 to $167.70. "3000.12" saves. Home: $3,000.12 − $24.60 = $2,975.52. Spare $2,875.52, held back $2,720.12, safe $155.40. All tie.

BLOCKERS: none.

CONFUSING
- On a pay day, "Due before the pay after today's" does not say when that is. Replace with "Due before the pay after today's, on 8 Jan 2027".

POLISH
- A card payment moved by a weekend or holiday does not say why. Pay and bills do. Plan's "Card B ... Next payment ¥20,000 on 13 Sep" (11 Sep 2027 is a Saturday) and "Card A ... on 12 Oct" (10 Oct is a Sunday and 11 Oct a holiday) give no reason. The assistant's picture gives none either ("Card B 13 Sep ¥20,000"). The same happens in Dec 2026 to Jan 2027: "Card A 12 Jan".
- "1500." in yen saves as ¥1,500 without a word. That is harmless.
- Already queued elsewhere, seen again: a blank bank box at the tick sheet says "Bank checked".

FOR MAKO'S EYE: none.

NOT CHECKED (confirming run, per confirm_qc-numbers.txt): the other lives and the full grid are carried from run 1 and run 2. Not checked here: 320 wide and desktop, and the setup chat with decimals (only the screens were tried).

Scripts: /tmp/qc/qc-numbers/
