(Sweep 2, 23 Nov 2026: QC findings that kept coming back, rounds 4 to 14. Read-only review by a helper; copied from its reply.)

**Repeated QC findings: rounds 4 to 14, QC10 fix rounds, Side A and Side B**

**What I read:** every file in wip/team/qc_round4 to qc_round14, QC10_FIX_ROUND.md, SIDE_A_FINDINGS.md, SIDE_B_FINDINGS.md, MAKO_RUN.md (for what was done with each finding), and RECOMMENDATION.md and SCHEMA.md (section 10 taken as final). The persona walks were written (origin/side/persona-walks, PERSONA_WALKS.md) but never run, so they have no results to group. Nothing was written in the repo.

**Why findings keep coming back at all.** Most QC briefs forbid reading MAKO_RUN.md and DECISIONS.md, and several reviewers say so in their reports. So every fresh reviewer raises the parked items again, and "for Mako's run" (about 50 entries) never took place. The new qc-foundation reviewer ignores wording and layout, and RECOMMENDATION keeps "the screens' layout, wording work" as they are. So the rule "trace a finding that comes back twice" has no owner for anything that is not the engine.

## A. Root cause NOT removed by the new foundation (will come back)

**A1. Screens give different verdicts on the same money.** About 11 rounds (4, QC10, 5, 6, 8, 10, 11, 12, 13, 14). Raised by north star, novice, money, numbers, wording and regression.
- Examples: setup says "On plan / yours to spend" while Home says "not safe yet". "You are okay" next to "Dec ends below zero". Plan says "On plan" while All months says "Not placed yet" and Home says "Below zero". "Building your cushion" next to "under your minimum". In round 14, logging an overspend removed the only "bank does not cover bills" warning.
- What was done: fixed one case at a time (ba67d44, 465a32b, e39abb2, "Your bills fit in your pay"). The words were parked (MAKO_RUN 1.21, 2.2, 2.5).
- Root cause: setup, Home, Plan, All months and the Free to spend sheet each write their own verdict from their own test (plan fits pay, bank covers bills plus Free to spend, minimum, next 3 months). The branches switch each other off (an overspend branch, a sample branch). Nothing produces one status that every screen reads.
- New plan: section 10.3 gives one safe-to-spend number but no single status (state, reason, next step). The screens keep their own sentences.

**A2. The rules for percents.** About 10 rounds (4, 5, 6, 7, 8, 10, 11, 12, 13, 14, plus Side A item 3). Raised by money, numbers and north star. Money accuracy called it a blocker in rounds 13 and 14.
- What was done: DECISIONS 6 said "keep", then it was parked again under MAKO_RUN 1.14, 1.20, 1.26 and 1.27.
- Root cause: two rounding rules (goal fill rounds down, the pay split is spread so it adds to 100). On top of that, the brief says "one rule, same percent everywhere" and contradicts the decision, so each new reviewer fails it.
- New plan: does not touch this. Per-period shares (10.4) add a third base for percents.

**A3. Sample numbers and real numbers mix.** About 10 rounds (4, QC10, 6, 8, 9, 10, 11, 12, 13, 14). Raised by money, numbers, data safety, wording and regression.
- Examples: real bills shown under "Sample numbers". A typed bank figure is invisible after a reload. A sample minimum of $3,000 shows up in a real plan.
- What was done: fixed 3 times (11a6638, 0d762a2), the rest parked (MAKO_RUN 1.12, 1.19, 1.22).
- Root cause: samples and the person's figures live in one state, and a flag decides field by field. Nothing records which values the person typed.
- New plan: SCHEMA has no sample mode at all. The premortem still lists "the sample's emergency fund is moved as if typed" as an open gap. It will come back, including in the move of saved data.

