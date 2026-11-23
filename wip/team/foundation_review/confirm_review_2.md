(qc-foundation confirming review 2, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Everything passes as stated: 664 of 664 asks and 421 of 421 cases. My own situations still turn up four faults that each need a rule or a saved field before engine code. The grid is also missing two columns and two rows, and it has three false covers. My scripts are in /tmp/foundation_confirm2/ (d1 to d4).

## FOUNDATIONAL

**1. A second device that moves days later wipes out a week of use (missing column: the move on two devices days apart; false cover on move x M, D, U).**
- Who: Mako updates his phone on 24 Nov. He answers the pay day and the rent day, renames the bank and raises the trip goal. On 1 Dec he opens the desktop, which still holds the 38.31 copy, and it runs the move.
- What happens: every moved record takes its device's move moment as `at` (rules/move_ref.js:460-468, `stamp`), and the newer `at` wins (merge_ref.js:86). After the merge the pay and rent have no rules (so no pay is counted), the bank is "Bank" again, the trip is back to 300,000, and a moved receipt the phone had removed comes back (d1_late_second_move.js).
- Why mv-41, mv-42 and mv-67 miss it: the two moves in those cases are an hour apart, with no use in between.
- `frozen3831` makes it worse. It is one shared string with no `at`, and the merge keeps each device's own (merge_ref.js:157, `out[k] = a`). Two different 38.31 copies never converge, and the cloud keeps only one of them, so the other device's raw old data is lost from it.
- What the base needs:
  - A moved record's `at` should be the copy's last save, not the move moment. Better still, a device that finds a moved copy in the cloud takes it, adds only the ids it lacks, and asks only the questions not yet answered.
  - `frozen3831` should be kept per device, for example as a record `mv:frozen:<by>`.
- Cost: hours now. Later it means Mako's real answers lost and no record of where they went.

**2. AA4 and AA6 (checked for soundness only) count money twice and need a field.**
- Pay amounts:
  - A schedule's `steps.amount` is the amount of each occurrence (SCHEMA_V3:155), and schedules have no `per`.
  - "A monthly total spread per pay by the units rule" (monthly x 12 / 26 or 27 pays) cannot be saved as fixed steps without making them year by year, which X7 forbids. The income schedule needs `per: 'month'`, or the engine reads 300,000 per pay and doubles it.
- One-month amounts:
  - 38.31's `once[ym].a` replaces the month's whole pay (wip/team/model.js:221).
  - AA4 puts it on the first pay of the month while the other pays keep their share. Twice-monthly pay with January's 320,000 then counts 320,000 + 150,000 = 470,000, which is unsafe.
  - AA6 and units-79 do the same with budget lines: the first weekly period gets the month's whole amount and every other week keeps its own share. That errs on the safe side but is still wrong.
  - What the base needs: the one-month amount replaces the month's total, spread over that month's pays or periods.
- Month-end answers:
  - With pay on the 25th, "the period holding the month's last day" is the period that has just started. In mv-52 the move on 3 Feb writes an answer for the period of 25 Jan to 24 Feb.
  - That fixes the period's end in advance (T1), and its always-asked question (A7, Mako's decision 3) never comes.
  - What the base needs: an answer for a period not yet ended at the move is not moved, or it waits in `pendingMove`.

**3. A card set up between its close and its payment day, with no statement typed (missing column; false cover on card x O).**
- Who: someone with a common Japanese card, closing at month end and paid on the 27th, sets up on 20 Nov. The card shows 50,000 owed, of which 30,000 is October's unpaid statement.
- What happens: under X6 the model says 50,000 is due on 27 Dec, with safe to spend 300,000. The hand answer is 30,000 due on 27 Nov and safe to spend 250,000 (d3_card_unpaid_statement.json).
- Why cns-01 to cns-05 miss it: they set up after the payment day only. For a card like this one, almost every setup day falls in the gap.
- What the base needs: setup asks "is the last statement paid?" and saves the answer as a J5 statement. "Don't know" takes the safe side: everything owed is due on the next payment day, as in H4.

