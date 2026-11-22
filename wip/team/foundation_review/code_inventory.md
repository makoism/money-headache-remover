(Foundation review 23 Nov 2026, code inventory. Read-only review by a helper; copied from its reply.)

# Burrow pay-period foundation: inventory and change plan (branch wip-38.31, nothing written)

The engine plans in calendar months starting from one figure, the bank before pay on the 1st. The fix is a schedule of dated pays plus one starting point: the bank figure typed today, with its date. The monthly plan data can stay as it is. I estimate 95 to 135 working hours.

Paths below are under `wip/team/` unless they start with `tests/regression`.

## 1. Assumptions that tie money to calendar months

| # | file:line | What it assumes | Who it breaks for | What they see |
|---|---|---|---|---|
| A1 | model.js:3, 8, 10 | A fixed window: `START='2026-11'`, `END='2028-10'`, `MONTHS` is a constant, SPAN says "2 years" | Everyone after Oct 2028; anyone wanting history | After Oct 2028 the app is stuck on Oct 2028 |
| A2 | ui0.js:79-81 `todayStr`, ui6.js:5 `nowYm`, ui5.js:314 | Today is clamped to START..END | Same | Home shows the wrong month |
| A3 | model.js:269 `validDue`; ui4.js:93; ui6.js:747; ui46.js:290-291; ui49.js:231; ui1.js:84; ui6.js:610, 668 | Dates outside the window are refused | Goal dates past Oct 2028, older receipts | "Pick a date from Nov 2026 to Oct 2028"; imported receipts kept but on no screen |
| A4 | model.js:3, 152 `PAYDAY=15`, `readyBy` | Everyone is paid on the 15th | Paid on the 10th, 25th, twice a month | A goal due on the 12th is asked to be full a month early, or a pay too late |
| A5 | model.js:574 `receiptsFor`, 870 `proofOf`, 336/403 via `receiptStats` | A receipt belongs to its calendar month | Paid on the 10th, twice a month, every 2 weeks, irregular | A spend on 5 April counts against April's money, but that money is really from the 10 March pay; April opens with a full Free to spend before any pay lands |
| A6 | model.js:657-661, 682-683 `viewOf` (`dim`, `daysLeft`, `pace`, `perWeek`, `perDay`) | Days left = days to the end of the calendar month | All except paid on the 1st; worst for weekly and irregular | On 28 March: "4 days left, X a week" when pay is 13 days away |
| A7 | ui0.js:61 `weekOf`; ui2.js:101; ui45s.js:434 | Weekly figure = monthly plan / (days in month / 7) | Weekly, every 2 weeks | Weekly figure does not match their real pay rhythm |
| A8 | ui7.js:187-189 `PAYF` | Every-2-weeks pay becomes x26/12, weekly x52/12; the day is never asked | Every 2 weeks, weekly | 10 of 12 months plan about 8% more pay than lands. The bank drifts below plan, then the third-pay month shows as unplanned |
| A9 | model.js:326, 787; ui45s.js:42-47 | One pay figure per month, all of it arriving inside the month | Pay already landed at setup; twice a month | See B1 below |
| A10 | model.js:318, 381, 418 `calcAll` | The bank chains month to month from `bankStart` = the bank on the 1st, before pay | Everyone who types today's bank | Month-end bank is off by (pay already landed minus bills already paid) |
| A11 | model.js:185-188, 197, 324 `planFrom` | The plan starts on the 1st of the setup month | Setup mid-month | The whole month's pay and bills are counted, including ones already in today's bank |
| A12 | model.js:729-736 `mapOf` (`notCovered`, `billsShort`) | Today's bank must cover every bill not yet logged this month plus Free to spend; pay still to come counts for nothing | Paid on the 10th, checking on the 2nd; twice a month | "Not safe to spend yet" or "bank is less than your bills" right before a pay that covers them |
| A13 | model.js:1043, 1050-1052; ui8.js:59 | Each card has a `payDay`, but no sum uses it. All card debt comes off today's bank | Card paid on a date after next pay | "Bank after the cards" is too low until pay day |
| A14 | model.js:333-347; ui6.js:193-198 `sweepOffer`, `pendLeft` | "Month end" is the calendar month end | Paid on the 10th | The leftover question asks on the 1st, while that money still has 9 days to last |
| A15 | model.js:970 `loanPayments` | Counts from START, not `planFrom` | Setup after Nov 2026 | Loan total too high |
| A16 | model.js:201 | A goal with no date is spread over 12 months | Irregular | Fixed monthly amount even in a zero month |
| A17 | model.js:1111 | A monthly repeating spend can only fall on days 1 to 28 | Bills due on the 29th to 31st | Logged on the wrong day |
| A18 | stmt.js:126-146 | Statement import averages pay per calendar month. `stmt.js:152` reads the statement's balance date into `balanceDate`, but no code uses it | Every 2 weeks; any import | The balance is stamped with today's date, not the statement date |

