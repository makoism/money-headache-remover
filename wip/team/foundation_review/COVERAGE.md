# Coverage of the foundation (after decisions T, U and V, 23 Nov 2026)

The coverage grid of final_review_3.md, updated (LESSONS lesson 3: count coverage, do not sample). Rows are kinds of record and the shapes they live in; columns are the situations that change a record's effect. Every applicable cell names the asks (scenarios/*.json, run by `node foundation_review/ref/run_scenarios.js`) or cases (rules/*.json, run by `node foundation_review/rules/run_rules.js`) that cover it. All of them pass: 571 of 571 asks, 309 of 309 cases (after V: 22 asks and 1 case added, 1 case corrected; see "Decision V" at the end).

Columns: C check day, O opening, W posting window, P period start, X other currency, D two devices, U undo/redo, E edited after settled, S imported/typed/self-logged, Z closed account.

Marks: **c** covered before this round; **n** newly covered this round (it was "u", uncovered and sound by working, or "X", uncovered and wrong; the cell says which); **-** not applicable; **s2** stage 2 (decision T7 took Wallet mode and `hand` out of version one).

## Counts

| | Cells |
|---|---|
| All cells (26 rows x 10 columns) | 260 |
| Not applicable | 93 |
| Stage 2 (hand and Wallet mode, T7) | 2 |
| **Applicable** | **165** |
| Covered before this round (c) | 128 |
| Uncovered and sound by working, now covered (u to n) | 22 |
| Uncovered and wrong, now fixed and covered (X to n) | 15 |
| **Applicable and covered, all passing** | **165** (165 of 165) |
| Applicable and uncovered | 0 |

**A note on the review's numbers.** final_review_3.md says 260 cells, 171 applicable, 129 covered, 24 uncovered and sound, 18 wrong. Its own table, counted cell by cell, holds 128 c, 22 u, 17 X and 93 -, so 167 applicable; the "(X: wallet)" note on the last row is the eighteenth wrong item but not a cell of its own. This file counts the table. Wallet mode is stage 2 now (T7), so the note and the two `hand` cells are out of version one: 165 applicable cells.

## The grid

| Row | C | O | W | P | X | D | U | E | S | Z |
|---|---|---|---|---|---|---|---|---|---|---|
| open | c | c | c | c | c | - | n (u) | - | c | c |
| check | c | c | c | n (X) | c | n (u) | c | n (u) | c | c |
| in / pay | c | c | c | c | c | c | n (X) | n (X) | c | n (u) |
| refund | c | - | c | n (u) | n (u) | - | - | - | c | n (u) |
| spend | c | c | c | c | n (X) | c | c | c | c | n (u) |
| transfer | c | n (u) | c | - | c | n (u) | - | - | c | c |
| repay | c | c | c | - | c | c | - | - | c | c |
| borrow | c | - | n (u) | - | - | - | - | - | c | - |
| convert | n (u) | - | - | - | c | - | - | - | n (u) | - |
| adjust | n (X) | - | - | - | - | - | - | - | - | - |
| hand / Wallet mode | s2 | - | - | s2 | - | - | - | - | - | - |
| move between places | n (X) | c | - | c | - | c | n (u) | - | - | c |
| filler | c | - | c | n (X) | - | - | - | - | - | - |
| skip | c | - | - | n (u) | - | c | c | - | c | - |
| set: settle | c | c | c | c | c | c | c | n (u) | c | c |
| periodStart | c | - | c | n (X) | - | n (X) | c | - | - | - |
| period-end answer | c | - | - | n (X) | - | c | c | n (X) | c | - |
| rm: / to place | c | - | - | c | - | c | c | - | - | c |
| closing | c | c | - | - | - | c | - | - | - | n (u) |
| income schedules, every rule | c | c | c | c | c | c | - | c | c | c |
| bill / transfer / auto schedules | c | c | c | c | n (u) | c | c | c | c | n (X) |
| budget lines | n (X) | c | - | n (X) | n (X) | c | - | n (u) | c | n (u) |
| goals / places | c | c | - | c | n (u) | c | c | - | - | c |
| card | c | c | c | c | c | c | c | c | c | c |
| loan / pay-later | c | c | - | - | n (u) | c | - | - | c | c |
| cash, e-wallet, wallet, investment, owedToYou | c | c | c | - | c | - | - | - | c | c |

