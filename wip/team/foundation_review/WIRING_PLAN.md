# Wiring plan: the new engine into the app (draft, 23 Nov 2026 evening JST)

Written for MAIN 15 after the change of direction (Mako wants speed; LESSONS lesson 4, the spec spiral). Status: draft, to go through qc-foundation before any build step. All amounts are made up.

## 0. The method in five lines
- **Thin slices that reach Mako.** Slice 1 is his own shape end to end, behind a switch, in about 3 days, on made-up numbers shaped like his money. Then widen.
- **One engine.** `wip/team/engine/` (lane/engine-a) is the only implementation the app uses. `ref/lookahead_ref.js` and `rules/*_ref.js` are frozen as the spec: never edited again, only read. One independent checker (`wip/team/checker/`, lane/checker-b) is pointed at the engine.
- **The old engine stays the default until one changeover commit** (RECOMMENDATION 5b). Both run side by side; check.sh never goes red and no test is weakened. While the switch is off, nothing a person sees changes.
- **Test first, one item per commit, `./check.sh` after each.** A review may add a test only for the slice being built; anything else goes on the list in section 6.
- **Everything new is in new files.** The only edits to old files in slice 1 are: `build.sh` (add files), `check.sh` (add steps), and one guard line each in `ui6.js`, `ui8.js`, `ui0.js` (hide the old money cards and stop old saves while the switch is on).

## 1. Slice 1: Mako's shape, end to end (about 3 days, 24 to 26 Nov JST)

