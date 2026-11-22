# The saved shape (step 1 of the new foundation, 23 Nov 2026)

Every field version one and stage 2 need, written out before any engine code, so stage 2 needs no data move. Built on the ledger design (origin/side/ledger-wiring, LEDGER_DESIGN.md: accounts, places, events, the one rule, the move of a 38.31 copy), plus what the foundation reviews found missing (foundation_review/*.md, plan_review_1.md F1 to F5). Mako's answers: DECISIONS.md, 23 Nov. All examples are made up.

## 0. Rules for every record
- **Ids** are strings: a device part (6 random letters, made once per device and kept with the device, never in the saved copy) plus a counter, for example `k7qzpa-41`. Never renumbered on load. Two devices can never make the same id.
- **Dates** are `YYYY-MM-DD` in the person's local calendar. Times only where needed (`at`, ISO with offset).
- **Amounts** are whole minor units (integers): yen 1 = 1, peso 1.00 = 100. The currency table says how many decimals each code has. No amount is rounded on load.
- **Currency** is an ISO code (`JPY`, `PHP`, `USD`, `EUR`, `GBP`, `CHF`) on every account, income stream, bill and goal. The home currency is `home.cur`. "$" is asked, never guessed.
- **Nothing is deleted.** Undo and "remove" set `gone: '<date>'` (and `goneBy` the undo step id). Redo clears it. Every record has `at` (when last changed, ISO) so two devices' copies can be merged later.
- **Nothing is dropped for being out of range.** No fixed window. A date years back or ahead is kept as typed.
- **Unknown fields are kept** on load and save, including arrays and objects, so an older page never strips a newer field.

## 1. The copy
```
{ v: 2,                      // shape version; a page that knows only v < this refuses to write ("update the app")
  rev, at,                   // as today: revision and when saved
  home: { cur: 'JPY', country: 'JP', minBank: null },   // country picks the holiday table
  people: [ { id, name } ],  // one person by default; a couple adds a second (stage 2 screens, field now)
  accounts: [...], schedules: [...], events: [...], goals: [...], plan: {...},
  ui: { ... },               // as today (look, tour, keep, sweep answers move into events)
  clock: { lastSeen: '2026-11-23' },   // a phone date that jumps back, or more than 40 days ahead, asks before anything is written
  frozen3831: <the 38.31 copy as it was, never written again> }
```
Saved under a new storage key, as LEDGER_DESIGN "Storage" says, with `ledgerMayWrite` asked by every writer (local save, other tab, backup restore, link, cloud).

## 2. Accounts
`{ id, name, type, cur, owner, open: {...}, minBank, gone, at }` plus by type:
- `type`: bank, cash, ewallet, wallet, card, paylater, loan, owedToYou.
- `owner`: a `people` id, or null for shared.
- `minBank`: per account (default null; `home.minBank` used when null).
- **card**: `inFull` (true unless it carries an older balance), `cutDay` (1 to 31, or null for "not sure": then everything on the card is due on the next payment day, the safe side), `payDay` (1 to 31), `shift` (weekend and holiday rule; default "after" in JP), `payFrom` (the account that pays it). The card owns its payment day: there is no separate cardPay schedule (section 10.8).
- **card, stage 2 fields now**: `apr` (yearly %, null when paid in full), `minRule` ({ pct, floor } or { fixed }), `of` (for an older balance or an instalment plan: the card's id).
- **loan, paylater**: `payDay`, `apr`, `minRule`, `ends` (date or null), `of`.

**Opening (section 10.1 decides the details).** Every account opens with an `open` event (money and its place) plus a `check` on the same day, never a bare number. A card opens with two: `{ k: 'check', acct, date, typedA: <what is on it now> }` and `{ k: 'check', acct, date, stmt: true, typedA: <last statement balance>, stmtDate }` when the person knows it. With only "now", everything on it counts as due on the next payment day.

## 3. Schedules (one type for pay, bills, card payments, instalments, yearly costs)
```
{ id, kind: 'income'|'bill'|'instalment'|'yearly'|'transfer'|'autoSpend',
  name, acct, acct2,         // the account it lands in or comes from; acct2 for a transfer (which account pays)
  owner, cur,
  rule: { every: 'month', days: [10] }            // day(s) of the month; 31 means the last day
      | { every: 'weeks', n: 2, from: '2026-11-13' }   // every N weeks from a date (weekly: n 1)
      | { every: 'months', n: 3, day: 5, from: '2026-12-05' }   // every N months
      | { every: 'monthsList', months: [6, 11], day: 15 }       // set months (tuition)
      | { every: 'year', date: '05-31' }
      | { every: 'lastWorkday' }
      | { every: 'none' },                         // no fixed day (freelance): counts no future money
  shift: 'before'|'after'|'none',    // weekend or holiday: move to the working day before or after
  amount: <minor units>,             // the usual amount
  amounts: { '2027-06-10': 260000 }, // one occurrence changed, keyed by its due date
  startsPeriod: true,                // income only: a pay that starts a new period (a second income on the same day: false)
  place: 'bills'|'free'|<goal id>,   // bills and yearly costs: the place they come from
  from: '2026-11-23', ends: null,    // first and last occurrence (instalments: ends after N)
  gone, at }
```
- **Occurrence id** = `<schedule id>@<due date after shift>`, for example `pay1@2027-01-08`.
- **Holiday tables** per country (JP, PH, US, GB, EU countries, CH) are a data file shipped with the page, by year; a missing year falls back to weekends only and says so.

## 4. Events (one list; what really happened)
LEDGER_DESIGN's kinds and fields stay: `id, k, sub, date, a, a2, acct, acct2, place, place2, typedA, startsPeriod, src, note`. Added:
- `settles`: the occurrence id it settles (`pay1@2027-01-08`, `rent@2026-12-01`), or a list for one payment covering two. A pay that lands on the 8th settles the occurrence moved to the 8th; one that lands on a different day than expected still settles it (the person confirms, or the import matches by amount within 3 days).
- `skip`: on a `k: 'skip'` event, the occurrence that did not happen this time (no pay this month, a bill waived).
- `posted`: the posting date from a statement, beside `date` (the buy date). A card's cut-off uses `posted` when there is one.
- `stmt`, `stmtDate`: on a card check, this is the statement balance (section 2).
- `avail`: on a bank check, 'available' or 'current' as the person picked.
- `owner`: taken from the account; kept on the event only when different (a couple paying from a shared account).
- `gone`, `goneBy`, `at`: as section 0.
**Receipts are spend events.** One list, never two. A 38.31 receipt moves in as `{ k: 'spend', date: r.d, a, acct: <the bank, or the card the person picks once>, place: <its old jar>, src: { from: 'receipt', id: r.id }, note: r.n }`.

## 5. Goals
`{ id, name, kind, target, due, cur, owner, keptIn: { acct, mode: 'inBank'|'ownAccount' }, emergency, stretch, stretchOn, stretchFrom, monthly, gone, at }`
- `keptIn.mode 'inBank'` (the default, Mako 23 Nov): the money stays in that bank account and is set aside as a place. `'ownAccount'`: the goal's place is backed by its own account.
- Money goes in by `place`/`move` events into the goal's place; its balance is added up from events, never typed (a typed "saved so far" becomes a dated `open` into the place).

## 6. The plan (what is expected)
- **Pay and bills are schedules** (section 3), not monthly values.
- **Shares and amounts change from a date:** `plan.shares: [ { from: '2026-11-23', free: 30000, edu: 10000, give: 5000, ffa: 10000, goals: { trip: 15000 } } ]`. Each entry holds from its date until the next one. A change never moves anything dated before it.
- **Per-period amounts** for Free to spend and the piles are worked out from the shares and the period's length (a period of 14 days gets 14 days' worth); the screen shows the period's figure.
- **One-off costs**: a schedule with `rule: { every: 'once', date }`.
- **Month-end answers** (38.31 `ui.sweep`) become `move` events dated the period's last day.

## 7. Periods (a view, never stored)
- A period runs from one pay that `startsPeriod` to the day before the next. Its name on Home is its dates ("10 Nov to 9 Dec", DECISIONS 23 Nov); history may add the month the pay landed in.
- No fixed pay day (`every: 'none'`): the period runs from the last money in; the look ahead counts no future pay; "days left" is replaced by "lasts about N weeks at your usual rate" (stage 2 screen; the engine field now).
- Changing the pay schedule moves no event; it only regroups them. The screen shows what moves before it is saved (PAYDAY_DESIGN 3A).

## 8. Safe to spend (the one rule, by account and by place; section 10.3 replaces the details below)
For each tracked home-currency account, from its latest check forward, day by day:
balance on the check day + events after it
+ income occurrences not yet settled (only on or after their shifted due date; none for `every: 'none'`)
- bill, card payment and instalment occurrences not yet settled, up to the next time each one falls due (so a monthly rent is seen by someone paid every two weeks, and a yearly cost by its set-aside)
- what is set aside for each card (everything on it, due or later)
- goal places kept in this account
- the account's minimum.
**Safe to spend** = the lowest point of that walk from today to the end of the look ahead, summed over accounts that Free to spend may use, capped by the Free to spend place. An occurrence past its date and not settled shows as "not seen yet" and is still counted as coming (bills) or not counted (income), the safe side both ways.

## 9. Moving a 38.31 copy
LEDGER_DESIGN "Moving a saved 38.31 copy" stands, with these changes from the reviews:
- receipts move in as spend events (section 4), not kept as history;
- pay `a`, `b`, `side` become income schedules on the day the person picks in a one-time question ("When does this pay come in?"); until it is answered, a banner asks, and safe to spend counts no future pay;
- bill lines become bill schedules on the 1st, with a one-time "When is this due?" list;
- `steps`, `once`, `items` become `plan.shares` entries and one-off schedules from their month's first day;
- `cfg.bankStart` and `bankNow` become dated checks (bankNow wins when it is newer);
- `S.cards` become card accounts with their `payDay` and `cutDay: null`; `plan.debts` become loan or card accounts with `apr` and `minRule`;
- the symbol becomes a code by a one-time question when it is "$" or "¥" (yen or yuan);
- the frozen copy is kept under `frozen3831`.
Proof: every 38.31 fixture (tests/next/fixtures/wiring on origin/side/ledger-wiring, refreshed from today's wip-38.31) moves with every typed figure, every receipt and every goal accounted for, and a test lists any field it could not place.

## 10. Decisions from schema review 1 (schema_review_1.md). Where this section and an earlier one differ, this section holds.

**10.1 Opening and what came before it.** An account opens with `{ k: 'open', acct, date, a, place }` (money and its place: waiting, less what is set aside for cards and goals kept in that account) and a `check` the same day. Events dated on or before an account's opening day carry `pre: true`: they do not move that account or any place (the opening figure already holds them), but they count in that period's "spent so far" for budget lines and Free to spend. Same day as the opening: before it (`pre`). A moved 38.31 receipt dated on or before the bank check is `pre`.

**10.2 Bills and budgets are different things.** A **bill** is a dated schedule settled by one payment (rent, utilities, phone, internet, insurance, a loan payment, a subscription). A **budget line** is money for a kind of spending over a period, used up by many spends, never settled: `plan.budgets: [ { id, name, place: 'bills'|'free', per, steps: [ { from, amount } ], at } ]`. A spend carries `line: <budget id>`. 38.31 lines move as: rent, util, net, phone, ins, loan, subs become bill schedules (a one-time "When is it due?" question; until answered, due on the period's first day); food, gas (transport), card ("Other card spending") and every custom line become budget lines. A card spend against a budget line moves into that card's set-aside, and the budget line's remaining amount falls by the same, so it is counted once. `cfg.ceiling` and `cfg.aims` move to `plan.limits: { ceiling, aims }` unchanged.

**10.3 Safe to spend, exactly.**
1. Horizon: from today to the later of (the second next income occurrence that starts a period) and (today + 45 days).
2. For each tracked home-currency account: start from today's balance (added up from its events); walk day by day; on each date add unsettled income occurrences of that account (none for `every: 'none'`), subtract unsettled bill and instalment occurrences paid from it, and at each future period's start subtract that period's budget lines and Free to spend share (planned spending of later periods). Card payments are not subtracted in the walk: the card's set-aside is subtracted once, today, as everything on the card. A bill whose `place` is a goal is paid from that goal's place first; only the part the place does not cover is subtracted.
3. Today, subtract from each account: what is set aside for its cards (`payFrom` this account) and its goal places kept in it (mode inBank).
4. Each account's headroom = its lowest point on the walk less its minimum (`minBank`; default null except the main bank, which takes home.minBank). An account whose lowest point is below its minimum is reported as a warning with the account, the date and the amount ("GCash goes 290 below zero on 20 Nov").
5. **Safe to spend** = the smaller of (the Free to spend place's remaining amount this period) and (the sum of headroom over accounts with `spendFrom: true`, less every warned shortfall of any account). Never below zero on screen; a shortfall shows as its own line.
`spendFrom` is an account field: default true for bank, cash, ewallet, wallet; false for owedToYou and for accounts that back a goal (mode ownAccount).

**10.4 Units.** Every budget line, Free to spend share and pile share has `per: 'month'|'pay'|'week'`. A period gets: `per` equal to its kind, the amount; `month` with pay that is not monthly, amount x 12 / pays a year; `week`, amount x days in the period / 7. Mako (per month, paid monthly) gets the same Free to spend whatever the period's length. Schedules use `steps: [ { from, amount } ]` (a raise from April is a new step) plus `amounts` for one occurrence. `goal.monthly` is removed: `plan.shares[].goals` is the one place. `ends` is a date; an instalment uses `count`.

**10.5 Currency before amounts.** The move asks for the code first when the symbol is "$", "¥" or anything not in the table, and converts amounts to minor units only after. The currency table has a fallback: an unknown code is 2 decimals and the screen asks once.

**10.6 Every 38.31 field has a target.**
- A goal of kind "pay off a debt" gets `pays: <account id>`; its saved amount is never opened as savings; the debt account opens with what is still owed.
- Calculator inputs (`ui.loans`, `ui.subP`, `ui.subO`, `ui.cardT`, `ui.cardB`) stay in `ui` as they are.
- Line `ends`/`redirect`, `cfg.loanLast`, `cfg.redirectLoan` become schedule `ends` plus `redirect: <place id>`.
- `plan.recurring` becomes schedules with `kind: 'autoSpend'` (they log themselves as spend events on their dates; weekday rules use `every: 'weeks', n: 1, from`).
- `steps` `debt:<id>` extras become `extraSteps` on that loan or card account.
- Goal `start` becomes an `open` into the goal's place in the bank (mode inBank); `slot` and `why` are kept. "Savings from your old plan" is not used.
- Receipt `c` becomes `line` or `place`; `s` becomes `acct` when it names an account, else it is kept in `note`.
- `ui.sweep` answers dated after the opening become move events; earlier ones stay only in `frozen3831`.
- Ledger fields kept as LEDGER_DESIGN has them: `tracked`, `closed`, `confirm`, `preset`, `grp`, and `home.mode` (Track or Wallet; Track by default).
- Income events carry `stream: <schedule id>`. A period starts only from an income event whose stream starts a period; a refund never does.

**10.7 Ids and merging.** An id is `<device part>-<session part>-<counter>`: the device part is made once per device and kept under its own storage key (never in the saved copy or a backup; a restored copy gets the new device's part for new records); the session part is 3 random letters per page open, so two tabs never clash; the counter starts at 1 per session. Records are edited in place and their `at` is set. `plan.shares` entries, `plan.budgets`, `plan.limits` and `home` each carry `id` (where a list) and `at`.

**10.8 One owner for each date.** A card's payment day belongs to the card (`payDay`, `shift`, `payFrom`). Any day field 29 to 31 falls on the month's last day when the month is shorter, for pay days, bills, cut days and payment days alike.

**WATCH items accepted:** an auto bill never confirmed stays "not seen yet" and counted (safe side) until matched; an import matches a typed spend by account, amount and date within 3 days before adding; holiday tables are refreshed yearly and the screen says when a year is missing; putting the period's shares into places happens on its own at the pay that starts a period, and the person can move money after.
