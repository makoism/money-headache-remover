# Wiring the ledger into the app: the steps

Side P, 2026-11-19, branch `side/ledger-wiring` (cut from `side/ledger-core`). For the main session, after v1 has shipped.
Read with `LANE_ledger_core.md` ("Wiring it in"), `LEDGER_DESIGN.md` ("Storage") and `LANE_ledger_wiring.md` (what was found).
File and function names below are those of `origin/wip-38.31` at `9916cde`. Made-up numbers only.

## How to use this
- One step is one commit. Before the commit its test fails for the reason given; after it, the test passes. Nothing else may turn red.
- The app can ship after every step. Steps 1 to 4 change nothing a person sees. Step 5 is the move.
- `tests/next/` means `wip/team/tests/next/`. All three wiring tests run in node in under a second, with no browser:

| Test | Today | What it needs |
|---|---|---|
| `node tests/next/wiring_migrate.js` | FAIL, 18 of 240 | the four gaps of `ledger.js` fixed (step 0) |
| `node tests/next/wiring_store.js` | FAIL, NOT BUILT `lstore.js` | step 2 |
| `node tests/next/wiring_page.js [step]` | FAIL, 31 of 31 | steps 1 to 8, one step at a time |

## Three decisions this plan rests on (taken here, flip any of them before step 5)
1. **One copy, under a new key.** After the move the whole state (the plan as it is today, plus the ledger fields) is saved as one copy under
   `burrow-ledger-v1`. The old key `money-map-template-v2` is read once for the move and never written again by a ledger page. A 38.31 page left
   open somewhere goes on reading and writing the old key and cannot touch the ledger. One copy means one `rev` and no way for plan and ledger to drift apart.
2. **The storage rules live in one small pure file, `lstore.js`**, placed after `ledger.js` in the build. It is handed the storage object, so node
   tests run it. Every save, upload and load goes through it. `tests/next/wiring_store_sketch.js` is a version that passes the test; copy it as the start.
3. **The plan stays.** The ledger takes over real money (bank, cards, owed, burrow balances, spending). The plan view (bills, pay, goal targets, the months
   ahead) keeps its own figures and its own snapshot undo. Screens move from the plan to the ledger one figure at a time (table at the end).

## Step 0. Before any wiring: fixtures from the v1 candidate, and the ledger gaps
- **Touches:** `tests/next/fixtures/wiring/*.json` (refreshed), and `ledger.js` (by the session that fixes ledger gaps, not during wiring).
- **Do:** `node wip/team/tests/next/wiring_make_fixtures.js <git ref of what shipped>` then `node wip/team/tests/next/wiring_migrate.js`.
  The maker loads the real `model.js` and the page's own `normalize` from that ref. If the shipped page has a field the test does not list by name, it fails with the field's name: decide READ or KNOWN in `FIELDS` at the top of `wiring_migrate.js`.
- **Fails before:** 18 checks, four causes, all in `LANE_ledger_wiring.md` "Gaps in ledger.js": a debt goal arrives as savings; the sample's invented emergency fund is moved as if typed; a debt loses its `plan.debts[].id`; handing over the old plan figures adds a key to the frozen copy.
- **Passes after:** `PASS wiring_migrate: 8 saved 38.31 copies`. Add it to `ledger_core_all.sh`.
- **The person sees:** nothing.

## Step 1. The ledger is in the page
- **Touches:** `build.sh` (`cat model.js ledger.js stmt.js`), `check.sh` (run `tests/next/ledger_core_all.sh`, which also holds the name clash check).
- **Test:** `node tests/next/wiring_page.js 1`.
- **The person sees:** nothing. No page code calls it yet.

## Step 2. The storage glue
- **Touches:** new `lstore.js`; `build.sh` (after `ledger.js`, before `ui0.js`); `check.sh` or `tests/verify.sh` (run `wiring_store.js`).
- **Functions** (names are the hooks at the top of `wiring_store.js`):

