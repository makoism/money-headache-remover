# Lane: the money door (side Q). Handoff

Branch `side/money-door`, cut from `side/ledger-core`. Finished 2026-11-19. Made-up numbers only. Logic and tests, no screens.
Nothing that existed was changed. Four new files:

| File | What it is |
|---|---|
| `wip/team/money_door.js` | The kinds as a data table (`DOOR`) and pure functions on top of `ledger.js`. No DOM, no storage, no clock. |
| `wip/team/tests/next/money_door_test.js` | Every kind on nine starting pictures, to the cent. |
| `wip/team/MONEY_DOOR.md` | The kinds and their lines as a person reads them, the choices, every situation mapped to a kind, what fits none. |
| `wip/team/LANE_money_door.md` | This file. |

## Proof
`node wip/team/tests/next/money_door_test.js` from any folder, about 3 seconds. Last run: **PASS, 337,129 checks, 0 fail**, no GAP line: the five ledger gaps below are closed and each is a hard check (was 335,741 with five gaps printed).
`bash wip/team/tests/next/ledger_core_all.sh` still ends in LEDGER CORE ALL PASS (nothing of the ledger was touched).

What the test holds:
1. **The table**: seven kinds in, nine out, each with a label, one line (no em dash, no full stop), its questions with their words, and what it does to Total, Free to spend, Bills left, Saved and Owed. What a kind says must be what its usual way does.
2. **The sweep**: every kind on nine pictures (Mako's shape; Bea, Carlo, Mika, Jun and Tess, Rina, Dan from PERSONAS_PH.md with their day-one figures; a Wallet-mode person with dollars, a card not paid in full and a dollar card; somebody with nothing, in yen), with every account that can answer, every "who" plus a new person, five places, three amounts (one cent, an odd amount, far more than there is). Each time: the figures move by exactly what the way says; accounts = places = Total; every "for the card" line = its card; Lent = the "owed to you" accounts; undo puts every figure and the event list back exactly, redo brings it back, undo again takes it out; a refusal leaves the saved copy byte for byte as it was. Every way in the table is reached, every kind is recorded at least 20 times.
3. **The lines in numbers**: 24 steps on Mako's shape with every amount written out by hand, then all 24 undone back to day one.
4. **The people**: what each persona tries, and section C (C1 to C7), with hand-written figures. A whole paluwagan the exact way ends where it started.
5. **A8**: a bill and its receipt, a transfer on two statements, a card payment on two statements, dollars brought home on two statements: each in the picture once.
6. Four planted mistakes (a wrong figure in a way, Lent taking from the wrong place, the 3-day window, extra pay starting a month) each made the test fail.

## Public functions (`money_door.js`)
| Function | One line |
|---|---|
| `DOOR` | The table: per kind `id`, `side`, `label`, `line`, `asks`, `maybe`, `say` (the words of each question), `place` (default), `says` (the five figures, usual way), `ways`. |
| `doorKinds(side)`, `doorKind(id)` | The list for "in" or "out"; one kind. |
| `doorChoices(S, kind)` | Which of this person's accounts can answer each question: `{ account, who, to, canAddWho }`. |
| `doorSays(kind, way, place, mode)` | What a way does to the five figures in words: up, down, same. |
| `doorFigures(S, day)` | Total, Free to spend, Bills left, Saved, Owed, plus Waiting, Lent, the card lines, what sits beside Total. Saved leaves out what is lent. |
| `doorPlan(S, kind, answers, today)` | Reads the answers, changes nothing: the ledger events, the ways, an account to make, or which answer is missing. |
| `doorExpect(S, plan)` | What the table says each figure will move by. |
| `doorSeen(S, plan, src)` | Events already logged that look like the same money (A8). |
| `doorApply(S, kind, answers, today)` | Records the kind as one step through `ledgerAddMany`. Returns the events, before, after, moved. |
| `doorPreview(S, kind, answers, today)` | The same answer worked out on a copy, nothing recorded. For a "this is what will happen" line before the person confirms. |
| `doorUndo(S, id)`, `doorRedo(S)` | The ledger's own undo and redo: one kind is one step. An account made for a new person leaves with the undo and comes back with the redo. |
| `doorSame(S, id, src)` | After a `seen` refusal, "yes, the same money": the event also remembers that statement line (`ledgerAlso`). |

Answers: `amount` (or `cents`), `date`, `account`, `who` (an account id or `{ name }`), `to`, `landed`, `place`, `from`, `second`, `fromPay`, `src`, `sure`, `note`. They are described at the top of `money_door.js`.
Refusals: `{ ok: false, code, ask, why }`. Door codes: `kind`, `ask` (with the answer that is missing), `acct-kind`, `place-kind`, `seen` (with the ids). A ledger refusal comes through with the ledger's code and `from: 'ledger'`. The screens write their own words from the code.

Which ledger events each kind becomes:
| Kind | Events |
|---|---|
| Pay, Gift, Sold, Other in, Refund | `in` (Pay: `sub: 'pay'`, `startsPeriod` false for extra pay) |
| Borrowed | `borrow` |
| Lent | `transfer` to the "owed to you" account + `move` place to `lent`. By card: `borrow` (the owed-to-you account up, the card up) + `move`. From the wallet or with pay-later: one event with `place: 'lent'` |
| Paid back | `transfer` back + `move` `lent` to the place |
| Spent, Bill, Family support, Other out | `spend` |
| Paid a card | `repay`, one per part (the card, then its older balance) |
| Paid back a loan | `repay`; taken out of pay: a negative `adjust` on the loan |
| Moved | `transfer`; to the wallet: `hand`; two currencies: `convert` |
| Saved to a burrow | `move` (with a `transfer` first when the money changed account) |

## Wiring it in (main session, after the ledger is wired)
1. `build.sh`: put `money_door.js` right after `ledger.js`. Its 38 top-level names all start with `door` or `DOOR` and clash with no page file (checked by hand; add the name check of `ledger_core_all.sh` for this file too). In the page it uses the ledger's globals; in Node it requires `./ledger.js`.
2. `ACT.moneyIn` and `ACT.moneyOut` become one thin call: `doorApply(S, kind, answers, todayYmd)` inside `ACT.tx`. Undo is `doorUndo`.
3. The Home figures can come from `doorFigures(S)` or `placesOf(S)`: since gap G2 was closed the ledger gives Lent its own figure (`placesOf().lent`, outside Saved), and `doorFigures` reads it.
4. Statement import and receipts: give each line its `src` and call `doorApply`. On `seen`, show "already logged" with the event; on "it is another one", call again with `sure: true`.
5. `tests/next/money_door_test.js` runs in `ledger_core_all.sh` (added by the ledger core lane). It still belongs in `check.sh`.

## Found
1. **"Paying the card leaves Total the same" is not what the ledger does.** LAUNCH_CHECKLIST A4 and personas Carlo (thing 9) and Mika (thing 5) say it. In the ledger Total stays when you pay **by** card and falls when the card **is paid** (the money leaves the bank). What stays the same on that day is Free to spend and "bank after the cards are paid". The door follows the ledger and the line says "Free to spend does not move". The checklist and persona wording should be changed by whoever owns them.
2. **Lending left the lent money looking spendable.** In the design a loan to a friend moves no place, so Free to spend still counts it. The door moves it to a place of its own (`lent`), which always equals the "owed to you" accounts.
3. **Paying for a friend by card had no shape.** It is now Lent with a card: `borrow` with the owed-to-you account as the account that goes up. The one rule holds (tested).
4. Five ledger gaps, below.

## Gaps in the ledger: all five closed by the ledger core lane (third and fourth pass)
Each had a failing case in the test, printed as `GAP`. Every one is a normal check now and the test prints no GAP line. The table is kept as the record; the last column says what was done.
| # | Gap | Failing case (made-up) | Smallest fix (as proposed) | Done |
|---|---|---|---|---|
| G1 | An event holds one `src`. A transfer shows on two statements; the door refuses the second line as "seen", but that second line is then not known as logged. | BPI line `stmt:bpi-dec:9` 5,000 to GCash is logged; GCash line `stmt:gcash-dec:21` is refused as seen; `ledgerHas(S, 'stmt:gcash-dec:21')` is false, so importing the GCash file again asks again. | Let an event carry more sources (`srcs: []`) with a `ledgerAlso(S, id, src)`, and let `ledgerHas` and the `already` refusal read them. | Closed. An event holds further sources in `srcs`; `ledgerAlso`, and the door's `doorSame` after a `seen` refusal. |
| G2 | `placesOf` counts every unknown place as a burrow, so the place `lent` is inside its `saved`. | Lend 390: `placesOf(S).saved` rises by 390. | Reserve `lent` in `placesOf`: its own figure, outside `saved` and `burrows`. `doorFigures` does this today. | Closed. `lent` is reserved: `placesOf().lent`, inside Total, outside Saved and the burrows. |
| G3 | The ledger cannot take back an account. Undoing the first "Lent" to somebody new leaves their empty account. | Lend 390 to Lea (new), undo: `S.accounts` is one longer. Every figure is exactly as before; only the empty account stays (it must, or redo would be refused). | Either accept it (it can be closed, it holds nothing), or let undo carry "made account" and remove it when it has no events. | Closed. The ledger makes the account with the step (`ledgerAddMany(..., { accounts })`); undo takes it out when no event left names it and keeps it in the undone step; redo puts it back. The door passes `plan.make` that way. |
| G4 | Wallet mode: money put back from the wallet into the bank does not lower "handed out since pay day". | 4,000 handed out, 1,500 moved back: Free to spend still says 4,000, should be 2,500. Total is right. | Count a `transfer` from the untracked wallet into a tracked account as a negative hand. | Closed. A transfer from the wallet into an account in Total lowers handed out since pay day, by day, never below zero. The door has the way `back`. |
| G5 | A card balance typed after its cut-off day counts as spent after the cut-off. | Mika's UnionBank card, cut-off the 17th, 12,480 typed on the 19th, 2,600 spent on the 20th: `ledgerCardDue` says due 0, later 15,080. It should be due 12,480, later 2,600. | Treat an opening balance as the statement (due), or ask at setup "how much of this is from after the cut-off". | Closed. In `ledgerCardDue` a balance typed after the cut-off (an opening, an accepted check) is the statement: due 12,480, later 2,600. |

Also still missing, known from the ledger lane: a kind `shift` for owed money moving between two owed accounts (a balance transfer). The door has no kind for it.

## Choices made without asking
All fourteen are in MONEY_DOOR.md, "The choices I made". The ones most worth a look by Mako when he has the app in front of him:
- Paid a card lowers Total (the ledger's reading), Free to spend does not move.
- Lent lowers Free to spend and has its own figure beside Saved.
- Family support comes out of Bills left; Refund goes back to Free to spend; new pay, gifts and borrowed money land in Waiting.
- A statement line that looks like money already logged is refused as "seen" within 3 days for moves between two accounts, the same day otherwise.
- Paluwagan stays the simple default of PH_ACCOUNTS.md (Bill each round, Other in for the pot); the exact way also works and is tested.

## Not done
- No screens, no final words. Labels, lines and question words are first drafts for the voice lane (`DOOR[].label`, `.line`, `.say`, `.ways[].so`).
- Not wired into the app, `check.sh` or `ledger_core_all.sh`.
- The door does not merge two devices or edit a logged event (edit is undo by id plus a new entry, as in the ledger lane).
