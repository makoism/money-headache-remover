(Efficiency review of the review loop, 23 Nov 2026. Copied from the reviewer's reply.)

**Verdict:** Option (a) does not converge, and that is the biggest waste. Over the last six rounds the findings went 2, 3, 3, 3, 2, 3, with no downward trend. Eight new grid columns are rooted in multi-device behaviour (moving on two devices, a late second move, restore, days away, edited after settled on two devices, a closed account on two devices, offsets, the clock). Each round also adds rules that the engine must then build: merge_ref.js is already 583 lines. Lesson 1 says a finding that keeps coming back gets traced to its cause. The cause here is the promise itself: any offline edits on two devices merge silently with no question. That is a hard distributed-systems problem, and reviewers will keep finding new combinations for as long as the promise stands.

**(a) Keep going round by round.** Data risk: low while nothing ships, but the rich merge then becomes engine code that Mako's real data depends on. Date: no end in sight, and every round adds engine hours, which costs more than the review hour. 14 to 19 Dec slips. Saved shape: it keeps changing.

**(b) Simplify v1 sync.** How it works:
- The cloud copy gets a revision number, and a write is accepted only if it was based on the latest revision (compare and swap on the vault server, which E3 already brings into stage 1a).
- Events are append-only with built ids, so joining them is safe.
- If both devices changed the same plan or settings record, the person picks, and the version not chosen is kept as a record so Undo still works.
- After every sync, the same checks used for one device run (X8, closed account, minimums). Any failure becomes a question, not a per-case rule.

Data risk: removes silent picking, fast-clock holds and union-restore surprises (a restore really rolls back). It adds one risk: the person may pick wrong, but nothing is lost. Date: it shrinks engine merge work by roughly 10 to 20 hours and ends the merge review loop in one or two rounds. Saved shape: nothing has to change. Keep the per-entry at, by and gone, and keep the built ids. Add the revision number (cloud envelope) and a "kept other version" record. AP3 (the same statement imported on two devices) still needs its built-id answer now, because ids cannot change later. D6 (old pages go read-only on newer data) makes it safe to switch on the rich merge in stage 2.

**(c) Freeze the shape and start the engine lanes in parallel.** Data risk: none while nothing ships. The risk is rework, because AN2 and AN6 changed lookahead_ref.js as well as the merge. Date: it saves wall time, but it carries the open-ended merge work into the engine.

**Recommend (d) = (b) plus (c) plus one script:**
1. **Decide (b) now.** Rewrite the merge section of SCHEMA_V3 for v1, and keep every existing mg case passing against the reference as the stage 2 spec. No test is deleted or weakened; they are labelled stage 2, and qc-regression signs the list. Answer AP3 with built import ids. Size: 3 to 5 hours.
2. **Replace hand rounds with a two-device fuzz script.** It runs random offline operation sequences on two devices with realistic ids, then syncs. Then it asserts:
   - merge(A,B) equals merge(B,A), and merging twice changes nothing
   - every edit is either present or waiting as a question
   - nothing is doubled
   - every check that runs on one device passes after a sync

   This is the script that catches what reviewers have been finding by hand, at Sonnet or no-model cost.
3. **Start the engine lanes today, in parallel** (RECOMMENDATION 5b): the ledger port with schedules and look ahead, and the second checker. Each works in new files on its own branch. The main line keeps SCHEMA_V3.md, COVERAGE.md, DECISIONS_ROUND2.md, merge_ref.js, lookahead_ref.js, model.js, the screens and check.sh. If a review changes lookahead_ref.js, the lanes rebase rather than edit it.
4. **One confirming review of the simplified sync plus the fuzz, then freeze.** After that, qc-foundation runs only at the lane gates.

Date effect: the shape freezes in about one day instead of open-ended, and the merge lane gets smaller. 14 to 19 Dec stays plausible, probably at the earlier end.

**For Mako (one question, at the level of the cause):** "Version one: if the phone and the desktop both change the same plan item while offline, the app asks you which to keep (nothing is lost) instead of merging silently. Automatic merging comes in stage 2. Recommended: yes." This reverses decision D4 in DECISIONS_ROUND2 ("it never asks keep mine"), so it is his call.

**Watch:**
- Do not let (b) grow back into the rich merge one "small rule" at a time. Any new merge rule beyond what (b) asks for is labelled stage 2 unless it is about ids.
- The coverage grid has gained 10 columns, so "every applicable cell covered" is a moving target and cannot serve as the only stopping rule. Freeze the columns at step 4.

Files read:
/home/user/money-headache-remover/wip/team/LESSONS.md
/home/user/money-headache-remover/wip/team/foundation_review/RECOMMENDATION.md
/home/user/money-headache-remover/wip/team/foundation_review/DECISIONS_ROUND2.md
/home/user/money-headache-remover/wip/team/foundation_review/COVERAGE.md
/home/user/money-headache-remover/wip/team/foundation_review/confirm_review_1.md to confirm_review_8.md
/home/user/money-headache-remover/wip/team/foundation_review/final_review_1.md to final_review_3.md
/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
