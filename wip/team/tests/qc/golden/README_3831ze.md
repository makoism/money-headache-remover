# Golden baseline 3831ze (MAIN 14, 2026-11-22 about 22:30 JST)

Recorded on 8cada2b after the QC round 11 fixes. Against 3831zd, 5 screens differ, checked by script (every number on each screen compared):
- 4 Receipts screens (plans 2, 8, 9, 10): the table writes every amount one way, with cents in every row when any amount has cents (382115f): "₱834" is now "₱834.00", "CHF 7,000" is now "CHF 7,000.00". Same values.
- 1 Home screen (plan 5): "Bills went past the plan." is now "Spending went past the plan." because Other went over too and Other is not a bill. Same amounts.
No number appeared, went away or changed value. The "Dec ends below zero" status title does not show in these 14 plans (qc31_okay_ahead covers it).
Next baseline: 3831zf (sort picks the newest).
