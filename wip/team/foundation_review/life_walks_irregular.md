(Foundation review 23 Nov 2026, 12-month life walks: freelance, couple, first job, weekly, cash. Read-only review by a helper; copied from its reply.)

Read-only review of wip-38.31. No files were written to the repo. My probe scripts are in /tmp/life_b/ (probe.js, probe2.js). They run model.js in node, so a browser was not needed.

## FOUNDATIONAL

**F1. Time is a fixed two-year calendar grid**
- **Who:** everyone. It shows most for the weekly shift worker (Ramil, paid every Friday), for Mika (her pay lands on the last working day, which moves for holidays) and for anyone using the app after October 2028.
- **The moment:** Bea's goal falls due in January 2029. It is November 2028 and Ramil logs a receipt.
- **What the app holds:**
  - The window is hard-coded: `START='2026-11', END='2028-10', PAYDAY=15` (model.js:3).
  - `todayStr()` holds today inside that window (ui0.js:79). After October 2028 the app thinks it is 1 October 2028 forever.
  - A receipt dated 2028-11-05 is never counted in any month (probe).
  - `validDue('2029-01-10')` returns '' (model.js:269), so the goal date is dropped without a word.
  - The 15 in `readyBy` (model.js:152), `dim`/`daysLeft` in `viewOf` (model.js:657) and `weekOf` (ui0.js:61) all count calendar months.
- **Why it is the model:** months are keys into every saved map (`steps`, `once`, `items`), and every sum loops over `MONTHS`.
- **Gap in the existing plan:** PAYDAY_DESIGN saves `payDays` as a list of day numbers. That cannot hold "every Friday", "every other Friday from a date", "last working day" or "early when the day is a holiday". So Ramil and Mika still do not fit, even after 3B.
- **What it needs instead:** periods made from a pay schedule rule, plus a window that moves with today. No holding today inside fixed dates.

**F2. The plan is counted as what really happened**
- **Who:** Bea's zero month. Rina's missed loan payment. Anyone who forgets the app for three weeks.
- **What the app holds:** `calcAll` counts planned pay as arrived, bills and debt minimums as paid, and goal deposits as made (model.js:370, 376, 381). The `proofOf` comment says this outright: "bills ... as planned (taken as paid)".
- **Probe, Bea:** pay 47,200, goal 5,000 a month, January pay set to 0.
  - Her emergency fund still grows from 10,000 to 15,000 in January.
  - Home's Total says 44,450 "planned for the end of the month", while her typed bank says 9,000.
  - Rina's loan goes down on schedule whether she paid or not.
- **Why it is the model:** nothing records "pay landed", "bill paid" or "part paid". Receipts can only be spending.
- **What it needs instead:** dated events for money in and for payments. The plan becomes what is expected, checked against what happened, with "not landed yet" as a real state.

**F3. Typed balances have no date and are replayed from the plan's start**
- **Who:** Rina, Dan, Bea.
- **The moment:** in March Rina types what her lender says she owes, 30,000.
- **What the app holds:**
  - `debt.balance` is the balance at the plan's first month. `calcAll` takes off every month's payment again from November (model.js:353). After typing 30,000 the app still shows 17,500 owed at the end of March (probe).
  - Goal "already saved" (`g.start`) and `bankStart` (model.js:318) work the same way.
  - A statement's closing balance, whatever its date, is written in as the plan's starting bank (ui46.js:245, `setBankBalance`). Debt balances also lose their cents (model.js:1093).
  - The bank figure typed on Home (`bankNow`, model.js:1049) is a separate figure. It never re-bases the plan. Its age is only shown as words, and a balance from three weeks ago still decides "safe to spend" (mapOf, model.js:735).
- **Why it is the model:** a balance is saved as a single number with no date. The plan then counts forward from it every month.
- **What it needs instead:** a dated check for every account, debt and goal. The plan runs on from the latest check, and how old that check is affects what it says.

**F4. One bank figure, one currency, no accounts, no transfers**
- **Who:** Bea (BPI, UnionBank, GCash, cash, plus dollars in Wise). Jun and Tess (cash). The fifth person, Lorna (rider, paid in cash, keeps money in cash and GCash).
- **The moment:** a cash withdrawal. Bea moving 5,000 from BPI to GCash. Bea's dollars waiting in Wise.
- **What the app holds:**
  - Only `bankStart`/`bankNow` and a single `S.ui.cur`.
  - A receipt's account (`s`) is free text that nothing reads (model.js:1137).
  - Statement import adds up the closing balances of every account across currencies (stmt.js:152). Each file's currency is read and then ignored (stmt.js:43), so dollars are added to pesos.
  - An ATM withdrawal becomes Free to spend spending (stmt.js:184, `cash: 'envelope'`). When Jun and Tess, or Lorna, then log the cash spending as receipts, it is counted twice.
  - Goal money sitting in the same BPI account counts toward "the bank covers this month" (model.js:735).
