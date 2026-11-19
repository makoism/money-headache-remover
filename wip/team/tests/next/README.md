# tests/next: tests for the work right after v1

Written 2026-11-19 by side session C, before the features exist. **All three tests are expected to fail until their feature is built.** Each one prints `NOT BUILT` while its app hook is missing; that counts as a failure.

| File | Guards | Run | Today |
|---|---|---|---|
| `window_fuzz.js` | The rolling month window (PLAN.md step 11): months follow today; every saved plan keeps its numbers when the window moves; nothing before or after is lost | `node tests/next/window_fuzz.js [count] [seed]` (under a second) | FAIL: the months are fixed at Nov 2026 to Oct 2028 |
| `ledger_conservation.js` | Step B1: Total = Chest + This month + Burrows after every event, Wallet and Track mode as in `tests/qc/proof_formula.js`; undo restores exactly; balances come from the ledger; check your bank moves no money; cents exact | `node tests/next/ledger_conservation.js [count] [seed]` (about a second) | FAIL: no ledger (the reference half passes) |
| `migration_fixtures.js` | Step B1 migration: each of the 19 old builds' saved copies loads into the ledger with goal starts and the bank start as opening balances, everything else as Chest money to place, nothing lost | `bash tests/setup_env.sh && node tests/next/migration_fixtures.js` (about 75 seconds) | FAIL: no ledger (the 171 "nothing lost" checks pass) |
| `make_fixtures.js` | Not a test. Makes `fixtures/v*.json` from the real old builds in `/tmp/v35/old` | `node tests/next/make_fixtures.js` | 19 of 19 made |

- **One place for app names:** `lib.js` holds the three hooks (`windowAt`, `LEDGER`, `PAGE_HOOK`). When a feature is built, point its hook at the real functions; nothing else in the tests needs to change.
- **WAIT lines** are questions the docs do not answer. They are in `SIDE_C_QUESTIONS.md`, each with a suggested default. They neither pass nor fail.
- **Fixtures** are saved copies written by each old build's own save code, with made-up numbers (bank start 23,400; goal starts 6,100 and 2,750; pay 41,000; receipts 120, 350, 80; food 4,321 in Feb 2027 only). Builds 25.0 to 27.7 took one receipt and 37.2 took two; the fixture records exactly what took.
- **The tests were checked against scratch mocks** (not committed): a window anchored at the first month passes and a naive window that re-applies the bank start fails; a correct ledger passes and one that is off by one cent on a take out fails; a mock migration passes all 419 checks.
- When a feature lands, move its test into `tests/verify.sh` and delete its `NOT BUILT` line.

## The ledger design proof (side session, 2026-11-19)
- `ledger_ref.js` is a tiny reference model of `wip/team/LEDGER_DESIGN.md` (tests only, never app code). `ledger_personas.js` holds seven made-up personas and two 38.31 migrations; `ledger_personas_run.js` checks them from `ledger_conservation.js` (identities I1 to I10, worked out on the account side, independent of the model).
- Run the design proof: `MODEL=tests/next/ledger_ref.js node tests/next/ledger_conservation.js` (PASS). Against model.js it stays NOT BUILT until B1 offers `ledgerFresh`, `ledgerAdd`, `ledgerUndo`, `ledgerRedo`, `placesOf`, `migrate3831` (names in `lib.js` MAYBE).
- `ledger_fuzz.js`: the design's own shape (several accounts of every type, every kind, dates over four years, statements imported late, undo by id, redo, reopen, months as pay-day views). `MODEL=tests/next/ledger_ref.js node tests/next/ledger_fuzz.js [count] [seed]` (PASS, a few seconds). B1 is built against this and `ledger_conservation.js`; the app needs `periodOf` and `flows` as well as the names above.