**A4. A minimum balance nobody chose drives the verdicts.** About 9 rounds (4, 5, 7, 8, 10, 11, 12, 13, 14). Raised by novice, money and regression.
- What was done: parked (MAKO_RUN 1.6). The conflict between two holdback rules was fixed in df0b685.
- New plan: 10.3 folds the minimum into one rule, which removes the conflict. But schema review 1 says "the move should set it on the bank", so the unasked default moves into the new engine. There it cuts safe to spend directly. Nobody has decided that setup asks for it.

**A5. Help missing in setup and on an open burrow, while the text promises it.** Novice, 10 rounds (4, 5, 6, 7, 8, 10, 11, 12, 13, 14).
- What was done: the words were corrected once (round 7). The rest was parked as layout (MAKO_RUN 3.4).
- Root cause: a missing control was filed as a look choice. That is the same mistake LESSONS describes: a fact treated as taste. Setup is being rebuilt, and the plan does not mention Help.

**A6. Receipts opens on the AI scan block, and three screens disagree about photos.** About 11 rounds (4 to 14). Raised by north star, novice and wording.
- The three: "Photos can't be read here" on Receipts, "sends that file to Claude" in Settings, and "upload statements" at the end of setup.
- What was done: parked (MAKO_RUN 3.10).
- Root cause: the single-file build and the hosted page can do different things, and the words are fixed text written for one of them. Not engine work.

**A7. Messages pile up and cover controls.** About 10 rounds (4, QC10, 5, 6, 7, 8, 10, 11, 13, 14). Toasts, the Undo bar and badge toasts cover Log spend, Category or the setup summary. Raised by novice, numbers, layout and north star.
- What was done: one case fixed (a60263c), then parked (MAKO_RUN 3.3).
- Root cause: each feature posts its own message in a fixed spot. There is no single message queue.

**A8. One figure has several names, and one name means several figures.** About 10 rounds (4, 5, 6, 7, 8, 9, 10, 11, 13, 14). The words are "planned", "saved", "left" against "not placed yet", and "over plan" against "past plan". The numbers gate called it a blocker in rounds 10 and 13 (two "planned" Free to spend figures).
- What was done: some fixed, the glossary parked (MAKO_RUN section 2).
- Root cause: labels are written screen by screen, with no name table tied to the figures.
- New plan: the wording stays, and the new engine adds more figures (period, set-aside, lowest point, headroom). Only the bank figure's names are settled. This will get worse.

**A9. The cloud copy's state is hidden.** Data safety, 10 rounds (4, 5, 7, 8, 9, 10, 11, 12, 13, 14). The header says "Saved in this browser" when the cloud copy is on or behind, and the "behind" card is 1,500 px down.
- What was done: parked as a cloud picture (MAKO_RUN 1.25, 3.6).
- Root cause: the header is fixed text, and a claim about where the data is was treated as a look choice. The cloud copy carries over unchanged.

**A10. Checks pass while something is wrong.** 7 rounds (4, 5, 7, 8, 9, 13, 14). Raised by regression and numbers.
- Examples: "FAIL the screens changed" followed by VERIFY OK. A retry hid a data-safety failure ("reasons survive a reload" came back empty). Number mismatches printed and still "ALL GOOD". An outside request not counted by the guard. Full checks run on a different commit. Other sessions killing Chrome mid-run.
- What was done: each time the test was fixed or the failure was called "timing".
- Root cause: check.sh retries and summarises, mismatch lines do not count as failures, and runs share one busy machine.
- New plan: step 5b counts on checks that "never go red", which leans harder on this weak point.