- **Why it is the model:** there is no account entity, so moves and currency conversions cannot be represented.
- **What it needs instead:** accounts with a type, a currency and an owner, plus transfer and convert events. This is in LEDGER_DESIGN but not built.

**F5. Money can only go out**
- **Who:** Bea (a refund, a hospital-bill reimbursement), Jun and Tess (the paluwagan payout).
- **What the app holds:**
  - A receipt must be above zero (model.js:588).
  - The only way in is `addExtraMoney`, which adds to that month's "side" pay (model.js:1172) and rounds away cents (1234.56 becomes 1,235).
  - So a refund raises "pay" and every share of pay. It cannot give back the Free to spend it came from, or land in a different month from the purchase. It cannot lower what is owed on a card.
- **What it needs instead:** events with a kind (refund, gift, payout, repay) and an amount in or out.

**F6. No dates inside a month, so a mid-month shortfall is invisible**
- **Who:** Rina (rent on the 1st, pay on the 25th), Carlo (GGives due on the 20th), Ramil.
- **What the app holds:**
  - Bills are monthly amounts with no due day. Income has no landing day. The model only checks the bank at month end (`m.bankEnd`).
  - Probe, Rina starting with 1,000: November ends at 9,500 and shows as fine. In real life she is below zero for 24 days.
  - Cards with their pay day (`S.cards`, model.js:1039) are outside `calcAll` entirely. Card spending leaves the planned bank in the month of purchase, not on the card's due day.
- **What it needs instead:** bills, debt parts, card due days and income each with a date, and a running balance by day. The lowest point before the next pay should decide "safe to spend".

**F7. Weekly or uneven income is flattened to one monthly number**
- **Who:** Ramil, Bea, Lorna.
- **What the app holds:**
  - Weekly pay is multiplied by 52/12 (ui7.js:187-189). A month with 4 Fridays is overstated by about 8%, and a month with 5 is understated by about 15%.
  - Statement import uses the median including zero months (stmt.js:130). Bea's 61,000, 23,500, 0 and 47,200 become a fixed 35,350 pay every month.
  - Repeating entries can only be spending, on days 1 to 28 (model.js:1111). Rent "on the 30th" and anything every two weeks cannot be entered.
  - Only three pay boxes exist (`a`, `b`, `side`).
- **What it needs instead:** income streams, each with a schedule, plus a "when work comes in" mode that shows how long money in hand lasts (PAYDAY 3C). That mode depends on F2.

**F8. Past months are recalculated from today's plan**
- **Who:** anyone tidying their plan in month 7.
- **What the app holds:** `removeLine` drops the line from every month and deletes its saved amounts (model.js:259). Months 1 to 6 lose that bill, so every past bank figure and goal balance changes, and its receipts are counted as "Other".
- **Why it is the model:** there are no closed periods. History is never stored, only recomputed.
- **What it needs instead:** past periods built from events. A plan change starts from a date and only moves forward.

**F9. One household with no people in it**
- **Who:** Jun and Tess on one phone.
- **What the app holds:** no owner on income, accounts or receipts. Their three pay days do not fit the three pay boxes. Neither can see their own money, or whose pay covers which bill.
- **What it needs instead:** an owner field on accounts and income streams. It is cheap if it is in the saved shape from the start, and costly to add later.

## The 5 foundation changes, in order

1. **Build the dated ledger (B1) before the team test.** It needs accounts with type, currency and owner, and events with a kind and an amount in or out: in, spend, transfer, convert, refund, repay, check. A receipt becomes a spend event from an account. The plan becomes the expected side only. This removes most of F2, F4, F5 and F9. Every month of 38.31 data saved now records nothing that can be migrated except receipts.
2. **Replace the month grid with a period engine driven by a pay schedule rule:** a monthly day or days, a weekday every N weeks from a date, the last working day with a holiday shift, or irregular with a "how long it lasts" view. The window moves with today, nothing holds today inside fixed dates, and periods are keyed by start date. Change the planned `payDays` shape to a rule object now. This removes F1 and F7.
3. **Dated checks for every balance** (account, debt, goal). The plan runs on from the latest check, and the age of the check affects what is called safe. This removes F3.
4. **Dated schedule items** (bills, debt parts, card due days, expected income), plus a running balance by day within each period. "Safe to spend" uses the lowest point before the next pay. This removes F6.
5. **Freeze past periods.** Past periods are built from events. Plan changes start on a date and only move forward. This removes F8.