| Function | What it does |
|---|---|
| `LEDGER_KEY` | `'burrow-ledger-v1'` |
| `lsLoad(store, today, figuresOf)` | `{ from, copy }`. `ledger`: read from the new key and cleaned with `ledgerClean`. `moved`: no new key, the old key read once and moved, nothing written. `none`: a new person. `newer`: the stored ledger is from a newer page. `damaged`: the stored text cannot be read; it is kept, not moved over. |
| `lsSave(store, S)` | `'saved'`, or `'newer'` (`ledgerMayWrite(stored)` said no), `'behind'` (a higher `rev` is stored), `'damaged'`, `'error'`. Writes the new key only. Never saves a copy with no ledger. |
| `lsMove(saved, today, figures)` | A 38.31 copy becomes a ledger copy: every field it had stays, the ledger fields from `migrate3831` are added, `frozen` is the saved copy whole, `oldFigures.plan` is `figures`. |
| `lsMayTake(copy)` | For any whole copy that arrives: `'ok'`, `'old'` (a 38.31 copy: run it through `lsMove` first), `'newer'` (refuse, say "update the app"), `'bad'`. |
| `lsMayUpload(serverCopy)` | `ledgerMayWrite` on the decrypted copy on the server. False: do not upload, not with `force` either. |

- **Test:** `node tests/next/wiring_store.js` (86 checks: the 8 saved copies moved, the old key untouched byte for byte, a newer ledger never written over whatever the `rev`, a damaged one kept, unknown fields kept, an old page writing the old key later changes nothing) and `wiring_page.js 2`.
- **The person sees:** nothing. Nothing calls it yet.

## Step 3. The guard on every copy that arrives and every upload
The page is still a 38.31-shape page on the old key. This step makes pages in the wild refuse copies from the future before any such copy exists.
- **Touches**, one call each. `'newer'`: change nothing, show "This copy was made by a newer version of The Burrow. Update the app to open it." (words for the copy pass). `'old'` and `'ok'`: carry on as today, until step 5.

| Where | File and function | Call |
|---|---|---|
| another tab saved | `ui0.js` `adoptOther` | `lsMayTake(d)` |
| cloud copy loaded | `ui42.js` `vaultApply`, `vaultFind` | `lsMayTake(d)` after decrypt, before `normalize` |
| cloud upload | `ui42.js` `vaultPush` (also with `force`, so "Keep mine", and "load an earlier copy then save") | GET the server copy, decrypt, `lsMayUpload(d)`; on false stop and show "update the app" |
| mirror in the browser database | `ui43.js` (the restore at lines 48 to 51) | `lsMayTake(d)` |
| backup file | `ui5.js` (restore, line 152) | `lsMayTake(d)` |
| moved in by link | `ui41.js` (line 207), `ui5.js` (line 245) | `lsMayTake(d)` |
| undo of a big change | `ui5.js` `#undoGo` (the kept snapshot) | `lsMayTake` on the parsed snapshot |

- **Test:** `node tests/next/wiring_page.js 3` (source). **Page test to write** (`tests/qc/ledger_guard.js`): hand the page a copy with `ledgerV: 99` through each of the seven doors above (storage event, `window.__vault` hook, backup file input, move link, mirror); after each, the stored copy and the numbers on screen are unchanged and the message shows. It fails today because every door takes the copy.
- **The person sees:** nothing, unless they open a copy from a newer version: then the message, and their numbers stay.

