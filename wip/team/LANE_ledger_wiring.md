# Lane: ledger wiring (side P). Handoff

Branch `side/ledger-wiring`, cut from `side/ledger-core` at `a4df93e`. Finished 2026-11-19. Made-up numbers only.
New files only. `ledger.js`, `ledger_ref.js`, the existing ledger tests and every app file are untouched. Nothing merged, nothing deployed.

| File | What it is |
|---|---|
| `wip/team/LEDGER_WIRING.md` | The wiring as ordered steps, one commit each: files and functions, the test that fails before and passes after, what the person sees. The figure table. What is left out. |
| `tests/next/wiring_make_fixtures.js` | Makes saved 38.31 copies with the real `model.js` and the page's own `normalize` from a git ref. One command to refresh. |
| `tests/next/fixtures/wiring/*.json` | 8 saved copies, each with what the person typed and what v1 Home showed. |
| `tests/next/wiring_migrate.js` | The 8 copies through `migrate3831`. Fails on any field it cannot read. **Today: PASS, 300 checks on 9 copies** (was FAIL, 18 of 240, until the ledger core lane fixed the gaps below; it added the fixture `samecard`). Runs in `ledger_core_all.sh`. |
| `tests/next/wiring_store.js` | The new key, the guard, the move on first load, against `lstore.js`. **Today: FAIL, NOT BUILT** (`lstore.js` is wiring step 2). Against its sketch it passes, 95 checks, and runs that way in `ledger_core_all.sh`. |
| `tests/next/wiring_store_sketch.js` | A storage glue that passes `wiring_store.js` (86 checks). Tests only; a starting point for `lstore.js`. |
| `tests/next/wiring_page.js` | Source checks per wiring step (`node wiring_page.js 3` runs step 3). **Today: FAIL, 31 of 31.** |

(`tests/next/` is `wip/team/tests/next/`.) All run in node in under a second, with no browser and no page.

## Run
```
node wip/team/tests/next/wiring_make_fixtures.js [git ref]     # default origin/wip-38.31; later the v1 candidate
node wip/team/tests/next/wiring_migrate.js [-v]
node wip/team/tests/next/wiring_store.js
STORE=tests/next/wiring_store_sketch.js node wip/team/tests/next/wiring_store.js    # PASS, proves the test can pass
node wip/team/tests/next/wiring_page.js [step]
```
The fixtures in the repo were made from `origin/wip-38.31` at `9916cde`, page version 38.31. `git fetch origin wip-38.31` first in a fresh clone.

## plan.debts: the field names, settled
Checked against the real `model.js` (`cleanDebts`, line 990 of `origin/wip-38.31`) and `ui7.js` (where the screen adds one):

`plan.debts[] = { id, name, kind, balance, apr, min, extra }`, `kind` one of `card`, `loan`, `personal`. Whole amounts only. At most 12.

- The balance is **`balance`**. `ledgerRead3831` tries `owed`, `bal`, `balance`, `start` in that order. It works today only because the first two are absent. Replace the list with `balance` alone.
- There is **no `payDay` and no date** on a debt. `ledgerRead3831` reads `d.payDay` (always undefined) and `migrate3831` reads `d.at` (never passed on). Both harmless; the loan opens on the day of the move.
- `apr`, `min`, `extra` are typed, but they are not balances. They stay with the plan (listed as KNOWN in the test).
- **`id` is not read.** See gap 3.
- A debt of kind `card` is an interest-bearing card in Cards and loans. It is not one of `S.cards` (those are paid in full and "never touch the plan"). It arrives as a loan, with nothing set aside. If a person typed the same card in both places it is owed twice (300 and 300 give Owed 600). The model does not link them, so the move cannot know. The once-screen of step 5 should ask when a debt of kind card and a card in `S.cards` share a name.

Other shape facts the move depends on, all read from real saved copies:
- `cfg`: `bankNow`, `bankNowAt`, `bankStart`, `bankAt` are read. A copy can have `bankStart` with no `bankAt` (saved before the day existed).
- `cards[] = { id, name, owed, payDay, at }`; `payDay` and `at` can be `null`.
- `plan.goals[] = { id, name, target, start, due, slot, monthly?, why?, emergency?, stretch?, stretchOn? }`. Goal starts are whole amounts (`updateGoal` rounds).
- **A 38.31 copy has no `ui.payDays` and no `ui.freeMode`.** Every moved ledger starts with `payDays: [1]` (calendar month) and Track. The model's `PAYDAY` is a constant, 15, and is not in the copy. Mako's 10th has to be asked (wiring step 12) or typed.
- The kind of a goal is in `ui.gk[goalId]` (`'debt'` for A3), not on the goal.
- Whether the plan is still the untouched sample is not in the copy as a field; the page works it out (`planIsSample` in `ui0.js`).

