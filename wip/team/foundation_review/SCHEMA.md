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
- **card**: `inFull` (true unless it carries an older balance), `cutDay` (1 to 31, or null for "not sure": then everything on the card is due on the next payment day, the safe side), `payDay` (1 to 31), `paySched` (optional schedule id when the payment day moves for weekends and holidays; default rule "move later" in JP).
- **card, stage 2 fields now**: `apr` (yearly %, null when paid in full), `minRule` ({ pct, floor } or { fixed }), `of` (for an older balance or an instalment plan: the card's id).
- **loan, paylater**: `payDay`, `apr`, `minRule`, `ends` (date or null), `of`.

**Opening.** Every account opens with a dated `check` event (section 4), never a bare number. A card opens with two: `{ k: 'check', acct, date, typedA: <what is on it now> }` and `{ k: 'check', acct, date, stmt: true, typedA: <last statement balance>, stmtDate }` when the person knows it. With only "now", everything on it counts as due on the next payment day.

## 3. Schedules (one type for pay, bills, card payments, instalments, yearly costs)
```
{ id, kind: 'income'|'bill'|'cardPay'|'instalment'|'yearly'|'transfer',
  name, acct,                // the account it lands in or comes from
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

## 8. Safe to spend (the one rule, by account and by place)
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
