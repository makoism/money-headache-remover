# Full check before QC round 13 (MAIN 15, 2026-11-23 JST)

Run on f7ce6e6. Result: SOMETHING FAILED. Each failure, its cause and what was done:

- team_inter2, team_card, v36/ux_test: the scripts looked for the old step names. Scripts updated in 978119f, then the bills part undone in e0b943f. All three pass on e0b943f.
- label_agree (3 new failures): "Bills and basics, planned" showed two amounts, because the Plan row Monthly bills had been renamed Bills and basics, but that row is only one part of the Bills and basics place (One-time costs and Cards and loans are the other parts). Rename undone in e0b943f. 67 pass, 0 new failures.
- qc23_cents_line: the Receipts Other row now shows a Plan cell of 0 (round 12 numbers should-fix 5). Expectation updated in 27f9990. All pass.
- act_keep: different action each run ("tx", then "removeLine"), with the note "the clock could not be moved on for a reload". Timing. All pass on rerun.
- guard: idle CPU on goals 1.56% against a 1.5% limit. Timing. Fast check passes (ALL GOOD on e0b943f).