### 1.1 What Mako can do at the end
Open the staged build with `?engine=3&try=mako` and see, on made-up numbers shaped like his money (pay on the 10th as two incomes, one bank, two cards paid in full on the 10th and 11th, bills on their due days):
1. **Setup** asks "What does your bank show today?" (figure and today's date), then pay (next pay date, amount, two incomes as one line or two), the two cards (payment day, last statement, on the card now, close day "not sure"), bills (amount, due day, monthly), and the minimum (M1: blank, skip means none).
2. **Home** shows: bank today with its age ("checked 3 days ago"), safe to spend until next pay with the sum behind it ("312,000 (bank today) - 98,000 (cards on the 10th and 11th) - ... = 41,500"), the period by its dates ("10 Nov to 9 Dec"), days to next pay, what is due before next pay grouped by account, what is on each card, and bank after the cards are paid.
3. **Check your bank** (the check-in): lists every expected item since the last check (pay, card payments, bills) ticked by default with the amount editable, asks the bank figure, and Home updates. The gap becomes the filler (A3), never a fixed adjust.
4. **The move**: with `?engine=3` and no `try=`, a saved 38.31 or 38.28 copy on the device is moved into the new shape in memory; the old key is read, never written. Missing facts (salary day, currency code) are asked once.

Not in slice 1 (Home hides them while the switch is on, with one line "Coming next: your plan, receipts and burrows"): the Plan tab, Receipts, burrows and goals tiles, statements, cloud copy, backup, Ask, the period-end question. Hiding them is on purpose: showing old-engine figures beside new ones is "two figures for one thing" (lesson 1 warning sign).

### 1.2 The switch
- New file `wip/team/engine3.js` (in the build right after `ui0.js`): `ENGINE3` is true only when the address has `?engine=3` or the device-only key `burrow-engine` is `'3'`. Default false. It holds the book (`B3`) and one call, `E3.view(today)`, which returns `BurrowEngine.lookahead.lookahead(B3, today)` plus the period (1.4 step 2). No sums in this file.
- While `ENGINE3` is on: `persist()` in `ui0.js` returns before writing `money-map-template-v2` (one guard line), `renderMap` in `ui8.js` and the money cards in `ui6.js` `renderHome` are skipped (one guard line each), and `home3.js` draws instead.
- Where the book is kept in slice 1: through lane C's store (`wip/team/store/`, IndexedDB `burrow3`) if it is merged by step 8; otherwise a 30-line holder in `engine3.js` writing one record to IndexedDB `burrow3-try`, marked for removal in slice 4 (open question Q2).
- Both engines run side by side in check.sh: every old test runs with the switch off (unchanged), every new test runs with it on.

### 1.3 The one extra equivalence check
`wip/team/tests/qc/engine_equiv.js`, in check.sh fast mode. For 300 random plans (realistic ids, yen and pesos) with: pay monthly on the 1st, every bill due on the 1st, no cards, no receipts, goal set-asides kept in the bank, and a bank check on the 1st before pay equal to the old `cfg.bankStart`:
- build the old copy and run `calcAll(S)` (model.js, unchanged);
- build the same plan as a v3 book, then write events for 3 months as if the whole plan happened (each pay, bill, budget line, Free to spend and goal set-aside settled on the 1st), which is what the old engine assumes;
- assert, in whole minor units, for each of the 3 months: `ledger.placesOf(book, last day).accounts[bank]` equals the old `byYm[ym].bankEnd`, each goal place equals the old goal saved, and `ledger.proof(book).ok`.
It prints `ENGINE EQUIV PASS n` or the first mismatch with the seed; any mismatch is a failure. It is the bridge that proves the new engine agrees with the old one where the old one was right.

### 1.4 Steps (each one commit, its test written and failing first)
Day 1 (24 Nov)
1. **Engine in, gates on.** Merge the engine files from lane/engine-a (new files only). check.sh gets two fast steps: `node engine/test/run_all.js` (must print `ENGINE CHECKS ALL PASS`) and the checker against the engine, `node checker/fuzz_vs_engine.js --seeds 2000` (0 differences). Test first: E10's facts as `tests/qc/mako_facts.js` (his shape every day of three months from `scenarios/mako_shape.json`, close days unknown from `mako_close_not_sure.json`, two incomes on one day entered as one), run on the engine.
2. **The period in the engine's answer** (lane A, engine file). `lookahead` already works out the period start (`lastPay`) but does not return it. Add `res.period = { start, end, startsWith }` (end = the day before the next period-starting pay). Test first in `engine/test/lookahead.test.js`: Mako's shape on 23 Nov gives 10 Nov to 9 Dec; on 10 Dec after the pay is ticked, 10 Dec to 9 Jan; pay landing early on Friday 9 Jan (weekend rule) starts the period that day (F8).
3. **Engine in the page.** `build.sh` adds `engine/dates.js units.js ids.js schedules.js ledger.js lookahead.js` after `model.js` (each is its own IIFE on `globalThis.BurrowEngine`). Test first `tests/qc/e3_loaded.js`: the built page's `BurrowEngine.lookahead` gives the same JSON as node for the Mako fixture on 5 dates; guard.js still passes (no idle cost, no outside requests); page size noted.
4. **The equivalence check** (1.3) into check.sh.

Day 2 (25 Nov)
5. **The switch** (`engine3.js`, the three guard lines). Test first `tests/qc/e3_switch.js`: off by default (every Home element as before); with `?engine=3`, after a run of taps the old key is byte for byte unchanged and the old IndexedDB copy `money-map-safe` too.
6. **Made-up Mako book.** `tests/fixtures/mako_madeup_book.json` (shape v3, realistic ids, made-up yen: two pays of 180,000 and 60,000 on the 10th, cards paid 10th and 11th, rent, power, phone, internet on their due days) and `?try=mako` loading it read-only. Test `tests/qc/e3_try.js`: it loads, `ledger.proof` ok, nothing written.
7. **Home, the new top** (`home3.js`). Bank today and its age, safe to spend with its sum, period dates, days to next pay, due before next pay by account, each card, bank after the cards, warnings and "later on". Uses lane D's formatter and status object if merged (`wip/team/screens/`), else `BurrowEngine.units.fmt` (Q3). Test first `tests/qc/e3_home.js`: on 9, 10, 11 and 12 Dec and 23 Nov, every figure on screen equals the engine's figure for that day; one bank figure on the page; `display_math.js` count does not go up.

Day 3 (26 Nov)
8. **Check-in writer, pure** (`engine/checkin.js`, lane A, new file). `checkIn(book, { day, figures: {acct: amount}, ticked: [occ ids], amounts: {occ: amount} })` returns the new records: the `check` per account with one `grp`, a `set:<occ>` settle per ticked item (pay as income that starts the period, card payment as `repay`), `unticked` on the check-in (AS5). Test first `engine/test/checkin.test.js`: Mako on 10 Dec ticks both pays and card A, types the bank; the look ahead then shows the new bank, period 10 Dec to 9 Jan, card B still due on the 11th, filler equal to the gap.
9. **Check your bank screen** (`checkin3.js`): the sheet lists `res.checkIn.toConfirm` ticked, amounts editable, the figure box (one input behaviour: tap selects), Save. Test `tests/qc/e3_checkin.js` (browser): the same walk as step 8 through the page.
10. **Setup, short** (`setup3.js`): the questions in 1.1, writing accounts, schedules and the opening check through `engine/build_book.js` (lane A, pure, new file: answers to records). Test first `engine/test/build_book.test.js` (Mako's answers give a book whose look ahead equals the fixture's on 5 dates) then `tests/qc/e3_setup.js` (browser walk).
11. **The move, engine side** (`engine/move.js`, helper, new file): the 38.31 and 38.28 copies (MOVE_FIELDS rows), ported from the frozen `rules/move_ref.js`, run against `rules/move.json` through a small adapter (`engine/test/run_move_cases.js`). Test first: the cases fail with no `move.js`.
12. **The move, page side** (`move3.js`): with `?engine=3` and an old copy, read the raw text, move into `B3`, ask salary day and currency once, never write the old key. Test `tests/qc/e3_move.js` on made-up copies `tests/fixtures/mako_3831_madeup.json` and `mako_3828_madeup.json`: every typed figure and receipt is accounted for (a list of anything not placed must be empty), the look ahead runs, old key unchanged.
13. **Gate and hand over.** `./check.sh full`, qc-foundation on the slice (walks Mako's shape through the page on the 9th, 10th, 11th and a day mid-period), stage the build, send Mako the link with `?engine=3&try=mako`. His questions go to MAKO_RUN as "for Mako's run" and the next slice starts the same turn.

Steps 2, 8, 10 (engine pieces) and 11 (the move port) can start on day 1 in parallel on helper branches; the main session merges them when its own step needs them.

### 1.5 Done when
All 13 commits in, check.sh full ALL GOOD with no retries, ENGINE CHECKS ALL PASS, checker 0 differences against the engine, ENGINE EQUIV PASS, `mako_facts.js` green, qc-foundation PASS on the slice, link sent.

## 2. Every place the screens and ACT read the old engine, and what replaces it

Counted by grep over `wip/team/*.js` (model.js function names and direct reads of `S.steps`, `S.once`, `S.items`, `S.cfg`, `S.cards`, `S.plan`). "Slice" says when the reader moves. Engine names are those of `lookahead` (`res.*`), `ledger` and `schedules`.

| Screen (files) | Reads from the old engine now | Reads instead | Slice |
|---|---|---|---|
| Home, Your burrow (`ui8.js`) | `mapOf` (bank, pay strip, month end, four numbers), `proofOf`, `nowOf`, `setBankNow`, `cfg(minBank)` | `res.accounts[id].bank, asOf, ageDays`, `res.safeToSpend`, `res.period`, `res.total.afterCards`; `ledger.proof`; check-in writer; pay strip from the period's plan lines (needs `res.period.lines`, see Q4) | 1 (bank, safe, period), 2 (pay strip) |
| Home status and Next (`ui6.js` `renderStatus`, `renderNext`) | `statusOf`, `viewOf`, `freeOf`, `sweepAns`, `topupFit`, `sampleShown` | lane D's one status object fed by `res.safeToSpend`, `res.warnings`, `res.notSeenYet`, `res.checkIn`; the period-end question (A7, `pe:` records) replaces the month-end top-up; `sweepAns`, `topupFit` retired | 1 (status), 2 (period end) |
| Home hero, goals, buckets, spend (`ui6.js`) | `goalInfo`, `goalRows`, `pickMain`, `wizardMonthly`, `receiptStats`, `jarsOf`, `setCurYm`, `MONTHS`, `END` | `res.places[id].kept, due`, `res.toPlace`; goal wizard monthly is a small sum, moved to `engine/units.js`; spending from spend events in the period; `MONTHS`/`END` retired (no end date) | 2 |
| Plan tab (`ui1.js`, `ui2.js`, `ui3.js`) | `planCells`, `monthStatus`, `jarsOf`, `statusOf`, `fixes`, `drawFit`, `playNotSafe`, `goalInfo`, `capOf`, `val`, `MONTHS`, `START`, `END`; Settings row `bankStart` | the period view (SCHEMA 9) from `res.period` plus plan lines left; past periods from events (needs a `periods(book, from, to)` engine call, Q4); road chart from the "later on" walk; `fixes` from status reasons; `bankStart` row retired (one bank figure) | 2 |
| Cards, loans, limits, last month, repeating (`ui7.js`) | `debtRows`, `addExtraMoney`, `limitsOf`, `lookBack`, `applyRecurring`, `playNotSafe`, `freeOf`, `S.plan.debts`, `S.plan.recurring` | `res.cards`, `res.owed` (E6: a loan is an account that owns its payment); budget lines left; the past period view; `applyRecurring` retired (schedules log `auto:` spends) | 2 (cards from slice 1 data), 5 (loans) |
| Receipts (`ui4.js`, `ui49.js`) | `planCells`, `receiptStats`, `playNotSafe`, `overParts`, `leftOfPlan`, `addReceipt`, `updateReceipt`, `removeReceipt`, `S.receipts` | spend events (SCHEMA 6.3) for the period; budget line left from the plan; writes through ACT3 | 2 |
| Setup (`ui45.js`, `ui45s.js`, `ui45x.js`) | `calcAll`, `viewOf`, `statusOf`, `planFactsOf`, `setupCells`, `goalDefault`, `capOf`, `setVal`, `setBankBalance`, `splitDraft`, `loanPayments`, `loanTotalFrom`, `loanMonthlyFrom` | `setup3.js` and `engine/build_book.js`; facts shown during setup come from the look ahead on the draft book; loan helpers replaced by a loan account (E6) | 1 (short setup), 3 (full setup) |
| Statements (`ui45u.js`, `ui45v.js`, `stmt.js`) | `setVal`, `setBankBalance`, `updateLine`, `addReceipt` via `importApply`, `stmtAfterApply` | import lines with `src` and posting dates (SCHEMA 6.4, E4), matching; the any-AI paste format writes v3 | 3 |
| Ask and Help (`ui4a.js`, `ui46.js`) | `calcAll`, `viewOf`, `monthStatus`, `receiptStats`, `jarsOf`, `statusOf`, `goalRows`, `fixes`, `val`, `setVal`, `receiptsTotal`, `setBankBalance` | `asstPicture` from the look ahead; `asstCheck` runs ACT3 actions (E8); help text rewritten for periods | 5 |
| Settings, backup, export, startup (`ui0.js`, `ui5.js`, `ui42.js`, `ui43.js`) | `calcAll`, `trimPlay`, `sheetRows`, `sheetCsv`, `resetMonth`, `presetState`, `blankState`, `ownStart`, `undoOnce`, `normalize`, `persist` | lane C store (`burrow3`), backup and cloud as `{ fmt: 'gz1' }` (D5, E3), export from events by period, samples kept apart (C); `trimPlay`, `resetMonth`, `ownStart` retired | 4 |
| Art and world (`burrows.js`, `squirrel.js`, `realm.js`, `music.js`) | `calcAll`, `receiptStats`, `goalRows`, `moveCap`, `fixes`, `END`, `addGoal`, `updateGoal` | `res.places`; status reasons; `END` retired | 2 |
| ACT (`actions.js`) | `calcAll`, `viewOf`, `jarsOf`, `statusOf` in `summary`; `sweepPlay`, `unsweepPlay`, `releasePlay`; `setVal` on `S.steps/once/items`; `setBankNow`, `setBankBalance`, `cleanCards`, `ownStart`; undo by whole snapshots | ACT3 (`act3.js`): named actions that write events and plan records with built ids; undo is `gone` marks (D2); `summary` reads the look ahead; sweep and release become period-end answers | 5 (slice 1 writes through `checkin.js` and `build_book.js` only) |
| Main suite (`test_team.js`) | most model functions | see section 4 | 7 |

## 3. Later slices (each about 1 to 3 days, same rules)
- **Slice 2, Plan, Receipts, burrows on the new engine.** Period view with plan lines left; Receipts as spend events; goals as places kept in the bank (Mako decision 3); the period-end question (A7); history periods. Needs engine calls `res.period.lines` and `periods()` (Q4).
- **Slice 3, statements first (E4) and the full setup.** The any-AI paste format and its checker write v3; import lines with posting dates; matching (6.4); Japanese files through the AI route. Full 12 to 15 screen setup (A8).
- **Slice 4, storage, cloud copy and backup.** Lane C store becomes the only writer; version refusal and "Update the app" (D6); the marker on the old key; cloud copy under its own key with compare and swap (AQ1, E3); backup files `gz1`; `persist()` request (D7). Remove the slice 1 holder.
- **Slice 5, ACT rewritten (E8), Ask, loans in one home (E6).** ACT3 with undo as `gone`; the assistant's checked actions on ACT3; loan accounts and the move's matching of the old "Loan or debt payment" line.
- **Slice 6, the other lives (stage 1b).** Twice a month, every two weeks, weekly, no fixed pay, cash and e-wallets; the move proved on every old build 25.0 to 38.28 (E1); the bank comparison Mako sees before deploy redone on the new engine.
- **Slice 7, the changeover commit.** One commit: `ENGINE3` default true, old Home and Plan code paths and `model.js` money functions removed from the build, retired tests removed from check.sh per the signed list (section 4), golden files regenerated. Before it: check.sh full ALL GOOD on both settings; after it: ALL GOOD with the new list. Then the full QC panel once (5b).

## 4. Tests: keep, replace or retire
The rule: no test is edited to pass. A test that checks old calendar-month behaviour is retired only from a written list signed by qc-regression, and only in the changeover commit, with its replacement already green. Until slice 7, every test below runs unchanged with the switch off. The full per-test list (`tests/RETIRE_LIST.md`, one row per test in check.sh and `tests/`) is written in slice 6 from this grouping; each row names the test, what it checks, and keep, replace with X, or retire because Y.

| Group (check.sh) | What they check | Decision |
|---|---|---|
| build, syntax, CSS braces | the page builds | keep |
| `test_team.js` main suite | model unit cases, actions, wording, UI | split: UI and wording cases keep; `calcAll`/`viewOf`/`planCells` month cases replaced by engine unit tests and `engine_equiv.js`; month window cases retired (no end date) |
| oracle (`/tmp/v25/oracle.js`), `proof_fuzz.js`, `fuzz_model.js`, `fuzz_debts.js`, number checks (`/tmp/v26/num.sh`), `number_gate2/3.js`, `numbers_round4.js`, `money_round4.js`, `compare_3828.js` | the old engine against a second calculation | replace with the checker against the engine (2,000 seeds), `ledger.proof` fuzz and `engine_equiv.js`; retire at changeover because the code they check is gone |
| `e6_window.js`, `v1_model.js`, `v1_now.js` | the Nov 2026 to Oct 2028 window, v1 model points | `e6_window` replaced by the engine's "no end date" and "dates never dropped" tests; v1 points rewritten as engine tests where the fact still holds, retired where it was a calendar fact |
| `display_math.js` | screens do no money maths | keep; it now also counts `home3.js`, `checkin3.js`, `setup3.js` |
| `safe.js`, `guard.js`, `script_run.sh`, `perf.js`, `perf2.js` | saving safety, idle cost, outside requests, known findings, speed | keep; `safe.js` replaced in slice 4 by the store's version; add the 30,000-event speed test in the page (AS13) |
| `/tmp/team_*.js`, `/tmp/v22..v37/*.js` flow scripts | setup, month, card, video, undo, sync, onboarding | keep while the screen exists; each one that asserts a month figure is replaced by its e3 version in the slice that rewires that screen |
| Home and Plan figure tests (`home_dom`, `home_map`, `h1_*`, `qc9_home_status`, `qc10_bank_story`, `qc11_back_balance`, `qc22_bank_now_below`, `qc30_past_pay`, `qc32_left_one`, `leftover_*`, `below_zero`, `zero_safe`, `goal_agree`, `label_agree` and similar) | month-end figures on screens | replace with `e3_home.js` and the slice 2 tests; retire because they assert the calendar month |
| Wording, layout, tap size tests (`qc10`..`qc35` word, stop, wrap, tap44, contrast, button names) | words and layout | keep; a test whose screen is removed is retired with the screen, named in the list |
| Cloud, backup, undo (`cloud_*`, `qc11_cloud_*`, `qc12_cloud_undo_reload`, `act_keep.js`, `act_undo_exact.js`, `undo_*`, `reset_undo`) | old key, old vault shape, snapshot undo | keep until slices 4 and 5, then replace with store, vault and ACT3 versions |
| `mako_answers.js` | Mako's stated answers | keep, and every answer that is a fact about money also gets an engine test (E10) |
| PWA (`/tmp/team_pwa.js`) | install, offline, update offer | keep |
| New in slice 1 | engine run_all, checker vs engine, `mako_facts`, `engine_equiv`, `e3_*` | added, permanent |
| `foundation_review/ref/run_scenarios.js`, `rules/run_rules.js` | the frozen spec against itself | not in check.sh; frozen with the spec. The scenario and rule cases keep running against the engine through `engine/test/run_against_ref.js` and the move adapter |

## 5. Who does what

**Main session only** (one writer, so no merge fights): `model.js` (untouched until slice 7), every existing `ui*.js` and `actions.js`, `build.sh`, `check.sh`, golden files, `engine3.js`, `home3.js`, `checkin3.js`, `setup3.js`, `move3.js`, every browser test (`tests/qc/e3_*.js`), the changeover commit, the retire list's sign-off with qc-regression.

**Helpers in parallel, new files only, own branches:**
- Lane A (engine, lane/engine-a): `res.period` (step 2), `engine/checkin.js` (8), `engine/build_book.js` (10), later `periods()` and `res.period.lines` (slice 2). It owns `wip/team/engine/`.
- Move helper (new branch `lane/move-e`): `engine/move.js` and its case adapter (11), the made-up 38.31 and 38.28 copies of Mako's shape.
- Lane B (checker): `checker/fuzz_vs_engine.js`, pointed at the engine instead of the reference (step 1).
- Lane C (storage, `wip/team/store/`) and lane D (screen pieces, `wip/team/screens/`): as briefed; slice 1 uses them if merged, does not wait for them.
- A fixtures helper: `tests/fixtures/mako_madeup_book.json` and the equivalence generator's plan builder (steps 4 and 6).

Each helper hands back a branch with its tests green; the main session merges, runs check.sh, and commits the wiring.

## 6. Risks and open questions (each with a recommendation)
- **R1. The engine does not return the period or the plan lines left.** `lookahead` works them out (`lastPay`, `planLeft`) but keeps them inside. Recommendation: lane A adds `res.period` now (step 2) and `res.period.lines` in slice 2; screens never work them out.
- **R2. The move is only in the frozen reference.** `rules/move_ref.js` is 863 lines and must not be maintained beside the engine. Recommendation: port once into `engine/move.js`, check it on `rules/move.json`, and from then on fix only the engine copy.
- **R3. Mako's live copy is 38.28, not 38.31.** Recommendation: slice 1 moves both (step 12); the other old builds wait for slice 6 (E1).
- **R4. Hiding Home's goals and Plan while the switch is on could feel like lost data.** Recommendation: one plain line on Home ("Your plan, receipts and burrows come next. Nothing is lost: your saved copy is untouched.") and the switch only reachable through the link we send.
- **R5. Two writers of the saved copy during slice 1.** Recommendation: the guard in `persist()` plus `e3_switch.js` proving the old key and `money-map-safe` byte for byte unchanged.
- **R6. Page size and start time** with six engine files (about 1,500 lines). Recommendation: measure in step 3; guard.js and perf.js must stay inside their budgets.
- **R7. The checker was written against the reference, not the engine.** The eight classes are decided (AU), so differences should be zero. Recommendation: any difference left after AU is an engine bug or a spec gap, decided in one line, never by editing the frozen reference.
- **Q1 (for Mako's run, not blocking).** The period name on Home: dates "10 Nov to 9 Dec" (already decided, DECISIONS "The new foundation"). Nothing to ask.
- **Q2. Where the slice keeps the book if lane C is not merged by day 3.** Recommendation: a 30-line holder writing IndexedDB `burrow3-try`, removed in slice 4; never the old key.
- **Q3. Formatter and status object if lane D is late.** Recommendation: use `BurrowEngine.units.fmt` and a plain status from `res.warnings` in slice 1; switch to lane D's pieces in slice 2 (they must exist before slice 2, lesson 2).
- **Q4. Past periods.** No engine call builds a past period from events yet. Recommendation: lane A adds `periods(book, fromDay, toDay)` for slice 2, tested on Mako's shape over three periods.
- **Q5. Close days.** Mako does not know them; setup's "not sure" means each card is due in full on its next payment day (decided). The made-up book uses made-up close days only in a second fixture for the "known" case.
- **Q6. The minimum (M1).** Decided: asked once, blank, skip means none. Slice 1 follows it.
- **Q7. Speed versus gates.** Recommendation: during slices 1 to 6 only the two gates (engine checks, checker), the equivalence check, check.sh and qc-foundation run; the full QC panel runs once after the changeover (5b, lesson 4).

## Corrections after qc-foundation plan review (23 Nov, all accepted, DECISIONS_ROUND2 AY)
- F1. With the switch on, the old start does not run at all (no loadLocal, recoverMirror, wireVault, wire, pagehide or visibility handlers). One start branch in place of the three guard lines. Only move3.js reads the old key and the IndexedDB record, raw, and only the new screens can be reached. e3_switch.js also proves the old key and money-map-safe are byte for byte unchanged after hide, pagehide and reload.
- F2. After move.js, move3.js asks the setup3 questions the old copy cannot answer: the bank today, the cards (payment and close days) and the bill due days. When cards are added: "Is your Card line these card payments?" Yes drops the budget line, as E6 does for loans. e3_move.js checks that the look ahead of the moved Mako copy equals the setup-built book for the same facts on the 9th, 10th and 11th.
- F3. The stored book records its source (the old key's rev and a hash). On open, the stored book wins. If the old copy changed since the move, Home says so and offers to move again. The test covers a check-in, then a reload. Slice 1 takes Mako's 38.28 backup file (Load backup) or a #move= link into move3.js, because the staged build cannot read his installed app's storage.
- F4. res.period.nextPay = { occ, due, state: 'coming' | 'late' | 'notSeen' }, following H8, F3 and G4. Step 2 tests 10 Dec before the pay is ticked, a pay one day late, and 30 Dec with nothing ticked.
- Watch (later slices): judge an engine_equiv mismatch against the spec, never bend toward the old engine; the slice 1 fixture includes a weekend where the card leaves before pay lands; a visible way back off the switch before slice 4; periods() built from settled pays; the burrow3-try copy moves into lane C's store with its source marker; slice 6 asks the same "is this line really payments" question for e-wallets and loans.
