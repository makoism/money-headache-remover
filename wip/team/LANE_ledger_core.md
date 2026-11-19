# Lane: ledger core (side N). Handoff

Branch `side/ledger-core`, made from `side/ledger-design`. Finished 2026-11-19. Made-up numbers only.

**Second pass (side N2, 2026-11-19), see "Second pass" at the end:** the reference and the tests now take the check with the latest day, the
reference keeps the one rule in the five cases it used to break, and the differential test covers them. `LEDGER_DESIGN.md` records all of it,
`cutDay`, instalments and the storage key.

First pass: nothing that existed was changed. New files only:

| File | What it is |
|---|---|
| `wip/team/ledger.js` | The real ledger (step B1). Pure functions, no DOM, no storage, no clock. |
| `tests/next/ledger_core_model.js` | Test adapter: lets `lib.js` load `ledger.js` for `ledger_conservation.js`. |
| `tests/next/ledger_diff.js` | Differential test: `ledger.js` against `ledger_ref.js`, to the cent. |
| `tests/next/ledger_edge.js` | Edge cases, refusals, a real 38.31 copy, Philippine shapes, the six people of PERSONAS_PH.md. |
| `tests/next/ledger_core_all.sh` | Runs every proof and a name clash check. One command. |

(`tests/next/` is `wip/team/tests/next/`.)

## Proof
`bash wip/team/tests/next/ledger_core_all.sh` from any folder, about 70 seconds. It stops at the first failing test (pipefail). Last run:

| Test | Result |
|---|---|
| `MODEL=tests/next/ledger_core_model.js node tests/next/ledger_conservation.js` | PASS, 113,531 checks (400 lists, 8 personas, 2 migrations) |
| `MODEL=ledger.js node tests/next/ledger_fuzz.js` | PASS, 531,456 checks (600 people: 300 as before, 300 with the new cases). Was 240,864 |
| `node tests/next/ledger_diff.js` | PASS, 691,210 checks (4,500 people: 3,000 as before with the same 71,608 events, 1,500 with the new cases; 108,161 events through both models, 600 migrations). Was 389,257 |
| `node tests/next/ledger_edge.js` | PASS, 476 checks |
| `MODEL=tests/next/ledger_ref.js node tests/next/ledger_fuzz.js` | PASS, 531,456 checks (the reference under the same fuzz) |
| `MODEL=tests/next/ledger_ref.js node tests/next/ledger_conservation.js` | PASS, 113,531 checks |
| name clash check | 68 top-level names in `ledger.js`, 63 page files, no clash |

- `ledger_fuzz.js` loads `ledger.js` directly. `ledger_conservation.js` needs the adapter, because `lib.js` asks for `freshState` and
  `setFreeMode`, and `freshState` belongs to `model.js` in the page. The adapter also turns side C's event shape into the design's
  shape and gives a day to the test events that have none (one day after the latest event). It changes no figure.
- First pass: no existing test was edited. Second pass: `ledger_fuzz.js` I7 was changed and made stricter (see "Second pass"); nothing was loosened and no check was removed.

## The saved shape
`ledgerFresh` returns `{ ui: { freeMode, cur, payDays }, accounts: [], ledger: [], undone: [], removed: [], ledgerV: 1, ledgerNext: 1 }`.
In the app these sit on `S` beside what is there now (no name is in use today): `S.accounts`, `S.ledger`, `S.undone`, `S.removed`,
`S.ledgerV`, `S.ledgerNext`, and after a move `S.frozen` and `S.oldFigures`; `S.ui.freeMode` and `S.ui.payDays` are new, `S.ui.cur` is the one the app has.
- A stored event: `{ id, k, date, c, c2, typed, acct, acct2, place, place2, sub, startsPeriod, src, note, grp }`. Amounts are stored
  in whole cents only (`c`, `c2`, `typed`), in every currency. An event is given with `a`, `a2`, `typedA` in money units, or with `c`, `c2`, `typed` in cents.
- Every field the caller gives is kept, also ones this version does not know. Nothing is rebuilt from a list of known fields.

