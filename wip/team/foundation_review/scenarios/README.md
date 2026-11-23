# Scenario specs: eight lives, worked by hand

These files describe real-looking money lives and what the app should say on given days. They name no code, no saved fields and no functions, so any engine can be tested against them: load the accounts, schedules and events the app would know by the ask date, ask the question, compare with `expected`.

Every amount is made up. Sums are kept round so each one can be checked by hand; the `why` on each ask shows the sum.

Written 23 Nov 2026 from foundation_review/RECOMMENDATION.md, life_walks_salaried.md, life_walks_irregular.md, banking_reality.md, plan_review_1.md and DECISIONS.md ("Mako's own money").

## Files

| File | Life | Currency | Asks |
|---|---|---|---|
| mako_shape.json | Mako's shape: one bank, two cards paid in full on the 10th and 11th, two incomes on the 10th, a goal kept in the bank. Set up 20 Nov with pay in. January: pay Fri 8th, cards Tue 12th. | JPY | 42 |
| halves_paylater.json | Carlo: paid 15th and 30th in unequal halves, a pay-later plan taken from his e-wallet, one pay paid early. | PHP | 32 |
| every_two_weeks.json | Sam: paid every other Thursday, three pays in December, rent once a month bigger than a pay, insurance every three months. Cents. | USD | 21 |
| weekly.json | Ramil: paid every Friday into an e-wallet, cash for spending, Christmas and New Year pays land early. | PHP | 18 |
| freelancer.json | Bea: no fixed pay day, nothing in January, bank, e-wallet, cash and a dollar e-wallet. | PHP (+USD) | 20 |
| setup_mid_month.json | Nell: sets up on the 20th after pay, rent and the card payment already went through. Deferred-debit card. Cents. | EUR | 15 |
| couple_cash.json | Jun and Tess: one phone, three pay days across two people, joint bank, her e-wallet, household cash, a savings circle payout. | PHP | 18 |
| away_three_weeks.json | Rina: does not open the app for three weeks; confirms what happened, then checks bank and card. | PHP | 14 |
| late_pay.json | A pay that is late after a holiday weekend (review v3 situation 1, H8). | JPY | 8 |
| same_day_order.json | A spend after setup on setup day, a spend after a check on the same day, two checks on one day, a debit that posts after a check (situations 2, 3, 4, H1). | JPY | 7 |
| card_statements.json | A statement paid in part, and a refund bigger than the statement (situations 7 and 14, H3). | JPY | 5 |
| mako_close_not_sure.json | Mako's shape with both card close days "not sure", one card with a typed last statement and one without (H4, situation 5, E10). | JPY | 10 |
| other_currency_card.json | A dollar card paid from a yen bank (situation 6, H5). | JPY (+USD) | 4 |
| pay_day_moves.json | Pay moves from the 10th to the 25th from January (situation 8, H2). | JPY | 4 |
| yearly_and_places.json | A yearly tax paid from its own place that refills, bills in some months, a one-off, pay on the last working day (situation 9, H7). | JPY | 6 |
| places_and_checked.json | Paying from a goal's money, a goal account that goes overdrawn, a skipped bill, a top-up before the e-wallet was set up (situations 10 to 13). | JPY | 7 |
| loans_and_carried.json | A loan with a minimum rule and planned extra, a pay-later plan, a card that carries a balance (H7). | JPY | 7 |
| split_auto_est.json | The opening split by place, a gym fee that logs itself, a rough spend replaced by its statement line (H7, H9). | JPY | 6 |
| avail_check.json | An available check and a current check with a pending debit, and the two mixed on one bank (I1). | JPY | 9 |
| interest.json | Interest on a carried card balance, a loan and a pay-later plan, at the close and payment days, rounded half up (I2). | JPY | 8 |
| two_month_card.json | A card paid two months after its close: two statements waiting at once, one paid late (I3). | JPY | 8 |
| opening_by_days.json | An opening split by days left, with the rounding remainder to Free to spend (I4). | JPY | 6 |
| moved_records.json | Records moved from 38.31 with and without their own times, on one day (I5, corrected by J2: moved-01 and moved-02 keep the I5 figures in `alt`). | JPY | 3 |
| not_sure_interest.json | Interest on each payment day of a card whose close day is "not sure" and that carries a balance (J1). | JPY | 6 |
| moved_figure_no_time.json | A moved bank figure with no time of its own, and moved receipts on its day (J2). | JPY | 2 |
| avail_same_day.json | A spend logged after an "available" check on the same day (J3). | JPY | 3 |
| opening_free_typed.json | An opening split that names Free to spend, the lines shared by days left (J4). | JPY | 3 |
| two_month_opening.json | A two-month card set up between closes with two statements unpaid, each with its payment day (J5). | JPY | 7 |
| percent_min_interest.json | A card with close day "not sure", a percent minimum and a balance: the day's interest first, spending between payment days included (K1, K2). | JPY | 8 |
| moved_bank_now.json | A moved later bank figure with no date or time of its own (38.31 bankNow with no bankNowAt) (K3). | JPY | 3 |
| import_rules.json | Statement lines meeting typed lines and expected items: within 10% of the larger, either side of the typed day, a card's buy date, a card's 7 working days, settles moving to the import, early pay (L matching q2 to q6, q10; M1). | JPY | 11 |
| import_after_check.json | A statement line read after a check-in or after setup, a printed running balance deciding the order, a spend that logs itself written after a check (O1; final review S1). | JPY | 10 |
| card_out.json | Money leaving a card: a closed card's credit sent to the bank, a cash advance, cash taken at an ATM (O5; final review S2). | JPY | 10 |
| line_on_card.json | Food bought on the card: a line counts its spends on every account and is reserved once from the card's paying account; a line and Free to spend with no account are on the main bank; a refund given back to its line (O4; final review S3). | JPY | 6 |
| home_currency_dated.json | The home currency changes from yen to pesos on a date; the yen history stays in yen (O6). | JPY, then PHP | 5 |
| country_per_account.json | A Japanese card follows Japan's holidays while home follows the Philippines' (O, watch item). | PHP (+JPY) | 1 |
| check_gain.json | A check-in figure far above what the app had is asked about (O, watch item). | JPY | 3 |
| goal_removed.json | A goal removed with money in it: the money waits in Waiting "to place" and stays out of safe to spend; placing it moves it (P1; final review S7). | JPY | 5 |
| account_closed.json | An old bank closed: its money moved out by the transfer the closing asks for, its bill ends on the closing day (P6). | JPY | 7 |
| import_two_sided.json | Statement lines meeting one side of an ATM transfer, an e-wallet top-up and a ticked card payment: each attaches to its side (`posted2` for the second), never a second record (Q1; final review 2 S1, S1b). | JPY | 6 |
| import_read_as_repay.json | A statement line read as a card payment meets the ticked one on its bank side (Q1; final review 2 S1c). | JPY | 2 |
| fees.json | A top-up that costs a fee: `a` and `a2` kept, the difference a spend on the fees line from Free to spend, a transfer schedule with `fee` (Q2; final review 2 S4). | PHP | 4 |
| borrow_and_plans.json | A credit line drawn mid-year and two pay-later plans at once: a borrow or a spend raises what is owed; each payment day asks every plan's part (Q3; final review 2 S3, S3b). | JPY | 7 |
| card_instalments.json | A 12-part card buy on its own pay-later account `of` the card: the card is due only the part posted each month (Q3; final review 2 S9). | JPY | 7 |
| pay_other_currency.json | Pay in another currency than its account: not counted in the walk, warned; a settled pay keeps its original amount (Q4; final review 2 S5b, S5c). | JPY (+PHP) | 6 |
| auto_removed.json | A self-logged spend removed: `skip:<occurrence>`, on one device and after a merge with a second device's copy (Q5; final review 2 S2). | JPY | 5 |
| nearest_settle.json | The nearest line settles the pay, then the nearest amount; a later import in the same stretch moves the settle (Q6; final review 2 S8). | JPY | 6 |
| to_place.json | Money to place put in Free to spend (counts) or kept in Waiting on purpose (does not); a period-end answer record's moves fill a place (R1, P2). | JPY | 5 |
| closing_write_off.json | A dead e-wallet's last pesos written off at the closing, id `close:<account>` (Q7, Q watch). | PHP | 4 |
| paid_by_someone_else.json | A card statement paid by a parent (a repay with no paying account) and a travel spend posted 8 working days late (Q watch; final review 2 S10, S6). | JPY | 5 |
| pending_hold.json | A pending hold: a filler at the first check-in that the next one gives back; under T2 the filler is spending, signed, so the two add up to nothing (final review 2 S7, watch; T2). | JPY | 7 |
| rough_transfer.json | Rough top-ups met by statement lines: within 10% a side takes the line's amount, the other side keeps its typed amount and the difference is a fee from Free to spend; a line more than 10% away is a record of its own (S1). | PHP | 6 |
| settle_later_stretch.json | A deposit settles the pay before a check-in; the pay's own line, read in the next stretch, moves the settle and the period start (S2). | JPY | 4 |
| settle_ticked.json | The same, but the person ticked the deposit's settle at the check-in: it stays (S2). | JPY | 3 |
| card_plan_later.json | A 12-part card buy: the parts not yet posted are walked on their posting dates and show in "Later on" (S4). | JPY | 4 |
| fee_place.json | A fee as its own spend record `of` its transfer, paid from the place the person picked, else Free to spend; it moves no money of its own (S5); a fee in the next period (coverage: fee record, period start). The fee records are `fee:t1`, `fee:t2`, `fee:t3` (X2). | PHP | 7 |
| other_currency_lists.json | Pay in dollars into a yen bank: listed apart, in dollars, on the check-in list, and left out of the "not seen yet" totals (S6). | JPY (+USD) | 2 |
| period_start_model.json | A period started without the late pay, `ps:pay@2026-12-10`, is in the model; the late pay then settles its occurrence and starts no new period; a filler split at that start (T1, T6, T2; final review 3 f2). | JPY | 7 |
| period_end_fixed.json | A period with a period-end answer (`pe:pay@2026-11-10:free`) keeps its end when the ticked pay's date is corrected (T1; f1b). | JPY | 3 |
| filler_spending.json | The filler is spending: out of Free to spend for its period or periods, split by days at a pay, or out of the place the person picks (T2; f8). | JPY | 7 |
| bill_on_card.json | A bill and a self-logged spend on a card are future card lines, taken off the bank on the card's payment day (T3; f7). | JPY | 5 |
| overspent_line.json | An overspent budget line counts as nothing left in the walk (T4; f4). | JPY | 3 |
| line_other_currency.json | A peso spend on a yen line is not counted against it and is listed apart with a warning (T5; f3). | JPY (+PHP) | 4 |
| place_moves_adjust.json | A move out of a place lowers it; an accepted difference (`adjust`) moves its account and Free to spend or the place it names; a spend before the opening is not in spent so far (T7, T watch; f5). | JPY | 10 |
| close_main_bank.json | Closing the main bank moves the main bank, the lines, Free to spend and the pay schedule to the new main bank (T watch; f9). | JPY | 5 |
| closed_reopened.json | Money into a closed account reopens it with a notice; a spend on an account that later closed stays in its line (T watch). | JPY | 5 |
| investment_gain.json | An investment's rise raises no question and is no filler (T watch). | JPY | 3 |
| told_moments.json | `told` compared as moments across time zones (T watch). | JPY | 3 |
| plan_change.json | A change to Free to spend applies from the next period start (T watch). | JPY | 3 |
| rough_more_arrived.json | A rough side met by a line that would make more arrive than left: both sides take the line's amount, no fee (U1). | PHP | 6 |
| check_in_matched.json | Settles made by an import listed as already matched on the check-in list; one unticked (U2). | JPY | 3 |
| fee_record_gone.json | A fee record never moves the account; its transfer's `a` holds the fee (S5 fix). | PHP | 4 |
| grid_two_phones_check.json | Coverage grid cells: two check-ins on one day from two phones, a check edited after its period ended, a ticked pay's amount corrected. | JPY | 6 |
| grid_other_currency.json | Coverage grid cells in another currency: a refund, a bill, a goal, a loan, a conversion on a check day and met by a statement line. | JPY (+PHP) | 7 |
| grid_period_cells.json | Coverage grid cells: a transfer before an account's opening, a refund given back after the period start, a skipped pay. | JPY | 5 |
| grid_borrow_window.json | Coverage grid cell: a cash advance whose bank side posts after a check-in. | JPY | 3 |
| goal_own_account.json | A goal's money moved to its own account, counted there (V1). | JPY | 7 |
| loan_other_currency.json | A peso loan paid from a yen bank, left out of the walk with a warning (V2). | JPY (+PHP) | 7 |
| close_main_bank_bills.json | Closing the main bank moves its bills too (V). | JPY | 5 |
| plan_change_first_day.json | A plan change made on a period's first day applies to it (V). | JPY | 3 |
| card_no_statement.json | A card with a known close day and no typed last statement: the first close after the opening holds the opening balance (X6; c1). | JPY | 5 |
| far_years.json | Ten years out: close days, a not-sure card's payment days, a credit line, pay later, pay, rent, a yearly tax place and a budget line in 2036 (X7; c2). | JPY | 12 |
| notyet_opening.json | Set up on pay day before the pay is in: `not_yet`, the pay on the first check-in list, starting the period (X3; c3). | JPY | 6 |
| notyet_bill.json | A bill due the day before setup not gone out, and pay in dollars not in yet; a statement line settling the bill stays outside the opening (X3, F20). | JPY (+USD) | 4 |
| gain_held.json | A large check-in gain held, not placed, until answered (X4; c4). | JPY | 4 |
| gain_answered.json | A gain answered right is placed; one still asked stays held (X4). | JPY | 2 |
| gain_pay_day.json | Set up on pay day with the pay taken as in; the next check-in's 250,000 gain held (X4; c3). | JPY | 3 |
| to_place_two_phones.json | Money to place placed on two phones: the newer placing gives way (X5; c7). | JPY | 2 |
| day_offsets.json | A moved receipt and a typed spend with a date only start at the start of the day in +09:00; a time with no offset is the device's (X9; c5). | JPY | 1 |
| day_offset_west.json | The opening day's end at -05:00 (X9). | USD | 1 |
| day_offset_kinds.json | Every kind that moves money, dated the opening day with no time, is inside a 07:00 +09:00 opening (X9). | JPY (+USD) | 5 |
| pay_day_offer.json | A pay day change entered after a settled pay, from the day after it as the edit offers (X8; c8). | JPY | 3 |
| leap_year_end.json | A yearly bill on 29 Feb, pay on the 31st moved earlier for a holiday, a card closing on the last day (c9). | JPY | 6 |
| goal_money_elsewhere.json | A moved goal whose money is in another account: kept there, out of the bank's split (X watch; c10). | JPY | 4 |
| one_occurrence_amount.json | One occurrence changed (`amounts`), winning over a step (X watch). | JPY | 5 |
| bill_ends_redirect.json | A bill that ends, its money redirected to a goal (`ends`, `redirect`; X watch). | JPY | 4 |
| payoff_place.json | A pay-off place naming its debt (`pays`; X watch). | JPY | 3 |
| owed_other_currency_lists.json | A dollar card and a peso loan paid from a yen bank: listed apart in their own currency, out of the totals (W2, V2). | JPY (+USD, PHP) | 5 |
| goal_account_spend.json | An account that backs a goal is not spent from (W). | JPY | 2 |
| notyet_line_before.json | A not-yet bill settled by a line dated before the setup day: the line comes after the opening, an imported line and a typed one (AB4; confirm_review_2 d2). | JPY (+USD) | 3 |
| card_between_close_pay.json | Cards set up between their close and their payment day: "Is the last statement paid?" answered yes, no (with its amount) and don't know (everything owed due on the next payment day) (AB3; confirm_review_2 d3). | JPY | 10 |
| loan_between_stmt_pay.json | A loan and a pay-later set up between their statement and their payment day, answered yes and no (AB3). | JPY | 4 |
| loan_one_month_amount.json | A moved debt's one-month amount is that month's whole payment (AC5). | JPY | 3 |
| loan_stmt_dont_know.json | A loan and a pay-later set up between their statement and their payment day, answered don't know: that month's usual payment is due on the next payment day, not the whole balance (AD7). | JPY | 5 |
| keyed_removed.json | Keyed overrides in the AE1 shape `{ amount, at, by, gone }`: a key undone, removed or put back with Redo, read on a check day and across a period start (AH3; confirm_review_4 item 3). | JPY | 6 |
| keyed_removed_x8.json | A pay day change after a removed key: the removed key names nothing, so the copy is sound (X8, AH3; g3). | JPY | 2 |
| away_clock.json | Used again after three weeks away: `told` on the device's own clock, so a spend typed after a check that day is counted (AH1; g1). | JPY | 3 |
| x8_ordinary_ids.json, x8_ordinary_ids_ok.json | X8 with ordinary schedule ids (AJ1). | JPY | 4 |
| offset_travel.json | A phone flown from Tokyo to Honolulu: dates in the writer's own calendar (AL watch); a spend dated the day before a check, told after it, comes after it (AM3). | JPY | 3 |
| check_day_before.json | Receipts logged after a check: one dated the day before is judged by `told`, one dated two days before stays inside (AM3). | JPY | 3 |
| moved_together.json | Two moved amounts on one pay and on one bill, add or replace not picked: the smaller pay and the larger bill count (AM1). | JPY | 3 |
| moved_together_picked.json | The same after the person picks add: the sums count (AM1). | JPY | 3 |
| check_specs.js | Checks every file's shape and that every `why` adds up to its expected figure. `node check_specs.js` | | |

