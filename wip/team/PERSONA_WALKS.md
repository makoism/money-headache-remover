# Persona walks: seven made-up people, each with tasks to finish

Side S, 2026-11-19. Branch side/persona-walks. Docs only. Every person and every number here is invented. The shapes match the Philippine personas in PERSONAS_PH.md, plus one shaped like Mako (Lito). Nothing here is a real figure.

## The brief (give this section, one walk, and the build path to a fresh agent)

You are a person, not a tester. You have never used a money app. You are given one person (one walk below) and a build of The Burrow. Use only what the screens show. Do not read code, docs or tests. Do not ask anyone how it works. Pretend you cannot.

**Setup**
- Open the build path you were given in a browser at **412x915** (a phone screen). Start with empty storage: a fresh profile, or clear site data first.
- Today in the story is Thursday 19 November 2026. Use the made-up numbers in the walk, exactly.
- Do only the tasks marked **v1**. Skip the ones marked **team**: the build cannot do them yet.

**For each v1 task, in order**
1. Try to finish it using only the screens.
2. Write down **done** or **stuck**. Stuck means you gave up, or you would have, as this person.
3. Write the figure the app showed beside the figure expected. If they differ, say so plainly and write both. Do not decide who is wrong.
4. Write every moment you thought "how do I do this?", with the exact words on the screen and the screen you were on. Include moments you did get past.
5. Write where you would have given up, even if you kept going.

**Report format** (under 700 words)
- A table, one row per task: task, done or stuck, seen, expected, and the screen where it went wrong.
- Then the list of every "how do I do this?" (screen, exact words, what you tried).
- Then anything that covered a button or number, lagged, or was hard to read at 412x915.
- Screenshots in /tmp/walks/<person>/, one per task at the moment you finished or got stuck.

**Judge by this:** I do not know money words. Do I know what this screen means, why it matters to me, and what to do next? (NORTH_STAR.md, "How to judge any change".)

## Rules the figures follow (corrected 2026-11-19, LAUNCH_CHECKLIST A4)

**Total** is the money the person has, summed over the places it sits. Free to spend is what the plan says can be spent this month. "Bank after the cards" is the bank figure less what is on the cards paid in full.
- **Using a card** (or buying on pay-later): what is owed goes up. Total stays the same. The bank figure stays the same. "Bank after the cards" and Free to spend go down by the amount.
- **Paying a card** (or a loan or pay-later part) from an account: that account goes down and what is owed goes down by the same amount. So Total goes down. "Bank after the cards" and Free to spend stay the same.
- **Moving money** between the person's own places: Total stays the same.

## How the expected figures were made

Each expected figure is worked out by hand, with the sum shown. The v1 candidate holds: one bank figure (typed from the bank app, labelled now), one pay number and pay day, bills, one goal, cards and loans (a balance each, and a pay date), receipts, Undo, a cloud copy with a recovery code, a backup file. It does not hold several accounts, a ledger, the money door ("Money came in" and "Money went out" kinds), two pay days, dollars, cards' cut-off days or card instalments. Those are the team tasks.

If a v1 screen the task needs is missing from the build you were given (for example "bank after the cards are paid"), write "no screen for this" and move on. That is a finding, not a failure on your part.

Two caveats the walker should know and report on rather than judge:
1. Logging a receipt may or may not change the bank figure in the build. Report both figures and the amount.
2. Safe to spend may be worded or computed differently from the "smaller of two figures" given here. Report the app's own figure and sentence next to the expected one.

## The seven people

| Walk | Who | v1 tasks | Team tasks | Main thing it tests |
|---|---|---|---|---|
| 1 | Bea, freelance editor, Android | 9 | 6 | Uneven pay, a zero month, money in several places |
| 2 | Carlo, salaried editor, Android | 8 | 6 | Pay in two halves, pay-later, bank below zero after the card |
| 3 | Mika, remote lead, iPhone | 8 | 7 | Two cards, savings elsewhere, a card instalment |
| 4 | Jun and Tess, a couple, Android | 8 | 8 | Three pay days, cash, a store instalment, one phone |
| 5 | Rina, first job, iPhone | 9 | 6 | No money words, owes more than she has, a missed week |
| 6 | Dan, team lead, Android | 11 | 4 | A card with interest, a loan, a new phone |
| 7 | Lito, shaped like Mako, Android | 10 | 3 | One bank, two cards paid on the 10th and 11th, pay on the 10th |

Total: 63 v1 tasks and 40 team tasks.

---

## Walk 1: Bea, freelance video editor, Cebu

**Phone:** Android. **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** see PERSONAS_PH.md for the full life of this person (accounts, family, bills). This walk only uses what the v1 build can hold: one bank figure, one pay number, bills, one goal, cards and loans, receipts. The rest of the life is under the team tasks.

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay 47,200, pay day the 1st (type 1; her pay really lands when a project does). Bills: Rent 12,000, Family (her mother) 8,000, SSS, PhilHealth, Pag-IBIG 2,150, Editing software 1,300. One goal: Emergency fund, 5,000 a month.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 12,000 + 8,000 + 2,150 + 1,300 = 23,450. Free to spend = pay 47,200 − bills 23,450 − goal 5,000 = **18,750** a month.
- Where a beginner gives up: Her pay is not the same each month. The pay box wants one number and a pay day. She may not know what to type.

