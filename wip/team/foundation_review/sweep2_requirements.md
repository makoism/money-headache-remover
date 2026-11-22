(Sweep 2, 23 Nov 2026: every stated requirement against the new plan. Read-only review by a helper; copied from its reply.)

Requirements sweep for The Burrow (read-only; nothing written to the repo)

Read: LESSONS, NORTH_STAR, DECISIONS, VOICE, MAKO_RUN, LAUNCH_CHECKLIST, WORLD_3D, COPY_QC8, all of RESUME, QC_ROLES ("Learned from Mako"), tests/qc/mako_answers.js, foundation_review/* (including sweep2_experience.md and schema_review_1.md, so I left out what they already raise), and these side-branch designs: PAYDAY_DESIGN, LEDGER_DESIGN, MONEY_DOOR, STATEMENTS_DESIGN, SIDE_C_QUESTIONS, LANE_vault, SECURITY_REVIEW, DEPLOY_RUNBOOK, PH_ACCOUNTS, PHONE_REPORT. Copies of the side-branch files are in /tmp/sweep_req/.

## 1. Things Mako stated that the plan and saved shape cannot support, or that would need a later data move

**a. Education, Giving and Investing are not protected in safe to spend.** Mako said Education and Giving are burrows that stock up (DECISIONS 17 Nov, and 19 Nov answer 3). SCHEMA section 6 keeps them as `edu`, `give` and `ffa` shares with no `keptIn`. Section 10.3 step 3 only takes off "goal places kept in it". So money stocked in Giving still counts as headroom in the bank, and safe to spend is too high whenever the Free to spend cap does not hold it back. The shape needs to say these piles are goal-like places with `keptIn`.

**b. Investing has nowhere to live.** Mako's north star asks "where it is stocking up". Investing is one of the piles. The account types (bank, cash, ewallet, wallet, card, paylater, loan, owedToYou) have no investment account. An investment's value also changes on its own, so it needs checks. Without this, "moved to its own account" (Mako 23 Nov, answer 3) cannot work for Investing.

**c. A sample copy would move in as real money.** MAKO_RUN 1.12, 1.19 and 1.22, and model.js SAMPLES with `preset`, show that a 38.31 copy can still hold the sample pay, bills and minimum. SCHEMA sections 9 and 10.6 never say how the move tells sample figures from typed ones. As written, sample pay would become real income schedules.

**d. Some saved fields have no target in the move.** These include `cfg.minBank` (and whether the person typed it or the sample set it, MAKO_RUN 1.6), plus `planFrom`, `bankNowAt` and `rainyStretch`. The minimum drives the new safe to spend. Section 10.6 says "every field has a target", but it does not list these.

**e. The move is only proved on 38.31 copies.** Mako's real numbers are in 38.28, the live build. Mako said the old address (frozen at 38.10) "stays up until people have moved their data across" (DECISIONS, Hosting). SCHEMA section 9 proves only the 38.31 fixtures. PLAN asked for all 19 old builds, 25.0 to 38.28. Also, Mako has to see the bank comparison before any deploy (DECISIONS 19 Nov; DEPLOY_RUNBOOK A0 item 4, STEP8_COMPARE). That comparison was made for 38.31, and the new engine changes every bank figure, so it has to be redone. RECOMMENDATION does not mention this.

**f. A lifetime of data will not fit.** Mako calls it "the money calculator he will use for the rest of his life" (NORTH_STAR). The new rules are: nothing is deleted (`gone` marks), no receipt cap, `frozen3831` kept, and Undo keeps a full copy (ui45.js KEEP_MAX 30). The browser allows about 5 MB, and the vault refuses copies over about 1.8 million characters (LANE_vault: "compress... worth doing with the ledger"). No size plan, compression or archive is in SCHEMA. When it fills up, saving fails, which breaks "nobody loses data".

**g. Changing the currency after real data exists.** Mako's decisions on currency are: yen is the default, "$" is asked and never guessed, and the currency is locked once real data exists (A9). With amounts stored in minor units per code, changing `home.cur` or an account's `cur` later would read every amount wrongly (yen has no decimals, pesos have two). SCHEMA only covers the currency at the move (10.5). It needs a rule: the currency cannot change once events exist, or the change converts explicitly.

**h. The cloud copy needs server work that is scheduled after v1.** Old pages stay in use: live 38.28, the 38.10 address and the artifact mirror. These pages do not know `ledgerMayWrite`. LEDGER_DESIGN point 3 says the ledger's cloud copy must sit where an old page cannot load or overwrite it. LANE_vault offers `fmt` refusal and dated versions, but the vault-server branch merges only "after v1 is deployed and Mako says go". SCHEMA section 1 asks only the page to guard. Also, the rollback in DEPLOY_RUNBOOK assumed the new page writes the old key. With a new key, a rollback hides everything done after the move.

**i. Mako's v1 has no statement import.** Mako's stated way in is statements first: "Real numbers should come from uploaded bank or card statements, or from a prompt pasted into any AI" (DECISIONS, The numbers). The first-open order is decision 8 (18 Nov), and the first impression should be "I upload my stuff". The E6 fixes were made v1 "because Mako imports his statements". RECOMMENDATION puts statement import in stage 1b, after Mako's v1. The any-AI pasted format (IMP_FORMAT/importClean, ui45u.js) writes the old monthly shape, and no plan replaces it.

## 2. Parked items that are really about correctness or how the money works

- **What happens to unspent money at the end of a period.** Mako: unspent planned money "must not silently drop out", and the app asks where it goes (DECISIONS 18 Nov; decision 3: ask even with few receipts). SCHEMA only moves old answers (section 6) and places shares automatically at each pay (WATCH). It never says whether money left in Free to spend or in a budget line rolls into the next period, or is held until the person answers. If it rolls over silently, it breaks his rule.
- **Yearly costs** (MAKO_RUN 1.26, parked for his run). Once full, the plan stops saving, but the cost comes back every year. That is a fact about money, not taste. SCHEMA's `yearly` schedule with a goal `place` does not say how the set-aside fills again after each payment.
- **The minimum balance setup never asks for** (MAKO_RUN 1.6, 1.23). It sets safe to spend and is a number nobody typed. Schema review 1 raised the default. Whether it is asked or defaults to zero (sweep 2 says "no minimum") is a correctness choice. It should be decided at the cause, not parked.
- **Server data safety at the team gate** (E1 team part, E11): "Turn off" deletes, one delete erases both copies, and the earlier copy cannot be loaded. Mako uses phone and desktop with the cloud copy in v1. The fixes sit on side/vault-server and are not merged.
- **Privacy lines that are false** (E7, E13; STATEMENTS_DESIGN): screens say statements stay on the device, but whole statements go through the relay. That is a wrong statement on screen, parked at the team gate. STATEMENTS_DESIGN says the honest line "should go in now".
- **Currency lock** (A9 and MAKO_RUN 1.25a, 1.14): parked at the team gate and on his run, but it is about whether amounts are right (see 1g).

## 3. Conflicts

- **A loan would still be counted twice after the move.** MAKO_RUN 1.27 traced the cause: the "Loan or debt payment" bill line plus the separate debt list. SCHEMA 10.2 turns the `loan` line into a bill schedule, and section 9 turns `plan.debts` into loan accounts with `payDay`. If loan accounts make payment items, one debt is counted twice. If they do not, a debt with no line is not counted at all. The plan needs "one home for every loan".
- **Phone and desktop.** Mako uses both (E1; DECISIONS 19 Nov answer 8: "phone and desktop must run the same build and work the same"). SCHEMA readies ids and `at` stamps for merging "later", but the cloud copy is still a whole copy where one wins. In stage 1a, picking a copy after a 409 conflict throws away the other device's events.
- **Japan support is parked, but Mako is in Japan.** Japan presets moved to wider launch (gate change, 19 Nov), and stmt_ph.js reads only Philippine layouts. But Mako's own cards and pay are Japanese, and stage 1a is "Mako's shape".
- **Sweep 2 point 7 against decision 3.** Sweep 2 holds the end-of-period question until a fresh check. Mako's decision 3 says ask anyway and warn when few receipts are logged. These need lining up, and the new form should go to Mako as a recommendation at the level of the cause.
- **Pay as one number.** Mako enters his two incomes as one number (DECISIONS, own money). RECOMMENDATION 1a and SCHEMA model two streams, with `startsPeriod` false on the second. The test for Mako's shape should accept one stream.
- **Warnings further ahead are lost.** Home warns about later months that end below zero ("Later on: Jul 2027", RESUME section 4; MAKO_RUN 1.8). The 10.3 look-ahead stops at about 45 days or two pays. The "lasts about N weeks" view is stage 2. That steps back from "nothing is unknown".

## 4. Things Mako said that nobody has acted on

- **"Every fact Mako states about his money becomes a failing test the same day."** His shape (19 Nov) and "close days unknown" (23 Nov) have no test on wip-38.31 yet. The foundation-scenarios branch has no commits.
- **The in-app assistant** "that carries out decisions once agreed" (DECISIONS, layout). The 3D world also has to call ACT only. Neither ACT nor the assistant's checked actions (ui4a.js asstCheck) is in RECOMMENDATION's "what stays" list or in any stage. Both write the old monthly shape.
- **E12, "Mako's check: now"** (INVITE_CODES as a long phrase, auto-reload off, a spend limit): nothing records it as done. It is in DEPLOY_RUNBOOK Part C and still needs Mako.
- **G2, "know whether it works"** (weekly opens, the gap between the app's bank figure and the real bank), along with the streak rule and GAMIFY's "read his backup after 4 weeks": the shape keeps no record of opens or check-ins (sweep 2 point 6 covers check-ins only).

Order I would fix them in: 1a, 1c, 1d and 3 (loan) before the shape freezes, because they change saved fields. Then 1f, 1g and 1h (size, currency rule, vault slot), because a later fix means moving data again. Then 1e and 1i, which decide whether v1 meets Mako's own way of using it.