Total: 549 asks (the first eight files: 180; the H files: 64; the I files: 34; the J files: 21; the K, L and M files: 22; the O files: 35; the P files: 12; the Q and R files: 63; the S files: 25; the T and U files and the coverage grid files: 92; pending_hold hold-07, added with T2: 1). T1 renamed to_place's period-end answer `pe:2027-01-24:free` to `pe:pay@2026-12-25:free` (the pay that started the period); no figure changed. S4 also changed card_instalments inst-07 (280,000 to 270,000: the part posting on 15 Apr is now walked). After V: 571. After W and X (decisions W and X, confirm_review_1): 649 asks in 99 files (78 added: 77 in the 19 new files above, 1 in fee_place). After AA: 667 asks in 104 files. After AB and AC (confirm_review_2): 687 asks in 108 files (20 added, in the 4 new files above). After AD: 692 asks in 109 files (5 added, in loan_stmt_dont_know). After AE: 698 asks in 110 files. After AH (confirm_review_4): 709 asks in 113 files (11 added, in the 3 new files above); one_occurrence_amount and loan_one_month_amount hold their `amounts` in the AE1 shape. After AJ: 713 asks in 115 files. After AL: 716 asks in 116 files. After AM: 725 asks in 119 files (9 added, in the 3 new files above); offset_travel ot-01 to ot-03 and away_clock ac-01 to ac-03 re-worked by hand for AM3.

