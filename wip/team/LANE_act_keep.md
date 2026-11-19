# Lane H handoff: act_keep (nobody loses data, every ACT action)

Branch `side/act-keep-checks`, from `wip-38.31`. Tests only. No app file was changed.

## What is new

- `tests/qc/act_keep.js`: reads the list of ACT actions from the running page (`Object.keys(ACT)`), makes one call per action on a made-up plan and measures what the call did to the saved data. An action that replaces or removes an earlier saved value must prove three things: a copy of the earlier data is in the saved storage (the 3-day copy, `S.ui.keep`), Undo in the same visit is exact (deep equal), and after a reload 2 days 23 hours later Undo is still offered and is exact.
- `tests/qc/act_keep.known`: named expected failures, one pattern per line. Empty now. A listed line that stops failing makes the run fail, so the list stays honest.

A new action with no call in the test's `CALLS` table prints `FAIL name: UNKNOWN` and fails. A call that changes nothing prints `NO EFFECT` and fails. So card balances and the restore snapshot will fail as UNKNOWN the day they land, until one line is added to `CALLS` for each (for example `setCardBalance: { call: A => A.setCardBalance('card1', 420) }`).

Run: `node tests/qc/act_keep.js` (about 4 minutes), or one action: `node tests/qc/act_keep.js removeGoal`.

## Line to add to check.sh (full tier, next to the other qc lines)

```
qc tests/qc/act_keep.js;
```

It fails today (22 findings below). Either fix, or put the agreed lines in `tests/qc/act_keep.known` in the same commit.

## How it reaches ACT

ACT sits inside the page's own function, and `__t` does not carry it. The test loads a temporary copy of the built page with one line added before `window.__t = {` (`window.__ak = { ACT, KEY, get S() { return S; } }`). Nothing else differs. If you would rather not have that, add `ACT, KEY` to `__t` in music.js line 143 and tell me; the test then needs two lines changed.

## Not checked twice

The button paths are already proven and are not repeated: Set all to zero and Reset month (zero_safe, reset_undo), removing a goal or bill line and Restore samples from the screen (remove_undo), setup run again and backup loaded (setup_undo), receipts by hand (receipt_undo), unknown fields (keep_unknown), failed save (save_fail). act_keep covers only the ACT door, which none of them touch.

## Result on wip-38.31 (dca351d): 8 pass, 22 fail

Pass: commit, canUndo, lastLabel, clearUndo, summary (change nothing), addLine, addGoal, addReceipts (add only).

Every failing action has the same two gaps: **no copy in the saved data**, and **after a reload no Undo is offered, so the earlier data is gone**. ACT's undo list lives only in memory (`undoStack` in actions.js line 9), so it ends with the visit.

| Action | What was lost | Undo in the same visit |
| --- | --- | --- |
| tx (dropping a goal inside it) | the goal, its saving and its month figures | NOT exact: `ui.ms.rainy` is left at 0 |
| removeGoal | the goal, `steps.goal:id`, `once.*.goal:id` | NOT exact: `ui.ms.rainy` is left at 0 |
| removeLine | the line, `steps.line:id` | exact |
| removeReceipts | the receipt | exact |
| setGoalSaving | the earlier saving, and last month's own figure `once.2026-11.goal:id` is dropped | exact |
| setHome | the earlier Home order | exact |
| setBalance | the earlier balance | NOT exact: `cfg.bankAt` is left at today, so Home would date the old balance as entered today |
| setPay, setIncome, setMinBalance, setCeiling, setLine, renameLine, setLineEnds, updateGoal, setAims, setName, setCurrency | the one earlier value | exact |
| sweep, unsweep, release | last month's figures for Free to spend and the goal | exact |
| undo | the change that was undone (there is no redo) | no Undo at all |

