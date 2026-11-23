(qc-foundation confirming review 4, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Everything passes as stated: 698 of 698 asks and 516 of 516 cases. I found one foundational fault in the clock that no grid column covers, two false covers, and one soundness problem in AG1 as it is worded. My scripts are in /tmp/foundation_confirm4/ (g1 to g4).

## FOUNDATIONAL

**1. Anyone who stays away from the app for more than a day is treated as having a fast clock, and their times stay stuck from then on (missing column: the device used again after days away).**
- **Who:** the "three weeks without opening the app" persona. Also anyone who skips a weekend.
- **What the base does:** `nextAtWarn` (rules/merge_ref.js:21-24, L merge q8) caps any write whose now is more than a day past the newest `at` the device has seen. mg-33 states it outright: "a clock two days ahead of what the device has seen is held". The capped `at` then becomes the device's newest seen, so the cap repeats on every write after it.
- **g1:** last write on 1 Nov, back on 22 Nov. The writes on 22 Nov, 23 Nov, 1 Dec and 1 Mar 2027 all get `at` 1 Nov 21:00:00.001, .002, .003, .004, and each one shows the clock warning.
- **Two devices:** a correction typed on the phone on 22 Nov (1,800) loses to a desktop edit from 10 Nov (1,500). The desktop's real 10 Nov edit is also held as "ahead" when it arrives (M4).
- **A wrong money number:** `told` is set from the same clock. A spend typed on the phone at 12:00 gets `told` 1 Nov. So a check typed on the desktop at 09:00 that day reads the spend as already inside the bank figure (SCHEMA_V3:21, section 7.1). 8,000 of spending is never counted, and safe to spend is 8,000 too high.
- **It contradicts D8:** SCHEMA_V3:76 allows a device date up to 40 days ahead without asking.
- **Why the tests miss it:** COVERAGE:614 says mg-109's input was changed so the restore avoids this cap, and mg-96 to mg-99 "would otherwise have been held at 18 Nov". The tests were changed to fit the rule instead of the rule being questioned.
- **Why it is the base:** wrong `at` and `told` values are written into saved data and synced. The true times cannot be recovered later.
- **What the base needs:**
  - Judge a device's own writes against its own clock and D8's question, not against the newest `at` seen.
  - Hold an arriving copy only when it is more than a day ahead of the receiving device's own now.
  - Add a grid column for a device used again after 2, 21 and 45 days away.
- **Cost:** an hour of reference and cases now. Later, every saved `told` written after a gap is wrong for good.

**2. X8 does not protect moved schedules (false cover: move x E, marked not applicable "as any, ed-01 to ed-07").**
- **The cause:**
  - edits_ref.js:14 matches occurrence names with `^([a-z0-9_]+)@`, so `mv:pay:steps.a@...` never matches.
  - edits_ref.js:13 takes `split(':')[1]` of a `pe:` id, which gives `mv` for a moved schedule.
- **g4:** a moved pay settled on 25 Dec, or holding a January `amounts` key, is allowed a change "from 1 Dec". The hand answer is: refused, offer 26 Dec. This is confirm_review_1 item 8 (the phantom pay) again, for every moved copy, Mako's own included.
- lookahead_ref.js:353 already handles `mv:` ids; edits_ref was missed.
- **Needs:** fix both lines, plus ed cases on `mv:` schedule ids. This is not a saved-data change, but if the engine is coded from edits_ref it saves settles that point at occurrences that no longer exist.

**3. A removed keyed override is still read as live (false cover: keyed overrides x U, covered only by mg-105, which is a merge).**
- **What the reference reads:**
  - lookahead_ref.js:157 and :860 read `amounts[d]` as a plain number.
  - Every ask (amt-01 to amt-05) uses the old shape.
  - Nothing reads `{ amount, at, by, gone }` or skips `gone`. Only move_ref.js `payAmounts` does.
- **The person:** removes "December pay 0" because the leave was cancelled. Nothing tests that the money number goes back to 250,000.
- **X8 has the same fault:** edits_ref.js:12 and lookahead_ref.js:359 count removed keys as named occurrences. In g3, a removed December key still refuses a pay-day change from 1 Dec.
- **Needs:** the model reads the AE1 shape and ignores `gone` keys, plus asks with a removed key (C, P and U) and an X8 case with a removed key.

## AG soundness

**AG1 as worded breaks mg-117 and AE2.**
- **The wording:** "every write made now, including a waiting entry applied..., uses nextAt".
- **g2:** a waiting key applied with `nextAt` (28 Nov 08:00:00.001) beats the person's later desktop edit to 120,000 (27 Nov). January then counts 0.
- **The other way round:** a waiting 300,000 bonus re-applied over a correction to 250,000 overcounts pay, which is unsafe.
- **AE2 is right as it stands:** keys carry the entry's `at`.
- **Fix only the case mv-q56 raises:**
  - The restore stamps the entries it brings back 1 ms after the `gone` marks it writes. Then a later apply, at the entry's `at`, beats the restore's removal of the key.
  - Or: apply with `nextAt` only over a key whose live copy is a restore's `gone`.
- **Needs:** keep mg-117 passing, and add an mv-q56 case.
- **AG2:** sound.

## Grid
- **Missing column:** the device used again after days away (item 1).
- **False covers:**
  - move x E (item 2)
  - keyed overrides x U (item 3)
- keyed overrides x C is a near miss: amt-01 to amt-05 use plain numbers, not the AE1 shape.

## Spot-check of 20 cells
- **Real covers (19):**
  - keyed overrides: D (mg-100 to mg-104, mg-106, mg-108), E (ed-04, ed-06), M (mg-107, mg-117), L (mv-116), R (mg-111, mg-113), P (units-75, mv-88)
  - restore: in / pay and set: settle (mg-110), spend (mg-112), income (mg-109), move (mg-118), every event kind (mg-119)
  - AE2 waiting entries: mv-106 to mv-110
- **Not a real cover:** keyed overrides U (mg-105 tests only the merge), item 3.
- **At risk:** mg-117 is real today, but AG1 as worded breaks it.

## Hand-checked, all correct by my own working
- mv-88: three pays on 1, 15 and 29 Jan. 166,667 + 166,667 + 166,666; 16,667 + 16,667 + 16,666; 10,000 x 3.
- mv-111: 2, 16 and 30 Apr. 3,334 + 3,333 + 3,333.
- mv-109, mg-103, mg-106, mg-107, mg-117 and mg-109 (18 Nov 10:00:00.001).
- amt-01: 95,000.
- amt-02: 650,000 - 95,000 = 555,000.

## Stage-2-only or no saved-data change
- Items 2 and 3 are reference and rule fixes, but they must land before engine code.

## WATCH
- **Future keyed maps:**
  - merge_ref.js:96 lists `steps`, `rules`, `extraSteps`, `amounts` and `once` by name.
  - An older build on a second device merges any keyed map added later as part of the whole record, and drops the other device's keys.
  - Either build every future field as a list of records with ids, or have version one find keyed maps by shape: a map whose values all carry `at`.
  - Version one is the only chance, because builds already on phones cannot be changed afterwards.

Files:
- /tmp/foundation_confirm4/g1_away_three_weeks.js
- /tmp/foundation_confirm4/g2_ag1_vs_mg117.js
- /tmp/foundation_confirm4/g3_x8_removed_key.js
- /tmp/foundation_confirm4/g4_x8_moved_schedule.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/move_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