## Step 4. The ledger actions
- **Touches:** `actions.js`: one new group, each a thin call inside `ACT.tx` for the one save and redraw: `ACT.moneyIn`, `moneyOut`, `place`, `transfer`, `payCard`, `check`, `accept`, `startFresh` (calling `ledgerAdd`, `ledgerCheck`, `ledgerAccept`, `ledgerStartFresh` with today's day), `ACT.ledgerUndo`, `ACT.ledgerRedo`. On false, the words come from `ledgerWhy().code`.
- **Rule:** `snapState` and `restoreState` must not hold `accounts`, `ledger`, `undone`, `removed`, `ledgerNext`. An undo of a plan change must never roll money events back. The 3-day kept copy (`snapNoCopy`, `keepCopy`) is a whole copy and does hold them; that is right, it replaces everything.
- **Test:** `node tests/next/wiring_page.js 4`. **Node test to write** (`tests/next/wiring_actions.js`): load `model.js`, `ledger.js`, `actions.js` in one scope with a stub `render` and `persist`; add a spend through `ACT.moneyOut`, change a bill through `ACT.setLine`, `ACT.undo()`: the bill is back and the spend is still there; `ACT.ledgerUndo()`: the spend is gone and the bill change is not touched.
- **The person sees:** nothing. No screen calls them yet.

## Step 5. The move (E5), the new key, and what Home types
This is the one step people notice. It must land whole.
- **Touches:**
  - `ui0.js` `loadLocal`: `lsLoad(localStorage, today, figuresOf)`. `figuresOf(saved)` is the old plan's figures for today's month from the model (`mapOf`: `total`, `saved`, `free`, `billsLeft`, `owed`; `nowOf`: `bank`, `cardsOwed`, `afterCards`), worked out before the move. On `newer` or `damaged`: show the message, set a flag that stops every save, keep the stored text.
  - `ui0.js` `flush`, `storedIsNewer`, `mergeOtherReceipts`, `keepUnknown`, the `storage` listener, and `ui5.js` `pagehide`: the new key, and the write through `lsSave`. `normalize` keeps `accounts`, `ledger`, `undone`, `removed`, `ledgerV`, `ledgerNext`, `ledgerBad`, `frozen`, `oldFigures` as they are (today it copies unknown top-level keys, so they already pass; make it explicit) and calls `ledgerClean`.
  - Every door of step 3: a copy that is `'old'` now goes through `lsMove` before it replaces anything (an old backup file, an old cloud copy, the mirror, a link).
  - `ui42.js`: a ledger copy is stored in the cloud where a 38.31 page with the same code will not find it. **Chosen:** `keysFor` derives a second vault id for ledger copies (the code plus a fixed suffix before hashing), so no server change is needed; on a new phone the page looks for the ledger place first, then the old place (and moves what it finds). The server-side format number in `LANE_vault.md` can be added on top; it is not needed for this.
  - `actions.js` `ACT.setBankNow` and `ACT.setCard`, `removeCard`: they now also write the ledger, so both sides stay equal until step 6: the bank through `ledgerAccept('bank', v, today)`; a card through `ledgerAccept(cardId, owed, today)`, with `ledgerAddAccount` for a new one and `ledgerEditAccount` for name and pay day; a removed card is accepted to zero and closed with `ledgerCloseAccount`.
  - One screen, shown once (`S.oldFigures.shownOnce`): the old plan's figures beside the new ones, and the two questions the move leaves open: accounts marked `confirm` ("Is this still what your bank shows?", "Where do these savings sit?").
- **Only typed figures move:** the bank figure with its day, each card typed on Home, goal starts a person typed, Cards and loans balances, debt goals as loans. Never a sample figure, never a planned figure. Old receipts stay as history (M5); the ledger starts on the day of the move.
- **Tests:** `wiring_migrate.js` and `wiring_store.js` in `check.sh`; `wiring_page.js 5`. **Page test to write** (`tests/qc/ledger_move.js`): for each file in `tests/next/fixtures/wiring/`, put `saved` under the old key, open the page, and check: the once-screen shows `oldFigures.plan` beside the new figures; the Home now block shows the same bank, cards and "bank after the cards" as `homeNow` in the fixture; the old key is byte for byte the same; the new key holds a copy whose `frozen` is the old copy; reload: no second move, the once-screen is gone; type a new bank figure: `placesOf(S).accounts.bank` and the screen agree. Then `tests/next/migration_fixtures.js` (the 19 old builds) with `PAGE_HOOK` in `lib.js` reading `e.k === 'open'`.
- **The person sees:** once, "Your numbers moved" with the old plan beside the new picture, and at most two questions. Home looks the same as before.

## Step 6. Home's now block reads the ledger
- **Touches:** `model.js` `nowOf` (or `ui6.js` where it is drawn): from `placesOf(S)` and `ledgerCardLines(S)`. `ACT.setBankNow`, `setCard` stop writing `cfg.bankNow` and `S.cards` (they stay in the copy as they were at the move; nothing reads them).
- **Test:** `wiring_page.js 6`; `tests/qc/ledger_move.js` still passes; `v1_now.js` and `v1_home.js` updated to type through the screen and read the same figures.
- **The person sees:** the same block. New: "Check your bank" says how far the typed figure is from what the app expected (`checks[acct].unexplained`), with "add what I missed" or "accept it".

## Step 7. Spending and statements as events (A8)
- **Touches:** `stmt.js`, `ui45u.js` (each line gets `src: 'stmt:<file id>:<line>'`, ask `ledgerHas` first and show "already logged"), the Log spend form and receipts (`ACT.moneyOut` beside or instead of `addReceipt`), bills that drain on a date (one event per bill; a receipt for it replaces the drain).
- **Test:** `wiring_page.js 7`. **Page test to write:** import the same made-up statement twice: the second time every line says already logged and Total does not move.
- **The person sees:** card spending raises "for the card" and lowers Free to spend; Total stays until the card is paid.

## Step 8. No cap that drops data (E14)
- **Touches:** `model.js` `cleanReceipts` (`slice(0, 5000)` goes; the newest must never be the ones dropped). The ledger itself is never trimmed. With it: compress before encrypting the cloud copy (`CompressionStream`, see `LANE_vault.md`), because a copy that keeps growing reaches the server's size limit one day.
- **Test:** `wiring_page.js 8`. **Node test to write:** a copy with 6,000 receipts and 20,000 events loads and saves with all of them.
- **The person sees:** nothing.

## Step 9 and after (each its own step, in this order)
| Step | What | Functions | The person sees |
|---|---|---|---|
| 9 | Total, Saved, Free to spend, Bills left, You owe and the where bar from the ledger | `placesOf`, `ledgerProof` in `viewOf` / `mapOf` / `proofOf` | "planned" goes from the Home figures; they are what is there now (A1, A4) |
| 10 | Accounts (A2): add a bank, e-wallet, cash, pay-later, loan; check each on its own | `ledgerAddAccount`, `ledgerCheck`, `ledgerAccept`, `ledgerStartFresh` | "Where it sits" beside "what it is for"; one check per account |
| 11 | Money in and out by kind (C1 to C7) | `ACT.moneyIn / moneyOut / transfer`, kinds `in`, `borrow`, `repay`, `transfer` | one door for family support, borrowed, lent, paid back, refund |
| 12 | The month from pay day to pay day (A6) | `ledgerSetPayDays`, `periodOf`, `flows` | the month starts on the 10th for Mako; the flow strip is that month's events |
| 13 | Cards in full (A5 team form): cut-off day, older balance, instalments | `ledgerCardDue`, `ledgerCarryOver`, `ledgerInstalment` | what is due on the next pay day, not only what is on the card |
| 14 | Wallet mode, other currencies | `ledgerSetMode`, kinds `hand`, `convert` | handed to the wallet since pay day; dollars beside Total |

## Which screen figure comes from which ledger function
`P = placesOf(S)`; all amounts are money units; `day` may be passed for "as of".

| On screen (v1 source) | After wiring |
|---|---|
| In your bank now (`nowOf.bank`, `cfg.bankNow`) | `P.accounts[bankId]`; with several accounts each its own line, and their sum is `P.have` |
| "as of" day (`cfg.bankNowAt`) | `P.checks[bankId].date`, or the opening event's `date` before the first check |
| Each card: what is on it, pay day (`S.cards`) | `ledgerCardLines(S)`: `now`, `older`, `payDay`; set aside for it: `P.cards[cardId]` |
| Bank after the cards are paid (`nowOf.afterCards`) | `P.accounts[bankId] - P.forCards`. **Not `P.afterCards`** once there is a second account: that one is every tracked account less the cards. Checked against v1 in `wiring_migrate.js` |
| You owe (`mapOf.owed`) | `P.owed` (cards, pay-later, loans); other currencies in `P.foreignOwed` |
| Total (`mapOf.total`) | `P.total` (always equal to `P.have`; `ledgerProof(S).ok` is the guard) |
| Saved (`mapOf.saved`), each burrow | `P.saved`, `P.burrows[goalId]` |
| Free to spend (`mapOf.free`) | `P.free` |
| Bills left (`mapOf.billsLeft`) | `P.bills`; without the card lines `P.billsOnly` |
| Pay not placed yet | `P.waiting` |
| A place below zero | `P.below` (amber, never refused) |
| "They add up" (`proofOf`) | `ledgerProof(S)` |
| Check your bank: the difference | `ledgerUnexplained(S, acct, typed, today)` before saving; `P.checks[acct].unexplained` after |
| This month in and out | `flows(S, from, to)` with `periodOf(S, today)` |
| Due on the next pay day | `ledgerCardDue(S, cardId, today)` |
| Old plan beside the new figures, once | `S.oldFigures.plan`, `S.oldFigures.shownOnce` |

## Left out until later
- Merging two devices that both added events (ids are a counter; see `LANE_ledger_core.md` choice 13). Until then the `rev` rule and the kept copy decide, as today.
- History from before the first typed balance (ledger core point 9), "undo the adjust" when a late statement arrives (point 8), a kind `shift`.
- The server half of the cloud guard (a format number the server enforces). The page half is in steps 3 and 5.
- Japan and France account presets, the full 95% sweep, all copy. The words in this file are placeholders for the copy pass.
- Removing the plan fields the ledger replaced (`cfg.bankNow`, `S.cards`, `plan.debts` balances). They stay in the copy, unread, so a frozen copy and a rollback both still work.