**T2 (v1). Type what your bank shows today.** BPI shows 42,300 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **42,300** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: Her money is in BPI, UnionBank, GCash and Wise. Only one bank figure is asked for. She may wonder where the rest goes, or add all of it into one figure.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: RCBC 14,600. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = **14,600**.
- Expected: bank after the cards are paid = 42,300 − 14,600 = **27,700**.
- Where a beginner gives up: She may not see that the card is already spent while the money is still in the bank.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 350, 1,200, 480, 650, 2,300, 220, 900. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 350 + 1,200 + 480 + 650 + 2,300 + 220 + 900 = 6,100. Left = 18,750 − 6,100 = **12,650**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: Seven small items one at a time. She may stop at the category choice.

**T5 (v1). Undo a mistake.** Log one more receipt of 6,500 (a fare and snack typed as 6,500; it was meant to be 650). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 12,650 − 6,500 = 6,150. After Undo, back to **12,650**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 12,650.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: two numbers matter: Free to spend left **12,650** and the bank after the cards **27,700**. Safe to spend can be no more than the smaller one: **12,650**. The bank figure alone, 42,300, is not safe because 14,600 of it is already spent on the cards.
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **42,300**, owed **14,600**, Free to spend 18,750 a month, seven receipts totalling **6,100**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a new lens for 3,500 on RCBC. Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: RCBC goes from 14,600 to 18,100 (14,600 + 3,500). Owed goes from 14,600 to **18,100**. Bank after the cards goes from 27,700 to **24,200** (42,300 − 18,100). The bank figure stays at **42,300**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.

**T9 (v1). A thin month.** Change the pay to 23,500 (what landed in her second-last month). Then to 0 (the month nothing landed).

- Expected: plan = bills 23,450 + goal 5,000 = 28,450. At 23,500 the plan is over the pay by 28,450 − 23,500 = **4,950**. At 0 it is over by **28,450**. The app says so plainly. It must not say "failed" or show a warning wall. Change the pay back to 47,200 after.
- Where a beginner gives up: a zero month with a red screen.


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). Add all five accounts, with Wise in dollars.**
- Expected: BPI 42,300 + UnionBank 8,150 + GCash 3,480 + Cash 1,200 = Total **55,130**. Beside it USD 310 in Wise, not in the peso total. Owed 14,600. BPI after the card 42,300 − 14,600 = **27,700**.
- Where a beginner gives up: The Wise dollars. She may not know the account can be in a different currency.

**TT2 (team). Check GCash: the app says 3,480, GCash says 3,230.**
- Expected: Correct GCash to 3,230. Total goes to 55,130 − 250 = **54,880**. The 250 is accepted, with no need to explain it.
- Where a beginner gives up: She may think she has to find the 250 before moving on.

**TT3 (team). Move 5,000 from BPI to GCash, then send 8,000 to her mother from GCash.**
- Expected: After the move: BPI 37,300, GCash 8,480, Total **55,130** (same). After the send: GCash 480, Total 55,130 − 8,000 = **47,130**. The 8,000 shows as Family support, not Giving, not Free to spend.
- Where a beginner gives up: Choosing a kind for the 8,000. Four kinds look alike.

**TT4 (team). Bring home USD 300 as 16,950 pesos.**
- Expected: Wise USD 310 → USD 10. BPI + 16,950. Total + 16,950. She is asked "how much landed?", not for a rate. (Rate shown by the app would be 56.5.)
- Where a beginner gives up: A question about the exchange rate.

**TT5 (team). A surprise 6,500 for a hospital bill, from UnionBank.**
- Expected: UnionBank 8,150 − 6,500 = **1,650**. Total down by 6,500. Shown as Family support, with where it came from. Run on its own from TT1: Total 55,130 − 6,500 = **48,630**.
- Where a beginner gives up: Not knowing which account the money came from.

**TT6 (team). Find what is safe to spend with no next pay date.**
- Expected: The app must say plainly what it knows: the next pay is unknown, only the rent (12,000 on 1 Dec) and the card (14,600, due 12 Dec) are known. Run on its own from TT1: BPI 42,300 − 14,600 − 12,000 = **15,700** is safe from the bank.
- Where a beginner gives up: A screen that insists on a pay date she does not have.



---

## Walk 2: Carlo, salaried video editor, Quezon City

**Phone:** Android. **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** see PERSONAS_PH.md for the full life of this person (accounts, family, bills). This walk only uses what the v1 build can hold: one bank figure, one pay number, bills, one goal, cards and loans, receipts. The rest of the life is under the team tasks.

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay 33,500, pay day the 30th (type 30; his pay really comes 16,400 on the 15th and 17,100 on the 30th). Bills: Room rent 7,500, Phone plan 1,299, Electricity 1,900, Family (parents) 3,000, SPayLater part 1,810, GGives part 2,150. No goal.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 7,500 + 1,299 + 1,900 + 3,000 + 1,810 + 2,150 = 17,659. Free to spend = pay 33,500 − bills 17,659 = **15,841** a month.
- Where a beginner gives up: Pay comes in two halves and the setup asks for one amount. He may type 16,400 and think that is the month.

