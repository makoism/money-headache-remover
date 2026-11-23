# Every saved field of every old build, and where the move puts it (23 Nov 2026)

Mako's money is in copies saved by older builds: 38.28 is live, 38.31 is the latest, and E1 asks for the 25.0 to 38.28 builds too. SCHEMA_V3 11.1 lists the 38.31 fields and their targets. This file lists the fields of every build that could be found, from each build's own load and clean-up code, with the target of each in SCHEMA_V3 11.1, and says where there is none. The cases are in `rules/move.json` (45 cases, run by `node rules/run_rules.js move`), the reference is `rules/move_ref.js`, and the open questions (mv-q1 to mv-q28) are in `rules/move.json` under `open`. Every amount in the cases is made up.

## 1. The builds found

All builds save to the same localStorage key, `money-map-template-v2`, and keep a second copy in IndexedDB `money-map-safe` (record `{ rev, t, json }`, `t` the moment of the save). No build writes a save time into the copy itself (open question mv-q13).

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

A row of the table can name several fields (`cfg.moveTarget, moveStart, ...`); these counts count each one. "No target" is a field 11.1 gives no place (kept in `frozen3831` or on the shared ui and listed, as 11.1's last rows say); "open" is a field with a target whose detail the decisions do not settle.

| Builds | Fields | No target | Open |
|---|---|---|---|
| 25.0 to 31.0 | 114 | 22 | 16 |
| 32.0, 33.1 | 123 | 22 | 16 |
| 34.0, 35.1 | 125 | 22 | 17 |
| 36.4 to 38.22 | 129 | 22 | 17 |
| 38.26, 38.28 | 151 | 23 | 24 |
| 38.31 | 171 | 26 | 26 |

## 3. Every field, its target and its case

"First build" is the first build found that saves it; every later build saves it too. Keys of steps and once are by what they name: the bill keys are bill:rent, bill:util, bill:net, bill:phone, bill:ins and bill:subs; the budget keys bill:food, bill:gas, card and `line:<id>`; the share keys envelope (Free to spend), education, invest and give.

| Saved field | Meaning | First build | Target (SCHEMA_V3 11.1) | Status | Case |
|---|---|---|---|---|---|
| `v` | shape version, always 1 | 25.0 | replaced by `v: 3` | target | mv-01 |
| `rev` | revision count, +1 per save | 25.0 | replaced by `rev` (max(now, rev + 1)) and `at`; the old value only in `frozen3831` | target | mv-01, mv-41 |
| `steps.a, steps.b, steps.side` | pay by month: salary, second income, side income (`[ { from: ym, v } ]`) | 25.0 | none in 11.1 (no row names pay amounts); the move only asks when each pay comes in | no target | mv-29 |
| `steps.<bill key> (bill:rent, util, net, phone, ins, subs)` | a bill's monthly amount from a month on | 25.0 | the bill schedule's `steps` (11.1 plan.lines row: `def` is the first step); the steps row itself names only shares and budgets | open | mv-30 |
| `steps.<budget key> (bill:food, bill:gas, card, line:<id>)` | a budget line's monthly amount from a month on | 25.0 | `plan.budgets[].steps`, from that month's first pay | target | mv-30 |
| `steps.envelope, education, invest, give` | Free to spend, Courses and books, Investing, Giving by month | 25.0 | `plan.shares` entries (`free`, `edu`, `ffa`, `give`), from that month's first pay | target | mv-30, mv-45 |
| `steps.goal:<id>` | a goal's monthly set-aside from a month on | 25.0 | `plan.shares[].goals[<place>]`, from that month's first pay | target | mv-31 |
| `steps.bill:loan` | the "Loan or debt payment" line by month | 25.0 | matched to the loan account [E6]; which of its fields the amount becomes is not said | open | mv-39 |
| `steps.debt:<id>` | extra paid on a card or loan from a month on | 38.26 | `extraSteps` on that loan or card | target | mv-19 |
| `steps.<key with no line, goal or debt>` | left behind by a removed line in an older build | 25.0 | none: kept in `frozen3831`, listed | no target | mv-32 |
| `once[ym].<budget key>` | one month's amount for a budget line | 25.0 | `plan.budgets[].once`, the first period starting in that month [X watch] | target | mv-33 |
| `once[ym].a, b, side` | one month's pay, or extra money added to it | 25.0 | none | no target | mv-33 |
| `once[ym].draw` | money taken out of the Emergency fund that month | 25.0 | none | no target | mv-33 |
| `once[ym].envelope, education, invest, give` | one month's share, or extra money placed there | 25.0 | none (`plan.shares` has no one-period amount) | no target | mv-33 |
| `once[ym].goal:<id>` | one month's goal set-aside, or extra money put in the goal | 25.0 | none | no target | mv-33 |
| `once[ym].debt:<id>` | extra money put on a debt that month | 38.26 | none | no target | mv-33 |
| `once[ym].<bill key>` | one month's bill amount | 25.0 | none (would be the schedule's `amounts`, keyed by a due date the move does not know yet) | no target | mv-33 |
| `items[ym][].id, label, amount` | a one-time cost in a month | 25.0 | a `once` schedule dated the month's first day; in the opening month the first day after the opening [H9] | target | mv-34 |
| `items[ym][].note` | the one-time cost's note | 25.0 | none named (the reference keeps it on the schedule as `note`, section 0: unknown fields kept) | open | none (mv-q24) |
| `items[ym] = []` | "no one-time costs this month" (touched and emptied) | 25.0 | nothing to move; only in `frozen3831` | no target | mv-34 |
| `cfg.bankStart` | the bank at the start of the first month, or as typed in setup | 25.0 | a dated bank `check`; the oldest figure opens the bank | target | mv-02, mv-03 |
| `cfg.bankAt` | the day bankStart was typed (a day, no time) | 38.31 | the check's date; "told at bankAt" (bankAt holds no time) | open | mv-02 |
| `cfg.bankNow` | the bank as typed on Home | 38.31 | a dated bank `check` | target | mv-04, mv-05 |
| `cfg.bankNowAt` | the day bankNow was typed (a day, no time) | 38.31 | the check's date; told as bankAt | open | mv-04, mv-06 |
| `cfg.minBank` | the lowest balance to keep | 25.0 | `home.minBank`, only when typed | target | mv-09 |
| `cfg.ceiling` | most to spend in a month | 25.0 | `plan.limits.ceiling` | target | mv-11 |
| `cfg.aims` | the split chosen in setup, shares of pay per jar | 25.0 | `plan.limits.aims` | target | mv-11 |
| `cfg.planFrom` | the month the plan starts | 38.31 | not needed; `frozen3831` only | target | mv-11 |
| `cfg.loanLast, cfg.redirectLoan` | older copies: the loan line's last month and whether its money then goes to the Emergency fund | 25.0 | the loan account's `ends` and the schedule `redirect`; read only when the copy has no plan (as every build does) | open | mv-44 |
| `cfg.moveMonth, cfg.carDue` | older copies: the move goal's month and the yearly cost's date | 25.0 | the goal's `due` | target | mv-18 |
| `cfg.moveTarget, moveStart, travelTarget, travelStart, carTarget, carStart, rainyStart, rainyTarget, rainyStretch` | older copies: the four sample goals' figures | 25.0 | the matching place's `target` and `stretch`; a start is part of the bank's opening split; read only when the copy has no plan | open | mv-18 |
| `cfg.<unknown>` | a newer build's setting | 38.31 | `frozen3831`, listed | no target | mv-26 |
| `plan.lines[].id, key, jar, name` | a line: its id, the key its amounts use, its jar, its name | 25.0 | rent, util, net, phone, ins, subs: bill schedules; loan: matched to a loan [E6]; food, gas, card and custom lines: `plan.budgets` (place from the jar); spend, learn, invest, give: `plan.shares` | target | mv-12 |
| `plan.lines[].def` | the line's usual monthly amount | 25.0 | the first step | target | mv-12 |
| `plan.lines[].note` | the built-in line's help text (app text, reset on every load) | 25.0 | none needed (app text, not the person's) | no target | mv-12 |
| `plan.lines[].ends` | the last month of the line (a month, not a day) | 25.0 | `ends` "as named" (a schedule `ends` is a day) | open | mv-13 (left out) |
| `plan.lines[].redirect` | after `ends`, the line's money goes to the Emergency fund | 25.0 | `redirect: <place id>` | target | mv-13 |
| `plan.goals[].id, name, target, due, slot` | a goal | 25.0 | `places` | target | mv-14 |
| `plan.goals[].start` | saved so far | 25.0 | part of the bank's opening split into that place; the move asks where the money is [X watch] | target | mv-15, mv-45 |
| `plan.goals[].monthly` | fixed monthly set-aside for a goal with no date | 25.0 | `plan.shares[].goals` | target | mv-31 |
| `plan.goals[].why` | a line on why the goal matters | 34.0 | kept on the place | target | mv-14 |
| `plan.goals[].emergency, stretch` | the Emergency fund and its longer target | 25.0 | `places` kind emergency, `stretch` | target | mv-17 |
| `plan.goals[].stretchOn, stretchFrom` | yes to the longer target, and from which month | 38.31 | `stretchOn`, `stretchFrom` on the place | target | mv-17 |
| `plan.goals[].<unknown plain>` | a newer build's goal field | 38.31 | kept on the place | target | mv-14 |
| `plan.debts[].id, name, kind, balance, apr, min, extra` | a card or loan with interest | 38.26 | a `loan` or `card` account opened at `balance`, `apr`, `minRule: { fixed: min }`, `extraSteps` from `extra`; kind `personal` has no type named | open | mv-19 |
| `plan.recurring[].id, a, c, n, every, on, from, last` | spending that logs itself, weekly on a weekday or monthly on a day | 38.26 | `schedules` kind autoSpend; weekly `on` becomes the rule [H9]; `last` the last day already logged | target | mv-20 |
| `receipts[].id, d, a, c, cn, n` | a logged spend | 25.0 | `spend` events; `told` the start of its day [J2] | target | mv-07 |
| `receipts[].s` | the account it came from, as named | 32.0 | `acct` when it names an account, else kept in `note` | target | mv-08, mv-21 |
| `receipts[].<unknown plain>` | a newer build's receipt field | 38.31 | `frozen3831` only, listed | no target | mv-26 |
| `receipts beyond 5,000` | receipts every build's clean-up drops (it keeps the first 5,000) | 25.0 | moved from the raw text [O] | target | mv-35 |
| `cards[].id, name, owed, payDay, at` | pay-in-full cards typed on Home | 38.31 | `card` accounts, `cutDay: null`, `inFull: true`, opened with a check of `owed` dated `at` | target | mv-21 |
| `<unknown top-level field>` | a newer build's field | 38.31 | `frozen3831`, listed | no target | mv-26 |
| `ui.cur, ui.preset` | currency symbol; which sample was loaded | 25.0 | the first `home.curs` entry, asked when ambiguous | target | mv-22 to mv-25 |
| `ui.name` | the person's name | 25.0 | `people[0].name` | target | mv-27 |
| `ui.gk` | goal kinds by goal id | 25.0 | the place's `kind`; a pay-off goal gets `pays` | open | mv-14, mv-16 |
| `ui.accts` | accounts named by a statement import `[ { id, name, kind } ]` | 32.0 | accounts (names and types) | target | mv-08, mv-28 |
| `ui.sweep` | month-end answers by month | 34.0 | `pe:` records after the opening; earlier ones in `frozen3831` | open | mv-36 |
| `ui.keep, ui.keeps, ui.preSplit` | Undo copies | 38.31 | not moved [D2] | target | mv-27 |
| `ui.cats` | categories the statement reader was taught | 32.0 | `imports.cats` | target | mv-28 |
| `ui.minAuto` | the minimum the app filled in itself | 38.31 | decides that `cfg.minBank` is dropped (MAKO M1) | target | mv-10 |
| `ui.main` | the place shown first | 25.0 | shared `ui.main` | target | mv-27 |
| `ui.loans, subP, subO, subs, cardT, cardB` | calculator inputs | 25.0 | shared `ui` | target | mv-27 |
| `ui.done, setup, cleared, src, home, sb, bd, more, win` | screen answers | 25.0 | shared `ui` | target | mv-27 |
| `ui.askNums` | screen answer | 32.0 | shared `ui` | target | mv-27 |
| `ui.limits, full, noDebts` | screen answers | 38.26 | shared `ui` | target | mv-27 |
| `ui.mcOk` | month-end top-ups already answered | 38.31 | shared `ui` | target | mv-27 |
| `ui.wk` | weeks the app was used | 25.0 | device `opens` | target | mv-27 |
| `ui.mute, tourAt, toured, seen, ms, vaultSeen, imp, bk, bkLater, sampleHidden, rcCat, rcFreq, rcDom, rcDay, rcTime, gset` | look, sound, tour, reminders | 25.0 | device `look` and `tour` | target | mv-27 |
| `ui.music, mcSeen, exactHidden, movedIn, noMove` | look and tour | 32.0 | device `look` and `tour` | target | mv-27 |
| `ui.vol, dj, scene, onb` | look, sound and the setup talk | 36.4 | device `look` and `tour` | target | mv-27 |
| `ui.remindHidden, moreBillsHidden` | look | 38.26 | device `look` | target | mv-27 |
| `ui.hope` | the hope picked in setup | 25.0 | no row: kept on shared `ui` ("any field not listed"), listed | no target | mv-26 |
| `ui.loanMode, ui.loanTotal, ui.subsX` | pre-25.0 calculator fields every build deletes on load | 25.0 | no row: kept on shared `ui` when still in the raw text, listed | no target | mv-26 |
| `ui.<unknown>` | a newer build's screen field | 25.0 | shared `ui`, listed | no target | mv-26 |