**Update on 4175751 (33 actions): 8 pass, 25 fail.** The three new actions were caught as UNKNOWN on the first run, as intended, and now have calls. They fail the same way: `setBankNow` (the earlier bank figure), `setCard` (the card's earlier amount owed), `removeCard` (the whole card). Undo in the same visit is exact for all three; no copy is saved and after a reload no Undo is offered. `removeCard` belongs with the removals in point 1 below.

## What I suggest (the main session decides)

1. **Fix, one place: `ACT.tx` in actions.js lines 23 to 31.** When `changed` is true, keep the before copy the way the screens do: take `snapNoCopy()` before `fn()` runs, then `keepCopy(thatSnap, label)` and `offerUndoG`. That alone turns copy and reload green for every action, and it matters most for the paths people use today: the assistant's Apply (ui4a.js line 164), setup from statements (ui45u.js line 265), Add money on a burrow (burrows.js line 156, `ACT.sweep`), and any removal.
2. **One thing to weigh first:** there is one copy slot (`S.ui.keep`). If a small change such as setName keeps a copy, it overwrites the 3-day copy of an earlier big change such as Set all to zero. Two ways out: keep the copy only when the slot is empty or older than this visit, or keep it only for tx, the removals, setHome and the sweep family, and name the single-value setters in `act_keep.known`. Lines for the second way:
   ```
   ^FAIL (setPay|setIncome|setMinBalance|setCeiling|setLine|renameLine|setLineEnds|updateGoal|setAims|setName|setCurrency): REPLACES
   ^FAIL undo: REPLACES
   ```
3. **Two small exactness fixes** (each fails on its own even after point 1): add `ms` to `UI_SNAP` (actions.js line 8) or stop the redraw writing `ui.ms.rainy` when a goal goes; and find what writes `cfg.bankAt` again after `restoreState` on undo of setBalance.
4. `undo` itself: suggest a named expected failure unless Mako wants a redo.

## Part 2: label_agree (done; 65 pass, 1 finding seen in 3 situations, on b5c51e3)

- `tests/qc/label_agree.js`: a figure with the same name shows the same amount wherever it is written. Every amount is read off the screen (Home with More open, Plan Month, Plan Burrows, Plan All months, Receipts, and the boxes in Settings), never from storage, so it survives the move to `cfg.bankNow` and `S.cards`.
- `tests/qc/label_agree.known`: named expected failures, empty.

Run: `node tests/qc/label_agree.js` (about 1 minute). Line for check.sh, full tier:

```
qc tests/qc/label_agree.js;
```

Four made-up situations: dollars with one card and two receipts; yen, spent past the plan and overdrawn; Mako's shape (one bank, two cards, the day before pay day); euros with cents, four months in. Result: 65 comparisons pass, 3 fail, all the one finding below.

Names compared: Bank now (Home and Settings), Bank at the end of this month (Home, Plan Month, All months), Free to spend safe to spend, planned and spent (Home, Plan, Receipts, the line under the tabs), Bills and basics planned, Bills left to pay, Saved in burrows, Total, Goal burrows this month, Owed at the start of this month, Card and loan payments this month, Interest this month, and each burrow's amount (Home map, Home Burrows, Plan Burrows).

Not repeated: "not placed" (number_gate2, numbers_round4, number_findings), goal percents (goal_agree), bank plus burrows against the recount (home_map), Home against the model (home_dom), the now and planned labels themselves (v1_home).

Limits, said plainly:
- The names are a table of wordings (`NAMES` in the script), not found by themselves. A name written once only prints a NOTE; a name found nowhere in any situation fails, so moved wording is noticed. A brand new figure is not picked up until a line is added.
- Mako's shape: the build has no pay day or card pay day to set yet, so the two cards are card debts and the made-up day is the 9th. The script already writes `S.cards` in the shape the coordinator gave when the app has that list; add its wordings ("bank after the cards are paid") to `NAMES` when they land.
- A burrow's monthly amount on Plan (for example Education) is not compared with its piled-up amount on Home: same word, different figure by design. Worth a look by the wording role: one word for two figures.
- `LA_SHOW=bank node tests/qc/label_agree.js` prints every line with that word on every screen, for reading a finding.

### The finding: "Bills and basics" is two amounts on Plan, Month

In the list of places, "Bills and basics" includes card and loan payments (1,560 in the dollar situation), and Home agrees ("enough for 1,560 of bills"). Under Money out on the same screen, "Bills and basics" is 1,500, with Cards and loans 60 on its own row. Same name, two amounts, one screen. It shows in every situation that has a card or loan (dollars 1,560 and 1,500; Mako's shape 181,538 and 180,000; euros 1,410.25 and 1,300.25).

Fix in the app: give the Money out row its own name (for example "Bills"), or show cards and loans inside it. Or name it as expected in `tests/qc/label_agree.known`:

```
Bills and basics, planned: 2 different amounts
```