**T2 (v1). Type what your bank shows today.** BDO shows 6,240 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **6,240** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: GCash and cash hold money too. He may type all three into one bank box.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: Metrobank 9,800. Also add as money owed: SPayLater 5,430, GGives (a phone) 15,050. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = 9,800 + 5,430 + 15,050 = 30,280.
- Expected: bank after the cards are paid = 6,240 − 9,800 = **minus 3,560**.
- The bank cannot cover the cards today. The app must say so plainly, kindly, with a next step, not as a red wall. It must not hide the minus.
- Where a beginner gives up: SPayLater and GGives are not cards. He may not know which kind to pick, or that they count as owed.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 85, 320, 150, 1,100, 260, 95, 540. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 85 + 320 + 150 + 1,100 + 260 + 95 + 540 = 2,550. Left = 15,841 − 2,550 = **13,291**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: The small daily items are the habit. If a receipt takes more than a few taps he will skip the week.

**T5 (v1). Undo a mistake.** Log one more receipt of 3,200 (a lunch typed as 3,200; it was meant to be 320). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 13,291 − 3,200 = 10,091. After Undo, back to **13,291**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 13,291.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: the bank after the cards is minus 3,560, so there is nothing safe to spend from the bank until pay lands. The shortfall is **3,560** (6,240 − 9,800). The app may show Free to spend left 13,291 from the plan; it must not show that as safe next to the shortfall. The walker should be able to say: "nothing is safe right now; the card is 3,560 more than the bank holds; pay fixes it."
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **6,240**, owed **30,280**, Free to spend 15,841 a month, seven receipts totalling **2,550**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a pair of shoes for 2,400 on Metrobank. Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: Metrobank goes from 9,800 to 12,200 (9,800 + 2,400). Owed goes from 30,280 to **32,680**. Bank after the cards goes from minus 3,560 to **minus 5,960** (6,240 − 12,200). The bank figure stays at **6,240**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). Two pay days.**
- Expected: 15th: 16,400. 30th: 17,100 (lands Friday 27 Nov). Together **33,500**. Each half places its own bills. Today (19th) the only bill before the 27th is GGives 2,150 on the 20th.
- Where a beginner gives up: Having to pick one pay day. He pays 3,000 to his parents on the 15th and rent on the 30th, so bills belong to different pays.

**TT2 (team). Cash in 1,300 from BDO to GCash, then GGives takes 2,150 from GCash on the 20th.**
- Expected: After the move: BDO 4,940, GCash 2,210, Total **7,800** (same). After GGives: GCash 60, owed 30,280 − 2,150 = **28,130**, Total 7,800 − 2,150 = **5,650**.
- Where a beginner gives up: Whether a cash-in is spending. It is a move.

**TT3 (team). Buy 2,400 shoes on SPayLater in 3 parts of 800.**
- Expected: Total stays **7,800**. Owed 30,280 + 2,400 = **32,680**. Free to spend down by 2,400 over three months (800 a month, due the 5th).
- Where a beginner gives up: He may think nothing happened. The screen must show it as owed.

**TT4 (team). Friday 27 Nov: BDO holds 6,240 (assume), pay 17,100 lands, rent 7,500.**
- Expected: 6,240 + 17,100 = 23,340. After rent 7,500: **15,840**. Due before the 15 Dec pay (rent already paid): card 9,800 (3 Dec), SPayLater 1,810 (5 Dec), phone 1,299 (8 Dec) = **12,909**. Left after those: 15,840 − 12,909 = **2,931**.
- Where a beginner gives up: Which bills belong to which pay.

**TT5 (team). Pay the Metrobank card on 3 Dec.**
- Expected: BDO down 9,800. Owed down 9,800. Total down **9,800**. Free to spend and bank after the cards are unchanged.
- Where a beginner gives up: He may think paying is spending. It is: the money leaves. But it was already counted as spent.

**TT6 (team). Ask: how much do I owe in all, and when is it gone?**
- Expected: Owed **30,280**. SPayLater: 3 parts, last on 5 Feb 2027. GGives: 7 parts, last on 20 May 2027. Metrobank: paid in full on 3 Dec. Everything gone by **20 May 2027** if nothing new is added.
- Where a beginner gives up: No screen for it.



---

## Walk 3: Mika, remote operations lead, Makati

**Phone:** iPhone (walked here at 412x915; the real iPhone is a team task). **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** see PERSONAS_PH.md for the full life of this person (accounts, family, bills). This walk only uses what the v1 build can hold: one bank figure, one pay number, bills, one goal, cards and loans, receipts. The rest of the life is under the team tasks.

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay 78,000, pay day the 27th this month (type the last working day, or 30). Bills: Condo rent 22,000, Family (parents) 10,000, Internet 1,899, Electricity 3,400, Insurance 4,200. One goal: Travel, 5,000 a month.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 22,000 + 10,000 + 1,899 + 3,400 + 4,200 = 41,499. Free to spend = pay 78,000 − bills 41,499 − goal 5,000 = **31,501** a month.
- Where a beginner gives up: Her emergency fund is in Maya Savings and her travel money in GoTyme. She may not know whether to count them in the bank box.

**T2 (v1). Type what your bank shows today.** UnionBank shows 96,400 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **96,400** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: Only UnionBank is the bank figure. Her 150,000 and 12,750 elsewhere have no box in v1. She may wonder if the app is wrong.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: BPI card 31,900, UnionBank card 12,480. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = 31,900 + 12,480 = 44,380.
- Expected: bank after the cards are paid = 96,400 − 31,900 + 12,480 = 44,380 → 96,400 − 44,380 = **52,020**.
- The BPI figure already includes this month's laptop part (4,500). Do not add the laptop again.
- Where a beginner gives up: Two cards with different pay dates, and a laptop instalment already inside the BPI figure. She may type the laptop twice.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 1,250, 380, 2,100, 560, 940, 310, 1,800. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 1,250 + 380 + 2,100 + 560 + 940 + 310 + 1,800 = 7,340. Left = 31,501 − 7,340 = **24,161**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: She may not log at all unless it is quick.

