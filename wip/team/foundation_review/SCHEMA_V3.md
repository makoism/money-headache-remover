# The saved shape, version 3 (one document, 23 Nov 2026)

This replaces SCHEMA.md (sections 1 to 10) as the shape to build. It folds in SCHEMA section 10, every decision in DECISIONS_ROUND2.md (A to P; P wins over anything earlier, then O and O-confirm, then N, then M, then L and K, then J, then I, then H), schema_review_2.md, schema_v3_review_1.md, final_review_1.md and the four sweep 2 reports. Nothing is appended: where an older text said something else, this one holds. Built on the ledger (origin/side/ledger-wiring, LEDGER_DESIGN.md and ledger.js: accounts, places, events, the one rule).

The money rules are not written here in prose. They are code: `foundation_review/ref/lookahead_ref.js`, checked against 368 hand-worked asks by `ref/run_scenarios.js`. Section 12 says which part of the code answers which question, and lists the five rule areas that are not in the model and each have their own test file instead [H7] (`foundation_review/rules/`, 240 cases). For every rule section 12 puts in the model, when this document and the reference model disagree, the reference model is right and this document is fixed. For the five areas outside it, this document and their test files are right.

All examples are made up. Tags like [A3], [B9], [F14], [D4], [H1] point to the decision in DECISIONS_ROUND2.md.

---

## 0. Rules for every record

- **Ids** are strings `<device part>-<session part>-<counter>`, for example `k7qzpa-m2xq7ab9zt-41`. The device part (6 letters and digits) is made once per device and kept in device storage only (never in the shared copy or a backup; a restored copy gets the new device's part for new records). The session part is 10 random characters (letters and digits), drawn on every page open, so two tabs never clash and one device does not reuse a session part in practice [O3] (3 letters gave 17,576 parts, shared by 34 to 95 pairs of opens a year on a phone opened 3 to 5 times a day, final_review_1 finding 3). The counter starts at 1 per session. Ids are never renumbered.
- **Ids built from what a record is** [O2]. A record the app writes for a known moment is named by that moment, so two devices writing it make one record and the merge keeps the newest `at`: a settlement the check-in writes (a ticked pay, bill, card payment) `set:<occurrence>` (`set:pay@2026-12-25`); a spend a schedule logs by itself `auto:<schedule>@<due>` (`auto:gym@2027-02-01`); a period-end answer `pe:<period last day>:<place>` (`pe:2026-12-24:free`), one record per place holding all its moves [P2]; a period started without the pay `ps:<date>` (`ps:2026-12-20`) [N5]. Everything a person types gets an ordinary id. A built id taken back with Undo is the same record marked `gone`; writing the same moment again is an edit of it.
- **Dates** are `YYYY-MM-DD` in the person's local calendar. All engine date maths is on whole day numbers [D8]. "Today" is worked out again whenever the app comes back into view. Times appear only in `at`.
- **Amounts** are whole minor units (integers): yen 1 is 1, peso 1.00 is 100. The currency table is the full ISO 4217 minor-unit table, shipped with the page (every active code with its decimals: 0 for JPY, KRW, VND, ISK and the others, 2 for most, 3 for BHD, IQD, JOD, KWD, LYD, OMR, TND, 4 for CLF and UYW; `rules/units_ref.js` holds it) [L units q1]; an unknown code is 2 decimals and the screen asks once. A typed amount with more decimals than its currency has is rounded half up and the screen says so [L units q2]. Nothing is rounded on load: a saved amount that is not whole is kept as it is and flagged [L units q9].
- **Currency** is an ISO code on every account, schedule, goal and budget line, and on every stored amount that is not on an account: `plan.shares` entries, `home.minBank` and `plan.limits` carry `cur` [O6]. The home currency is dated: `home.curs: [ { from, cur, at, by } ]`, the entry in force on a day being the latest dated on or before it [O6]. A change of home currency (someone working in Japan going home to the Philippines) starts a new entry; nothing is converted and history stays in its own currency, so old entries stay readable [O6, which replaces E2's "convert every amount"]. An account's own currency never changes once it has events. "$" and "¥" are asked, never guessed.
- **`at`** on every record is a hybrid clock: the larger of now and (the newest `at` this device has seen plus 1 ms), written as ISO with the time zone offset [D4]. A now more than a day ahead of the newest `at` this device has seen is held at that newest `at` plus 1 ms, and a warning says the device's clock is ahead [L merge q8]. The same holds a copy that arrives: every `at` in it more than a day ahead of the newest `at` the receiving device has seen is held at that point plus 1 ms, and the warning is shown [M4] (section 2.3). A held `at` is marked on the record as `held: { came, at }`, the `at` it came with and the `at` it was held at (a `steps` or `rules` entry carries its own mark; a shared `ui` key's mark is in `ui.held`), and an edit keeps the mark like any field. A record held once keeps its held `at`: a copy of it whose `at` is the mark's `came` is that same far-ahead write, so it counts at the held `at` and is never held a second time, and the fast device takes the held value when the merged copy comes back, so a later edit on the other device is never lost to it [N1]. A wrong clock on one device cannot always win. A record's `at` moves only when the record changes (an edit, a removal, a Redo); a merge keeps the winning copy's `at` [L merge q3].
- **`by`** on every record, with `at`: the device part of its last writer (section 0, Ids). On an equal `at`, after `gone` [H6], the larger `by` wins [L merge q1]. The id's device part still names the device that made the record. Each `steps` and `rules` entry carries its own `by` beside its own `at`, and each shared `ui` key has its `by` in `ui.by` beside `ui.at` [M5].
- **`told`** on every record [H1]: when the app first heard of it, as the same hybrid clock. It is set once, when the record is made, and never changed by an edit, an Undo, a Redo or a merge (a merge keeps the oldest `told` it sees for an id). A copy that arrives with a `told` more than a day ahead of the newest `at` the receiving device has seen has it held the same way as `at`, at that point plus 1 ms [N2]; as the oldest `told` is kept, a record keeps its first held `told` on both devices. It orders records that share a date: a check holds the events dated before its day and those on its day whose `told` is before the check's `told` (section 7.1). An import that replaces a typed line keeps that line's `told` [O1]; an unmatched import line, or a spend that logs itself written late, dated on a check's day or the setup day counts as inside that figure whatever its `told`, and a printed running balance (`src.bal`) decides the order instead when present (section 7.1) [O1].
- **Nothing is deleted.** Remove and Undo set `gone: '<date>'` and `goneBy: <id of the step or record that removed it>`, and move `at`. Redo clears both and moves `at` again, so the Redo is newer than the Undo [H6]. Undo is these marks; there is no full copy inside the saved data [D2].
- **Nothing is dropped for being out of range.** No fixed window; a date years back or ahead is kept as typed.
- **Unknown fields are kept** on load and save, arrays and objects too, so an older page never strips a newer field.
- **Every list record** (`plan.shares` entries, budget lines, schedules, goals, accounts, events, people, check-ins) has `id`, `told`, `at` and `by`. Single records (`home`, `plan.limits`) have `at` and `by`. Each entry inside a `steps` or `rules` list carries its own `at` and `by` [L merge q2, M5], and is removed by its own `gone` with its own `at`, never by taking it out of the list [M3]; each shared `ui` key has its `at` in `ui.at` and its `by` in `ui.by` [L merge q6, M5]. Any of them that was held on arrival also carries its `held` mark (for a `ui` key, in `ui.held`) [N1].

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
  rev, at,                    // revision (max(now, rev + 1)) and when saved; after a merge, the larger of both revs plus one [L merge q3]
  home: { curs: [ { from: '2026-12-11', cur: 'JPY', at, by } ], country: 'JP', mode: 'track',
          minBank: null | { a, cur }, mainBank: <account id>, at },   // [O6] the home currency dated; [O4] mainBank
  people: [ { id, name, at } ],
  accounts: [...],            // section 3
  places: [...],              // section 4 (goals and the other kept places)
  schedules: [...],           // section 5
  events: [...],              // section 6 (stored one per record, section 1)
  checkins: [...],            // section 7
  plan: { shares: [...], budgets: [...], limits: {...}, at },   // section 8
  imports: { cats: {...}, at },  // what the person taught the statement reader (38.31 ui.cats)
  ui: { ..., at: { <key>: <at> }, by: { <key>: <by> }, held: { <key>: { came, at } } },   // shared screen choices only (section 11, "shared ui"); `ui.at` and `ui.by` hold each key's `at` and `by` [L merge q6, M5]; `ui.held` a held key's mark [N1]
  frozen3831: '<the 38.31 copy exactly as stored: the raw text, read only>'
}
```
- `home.mode`: `'track'` (Free to spend is a place) or `'wallet'` (Free to spend is handed out of tracked accounts), as in the ledger. Track by default.
- `home.curs` [O6]: the home currency, dated. Each entry holds from its `from` to the next entry's; the first is from setup. A day before the first entry uses the first. Entries merge by `from` like `rules` entries (each with its own `at` and `by`).
- `home.minBank`: the minimum for the main bank, `{ a, cur }` [O6]. Null means no minimum. Setup asks once, with no amount filled in (MAKO M1, recommended).
- `home.mainBank`: the account that pays cards and bills by default, takes `home.minBank` [B8, A8], and holds every budget line and the Free to spend share that names no account [O4].
- `home.country` picks the holiday table and the bank-closed table [F17] for every account that has no `country` of its own (section 3).
- `frozen3831` is the raw stored text of the 38.31 copy, never a cleaned copy: both builds' cleaners drop data (receipts beyond 5,000, model.js) and 38.28's writes ₱ into a copy with no currency [O].

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
Union of every list by `id`; per record the newest `at` wins. A copy with `gone` wins only against a copy of the same record whose `at` is the same or older; a Redo (a newer `at` without `gone`) wins over the Undo it reverses [H6]. On an equal `at` with both alive, the larger `by` wins [L merge q1]. Inside the winning record, `steps` and `rules` entries merge by `from`, each by its own `at`, so two devices adding different steps keep both [L merge q2]; an entry is settled the way a record is: the newer `at`, then on the same `at` the one with `gone`, then the larger `by` [M3, M5]. A removed entry keeps its `gone` in the list, so the other copy cannot bring it back [M3]. Shared `ui` merges key by key, by `ui.at`, then on the same `at` the larger `by` in `ui.by` [L merge q6, M5]. Before merging a copy that arrives, the receiving device holds every `at` in it more than a day ahead of the newest `at` it has seen, at that point plus 1 ms, marks it `held: { came, at }`, and shows the warning [M4, N1]; `told` is held the same way [N2]; a device that has seen nothing holds nothing. A record held once keeps its held `at` [N1]: when two copies of the same thing meet and one carries a mark whose `came` is the other's `at`, the other counts at the held `at` and takes the mark. So the same far-ahead copy arriving again is not held a second time (and shows no new warning), and the fast device takes the held value when the merged copy comes back, so a later edit on the other device wins on both. An edit newer than a removal brings the record back, and the next check-in shows it as "came back" [L merge q4]. `told` is never taken from the winning copy: the earliest `told` seen for the id is kept, and a copy with none takes the other's [H1, L merge q7]. The merged copy's `rev` is the larger of both plus one; a record's `at` moves only when it changes [L merge q3]. On a cloud conflict the page downloads, merges, and sends again with the server's version as its base; it never asks "keep mine". Period-end answers of two places that each device allowed can add up to more than is left once merged: the newer one gives way (section 7.4) [P3]. The same amount typed on two devices on the same day for the same place is offered to the person as a possible double [H9]; the merge itself never removes either (section 6.4). The merge has its own test file (section 12).

## 3. Accounts
```
{ id, name, type, cur, owner, open: <event id>, minBank, spendFrom, tracked, closed, preset, confirm,
  postingDays,               // working days the account needs to post a line; default 1, a card 7 [F4, L matching q4]
  country,                   // its own holiday and bank-closed tables; left out: home.country [O]
  gone, at }
