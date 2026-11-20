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
| F4 (Q7) | "Your numbers from before are kept" on a phone that had none; Settings "Last backup: today" after a cloud load with no file saved | fixed 311a766 and 94e5be5 (a cloud load no longer stamps the backup day) |
| F5 (Q7) | Toast under the Undo bar; page text showed through the bar | bar made solid a60263c; toast overlap not reproduced in the test |
| F6 (SF6) | "needs only X" next to a borrowed row with another amount; borrowed row's percent beside places that already pass 100 (126); Home does not say part of the month-end bank is borrowed | sentence now says what X is for 97e8d39; the 126 and Home wording open |

# Round 2 on 94e5be5 (fresh agents, both FAIL)

Hard gates again all pass (oracle 3000 plans 0, proof 1500 plans 0, display maths 0, home_dom 40 plans 0).

| id | finding | state |
| --- | --- | --- |
| N2-B1 | "safe to spend" ignored the bills still to pay | fixed dbde166 (bank after cards must cover bills left plus Free to spend), qc10_bank_story.js |
| N2-B2 / NS2-6 | "Spend X instead" offered below what is already spent | fixed 22bf5f6, qc10_fix_offers.js |
| N2-S3 | Home note dropped the cards when the bank now equals the start figure | fixed 6de01cf |
| N2-S6 | "Pick a fix: X is borrowed ..." | fixed 5fc2617 (guard check does not reach the state) |
| NS2-1 | Undo after a cloud load on a phone with its own numbers sent them over the other phone's cloud copy and kept it linked | fixed 2a138e7: Undo restores this phone and how it shared before, sends nothing |
| NS2-3 | First tap on Load on the welcome screen did nothing (setup moved the focused button 23 px under the finger) | fixed b692827; also Enter in the code box moved setup on (44e35f9) |
| NS2-5 | Home kept "Logged $54" after the receipt was changed to $45 | fixed 834b778 |
| NS2-2 | Undo is gone once you leave Settings; Restore promises Undo for 3 days (the kept copy is offered again on the next open) | open: needs a lasting "put back" button in Settings for the kept days; note it conflicts with Q7 "bar stays across tabs" |
| NS2-4 | Settings "Money today" $2,500 vs Home "In your bank now" $2,180; "Your balance covers it" worked from the start figure | for Mako (same design question as F1: should Check your bank change the figure the plan starts from) |
| NS2-7 | "older copy ... takes this device back" on a phone that never had that copy | open (copy) |
| N2-S4 | More card "this part is free to spend" while Home says not safe to spend yet | open |
| N2-S5 | "All of your pay has a place" next to "came out of pay with no place" | open |
| N2-S7 | Month-end answer card skipped when an earlier month is still open (answer goes to the Undo bar by MAIN 9's SF1 design) | open, design |
| N2-S8 | "Your bank balance doesn't include it yet" when a balance was typed after the month | open (copy) |
| N2-S9 | "Keep saving" hidden until a receipt exists | open |
| N2-S10 | In sample mode a saved bank balance shows nowhere | open |
| N2-S11 | 12.345 logs as 12.34 (rounds half down) | open, within one cent, same everywhere |
| notes | Add a card Save and Cancel under the Help bar at 412x915; two hyphens as dashes in setup and Settings; setup done screen "$1,325 of $4,800" counts this month's saving without saying so; borrowing from the fund while the same month still adds to it is not explained | open |

# Round 3 on 53bb8cb (fresh agents, both FAIL; hard gates all pass, the six number situations all agree)

| id | finding | state |
| --- | --- | --- |
| N3-B1 | Home's Free to spend tile showed what is left as "planned: yours to spend over the whole of Nov" | fixed b7c4719 and 9a0d2fc: "planned: left to spend in Nov" (A1 keeps "planned") |
| N3-B2 | "Logged X" stayed after Undo | fixed 50ca3a8 |
| NS3-1 | After Undo of a cloud load the Settings panel still said "This device now shares the cloud copy" | fixed 9a33833 (panel closes, a message says what happened) |
| NS3-7 | "In your bank now now" | fixed 9a0d2fc |
| NS3-2 / NS2-2 | Undo for a cloud load is gone once you leave Settings (the copy is kept and offered again on the next open) | for Mako's run: a lasting "put back" in Settings, against Q7's "bar stays across tabs" |
| NS3-3 | "older copy ... takes this device back" on a phone with different numbers | for Mako's run (copy) |
| NS3-4 | No message after loading from the welcome screen | open |
| NS3-5 | Short-month fixes cover one month only; "Lower a bill or another place" when every place is 0; "On plan" tick in a month that borrows | for Mako's run (how fixes should work across months) |
| NS3-6 | "Short" means "spends more than pay" in setup and "ends under the minimum" on Plan | for Mako's run (copy, one word per thing) |
| N3-S1 | Sample mode: a saved bank is invisible but changes the Free to spend label | open |
| N3-S2 | "Spend X instead" in a month that also has spending past plan does not fully fix the month | open |
| N3-S3..S7 | Borrow offered with no pay entered; past month's swept Free to spend still leads; negative "Not placed" in All months; answer card skipped to the next month; "Lines with no receipts aren't listed" under a listed row | open |
| process | verify.txt says VERIFY OK and also "FAIL the screens changed" (13 golden plans MISSING after the wording changes) | refresh the golden file once Mako's copy pass settles the words |
