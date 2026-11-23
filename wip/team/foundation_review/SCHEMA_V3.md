# The saved shape, version 3 (one document, 23 Nov 2026)

This replaces SCHEMA.md (sections 1 to 10) as the shape to build. It folds in SCHEMA section 10, every decision in DECISIONS_ROUND2.md (A to I; I wins over anything earlier, then H), schema_review_2.md, schema_v3_review_1.md and the four sweep 2 reports. Nothing is appended: where an older text said something else, this one holds. Built on the ledger (origin/side/ledger-wiring, LEDGER_DESIGN.md and ledger.js: accounts, places, events, the one rule).

The money rules are not written here in prose. They are code: `foundation_review/ref/lookahead_ref.js`, checked against 278 hand-worked asks by `ref/run_scenarios.js`. Section 12 says which part of the code answers which question, and lists the four rules that are not in the model and each have their own test file instead [H7]. For every rule section 12 puts in the model, when this document and the reference model disagree, the reference model is right and this document is fixed. For the four rules outside it, this document and their test files are right.

All examples are made up. Tags like [A3], [B9], [F14], [D4], [H1] point to the decision in DECISIONS_ROUND2.md.

---

## 0. Rules for every record

- **Ids** are strings `<device part>-<session part>-<counter>`, for example `k7qzpa-m2x-41`. The device part (6 letters) is made once per device and kept in device storage only (never in the shared copy or a backup; a restored copy gets the new device's part for new records). The session part (3 letters) is new on every page open, so two tabs never clash. The counter starts at 1 per session. Ids are never renumbered.
- **Dates** are `YYYY-MM-DD` in the person's local calendar. All engine date maths is on whole day numbers [D8]. "Today" is worked out again whenever the app comes back into view. Times appear only in `at`.
- **Amounts** are whole minor units (integers): yen 1 is 1, peso 1.00 is 100. The currency table gives the decimals per code; an unknown code is 2 decimals and the screen asks once. Nothing is rounded on load.
- **Currency** is an ISO code on every account, schedule, goal and budget line. The home currency is `home.cur`. "$" and "¥" are asked, never guessed. The currency cannot change once events exist, unless the change converts every amount with a preview first [E2].
- **`at`** on every record is a hybrid clock: the larger of now and (the newest `at` this device has seen plus 1 ms), written as ISO with the time zone offset, with the device part breaking ties [D4]. A wrong clock on one device cannot always win. Every edit and every merge moves `at`.
- **`told`** on every record [H1]: when the app first heard of it, as the same hybrid clock. It is set once, when the record is made, and never changed by an edit, an Undo, a Redo or a merge (a merge keeps the oldest `told` it sees for an id). It orders records that share a date: a check holds the events dated before its day and those on its day whose `told` is before the check's `told` (section 7.1).
- **Nothing is deleted.** Remove and Undo set `gone: '<date>'` and `goneBy: <id of the step or record that removed it>`, and move `at`. Redo clears both and moves `at` again, so the Redo is newer than the Undo [H6]. Undo is these marks; there is no full copy inside the saved data [D2].
- **Nothing is dropped for being out of range.** No fixed window; a date years back or ahead is kept as typed.
- **Unknown fields are kept** on load and save, arrays and objects too, so an older page never strips a newer field.
- **Every list record** (`plan.shares` entries, budget lines, schedules, goals, accounts, events, people, check-ins) has `id`, `told` and `at`. Single records (`home`, `plan.limits`) have `at`.

## 1. Where it is stored [D1, D3, D5, D6, D7]

| Store | What | Written |
|---|---|---|
| IndexedDB `burrow3`, store `events` | one record per event, keyed by `id`, indexed by `date` and `acct` | per change |
| IndexedDB `burrow3`, store `book` | one record: everything in section 2 except `events` | per change |
| IndexedDB `burrow3`, store `kept` | a whole copy kept before a big replace (backup restore, cloud load), its own record, never inside `book` | on that replace only |
| IndexedDB `burrow3`, store `device` | device-only state (section 2.2) | per change |
| localStorage | small device things only: the device id part, the last open, the look | as today |

- The old 38.31 key is read once by the move and never written again, except one marker `{ movedTo: 'burrow3', at }` [D6]. Old pages that find the marker show "Update the app" and write nothing.
- **Every writer checks the version first** (local save, another tab, backup restore, cloud): if the stored `v` is newer than the page knows, the page becomes read-only with "Update the app" and keeps both copies [D6]. Tabs signal each other with BroadcastChannel.
- After setup the page calls `navigator.storage.persist()`; Settings shows whether it was granted and the space used [D7].
- The cloud copy and backup files are `{ fmt: 'gz1', data }`: the copy as JSON, gzipped, then encrypted [D5]. The cloud copy of this shape lives under its own key on the vault server, where a 38.31 page cannot load or overwrite it [E3]. Pushes happen on leaving the app, on going to the background, and at most every 1 to 2 minutes. Backups are read from the file directly, never through a text box. The move link is retired.
- The service worker precaches with `{ cache: 'reload' }` and falls back to the cache after a 3 second network timeout [D6].

## 2. The copy

### 2.1 Shared (merged across devices)
```
{ v: 3,                       // shape version; a page that knows a lower v never writes over it
  fmt: 'gz1',                 // only on the cloud copy and backup files
  rev, at,                    // revision (max(now, rev + 1)) and when saved
  home: { cur: 'JPY', country: 'JP', mode: 'track', minBank: null, mainBank: <account id>, at },
  people: [ { id, name, at } ],
  accounts: [...],            // section 3
  places: [...],              // section 4 (goals and the other kept places)
  schedules: [...],           // section 5
  events: [...],              // section 6 (stored one per record, section 1)
  checkins: [...],            // section 7
  plan: { shares: [...], budgets: [...], limits: {...}, at },   // section 8
  imports: { cats: {...}, at },  // what the person taught the statement reader (38.31 ui.cats)
  ui: { ... },                // shared screen choices only (section 11, "shared ui")
  frozen3831: <the 38.31 copy as it was, read only>
}
```
- `home.mode`: `'track'` (Free to spend is a place) or `'wallet'` (Free to spend is handed out of tracked accounts), as in the ledger. Track by default.
- `home.minBank`: the minimum for the main bank. Null means no minimum. Setup asks once, with no amount filled in (MAKO M1, recommended).
- `home.mainBank`: the account that pays cards and bills by default and takes `home.minBank` [B8, A8].
- `home.country` picks the holiday table and the bank-closed table [F17].

### 2.2 Device only (never merged, never in the cloud copy or a backup) [D3, E9]
```
{ deviceId: 'k7qzpa',
  clock: { lastSeen: '2026-11-23' },   // a date more than 1 day back, or more than 40 days ahead, asks before anything is written [D8]
  look: { theme, sound, music, scene, ... },   // 38.31 ui look and tour fields, section 11
  tour: { ... },
  opens: [ '2026-11-23', ... ],                 // days the app was opened on this device [E9]
  checkinsHere: [ <checkin id>, ... ],          // check-ins made on this device, for the streak [E9]
  undoCopies: [] }                              // none kept inside the copy; a big replace writes store `kept`
```

### 2.3 Merging two copies [D4]
Union of every list by `id`; per record the newest `at` wins. A copy with `gone` wins only against a copy of the same record whose `at` is the same or older; a Redo (a newer `at` without `gone`) wins over the Undo it reverses [H6]. `told` is never taken from the winning copy: the oldest `told` seen for the id is kept [H1]. On a cloud conflict the page downloads, merges, and sends again with the server's version as its base; it never asks "keep mine". The same amount typed on two devices on the same day for the same place is offered to the person as a possible double [H9]; the merge itself never removes either (section 6.4). The merge has its own test file (section 12).

## 3. Accounts
```
{ id, name, type, cur, owner, open: <event id>, minBank, spendFrom, tracked, closed, preset, confirm,
  postingDays,               // working days a bank needs to post an expected item; default 1 [F4]
  gone, at }
```
- `type`: `bank`, `cash`, `ewallet`, `wallet`, `investment` [B10], `card`, `paylater`, `loan`, `owedToYou`.
- `owner`: a `people` id, or null for shared.
- `minBank`: this account's minimum, in minor units. Null: the main bank takes `home.minBank`, any other account has none.
- `spendFrom`: may safe to spend count this account's headroom. Default true for bank, cash, ewallet, wallet; false for investment, owedToYou and an account that backs a goal (`keptIn.mode 'ownAccount'`).
- `tracked`: false only for the Wallet-mode wallet (ledger).
- `closed` (date), `preset` (a presets file id, names only), `confirm` (set by the move: ask at the first check-in), as in the ledger.
- **investment** [B10]: holds checks like a bank; its value may move on its own between checks (the gap is a market move, not a filler). Not counted in safe to spend (`spendFrom: false`).

**Owed accounts (card, paylater, loan) own their payment day** [B5, E6, 10.8]. There is no separate schedule for a card or loan payment.
- **card**: `inFull` (true unless it carries a balance; a card that carries one pays its `minRule` plus its `extraSteps` each payment day, and the rest is carried to the next statement [H7]), `cutDay` (1 to 31, `'last'`, or null for "not sure": then on each payment day everything owed, less payments since, is due [H4]), `payDay` (1 to 31), `payMonths` (months after the close the payment falls; 1 by default, 0 for a card paid the same month), `shift` (`'before'|'after'|'none'`; from the country by default), `payFrom` (the account that pays it; `home.mainBank` by default), `apr`, `minRule` (`{ pct, floor }` or `{ fixed }`), `of` (for an older balance or an instalment plan: the card's id), `extraSteps: [ { from, amount } ]` (planned extra payments; 38.31 debt `extra`) [B5].
- **A card statement** [H3] is what was carried over from the last statement, less the payments and refunds since its close, plus the lines posted in the cycle. Paying a statement in part leaves the rest in the next one. A statement at or below zero is a credit carried to the next one: nothing is due and no expected item is made. **Carried over** is only what is left of statements not paid by their own payment day [I3]: a statement still waiting for its payment day (a card paid two months after its close, common in Japan) is never folded into the next one, so two statements can wait at once, each with its own item. When two statements are unpaid at once, each item asks only for what the older one does not already hold, so nothing is counted twice. **Interest** [I2]: at each close, on what is carried over, `apr` / 12, rounded half up to the minor unit; it is part of that statement. **Close day not sure** [H4]: each payment day is an expected item for everything owed then (less payments since), with or without a typed last statement; after each payment the next payment day gets its own item.
- **A card paid from an account in another currency** [H5]: each payment carries `a` (what left the paying account, in its currency) and `a2` (what reached the card). Until stage 2 the walk does not take the card's payments off the paying account (it cannot convert, F11) and Home shows a warning under the headline; a recorded payment takes its typed `a` off the paying account.
- **paylater** [F19]: `payDay`, `shift`, `payFrom`, `instalments: { amount, count, first }` (the buy is a spend on this account; each part is a repay from `payFrom`), `apr`, `ends`, `of`. What is still to come is shown as owed.
- **loan**: `payDay`, `shift`, `payFrom`, `amount` (the usual payment), `apr` (yearly rate in percent; on a loan or pay-later, interest is added on each payment day on what was owed before that day's payment, x `apr` / 12, rounded half up [I2]), `minRule`, `ends`, `extraSteps`, `of`. Each payment day asks the usual `amount`, or what `minRule` asks on what is owed, plus the `extraSteps` amount in force on that day, never more than what is owed [H7]. A 38.31 "Loan or debt payment" bill line is matched to the loan at the move (or dropped with the person's OK), never both [E6].
- A day 29 to 31 falls on the month's last day in a shorter month, for every day field [10.8].

**Opening** [B6, B7, H1]. Every account opens with one `open` event and a `check` the same day, written together in the first check-in; their `told` is the moment setup saved them. A bank opens with one figure, split by place: what is kept for goals and the other kept places in it, what is left of this period's budget lines and Free to spend [B2], and the rest in Waiting. Goal money is a place inside the bank, never a second open [B6]. A card opens with a check of what is on it now, and when known a second check with `stmt: true` (the last statement, its close date and whether it was paid).

**Before the opening** [B7, H1]. An event dated before an account's opening day, or on that day and told before the opening, does not move that account (the opening figure holds it). An event on the opening day told after setup (a dinner logged that evening) moves it like any later event. `pre` is worked out each time from the dates, never stored. An event between two accounts where one side is before its opening: the other side's amount goes to Waiting, so the accounts still add up to the places. Pre-opening spends still count in that period's "spent so far" for budget lines and Free to spend.

## 4. Places
The ledger's places: Waiting, Bills left (with one "for the card" line per card paid in full), Free to spend, and the kept places.
```
{ id, name, kind: 'goal'|'emergency'|'education'|'giving'|'investing'|'payoff',
  target, due, cur, owner,
  keptIn: { acct, mode: 'inBank'|'ownAccount' },
  pays: <account id>,          // kind payoff: the debt it pays down; its money is never opened as savings
  emergency, stretch, stretchOn, stretchFrom,   // the emergency place, as 38.31
  slot, why,                   // 38.31 screen fields, kept
  refill: true,                // a yearly cost: after each payment the set-aside starts again for the next one [E5]
  gone, at }
```
- Education, Giving and Investing are places with `keptIn` like goals and are protected in the headroom [B10].
- A place's balance is added up from events (`open`, `move`, `spend` from it); never typed. "Saved so far" typed at setup becomes part of the bank's opening split.
- **Paying from a place** [H7]: a spend with `place`, or a bill whose schedule has `place`, takes its money from that place first. In the walk, a future bill paid from a place comes off only beyond what the place still holds, so the money is never taken off twice. A place never holds less than nothing: paying past it takes the rest from the account's other money.
- **Refill** [E5, H7]: a place with `refill: true` that pays a schedule is, after each payment, due again on that schedule's next occurrence; what it held after paying is where the set-aside starts again.
- `mode 'inBank'` (the default): the money stays in that account, set aside. `'ownAccount'`: the place is backed by its own account (`spendFrom: false`).

## 5. Schedules (pay, bills, transfers, spending that logs itself)
```
{ id, kind: 'income'|'bill'|'transfer'|'autoSpend'|'once',
  name, acct, acct2,          // acct: where it lands or is paid from; acct2: the other side of a transfer
  owner, cur,
  rules: [ { from: '2026-11-20', rule } ],                   // [H2] each rule holds from its date to the next one's
  // rule: { every: 'month', days: [10] }                     // days of the month; 31 = last day
  //     | { every: 'weeks', n: 2, from: '2026-11-13' }       // every N weeks from a date (weekly: n 1)
  //     | { every: 'months', n: 3, day: 5, from: '2026-12-05' }
  //     | { every: 'monthsList', months: [6, 11], day: 15 }
  //     | { every: 'year', date: '05-31' }
  //     | { every: 'lastWorkday' }                           // the month's last working day; never moved
  //     | { every: 'once', date: '2027-03-14' }
  //     | { every: 'none' }                                  // no fixed day: no future money expected [B4]
  shift: 'before'|'after'|'none',
  steps: [ { from: '2026-11-23', amount: 250000 } ],          // the usual amount, changing from a date (a raise)
  byDay: { '15': 18000, '30': 12000 },                         // unequal halves on different days
  amounts: { '2027-06-10': 260000 },                           // one occurrence changed, keyed by the due date BEFORE any move [B8]
  vary: 0.3,                                                   // the amount margin for matching, for example power and water [A6]
  startsPeriod: true,                                          // income only; see below
  place: 'bills'|'free'|<place id>,                            // where a bill is paid from
  roughAll: true,                                              // the "all my bills, roughly" line, split later [A8]
  from: '2026-11-23', ends: null, count: null,                 // first occurrence, last date, or a number of occurrences
  redirect: <place id>,                                        // where the money goes after `ends` (38.31 line redirect)
  gone, at }
```
- **Rules from a date** [H2]. A change to when something happens (pay moves from the 10th to the 25th) adds a `rules` entry from a date; it never edits an older entry, so no occurrence before that date is rewritten or made up. An occurrence due on or after an entry's `from`, and before the next entry's, comes from that entry. A change to how much adds a `steps` entry the same way.
- **Occurrence names** [H2]. An occurrence is named everywhere by its schedule and its due date before any move: `{ s: <schedule id>, due: '2027-01-10' }`, written `pay1@2027-01-10` on screens and in tests (it lands on Fri 8 Jan). Settled links, `amounts` keys, expected item ids and the check-in list all use this one name. A5's sequence number is dropped. The edit screen lists the settled occurrences that the new entry would make again before it saves.
- **One stream starts periods** [F12]. At most one income schedule has `startsPeriod: true`. A couple picks it; the default is the first entered. Others (a second job, a partner's pay) are counted in the walk but start no period.
- **Pay is never blank** [A8]: setup asks for the next pay date and assumes monthly when nothing else is said. `every: 'none'` is chosen only by a person who says there is no fixed day.
- **transfer** moves money between two own accounts on a day (a top-up from the bank to an e-wallet); **autoSpend** writes its own spend event on the day it lands, with `settles` naming its occurrence, unless something already settled it (38.31 `plan.recurring`). It is never on the check-in list. Both are in the walk [B5, H7]. A transfer between two currencies carries `a` and `a2` [H5].
- **Holiday and bank-closed tables** are data files per country and year [F17]: holidays and bank-closed days are separate tables, both non-working for the shift rule. A missing year falls back to weekends only and the screen says so.

## 6. Events (what really happened)

### 6.1 Fields
```
{ id, k, sub, date, a, a2, acct, acct2, place, place2,
  line,                      // the budget line a spend is for
  stream,                    // income: the schedule it came from
  settles: [ { s, due } ],   // the occurrences it settles, by name [H2] (one payment can settle two)
  posted,                    // the posting date from the bank or a statement, beside `date` (the buy date) [H1]
  told,                      // when the app first heard of it; never changed (section 0) [H1]
  est: true,                 // typed as rough [A6]
  src: { type: 'typed'|'statement'|'screenshot'|'move', file, line },   // [A6]
  grp,                       // the check-in (section 7) or the one step it belongs to
  owner,                     // only when different from the account's owner
  note, gone, goneBy, at }
```

### 6.2 Kinds (`k`)
The ledger's kinds and its one rule stand: `open`, `in`, `borrow`, `move`, `spend`, `hand`, `transfer`, `convert`, `repay`, `check`, `adjust`. Added:
- `skip`: an occurrence that did not happen this time (no pay this month, a bill waived). It carries `settles`.
- `filler`: the rest of the spending in a stretch (section 7.3). It carries `stretch: { from, to }`, `place`, `split: 'days'|'before'` and **no stored amount** [A3].
- A check carries `typedA` and, on a bank, `avail: 'available'|'current'`; on a card, `stmt: true` with `stmtDate` when it is the statement figure. An "available" check already has pending debits off, so it holds every event dated on or before its day; a "current" check follows section 7.1. Not asked: "current" [I1].
- `a2` [H5]: on a `repay`, `transfer` or `convert` between two currencies, `a` is what left (in the paying account's currency) and `a2` what arrived. Between two accounts in one currency `a2` is left out.
- `adjust` stays only for a person's explicit "accept the difference" outside a check-in (rare). A check-in never writes an adjust.

### 6.3 Receipts are spend events
One list. A 38.31 receipt moves in as `{ k: 'spend', date: r.d, a, acct, line or place, src: { type: 'move', id: r.id }, note }` (section 11).

### 6.4 Matching an import to what is already there [A6, F15]
- An import line matches a typed or expected one by account, direction, amount (within the schedule's `vary`; for a typed spend exactly, or within 10% of it when the typed line is `est` [H9]) and date (within the account's `postingDays` working days, by `posted` when there is one).
- A matching typed line is replaced: it gets `gone` and `goneBy: <import event id>`.
- The same amount typed on two devices on the same day for the same place is offered to the person as a possible double; nothing is removed without them [H9].
- A statement replaces screenshot lines in the same stretch (`src.type` rank: statement over screenshot over typed).
- An import line that matches an expected occurrence settles it.

## 7. The check-in, settling and the filler [A1 to A4, F15, F16, F24]

### 7.1 One moment
```
{ id, date, told, at,
  figures: [ { acct, check: <event id>, typedA } ],   // each account typed, each with its own date
  settled: [ <event id>, ... ],                       // what the ticked list wrote
  fillers: [ <event id>, ... ],
  gone, at }
```
The checks, settlements and fillers written together carry `grp: <checkin id>`. Each account's bank figure carries its own "as of" date (its latest check); safe to spend reports its oldest input [A1]. After a gap the bank figure stays at the last check, shown with its age; nothing is projected as fact [F24].

**What a check holds** [H1]. A check holds the events dated before its day, and those dated on its day whose `told` is before the check's `told`. A spend logged after a same-day check (lunch after the morning check-in) comes after it. A bank event with `posted` is held by its posted date, so a debit bought on the 21st and posted on the 24th is not inside a check on the 22nd and still comes off. That is a "current" check; an "available" one holds every event dated on or before its day [I1]. Two check-ins on one day: the later one's stretch starts at the earlier one.

### 7.2 Settling first [A2, F16]
The check-in first lists every expected item (pay, card payments, bills, transfers) that landed since the last check-in and is not settled, ticked by default, amount editable. Ticking writes the event: pay writes `in` with `stream` and `settles` (that starts the period); a card payment writes `repay`; a bill writes `spend` with `settles`. A different real amount settles the occurrence at the real amount and does not change later estimates unless the person ticks "use this from now on", which writes a new `steps` entry [F16]. The reference model's `checkIn.toConfirm` is that list.

### 7.3 The filler [A3, A4, F15]
What is left after settling is the filler for the stretch from the day after the last check-in to this one (from the same day, when the last check-in was earlier that day [H1]). Its amount is never stored: it is worked out each time as (what the events say the account holds at the check) minus (the check figure). Lines imported or typed later inside the stretch shrink it. A stretch that crosses a period start is split by days, or all to the older period when the person says "mostly before pay" [A4]. On a card, a check that names a statement fills that statement's cycle first, then the open part. Reference: `makeFiller` and the card check in `cardInfo`.

### 7.4 Period end [A7]
The period-end question (always asked) runs after a fresh check-in: if none is dated in the last 3 days of the period, the question starts with one. Money left in Free to spend or a budget line never rolls on silently: it waits in its place marked "to decide" until answered. Answers are `move` events dated the period's last day.

## 8. The plan (what is expected)
- **`plan.shares`**: `[ { id, from, per: { free: 'month', edu: 'month', ... }, free, edu, give, ffa, goals: { <place id>: amount }, at } ]`. Each entry holds from its date to the next. `per` is per amount [B8]. A change never moves anything dated before it.
- **`plan.budgets`** (budget lines: food, transport, other card spending, custom lines): `[ { id, name, place: 'bills'|'free'|<place id>, cur, per: 'month'|'pay'|'week', steps: [ { from, amount } ], once: { <period start date>: amount }, at } ]`. `place` may be any place, so 38.31 custom lines in Education, Giving or Investing keep their home [B8]. `once` is a one-period override [B8]. A spend carries `line`.
- **Units** [10.4, H9]: a period gets the amount when `per` matches its kind; `month` with pay that is not monthly gets amount x 12 / the real number of pays in that year (26 or 27 for pay every two weeks), spread so the year adds up exactly; `week` gets amount x days / 7. With no fixed pay, budget lines and Free to spend come off by day: the monthly amount x 12 / 365 a day [B4]. Units have their own test file (section 12).
- **`plan.limits`**: `{ ceiling, aims, at }` (38.31 `cfg.ceiling`, `cfg.aims`).
- **Opening mid-period** [B2, I4]: the opening asks "spent since pay day?" for Free to spend and each budget line, or shares them by days left, and writes those as the places' opening split. Days left: from the setup day to the period's last day, both counted, over the period's days; each line rounded down to the minor unit, what that leaves to Free to spend.
- **Planned goal set-asides are not money yet** [F22]: only `move` events into a place count.

## 9. Periods (a view, never stored)
A period runs from the day the period stream's pay lands (early or late) [F8] to the day before the next one. **Late pay** [H8]: a pay past its date but inside its account's posting window is "late, expected". It still counts in the walk (on today), the period does not move on, and days to next pay says the pay is late. After the window it becomes "not seen yet" and stops counting. Its name on Home is its dates. With no fixed pay the period runs from the last money in, and the engine gives "lasts about N weeks" [B4]. Changing the pay schedule moves no event; it only regroups them.

## 10. Platform checks that belong to the shape
- A test runs the engine under `TZ=America/Los_Angeles` and `TZ=Asia/Tokyo`, and a check fails on `new Date(<date string>)` or a "now" sliced from `toISOString` in engine files [D8].
- A speed test times a 30,000-event copy under 4x CPU slowdown and fails above its budget [D8].
- A check run that prints a mismatch or a failure is a failure (LESSONS lesson 2).

## 11. Moving a saved copy [E1, E4, E6]
The move is proved on every old build Mako's data can be in: 38.28 live and every build from 25.0 to 38.28, not only 38.31 [E1]. Every typed figure, receipt and goal is accounted for, and a test lists any field it could not place. The bank comparison Mako sees before deploy is redone on the new engine. The any-AI paste format and its checker write this shape [E4].

**Questions the move asks once** (until answered, a banner asks and the engine uses the safe side): the currency code when the symbol is "$", "¥" or unknown, or when the copy has no currency at all (asked before any amount is converted to minor units; never set to pesos [H9]); when each pay comes in (until answered, no future pay is counted); when each bill is due (until answered, due on the period's first day); which loan a "Loan or debt payment" line is [E6].

### 11.1 Every 38.31 field and where it goes
| 38.31 field | Target |
|---|---|
| `v`, `rev` | replaced by `v: 3`, `rev`, `at` |
| `steps[ym]` (monthly amounts by month) | `plan.shares` and `plan.budgets[].steps` entries from that month's first pay; `debt:<id>` keys become `extraSteps` on that loan or card |
| `once[ym]` (one month's amount) | `plan.budgets[].once` for the period starting in that month |
| `items[ym]` (one-off costs) | `schedules` with `kind: 'once'`, `rule: { every: 'once', date: <first day of ym> }`; in the move month (a date before the opening) the date is the first day after the opening, so it is due, never treated as paid [H9] |
| `cfg.bankStart`, `cfg.bankAt` | a dated bank `check` (the opening when it is the oldest figure); a `bankStart` with no `bankAt` is dated to the copy's last saved day [H9] |
| `cfg.bankNow`, `cfg.bankNowAt` | a dated bank `check`; the newer of the two opens the bank when it is newer |
| `cfg.minBank`, `ui.minAuto` | `home.minBank` (only when typed; an automatic minimum is dropped, MAKO M1) |
| `cfg.ceiling`, `cfg.aims` | `plan.limits` |
| `cfg.planFrom` | not needed: periods come from pay; kept in `frozen3831` |
| `cfg.loanLast`, `cfg.redirectLoan` | the loan account's `ends` and the schedule `redirect` |
| `cfg.moveMonth`, `cfg.carDue` | the goal's `due` |
| `cfg.moveTarget`, `moveStart`, `travelTarget`, `travelStart`, `carTarget`, `carStart`, `rainyStart`, `rainyTarget`, `rainyStretch` (older goal figures) | the matching place's `target` and `stretch`; a start becomes part of the bank's opening split into that place |
| `plan.lines[]` `id, key, jar, name, def, note, ends, redirect` | rent, util, net, phone, ins, subs: `schedules` (bills); loan: matched to a loan account [E6]; food, gas, card and every custom line: `plan.budgets` with `place` from the jar (nec: bills, play: free, edu, give, ffa: those places); `def` is the first step; `ends` and `redirect` as named |
| `plan.goals[]` `id, name, target, start, due, slot, monthly, why, emergency, stretch, stretchOn, stretchFrom` | `places` (kind goal or emergency); `start` is part of the bank's opening split; `monthly` becomes `plan.shares[].goals`; unknown plain fields kept on the place |
| `ui.gk` (goal kinds) | the place's `kind`; a pay-off goal gets `pays` and is never opened as savings |
| `plan.debts[]` `id, name, kind, balance, apr, min, extra` | a `loan` or `card` account opened at `balance`, with `apr`, `minRule: { fixed: min }` and `extraSteps` from `extra` |
| `plan.recurring[]` `id, a, c, n, every, on, from, last` | `schedules` with `kind: 'autoSpend'` (`every: 'week'` becomes `rule: { every: 'weeks', n: 1, from }`, with `from` moved to the first `on` weekday on or after it [H9]); `last` is the last day already logged |
| `receipts[]` `id, d, a, c, cn, n, s` | `spend` events (6.3): `c` becomes `line` or `place`, `cn` and `n` the `note`, `s` the `acct` when it names an account, else kept in `note`; one dated on or before the bank's opening is before it (B7) |
| `cards[]` `id, name, owed, payDay, at` | `card` accounts with `payDay`, `cutDay: null`, `inFull: true`, opened with a check of `owed` dated `at` |
| `ui.accts` | accounts (names and types) |
| `ui.sweep` (month-end answers) | `move` events dated the period's last day when after the opening; earlier ones stay in `frozen3831` |
| `ui.keep`, `ui.keeps`, `ui.preSplit` (Undo copies) | not moved (frozen3831 only) [D2] |
| `ui.cats` | `imports.cats` |
| `ui.name` | `people[0].name` |
| `ui.cur`, `ui.preset` | `home.cur` (by the one-time question when ambiguous) |
| `ui.main` | shared `ui.main` (the place shown first) |
| calculator inputs `ui.loans`, `ui.subP`, `ui.subO`, `ui.subs`, `ui.cardT`, `ui.cardB` | shared `ui` as they are |
| `ui.limits`, `ui.noDebts`, `ui.askNums`, `ui.win`, `ui.done`, `ui.sb`, `ui.bd`, `ui.more`, `ui.setup`, `ui.cleared`, `ui.src`, `ui.full`, `ui.home`, `ui.mcOk` | shared `ui` as they are (screen answers that follow the person) |
| `ui.wk` (weeks the app was used) | device `opens` [E9] |
| look, sound and tour: `ui.mute`, `ui.music`, `ui.vol`, `ui.dj`, `ui.scene`, `ui.tourAt`, `ui.toured`, `ui.onb`, `ui.seen`, `ui.ms`, `ui.mcSeen`, `ui.vaultSeen`, `ui.imp`, `ui.bk`, `ui.bkLater`, `ui.sampleHidden`, `ui.exactHidden`, `ui.remindHidden`, `ui.moreBillsHidden`, `ui.rcCat`, `ui.rcFreq`, `ui.rcDom`, `ui.rcDay`, `ui.rcTime`, `ui.gset`, `ui.movedIn`, `ui.noMove` | device `look` and `tour` as they are [D3] |
| any field not listed | kept as is: on the shared `ui` if it was under `ui`, else in `frozen3831`, and the move test lists it |
| the whole copy | `frozen3831`, never written again |

Sample data lives apart from the person's data and is never moved as real (requirements 1c).

## 12. The money rules: see the reference model
Each figure below is worked out by `foundation_review/ref/lookahead_ref.js`, function `lookahead(scenario, asOf, opts)`. The tags in the code name the decision behind each line. `node foundation_review/ref/run_scenarios.js` runs the 278 hand-worked asks; all must pass. `node foundation_review/scenarios/check_specs.js` checks that every ask's `why` adds up.

| Figure | In the result | Decisions |
|---|---|---|
| Bank today per account, with its age | `accounts[id].bank`, `.asOf`, `.ageDays` | A1, F24, B7, H1, I1, I5 |
| Safe to spend, per account | `accounts[id].headroom`, `.lowest`, `.lowestDay`, `.why` (the sum a person can check) | B1, B2, B3, B4, B5, B9, F1, F2, F3, F14, F22, H5, H7, H8, I2, I3, I4, SCHEMA 10.3 horizon |
| Safe to spend, the headline | `safeToSpend.headline`, `.shortfall`, `.oldestInput` | F9, B9, A1, G2, I4 |
| Warnings | `warnings` (per account, under the headline, each with a `code`); `laterOn` (12 months) | F9, B11, H5 |
| Days to next pay | `daysToNextPay` (`late: true` while the next pay is late but inside its window) | F3, F8, F12, F13, H8 |
| Due before next pay | `dueBeforeNextPay` (grouped by account; next 30 days with no fixed pay) | F7, F13, F21, F23, H8 |
| Not seen yet | `notSeenYet`; items still inside the posting window: `mayStillPost` | F3, F4, F23, G3, H8 |
| Each card's next payment, owed now | `cards[id].next`, `.owedNow`, `.statements` | F5, F6, F7, F18, H3, H4, H7, I2, I3, I6 |
| Each loan's and pay-later plan's next payment, owed now | `owed[id].next`, `.owedNow` | B5, E6, F19, H7, I2 |
| Each place's money and when it is next due | `places[id].kept`, `.due` | B6, F22, E5, H7 |
| Total, beside it, after the cards | `total.amount`, `.beside`, `.afterCards` | F10, F11 |
| The check-in list and fillers | `checkIn.toConfirm`, `accounts[id].fillers`, `cards[id].fillers` | A2, A3, A4, F15, H1, I1, I5 |
| Lasts about N weeks (no fixed pay) | `lastsAboutWeeks` | B4 |

**Rules in the reference model, each with worked asks** (the scenario file that tests it):
- `told` and same-day order, posted bank lines, two checks on one day [H1]: same_day_order.json
- rules from a date and one occurrence name [H2]: pay_day_moves.json
- the statement rule, partial payment, a credit statement [H3]: card_statements.json
- close day "not sure", with and without a typed last statement [H4]: mako_close_not_sure.json
- two-currency payments and the warning [H5]: other_currency_card.json
- `year`, `monthsList`, `lastWorkday`, `once`, paying from a place, refill [H7]: yearly_and_places.json, places_and_checked.json
- loans and pay-later with `minRule` and `extraSteps`, a card that carries a balance [H7]: loans_and_carried.json
- autoSpend, the opening split by place with budget lines and Free to spend, `est` replaced by an import within 10% [H7, H9]: split_auto_est.json
- late pay [H8]: late_pay.json, mako_shape.json (mako-35)
- an "available" and a "current" check with a pending debit, and the two on one bank [I1]: avail_check.json
- interest on a carried card balance, a loan and a pay-later plan, at the close and payment days, rounded half up [I2]: interest.json
- a card paid two months after its close, two statements waiting at once, one paid late [I3]: two_month_card.json
- the opening split by days left, with rounding [I4]: opening_by_days.json
- `told` on records moved from 38.31, with and without their own times, on one day [I5]: moved_records.json
- holiday and bank-closed moves, pay every two weeks, twice a month, weekly, no fixed pay, a couple, cash, an e-wallet, three weeks away, set up mid-month: the first eight files

**Rules not in the reference model** [H7]. Each is written in this document and must have its own test file before the engine lane starts:

| Rule | Written in | Its own test file |
|---|---|---|
| Matching an import to an expected item (settling it), the `vary` margin, and statement over screenshot over typed. (Matching an import to a typed line, exact or `est` within 10%, is in the model.) The possible double offered when the same amount is typed on two devices [H9]. | 6.4 | `foundation_review/tests/matching` (to write) |
| The period-end question and "to decide" places | 7.4 | `foundation_review/tests/period_end` (to write) |
| Merging two copies: newest `at`, `gone` against same or older `at` only, Redo wins, oldest `told` kept [H6, H1] | 2.3 | `foundation_review/tests/merge` (to write) |
| Units: `per` month, pay or week, and 26 or 27 pays a year spread so the year adds up [H9]. (The model holds only the plain form, used by asks with monthly pay.) | 8 | `foundation_review/tests/units` (to write) |

Every rule section I decided is in the model with its own asks. What section I leaves open is in section 14.

## 13. What the scenario files call each thing
The scenario specs (scenarios/*.json) are written without saved field names. The reference model reads them as they are.

| Scenario | Saved shape |
|---|---|
| account `kind`, `currency`, `owner`, `minimum` | `type`, `cur`, `owner`, `minBank` |
| account `opening.amount` on a date | `open` event plus `check` in the first check-in |
| account `opening.told` (a date and time) | the `told` of that `open` and `check`; with no time, the opening covers its whole day |
| account `opening.split` `{ goals, lines, free }` | the bank's opening split by place [B2, B6]; the rest goes to Waiting. A line or Free to spend the split does not name is shared by days left [I4] |
| top-level `plan` `{ lines, free }` | `plan.budgets` and Free to spend's share in `plan.shares` |
| account kind `loan`, `paylater` with `opening.owed` and `payment { day, from, amount or min_rule, extra_steps }` | a `loan` or `paylater` account opened at what is owed, with `payDay`, `payFrom`, `amount`, `minRule`, `extraSteps` |
| card `statement_close_day: null`, `carries: true` | `cutDay: null` [H4], `inFull: false` [H7] |
| account `apr` (card, loan, pay-later; yearly, in percent) | `apr` [I2] |
| card `months_after_close: 2` | `payMonths: 2` (a statement waiting for its payment day is not folded into the next one) [I3] |
| card `opening.statement` and `opening.current` | a card `check` with `stmt: true` and a card `check` of what is owed now |
| card `statement_close_day`, `payment.day`, `months_after_close`, `from`, `weekend_holiday` | `cutDay`, `payDay`, `payMonths`, `payFrom`, `shift` |
| `income`, `bills` with `schedule` | `schedules` (`kind` income or bill, `rules`, `byDay` for `amount_by_day`, `count`) |
| schedule `changes: [ { from, schedule } ]` | further `rules` entries from those dates [H2] |
| frequency `yearly`, `months_list`, `last_workday`, `once` | `every: 'year'`, `'monthsList'`, `'lastWorkday'`, `'once'` |
| bill `kind: 'auto_spend'`, bill `place` | `kind: 'autoSpend'`; the schedule's `place` [H7] |
| goal `refill`, `for_bill` | the place's `refill: true`, paying that schedule [E5] |
| `starts_period` | `startsPeriod` (one stream only, F12) |
| pay-later part as a bill from the e-wallet | a `paylater` account with `instalments` paid from the e-wallet (F19); the walk is the same |
| goal `kept_in`, `opening` | a place with `keptIn`, part of the bank's opening split |
| events `pay_in`, `money_in`, `refund` | `in` (with `stream` for pay) |
| `spend`, `bill_paid` | `spend` (with `settles` for a bill); `goal` is the spend's `place`, `line` its budget line |
| `card_payment`, `repay` | `repay`; `amount_out` and `amount_in` are `a` and `a2` [H5] |
| `skip` | `skip` |
| `est`, `source`, `posted` | `est`, `src.type`, `posted` |
| `transfer`, `convert` | `transfer`, `convert` |
| `set_aside` | `move` from Waiting into the place |
| `check`, `card_check` | `check` (in a check-in) |
| check `avail: 'available'` or `'current'` (left out: current) | the bank check's `avail` [I1] |
| event `moved: true`, `own_time`; top-level `moved_copy.saved` | a record moved from 38.31 (`src.type: 'move'`); its `told` is `own_time`, else the copy's last saved time [I5] |
| `told` (a date, or a date and time) | the record's `told`, never its `at` [H1]; with no time, records on one day keep their order in the file |
| `settles: 'rent@2026-12-27'` | `settles: [ { s: 'rent', due: '2026-12-27' } ]` [H2] |

## 14. Open questions
The questions this section held before are decided: G1 to G4, then I1 to I6 (each is now in the model with its own asks, section 12). None of the questions below blocks an ask, no ask depends on them, and DECISIONS_ROUND2 section I does not answer them:
1. **Interest on a card whose close day is "not sure"** (H4) and that carries a balance. I2 adds interest at each close, and such a card has no close. The model adds none on it.
2. **A moved receipt with no time on the day of the bank figure** [I5]. Its `told` is the copy's last saved time, which is after the figure, so it comes off (moved_records moved-01, the 5,000). Section 11.1 (receipts row) says a receipt dated on or before the bank's opening is before it, inside the figure. I wins, so the model follows I5, and 11.1 needs changing to match unless I5 meant otherwise. Linked: a moved bank figure with no time and moved receipts with no time on its day are all told at the save; I5's "keep the old list order" does not say which comes first, because the figure and the receipts come from different 38.31 lists. The model keeps such receipts after the figure.
3. **A spend logged after an "available" check on the same day** (lunch typed after a morning check of the available figure) [I1]. Read as written, an available check holds every event dated on its day, so the lunch is inside it and does not come off; H1 put it after the check. The model follows I1 as written.
4. **Days left when the split names Free to spend but not a line** [I4]. The line is shared by days left and rounded down; whether its rounding leftover still goes to Free to spend, which the person typed, is not said. The model keeps the typed figure; the leftover (under one minor unit per line) stays in Waiting.
5. **Setup of a two-month card with two statements unpaid** (set up between a close and the older statement's payment day) [I3]. The opening holds one last statement (section 3, "a second check with `stmt: true`"). The shape needs a list of statements at the opening; this is a gap in the shape, not a rule question.
6. **Readings the model uses that follow from I but are not written in it** (confirm):
   - A payment goes to the statement it settles, or to the one that statement was carried into, then to the oldest statement still owing, then to the open cycle [I3]. So the on-time payment of a statement that was waiting does not lower the next statement to close. Read literally, H3's "less payments since the last close" would make a credit there.
   - A late payment of a statement already carried into a later one lowers that later statement, not the next one to close. No ask has one (in two_month_card the late payment comes before the next close, where both readings agree).
   - A card's carried balance [I2] is what is left of the carried-over statements at the close, after payments (93,000 in interest.json, not the 100,000 statement). A credit carries no interest.
   - On a loan or pay-later payment day the interest is added first and the payment (usual amount, or `minRule` on what is owed) is asked after it [I2]. Interest is added on a payment day gone by even when the payment is not seen yet (interest.json int-08).
   - The look ahead adds the interest the next close will charge on what stays carried after the planned payments (the card's next open payment).
   - A statement item asks what is left of the statement after payments that settled no item, not the printed figure.
   - "The remainder to Free to spend" [I4]: Free to spend is its own share plus the lines' rounding leftovers, then rounded down; a total under one minor unit stays in Waiting.