**T5 (v1). Undo a mistake.** Log one more receipt of 3,800 (a coffee run typed as 3,800; it was meant to be 380). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 24,161 − 3,800 = 20,361. After Undo, back to **24,161**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 24,161.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: two numbers matter: Free to spend left **24,161** and the bank after the cards **52,020**. Safe to spend can be no more than the smaller one: **24,161**. The bank figure alone, 96,400, is not safe because 44,380 of it is already spent on the cards.
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **96,400**, owed **44,380**, Free to spend 31,501 a month, seven receipts totalling **7,340**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a weekend trip for 9,000 on UnionBank card. Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: UnionBank card goes from 12,480 to 21,480 (12,480 + 9,000). Owed goes from 44,380 to **53,380**. Bank after the cards goes from 52,020 to **43,020** (96,400 − 53,380). The bank figure stays at **96,400**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). Add all five accounts. Mark Maya Savings as the emergency fund and GoTyme as travel.**
- Expected: UnionBank 96,400 + Maya Savings 150,000 + GoTyme 12,750 + GCash 2,300 + Cash 3,000 = Total **264,450**. Cards owed 31,900 + 12,480 = 44,380. UnionBank after the cards 96,400 − 44,380 = **52,020**. The 150,000 and 12,750 are held back, not offered as safe to spend.
- Where a beginner gives up: Typing the whole 150,000 into the bank box in v1.

**TT2 (team). Add the laptop instalment: 4,500 × 8 left, this month's 4,500 already inside the BPI figure.**
- Expected: Still to come after this month: 7 × 4,500 = **31,500**. Owed in all: 44,380 + 31,500 = **75,880**, not 80,380. No double count.
- Where a beginner gives up: Not knowing the instalment sits on a card.

**TT3 (team). Pay the BPI card (31,900) on the 26th, from UnionBank.**
- Expected: UnionBank 96,400 − 31,900 = 64,500. Owed on cards 12,480. Total 264,450 − 31,900 = **232,550**. UnionBank after the cards 64,500 − 12,480 = **52,020** (unchanged).
- Where a beginner gives up: Thinking the total stays the same.

**TT4 (team). Friday the 27th: pay 78,000 lands. Send 10,000 to her parents.**
- Expected: UnionBank 64,500 + 78,000 = 142,500. After the 10,000: **132,500**. Total 232,550 + 78,000 − 10,000 = **300,550**. The pay splits into her places on screen.
- Where a beginner gives up: The split. She may not know which place gets what.

**TT5 (team). Pay the 25,000 tuition; choose where from.**
- Expected: From UnionBank: 132,500 − 25,000 = **107,500**. Total **275,550**. Offered a choice of where from, with the emergency fund marked as not for this.
- Where a beginner gives up: A prompt that makes her choose before she knows the options.

**TT6 (team). Spend 2,600 on the UnionBank card on the 18th, after the 17th cut-off.**
- Expected: Owed on cards 44,380 + 2,600 = **46,980**. Total unchanged. The bill due 7 Dec is still 12,480; the 2,600 is in the bill due 7 Jan. UnionBank after the cards falls by 2,600.
- Where a beginner gives up: Cut-off day. She will not understand why it is not in the next bill.

**TT7 (team). A week later on the iPhone: everything still there; add to the home screen when asked.**
- Expected: All figures as before. A real iPhone is needed (E2). Browser data can be deleted after 7 days unused.



---

## Walk 4: Jun and Tess, a couple, Davao

**Phone:** Android (one phone for two people). **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** see PERSONAS_PH.md for the full life of this person (accounts, family, bills). This walk only uses what the v1 build can hold: one bank figure, one pay number, bills, one goal, cards and loans, receipts. The rest of the life is under the team tasks.

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay 55,900, pay day the 5th (type 5; three real pay days: Tess on the 5th, Jun on the 15th and 30th). Bills: Rent 9,000, School fees 3,500, Electricity and water 3,800, Family (Jun's mother, cash) 4,000, Paluwagan 4,000, Home Credit part 1,975. No goal.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 9,000 + 3,500 + 3,800 + 4,000 + 4,000 + 1,975 = 26,275. Free to spend = pay 55,900 − bills 26,275 = **29,625** a month.
- Where a beginner gives up: Two people, three pay days, one box. They may argue over whose pay day to pick, or type only one salary.

**T2 (v1). Type what your bank shows today.** BDO (Tess) shows 18,300 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **18,300** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: Jun's Landbank (4,870), GCash and the cash at home have no box. They may think the app has missed most of their cash.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: Security Bank 6,900. Also add as money owed: Home Credit (refrigerator) 17,775. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = 6,900 + 17,775 = 24,675.
- Expected: bank after the cards are paid = 18,300 − 6,900 = **11,400**.
- Where a beginner gives up: Home Credit is paid over the counter in cash. They may not know it still counts as owed.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 1,450, 180, 980, 220, 100, 1,120, 160. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 1,450 + 180 + 980 + 220 + 100 + 1,120 + 160 = 4,210. Left = 29,625 − 4,210 = **25,415**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: Market and fare items are small and cash. They may not want to name each one.

**T5 (v1). Undo a mistake.** Log one more receipt of 1,800 (a week of fares typed as 1,800; it was meant to be 180). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 25,415 − 1,800 = 23,615. After Undo, back to **25,415**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 25,415.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: two numbers matter: Free to spend left **25,415** and the bank after the cards **11,400**. Safe to spend can be no more than the smaller one: **11,400**. The bank figure alone, 18,300, is not safe because 6,900 of it is already spent on the cards.
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **18,300**, owed **24,675**, Free to spend 29,625 a month, seven receipts totalling **4,210**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a school bag and shoes for 1,800 on Security Bank. Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: Security Bank goes from 6,900 to 8,700 (6,900 + 1,800). Owed goes from 24,675 to **26,475**. Bank after the cards goes from 11,400 to **9,600** (18,300 − 8,700). The bank figure stays at **18,300**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). Three pay days from two people.**
- Expected: Tess 5th 29,500. Jun 15th 13,200 and 30th 13,200 (Landbank). Together **55,900**.
- Where a beginner gives up: Whose phone, whose pay.