```
- `type`: `bank`, `cash`, `ewallet`, `wallet`, `investment` [B10], `card`, `paylater`, `loan`, `owedToYou`.
- `owner`: a `people` id, or null for shared.
- `minBank`: this account's minimum, `{ a, cur }` in the account's currency. Null: the main bank takes `home.minBank`, any other account has none.
- `country` [O]: the account's holiday and bank-closed tables: a Japanese bank and a Philippine e-wallet each move their own items, card payment days and posting windows by their own country. Left out: `home.country`.
- `spendFrom`: may safe to spend count this account's headroom. Default true for bank, cash, ewallet, wallet; false for investment, owedToYou and an account that backs a goal (`keptIn.mode 'ownAccount'`).
- `tracked`: false only for the Wallet-mode wallet (ledger).
- `closed` (date), `preset` (a presets file id, names only), `confirm` (set by the move: ask at the first check-in), as in the ledger.
- **Close, never delete** [O]. An account with history is closed, not removed: closing writes a final `check` (its final figure) and sets `closed`; its events stay, so the bank's history and the places it counted in never change. Only an account with no events (an Undo of adding it) is ever marked `gone`.
- **Closing** [P6]. An account is closed only when its final figure is zero, or is moved out by a `transfer` the closing asks for (to another account, dated the closing day, written with the final check). Otherwise the closing is refused and the screen shows what is still in it; nothing is written. Its schedules end on the closing day: each schedule paid from it, landing in it, or a transfer into it gets `ends` set to that day, unless it already ends on or before it. From then on the account holds nothing, has no minimum and is not counted in safe to spend. Rules file: `rules/accounts.json`. (A card or loan with something owed, a bank below zero, the account a card is paid from or a place is kept in, and a 38.31 account already closed with money in it are not decided, section 14.)
- **investment** [B10]: holds checks like a bank; its value may move on its own between checks (the gap is a market move, not a filler). Not counted in safe to spend (`spendFrom: false`).

**Owed accounts (card, paylater, loan) own their payment day** [B5, E6, 10.8]. There is no separate schedule for a card or loan payment.
- **card**: `inFull` (true unless it carries a balance; a card that carries one pays its `minRule` plus its `extraSteps` each payment day, and the rest is carried to the next statement [H7]), `cutDay` (1 to 31, `'last'`, or null for "not sure": then on each payment day everything owed, less payments since, is due [H4]), `payDay` (1 to 31), `payMonths` (months after the close the payment falls; 1 by default, 0 for a card paid the same month), `shift` (`'before'|'after'|'none'`; from the country by default), `payFrom` (the account that pays it; `home.mainBank` by default), `apr`, `minRule` (`{ pct, floor }` or `{ fixed }`), `of` (for an older balance or an instalment plan: the card's id), `extraSteps: [ { from, amount } ]` (planned extra payments; 38.31 debt `extra`) [B5], `cashApr` (the yearly rate on cash taken on the card; stored now, used in stage 2) [O5].
- **Money out of a card** [O5]: a `transfer` or `borrow` out of a card (a cash advance into the bank, cash taken at an ATM, a closed card's credit sent back to the bank) is a card line: what is owed moves by it and the next payment follows. A credit sent back brings what is owed back to zero.
- **A card statement** [H3] is what was carried over from the last statement, less the payments and refunds since its close, plus the lines posted in the cycle. Paying a statement in part leaves the rest in the next one. A statement at or below zero is a credit carried to the next one: nothing is due and no expected item is made. **Carried over** is only what is left of statements not paid by their own payment day [I3]: a statement still waiting for its payment day (a card paid two months after its close, common in Japan) is never folded into the next one, so two statements can wait at once, each with its own item. When two statements are unpaid at once, each item asks only for what the older one does not already hold, so nothing is counted twice. **Payments** [I3, confirmed in J]: a payment goes to the statement it settles (or the one that statement was carried into), then to the oldest statement still owing, then to the open cycle; so the on-time payment of a statement that was waiting does not lower the next statement to close, and a late payment of a statement already carried lowers the statement it was carried into. A statement item asks what is left of the statement after payments that settled no item, not the printed figure. **Interest** [I2]: at each close, on what is carried over after payments (a credit carries none), `apr` / 12, rounded half up to the minor unit; it is part of that statement. The look ahead adds the interest the next close will charge on what stays carried after the planned payments to the card's next open payment [confirmed in J]. **Close day not sure** [H4]: each payment day is an expected item for everything owed then (less payments since), with or without a typed last statement; after each payment the next payment day gets its own item. Such a card that carries a balance gets its interest on each payment day [J1], `apr` / 12, rounded half up, added before that day's payment, and on a payment day gone by even when its payment is not seen (as on a loan). It is on everything owed before that day's payment, spending since the last payment day included [K1]. With a percent `minRule` the day's interest is added first and the minimum is worked out on the balance including it, in the look ahead too [K2].
- **A card paid from an account in another currency** [H5]: each payment carries `a` (what left the paying account, in its currency) and `a2` (what reached the card). Until stage 2 the walk does not take the card's payments off the paying account (it cannot convert, F11) and Home shows a warning under the headline; a recorded payment takes its typed `a` off the paying account.
- **paylater** [F19]: `payDay`, `shift`, `payFrom`, `instalments: { amount, count, first }` (the buy is a spend on this account; each part is a repay from `payFrom`), `apr`, `ends`, `of`. What is still to come is shown as owed.
- **loan**: `payDay`, `shift`, `payFrom`, `amount` (the usual payment), `apr` (yearly rate in percent; on a loan or pay-later, interest is added on each payment day on what was owed before that day's payment, x `apr` / 12, rounded half up [I2]; it is added first and the payment asked after it, and it is added on a payment day gone by even when the payment is not seen [confirmed in J]), `minRule`, `ends`, `extraSteps`, `of`. Each payment day asks the usual `amount`, or what `minRule` asks on what is owed, plus the `extraSteps` amount in force on that day, never more than what is owed [H7]. A 38.31 "Loan or debt payment" bill line is matched to the loan at the move (or dropped with the person's OK), never both [E6].
- A day 29 to 31 falls on the month's last day in a shorter month, for every day field [10.8].

**Opening** [B6, B7, H1]. Every account opens with one `open` event and a `check` the same day, written together in the first check-in; their `told` is the moment setup saved them. A bank opens with one figure, split by place: what is kept for goals and the other kept places in it, what is left of this period's budget lines and Free to spend [B2], and the rest in Waiting. Goal money is a place inside the bank, never a second open [B6]. A card opens with a check of what is on it now, and when known a check with `stmt: true` for its last statement (its close date and whether it was paid). A card may hold several unpaid statements at the opening (a card paid two months after its close, set up between a close and the older statement's payment day) [J5]: each gets its own `stmt: true` check with its amount, close date (`stmtDate`) and payment day (`stmtPay`), and each is its own expected item on that payment day (with the card's weekend rule). None of them is folded into another; the next close after the opening holds only what was posted since the latest of them [I3].

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
- **A place removed with money in it** [O] first writes a `move` of what it holds to Waiting, then is marked `gone`; the money is never left in no place. **To place** [P1]: that move carries `toPlace: true`. The money it moved stays out of safe to spend (held in the walk like a kept place, its `why` line "<name>'s money, in Waiting to place") until the person places it. Placing writes a `move` out of Waiting into a place with `placed: <id of the toPlace move>`; what is still to place is the `toPlace` move's amount less the moves that name it, and placing moves the money, so the headline does not change. A move out of Waiting that names no `toPlace` move comes from Waiting's other money. (Whether the person can also place it in Waiting itself, or in Free to spend, so that it counts, is not decided, section 14.)

## 5. Schedules (pay, bills, transfers, spending that logs itself)
```
{ id, kind: 'income'|'bill'|'transfer'|'autoSpend'|'once',
  name, acct, acct2,          // acct: where it lands or is paid from; acct2: the other side of a transfer
  owner, cur,
  rules: [ { from: '2026-11-20', rule, at } ],               // [H2] each rule holds from its date to the next one's; each entry has its own `at` [L merge q2]
  // rule: { every: 'month', days: [10] }                     // days of the month; 31 = last day
  //     | { every: 'weeks', n: 2, from: '2026-11-13' }       // every N weeks from a date (weekly: n 1)
  //     | { every: 'months', n: 3, day: 5, from: '2026-12-05' }
  //     | { every: 'monthsList', months: [6, 11], day: 15 }
  //     | { every: 'year', date: '05-31' }
  //     | { every: 'lastWorkday' }                           // the month's last working day; never moved
  //     | { every: 'once', date: '2027-03-14' }
  //     | { every: 'none' }                                  // no fixed day: no future money expected [B4]
  shift: 'before'|'after'|'none',
  steps: [ { from: '2026-11-23', amount: 250000, at } ],      // the usual amount, changing from a date (a raise); its own `at` [L merge q2]
  byDay: { '15': 18000, '30': 12000 },                         // unequal halves on different days
  amounts: { '2027-06-10': 260000 },                           // one occurrence changed, keyed by the due date BEFORE any move [B8]
  vary: 0.3,                                                   // the amount margin for matching, for example power and water [A6]; none: the exact amount only [L matching q1]
  startsPeriod: true,                                          // income only; see below
  place: 'bills'|'free'|<place id>,                            // where a bill is paid from
  roughAll: true,                                              // the "all my bills, roughly" line, split later [A8]
  from: '2026-11-23', ends: null, count: null,                 // first occurrence, last date, or a number of occurrences; closing its account sets `ends` to the closing day [P6]
  redirect: <place id>,                                        // where the money goes after `ends` (38.31 line redirect)
  gone, at }
