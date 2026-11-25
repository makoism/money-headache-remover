FAIL (one narrow point, N9, the N8 fault on the extra-money path; cheap now)

Plan: CASH_PLAN.md sections 13, 14, 15, against run 3. MAKO_SAYS.md to M99.

## Run 3, point by point
- N7: MET in the saved shape. Source `'waiting'` is right: ledger.js:124 then takes the split off Waiting and puts it on the burrow, and nothing goes below zero. One builder point (engine code, no saved change): "sharesQuestions leaves `ex:` records out" must drop only the Waiting side. If the `to` side is dropped too, placeFigures (sync.js:499) stops seeing money split into a burrow, and a later move out of that burrow reads below zero and raises a false question. Simplest: skip `'waiting'` beside `'free'` at sync.js:509 (today only moves put money into Waiting, sync.js:498, so this is safe). Put a "split then move out" case in the join test.
- N8: MET. A tagged transfer into the goal's own account is counted by the goal reader (lookahead.js:936), two real moves both stand, and the join asks.
- Empty cells (a later second answer, a second "Not today"): MET, through act3 edit with Undo, on both doors. Cells covered 76, not applicable 6, empty 0.

## FOUNDATIONAL
N9. Extra money split into a goal kept in its own account.
Who: Ben, Savings is its own account. On pay day he splits 30,000 of extra into Savings.
What the base holds: section 13 writes this as an `ex:` periodEnd move `to: savings`. No money moves between accounts, so the bank figure stays 30,000 too high and the Savings account 30,000 too low (M36). If he also writes the real transfer, the goal reader counts it twice: lookahead.js:936 for the transfer and lookahead.js:940 for the periodEnd move (M45).
Needs: the same rule as N8. When the target goal has its own account, the split writes a real transfer with an ordinary id, tagged `ex: <income>`, and the `ex:` record does not carry a move for that goal (or it carries the move marked as paid by that transfer, and readers count only one). The after-join extra check adds up the tagged transfers. The N8 check counts only `gp`-tagged moves, so an extra split or a person's own top-up never trips it.
Cost: one rule now. Later: wrong account figures in saved books, needing a rewrite.

## Section 14
No new base fault. R1, R2, R3, R5, R6 and the extra-money cap are readers. R4's leftover is already in cashMoment (F3). Widened (b) uses the existing income record id. WATCH: if a refund that already had an `ex:` answer is later given a burrow, its extra goes to 0 and the after-join check must ask, not drop.

## Owner's words
M36, M43, M45, M61 at risk only through N9. Every other line still stands as in run 3.