## Public functions
| Function | One line |
|---|---|
| `LEDGER_V` | Shape number of the saved ledger (1). |
| `ledgerFresh(setup)` | A new empty ledger from `{ cur, mode, payDays, accounts }`. False when the setup is not usable. |
| `ledgerTry(S, ev, today)` | Reads one event without recording it: `{ ok, e }` or `{ ok: false, code, why }`. |
| `ledgerAdd(S, ev, today)` | Records one event. Returns the stored event, or false with nothing recorded. |
| `ledgerAddMany(S, evs, today)` | Records several events as one step: all or none, undone together. |
| `ledgerWhy()` | Why the last call returned false: `{ code, why }`. The screens write their own words from `code`. |
| `ledgerUndo(S)` / `ledgerUndo(S, id)` | Takes out the last step, or the step holding that id. Kept in `S.undone`, saved with the ledger. |
| `ledgerRedo(S)` | Puts the last undone step back where it was. |
| `ledgerHas(S, src)` | True when a statement line or receipt is already logged (A8). |
| `placesOf(S, day)` | Every figure, added up from the events (as of `day` when given). Names are listed above the function. |
| `ledgerProof(S)` | The one rule checked: Total = tracked accounts, every "for the card" line = its card. For `check.sh` and a guard in the page. |
| `ledgerCardLines(S, day)` | Each card as one card with two lines: `now` and `older`. |
| `periodOf(S, date)` | The month holding a day: `{ from, to }`, pay day to pay day. |
| `flows(S, from, to)` | What came in and went out in a span, and Total and Owed at both ends. |
| `ledgerUnexplained(S, acct, typedA, day)` | Check your bank, preview only: typed less that account's events up to that day. |
| `ledgerCheck(S, acct, typedA, day)` | Records a check. Moves no money. |
| `ledgerAccept(S, acct, typedA, day, place)` | A check plus an adjust for the difference, one step. |
| `ledgerStartFresh(S, typed, day, place)` | A check and an adjust on every account, one step. |
| `ledgerCarryOver(S, cardId, amount, day, place)` | Part of a card becomes its older balance (a loan account with `of: cardId`). |
| `ledgerCardDue(S, cardId, day)` | Extension: with `cutDay` on the card, what is due on the next pay day and what is due a month later. |
| `ledgerInstalment(S, planId, cardId, amount, day, place)` | Extension: this month's part of a card instalment moves from the plan onto the card. |
| `ledgerAddAccount`, `ledgerEditAccount`, `ledgerCloseAccount`, `ledgerReopenAccount` | Accounts. Never deleted. Type, currency, `inFull` and `tracked` lock once an account has events. |
| `ledgerSetMode(S, mode)`, `ledgerSetPayDays(S, days)` | Track or Wallet; the pay days. |
| `ledgerMayWrite(stored)` | False when the stored copy has a higher `ledgerV`. |
| `ledgerClean(S)` | Makes a loaded copy safe to add up. Unreadable events move to `S.ledgerBad`, kept, outside every sum. Leaves a newer copy alone. |
| `ledgerRead3831(saved)` | Reads the typed figures out of a real 38.31 copy. |
| `migrate3831(old, today)` | Moves a 38.31 copy into a new ledger (E5). |

## Wiring it in (main session, after v1)
1. **build.sh**: change `cat model.js stmt.js` to `cat model.js ledger.js stmt.js`. `ledger.js` uses nothing from `model.js` and no name of it
   clashes with any page file (checked by `ledger_core_all.sh`; keep that check in `check.sh`). Its last line (`module.exports`) does nothing in the page.
2. **Loading** (`normalize` in `ui0.js`): keep `d.accounts`, `d.ledger`, `d.undone`, `d.removed`, `d.ledgerV`, `d.ledgerNext`, `d.ledgerBad`, `d.frozen`,
   `d.oldFigures` on the state, then call `ledgerClean(S)`. If it answers `code: 'newer'`, show "update the app" and do not save.
3. **Saving** (`flush` in `ui0.js`): before `localStorage.setItem`, read the stored copy and skip the write when `ledgerMayWrite(stored)` is false, the same
   way `storedIsNewer()` is used. The same test belongs in the vault upload and in "other tab" merges. **Pages already shipped (38.31 and older) do not know
   `ledgerV`.** They do keep the `rev` rule, so they will not overwrite a newer `rev`, but an old page opened later can still save with a higher `rev` and it
   rebuilds `S` in `normalize`, which may drop the ledger fields. **Decided (N2, recorded in LEDGER_DESIGN.md "Storage"): the ledger is saved under a new
   storage key and the old key is left alone.** The cloud copy needs both halves too: the same `ledgerMayWrite` guard on the copy on the server before an upload
   replaces it, and a place on the server that a 38.31 page would not download as its own save. The vault lane must hear this.
