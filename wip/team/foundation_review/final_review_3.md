(qc-foundation final review 3, coverage grid, 23 Nov 2026. Copied from the reviewer's reply.)

**FAIL**

Both reference suites still pass (431 of 431 asks, 272 of 272 cases). But 9 of the situations I wrote for cells nothing covered come out wrong. One group needs a change to saved ids and keys. The rest would be built into the engine wrong. All situations are in /tmp/foundation_final3/ (f1 to f9; run with `node <file>`).

## Coverage grid
Columns: C check day, O opening, W posting window, P period start, X other currency, D two devices, U undo/redo, E edited after settled, S imported/typed/self-logged, Z closed account.
Marks: c covered, - not applicable, u uncovered but sound by working, **X uncovered and wrong**.

| Row | C O W P X D U E S Z | Main covering asks/cases |
|---|---|---|
| open | c c c c c - u - c c | same_day_order, setup_mid_month, moved_records, account_closed |
| check | c c c **X** c u c u c c | avail_check, pending_hold, import_after_check |
| in / pay | c c c c c c **X** **X** c u | late_pay, nearest_settle, pay_other_currency, mg-54 |
| refund | c - c u u - - - c u | card_statements, line_on_card |
| spend | c c c c **X** c c c c u | import_rules, double-01..09, auto_removed |
| transfer | c u c - c u - - c c | import_two_sided, fees, freelancer |
| repay | c c c - c c - - c c | two_month_card, other_currency_card, acc-08 |
| borrow | c - u - - - - - c - | card_out, borrow_and_plans |
| convert | u - - - c - - - u - | freelancer |
| adjust | **X** - - - - - - - - - | none |
| hand / Wallet mode | **X** - - **X** - - - - - - | none |
| move between places | **X** c - c - c u - - c | mako_shape, goal_removed, mg-68 |
| filler | c - c **X** - - - - - - | (the parts split is never asked) |
| skip | c - - u - c c - c - | places_and_checked, auto_removed |
| set: settle | c c c c c c c u c c | mg-50/54/55, match-35 |
| periodStart | c - c **X** - **X** c - - - | pe-31..35 |
| period-end answer | c - - **X** - c c **X** c - | pe-36..47, to_place tp-05 |
| rm: / to place | c - - c - c c - - c | goal_removed, to_place |
| closing | c c - - - c - - - u | accounts, closing_write_off |
| income schedules, every rule | c c c c c c - c c c | the first eight files, yearly_and_places, pay_day_moves |
| bill / transfer / auto schedules | c c c c u c c c c **X** | fees, split_auto_est (X: paid by card) |
| budget lines | **X** c - **X** **X** c - u c u | line_on_card, opening_by_days, units |
| goals / places | c c - c u c c - - c | yearly_and_places, acc-12..14 |
| card | c c c c c c c c c c | card_statements, two_month_*, mako_close_not_sure |
| loan / pay-later | c c - - u c - - c c | interest, loans_and_carried, card_instalments |
| cash, e-wallet, wallet, investment, owedToYou | c c c - c - - - c c (X: wallet) | couple_cash, check_gain |

**Coverage numbers (my count, by hand):**
- 260 cells; 89 are not applicable, leaving 171 that apply.
- 129 are covered (75%).
- 42 were uncovered. I worked 24 of them by reasoning and they come out sound.
- 18 come out wrong, through the 9 situations below.

## FOUNDATIONAL (saved ids and keys)

**1. Periods are named by a day that can still move, and the saved ids and keys use that day.**
- **Who:** anyone whose pay is late, including a couple.
- **The moments:**
  - f1: pay due Thu 10 Dec is late. On Mon 14 the person starts the new period and answers the period end, saved as `pe:2026-12-13:free` (20,000 to the trip). On Tue 15 the pay arrives inside its posting window. `period_end_ref.js:27-33` now ends the old period on 14 Dec. The saved answer names 13 Dec, so the whole 20,000 is "to decide" again. Answered again, the trip gets it twice: the model counts the moves of every `pe:` record whatever period it was for (`lookahead_ref.js:754`).
  - f1b: the same thing happens when a ticked pay's date is corrected, or a nearer statement line moves the settle (Q6, S2), after the answer was given. The ref again says 20,000 is still to decide; right is 0.
  - f6: Jun starts the new period on Mon 14 (`ps:2026-12-14`). Tess's phone had not synced, so she starts it on Tue 15 (`ps:2026-12-15`). They sync. The period from 14 Dec ends after one day, so the period-end question runs and the budget lines and Free to spend are given twice.
  - `plan.budgets[].once` is keyed by "period start date", which is not known until the pay lands.
- **Why it is in the base:** these are saved ids and keys.
- **What the base needs:** name each period by the period-stream pay occurrence that ends it. That name is stable under H2.
  - `pe:pay@2026-12-10:free`
  - `ps:pay@2026-12-10`, with the chosen day as a field. Two phones then make one record, and the newer one wins.
  - `once: { 'pay@2027-01-10': amount }`
  - Add one rule: once a period's end is fixed (by a periodStart or by answers), the late pay settles its occurrence but starts no new period.
- **Cost:** about half a day now (ids, about 10 rules cases, a few asks). Later, a migration of every saved answer and override that has to guess which period each one meant.

## FOUNDATIONAL (the engine would be built wrong; no data change)

**2. The filler never counts as spending** (f8). This is the core loop for people who do not log spends.
- Free to spend is 60,000 and nothing was logged. On 19 Dec the check-in shows 50,000 gone. The headline stays 60,000; right is 10,000. Unsafe.
- `makeFiller` (`lookahead_ref.js:454`) splits the filler at a period start (A4), but `leftOf` (:814-833) never reads it.
- SCHEMA 6.2 gives a filler a `place` but names no default.
- Period-end leftovers would then move money that was really spent.

**3. Bills and self-logging spends paid by card are never in the walk** (f7). This covers phone bills and subscriptions on a card.
- The walk takes items only where `o.acct` is a bank (:899).
- Future occurrences are never added to a card statement.
- f7: lowest point and headline show 5,000; right is -3,000 and 0.

**4. An overspent budget line adds money back** (f4).
- `bal -= l.left` (:894) with a left below zero.
- f4: Food 10,000 over gives a lowest point of -60,000; right is -70,000.

**5. A spend on another-currency account counts against a home-currency line** (f3).
- `leftOf` (:821) never checks currency.
- A 2,000.00 peso GCash grocery spend takes 200,000 "yen" off Food. Together with finding 4, the bank's lowest point shows 560,000; right is 360,000.
- A 300.00 peso Free to spend spend gives a headline of 30,000; right is 60,000.

**6. periodStart is not in the model, although SCHEMA 12 puts safe to spend there** (f2).
- On the start day the headline is 27,000; right is 57,000.
- After the late pay it is 60,000; right is 57,000. The 3,000 spent on the 14th falls in neither period.

**7. Three record kinds in 6.2 have no rule anywhere** (f5).
- A move out of a place: the trip keeps 50,000 after 10,000 moved to the emergency fund; right is 40,000.
- `adjust` moves nothing: bank stays 300,000; right is 297,000.
- `hand` in Wallet mode moves nothing: bank stays 300,000; right is 280,000.
- Either give each a rule with asks, or take Wallet mode and `adjust` out of version one.

## S (decided, not coded): soundness check
- **S1 to S4, S6:** sound.
- **S5 double-counts unless one rule is added.** A fee as its own spend record contradicts 6.2 ("never written as a second record"). If the transfer's `a` still includes the fee, the sending account loses the fee twice (`delta` :382-383 plus the spend). Decide whether `a` excludes the fee, or the fee record moves only the place and not the account. Update the model's fee count (:828) to match.
- **S2 meets finding 1:** a moved settle must not leave period-end answers orphaned.

## WATCH
- **Closing the main bank (f9):** R4 moves card and place links, but not `home.mainBank`, the budget lines' `acct`, the Free to spend `acct`, or the period-pay flag. The headline is right only because the accounts net out, but there is a false 40,000 shortfall on the closed bank. The pay schedule then ends (P6), and the model keeps the ended schedule as the period stream (:367).
- **A transfer typed on two phones** is never offered as a possible double; the double rule covers spends only.
- **A two-currency transfer schedule:** the receiving side's walk adds the sending currency's minor units (:905). Stage 2.
- **Investment:** a market rise over 20% sets off `gain_to_ask`.
- **A goal's money moved to another account:** a false per-account warning appears, though the headline nets out.
- **A `plan.shares` change mid-period:** which period it applies to is not written down.
- **Events after a close:** a refund into a closed bank makes the model throw (:935). Accounts with history are never deleted, so this can happen.
- **SCHEMA 3:116 contradicts the model:** it says pre-opening spends count in "spent so far", but `lookahead_ref.js:821` leaves them out. The model is right; fix the text.
- **`told` is compared as text in the model** (:405). The engine must compare moments, for example for a couple split between Japan and the Philippines.

## Checked and sound
- A transfer where one side is before its account's opening (B7): bank 95,000, e-wallet 5,000.
- Every income rule kind, including a rule change from a date.
- Card statements, two-month cards, close day "not sure", and interest.
- Loans and pay-later plans.
- Matching, merge, built ids and to-place money.
- Closing a non-main account.
- Late pay with no periodStart.
- Skip of a bill or a self-logged spend.
- Three weeks away, the opening split, and the moved 38.31 records.

Files are in /tmp/foundation_final3/:
- base.js
- f1_period_end_moves.js
- f2_model_period_start.js
- f3_line_other_currency.js
- f4_overspent_line.js
- f5_kinds_not_read.js
- f6_two_phones_period_start.js
- f7_bill_on_card.js
- f8_filler_free.js
- f9_close_main_bank.js
