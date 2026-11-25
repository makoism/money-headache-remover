# qc-novice, plan mode: CASH_PLAN.md (lane/cashplan)

VERDICT: FAIL
CHECK: no check3.txt (plan round, no build). Note: MAKO_SAYS.md on lane/cashplan stops at M82 and has no section H; I read section H (M88 to M99) from the main checkout. The branch should take the newer page before building.

## Three scenes (me, 25, never budgeted, friend sent the link)

**Scene A, setup on the 17th, phone in hand on the sofa.** Pay is 210,000 on the 25th. I have 8,000 in my wallet and use PayPay for most small things. The assistant asks how I want to run money: Cash envelopes / Split my bank / Keep it in the bank / Not sure yet. I live in a share house, no safe place for envelopes, but I always carry a wallet. I want "just my play money in my wallet, the rest in the bank". That answer is not there. I tap "Keep it in the bank", and now I never get a play wallet at all (question 4 is cash way only). Then "set amounts or percentages?" I have no idea which; there is no "you pick for me". Then a play amount: I have never known what I spend on fun. Only "Skip for now", which tells me "everything on your cards comes off safe to spend", a number I have not seen yet.

**Scene B, the first pay day, at work.** Card "1 of 3": leftovers, then extra money 30,000 "Split, keep in the bank, or later?". I tap Split. Into what, how much? I wanted it to suggest a split. Then the cash list. I went to the ATM at lunch and it only let me take 50,000 and charged 220. I tap "I took out a different amount", it fills envelopes "in the list's order" and the last one is short. I wanted to pick which one is short, and to be asked for the rest tomorrow. I also realise I want to go back to card 1 and change my answer. No Back is described.

**Scene C, three weeks later.** I forgot the app. Grandma gave me 10,000 cash, a friend paid me back 3,000 cash, I paid two dinners on my card. I type "about 15,000 in my wallet". The wallet went UP from what the app thinks. I check the bank and it is 50,220 lower than the app thinks, because I never tapped Done. The app counts that as play money spent.

## OWNER'S WORDS (plan as written)
- M52 visual first: COULD NOT TELL (no picture of the pay day card or Home in cash way).
- M53 one thing at a time: MET (setup one question at a time; pay day "1 of 3").
- M54, M55 sounds like him: COULD NOT TELL (words are drafts for qc-voice).
- M56 "Everyday spending": NOT MET, plan adds "play money", "extra money", "kept in the bank", "to decide", "envelope", "burrow" with no plain meaning given at the moment they appear.
- M88: MET in engine; NOT MET in setup (no "not sure, pick for me").
- M89: MET (split, bank, later); "split" has no suggestion.
- M90: MET (E3).
- M91: NOT MET in five places (blockers 1, 3, 4, 5, 6).
- M92: NOT MET for "split my bank" (blocker 2).
- M93: NOT MET, play wallet only offered to the envelope way (blocker 1).
- M94: MET.
- M95: NOT MET when the wallet goes up (blocker 5).
- M96: MET for the full, on-time case; NOT MET for partial, late or already-done (blockers 4, 7).
- M97: NOT MET, Home in cash way never says the wallet IS my play money (confusing 1).
- M98: three scenes are in the plan; the "what else could be true" stops short of the cases below.

## COUNT
Plan steps walked: 14 (setup Q1 to Q4, wallet update, open question, pay day cards 1 to 3, Not today, different amount, extra money split/bank/later, way change, envelope removed, three weeks away). Fine: 5. With a missing choice or no way out: 9.
Places I would give up: 3 (Q1 with no fitting answer, play amount with no help, Split with no suggestion).
Words not explained: 9 (burrow, envelope as an app thing, play money, safe to spend before it is shown, extra money, kept in the bank vs to decide, split my bank, percentage of pay "before or after tax", "1 of 3").

