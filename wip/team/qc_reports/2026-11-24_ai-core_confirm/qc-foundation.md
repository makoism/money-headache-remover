# qc-foundation: lane/ai-core at b59f994 (confirm round, 24 Nov 2026)

FAIL

CHECK: no check3.txt in the round folder. I ran plan3_write.test.js (32 pass), chat3_core.test.js (20 pass) and answers3.test.js (13 pass) on an export of b59f994. Scripts: /tmp/claude-0/-home-user-money-headache-remover/56d83688-aae8-5b59-9405-fa6c42a7ff6e/scratchpad/fq/t1.js to t7.js.

## Earlier findings (DECISIONS_ROUND2 BY)
- F2 (a figure not typed, or larger than safe to spend, asks first): sound. chat3_core.js:562-571 counts a new pay, new money, a goal target and what is on a card.
- F3 (addAccount, money moved from the main bank): sound. The account opens at 0 the day before the move, then one transfer (plan3_write.js:415-430).
- WATCH (a blank pay day, pay today on every bank): fixed and tested.
- F4 (which pay starts the periods): NOT fixed for the way a person will actually say it. See finding 1.

## OWNER'S WORDS
- M1, M4 (AI first, day to day by talking): BROKEN in effect. The assistant has no way to record the three most common day-to-day facts: "my pay came in", "rent came out" and "my bank shows X" (finding 3).
- M3 (full control over all the numbers): BROKEN. 29 of 76 cells are empty (grid).
- M6 (change, show, Undo one tap; ask first only for deletes and large changes): MET within one visit. BROKEN after a reload (finding 2).
- M13 (add, change, remove every kind of thing after setup): BROKEN for accounts, cards, goals, loans and yearly bills (grid).
- M14 (Undo everywhere): BROKEN after a reload (finding 2).
- M15 (remove a bill): MET (end_bill).
- M22 (one door for money in and money out): BROKEN. "Money came in" cannot tell a pay from other money (finding 3).
- M23 (several accounts, cards, cash, e-wallets): MET for adding. Removing or closing: NOT BUILT. Pay-later: NOT BUILT.
- M28, M29, M39 (one number, after tax): MET (chat3_core.js:145).
- M31, M38 (periods run pay to pay): BROKEN when a job changes (finding 1).
- M32, M41 (card close day "not sure"): MET (plan3_write.js:339).
- M37 (the bank figure is the bank today): BROKEN through the assistant. It cannot take a bank figure (finding 3).
- M40 (cards owed, paid when, bank after cards): MET.
- M42 (minimum asked once, box empty): MET in setup. It cannot be changed later through the assistant.
- M45 (no coin counted twice): BROKEN (finding 3).
- M46 (unspent money never drops out silently): BROKEN when a job changes (finding 1).
- M24 (where unspent money goes, or "Decide later"): silent. No step or screen in the build.
- M61, M69 (nothing lost): MET. Records are marked gone, never deleted.
- M63, M68 (key in the site's secret, cap per household): MET on origin/main (400 calls a day per code word).

## GRID (the assistant's named actions, the main way in)
76 cells: 37 covered, 10 not applicable, 29 empty.

Empty cells:
- change a spend, refund or money in (3); change or remove a move between accounts (2, `list` never shows transfers).
- tick a pay, bill or card payment as landed (3); bank figure today (3); card figure today (3) (finding 3).
- yearly bill: add, change (2). addBill writes only a monthly rule (plan3_write.js:103), so a yearly cost becomes 12 a year, on the screens too.
- goal: change, remove; take money out (3). Card: change, close (2). Account: change, close (2). Loan: add, change, close (3). Minimum to keep (3).

All are builder gaps: act3 and checkin.js can already write each record. Removing or closing an account, card or goal has no screen either (CONTROLS_PLAN). The Undo-after-reload column is finding 2.

## FOUNDATIONAL

**1. A job change leaves the pay periods wrong for good.**
- **The moment:** on 5 Jan he tells the assistant "my job ended, the new one pays 300,000 on the 25th". The assistant has two named steps for this: end_bill on P1 and P2 (chat3_core.js:447 takes P refs), then add_pay.
- **What the build does:** starterOf finds the ended pay, which still has a fixed rule, so fixedNow is true (plan3_write.js:125-126, 384). The flag stays on the ended pay.
- **What I saw (t5.js):**
  - On 20 Mar Home shows a period running "10 Dec to 20 Mar".
  - Food shows 40,000 for 14 weeks, with 4,000 left.
  - No new period ever starts, even after the new pay is ticked on 25 Jan.
- **If the flag is moved the BY1 way instead (t6.js):**
  - On 5 Jan the period has no start date.
  - On 24 Jan Food shows "over by 4,000". The truth is 11,000 left.
  - Every past period is gone (lookahead.js:361-376, 1030).
- **Why the base:** the engine draws every period from whichever pay holds one undated flag, so no write-door fix is right both before and after the switch. BY1 assumed "no life in version one"; this build's assistant creates it (as the CONTROLS_PLAN review found).
- **What the base needs:**
  - in the saved data: `startsPeriod` as dated entries on the pay (`{ from, at, by }`), like `rules`;
  - in the engine: each day's period drawn from whichever pay held the flag on that day;
  - in the write door: endBill on the pay holding the flag moves it from the end day.
- **Cost:** about a day now. Later, every book where the flag moved has lost the date of the switch.

**2. Undo on an assistant card fails or half-works after a reload.**
- **Who:** Mako on Android (M33), where the tab is often reloaded.
- **The moment:** he asks the assistant to change rent to 80,000, checks his bank app, comes back to a reloaded page and taps Undo on the card. The card, kept on the device, still offers Undo.
- **What the build does:** after a reload, act3 can find only what a step added or removed. What it edited is lost: `edited = mem ? mem.edited : []` (act3.js:269).
- **What I saw (t7.js):**
  - changeBill rent: Undo says "Nothing changed". Rent stays at 80,000.
  - addPay that moved the flag: Undo says it worked. The new pay goes, but the flag is not put back, so no pay starts the periods.
- **Every edit-only step has the same problem:** change_bill, change_line, end_bill, end_line, the flag move, and the budgets edited by addPay.
- **What the base needs:** a saved step journal (step id, label, the old values of each edit), on the device or in the book.
- **Cost:** about a day now. Later, any step made before the journal can never be undone.

## Builder findings that break owner lines (FAIL without a base change)

**3. "My pay came in" is counted twice.**
- **The moment:** 10 Dec, pay day. Mako tells the assistant his pay came in. The prompt says "got money, use change" (chat3_core.js:147), and the only step that fits is money_in.
- **What I saw (t1.js against t2.js):**
  - Safe to spend shows 515,000. A ticked pay gives 275,000.
  - The period never starts, so it stays "waiting for pay".
  - Ticking the pay later adds it again.
- **The same with a bill:** "rent came out" becomes log_spend, and safe to spend drops by 72,000 twice (t3.js), with Rent still expected.
- **Fix:** named actions over checkin.js via ACT3.addRecords: "landed" (a `set:<occ>` tick) and "my bank shows X" (a check).

**4. addAccount's same-day case.** When the main bank's figure was taken today, the question reads "moved since today?". A move made earlier that day and answered "yes" is taken off twice (plan3_write.js:421 allows date == last). It errs low (safe side). Ask about "before or after you looked at the bank today".

## WATCH
- **Money moved from a second bank:** addAccount only offers the main bank (plan3_write.js:414). Before several banks are in use, the second bank counts the money twice until its next check.
- **Couples (stage 2):** add_account, add_card and add_pay write `owner: null` and take no person.
- **Second currency (stage 2):** addAccount and addCard always use the home currency (plan3_write.js:423, 344). The shape holds `cur`, so no data move.
- **Pay-later:** not in OWN_KINDS (plan3_write.js:410) and has no add step.
- **Relay:** with no code word set, it counts by `body.device`, but the page sends `anon`, so it counts per connection (main functions/api/ai.js:122). Fine while the code word is set.

## Checked and found sound
- Undo within one visit: a multi-step change rolls back if any step fails (chat3_core.js:519-523), and Undo is refused when a later step touched the same record.
- Deletes, large changes and guessed figures ask first. The setup draft stays on the device until the fill, which is refused until every asked answer is in.
- Lives walked: paid on the 10th (Mako, two cards); twice a month, every 2 weeks and weekly; freelance, then a fixed job; set up on the 20th with pay in; cash and an e-wallet; card spends and payment days; a refund, an overspent line, three weeks away. Only the job change, a reload, and pay or bills told to the assistant gave wrong numbers.
