# LANE state (kept by LANE C since 25 Nov 2026, 16:45 JST; the file keeps its old name)

LANE C (session_01BFpKEYZiAu8h8WESqH2Nwo) took this lane over from LANE B (session_01BFpKEZBRWqdY7tLMMx4sDU, closed for new work). Everything below the next section was written by LANE B and still holds unless this top part says otherwise. If Mako says pause (MAKO_SAYS M84): commit, push, mark this file PAUSED at the top, switch off the hourly wake-up "LANE C keep going", start nothing, tell the coordinator in one line.

Read CLAUDE.md, MAKO_SAYS.md, LESSONS.md, RUNBOOK.md sections 4, 4b and 5 first. The lane never merges into wip-38.31 or main: it pushes its own branches and tells MAIN 16 (session_01BFpKEXwwdFrqMuakSKhAF2) and the coordinator (Coordinator 12, session_01BFpKEZhy3Va2Px9ZqnUfCG) by send_message. Never ask Mako anything. Anything meant for Mako is written whole, in plain words with the figures in it, no branch names or hashes (M85).

## The exact next step (written 25 Nov 22:10 JST by LANE C; the clock times LANE B wrote below, such as 19:30, run about three hours ahead of Japan time)
Worktrees in LANE C's container: /home/user/staledoor, /home/user/monthrule, /home/user/endperiod, /home/user/rjournal (lane/restore-journal), /home/user/qcscripts, /home/user/restore, /home/user/lanestate (this file). Tools are in /home/claude/work/tools. Coordinator 13 is session_01BFpKEWgQD8znW39bWtecba; the main build session is MAIN 17, session_01BFpKEV1GxHfTcdKMQxFr1i (its join branch is lane/ai-join). Reports and merge-ready notes go to both. The coordinator keeps the hourly wake-up "LANE C keep-going"; LANE C makes none of its own. Read the machine's clock (TZ=Asia/Tokyo date) before writing a time. A full check can fail once at a page open when a reviewer's browsers are busy: run the failed test alone, then the whole check again; never call a log all good without reading its last line.
1. lane/staledoor e0f054d6: MERGE-READY, note sent 21:25 to MAIN 17 and the coordinator (M61: a save made on something that changed elsewhere since it was opened is refused; plan, plan review, build, data safety review all in the branch). The coordinator decides whether the candidate waits for it. Nothing owed unless MAIN 17 reports a merge problem.
2. lane/monthrule 09cbf5ac (on the newest join): CA4, CA5, CA6 (the month rule, three rulings) and CA7 (a "this pay only" amount read by when it was written, never by list order). Full check ALL GOOD (95 tests). RUNNING: qc-numbers on the build (started 22:05), round folder qc_reports/2026-11-25_monthrule. THEN: fix its fails; ONE qc-foundation on the build; merge-ready note. Plan's words "Comes off by the day" are MAIN 17's to change after the merge (suggested words sent).
3. lane/endperiod (0afc9932 and later): the fourth plan review (FAIL, small) is saved and its gaps are in the plan's last section. BUILT: slice 0 first part (engine/sync.js sharesQuestions judges kept places only; engine/test/sync_period_end.test.js in run_all). RUNNING: ONE Opus builder on slice 1 (app3/src/endperiod3.js and tests/endperiod3.test.js) from a tight brief. WAITS FOR THE COORDINATOR'S RULING: a goal that gave out more than it holds with nothing to undo (recommended: the sync question lists the spends from that goal and offers "count this spend as everyday money"); then slice 0's second part with its two-device test. After slice 1: read the builder's diff, full check, qc-foundation on the build (the engine's sync changed).
4. lane/restore-journal 07b48680: a restore keeps no Undo journal (agreed with MAIN 17). Quick check green; full check RUNNING into qc_reports/2026-11-25_restore_journal/check3.txt; then commit the log and send the merge-ready note.
5. MERGED by MAIN 17 into lane/ai-join: lane/restore e7701736, lane/qcscripts ce2e5056.
One reviewer and one builder at a time; get_session before each start.

## Branches, in the order they should be merged

| Branch | Hash | State | Owes |
| --- | --- | --- | --- |
| lane/blockers | fd3e020 | MERGED into wip-38.31 with candidate 2 | nothing |
| lane/twofig-engine | cdb0d1a (was 89ac989 before the controls base was merged in) | check3 full ALL GOOD at 94af457 (89ac989 adds only the review report). qc-numbers FAIL (part review; blocker 1 fixed in 94af457, blocker 2 is a rule question ruled on, see below). qc-foundation FAIL, narrow (see the exact next step) | merge-ready note sent 25 Nov 16:00 (coordinator's ruling: merge now, the known-close card fault listed as known) |
| lane/cardpay-ask | 458fd74 (was 14b5c28) | on top of lane/twofig-engine (94af457 merged in). check3 full ALL GOOD at 14b5c28 | merges with, or right after, the engine branch. No reviewer has seen it yet (qc-controls and qc-layout-touch apply: it adds a question to a sheet) |
| lane/restore | 52cd58b | check3 full ALL GOOD, qc-foundation PASS (report committed) | qc-data-safety (on Opus, one reviewer at a time), then merge-ready |
| lane/cardclose | 799ebbc | MERGED into lane/ai-join (5254981e) | nothing |
| lane/monthrule | see the exact next step, 1 | built, reviews owed | see the exact next step, 1 |
| lane/endperiod | 2ed1c6c | the join plus the plan plus a red slice 0 test | see the exact next step, 4 |
| lane/state | this file | one file, wip/team/LANE_B_STATE.md; MAIN 16 was asked to merge it into wip-38.31 | keep it current |
| lane/qcscripts | 8fac696 | e3_boxwalk and e3_always done and in check3. m_lines.test.js and wording_lint.test.js are committed as work in progress: not in check3's table, not proved against a planted fault. e3_fit.js not written | finish the three, full check, report |
| lane/endperiod-plan | ffc0f91 | plan only (foundation_review/ENDPERIOD_PLAN.md). Three qc-foundation reviews; the last failed for the card gap, now fixed on lane/twofig-engine. The plan's last section says what changed | a fresh qc-foundation on the plan once lane/twofig-engine is merged, then slice 0 and slice 1 |
| lane/cardgap, lane/cardgap-tests | 3a829b6, bd662c5 | both are INSIDE lane/twofig-engine | do not merge these alone |
| lane/webkit | no commits | STOPPED: WebKit cannot be downloaded (the environment's network rules block cdn.playwright.dev and playwright.download.prss.microsoft.com). Only Mako can change that setting | nothing until the host is allowed |

## What is on lane/twofig-engine (four engine changes and one small fix, all in DECISIONS_ROUND2 section BZ and BK6)
1. BZ1 card gaps: a card's unlogged spending found at a check carries from, to and parts and is split by days over its stretch, like a bank's gap. Gaps are also cut at month starts while the plan runs by the day (no fixed pay). A card's first check runs from the day after its opening; a second check the same day is that one day.
2. BZ2 two pays: the pay marked most recently starts the period (engine/schedules.js periodPay; used by lookahead.js and periods.js).
3. BZ3 three values: res.canSpare { amount, lastDay, through }, res.everyday { full, counts, spent, left, lastDay, kind } or null, res.noJob { amount }. One headline rule: max(0, min(canSpare, everyday left)). Pay period lives are unchanged to the yen. With no fixed pay the headline changed (this month's everyday money was taken off twice).
4. BK6 bank after the cards: every card's next unpaid payment, to the latest of those days; the walk for it runs past the horizon; bankAfterCards[bank].laterCardDays names a card payment in the stretch with no amount yet.
5. heldByCheck also names a record inside the OPENING figure (qc-numbers blocker 1).
Files: engine/lookahead.js, engine/schedules.js, engine/periods.js, app3/src/receipts3.js (card gap rows by part), tests, check3.sh rows, three plans in foundation_review (CARDGAP_PLAN, THREE_VALUES_PLAN, AFTER_CARDS_PLAN). LANE B holds engine/lookahead.js until this is merged; MAIN 16's lanes keep off it.
Two older tests were reworked by hand because they carried the old double count: engine/test/periods.test.js (slice 6b) and app3/tests/e3_life_d.js (10 and 12 Dec). The hand-working is in their comments.

## Next steps, in order (the coordinator's order of 25 Nov)
1. See "The exact next step" above. When the engine branch is settled, send MAIN 16 and the coordinator the hashes of lane/twofig-engine and lane/cardpay-ask as merge-ready.
2. qc-data-safety on lane/restore, model "opus", brief: "read wip/team/MAKO_SAYS.md first", the build path, the round folder wip/team/qc_reports/2026-11-24_restore_confirm2, and the 150k token stop rule. Then merge-ready note.
3. The month rule, its own small branch after step 1: a person who types 40,000 a month is charged exactly 40,000 in every calendar month (the last day carries the difference down). Today a 31 day month is charged 40,767 (by the day: amount x 12 / 365). Plan through qc-foundation first; the test sums every month of a year to exactly the amount typed.
4. End-of-period: a fresh qc-foundation on the plan, then slice 0 (the sync fix in engine/sync.js, on the terms recorded in the plan) and slice 1 (a new file endperiod3.js with its node test).
5. lane/qcscripts: finish with ONE Opus builder helper (brief: exact files, new files in app3/tests only, a planted fault for each script).
6. Later, after lane/controls-base is merged: reminders saved with Undo.

## Rulings agreed with the coordinator that are NOT yet in DECISIONS_ROUND2 or MAKO_SAYS
- End-of-period (in ENDPERIOD_PLAN only): always ask, one line at a time, never pick for him; a goal is offered only when cards and bank are fresh; bank and Decide later always; undecided money stays in what the bank can spare and the card says so; carrying into the same line is not in the first version.
- No fixed pay: never call it "money with no job" and never offer it to a goal. Say "not needed before <the day the look-ahead reaches>, with no income counted", and offer only Decide later and Check your bank. (Screen words are MAIN 16's.)
- Home groups the by-day everyday terms of the sum into one per month (MAIN 16's two-figures work).
- The month rule in step 3 above.
- The card payment question's words: "Did <card>'s payment of <amount> go out on <day>?" with one button "Yes, tick it".
- For Mako's run, under Not settled 8: the 45 day look-ahead with no income for a person with no fixed pay; a far-out card makes "bank after cards" read high because plan lines are never taken off it.

## Faults found and passed on, not LANE B's to fix
- Setup: leaving a bill's name box moves its Remove button about 25 px, so a tap right after typing misses (MAIN 16 took it).
- Restore, builder notes from qc-foundation: a restore leaves an open "which to keep" question counting its own amount (backup3.js 118 to 120, about an hour); restoring while behind the cloud gives a mix (take the cloud copy first); the earlier-cloud-version question gives no count. The two curl lines in app3/VAULT_DEPLOY.md should be run once against the live vault.
- From qc-numbers, for Home (MAIN 16): the sum line is printed twice when a pay is late and for a savings account; "close days are not sure" is said for all cards when only one is; setup says "Everyday spending", every screen after says "Free to spend".
- screens/names.js:31 still states the old after-cards rule; ask3_core.js:52, 148, 187 and :79 should read the new fields (MAIN 16).

## Traps hit, so nobody hits them twice
- A fresh container has no /home/claude/work/tools/node_modules. Install puppeteer-core, acorn and acorn-walk there with npm (outside the repo) or no_maths and the puppeteer tests fail to start.
- Usage limits: too many helpers at once emptied a 5-hour window in under an hour. One builder helper and one reviewer at a time. Call get_session (no id) and read external_metadata.rate_limit_info before every start. After a stop, helpers are resumed with SendMessage to their agent id, not started again.
- A helper started with the Agent tool cannot itself start reviewers. Run reviewers from the lane session.
- A reviewer may not write its report file. If its answer comes back with no file in the round folder, save the answer there yourself and say so at the top.
- The scratchpad folder is shared by every helper: give each its own subfolder.
- Built files (app3/index.html, app3/sw3.js) are tracked. On a merge conflict in them, take either side and run ./build3.sh; never hand-merge them.
- e3_onepay and e3_setupfix were red on the base on 24 Nov morning (fixed since by lane/candfix). If a test fails, run it on the base first before blaming the change.
- ?today= holds the page's day while the device clock runs on. A test or reviewer session that crosses midnight UTC makes a record's told time earlier than the setup's: it then counts as inside the opening figure. That is the rule, and it is now named on the row.
- no_maths: files in app3/src may not add, subtract or flip signs. Compare the engine's own figures, or keep lists of markers (see src/back3.js and payAsks3 in src/checkin3.js).
- When a reviewer's FAIL turns out to be a settled rule, bring the coordinator the cause and a recommendation; do not loop reviews (the end-of-period plan went three rounds before the cause was found in the engine).
- Worktrees: /home/user/cardgap (lane/twofig-engine), /home/user/cardpay (lane/cardpay-ask), /home/user/cardgap-tests, /home/user/lanestate (this file, branch lane/state), and the helpers' under .claude/worktrees. The main checkout /home/user/money-headache-remover is on lane/blockers.
