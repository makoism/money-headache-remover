(Foundation review 23 Nov 2026, pre-mortem. Read-only review by a helper; copied from its reply.)

I wrote nothing in the repo or in /tmp/premortem. Everything below comes from wip-38.31 and the side branches, all read only.

# Pre-mortem: The Burrow, six months after launch

## The most likely ways it fails

**1. "Safe to spend" is a confident number on the wrong window, and someone overspends because of it.**
- Root cause: the month is fixed as the calendar month everywhere, and there is no pay day field a person can reach.
  - `PAYDAY = 15` is a hard-coded constant (model.js:3), used only by `readyBy` (model.js:152).
  - Receipts are grouped by `r.d.slice(0,7)` (model.js:574, 870).
  - `viewOf` takes days in the calendar month and today's date number (model.js:657).
  - `weekOf` does the same (ui0.js:61).
  - Plan values are keyed by calendar month: `steps[].from`, `once[ym]`, `items[ym]`, `ui.sweep[ym]`, `ui.mcOk[ym]`.
  - The month-end question also fires at the calendar month end.
- Likelihood: near certain for Mako (paid on the 10th) and for anyone paid on the 15th and 30th. Cost: high. This breaks the north star promise and teaches people to distrust the app.
- Fix now: add one function, `periodOf(date)`, in model.js. Route every grouping through it. Read pay days from one saved field. With no pay day set it gives the calendar month, so the golden files stay identical. About 1 to 2 days plus tests (PAYDAY_DESIGN option 3A).

**2. The app quietly stops working, and loses data, on 1 Nov 2028.**
- Root cause: `START='2026-11'` and `END='2028-10'` are fixed (model.js:3).
  - `todayStr` clamps today to `END-01` (ui0.js:79-82), so after Oct 2028 the app thinks every day is 1 Oct 2028.
  - On load, three fields are silently dropped when outside `MONTHS`: goal due dates (`validDue`, model.js:269), loan end months (`l.ends`, model.js:1069), and `planFrom` and `loanLast` (model.js:1024-1025).
  - LANE_e6 fixes 6 and 7 are parked "after v1".
- Likelihood: certain within two years. A goal date or loan end typed beyond 2028 is already lost today. Cost: high, because this is lost data.
- Fix now: make `MONTHS` a window around today, and keep every date as typed even when it falls outside the window. About 1 day; most of the work is already in LANE_e6.

**3. Two engines disagree and people stop believing either.**
- Root cause: the plan is planned figures projected forward from `cfg.bankStart` (model.js:318, 381). `bankNow` is typed separately and on purpose changes nothing (model.js:16-19).
  - Three QC agents in round 10, and the north-star gate in rounds 7, 13 and 14, flagged "two money-today figures" (MAKO_RUN 1.1). Each time it was parked for Mako.
  - The ledger lane (side/ledger-wiring) then adds a third truth, the dated events, beside the plan, and keeps Home looking the same.
- Likelihood: high. Cost: medium to high.
- Fix now: decide in writing that the ledger is the one source of balances and the plan only says what money is for. Until B1 lands, Home shows one "now" figure. This is a decision, not code.

**4. The cloud copy across phone and desktop loses entries once the ledger exists.**
- Root cause: the whole copy is one blob that the newest `rev` wins.
  - Ledger event ids come from a counter (`ledgerNext`, LEDGER_WIRING.md:140, "ids are a counter"). Two devices that each add events will produce the same ids.
  - The `src` duplicate check and Undo both work by id.
- Likelihood: medium to high, since Mako uses both phone and desktop. Cost: high.
- Fix now: make event ids unique per device (a random part plus the counter) before the first ledger event is ever saved. About an hour. Changing it later means renumbering saved data.

**5. A newer saved copy gets damaged by an older page.**
- Root cause: `v:1` is written (model.js:118) but never checked or kept by `normalize`.
  - E5 and E8 both need "a version older pages refuse".
  - The ledger lane's guard (`lsMayTake`) is not wired into any of the seven doors: storage event, cloud, backup, link, mirror.
- Likelihood: medium once B1 ships. Cost: high.
- Fix now: ship the refusal for unknown future versions in 38.31, before any newer copy exists. About half a day. LEDGER_WIRING step 3 is written already.

**6. Statement import drops or doubles lines.**
- Root causes:
  - `cleanReceipts` keeps only the first 5,000 entries (model.js:1125). Years of GCash history exceed that. This is E14, still at the team gate.
  - Receipts only allow `a > 0`, so refunds, income and transfers have nowhere to go.
  - The account is free text in `s`, not an account id.
  - stmt.js merges two equal same-day charges into one (STATEMENTS_DESIGN item 5).
- Likelihood: high for the team test. Cost: medium.
- Fix now: remove the cap. Store a line id from the statement (`src`/`lid`) on each receipt. About half a day.

**7. People with a second currency, or a "$" currency, get wrong rounding or a relabelled total.**
- Root cause: the currency is a display symbol in `S.ui.cur`, not data.
  - Rounding is decided by `cur === '¥'` (model.js:22, 586).
  - A copy with no currency is forced to '₱' (ui0.js:89).
  - `setCurrency` simply relabels every amount (actions.js:167).
  - "$" cannot be mapped to an ISO code with certainty, which the ledger needs per account.
