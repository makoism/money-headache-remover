VERDICT: FAIL (qc-foundation on LOAN_CHECK_PLAN.md at 27839f3b, 26 Nov 2026; saved by LANE H from the reviewer's reply)

Summary: the rule is right and the saved shape needs no new field. Rule 3(i) as written counts a payment twice: (1) a late tick is dated by landedFrom the day after the paying bank's last check (checkin.js:42-46, 73-90), which can fall after the loan check, so loanInfo takes it off again; (2) an unticked payment before the check stays in `unpaid` and comes off the future schedule too (lookahead.js:802-807).

FOUNDATIONAL
1. Ask at the moment of the check, once per unticked payment landing on or before the check day: "Has the 27 Jan payment of 30,000 left your bank?" Yes: tick it in the same step (same grp, inside by sameMoment). No, not yet: saved on the check as notYet [occ] (as the opening check does, lookahead.js:110, 405, 415; extend 415 from c.opening to every loan check; landedFrom dates a later tick after the loan check). Not sure, later (M91): treat as No, not yet. Then `unpaid` holds only payments the figure includes as still owed.
2. Payment days on or before the check day keep the walk from the previous base; min(..., owedNow) only for days after the check. The question of 1 also before a check of 0. Worked test.
3. Old books do have loan checks: move.js:334 writes mv:check:debt:* with no grp (not an opening check); closeLoan writes a check of 0. Test a moved book with a debt and a closed loan: unchanged.

GRID: covered 6, n/a 1, empty 1: the assistant cannot remove or undo a loan check (remove takes S, B, P, L, G refs); card_figure has no date (case e screen only).

WATCH: loan statements later (stmt3_plan.js:258) need the same question; apr changes from a date start from the latest check; two devices' checks on one day in the nine-orders test.

Found sound: rule 1 (same check event, one door, grp), rule 4, rule 6 with closeLoan, rule 8, card_figure and Check your bank reuse checkIn figures; tests-first order and the Kenji example (add the 5 Feb bank check).
