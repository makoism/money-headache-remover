# Coverage of the foundation (after decisions T to AD, 23 Nov 2026)

The coverage grid of final_review_3.md, updated (LESSONS lesson 3: count coverage, do not sample). Rows are kinds of record and the shapes they live in; columns are the situations that change a record's effect. Every applicable cell names the asks (scenarios/*.json, run by `node foundation_review/ref/run_scenarios.js`) or cases (rules/*.json, run by `node foundation_review/rules/run_rules.js`) that cover it. All of them pass: 687 of 687 asks, 467 of 467 cases (after AB and AC: 20 asks in 4 new scenario files, 34 cases added and 15 re-worked, the columns L and B and the rows `pendingMove` and `frozen`; see "Decisions AB and AC" at the end; after AA: 3 asks in a new scenario file and 12 move cases; after W and X: 78 asks and 32 cases added, in 19 new scenario files, one ask in fee_place and a new rules file `rules/edits.json`; after Y and Z: 15 asks in 4 new scenario files, 11 rules cases and 24 move cases, and the move row; see "Decisions W and X" and "Decisions Y and Z" at the end). The move cases (`rules/move.json`) are counted in the 467.

Columns: C check day, O opening, W posting window, P period start, X other currency, D two devices, U undo/redo, E edited after settled, S imported/typed/self-logged, Z closed account, and, added after confirm_review_1 (decision X): M the move run on two devices (the phone and the desktop each move the same 38.31 copy), Y years after setup (an ask ten years out, X7), T a time with an offset (the start and end of a day in the device's offset, X9); and, added after confirm_review_2 (decisions AB and AC): L a second device moving days later, after real use on the first (AB1), and B setup between a statement's close and its payment day, for cards, pay-later and loans (AB3).

Rows added after Y and Z: **move**, the move of a saved copy from 38.31, 38.28 or the 25.0 to 38.26 builds (`rules/move.json`), as a record kind of its own: what it writes in each situation. Rows added after AB: **`pendingMove`** (what waits on a moved copy, records `mv:pend:<field path>`) and **`frozen`** (each device's raw 38.31 text, `mv:frozen:<by>`, formerly the shared `frozen3831`).

Marks: **c** covered before this round; **n** newly covered (in the first ten columns, by T to V: it was "u", uncovered and sound by working, or "X", uncovered and wrong, and the cell says which; in the columns M, Y, T and the two new rows, by W and X); **f (X..)** a false cover confirm_review_1 found, now really covered by the decision named (**f (AB..)** one confirm_review_2 found); **-** not applicable; **s2** stage 2 (decision T7 took Wallet mode and `hand` out of version one).

## Counts

| | Cells |
|---|---|
| All cells (31 rows x 15 columns) | 465 |
| Not applicable | 212 |
| Stage 2 (hand and Wallet mode, T7) | 2 |
| **Applicable** | **251** |
| New after confirm_review_2: the columns L and B (58 cells, 18 applicable) and the rows `pendingMove` and `frozen` (30 cells, 7 applicable) | 25 |
| of which covered by new cases and asks (n) | 25 |
| False covers confirm_review_2 found, now really covered (move M and D, AB1; card O, AB3; not yet S, AB4) | 4 |
| Near misses confirm_review_2 found, now really covered (in / pay T by ny-04; move U by mv-97; period-end M and budget lines M by the AB2 cases) | 4 |
| Applicable after AA (29 rows x 13 columns) | 226 |
| New after Y and Z: the move row (10 applicable, 3 not applicable) | 10 |
| of which covered by cases written for Y and Z | 8 |
| of which uncovered until this round, now covered by new cases (Y ten years out, T a device west of UTC) | 2 |
| Applicable after X (28 rows x 13 columns) | 216 |
| Applicable after V (26 rows x 10 columns) | 165 |
| New after confirm_review_1: the columns M, Y, T (39) and the rows fee record and not yet at setup (12) | 51 |
| of which covered by asks that already existed (c) | 4 |
| of which covered by new asks and cases (n) | 47 |
| False covers confirm_review_1 found, now really covered (check C, card O, in / pay E, income E, rm: D) | 5 |
| Changed by AA (no new row or column; cells of the move row and the not-yet row covered again by AA's cases and asks) | 0 |
| Changed by AD (no new row or column; cells of the move, `pendingMove`, card, loan and period-end rows covered again by AD's cases and asks) | 0 |
| **Applicable and covered, all passing** | **251** (251 of 251) |
| Applicable and uncovered | 0 |

**Counts after V** (kept for the record): 260 cells, 93 not applicable, 2 stage 2, 165 applicable, all covered. **A note on final_review_3's numbers.** final_review_3.md says 260 cells, 171 applicable, 129 covered, 24 uncovered and sound, 18 wrong. Its own table, counted cell by cell, holds 128 c, 22 u, 17 X and 93 -, so 167 applicable; the "(X: wallet)" note on the last row is the eighteenth wrong item but not a cell of its own. This file counts the table. Wallet mode is stage 2 now (T7), so the note and the two `hand` cells are out of version one: 165 applicable cells.

## The grid

| Row | C | O | W | P | X | D | U | E | S | Z | M | Y | T | L | B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| open | c | c | c | c | c | - | n (u) | - | c | c | n | - | n | n | n |
| check | c, f (X4) | c | c | n (X) | c | n (u) | c | n (u) | c | c | n | n | n | n | n |
| in / pay | c | c | c | c | c | c | n (X) | c, f (X8) | c | n (u) | - | n | n | - | - |
| refund | c | - | c | n (u) | n (u) | - | - | - | c | n (u) | - | n | n | - | - |
| spend | c | c | c | c | n (X) | c | c | c | c | n (u) | n | n | n | n | - |
| transfer | c | n (u) | c | - | c | n (u) | - | - | c | c | - | - | n | - | - |
| repay | c | c | c | - | c | c | - | - | c | c | - | n | n | n | - |
| borrow | c | - | n (u) | - | - | - | - | - | c | - | - | n | n | - | - |
| convert | n (u) | - | - | - | c | - | - | - | n (u) | - | - | - | n | - | - |
| adjust | n (X) | - | - | - | - | - | - | - | - | - | - | - | n | - | - |
| hand / Wallet mode | s2 | - | - | s2 | - | - | - | - | - | - | - | - | - | - | - |
| move between places | n (X) | c | - | c | - | c | n (u) | - | - | c | - | - | - | n | - |
| filler | c | - | c | n (X) | - | - | - | - | - | - | - | - | - | - | - |
| skip | c | - | - | n (u) | - | c | c | - | c | - | - | n | - | - | - |
| set: settle | c | c | c | c | c | c | c | n (u) | c | c | - | n | n | - | - |
| periodStart | c | - | c | n (X) | - | n (X) | c | - | - | - | - | - | - | - | - |
| period-end answer | c | - | - | n (X) | - | c | c | n (X) | c | - | n | - | - | n | - |
| rm: / to place | c | - | - | c | - | c, f (X5) | c | - | - | c | - | - | - | - | - |
| closing | c | c | - | - | - | c | - | - | - | n (u) | - | - | - | - | - |
| income schedules, every rule | c | c | c | c | c | c | - | c, f (X8) | c | c | n | n | - | n | - |
| bill / transfer / auto schedules | c | c | c | c | n (u) | c | c | c | c | n (X) | n | n | - | n | - |
| budget lines | n (X) | c | - | n (X) | n (X) | c | - | n (u) | c | n (u) | n | n | - | n | - |
| goals / places | c | c | - | c | n (u) | c | c | - | - | c | n | n | - | n | - |
| card | c | c, f (X6), f (AB3) | c | c | c | c | c | c | c | c | n | n | n | n | n |
| loan / pay-later | c | c | - | - | n (u) | c | - | - | c | c | n | n | n | n | n |
| cash, e-wallet, wallet, investment, owedToYou | c | c | c | - | c | - | - | - | c | c | n | - | n | n | - |
| fee record (`fee:<transfer id>`) | - | - | c | n | c | n | c | - | c | - | - | - | - | - | - |
| not yet at setup (`notYet`) | n | n | n | n | n | - | - | - | n, f (AB4) | - | - | - | - | - | - |
| move (an old copy moved) | n | n | - | n | n | n, f (AB1) | n | - | n | - | n, f (AB1) | n | n | n | - |
| pending move (`pendingMove`) | - | - | - | n | - | n | - | - | - | - | n | - | - | n | - |
| frozen text (`mv:frozen:<by>`) | - | - | - | - | - | n | - | - | - | - | n | - | - | n | - |

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
- M the move run on two devices (n): rules mg-85 (`mv:open:cfg`)
- T a time with an offset (n): day_offset_west west-01 (the opening day's end at -05:00); day_offset_kinds kinds-01 to kinds-05
- L a second move days later (n): rules mv-82, mv-83 (the moved opening carries its copy's last save as `at`, Mon 23 Nov 20:00, on both devices, AB1), mv-85 (the copy saved later wins an opening nobody edited)
- B set up between close and payment day (n): card_between_close_pay cbp-04 (the card opens with the unpaid October statement and November so far, AB3); loan_between_stmt_pay lbs-03

### check
- C check day (c, a false cover fixed by X4): same_day_order order-02 to order-04; a large gain held until answered: gain_held gh-01 to gh-04, gain_answered ga-01, ga-02, gain_pay_day gpd-01 to gpd-03
- O opening (c): same_day_order order-01
- W posting window (c): avail_check avail-01 to avail-09; same_day_order order-05 to order-07
- P period start (n, was X): period_start_model psm-06, psm-07; filler_spending fs-05, fs-06
- X other currency (c): grid_other_currency goc-02, goc-03
- D two devices (n, was u): grid_two_phones_check g2p-01, g2p-02, g2p-03
- U undo/redo (c): rules mg-09 to mg-11
- E edited after settled (n, was u): grid_two_phones_check g2p-04, g2p-05
- S imported/typed/self-logged (c): import_after_check iac-01 to iac-10
- Z closed account (c): account_closed close-03; closing_write_off woff-02
- M the move run on two devices (n): rules mg-85 (`mv:check:cfg.bankStart`)
- Y years after setup (n): far_years fy-03 (a check in 2036)
- T a time with an offset (n): day_offsets off-01; day_offset_kinds kinds-01
- L a second move days later (n): rules mv-98, mv-99 (the 23 Nov bank figure corrected on the phone stays 185,000 when the desktop moves on 1 Dec, AB1)
- B set up between close and payment day (n): rules ed-13 to ed-16 (the statement check setup saves: yes, no with its amount, don't know holding everything owed; not asked after the payment day, AB3; "no" with everything owed filled in, ed-19, AD6; "don't know" on a loan or pay-later is that month's usual payment, ed-20, ed-21, AD7); card_between_close_pay cbp-03, cbp-06

### in / pay
- C check day (c): late_pay late-08; settle_ticked tick-03
- O opening (c): setup_mid_month midmonth-03
- W posting window (c): late_pay late-01 to late-05; nearest_settle near-01 to near-04
- P period start (c): nearest_settle near-02, near-03; settle_later_stretch later-01, later-02
- X other currency (c): pay_other_currency cur-01 to cur-06; other_currency_lists ocl-01, ocl-02
- D two devices (c): rules mg-54, mg-55
- U undo/redo (n, was X): rules pe-54
- E edited after settled (n, was X; a false cover fixed by X8): period_end_fixed pef-01; rules pe-50, pe-51; a pay day change never before a settled or named pay: rules ed-01 to ed-07, pay_day_offer offer-01 to offer-03
- S imported/typed/self-logged (c): import_rules imp-02, imp-04, imp-09
- Z closed account (n, was u): closed_reopened cr-04
- Y years after setup (n): far_years fy-03, fy-10 (a pay ticked in 2036 starts the period)
- T a time with an offset (n): notyet_opening ny-04 (`set:pay@2027-06-25` ticked at a check-in, told with a time and no offset, read in the device's offset; confirm_review_2 found that kinds-01's date-only `told` on a `set:` record is one the engine never writes)

### refund
- C check day (c): card_statements stmt-02, stmt-03; line_on_card line-04, line-05
- W posting window (c): line_on_card line-06
- P period start (n, was u): grid_period_cells gpc-03
- X other currency (n, was u): grid_other_currency goc-02, goc-04
- S imported/typed/self-logged (c): mako_shape mako-27; card_out out-07
- Z closed account (n, was u): closed_reopened cr-02, cr-03
- Y years after setup (n): far_years fy-04 (a card refund in 2036)
- T a time with an offset (n): day_offset_kinds kinds-01

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
- M the move run on two devices (n): rules mg-85 (`mv:rc:<receipt id>`)
- Y years after setup (n): far_years fy-04, fy-09 (food on the card in 2036)
- T a time with an offset (n): day_offsets off-01 (a moved receipt and a typed spend with a date only, a time with no offset); day_offset_west west-01
- L a second move days later (n): rules mv-82, mv-83 (a receipt removed on the phone stays removed), mv-84, mv-85 (a receipt only the desktop's later copy held is added), mv-97 (removed, then put back with an Undo, AB1, H6)

### transfer
- C check day (c): import_two_sided two-04, two-05
- O opening (n, was u): grid_period_cells gpc-01, gpc-02; places_and_checked place-01
- W posting window (c): import_two_sided two-01 to two-05
- X other currency (c): freelancer freelance-10, freelance-19
- D two devices (n, was u): rules double-10 to double-12
- S imported/typed/self-logged (c): import_two_sided two-01 to two-06; rough_transfer rough-01 to rough-06; rough_more_arrived rma-01 to rma-06; rules match-49 to match-51, match-67 to match-69
- Z closed account (c): account_closed close-03, close-04
- T a time with an offset (n): day_offset_kinds kinds-01, kinds-02

### repay
- C check day (c): import_two_sided two-03; mako_shape mako-29
- O opening (c): two_month_opening tmo-01 to tmo-07
- W posting window (c): import_two_sided two-03; rules match-52
- X other currency (c): other_currency_card fx-03, fx-04
- D two devices (c): rules mg-50, mg-54
- S imported/typed/self-logged (c): import_read_as_repay rrep-01, rrep-02; paid_by_someone_else paid-01
- Z closed account (c): rules acc-08, acc-11
- Y years after setup (n): far_years fy-01, fy-04 (paid in 2029, nothing carried to 2036)
- T a time with an offset (n): day_offset_kinds kinds-04
- L a second move days later (n): rules mv-98, mv-99 (the moved loan receipt, a repay on the car loan, keeps the note typed on the phone, AB1)
- (AC2, AC6, no column of its own) a loan receipt waiting for "which loan is this": rules mv-91 to mv-93

### borrow
- C check day (c): card_out out-01
- W posting window (n, was u): grid_borrow_window gbw-01 to gbw-03
- S imported/typed/self-logged (c): card_out out-01 to out-05; borrow_and_plans plan-03, plan-04
- Y years after setup (n): far_years fy-06, fy-08 (a credit line drawn in 2036)
- T a time with an offset (n): day_offset_kinds kinds-05

### convert
- C check day (n, was u): grid_other_currency goc-02, goc-03
- X other currency (c): freelancer freelance-10, freelance-19
- S imported/typed/self-logged (n, was u): grid_other_currency goc-01
- T a time with an offset (n): day_offset_kinds kinds-01, kinds-03

### adjust
- C check day (n, was X): place_moves_adjust pma-04 to pma-07
- T a time with an offset (n): day_offset_kinds kinds-01

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

- L a second move days later (n): rules mv-98, mv-99 (the moved Emergency fund draw, `mv:draw:once.2026-12`, lowered on the phone, stays 12,000, AB1)
- (AC4, AB rows, no column of its own) the draw goes to Waiting; its built id makes one record when two devices apply it: rules mv-72, mv-95, mv-96
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
- Y years after setup (n): far_years fy-08 (November 2036's rent skipped)

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
- Y years after setup (n): far_years fy-02, fy-10 (the 2029 card payment's settle; the 2036 pay)
- T a time with an offset (n): day_offset_kinds kinds-01

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
- M the move run on two devices (n): rules mg-85 (38.31 `ui.sweep` as `pe:<occurrence>:<place>`); rules pe-60, pe-61 (its occurrence)
- M, continued (AB2): a month-end answer for a period not ended at the move waits and the period's own question still comes, offering it as the default, capped (AD3): rules mv-52, mv-89 (pay twice a month), pe-67 to pe-70; a moved answer larger than its place holds is capped: rules pe-62 to pe-65; one naming a removed goal goes to Waiting to place: rules mv-90, pe-66 (AC8)
- L a second move days later (n): rules mv-98, mv-99 (September's moved answer, changed on the phone to 1,500, stays)

### rm: / to place
- C check day (c): goal_removed gone-02
- P period start (c): to_place tp-02, tp-04
- D two devices (c, a false cover fixed by X5): rules mg-62, mg-68; placing money to place on two phones, the newer gives way: to_place_two_phones tp2-01, tp2-02; rules pe-55, pe-57 to pe-59; covering an overspend found later: rules pe-56
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
- E edited after settled (c, a false cover fixed by X8): pay_day_moves move-01 to move-04; rules ed-01 to ed-07; pay_day_offer offer-01 to offer-03
- S imported/typed/self-logged (c): import_rules imp-08, imp-09
- Z closed account (c): close_main_bank cmb-05; rules acc-18, acc-19
- M the move run on two devices (n): rules mg-84 (`mv:pay:steps.a`); moved pay `per: 'month'` with a one-month amount spread over the month's pays (AB2, AC1): rules mv-87, mv-88
- Y years after setup (n): far_years fy-11
- L a second move days later (n): rules mv-82, mv-83 (the pay day answered on the phone keeps its rule, AB1)

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
- M the move run on two devices (n): rules mg-84 (a bill and a self-logged spend)
- Y years after setup (n): far_years fy-08, fy-12 (rent and a yearly tax in 2036)
- L a second move days later (n): rules mv-82, mv-83 (rent's day answered on the phone keeps its rule, AB1)
- (X watch, no column of its own) one occurrence changed, `amounts`: one_occurrence_amount amt-01 to amt-05; a bill that ends with its money redirected, `ends` and `redirect`: bill_ends_redirect red-01 to red-04
- (W1, no column of its own) closing the main bank moves the transfers out and in and the self-logged spends tied to it: rules acc-20, acc-21

### budget lines
- C check day (n, was X): overspent_line ol-01 to ol-03
- O opening (c): opening_by_days days-03; opening_free_typed ftyp-01 to ftyp-03
- P period start (n, was X): period_start_model psm-02; rules units-75 to units-77
- X other currency (n, was X): line_other_currency loc-01, loc-02; grid_other_currency goc-04
- D two devices (c): rules mg-18
- E edited after settled (n, was u): plan_change pc-01 to pc-03; a change made on a period's first day (V): plan_change_first_day pcf-01 to pcf-03
- S imported/typed/self-logged (c): line_on_card line-01 to line-05
- Z closed account (n, was u): close_main_bank cmb-02, cmb-03; rules acc-18
- M the move run on two devices (n): rules mg-84 (`mv:line:food`); a 38.31 one-month amount replaces the month's total, spread over the periods starting in that month (AB2): rules units-79, units-80, units-82 to units-84, mv-73, mv-88 (units-78 and units-81 key it)
- Y years after setup (n): far_years fy-09, fy-10
- L a second move days later (n): rules mv-98, mv-99 (Food renamed on the phone stays renamed, AB1)

### goals / places
- C check day (c): mako_shape mako-02
- O opening (c): split_auto_est split-03
- P period start (c): yearly_and_places year-04; to_place tp-05
- X other currency (n, was u): grid_other_currency goc-05, goc-06
- D two devices (c): rules mg-68
- (V1, no column of its own) a goal's money moved to its own account: goal_own_account goa-01 to goa-07
- U undo/redo (c): goal_removed gone-02 to gone-05
- Z closed account (c): rules acc-12, acc-13
- M the move run on two devices (n): rules mg-84 (`mv:place:g1`); where each goal's money is, asked by the move: goal_money_elsewhere gme-01 to gme-04
- Y years after setup (n): far_years fy-12 (a refill place next due in 2037)
- L a second move days later (n): rules mv-82 to mv-85 (the trip raised to 350,000 on the phone stays, AB1)
- (X watch, no column of its own) a pay-off place, `pays`: payoff_place pays-01 to pays-03
- (W3, no column of its own) a goal's own account in the home currency only: rules ed-08 to ed-10
- (W, no column of its own) an account that backs a goal is not spent from: goal_account_spend gas-01, gas-02

### card
- C check day (c): mako_shape mako-15
- O opening (c, a false cover fixed by X6): two_month_opening tmo-01 to tmo-07; a known close day and no typed last statement: card_no_statement cns-01 to cns-05; set up between the close and its payment day, a false cover fixed by AB3: card_between_close_pay cbp-01 to cbp-10
- W posting window (c): import_rules imp-10, imp-11
- P period start (c): card_statements stmt-04; mako_shape mako-24
- X other currency (c): other_currency_card fx-01 to fx-04
- D two devices (c): rules mg-50, mg-54
- U undo/redo (c): rules mg-09 to mg-11
- E edited after settled (c): rules mg-07
- S imported/typed/self-logged (c): import_rules imp-06, imp-10; bill_on_card boc-03
- Z closed account (c): rules acc-08, acc-11; card_out out-06, out-07
- M the move run on two devices (n): rules mg-84 (`mv:card:c1`)
- Y years after setup (n): far_years fy-01, fy-02, fy-04, fy-05 (a close day in 2029 and 2036; a not-sure card in 2036)
- T a time with an offset (n): day_offset_kinds kinds-04
- L a second move days later (n): rules mv-98, mv-99 (the moved card's payment day changed on the phone stays, AB1)
- B set up between close and payment day (n): card_between_close_pay cbp-01 to cbp-10 (yes, no and don't know); rules ed-13 to ed-16
- (W2, no column of its own) a card payment in another currency listed apart: owed_other_currency_lists oocl-01 to oocl-03, oocl-05

### loan / pay-later
- C check day (c): borrow_and_plans plan-03
- O opening (c): loans_and_carried loan-01
- X other currency (n, was u): grid_other_currency goc-06; paid from an account in another currency (V2): loan_other_currency lfx-01 to lfx-07
- D two devices (c): rules mg-06
- S imported/typed/self-logged (c): borrow_and_plans plan-01, plan-04
- Z closed account (c): rules acc-09
- M the move run on two devices (n): rules mg-84 (`mv:debt:d1`)
- Y years after setup (n): far_years fy-06 to fy-08
- T a time with an offset (n): day_offset_kinds kinds-05
- L a second move days later (n): rules mv-98, mv-99 (the moved loan's rate set on the phone stays, AB1)
- B set up between statement and payment day (n): loan_between_stmt_pay lbs-01 to lbs-04 (a loan answered yes and no, a pay-later answered yes, AB3); loan_stmt_dont_know ldk-01 to ldk-05 (a loan and a pay-later answered don't know: that month's usual payment, AD7)
- (AC5, AC7, AC3, no column of its own) a one-month amount is that month's whole payment: loan_one_month_amount loma-01 to loma-03; the loan line's: rules mv-94; a made loan until its terms are answered: rules mv-15, mv-49
- (W2, V2) a loan payment in another currency listed apart, and skipped in the walk: owed_other_currency_lists oocl-01, oocl-03, oocl-04, oocl-05

### cash, e-wallet, wallet, investment, owedToYou
- C check day (c): couple_cash couple-11; investment_gain inv-01, inv-02
- O opening (c): weekly weekly-01; freelancer freelance-02
- W posting window (c): import_two_sided two-04, two-05
- X other currency (c): freelancer freelance-04, freelance-19
- S imported/typed/self-logged (c): weekly weekly-08
- Z closed account (c): closing_write_off woff-02, woff-04
- M the move run on two devices (n): rules mg-84 (`mv:acct:cash`)
- T a time with an offset (n): day_offset_kinds kinds-02, kinds-03
- L a second move days later (n): rules mv-98, mv-99 (the moved PayPay wallet renamed on the phone stays, AB1)

### fee record (`fee:<transfer id>`) (a new row: confirm_review_1 found it missing)
- W posting window (c): rough_transfer rough-03, rough-06 (a statement line meets a rough side and the fee is written)
- P period start (n): fee_place feeplace-07 (a fee in the new period comes out of that period's Free to spend)
- X other currency (c): grid_other_currency goc-07 (a change of yen into pesos writes no fee)
- D two devices (n): rules mg-80, mg-82, mg-83, mg-86 (`fee:<transfer id>`: two phones ticking one top-up write one fee record)
- U undo/redo (c): fee_record_gone frg-01 to frg-04
- S imported/typed/self-logged (c): fees fee-03, fee-04 (a schedule's fee, typed); rough_transfer rough-03 (from a statement line)
- not applicable: C, O, E, Z (a fee record moves no account [S5 fix], so no check, opening or closing holds it; its amount follows its transfer); M (38.31 has no fees), Y, T, L, B

### not yet at setup (`notYet`) (a new row: confirm_review_1 found it missing)
- C check day (n): notyet_opening ny-03; notyet_bill nyb-02 (each is on the first check-in list)
- O opening (n): notyet_opening ny-01; notyet_bill nyb-01
- W posting window (n): notyet_bill nyb-01 (a bill due the day before setup, late and still inside its window); notyet_window_past nwp-01 (Z2); notyet_import_late nil-02 (AA14: a line three weeks past the window settles the item)
- P period start (n): notyet_opening ny-02, ny-05 (the pay due on the setup day starts the period when it lands)
- X other currency (n): notyet_bill nyb-02, nyb-04 (pay in dollars not in yet: listed apart)
- S imported/typed/self-logged (n, a false cover fixed by AB4): notyet_bill nyb-03 (a statement line settling it stays outside the opening); notyet_line_before nlb-01, nlb-03 (a line dated before the setup day, imported or typed, still comes after the opening, AB4); notyet_import_late nil-01 to nil-03 (AA14: a matching statement line at any later date settles it, one of another amount does not)
- setup's questions, a pay due that day first: rules ed-11, ed-12
- not applicable: D, U, E, Z (setup writes the opening once, on one device; nothing is settled or closed before it); M (38.31 has no such answer), Y, T, L (the move writes no `notYet`), B (a card's statement is not a pay or bill item)

### move (an old copy moved) (a new row after Y and Z: the move is a record kind of its own)
- C check day (n): rules mv-02 to mv-06, mv-47, mv-48 (each bank figure a dated check, told at the end of its day or the last save, Y1, Y22); mv-78 (the last save the later of the second copy's `t` and the `rev` time, AA10); moved_bank_now, moved_figure_no_time
- O opening (n): rules mv-02, mv-15, mv-45, mv-59, mv-81 (the oldest figure opens the bank, goal money in its split or another account's opening, a bank or an e-wallet, Y17, Z3, AA13); mv-80 (a made loan's rate and minimum, AA12); goal_money_unanswered gmu-01 to gmu-04 (Z3); moved_records moved-01
- P period start (n): rules mv-29, mv-46 (the salary stream starts periods, the others not, Y2); mv-33 (a budget line's, a share's and a goal's one-month amount keyed by the period's pay, AA6); mv-52 (month-end answers named by the period's pay, Y8, AA3); mv-72 (written when the pay day is answered after the move, AA5); mv-73 (pay every two weeks: the first pay in the month, the period holding the month's last day, AA4); units-78 to units-81 (Z5)
- X other currency (n): rules mv-22 to mv-25 (the currency asked before any amount is converted), mv-64 (too many decimals rounded and flagged, Y23)
- D two devices (n, a false cover fixed by AB1): rules mv-41, mv-67 (Y12, Y28); mg-84, mg-85; the moved records carry the copy's last save, and a device that finds a moved copy in the cloud takes it: mv-42, mv-82 to mv-86
- U undo/redo (n): rules mv-27 (38.31's Undo copies are not moved, D2); mv-97 (a moved receipt removed and put back with an Undo before a second device moves, AB1, H6; confirm_review_2 found that mg-91 only checks an id)
- S imported/typed/self-logged (n): rules mv-07, mv-70 (typed receipts, AA1), mv-08, mv-28, mv-60 (imported accounts, Y18), mv-20 (self-logged spends), mv-62, mv-75, mv-76 (Y20, AA7)
- M the move run on two devices (n, a false cover fixed by AB1: its two moves were an hour apart with no use between): rules mv-41, mv-42, mv-67, mv-86 (each device's frozen text kept), mv-95, mv-96 (`pendingMove` on two devices); moved_ids mvid-01 to mvid-03 (the model reads moved ids)
- Y years after setup (n, uncovered until this round): rules mv-68 (steps and items ten years out move as they are); mv-74 (a weekly pay's share of a monthly total through a year of 53 pays, AA4)
- T a time with an offset (n, partly uncovered until this round): rules mv-02, mv-07 (+09:00), mv-69 (a moving device at -05:00)
- L a second move days later (n): rules mv-82 to mv-85 (d1: cloud on and off, the same and a newer 38.31 copy), mv-97 to mv-99 (every kind of moved record)
- P, continued (AB2): moved pay per month; a one-month amount spread over the month's pays or periods: mv-87, mv-88; a month-end answer for a period not ended at the move waits: mv-52, mv-89
- not applicable: B (the move sets up no card statement: a moved card or debt has its close day "not sure", Y9); W (the move writes no import line, so no posting window); E (the move settles nothing; X8 applies to moved schedules as to any, rules ed-01 to ed-07); Z (38.31 has no closed accounts)

### pending move (`pendingMove`) (a new row: confirm_review_2 found it missing)
- P period start (n): rules mv-52, mv-89 (a month-end answer waits for a period not ended at the move, AB2); mv-71, mv-72 (what waits is keyed by the period's pay once its day is answered)
- D two devices (n): rules mv-95 (one device answers, the other has not: the written entries are `gone` with the answer's `at`, the other's live copy gives way), mv-96 (both answer: one draw, one answer, AB rows)
- M the move run on two devices (n): rules mv-95, mv-96
- L a second move days later (n): rules mv-98, mv-99 (November's answer waits on both and is one record; the phone kept its entries for what it wrote at its move marked `gone`, so the desktop's waiting copies of them are dropped, AD5); a waiting entry applied later only over an older `at`: mv-106 to mv-108 (AD5)
- (AC2, no column of its own) a loan receipt waiting for the loan question: rules mv-91 to mv-93
- not applicable: C, O, W, X, U, E, S, Z, Y, T, B (an entry holds a 38.31 amount or answer waiting for a day; it moves no account and is in the home currency)

### frozen text (`mv:frozen:<by>`) (a new row: confirm_review_2 found `frozen3831` missing)
- D two devices (n): rules mv-86 (two different 38.31 copies: both kept, one record per device, AB1)
- M the move run on two devices (n): rules mv-86
- L a second move days later (n): rules mv-82, mv-83 (`mv:frozen:phn001` and `mv:frozen:dsk001` both kept, cloud on and off), mv-98, mv-99
- not applicable: every other column (read only; never written again after the move, O)

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

## Decisions W and X, and where each part is tested

Run first, before the references changed: 608 of 649 asks passed and 313 of 341 cases (the 41 asks and 28 cases marked "failed first" below; the 12 cases of the new file `rules/edits.json` failed as it had no reference yet, which `run_rules.js` counts as one failure: "17 of 330"). After the changes to `ref/lookahead_ref.js`, `rules/merge_ref.js`, `rules/period_end_ref.js`, `rules/units_ref.js`, `rules/accounts_ref.js` and the new `rules/edits_ref.js`: 649 of 649 asks, 341 of 341 cases. Two asks were corrected while the references changed, both in the asks, not the rules: to_place_two_phones lacked its main bank (the model stopped on it; with it, tp2-01 gave 150,000 as the review found), and far_years had ten years of rent with none paid, which the walk takes off as late bills (its rent now starts in Nov 2036, when the person moves).

| Part | Asks or cases | Failed first |
|---|---|---|
| X1: moved records get built ids `mv:<kind>:<38.31 id or key>` | rules mg-79, mg-81, mg-84, mg-85 | mg-79 (no built id), mg-81 (not a valid id). mg-84 and mg-85 passed first: the merge already makes one record of one id; X1 is what gives both devices the same id |
| X2: a fee record's id is `fee:<transfer id>` | rules mg-80, mg-82, mg-83, mg-86; fee_place and fee_record_gone renamed to `fee:t1`, `fee:t2`; check_specs refuses any other fee id | mg-80, mg-82 |
| X3: the opening's `notYet`, setup asking about each, a pay due that day first | notyet_opening ny-01 to ny-06; notyet_bill nyb-01 to nyb-04; rules ed-11, ed-12 | ny-01 (0, 40,000 short), ny-02 (28 days), ny-03 (nothing on the list), nyb-01 (200,000), nyb-02, nyb-03 (200,000), nyb-04; ed-11, ed-12 (no reference) |
| X4: the check's gain state; a large gain held until answered | gain_held gh-01 to gh-04; gain_answered ga-01, ga-02; gain_pay_day gpd-01 to gpd-03 | gh-01 (309,000), ga-01 (309,000), ga-02 (both still warned), gpd-01 (210,000) |
| X5: every share-out from a limited amount checked again after a merge | to_place_two_phones tp2-01, tp2-02; rules pe-55 to pe-59 | tp2-01 (150,000, once the file named its main bank); pe-55 to pe-59 (no such question) |
| X6: a card with a known close day and no typed last statement | card_no_statement cns-01 to cns-05 | cns-01, cns-03, cns-04, cns-05 (no close day: no payment ever) |
| X7: nothing made only up to a fixed horizon; a test ten years out | far_years fy-01 to fy-12 | fy-01, fy-02, fy-04, fy-05, fy-08, fy-09, fy-10 |
| X8: a schedule change never on or before its latest settled or named occurrence; the edit offers the day after | rules ed-01 to ed-07; pay_day_offer offer-01 to offer-03 (the offer taken) | ed-01 to ed-07 (no reference); offer-01 to offer-03 passed first |
| X9: the start and end of a day in the offset of the device that wrote the record | day_offsets off-01; day_offset_west west-01; day_offset_kinds kinds-01 to kinds-05 | all seven |
| X watch: the stale 11.1 rows (`ui.sweep` as `pe:<occurrence>`, `once[ym]` to the first period starting in that month) | rules pe-60, pe-61, units-78 to units-80; mg-85 | pe-60, pe-61, units-78 to units-80 (no such question) |
| X watch: the move asks where each goal's money is | goal_money_elsewhere gme-01 to gme-04 (answered: in another account) | none (the file is the copy after the move; asking is the move's) |
| X watch: `amounts` | one_occurrence_amount amt-01 to amt-05 | amt-01 to amt-04 (the model read no `amounts`) |
| X watch: `redirect` (and `ends`) | bill_ends_redirect red-01 to red-04 | red-02, red-03 (the model read no `ends`) |
| X watch: a pay-off place's `pays` | payoff_place pays-01 to pays-03 | none |
| X watch: V2's loan item skipped in the walk | owed_other_currency_lists oocl-04; loan_other_currency lfx-01, lfx-07 | none (the reference already skipped it) |
| W1: closing the main bank moves every schedule tied to it unless ended | rules acc-20, acc-21 | acc-20, acc-21 (the top-up, the sweep and the gym ended) |
| W2: card, loan and pay-later payments in another currency listed apart, out of the totals | owed_other_currency_lists oocl-01 to oocl-03, oocl-05 | oocl-01 to oocl-03 |
| W3: a goal's own account in the home currency only | rules ed-08 to ed-10 | ed-08 to ed-10 (no reference) |
| W: an account that backs a goal is not spent from | goal_account_spend gas-01, gas-02 | gas-01 (130,000) |
| confirm_review_1 c9: a leap day and the year end | leap_year_end leap-01 to leap-06 | none (sound, as the review found) |
| confirm_review_1 c10: a goal's 300,000 kept outside the bank | goal_money_elsewhere gme-01 to gme-04 | none |
| the fee row, period start | fee_place feeplace-07 | none |

## Decisions Y and Z, and where each part is tested

Run first, before the references changed: rules 343 of 419 cases and scenarios 659 of 664 asks. Every move case failed, as the cases now take the copy's last save from the second copy (`idb`, Y13) and the old reference read `saved`; given `saved` from `idb.t`, 18 of the 67 move cases passed and 49 failed (mv-02 to mv-08, mv-12, mv-15, mv-16, mv-19 to mv-21, mv-24, mv-25, mv-27, mv-29 to mv-31, mv-33, mv-38 to mv-42, mv-44 to mv-67). After the changes to `rules/move_ref.js`, `rules/merge_ref.js`, `rules/accounts_ref.js`, `rules/units_ref.js`, `ref/lookahead_ref.js` and `scenarios/check_specs.js`: 421 of 421 cases (with mv-68 and mv-69, added for this grid's move row, which passed first) and 664 of 664 asks.

| Part | Asks or cases | Failed first |
|---|---|---|
| Y1 to Y28: the move's 28 questions | rules mv-01 to mv-69 (MOVE_FIELDS.md section 8 names the cases of each) | the 49 above |
| Y28 and Z: the merge and the model accept `mv:` ids, also inside built ids | rules mg-87 to mg-95; moved_ids mvid-01 to mvid-03 | mg-87 to mg-93 (not a valid id); mvid-01 (60,000: the period-end answer's occurrence was read as `mv`) |
| Z (kinds): the move helper's kind names everywhere | rules mg-79, mg-81, mg-84, mg-85 renamed; SCHEMA_V3 section 0 | none (renamed data) |
| Z1: a gain answered wrong removes the check and asks again | gain_wrong gw-01 to gw-03 | gw-02 (13,000), gw-03 (no `check_again`); gw-01 passed first (a held gain places nothing) |
| Z2: a not-yet item past its window before setup still expected | notyet_window_past nwp-01 to nwp-05 | nwp-01 (170,000), nwp-02 (both "not seen yet") |
| Z3: goal money in the bank until answered; short shown, never refused | goal_money_unanswered gmu-01 to gmu-04; rules mv-15 | none in the model (it already did this); mv-15 with the move cases |
| Z4: a transfer between the old and the new main bank ends at the closing | rules acc-22 | acc-22 (moved to the new bank) |
| Z5: once with no period starting in the month | rules units-81 | units-81 (no key) |
| Z6: a pay-off goal's saved so far kept on the loan | rules mv-15, mv-55 | both |
| Z: the reviewer's scripts c3 and c6 renamed | ref/confirm_situations c3 (`not_yet`), c6 (`fee:t1`) | c6 stopped on the missing `fee1`; c3 ran but its `not_gone_out` was read by nothing |

## Decision AA, and where each part is tested

Run first, before the references changed: rules 415 of 433 cases (the 18 move cases marked "failed first" below) and scenarios 666 of 667 asks (nil-02). After the changes to `rules/move_ref.js` and `ref/lookahead_ref.js`: 433 of 433 cases and 667 of 667 asks. The cases' expected outputs and the asks were worked by hand before the references changed. AA answers the move's open questions mv-q29 to mv-q41 and Z2's import question; the 8 it leaves are `rules/move.json` mv-q42 to mv-q49 (MOVE_FIELDS.md section 9, SCHEMA_V3 section 14).

| Part | Asks or cases | Failed first |
|---|---|---|
| AA1: a receipt's `s` naming no account added to its note | rules mv-07, mv-70 | both (listed, note unchanged) |
| AA2: an item's label the schedule's name, its note the `note` | rules mv-65 | mv-65 (named by the note) |
| AA3: the older `{ amt, id }` a move to that goal in the period's `pe:` record | rules mv-52, mv-71, mv-72 | all three (listed) |
| AA4: the pay rhythm; the first pay in the month; the period holding the month's last day; a monthly total spread per pay | rules mv-73, mv-74 | both (held; no `payAmounts`) |
| AA5: what waits for a pay or bill day kept in `pendingMove`, written when answered | rules mv-33, mv-46, mv-71, mv-72 | all four (`held`; no question `move_answer`) |
| AA6: shares and goals `once` on that period's plan.shares entry; the draw a move out of the fund; a debt's payment occurrence `amounts` | rules mv-33, mv-71, mv-72 | all three (listed) |
| AA7: a bill:loan receipt with the loan line dropped or empty | rules mv-75, mv-76 | both (a spend with no place) |
| AA8: the loan line's own end month and redirect win | rules mv-50, mv-77 | none (the reference already did this) |
| AA9: a removed goal never brought back | rules mv-51 | mv-51 (the sample trip made again) |
| AA10: the later of the second copy's `t` and the `rev` time | rules mv-78 | mv-78 (08:00, the second copy's) |
| AA11: a goal with no date and no monthly takes 38.31's figure | rules mv-33, mv-79 | both (no amount) |
| AA12: the loans the move makes ask rate and minimum | rules mv-15, mv-49, mv-80 | all three (no question) |
| AA13: "another account" a bank or an e-wallet | rules mv-59, mv-81 | none (the reference took the type from the answer) |
| AA14: a not-yet item past its window settled by a matching line at any later date | notyet_import_late nil-01 to nil-03 | nil-02 (345,200: the line stayed unmatched and the insurance was still expected) |

## Decisions AB and AC, and where each part is tested

Run first, before the references changed (task 1): rules 421 of 464 cases (43 failed) and scenarios 678 of 687 asks (9 failed). After the changes to `rules/move_ref.js`, `rules/units_ref.js`, `rules/period_end_ref.js`, `rules/merge_ref.js`, `rules/edits_ref.js` and `ref/lookahead_ref.js`: 464 of 464 cases and 687 of 687 asks. Writing this grid then added mv-97 to mv-99 (the column L for every kind of moved record, and the move row's U) and re-stamped a record written from a waiting entry like any moved record (mv-72, mv-92, mv-93, mv-96 re-worked by hand): 467 of 467 cases.

| Part | Asks or cases | Failed first |
|---|---|---|
| AB (M1): the minimum asked once, box empty; the move keeps a typed one, drops an automatic one | rules ed-17, ed-18, mv-09, mv-10 | ed-17, ed-18 (no question); mv-09, mv-10 passed (the reference already did this) |
| AB1: a moved record's `at` is the copy's last save; a device that finds a moved copy in the cloud takes it; `mv:frozen:<by>` | rules mv-42, mv-82 to mv-86; later mv-97 to mv-99 | mv-42 (1,000: the later move won), mv-82 to mv-85 (no question `move_later`), mv-86 (no `frozen` records) |
| AB2, AC1: moved pay `per: 'month'`; a one-month amount spread; a period not ended waits | rules mv-29, mv-33, mv-46, mv-52, mv-73, mv-87 to mv-89; units-79, units-80, units-82 to units-84 | all of them (no `per`; the first pay or period took the whole amount; January's answer written for a period not ended; no question `once_spread`) |
| AB3: "Is the last statement paid?" | card_between_close_pay cbp-01 to cbp-10; loan_between_stmt_pay lbs-01 to lbs-04; rules ed-13 to ed-16 | cbp-06, cbp-07, cbp-08 (don't know: 50,000 on 27 Dec, open), lbs-01, lbs-02 (the payments made before setup asked again: 50,000 and 250,000), ed-13 to ed-16 (no question). cbp-01 to cbp-05 passed first: a typed statement, paid or not, already worked; cbp-09, cbp-10, lbs-03, lbs-04 passed too |
| AB4: a line settling a `notYet` occurrence after the opening, whatever its date | notyet_line_before nlb-01 to nlb-03 | nlb-01 (200,000), nlb-03 (50,000) |
| AB rows: `pendingMove` entries are records; the draw's built id | rules mv-71, mv-72, mv-95, mv-96 | all four (no ids; `mv:move:once.<ym>.draw`) |
| AB watch: restoring an older backup with the cloud on | rules mg-96, mg-97 | both (no question) |
| AB watch: a moved month-end answer capped | rules pe-62 to pe-65 | pe-62, pe-63 (refused); pe-64, pe-65 passed first |
| AC2: a loan receipt waits for the loan question | rules mv-91 to mv-93 | all three (a repay with no loan, `held`) |
| AC3: a made loan holds rate 0 and the old payment, asked | rules mv-15, mv-49 | both (no `apr`) |
| AC4: the draw to Waiting, where that period's plan places it | rules mv-72 | mv-72 |
| AC5: a debt's one-month amount is the whole payment | loan_one_month_amount loma-01 to loma-03 | loma-01, loma-02 (25,000: the usual payment and its extra); loma-03 passed first |
| AC6: "(moved: loan line removed)" on the receipt's note | rules mv-75, mv-76, mv-93 | all three |
| AC7: `once[ym].bill:loan` to the matched loan's payment | rules mv-94 | mv-94 (listed) |
| AC8: a month-end answer naming a removed goal to Waiting as "to place" | rules mv-90, pe-66 | both (listed; no `toPlace`) |
| confirm_review_2 d1 | rules mv-82, mv-83 | both |
| confirm_review_2 d2 | notyet_line_before nlb-01, nlb-02 (d2-01, d2-02; the reviewer's own file now passes too) | nlb-01 |
| confirm_review_2 d3 | card_between_close_pay cbp-03, cbp-06, cbp-07, cbp-08 (d3-03, d3-01, d3-02, with the setup answer saved; the reviewer's file has no answer, so it still reads X6) | cbp-06, cbp-07, cbp-08 |
| confirm_review_2 d4 | none needed: the reviewer found its one failed ask was a counting error (26 Jun to 23 Jul is 27 days, which the model gives) | not run |

Questions AB and AC did not answer: mv-q50 to mv-q54, ed-q1, ed-q2, mg-q12. AD answers all eight (below).

## Decision AD, and where each part is tested

Run first, before the references changed (task 1): rules 459 of 485 cases (26 failed); scenarios 692 of 692 asks in the model, but `scenarios/check_specs.js` refused the new file (a loan's "dont_know" was not allowed: 2 problems). After the changes to `rules/move_ref.js`, `rules/edits_ref.js`, `rules/merge_ref.js`, `rules/period_end_ref.js`, `scenarios/check_specs.js` and a comment in `ref/lookahead_ref.js`: mv-45 failed (AD1 reaches a 25.0 copy with a minimum; re-worked by hand), then 485 of 485 cases and 692 of 692 asks, and check_specs all good (109 files).

| Part | Asks or cases | Failed first |
|---|---|---|
| AD1 (mv-q50): a minimum with no `ui.minAuto` from a build before 20 Nov is automatic, dropped; the minimum is asked | rules mv-09, mv-45, mv-100 to mv-102 | mv-100, mv-101 (kept as typed); mv-102 and mv-09 passed first; mv-45 failed after the change and was re-worked |
| AD2 (mv-q51): the dropped loan line's one-month amount dropped, listed in the move summary | rules mv-103 | mv-103 (in `unplaced`, not `zero`) |
| AD3 (mv-q52): a waiting month-end answer offered as the default, capped | rules pe-67 to pe-70, mv-52, mv-89 | pe-67, pe-68 (no `offered`); pe-69, pe-70 passed first |
| AD4 (mv-q53): a moved bill answered with another rhythm is per month, spread | rules mv-104, mv-105 | both (no `per`; 80,000 a payment; the whole one-month amount on the first payment) |
| AD5 (mv-q54): a waiting entry applied only over an older `at`; one written at the move kept `gone` | rules mv-106 to mv-108; mv-33, mv-46, mv-52, mv-73, mv-75, mv-89, mv-90, mv-94, mv-98, mv-99 | all of them (no question `apply_waiting`; no `gone` entries for what the move wrote; mv-98, mv-99: three entries came back waiting) |
| AD6 (ed-q1): "no, not paid" asks the amount with everything owed filled in | rules ed-14, ed-19 | both (no `filled`; no amount saved) |
| AD7 (ed-q2): "don't know" on a loan or pay-later is that month's usual payment | loan_stmt_dont_know ldk-01 to ldk-05; rules ed-20, ed-21 | ed-20, ed-21 (400,000 and 30,000 saved); the five asks passed in the model, but check_specs refused the file |
| AD8 (mg-q12): a restore gives the shared `ui` keys a new `at` | rules mg-98, mg-99 | both (the old `ui.at`; the cloud's false came back) |
| AD: the helper's readings confirmed (leftover to the earliest, `terms: 'asked'`, AC6's words after a space) | rules mv-73, mv-105, mv-15, mv-49, mv-75, mv-76, mv-93 | none (already so) |

Questions AD does not answer (no case depends on them; `rules/*.json` `open`): mv-q55 (AD1: a 38.31 copy saved from 20 Nov on whose minimum an earlier build filled in looks typed), ed-q3 (AD6 on a loan or pay-later answered "no"), mg-q13 (AD8: a `ui` key set after the backup comes back at the merge). SCHEMA_V3 section 14 lists each with what the references do.
