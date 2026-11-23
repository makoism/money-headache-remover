# The rich merge's cases, kept as the stage 2 spec (AQ5, for qc-regression to sign)

Mako decided on 23 Nov (DECISIONS.md, "Phone and desktop in version one"; DECISIONS_ROUND2 AQ) that version one asks which to keep when the same plan or settings item changed on both devices, and that automatic field-by-field merging moves to stage 2. AQ5 keeps the rich merge rules (D4 to AP5 where they are about merging) for stage 2: their cases are labelled `"stage": 2` in `rules/merge.json`, keep passing against `rules/merge_ref.js`, and nothing is deleted or weakened. Version one's own sync is `rules/sync_v1.json` with `rules/sync_v1_ref.js` (57 cases) and `rules/fuzz_two_devices.js`.

## How the line was drawn

A case is stage 2 when it is about merging two copies: what the merge of two copies gives (questions `merge`, `merge_symmetric`, `merge_same`, `merge_both`, `came_back`), a copy held on arrival because it is far ahead (`receive`), a restore followed by a merge (`restore_merge`), the notices and moves written after a merge (`main_notice`, `lost_notices`, `after_merge`, AN2, AN6, AN-note, AM2), and every two-device story with a sync step (`devices` with `sync`).

A case is not labelled when it holds in version one too: the hybrid clock on one device (`next_at`, `next_at_warn`, `clock_ask`, `newer`, `seen`, and the one `devices` story with no sync, mg-128), the ids (`id_for`, `id_ok`: AQ2 keeps every built id), a restore on one device (`restore`: what the restore writes; version one then syncs it like any edit, sync_v1 sy-54), and the shop key and lessons on one device (`cat_key`, `cat_learn`).

## Counts

| | Cases |
|---|---|
| `rules/merge.json` | 287 |
| labelled stage 2 | 201 |
| not labelled (version one too) | 86 |
| passing against merge_ref.js, stage 2 included | 287 of 287, and 287 of 287 with realistic ids |

Check: `node foundation_review/rules/run_rules.js merge` prints `merge: 287 passed (201 cases stage 2), 0 failed, 2 open questions`. The labelling script checked that the only change to each case is the added `"stage": 2` (every other field compared before and after), and that exactly these 201 carry it.

## Stage 2 (201 cases)

| Question | Cases | Ids |
|---|---|---|
| `merge` | 75 | mg-06, mg-07, mg-08, mg-09, mg-10, mg-11, mg-12, mg-13, mg-14, mg-15, mg-16, mg-17, mg-18, mg-19, mg-26, mg-28, mg-29, mg-31, mg-32, mg-36, mg-37, mg-40, mg-41, mg-45, mg-47, mg-55, mg-56, mg-57, mg-61, mg-68, mg-69, mg-70, mg-73, mg-74, mg-75, mg-84, mg-85, mg-86, mg-100, mg-101, mg-102, mg-103, mg-104, mg-105, mg-106, mg-107, mg-116, mg-117, mg-120, mg-135, mg-136, mg-137, mg-138, mg-172, mg-174, mg-175, mg-190, mg-192, mg-193, mg-194, mg-196, mg-197, mg-198, mg-199, mg-201, mg-202, mg-203, mg-210, mg-215, mg-218, mg-219, mg-231, mg-233, mg-235, mg-240 |
| `merge_symmetric` | 6 | mg-20, mg-22, mg-173, mg-191, mg-211, mg-230 |
| `merge_same` | 2 | mg-21, mg-232 |
| `devices` with a sync step | 61 | mg-23, mg-24, mg-25, mg-27, mg-39, mg-42, mg-43, mg-44, mg-49, mg-54, mg-129, mg-130, mg-131, mg-132, mg-140 to mg-167 (28), mg-169, mg-170, mg-206, mg-208, mg-209, mg-213, mg-224, mg-225, mg-226, mg-243 to mg-252 (10) |
| `came_back` | 1 | mg-30 |
| `receive` | 15 | mg-38, mg-46, mg-48, mg-108, mg-133, mg-134, mg-168, mg-171, mg-200, mg-207, mg-216, mg-220, mg-221, mg-241, mg-242 |
| `restore_merge` | 10 | mg-97, mg-99, mg-109, mg-112, mg-113, mg-115, mg-205, mg-212, mg-214, mg-217 |
| `main_notice` | 4 | mg-253, mg-254, mg-255, mg-256 |
| `merge_both` | 12 | mg-257, mg-258, mg-259, mg-260, mg-261, mg-262, mg-263, mg-278, mg-279, mg-280, mg-283, mg-284 |
| `lost_notices` | 4 | mg-264, mg-265, mg-266, mg-267 |
| `after_merge` | 11 | mg-268, mg-269, mg-270, mg-271, mg-272, mg-273, mg-274, mg-275, mg-276, mg-277, mg-287 |

## Version one too, not labelled (86 cases)

| Question | Cases | Ids |
|---|---|---|
| `next_at` | 8 | mg-01, mg-02, mg-03, mg-04, mg-33, mg-236, mg-237, mg-239 |
| `newer` | 1 | mg-05 |
| `next_at_warn` | 7 | mg-34, mg-35, mg-121, mg-122, mg-123, mg-124, mg-238 |
| `clock_ask` | 3 | mg-125, mg-126, mg-127 |
| `seen` | 3 | mg-227, mg-228, mg-229 |
| `devices` with no sync | 1 | mg-128 |
| `id_for` | 10 | mg-50, mg-51, mg-52, mg-53, mg-62, mg-63, mg-64, mg-71, mg-79, mg-80 |
| `id_ok` | 36 | mg-58, mg-59, mg-60, mg-65, mg-66, mg-67, mg-72, mg-76, mg-77, mg-78, mg-81, mg-82, mg-83, mg-87 to mg-95 (9), mg-177 to mg-189 (13), mg-234 |
| `restore` | 14 | mg-96, mg-98, mg-110, mg-111, mg-114, mg-118, mg-119, mg-139, mg-176, mg-195, mg-204, mg-222, mg-223, mg-281 |
| `cat_key` | 1 | mg-282 |
| `cat_learn` | 2 | mg-285, mg-286 |

## For qc-regression to look at (not labelled: outside merge.json, or changed by AP7)

- **mg-282 and mg-285, mg-286 (AN7's shop key and lessons).** AP7 names 38.31's `stmtNorm` as the key function and adds `src: 'moved'` between a lesson and a guess. sync_v1 follows AP7 (sy-50, sy-51). mg-282 still checks AN7's older key (trimmed, lowercased, `k:` in front), so `merge_ref.catKey` and `sync_v1_ref.catKey` differ (`"SEVEN ELEVEN 1234"` is `k:seven eleven 1234` in one and `k:seven eleven` in the other). Left as it is (nothing weakened); whoever codes AP7 into merge_ref and the move re-works mg-282 by hand, and mv-28, mv-125 to mv-127 with it.
- **Cases in other files that call the rich merge** (`merge_ref.merge`): `rules/move.json` `move_two` (mv-41, mv-42, mv-67, mv-86, mv-95, mv-96) and `move_later` (mv-82 to mv-85, mv-97 to mv-99, mv-116, mv-123 to mv-127) when no cloud copy is named; `rules/period_end.json` `leftovers_merged` (pe-36, pe-37, pe-40 to pe-43) and `share_out_merged` (pe-55 to pe-59, X5: the newer placing gives way silently, which AQ4 turns into a question, sync_v1 sy-41, sy-42). The brief covered the mg cases only, so these are not labelled; qc-regression decides whether they are stage 2 too.

## Signed

qc-regression: ______ (date) ______