## 4. Fields with no target (findings)

1. **The pay amounts**: steps a, b and side (salary, second income, side income by month). No row of 11.1 places them; the move only asks when each pay comes in (mv-q2). This is the biggest gap: without it the moved copy has no income amounts.
2. **One-month amounts other than a budget line's**: once[ym] a, b, side (one month's pay or extra money), draw (out of the Emergency fund), envelope, education, invest and give (one month's share), goal:<id>, debt:<id> (38.26 on), and a bill's once (mv-q7).
3. **steps keys of removed lines** (a step left behind by an older build).
4. **plan.lines[].note**: app text, reset on every load; nothing to move.
5. **items[ym] = []** ("no one-time costs this month"): nothing to move.
6. **ui.hope** (picked in setup): no row; kept on the shared ui and listed.
7. **ui.loanMode, ui.loanTotal, ui.subsX**: pre-25.0 calculator fields every build deletes on load; a raw text may still hold them. Kept on the shared ui and listed.
8. **Unknown fields** that 38.31 keeps: on the top level, in cfg, on receipts (all kept in `frozen3831` and listed) and in ui (kept on the shared ui and listed).
9. **The second copy's save time** (IndexedDB `t`): the only place a save time lives, which I5, J2, K3 and H9 need; 11.1 does not name it (mv-q13).
10. **Device storage beside the copy**: `mhr-vault` (cloud code), `money-map-theme`, `mhr-anon`, `mhr-invite`, `mhr-errlog`, `mhr-orb`, `mhr-realm`, `mhr-menu-used` (mv-q27). Not fields of the copy, so not counted above.

Fields with a target whose detail is open: bankAt, bankNowAt and cards[].at are days, not times, though 11.1 says "told at bankAt" (mv-q1); bill steps (mv-q7); the E6 loan line's amount, steps and redirect (mv-q4); loanLast, redirectLoan and the older goal figures when the copy has a plan (mv-q5); line `ends` as a month (mv-q6); ui.sweep after the opening needs the pay occurrence (mv-q8); plan.debts pay day, close day, in full and kind `personal` (mv-q9); a dated goal's monthly amount, never saved (mv-q10); a pay-off goal's `pays` (mv-q11); items[].note (mv-q24); ui.gk "debt" (mv-q11).

## 5. Other findings

- `scenarios/moved_records.json` and `scenarios/moved_bank_now.json` give the moved bankStart and bankNow a time of day ("typed on Sun 22 Nov at 18:00 (bankAt)"). No build saves one: bankAt and bankNowAt are `YYYY-MM-DD`. The balances in those scenarios do not change under either reading of mv-q1, but their stories describe data that cannot exist.
- No build saves a receipt's time (a receipt is `id, d, a, c, cn, n, s`), so I5's "the record's own time if it has one" never applies to a moved receipt: every one is told at the start of its day [J2, X9].
- The move on two devices (X1, mv-41 and mv-42): built ids make one record of each, but every moved record's `at` is its device's move moment, so the device that moves later wins any record the two copies hold differently, including the bank figures (mv-q12).
- `rules/merge_ref.js` `idOk` does not yet accept `mv:` ids (the merge area's code; not changed here, mv-q28).
- 11.1 says nothing about the moved accounts' names (mv-q26) or the main bank when a statement import named several (mv-q18).

## 6. The move's own questions in the reference

Asked once, each recorded with its answer: the currency (O, H9; before any amount is converted), when each pay with an amount comes in, when each bill is due, which loan the "Loan or debt payment" line is (E6), and where each goal's saved money is (X watch). Until a question is answered the reference writes what 11.1 says to use meanwhile, or nothing (the loan line).
