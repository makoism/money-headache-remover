# Open questions for the tests after v1 (side session C, 2026-11-19)

The tests in `tests/next/` are written from the plain rules in PLAN.md, DECISIONS.md, HANDOFF.md sections 4 and 5, and `tests/qc/proof_formula.js`. Where those do not say what should happen, the test does not guess: it prints `WAIT` and the question number below. When Mako answers, turn that `WAIT` into a real check and write the answer into DECISIONS.md.

Each question has a suggested default, so the builder is never blocked. A default is only a suggestion until Mako says yes.

## The rolling month window (`window_fuzz.js`)

**W1. How far back and how far ahead does the window reach?**
Today the app shows 24 months from Nov 2026. Options: (a) always 24 months starting at this month, so past months leave; (b) from the month the person started, growing forever; (c) a fixed number of past months (say 12) plus 24 ahead.
Suggested: (c). Look back keeps a year of history, Look ahead keeps two years, as today.

**W2. What does the person see for a month that has left the window?**
The test only proves its data is kept. Options: shown in Look back as before; one summary line; nothing on screen (kept in the saved copy only).
Suggested: kept in the saved copy and still shown in Look back.

**W3. Which month does the bank start belong to once the first month has left the window?**
Today `bankStart` is "what you have in the bank at the start of the first month" (model.js). If the first month moves, the bank start must stay tied to the month it was typed for, or every bank figure changes. Options: store the month it belongs to with it; or roll it forward into the first month still shown.
Suggested: store the month with it (it is the person's real starting point). Step B1 replaces it with opening balances anyway.

## The ledger (`ledger_conservation.js`)

**L1. Spending more than a place holds.**
"Spending past the plan is real money: it comes out of the bank and stays out" (PLAN.md section C). In the ledger, if Free to spend (Track mode) holds 3,000 and the person logs 3,500, where do the 500 come from? Options: refuse with a plain message; take it from the Chest; let the place go below zero and show it in amber.
Suggested: let it go below zero and show it in amber, because refusing hides real spending. Note: `proof_formula.js` and its "nothing negative" check assume it never happens, so that check would change too.

**L2. Does Undo still work after the page is closed and opened again?**
The test proves undo restores exactly within one visit. Options: undo history is saved with the ledger; undo only within a visit.
Suggested: saved, because the ledger is the history.

**L3. In Wallet mode, what does Check your bank compare the typed balance with?**
In Wallet mode Free to spend goes "to your wallet" and is outside Total. If the person pays from the same bank account with a card, the bank still holds that money, so every check would show it as "unexplained". Options: compare with Total; compare with Total + wallet money not yet spent; ask whether Free to spend is cash or in the bank.
Suggested: ask once when Wallet mode is chosen ("Is your Free to spend cash, or still in the bank?").

**L4. What number does Free to spend show in Wallet mode?**
Spending is not tracked in Wallet mode, so the number cannot go down. Options: what was handed to the wallet this month; since the last pay day; the planned amount.
Suggested: what was handed out since the last pay day, labelled "handed to your wallet".

## Migration into the ledger (`migration_fixtures.js`)

**M1. Which place does the bank start sit in after migration?**
"Goal starts and the bank start become opening balances; the rest starts as Chest money to place" (HANDOFF.md section 5). The goal starts clearly open in their burrows. The bank start has no burrow. Options: it opens in the Chest, to be placed; it opens in a separate "bank" place.
Suggested: the Chest, so the first thing the person does is place the money they already have (decision 8, setup ends by placing the money).

**M2. What is "the rest" that starts as Chest money?**
Options: (a) only the bank start (so the Chest holds exactly the bank start); (b) the money the old plan says should be there today (the forecast bank for this month), minus the goal balances it already counts. (b) is closer to the person's real money, but it is a forecast, not something they typed.
Suggested: (a), then the first Check your bank shows any difference honestly. The test already proves Total is at least bank start + goal starts.

**M3. A bank start below zero (an overdrawn account).**
38.31 keeps a negative bank start on purpose (model.js `clampBank`). A place cannot go below zero in the proof formula. Options: an opening balance below zero in the Chest; a separate "owed" line; treat it like a card or loan in Debts.
Suggested: a separate "owed" amount shown in amber, never mixed into the Chest.

**M4. Education, Giving and Investing running totals.**
Since 38.30 Home shows these rooms with running totals from the plan (planned money, not typed balances). Do those become opening balances? The rule only names goal starts and the bank start.
Suggested: no. They start at zero and fill from the first pay day; the release note says so in one line.

**M5. Receipts already logged.**
Do old receipts become spend events in the ledger? If yes, they lower places that only start existing at migration, which can push a place below zero.
Suggested: no. Old receipts stay as history (Look back); the ledger starts at the migration date.

**M6. Saved copies older than 25.0.**
Before 25.0 goal starts were kept in settings (`rainyStart`, `moveStart`, `travelStart`, `carStart`; still listed in model.js `CFG_AMOUNTS`). PLAN.md says "all 19 old builds" (25.0 to 38.28); HANDOFF.md says "every stored version since 38.2x". No fixture exists for anything older than 25.0.
Suggested: out of scope unless Mako knows someone still on a pre-25 copy.

## Not questions, but found while writing the tests (for the builder)

- `model.js` `cleanOnce` and `cleanItems` drop any month that is not in `MONTHS` when a saved copy loads. With a moving window, a month that leaves the window would be deleted on the next load. `window_fuzz.js` checks this.
- `model.js` line 1072 (statement import) skips receipts dated outside `START` to `END`, and `ui0.js` `todayStr()` clamps today into `START` to `END`. Both need to follow the window.
- `cleanRecurring` moves a start date before `MONTHS[0]` up to the first month. With a moving window that silently rewrites the saved date on every load once the first month moves.
- The 38.31 saved copy is not a fixture yet, because 38.31 is still changing. Once it ships, add it to `tests/fixtures/old_builds.txt` and rerun `make_fixtures.js`: it is the copy Mako's own real numbers will be in.
