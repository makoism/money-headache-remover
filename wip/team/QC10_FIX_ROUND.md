# QC fix round on 38.31 (2026-11-20, MAIN 10), build edb78d1

Two fresh agents on the staged build (`/tmp/qc_build/build.html`, VERIFY OK). Both said FAIL. Neither could write its report file (the harness refused); this file keeps what they found. Made-up numbers only.

Hard gates (qc-numbers): oracle 3000 plans 0 mismatches, proof_fuzz 1500 plans 0 failures, display maths 0 open, home_dom 40 plans 0 mismatches.

## qc-numbers: 3 blockers, 5 should-fix

| id | finding | state |
| --- | --- | --- |
| N-B1 (SF5) | After "Keep saving" said in a later month, Burrows said "Full Nov 2026" and "This month" for a fund at 51% of the longer goal | fixed f6770fd, qc10_stretch_from.js |
| N-B2 (SF6) | "X of it stays in the bank" in the sentence while the row "Borrowed, stays in the bank" showed another amount | fixed 0527d9e, qc10_borrow_fit.js |
| N-B3 (Q2) | Free to spend called "safe to spend" while the typed bank after the cards was below it (money rule 3) | fixed 36d7a62, qc10_bank_story.js |
| N-S1 | No "They add up:" line on Home | this is Q1, waiting for Mako |
| N-S2 | Month-end card says "or put it toward a goal" when no goal button shows | fixed e82a9a0, qc10_sweep_words.js |
| N-S3 | A piece with money reads 0% ("Used for spending past plan $19.99 0%"); could read "under 1%" | open |
| N-S4 | Burrows says "this month" for the month picked on Plan, not the current one | open |
| N-S5 | "−¥6,535 over": the minus sign and "over" say the same thing | open (copy) |

## qc-north-star: 6 findings (Q1 and Q4 listed as waiting for Mako)

| id | finding | state |
| --- | --- | --- |
| F1 (Q2) | Home note called a balance typed on 20 Nov "your bank at the start of Nov", left out the card, said "can differ" when equal | fixed eb81d42 (note names the cards, quiet when equal). Left for Mako: should Check your bank reset the figure the plan starts from; count a card in the month it is paid |
| F2 (Q7) | Undo after a cloud load on an empty phone put back sample numbers and sent them over the only cloud copy | fixed 311a766: no Undo on a phone with no numbers; on a phone with numbers the bar says Undo also changes the cloud copy |
| F3 (Q3) | "Your balance covers it" next to "Lower a bill or another place" | fixed ba67d44 |
| F4 (Q7) | "Your numbers from before are kept" on a phone that had none; Settings "Last backup: today" after a cloud load with no file saved | first half fixed 311a766; "Last backup" after a cloud load open |
| F5 (Q7) | Toast under the Undo bar; page text showed through the bar | bar made solid a60263c; toast overlap not reproduced in the test |
| F6 (SF6) | "needs only X" next to a borrowed row with another amount; borrowed row's percent beside places that already pass 100 (126); Home does not say part of the month-end bank is borrowed | sentence now says what X is for 97e8d39; the 126 and Home wording open |