**TT2 (team). All four places, with cash at home counted.**
- Expected: Landbank 4,870 + BDO 18,300 + GCash 1,640 + Cash 7,500 = Total **32,310**. Owed 6,900 + 17,775 = 24,675. BDO after the card 18,300 − 6,900 = **11,400**.
- Where a beginner gives up: Counting the cash. They may not want to.

**TT3 (team). ATM: 5,000 from BDO to cash.**
- Expected: BDO 13,300, Cash 12,500, Total **32,310** (same).
- Where a beginner gives up: It is a move, not spending.

**TT4 (team). A week of market and fares from cash.**
- Expected: Spent 1,450 + 180 + 980 + 220 + 100 + 1,120 + 160 = **4,210**. Cash 12,500 − 4,210 = **8,290**. Total 32,310 − 4,210 = **28,100**.
- Where a beginner gives up: Naming every item.

**TT5 (team). Paluwagan 2,000 on the 30th, as the right kind.**
- Expected: It is a bill: money out. Total down by **2,000**. The 8,000 they have already put in is not in Total. The 20,000 on 15 Jan is "Other money in", shown as coming, not in Total today.
- Where a beginner gives up: Finding a kind that fits. The paluwagan is not on the list.

**TT6 (team). 4,000 cash to Jun's mother as Family support.**
- Expected: Cash down 4,000. Total down **4,000**. Family support, not Giving.
- Where a beginner gives up: The kinds.

**TT7 (team). Count the cash: the app says 2,900, the box holds 2,350.**
- Expected: Correct cash to 2,350. Total down **550**. No explanation required.
- Where a beginner gives up: A prompt that asks where the 550 went.

**TT8 (team). Safe to spend until Jun's next pay (landing Friday 27 Nov).**
- Expected: Money they have 32,310 − the card already spent 6,900 − electricity and water due the 20th 3,800 = **21,610**. The paluwagan (the 30th) and the card due date (29th) fall after the pay.
- Where a beginner gives up: Not knowing which pay day the app means.



---

## Walk 5: Rina, first job, Iloilo

**Phone:** iPhone (walked here at 412x915; the real iPhone is a team task). **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** see PERSONAS_PH.md for the full life of this person (accounts, family, bills). This walk only uses what the v1 build can hold: one bank figure, one pay number, bills, one goal, cards and loans, receipts. The rest of the life is under the team tasks.

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay 24,800, pay day the 28th (type 28; it lands Friday the 27th in November). Bills: Bed space 4,500, Phone load 599, Family (home) 5,000, GLoan part 1,480. No goal.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 4,500 + 599 + 5,000 + 1,480 = 11,579. Free to spend = pay 24,800 − bills 11,579 = **13,221** a month.
- Where a beginner gives up: She does not know the words. Every box needs a line saying what it is for, and why it matters.

**T2 (v1). Type what your bank shows today.** BPI shows 1,050 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **1,050** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: Her money is mostly GCash (6,720) and cash. The bank box holds only 1,050. She may think the app has her wrong.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: BPI card 3,260. Also add as money owed: GLoan 7,400, Borrowed from an officemate 5,000. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = 3,260 + 7,400 + 5,000 = 15,660.
- Expected: bank after the cards are paid = 1,050 − 3,260 = **minus 2,210**.
- The bank cannot cover the cards today. The app must say so plainly, kindly, with a next step, not as a red wall. It must not hide the minus.
- Where a beginner gives up: She owes more than she holds. She may stop if the screen sounds like a warning. It should say so kindly and show a next step.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 120, 85, 260, 45, 310, 150, 95. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 120 + 85 + 260 + 45 + 310 + 150 + 95 = 1,065. Left = 13,221 − 1,065 = **12,156**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: She may not know what to count as spending.

