(qc-foundation confirming review 6, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Both suites pass as stated on wip-38.31: 713 of 713 asks and 636 of 636 cases, and the same again in the realistic-ids run (963 and 93 ids rewritten). I found one fault in how the clock reads shared `ui` keys. AK1, as worded, would carry the same fault into `home` and make it worse. I also found two missing rows, and one of them needs a saved-shape change. My scripts are in /tmp/foundation_confirm6/ (k1 to k3).

## FOUNDATIONAL

**1. What a device "has seen" leaves out every shared `ui` key's `at` (missing cell: shared `ui` x a fast clock that was seen and then edited).**
- **The cause:** `newestAt` (rules/merge_ref.js:239-246) only counts a string `at` on an object. `ui.at` is a map, so no `ui` key time is ever "seen". Two places use it: the devices harness (line 311) and `restore` (line 357).
- **k1, editing:** the desktop is 3 hours fast and sets a `ui` key at 13:00. The phone takes it in at 10:30 and the person then changes the key on the phone. The phone stamps the change 10:30, and at the next merge it loses to the value it replaced. SCHEMA_V3 section 0 promises the opposite: every write is strictly newer than anything the device has seen.
- **k1, restore:** a restore on that phone stamps the `ui` keys 10:30. The cloud's 13:00 key comes back, which breaks AE5 ("a device whose clock is behind still restores all of it").
- **Needs:** `newestAt` also reads per-key time maps, plus one case for the edit and one for the restore. This is a reference fix, but an engine coded from today's reference would save wrong `at`s.

**2. AK1 (being coded, soundness check): "like the shared `ui` keys" needs its shape spelled out.**
- **The risk:** if `home` takes the `ui` shape (`at` and `by` as maps), every place that handles records breaks, because each one checks for `k === 'ui'` or a string `at`:
  - `merge` (line 212): `pick` compares two map `at`s, gets NaN, and falls back to `by`. In k3 the phone's newer minimum of 30,000 is lost.
  - `holdArriving` (line 272): a `home` from a clock 3 days fast is not held and no warning shows. In k3 a minimum of 0 wins, so safe to spend is too high.
  - `restore` (line 392): the backup's `home` comes back with no new stamp and loses to the cloud. In k3 the restored minimum of 50,000 is lost again.
  - `newestAt`: item 1.
- **Needs:** one handler for "a record whose fields each carry their own `at`", used by all four, found by shape and not by the name `ui`. `ui`, `home` and the rows in item 3 should all use it.
- **Also:** `minBank` is the minimum for `mainBank`. If they merge one by one, bank B can end up with the minimum someone set for bank A, which can be a lower one. Say whether the two merge as a pair.

**3. Missing rows: `imports.cats` and `plan.limits` (two devices, undo, restore, days away).**
- **`imports.cats`:** `imports` is one record with one `at`. `cats` maps a merchant to a category as plain strings, so it is not a keyed map (`keyedShape`, line 145). In k2 the phone teaches "seven eleven", the desktop teaches "amazon co jp", and only the desktop's lesson survives.
  - The category decides which budget line an imported spend counts against.
  - **Needs:** each value as `{ cat, at, by, gone }`. This is a saved-shape change, so it has to be decided now, for the same reason as AH5: builds already on phones cannot learn a new shape.
- **`plan.limits`** (`ceiling`, `aims`): this is the same kind of thing as mg-198, which AK1 just decided for `home`. Give it the same rule.
- COVERAGE itself says shared `ui` "has no row of its own" (line 471). Item 1 shows it needs one.

## Unrealistic test inputs (beyond ids)
I scanned every scenario and rule file.
- **Sound:** amounts are fractional only in major-unit scenarios that `minor()` converts, 339 inputs are zero, and there are seven currencies including a 3-decimal one and an unknown code. Dates run to 2036. Names never feed ids, and 38.31 ids are `SAFE_ID` (`[A-Za-z0-9_-]{1,24}`), which the moved-id pattern accepts.
- **Not tested:**
  - **Offsets:** 2,588 times are at +09:00. Only 6 are at -05:00, there is no half-hour offset, and none changes for daylight saving or travel. No time-zone change on one device is tested (WATCH).
  - **Times and amounts:** every time is on the hour with .000 ms. The largest amount is under 10^8. Neither is a risk in the current maths (BigInt interest, integer minor units).
  - **Id case:** ordinary ids must be lowercase (mg-189), but SCHEMA_V3 section 0 only says "letters and digits". If the engine's id maker uses capitals (base62, for example), it fails `idOk`. Say "lowercase" in the schema.

## Spot-check of 20 cells (all real covers)
- **home:** D (mg-197 to mg-200), U (mg-201, mg-203), R (mg-204, mg-205), A (mg-206), L (mv-123, mv-124).
- **AJ fixes:**
  - E: ed-35 to ed-39, x8o-01 to x8o-04
  - built-id D: mg-177 to mg-189
  - loan / pay-later D: mg-190 to mg-195
  - AJ-confirm: mg-196
  - AJ5: ed-40
- **Will change:** mg-198 is real today, but AK1 reverses it.

## Hand-checked, all correct by my own working
- **ac-01:** 300,000 - 8,000 = 292,000. **ac-02:** 292,000 (nothing due before the 25 Nov pay). **ac-03:** 320,000 - 3,000 - 300,000 = 17,000.
- **x8o-02:** 10 days, to Fri 25 Dec. **x8o-03:** nothing to confirm. **x8o-04:** 300,000 - 80,000 + 250,000 = 470,000.
- **biweekly-08:** 1,280.00 - 45.50 - 100.00 = 1,134.50. The lowest point is 15 Dec, within a horizon to 18 Jan.
- **ed-35:** refused, offer Sat 26 Dec. **ed-36:** allowed (`-4@` is not read as `-41`). **ed-38:** refused, offer Fri 26 Feb.
- **mg-197** and **mg-203:** right by D4.

## Rule fixes before coding (no saved-data change)
- **AK2, a gap:** "the new rule's first occurrence in the same month" has no answer when the change starts after the new pay day in that month. Example: a 25 Dec bonus, the new pay day the 10th, the change from 15 Dec: there is no December occurrence on or after 15 Dec. The rule also needs to say what happens when the target date already has its own `amounts` key.
- **AK3:** sound.
- **Schema wording:** `people` is shown as `{ id, name, at }` (2.1), but section 0 says every list record also has `told` and `by`.

## WATCH
- **`plan.limits.ceiling`** is "most you want to spend in a month" (wip/team/model.js:28): a calendar-month amount with no `per`, the Lesson 1 pattern. It needs `per` before any screen uses it.
- **Device offsets:** a device whose offset changes (travel, daylight saving) is not tested. Dates are the writer's own calendar, so a spend dated the day before a check made in another zone can be read as inside that check. Low risk for the Japan and Philippines personas.

Files:
- /tmp/foundation_confirm6/k1_ui_seen.js
- /tmp/foundation_confirm6/k2_imports_cats.js
- /tmp/foundation_confirm6/k3_ak1_shape.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
