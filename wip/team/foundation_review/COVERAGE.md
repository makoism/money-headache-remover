# Coverage of the foundation (after decisions T to AW, 23 Nov 2026)

The coverage grid of final_review_3.md, updated (LESSONS lesson 3: count coverage, do not sample). Rows are kinds of record and the shapes they live in; columns are the situations that change a record's effect. Every applicable cell names the asks (scenarios/*.json, run by `node foundation_review/ref/run_scenarios.js`) or cases (rules/*.json, run by `node foundation_review/rules/run_rules.js`) that cover it. All of them pass: 725 of 725 asks, 736 of 736 cases, and the same again with every short made-up id rewritten to the ordinary form by the realistic-ids check (`foundation_review/realistic_ids.js`, which both runners run every time) (after AN: 39 cases added (rules mg-257 to mg-287, ed-56 to ed-63) and 9 re-worked (ed-17, ed-18 for AN3; mv-28, mv-125 to mv-127 for AN7's shop keys; the shop keys of the existing merge cases put in the `k:` form, no result changed), 6 asks re-worked by hand with new results (check_day_before cdb-01 to cdb-03, away_clock ac-01 to ac-03, AN4) and 6 re-worked with the same or new figures (moved_together mt-01 to mt-03, AN5; offset_travel ot-01 to ot-03, AN4, re-worded), the columns E x D and Z x D and the row `people`; see "Decision AN" at the end; after AM: 9 asks in 3 new scenario files, 6 asks re-worked by hand (offset_travel ot-01 to ot-03, away_clock ac-01 to ac-03, new results for AM3) and 4 cases added, no new row or column; see "Decision AM" at the end; after AL: 3 asks in a new scenario file, 47 cases added and 41 re-worked (the shared `ui`, `home` and the move's `home` in the field-value shape; 4 of them, mg-198, mg-206, mg-211 and mg-212, with a new result for AL3), the rows shared `ui`, `imports.cats` and `plan.limits` and the column V; see "Decision AL" at the end; after AK: 10 cases added and 17 re-worked (one of them only reworded), no new row or column: `home` now merges field by field; see "Decision AK" at the end; after AJ: 4 asks in 2 new scenario files, 45 cases added and 3 re-worked, the row `home` and 19 false covers fixed (the E column and the built-id D cells held only for short made-up ids; loan / pay-later D); see "Decision AJ" at the end; after AI: 9 cases added and 8 re-worked for the held value, no new row or column; see "Decision AI" at the end; after AH: 11 asks in 3 new scenario files, 8 asks moved to the AE1 shape, 60 cases added and 26 re-worked (12 of them only to name the receiving device's now, 5 only moved to the AE1 shape), the column A and two false covers fixed; see "Decision AH" at the end; after AG: 6 cases added and 3 re-worked, no new row or column; see "Decision AG" at the end; after AE and AF: 6 asks in a new scenario file, 31 cases added and 20 re-worked (3 of them only reworded), the row "keyed overrides" and the column R; see "Decisions AE and AF" at the end; after AB and AC: 20 asks in 4 new scenario files, 34 cases added and 15 re-worked, the columns L and B and the rows `pendingMove` and `frozen`; see "Decisions AB and AC" at the end; after AA: 3 asks in a new scenario file and 12 move cases; after W and X: 78 asks and 32 cases added, in 19 new scenario files, one ask in fee_place and a new rules file `rules/edits.json`; after Y and Z: 15 asks in 4 new scenario files, 11 rules cases and 24 move cases, and the move row; see "Decisions W and X" and "Decisions Y and Z" at the end). The move cases (`rules/move.json`) are counted in the 697.