```
- **Rules from a date** [H2]. A change to when something happens (pay moves from the 10th to the 25th) adds a `rules` entry from a date; it never edits an older entry, so no occurrence before that date is rewritten or made up. An occurrence due on or after an entry's `from`, and before the next entry's, comes from that entry. A change to how much adds a `steps` entry the same way.
- **Occurrence names** [H2]. An occurrence is named everywhere by its schedule and its due date before any move: `{ s: <schedule id>, due: '2027-01-10' }`, written `pay1@2027-01-10` on screens and in tests (it lands on Fri 8 Jan). Settled links, `amounts` keys, expected item ids and the check-in list all use this one name. A5's sequence number is dropped. The edit screen lists the settled occurrences that the new entry would make again before it saves.
- **One stream starts periods** [F12]. At most one income schedule has `startsPeriod: true`. A couple picks it; the default is the first entered. Others (a second job, a partner's pay) are counted in the walk but start no period.
- **Pay is never blank** [A8]: setup asks for the next pay date and assumes monthly when nothing else is said. `every: 'none'` is chosen only by a person who says there is no fixed day.
- **transfer** moves money between two own accounts on a day (a top-up from the bank to an e-wallet); **autoSpend** writes its own spend event on the day it lands, with `settles` naming its occurrence, unless something already settled it (38.31 `plan.recurring`). Its id is `auto:<schedule>@<due>` [O2], so two devices writing it make one record. Its `told` is when it was written (the next time the app was opened); dated on a check's day or the setup day, it counts as inside that figure [O1]. It is never on the check-in list. Both are in the walk [B5, H7]. A transfer between two currencies carries `a` and `a2` [H5].
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
  src: { type: 'typed'|'statement'|'screenshot'|'move', file, line, from, to, bal },   // [A6]; a statement's `from` and `to` are the dates it covers [L matching q8]; `bal` the running balance printed after the line, when there is one [O1]
  notDouble: [ <event id> ],  // the person said "both are real": never offered as a possible double with these; on the newer record [L matching q12]
  grp,                       // the check-in (section 7) or the one step it belongs to
  owner,                     // only when different from the account's owner
  held: { came, at },        // only on a copy held on arrival: the `at` it came with and the `at` it was held at [N1] (section 0)
  toPlace: true,             // on the `move` to Waiting written when a place with money is removed: that money is "to place" [P1] (section 4)
  placed,                    // on a `move` out of Waiting that places money to place: the id of the `toPlace` move [P1]
  note, gone, goneBy, at }
```