**T5 (v1). Undo a mistake.** Log one more receipt of 850 (a jeepney and a snack typed as 850; it was meant to be 85). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 12,156 − 850 = 11,306. After Undo, back to **12,156**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 12,156.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: the bank after the cards is minus 2,210, so there is nothing safe to spend from the bank until pay lands. The shortfall is **2,210** (1,050 − 3,260). The app may show Free to spend left 12,156 from the plan; it must not show that as safe next to the shortfall. The walker should be able to say: "nothing is safe right now; the card is 2,210 more than the bank holds; pay fixes it."
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **1,050**, owed **15,660**, Free to spend 13,221 a month, seven receipts totalling **1,065**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a first card purchase for 890 on BPI card. Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: BPI card goes from 3,260 to 4,150 (3,260 + 890). Owed goes from 15,660 to **16,550**. Bank after the cards goes from minus 2,210 to **minus 3,100** (1,050 − 4,150). The bank figure stays at **1,050**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.

**T9 (v1). Come back after nine days.** It is now 28 November. You skipped the app. Without reading help, start again from today: bank 3,900.

- Expected: the bank figure now shows **3,900**, dated 28 Nov. Nothing about missed days, nothing red about the gap. The old receipts stay. You are not asked to redo the nine days.
- Where a beginner gives up: any message that says she fell behind; any step that asks her to backfill.


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). All four places, GCash first.**
- Expected: BPI 1,050 + GCash 6,720 + Maya 500 + Cash 2,400 = Total **10,670**. Owed 3,260 + 7,400 + 5,000 = 15,660. She owes more than she has by 15,660 − 10,670 = **4,990**. The app says so plainly and kindly with a next step.
- Where a beginner gives up: A screen that sounds like a warning.

**TT2 (team). GLoan takes 1,480 from GCash on the 20th without her typing it.**
- Expected: GCash 6,720 − 1,480 = 5,240. Owed 15,660 − 1,480 = **14,180**. Total 10,670 − 1,480 = **9,190**.
- Where a beginner gives up: It happened without her. A line must say so.

**TT3 (team). Upload her GCash history.**
- Expected: Her last month appears in receipts, each item once, nothing counted twice. (Wider-launch point D5 for a locked file.)
- Where a beginner gives up: The password prompt.

**TT4 (team). Friday 27 Nov: pay 24,800 lands in BPI; send 5,000 home from GCash; move 15,000 BPI to GCash.**
- Expected: Starting after TT2 (Total 9,190): + 24,800 = 33,990; − 5,000 = 28,990. BPI 1,050 + 24,800 − 15,000 = 10,850. GCash 6,720 − 1,480 − 5,000 + 15,000 = 15,240. Maya 500. Cash 2,400. Total **28,990**.
- Where a beginner gives up: Two moves in one day.

**TT5 (team). Send her brother 700 on a Tuesday night in two taps.**
- Expected: GCash 15,240 − 700 = 14,540. Total 28,990 − 700 = **28,290**. Family support.
- Where a beginner gives up: Taps. More than two is a miss.

**TT6 (team). 13th month pay: about 12,830 by 24 Dec. Decide where it goes: the officemate first.**
- Expected: 7 months of 22,000 ÷ 12 = 12,833, say about **12,830**. Officemate 5,000 first, leaving 7,830. Shown as coming, not in Total today.
- Where a beginner gives up: Whether it counts yet. It does not.



---

## Walk 6: Dan, call centre team lead, Pasig

**Phone:** Android. **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** see PERSONAS_PH.md for the full life of this person (accounts, family, bills). This walk only uses what the v1 build can hold: one bank figure, one pay number, bills, one goal, cards and loans, receipts. The rest of the life is under the team tasks.

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay 52,000, pay day the 30th (type 30; it lands Friday the 27th in November). Bills: Rent 14,000, Family (parents) 6,000, Utilities 5,200, BDO card payment 3,400, Bank loan payment 6,850. No goal.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 14,000 + 6,000 + 5,200 + 3,400 + 6,850 = 35,450. Free to spend = pay 52,000 − bills 35,450 = **16,550** a month.
- Where a beginner gives up: He already pays bills out of this pay. He may add the card payments twice, once as bills and once in the cards step.

**T2 (v1). Type what your bank shows today.** Metrobank shows 11,900 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **11,900** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: MariBank (20,000) is his emergency fund and sits outside the bank box. He may type 31,900 and spend the emergency fund by accident.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: Metrobank card 24,750. Also add as money owed: BDO card, older balance 68,400, Bank loan 95,900. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = 24,750 + 68,400 + 95,900 = 189,050.
- Expected: bank after the cards are paid = 11,900 − 24,750 = **minus 12,850**.
- The bank cannot cover the cards today. The app must say so plainly, kindly, with a next step, not as a red wall. It must not hide the minus.
- The BDO card with the older balance is a card he does not pay in full. Enter it with a yearly rate of 36% (3% a month) and a payment of 3,400 a month. The bank loan: 14% a year, 6,850 a month. Neither counts in "bank after the cards", which uses only cards paid in full: Metrobank.
- Where a beginner gives up: One card is paid in full, one is carried with interest. The step has to ask which, in words he knows.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 210, 640, 180, 1,350, 95, 420, 760. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 210 + 640 + 180 + 1,350 + 95 + 420 + 760 = 3,655. Left = 16,550 − 3,655 = **12,895**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: He may stop at the end of the first day if it feels like homework.

