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
| lane/e-state | (this commit) | state page | keep current |

## Next steps
1. lane/controls-1 from origin/lane/ai-join: controls3.js and its test first.
