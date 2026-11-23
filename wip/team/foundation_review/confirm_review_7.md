(qc-foundation confirming review 7, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Both suites pass on wip-38.31 as the brief says: 716 of 716 asks and 693 of 693 cases, and the same again in the realistic-ids run. Two things would need a rule or engine change later and should be settled before engine code. One is in how version one merges records of separately edited fields, which builds already on phones could never pick up later. The other is a two-device case X8 has no answer for. AM3 as worded also counts ordinary spending twice. No new saved field is needed except possibly for AM1. My scripts are in /tmp/foundation_confirm7/.

## FOUNDATIONAL

**1. The field-value handler keeps "mine" and the two devices never agree when a record holds one plain field (soundness of AL1, the same kind of problem as AH5).**
- **The cause:** `fieldsShape` (rules/merge_ref.js:166-171) needs every value to be a field value, an entry list or a nested record of that kind. If both copies fail that test, `merge` falls to `out[k] = a` (line 213), which keeps "mine" whole.
- **s1 shows three ways in:**
  - A later build, or a bug, adds one plain field to `home` on both copies. The phone ends with country JP and a minimum of 30,000; the desktop ends with PH and no minimum. merge(P, D) and merge(D, P) differ, so the devices never converge and each loses the other's edits.
  - A `home` holding only `curs` on both copies drops the other copy's currency entries.
  - `imports: { cats: {}, files: [...] }` on both copies keeps only one copy's files.
- **Same fault elsewhere:** `plan` and the top level use the same fallback for any map with no `at` of its own.
- **Why it is the base:** AH5 and AI2 exist because builds already on phones cannot learn a new shape. This fallback is in version one's merge.
- **What the base needs:** merge every map with no `at` of its own key by key. `mergeKeyed` already settles plain values in the same way on both devices, so the fallback becomes one line. Add symmetric cases with a plain field, a `home` holding only `curs`, and an empty `cats`.
- **Cost:** under an hour now. Later it cannot be fixed on builds already in use.

**2. A merge can make a copy that X8 refuses, and nothing says what happens next (missing cell: E edited after settled x D two devices, on income, bill and keyed-override rows).**
- **Who:** pay on the 10th. On 10 Dec the desktop ticks the pay. On 11 Dec the phone, offline since 9 Dec, changes the pay day to the 25th "from 1 Dec".
  - X8 on the phone allows it, because the phone has seen no December settle.
  - The desktop would have refused it and offered 11 Dec (s2).
- **What happens:** the merged copy is exactly scenarios/x8_ordinary_ids.json, and the look ahead throws "refused X8" (ref/lookahead_ref.js:377-383). If the engine has no guard, it counts a phantom 25 Dec pay instead: confirm_review_1 item 8, now coming in through the merge.
- **Same for a moved bonus key:** AL6 moves a bonus key on one device while the other device edits the same key. The orphaned key is still live and trips X8 the same way.
- **What the base needs:** a P3-style rule. After a merge, a change that starts on or before a settled or named occurrence moves to the day after it (the edit's own offer), written with a new `at` and shown to the person. Add cases, and a grid cell E x D.
- **Cost:** about an hour now. Later an engine that throws, or shows a phantom pay, after an ordinary sync.

**3. Two stores for the main bank's minimum.**
- SCHEMA_V3:99 still says the main bank takes `home.minBank`. AL3 moved the minimum to `home.main.v.min`, but accounts still carry their own `minBank`.
- The model reads only the account's `minimum` (lookahead_ref.js:1206).
- Nothing says which one wins when both are set. That is the Lesson 1 warning sign of one figure in two places.
- **Needs:** "the main bank's own `minBank` is always null; its minimum lives only in `home.main`", and line 99 fixed. This is wording, but it decides what gets saved.

## AM soundness
- **AM2:** sound. The device whose pair lost can tell at its own merge from what it holds on the device, so no shared field is needed.
- **AM3 counts yesterday's spending twice in the most ordinary case.** Example: the person types the bank figure at 09:00, then logs yesterday evening's 2,000 at 09:05. Under AM3 the spend is judged by `told`, so it falls after the check.
  - Bank today shows 2,000 less than the bank app.
  - Safe to spend is low until the next check, which then finds an unexplained 2,000 gain.
  - Today's H1 (lookahead_ref.js:524) gets this right.
  - **Better rule:** an event is inside the check when the end of its date, in its writer's offset (taken from its `told`), is at or before the check's moment; otherwise judge it by `told`. That fixes offset_travel and leaves the ordinary case alone.
- **AM1 has no saved home.** The add-or-replace pick happens in the edit dialog (rules/edits_ref.js:53-58). Saying the walk counts the safe side "until they pick" assumes a lasting not-yet-picked state.
  - After a merge, `amounts` keeps one value per key, so the losing amount is gone, not waiting for a pick.
  - Either say the change is not saved until the person picks, or decide a saved shape now.

## Grid
- **Missing cell:** E x D (item 2).
- **Missing combination:** Z x D. A spend logged on one device on an account closed on the other device meanwhile. cr-05 is single-device.
- **Missing row:** `people` (D, U, R, M; `mv:person:ui.name`). No money rule reads `owner` yet.
- **Stale count:** COVERAGE.md:60 still says "328 of 328"; the header says 352.

## Unrealistic test inputs
- **Field values too clean:** every field-value case holds only field values, with no plain field, no empty sub-map and no `home` holding only `curs`. That is what hid item 1.
- **Asks that expect a known-wrong answer:**
  - ot-01 expects 377,000 while its own note says the bank really holds 375,000.
  - ot-03 then gives a headline of 37,000. The hand answer is 35,000, so it is 2,000 too high, the unsafe side.
  - Under AM3 these become 375,000, 20,000 and 35,000.
- **Shop keys:** the cases use lowercase names ("seven eleven"). Moved copies keep 38.31's AI-read keys ("SEVEN ELEVEN", mv-126). Not a merge risk (see WATCH).

## Spot-check of 20 cells (all real covers)
- **shared `ui`:** D mg-213, A mg-246, V mg-249, L mv-126.
- **`imports.cats`:** D mg-218, mg-220, mg-225, mg-230; U mg-244; R mg-222; A mg-247; V mg-252; seen mg-227.
- **`plan.limits`:** D mg-221, mg-233; U mg-245; R mg-223; A mg-248; V mg-251.
- **Offset column V:** mg-240, mg-243, ot-01 to ot-03. These are real covers, but the asks enshrine the wrong answer above.
- I also read the whole handler (merge_ref.js:157-213, 230-273, 364-399).

## Hand-checked, all correct by my own working
- mg-213: 13:00:00.001, monthly.
- mg-220 and mg-221: held at 24 Nov 12:00:00.001.
- mg-222 and mg-223: stamped 28 Nov 09:00, aims removed.
- mg-227: 25 Nov 09:00.
- mg-240: 06:20Z beats 05:50Z.
- mg-243 and mg-252: 01:00Z beats 00:00Z.
- mg-247, mg-248, mg-251 (42,000).
- ot-02 and ot-03, by the rule as it stands today.

## Stage-2-only / WATCH
- **`imports.cats` keys:**
  - 38.31 saves the AI's guesses too and caps the map at 400 by deleting keys (src/ui45v.js:240-242). Under "nothing is deleted" a deleted key comes back from the other device, so the map can only grow.
  - Define the shop key's form now (38.31's `r.k`, as read by the AI). If the statement reader later changes how it forms keys, every saved lesson would have to be re-keyed.
  - Never write the reader's guess over a lesson the person typed.
- **`__proto__`:** a shop key read off a statement could be `__proto__`; a plain-object merge drops it. Low risk.

Files:
- /tmp/foundation_confirm7/s1_plain_field_in_fields_record.js
- /tmp/foundation_confirm7/s2_x8_across_two_devices.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/scenarios/offset_travel.json
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