## BLOCKERS
1. **Setup Q1 has only one answer in mind per way.** Answers: Cash envelopes / Split my bank / Keep it in the bank / Not sure yet. The commonest real answer, and M93's own rule ("Play money is cash, everything else is card"), is "only my play money in cash" for someone with no safe place for envelopes. Choosing bank removes the wallet question (Q4 is cash way only). Add "Just my play money in my wallet" and offer an e-wallet (PayPay) as the play wallet, since `holds` already allows e-wallets.
2. **"Split my bank" does nothing.** E6 says the way changes words only; E2 lets only cash, wallet and e-wallet accounts `holds` a burrow, so a second bank account for Food brings back Gap 1 (main bank reads short, sub account reads free money). No pay day list of transfers to set up, no word on where a person finds out if their bank has sub accounts or automatic transfers. A person who picks the second best way is worse off than one who picks the third.
3. **The play amount has no help.** "Skip for now" is the only way out for "I don't know". Add "Suggest one" (from pay less bills, as a set amount or %) and say what safe to spend is in one line before naming it.
4. **The cash list cannot be part done or already done.** "I took out a different amount" fills in list order and the last envelope takes the difference, with no choice of which is short and nothing about the rest later. ATM fee not covered. Add "I took out part, the rest later" and let me pick the envelope.
5. **Cash that comes IN to a wallet.** A wallet update higher than the app's figure (gift, paid back, change from a card spend) is not in the plan. Today's check maps a gap to play spent; a negative gap would silently raise play money or count as negative spending. Ask "Where did the extra come from? Paid back / gift / I forgot to log cash out / Not sure".
6. **Undo and going back in the pay day sequence.** Each card has Undo, but no Back from card 2 to card 1, and no "close and finish later" for the whole sequence. Say what happens when I leave at card 2 and return.
7. **Bank does not match because I took cash out but never tapped Done.** E5 "Not today" and a later bank check are not joined: the gap counts as spending. When a bank gap is near the cash list total, ask "Did you take out your cash?".
8. **Three weeks away.** cashMoment uses "the period that started": on day 21 it still asks me to take out the whole month. Also more than one pay missed (weekly or two-weekly). Say what happened ("Pay came on the 25th, you did not take out cash yet; 9 days are left, take out X or skip this time").
9. **Switching way with cash at home.** E6 "moves no money", but switching from cash to bank leaves envelopes with `holds` and real cash in them; removing an envelope (E2) drops `holds` but says nothing of the cash in it. Ask "Keep it as cash, or put it back in the bank?".
10. **The 100% check has no words and no way out.** "the write door refuses" when percents plus bills pass 100. Say by how much and offer "lower Play to X%" or "make Food a set amount". Also a smaller pay that makes bills plus percents pass 100 after setup is not met with any message.

## CONFUSING
1. Cash way Home: plan shows "Play wallet about 12,000" and a safe to spend headline; when a play spend went on the card these differ (wallet 12,000, safe 9,000) with no reason given. One line: "3,000 of your play money went on your card, so 3,000 of your wallet is covering it."
2. "Keep it in the bank" vs "Decide later" on extra money: both leave money in the bank; say the difference ("we won't ask again" vs "we'll remind you").
3. "Set amounts or percentages" before the app knows if my pay is fixed: with no fixed pay, warn that a percent burrow is 0 until pay lands (R2).
4. Wallet starts at 0 in setup though I have 8,000 in it. Ask "How much is in it now?".

## POLISH
- Each new setup question should save on its own with a "saved" notice (M16); the plan does not say.
- "I spent about 5,000" from the play wallet: add "some of it was groceries".

## FOR MAKO'S EYE
- Whether "envelope" or "wallet" is the word for every cash place.
- Whether the cash moment shows a picture of the envelopes filling (M52).

## NOT CHECKED
The app (plan mode). Arithmetic of E1 to E5 (qc-numbers). Saved shape (qc-foundation). M99 overview (separate plan).