## 2. How the bank figures flow today

**Setup, Import and Settings write `bankStart` and `bankAt`:**
- **Setup:** the "Your money" step labels the box "Balance now" (ui45s.js:42) but saves it as `bankStart` (ui45s.js:49), and sets `planFrom` to this month (ui45s.js:50).
- **Statement import:** `bankStart` is set from the closing balance at ui45u.js:269 and ui46.js:245, with undo at ui46.js:253 and display at ui46.js:287.
- **Assistant:** ui4a.js:85.
- **Settings:** ui0.js:312 `onCfg` and actions.js:99, both through `setBankBalance` (model.js:19).

The labels contradict each other:
- Settings, ui1.js:170: "before that month's pay".
- Help, ui48.js:52: "Your balance right now".
- Setup, ui45s.js:42: "Balance now".

**Check your bank writes `bankNow` and `bankNowAt`:** ui8.js:90 calls `ACT.setBankNow` (actions.js:101), which calls `setBankNow` (model.js:18). On a sample plan, `ownStart` (model.js:719-726) copies `bankNow` into `bankStart` once.

**Where the figures are read:**
- `bankStart`:
  - calcAll, model.js:318
  - mapOf `b0`, model.js:734-735
  - proofOf, model.js:865
  - nowOf fallback, model.js:1050
  - `cleanCfg`, model.js:1023
  - ui1.js:180
  - ui4a.js:54
  - ui46.js:234
  - the "planned from" line, ui8.js:81 (it uses the month's `bankStart`)
  - tests: oracle.js:75, proof_fuzz.js:25, home_dom.js:48 and 61
- `bankNow`, `bankNowAt` and `bankAt`:
  - nowOf, model.js:1050, read by mapOf (model.js:728) and Home (ui8.js:57-62)
  - ownStart, model.js:722
  - cleanCfg, model.js:1029-1031
  - the undo label, ui45.js:512
  - 17 qc tests

`bankNow` never moves any planned figure. It is only compared against the plan (A12).

## 3. Recommended foundation

**The pay schedule (new, one setting).**
- `S.cfg.pay = { how: 'month'|'twice'|'every2w'|'week'|'whenever', days: [10] or [15,30], anchor: '2026-11-13', each: [amounts] }`.
- `days` is the same field shape as PAYDAY_DESIGN's `payDays`.
- One pure function, `payDates(S, from, to)`, returns the dated pays.
- `periodOf(date)` gives the stretch from one pay to the next.

**The starting point.**
- The anchor is today's typed bank and its date (`bankNow`, `bankNowAt`). This is the ledger's dated opening event (LEDGER W3).
- `bankStart` stops being something the person types. Old saves turn `bankStart` + `bankAt` into the anchor.

**Bank at the end of the period (or the plan month):**

bank today
+ pays dated after the bank's date and on or before the end
− bills due in that window and not yet logged
− card balances whose `payDay` falls in the window
− goal and Education/Giving/Investing money not yet set aside
− Free to spend left

**The 24-month projection.**
- The current plan month starts from that figure. After that, `bankStart(m+1) = bankEnd(m)`, exactly as today.
- Months before the anchor are history: receipts only, no projected bank.

**How the existing pieces map:**
- **Plan amounts stay monthly**, still stored under `YYYY-MM` in `steps`, `once` and `items`. A "plan month" runs from the first pay in calendar month X to the day before the first pay in X+1, named by the month the pay lands in (PAYDAY default). Inside it, each pay period gets 1/k of the flexible lines, where k is the number of pays in that plan month (1, 2 or 3).
- **Fixed bills** get an optional due day. With none set, the bill counts as due on the first pay of the plan month.
- **Pay** in a plan month = the sum of its real dated pays. A 3-pay month shows the third pay as "not placed yet", which is the truth.
- **Receipts** are grouped by one function, `bucketOf(date)`, used in `receiptsFor`, `calcAll`, `proofOf` and `mapOf`. Stored receipts never change.
- **Goals** keep their monthly contribution, set aside from the first pay of the plan month. `readyBy` becomes the plan month of the last pay on or before the due date, which replaces `PAYDAY`.
- **Yearly costs** (goal with a due date, plus one-time `items[ym]`) work the same way through `readyBy` and plan months.
- **Cards** use their `payDay` in the formula above.
- **All months table (ui2.js:280, ui3.js):** rows become plan months. The window rolls with today: 12 back, 24 ahead (LEDGER W1). `MONTHS` is worked out from today, not a constant.
- **Whenever pay (irregular):** plan month = calendar month, and the period runs from the last money in (PAYDAY 3C). Full support waits for ledger B1.

**What stays the same:** jars, lines, goal maths and caps, debt steps (still monthly), the `steps`/`once`/`items` keys, the proof's identity (only its start term moves to the anchor), and every screen's words apart from day counts. With no pay schedule set, every number must match today's build to the cent. The golden screens prove that.

## 4. Size

**Functions that change.**
- model.js:
  - date window: `START`/`END`/`MONTHS`, `readyBy`, `evenSave`, `goalDefault`, `planFromOf`
  - core sums: `calcAll`, `applyOverspend`, `receiptsFor`/`receiptStats`, `viewOf`, `mapOf`, `freeOf`, `playNotSafe`
  - proof and helpers: `proofOf`, `ownStart`, `nowOf`, `setBankBalance`, `validDue`, `loanPayments`
  - saved-data cleaning: `cleanCfg`/`CFG_KNOWN`, `cleanRecurring`
  - plus new `payDates`, `periodOf`, `bucketOf`
- ui0.js: `todayStr`, `weekOf`
- ui6.js: `nowYm`, `sweepOffer`, status lines, the Free to spend card
- ui5.js:314
- ui7.js: `openPay`, merged into a "when are you paid" question; month details rows 316-319
- ui45s.js: `STEP_MONEY`
- ui45u.js and ui46.js: import should use `balanceDate`
- ui8.js: the "planned from" line and the "now" card
- ui4a.js: the assistant's picture
- ui1.js and ui48.js: the labels
- every date input's min/max (ui4.js:5, ui6.js:554)

**Tests and checkers.**
- tests/regression/v25/oracle.js (586 lines, its own calendar logic at lines 50-237): needs an independent rewrite with pay dates. Do not copy model.js.
- proof_fuzz.js, fuzz_model.js, home_dom.js (lines 48-75 assert "days left" and "a week")
- e6_window.js: its whole premise changes
- golden_screens.js plus 42 golden files: regenerate. Prove that a plan with no schedule is unchanged.
- In wip/team/tests/qc, 44 of 281 tests reference `bankStart`, START, `daysLeft` or `slice(0,7)`. 17 reference `bankNow`.
- test_team.js has 25 references.
- display_math gate.
- New tests: every PAYDAY_DESIGN test, plus every-2-weeks and weekly year walks, pay landed before setup, a card paid in the window, and anchor migration.

**Estimate.** About 95 to 135 working hours in total.

| Work | Hours |
|---|---|
| Pay schedule and periods | 8 |
| Rolling window | 10 |
| Receipt bucketing | 6 |
| Anchor rewrite of calcAll, mapOf and proofOf | 18 |
| Home period view and words | 10 |
| Setup, Settings and import | 12 |
| Migration and no-schedule equality | 6 |
| Oracle rewrite (a helper) | 14 |
| Test and golden updates (helpers) | 20 |
| Two QC and number-gate rounds with fixes | 16 |

For one builder with two helpers that is about 3 weeks. A smaller Phase 1 (PAYDAY 3A plus anchoring Home's safe-to-spend on today's bank) is about 35 to 45 hours.

**Risky parts.**
- The proof and oracle start terms.
- Old `once` and `items` keyed `2026-12` change meaning by up to one pay month. Receipts from 1 to 9 December move to November.
- The `pendLeft` and sweep answers keyed by month.
- Bills already paid but not logged get subtracted twice. That errs on the safe side, but it needs a "paid" tick.
- Local versus UTC dates are mixed: model.js:18 uses local time, model.js:598 and 1205 use UTC.
- People paid on the 25th usually think of that money as next month's. The naming default needs a decision from Mako.

## 5. Other foundations likely to cause the same kind of setback

- **Multiple accounts:** one bank figure and one bank chain (model.js:1050). Savings held in the same account as spending make `notCovered` judge wrong. The ledger's accounts fix this.
- **Cash:** folded into "bank plus cash" (ui1.js:170). An ATM withdrawal looks like a spend, or vanishes.
- **Couples:** one plan, a partner is only "other pay" (`b`). There is no record of who paid, and three pay days do not fit.
- **Currency:** one symbol, display only (`S.ui.cur`). Yen rounding is special-cased (model.js:22, 586). There is no second currency or conversion.
- **Cards paid in full vs with interest:** two separate models. `S.cards` holds a typed balance and a pay day that no sum uses. `plan.debts` gives a monthly interest step from an undated balance (model.js:320, 353). The "Other card spending" line plus typed card balances plus card receipts can count the same spend twice.
- **Debt and goal start balances have no date**, the same flaw as `bankStart`.
- **Undo and one-off edits are keyed by calendar month**, so any later change to how months are defined moves them.

### Critical files for implementation
- /home/user/money-headache-remover/wip/team/model.js
- /home/user/money-headache-remover/wip/team/ui6.js
- /home/user/money-headache-remover/wip/team/ui45s.js
- /home/user/money-headache-remover/wip/team/ui8.js
- /home/user/money-headache-remover/tests/regression/v25/oracle.js