## Every applicable cell and what covers it

### open
- C check day (c): same_day_order order-01
- O opening (c): setup_mid_month midmonth-01; opening_by_days days-01 to days-06
- W posting window (c): import_after_check iac-06
- P period start (c): opening_by_days days-02, days-03
- X other currency (c): home_currency_dated cur-01, cur-02; freelancer freelance-04
- U undo/redo (n, was u): rules mg-75
- S imported/typed/self-logged (c): moved_records moved-01; moved_figure_no_time mfig-01; moved_bank_now bnow-01
- Z closed account (c): account_closed close-03

### check
- C check day (c): same_day_order order-02 to order-04
- O opening (c): same_day_order order-01
- W posting window (c): avail_check avail-01 to avail-09; same_day_order order-05 to order-07
- P period start (n, was X): period_start_model psm-06, psm-07; filler_spending fs-05, fs-06
- X other currency (c): grid_other_currency goc-02, goc-03
- D two devices (n, was u): grid_two_phones_check g2p-01, g2p-02, g2p-03
- U undo/redo (c): rules mg-09 to mg-11
- E edited after settled (n, was u): grid_two_phones_check g2p-04, g2p-05
- S imported/typed/self-logged (c): import_after_check iac-01 to iac-10
- Z closed account (c): account_closed close-03; closing_write_off woff-02

### in / pay
- C check day (c): late_pay late-08; settle_ticked tick-03
- O opening (c): setup_mid_month midmonth-03
- W posting window (c): late_pay late-01 to late-05; nearest_settle near-01 to near-04
- P period start (c): nearest_settle near-02, near-03; settle_later_stretch later-01, later-02
- X other currency (c): pay_other_currency cur-01 to cur-06; other_currency_lists ocl-01, ocl-02
- D two devices (c): rules mg-54, mg-55
- U undo/redo (n, was X): rules pe-54
- E edited after settled (n, was X): period_end_fixed pef-01; rules pe-50, pe-51
- S imported/typed/self-logged (c): import_rules imp-02, imp-04, imp-09
- Z closed account (n, was u): closed_reopened cr-04

### refund
- C check day (c): card_statements stmt-02, stmt-03; line_on_card line-04, line-05
- W posting window (c): line_on_card line-06
- P period start (n, was u): grid_period_cells gpc-03
- X other currency (n, was u): grid_other_currency goc-02, goc-04
- S imported/typed/self-logged (c): mako_shape mako-27; card_out out-07
- Z closed account (n, was u): closed_reopened cr-02, cr-03

### spend
- C check day (c): same_day_order order-02; avail_same_day avsd-01 to avsd-03
- O opening (c): same_day_order order-01; place_moves_adjust pma-03
- W posting window (c): same_day_order order-05 to order-07; paid_by_someone_else paid-01 to paid-05
- P period start (c): split_auto_est split-04, split-06; opening_by_days days-04
- X other currency (n, was X): line_other_currency loc-01 to loc-04
- D two devices (c): rules double-01 to double-09, mg-14
- U undo/redo (c): auto_removed auto-01 to auto-03; rules mg-09 to mg-11
- E edited after settled (c): rules mg-07, mg-12
- S imported/typed/self-logged (c): import_rules imp-01, imp-02; split_auto_est split-01; import_after_check iac-01
- Z closed account (n, was u): closed_reopened cr-05

### transfer
- C check day (c): import_two_sided two-04, two-05
- O opening (n, was u): grid_period_cells gpc-01, gpc-02; places_and_checked place-01
- W posting window (c): import_two_sided two-01 to two-05
- X other currency (c): freelancer freelance-10, freelance-19
- D two devices (n, was u): rules double-10 to double-12
- S imported/typed/self-logged (c): import_two_sided two-01 to two-06; rough_transfer rough-01 to rough-06; rough_more_arrived rma-01 to rma-06; rules match-49 to match-51, match-67 to match-69
- Z closed account (c): account_closed close-03, close-04

