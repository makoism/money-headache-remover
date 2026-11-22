# QC round 12, Numbers gate: FAIL

Saved by MAIN 14 from the agent's reply. Build 098d0ee. Hard gates all pass: oracle N=3000 mismatches 0; proof_fuzz 1500 21 PROOF PASS; display_math 0; home_dom 40 13 mismatches 0. Files were in /tmp/qc/r12-numbers/.

## Blockers
B1. The same ¥3,800 is "safe to spend" on some screens and "left, not safe to spend yet" on others, and "left" shows ¥3,800 when ¥8,800 is left. Yen, pay 300,000, bank 50,000, rent 90,000, food 40,000, emergency fund 3 months saved 20,000; Nov receipts Free to spend 30,000, Food 45,000, Other 20,000 "Vet bill". Home top: "Your bank is less than your bills still to pay and Free to spend, so Free to spend is planned, not safe to spend yet." Same screen card: "¥8,800 planned, ¥3,800 safe to spend"; strip on every tab the same; Plan > Month "Planned ¥38,800 in Nov, ¥3,800 safe to spend." then "Receipts: ¥30,000 spent, ¥3,800 left, not safe to spend yet."; Receipts "¥38,800 planned, ¥30,000 spent, ¥3,800 left, not safe to spend yet" and table row "Free to spend ¥38,800 ¥30,000 ¥3,800" (38,800 - 30,000 = 8,800). Right answer: left ¥8,800 everywhere; one verdict, not safe to spend yet while the bank does not cover bills left plus Free to spend; the minimum's ¥3,800 only as its own figure if shown at all.
  (MAIN 14: same family as money accuracy blocker 1, fixed in the model row df0b685 (no held part when not covered). Still to check on the new build: Receipts sentence and table "Left to spend" use playSafeLeft (ui2.js:108, ui4.js:66) and may still show ¥3,800.)
B2. Goal amounts lose cents: Edit goal saved 100.50, target 4951.20 are stored as start 101, target 4951 ("Saved so far: $101", "$451 of $4,951", Home total $1,711.10 instead of $1,710.60). Bank and receipts keep cents. Right answer: keep what was typed.

## Should fix
1. Month-end "Put it toward Emergency fund" when all of it fits: "so the bank ends higher than the numbers above" though the bank is unchanged.
2. No pay entered, own bills logged: strip and footers say "Sample numbers" / "The sample numbers are made up".
3. Same case: Home shows no "In your bank now" and no total line.
4. Setup done with nothing typed says goals stay at 0, then the next screens show sample ¥20,000 Free to spend called safe.
5. Receipts "Other" row Plan cell empty instead of ¥0.
6. Receipts last-month summary: "Bills and basics ¥130,000 in plan" in the Spent column; Investing missing.
7. Cents: Receipts writes .00 on whole amounts, Plan does not ($350 vs $350.15 planned).
8. A borrow month shows no percents, so places + not placed + borrowed cannot be checked.

## Six situations: all agree (see the agent's figures); odd receipts, edits, undo, plan changes, two tabs, no NaN.