## Gaps in ledger.js: all fixed by the ledger core lane (third pass, on `side/ledger-core`)
Each had a failing case in `wiring_migrate.js`; all pass now. The four points below are kept as the record of what was found. What was done:
1 (W1): a debt goal becomes a loan account of target less paid, with the goal's id; no burrow. 2 (W2): the caller passes `more.planIsSample === true`
and nothing of `plan.goals` and `plan.debts` moves. 3 (W3): the loan account id is the debt id (the field `debt` always holds it). 4 (W4): the call is
`migrate3831(saved, today, figures, more)`; the saved copy is frozen whole. A fifth, found on the way (W5): a debt of kind card named like a card typed
on Home is asked about (`S.oldFigures.questions`, `ledgerSameCard`), not owed twice. Details: `LANE_ledger_core.md` "Third pass" and `LEDGER_DESIGN.md`.

1. **A debt goal is moved as savings.** A goal with `ui.gk[id] === 'debt'`, target 30,000, start 12,000 (paid so far): `migrate3831` opens a burrow holding 12,000 in "Savings from your old plan". Total is 12,000 too high (33,300 instead of 21,300) and Owed is 0 instead of 18,000. DECISIONS.md says A3 debt goals become loan accounts. `ledgerRead3831` does not read `ui.gk`. Expected by the test: no burrow; a loan of target less start, traceable to the goal id. Fixture `debtgoal`.
2. **The sample's invented emergency fund is moved as if typed.** A person who opened the app, kept the sample plan and typed only the bank (87,000): the sample goal `rainy` has `start: 140000` in yen, so Total becomes 227,000. "Only typed figures move." The copy cannot say this by itself; the page can (`planIsSample(saved)`). Smallest fix: `migrate3831` takes a flag (for example `old.goalsAreSample`), set by the caller, and skips goal starts; or `lsMove` blanks them. The test expects no burrow. Fixture `sample`.
3. **A debt loses its id.** Accounts are named `loan1`, `loan2`; `plan.debts[].id` is dropped. After the move nothing ties a plan debt (which keeps its rate and minimum payment) to its loan account, so the plan and the ledger cannot name the same debt. Expected: the account id is the debt id, or a field on the account holds it. Fixtures `loan`, `euro`.
4. **Handing over the old plan figures changes the frozen copy.** The only way to give `migrate3831` the figures to show once is `saved.planFigures`, and then `S.frozen` holds a `planFigures` key the saved copy never had. Passing the plain shape instead makes `S.frozen` the plain shape, not the saved copy. Expected: a third argument, `migrate3831(saved, today, figures)`. All 8 fixtures. (`wiring_store_sketch.js` works around it by setting `frozen` itself.)

Smaller, no failing case:
- `placesOf().afterCards` is every tracked account less the card lines. v1 Home's "Bank after the cards are paid" is one bank less the cards. After the move they differ whenever goal starts moved (the savings account counts). The wiring uses `accounts[bankId] - forCards`; the test checks that against v1. Worth a field on the card ("paid from") when accounts arrive (step 10).
- `ledgerClean` on a copy with no `ledgerV` stamps it as version 1. Do not call it on a 38.31 copy; `lsLoad` does not.

## Choices made without asking
- One copy under one new key, `burrow-ledger-v1`, plan and ledger together; the old key never written after the move. (Two keys for plan and ledger would give two `rev`s that can drift.)
- The storage rules in one pure file, `lstore.js`, so they are tested in node. Function names are hooks at the top of `wiring_store.js`.
- A damaged stored ledger is kept and not moved over; the page must show a rescue message. A copy with no ledger is never saved under the new key.
- The cloud: ledger copies go to a second vault id derived from the same code, on the page, so no server change is needed and a 38.31 page never downloads one. The server format number from `LANE_vault.md` stays optional.
- Step 3 (guards) ships before any ledger copy exists, on the old key, so pages in the wild learn to refuse first.
- Between steps 5 and 6 `ACT.setBankNow` and `ACT.setCard` write both the old fields and the ledger, so Home never disagrees with the ledger.
- A debt goal is a loan of target less start. Both were typed; the difference is what v1 itself shows as still to pay.
- A balance typed in setup (not "bank now") moves, marked `confirm`. No balance typed at all: the bank opens empty, marked `confirm`.
- Fixture ids use a fixed clock inside the page code, so a refresh only differs where the page differs.

## Not done
- No page tests. `LEDGER_WIRING.md` names the three to write (`tests/qc/ledger_guard.js`, `ledger_move.js`, the double statement import) and two node tests (`wiring_actions.js`, the 6,000 receipts copy). They need the page parts of v1, which are not on this branch.
- `wiring_page.js` only reads source. It says a call is there, not that it works.
- The fixtures are from `origin/wip-38.31`, not from a shipped v1. Refresh them from the candidate before step 5 (one command, above).
- No fixture has a debt of kind card that repeats a card in `S.cards` (see above), a wallet-mode copy, or two pay days: 38.31 cannot save those.
- `tests/next/migration_fixtures.js` (the 19 old builds) still waits for the wired page, as in `LANE_ledger_core.md`.
