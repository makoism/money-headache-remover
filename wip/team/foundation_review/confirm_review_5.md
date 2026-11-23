(qc-foundation confirming review 5, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

Everything passes as stated: 582 of 582 cases and 709 of 709 asks on wip-38.31. I found one fault that runs through every reference: every test names schedules, places and accounts with short made-up ids like `pay` or `trip`, and the app never makes ids like that. I also found one false cover and one missing row, both about lists inside a record. AI2 as worded misses one of those lists. None of this needs a new field, but each needs a reference or rule fix before engine code. If the engine is coded from the references as they are, it saves records that are wrong for good. My scripts are in /tmp/foundation_confirm5/ (h1, h2).

## FOUNDATIONAL

**1. Built ids and X8 reject the ids the app really makes (false cover across the E column and every built-id cell).**
- **Who:** anyone whose pay, goal or bank they typed in themselves. That is every person except a moved 38.31 copy.
- **The rule:** SCHEMA_V3 section 0 says everything a person types gets an ordinary id, `k7qzpa-m2xq7ab9zt-41`. The regexes reading a schedule, place or account inside a built id only accept `[a-z0-9_]+` or `mv:...`, so any dash fails:
  - rules/merge_ref.js:64 (`REF`)
  - rules/edits_ref.js:13 (`OCC_NAME`)
  - ref/lookahead_ref.js:363 (the X8 guard)
- **What h1 shows:**
  - `idOk` returns false for `set:`, `auto:`, `skip:`, `pe:`, `ps:`, `rm:`, `close:` and `fee:set:` whenever they name a person's own schedule, place or account.
  - X8 allows a pay-day change "from 1 Dec" over a pay settled on 25 Dec. This is the phantom pay of confirm_review_1 item 8 again, now for every non-moved schedule.
  - The model's own X8 guard never fires either.
- **Why the tests miss it:** I grepped every rules and scenario file and found no built id naming an ordinary id. This is the warning sign from the lesson 3 addendum: unnatural inputs that keep a rule from ever being asked.
- **What the base needs:**
  - `REF` and `OCC_NAME` accept ordinary ids.
  - Cases for `id_ok`, `change_from` and the look ahead with ordinary ids.
  - Better still, run the whole suite once with every slug id rewritten to the ordinary form.
- **Cost:** under an hour now. Later it means settles that point at occurrences that no longer exist, saved in people's data. If `idOk` is used on load, it could also mean records rejected on load.

**2. Pay-later `plans` lose a plan when two devices edit the account (false cover: loan / pay-later x D).**
- **What the grid says:** the cell is covered by mg-06, which is a union of two unrelated spends.
- **What happens:** `plans: [ { id, amount, count, first, at, by } ]` (SCHEMA_V3:110) is not in `ENTRY_LISTS` (merge_ref.js:105). It is taken whole from the newer record.
- **h2:** the phone adds a 3 x 3,000 plan while offline, and the desktop adds a 6 x 5,000 plan. After the merge only one plan is left, so 5,000 is due on 5 Dec instead of 8,000 and safe to spend is too high.
- **AI2 (soundness):** "an array whose items all carry `from` and `at`" does not catch `plans`, because plans have `id`, not `from`. AI2 should also take any array whose items all carry `id` and `at`, merged by id.
- **Why now:** AH5's own reason applies. Builds already on phones cannot learn a new shape later.

**3. `home.curs` has no merge case (missing row: home and its dated entries).**
- SCHEMA_V3 2.1 says curs entries "merge by `from` like `rules` entries". The reference takes them whole from the newer `home`, and mg-16 is the only `home` case.
- **h2:** the phone adds PHP from April while the desktop sets the country. Only JPY is left, so the home currency never changes.
- AI2 as worded would fix this, but nothing tests it. It needs a grid row for `home` (curs, minBank, mainBank) across D, U, R and A, plus cases.

## AI soundness (being coded)
- **AI1:** sound. One note: when the receiver has already seen a copy less than a day fast, its newest seen can be later than its now. A record held at now plus 1 ms then sorts behind that copy, so a far-ahead edit can lose to an earlier slightly-fast one. Which edit should win is unclear either way, and the devices still end up with the same copy. No change asked, but please add one case so the result is fixed.
- **AI2:** see item 2. Widen it to id-keyed lists. Also say that the shape is judged on either copy, so a list empty on one side still merges entry by entry.

## Grid
- **Missing row:** `home` (item 3).
- **False covers:**
  - loan / pay-later D (item 2)
  - every E cell and every built-id D cell, which hold only for short made-up ids (item 1)
- **Column A:** no row is missing from it.

## Spot-check of 20+ cells
- **Column A, real covers for the clock:** mg-128 to mg-133, mg-140, mg-141, mg-144, mg-153, mg-155, mg-158, mg-162, mg-166, mg-167, and away_clock ac-01 to ac-03.
  - The 28 stories in mg-140 to mg-167 are one template: they test the clock, not each record's effect on the money.
  - The 45-day step relies on mg-122 for D8. The `devices` harness never asks the date.
- **AH2:** ed-25 to ed-31 are real, but only for `mv:` ids and the slug `pay`. Item 1 applies.
- **AH3:** ed-32 to ed-34 and kr-01 to kr-06 are real.
- **AH5:** mg-135 to mg-139 are real.
- **Inputs adjusted to dodge a rule:** I searched the notes and found none. The short ids in item 1 are the same kind of fault, but not deliberate.

## Hand-checked, all correct by my own working
- **kr-02:** 650,000 - 80,000 = 570,000. 27 Dec is a Sunday, so the rent moves to Mon 28 Dec. The 10 Jan pay moves to Fri 8 Jan.
- **kr-04:** 90,000, landing Mon 1 Mar.
- **kr-06:** 85,000, landing Mon 29 Mar.
- **mg-23:** 1,800 at 24 Nov 10:00:00.001.
- **mg-134:** e1 held at 23 Nov 09:00:00.001; e2, exactly a day ahead, not held.
- **mg-139:** 10,000 stamped 26 Nov 09:00; the February key removed (`gone`).
- **cbp-02:** 300,000.
- **cbp-05:** 270,000.
- **ed-26:** refused, offer 26 Dec.
- **ed-31:** refused, offer 26 Nov.

## WATCH
- **X8 and future keys:** a future `amounts` key (a December bonus) refuses a real pay-day change from December. The data is right, but the edit screen must offer to move or remove the key, or people will not be able to enter a new employer's pay day.
- **Other made-up test inputs:** other plain-looking inputs may hide rules the same way, for example account ids and place ids inside `pe:`. A one-off run with realistic ids everywhere is cheap.

## Stage-2-only
- None.

Files:
- /tmp/foundation_confirm5/h1_ordinary_schedule_ids.js
- /tmp/foundation_confirm5/h2_nested_lists.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