### The review v3 situations and where each one is now

The reviewer's own scripts are in `../ref/review_v3_situations/`. Each situation is now an ask with a hand-worked answer:

| Situation | Decision | Asks |
|---|---|---|
| 1. Pay a day late after a holiday | H8 | late_pay late-01 to late-08 |
| 2. A spend after a same-day check; two checks on one day | H1 | same_day_order order-02 to order-04 |
| 3. A spend on setup day, after setup | H1 | same_day_order order-01 |
| 4. A debit that posts after a check | H1 | same_day_order order-05 to order-07 |
| 5. Close day "not sure": no statement typed (a), after the first payment (b), payment day passed (c) | H4 | mako_close_not_sure notsure-02 (a), notsure-05 to notsure-08 (b), notsure-09 and notsure-10 (c) |
| 6. A dollar card paid from a yen bank | H5 | other_currency_card fx-01 to fx-04 |
| 7. A refund bigger than the statement | H3 | card_statements stmt-02 to stmt-05 |
| 8. Pay day changes from the 10th to the 25th | H2 | pay_day_moves move-01 to move-04 |
| 9. A yearly bill | H7 | yearly_and_places year-01 to year-06 |
| 10. A skipped bill (sound) | | places_and_checked place-06, place-07 |
| 11. A top-up to an e-wallet set up later (sound) | B7 | places_and_checked place-01, place-02 |
| 12. A goal kept in its own account that goes overdrawn | H7 | places_and_checked place-03, place-05 |
| 13. A trip paid from the trip money | H7 | places_and_checked place-04, place-05 |
| 14. A pay-in-full card paid in part | H3 | card_statements stmt-01, stmt-04, stmt-05 |