**T5 (v1). Undo a mistake.** Log one more receipt of 4,200 (a grocery run typed as 4,200; it was meant to be 420). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 12,895 − 4,200 = 8,695. After Undo, back to **12,895**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 12,895.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: the bank after the cards is minus 12,850, so there is nothing safe to spend from the bank until pay lands. The shortfall is **12,850** (11,900 − 24,750). The app may show Free to spend left 12,895 from the plan; it must not show that as safe next to the shortfall. The walker should be able to say: "nothing is safe right now; the card is 12,850 more than the bank holds; pay fixes it."
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **11,900**, owed **189,050**, Free to spend 16,550 a month, seven receipts totalling **3,655**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a school shoe set for 3,200 on Metrobank card. Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: Metrobank card goes from 24,750 to 27,950 (24,750 + 3,200). Owed goes from 189,050 to **192,250**. Bank after the cards goes from minus 12,850 to **minus 16,050** (11,900 − 27,950). The bank figure stays at **11,900**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.

**T9 (v1). The older card balance and interest.** The BDO card (68,400, 36% a year, payment 3,400): pay 3,400 this month.

- Expected: 68,400 − 3,400 = 65,000. Interest at 3% of 65,000 = 1,950. Next month it reads **66,950**. If the app orders payment and interest differently, say what it shows and the figure.
- Where a beginner gives up: does not know what a rate per year means for the card. The words must tell him.

**T10 (v1). When would the BDO card be gone?** Raise the payment to 5,400 (3,400 + 2,000 more).

- Expected: about **16 months** (15 payments of 5,400 and a last one of about 3,118; paying first, then 3% on what is left). At 3,400 a month it is about **30 months**. One month either way is fine; say what the app shows.
- Where a beginner gives up: no screen that says "gone in N months". Report if you cannot find it.

**T11 (v1). Open the old phone after the new one has moved on.** On the second phone (T7), log one more receipt of 300. Then open the first phone and let it load the cloud copy.

- Expected: the first phone shows what changed and keeps its own numbers for undo; it does not silently overwrite the newer copy. After loading, eight receipts, totalling 3,955.
- Where a beginner gives up: a message that says "newer" or "keep mine" with no explanation of which is which.


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). All four places, with MariBank marked as the emergency fund.**
- Expected: Metrobank 11,900 + MariBank 20,000 + GCash 1,150 + Cash 800 = Total **33,850**. Owed 68,400 + 24,750 + 95,900 = 189,050. Metrobank after the card 11,900 − 24,750 = **−12,850**. Amber, no shame.
- Where a beginner gives up: Whether the 20,000 counts as safe.

**TT2 (team). Friday 27 Nov: pay 52,000 lands; 6,000 to his parents. What leaves by 10 December?**
- Expected: Metrobank 11,900 + 52,000 − 6,000 = 57,900. Leaving by the 10th: rent 14,000 (1 Dec) + Metrobank card 24,750 (2 Dec) + loan 6,850 (5 Dec) + BDO card 3,400 (10 Dec) = **49,000**. Left 57,900 − 49,000 = **8,900**.
- Where a beginner gives up: A list by date. A calendar of leaving money.

**TT3 (team). Find what is really safe to spend after that.**
- Expected: 8,900 (Metrobank) + GCash 1,150 + cash 800 = **10,850**. The 20,000 in MariBank is not counted.
- Where a beginner gives up: Whether the emergency fund is counted.

**TT4 (team). Set aside 6,000 a month for the January school fees (18,000).**
- Expected: Three set-asides = **18,000**. The app shows 6,000 a month toward an 18,000 goal. Safe-to-spend falls by 6,000 a month.
- Where a beginner gives up: Where it goes: a goal, a bill, or a place.



---

## Walk 7: Lito, shaped like Mako (made up, in yen)

**Phone:** Android (Chrome, added to the home screen). **Today in the story:** Thursday 19 November 2026. All numbers are made up.

