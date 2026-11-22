# Efficiency review of the foundation plan (23 Nov 2026, run by Coordinator 8)

Verdict: the plan is right, but the order of work is too serial, and it does not say how checks stay green while the new engine replaces the old one. That is the biggest risk to the estimate.

## Top 5 changes, most hours saved first
1. Build the new engine as new files in parallel once the schema is frozen (about 30 to 45 h of waiting saved). After step 1, one helper ports ledger.js plus a pure schedule and look-ahead module with fuzz tests; another writes oracle v2 from the spec and schema without reading the engine. Main does stage 0 in model.js and ui0.js. Main-only files: model.js, ui0.js, ui6.js, ui8.js, ui45s.js, check.sh, test_team.js, tests/qc/golden/*. Helpers send check.sh lines; they never edit it.
2. Turn the reviewed lives into scripts now (about 15 to 20 h and many opus credits). Mako's shape every day for three months plus the 8 lives become failing tests on a helper branch; qc-foundation then reads only new lives and plan changes.
3. Retire old tests in bulk with a written list (about 15 to 25 h). About 60 of 281 qc tests assert calendar-month numbers, 42 golden screens are on the old base. A grep script sorts keep / replace / retire; each retired test names the new test that covers it; qc-regression signs the list. A test is never edited to pass.
4. Polish QC once, at the end of 1a (about 10 to 15 h). During engine work run only the gates (money accuracy, data safety, numbers, foundation) and re-run only failed agents.
5. Shard the full check into 3 or 4 parallel parts (about 4 to 6 h wall time). Fixed-port scripts (8788, 8765) and shared /tmp files stay in one serial part. Full only when a lane ends; fast after each commit.

Batch now: Mako's three choices plus his card statement and payment days. Choices 2 and 3 shape the schema, so ask before step 1.

## Risks to the estimate
- No switch-over plan. Fast check hard-gates the old oracle and e6_window; once calcAll changes every commit goes red or tests get weakened. Build the new engine beside the old one behind a switch and change over in one commit. Extra check: a person paid on the 1st with no cards must match the old oracle's month-end figures.
- 200 to 280 h by 5 to 8 Dec means 15 to 20 h of work a day. Give stage 1a its own hour estimate.
- Ledger branches were cut at 9916cde, before many screen changes, so porting costs extra.
- Holiday tables can grow; Japan alone is enough for 1a.
- The 38.31 data move has four known gaps (LEDGER_WIRING "Fails before").