### repay
- C check day (c): import_two_sided two-03; mako_shape mako-29
- O opening (c): two_month_opening tmo-01 to tmo-07
- W posting window (c): import_two_sided two-03; rules match-52
- X other currency (c): other_currency_card fx-03, fx-04
- D two devices (c): rules mg-50, mg-54
- S imported/typed/self-logged (c): import_read_as_repay rrep-01, rrep-02; paid_by_someone_else paid-01
- Z closed account (c): rules acc-08, acc-11

### borrow
- C check day (c): card_out out-01
- W posting window (n, was u): grid_borrow_window gbw-01 to gbw-03
- S imported/typed/self-logged (c): card_out out-01 to out-05; borrow_and_plans plan-03, plan-04

### convert
- C check day (n, was u): grid_other_currency goc-02, goc-03
- X other currency (c): freelancer freelance-10, freelance-19
- S imported/typed/self-logged (n, was u): grid_other_currency goc-01

### adjust
- C check day (n, was X): place_moves_adjust pma-04 to pma-07

### hand / Wallet mode
- C check day (s2): stage 2 (T7): no screens in version one; Mako uses Track
- P period start (s2): stage 2 (T7)

### move between places
- C check day (n, was X): place_moves_adjust pma-01, pma-02, pma-08 to pma-10
- O opening (c): mako_shape mako-02; goal_removed gone-01
- P period start (c): to_place tp-05; period_end_fixed pef-02
- D two devices (c): rules mg-68
- U undo/redo (n, was u): place_moves_adjust pma-01 (the move back undone)
- Z closed account (c): rules acc-12, acc-13

### filler
- C check day (c): same_day_order order-04; avail_check avail-02; filler_spending fs-01, fs-02
- W posting window (c): avail_check avail-07; pending_hold hold-02, hold-03, hold-05, hold-07
- P period start (n, was X): filler_spending fs-03 to fs-06; period_start_model psm-07

### skip
- C check day (c): auto_removed auto-01, auto-02
- P period start (n, was u): grid_period_cells gpc-04, gpc-05
- D two devices (c): auto_removed auto-03; rules mg-69
- U undo/redo (c): rules mg-64, mg-69
- S imported/typed/self-logged (c): auto_removed auto-03, auto-05

### set: settle
- C check day (c): settle_ticked tick-01 to tick-03
- O opening (c): setup_mid_month midmonth-03
- W posting window (c): late_pay late-08; import_rules imp-04
- P period start (c): nearest_settle near-02, near-03; settle_later_stretch later-01, later-02
- X other currency (c): pay_other_currency cur-05
- D two devices (c): rules mg-50, mg-54, mg-55
- U undo/redo (c): rules mg-09 to mg-11; check_in_matched cim-01 (unticked)
- E edited after settled (n, was u): grid_two_phones_check g2p-04; period_end_fixed pef-01
- S imported/typed/self-logged (c): rules match-35, match-36, match-64 to match-66; check_in_matched cim-01
- Z closed account (c): account_closed close-01, close-05

### periodStart
- C check day (c): rules pe-31
- W posting window (c): rules pe-32, pe-33
- P period start (n, was X): period_start_model psm-01, psm-02, psm-04; rules pe-48
- D two devices (n, was X): rules pe-52, pe-53, mg-74
- U undo/redo (c): rules pe-34

### period-end answer
- C check day (c): rules pe-01 to pe-04, pe-14
- P period start (n, was X): rules pe-48, pe-49
- D two devices (c): rules pe-36, pe-37, pe-40 to pe-43
- U undo/redo (c): rules pe-37, pe-43
- E edited after settled (n, was X): period_end_fixed pef-01 to pef-03; rules pe-50, pe-51
- S imported/typed/self-logged (c): rules pe-38, pe-39, pe-44 to pe-47

### rm: / to place
- C check day (c): goal_removed gone-02
- P period start (c): to_place tp-02, tp-04
- D two devices (c): rules mg-62, mg-68
- U undo/redo (c): rules mg-13, mg-68
- Z closed account (c): rules acc-12, acc-13

### closing
- C check day (c): account_closed close-03, close-04
- O opening (c): closing_write_off woff-01, woff-02
- D two devices (c): rules mg-70, mg-73
- Z closed account (n, was u): closed_reopened cr-01, cr-02

