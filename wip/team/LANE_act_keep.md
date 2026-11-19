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

## What I suggest (the main session decides)

1. **Fix, one place: `ACT.tx` in actions.js lines 23 to 31.** When `changed` is true, keep the before copy the way the screens do: take `snapNoCopy()` before `fn()` runs, then `keepCopy(thatSnap, label)` and `offerUndoG`. That alone turns copy and reload green for every action, and it matters most for the paths people use today: the assistant's Apply (ui4a.js line 164), setup from statements (ui45u.js line 265), Add money on a burrow (burrows.js line 156, `ACT.sweep`), and any removal.
2. **One thing to weigh first:** there is one copy slot (`S.ui.keep`). If a small change such as setName keeps a copy, it overwrites the 3-day copy of an earlier big change such as Set all to zero. Two ways out: keep the copy only when the slot is empty or older than this visit, or keep it only for tx, the removals, setHome and the sweep family, and name the single-value setters in `act_keep.known`. Lines for the second way:
   ```
   ^FAIL (setPay|setIncome|setMinBalance|setCeiling|setLine|renameLine|setLineEnds|updateGoal|setAims|setName|setCurrency): REPLACES
   ^FAIL undo: REPLACES
   ```
3. **Two small exactness fixes** (each fails on its own even after point 1): add `ms` to `UI_SNAP` (actions.js line 8) or stop the redraw writing `ui.ms.rainy` when a goal goes; and find what writes `cfg.bankAt` again after `restoreState` on undo of setBalance.
4. `undo` itself: suggest a named expected failure unless Mako wants a redo.

## Part 2 plan (not started; waiting for the coordinator's word that A1 has landed)

Aim: a figure with the same name shows the same amount on Home, Plan, Receipts and All months.

Already covered, not to be repeated: "not placed" is one figure on Plan and All months (number_gate2, numbers_round4, number_findings); a goal's percent is one figure everywhere (goal_agree); bank, burrows and total on the Home map against the recount, and the on-screen sum (home_map); Home numbers against the model (home_dom); the short-month fix equals Home's safe to spend (numbers_round4).

The gap: no script compares amounts by their label across all four screens on many plans. Plan for `tests/qc/label_agree.js`:
1. On about 20 seeded random plans (the oracle's `randomState`, as home_map does), read each screen's text and collect (label, month, now or planned, amount) from every line that has a money amount. The now and planned tags come from A1, which is why this waits.
2. Group by label, month and tag. A group with two different amounts fails and names both screens.
3. Leave out the labels the scripts above own. Print labels seen on one screen only as a NOTE, so a renamed label is noticed.
4. A label the script cannot tag as now or planned prints UNKNOWN and fails, like act_keep.
