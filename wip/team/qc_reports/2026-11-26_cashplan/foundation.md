FAIL

Plan: wip/team/foundation_review/CASH_PLAN.md (lane/cashplan a9ad2b5). Read against MAKO_SAYS.md as of origin/lane/ai-join 956b2560 (M1 to M99). Process: this lane's MAKO_SAYS.md still ends at M82; merge 956b2560 before building.

The way in (lesson 5) is right: lines named, setup a chat, pay day a scripted assistant moment, the wallet update one sentence, screens behind it. The FAIL is four saved-shape or engine rule points, cheap now, costly once records exist.

## OWNER'S WORDS
A. M1 met. M2 met. M3 broken in part: after setup the assistant has no named step to change a percentage, a goal's "each pay" amount or which burrow an envelope holds. M4 met. M5 met. M6 met (each amount is shown before it is written). M7 at risk (F2). M8 met. M9 silent. M10 met (one "1 of 3" card). M11 met. M12 at risk (F2).
B. M13 broken in part (grid: `holds` and `each` cannot be added, changed or ended after setup). M14 met for same-day Undo, silent for Undo of an extra-money answer on a later day after the goal's money was spent. M16 silent (do the four new setup questions save on their own?). M17 met. M18 silent. M19 met (new fields carried, one restore test). M20 broken (F1, F3). M22 met. M23 met. M24 met (joined with endperiod).
C. M26 to M28 met (P is every pay on the period's first day). M29 met. M30 met (through the cards plan, not yet reviewed). M31 met.
D. M36 at risk: envelopes start "at 0" (section 4 q4) though the wallet may hold cash. M37 met. M38 met. M39 met. M40 met. M42 silent. M43 met. M44 met. M45 broken (F1, F3). M46 met. M47 met. M48 silent (floor in minor units for PHP: say so). M49 at risk (F4: the 100% check is only at write time). M50 silent. M51 at risk: "Extra money: X to decide" and Not settled 8's "money with no job yet" are the same figure under two names.
E rows it serves: M88 met (F4 to fix). M89 broken as defined (F2). M90 met through the cards plan; R1 goes to Mako. M91 met. M92 to M97 met. M98 met (three scenes, what else could be true). M99 deferred, said so.
F. M61 at risk (F1, F3). M67 broken (F1, F3: joined, but doubled). M68 met. M69 at risk.

## GRID
Eight kinds (line percent, play percent, goal `each`, `holds`, `home.way`, `extra`, cash-moment transfers, "Not today") x add, change, end, undo x screen, assistant, on a later day: 64 cells.
Covered 31, not applicable 10, empty 23.
Empty:
- Line and play percent: assistant add, change, back to an amount after setup (6). Builder.
- Goal `each`: add, change, end on screens and assistant (6). Builder.
- `holds`: add after setup, change the burrow, end it keeping the account, both doors (6). Builder.
- `home.way`: assistant change (1). Builder.
- `extra`: change a split on a later day, both doors (2). Builder, with endperiod's take-back refusal.
- "Not today": add, both doors (2). FOUNDATIONAL (F3): nothing saved, yet the once-a-day and 7-day rules need a saved day.

## FOUNDATIONAL
F1. Extra money record joins twice and splits across two sync domains.
Who: Ben and his partner, one book on two phones. Pay day: both open the app offline, both tap Split 30,000 to Savings.
What it holds: E4's `k: 'extra'` is an event with an ordinary id. Records join by id (sync.js:5), so two answers become two records and Savings gets 60,000 from 40,000. The engine already has built ids for exactly this (ids.js:31 to 36, `pe:<occ>:<place>`, "two devices writing the same moment make one record"); E4 does not use one, and the "which to keep" door it names only fires for one id changed two ways. Second, a split to a line writes a `once` raise (B8), a plan item, while the goal part lives in the event: one answer in two sync domains, one Undo that must reach both, and the endperiod review 1 already found "add it to the same line through `once`" unsound (ENDPERIOD_PLAN review 1). A `once` also freezes a percent line's amount. Third, placeBalance (lookahead.js:918 to 930) and the after-sync places check (sync.js:494 to 501) read only `move` and `periodEnd`: a new kind needs every reader changed, and an older build ignores it.
Needs: one record per period, built id `ex:<occ>`, answering again edits it (as endperiod section 3, point 5). Its moves either written as ordinary `move` records with built ids in one group, or read by every place reader; a line's share as a counted move into the line (the existing `move` with `placed` into play money, lookahead.js:1068, widened to lines), never `once`.
Cost: an id rule now; later, de-duplicating doubled money in real books.

F2. "Extra" is defined as stock, not new money.
Who: Ben on his first pay day after setup with 120,000 already sitting in the bank, then every month after choosing "keep it in the bank".
What it holds: `res.extra` = noJob for the new period (canSpare less play left, lookahead.js:1399 to 1404). canSpare includes every yen already in the bank. So the first notice says "You got 160,000 extra this month", not scene 3's 40,000, and "bank" writes no money, so next month the 40,000 kept is offered again with the new 40,000: the figure grows every month and is never true. A confident wrong number (M12).
Needs: decide in the shape now: either extra is this period's flow (pays and other income landing in the period less the period's plan, bills and goals), or the "bank" answer moves the money to a kept place ("Stocked up") so noJob drops. Then settle it with Not settled 8 as one figure, one name (M51).
Cost: small now; later every saved "bank" answer changes meaning.

