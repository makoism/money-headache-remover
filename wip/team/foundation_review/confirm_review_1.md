(qc-foundation confirming review of the coverage grid, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Everything passes as stated: 549 of 549 asks and 308 of 308 cases. The grid still has two missing rows (the fee record, and the "not gone out yet" answer) and three missing columns (the move run on two devices, years after setup, and times with an offset). It also has four false covers. Nine of these give a wrong answer, and each needs a rule, an id or a field before engine code starts. My scripts and hand-worked answers are in /tmp/foundation_confirm/ (c1 to c10).

## FOUNDATIONAL

**1. The move run on two devices doubles everything (missing column: two devices x moved).** Mako has a phone and a desktop, and each holds a 38.31 copy. Each device runs the move when it updates. Moved records get ordinary ids (SCHEMA_V3 11.1 gives none), and `idFor` (rules/merge_ref.js:35) has no built id for them. After the merge, every receipt, account, schedule and opening exists twice.
- What the base needs: built ids for moved records, for example `mv:<38.31 id>`, plus a merge case.
- Cost: an hour now. Later it means cleaning doubles out of real money data.

**2. The fee record has no built id (missing row).** Two phones tick the same transfer occurrence that has a fee. The `set:` transfer merges into one record, but each phone writes its own fee record. In c6, the trip ends with 1,970.00; the hand answer is 1,985.00 (fee_place with a second phone).
- What the base needs: `fee:<transfer id>` in section 0 and in `idFor`.

**3. The "not gone out yet" answer (F20) has nowhere to be saved (missing row).** The model reads `opening.not_gone_out` (lookahead_ref.js:384-387, 480), but SCHEMA_V3 has no such field and no ask uses it. A pay landing on the setup day is assumed to be in the opening already.
- c3: someone sets up on pay day at 08:00, before the pay arrives. Day one says "40,000 short". The pay is never on the check-in list and never starts a period.
- After the next check-in, the headline is 210,000 against a Free to spend of 60,000 a month, because the gain became Free to spend.
- Hand answer on day one: 40,000, with the pay expected today.
- What the base needs: a field on the opening (the occurrences not yet gone out or in), and setup asks about a pay due on the setup day.

**4. A large gain counts before anyone answers the question (false cover on check and filler x C).** Section 7.3 (SCHEMA_V3:249) says the gain is not placed until answered. But the model gives every negative filler back to Free to spend (lookahead_ref.js:924-935). check_gain has no headline ask.
- c4: the bank's figure typed into the e-wallet's box gives a headline of 309,000. The hand answer is 31,000 (only the bank's small 1,000 gain is placed).
- What the base needs: a saved state for the answer (asked, right, wrong) and a rule that holds the gain until then.

**5. Money "to place" can be placed twice from two phones (false cover: rm: / to place x D).** mg-62 and mg-68 test only the `rm:` id. In c7, both phones put the trip's 100,000 into Free to spend: the headline is 150,000 against a hand answer of 120,000.
- P3 re-checks only period-end answers after a merge. Every share-out from a limited amount needs the same re-check: placing money to place, and covering an overspend found later.

**6. A card with a known close day and no typed last statement is never due (false cover: card x O).** Every ask in tmo-01 to tmo-07 types a statement. With none, `ymOf(null)` makes the close days fall in 1970-72 (lookahead_ref.js:559-561), so there is no next payment, ever.
- c1: the model gives 300,000 safe to spend. The hand answer is 230,000 (70,000 due 10 Dec).

**7. Card statements stop after about 29 months (missing column: years after setup).** Close days are made only 29 months past the opening statement (`k < 30`, line 561). A "not sure" card stops after 40 months (lines 626 and 669).
- c2: a spend in May 2029 is never due, and safe to spend is 20,000 too high.
- This is the same kind of fault as Lesson 1's "would have frozen in October 2028".

**8. A pay day change dated back past a settled pay makes up a phantom pay (false cover: income x E).** move-01 to move-04 only change the pay day from a future date. In c8, the pay moves to the 25th "from 1 Dec", entered on 15 Dec after the 10 Dec pay was settled. The model expects a second pay on 25 Dec and gives 470,000 safe to spend; the hand answer is 390,000. The settle on the 10 Dec pay then points at an occurrence that no longer exists.
- The same backdating cuts off the names that `once`, `amounts`, `pe:` and `ps:` are keyed by.
- What the base needs: a rule that a change never starts on or before the latest settled or named occurrence.

**9. A time with no clock part is read as UTC (missing column: time zone offset).** `momentOf` (lookahead_ref.js:61-62) treats a plain date as UTC midnight. A moved receipt with no time is told "at the start of its day". Against a figure told at 07:00+09:00 on the same day, the receipt lands after the figure.
- c5: bank 295,000, hand answer 300,000. Without the offset the same case gives 300,000, which is why moved-01 passes.
- What the base needs: 11.1 should say the start of day is in the moving device's offset, and the reference should follow it. The opening's end-of-day mark has the same fault for negative offsets.

## WATCH
- **Move tests (11.1):** only receipts, the bank figures and the currency question have tests. Nothing tests `steps[ym]` (and its `debt:` keys), `once[ym]`, `items[ym]` (the H9 move-month rule), `cfg.minBank`/`ui.minAuto`, the loan fields, the older goal figures, `plan.lines` (including matching the E6 loan line), `plan.goals`, `ui.gk`, `plan.debts`, `plan.recurring` (the weekly `on`), `cards[]`, `ui.sweep` or the `ui` keys. There is no field list at all for 38.28 and the 25.0 builds (E1). Two rows in 11.1 are stale or unclear:
  - `ui.sweep` still says `pe:<period last day>` (SCHEMA_V3:301), which T1 replaced.
  - `once[ym]` "for the period starting in that month" (283) is unclear when two or three periods start in one month.
- **Goal money at the move:** 11.1 puts every goal's start into the bank's opening split (294). DECISIONS line 289 allows goal money kept in its own account. c10: a 300,000 goal kept elsewhere gives "200,000 short" on the first open. The move must ask where each goal's money is.
- **Rows no ask exercises:** `amounts` (one occurrence changed; not in the model at all), `redirect`, and a payoff place's `pays`.
- **V1 to V3 (checked as asked):** sound. V2 still needs the walk to skip a `loan` item from an account in another currency (line 1017 does not today).

## Checked and sound
- Spot-checks that really test their cell: gpc-01 to gpc-05 (a refund across a pay, a skipped pay starting no period, a transfer before an opening), g2p-01 to g2p-05, cr-04, gbw-01, ol-01, pc-01, pma-01, mg-75.
- Near misses rather than real cover: midmonth-03 (only a pay before setup), goc-05 (an opening figure only), plus the false covers in items 4 to 8.
- Leap day and the year end (c9): a yearly bill on 29 Feb, pay on the 31st moved earlier, a card closing on the last day. All correct.
- A skipped pay (zero month), a bank in debt at the opening, and an overspent month all behave as decided.

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
- /tmp/foundation_confirm/c1_card_no_stmt.js through /tmp/foundation_confirm/c10_split_over.js
