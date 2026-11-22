(Foundation review 23 Nov 2026, 12-month life walks: salaried, paid in halves, every two weeks, set up mid-month, Mako's shape. Read-only review by a helper; copied from its reply.)

## Foundational review: The Burrow engine (wip-38.31), six people walked through 12 months

I confirmed the problems by running the real `wip/team/model.js` in node; the scripts are in /tmp/life_a/ (h.js, p6.js, lito.js). I did not open a browser: model runs were enough, and every figure below comes from those runs. I wrote nothing to the repo.

### FOUNDATIONAL

**F1. Balances are pinned to the 1st of the first month, not to a date. Later truth is either ignored or replayed from the start.**
- **Who:**
  - Nell, my added person, sets up on 20 Dec with pay (250,000) already in and rent (80,000) already paid.
  - Lito sets up on 19 Nov.
  - Dan types a new "owed now" in April.
- **What the app holds:**
  - Setup asks "Balance now" (ui45s.js:41) but stores it as the bank at the start of the setup month (ui45s.js:49-50, model.js:16-17). calcAll then adds that whole month's pay and bills again (model.js:315-330).
  - Nell: the app plans 370,000 at the end of December. The truth is about 200,000, because pay is counted twice and rent counted twice. Her status shows "good".
  - Lito on 19 Nov: billsLeft is 133,000, all treated as still to pay, though they were paid on the 10th. So his month is flagged "not safe", a false alarm. Nell gets false comfort; Lito gets a false alarm. Both are confident and wrong.
  - Debts and goals have no "as of" date (cleanDebts model.js:1098, ui7.js:11 "Owed now"). Dan types 85,000 owed in April. The engine starts that figure in December and replays four payments, so it shows **71,994** owed at the end of April.
  - Goal "saved so far" (updateGoal :285) behaves the same way.
  - The typed bank now (setBankNow :16, nowOf :1049) never feeds the plan. That is the known MAKO_RUN 1.1 issue, and it is only one symptom of this.
- **Why it is the model:** state has one start point (`cfg.bankStart`, `planFrom`) and no dated observations. There is nothing for a check-in to attach to.
- **What it needs:** every balance (each account, card, debt, goal) stored as "amount on date". The past comes from events; the future is projected from the latest check.

**F1b. Anything not logged is treated as unspent, and anything planned as done.**
- **Who:** Carlo forgets the app for three weeks; Mika skips a transfer to GoTyme.
- **What the app shows:**
  - The month-end question treats unlogged Free to spend as unspent. Tapping "keep it in the bank" credits all of it (`m.counted`/`m.credit`, model.js:333-336, 371). The wording does warn "may be spending you haven't logged yet".
  - Goals and the Education, Giving and Investing piles grow by the plan whatever actually happened (calcAll goal loop; mapOf :735-738).
- **Why it is the model:** the plan is the record. There is no "check" event that could show an unexplained difference.
- **What it needs:** the ledger's check and adjust events, with "saved" read from real balances.

**F2. The calendar month is the only unit of time, and safety is judged only at month end.**
- **Who:** Lito (paid on the 10th), Carlo (paid on the 15th and 30th), anyone paid on the 25th (Japan's usual pay day).
- **What the app shows:**
  - Receipts are grouped by `r.d.slice(0,7)` (model.js:574).
  - Days left come from the calendar month (viewOf :656). Lito on 19 Nov is told 12 days left and **79,917 a week**. The truth is 21 days to pay, about 45,700 a week.
  - `statusOf` (:472) and `belowZeroOf` look only at `bankEnd`. Carlo pays the card (3rd), SPayLater (5th) and phone (8th) before his pay on the 15th and goes below zero around the 5th. The month-end figure, which includes both pays, still shows fine.
  - `PAYDAY = 15` is a constant used in readyBy (:3, :152).
- **Why it is the model:** there are no dates inside a month. Pay, bills and card payments are just monthly totals.
- **What it needs:** dated future events and a day-by-day walk. Safe to spend = the lowest point before the next pay, minus the minimum balance.

**F3. Pay is one amount per month.**
- **Who:** my added person paid every two weeks (120,000 a pay, 26 pays a year); Carlo; a weekly earner.
- **What the app holds:**
  - The pay helper turns every-two-weeks pay into 120,000 × 26 / 12 = **260,000 every month** (ui7.js:187-189). In 10 of 12 months only 240,000 arrives.
  - So Free to spend is 20,000 too high in each two-pay month, and the bank projection is wrong by 20,000 more each month until a three-pay month.
  - `a`, `b` and `side` are amounts per month (model.js:210, :321).
  - Carlo's unequal halves, and pay that lands early before a holiday, cannot be expressed.
- **Why it is the model:** income is a value per month, not a schedule.
- **Also:** the payday design's `payDays` field (a list of days of the month) cannot express every-two-weeks pay either. Choose the field shape before building it.
- **What it needs:** pay as a rule: an anchor date plus every N days, or set days of the month, or irregular. The amount can differ each time, and the rule generates dated pay events.

**F4. Bills can only be "every month from X". There is no due day and no other frequency.**
- **Who:** Mika (tuition each June and November, insurance on the 15th, rent on the 5th); Dan; everyone with a yearly cost.
- **What the app holds:**
  - Lines have only a monthly amount (LINE_DEFS :47-62, steps/once).
  - A yearly cost is a goal with one date (GOAL_DEFS 'car' :67). It saves, is spent in its month (:383-385), then stops. Next year's cost is not there.
  - Twice-yearly tuition has to be typed as one-off changes per month, per year.
  - Without due days, "bills before the next pay" cannot exist. Bills already paid before setup show as still to pay (Lito, in F1).
- **What it needs:** one shared schedule type (day of month, every N months, yearly on a date, ends after N) used by bills, instalments, card payments and yearly costs. Sinking funds would be derived from it.

**F5. Cards are not linked to spending, to the bank's timing, or to debts.**
- **Who:** Lito, Mika, Dan.
- **What the app holds:**
  - `S.cards` is a typed snapshot. `payDay` is only displayed (cleanCards :1039; ui8.js:57-59).
  - Receipts have no account; `s` is free text (:587, :1131).
  - Lito logs a 14,000 receipt and must also retype the card. After the 10th, the old card figure is still subtracted from a bank that has already paid it, so it is counted twice until he retypes it.
  - The plan charges card spending to the bank in the month it is spent, but the money leaves on the next month's card payment day.
  - Mika's 4,500 instalment is in the card's owed figure and again as a debt minimum or bill. That is the round 14 "loan counted twice".
  - Dan's interest card lives in `S.plan.debts`, where the balance only ever goes down (debtStep :135-141). New spending on it is charged to the bank instead of added to the balance, and the minimum is a fixed amount, not a share of the balance.
  - `S.cards` and `S.plan.debts` are two separate structures, so one real card cannot be both.
- **What it needs:** a card as an account. Each spend event names its account. The card has a cut-off and a payment day, and paying it is a transfer. A carried balance and its interest sit on the same card.

**F6. There are no accounts and no earmarks. "Bank" means everything at once.**
- **Who:** Mika (savings in Maya and GoTyme); Lito (savings kept in his one bank).
- **What the app holds:**
  - Setup says the balance is "your bank accounts plus cash" (ui45s.js:41). Mika's 150,000 in Maya goes into the balance and again into the Emergency fund's starting amount. Total = bankEnd + saved (mapOf :764) counts it twice.
  - For Lito, the safe check (`judged` = bank now minus cards, mapOf :733-735) passes because his savings sit in the same bank. "Safe" can mean "safe if you spend your savings".
  - Goal money is assumed to have left the bank (`m.out` includes goalsTotal) but is never located anywhere.
- **What it needs:** accounts, each with places it is set aside for. The ledger design has this.

**F7. A fixed two-year window: Nov 2026 to Oct 2028.**
- **Who:** everyone, from month 13 of a later sign-up; Dan's 3-year loan; any goal after 2028.
- **What the app holds:**
  - `START` and `END` are constants (model.js:3).
  - todayStr pins today to `END-01` after Oct 2028 (ui0.js:79-82). Home then stays on 1 Oct 2028 and new receipts count in no month.
  - Due dates outside the window are dropped silently (validDue :269). A loan end outside it is deleted (updateLine :263). `planFrom` and `loanLast` are dropped (cleanCfg :1023-1024).
  - A sign-up in Sep 2027 gets 14 months.
  - loanPayments counts from START, not from the plan's start (:970).
- **What it needs:** data keyed by date, a rolling view starting from today, and no clamp on today.

### Already planned, and the gaps left

- **The ledger design covers F1, F1b, F5, F6 and F7.** It does not say how the future is projected: there are no schedules, no due days and no lowest point before pay. So F2 and F4 stay open.
- **The payday design covers only part of F2:** it moves the month window. It does not cover F3 (pay every two weeks) or F4.
- Every new record keyed by calendar month (`once`, `items`, `sweep`, `steps.from`) makes the move to pay-to-pay or the ledger more expensive.

### The 5 foundation changes, in order

1. **Dated anchors and events instead of a month-start balance.** Each balance is "amount on date". The past comes from events; the future is projected from the latest check; check and adjust handle gaps. Setup and "Check your bank" become the same question. (F1, F1b)
2. **Accounts with earmarks, and spends that name an account** (the ledger). Cards become accounts with a cut-off, a payment day and an optional carried balance with interest, which replaces both `S.cards` and the card-type debts. (F5, F6)
3. **One schedule type for every repeat:** day of month, every N days from an anchor, every N months, yearly, ends after N, with an amount for each occurrence. Pay, bills, instalments, card payments and yearly costs all use it. `payDays` must not be a list of days of the month only. (F3, F4)
4. **A day-by-day projection from the latest anchor to the next pay and beyond.** The period runs from one pay to the next, worked out from the pay schedule. Safe to spend = the lowest point before the next pay, minus the minimum. Status comes from that lowest point, not from month end. (F2)
5. **Rolling dates.** Remove `START`, `END` and the clamp on today. Key saved data by date or by period start, and treat the window only as a view. (F7)