F3. Cash moment: ids, state and the rule.
Who: Aki (phone) and partner (desktop); Aki set up on the 20th.
What it holds: "Done, I took it out" writes ordinary-id transfers (act3.js:190), so two taps on two devices record 135,800 out of the bank (M45, M67). "Not today" saves nothing, so the once-a-day and 7-day rules cannot be kept across devices or a reload. And `cashMoment` takes the burrow's amount less what is in the envelope only when a leftover was kept: after Done it still says "take out 67,900", and for Aki set up on the 20th it asks for the whole month, not the opening share (lookahead.js:1014 to 1028).
Needs: built ids `cm:<occ>:<envelope>` for the transfers (and the goal `each` moves), a small saved answer per period (`cm:<occ>` with done, not today and its day), and the rule: amount for the period (the opening share in the setup period) less transfers into the envelope since the period started. Ask at setup how much is in each wallet now.
Cost: an id and one record now; later, doubled withdrawals.

F4. A percentage has no `per`.
Who: Ramil, paid every two weeks, Play 15%.
What it holds: `per` is on the line (lookahead.js:857), `pct` on the step (E1). perPeriod (lookahead.js:1147 to 1153) shares a monthly amount over the year's pays. A percent line left at per month gets 15% of one pay then shared again, so far too little; a line that changes from "40,000 a month" to "15%" mid-life has steps of two kinds under one `per`. stepAmount (lookahead.js:842) has no pay to take the percent of. The 100% check is at write only: a smaller pay or a new bill later makes it over 100, and the walk must read that case safely.
Needs: a step with `pct` means "per pay that starts the period" and skips perPeriod; stepAmount gets the period's P; the read-time rule for over 100 (Home says so, nothing negative). A test with weekly, two-weekly and a three-pay month.
Cost: one rule now; later a migration of saved `per`.

## WATCH
- One envelope per burrow (E2) fails a couple with two play wallets; `holds` allows many to one, so sum them.
- Play money is one household figure (plan.shares); unchecked for couples with separate play money.
- Freelance zero month with percents (R2): play is 0 while the bank is full. Give Mako this cost with R2.
- Statement import: an ATM withdrawal on the statement must match the cash-moment transfer, not become a spend.
- Leftover sent to a bank goal while the cash stays in the envelope: the picture says the bank holds it.
- Three weeks away, paid weekly: extra money and the cash moment per missed period or only the current one? Not said.
- The cards plan (E3) has no qc report yet; this plan builds on it as written.

## Outside pieces
None new: the vault stores the book whole; pay day makes no AI call.

## Checked and sound
- Moving money is never spending, counted once (W1, act3.js:190). A wallet check gap is play spent (lookahead.js:1053), so M95 is a check today. Card play spends come off play (lookahead.js:1056 to 1058); R5 avoids counting groceries twice.
- R4 needs no carry: with `holds` the new period's Food takes the 2,100 from the envelope first.
- New fields optional, old books unchanged, backup3.js keeps unknown fields. P fits M28; an unticked pay starts nothing (lookahead.js:877).
