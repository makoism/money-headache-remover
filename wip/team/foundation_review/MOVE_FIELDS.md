# Every saved field of every old build, and where the move puts it (23 Nov 2026, after Y and Z)

Mako's money is in copies saved by older builds: 38.28 is live, 38.31 is the latest, and E1 asks for the 25.0 to 38.28 builds too. SCHEMA_V3 11.1 lists the 38.31 fields and their targets. This file lists the fields of every build that could be found, from each build's own load and clean-up code, with the target of each, or the reason it needs none. Decisions Y (the 28 questions mv-q1 to mv-q28) and Z (the `mv:` kind names below, Z3, Z5, Z6) are folded in. The cases are in `rules/move.json` (69 cases, run by `node rules/run_rules.js move`), the reference is `rules/move_ref.js`, and the 13 questions Y and Z leave (mv-q29 to mv-q41) are in `rules/move.json` under `open` and in section 9. Every amount in the cases is made up.

## 1. The builds found

All builds save to the same localStorage key, `money-map-template-v2`, and keep a second copy in IndexedDB `money-map-safe` (record `{ rev, t, json }`, `t` the moment of the save). No build writes a save time into the copy itself; the copy's last save is that second copy's `t`, else the stored `rev` when it is a time (38.31), else the move's own time [Y13].

| Build | Commit (public/index.html) | Load code |
|---|---|---|
| 25.0, 26.1, 27.7, 28.4, 29.0, 30.2, 31.0 | 3731f62, 389717c, 31b88bd, f856ede, 0d233d9, d0cc239, b231859 | the same in all seven (group A) |
| 32.0, 33.1 | af2e590, 85ac426 | A plus receipt `s`; ui accts, askNums, cats, exactHidden, mcSeen, movedIn, music, noMove |
| 34.0, 35.1 | c441cba, 57d9801 | plus ui.sweep (`{ amt, id }` rounded to whole units, or `{ hide }`) and goal `why` |
| 36.4 | 54afe5e | plus ui vol, dj, scene, onb |
| 37.2, 38.5, 38.10, 38.17, 38.22 | 91d30cf, f32865b, 2d649ad, 5173c60, cab01c5 | the same saved fields as 36.4 (only art keys beside the copy) |
| 38.26 | d7d445b | plus plan.debts, plan.recurring, steps and once `debt:<id>`; ui full, limits, moreBillsHidden, noDebts, remindHidden |
| 38.28 (live) | e15e25d | the same saved fields as 38.26; its clean-up writes `ui.cur: '₱'` and preset `legacy` into any copy with no currency (so a copy it saved holds them) and new copies start in yen |
| 38.31 (latest, wip-38.31) | wip/team/model.js, ui0.js | plus cards[]; cfg bankAt, bankNow, bankNowAt, planFrom; ui keep, keeps, preSplit, mcOk, minAuto; goal stretchOn, stretchFrom; unknown plain fields on goals, receipts, cfg and the top level kept; sweep `{ amt, to: 'bank' or 'next', t }`; amounts with cents (goals, debts) and a bank below zero; months outside the old window kept in once and items |

How they were found: `wip/team/tests/fixtures/old_builds.txt` lists the 19 released builds from 25.0 to 38.28 by commit (the repository history starts at 38.8; the older commits are reachable by hash). Each build's `public/index.html` was read at its commit (the same files as `/tmp/v35/old/`, checked by md5 for 25.0 and 38.28), its `normalize`, `cleanCfg`, `cleanPlan`, `cleanDebts`, `cleanRecurring`, `cleanReceipts`, `cleanSteps`, `cleanOnce`, `cleanItems`, `basePlan`, `CFG_AMOUNTS` and `LINE_DEFS` taken out, and every `S.ui.<key>`, `S.cfg.<key>` and top-level field the page reads or writes listed and compared build by build. `src/` holds 38.28 plus one later commit (2cb7a9b, Undo), so 38.28 was read at e15e25d. No build older than 25.0 is listed in the fixtures; the pre-25.0 fields that the 25.0 clean-up still deletes (ui loanMode, loanTotal, subsX) and reads (the cfg goal figures, loanLast, redirectLoan, used when a copy has no plan) are in the table.