**Who:** one main bank, two credit cards paid in full on the 10th and the 11th, pay on the 10th from two incomes that land the same day, an Android phone. Almost all spending goes on the two cards. This is the shape v1 is for (DECISIONS.md, Mako's own money).

### v1 tasks (walk these on the v1 candidate)

**T1 (v1). Set up from nothing.** Start with empty storage. Use only the screens. Type: pay ¥310,000, pay day the 10th (two incomes that land the same day, typed as one number: 190,000 + 120,000). Bills: Rent ¥95,000, Utilities ¥18,000, Phone ¥8,000, Insurance ¥12,000. One goal: Savings, ¥40,000 a month.

- Say at the end: how much is free to spend in a month, and why.
- Expected: bills 95,000 + 18,000 + 8,000 + 12,000 = 133,000. Free to spend = pay 310,000 − bills 133,000 − goal 40,000 = **137,000** a month.
- Where a beginner gives up: Pay lands on the 10th, not the 1st. If the app thinks the month starts on the 1st, the free-to-spend figure is wrong for 9 days of every month.

**T2 (v1). Type what your bank shows today.** Main bank shows ¥428,000 right now.

- Say at the end: what the bank holds today and how fresh that number is.
- Expected: Home shows **428,000** labelled as now, with "entered on 19 Nov" (or the date the walker used). It must not look like a plan figure.
- Where a beginner gives up: The bank looks rich in the middle of the month because the cards have not been paid yet. If the app shows only the bank, he will overspend.

**T3 (v1). Add your cards and find what the bank holds after they are paid.** Add: Card A (paid on the 10th) ¥112,600, Card B (paid on the 11th) ¥67,400. (Cards are paid in full unless said otherwise.)

- Say at the end: how much you owe in all, and what is left in the bank once the cards are paid.
- Expected: owed = 112,600 + 67,400 = 180,000.
- Expected: bank after the cards are paid = 428,000 − 112,600 + 67,400 = 180,000 → 428,000 − 180,000 = **248,000**.
- Where a beginner gives up: Two cards, two pay dates, both in full. He may not find where the second card goes, or which date applies to which.

**T4 (v1). Log a week of spending.** Log these seven items as seven receipts: 4,200, 880, 12,500, 1,650, 3,300, 960, 2,750. Time yourself; the goal is under 60 seconds in all.

- Say at the end: how much of Free to spend is left.
- Expected: spent 4,200 + 880 + 12,500 + 1,650 + 3,300 + 960 + 2,750 = 26,240. Left = 137,000 − 26,240 = **110,760**.
- Note: the app may also change the bank figure as receipts are logged. If it does, report both numbers and the amount, do not call it wrong.
- Where a beginner gives up: Almost all spending is on cards. He may not know whether to log the item or the card figure.

**T5 (v1). Undo a mistake.** Log one more receipt of ¥8,800 (a lunch typed as 8,800; it was meant to be ¥880). Then take it back using only what the screen offers.

- Say at the end: what Free to spend left is now.
- Expected: after the slip, left = 110,760 − 8,800 = 101,960. After Undo, back to **110,760**. Do not log the corrected receipt; the base state stays as after T4.
- Where a beginner gives up: the Undo bar shows for a few seconds only. If it goes, they need to find the receipt in the list and delete it. They may not know a receipt can be edited. Report which way you found.

*From here on, the base state is the one after T4: seven receipts, left 110,760.*

**T6 (v1). Find what is safe to spend and say why.**

- Expected: two numbers matter: Free to spend left **110,760** and the bank after the cards **248,000**. Safe to spend can be no more than the smaller one: **110,760**. The bank figure alone, 428,000, is not safe because 180,000 of it is already spent on the cards.
- If the app words it differently, report the app's own figure and sentence beside these. The thing to judge: could a person who never learned about money say why, using only the screen?
- Where a beginner gives up: more than one "left" figure on Home. They may not know which to trust.

**T7 (v1). Move your numbers to another phone.** Using only the screens, get this plan onto a second browser profile (use the cloud copy with the recovery code; if the screen offers a backup file, do that second).

- Say at the end: what you did, step by step, and whether the second phone matches.
- Expected on the second phone: bank **428,000**, owed **180,000**, Free to spend 137,000 a month, seven receipts totalling **26,240**. The recovery code is not lost. Nothing on the first phone changed.
- Where a beginner gives up: not knowing what the code is for; not finding where it is shown; not knowing what to do on the other phone. Report every "how do I do this?".

**T8 (v1). Use a card and see what it does.** You bought a new monitor for ¥14,000 on Card A (paid on the 10th). Change that card's figure to what it now shows.

- Say at the end: what changed and what did not.
- Expected: Card A (paid on the 10th) goes from 112,600 to 126,600 (112,600 + 14,000). Owed goes from 180,000 to **194,000**. Bank after the cards goes from 248,000 to **234,000** (428,000 − 194,000). The bank figure stays at **428,000**, because using a card does not take money out of the bank until the card is paid.
- Where a beginner gives up: they think the purchase should lower the bank. The screen must say why it does not.

**T9 (v1). The month follows the pay day.** Set the pay day to the 10th. Today is 19 November.

- Expected: the month started on 10 November, the next pay lands 10 December, **21 days** away (11 days left in November + 10). Card A shows as paid 10 December, Card B 11 December. Free to spend a month stays 137,000.
- Report if the app still counts the month from 1 November, and what figure it shows.
- Where a beginner gives up: pay day asked as "a date" with no reason given.

**T10 (v1). Install on the Android home screen.** Add it to the home screen, close it, open it from there.

- Expected: the plan is still there with the same figures. If the screen offered an install prompt, say what it said. (Chrome menu: Add to Home screen.)


### Team tasks (do not walk these on v1; they need the ledger or the money door)

**TT1 (team). Spend on the cards in the ledger as it happens.**
- Expected: A 14,000 purchase on Card A: owed 180,000 + 14,000 = **194,000**. Total stays **428,000**. Safe to spend falls by 14,000.
- Where a beginner gives up: Which card.

**TT2 (team). Pay day, the 10th: pay lands, Card A paid on the 10th, Card B on the 11th.**
- Expected: Assume bank 428,000 at the end of the month and cards unchanged at 112,600 and 67,400. 10 Dec: 428,000 + 310,000 = 738,000. Card A: 738,000 − 112,600 = 625,400. 11 Dec: 625,400 − 67,400 = **558,000**. Total down by 180,000 for the cards and up by 310,000 for pay: 428,000 − 180,000 + 310,000 = **558,000**. Owed 0.
- Where a beginner gives up: Whether paying is spending. It is not new spending: Free to spend and bank after the cards do not move.

**TT3 (team). Safe to spend until the 10th, with bills on their dates.**
- Expected: Bank after the cards 248,000. The four monthly bills 95,000 + 18,000 + 8,000 + 12,000 = 133,000 all fall before the 10th and none is paid yet. Safe = 248,000 − 133,000 = **115,000**.
- Where a beginner gives up: Whether bills not yet paid are counted.