### What the H files add to the way a file is written
- **told** on an event or a check may be a date and a time (`2026-11-22T12:00`): when the app first heard of it. With no time, records on the same day keep the order they are listed in. An account's `opening.told` is when setup was typed; with no time, the opening covers its whole day (rule 2).
- **posted** on a bank event: the day the bank posts it. A check holds it by that day (H1).
- **changes** on a schedule: `[ { from, schedule } ]`, the schedule from that date on (H2).
- **frequency** may also be `yearly` (`date: "MM-DD"`), `months_list` (`months`, `day`), `last_workday` (no move needed) and `once` (`date`).
- **statement_close_day: null** is "not sure" (H4); then the last statement may be left out, and `months_after_close` is not needed.
- **kind `loan` and `paylater`** accounts: `opening.owed`, and `payment` with `day`, `from`, `weekend_holiday`, and `amount` or `min_rule` (`{ pct, floor }` or `{ fixed }`), and `extra_steps` (`[ { from, amount } ]`). A card with `carries: true` pays its `min_rule` plus `extra_steps` instead of the whole statement.
- **repay** events (`from`, `to`, `amount`, `settles`) pay a loan or pay-later plan. A card payment or a repay between two currencies has `amount_out` (what left) and `amount_in` (what arrived) instead of `amount` (H5).
- **skip** events settle an occurrence with no money.
- **bills** may have `kind: "auto_spend"` (it logs itself on its day) and `place` (a goal id it is paid from). A spend may name the `goal` it is paid from, and the budget `line` it is for (`free` is Free to spend).
- **goals** may have `refill: true` with `for_bill`: after each payment it starts again for the next occurrence (E5).
- **opening.split** on a bank: `{ goals, lines, free }`, the opening figure by place (B2, B6); the rest is waiting. **plan** at the top: `{ lines: [ { id, name, account, per, amount } ], free: { account, per, amount } }`.
- **est: true** marks a typed line as rough; **source: "statement"** (or "screenshot") marks an imported line.

### What the I files add to the way a file is written
- **avail** on a bank `check`: `"available"` (the figure already has pending debits off, so every event dated on or before its day is inside it) or `"current"` (the H1 posted-date rule). Left out, a check is current (I1).
- **apr** on a card, loan or pay-later account: the yearly rate in percent. Interest is added on the carried balance at each card close and on each loan or pay-later payment day, balance x apr / 100 / 12, rounded half up to the minor unit (I2). A file may list the interest worked by hand under `interest`, for checking; it is not an input.
- **months_after_close: 2** is a card paid two months after its close. A statement still waiting for its payment day is never folded into the next one (I3).
- An opening with no `split` entry for a budget line or Free to spend shares it by days left: the days from the setup day to the period's last day, both counted, over the period's days, rounded down; what rounding leaves goes to Free to spend (I4).
- **moved: true** marks a record moved from 38.31; **own_time** is its own time when it has one. Its told is `own_time`, else the top-level `moved_copy.saved`; on one day moved records keep their order in the file (I5).

### What the J files add to the way a file is written
- A card with `statement_close_day: null` and `carries: true` that has an `apr` gets interest on each payment day (J1).
- A **moved** receipt with no `own_time` is told at the start of its day, so one dated on or before the moved bank figure's day is inside it (J2, correcting I5). An account's `opening.moved: true` (with no `told`) is a moved bank figure with no time of its own: it is told at `moved_copy.saved`. At the same moment, moved receipts come before moved figures.
- An "available" check holds the events dated before its day and those on its day told before it; a spend told after it comes after it (J3).
- When `opening.split` names `free`, that figure stands; the rounding leftovers of the lines shared by days left stay in Waiting (J4).
- A card's `opening.statements` (instead of `opening.statement`) lists several unpaid statements, oldest first, each with `closed`, `amount`, `paid: false` and `payment_day` (the due date; the weekend rule still applies) (J5).
- `rule_questions` and `alt` may name a decision (like `I5`) whose earlier reading the `alt` keeps, as well as an open question (like `Q14`).

### The final review situations and where each one is now
The reviewer's own scripts (final_review_1.md) are in `../ref/final_review_situations/` (they name the main checkout's path; run them from a copy that points at this one). Each situation is now an ask or a rules case with a hand-worked answer:

| Situation | Decision | Asks or cases |
|---|---|---|
| S1. A statement line read after a check-in (a), with no typed line (b), on the setup day (c) | O1 | import_after_check iac-01 to iac-06; rules match-47, match-48 |
| S1. A printed running balance; a spend that logs itself written after a check | O1 | import_after_check iac-07 to iac-10 |
| S2. A closed card's credit sent to the bank (a), a cash advance (b), cash taken at an ATM | O5 | card_out out-01 to out-10 |
| S3. Food bought on the card, the line on the bank or on the card | O4 | line_on_card line-01 to line-06 |
| S4. Two phones tick the same pay; the period end answered on both | O2, P2, P3 | rules mg-50, mg-54, mg-55, pe-36, pe-37, pe-40 to pe-43 |
| S5. The three-letter session part | O3 | rules mg-58, mg-59, mg-61 |
| S5 (S7 in final_review_1). A goal deleted with money in it | O (watch), P1 | goal_removed gone-01 to gone-05 |
| S5. Pay rhythm changed mid-year | O (watch), P4 | rules units-59 (the count), units-67 to units-69 (each rule its own months) |
| S5. Rent paid twice then refunded; pay split across two accounts | sound | none needed |
| S6. A spend that logs itself written on two devices | O2 | rules mg-51, mg-56 |
| Home currency changed over time | O6 | home_currency_dated cur-01 to cur-05; rules units-60 to units-62 |
| One holiday table for all accounts | O (watch) | country_per_account ctry-01 |
| A wrong figure typed at a check-in | O (watch) | check_gain gain-01 to gain-03 |
| A refund given back to its line | O (watch) | line_on_card line-04, line-05 |
| An old statement read after a period-end answer | O (watch), P5 | rules pe-38, pe-39, pe-44 to pe-47 |
| An account closed | O (watch), P6 | account_closed close-01 to close-07; rules acc-01 to acc-06 |
| The move's ₱ and the raw `frozen3831` | O (watch) | rules units-63 to units-66 |
| A period started without the pay, on two phones | O2 | rules mg-53, mg-57 |