Two things hold in every build: the ui object is kept whole on load (every ui key a page ever wrote can be in a stored copy), and the 38.31 clean-up drops data (receipts beyond 5,000; before 38.31 also months outside Nov 2026 to Oct 2028 in once and items, and any field it did not know). The move reads the raw text [O], so all of it is there.


## 2. Field counts per build

A row of the table can name several fields (`cfg.moveTarget, moveStart, ...`); these counts count each one. **Target**: decided (by 11.1, a decision or Y and Z). **None needed**: the field needs no place, for the reason the row gives (kept in `frozen3831`). **Open**: it has a target, and a detail Y and Z leave open (section 9). **No target**: nothing decided yet, kept in `frozen3831` and listed (section 9, mv-q34).

| Builds | Fields | Target | None needed | Open | No target |
|---|---|---|---|---|---|
| 25.0 to 31.0 | 121 | 100 | 4 | 11 | 6 |
| 32.0, 33.1 | 130 | 108 | 4 | 12 | 6 |
| 34.0, 35.1 | 132 | 109 | 4 | 13 | 6 |
| 36.4 to 38.22 | 136 | 113 | 4 | 13 | 6 |
| 38.26, 38.28 | 158 | 134 | 4 | 13 | 7 |
| 38.31 | 178 | 146 | 12 | 13 | 7 |

Before Y and Z (kept for the record): 114, 123, 125, 129, 151 and 171 fields, of which 22, 22, 22, 22, 23 and 26 had no target and 16, 16, 17, 17, 24 and 26 an open detail. The rows were redrawn for Y (pay amounts, item labels and notes, receipt notes apart), so the field totals differ a little from the old count.

## 3. Every field, its target and its case

"First build" is the first build found that saves it; every later build saves it too. Keys of steps and once are by what they name: the bill keys are bill:rent, bill:util, bill:net, bill:phone, bill:ins and bill:subs; the budget keys bill:food, bill:gas, card and `line:<id>`; the share keys envelope (Free to spend), education, invest and give. A one-month amount (`once`) of a month before the opening's month stays in `frozen3831` only (history the opening figure holds).

