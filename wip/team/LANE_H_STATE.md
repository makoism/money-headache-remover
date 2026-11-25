# LANE H state page (controls slices after the AI-first candidate)

LANE H: session_01BFpKEX35AmbptMfHTaRc9F (took over from LANE E session_01BFpKEV7kdsYcuUud2xQn49 on 26 Nov 2026, about 08:20 JST).
Report to: Burrow coordinator 16 (talk to this one), session_01BFpKEXBhaZ6NZ92Lntxb2A. MAIN 21 (session_01BFpKEVHbyeXL6RPkGN8J84) is the only session that merges into wip-38.31. LANE G (session_01BFpKEYUsU5n41PCNmuMV4H) has lane/whichdoor (act3 plan(), writer, undo()).
Keep-going task: trig_01YAKbKsvFSEfinBn9hNEaCf (hourly, bound to LANE H). Switch it off at handoff or when told to pause. LANE E's trig_01YUs9DHQaHbGbv9XdihHvo3: LANE E was asked to switch it off.
Never push to wip-38.31, lane/ai-join or main. Until Sun 29 Nov 09:00 JST: up to two helpers or reviewers at once, model opus.

## Now (keep current)
- Slice 1b on lane/controls-1 (after merging lane/ai-join in, ea2eefa4; a check3.sh conflict left in that merge was put right in 6befa5c2):
  - 6befa5c2 a yearly bill after setup (Add a bill: How often, Month; a yearly bill's sheet changes month and day from a date). tests/e3_billyear.js.
  - 3401df6f which account pays a card, a loan or a bill: chosen on Add a card / Add a loan, changed on each sheet (and a card's or loan's weekend rule), from the next payment on; refused with words while a payment gone by is not ticked off (it may already have left the old account); assistant add_card {account, shift}, change_bill {account}. tests/e3_payfrom.js, chat3_core.test.js [E1b].
  - Reminders kept on this phone (E3.rec 'remind'), the sheet says so and that a calendar already filled changes only with a new file. tests/e3_remkeep.js. (commit pending at the time of writing)
- Next: check3 full on controls-1, ask the coordinator for confirm_qc-controls.txt and confirm_qc-assistant.txt (round qc_reports/2026-11-26_controls1), run both (two at once), then carry 1b up the stack (2, 3, 5; slice 3's change_card gets payFrom/shift too), check3 full on controls-5, review round for slices 2 to 5 (qc-controls, qc-foundation, qc-data-safety, two at a time); merge order with LANE G for act3; loan check plan through qc-foundation; slices 6 to 9.
- To tell the coordinator with 1b: scope.txt sentence "No loan, goal or budget line can be added in setup (screens or chat); each is added on Plan right after setup" (ruling 1). A pay's account (where it lands) still cannot be changed after setup: not asked, noted.

## Rules for this lane
- Branch each slice from the newest origin/lane/ai-join as lane/controls-<n>; merge ai-join in again before each ready report. Push after every commit. Never push to lane/ai-join, wip-38.31 or main.
- Test first, one item per commit, `wip/team/app3/check3.sh quick <tests>` after each, full before each ready report.
- Through the write door (ACT3.run) only. Nothing deletes: remove marks gone. Every remove asks first (sure3) and has Undo. A true remove only when nothing names the record.
- Each door has two ways in: the screen and the assistant's `change` step (M3), with a change card and Undo.
- Reviewers per slice: qc-controls; plus qc-data-safety when saving or the write door is touched; qc-assistant when the assistant is; qc-foundation where CONTROLS_PLAN marks it. Round folder wip/team/qc_reports/<date>_controls<n>/, scope.txt from the coordinator. At most two at once, model opus.

## Order (what a person most needs first; Mako has one bank and two cards, M26 M27)
Plan: wip/team/foundation_review/CONTROLS_PLAN.md (with its BZ corrections). Slice numbers there in brackets.

| # | Branch | What | Mako lines | Plan slice | Reviewers |
|---|---|---|---|---|---|
| 1 | lane/controls-1 | The controls table (controls3.js, a counted test: every PLAN3W step, act3 list and assistant step has a row, missing doors marked todo). Plan > Accounts: every bank, cash and e-wallet listed; Add an account on the screens; rename an account (changeAccount); assistant change_account | M13 M3 M23 | 1, 4 | qc-controls, qc-assistant |
| 2 | lane/controls-2 | Close a bank, cash or e-wallet (not the main bank): money moved or written off, links moved, final check, closed; Reopen; Remove one added by mistake (no history only); asks first, Undo after a reload from the journal; assistant close_account, remove_account | M13 M14 M6 M45 M61 | 5 | qc-controls, qc-foundation, qc-data-safety |
| 3 | lane/controls-3 | Cards and loans: remove a card added by mistake; close a card at zero ("Pay it off now" when something is on it); close a loan early ("Pay it off now"); a loan's Still owed today; assistant change_card, add_loan, change_loan, close_loan | M13 M27 M40 | 6 (K6 K7) | qc-controls, qc-foundation |
| 4 | lane/controls-4 | Undo after a reload for changes made on the screens: a list of recent changes read from the saved journal, each with Undo (refused, with words, when a later change touched it) | M14 | BZ1 door | qc-controls, qc-data-safety |
| 5 | lane/controls-5 | Keep at least and the country changed after setup (a field write in act3 with a journal entry); assistant set_keep, set_country | M13 M42 | 3, 12 part | qc-controls, qc-foundation |
| 6 | lane/controls-6 | Remove a goal (with nothing in it; with money: back to spending money or into another goal); assistant remove_goal, change_goal, take_out | M13 M43 M45 M46 | 9 | qc-controls, qc-foundation |
| 7 | lane/controls-7 | Second income: Add a pay on Plan; End this pay (the dated startsPeriod entry moves to the other pay, BZ2); remove one added by mistake; assistant end_pay | M13 M38 M31 | 7 | qc-controls, qc-foundation |
| 8 | lane/controls-8 | A bank check changed or removed later (latest per account only; gap spend follows, BZ B and C) | M13 (bank check) | 10 | qc-controls, qc-foundation, qc-data-safety |
| 9 | lane/controls-9 | Currency: Start again (the book kept whole as a copy, setup filled in except amounts) | M13 M34 | 12 part | qc-controls, qc-data-safety |

Files most touched: app3/src/plan3.js, plan3_write.js, chat3_core.js, settings3.js, act3.js. MAIN 20 is on chat3_core/setup3 for the candidate: merge ai-join in often.

## Branches (stacked: each slice branch holds the ones before it; merge in order 1, 2, 3, 4, 5)
| Branch | Tip | State | Owes |
|---|---|---|---|
| lane/controls-1 | e8121c90 | slice 1: controls table, Plan > Accounts, Add an account, rename + own Keep at least, assistant change_account. check3 full ALL GOOD, round folder qc_reports/2026-11-26_controls1 (scope.txt by coordinator, screens) | qc-assistant FAIL, 1 blocker: plan3_write.js changeAccount says "Keep at least for your main bank is in Settings" but Settings has none until slice 5: on slice 1 say it cannot be changed after setup yet (slice 5 puts the Settings words back). Confusing to fix cheaply: "remove" of a G ref says "ref I do not know" (should say goals: Plan, tap the goal); statements words. qc-controls running at the time of writing. Then confirming runs |
| lane/controls-2 | 8a801015 | slice 2: close/reopen/remove a bank, cash or e-wallet, screens + assistant. quick ALL GOOD (26 tests) | merge controls-1 fixes; full check; qc-controls, qc-foundation, qc-data-safety |
| lane/controls-3 | 1f53a3e8 | slice 3: payOff, close a card at zero, remove a card or loan added by mistake, Pay it off now, assistant add_loan, change_card, change_loan, pay_off. quick ALL GOOD | a loan's Still owed today NOT built: the engine reads a loan from its opening only (engine rule, ask coordinator). Full check, qc-controls, qc-foundation |
| lane/controls-4 | ee399ac4 (slice 4 ends at b8031830; ee399ac4 is slice 5's first commit, a force push was refused) | slice 4: journal entries keep their Undo words; Settings > Recent changes with Undo after a reload | it lacks the slice 2/3 lint fixes: use lane/controls-5 for the full check. qc-controls, qc-data-safety |
| lane/controls-5 | (latest, after the merge of controls-3) | slice 5: act3 setField (home.main, home.country), setKeep, setCountry, Settings > Money Keep at least + Where you bank, assistant set_keep, set_country. quick ALL GOOD with slices 2 to 4 (e3_undoreload, e3_keepcountry, e3_cardclose, e3_acctclose, e3_accounts, e3_removes, e3_plan, e3_backup, e3_tabs, e3_boxwalk, e3_fakeai_page) | full check, qc-controls, qc-foundation, qc-data-safety |

## Notes for the next session
- Worktrees: main checkout on lane/controls-1 (reviewers use it: do not edit while one runs); .claude/worktrees/c2 (controls-2), c3 (controls-3), c4 (controls-5), estate (lane/e-state).
- Fresh machine: tools (npm install puppeteer-core acorn acorn-walk in /home/claude/work/tools), `git fetch --unshallow origin lane/ai-join wip-38.31 main`. Name the page tests for quick.
- Lints that bite: no_maths flags `a.length > 1 ?` and `x + (cond ? ...)` concatenations (use templates and `k[1] ?`); wording lint forbids semicolons in words; chat3_core SYSTEM must stay under 9,000 characters and each SCREENS line at least 6 words; e3_removes counts remove buttons by `label: '...'` literals; e3_fakeai_page counts Plan sheets (now 11).
- Page tests: scope selectors to #a3Plan; Home has its own [data-acct].
- Assistant tests: refs are rebuilt each turn (a closed account moves to the end): list again before using a ref in a later turn.
- Remaining slices: 6 goals (removeGoal with money back to spending or into another goal; change_goal, take_out), 7 second income (Add a pay screen, endPay with BZ2 dated startsPeriod entry, assistant end_pay), 8 bank check changed/removed later, 9 currency Start again.

## Slice 1 review results (round qc_reports/2026-11-26_controls1, both reports committed)
- qc-assistant FAIL, 1 blocker, FIXED at e8121c90 (main bank Keep at least now says it cannot be changed after setup yet). WHEN MERGING controls-1 INTO 2/3/5: keep slice 5's words "Keep at least for your main bank is in Settings" (true there) and its test line.
- qc-assistant confusing, not fixed: change cards show only safe to spend for rent/goal/end-bill (add the item's own before/after row); "remove" of a G ref says "ref I do not know" (say: Plan, tap the goal; slice 6 builds it); statements words after setup (Home, Add statements).
- qc-controls FAIL, blockers: (1) Reminders not kept after a reload, screen looks saved (scope says queued; harm worse); (2) a yearly bill cannot be added after setup (Add a bill has no How often); (3) a card added after setup is always paid from the main bank, and a card's paying account and weekend rule cannot be changed; (4) a bill's paying account cannot be changed; (5) no loan, goal or line in setup (coordinator to rule if M2 scope covers it). Asked the coordinator which go in which slice. Also its COUNT says 1 BROKEN where the grid has 2.

## Other lanes (26 Nov)
- Coordinator: LANE E goes first on plan3_write.js and card rows; LANE D merges ready controls branches before it builds M88 to M97.
- LANE D / LANE G: lane/whichdoor changes act3.js (writer swap op, plan sets w.at/w.by, journal `swapped`, undo handles swapped, api.answerSync, a "not set" marker in swap). My act3 changes (plan words arg, setField, undo list 'home', exports) are NOT merged with it: told both lanes; whoever merges second keeps both. Merge lane/whichdoor into lane/controls-5 before its reviewers if it has landed in ai-join.
- LANE F/G cash plan (lane/cash-1...) changes lookahead, cards words, chat3_core noteOf, setFree in plan3_write; it merges my ready branches before touching plan3/setup3/settings3/act3. It wants: card paying bank and paid-in-full change (not built: slice 1b), assistant change steps for card spend, refund, payment tick, card figure (not built).

## Rulings (coordinator 15, 26 Nov about 08:19 JST; report to coordinator 16 session_01BFpKEXBhaZ6NZ92Lntxb2A from now on)
- Slice 1b on lane/controls-1, before the confirming runs: a yearly bill (How often) on Add a bill after setup; a card's paying bank chosen on Add a card and changed on its sheet (and its weekend rule); a bill's paying account changed; Reminders: keep the changes (a saved, undoable list), or if that is not small, the Reminders screen says plainly changes are not kept yet and shows nothing that looks saved.
- Setup with no loan, goal or line: to scope.txt (the coordinator's).
- Engine rule YES: a check on a loan sets what is owed from its day, as for cards. Write a short plan, run qc-foundation on it, then build (slice 3 follow-up).
- One review round for slices 2 to 5 together on lane/controls-5, after slice 1's fix is merged in and a full check.

## Next steps
1. Coordinator rulings on: qc-controls blockers 1 to 5 (proposed: 2, 3, 4 as a new slice 1b on lane/controls-1, before the confirming runs; 1 and 5 for the coordinator); the engine rule for a loan's Still owed today (a check on a loan resets what is owed, as for cards); one review round for slices 2 to 5 together.
2. Then: build 1b, quick, full, confirming runs; merge 1 into 2, 3, 5 (keep slice 5's Settings words); full check on lane/controls-5; reviewers.
3. Slice 6 goals, 7 second income, 8 bank check later, 9 currency.
