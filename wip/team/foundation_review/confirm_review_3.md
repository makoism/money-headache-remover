(qc-foundation confirming review 3, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Everything passes as stated: 687 of 687 asks and 467 of 467 cases. Two things need a saved-data shape or rule change before engine code: maps inside records lose edits at the merge, and AD5 as worded never applies anything. My scripts are in /tmp/foundation_confirm3/ (e1, e2).

## FOUNDATIONAL

**1. One-occurrence amounts and planned extras are lost when two devices edit the same record (missing row; the D, M and L cells of the schedule, budget-line and loan rows are covered only for `steps` and `rules`).**
- **Who:** Mako, on the subway with the phone offline, sets "December pay 0, unpaid leave" (`amounts['2026-12-25']`). Five minutes later, on the desktop, he renames the pay. Or he sets a 70,000 December Food override on one device and a January one on the other. Or he plans a 30,000 extra car-loan payment from January on one device and 10,000 from April on the other.
- **What happens:** merge_ref.js `pick` (lines 105-112) merges entry by entry only for `steps` and `rules`. The newer copy wins everything else, including:
  - `amounts` on schedules and loans
  - `once` on budget lines and on `plan.shares` entries
  - `extraSteps` on loans
- **Results** (e1_amounts_two_devices.js):
  - December's 0 is gone, so the engine counts a 250,000 pay that never comes.
  - Only one of the two Food overrides survives.
  - The January extra is gone, so the January loan payment is counted 30,000 too low.
- **Worst chain:** the move's later answer writes `amounts` and marks its `pendingMove` entry `gone`. If another device edits that schedule before the sync, the amount is lost and never written again.
- **Why it is the base:** SCHEMA_V3 line 25 gives `at`/`by` only to `steps`/`rules` entries, so the saved shape cannot tell the two edits apart.
- **What the base needs:** each `amounts` key, each `once` key and each `extraSteps` entry carries its own `at`, `by` and `gone`, and merges the way steps do. It needs merge cases and a grid row "keyed overrides" (D, M, L, U, restore).
- **Cost:** an hour now. Later it means a migration of every saved map, and edits already lost are gone for good.

**2. AD5 (being coded) skips every waiting entry (soundness).**
- **What AD5 says:** "applied only when the record it would change has an older `at` than the entry".
- **Why it fails:** `stamp` (move_ref.js:624) gives entries and moved records the same `at`, the copy's last save. So an untouched record is never "older" and nothing applies. After any later edit, the record is newer, so the entry is skipped too.
- **The answer itself trips it:** answering the pay day adds a `rules` entry to the pay schedule, which gives the schedule the answer's `at` before the waiting amounts are written.
- **e2 (one device, no merge):** the move is on 24 Nov. Food is renamed on 26 Nov and the pay day answered on 28 Nov. AD5 skips both January's pay of 0 and Food's 70,000, so the engine counts January's full pay.
- **What the base needs:** AD5's second sentence (whoever applies an entry also writes it `gone`) already covers mv-q54. With item 1's per-key `at`, a written key is judged by its own `at`. The first sentence should go.

## Stage-2-only / smaller AD soundness (no saved-data change)
- **AD4:** per-month bills need `per` on bill schedules, but SCHEMA_V3 line 158 still says "income only". writePending (move_ref.js:546) still puts a bill's one-month amount whole on the first occurrence. Under AD4, a bill paid every two weeks would count it on top of the other occurrences' shares. That errs safe but is wrong. Spread it as for pay.
- **AB2 with a three-pay month (mv-88):** a 38.31 Food once of 50,000, meant as "more than the usual 40,000", becomes 16,667 a period. The usual is 18,461 a period with three periods, so less food is held back. This is only for a moved copy answered "every two weeks". Note it in the move summary.
- AD1 to AD3 and AD6 to AD8 are sound. AD7 errs safe: at most one payment is counted twice.

## Missing rows and columns
- **Row:** keyed overrides (`amounts`, `once`, `extraSteps`), item 1.
- **Column:** restore (R). Only mg-96 and mg-97 cover it, for spends and steps.
  - Uncovered: restore against built ids (`set:`, `pe:`, `mv:draw:`), `pendingMove`, `frozen`, held marks and keyed overrides.
  - Uncovered: restoring a 38.31-format backup after the move. The moved records would carry that copy's old last save as `at` and lose to everything. Say whether restore stamps them.
- The restore reference stamps the raw `now`, not the D4 clock. The engine must use `nextAt`, or a device whose clock is behind gets only part of the restore.

## Spot-check of 20 cells (all real covers)
- open L: mv-82, mv-83, mv-85
- open B: cbp-04
- check B: cbp-03, ed-13 to ed-16
- card B: cbp-01 to cbp-10
- loan B: lbs-01 to lbs-04
- spend L: mv-83, mv-85, mv-97
- income L and bill L: mv-83 (rules merged by `from`)
- goals L: mv-83 (350,000)
- income M per month: mv-87
- budget M: mv-88
- period-end M: mv-89
- move P: mv-89
- move U: mv-97
- pendingMove P: mv-89
- pendingMove D: mv-95
- pendingMove M: mv-96
- frozen L: mv-83 (frozenIds)
- frozen D and M: mv-86
- not yet S: nlb-01, nlb-03
- restore: mg-96

## Hand-checked by me, all correct
- **Move cases (10):** mv-72, mv-83, mv-85, mv-87, mv-88, mv-89, mv-92, mv-95, mv-96, mv-97.
- **Scenario asks (11):** cbp-05, cbp-07, cbp-09, lbs-01, lbs-02, lbs-04, nlb-01, nlb-03, loma-02, loma-03, gh-01.

## WATCH (assumption nobody checked)
- **"Is the last statement paid?" (AB3):** Japanese cards are paid by automatic debit. Many people will answer "yes" on the 20th, meaning "it will come out on the 27th."
  - The model then takes the whole card balance as November spending, due 27 Dec.
  - Safe to spend is too high by the October statement until the debit lands.
  - The saved field is fine. What the answer means (the money has already left the bank) needs a check with real people before setup ships.

Files:
- /tmp/foundation_confirm3/e1_amounts_two_devices.js
- /tmp/foundation_confirm3/e2_ad5_unrelated_edit.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/move_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/DECISIONS_ROUND2.md
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