### income schedules, every rule
- C check day (c): mako_shape mako-21, mako-29
- O opening (c): setup_mid_month midmonth-02
- W posting window (c): late_pay late-01 to late-06
- P period start (c): every_two_weeks biweekly-01 to biweekly-21; halves_paylater halves-01 to halves-32; weekly weekly-01 to weekly-18
- X other currency (c): pay_other_currency cur-01 to cur-04
- D two devices (c): rules mg-15, mg-28
- E edited after settled (c): pay_day_moves move-01 to move-04
- S imported/typed/self-logged (c): import_rules imp-08, imp-09
- Z closed account (c): close_main_bank cmb-05; rules acc-18, acc-19

### bill / transfer / auto schedules
- C check day (c): mako_shape mako-12
- O opening (c): setup_mid_month midmonth-04
- W posting window (c): import_rules imp-03, imp-05
- P period start (c): mako_shape mako-04, mako-24
- X other currency (n, was u): grid_other_currency goc-06
- D two devices (c): rules mg-56
- U undo/redo (c): auto_removed auto-01 to auto-03
- E edited after settled (c): rules mg-15, mg-36
- S imported/typed/self-logged (c): split_auto_est split-02; fees fee-03
- Z closed account (n, was X): account_closed close-01, close-05; bill_on_card boc-01 to boc-05 (paid by card, the X); closing the main bank moves its bills (V): close_main_bank_bills cmbb-01 to cmbb-05; rules acc-18, acc-19

### budget lines
- C check day (n, was X): overspent_line ol-01 to ol-03
- O opening (c): opening_by_days days-03; opening_free_typed ftyp-01 to ftyp-03
- P period start (n, was X): period_start_model psm-02; rules units-75 to units-77
- X other currency (n, was X): line_other_currency loc-01, loc-02; grid_other_currency goc-04
- D two devices (c): rules mg-18
- E edited after settled (n, was u): plan_change pc-01 to pc-03; a change made on a period's first day (V): plan_change_first_day pcf-01 to pcf-03
- S imported/typed/self-logged (c): line_on_card line-01 to line-05
- Z closed account (n, was u): close_main_bank cmb-02, cmb-03; rules acc-18

### goals / places
- C check day (c): mako_shape mako-02
- O opening (c): split_auto_est split-03
- P period start (c): yearly_and_places year-04; to_place tp-05
- X other currency (n, was u): grid_other_currency goc-05, goc-06
- D two devices (c): rules mg-68
- (V1, no column of its own) a goal's money moved to its own account: goal_own_account goa-01 to goa-07
- U undo/redo (c): goal_removed gone-02 to gone-05
- Z closed account (c): rules acc-12, acc-13

### card
- C check day (c): mako_shape mako-15
- O opening (c): two_month_opening tmo-01 to tmo-07
- W posting window (c): import_rules imp-10, imp-11
- P period start (c): card_statements stmt-04; mako_shape mako-24
- X other currency (c): other_currency_card fx-01 to fx-04
- D two devices (c): rules mg-50, mg-54
- U undo/redo (c): rules mg-09 to mg-11
- E edited after settled (c): rules mg-07
- S imported/typed/self-logged (c): import_rules imp-06, imp-10; bill_on_card boc-03
- Z closed account (c): rules acc-08, acc-11; card_out out-06, out-07

### loan / pay-later
- C check day (c): borrow_and_plans plan-03
- O opening (c): loans_and_carried loan-01
- X other currency (n, was u): grid_other_currency goc-06; paid from an account in another currency (V2): loan_other_currency lfx-01 to lfx-07
- D two devices (c): rules mg-06
- S imported/typed/self-logged (c): borrow_and_plans plan-01, plan-04
- Z closed account (c): rules acc-09

### cash, e-wallet, wallet, investment, owedToYou
- C check day (c): couple_cash couple-11; investment_gain inv-01, inv-02
- O opening (c): weekly weekly-01; freelancer freelance-02
- W posting window (c): import_two_sided two-04, two-05
- X other currency (c): freelancer freelance-04, freelance-19
- S imported/typed/self-logged (c): weekly weekly-08
- Z closed account (c): closing_write_off woff-02, woff-04

## What was wrong (the X cells) and the decision that fixed it