4. **The move**: on the first load of a copy with no `ledgerV`, call `migrate3831(savedCopy, todayYmd)` and copy its fields onto `S`. It reads `cfg.bankNow` and
   `cfg.bankNowAt`, `S.cards` (`id, name, owed, payDay, at`), `plan.goals` (`id, start`), `plan.debts`, `ui.cur`, `ui.freeMode`, `ui.payDays`. The whole saved copy is in `S.frozen`.
   **Before this step, a wiring check that is not written yet (it waits for the main session's storage shape; do not guess the field names before that):**
   write `tests/next/ledger_migrate_real.js`. It must
   - load a saved copy made by the **v1 candidate page** itself (open the candidate in the page test, set up a made-up person with a bank figure, two cards,
     goal starts and at least one debt of every kind the screens can make, save, and read the stored copy back; made-up numbers only, never a real copy);
   - run it through `migrate3831(copy, today)`;
   - **fail on any field it cannot read**: every figure a person typed in the saved copy (the bank figure and its date, each card's balance, pay day and date,
     each goal start, each debt's balance and pay day) must be found again in the new ledger, to the cent, in the account it belongs to; any key under
     `cfg`, `cards[]`, `plan.goals[]` and `plan.debts[]` that the script does not list by name as "read" or "known, not money" is a failure, so a renamed or
     new field cannot pass silently; `S.oldFigures.notes` must be empty; and a debt of kind card must not also arrive as a card from `S.cards` (owed twice);
   - end with a PASS line and be added to `ledger_core_all.sh`.
   Today `ledgerRead3831` tries `owed`, `bal`, `balance`, `start` for a debt's balance, in that order, and reads no date for a debt. These names were
   not checked against a real copy. When the script names the real fields, replace the guess list with them.
5. **ACT** (`actions.js`): one new group of actions, each a thin call, each inside `ACT.tx` for the redraw and save:
   `ACT.moneyIn / moneyOut / place / transfer / payCard / check / accept / startFresh` call `ledgerAdd`, `ledgerAccept`, `ledgerStartFresh` with today's day.
   On false, show the words for `ledgerWhy().code`. **Undo for ledger events is `ledgerUndo` and `ledgerRedo`, not the snapshot stack**: add the ledger fields to
   neither `snapState` nor `restoreState`, or an undo of a plan change would roll the ledger back.
6. **Statement import** (`stmt.js`, `ui45u.js`): give each line a `src` such as `stmt:<file id>:<line>`. A second import is refused with `already`; ask `ledgerHas` first to show "already logged".
7. **viewOf / mapOf**: the Home figures come from `placesOf(S)`.

| `model.js` today | Replaced by |
|---|---|
| `cfg.bankStart`, `cfg.bankAt`, `setBankBalance`, `cfg.bankNow` | an `open` event, then `ledgerCheck` / `ledgerAccept` |
| `mapOf(...).total`, `.saved`, `.free`, `.billsLeft`, `bankEnd`, `proofOf` | `placesOf(S)`: `total`, `saved`, `free`, `bills`, `afterCards`; `ledgerProof(S)` |
| `addReceipt`, `updateReceipt`, `removeReceipt`, `receiptStats` | `spend` events; edit is undo by id plus a new event |
| goal `start`, `sweepPlay`, `releasePlay`, `topup` | `open` into a burrow, `move` between places |
| `plan.debts`, `debtStep` balances, `S.cards` typed balances | loan and card accounts; `placesOf(S).owed`, `ledgerCardLines` |
| `MONTHS`, `START`, `END`, `PAYDAY` as the frame for real money | `periodOf`, `flows` (the plan view keeps its own months) |
| `UNDO_MAX` snapshots for money events | `ledgerUndo`, `ledgerRedo` (no limit, saved with the copy) |

## Where the design was unclear, and what I chose
Each choice is the safer one for "nobody loses data" and "no coin counted twice".
1. **Refusals.** `ledgerAdd` returns false and records nothing; the reason is in `ledgerWhy()`. Refused: unknown kind, unknown account, no date or not a real
   day, a day after `today` (only when `today` is passed), an amount that is missing, not a number, zero or below (except `open`, `adjust`, `check`), more than two
   decimals, or above 100 billion units, cents in a currency without cents, a spend with no place, a place name outside `[A-Za-z0-9_-]`, the same account or place twice.
2. **Yen.** Stored in cents like every currency (so sums are exact and equal the reference), but an amount with cents in JPY, KRW or VND is refused, not rounded.
   Both `JPY` and the sign `¥` that `model.js` uses are read as yen. The design says ISO codes; the app's `S.ui.cur` is a sign today. Either works if accounts and `S.ui.cur` use the same.
3. **Before the opening.** An event dated before the day an account's balance was typed is refused (`before-open`): it is already inside that balance.
   A second opening for the same account and place is refused; an account may have several openings only on one day and in different places (the old savings account). An opening for an account that already has earlier events is refused.
4. **Kinds and account types.** `borrow` and `repay` need a money account and an owed account; `transfer`, `hand`, `convert` need two money accounts; `hand` goes to an
   account that is not tracked; `convert` needs two currencies and every other pair needs one.
5. **A "for the card" line is never named by hand** (`card:<id>` is not a usable place). It only moves with the card, so it always equals the card.
6. **Wallet mode and the place `free`.** In Wallet mode there is no Free to spend place, so `free` is read as Waiting. A copy that switches mode keeps every coin in sight.
   An adjust or a card refund with no place lands in Free to spend in Track and in Waiting in Wallet.
7. **Redo and data.** A new event ends redo (L2), but the undone events move to `S.removed` instead of being dropped.
8. **Steps.** Events recorded together (`ledgerAccept`, `ledgerStartFresh`, `ledgerCarryOver`, `ledgerInstalment`) share `grp` and are undone and redone together.
9. **Statement lines once.** A `src` other than `typed` or `migration` can be logged once.
10. **Closed accounts.** Only an account with nothing in it can be closed. Events dated after the closing day are refused; late lines from before it are taken. Its events stay in every sum.
11. **Start fresh** needs a typed figure for every open tracked account, so no account is left with an old gap.
12. **Migration never stops on odd figures.** A figure that cannot be read is left out and listed in `S.oldFigures.notes`. Without `cfg.bankNow` it uses `cfg.bankStart` and marks the bank `confirm`. `plan.debts` field names were not checked against a real copy (`owed`, `bal`, `balance`, `start` are tried in that order); debts of kind card may repeat a card in `S.cards`. Check both before E5.
13. **Ids** are a counter (`S.ledgerNext`). Two devices adding at once would clash; merging two copies is not handled here.

## Where ledger.js differs from the reference, and what I believe is wrong in the design
**Points 1 to 7 are closed by the second pass:** the reference, the fuzz and the design text now say what `ledger.js` does, and the differential test
draws these cases. They are left here as the record of what was found. Points 8 and 9 are still open.
The differential test stays inside what both read the same way. These cases are tested alone in `ledger_edge.js`.
1. **"The check added last" should be "the latest day".** `ledger_fuzz.js` I7 and the reference take the check added last for each account. Failing case: check
   the bank on 2026-12-09, then import an older statement that holds a check dated 2026-10-01: the screen would now show the October gap as the current one.
   `placesOf().checks` follows the test and carries `date` and `id`, so the screen can pick the latest day. Proposed: change I7 to the latest day.
2. **Handed to the wallet since pay day** goes by the order added in the reference. Failing case: pay on the 10th, hand 5,000 on the 10th, then a late line "hand 700 on the 8th":
   the reference shows 5,700, the truth is 5,000. `ledger.js` goes by day.
3. **Money sent abroad.** `convert` from a home account to another currency: the reference lowers the account but no place, so Total stops matching the accounts. `ledger.js` takes it from the place (default Waiting).
4. **Cash taken on a card paid in full** (`borrow` onto such a card): in the reference the card grows and its line does not. `ledger.js` sets the cash aside for the card at once.
5. **A card paid in full, paid from outside Total** (the wallet, another currency): in the reference the line stays while the card falls. `ledger.js` lowers the line and gives the money back to the place.
6. **`free` in Wallet mode** (choice 6): in the reference such coins leave Total.
7. **Design note 6** says paying a card from a burrow is "a move into for the card first". That move would make the line larger than the card. It is not needed: a card spend already names the place it was for.
8. **An adjust with a late statement.** Start fresh absorbs a gap; if the missing lines are imported later, the check of that day shows the same gap again with the other sign. Correct by the design, but the screen should offer "undo the adjust" there.
9. **Lines from before the opening** cannot be imported (choice 3), so history before the first typed balance cannot be shown. To allow it the opening would have to move back in time; not built.

## Design gaps (Philippine research, side L)
Each has a made-up event list in `ledger_edge.js` and holds the one rule.
| Shape | How it is written today | Gap and smallest extension |
|---|---|---|
| **Card cut-off day** | "For the card" equals everything on the card. Total, Owed and "bank after the cards" are right. | The design has `payDay` only, so it cannot say what is due on the next pay day. Failing case: card 9,000, spend 3,480 on the 12th, cut-off the 17th, spend 2,600 on the 18th: due on the 7th is 12,480, not 15,080. Extension, built: an account field `cutDay` and `ledgerCardDue(S, card, day)` giving `due` and `later`. It is read only; no figure of `placesOf` changes. |
| **Card not paid in full, interest** | In the design: the older balance is a loan account (`of: card`); interest is a spend on it; `ledgerCarryOver` moves the unpaid part. | None. |
| **Card instalment, 0% or with interest** | The plan is a pay-later account with `of: card` holding the months to come; the buy is a spend on it. Each month one part moves onto the card. | No kind moves owed money from one owed account to another. Built from two adjusts in one step: `ledgerInstalment`. Add-on interest is a spend on the plan. A real kind (`shift`) would read better in history; proposed, not built. |
| **Paluwagan** | Simple: a bill each round, the pot as other money in. Exact: `transfer` to an "owed to you" account each round; at the payout `transfer` it back and `borrow` the rest of the pot against a loan; later rounds are `repay`. | None. |
| **13th month pay** | `in`, sub `pay`, `startsPeriod: false`. It waits in Waiting to be placed. | None in the ledger. Asking about it in November is a screen matter. |
| **Loan paid out of pay before it lands** | A negative `adjust` on the loan: owed falls, no account moves. | Works, but it reads as a correction. Proposed: a `sub` word for it, or record gross pay and a `repay`. |
| **Two people, three pay days** | `payDays: [5, 15, 30]` | None. |

## Second pass (side N2, 2026-11-19)
Two commits, in this order: `12d144b` holds only tests, failing (fuzz on the reference 42,142 fail, fuzz on `ledger.js` 4,427, diff 81,690); `06a28bf` is the fix.

**Found**
1. The reference and I7 took the check added last. `ledger.js` followed I7, so it had the same fault.
2. The reference broke Total or a card line in the five listed cases, and in two more that came up while writing the tests: a card paid in full **in another
   currency** got a "for the card" line in home places, and owed money in another currency was added into Owed. `ledger.js` already kept both apart.
3. `ledger_core_all.sh` could not fail: every test was piped through `tail`, so a failing test still ended in "LEDGER CORE ALL PASS".

**Done**
- **I7, stricter.** Per account the check shown must be the one with the latest day (same day: the one added last), and its date must be shown. Two asserts
  where there was one. Where "added last" is also the latest day, the old assert is still made unchanged.
- **I12, new** in the fuzz: handed to the wallet since pay day goes by day, worked out in the test.
- **A second block of people** in the fuzz (300, seed + 1000) and in the diff (1,500, seed + 1000) draws: money sent abroad, cash on a card, a card paid from
  the wallet, `free` in Wallet mode, a card refund or an adjust with no place, and in the diff a card in another currency. The first block is the same list
  as before, event for event, so the old checks are all still made.
- **The diff** compares each check with its day, compares handed to the wallet straight (no re-sorting), compares `foreignOwed`, and asserts on its own that
  `ledger.js` shows the check with the latest day.
- **`ledger_ref.js`** fixed in all of the above. **`ledger.js`**: one change, `placesOf().checks` picks the latest day.
- **`ledger_core_all.sh`** uses pipefail, prints the counts, and runs the fuzz on the reference too.
- **`LEDGER_DESIGN.md`**: the kinds table, a new section "The one rule, case by case", the latest-day check, `cutDay` and `of`, the cut-off day and
  instalments, the storage key and the guard, and the wrong note 6 corrected.

**Choices made without asking**
- Same day, two checks: the one added last is shown.
- The reference was also brought in line on the two extra cases above, because the differential test could not draw a card in another currency otherwise.
- The `ledger.js` change went into the fix commit, not a commit of its own, so no commit after the test commit leaves the diff red.
- `DECISIONS.md` on this branch has no section "The ledger design: defaults taken"; it was read from `origin/wip-38.31`. Nothing here goes against it.

**Still open**
- Still outside the differential test: an event dated before its account's opening (refused by `ledger.js`, recorded by the reference). Tested alone in `ledger_edge.js`.
- Points 8 and 9 above (undo the adjust when a late statement arrives; history before the first typed balance).
- The `plan.debts` wiring check (step 4 above), waiting for the main session's storage shape.
- A kind `shift` for moving owed money between two owed accounts (instalments use two adjusts in one step today).

## Not done
- `tests/next/migration_fixtures.js` (the 19 old builds in the real page) needs the page wired, so it is for the main session. Its hook reads `e.t === 'open'`; ledger events use `e.k === 'open'`, so `PAGE_HOOK` in `lib.js` needs that one word changed when the page is wired.
- No screens, no words for the person. `LED_WORDS` in `ledger.js` are plain fallbacks for logs, not copy.