| Saved field | Meaning | First build | Target, or why none is needed | Status | Case |
|---|---|---|---|---|---|
| `v` | shape version, always 1 | 25.0 | replaced by `v: 3` | target | mv-01 |
| `rev` | revision count, +1 per save (38.31: max(now, rev + 1), a time) | 25.0 | replaced by `rev` (max(now, rev + 1)) and `at`; when it is a time and there is no second copy, it is the copy's last save [Y13]; the old value only in `frozen3831` | target | mv-01, mv-41, mv-56, mv-57 |
| `steps.a, steps.b, steps.side` | pay by month: salary, second pay, side pay (`[ { from: ym, v } ]`) | 25.0 | three `income` schedules into the main bank, named as 38.31 names them; only the salary starts periods; each step from its month's first day; the rule once the pay day is answered [Y2, Y3]; 0 every month: not moved, in the move summary [Y25, reading] | open | mv-29, mv-46 (mv-q32: pay not monthly on one day) |
| `steps.<bill key>` (bill:rent, util, net, phone, ins, subs) | a bill's monthly amount from a month on | 25.0 | the bill schedule's `steps`, from that month's first day [Y7, Y3] | target | mv-30 |
| `steps.<budget key>` (bill:food, bill:gas, card, line:<id>) | a budget line's monthly amount from a month on | 25.0 | `plan.budgets[].steps`, from that month's first day [Y3] | target | mv-30, mv-66 |
| `steps.envelope, education, invest, give` | Free to spend, Courses and books, Investing, Giving by month | 25.0 | `plan.shares` entries (`free`, `edu`, `ffa`, `give`), from that month's first day [Y3] | target | mv-30, mv-45 |
| `steps.goal:<id>` | a goal's monthly set-aside from a month on | 25.0 | `plan.shares[].goals[<place>]`, from that month's first day [Y3] | target | mv-31 |
| `steps.bill:loan` | the "Loan or debt payment" line by month | 25.0 | the matched loan's payment `steps` (its first amount the loan's fixed `minRule`) [Y4] | target | mv-49, mv-50 |
| `steps.debt:<id>` | extra paid on a card or loan from a month on | 38.26 | `extraSteps` on that loan or card, from that month's first day [Y3] | target | mv-19 |
| `steps.<key with no line, goal or debt>` | left behind by a removed line in an older build | 25.0 | none needed: its line is gone, so there is nothing to apply it to; kept in `frozen3831` and listed | none needed | mv-32 |
| `once[ym].<budget key>` | one month's amount for a budget line | 25.0 | `plan.budgets[].once`, the first period starting in that month [X watch], else the period holding its first day [Z5]; waits for the pay day (`held`) | open | mv-33 (mv-q33) |
| `once[ym].a, b, side` | one month's pay, or extra money added to it | 25.0 | `amounts` on that month's occurrence of that stream [Y2]; waits for the pay day (`held`) | open | mv-33, mv-46 (mv-q32, mv-q33) |
| `once[ym].<bill key>` | one month's bill amount | 25.0 | `amounts` on that month's occurrence of the bill [Y7]; waits for the bill day (`held`) | open | mv-33 (mv-q33) |
| `once[ym].draw` | money taken out of the Emergency fund that month | 25.0 | none decided: kept in `frozen3831`, listed | no target | mv-33 (mv-q34) |
| `once[ym].envelope, education, invest, give` | one month's share, or extra money placed there | 25.0 | none decided (`plan.shares` has no one-period amount): kept in `frozen3831`, listed | no target | mv-33 (mv-q34) |
| `once[ym].goal:<id>` | one month's goal set-aside, or extra money put in the goal | 25.0 | none decided: kept in `frozen3831`, listed | no target | mv-33 (mv-q34) |
| `once[ym].debt:<id>` | extra money put on a debt that month | 38.26 | none decided: kept in `frozen3831`, listed | no target | mv-33 (mv-q34) |
| `items[ym][].id, amount` | a one-time cost in a month | 25.0 | a `once` schedule dated the month's first day; in the move month (the calendar month the move runs in) a first day before the opening becomes the first day after it [H9, Y21] | target | mv-34, mv-63, mv-68 |
| `items[ym][].label` | the one-time cost's name | 25.0 | the schedule's name when there is no note [11.1]; with a note it has no place (listed) | open | mv-34, mv-65 (mv-q30) |
| `items[ym][].note` | the one-time cost's note | 25.0 | the schedule's name [Y24] | target | mv-65 |
| `items[ym] = []` | "no one-time costs this month" (touched and emptied) | 25.0 | none needed: nothing to move; only in `frozen3831` | none needed | mv-34 |
| `cfg.bankStart` | the bank at the start of the first month, or as typed in setup | 25.0 | a dated bank `check`; the oldest figure opens the bank, on the account `mv:acct:cfg` named "Bank", the main bank [Y18, Y26]; on the same day as bankNow, bankNow wins [Y22] | target | mv-02 to mv-06, mv-48 |
| `cfg.bankAt` | the day bankStart was typed (a day, no time) | 38.31 | the check's date; told at the end of that day in the moving device's offset, or at the copy's last save when that is earlier [Y1] | target | mv-02, mv-47, mv-69 |
| `cfg.bankNow` | the bank as typed on Home | 38.31 | a dated bank `check` [11.1, Y22] | target | mv-04, mv-05, mv-48 |
| `cfg.bankNowAt` | the day bankNow was typed (a day, no time) | 38.31 | the check's date; told as bankAt [Y1] | target | mv-04, mv-47, mv-69 |
| `cfg.minBank` | the lowest balance to keep | 25.0 | `home.minBank`, only when typed | target | mv-09 |
| `cfg.ceiling` | most to spend in a month | 25.0 | `plan.limits.ceiling` | target | mv-11 |
| `cfg.aims` | the split chosen in setup, shares of pay per jar | 25.0 | `plan.limits.aims` | target | mv-11 |
| `cfg.planFrom` | the month the plan starts | 38.31 | none needed: periods come from pay; `frozen3831` only (read for a dated goal's set-aside, Y10) | none needed | mv-11 |
| `cfg.loanLast, cfg.redirectLoan` | older copies: the loan line's last month and whether its money then goes to the Emergency fund | 25.0 | the loan's `ends` (the month's last day) and `redirect` [Y5, Y6]; with an empty loan line, in the move summary with it [Y4] | open | mv-44, mv-50 (mv-q36) |
| `cfg.moveMonth, cfg.carDue` | older copies: the move goal's month and the yearly cost's date | 25.0 | the goal's `due`, when the plan has no goal with that id [Y5] | target | mv-18 |
| `cfg.moveTarget, moveStart, travelTarget, travelStart, carTarget, carStart, rainyStart, rainyTarget, rainyStretch` | older copies: the four sample goals' figures | 25.0 | the matching sample goal's `target`, `start` and `stretch`, used only when the plan has no goal with that id [Y5] | target | mv-18, mv-51 (mv-q37) |
| `cfg.<unknown>` | a newer build's setting | 38.31 | none needed: a setting this move cannot know; `frozen3831`, listed [11.1] | none needed | mv-26 |
| `plan.lines[].id, key, jar, name` | a line: its id, the key its amounts use, its jar, its name | 25.0 | rent, util, net, phone, ins, subs: bill schedules; loan: matched to a loan, or a loan of its own, or dropped [E6, Y4]; food, gas, card and custom lines: `plan.budgets` (place from the jar); spend, learn, invest, give: `plan.shares`; 0 every month: not moved, in the move summary [Y25] | target | mv-12, mv-49, mv-66 |
| `plan.lines[].def` | the line's usual monthly amount | 25.0 | the first step | target | mv-12 |
| `plan.lines[].note` | the built-in line's help text (app text, reset on every load) | 25.0 | none needed: app text, not the person's | none needed | mv-12 |
| `plan.lines[].ends` | the last month of the line (a month, not a day) | 25.0 | `ends`, that month's last day [Y6] | target | mv-13, mv-49 |
| `plan.lines[].redirect` | after `ends`, the line's money goes to the Emergency fund | 25.0 | `redirect: <the Emergency fund's place>`; on the loan line, the loan's redirect [Y4] | target | mv-13, mv-49 |
| `plan.goals[].id, name, target, due, slot` | a goal | 25.0 | `places` | target | mv-14 |
| `plan.goals[].start` | saved so far | 25.0 | asked where it is [Y17]: in the bank (and until answered, Z3) part of the bank's opening split; in another account the person names, that account's opening; a pay-off goal's is the loan's `paidBefore` [Z6] | target | mv-15, mv-45, mv-55, mv-59 |
| `plan.goals[].monthly` | fixed monthly set-aside for a goal with no date | 25.0 | `plan.shares[].goals`; a dated goal's set-aside, never saved, is worked out as 38.31 does, from the move day [Y10] | target | mv-31, mv-54 (mv-q39) |
| `plan.goals[].why` | a line on why the goal matters | 34.0 | kept on the place | target | mv-14 |
| `plan.goals[].emergency, stretch` | the Emergency fund and its longer target | 25.0 | `places` kind emergency, `stretch` | target | mv-17 |
| `plan.goals[].stretchOn, stretchFrom` | yes to the longer target, and from which month | 38.31 | `stretchOn`, `stretchFrom` on the place | target | mv-17 |
| `plan.goals[].<unknown plain>` | a newer build's goal field | 38.31 | kept on the place | target | mv-14 |
| `plan.debts[].id, name, kind, balance, apr, min, extra` | a card or loan with interest | 38.26 | a `loan` or `card` account opened at `balance`, `apr`, `minRule: { fixed: min }`, `extraSteps` from `extra`; its payment day asked; a card's close day "not sure" and `inFull: false`; kind `personal` a loan [Y9] | target | mv-19, mv-53 |
| `plan.recurring[].id, a, c, n, every, on, from, last` | spending that logs itself, weekly on a weekday or monthly on a day | 38.26 | `schedules` kind autoSpend; weekly `on` becomes the rule [H9]; `last` the last day already logged; `c` as a receipt's [Y20, reading] | target | mv-20 |
| `receipts[].id, d, a, c` | a logged spend | 25.0 | `spend` events, `mv:rc:<id>`; `c` a budget line, a share's place, a bill (place bills with its line), `other` (Free to spend, line `other`), bill:loan a `repay` on the matched loan [Y20]; `told` the start of its day [J2, Y1] | target | mv-07, mv-62 |
| `receipts[].n` | the receipt's note | 25.0 | `note`, unchanged [Y14] | target | mv-07 |
| `receipts[].cn` | the category's name as shown when it was logged | 25.0 | none needed: the line or place `c` names carries the name (reading, mv-q29) | none needed | mv-07 |
| `receipts[].s` | the account it came from, as named | 32.0 | `acct` when it names an account; else no place now the note moves unchanged (listed) | open | mv-08, mv-21, mv-07 (mv-q29) |
| `receipts[].<unknown plain>` | a newer build's receipt field | 38.31 | none needed: a field this move cannot know; `frozen3831` only, listed | none needed | mv-26 |
| receipts beyond 5,000 | receipts every build's clean-up drops (it keeps the first 5,000) | 25.0 | moved from the raw text [O] | target | mv-35 |
| `cards[].id, name, owed, payDay, at` | pay-in-full cards typed on Home | 38.31 | `card` accounts, `cutDay: null`, `inFull: true`, opened with a check of `owed` dated `at`, told at the end of that day [Y1] | target | mv-21, mv-58 |
| `<unknown top-level field>` | a newer build's field | 38.31 | none needed: a field this move cannot know; `frozen3831`, listed | none needed | mv-26 |
| `ui.cur, ui.preset` | currency symbol; which sample was loaded | 25.0 | the first `home.curs` entry, asked when ambiguous | target | mv-22 to mv-25 |
| `ui.name` | the person's name | 25.0 | `people[0].name`, `mv:person:ui.name` [Y28] | target | mv-27 |
| `ui.gk` | goal kinds by goal id | 25.0 | the place's `kind`; a pay-off goal gets `pays`: the debt with its name, else a new loan whose balance is asked [Y11] | target | mv-14, mv-16, mv-55 |
| `ui.accts` | accounts named by a statement import `[ { id, name, kind } ]` | 32.0 | accounts keeping their names; `wallet` an `ewallet` unless named as cash [Y18] | target | mv-08, mv-28, mv-60 |
| `ui.sweep` | month-end answers by month | 34.0 | after the opening, `pe:<occurrence of the period starting in that month>:free`: bank to Waiting, next kept, hide nothing [Y8]; earlier ones in `frozen3831`; the older `{ amt, id }` listed | open | mv-36, mv-52 (mv-q31, mv-q32, mv-q33) |
| `ui.keep, ui.keeps, ui.preSplit` | Undo copies | 38.31 | none needed: Undo is the `gone` marks now, no copy inside the saved data [D2] | none needed | mv-27 |
| `ui.cats` | categories the statement reader was taught | 32.0 | `imports.cats` | target | mv-28 |
| `ui.minAuto` | the minimum the app filled in itself | 38.31 | none needed: it only decides that `cfg.minBank` is dropped (MAKO M1) | none needed | mv-10 |
| `ui.main` | the place shown first | 25.0 | shared `ui.main` | target | mv-27 |
| `ui.loans, subP, subO, subs, cardT, cardB` | calculator inputs | 25.0 | shared `ui` | target | mv-27 |
| `ui.done, setup, cleared, src, home, sb, bd, more, win` | screen answers | 25.0 | shared `ui` | target | mv-27 |
| `ui.askNums` | screen answer | 32.0 | shared `ui` | target | mv-27 |
| `ui.limits, full, noDebts` | screen answers | 38.26 | shared `ui` | target | mv-27 |
| `ui.mcOk` | month-end top-ups already answered | 38.31 | shared `ui` | target | mv-27 |
| `ui.wk` | weeks the app was used | 25.0 | device `opens` | target | mv-27 |
| `ui.tourAt, toured, seen` | the tour, and the tabs whose coach marks were shown | 25.0 | device `tour` [Y15] | target | mv-27 |
| `ui.mute, ms, vaultSeen, imp, bk, bkLater, sampleHidden, rcCat, rcFreq, rcDom, rcDay, rcTime, gset` | look, sound, reminders | 25.0 | device `look` [Y15] | target | mv-27 |
| `ui.music, mcSeen, exactHidden, movedIn, noMove` | look | 32.0 | device `look` [Y15] | target | mv-27 |
| `ui.vol, dj, scene` | sound and look | 36.4 | device `look` [Y15] | target | mv-27 |
| `ui.onb` | the setup talk | 36.4 | device `tour` [Y15] | target | mv-27 |
| `ui.remindHidden, moreBillsHidden` | look | 38.26 | device `look` | target | mv-27 |
| `ui.hope` | the hope picked in setup | 25.0 | shared `ui`, listed (11.1: any field not listed) | target | mv-26 |
| `ui.loanMode, ui.loanTotal, ui.subsX` | pre-25.0 calculator fields every build deletes on load | 25.0 | shared `ui` when still in the raw text, listed (11.1: any field not listed) | target | mv-26 |
| `ui.<unknown>` | a newer build's screen field | 25.0 | shared `ui`, listed | target | mv-26 |

## 4. Fields with no target, and fields that need none

**No target** (nothing decided; kept in `frozen3831` and listed by the move; mv-q34): the one-month amounts `once[ym].draw`, `once[ym].envelope, education, invest, give`, `once[ym].goal:<id>` and `once[ym].debt:<id>` (38.26 on), for months on or after the opening.

**None needed**, each for the reason its row gives: a steps key of a removed line; `items[ym] = []`; `cfg.planFrom`; `plan.lines[].note` (app text); `receipts[].cn` (the category's name, carried by the line or place; a reading, mv-q29); `ui.keep, keeps, preSplit` (Undo copies, D2); `ui.minAuto`; and the fields of a newer build this move cannot know (unknown fields on the top level, in cfg and on receipts), kept in `frozen3831` and listed.

**Not fields of the copy**: the IndexedDB second copy's save time `t` is the copy's last save [Y13]; device storage beside the copy (`mhr-vault`, `money-map-theme`, `mhr-anon`, `mhr-invite`, `mhr-errlog`, `mhr-orb`, `mhr-realm`, `mhr-menu-used`) stays where it is and is read as it is, the theme being a look key [Y27, Y15]. Not counted above.

## 5. Other findings

- `scenarios/moved_records.json` and `scenarios/moved_bank_now.json` give the moved bankStart and bankNow a time of day ("typed on Sun 22 Nov at 18:00 (bankAt)"). No build saves one: bankAt and bankNowAt are `YYYY-MM-DD`, told at the end of their day [Y1]. The balances in those scenarios do not change, but their stories describe data that cannot exist.
- No build saves a receipt's time (a receipt is `id, d, a, c, cn, n, s`), so every moved receipt is told at the start of its day [J2, X9, Y1].
- The move on two devices (X1, Y12; mv-41, mv-42, mv-67): built ids make one record of each, and every moved record's `at` is its device's move moment, so the device that moves later wins any record the two copies hold differently.
- `rules/merge_ref.js` accepts every moved id, and every built id that names a moved record (`set:mv:pay:steps.a@...`, `pe:mv:pay:steps.a@...:mv:place:trip`, `rm:mv:place:trip`, `close:mv:acct:cfg:2`, `ps:mv:...`): rules mg-87 to mg-95. The reference model reads them too (scenarios/moved_ids.json).

## 6. The move's own questions in the reference

Asked once, each recorded with its answer (`asks`): the currency (O, H9; before any amount is converted); the bank figure, when the copy has none [Y19]; where each goal with money is [Y17]; the balance of each loan the move makes [Y4, Y11]; when each bill is due; which loan the "Loan or debt payment" line is, when the copy has debts (E6); when each pay comes in [Y2]; each debt's payment day [Y9]. Until a question is answered the reference writes what 11.1 says to use meanwhile: a goal's money in the bank [Z3]; no rule on a pay or bill; nothing for the loan line; and a one-month amount or month-end answer that needs the day waits in `held`.

## 7. The `mv:` kinds

Every record the move writes is `mv:<kind>:<the 38.31 id or key it came from>`, or, with no 38.31 id, `mv:<kind>:<the field path it came from>` [X1, Y28]. These kind names are the ones every reference, case and document uses [Z].

| Kind | The record | Id after the kind | Example |
|---|---|---|---|
| `acct` | an account: the bank figure's, an imported one (ui.accts), a goal's own account | `cfg`; the import's id; `plan.goals.<goal id>` | `mv:acct:cfg`, `mv:acct:gc`, `mv:acct:plan.goals.trip` |
| `card` | a 38.31 card typed on Home | the card's id | `mv:card:k1` |
| `debt` | a loan or card account: a 38.31 debt, the loan line's own loan, a pay-off goal's loan | the debt's id; `plan.lines.loan`; `plan.goals.<goal id>` | `mv:debt:car`, `mv:debt:plan.goals.owe` |
| `place` | a goal | the goal's id | `mv:place:rainy` |
| `bill` | a bill schedule | the line's id | `mv:bill:rent` |
| `line` | a budget line | the line's id | `mv:line:food` |
| `pay` | an income stream | `steps.a`, `steps.b`, `steps.side` | `mv:pay:steps.a` |
| `auto` | a self-logging schedule (plan.recurring) | its id | `mv:auto:gym` |
| `item` | a one-off schedule | `<month>:<item id>` | `mv:item:2027-04:i2` |
| `share` | a `plan.shares` entry | `steps` (from the opening), `steps.<month>` (from that month), `plan.goals` (from the move day, Y10) | `mv:share:steps.2026-12` |
| `person` | the person | `ui.name` | `mv:person:ui.name` |
| `open`, `check` | an account's opening and its check | `cfg` (the bank's opening), `cfg.bankStart`, `cfg.bankNow`; `card:<id>`, `debt:<id>`, `plan.goals.<goal id>` | `mv:open:cfg`, `mv:check:cfg.bankNow`, `mv:open:debt:car` |
| `rc` | a receipt (a `spend`, or a `repay` for bill:loan) | the receipt's id | `mv:rc:r1700000000123` |

A month-end answer is not an `mv:` record: it is the period-end record `pe:<occurrence>:free` (`pe:mv:pay:steps.a@2026-12-25:free`) [Y8, T1].

## 8. Decisions Y and Z, and their cases

| Item | What the move does | Cases |
|---|---|---|
| Y1 | a day with no time told at the end of that day (device offset), or at the copy's last save when earlier; receipts at the start of their day | mv-02, mv-04, mv-06, mv-21, mv-47, mv-69 |
| Y2 | steps a, b, side: three income streams; only a starts periods; once to `amounts` on that month's occurrence | mv-29, mv-33, mv-46 |
| Y3 | "from that month's first pay" is that month's first day; steps before the opening only in frozen3831 | mv-19, mv-30, mv-31, mv-46 |
| Y4 | the matched loan line: fixed `minRule`, payment steps, redirect at its end; empty dropped; no debt: a loan of its own, balance asked | mv-39, mv-44, mv-49, mv-50 |
| Y5 | loanLast and redirectLoan to the loan; older goal figures only for a goal id the plan lacks | mv-18, mv-44, mv-50, mv-51 |
| Y6 | a line's `ends` month to its last day | mv-13, mv-49, mv-50 |
| Y7 | bill steps to the bill's steps; bill once to that month's `amounts` | mv-30, mv-33 |
| Y8 | ui.sweep after the opening to `pe:`; bank to Waiting, next kept, hide nothing | mv-36, mv-52 |
| Y9 | debts: payment day asked, close day not sure, not in full; personal is a loan | mv-19, mv-38, mv-53 |
| Y10 | a dated goal's set-aside (38.31's evenSave) from the move day | mv-31, mv-54 |
| Y11 | a pay-off goal pays the debt of its name, else a new loan, balance asked | mv-15, mv-16, mv-55 |
| Y12 | two devices' moves merge like any records | mv-41, mv-42, mv-67 |
| Y13 | the last save: the second copy's `t`, else rev when a time, else the move's time | mv-03, mv-56, mv-57, mv-69 |
| Y14 | the note moves unchanged | mv-07, mv-08, mv-21, mv-45 |
| Y15 | look keys to `look`, tour and coach keys to `tour`, on the device | mv-27 |
| Y16 | with the sample shown, receipts, cards and a typed bank figure move; the plan does not | mv-37, mv-58 |
| Y17 | every goal with money asked; another account made with the name given, `ownAccount` | mv-15, mv-45, mv-59 |
| Y18 | the bank figure's account is the main bank; imports keep names; wallet to ewallet unless named as cash | mv-02, mv-60 |
| Y19 | no bank figure: asked at the first check-in | mv-38, mv-61 |
| Y20 | receipts: bill key, bill:loan, other | mv-07, mv-62 |
| Y21 | the move month is the calendar month the move runs in | mv-34, mv-63 |
| Y22 | bankStart and bankNow on the same day: bankNow | mv-48, mv-67 |
| Y23 | too many decimals: rounded half up, flagged | mv-24, mv-64 |
| Y24 | an item's note is its schedule's name | mv-65 |
| Y25 | lines (and pay amounts) 0 every month not moved, in the move summary | mv-29, mv-44, mv-66 |
| Y26 | the bank account is "Bank" | mv-02 |
| Y27 | device storage stays where it is | none possible (not in the copy) |
| Y28 | no 38.31 id: `mv:<kind>:<field path>`; the merge accepts `mv:` ids | mv-67; rules mg-87 to mg-95 |
| Z3 | goal money in the bank until answered; short shown, never refused | mv-15; goal_money_unanswered gmu-01 to gmu-04 |
| Z5 | once with no period starting in the month: the period holding its first day | rules units-81 |
| Z6 | a pay-off goal's saved so far: the loan's `paidBefore` | mv-15, mv-55 |
| Z (kinds) | the kind names of section 7 everywhere | mg-79, mg-81, mg-84, mg-85 |

## 9. What Y and Z leave open

The 13 questions in `rules/move.json` `open` (no case depends on one; the reference does the least it can): mv-q29 a receipt's `s` that names no account, now the note moves unchanged; mv-q30 an item's label when its note is the name; mv-q31 the older month-end answer `{ amt, id }`; mv-q32 pay that is not monthly on one day (which occurrence and period, and each pay's amount from a monthly total); mv-q33 what waits until a pay or bill day is answered; mv-q34 one-month amounts of draw, the shares, goals and debts; mv-q35 a bill:loan receipt with no loan; mv-q36 a loan line's own `ends` against cfg.loanLast; mv-q37 a stale sample goal figure bringing back a removed goal; mv-q38 a second copy older than the stored one; mv-q39 a goal with no date and no monthly; mv-q40 the rate and minimum of the loans the move makes; mv-q41 the type of a goal's "another account".

Readings taken (to confirm): the field paths of section 7; Y25 applied to pay amounts; Y20 applied to a self-logged spend's category; `seen` as the coach-mark key (Y15); "named as cash" as a name holding the word cash (Y18); close day and in full on cards only (Y9); the move's period-end record written `k: 'periodEnd'`, Waiting the place `waiting` (Y8).

## 10. The hand re-check of the 45 cases (Y: "re-worked by hand by the next reviewer")

Each of mv-01 to mv-45 was worked again by hand from this file, SCHEMA_V3 11.1 and the decisions, Y and Z included, without the reference's output; the hand answers are now the cases' expected outputs, and the reference was then changed until it gave them (all 69 cases passed on its first run after the change).

- **The same as before** (18): mv-01, mv-09, mv-10, mv-11, mv-13 (now also showing `ends`, 31 Mar 2027), mv-14, mv-17, mv-18, mv-22, mv-23, mv-26, mv-28, mv-32, mv-34, mv-35, mv-36, mv-37, mv-43. mv-41's `rev` was checked by hand: 20,781 days x 86,400,000 + 3,600,000 + 1 = 1,795,482,000,001.
- **Different because Y or Z changed the rule** (25; the old answer followed the reference's reading of an open question, the hand answer follows Y and Z): ids by field path and the move helper's kinds (Y28, Z) in mv-02 to mv-06, mv-12, mv-25, mv-27, mv-30, mv-31, mv-41, mv-42, mv-45; `told` of a dated figure at the end of its day (Y1) in mv-02, mv-04, mv-06, mv-21; the note unchanged and `other` to Free to spend (Y14, Y20) in mv-07, mv-08, mv-21, mv-24, mv-41, mv-42, mv-45; mv-12, mv-30, mv-31 step dates from the month's first day (Y3) and the dated goal's 8,575 (Y10); mv-15, mv-16 the pay-off goal's loan and `paidBefore` (Y11, Z6); mv-19 the debts' payment day, card close day and in full (Y9); mv-20 the gym's `other` (Y20, a reading); mv-27 `seen` to `tour` (Y15); mv-29 the pay streams (Y2, Y25); mv-33 the pay and bill once amounts and the budget once keyed by occurrence (Y2, Y7); mv-38 the bank figure and debt day questions (Y19, Y9); mv-44 the empty loan and card lines not moved, so no loan question (Y4, Y25).
- **Different where the old expected output was wrong under the rules it was written against** (2): mv-39 and mv-40 did not record the answered loan question in `asks`, though section 6 (then and now) says every question is recorded with its answer, and the currency question was. The hand answer is right; the cases now record `{ q: 'loanLine', answer: 'car' }` and `{ q: 'loanLine', answer: 'drop' }`.