| Cell | Situation | Decision | Now |
|---|---|---|---|
| check, P | f8, f2: a check-in stretch crossing a period start | T2, T6 | psm-07, fs-06 |
| in / pay, U | a ticked pay undone after the period was answered | T1 (reading: answers fix the end) | pe-54 |
| in / pay, E | f1b: a ticked pay's date corrected after the answer | T1 | pef-01, pe-50, pe-51 |
| spend, X | f3: a peso spend on a yen line | T5 | loc-01 to loc-04 |
| adjust, C | f5: an accepted difference moved nothing | T7 | pma-04 to pma-07 |
| hand, C and P | f5: Wallet mode moved nothing | T7: stage 2 | out of version one |
| move between places, C | f5: a move out of a place lowered nothing | T7 | pma-01, pma-08 |
| filler, P | f8: the filler never counted as spending | T2 | fs-01 to fs-07 |
| periodStart, P | f2: the model knew no period start | T6, T1 | psm-01 to psm-07, pe-48 |
| periodStart, D | f6: two phones, two period starts | T1 | pe-52, pe-53, mg-74 |
| period-end answer, P | f1: the late pay moved the end and orphaned the answer | T1 | pe-48, pe-49 |
| period-end answer, E | f1b: a moved settle orphaned the answer | T1 | pe-50, pe-51, pef-01 to pef-03 |
| bill schedules, Z (paid by card) | f7: bills on a card never in the walk | T3 | boc-01 to boc-05 |
| budget lines, C | f4: an overspent line added money back | T4 | ol-01 to ol-03 |
| budget lines, P | `once` keyed by a start day not known until the pay lands | T1 | units-75 to units-77, psm-02 |
| budget lines, X | f3: a peso spend on a yen line | T5 | loc-01, loc-02, goc-04 |

## Watch items final_review_3 raised, decided in T, and where each is tested

| Watch item | Asks or cases |
|---|---|
| Closing the main bank (f9): every link moves to the new main bank, its bills too (V) | close_main_bank cmb-01 to cmb-05; close_main_bank_bills cmbb-01 to cmbb-05; rules acc-17 to acc-19 |
| A transfer typed on two phones offered as a possible double | rules double-10 to double-12 |
| An investment never raises the gain question | investment_gain inv-01 to inv-03 |
| A `plan.shares` change applies from the next period start; made on a period's first day, to that period (V) | plan_change pc-01 to pc-03; plan_change_first_day pcf-01 to pcf-03 |
| An event into a closed account reopens it with a notice | closed_reopened cr-01 to cr-05 |
| SCHEMA 3: pre-opening spends are not in spent so far | place_moves_adjust pma-03 |
| `told` and `at` compared as moments | told_moments tm-01 to tm-03; rules mg-04, mg-05, mg-19 |
| A goal's money moved to another account: a false per-account warning | V1: goal_own_account goa-01 to goa-07 |
| A two-currency transfer schedule (stage 2) | stage 2 |

## Decision V, and where each part is tested

Run first, before the references changed: 564 of 571 asks passed and 307 of 309 cases (the 7 asks and 2 cases marked "failed first" below). After the changes to `ref/lookahead_ref.js` and `rules/accounts_ref.js`: 571 of 571 asks, 309 of 309 cases.

| Part of V | Asks or cases | Failed first |
|---|---|---|
| V1: a goal's money moved to its own account is counted there; no warning on the account it left | goal_own_account goa-01 to goa-07 | goa-03 (kept 0), goa-04 (50,000), goa-07 (60,000) |
| V2: a loan or pay-later account paid from another currency, like a card (H5) | loan_other_currency lfx-01 to lfx-07 | lfx-01 (100,000), lfx-02 (no warning) |
| V3: two answers of one period are one record; the earliest last day stands | no case of its own: a confirmation; `rules/period_end_ref.js` already takes the earliest last day the answers give | not run (nothing changed) |
| Corrected: closing the main bank moves the bills paid from it too; the person can end any of them | close_main_bank_bills cmbb-01 to cmbb-05; rules acc-18 (corrected), acc-19 | acc-18, acc-19 (the bills ended). cmbb-01 to cmbb-05 passed first: the scenario file is the copy after the closing, so the model reads the moved link |
| Corrected: a plan change dated on a period's first day applies to that period | plan_change_first_day pcf-01 to pcf-03 | pcf-02 (58,000), pcf-03 (658,000) |
