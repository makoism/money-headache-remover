# The Burrow: start here

Written 2026-11-18 on branch `wip-38.31`. Read this whole file before touching anything. It replaces the resume notes that lived outside the repo.

## 0. Handoff (latest first)

**2026-11-19, step 9 round 4 done, blockers fixed; handing off (Mako's 150k-token rule).** Round 4 (all nine): blockers came from numbers, north-star, money accuracy, data safety, layout and novice; wording, art and regression had none. All blockers fixed with tests that fail first, each in check.sh: numbers_round4 (All months uses the Month card's not-placed figure; Forecast chart caps at the real, longer target; the short-month fix equals Home's safe to spend and the warning names it), money_round4 (true causes of below zero; a third decimal is refused aloud), zero_safe (Set all to zero and Reset month keep a 3-day copy; a two-step button ignores a second tap under 600 ms, so tests now wait 700 ms between taps), layout_round4 (every control 44px at 390 and 320; goal editor at 320; Pay ends marks the pay), round4 (All months verdict; one round Help button below 520px; "Not growing"). Golden baseline `3831u.json`. Last `./check.sh full` ALL GOOD was before round 4 fixes.
Next, in order: (1) `bash tests/setup_env.sh`, then `./check.sh full` until ALL GOOD (the regression copies in /tmp only refresh in setup_env.sh). (2) `bash tests/qc/stage_build.sh`. (3) Per DECISIONS cost rule 2, rerun fresh only the agents whose round 4 reports failed: qc-north-star, qc-numbers, qc-money-accuracy, qc-data-safety, qc-layout-touch, qc-novice. (4) Show Mako STEP8_COMPARE.md and the list below; deploy only on Mako's go.
For Mako (cost rule 1: findings that came back two or more rounds, two lines each):
- Freshness: Home never says when the bank balance was entered. Suggest "Balance you entered on 18 Nov" under the bank figure (rounds 2 to 4).
- Chest picture: Free to spend is drawn as the Chest, which the glossary keeps for pay waiting on pay day. Pick a different picture for Free to spend, or change the glossary (rounds 3 and 4).
- Goals vs Burrows: Plan and setup say Goals, Home says Burrows, and Giving is called a burrow though it does not pile up. Pick the words (rounds 3 and 4).
- Art: two burrow styles side by side, identical mounds, coin piles that do not scale, glows and noise off the art rules, bar colours off the palette. No new art was done (rule) (rounds 2 to 4).
- Visual first: pay split hidden behind Show on Home, four number tiles repeat the picture, long "They add up" paragraph. Mako's call on the v1 Home layout (rounds 3 and 4).
- Percent rules: places round to whole percents that add to 100, goal fill rounds down. Pick one, or show one decimal (rounds 3 and 4).
- Setup step count: "of 5" becomes "of 6" when pay adds the Split step (rounds 3 and 4).
- Real phone glitch: no details yet from Mako on what glitches and on which phone.
After v1 (CONFUSING and POLISH lists in the round 4 reports, kept out of this release per cost rule 1): currency preselected as yen, sums typed in amount boxes, Saved counts Giving, sample tag on Plan, backup file name, old-shape plans shown as samples, light-theme Giving swatch, pay day cents, and the rest.

**2026-11-18, step 9 round 3 done, fixes in.** Round 3 (all nine reports): both gates FAIL. Number gate: 3 blockers (same amount rounded in one place, cents in another), fixed at the root: `fmt` and `fmt2` are one rule (whole amounts whole, others with cents; only the per-week and per-day pace hints stay rounded, `fmtAbout`). Money accuracy blocker raised three rounds, a minus bank balance, is fixed: the balance box takes a minus (`clampBank`), oracle and fuzz now start some plans overdrawn. Also fixed: a saved copy lost cents on load (goal target, saved, monthly and bill amounts were rounded); goals keep a newer version's fields; Over plan card names every place (model `overBits`, adds up to `overNow`); Education everywhere; blank bills not praised; receipt bigger than pay needs a second tap; a minus in a receipt box is refused with a reason; header follows setup; "All of your pay has a place"; privacy line honest about Ask; "Clear my plan" where a currency has no samples; badges wait while short; messages never take a tap; Go to bills lands under the bar; keyboard starts at the tabs; wording items (Log spend, Giving, setup counter, Set all to zero). Golden baseline `3831u.json`. New tests: neg_bank, number_gate3, badge_hold, bills_scroll, restore_label (all in check.sh). Not done, for Mako: freshness ("as of") date, Goals vs Burrows on Plan, Take out on burrows, chest picture on Free to spend, art items (pixel sizes, coins over words, coin piles), percent rounding rule for places vs goal bars, "Saved" card wording after borrowing, late receipts after the month-end answer, real phone glitch details. Next: `./check.sh full`, stage, QC round 4 (all nine fresh), then STEP8_COMPARE.md to Mako before any deploy.

**2026-11-18/19, step 9 round 2 done, fixes in.** Round 2 (all nine reports): both gates FAIL, data safety 4 blockers, money accuracy 5, layout 1, wording 1, art 4. Fixed with tests that fail first: big changes (setup run again, backup loaded) ask first and keep a copy with Undo for 3 days (`S.ui.keep`); unknown fields survive an older page's save; pay not placed to the cent everywhere; Free to spend card with no plan; borrowed is not pay on the bar's label; sample pay only while pay is the sample; Home says its figures are planned for month end; one Free to spend figure; letters in amounts refused with a message; setup keeps cents; burrow dots (the undefined `--fg` colour fixed); Home starts with the This month picture; no floating vine. Golden baseline `3831u.json`. New tests: number_gate2, typo_letter, setup_cents (and setup_undo, keep_unknown extended). Still for Mako: blank bank used as 0, no minus balance, "Balance now" vs this month's pay (all step B1); art items; real phone check of his glitch report. Next: `./check.sh full`, stage, round 3 of all nine agents, then STEP8_COMPARE.md to Mako before any deploy.

**2026-11-18, step 9 round 1 done, fixes in.** First QC round on 38.31 (8 of 9 reports; the north-star gate's never arrived): number gate FAIL, data safety 5 blockers, money accuracy 4, wording 1, layout 2. Fixed, each with a test that failed first: Spend-instead after earlier overspend; amounts written two ways; Free to spend held back when a short month adds nothing; data safety 1 to 5 (setup Undo, failed save lost on reload, unknown fields kept, typo saved as the maximum, receipt Undo); sample pay named as sample; glossary words; four numbers never wrap; no invisible blur behind solid cards while the scene animates (phone glitch candidate). Golden baseline `3831g.json`. Open for Mako: a blank bank balance is used as 0 without saying so; an overdrawn person cannot type a minus balance (both belong to step B1); art items (sky gradient, floating vine, mound shapes, Free to spend drawn as a chest); his mobile glitch report needs what he saw and which phone. Next: `./check.sh full`, stage, a fresh round of all nine agents, then show Mako STEP8_COMPARE.md before any deploy.

**2026-11-18, PLAN step 8 automated part done.** `./check.sh full` ALL GOOD on 38.31 (third run; first run found two real bugs in the pay day picture, fixed in 924ed82). VERSION 38.31, golden baseline `3831e.json`. `check.sh full` now serves the build on 8788 itself; `setup_env.sh` copies the welcome video. Reload tests on `/tmp/v22/lib.js` must set a localStorage `__keep` too. Next: stage the build and run the two gates and the panel (step 9); SHOW MAKO `STEP8_COMPARE.md` and wait for his go before any deploy (step 10).

**2026-11-18, end of PLAN step 7b (commit e35d3a9), step 8 started.** Version one Home: `homeV1()` in ui6.js (one next action; the rest behind More), four numbers in ui8.js. Test `tests/qc/home_v1.js`. Golden baseline `3831d.json`. Step 8: `tests/qc/compare_3828.js` (38.28 saved plan into 38.31; every bank difference is spending past the plan, to the yen) and `STEP8_COMPARE.md`, the report Mako must see before any deploy. `./check.sh full` run started; see the commit after it for the result.

**2026-11-18, end of PLAN step 7 (commit 80ec98f).** S2 (proof line after Decide later), S3 (guarded), S5 (graph "Now" was start of month; `goal_agree.js`), S6 (dock word). Golden baseline now `3831c.json`. Next: step 7b (version one Home).

**2026-11-18, end of PLAN step 6 (commit 2e43f9c).** Screen maths 0 open, `display_math.max` is 0. New model values: `setupCells`, `planFactsOf`, `splitDraft`, `topupFit`. Next: step 7 (S2, S3, S5, S6), then 7b.

**2026-11-18, end of PLAN step 5 (commits a299a4b, d83d77b, d785a2e).** Decision 1 (cents kept, yen whole; old plans load unchanged; `wholePercents` now works in cents), decision 2 (amber "Below zero" line from `viewOf().month.belowZero`), decision 5 (first pay or bill entry is the usual amount; closes B2). New tests: `cents_plan.js`, `below_zero.js`, `first_entry.js`. New golden baseline `tests/qc/golden/3831u.json` (verify against it). Reload tests must use `R.phone({keep: true})`. Next: step 6 (screen maths 15 to 0).

**2026-11-18, end of PLAN step 4 (commit 38a3a58).** Three number fixes, each with a test that failed first: the "$0 counted" answer card, the Plan bar's Left piece calling used pay "not placed", goal "to go" against the longer emergency target. `sweepOffer` reads `m.pendLeft` (one value); dead `monthToClose` removed. New `tests/qc/number_findings.js` (in check.sh full). Next: step 5 (decisions 1, 2, 5).

**2026-11-18, end of PLAN.md steps 0 to 3.** Read PLAN.md (section D is the order) and DECISIONS.md (the 2026-11-18 decisions, the process change and "Version one") before anything else.
- Done: Mako's decisions recorded; QC agents in `.claude/agents/` with `tests/qc/stage_build.sh`; the proof formula test (`tests/qc/proof_formula.js`); the reload flake (it was the test helper); S1 (no month-end question before the first receipt) and decision 3 (few-receipts line); a Receipts bug (Other spending called "over" when a one-time cost covered it) fixed; every stale test judged: kept and updated `team_inter2`, `team_month`, `purpose_test` (v34 top-up part retired), `viewtest`, `display`, `monkey`, `upgrade_test` (old builds rebuilt from git history); replaced `team_map` by `tests/qc/home_map.js`, `team_cur` by `tests/qc/currency_ui.js`, `good1` and `mako_scenario` by `tests/qc/scenario_yen.js` (made-up numbers). `reset_undo` 3 of 3. Every commit message says why.
- Next: PLAN.md step 4 (number findings: the "0 counted" card, "pay not placed" beside Left when overspent, goal "to go" against the stretched target, one value for unspent money in `sweepOffer` and `m.pendLeft`), then step 5 (decisions 1, 2 and 5; 3 is done), 6, 7, 7b (version one Home), 8.
- Known: the golden comparison inside `verify.sh` can flicker under load (one run showed 6 differences, a rerun alone 4). The four named differences are the decision-3 wording (2) and the 38.31 Home status states (2); #4 ("Building your cushion" below zero) is what decision 2 replaces. Re-record the baseline after decision 2.
- The oracle does not recount cards and loans yet; `home_map.js` takes their payments from the model and says so.

## 1. Where things stand

| Thing | State |
| --- | --- |
| Live site | 38.28, https://the-burrow.mako-162.workers.dev. Deploys when `main` is pushed. |
| `wip-38.30` | Built by the earlier session. Never passed `./check.sh full`. Not deployed. |
| `wip-38.31` (this branch) | 38.30 plus the numbers foundation below. Not deployed. Not yet through the QC agents. |
| Version stamp | 38.31 (bumped in PLAN step 8; golden baseline `3831e.json`). |

Nothing may ship until section 6 is done in full.

## 2. First ten minutes on a fresh session

```
git fetch && git checkout wip-38.31          # or: git fetch burrow-wip-38.31.bundle wip-38.31:wip-38.31
cd wip/team
bash tests/setup_env.sh                      # rebuilds the whole test environment FROM THE REPO. Must print "setup ok"
bash tests/verify.sh tests/qc/golden/3831u.json    # the quick gate, about 3 minutes. Must end "VERIFY OK"
```

Rules that keep work from being lost:

- Nothing a check needs may live only in `/tmp` or `/home/claude/work`. Those folders vanish. The earlier session lost its updated tests that way.
- Commit and push after every green `verify.sh`. A session can end without warning.
- Run browser tests one at a time. Several at once makes the timing-based ones fail (`leftover_reload`, `guard`, `team_help`) when nothing is wrong.

## 3. The numbers foundation (what 38.31 is)

Mako's rule: every number comes from one dataset, as stable as a sheet, so a wrong number is not possible without it showing. Four parts enforce it.

1. **One source.** What a person types is stored (plan, one-off changes, receipts, settings). Everything else is worked out fresh by `model.js`. Nothing worked out is saved.
2. **Screens never do money maths.** A screen may choose, format and place a value. It may not add, subtract, round, clamp, negate or total one. `tests/qc/display_math.js` reads the screen code and lists every break. The count is in `tests/qc/display_math.max` and may only go down. It was 87, then 15, and is 0 (step 6). Exceptions need a reason in `display_math.allow`.
3. **An independent second calculation.** `tests/regression/v25/oracle.js` works the plan out again from the plain rules, in whole numbers, with none of the app's code, and compares field by field on thousands of random plans. It must report `mismatches 0`.
4. **The proof.** `proofOf()` in `model.js` checks that where the money sits (bank + goals + piles) equals where it came from (start + pay - everything that left), to the cent. Home shows the result and shows a warning if it fails. `tests/qc/proof_fuzz.js` runs it on random plans and must print `PROOF PASS`. It was tested by planting five bugs; it caught all five.

Where the named values live in `model.js`:

- `jarsOf` : the split and its percents, `unplaced`, `unplacedNet`, `exceedsBy`, `borrowUsed`, `borrowUsedPct`, `placedPct`
- `planCells` : the Plan tab and the dock
- `viewOf(...).cells`, `.month`, `.play`, `.map` : Home
- `goalInfo` (`togo`, `pctWhole`), `goalRows` (`togo`, `pct`)
- `calcAll` month fields `debtStart`, `debtMin`, `debtExtra`, and each debt's `paidPct`, `paidPctWhole`
- `limitsOf` rows (`overBy`), `lookBack` (`change`, `overBy`), `overParts`, `leftOfPlan`, `moveCap`, `receiptsTotal`, `wizardMonthly`

### How to move one more sum out of a screen (the pattern)

1. Run `node tests/qc/display_math.js` and pick a line.
2. Give the amount a name with a money meaning and work it out in `model.js`, on the object the screen already reads. Copy the exact expression. Do not write a general helper such as "subtract two numbers": that only hides the sum.
3. Replace the expression in the screen with the named value.
4. Run `bash tests/verify.sh tests/qc/golden/3831u.json`. Golden screens must say `0 screens differ`, unless the change is a fix you can name.
5. Lower the number in `tests/qc/display_math.max`. Commit.

## 4. What changed for people in 38.31 (for the release notes)

- Months paid partly with emergency-fund money: the split now reconciles. Places + not placed = 100 + borrowed. New "Borrowed" row and a sentence that says why. Before, the percents added to 116, 129, even 312 with no explanation.
- Home's proof line now really checks the total, and warns if the numbers do not add up.
- Home could never say "Building your cushion", and could never say that spending went past the plan this month. Two values were missing from `viewOf().month`. Both states work now.
- The bills amount still to pay shows cents in both Home cards (it showed 26,535 in one and 26,534.51 in the other).
- The percent in a goal's screen-reader label is rounded down like every other goal percent.
- Version one Home: the picture of where the money is, four numbers (Total, Free to spend, Bills left, Saved) and one next action. Everything else (main goal, Free to spend details, goals, cards and loans, limits, streak, pages) is one tap away under More. Nothing was removed.
- When the bank ends a month below zero, Home says so in one amber line with the month, the amount and the causes (the month started below zero, the plan spends more than comes in, spending went past the plan). It never says "Building your cushion" for that any more, and is never red.
- The first pay or bill amount a person enters becomes the usual amount for every month (it says so). Later edits are for the month shown, as before. Before, entering pay from Home's "Enter pay" card set only that month, and later months fell back to the sample pay.
- Plan amounts keep cents (dollars, euros, pesos and the rest); yen stays whole. Before, a typed 49.99 was saved as 50 without saying so. Plans saved by older versions load exactly as they were.

## 5. Known problems, in the order to do them

1. **Stale tests.** These were updated for 38.29 and 38.30 in the old session's `/tmp` and never committed, so the copies in `tests/regression` describe 38.28: `team_inter2.js`, `team_month.js`, `v34/purpose_test.js`, `v25/viewtest.js`, `v25/monkey.js`, `v25/display.js`. `team_map.js` is missing entirely. Fixtures missing: `/tmp/legacy_yen.json` (for `team_cur.js`), `/tmp/v35/old` (for `upgrade_test.js`). For each failure decide: is the test out of date, or is the app wrong? The old test wording is the clue to what was intended. Do not delete a test to get green.
2. **`tests/qc/reset_undo.js`** fails one check ("Reset month removed only this month's edits"). It is a draft. Find out whether the test or the app is wrong.
3. **`leftover_reload.js`** passes alone and failed twice when run straight after nine other browser tests. Make its waits depend on the save finishing, not on fixed sleeps.
4. **Screen maths left: 15.** Thirteen are in the setup tour (`ui45s.js`, `ui45x.js`, `ui45.js`), one is the month-end move (`ui6.js`, `moved`), one is allowed. Note `sweepOffer` in `ui6.js` works out the unspent amount itself, rounded to whole units, while the model's `m.pendLeft` rounds to cents. They should be one value.
5. **Whole cents.** Plan boxes round typed cents to whole units without saying so (`clampAmt`). Amounts are decimals, not whole cents.
6. **North-star items from the 38.30 review:** S1 no month-end question while setup is unfinished (`team_month.js` expects this), S2 after "Decide later" the proof line points to a card that is not there, S3 Plan does not show where a top-up went, S4 the first screen is mostly numbers, S5 a "Yearly cost: 25%" popup contradicts 29%, S6 "not planned yet" against "not placed yet".
7. **Wording to decide with Mako:** "Building your cushion" also shows when the bank ends below zero but the month adds to it.
8. **Not rerun on 38.31:** the full click sweep (one size passed, 136 clicks), `tests/guard.js`, `tests/safe.js`, the installable-app test.
9. **The oracle does not yet cover** receipts, spending past plan, piles or month-end answers. The proof covers them by conservation. An independent recount of those rules is the next step up.
10. **Roadmap after this:** B ledger and real balances with a "check against my bank" amount, statement totals checked against the statement's own balance, then C and D.

## 6. Before anything ships (no exceptions)

1. `bash tests/setup_env.sh`, then `./check.sh full` prints ALL GOOD. It has never been green on 38.30 or 38.31.
2. Stage the build: `bash tests/qc/stage_build.sh` (runs verify.sh, copies the exact build to `/tmp/qc_build/build.html`). Then two fresh QC agents, started at the same time on that file, each given only its own brief and the built page, never your reasoning. They are project subagents in `.claude/agents/` (`qc-north-star`, `qc-numbers`; the panel is `qc-novice`, `qc-money-accuracy`, `qc-data-safety`, `qc-layout-touch`, `qc-art-director`, `qc-wording`, `qc-regression`). Start each with only the build path:
   - north-star agent: `NORTH_STAR.md` and `QC_AGENT.md`
   - number-logic agent: `QC_NUMBERS.md`
3. The seven-role panel in `QC_ROLES.md`, in parallel with the two.
4. Any failure: fix it or take it to Mako, then run new agents on the new build. Never reuse an agent that has seen an earlier build.
5. Deploy as `build_site.sh` at the repo root does it (it copies the team sources into `src/`, builds `public/`), commit to `main`, push, check the Cloudflare run, open the live page, send Mako the link with an honest report.

Agents cannot be started from an ordinary chat. If you are in one, say so plainly and do not call the automated checks "QC passed".

## 7. Mako's standing rules

The full list of Mako's decisions is in `DECISIONS.md`. Read it at the start of every session; it wins over anything here that disagrees.

- North star: a bird's-eye view and clarity of money, so the person feels safe because they know where all of it is. Check every instruction and feature against it.
- Visual first: if a number can be shown as a picture and that is clearer, show the picture.
- Accuracy first. Nobody loses data.
- Plain words, like a manual. No em dashes anywhere in the app.
- Do not ask many small questions. Keep building. Set a resume timer at the start of a big task where the tool exists.
- Send the live link again whenever a piece of work is finished.
- After the org upgrade the in-app AI's credits may need claiming again by a Team owner. Check the assistant on the live site.