- Likelihood: medium. Cost: medium.
- Fix now: save `cfg.curCode` (ISO, asked once), and lock it once real data exists (A9). About half a day.

**8. People drift away.** The likely cause is product, not code: no weekly check-in or pay day moment (B1 to B4 are all at the team gate) and copy fatigue. Likelihood: medium. It is outside the foundation, but the pay day period in point 1 is what the pay day moment hangs on.

## Saved-data spots where a planned feature needs a migration that could lose data

1. **Calendar-month keys** (`steps.from`, `once[ym]`, `items[ym]`, `ui.sweep[ym]`, `ui.mcOk[ym]`, receipt grouping). Pay periods reinterpret every one of them. Month-end answers and one-off costs would land in the wrong period.
2. **Where the pay day is saved: two designs disagree.** PAYDAY_DESIGN uses `cfg.payDays` (an array). ledger.js uses `ui.payDays`. In 38.31, an unknown `cfg` field survives only if it is a string, number or boolean (ui0.js:159, 261), so an array `cfg.payDays` is dropped by any older page. PAYDAY_DESIGN says "cleanCfg keeps unknown settings untouched", which is wrong for arrays.
3. **Debts.** `cleanDebts` rounds the balance, minimum and extra payment to whole amounts on load (`whole`, model.js:1093). Cents are lost on every load. This contradicts decision 1, and the ledger move reads these figures. There is also no `payDay` or date on a debt (LEDGER_WIRING:34).
4. **Dates outside `MONTHS`.** Goal `due`, loan `ends`, `planFrom` and `loanLast` are dropped on load (point 2 above).
5. **Receipts.** The 5,000 cap; no direction; no account id; on goals and receipts, unknown fields survive only if plain, and only 12 of them (model.js:1082, 1133). Anything nested, such as a `src` object, is lost when an older page saves.
6. **Monthly repeats on the 29th, 30th or 31st** are refused and dropped on load (model.js:1111).
7. **Currency** as a symbol (point 7 above).
8. **No version stamp is kept**, so an older page has nothing to stop it overwriting a newer copy (point 5 above).
9. **The move to the ledger** still has four open gaps (LEDGER_WIRING "Fails before"): a debt goal arrives as savings, the sample's emergency fund is moved as if typed, a debt loses its id, and the frozen copy gets a key it never had.

## Planned features whose design conflicts with the current engine

- **Ledger (B1).** Its months run pay day to pay day (`periodOf`) and it stores no balances, only events. The engine uses calendar months and projects from `bankStart`. Running the two side by side gives two months and two balances.
- **Pay day (Q6, A6, C3, C4).** Not possible in the engine at all today.
- **Money door.** Needs money in, transfers, owed amounts and "Waiting". The 38.31 receipts are spending only. It also deliberately differs from the ledger on "Lent" (MONEY_DOOR choice 3), so one of the two must change.
- **Statements (PH).** Depends on the E6 fix and on B1's `phEvents`. Its line id has no field to live in today.
- **Several accounts (PH presets).** Need `acct` and `cur` per account; 38.31 has one bank and free-text `s`. Card cut-off days are not in any design (PH_ACCOUNTS open point 1).
- **Cloud copy.** Whole-blob, newest-wins saving conflicts with counter ids on events (point 4 above).
- **Second currency.** Conflicts with the one display symbol.
- **3D world.** No conflict, as long as it calls `ACT` only and the version check (E8) exists.

## What let the calendar-month problem through

The requirement was written down early and more than once:
- DECISIONS.md:169 (19 Nov): "The month should follow his pay day (the 10th), not the calendar."
- LEDGER_DESIGN: "A month runs from one pay day to the next."
- QC found it the same day (LAUNCH_CHECKLIST Q6).

Then the sequencing buried it:
1. **It was put in the wrong gate.** A6 was set to "team", not "v1", even though v1 is defined as fitting Mako's own shape.
2. **It was treated as his call.** Q6 was labelled "feature gap, waits for Mako". The 20 Nov 05:50 rule ("experience calls wait for his full run") then parked it with layout and wording questions, when it is a correctness fact about his money.
3. **The work queue was driven by findings on the current build.** QC rounds 4 to 15 judged the build against its own rules and internal consistency, so each round produced polish on a calendar engine. Nobody re-checked the build against Mako's stated shape.
4. **The fix lived on side branches.** Designs on side/payday-design and side/ledger-design are not in the main session's reading list (RESUME section 2), so the main line never absorbed them.

The same pattern is live today with the "two money-today figures" (point 3 above) and the cloud ids (point 4 above).

**One standing check that would have caught it:** add a test on Mako's own shape (made-up amounts) to `check.sh` that steps through every day of three months. Profile: pay on the 10th, cards paid on the 10th and 11th. For each day, it checks that:
- the days left run to the next pay day,
- Free to spend for the week equals what is left divided by the weeks until the 10th,
- receipts from the 1st to the 9th count against the previous pay,
- "bank after the cards are paid" matches the typed figures.

It fails today, which is the point. The general rule behind it: every fact Mako states about his own money becomes a failing test the same day, and no build counts as a v1 candidate while one of them is red.