**A11. Smaller repeats, all parked or fixed one at a time, none touched by the plan:**
- Add a burrow when all pay already has a place, with no way to say where the money comes from (novice, 8 rounds; MAKO_RUN 1.5).
- The same amount written two ways, "$180" next to "$180.00" (numbers gate, 7 rounds; fixed per screen, came back each time). There is no single formatter.
- "On track" against "Filling" (7 rounds).
- The Restore button called "Load text" (6 rounds; the steps text was fixed, the button never renamed).
- "Set all to zero" against "Clear my plan" (5 rounds).
- Typing does not replace the old value: "$1,212", "TripLisbon" (rounds 5, 10, 11, 14). Fixed per field, with no shared behaviour for input boxes.
- Yen picked in advance for a dollar user (rounds 4, 6, 11, 14).
- Total leaves out debt (rounds 6, 7, 12; MAKO_RUN 1.9).
- Borrowing from the emergency fund while the same month adds to it, and fixes that cover one short month only (rounds 4, QC10, 5, 8, 10, 11, 12; MAKO_RUN 1.4, 1.21). The schema has no idea of a "borrow" or of how a short period is fixed, so this will come back in some form.

## B. Partly removed

- **B1. The safe-to-spend figure differed between screens.** Every round, 4 to 14, at least 15 times; the most-fixed bug (36d7a62, dbde166, 51e40de, e39abb2, df0b685). Rule 10.3 removes the competing rules. But round 12 showed Receipts working out its own figure (playSafeLeft in ui2.js:108 and ui4.js:66). The cause only goes if no screen works out a figure itself. Worth a test that every screen shows the engine's figure.
- **B2. "Not safe to spend yet" with no "when" and no "what to do".** Rounds 4 to 7 and 10 to 14 (MAKO_RUN 1.2). Pay schedules give a "days to next pay". Still open: people with no fixed pay day (`every: 'none'`) have no "when", and the next step is wording that stays as it is.
- **B3. Wrong rounding.** Side B (interest and percent paid off at an exact half), 12.345 logged as 12.34 (QC10, rounds 10 and 11), and interest rounded to whole dollars every month (rounds 11 and 14). Whole minor units fix storage. Interest and percent maths still need the integer method, and interest is stage 2.
- **B4. Changing currency keeps cents ("¥19.99").** Rounds 5, 11 and 13. Currency codes with decimals per code help. A currency change in Settings is not covered.

## C. Removed by the new foundation

- **Two bank figures, Check your bank against the plan's start, and pay counted twice through Settings "Money today".** Every round 4 to 14; the north-star FAIL nearly every round. Removed: one dated check, "what does your bank show today".
- **A card counted in the wrong month.** All of round 4, then rounds 8 and 12. Removed: the card's set-aside and its own payment day.
- **"Saved so far" counting planned saving, and "8% full" with $0 saved.** Rounds 4 (four roles), QC10, 7 and 12. Removed: goals hold money really set aside.
- **The emergency-fund step asking people to take the amount off their balance by hand.** Rounds 4, 10, 11 and 12. Removed by "kept in my bank, set aside" (keptIn inBank), if setup asks the question that way.
- **A debt reading as a goal, "full" or "paid off".** Rounds 4, 7 and 10. Removed by debt accounts and `pays`.
- **Goal cents lost.** Rounds 4, 5 and 12. Removed by whole minor units.
- **Undo wiping later work, or one Undo ending another.** Rounds 4, 5, 6, QC10 and 10. Removed by per-record "removed" marks.
- **Month-end words "isn't logged as spent / the plan counted it as spent".** Rounds 4, 8, 10, 11 and 13. Removed, because the plan is no longer counted as if it happened.

**One risk the QC rounds raised only once:** round 14 found a loan counted twice (once as a bill line, once under Cards and loans), and LESSONS says it was brought to Mako. SCHEMA 10.2 moves the old "loan" bill line into a bill schedule and also moves plan.debts into loan accounts that have their own payDay. That is the same double count, built into the move. It needs a check that the two are matched or one is dropped.

**Suggested next step:** for A1, A3, A4, A5, A9 and A10, ask the cause-level question once with a recommendation, add the decision to the reviewers' briefs, and turn each into a failing test before the screens are wired to the new engine.

Scratch files: /tmp/sweep_repeat/r6.txt to r14.txt (each round's reports put together).