Columns: C check day, O opening, W posting window, P period start, X other currency, D two devices, U undo/redo, E edited after settled, S imported/typed/self-logged, Z closed account, and, added after confirm_review_1 (decision X): M the move run on two devices (the phone and the desktop each move the same 38.31 copy), Y years after setup (an ask ten years out, X7), T a time with an offset (the start and end of a day in the device's offset, X9); and, added after confirm_review_2 (decisions AB and AC): L a second device moving days later, after real use on the first (AB1), and B setup between a statement's close and its payment day, for cards, pay-later and loans (AB3); and, added after confirm_review_3 (decision AE5): R restore, an older backup restored while the cloud copy is on (the D4 clock, every list, held marks, a 38.31-format backup after the move); and, added after confirm_review_4 (decision AH1): A used again after days away, a device opened again after 2, 21 and 45 days (its own writes and what it is told on its own clock, a desktop edit made meanwhile, D8's question past 40 days); and, added after confirm_review_7 (decision AN6): **ED** edited after settled on two devices (one device changes a schedule offline while the other settles an occurrence, or edits a key the first moved away, and they merge: AN2), and **ZD** written into an account closed on the other device (one device closes an account while the other, offline, writes an event into it: AN6); and, added after confirm_review_6 (the AL watch): V a device whose offset changes (a flight, daylight saving) or a half-hour offset (+05:30): its writes, what it holds and how its times are ordered are compared as moments, and its dates stay in its own calendar. V applies where a time's order changes a record's effect beyond the clock itself (check and spend, ordered by `told` at a check) and to the records of separately edited fields whose stamps AL2 reads (`home` and the three new rows); every other row stamps, holds and merges with the same moment code and is marked not applicable.

Rows added after Y and Z: **move**, the move of a saved copy from 38.31, 38.28 or the 25.0 to 38.26 builds (`rules/move.json`), as a record kind of its own: what it writes in each situation. Rows added after AB: **`pendingMove`** (what waits on a moved copy, records `mv:pend:<field path>`) and **`frozen`** (each device's raw 38.31 text, `mv:frozen:<by>`, formerly the shared `frozen3831`). Row added after AJ (decision AJ3): **`home`**, the record holding the dated home currency (`curs`), the minimum (`minBank`), the main bank (`mainBank`) and the country; since AK1 each field carries its own `at` and `by`, and since AL1 each field is a field value `{ v, at, by, gone }`, the main bank and its minimum one field `main` (AL3). Rows added after confirm_review_6 (decision AL1): **shared `ui`** (the screen answers that follow the person, one field value per key), **`imports.cats`** (what the person taught the statement reader, one field value per shop, AL4) and **`plan.limits`** (`ceiling` with its `per`, AL5, and `aims`). No rule of the reference model reads them yet, so the cells about money (C, O, W, P, X, E, S, Z, Y, T, B) do not apply; the cells about how they are kept (D, U, M, L, R, A, V) do. Row added after confirm_review_7 (decision AN6): **`people`** (`people` records, `{ id, name, told, at, by }`, the moved one `mv:person:ui.name`); no money rule reads `owner` yet, so only D, U, R and M apply. Row added after AE: **keyed overrides** (`amounts` on schedules and loans, `once` on budget lines and `plan.shares` entries, `extraSteps` on loans), each key or entry with its own `at`, `by` and `gone` (AE1).

Marks: **c** covered before this round; **n** newly covered (in the first ten columns, by T to V: it was "u", uncovered and sound by working, or "X", uncovered and wrong, and the cell says which; in the columns M, Y, T and the two new rows, by W and X); **f (X..)** a false cover confirm_review_1 found, now really covered by the decision named (**f (AB..)** one confirm_review_2 found; **f (AJ..)** one confirm_review_5 found); **-** not applicable; **s2** stage 2 (decision T7 took Wallet mode and `hand` out of version one).

## Counts

| | Cells |
|---|---|
| **After AP and AQ** (38 rows x 20 columns in the grid, and the 4 rows of the version one sync below) | |
| New after confirm_review_8: the row `checkins` (AP6: 20 cells, 4 applicable, D, U, R and A; 16 not applicable) | 4 |
| New after AQ: the version one sync rows (4 rows: 12 applicable cells, section "Version one sync" below) | 12 |
| **Applicable after AQ** | **382** (382 of 382 covered and passing) |
| The columns | **frozen at 20** (AQ7): see "Version one sync" below |
| All cells before AP (37 rows x 20 columns) | 740 |
| Not applicable | 371 |
| Stage 2 (hand and Wallet mode, T7) | 3 |
| **Applicable** | **367** |
| New after confirm_review_7: the columns E x D and Z x D (72 cells on the old rows: 10 applicable, ED on income schedules, bill / transfer / auto schedules and keyed overrides, ZD on in / pay, refund, spend, transfer, repay, card and cash / e-wallet; 62 not applicable) | 10 |
| New after confirm_review_7: the row `people` (20 cells: 4 applicable, D, U, R and M; 16 not applicable) | 4 |
| of the 14 new applicable cells, covered by cases and asks that already existed (c: people M, mv-27 and mv-67) | 1 |
| of the 14, covered by new cases (n) | 13 |
| The stale count confirm_review_7 found ("328 of 328" under a header of 352) | fixed by AM's write-up; checked again cell by cell |
| Applicable after AM (36 rows x 18 columns) | 352 |
| New after confirm_review_6: the column V (33 cells on the old rows: 3 applicable, check, spend and home; 30 not applicable) | 3 |
| New after confirm_review_6: the rows shared `ui`, `imports.cats` and `plan.limits` (54 cells: 21 applicable, D, U, M, L, R, A and V each; 33 not applicable) | 21 |
| of the 24 new applicable cells, covered by cases and asks that already existed (c: shared `ui` U, R; re-worked to the new shape) | 2 |
| of the 24, covered by new cases and asks (n) | 22 |
| Applicable after AK (33 rows x 17 columns) | 328 |
| New after confirm_review_5: the row `home` (17 cells: 10 applicable, 7 not applicable) | 10 |
| of which covered by asks and cases that already existed (c: O, P, X, Z, M) | 5 |
| of which covered by new cases (n: D, U, L, R, A) | 5 |
| False covers confirm_review_5 found, now really covered (the 11 applicable E cells and the 7 built-id D cells, which held only for short made-up ids, AJ1; loan / pay-later D, covered by a union of two unrelated spends, AJ2) | 19 (no count change) |
| Applicable after AI (32 rows x 17 columns) | 318 |
| New after confirm_review_4: the column A (32 cells: 28 applicable, 3 not applicable, 1 stage 2) | 28 |
| of which covered by new cases (n) | 28 |
| False covers confirm_review_4 found, now really covered (move E, marked not applicable, AH2: a cell made applicable; keyed overrides U, covered only by a merge, AH3) | 2 (1 new applicable cell) |
| Near miss confirm_review_4 found, now really covered (keyed overrides C: the asks used plain numbers, AH3) | 1 (no count change) |
| Applicable after AG (32 rows x 16 columns) | 289 |
| New after confirm_review_3: the column R (32 cells, 31 applicable) and the row keyed overrides (16 cells, 8 applicable; its R cell counted once) | 38 |
| of which covered by asks and cases that already existed (c: keyed overrides C and P, E; restore of spend and income schedules, mg-96, mg-97) | 5 |
| of which covered by new cases (n) | 33 |
| Near misses confirm_review_3 found, now really covered (the D, M and L cells of income, bill, budget-line and loan rows covered only for `steps` and `rules`, not the keyed overrides on them: mg-100 to mg-107, mg-117, mv-116) | 0 (no cell changed; the new row holds them) |
| Applicable after AD (31 rows x 15 columns) | 251 |
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
| Changed by AE and AF in the old cells (none uncovered; the `pendingMove` L cell re-covered by AE2's cases, the card B cell by AE6's) | 0 |
| Changed by AG (no new row or column; AG's cases add to the `pendingMove` and keyed overrides R cells and the keyed overrides P cell) | 0 |
| Changed by AI (no new row or column; AI's cases add to the spend and check A cells, the spend D cell and the goals / places D and R cells) | 0 |
| Changed by AJ in the old cells (none uncovered; AJ4 and AJ-confirm add to the spend D and A cells) | 0 |
| Changed by AK (no new row or column; AK1 re-covers the `home` D, U, R, L and A cells field by field, AK2 and AK3 add to the income schedules and keyed overrides E cells) | 0 |
| Applicable after AL (36 rows x 18 columns) | 352 |
| Changed by AM (no new row or column; AM1 adds to the keyed overrides P and E cells and the income and bill schedules, AM2 to the `home` D cell, AM3 re-covers the check and spend C and V cells with new results) | 0 |
| Changed by AN in the old cells (none uncovered; AN1 and AN-note add to the `home`, shared `ui`, `imports.cats` and `plan.limits` D cells, AN4 re-covers the check C and V and spend V cells with new results, AN5 the keyed overrides P and E cells, AN7 the `imports.cats` D and M cells) | 0 |
| Changed by AO: the cell check x Z x D, not applicable before (a check typed on one device into an account closed on the other reopens it when its figure is not zero, AO6) | 1 |
| Changed by AO in the old cells (none uncovered; AO1 adds to the income schedules and keyed overrides ED cells, AO3 re-covers the keyed overrides P and E cells with new results, AO2 and AO4 add to them, AO6 to the spend and cash / e-wallet ZD cells) | 0 |
| Changed by AP, AR and AS in the old cells (no new row or column; 37 new asks re-cover the closing Z, check Z, spend Z, closing C, rm: / to place C, budget lines O and P, keyed overrides P, `pendingMove` P, income schedules P and E, bill schedules O, filler C, refund and in / pay on a card, and `home` X cells with the reference brought up to the decisions; see the AS section below) | 0 |
| **Applicable and covered, all passing** | **367** (367 of 367) |
| Applicable and uncovered | 0 |

**Counts after V** (kept for the record): 260 cells, 93 not applicable, 2 stage 2, 165 applicable, all covered. **A note on final_review_3's numbers.** final_review_3.md says 260 cells, 171 applicable, 129 covered, 24 uncovered and sound, 18 wrong. Its own table, counted cell by cell, holds 128 c, 22 u, 17 X and 93 -, so 167 applicable; the "(X: wallet)" note on the last row is the eighteenth wrong item but not a cell of its own. This file counts the table. Wallet mode is stage 2 now (T7), so the note and the two `hand` cells are out of version one: 165 applicable cells.

## The grid

| Row | C | O | W | P | X | D | U | E | S | Z | M | Y | T | L | B | R | A | V | ED | ZD |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| open | c | c | c | c | c | - | n (u) | - | c | c | n | - | n | n | n | n | n | - | - | - |
| check | c, f (X4) | c | c | n (X) | c | n (u) | c | n (u), f (AJ1) | c | c | n | n | n | n | n | n | n | n | - | n |
| in / pay | c | c | c | c | c | c | n (X) | c, f (X8), f (AJ1) | c | n (u) | - | n | n | - | - | n | n | - | - | n |
| refund | c | - | c | n (u) | n (u) | - | - | - | c | n (u) | - | n | n | - | - | n | n | - | - | n |
| spend | c | c | c | c | n (X) | c | c | c, f (AJ1) | c | n (u) | n | n | n | n | - | c | n | n | - | n |
| transfer | c | n (u) | c | - | c | n (u) | - | - | c | c | - | - | n | - | - | n | n | - | - | n |
| repay | c | c | c | - | c | c | - | - | c | c | - | n | n | n | - | n | n | - | - | n |
| borrow | c | - | n (u) | - | - | - | - | - | c | - | - | n | n | - | - | n | n | - | - | - |
| convert | n (u) | - | - | - | c | - | - | - | n (u) | - | - | - | n | - | - | n | n | - | - | - |
| adjust | n (X) | - | - | - | - | - | - | - | - | - | - | - | n | - | - | n | n | - | - | - |
| hand / Wallet mode | s2 | - | - | s2 | - | - | - | - | - | - | - | - | - | - | - | - | s2 | - | - | - |
| move between places | n (X) | c | - | c | - | c | n (u) | - | - | c | - | - | - | n | - | n | n | - | - | - |
| filler | c | - | c | n (X) | - | - | - | - | - | - | - | - | - | - | - | n | n | - | - | - |
| skip | c | - | - | n (u) | - | c, f (AJ1) | c | - | c | - | - | n | - | - | - | n | n | - | - | - |
| set: settle | c | c | c | c | c | c, f (AJ1) | c | n (u), f (AJ1) | c | c | - | n | n | - | - | n | n | - | - | - |
| periodStart | c | - | c | n (X) | - | n (X), f (AJ1) | c | - | - | - | - | - | - | - | - | n | n | - | - | - |
| period-end answer | c | - | - | n (X) | - | c, f (AJ1) | c | n (X), f (AJ1) | c | - | n | - | - | n | - | n | n | - | - | - |
| rm: / to place | c | - | - | c | - | c, f (X5), f (AJ1) | c | - | - | c | - | - | - | - | - | n | n | - | - | - |
| closing | c | c | - | - | - | c, f (AJ1) | - | - | - | n (u) | - | - | - | - | - | n | n | - | - | - |
| income schedules, every rule | c | c | c | c | c | c | - | c, f (X8), f (AJ1) | c | c | n | n | - | n | - | c, n | n | - | n | - |
| bill / transfer / auto schedules | c | c | c | c | n (u) | c | c | c, f (AJ1) | c | n (X) | n | n | - | n | - | n | n | - | n | - |
| budget lines | n (X) | c | - | n (X) | n (X) | c | - | n (u), f (AJ1) | c | n (u) | n | n | - | n | - | n | n | - | - | - |
| goals / places | c | c | - | c | n (u) | c | c | - | - | c | n | n | - | n | - | n | n | - | - | - |
| card | c | c, f (X6), f (AB3) | c | c | c | c | c | c, f (AJ1) | c | c | n | n | n | n | n | n | n | - | - | n |
| loan / pay-later | c | c | - | - | n (u) | c, f (AJ2) | - | - | c | c | n | n | n | n | n | n | n | - | - | - |
| cash, e-wallet, wallet, investment, owedToYou | c | c | c | - | c | - | - | - | c | c | n | - | n | n | - | n | n | - | - | n |
| fee record (`fee:<transfer id>`) | - | - | c | n | c | n, f (AJ1) | c | - | c | - | - | - | - | - | - | n | n | - | - | - |
| not yet at setup (`notYet`) | n | n | n | n | n | - | - | - | n, f (AB4) | - | - | - | - | - | - | n | - | - | - | - |
| move (an old copy moved) | n | n | - | n | n | n, f (AB1) | n | n, f (AH2), f (AJ1) | n | - | n, f (AB1) | n | n | n | - | n | - | - | - | - |
| pending move (`pendingMove`) | - | - | - | n | - | n | - | - | - | - | n | - | - | n | - | n | n | - | - | - |
| frozen text (`mv:frozen:<by>`) | - | - | - | - | - | n | - | - | - | - | n | - | - | n | - | n | - | - | - | - |
| keyed overrides (`amounts`, `once`, `extraSteps`) | c, f (AH3) | - | - | c | - | n | n, f (AH3) | c, f (AJ1) | - | - | n | - | - | n | - | n | n | - | n | - |
| home (`curs`, `main`, `country`, `mode`) | - | c | - | c | c | n | n | - | - | c | c | - | - | n | - | n | n | n | - | - |
| shared `ui` (one field value per key) | - | - | - | - | - | n | c | - | - | - | n | - | - | n | - | c, n | n | n | - | - |
| `imports.cats` (one field value per shop) | - | - | - | - | - | n | n | - | - | - | n | - | - | n | - | n | n | n | - | - |
| `plan.limits` (`ceiling` with `per`, `aims`) | - | - | - | - | - | n | n | - | - | - | n | - | - | n | - | n | n | n | - | - |
| `people` (`mv:person:ui.name` when moved) | - | - | - | - | - | n | n | - | - | - | c | - | - | - | - | n | - | - | - | - |
| `checkins` (AP6: its stretch and settled ids, no filler ids) | - | - | - | - | - | n | n | - | - | - | - | - | - | - | - | n | n | - | - | - |

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
- V an offset that changes (n): offset_travel ot-01, ot-02 (a check in Tokyo and two spends from a phone flown to Honolulu: the one dated the check's day and the one dated the day before in the writer's calendar, whose Honolulu day had not ended at the check, both told after it, are taken off, AN4; before AM3 the day-before one counted as inside the check)
- C, AN4 (n): check_day_before cdb-01 to cdb-03 (receipts from yesterday and the day before, logged after this morning's check: their days ended before it, so both are inside it; re-worked by hand from AM3's results); away_clock ac-01, ac-03 (the 3,000 of the day before, logged after the check, is inside it: 292,000 and 17,000 again)
- L a second move days later (n): rules mv-98, mv-99 (the 23 Nov bank figure corrected on the phone stays 185,000 when the desktop moves on 1 Dec, AB1)
- B set up between close and payment day (n): rules ed-13 to ed-16 (the statement check setup saves: yes, no with its amount, don't know holding everything owed; not asked after the payment day, AB3; "no" with everything owed filled in, ed-19, AD6; "don't know" on a loan or pay-later is that month's usual payment, ed-20, ed-21, AD7); card_between_close_pay cbp-03, cbp-06
- ZD written into an account closed on the other device (n, applicable since AO6): rules mg-291 (a check of 3,000 typed on the phone into the e-wallet the desktop closed: reopened at the merge, with a notice), mg-292 (a check of 0: stays closed, nothing shown) (AO6)
- Z closed account, after AP1 and AR3: a check after the closing day reopens the account, a figure other than zero (closing_reopen cro-07, cro-08) and, read from AP1, a zero check (cro-09, cro-10); the closing's own check holds everything dated on or before the closing day (cro-01)

### in / pay
- C check day (c): late_pay late-08; settle_ticked tick-03
- O opening (c): setup_mid_month midmonth-03
- W posting window (c): late_pay late-01 to late-05; nearest_settle near-01 to near-04
- P period start (c): nearest_settle near-02, near-03; settle_later_stretch later-01, later-02
- X other currency (c): pay_other_currency cur-01 to cur-06; other_currency_lists ocl-01, ocl-02
- D two devices (c): rules mg-54, mg-55
- U undo/redo (n, was X): rules pe-54
- E edited after settled (n, was X; a false cover fixed by X8): period_end_fixed pef-01; rules pe-50, pe-51; a pay day change never before a settled or named pay: rules ed-01 to ed-07, pay_day_offer offer-01 to offer-03; with the ids the app really makes (a false cover fixed by AJ1): rules ed-35 to ed-39, x8_ordinary_ids x8o-01 (the look ahead refuses), x8_ordinary_ids_ok x8o-02 to x8o-04
- S imported/typed/self-logged (c): import_rules imp-02, imp-04, imp-09
- Z closed account (n, was u): closed_reopened cr-04
- Y years after setup (n): far_years fy-03, fy-10 (a pay ticked in 2036 starts the period)
- T a time with an offset (n): notyet_opening ny-04 (`set:pay@2027-06-25` ticked at a check-in, told with a time and no offset, read in the device's offset; confirm_review_2 found that kinds-01's date-only `told` on a `set:` record is one the engine never writes)
- ZD written into an account closed on the other device (n): rules mg-273 (3,000 a friend sent to an e-wallet the desktop closed meanwhile: reopened at the merge, with a notice, AN6)
- (AS7, no column of its own) money in on a card lowers what is owed and gives nothing back to a line: card_money_in cmi-01 to cmi-03

### refund
- C check day (c): card_statements stmt-02, stmt-03; line_on_card line-04, line-05
- W posting window (c): line_on_card line-06
- P period start (n, was u): grid_period_cells gpc-03
- X other currency (n, was u): grid_other_currency goc-02, goc-04
- S imported/typed/self-logged (c): mako_shape mako-27; card_out out-07
- Z closed account (n, was u): closed_reopened cr-02, cr-03
- Y years after setup (n): far_years fy-04 (a card refund in 2036)
- T a time with an offset (n): day_offset_kinds kinds-01
- ZD written into an account closed on the other device (n): rules mg-274 (a refund to the closed e-wallet reopens it, AN6)
- (AS7) a refund on a card given back to its line beside money in that is not: card_money_in cmi-01, cmi-03

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
- V an offset that changes (n): offset_travel ot-01, ot-03 (a phone flown from Tokyo to Honolulu; the spend dated the day before the check, whose Honolulu day had not ended at it, told after it, comes after it, AN4); rules mg-240 (two edits across the end of daylight saving: the later moment wins), mg-241 (a copy whose date reads a day ahead in another offset is not held), mg-242 (a half-hour offset: held at the receiver's now plus 1 ms in its own offset), mg-243 (a phone in Honolulu edits after the desktop in Tokyo and wins)
- L a second move days later (n): rules mv-82, mv-83 (a receipt removed on the phone stays removed), mv-84, mv-85 (a receipt only the desktop's later copy held is added), mv-97 (removed, then put back with an Undo, AB1, H6)
- ZD written into an account closed on the other device (n): rules mg-272 (a lunch from the e-wallet the desktop closed: reopened, with a notice), mg-277 (a receipt dated before the closing day: the account stays closed) (AN6); mg-290 (a lunch dated on the closing day: stays closed, AO6)
- Z closed account, after AP1: money out dated after the closing day reopens the account (closing_reopen cro-04 to cro-06); a spend dated on the closing day and logged after the closing is inside the closing's check (cro-01 to cro-03)

### transfer
- C check day (c): import_two_sided two-04, two-05
- O opening (n, was u): grid_period_cells gpc-01, gpc-02; places_and_checked place-01
- W posting window (c): import_two_sided two-01 to two-05
- X other currency (c): freelancer freelance-10, freelance-19
- D two devices (n, was u): rules double-10 to double-12
- S imported/typed/self-logged (c): import_two_sided two-01 to two-06; rough_transfer rough-01 to rough-06; rough_more_arrived rma-01 to rma-06; rules match-49 to match-51, match-67 to match-69
- Z closed account (c): account_closed close-03, close-04
- T a time with an offset (n): day_offset_kinds kinds-01, kinds-02
- ZD written into an account closed on the other device (n): rules mg-275 (a top-up from the bank into the closed e-wallet, its `acct2`: reopened, AN6)

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
- ZD written into an account closed on the other device (n): rules mg-276 (a payment from the bank to a card the desktop closed: reopened, AN6)

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
- (AS6) the filler's place per check-in and per account, two check-ins on one day: filler_place_checkin fpc-01, fpc-02

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
- C check day, with the removal's own `rm:<place>` move saved (P1, Q7): removed_rm_move rmm-01 to rmm-05

### closing
- C check day (c): account_closed close-03, close-04
- O opening (c): closing_write_off woff-01, woff-02
- D two devices (c): rules mg-70, mg-73
- Z closed account (n, was u): closed_reopened cr-01, cr-02
- C and Z, after AP1 and AR3 (one reopen rule in the look ahead): closing_reopen cro-01 to cro-10

### income schedules, every rule
- C check day (c): mako_shape mako-21, mako-29
- O opening (c): setup_mid_month midmonth-02
- W posting window (c): late_pay late-01 to late-06
- P period start (c): every_two_weeks biweekly-01 to biweekly-21; halves_paylater halves-01 to halves-32; weekly weekly-01 to weekly-18
- X other currency (c): pay_other_currency cur-01 to cur-04
- D two devices (c): rules mg-15, mg-28
- E edited after settled (c, a false cover fixed by X8): pay_day_moves move-01 to move-04; rules ed-01 to ed-07; pay_day_offer offer-01 to offer-03; with ordinary ids (a false cover fixed by AJ1): rules ed-35 to ed-39, x8o-01 to x8o-04; a future one-off amount in the way, offered to move or remove (AJ5): rules ed-40 to ed-44; moved to the new rule's first occurrence in the same month (AK2): ed-45 to ed-47; a budget line's or share's `once` key named by the pay offered too (AK3): ed-06, ed-29, ed-39 (re-worked), ed-48 to ed-51
- S imported/typed/self-logged (c): import_rules imp-08, imp-09
- Z closed account (c): close_main_bank cmb-05; rules acc-18, acc-19
- M the move run on two devices (n): rules mg-84 (`mv:pay:steps.a`); moved pay `per: 'month'` with a one-month amount spread over the month's pays (AB2, AC1): rules mv-87, mv-88
- Y years after setup (n): far_years fy-11
- L a second move days later (n): rules mv-82, mv-83 (the pay day answered on the phone keeps its rule, AB1)
- ED edited after settled on two devices (n): rules mg-268 (confirm_review_7 s2: the pay day changed to the 25th "from 1 Dec" on the offline phone after the desktop ticked the 10 Dec pay; after the merge the change starts 11 Dec, a new `at`, the phone's notice), mg-269 (the desktop writes the same move, no notice), mg-270 (nothing settled in the way: left as it is) (AN2); mg-288 (a 300,000 bonus that moved with the change goes back to the settled 10 Dec pay when the change moves: one bonus counted, AO1); x8_ordinary_ids_ok x8o-02 to x8o-04 (the copy that results is worked out: the 25 Dec pay next)
- P and E, a pay rule changing mid-year and the amounts per period it gives (P4, R2): pay_rule_change_units prc-01; a 26-pay and a 27-pay year (H9, N3): units_27_pays u27-01 to u27-03

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
- ED edited after settled on two devices (n): rules mg-287 (the rent day changed to the 5th on the offline phone after the desktop ticked the 27 Dec rent: the change starts 28 Dec, with a notice, AN2)
- O opening, `count` from the first occurrence, before setup and across a change of day (AS10): count_first cnt-01, cnt-02

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
- P period start, amounts per period by the units rules in the walk: units_27_pays u27-01 to u27-03; weekly_line wl-01, wl-02; pay_rule_change_units prc-01; no fixed pay by day and by week from the line's `from` (M9, M10, N4, AS9): no_fixed_pay_by_day nfd-01, nfd-02
- O opening, the share by days left of the opening period's own amount: units_27_pays u27-01; pay_rule_change_units prc-01
- P period start, `once` keys this period and later, a removed key: once_keys ok-01 to ok-04

### goals / places
- C check day (c): mako_shape mako-02
- O opening (c): split_auto_est split-03
- P period start (c): yearly_and_places year-04; to_place tp-05
- X other currency (n, was u): grid_other_currency goc-05, goc-06
- D two devices (c): rules mg-68; mg-172 to mg-175 (an entry list a later build adds, `milestones`, merged entry by entry, kept removed, either order; an array that is not an entry list taken whole, AI2)
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
- ZD written into an account closed on the other device (n): rules mg-276 (the card closed on the desktop, a payment to it logged on the phone: reopened, AN6)

### loan / pay-later
- C check day (c): borrow_and_plans plan-03
- O opening (c): loans_and_carried loan-01
- X other currency (n, was u): grid_other_currency goc-06; paid from an account in another currency (V2): loan_other_currency lfx-01 to lfx-07
- D two devices (c, a false cover fixed by AJ2: mg-06 is a union of two unrelated spends; `plans` was taken whole from the newer record): rules mg-190 (two plans added on two devices both stay, 8,000 due on 5 Dec; confirm_review_5 h2), mg-191 (either order), mg-192 (an empty `plans` on the newer copy), mg-193 (a plan edited on one device, the account renamed on the other), mg-194 (a removed plan stays removed), mg-195 (restored plan by plan)
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
- ZD written into an account closed on the other device (n): rules mg-272 to mg-275 (a spend, money in, a refund and a top-up into an e-wallet the desktop closed: reopened, with a notice), mg-277 (dated before the closing: stays closed) (AN6); mg-290 (dated on the closing day: stays closed), mg-291 and mg-292 (a check of 3,000 reopens it, a check of 0 does not) (AO6)

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
- E edited after settled (n, a false cover fixed by AH2: it was marked not applicable "as any, ed-01 to ed-07", but the occurrence-name reader did not take `mv:` ids): a moved schedule's change is refused on or before its latest settled or named occurrence, rules ed-25 (an `amounts` key), ed-26 (a settled moved pay), ed-27 (`pe:mv:...`), ed-28 (`ps:mv:...`), ed-29 (a `once` key), ed-30 (another schedule's occurrences do not count), ed-31 (a `pe:` on a moved place); the reviewer's g4
- not applicable: B (the move sets up no card statement: a moved card or debt has its close day "not sure", Y9); W (the move writes no import line, so no posting window); Z (38.31 has no closed accounts); A (moved records carry the copy's last save as `at`, never the clock, AA10, AB1; what a moved copy waits for is in the `pendingMove` row)

### pending move (`pendingMove`) (a new row: confirm_review_2 found it missing)
- P period start (n): rules mv-52, mv-89 (a month-end answer waits for a period not ended at the move, AB2); mv-71, mv-72 (what waits is keyed by the period's pay once its day is answered)
- D two devices (n): rules mv-95 (one device answers, the other has not: the written entries are `gone` with the answer's `at`, the other's live copy gives way), mv-96 (both answer: one draw, one answer, AB rows)
- M the move run on two devices (n): rules mv-95, mv-96
- L a second move days later (n): rules mv-98, mv-99 (November's answer waits on both and is one record; the phone kept its entries for what it wrote at its move marked `gone`, so the desktop's waiting copies of them are dropped, AD5); a waiting entry applied later, once, its records and keys judged by their own `at`: mv-106 to mv-110 (AE2; AD5's first sentence withdrawn)
- R restore (n): rules mg-111 (what waited at the backup waits again); mv-117, mv-118 (answered again after the restore: written with the D4 clock, the key wins, AG1), mg-120 (and wins at the merge)
- (AC2, no column of its own) a loan receipt waiting for the loan question: rules mv-91 to mv-93
- not applicable: C, O, W, X, U, E, S, Z, Y, T, B (an entry holds a 38.31 amount or answer waiting for a day; it moves no account and is in the home currency)
- P period start, a `once` amount waiting for add or replace counted on the safe side (AR1, AS8): once_keys ok-01, ok-03

### frozen text (`mv:frozen:<by>`) (a new row: confirm_review_2 found `frozen3831` missing)
- D two devices (n): rules mv-86 (two different 38.31 copies: both kept, one record per device, AB1)
- M the move run on two devices (n): rules mv-86
- L a second move days later (n): rules mv-82, mv-83 (`mv:frozen:phn001` and `mv:frozen:dsk001` both kept, cloud on and off), mv-98, mv-99
- not applicable: every other column (read only; never written again after the move, O)

### keyed overrides (`amounts`, `once`, `extraSteps`) (a new row: confirm_review_3 found it missing)
- C check day (c, a near miss fixed by AH3: the asks held plain numbers): one_occurrence_amount amt-01 to amt-05 and loan_one_month_amount loma-01 to loma-03, now in the AE1 shape (an occurrence's own amount on the check-in list and in safe to spend); keyed_removed kr-03, kr-05 (a removed key and a key put back with Redo on their check days)
- P period start (c): rules units-75 to units-77 (a `once` keyed by the pay that starts the period, T1; in the AE1 shape since AH3), units-85 (a removed `once` key gives the usual amount); keyed_removed kr-02 (January's removed 0 key: the walk across the period start counts the 250,000 pay); mv-88 (spread over the periods starting in the month); mv-119, mv-120 (weekly: five and four periods, the five-pay month noted, AG2)
- D two devices (n): rules mg-100 (December pay 0 survives a rename), mg-101 (two Food keys), mg-102 (two `extraSteps` entries), mg-103 (the same key: the newer; a removed key stays removed), mg-104 (`plan.shares` keys), mg-106 (same `at`: removed wins, then the larger `by`), mg-108 (a key held on arrival, its own mark); the reviewer's e1
- U undo/redo (n, a false cover fixed by AH3: mg-105 tested only the merge, and no reader skipped a removed key): rules mg-105 (a key removed and put back wins over the removal at the merge); keyed_removed kr-01 (an undone key not read), kr-04, kr-05 (a key put back with Redo read again), kr-06 (a removed key); rules units-85, units-86 (`once`); X8: ed-32 (a removed key names nothing; the reviewer's g3), ed-33, ed-34 (Redo counts again); keyed_removed_x8 krx-01, krx-02 (the look ahead's own X8 check)
- E edited after settled (c, a false cover fixed by AJ1 for keys on a schedule the person typed): rules ed-04 (an `amounts` key is a named occurrence, X8), ed-06 (a `once` key), both in the AE1 shape since AH3; ed-25, ed-29 (keys on a moved pay, AH2); ed-32 to ed-34 (removed keys, AH3); ed-39 (a `once` key with an ordinary id); a one-off amount in the way is offered to move or remove (AJ5): ed-04, ed-25, ed-34 (re-worked), ed-40 to ed-44; a `once` key the same (AK3): ed-06, ed-29, ed-39 (re-worked), ed-48 to ed-51; where "move" takes them (AK2): ed-45 to ed-49
- P, E, AN5 (n): moved_together mt-01 to mt-03 (two moved amounts on one pay and on one bill, add or replace not picked: each occurrence's own amount is written and counted, the one carried over waits in `pendingMove` and counts nowhere; the safe-to-spend walk crosses the 8 Jan period start); moved_together_picked mtp-01 to mtp-03 (after picking add: the sums); rules ed-60 to ed-63 (what is saved before and after the pick)
- M the move run on two devices (n): rules mg-107 (the phone answers the pay day and writes the waiting key; the desktop's rename keeps it), mg-117 (a key edited after one device applied the entry wins over the other's later apply)
- L a second move days later (n): rules mv-116 (a key edited on the phone survives the desktop moving the same copy days later)
- R restore (n): rules mg-111 (the key an answer wrote, removed by the restore), mg-113 (each key and `extraSteps` entry, key by key; the merge keeps it); mv-117, mv-118, mg-120 (the key written again after the restore wins, AG1)
- not applicable: O, W, X, S, Z, Y, T, B (a keyed override is typed or moved, in its record's currency, on no account of its own, and is no opening, import or statement)
- ED edited after settled on two devices (n): rules mg-271 (a bonus key moved away on the phone (AL6) and raised on the desktop: live again at the merge, an orphan; the change moves to the day after it, with a notice, AN2; the moved copy on 10 Jan is removed, so one bonus counts, 450,000, AO1), mg-288 (the bonus moved back to the settled pay, AO1), mg-289 (a Food `once` key moved with the change and raised on the desktop: the moved copy removed, AO1)
- P, E, AO2 to AO4 (n): moved_together mt-01 (95,000) and mt-02 (125,000) re-worked by hand: the two `pendingMove` entries are in the file, and until the pick a waiting bill amount counts at the larger (the 5 Jan rent 95,000) while a waiting pay amount adds nothing (mt-03, 150,000; AO3); rules ed-64 (two rent amounts onto an empty 5 Jan: January's is its own, AO2), ed-65 to ed-68 (a budget line's and a share's `once` keys wait in `pendingMove` and are added on the pick, AO4)
- P period start, `once` on a budget line and on a share in the look ahead, a removed key not read (B8, T1, AE1, AO4, AR1): once_keys ok-01 to ok-04

### home (`curs`, `main`, `country`, `mode`) (a new row: confirm_review_5 found it missing, AJ3; field by field since AK1; field values and `main` one field since AL1 and AL3)
- O opening (c): rules ed-17, ed-18 (the minimum asked once at setup, in the home currency); units-60 (the first `curs` entry, from setup)
- P period start (c): home_currency_dated cur-04 (Free to spend after the change, in pesos)
- X other currency (c): home_currency_dated cur-01 to cur-05 (history stays in yen); rules units-60 to units-62 (the entry in force on a day)
- D two devices (n): rules mg-16 (re-worked by hand for AK1: the same field on two devices, the newer `at` of that field); mg-197 (pesos added on the phone, the country set on the desktop: both stay, `curs` by `from`; confirm_review_5 h2), mg-198 (re-worked by hand for AK1: the minimum on the phone and the main bank on the desktop, both kept), mg-199 (two entries from the same day: the newer), mg-200 (a field and an entry more than a day ahead held, the field's mark in `home.held`), mg-210 (three fields on two devices, each by its own `at`), mg-211 (either order the same, a tie on `at` settled by `by`)
- U undo/redo (n): rules mg-201 (an entry taken back with Undo stays removed), mg-202 (Redo wins over the Undo), mg-203 (the minimum's Undo is an edit back with a new `at` for that field)
- Z closed account (c): rules acc-17 to acc-22 (closing the main bank moves the bank in `home.main`); close_main_bank cmb-01 to cmb-05
- M the move run on two devices (c): rules mv-09, mv-10, mv-100 to mv-102, mv-114, mv-115 (the minimum at the move), mv-24, mv-25 (the currency)
- L a second move days later (n): rules mv-123, mv-124 (the minimum set on the phone after its move stays, the cloud on and off, AB1; each field and the yen entry stamped with the copy's last save, AK1)
- R restore (n): rules mg-204 (the backup's fields back, each with its own new `at`, its entries stamped, an entry added since removed), mg-205 (kept at the merge with the cloud, either way round), mg-212 (a minimum set on another device after the restore stays, the restored fields too, AK1)
- A used again after days away (n): rules mg-206 (an entry added on the desktop, the minimum after 23 days and the main bank after 45 days on the phone, each field with its own `at`; the main bank written with its minimum as one field since AL3)
- D, AL3 (n): rules mg-198, mg-211, mg-212 (re-worked by hand: the main bank and its minimum one field, the newer pair wins whole), mg-215 (the bank changed on the desktop, then the minimum on the phone that had not seen it: the phone's pair wins), mg-216 (held on arrival, k3), mg-217 (restored, k3), mg-226 (the minimum raised after seeing a fast desktop's new bank, AL2)
- D, AM2 (n): rules mg-253 (the minimum on the phone, the main bank on the desktop, before a sync: the desktop's newer pair wins and the phone records "Your other device changed this. Check it."), mg-254 (the desktop, whose pair won, records nothing), mg-255 (a plain sync, only one device changed it: nothing), mg-256 (mg-215's story: the desktop's bank change undone, the desktop records the notice)
- V an offset that changes (n): rules mg-250 (a phone in India, +05:30, a little behind, writes `main` 1 ms after what it has seen, in its own offset); mg-228 (what a device has seen reads `home` among others, as moments)
- not applicable: C (a check-in writes no `home` field), W, S (never imported or posted), E (nothing in it is settled), Y (the entry in force is read by its date, as in X and P), T (`curs` entries are days, with no time), B (no statement)
- D, AN1 and AN-note (n): rules mg-257 (confirm_review_7 s1: a plain field in `home` on both copies, merged key by key, the same both ways), mg-258 (the plain field differs: the keyed rule), mg-259 (a `home` holding only `curs`); mg-264 (the country changed on both: the phone, whose change lost, records the notice), mg-265 (a `curs` entry), mg-267 (a plain sync records nothing)
- (AO5, no column of its own) another account becomes the main bank: rules ed-69 (its own 5,000 moves into `home.main`, the old main bank's 20,000 does not follow, a notice), ed-70 (no minimum of its own: none), ed-71 (the old main bank had none: no notice) (question `main_change`)
- X other currency, the main bank's minimum in another currency asked about (AS11): main_min_currency mmc-01; in its own currency: main_min_same mms-01, mms-02

### shared `ui` (one field value per key) (a new row: confirm_review_6 found it had none, AL1)
- D two devices (n): rules mg-31, mg-41 (re-worked to field values: each key by its own `at`, then `by`), mg-213 (a key changed after seeing a fast desktop's change wins, k1, AL2), mg-230, mg-231 (merged either way round, ties)
- U undo/redo (c): rules mg-116 (re-worked: a removed key wins on the same `at`; Undo put back newer wins)
- M the move run on two devices (n): rules mv-125 (the stored move writes each key as a field value; the desktop takes the cloud's)
- L a second move days later (n): rules mv-126, mv-127 (a screen answer changed on the phone after its move stays, the cloud on and off)
- R restore (c, n): rules mg-98, mg-99, mg-114, mg-115 (re-worked: the backup's keys with a new stamp, a key not in it removed); mg-214 (the restore stamped after a fast desktop's key it has seen, k1, AL2)
- A used again after days away (n): rules mg-246 (a key changed on the desktop meanwhile, another on the phone after 23 days)
- V an offset that changes (n): rules mg-249 (a phone flown to Honolulu sets a key after the desktop in Tokyo: the later moment wins); mg-228 (a key written in New York read as a moment); held on arrival: mg-47, mg-171 (re-worked: the mark inside the field value)
- not applicable: C, O, W, P, X, E, S, Z, Y, T, B (no rule of the reference reads a screen answer)
- D, AN-note (n): rules mg-265 (a key the phone's own change won: no notice), mg-266 (a key changed on both, the phone's lost: the notice)

### `imports.cats` (one field value per shop) (a new row: confirm_review_6 found it missing, AL4)
- D two devices (n): rules mg-218 (two devices each teach one shop: both kept, k2), mg-220 (a lesson from a clock 3 days fast held on its own), mg-225 (a lesson corrected after seeing a fast desktop's, AL2), mg-230, mg-231 (a lesson removed on one side wins the tie)
- U undo/redo (n): rules mg-244 (a lesson taken back with Undo stays removed on the desktop that still held it)
- M the move run on two devices (n): rules mv-125 (each shop stored as a field value); mv-28 (the move's plain view)
- L a second move days later (n): rules mv-126, mv-127 (a lesson taught on the phone after its move stays)
- R restore (n): rules mg-222 (the backup's category with a new stamp; a lesson learned since removed)
- A used again after days away (n): rules mg-247 (a lesson taught on the desktop meanwhile stays when the phone corrects another after 23 days)
- V an offset that changes (n): rules mg-252 (a lesson corrected on a phone flown to Honolulu after the desktop in Tokyo); mg-227 (what a device has seen reads a lesson two levels down)
- not applicable: C, O, W, P, X, E, Z, Y, T, B; S (the category is read by the statement reader, which the reference does not model: matching_ref meets imports only with typed lines)
- D, AN1 and AN7 (n): rules mg-260 (an empty `cats` and a `files` list on both copies), mg-261 (empty on one copy, a lesson on the other), mg-283 (a reader's newer guess never replaces the person's lesson), mg-284 (a shop read as "__proto__", key `k:__proto__`, kept)
- (AN7, no column of its own) the shop key form: rules mg-282; a guess never writes over a lesson, a lesson over a guess: mg-285; never trimmed, a 401st shop kept: mg-286; 38.31 keys lowercased at the move: mv-28, mv-125 to mv-127 (M and L re-worked)
- (AO7, no column of its own) two 38.31 shop keys that become one at the move: rules mv-128 (the later kept, the join listed in `catsJoined`), mv-129 (no join)

### `plan.limits` (`ceiling` with `per`, `aims`) (a new row: confirm_review_6 found it missing, AL1, AL5)
- D two devices (n): rules mg-219 (the aims on the phone and the ceiling on the desktop: both kept, k2), mg-221 (a ceiling from a clock 3 days fast held), mg-224 (the ceiling changed back after seeing a fast desktop's, AL2), mg-233 (a weekly ceiling beats an earlier monthly one, amount and `per` together, AL5)
- U undo/redo (n): rules mg-245 (the ceiling taken back with Undo wins; the aims changed meanwhile on the desktop stay)
- M the move run on two devices (n): rules mv-125 (stored as field values, `ceiling` with `per: 'month'`); mv-11 (the move's plain view, AL5)
- L a second move days later (n): rules mv-126, mv-127 (the ceiling lowered on the phone after its move stays)
- R restore (n): rules mg-223 (the backup's ceiling with a new stamp; aims set since removed)
- A used again after days away (n): rules mg-248 (aims set on the desktop meanwhile stay when the phone sets the ceiling after 68 days, D8 asked first)
- V an offset that changes (n): rules mg-251 (daylight saving ends on the laptop between two changes; the later moment beats a phone in Tokyo)
- not applicable: C, O, W, P, X, E, S, Z, Y, T, B (no rule of the reference reads the ceiling or the aims yet; a screen that does must read `per`, confirm_review_6 WATCH)
- D, AN1 and AN-note (n): rules mg-262 (`plan` with a plain field on both copies, merged key by key, the same both ways), mg-266 (the ceiling changed on both, the phone's lost: the notice)

### `people` (a new row: confirm_review_7 found it missing, AN6)
- D two devices (n): rules mg-278 (a person renamed on both devices, the newer name wins; a person added on each, both stay; `told` the earliest)
- U undo/redo (n): rules mg-279 (an Undo of adding a person, newer than a rename on the other device, wins), mg-280 (Redo after the Undo reached the other device: back on both)
- R restore (n): rules mg-281 (a person added after the backup removed by `gone` with the restore's stamp; the backup's person takes the stamp)
- M the move run on two devices (c): rules mv-27 (`ui.name` becomes `people[0]`, `mv:person:ui.name`), mv-67 (two devices moving the same copy make one person)
- not applicable: C, O, W, P, X, E, S, Z, Y, T, L, B, A, V, ED, ZD (AN6 names D, U, R and M: no money rule reads `owner` yet, a person is typed, never imported, and holds no amount; a second move days later is the move row's own L cell)

### `checkins` (a new row: confirm_review_8 found it missing, AP6)
- D two devices (n): rules sy-47 (a check-in on each device, both kept), sy-48 (one check-in changed two ways: asked, both kept); the fuzz (check-ins on both devices, 5,000 seeds)
- U undo/redo (n): rules sy-49 (a check-in undone on one device stands)
- R restore (n): rules sy-60 (a check-in newer than the backup removed by the restore, on both devices)
- A used again after days away (n): rules sy-61 (a desktop three weeks behind with its own check-in: both kept)
- not applicable: C, O, W, P, X, E, S, Z, M, Y, T, L, B, V, ED, ZD (a check-in is the moment itself; its checks and settles are the check and `set:` rows; 38.31 has no check-in record to move)

### ordinary ids (AJ1): the E column and the built-id D cells (false covers confirm_review_5 found)
Every test named schedules, places and accounts with short made-up ids, and the readers of built ids and occurrence names took only those, so every E cell and every built-id D cell held only for ids the app never makes. The realistic-ids check (`foundation_review/realistic_ids.js`) now runs every ask and case again with each short made-up id rewritten to the ordinary form, `<6 letters>-<10 chars>-<n>`, the same way within each file, inside built ids too; both runners run it every time, and a failure there fails the run. On top of it:
- E, every applicable row (check, in / pay, spend, set: settle, period-end answer, income, bill, budget lines, card, move, keyed overrides): the realistic-ids run; X8 with ordinary ids: rules ed-35 to ed-39 (a settle, another schedule whose id begins the same, `pe:` and `ps:` with an ordinary place, a `once` key), x8_ordinary_ids x8o-01 (the look ahead's own check refuses), x8o-02 to x8o-04 (the offered day taken)
- D, every row of a record with a built id (skip, set: settle, periodStart, period-end answer, rm: / to place, closing, fee record): the realistic-ids run; rules mg-177 to mg-187 (`set:`, `auto:`, `skip:`, `pe:` with `free` and with an ordinary place, `ps:`, `rm:`, `close:`, `close:<account>:2`, `fee:set:`, a moved pay with an ordinary place are ids), mg-188, mg-189 (a settlement with no occurrence, capitals: not ids)
- Rules files whose ids are left as they are: `rules/move.json` (the ids a moved copy really has, `mv:...`, and the 38.31 copies' own) and `scenarios/moved_ids.json` (moved ids only)

### restore (R) (a new column: confirm_review_3 found only mg-96 and mg-97)
Every row's R cell, with the case that covers it (all in `rules/merge.json`; each restores a backup and, where named, merges with the cloud copy either way round):
- open: mg-118 (the moved opening), mg-119 (an opening with `notYet`). check: mg-118. in / pay: mg-110 (`set:pay@2026-11-25`), mg-119. refund: mg-119. spend (c): mg-96, mg-97; mg-112 (a held mark), mg-118 (a moved receipt).
- transfer, repay, borrow, convert, adjust: mg-119. move between places: mg-110 (`mv:draw:once.2027-01`), mg-119 (a move and `rm:trip`). filler, skip (`skip:`), periodStart (`ps:`): mg-119. set: settle: mg-110. period-end answer (`pe:`): mg-110. rm: / to place, closing (`close:`): mg-119.
- income schedules (c, n): mg-96, mg-97 (steps); mg-109 (the D4 clock), mg-111 (`rules` and `amounts`), mg-113, mg-118. bill schedules: mg-119. budget lines: mg-113. goals / places: mg-119; mg-176 (an entry list a later build adds, restored entry by entry, AI2). card, cash and e-wallet: mg-119. loan / pay-later: mg-113 (`extraSteps`); mg-195 (`plans`, plan by plan, AJ2). home: mg-204, mg-205 (AJ3).
- fee record (`fee:`): mg-119. not yet at setup: mg-119. move: mg-118 (a 38.31-format backup restored after the move, moved and stamped with the restore). `pendingMove`, frozen: mg-111; `pendingMove` answered again after it: mv-117, mv-118, mg-120 (AG1). keyed overrides: mg-111, mg-113, mg-120. Shared `ui` keys (no row of their own): mg-98, mg-99, mg-114 to mg-116.
- not applicable: hand / Wallet mode (stage 2, T7).

### used again after days away (A) (a new column: confirm_review_4 found none)
Every row's A cell. Each row has one story in `rules/merge.json` (mg-140 to mg-167): the phone, last used Sun 1 Nov 21:00, makes the record two days later (3 Nov 09:00), edits it after 21 days away (24 Nov 12:00) and after 45 days away (Fri 8 Jan 2027 12:00, D8 asking the date first), against desktop edits made meanwhile; the desktop ends with the phone's last value at 8 Jan 12:00 and `told` 3 Nov 09:00 [AH1]. All 28 failed first (before AH1 every phone write was held at 1 Nov 21:00 plus a few ms).
- open: mg-140. check: mg-141; mg-132 (a desktop check reaches a phone back after three weeks unchanged); mg-168, mg-169 (a tablet check at 09:00 kept, the fast spend held after it, AI1); away_clock ac-01 to ac-03 (a spend typed after the check that day is counted). in / pay: mg-142. refund: mg-143. spend: mg-144; mg-128 (three writes after three weeks), mg-129, mg-130 (the 22 Nov correction beats the 10 Nov desktop edit, on both), mg-131 (`told` after a 09:00 check), mg-133 (copies up to a day ahead of the phone's now taken as they are); mg-168, mg-169 (a desktop spend two days fast held at the phone's now plus 1 ms, `told` too, so the 09:00 check that day still counts it, AI1), mg-170 (the fast desktop takes the held value back); away_clock ac-01 to ac-03.
- transfer: mg-145. repay: mg-146. borrow: mg-147. convert: mg-148. adjust: mg-149. move between places: mg-150. filler: mg-151. skip (`skip:`): mg-152. set: settle (`set:`): mg-153. periodStart (`ps:`): mg-154. period-end answer (`pe:`): mg-155. rm: / to place (`rm:`): mg-156. closing (`close:`): mg-157.
- income schedules: mg-158. bill schedules: mg-159. budget lines (`plan.budgets`): mg-160. goals / places: mg-161. card: mg-162. loan / pay-later: mg-163. cash and the other accounts: mg-164. fee record (`fee:`): mg-165. `pendingMove`: mg-166. keyed overrides (a key and its record from the same clock): mg-167. home: mg-206 (AJ3). Held values (AJ4, AJ-confirm): mg-207 (a far-ahead edit held at the receiver's now plus 1 ms loses to an earlier slightly fast one), mg-208, mg-209 (two devices holding one far-ahead copy settle on the newer held `at` and the earliest `told`; the fast device ends the same).
- The clock itself, for every row: mg-33, mg-34 (2 days), mg-121 (21 days), mg-122 (45 days: D8 asks), mg-123, mg-124 (40 and 41 days), mg-125 to mg-127 (D8 one and two days back, two days ahead), mg-96 to mg-99 and mg-109 (a restore after days away, natural inputs); mg-171 (a new device that has seen nothing holds a copy more than a day ahead of its own now, at that now plus 1 ms, AI1).
- not applicable: not yet at setup (written once, at setup, on the opening check: the open and check rows hold it); move (moved records carry the copy's last save, never the clock, AA10); frozen text (read only, never written again). Stage 2: hand / Wallet mode (T7).

### offset that changes (V) (a new column: confirm_review_6 found 6 times at -05:00, none at a half hour, none changing)
- check: offset_travel ot-01, ot-02 (re-worked for AM3, re-worded for AN4). spend: offset_travel ot-01, ot-03; rules mg-240 to mg-243. home: mg-250. shared `ui`: mg-249. `imports.cats`: mg-252. `plan.limits`: mg-251.
- The clock itself, for every row: rules mg-236 (a phone flown to Honolulu writes its own now, later as a moment), mg-237 (+05:30: 1 ms after what it has seen, in its own offset), mg-238 (flying east to west goes back a calendar day: D8 does not ask), mg-239 (daylight saving ends: 01:10 after is later than 01:50 before), mg-228 (what a device has seen, compared as moments).
- not applicable: every other row (its records are stamped, held and merged by the same moment code the clock cases cover; their effect does not depend on how a time is ordered against a check). Stage 2: hand / Wallet mode.

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

Questions AD does not answer (no case depends on them; `rules/*.json` `open`): mv-q55 (AD1: a 38.31 copy saved from 20 Nov on whose minimum an earlier build filled in looks typed), ed-q3 (AD6 on a loan or pay-later answered "no"), mg-q13 (AD8: a `ui` key set after the backup comes back at the merge). AF answers all three (below).

## Decisions AE and AF, and where each part is tested

Run first, before the references changed (task 1): rules 471 of 514 cases (43 failed: 9 edits, 16 merge, 18 move) and scenarios 698 of 698 asks (the 6 new asks of card_auto_debit passed in the model as it was: AE6 changes what the answer means, not the model). The reviewer's e1 and e2 failed as she reported (December's 0, one Food override and the January extra lost; AD5 skipping both January entries). After the changes to `rules/merge_ref.js`, `rules/move_ref.js` and `rules/edits_ref.js` (task 2): 514 of 514 cases, 698 of 698 asks, and e1 and e2, rewritten to run on this worktree in the new shape, print the expected values. Task 3 added mg-119 and mv-116 for the new cells (both passed first on the changed references): 516 of 516.

| Part | Asks or cases | Failed first |
|---|---|---|
| AE1: keyed overrides per key `at`, `by`, `gone`, merged key by key; the row "keyed overrides" | rules mg-100 to mg-108, mg-113, mg-117, mv-116; the move's keys `{ amount }` in mv-33, mv-46, mv-72, mv-73, mv-87, mv-88, mv-94, mv-104, mv-105 (re-worked) | mg-100 to mg-104, mg-106, mg-107, mg-117 (the newer record won the map whole; mg-107: the desktop with no `rules` list dropped the phone's pay day answer too); the nine re-worked move cases (plain numbers). mg-105 and mg-108 passed first (the record that won held the key) |
| AE2: AD5's first sentence withdrawn; an entry applied once; keys judged by their own `at` | rules mv-109 (e2), mv-110; mv-106 to mv-108 reworded (same results); mg-107, mg-117 | mv-109 (nothing written: both records newer; `once` and `shares` not written at all), mv-110 |
| AE3: `per` on bill schedules | rules mv-104, mv-105 (AD4), mv-111 (answered later) | mv-111 (only the `{ amount }` shape and the missing note; the spread already held) |
| AE4: the three-pay note | rules mv-111 to mv-113 | all three (no `threePays`) |
| AE5: restore with `nextAt`, built ids, `pendingMove`, frozen, held marks, keyed overrides, a 38.31-format backup | rules mg-109 to mg-113, mg-118, mg-119 | mg-109 (the desktop's 1,500 came back), mg-111 (the `amounts` key left), mg-112 (the fast device's 5,000 won), mg-113 (keys and the extra left), mg-118 (the 38.31 backup not moved). mg-110 passed first (built ids are ids like any other); mg-119 was written for the new column |
| AE6: "Has your last card statement already left your bank?", automatic debits not yet | card_auto_debit cad-01 to cad-06; rules ed-13 to ed-15, ed-19 to ed-21 (re-worked), ed-24 | the seven statement cases (no question named); the asks passed first |
| AF1 (mv-q55): a minimum whose origin cannot be told is asked with the old figure | rules mv-09, mv-102 (re-worked), mv-114, mv-115 | all four (kept as typed, not asked) |
| AF2 (ed-q3): "no" on a loan or pay-later filled with the usual payment | rules ed-22, ed-23 | both (no box filled; ed-22 saved no amount) |
| AF3 (mg-q13): `gone` per `ui` key; a restore removes keys not in the backup | rules mg-114 to mg-116 | all three (the key came back; mg-116: `gone` read as a ui key) |
| mg-109's input names the device's `lastSeen`: the D4 clock holds a now more than a day past the newest `at` seen [L merge q8], so the restore uses the device's own, not the copy's newest | rules mg-109 | (an input fix after the first run; mg-96 to mg-99 would otherwise have been held at 18 Nov) |

Questions AE and AF do not answer (no case depends on them; `rules/move.json` `open`): mv-q56 (a backup restored after its waiting entry was applied: answering the day again writes nothing, the restore's removal of the key winning on the same `at`), mv-q57 (AE4 and weekly pay's five-pay months). AG answers both (below).

## Decision AG, and where each part is tested

Run first, before the reference changed: rules 514 of 522 cases (8 failed, all move) and scenarios 698 of 698 asks (no ask added: both parts are the move's and the merge's, outside the model). After the change to `rules/move_ref.js`: 522 of 522 cases, 698 of 698 asks.

| Part | Asks or cases | Failed first |
|---|---|---|
| AG1 (mv-q56): every write made now uses the D4 clock; a waiting entry a restore brought back, answered again, writes strictly newer than the restore | rules mv-117 (answered at 10:00 after the 09:00 restore), mv-118 (the clock behind the restore: 09:00:00.001), mg-120 (the merge with the cloud copy holding the removal) | mv-117, mv-118 (the key kept the restore's `at` and stayed removed; mv-118 also stamped the answer 08:50, older than the restore). mg-120 passed first: the merge already takes the newer key once it is written |
| AG2 (mv-q57): the note for any month with more pays than usual; the list `morePays` | rules mv-119 (weekly, five pays in January: pay, Food and Free to spend noted), mv-120 (weekly, four pays in February: none), mv-121 (a bill answered weekly, five payments in April); mv-111 to mv-113 re-worked for the name | mv-119 to mv-121 (no note: only three counted; the spreads already held), mv-111 to mv-113 (the old name only) |
| AG: the AE and AF helper's readings confirmed | (as in "Decisions AE and AF") | none (already so) |

Questions AG does not answer: none is open in `rules/*.json`. One reading to confirm (SCHEMA_V3 section 14): AG1 is read to reach what an entry writes only when a restore brought the entry back; read for every entry, mg-117's edited 120,000 would lose to a stale 0 applied later on the other device.

## Decision AH, and where each part is tested

Run first, before the references changed (task 1): rules 516 of 582 cases (66 failed: 54 merge, 8 edits, 4 units) and scenarios 695 of 709 asks (14 failed); `check_specs.js` 7 problems (the `amounts` shape it checked was the old one). After the changes to `rules/merge_ref.js`, `rules/edits_ref.js`, `rules/units_ref.js`, `ref/lookahead_ref.js` and `scenarios/check_specs.js` (task 2): 582 of 582 cases, 709 of 709 asks, `check_specs.js` all good, and the reviewer's g1 to g4, rewritten to run on this worktree, print the hand answers.

| Part | Asks or cases | Failed first |
|---|---|---|
| AH1: a device's own write on its own clock, never held for a gap; D8 alone questions it; an arriving copy held only when more than a day ahead of the receiver's own now; `told` the same; natural inputs | rules mg-33, mg-34, mg-23, mg-24, mg-96 to mg-99, mg-109 (re-worked by hand), mg-121 to mg-134, mg-140 to mg-167 (the column A); every `sync` and `receive` names the receiver's now (mg-25, mg-27, mg-38, mg-39, mg-42 to mg-44, mg-46, mg-48, mg-49, mg-54, mg-108: same answers); away_clock ac-01 to ac-03 | mg-23, mg-24, mg-33, mg-34, mg-96 to mg-99 (held at 18 and 15 Nov), mg-109 (the copy's own `at`s not counted as seen), mg-121 to mg-133, mg-140 to mg-167 (all stuck at 1 Nov 21:00 plus a few ms). Passed first: mg-134 (the receiver's newest seen equal to its now), ac-01 to ac-03 (the model reads `told` as given) |
| AH2: occurrence names with `mv:` ids; X8 protects moved schedules | rules ed-25 to ed-31; the grid's move E cell | ed-25 to ed-29, ed-31 (allowed). Passed first: ed-30 (nothing to protect) |
| AH3: keyed overrides read in the AE1 shape, removed keys skipped, in the look ahead, X8 and the period amounts | keyed_removed kr-01 to kr-06; keyed_removed_x8 krx-01, krx-02; one_occurrence_amount amt-01 to amt-05 and loan_one_month_amount loma-01 to loma-03 (moved to the AE1 shape); rules ed-04, ed-06 (moved), ed-32 to ed-34, units-75 to units-77 (moved), units-85, units-86 | kr-01 to kr-06, amt-01 to amt-04, loma-01, loma-02 (an entry read as a number: nothing due or listed), krx-01, krx-02 (the model threw: X8 counted the removed key), ed-32, ed-33, units-75, units-77, units-85, units-86. Passed first: amt-05, loma-03, ed-04, ed-06, ed-34, units-76 (no key read on that day, or a live key named by its date only) |
| AH4 and AH4-confirm: AG1 withdrawn as worded; the narrow reading (only an entry a restore brought back takes the D4 clock) is the rule | rules mg-117, mv-117 to mv-121 (stand), mv-122 (g2 the other way round: a waiting 300,000 never beats a later 250,000) | none (the reference already took the narrow reading) |
| AH5: keyed maps found by shape | rules mg-135 to mg-139 (an unknown `byMonth` both ways round, its removed key, a map that is not keyed, its restore) | mg-135 to mg-137, mg-139. Passed first: mg-138 (a plain map, taken whole as before) |

Questions AH does not answer: mg-q14 (the value an arriving copy is held at, and whether a device that has seen nothing holds) and mg-q15 (entry lists found by shape too). AI answers both (below).

## Decision AI, and where each part is tested

Run first, before the reference changed: rules 584 of 591 cases (7 failed, all merge: mg-168 to mg-172, mg-174, mg-176) and scenarios 709 of 709 asks (no ask added: both parts are the merge's, outside the model); `check_specs.js` all good. After the change to `rules/merge_ref.js`, 8 older merge cases failed on the held value alone (mg-38, mg-39, mg-42 to mg-44, mg-48, mg-49, mg-108: M4's newest seen plus 1 ms) and were re-worked by hand to the receiver's now plus 1 ms, the same winners in each; mg-46's why reworded. Then 591 of 591 cases, 709 of 709 asks, `check_specs.js` all good, and `rules/merge.json` lists no open question.

| Part | Asks or cases | Failed first |
|---|---|---|
| AI1 (mg-q14): an arriving copy more than a day ahead of the receiver's own now held at that now plus 1 ms, never at the newest `at` seen; `told` the same; a device that has seen nothing holds against its own now | rules mg-168 (a phone back after three weeks, a desktop copy two days fast: the spend told at 12:00:00.001, after the 09:00 check that day), mg-169 (the same as a story on three devices), mg-170 (the fast desktop takes the held value back), mg-171 (a new phone that has seen nothing: a record and a `ui` key held); mg-38, mg-39, mg-42 to mg-44, mg-48, mg-49, mg-108 (re-worked by hand) | mg-168 to mg-170 (held at 1 Nov 21:00:00.001, three weeks before the check), mg-171 (nothing held, no warning) |
| AI2 (mg-q15): entry lists found by shape (an array whose items all carry `from` and `at`) | rules mg-172 (an unknown `milestones` list edited on two devices), mg-173 (either order), mg-174 (a removed entry stays removed), mg-175 (an array whose items carry `from` but no `at`: a plain field), mg-176 (restored entry by entry) | mg-172, mg-174, mg-176 (the list taken whole from the newer record, or from the backup). Passed first: mg-173 (taken whole the same either way), mg-175 (a plain field, as before) |
| AI: the confirmation of AH1 (a clock less than a day fast is not held, mg-24 ends at 1,500) | rules mg-24 | none (already so) |

Questions AI does not answer: none is open in `rules/*.json`. Readings to confirm are in SCHEMA_V3 section 14 ("Readings taken while writing AI down"): the held value is the receiver's now plus 1 ms even when the receiver has already seen an `at` later than its now, so a held copy can count as older than something seen before it.

## Decision AJ, and where each part is tested

Run first, before any reference changed. Task 1, the realistic-ids check alone: scenarios 709 of 709 asks, rules 578 of 591 cases (13 failed: ed-01, ed-03 to ed-06, ed-34, X8 reading no ordinary id; mg-60, mg-65 to mg-67, mg-72, mg-76, mg-78, `idOk` refusing ordinary ids; mg-119 failed on list order alone, so `run_rules.js` now compares a list of records in id order). Task 2, the new asks and cases: scenarios 712 of 713 (x8o-01), rules 609 of 634 (25 failed: ed-35, ed-38 to ed-44, mg-177 to mg-187, mg-190, mg-192 to mg-195, mg-206); the realistic-ids run 712 of 713 and 596 of 634. After the changes (`rules/ids.js`, one shared reader of ids for `rules/merge_ref.js`, `rules/edits_ref.js` and `ref/lookahead_ref.js`; entry lists by `id` in the merge and the restore; the devices and move_later harnesses writing single records; AJ5 in `rules/edits_ref.js`): 713 of 713 asks and 636 of 636 cases, and the same in the realistic-ids run. The reviewer's h1 and h2, rewritten to run on this worktree, print the hand answers. Found while writing this down: `scenarios/check_specs.js` had four readers of occurrence names of its own that took no ordinary id (5 problems on the two new files); it now uses the shared reader, and the realistic-ids run checks the rewritten scenarios with it too (all good: 115 files, 713 asks).

| Part | Asks or cases | Failed first |
|---|---|---|
| AJ1: every reader of a built id accepts ordinary ids; the permanent realistic-ids check, run by both runners | `realistic_ids.js`; rules mg-177 to mg-189 (id_ok), ed-35 to ed-39 (change_from); x8_ordinary_ids x8o-01, x8_ordinary_ids_ok x8o-02 to x8o-04 (the look ahead; a new ask kind, `refused`) | mg-177 to mg-187, ed-35, ed-38, ed-39, x8o-01; in the realistic-ids run the 13 above. Passed first: mg-188, mg-189 (refused either way), ed-36, ed-37 (nothing to protect), x8o-02 to x8o-04 (no settled pay in the way) |
| AJ2: arrays whose items carry `id` and `at` merge by `id` (pay-later `plans`); the shape judged on either copy | rules mg-190 to mg-195 | mg-190, mg-192 to mg-195 (the plans taken whole from the newer record, or from the backup). Passed first: mg-191 (taken whole the same either way) |
| AJ3: the `home` row; `home.curs` by `from` | rules mg-197 to mg-206, mv-123, mv-124 | mg-206, mv-123, mv-124 (the harnesses could not write `home`). Passed first: mg-197 to mg-205 (AI2 already found `curs` by its shape; `home` already merged as a single record) |
| AJ4: AI1's result when the receiver has already seen a slightly fast copy | rules mg-207 | none (already so) |
| AJ5: X8 offers to move or remove a future one-off amount | rules ed-40 to ed-44; ed-04, ed-25, ed-34 re-worked (their refusals now carry the offer) | ed-40 to ed-44 (ed-40 to ed-43 with ordinary ids: allowed; ed-44 too) |
| AJ-confirm: the held value (AJ4); two devices holding one far-ahead copy settle on the newer held `at` and the earliest `told`; an empty array is an entry list when the other copy's items have the shape | rules mg-207, mg-208, mg-209, mg-192, mg-196 | mg-192 (an empty `plans`). Passed first: mg-196, mg-207 to mg-209 |

Questions AJ does not answer: none is open in `rules/*.json`. For Mako's run: (1) `home` is one record, so a minimum changed on one device and the main bank on another before they sync keep only the newer (mg-198); should its fields merge one by one like the shared `ui` keys? (2) AJ5's "move": to which occurrence a one-off amount moves (the reference only offers it); (3) whether a `once` key of a budget line, named by the pay, should get the same offer (the reference offers only for the schedule's own `amounts`, ed-39).

## Decision AK, and where each part is tested

Run first, before any reference changed (the new and re-worked cases, hand-worked): scenarios 713 of 713 asks, rules 628 of 646 cases (18 failed: ed-39, ed-45 to ed-49, ed-51, mg-198, mg-200, mg-203 to mg-206, mg-210 to mg-212, mv-123, mv-124). mg-16, mg-197, mg-199, mg-201, mg-202 passed only by chance: `home` went through the single-record merge with a map for `at`, and each copy's fields happened to agree. After the AK3 change to `rules/edits_ref.js`, ed-06 and ed-29 failed too: their `once` key, alone in the way, is now offered, so they were re-worked by hand. After the changes (`rules/merge_ref.js`: a record whose `at` is a map merges, holds, restores and is edited field by field, its entry lists entry by entry, and `newestAt` reads `at` maps; `rules/move_ref.js`: the move stamps `home` field by field and stamps its `curs` entries, which carried no `at` before; `rules/edits_ref.js`: `once` keys offered and, with the new rule given, `moveTo`): 713 of 713 asks and 646 of 646 cases, and the same in the realistic-ids run.

| Part | Asks or cases | Failed first |
|---|---|---|
| AK1: `home`'s fields merge one by one, each with its own `at` and `by` | rules mg-16 and mg-198 (re-worked by hand), mg-197, mg-199 to mg-206 (the new shape), mg-210 to mg-212; mv-123, mv-124 | mg-198, mg-200, mg-203 to mg-206, mg-210 to mg-212, mv-123, mv-124. Passed first by chance: mg-16, mg-197, mg-199, mg-201, mg-202 |
| AK2: "move" takes a one-off amount to the new rule's first occurrence in the same month | rules ed-45 to ed-47 (monthly on the 10th; every other Friday, the first in the month and not the nearest), ed-48, ed-49, ed-51 | all (no reference named a day) |
| AK3: a budget line's or share's `once` key named by the pay gets the same offer | rules ed-39 (re-worked), ed-48 to ed-51; ed-06, ed-29 (re-worked after the change) | ed-39, ed-48, ed-49, ed-51; ed-06, ed-29 after the change. Passed first: ed-50 (a `pe:` in the way, only refused either way) |

Questions AK does not answer (edits.json ed-q1, the only open question in `rules/*.json`; for Mako's run): (1) when the new rule has no occurrence in the amount's month on or after the change (a new job from 15 Dec paying on the 10th, a bonus keyed 25 Dec), where does "move" take it: next month's first occurrence, or only remove? The reference gives null (only remove). (2) Two amounts or keys of one month landing on the same new occurrence (a pay twice a month changed to once): add them up, or ask? The reference maps both to it and adds nothing.

## Decision AL, and where each part is tested

Run first, before any reference changed (the new and re-worked cases and asks, hand-worked): scenarios 716 of 716 asks (the 3 new asks of offset_travel passed first: the model already orders `told` as moments and reads dates in the writer's calendar); rules 621 of 693 cases (72 failed: ed-52 to ed-55; mg-16, mg-31, mg-41, mg-47, mg-98, mg-99, mg-114 to mg-116, mg-197 to mg-200, mg-204 to mg-206, mg-210 to mg-214, mg-216 to mg-232, mg-244 to mg-252; mv-02, mv-09 to mv-11, mv-24, mv-25, mv-37, mv-45, mv-58, mv-60, mv-61, mv-100 to mv-102, mv-114, mv-115, mv-123 to mv-127). Passed first: mg-171, mg-201 to mg-203 (the old code held a field value as any `at`, or the fields happened to match), mg-215 and mg-233 (by chance: a map with no `at` of its own was kept from `mine`, which is the expected copy), mg-234 to mg-243 (ids, `people` and the clock, already compared as moments). After the references changed: all 693 and 716 pass, both with realistic ids.

| Part | Asks or cases | Failed first |
|---|---|---|
| AL1: one shape, `{ v, at, by, gone }`, for the shared `ui`, `home`, `plan.limits` and `imports.cats`; one handler for merge, hold, restore and seen; nothing checks for the name `ui` | rules mg-16, mg-31, mg-41, mg-47, mg-98, mg-99, mg-114 to mg-116, mg-171, mg-197 to mg-206, mg-210 to mg-212 (re-worked); mg-213 to mg-232, mg-244 to mg-249, mg-252; mv-125 to mv-127 | all but mg-171, mg-201 to mg-203, mg-215 |
| AL2: what a device has seen reads every `at` at any depth, field values included (k1) | rules mg-213, mg-214 (k1: edit and restore), mg-224 to mg-226, mg-227 to mg-229 (question `seen`: two levels down, a keyed override key, a `ui` key in New York, a held mark's `came` never counted) | all |
| AL3: `home.main: { v: { acct, min } }`, the main bank and its minimum one field | rules mg-198, mg-206, mg-211, mg-212 (re-worked by hand, new results), mg-215, mg-216, mg-217 (k3), mg-226, mg-250; mv-02, mv-09, mv-10, mv-24, mv-25, mv-37, mv-45, mv-58, mv-60, mv-61, mv-100 to mv-102, mv-114, mv-115, mv-123, mv-124 (the move writes `main`) | all but mg-215 |
| AL4: `imports.cats` values `{ v: <category>, at, by, gone }` (k2) | rules mg-218, mg-220, mg-222, mg-225, mg-230, mg-231, mg-244, mg-247, mg-252; mv-125 to mv-127 | all |
| AL5: `plan.limits.ceiling` carries `per` (default month) | rules mv-11 (re-worked), mg-219, mg-221, mg-223, mg-224, mg-233, mg-245, mg-248, mg-251; mv-125 to mv-127 | all but mg-233 |
| AL6: no occurrence that month on or after the change: the next occurrence; two landing on one: add or replace (ed-q1 answered) | rules ed-52 (10 Jan), ed-53 (two amounts on 10 Jan), ed-54 (twice a month to once: onto 25 Dec, which has its own), ed-55 (two `once` keys on one period) | all |
| AL7: ordinary ids lowercase; `people` carry `told` and `by` | rules mg-234, mg-189; mg-235 | none (already so) |
| AL watch: a device whose offset changes, a half-hour offset; dates in the writer's calendar | rules mg-236 to mg-243, mg-249 to mg-252; offset_travel ot-01 to ot-03 | mg-249 to mg-252 (the field-value shape, not the clock) |
| k1 to k3 (ref/confirm6_situations) | k1: mg-213, mg-214; k2: mg-218, mg-219; k3: mg-198, mg-215 to mg-217 | all |

Questions AL does not answer (for Mako's run): (1) AL6 "replace" when two moved amounts land on one occurrence and neither is that occurrence's own (ed-53, ed-55): which one stays? The reference only lists them together (`together`) and adds nothing until the person picks. (2) AL3 makes the newer pair win whole, so a main bank changed on one device and a minimum raised on another before they sync loses the bank change (mg-215); confirmed as the price of AL3, or should the screen say so? (3) The AL watch keeps dates in the writer's own calendar, so a spend dated the day before a check in another zone, told after it, counts as inside the check: the bank figure is 2,000 high until the next check (offset_travel ot-01). Is that accepted (the reviewer called it low risk), or should a check compare `told` for every event within a day of its date?

## Decision AM, and where each part is tested

Run first, before any reference changed (the new and re-worked cases and asks, hand-worked): scenarios 716 of 725 asks (9 failed: mt-01 to mt-03, the model refusing a key with `pick` and no `amount`; ot-01 to ot-03 and cdb-01 to cdb-03, the day before read as inside the check); rules 693 of 697 cases (4 failed: mg-253 to mg-256, no `main_notice` question); the spec check 2 problems (moved_together's `pick` keys not in the keyed override shape); the realistic-ids run the same. Passed first: mtp-01 to mtp-03 (a picked key is a plain key, already read). After the AM3 change to `ref/lookahead_ref.js`, away_clock ac-01 to ac-03 failed too: their 3,000 is dated the day before the check and told after it, which AM3 now takes off, so they were re-worked by hand (292,000 to 289,000; 17,000 to 20,000). After the changes (`ref/lookahead_ref.js`: a key with `pick` read as its safe side by money in or out, and the day before a check judged by `told` with O1's exceptions; `scenarios/check_specs.js`: the `pick` shape; `rules/merge_ref.js`: `mainNotice`): 725 of 725 asks and 697 of 697 cases, and the same in the realistic-ids run (spec check: all good, 119 files).

| Part | Asks or cases | Failed first |
|---|---|---|
| AM1: two moved amounts on one occurrence, not picked: the walk counts the smaller for a pay and the larger for a bill until the person picks | moved_together mt-01 (due before next pay: rent 95,000, not 70,000), mt-02 (safe to spend 125,000: pay 150,000, not 400,000; rent 95,000), mt-03 (the check-in list: pay 150,000); moved_together_picked mtp-01 to mtp-03 (add picked: rent 165,000, pay 550,000, safe to spend 235,000) | mt-01 to mt-03 (the model threw on the key). Passed first: mtp-01 to mtp-03 |
| AM2: the main bank and its minimum changed on two devices before a sync: the newer pair wins, and the other device's change is shown at the next open | rules mg-253 to mg-256 (question `main_notice`); mg-198 and mg-215 unchanged (the merge itself) | mg-253 to mg-256 |
| AM3: a check holds events dated more than a day before its day; on its day or the day before, `told` decides | offset_travel ot-01 (375,000), ot-02 (20,000), ot-03 (35,000), re-worked by hand; check_day_before cdb-01 (376,000: the day before taken off, two days before inside), cdb-02 (14,000), cdb-03 (36,000); away_clock ac-01, ac-02 (289,000), ac-03 (20,000), re-worked by hand | ot-01 to ot-03, cdb-01 to cdb-03; ac-01 to ac-03 after the change (passed first under the old rule) |

Questions AM does not answer (for Mako's run; SCHEMA_V3 section 14 has the readings to confirm): (1) AM1 names a pay and a bill: for a budget line's or share's `once` keys landing on one period (ed-55), which side is safe, the larger (more kept aside) or the smaller (more to spend)? No reference reads a `pick` on a `once` key yet. (2) AL6 "replace" with neither amount the occurrence's own (ed-53, ed-55): which one is kept stays the person's pick; the reference needs only the result. (3) AM2 names the main bank and its minimum: should other fields changed on two devices before a sync (`country`, `mode`, a `curs` entry, a shared `ui` key, `plan.limits`) show the same notice? (4) AM3 holds in the person's own zone too: a receipt from yesterday logged after this morning's check now comes off the bank figure (away_clock ac-01, check_day_before cdb-01), though the bank has usually taken it already, so the figure reads low by it until the next check. Intended, or only when the writer's offset differs from the check's?


## Decision AN, and where each part is tested

Run first, before any reference changed (the new and re-worked cases and asks, hand-worked): rules 692 of 735 cases (43 failed: ed-17, ed-18, ed-56 to ed-63, mg-257 to mg-280, mg-282 to mg-286, mv-28, mv-125 to mv-127); scenarios 719 of 725 asks (6 failed: ac-01 to ac-03 and cdb-01 to cdb-03, the day before still judged by `told`). Of the failing merge cases, mg-257 to mg-260, mg-262, mg-263 and mg-283 failed on the merge itself (the plain field, the `curs`-only `home`, the empty `cats`, `plan` and the top level keeping "mine"; the reader's newer guess winning); mg-261, mg-278 to mg-280 and mg-284 failed only because the question `merge_both` was new (the merge already gave the answer); the rest because their question was new. moved_together mt-01 to mt-03 and offset_travel ot-01 to ot-03 passed first (the data changed, not the model's reading of it). mg-287 (a bill, E x D) was added with the grid, after the references, and passed first. After: 736 of 736 and 725 of 725, realistic ids included.

| Part | Asks or cases | Failed first |
|---|---|---|
| AN1: every map with no `at` of its own merges key by key at any depth; plain values by the keyed rule, so merge(A, B) equals merge(B, A) | rules mg-257 to mg-263 (question `merge_both`: both orders in one case) | mg-257 to mg-260, mg-262, mg-263 on the merge; mg-261 on the question |
| AN2: after a merge, a change that now starts on or before a settled or named occurrence it no longer makes moves to the day after it, with a new `at` and a notice; the same for a moved key left orphaned | rules mg-268 to mg-271, mg-287 (question `after_merge`); x8_ordinary_ids_ok x8o-02 to x8o-04 | mg-268 to mg-271 (new question) |
| AN3: the main bank's own `minBank` is always null; its minimum only in `home.main` | rules ed-17, ed-18 (`min`), ed-56, ed-57 (question `min_save`), ed-58, ed-59 (question `min_ok`) | all six |
| AN4: an event is inside a check when the end of its date, in its writer's offset, is at or before the check's moment; otherwise `told` decides | check_day_before cdb-01 (380,000), cdb-02 (10,000), cdb-03 (40,000); away_clock ac-01 (292,000), ac-02 (292,000), ac-03 (17,000), re-worked by hand; offset_travel ot-01 (375,000), ot-02 (20,000), ot-03 (35,000), the same figures | cdb-01 to cdb-03, ac-01 to ac-03 |
| AN5: an amount landing on an occurrence that already has its own amount waits in `pendingMove` until add or replace is picked; no `pick` key | rules ed-60 to ed-63 (question `move_save`); moved_together mt-01 (70,000), mt-02 (150,000), mt-03 (150,000), re-worked by hand; moved_together_picked mtp-01 to mtp-03 | ed-60 to ed-63 |
| AN6: grid E x D, Z x D (an event written into an account closed on the other device reopens it at the merge, with a notice) and the row `people` | E x D: mg-268 to mg-271, mg-287; Z x D: mg-272 to mg-277; people: mg-278 to mg-281, mv-27, mv-67 | mg-272 to mg-280 (new questions) |
| AN7: shop keys `k:` + trimmed, collapsed, lowercased text; `src`, a reader's guess never replaces a person's lesson; never trimmed; 38.31 keys lowercased at the move | rules mg-282 to mg-286 (questions `cat_key`, `cat_learn`, `merge_both`); mv-28, mv-125 to mv-127 | mg-282, mg-283, mg-285, mg-286, mv-28, mv-125 to mv-127; mg-284 on the question |
| AN-note: any field value whose own device's change lost at a merge gets the notice | rules mg-264 to mg-267 (question `lost_notices`); AM2's mg-253 to mg-256 unchanged | mg-264 to mg-267 |

Questions AN does not answer (for Mako's run; SCHEMA_V3 section 14 has them with the readings to confirm, and `rules/*.json` lists each as an open question): (1) mg-271 leaves the bonus keyed on both 25 Dec and 10 Jan after the change moves (two bonuses counted); (2) which of two amounts moved onto an empty occurrence is its own (ed-60: the same month's); (3) whether a waiting bill amount should count on the safe side (mt-01 counts 70,000, 95,000 waits); (4) `once` keys moved onto a period with its own; (5) the minimum when another account with its own `minBank` becomes the main bank; (6) an event dated on the closing day, and a check figure, at AN6; (7) two 38.31 shop keys that become one key at the move. All seven are answered by AO (below).

## Decision AO, and where each part is tested

Run first, before any reference changed (the new and re-worked cases and asks, hand-worked): rules 738 of 751 cases (13 failed: ed-65 to ed-71, mg-271, mg-288, mg-289, mg-292, mv-128, mv-129); scenarios 723 of 725 asks (2 failed: mt-01 and mt-02, the waiting 95,000 rent counted nowhere). ed-64 (AO2, a confirmation), mg-290 (an event on the closing day) and mg-291 (a check of 3,000) passed first: the reference already did what AO says there. Of the failing cases, ed-69 to ed-71 failed only because the question `main_change` was new; mg-292 failed on the merge itself (a check of 0 reopened the account); mg-271, mg-288 and mg-289 on the two bonuses (the moved copy stayed live and the original stayed removed); ed-65 to ed-68 because `move_save` read only `amounts`; mv-128 and mv-129 because the move summary had no list of joined shop keys. After the references: rules 751 of 751, scenarios 725 of 725, the spec check all good, and the same again with realistic ids.

| Part | Asks or cases | Failed first |
|---|---|---|
| AO1: when AN2 moves a change after a merge, the keys that moved with it move back (the original live again, the moved copy `gone`), so one bonus is counted | rules mg-271 (re-worked by hand: 450,000 on 25 Dec, the 10 Jan copy `gone`, not 850,000), mg-288 (300,000 back on the settled 10 Dec pay, the 25 Dec copy `gone`, not 600,000), mg-289 (a Food `once` key: 65,000 for December's period, the 10 Jan copy `gone`) | all three |
| AO2: of two amounts moving onto an empty occurrence, the one from its own month is its own; the other waits | rules ed-60 (unchanged), ed-64 (the rent: January's 70,000 written on 5 Jan, December's 95,000 waits) | none (a confirmation) |
| AO3: a waiting bill amount counts on the safe side (the larger) in the walk until picked; a waiting pay amount adds nothing | moved_together mt-01 (95,000), mt-02 (125,000 = 400,000 - 95,000 + 150,000 - 50,000 - 200,000 - 80,000), mt-03 (150,000), re-worked by hand | mt-01, mt-02 |
| AO4: `once` keys follow AN5 the same way as `amounts` | rules ed-65, ed-66 (a budget line: 50,000 written, 60,000 waits; add gives 110,000), ed-67, ed-68 (a share's parts wait whole; add gives Free to spend 50,000 and the goal 10,000) | all four |
| AO5: an account that becomes the main bank brings its own `minBank` into `home.main`, cleared on the account; the old main bank gets none, with a notice | rules ed-69 to ed-71 (question `main_change`) | all three (new question) |
| AO6: an event on the closing day reopens nothing; a check other than zero typed into a closed account reopens it, with a notice | rules mg-290 (a lunch on the closing day), mg-291 (a check of 3,000), mg-292 (a check of 0); the new cell check x Z x D | mg-292 |
| AO7: two 38.31 shop keys that become one keep the later and are listed in the move summary | rules mv-128 (`catsJoined`), mv-129 (none) | both |

Questions AO does not answer (for Mako's run; SCHEMA_V3 section 14 has them with the readings to confirm, and `rules/*.json` lists each as an open question): (1) whether a waiting `once` amount counts on the safe side in the walk (ed-q-ao4); (2) whether an amount the moved change left waiting in `pendingMove` is removed and its original key made live again too (mg-q-ao1); (3) whether a check other than zero typed into a closed account on one device reopens it in the look ahead, or the check-in should not offer a closed account (mg-q-ao6).
Questions AN does not answer (for Mako's run; SCHEMA_V3 section 14 has them with the readings to confirm, and `rules/*.json` lists each as an open question): (1) mg-271 leaves the bonus keyed on both 25 Dec and 10 Jan after the change moves (two bonuses counted); (2) which of two amounts moved onto an empty occurrence is its own (ed-60: the same month's); (3) whether a waiting bill amount should count on the safe side (mt-01 counts 70,000, 95,000 waits); (4) `once` keys moved onto a period with its own; (5) the minimum when another account with its own `minBank` becomes the main bank; (6) an event dated on the closing day, and a check figure, at AN6; (7) two 38.31 shop keys that become one key at the move.


## Version one sync (AQ, 23 Nov 2026): the frozen columns and the sync rows

**The columns are frozen** [AQ7]. The 20 columns above (C, O, W, P, X, D, U, E, S, Z, M, Y, T, L, B, R, A, V, ED, ZD) are the full set. They are frozen after one confirming review of AQ plus the fuzz: a new situation found after that goes in as a row, or as a case under these columns, or to Mako as a cause-level question; it never adds a column (efficiency_review_2: the grid gained 10 columns in six rounds, so "every applicable cell covered" had stopped being a stopping rule).

**How the two-device columns read now.** The D, ED, ZD, M, L, R and A covers named in the grid above that are `rules/merge.json` cases marked `"stage": 2` cover the rich merge, which is the stage 2 spec (STAGE2_MERGE_LIST.md, 201 cases, all passing). In version one every record kind is joined by one rule (section 2.3 of SCHEMA_V3: by id, three-way on the last synced copy, an item changed two ways asked), so each row's version one D cover is that rule's cases plus the fuzz, which makes edits of the kinds listed and checks after every sync that every edit is present or asked, nothing doubled, symmetry, and the one-device checks:

| Grid row (D applicable) | Version one cover |
|---|---|
| check | sy-36 (a second figure on the closing day), sy-60; fuzz `check` |
| in / pay, set: settle | sy-08, sy-09 (the same pay ticked on both, one record or asked); fuzz `tick` |
| spend | sy-07, sy-46; fuzz `typeSpend`, `editEvent`, `removeEvent` |
| transfer | the one join rule (sy-07 to sy-09); fuzz `tick` on the transfer schedule, `close` |
| repay, move between places, skip, periodStart, period-end answer, rm:, fee record | the one join rule (sy-07 to sy-10: a record by id, built ids one record); move between places also sy-41, sy-42 and fuzz `place`. No case of their own: the rule does not look at the kind |
| closing | sy-33 to sy-38; fuzz `close` |
| income schedules, bill / transfer / auto schedules, keyed overrides | sy-11 to sy-14, sy-22, sy-32; fuzz `changeRule`, `amountKey`, `renameOrStep` |
| budget lines, goals / places | sy-54; fuzz `budget`, `goal` |
| card, loan / pay-later, cash and e-wallet accounts | sy-39 (an account changed on both), sy-45 (a card's statement); fuzz `setMain`, `ownMin`, `importStatement` |
| move, pending move, frozen text | sy-10 (a moved record written on both devices is one) |
| home, shared `ui`, `imports.cats`, `plan.limits` | sy-15, sy-16, sy-52, sy-53, sy-57; fuzz `homeField`, `uiOrLimit`, `cat` |
| people | sy-56; fuzz `person` |
| checkins | sy-47, sy-48 (row above) |
| ED (edited after settled, on two devices) | sy-23 to sy-32 (X8 after a sync for every rule kind, as questions) |
| ZD (closed account, on two devices) | sy-33 to sy-38 |

**The sync rows** (each a part of the version one sync, its applicable cells over the frozen columns; every other cell not applicable):

| Row | D | U | E | S | Z | M | R | A |
|---|---|---|---|---|---|---|---|---|
| the revision, compare and swap (AQ1) | n | - | - | - | - | - | n | n |
| records joined by id, import lines `imp:` (AQ2, AP3) | n | - | - | n | - | n | - | - |
| one item changed two ways: asked, `kept:<id>` (AQ3) | n | n | - | - | - | - | n | - |
| the one-device checks after a sync, as questions (AQ4, AP1, AP2, AP5) | n | - | n | - | n | - | - | - |

- the revision: D sy-01 to sy-06, sy-59; R sy-54 (a restore written after the other device's edit); A sy-55, sy-61
- joined by id: D sy-07, sy-08, sy-10, sy-45; S sy-43, sy-45, sy-46, sy-58 (the same statement on two devices, a CSV and a PDF of one month, a line matched to a typed coffee on one device: confirm_review_8 item 3, the missing S x D cell); M sy-10
- one item changed two ways: D sy-12 to sy-16, sy-21, sy-48, sy-52, sy-53, sy-56, sy-57; U sy-14, sy-19, sy-20; R sy-54
- the checks after a sync: D sy-39 to sy-42 (minimum, shares); E sy-23 to sy-32 (every rule kind, AP2); Z sy-33 to sy-38 (AP1)

**The fuzz** (`node foundation_review/rules/fuzz_two_devices.js`, AQ6): 5,000 seeds, one to three rounds each, every round both devices editing offline and syncing through the revision. It is not counted as a cell cover on its own; it is the check that replaces hand review rounds for the D column.

## Decisions AP1, AR and AS (engine lane A's readings), and where each part is tested

The reference model is brought up to the decisions the engine already followed (AS's last paragraph). 37 asks in 12 new files, each worked by hand from the decisions. Run first on the reference before it changed: 5 of 37 passed (cnt-01, mms-02, fpc-01, fpc-02, cmi-03), 32 failed. After: 762 of 762 asks, and 762 of 762 in the realistic-ids run; rules 751 of 751 (unchanged).

| Part | Asks | Failed first |
|---|---|---|
| AP1, AR3: the closing's check holds everything dated on or before the closing day; any event or check dated after it reopens, money out and a check of 0 included | closing_reopen cro-01 to cro-10 | all ten (the model refused the copy: a lunch on the closing day left -700 in the closed e-wallet) |
| B8, T1, AO4, AR1, AS8: `once` on a line and on Free to spend, a removed key, waiting `once` amounts on the safe side | once_keys ok-01 to ok-04 | all four |
| P1, Q7: the removal's own `rm:` move keeps the money to place | removed_rm_move rmm-01 to rmm-05 | all five |
| H9, L units q3 to q5, N3: a monthly line over 26 and 27 pays a year, this period and the opening share too | units_27_pays u27-01 to u27-03 | all three |
| L units q6: a weekly line rounded down per period, this period too | weekly_line wl-01, wl-02 | both |
| P4, R2: a pay rule changing mid-year | pay_rule_change_units prc-01 | prc-01 |
| M9, M10, N4, AS9: no fixed pay by day and by week from the line's `from` | no_fixed_pay_by_day nfd-01, nfd-02 | both |
| AS10: `count` from the first occurrence | count_first cnt-01, cnt-02 | cnt-02 |
| AS11: the main bank's minimum in `home.main` with its currency | main_min_currency mmc-01; main_min_same mms-01, mms-02 | mmc-01, mms-01 |
| AS6: the filler's place per check-in and per account | filler_place_checkin fpc-01, fpc-02 | none (the reference already kept the place per check) |
| AS7: money in on a card lowers what is owed; only a refund gives back to a line | card_money_in cmi-01 to cmi-03 | cmi-01, cmi-02 |

Questions AS does not answer (SCHEMA_V3 section 14, "Open after AS"): (1) a check of 0 dated after the closing day: AP1 read literally reopens (the reference, cro-09), AO6, mg-292 and the engine do not; (2) the minimum the walk uses while AS11's question is unanswered; (3) a waiting `once` amount on Free to spend for the period running now (the larger raises the headline's cap); (4) whether an imported refund line may settle a pay; (5) a budget line with no `from` in a scenario (the reference uses its account's setup day). AV answers all five (below).

## Decisions AU, AV and AW, and where each part is tested

The asks and cases were written first and run on the references before they changed: 34 failed (12 of 779 scenario asks, 22 of 66 sync_v1 cases). After the change: scenarios 779 of 779 and rules 817 of 817, both normal and with realistic ids. The AU situations are the checker's own seeded lives (`checker/life_gen.js`), each with the hand answer from checker_differences_1.md. The safe to spend sums are the checker's step-by-step working.

| Part | Asks or cases | Failed first |
|---|---|---|
| AU1: the week running now converted (weekly pay, 53 Fridays) | checker_au1_weekly cau31-01, checker_au1_headline cau42-01 | none (the reference already followed P4 and R2) |
| AU2: a place below zero holds nothing | checker_au2_place_below_zero cau131-01 | none (the walk already held nothing); year-04 and fy-12 still take only what the place holds for a bill paid from it |
| AU3: a remainder carried on again counted once | checker_au3_carry_chain cau1692-01 | cau1692-01 |
| AU4, AU5: a pay due today or late brings its period's lines and Free to spend | checker_au4_pay_due_today cau81-01; checker_au4_au5_weekly_pay_day cau2-01, cau2-02 | all three |
| AU6: a credit carries at the next close | checker_au6_credit_carries cau90-01 | cau90-01 |
| AU7: a pay inside the opening starts its period by the setup day | checker_au7_pay_in_opening cau1846-01, cau1846-02 | both |
| AU8: the units rules everywhere | checker_au8_units cau18-01 | none |
| AU other points: a spend with no line counts against Free to spend | spend_no_line snl-01, snl-02; rough_transfer rough-06 changed (2,970.00 to 2,740.00) | snl-01 |
| AV1: a zero check after the closing day does not reopen | closing_reopen cro-09 (flipped), cro-10 | cro-09 |
| AV3: a waiting Free to spend amount, the smaller | waiting_once_free wof-01 | wof-01 |
| AV4: a refund never settles a pay | refund_not_pay rnp-01, rnp-02 | rnp-01 |
| AW1: matching again after a sync | sy-63 | sy-63 |
| AW2: no base: which whole copy | sy-64 | sy-64 |
| AW3: X8's offer after the old rule's next occurrence | sy-23 to sy-25 (changed) | all three |
| AW4: one main-bank question | sy-39 (changed) | sy-39 |
| AW5: a refused write retries from the copy it took | sy-62 | sy-62 |
| AW6: closing worked out again, check-ins joined, keep both, undo either | sy-65, sy-48 (changed), sy-66, sy-12 (changed), sy-41 (changed) | all five |
| AW7: `keptVersions`; the safe side across kept versions | every sync_v1 case reads `keptVersions`; kept_versions_safe kvs-01 | kvs-01 and the cases that read the list |

The checker is now a permanent gate (AU). `node wip/team/checker/fuzz_vs_ref.js --seeds 2000` shows 0 differences (371 seeds differed before), and `ref/run_scenarios.js` runs it on 300 seeds every time. The engine shows 0 differences on 2,000 seeds against it with no defaults, and `checker/invariants.js` (AZ4) holds on 2,000 seeds for both the engine and the reference. The two-device fuzz reads `keptVersions` and answers the new questions, and 5,000 seeds pass. The AW1 invariants and the reviewer's extra fuzz invariants were not added to it (scope cap, MAIN 15).
