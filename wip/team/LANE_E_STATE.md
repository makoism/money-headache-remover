# LANE E state page (controls slices after the AI-first candidate)

Written by LANE E (session_01BFpKEV7kdsYcuUud2xQn49), 26 Nov 2026. This page is the handoff: keep it current after every push.
Report to: Burrow coordinator 15 (session_01BFpKEWQ3CvnuXtPQDkDJq1). MAIN 20 (session_01BFpKEV4Vgafxq58ZDUGM8J) merges. LANE D (session_01BFpKEZBHa4tGsnifDjXxNM) owns the month rule, which-to-keep door, end of period and the cards/cash slice M88 to M97: do not touch its branches.
Keep-going task: trig_01YUs9DHQaHbGbv9XdihHvo3 (hourly, bound to LANE E). Switch it off at handoff or when told to pause.

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

## Branches
| Branch | Hash | State | Owes |
|---|---|---|---|
| lane/e-state | this page | state page | keep current |
| lane/controls-1 | ecfbad9e | slice 1 built: controls3.js + tests/controls3.test.js (a1671887), Plan > Accounts + Add an account + account sheet (1f040bdb), assistant change_account (661a70c0), ai-join b54ace71 merged | check3 full (run 1: only e3_stmt failed, a timing flake that passes alone 3 times; run 2 going), round folder qc_reports/2026-11-26_controls1 (scope.txt asked of the coordinator), then qc-controls + qc-assistant, then ready report |
| lane/controls-2 | 072668a3 (+ uncommitted in .claude/worktrees/c2) | slice 2: closeAccount, reopenAccount, removeAccount steps committed; screens (Close this account sheet, Closed list with Reopen, Remove this account) and assistant close_account / reopen_account / remove_account written, node tests pass | page tests e3_acctclose (passes alone), e3_removes, e3_fakeai_page, e3_names, e3_layout; commit; then check3 full, qc-controls + qc-foundation + qc-data-safety |

## Notes for the next session
- Worktrees: main checkout on lane/controls-1; .claude/worktrees/c2 on lane/controls-2; .claude/worktrees/estate on lane/e-state.
- Fresh machine: tools line in RESUME (npm install puppeteer-core acorn acorn-walk in /home/claude/work/tools), `git fetch --unshallow origin lane/ai-join wip-38.31 main`. check3 quick without named tests runs almost everything (ai-join differs a lot from wip-38.31): name the page tests.
- In page tests, scope selectors to #a3Plan: Home has its own [data-acct] rows.
- Assistant tests: K.confirm does not call the model; refs of closed accounts come after the open ones (chat3_core figures).
- Slice 3 notes: a pay-off is a `repay` event { k: 'repay', acct: payFrom, acct2: card, to: card, a }; trace a worked example (card owed 23,000 paid off today: the next payment day shows 0, bank falls 23,000 today, safe to spend unchanged or up) before building.

## Next steps
1. Slice 1: when check3 full is ALL GOOD, copy it to the round folder, screen pack, ask for scope.txt if not there, run qc-controls and qc-assistant (opus, brief opens with "read wip/team/MAKO_SAYS.md first", agent file + build path + round folder only).
2. Slice 2: page tests, commit, merge ai-join, full check, reviewers.
3. Slice 3 (cards and loans).