### The final review 2 situations and where each one is now
The reviewer's own scripts (final_review_2.md) are in `../ref/final_review2_situations/` (they name the main checkout's path; run them from a copy that points at this one). Each situation is now an ask or a rules case with a hand-worked answer:

| Situation | Decision | Asks or cases |
|---|---|---|
| S1. ATM cash typed as a transfer, then the bank statement | Q1 | import_two_sided two-01, two-02, two-06; rules match-49 |
| S1b. A ticked card payment, then the bank statement | Q1 | import_two_sided two-01, two-03; rules match-52 |
| S1c. The statement line read as a card payment | Q1 | import_read_as_repay rrep-01, rrep-02 |
| S1d. matching_ref replacing the transfer | Q1 | rules match-49 to match-55 (`posted2` and `src2`: match-50, match-51; two-04) |
| S2. A self-logged spend removed (someone else paid) | Q5 | auto_removed auto-01 to auto-05; rules mg-64, mg-67, mg-69 |
| S3. A credit line drawn mid-year | Q3 | borrow_and_plans plan-03, plan-04, plan-06, plan-07 |
| S3b. A pay-later buy; two plans at once | Q3 | borrow_and_plans plan-01, plan-02, plan-05 to plan-07 |
| S4. A top-up with a fee | Q2 | fees fee-01 to fee-04; rules match-54 |
| S5, S5b, S5c. Pay in another currency | Q4 | pay_other_currency cur-01 to cur-06 |
| S6. A travel spend on the home card, posted late | sound (Q watch) | paid_by_someone_else paid-02, paid-04, paid-05 |
| S7. A pending hold | sound (watch) | pending_hold hold-01 to hold-06 |
| S8, S8b. A returned deposit before pay | Q6 | nearest_settle near-01 to near-06; rules match-56 to match-58 |
| S9. A card buy in 12 parts | Q3 | card_instalments inst-01 to inst-07 |
| S10. A card paid by someone else | Q watch | paid_by_someone_else paid-01 to paid-03 |
| S11. A goal removed on two devices | Q7 | rules mg-62, mg-65, mg-68 (and `close:` mg-63, mg-66, mg-70; acc-02, acc-07, acc-13) |
| P2's record replacing move events; closing with a write-off | Q watch | to_place tp-05; closing_write_off woff-01 to woff-04; rules acc-07 |
| R1 to R4 | R | to_place tp-01 to tp-04 (R1); rules units-70 to units-74 (R2), acc-08 to acc-11 (R3), acc-12 to acc-14 (R4) |

### Decisions S and where each one is now

| Decision | Asks or cases |
|---|---|
| S1. A rough transfer side met by a line within 10% takes its amount; the other side keeps its own; the difference is a fee | rough_transfer rough-01 to rough-06; rules match-59 to match-63 |
| S2. A nearer line read later moves a settle and the period start, unless the person ticked it | settle_later_stretch later-01 to later-04, settle_ticked tick-01 to tick-03; rules match-64 to match-66 |
| S3. Several closing records are `close:<account>:1`, `:2`, in order | rules acc-15, acc-16, mg-71 to mg-73 |
| S4. Card plan parts not yet posted are walked on their posting dates and appear in "Later on" | card_plan_later later-plan-01 to later-plan-04; card_instalments inst-07 |
| S5. A fee is its own spend record `of` its transfer, with the place picked (Free to spend by default) | fee_place feeplace-01 to feeplace-06; rough_transfer rough-03, rough-06 (no fee record: Free to spend) |
| S6. Pay in another currency is left out of the "not seen yet" totals and listed apart on the check-in list | other_currency_lists ocl-01, ocl-02 |

### Decisions T and U and where each one is now

| Decision | Asks or cases |
|---|---|
| T1. A period is named by the occurrence of the pay that starts it; `pe:<occurrence>:<place>`, `ps:<occurrence>` with the chosen day, `once` by occurrence; a fixed end stays | period_start_model psm-01 to psm-07, period_end_fixed pef-01 to pef-03; rules pe-27, pe-31 to pe-43 (renamed), pe-48 to pe-54, mg-52, mg-53, mg-57, mg-74, mg-76 to mg-78, units-75 to units-77 |
| T2. The filler is spending, from Free to spend by default, split as A4, or the place picked | filler_spending fs-01 to fs-07; period_start_model psm-07; told_moments tm-03; grid_two_phones_check g2p-03, g2p-05; pending_hold hold-05, hold-07 (signed: a filler below zero gives back) |
| T3. Bills and self-logged spends paid by card are future card lines, off on the card's payment day | bill_on_card boc-01 to boc-05 |
| T4. An overspent line counts as zero left in the walk | overspent_line ol-01 to ol-03 |
| T5. A line counts only spends in its own currency; others listed apart with a warning | line_other_currency loc-01 to loc-04; grid_other_currency goc-04 |
| T6. Period starts are in the model | period_start_model psm-01 to psm-07 |
| T7. A move out of a place lowers it; `adjust` moves its account and place; Wallet mode and `hand` are stage 2 | place_moves_adjust pma-01 to pma-10 |
| S5 fix. A transfer's `a` holds the fee; the fee record moves only the place | fee_record_gone frg-01 to frg-04 |
| T watch: closing the main bank | close_main_bank cmb-01 to cmb-05; rules acc-17, acc-18 |
| T watch: a transfer typed on two phones | rules double-10 to double-12 |
| T watch: investments never raise the gain question | investment_gain inv-01 to inv-03 |
| T watch: a `plan.shares` change applies from the next period start | plan_change pc-01 to pc-03 |
| T watch: an event into a closed account reopens it | closed_reopened cr-01 to cr-05 |
| T watch: SCHEMA 3 (pre-opening spends not in spent so far) | place_moves_adjust pma-03 |
| T watch: `told` and `at` compared as moments | told_moments tm-01 to tm-03 |
| U1. More arriving than left: both sides take the line's amount unless the other side has its own line; no fee | rough_more_arrived rma-01 to rma-06; rules match-67 to match-69 |
| U2. Settles made by an import shown as already matched, ticked; the person can untick | check_in_matched cim-01 to cim-03 |