**4. A not-yet bill settled by a line dated before the setup day (false cover on notYet x S).**
- What happens: the statement shows only the bill's own date (21 Jun, setup 22 Jun). The line settles the bill, but because of its date it counts as inside the opening. Bank today shows 200,000; the hand answer is 192,000 (d2_notyet_line_before.json).
- Why nyb-03 misses it: it dates its line on the setup day.
- What the base needs: a rule that a line settling a `notYet` occurrence comes after the opening, whatever its date.

## Missing rows and columns
- **Rows:**
  - `pendingMove` (AA5): a new shared field with no `at`, `by` or merge rule. Both devices would apply it. AA6's Emergency fund draw needs a built id (`mv:draw:once.<ym>`) so applying it twice writes one record.
  - `frozen3831`: see item 1.
- **Columns:**
  - The move on two devices days apart (item 1).
  - Setup between a statement close and its payment day, for cards, pay-later and loans (item 3).

## Spot-check of 20 cells
- **Real covers (14):** fee D (mg-86), fee P (feeplace-07), notYet C, O, W, P, X (ny-01 to ny-05, nyb-01, nyb-02, nyb-04), card Y (fy-01, fy-02, fy-04, fy-05), check Y (fy-03), move T (mv-69), move Y (mv-68), income E (ed-01 to ed-07), rm: D (tp2-01, tp2-02, pe-55 to pe-59), goals M (gme-01 to gme-04).
- **Near misses (3):**
  - in / pay T (kinds-01) uses a date-only `told` on `set:` records, which the engine never writes. The real cell holds through ny-04.
  - move U (mg-91) only checks that an id is valid; it is not an Undo.
  - period-end M (pe-60, pe-61) and budget M (units-78 to units-80) pick the right period, but the amounts are item 2.
- **False covers (3):** notYet S (item 4), card O (item 3), move M and D (item 1).
- **Stale labels:** COVERAGE names `mv:check:bank`, `mv:open:bank`, `mv:schedule:pay`, `mv:budget:food`, `mv:account:c1` and `mv:account:d1`. The cases use `mv:acct:cfg`, `mv:card:c1` and `mv:debt:d1`.

## Hand-checked move cases (10)
- mv-04, mv-19, mv-21, mv-36, mv-41 (rev 1,795,482,000,001), mv-63 and mv-69 (save time 24 Nov 00:00 UTC, end of day at -05:00) are right by MOVE_FIELDS.md and Y and Z.
- mv-33 is right today. It still lists draw, the shares, the goal and the debt one-month amounts as having no target, so it must change for AA6.
- mv-42 follows Y12, but Y12 itself is item 1.
- mv-52 follows AA4, but AA4 is item 2.

## WATCH
- **Restoring an older backup while the cloud copy is on:** a union merge brings back everything newer at the next sync, so a restore cannot roll anything back. It needs a rule (write `gone` and a new `at`) before backups ship. No field is needed.
- **AA4 with pay twice a month:** a moved month-end answer may move more than a half-period's Free to spend holds. Say whether the refusal (L q10) applies at the move.
- **AA1, AA2, AA3, AA5, AA7 to AA14:** sound as written.

## Checked and sound
- Both runs: 664 of 664 asks and 421 of 421 cases.
- Setup on pay day with the pay already in (d4): nothing on the first check-in list, and the period starts. My one failed ask there was my own counting error.
- `mv:` and `fee:` ids inside other built ids, and every confirm_review_1 item. The X3, X6 and X8 fixes hold in the cases they name; items 3 and 4 are new situations beyond those cases.

Files:
- /tmp/foundation_confirm2/d1_late_second_move.js
- /tmp/foundation_confirm2/d2_notyet_line_before.json
- /tmp/foundation_confirm2/d3_card_unpaid_statement.json
- /tmp/foundation_confirm2/d4_payday_setup_already_in.json
- /home/user/money-headache-remover/wip/team/foundation_review/rules/move_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