### 6.2 Kinds (`k`)
The ledger's kinds and its one rule stand: `open`, `in`, `borrow`, `move`, `spend`, `hand`, `transfer`, `convert`, `repay`, `check`, `adjust`. Added:
- `skip`: an occurrence that did not happen this time (no pay this month, a bill waived). It carries `settles`.
- `periodStart` [N5]: a new period the person started without the pay (section 7.4): `{ k: 'periodStart', date }`, written by the person's choice at the check-in, with the usual `id`, `told`, `at` and `by`. Its `date` is the day they chose; it moves no money. Undo marks it `gone` like any record, and then it starts nothing.
- `filler`: the rest of the spending in a stretch (section 7.3). It carries `stretch: { from, to }`, `place`, `split: 'days'|'before'` and **no stored amount** [A3].
- A check carries `typedA` and, on a bank, `avail: 'available'|'current'`; on a card, `stmt: true` with `stmtDate` when it is the statement figure, and at the opening `stmtPay` (its payment day) when it is one of several unpaid statements [J5]. An "available" check already has pending debits off, so it holds every event dated before its day, posted or not, and those on its day told before it; a "current" check follows the posted dates (section 7.1). Not asked: "current" [I1, J3].
- `a2` [H5]: on a `repay`, `transfer` or `convert` between two currencies, `a` is what left (in the paying account's currency) and `a2` what arrived. Between two accounts in one currency `a2` is left out.
- `adjust` stays only for a person's explicit "accept the difference" outside a check-in (rare). A check-in never writes an adjust.
- `borrow` [O5]: cash taken on a card (`acct` the card, `acct2` where the cash went). It and a `transfer` out of a card are card lines (section 3).
- An `in` that is a refund may carry `line` [O]: only when the person picks the budget line it goes back to; it then gives back to that line's spent so far. A refund with no `line` lowers the card or raises the account and gives nothing back to any line (the safe side).

### 6.3 Receipts are spend events
One list. A 38.31 receipt moves in as `{ k: 'spend', date: r.d, a, acct, line or place, src: { type: 'move', id: r.id }, note }` (section 11).

### 6.4 Matching an import to what is already there [A6, F15, L]
- **What matches.** An import line matches a typed line or an expected occurrence by account, direction (money out with money out), amount and date. Rules file: `rules/matching.json`.
- **Amount.** A typed line: exactly, or when it is `est`, within 10% of the larger amount, |a - b| x 10 <= the larger, compared exactly in minor units [H9, L q10]. An expected occurrence: within its schedule's `vary`; no `vary` is the exact amount, and a different real amount is ticked by the person at the check-in [A6, L q1].
- **Date.** A typed line matches an import line posted inside its account's posting window either side of the typed day (`postingDays` working days before to the same after) [F4, L q3]. A bank line goes by `posted` when there is one; a card line by its buy date or its posted date, and a card's window is 7 working days by default [L q4, M1]. An expected occurrence is settled by an import landing from 5 working days before its landing day to the end of its posting window after it [L q2].
- **Which one.** A typed line is tried before an expected occurrence: the typed line wins, is replaced (`gone`, `goneBy: <import event id>`), and the import takes over its `settles` [L q5, q6] and its `told` [O1], so a check that held the typed line holds the import. Several match: the closest date wins, then the earliest `told` [L q7].
- **Rank.** Statement over screenshot over typed (`src.type`). A statement removes every screenshot line inside its own dates (`src.from` to `src.to`), matched or not, `goneBy` the statement import's id [A6, L q8]. A screenshot read after the statement, inside its dates, that matches no statement line is removed too, `goneBy` the statement import; one that matches a statement line goes `goneBy` that line [M2]. An import line of equal rank that repeats a live line is dropped, never added: the same line id (date, amount, direction and its count among such lines in its own import) or the same `src` (a file read twice) [L q9].
- **Possible double** [H9]. The same amount typed on two devices on the same day (the spend's date [L q13]) for the same place (a budget line counts as the place [L q11]) is offered to the person; nothing is removed without them. "Both are real" is kept as `notDouble: [id]` on the newer record, and the pair is not offered again [L q12].
- An import line that matches no typed line settles the expected occurrence it matches (above); one that matches neither is a new line.

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

**What a check holds** [H1]. A check holds the events dated before its day, and those dated on its day whose `told` is before the check's `told`. A spend logged after a same-day check (lunch after the morning check-in) comes after it. A bank event with `posted` is held by its posted date, so a debit bought on the 21st and posted on the 24th is not inside a check on the 22nd and still comes off. That is a "current" check. An "available" one already has pending debits off, so it holds every event dated before its day by that date, posted or not, and on its day those told before it [I1, J3]. A spend told after a check comes after it, whatever the check kind [J3]. Two check-ins on one day: the later one's stretch starts at the earlier one.

**Lines the app hears of late** [O1]. An import that replaces a typed line keeps that line's `told`. An import line that replaces no typed line, and a spend that logs itself written late, dated on a check's day (by the day the check goes by: posted for a current check) or on the setup day, counts as inside that figure, whatever its `told`: so a statement read a week after a check-in shrinks that check's filler instead of lowering the bank. When the statement prints a running balance (`src.bal`), it decides instead: the lines of that day up to the one whose balance is the check's figure are inside the check, the rest after it (when the balance before the day's first line is the figure, none is inside). An import that settles an item setup was told had not gone out yet stays outside the opening [F20].

### 7.2 Settling first [A2, F16]
The check-in first lists every expected item (pay, card payments, bills, transfers) that landed since the last check-in and is not settled, ticked by default, amount editable. Ticking writes the event, with the id `set:<occurrence>` [O2], so two people ticking the same pay on two phones make one record (the newest `at` wins): pay writes `in` with `stream` and `settles` (that starts the period); a card payment writes `repay`; a bill writes `spend` with `settles`. A different real amount settles the occurrence at the real amount and does not change later estimates unless the person ticks "use this from now on", which writes a new `steps` entry [F16]. The reference model's `checkIn.toConfirm` is that list.

### 7.3 The filler [A3, A4, F15]
What is left after settling is the filler for the stretch from the day after the last check-in to this one (from the same day, when the last check-in was earlier that day [H1]). Its amount is never stored: it is worked out each time as (what the events say the account holds at the check) minus (the check figure). Lines imported or typed later inside the stretch shrink it (section 7.1, O1). A stretch that crosses a period start is split by days, or all to the older period when the person says "mostly before pay" [A4]. On a card, a check that names a statement fills that statement's cycle first, then the open part. Reference: `makeFiller` and the card check in `cardInfo`.

**A large gain is asked about** [O]. When a check-in figure is above what the app had for the account by more than the period's Free to spend, or by more than 20% of what the app had (a bank figure typed into the e-wallet's box), the check-in asks whether the figure is right; the gain is not placed in any place until answered. The figure stands as the account's bank figure meanwhile. Reference: the `gain_to_ask` warning.

### 7.4 Period end [A7]
The period-end question (always asked) comes when the next period-starting pay is seen [L period_end q2], and runs after a fresh check-in: if none is dated in the last 3 days of the period or after its end (whose stretch is split by days at the pay, A4) [L q1], the question starts with one. A check-in is fresh only when every spend-from account was typed [L q9]; the check-ins of the last 3 days count together, so the bank typed on one day and the cash on another is fresh [M6]. While pay is late the period waits for it; after its posting window the check-in asks "did your pay come?", and a yes with its day starts the new period [L q3]. A new period the person starts without the pay is saved as a `periodStart` event dated the day they chose, id `ps:<date>` [N5, O2]; the new period starts on that day, and the old one ends the day before; the late pay stays expected until its posting window ends, then is "not seen yet" [M7]. The first live `periodStart` dated after the period's first day ends it; one on or before that day is what began it. Money left in Free to spend or a budget line never rolls on silently: it waits in its place marked "to decide" until answered, and "to decide" money is not in the new period's safe to spend [L q7]. Answers are `move` events dated the period's last day. **One record per place** [P2]: a place's answer is saved as one record, id `pe:<period last day>:<place>` [O2], holding all its moves, `{ place, moves: [ { to, a } ], told, at, by }`; a split leftover (part to a goal, part kept, part to Waiting) is several moves in that one record, a move to the place itself is "keep it here", and an overspent line's record holds its covers as `{ from, a }` (a cover is saved under the line it covers). So the same place answered on two phones is one record, and the merge keeps the newer record whole, never mixing moves from two. The refusal below is checked again on the merged answers [O2]. **After a merge** [P3]: when answers of different places add up to more than is left, the answer with the newer `at` among those giving from that place gives way: its moves are undone (the record is marked `gone`, `goneBy` the answer kept), and the next open of the device that wrote it says "An answer from your other device was used. Check it." Repeated until nothing is refused; answers that take nothing from that place stay, however new; "keep it here" writes no move, the money stays in its place and the next period's amount adds on top [L q6]; answers adding up to more than is left are refused, with the amount left shown [L q10]. An overspent line is shown with how much it is over and is covered from what is left in Free to spend, then Waiting, as the person picks (moves into it) [L q4]. With nothing left anywhere the screen shows one line, "nothing left this time", and asks nothing [L q5]. Two unanswered period ends stay apart, each answered with its own last day [L q8]. **Found later** [O, P5]: an old statement imported after a period-end answer leaves the answer as it is; its spending dated in that period comes out of what still waits to decide first, and never out of the money kept for the next period; what the answers gave beyond what was really left is shown at the next check-in as an overspend "found later". There the person picks where it comes from: Waiting or this period's Free to spend, in any split. Each pick is a `move` from Waiting or Free to spend into the place, dated the check-in day. A pick from anywhere else (the kept money included), or picks adding up to more than was found later, are refused. Rules file: `rules/period_end.json`.

## 8. The plan (what is expected)
- **`plan.shares`**: `[ { id, from, cur, acct, per: { free: 'month', edu: 'month', ... }, free, edu, give, ffa, goals: { <place id>: amount }, at } ]`. Each entry holds from its date to the next. `per` is per amount [B8]. `cur` is the currency of its amounts [O6]: a change of home currency starts a new entry, and the older entries keep their own. `acct` is the account Free to spend is held in (default `home.mainBank`) [O4]. A change never moves anything dated before it.
- **`plan.budgets`** (budget lines: food, transport, other card spending, custom lines): `[ { id, name, place: 'bills'|'free'|<place id>, cur, acct, per: 'month'|'pay'|'week', steps: [ { from, amount } ], once: { <period start date>: amount }, at } ]`. `place` may be any place, so 38.31 custom lines in Education, Giving or Investing keep their home [B8]. `once` is a one-period override [B8]. A spend carries `line`.
- **Which account a line is on** [O4]. `acct` on a budget line and on the Free to spend share says which account its money is held in; left out, `home.mainBank`. Spent so far counts a line's spends on every account (food bought on the card counts against Food). What is left of a line is reserved from its account; a line on a card is reserved from the card's paying account, and the spends already on the card come off with the card's payment, so the money is counted once (final_review_1 finding 4: the line on the bank took food off twice, the line on the card never). An opening split for a card's line is part of its paying account's split.
- **Units** [10.4, H9, L]: a period gets the amount when `per` matches its kind; `month` with pay that is not monthly gets amount x 12 / the real number of pays in that year (26 or 27 for pay every two weeks, 52 or 53 weekly), so the year adds up exactly, the leftover minor units going to the earliest pays of the year [L units q4]. The count is by the unshifted due date's year, and a period that crosses 31 Dec uses its start year [L q3]; a period gets the amount of the pay that starts it: that pay's place in its own year's list, the year by its unshifted due date [N3], so a period that starts on 31 Dec with its pay due 1 Jan (moved earlier) gets the next year's first amount (N3 replaces M8 here); a schedule's first year counts by its rhythm [L q5]; a schedule whose rule changes during the year (pay every two weeks, then monthly) counts each due date by the rule in force on it [O], and **each rule gets its own months** [P4]: a monthly amount covers the months each rule is in force in that year (the first rule from 1 Jan), spread over that rule's pays, the leftover minor units on that rule's earliest pays, so the year adds up to 12 months (two-weekly January to June: 6 x 50,000 = 300,000 over 13 pays, 23,077 or 23,076; monthly July to December: 50,000 each; 600,000 in the year). (A rule that starts on a day other than the 1st is not decided, section 14.) N3's "the pay that starts it" means that pay's due-date year [O, O-confirm]: units-50 is 11,556. `week` gets days x amount / 7, rounded down per period; weekly amounts are a rate and need not add up to a year [L q6]. With no fixed pay, budget lines and Free to spend come off by day: the monthly amount x 12 / the year's days (365 or 366) a day, rounded down, with the remainder on the month's last day, so each month comes to its own share rounded down and nothing carries to the next month [M10]; `per: week` gives a seventh of the week's amount each day, rounded down, with the remainder on the week's last day [M9], and a week ends on the seventh day counted from when the line started (the start is day 1), not on a fixed weekday [N4]; `per: pay` means each money-in event [B4, L q7]. The reference model keeps a plain form (52 / n pays a year, each period rounded on its own); the engine uses the units rules [L q8]. Units have their own test file (section 12).
- **`plan.limits`**: `{ ceiling, aims, cur, at }` (38.31 `cfg.ceiling`, `cfg.aims`); `cur` is the currency of its amounts [O6].
- **Opening mid-period** [B2, I4]: the opening asks "spent since pay day?" for Free to spend and each budget line, or shares them by days left, and writes those as the places' opening split. Days left: from the setup day to the period's last day, both counted, over the period's days; each line rounded down to the minor unit; Free to spend is its own share plus the lines' rounding leftovers, then rounded down, and a total under one minor unit stays in Waiting [confirmed in J]. When the person typed Free to spend, that figure stands and the lines' rounding leftovers stay in Waiting [J4].
- **Planned goal set-asides are not money yet** [F22]: only `move` events into a place count.

## 9. Periods (a view, never stored)
A period runs from the day the period stream's pay lands (early or late) [F8], or from a `periodStart` event's date [N5], to the day before the next one. **Late pay** [H8]: a pay past its date but inside its account's posting window is "late, expected". It still counts in the walk (on today), the period does not move on, and days to next pay says the pay is late. After the window it becomes "not seen yet" and stops counting. Its name on Home is its dates. When the person starts the new period without it, a `periodStart` event is saved and the period starts on its date [N5]; the pay keeps the same states, late and expected until the window ends, then not seen yet [M7]. With no fixed pay the period runs from the last money in, and the engine gives "lasts about N weeks" [B4]. Changing the pay schedule moves no event; it only regroups them.

## 10. Platform checks that belong to the shape
- A test runs the engine under `TZ=America/Los_Angeles` and `TZ=Asia/Tokyo`, and a check fails on `new Date(<date string>)` or a "now" sliced from `toISOString` in engine files [D8].
- A speed test times a 30,000-event copy under 4x CPU slowdown and fails above its budget [D8].
- A check run that prints a mismatch or a failure is a failure (LESSONS lesson 2).

## 11. Moving a saved copy [E1, E4, E6]
The move is proved on every old build Mako's data can be in: 38.28 live and every build from 25.0 to 38.28, not only 38.31 [E1]. Every typed figure, receipt and goal is accounted for, and a test lists any field it could not place. The bank comparison Mako sees before deploy is redone on the new engine. The any-AI paste format and its checker write this shape [E4].

The move reads `frozen3831`, the raw stored text, never a copy that a build's clean-up has already rewritten [O].

**Questions the move asks once** (until answered, a banner asks and the engine uses the safe side): the currency code when the symbol is "$", "¥" or unknown, when the copy has no currency at all, or when it holds ₱ with preset `legacy` or no preset (38.28's clean-up writes ₱ and `legacy` into any copy without a currency, so that ₱ is not a choice) [O] (asked before any amount is converted to minor units; never set to pesos [H9]; `rules/units.json` units-63 to units-66); when each pay comes in (until answered, no future pay is counted); when each bill is due (until answered, due on the period's first day); which loan a "Loan or debt payment" line is [E6].

### 11.1 Every 38.31 field and where it goes
| 38.31 field | Target |
|---|---|
| `v`, `rev` | replaced by `v: 3`, `rev`, `at` |
| `steps[ym]` (monthly amounts by month) | `plan.shares` and `plan.budgets[].steps` entries from that month's first pay; `debt:<id>` keys become `extraSteps` on that loan or card |
| `once[ym]` (one month's amount) | `plan.budgets[].once` for the period starting in that month |
| `items[ym]` (one-off costs) | `schedules` with `kind: 'once'`, `rule: { every: 'once', date: <first day of ym> }`; in the move month (a date before the opening) the date is the first day after the opening, so it is due, never treated as paid [H9] |
| `cfg.bankStart`, `cfg.bankAt` | a dated bank `check` (the opening when it is the oldest figure), told at `bankAt`; a `bankStart` with no `bankAt` is dated to the copy's last saved day [H9] and told at the copy's last save [J2] |
| `cfg.bankNow`, `cfg.bankNowAt` | a dated bank `check`, told at `bankNowAt`; a `bankNow` with no `bankNowAt` is dated to the copy's last saved day [K3] and told at the copy's last save [J2]; the newer of the two opens the bank when it is newer |
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
| `receipts[]` `id, d, a, c, cn, n, s` | `spend` events (6.3): `c` becomes `line` or `place`, `cn` and `n` the `note`, `s` the `acct` when it names an account, else kept in `note`. Its `told` is its own time when it has one, else the start of its day [I5, J2], so a receipt with no time dated on or before the moved bank figure's day is inside that figure (B7); one with its own time on that day is inside it when its time is before the figure's `told`. At the same moment, moved receipts come before moved figures [J2] |
| `cards[]` `id, name, owed, payDay, at` | `card` accounts with `payDay`, `cutDay: null`, `inFull: true`, opened with a check of `owed` dated `at` |
| `ui.accts` | accounts (names and types) |
| `ui.sweep` (month-end answers) | `move` events dated the period's last day when after the opening; earlier ones stay in `frozen3831` |
| `ui.keep`, `ui.keeps`, `ui.preSplit` (Undo copies) | not moved (frozen3831 only) [D2] |
| `ui.cats` | `imports.cats` |
| `ui.name` | `people[0].name` |
| `ui.cur`, `ui.preset` | the first `home.curs` entry (by the one-time question when ambiguous: "$", "¥", unknown, none, or ₱ with preset `legacy` or none) [O6, O] |
| `ui.main` | shared `ui.main` (the place shown first) |
| calculator inputs `ui.loans`, `ui.subP`, `ui.subO`, `ui.subs`, `ui.cardT`, `ui.cardB` | shared `ui` as they are |
| `ui.limits`, `ui.noDebts`, `ui.askNums`, `ui.win`, `ui.done`, `ui.sb`, `ui.bd`, `ui.more`, `ui.setup`, `ui.cleared`, `ui.src`, `ui.full`, `ui.home`, `ui.mcOk` | shared `ui` as they are (screen answers that follow the person) |
| `ui.wk` (weeks the app was used) | device `opens` [E9] |
| look, sound and tour: `ui.mute`, `ui.music`, `ui.vol`, `ui.dj`, `ui.scene`, `ui.tourAt`, `ui.toured`, `ui.onb`, `ui.seen`, `ui.ms`, `ui.mcSeen`, `ui.vaultSeen`, `ui.imp`, `ui.bk`, `ui.bkLater`, `ui.sampleHidden`, `ui.exactHidden`, `ui.remindHidden`, `ui.moreBillsHidden`, `ui.rcCat`, `ui.rcFreq`, `ui.rcDom`, `ui.rcDay`, `ui.rcTime`, `ui.gset`, `ui.movedIn`, `ui.noMove` | device `look` and `tour` as they are [D3] |
| any field not listed | kept as is: on the shared `ui` if it was under `ui`, else in `frozen3831`, and the move test lists it |
| the whole copy | `frozen3831`, the raw stored text, never written again [O] |

Sample data lives apart from the person's data and is never moved as real (requirements 1c).

## 12. The money rules: see the reference model
Each figure below is worked out by `foundation_review/ref/lookahead_ref.js`, function `lookahead(scenario, asOf, opts)`. The tags in the code name the decision behind each line. `node foundation_review/ref/run_scenarios.js` runs the 368 hand-worked asks; all must pass. `node foundation_review/scenarios/check_specs.js` checks that every ask's `why` adds up.

| Figure | In the result | Decisions |
|---|---|---|
| Bank today per account, with its age | `accounts[id].bank`, `.asOf`, `.ageDays` | A1, F24, B7, H1, I1, I5, J2, J3, K3, L (an import replacing a typed line), O1 (an import read late keeps the typed line's `told` or counts inside its check's day; `src.bal`), O5 (`borrow`) |
| Safe to spend, per account | `accounts[id].headroom`, `.lowest`, `.lowestDay`, `.why` (the sum a person can check) | B1, B2, B3, B4, B5, B9, F1, F2, F3, F14, F22, H5, H7, H8, I2, I3, I4, J1, J4, J5, O4 (a line's account, spends on every account, a card's line from its paying account), O (a refund given back to its line), P1 (money to place held), P6 (a closed account), SCHEMA 10.3 horizon |
| Safe to spend, the headline | `safeToSpend.headline`, `.shortfall`, `.oldestInput` | F9, B9, A1, G2, I4, J4, O4 (Free to spend on the main bank), O6 (the home currency in force) |
| Warnings | `warnings` (per account, under the headline, each with a `code`); `laterOn` (12 months) | F9, B11, H5, O (`gain_to_ask`) |
| Days to next pay | `daysToNextPay` (`late: true` while the next pay is late but inside its window) | F3, F8, F12, F13, H8, L (pay settled early by an import) |
| Due before next pay | `dueBeforeNextPay` (grouped by account; next 30 days with no fixed pay) | F7, F13, F21, F23, H8, P6 (a closed account's schedules end) |
| Not seen yet | `notSeenYet`; items still inside the posting window: `mayStillPost` | F3, F4, F23, G3, H8, L (settles moving to the import, early settling) |
| Each card's next payment, owed now | `cards[id].next`, `.owedNow`, `.statements` | F5, F6, F7, F18, H3, H4, H7, I2, I3, I6, J1, J5, K1, K2, L (a card line by its buy date), O5 (money out of a card), O (the card's own country) |
| Each loan's and pay-later plan's next payment, owed now | `owed[id].next`, `.owedNow` | B5, E6, F19, H7, I2 |
| Each place's money and when it is next due | `places[id].kept`, `.due`; a removed place's money still to place: `toPlace[id].amount` | B6, F22, E5, H7, P1 |
| Total, beside it, after the cards | `total.amount`, `.beside`, `.afterCards` | F10, F11, O5, O6 |
| The check-in list and fillers | `checkIn.toConfirm`, `accounts[id].fillers`, `cards[id].fillers` | A2, A3, A4, F15, H1, I1, I5, J2, J3 |
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
- `told` on records moved from 38.31, with and without their own times, on one day [I5, J2]: moved_records.json, moved_figure_no_time.json
- interest on each payment day of a card whose close day is not sure and that carries a balance [J1]: not_sure_interest.json
- a spend told after a same-day "available" check [J3]: avail_same_day.json
- an opening split that names Free to spend, the lines shared by days left [J4]: opening_free_typed.json
- a card opening with several unpaid statements, each with its payment day [J5]: two_month_opening.json
- a "not sure" card's interest on everything owed before the payment day, and a percent minimum worked out after the day's interest [K1, K2]: percent_min_interest.json
- a moved bank figure with no date of its own, dated to the copy's last saved day [K3]: moved_bank_now.json
- an import meeting typed lines and expected items: by direction, either side of the typed day, a card's buy or posted date with a 7 day card window, within 10% of the larger compared exactly, the closest date then the earliest `told`, the typed line's settle moving to the import, and an unmatched import settling a pay or bill up to 5 working days early [L matching q1 to q7, q10], a card's 7 counted in working days [M1]: import_rules.json
- a statement line read after a check-in or after setup: keeping the typed line's `told`, inside its check's day when unmatched, the running balance deciding the order; a self-logged spend written after a check [O1]: import_after_check.json
- a closed card's credit sent back, a cash advance, cash taken at an ATM as card lines; `cashApr` stored [O5]: card_out.json
- a line and Free to spend with no account on the main bank, spends on every account, a card's line reserved from its paying account, a refund given back to its line [O4, O]: line_on_card.json
- the home currency dated, history in its own currency [O6]: home_currency_dated.json
- an account's own country for its holidays [O]: country_per_account.json
- a large check-in gain asked about [O]: check_gain.json
- a goal removed with money in it: the money to place held out of safe to spend, placing part of it [P1]: goal_removed.json
- an account closed with its money moved out by the closing's transfer, its bill ending on the closing day [P6]: account_closed.json
- holiday and bank-closed moves, pay every two weeks, twice a month, weekly, no fixed pay, a couple, cash, an e-wallet, three weeks away, set up mid-month: the first eight files

**Rules not in the reference model** [H7]. Each is written in this document and has its own test file: hand-worked cases run by `node foundation_review/rules/run_rules.js` against a small reference beside it (`rules/<area>_ref.js`); all 240 must pass. Each file also lists the points the decisions leave open (`node foundation_review/rules/run_rules.js --open`); after P, units.json lists one and accounts.json three, all in section 14, with no case depending on them.

| Rule | Written in | Its own test file |
|---|---|---|
| Matching: the `vary` margin, statement over screenshot over typed, a statement removing the screenshot lines inside its dates, also those read after it, a card's 7 working days, repeats dropped, the possible double and `notDouble`, an import keeping the `told` of the typed line it replaces [H9, L, M1, M2, O1]. (Meeting a typed line and settling an expected item are in the model too, section above.) | 6.4 | `foundation_review/rules/matching.json` (57 cases) |
| The period-end question, fresh across the last 3 days' check-ins, a period started without the pay, read from its `periodStart` event, "to decide", keep, overspent lines, two ends apart, answers merged by their built id with the refusal checked again, one record per place holding all its moves, the newer answer giving way after a merge, an overspend found later never taken from kept money and covered from Waiting or Free to spend [A7, L, M6, M7, N5, O2, O, P2, P3, P5] | 7.4 | `foundation_review/rules/period_end.json` (47 cases) |
| Merging two copies: newest `at`, `gone` against same or older `at` only, Redo wins, `by` on a tie, `steps` and `rules` by `from` with their own `gone` and `by`, `ui.at` and `ui.by`, `rev`, earliest `told`, the clock held a day ahead on a write and on a copy that arrives, `told` held the same way, a record held once keeping its held `at`, ids built from what a record is, the 10-character session part [H6, H1, L, M3 to M5, N1, N2, O2, O3] | 0, 2.3 | `foundation_review/rules/merge.json` (61 cases) |
| Units: the ISO 4217 table, typed amounts rounded half up, `per` month, pay or week, 26 or 27 pays a year with the leftover to the earliest pays, a period getting the amount of the pay that starts it (31 Dec too), no fixed pay by day for a month and a week, a week ending on the seventh day from the line's start, the pay count by the rule in force on each due date, each rule its own months, the dated home currency, the move's currency question [H9, L, M9, M10, N3, N4, O6, O, P4]. (The model holds only the plain form, used by asks with monthly pay.) | 0, 8, 11 | `foundation_review/rules/units.json` (69 cases) |
| Closing an account: only at zero or with its money moved out by the closing's transfer, refused otherwise, its schedules ending on the closing day [O, P6]. (The model holds what a closed account then counts, account_closed.json.) | 3, 5 | `foundation_review/rules/accounts.json` (6 cases) |

Every rule that sections I to P decided is in the model with its own asks, or in a rules file with its own cases. Section 14 says what is left open.

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
| card `opening.statements` (several unpaid, each with `closed`, `amount`, `payment_day`) | one card `check` with `stmt: true`, `stmtDate` and `stmtPay` per statement [J5] |
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
| account `posting_days` (left out: 1, a card 7) | `postingDays` [F4, L matching q4] |
| schedule `vary` (left out: the exact amount only) | `vary` [A6, L matching q1] |
| a moved `check` with no `date` (no `told`, no `own_time`) | a 38.31 `bankNow` with no `bankNowAt`: a bank `check` dated to the copy's last saved day [K3], told at the copy's last save [J2] |
| rules files: `by`, `notDouble`, `at`, `by` and `gone` on `steps` entries, `ui.at`, `ui.by`, `held` and `ui.held`, a statement import's `from` and `to`, an import's `file` and each line's `line` | the same names; `from`, `to`, `file` and `line` are `src.from`, `src.to`, `src.file`, `src.line` [L, M3, M5, N1] |
| rules file period end: the `periodStart` event in `events` (the day the person started the new period without the pay) | a `periodStart` event, section 6.2 [M7, N5] |
| `transfer`, `convert` | `transfer`, `convert` |
| `set_aside` | `move` from Waiting into the place |
| `check`, `card_check` | `check` (in a check-in) |
| check `avail: 'available'` or `'current'` (left out: current) | the bank check's `avail` [I1] |
| event `moved: true`, `own_time`; top-level `moved_copy.saved` | a record moved from 38.31 (`src.type: 'move'`); its `told` is `own_time`; with no time, a receipt is told at the start of its day and a bank figure at the copy's last save; at the same moment receipts come first [I5, J2] |
| account `opening.moved: true` (no `told`) | a moved bank figure with no time of its own: its `open` and `check` are told at the copy's last save [J2] |
| `told` (a date, or a date and time) | the record's `told`, never its `at` [H1]; with no time, records on one day keep their order in the file |
| `settles: 'rent@2026-12-27'` | `settles: [ { s: 'rent', due: '2026-12-27' } ]` [H2] |
| an imported line's `bal` | `src.bal`, the running balance printed after the line [O1] |
| an event `auto:gym@2027-01-08` settling an `auto_spend` bill | the spend the schedule logs by itself, id `auto:<schedule>@<due>` [O2], `told` when it was written [O1] |
| `borrow` (`from` a card, `to` an account) | `borrow` (`acct` the card, `acct2` where the cash went) [O5] |
| card `cash_apr` | `cashApr` [O5] |
| top-level `main_bank` | `home.mainBank` [O4] |
| a plan line or `free` with no `account`; a line whose `account` is a card | `acct` left out (the main bank); `acct` the card, reserved from its `payFrom` [O4] |
| a `refund` with `line` | an `in` refund with `line`, given back to that line [O] |
| top-level `home_curs` (`[ { from, cur } ]`, the first in the file's `currency`) | `home.curs` [O6] |
| account `country` and its own `holidays` table | `country` on the account; the table comes from the country [O] |
| ask `not_explained` with `on` | the gap of the check on that day, asked later (an import read after it) |
| ask `total_after_cards` | `total.afterCards` [F10] |
| warning `gain_to_ask` | the check-in question about a large gain [O] |
| goal `removed` (a date) | the place marked `gone` that day, after a `move` of its money to Waiting with `toPlace: true` [O, P1] |
| `set_aside` with `to_place_of` (a removed goal) | a `move` from Waiting into the place with `placed` naming that goal's `toPlace` move [P1] |
| account `closed` (a date) with a `transfer` out that day | `closed`, the final `check` and the closing's `transfer`; its schedules' `ends` set to that day [P6] |
| rules file period end: an answer `{ place, moves: [ { to, a } ] }` (an overspent line's moves `{ from, a }`); `gaveWay`, `notice`; found later `covers` | the `pe:` record with its moves [P2]; the record marked `gone` and the line shown at the next open [P3]; the cover moves [P5] |

## 14. Open questions
P answers the six questions O left (P1 to P6), and confirms the O helper's readings (the O1, O2, O3, O4, O6 readings, the large gain, country per account and the move's currency, as written down with O). Each answer is now in the shape above and tested:

| Question O left | Answer | Where it is now | Tested by |
|---|---|---|---|
| 1. A goal deleted with money in it | P1: the money moved to Waiting is marked "to place" and stays out of safe to spend until placed | section 4 (`toPlace`, `placed`), 6.1 | goal_removed gone-01 to gone-05 |
| 2. A split period-end answer under one id | P2: one record per place, `pe:<period last day>:<place>`, holding `moves: [ { to, a } ]` | sections 0, 7.4 | period_end pe-36, pe-40, pe-41 |
| 3. A refusal found only after a merge | P3: the answer with the newer `at` gives way, its moves undone, and the next open says "An answer from your other device was used. Check it." | sections 2.3, 7.4 | period_end pe-37, pe-42, pe-43 |
| 4. The per-pay amount when the pay rhythm changes mid-year | P4: each rule gets its own months, spread over that rule's pays (option c) | section 8 | units-67 to units-69 |
| 5. Spending found later where the answer was "keep it here" | P5: never out of the kept money; the person picks Waiting or this period's Free to spend at the check-in | section 7.4 | period_end pe-38, pe-39, pe-44 to pe-47 |
| 6. A closed account with a final figure that is not zero | P6: closed only at zero or with the money moved out by a transfer the closing asks for; its schedules end on the closing day | sections 3, 5 | account_closed close-01 to close-07; accounts acc-01 to acc-06 |

**Questions P does not answer.** Nothing was decided for these; no ask or case depends on them, and the references do the least they can (said with each). `node foundation_review/rules/run_rules.js --open` lists the last four.
1. **Placing money "to place" where it counts** (P1). P1 says the money stays out of safe to spend until the person places it. Placing it in another place is a move and is tested. Can the person also place it in Waiting itself ("it is spare money now") or in Free to spend, so that it counts in safe to spend, and if so how is that saved? The model only lowers "to place" by a set aside into another place (`to_place_of`); nothing else frees it.
2. **A rule that changes on a day other than the 1st** (P4, units.json `units-open-1`). P4 gives each rule the months it is in force. With two-weekly pay until Thu 15 Jul and monthly from then, how is July shared: by days, to the rule in force on the 1st, or to the rule of its first pay? `units_ref` refuses such a rule.
3. **Closing an account that owes or is below zero** (P6, accounts.json `accounts-open-1`). P6 speaks of a final figure moved out by a transfer. A card, pay-later or loan with something still owed, or a bank below zero: is the closing refused until it is at zero, or does it ask for a payment in? `close` takes a figure and transfers out only.
4. **Closing the account a card is paid from, or a place is kept in** (P6, accounts.json `accounts-open-2`). Does the closing ask for a new paying account and move the place's money, or is it refused? `close` looks only at the figure and the schedules.
5. **A 38.31 account already closed with money in it, at the move** (P6, accounts.json `accounts-open-3`). How is it brought in? Section 11 does not say.

**Readings taken while writing P down** (to confirm):
- P1: a removed place's "to place" money is held in the walk of the account it was kept in, like a kept place. A set aside that does not name the `toPlace` move comes from Waiting's other money and leaves "to place" as it was (gone-05).
- P2: "keep it here" inside a record is a move whose `to` is the place itself (it writes no move event, as before, L period_end q6); an overspent line's covers are `{ from, a }` moves in that line's record (the O reading, now confirmed). Each move takes its record's `told`.
- P3: "the two answers" are the records that give from the place that is over-given; a newer answer that takes nothing from that place stays (pe-42). With three or more, the newest of them gives way, then the next, until nothing is refused. The record that gives way is marked `gone` with `goneBy` the record kept, and the notice shows on the device whose answer gave way (its `by`); whether it is shown once or until the answer is looked at is the device's own `ui` and not tested.
- P4: the leftover minor units of each rule's part go to that rule's earliest pays (L units q4 applied to each part); a pay's amount is its place among its own rule's pays in that year.
- P5: a pick is a move into the place dated the check-in day; picks adding up to more than was found later are refused like L period_end q10 (pe-47), and a pick from anywhere but Waiting or this period's Free to spend is refused (pe-46).
- P6: "its schedules" are those paid from it, landing in it, or a transfer into it; `ends` is the closing day and an occurrence due that day is still expected; a schedule already ending on or before it keeps its end. The final `check` holds the figure before the transfer, and both are dated the closing day.