### What the T and U files add to the way a file is written
- **period_start** events: id `ps:<occurrence>` (the pay it stands in for), dated the day the person chose, no amount (T1, T6). A `period_end_answer` is `pe:<the occurrence that started the period>:<place>`, dated the period's last day (T1).
- A **check** may carry **filler_place**: the goal or budget line its filler comes out of, when the person picked one; else Free to spend (T2).
- A `set_aside` may carry **from_place**: the place money moves out of, into its `goal` or, with none, Waiting (T7). An **adjust** carries a signed `amount` on its `account`, and may name a `goal` (T7).
- A plan line or `free` may carry **changes**: `[ { made, amount } ]`, each applying from the first period start after the day it was made (T watch).
- `told` may carry its offset (`2026-12-14T09:30+08:00`); it is compared as a moment (T watch).
- Account kinds **investment** and **wallet** (B10).
- An imported line may carry **unticked: true**: the person unticked the settle it made on the check-in list, so it settles nothing (U2). **check_in_list** may give **matched**: the items an import settled since the last check-in, ticked, outside `total` (U2).

### What the S files add to the way a file is written
- A `transfer` may carry **est: true** (typed roughly). A statement line within 10% of one side's amount meets that side and the side takes the line's amount; the other side keeps its typed amount (S1).
- An imported line may carry the **settles** it saved when it was read. Unless it also carries **ticked: true** (the person ticked that settle at a check-in: the check-in's `settled` names the line), the settle is worked out again with every import the app knows, so a nearer line read later moves it (S2).
- A `spend` with **of** (a transfer's id) is that transfer's fee record: its amount is what left less what arrived, it may name a `goal` (the place the person picked, else Free to spend) and moves no money of its own (S5).
- **later_on**: the accounts that go below zero after the walk's end and within 12 months (B11), each `{ account, month, balance }`, the balance at the end of the first day below zero; `why` gives each account's sum.
- **check_in_list** may give **apart**: items in another currency than their account, each with `currency`, listed apart and not in `total`. A **not_seen_yet** item may carry `currency` too; it is listed and left out of `money_in` (S6).

### What the Q and R files add to the way a file is written
- An imported line may meet one side of a `transfer`, `repay`, `borrow` or `convert`: a money-out line on the side money leaves, a money-in line on the side it reaches. It then attaches to that record (its `posted` becomes that side's posted date: `posted` for the leaving side, `posted2` for the reaching side) and is not counted again (Q1). An imported line that is itself two-sided names the statement it came from with `account`.
- A `transfer` in one currency may carry `amount_out` and `amount_in` when they differ (Q2): the difference is a fee, a spend from the sending account on the fees line, from Free to spend. A transfer schedule may carry **fee**: the walk takes amount plus fee off the sending account and adds the amount to the other.
- A loan or pay-later account may carry **plans** (`[ { id, amount, count, first } ]`): each payment day asks the part of every plan due that day, its parts monthly from `first`. A `borrow` from a loan or pay-later account, and a `spend` on it, raise what it owes (Q3). A pay-later account with **of** (a card's id) is a card instalment plan: it has no payment of its own, and each part is posted to the card on its day, lowering what the plan owes and raising the card.
- An income schedule may carry **currency** different from its account's: it is not counted in the walk and is warned about (`income_other_currency`); a `pay_in` may carry **amount2**, the original amount in that currency (Q4).
- A **skip** with the id `skip:<occurrence>` is what removing a self-logged spend writes; a self-logged spend whose occurrence has a live skip does not count (Q5).
- **place_money** (`account`, `to_place_of` a removed goal, `into`: `free` or `waiting`, `amount`) places money to place in Free to spend, where it counts again, or keeps it in Waiting on purpose, where it does not (R1).
- **period_end_answer** (id `pe:<period last day>:<place>`, `date` the period's last day, `place`, `moves: [ { to, amount } ]`) is P2's one record per place; a move to a goal fills that goal.

### What the P files add to the way a file is written
- A goal may carry **removed** (a date): from that day it is no longer a place, and what it held waits in Waiting marked "to place", out of safe to spend (P1). A `set_aside` may carry **to_place_of** (the removed goal's id): it places that much of the money to place in its goal; a `set_aside` without it comes from the account's other money.
- An account may carry **closed** (a date): from that day its schedules (paid from it, landing in it, or a transfer into it) expect nothing due after it, it has no minimum and is not counted in safe to spend. The model refuses (throws) a closed account that still holds money on that day: the file moves it out with a `transfer` dated the closing day (P6).

### What the O files add to the way a file is written
- An imported line may carry **bal**: the running balance the statement prints after that line (`src.bal`). On a check's day it decides whether the line is inside the check (O1).
- An imported line that replaces no typed line, or a spend that logs itself (it settles an `auto_spend` bill, like `auto:gym@2027-01-08`), dated on a check's day or the setup day, is inside that figure, whatever its `told` (O1).
- **not_explained** may give **on**: the day of the check it is about, when the ask is later (an import read after the check).
- **borrow** events (`from` a card, `to` an account, `amount`): cash taken on a card. A `transfer` or `borrow` out of a card is a card line (O5). A card may carry **cash_apr** (stored for stage 2, not used yet).
- A top-level **main_bank** names the main bank. A budget line or Free to spend with no `account` is on it; a line may name a card, and is then reserved from the card's paying account (O4). A **refund** may name its `line` when the person gives it back to that line.
- A top-level **home_curs** (`[ { from, cur } ]`, the first in the file's `currency`) dates the home currency; asks with no account are in the currency in force on their date (O6).
- An account may carry **country** and its own **holidays** table; its items, card payments and posting windows follow it (O).
- **total_after_cards**: the total less what the home-currency cards owe (F10, O5).
- The warning **gain_to_ask**: a check-in figure above what the app had by more than the period's Free to spend, or by more than 20% of what the app had for the account (O).

### What the K and L files add to the way a file is written
- A card with `statement_close_day: null`, `carries: true`, an `apr` and a percent `min_rule`: the next payment day's interest is added first, on everything owed before that day's payment (spending since the last payment day included, K1), and the minimum is worked out on the balance including it (K2).
- A **moved** `check` with no `date` (and no `told` or `own_time`) is a 38.31 `bankNow` with no `bankNowAt`: it is dated to the day of `moved_copy.saved` and told at it (K3, J2). The checker orders it by that day.
- An imported line (`source`) meets typed lines by direction (money out: `spend`, `bill_paid`; money in: `pay_in`, `money_in`, `refund`), inside the account's posting window either side of the typed day, by its `posted` date and, on a card, by its buy date too. A card with no `posting_days` of its own has 7 working days (M1). A rough line matches within 10% of the larger amount, compared exactly. The closest date wins, then the earliest `told`. The import takes over the typed line's `settles` (L matching q3 to q7, q10).
- An imported line that replaces no typed line and settles nothing settles the first unsettled pay or bill of its account and direction with the exact amount (or within the schedule's `vary`, when a file gives one), landing from 5 working days before the item's landing day to the end of its posting window (L matching q1, q2).

### Questions added for the H files
- **days_to_next_pay** with `late: true`: the next pay is late but still inside its posting window (H8); `days` is zero or below.
- **check_in_list**: what the check-in lists first, ticked by default (A2).
- **may_still_post**: items past their landing day but inside the posting window (G3).
- **owed_now** (per card, loan or pay-later account).
- **headline**: safe to spend, the one figure on Home (F9, G2).
- **place**: what a goal or other kept place holds now and when it is next due (with `account` and `place`).
- **warnings**: the warnings under the headline, as `{ account, code }`.
- **not_explained** may give `from`: only the filler whose stretch starts that day.

## How to read a file

- **accounts**: where money sits (bank, cash, e-wallet) and cards. Each has a currency, an owner and a minimum (the lowest the person wants it to go). Each has an **opening**: an amount on a date. A card opens with two figures: its last statement (closed on a date, amount, paid or not) and what is owed now in total.
- **income** and **bills**: things that repeat. Each has an account, an amount, a schedule (day of month, days of month, every N weeks from a date, weekly, every N months, or none) and a weekend and holiday rule: move earlier, move later, or none. Income says whether it starts a new period.
- **cards** also repeat: a statement close day (a day or "last") and a payment day, N months after the close, paid in full from an account, with the same weekend and holiday rule.
- **holidays**: the holidays used, listed in the file so no table is needed. `bank_closed` days count as non-working too.
- **landing_dates**: for each expected item, the day it is due (the item's name) and the day it really lands after the weekend and holiday rule. Worked out by hand; an engine should get the same.
- **events**: what really happened, in date order: pay in, other money in, spends, refunds, bills paid, card payments, moves between own accounts, conversions, money set aside for a goal, and checks ("the bank shows X today"). An event that is an expected item names it in `settles`. If an event has `told`, the app only hears of it on that date (null: never).
- **card_statements**: each card's statements worked out by hand, for checking. Not an input.
- **asks**: a date, a question, the expected answer and a `why` sum. `at` is "end of day" unless it says "start of day". `rule_questions` points at the open questions below that the answer depends on. `alt` gives the answer under the other reading, where it differs.

Item names are `<schedule>@<due date>`, using the due date before any move: the January card A payment is `card_a@2027-01-10` even though it lands on 12 Jan.

## The questions asked

- **bank_today** (per account): what the account holds at the ask time, from the latest check or opening plus the events since that the app knows of.
- **safe_to_spend** (per account): see rule 9.
- **days_to_next_pay**: days from the ask date to the landing date of the next pay that starts a period.
- **due_before_next_pay**: expected bills and card payments, from any account, not yet settled, landing from the ask date up to the day before the next pay.
- **not_seen_yet**: expected items (pay, bills, card payments) whose landing date is before the ask date and that nothing has settled. Money in and money out are added separately.
- **card_due** (per card): the amount of the card's next payment and the day it lands. "closed" if the statement has closed; "open" with the amount posted so far if not.
- **total**: everything held in the home currency, across non-card accounts. Other currencies are listed `beside` it.
- **not_explained** (per account): the gap between what a check shows and what the app worked out from what it knew.

## Rules used to work out the expected figures

1. **Ask time.** An ask is at the end of its day, after every event dated that day, unless it says start of day.
2. **Openings cover the past.** An opening amount on a date includes everything on or before that date. Expected items due on or before the opening date are settled by it: never late, never counted again.
3. **Weekend and holiday rule.** Move earlier: the last working day before. Move later: the next working day after. None: stays. A working day is not a Saturday, Sunday, listed holiday or listed bank-closed day.
4. **Settling.** An expected item is settled only by an event that names it. Landing early (Carlo's 23 Dec pay, Mako's 8 Jan pay) settles it; it is not expected again.
5. **Bank today.** Latest check (or opening) plus the money in and out since, as far as the app has been told. Nothing expected is assumed to have happened.
6. **A check** sets the account to the figure shown on its date. Any gap is "not explained"; it settles nothing.
7. **Card statements.** A card line goes on the statement by its posting date (the buy date unless `posted` says otherwise). A statement closing on day C holds the lines posted after the last close up to and including C. A refund posted in a cycle lowers that cycle's statement. The close day never moves for weekends or holidays.
8. **Card owed now** is the unpaid statement plus everything posted since its close.
9. **Safe to spend, for one account:**
   - start from bank today for that account;
   - take off goal money kept in it;
   - take off everything owed now on the cards paid from it (statement and new spending);
   - then walk day by day from today to the latest of: the day before the next pay into this account, and the next landing date of each bill from this account. On the walk, count expected pay into the account (pay first on a day with both) and expected bills from it. Card payments are not walked again (they were taken off above). Planned goal set-asides are not walked;
   - take the lowest point of the walk (today's starting point counts) and take off the account's minimum.
   - The answer can be below zero: that is how short the account will be.
10. **Late items** (past their landing date, not settled): a late bill still counts as going out on the first day of the walk; a late pay is not counted as coming in until it lands.
11. **No fixed pay day.** No future pay is expected. The walk runs to each bill's next landing date only. Days to next pay has no answer.
12. **Several accounts.** Safe to spend is given account by account. No single headline figure is given (see Q9).
13. **Total** does not take off what is owed on cards. Card spending moves no money until the card is paid (as in the ledger design: "Total stays, Free to spend drops").
14. **Other currencies** sit beside the total and are not added in until converted.

## Decided readings (DECISIONS_ROUND2 H, 23 Nov)
Section H answers schema_v3_review_1.md and wins over anything earlier. Changes to figures in the first eight files: **mako-35** (H8: the side pay, late but inside its posting window, still counts; 429,000 becomes 479,000, the old figure is kept in its `alt`). Every other figure in those files stands.

## Decided readings (DECISIONS_ROUND2 F, 23 Nov)

The questions below were decided in DECISIONS_ROUND2.md section F. The expected figures now use the decided reading; where that changed a figure, the old one is kept in the ask's `alt` with the rule it used. The reference model (`../ref/lookahead_ref.js`) works out every figure, and `node ../ref/run_scenarios.js` checks every ask. What changed from rules 1 to 14 above:
- **Rule 9, cards (F14).** Nothing is taken off today as one lump. Each statement comes off on its payment day (income first on the same day), the still-open part on the payment day after its close, anything past the horizon at the horizon's end.
- **Rule 9, how far the walk goes (SCHEMA 10.3 step 1).** Every account is walked to the same horizon: the later of the second next pay that starts a period and 45 days from today.
- **Rule 11, no fixed pay (B4).** The horizon reaches the second occurrence of every monthly bill (and at least 45 days).
- **Rule 12 and Q12, couples (F12).** One stream starts periods, by default the first entered (Tess). Days to next pay counts to it; every pay still counts in its account's walk.
- **Q4 (F4).** An item is "not seen yet" only after its landing day plus the account's posting window, one working day by default.
- The other answers (Q1, Q2, Q3, Q5 to Q11, Q13, Q15 to Q24) were already the readings used here. Older `alt` figures for readings that were decided against (Q2, Q3) are kept with a note.

## Open rule questions

The expected figures use the reading in rules 1 to 14. Where the rule could reasonably go the other way, the question is below; asks that depend on it name it in `rule_questions`, and where the other reading gives a different figure the ask has an `alt`.

- **Q1. Pay and a bill on the same day.** Does the walk count the pay before the bill (used), or the bill first? No expected figure in these files changes with it, but Ramil's 18 Dec pay and power bill share a day.
- **Q2. Walking past the next pay to reach a bill.** When a bill's next date is after the next pay (rent for someone paid every two weeks or weekly, a bill every three months), are all pays on the way counted (used), or only the next one? Changes Sam on 4 Dec (904.25 or 384.25) and 15 Jan (1,848.75 or 1,503.25), and Ramil on 21 Nov (800 or -400). Under the second reading a bill three months away makes safe to spend fall now.
- **Q3. A late pay.** Mako's side pay due 10 Feb has not landed by the 11th. Is it left out of safe to spend until it lands (used), or still counted as coming? 404,000 or 454,000.
- **Q4. When is an item "not seen yet"?** The day after its landing date (used), or after a grace of one or two working days for bank posting lag? On 11 Feb, a holiday, Mako's side pay is one day late but no working day has passed. Rina's items are weeks late, so they are late either way.
- **Q5. A card refund after the statement closed.** Does it go on the next statement (used), or lower the payment already due? Mako's card A on 18 Dec (45,000 or 41,000); Sam's card on 15 Jan (180.00 or 160.00).
- **Q6. Statement close on a weekend or holiday.** Never moves (used), or moves like a payment? Sam's card closes on 25 Dec, Mako's card B on Sun 31 Jan.
- **Q7. A payment whose statement has not closed yet.** Show the amount posted so far, marked open (used), show nothing until the close, or show an estimate? Also: should "due before next pay" include that open amount (used for Nell on 20 Dec: 1,035.50; without it 885.50)?
- **Q8. A pay that lands before its rule date.** Carlo's 30 Dec pay lands 23 Dec. It settles the 30 Dec item (used). Does the new period start on the 23rd, the day the money came, or on the 29th, the rule date? Days to next pay is the same either way; what Home calls the current period is not.
- **Q9. One figure or one per account.** Carlo's bank is fine but his e-wallet will be short for the pay-later part. Is safe to spend shown per account with a warning (used here, no headline given), as one sum across accounts, or as the pay account only? Same for Bea, Ramil (e-wallet and cash) and Jun and Tess.
- **Q10. Total and cards.** Total does not take off card debt (used, ledger design). Should Home also show a figure after the cards?
- **Q11. Other currencies.** Dollars sit beside the total, not added in (used). Should the app ever show a converted figure, and at what rate?
- **Q12. Couples.** All three of Jun and Tess's pays start a period (used), so "days to next pay" is the next of any. Each account's walk is bounded by the next pay into that account. Should a couple pick one pay that starts the household period instead? Whose pay does Home count to?
- **Q13. No fixed pay day.** Bea has no next pay. Used: days to next pay has no answer; the walk reaches each bill's next date with no money in. What should "due before the next pay" mean for her (left out here): the next 30 days, the next 14 days, or until the money runs out? This is the stage 2 "lasts about N weeks" view.
- **Q14. Setting aside the card when pays land before its payment day.** Everything owed is taken off now (used: Mako's pay and cards fall together). For Ramil, paid weekly, two pays land before his card payment, so this says his e-wallet is 700 short on 2 Dec when it is not. The other reading walks a closed statement on its payment day and takes off only new spending now: Ramil 1,300 instead of -700; Carlo on 16 Nov 16,000 instead of 13,000. Which should it be, or should it depend on whether a pay lands before the payment?
- **Q15. A check that disagrees.** The gap is shown as "not explained" and settles nothing (used). Should the app offer to record it as spending, and from which place?
- **Q16. A bill that lands at a different amount.** Mako's January power bill was 12,000, plan 10,000. It settles the item at the real amount; later months keep the plan amount (used). Should a real amount change the next estimate?
- **Q17. Bank-closed days that are not holidays.** Japan's banks close 31 Dec to 3 Jan. They count as non-working for the move rules (used), so Mako's 1 Jan gym lands Mon 4 Jan. Should they be in the country's holiday table or a separate bank table?
- **Q18. Buy date and posting date.** Statements go by posting date (used). Between the buy and the posting (Mako's 14 Dec buy, posted 16 Dec), does "card owed now" include it? No ask here lands between the two.
- **Q19. Pay-later plans.** The buy moves no money and each part is a bill from the e-wallet (used, ledger design). Should the parts still to come be shown as owed somewhere, and does a pay-later plan need its own account like a card?
- **Q20. A bill dated before setup that goes out after it.** Rule 2 says the opening covers it. If a debit dated before setup actually leaves after (a late debit), it would be counted nowhere. Should setup ask "has this gone out yet?" for items in the last few days?
- **Q21. Due before next pay, across accounts.** It lists items from every account (used: Carlo's pay-later part from his e-wallet, Jun and Tess's cash power bill). Or only the account the pay lands in?
- **Q22. Planned goal set-asides on the walk.** Only money already set aside is taken off; the 20,000 Mako plans to set aside each pay day is not walked (used). Should it be, when the walk crosses a pay day?
- **Q23. Items landing today.** At end of day, an item that lands today and has not been seen is "due" (in due before next pay), not "not seen yet" (used). Bank debits in some countries post late in the day or the next morning, so this is linked to Q4.
- **Q24. Bank today after a long gap.** Rina opens the app after three weeks. Bank today stays at the last figure with nothing assumed (used), shown with its age, and the late items are asked about. Should the app instead show a projected figure that assumes the late bills went out?

## Running the checker

```
node wip/team/foundation_review/scenarios/check_specs.js            # every file
node wip/team/foundation_review/scenarios/check_specs.js file.json  # one file
```

It checks the shape (accounts, schedules, events in date order, references, decimals for each currency) and that each `why` adds up and ends in the expected figure, including every `alt`. Labels in a `why` go in brackets; the checker ignores them. It does not run the app.
