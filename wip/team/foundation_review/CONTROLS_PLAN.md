# Controls plan: add, change and remove every kind of thing (24 Nov 2026, planning lane "controls")

Plan only. No app code is changed by this file. It goes to qc-foundation before slice 1 (CLAUDE.md, LESSONS lessons 1 to 5).

**What the owner asked for, in his words.** DECISIONS new foundation 17 (Mako, 24 Nov about 11:45 JST): "it's crazy that you can't remove banks, add banks ... People need to be able to add different things, remove different things." Facts for the briefs: the assistant is the main way in, and every kind of thing a person has can be added, changed and removed, with Undo. Item 12: the assistant "changes them through the same named actions as the screens, so every change shows what changed and can be undone". Item 14: "Undo everywhere", bills must be removable, one save for setup is wrong. Item 15 and BW: change then Undo, with a confirm first only for a delete or a change larger than safe to spend.

**Mako says lines (MAKO_SAYS.md).**
- **Serves:**
  - M13: every kind can be added, changed and removed, after setup too.
  - M14: Undo everywhere.
  - M15: remove a bill; an empty amount never traps.
  - M16: setup sections save on their own (through lane/setupfix).
  - M6: change, show, one-tap Undo; confirm only for deletes and big changes.
  - M3: the assistant has full control, through the same named actions.
  - M23: several accounts, with cards, e-wallets and cash.
- **Touches:**
  - M1 and M17: every door also reaches the assistant.
  - M5: the screens stay the place to see and check.
  - M20: a close or a remove made on two devices goes through the which-to-keep question; a closed account reopens at a merge (AN6).
  - M34: currency stays fixed; Start again instead.
  - M38: ending the pay that starts the periods.
  - M42: Keep at least changed later, never set for the person.
  - M43: a goal's money and its own account on removal.
  - M45 and M46: a removed goal's money is never dropped or counted twice.
  - M61 and M69: nothing is deleted, only `gone` marks.
- **Not served here:** M24 (the period-end question). M_COVERAGE.md lists it as in no queue.

**The main way in** (LESSONS lesson 5): the person says it to the assistant ("I closed my old e-wallet", "remove the trip goal"). The assistant calls a named action. The screens have the same named action behind a button, so the person can see and check. One named action per control, two doors to it.

**Read for this plan:** CLAUDE.md, LESSONS.md, DECISIONS_ROUND2 BU to BY, SCHEMA_V3 sections 0, 3, 4 and 5 (close never delete, the closing rules P6, R3, R4, T watch, Q7, a place removed with money in it, O6 home currency), and the code on wip-38.31 at e557e36 (same app code as 6528d2d; only check3 and build3 changed since), lane/setupfix at 0905731 (local, not pushed; the worktree agent-ae677ae9ec4601481 is clean at the same commit), lane/ai-core local at ddbb3cb (three commits ahead of origin/lane/ai-core fb0023e: bde36f9 F4, 401353a F3, ddbb3cb), origin/lane/ai-panel at 7a975fb.

---

## 1. Is each gap real?

| Gap from the outside grid | Verdict | What the code shows |
|---|---|---|
| Bank, cash, e-wallet: no add after setup | **Real on wip-38.31. In a lane for the assistant only.** | `PLAN3W.addAccount` and the assistant's `add_account` are on lane/ai-core (1ea0af3, fixed by 401353a for BY3). No screen calls it on any branch: Plan has Add a card and Add a loan only. |
| Accounts: no rename | **Real.** | `changeOwed` renames cards and loans only. Nothing renames a bank, cash or e-wallet. No `minBank` change for a second account either. |
| Accounts: no remove or close | **Real.** | Only `closeLoan` exists. The engine already supports closing (lookahead.js: `closed`, schedules end on the closing day, a closing with money in it is refused [P6], `reopened`). Nothing in app3 writes `closed` on a bank, cash or e-wallet. |
| Setup: no remove of a row | **Fixed in lane/setupfix (64eb561), not merged.** | Each added bank, card, bill and second income row gets its own Remove, with Undo. |
| Keep at least: cannot change after setup | **Real.** | It lives in `home.main.min` (a field value `{ v, at, by }`). act3's lists (`PATHS`) do not include `home`, so no named action can write it. Settings shows the currency only. |
| Currency: cannot change | **Real, and partly on purpose.** | Settings says "It stays the same once money is written down". SCHEMA_V3 O6: a home currency change is a new dated `home.curs` entry and nothing is converted; an account's own currency never changes once it has events. Amounts are minor units, so relabelling yen as dollars would read every amount wrongly (a yen amount of 1,000 is 1000; as dollars it would read 10.00). A plain relabel must never be offered. |
| Country: cannot change | **Real.** | `home.country` is a field value. No door, same act3 limit as Keep at least. |
| Pay and second income: no add after setup | **Real on wip-38.31. In a lane for the assistant only.** | `PLAN3W.addPay` and `add_pay` on lane/ai-core (1ea0af3, startsPeriod moved by bde36f9, BY1). No screen door. |
| Pay and second income: no remove | **Real.** | Plan's pay form has Save only; "End this bill" is offered for bills, not pays (plan3.js `pay ? [] : ...`). `endBill` itself would accept a pay, but nothing handles the pay that starts the periods ending. |
| Bills in setup: no remove; an empty amount blocks Save | **Fixed in lane/setupfix (64eb561, 313ce7d), not merged.** | After setup, bills already end (`endBill`) and change (`changeBill`, `changeOnce`). |
| Goals: no remove | **Real.** | `addGoal`, `changeGoal`, `setAside`, `takeOut` only. The engine already reads the removal's own move (`toPlace`, SCHEMA_V3 Q7), but no screen can place money from Waiting. |
| Cards: no remove or close | **Real.** | `addCard` and `changeOwed` only. |
| Check-ins: no later edit or remove | **Real.** | `checkin3.js` writes through `ACT3.addRecords` with an Undo bar for this visit only. No list of past check-ins, no door to change a figure or take one out. |
| Statement imports: no later edit or remove | **Partly real.** | A single imported spend line can be changed or removed on Receipts (it is a `spend` row). A whole import cannot be taken out after the Undo bar is gone. |
| Setup itself: no Undo, one save only | **Partly fixed in lanes.** | lane/setupfix 88d541b: each section saved on its own with Saved and Undo, held as a draft. lane/ai-panel c23321f: the chat's fill can be undone (`E3.fill`, `E3.discard`, BV2.9). **Still missing:** the screens' "See my money" uses `E3.start`, so the screen setup's last step has no Undo; and nothing offers "start again" later. |
| Assistant: 4 actions only | **Real on wip-38.31 (ask3_core: log_spend, change_line, set_free, set_aside). Lane/ai-core has 17.** | ai-core's `change` tool: log_spend, refund, money_in, move_money, remove (spends only), add_bill, change_bill, end_bill, add_pay, add_line, change_line, end_line, set_free, add_goal, set_aside, add_card, add_account. Still missing after it merges: change_goal, take_out, remove_goal, change_once, change_card and change_loan (changeOwed), add_loan, close_loan, every account change and close, set_keep, set_country, end_pay, change a spend (edit), check-in and import removal. |

**Found on the way (not on the outside grid):**
- **F-A. Undo after a reload is only half an Undo.** `act3.undo(stepId)` after a reload finds what the step added (by `grp`) and removed (by `goneBy`), but not what it edited: `edited = mem ? mem.edited : []`. Today no screen offers Undo after a reload, so nothing is wrong yet. A close (which edits `closed`) undone that way would leave the account closed with its final check gone. Rule for this plan: Undo is this visit's bar; after a reload a step with edits is refused by act3 ("Change it back with ... instead"), and the way back is the named opposite action (reopen, put back).
- **F-B. `act3.remove(id)` marks any record gone,** an account or a schedule included. SCHEMA_V3 "close, never delete": only an account with no events is ever marked gone. Today only Receipts (spends) and the assistant (S refs) call it. Slice 2 limits it to events and sends every other kind through its own named action.
- **F-C. A statement import's Undo leaves its learned categories.** `stmt3Add` writes `book.imports.cats` directly; `imports` is not an act3 list, so Undo cannot take it back. Harmless to money (it is a naming memory), but it is a write outside the one door. Slice 11 decides: keep it as memory on purpose, or make it an act3 list.
- **F-D. setup3.js is rewritten by two lanes.** lane/setupfix (sections, row Remove) and lane/ai-panel 0dcebc8 (setup3 reads its boxes through answers3). They will conflict. One hand merges them before any controls slice touches setup3.js.
- **F-E. lane/ai-core local is ahead of origin** by bde36f9 (F4, startsPeriod), 401353a (F3, addAccount moved money) and ddbb3cb. Merge the local branch, not origin.

---

## 2. (a) The controls table

Key: **EXISTS** on wip-38.31. **LANE x**: on that branch, not merged. **MISSING**: nowhere. Screen door, then the named action (all writes go through act3; `PLAN3W.x` runs inside `ACT3.run`), then the assistant's `change` step name.

| Kind | Add | Change | Remove or close | Undo |
|---|---|---|---|---|
| **Bank, cash, e-wallet account** (not the main bank) | Setup row: EXISTS. After setup, screen: Plan > Accounts > Add an account: MISSING. Action `addAccount`: LANE ai-core. Assistant `add_account`: LANE ai-core | Rename and its own Keep at least: Plan > Accounts > the account: MISSING. Action `changeAccount`: MISSING. Assistant `change_account`: MISSING. The figure itself changes at Check your bank (EXISTS) | Close (history kept): Plan > Accounts > Close: MISSING. Action `closeAccount`: MISSING. Assistant `close_account`: MISSING. True remove (added by mistake, no history): `removeAccount`: MISSING. Setup row Remove: LANE setupfix | Bar for this visit through act3 marks (EXISTS for any act3 step). Reopen as the opposite of a close after the bar: `reopenAccount`: MISSING |
| **The main bank** | Setup only (EXISTS) | Rename: as above. Keep at least: see next row | Close: asks for the new main bank and moves every link [T watch]: `closeAccount` with `newMain`: MISSING (slice 13) | As above |
| **Keep at least** (`home.main.min`) | Setup: EXISTS (blank means none). Same door as change after setup | Settings > Money > Keep at least: MISSING. Action `setKeep`: MISSING (needs act3 field writes, slice 2). Assistant `set_keep`: MISSING | Same action with blank: none | act3 bar (once field writes exist) |
| **Currency** (`home.curs`) | Setup: EXISTS | Before "See my money": the setup box (EXISTS). After: no relabel ever. v1 door: Settings > Start again (MISSING), which keeps the whole book as a kept copy and opens setup with every answer filled in except amounts, which are asked again in the new currency. A real move to another home currency is a dated `home.curs` entry, stage 2 (STAGE2_PLAN) | Not removable | Start again: Put it back (EXISTS in Settings for kept copies) |
| **Country** (`home.country`) | Setup: EXISTS | Settings > Money > Where you bank: MISSING. Action `setCountry`: MISSING. Assistant `set_country`: MISSING | Not removable | act3 bar |
| **Pay** (the one that starts the periods) | Setup: EXISTS | Plan > pay: EXISTS (`changeBill`; startsPeriod moves: LANE ai-core bde36f9). Assistant `change_bill`: LANE ai-core | End: Plan > pay > End this pay: MISSING. Action `endPay`: MISSING. Assistant `end_pay`: MISSING. True remove: never (it starts periods and records name it) | act3 bar |
| **Second income** | Setup row: EXISTS (Remove: LANE setupfix). After setup: Plan > Add a pay: MISSING. Action `addPay`: LANE ai-core. Assistant `add_pay`: LANE ai-core | As pay: EXISTS / LANE | End: `endPay`: MISSING. True remove when no record names any of its days: `removeSchedule`: MISSING | act3 bar |
| **Bill** | Setup row: EXISTS (Remove: LANE setupfix). Plan > Add a bill: EXISTS (`addBill`). Assistant `add_bill`: LANE ai-core | Plan > bill: EXISTS (`changeBill`, `changeOnce`). Assistant `change_bill`: LANE ai-core; `change_once`: MISSING | End: Plan > End this bill: EXISTS (`endBill`). Assistant `end_bill`: LANE ai-core. True remove when nothing names it: `removeSchedule`: MISSING | act3 bar: EXISTS |
| **Budget line** | Plan > Add a line: EXISTS (`addLine`). Assistant `add_line`: LANE ai-core | Plan > line: EXISTS (`changeLine`). Assistant `change_line`: EXISTS | End: Plan > End this line: EXISTS (`endLine`). Assistant `end_line`: LANE ai-core. True remove when no record names it: `removeLine`: MISSING | act3 bar: EXISTS |
| **Free to spend** | Setup: EXISTS. Plan > Set Free to spend: EXISTS (`setFree`). Assistant `set_free`: EXISTS | Same | Same action with 0 from the next period (EXISTS). Never removed as a record | act3 bar: EXISTS |
| **Goal** | Plan > Add a goal: EXISTS (`addGoal`). Assistant `add_goal`: LANE ai-core | Plan > goal: EXISTS (`changeGoal`, `setAside`, `takeOut`). Assistant `set_aside`: EXISTS; `change_goal`, `take_out`: MISSING | Remove: Plan > goal > Remove this goal: MISSING. Action `removeGoal`: MISSING. Assistant `remove_goal`: MISSING | act3 bar |
| **Card** | Setup row: EXISTS (Remove: LANE setupfix). Plan > Add a card: EXISTS (`addCard`). Assistant `add_card`: LANE ai-core | Plan > card: EXISTS (`changeOwed`: name, pay day, close day). What is on it changes at Check your bank (EXISTS). Assistant `change_card`: MISSING | Close: `closeAccount` for a card: MISSING. True remove (added by mistake): `removeAccount`: MISSING. Assistant `close_account`, `remove_account`: MISSING | act3 bar |
| **Loan** (not on the grid; same shape) | Plan > Add a loan: EXISTS (`addLoan`). Assistant `add_loan`: MISSING | `changeOwed`: EXISTS. Assistant: MISSING | Close: EXISTS (`closeLoan`); folds into `closeAccount`. Assistant: MISSING | act3 bar |
| **Spend, refund, money in, move** (not on the grid) | Receipts: EXISTS. Assistant: EXISTS (log_spend) and LANE ai-core (refund, money_in, move_money) | Receipts: EXISTS (`edit`). Assistant `change_spend`: MISSING | Receipts: EXISTS (`remove`). Assistant `remove` S refs: LANE ai-core | act3 bar: EXISTS |
| **Check-in** | Check your bank: EXISTS (`addRecords`) | Change a figure: Home > Checks > the check: MISSING. Action `changeCheck`: MISSING | Remove the latest check-in: `removeCheckin`: MISSING. Assistant `remove_checkin`: MISSING | act3 bar: EXISTS for the visit |
| **Statement import** | Add statements: EXISTS (`ACT3.run('Statements added')`) | One line: Receipts: EXISTS. The import as a whole: nothing to change | Remove the whole import: Home > Statements added > Remove: MISSING. Action `removeImport`: MISSING. Assistant `remove_import`: MISSING | act3 bar: EXISTS for the visit |
| **Setup as a whole** | Setup screens: EXISTS. Chat fill: LANE ai-panel | Per section Save with Undo: LANE setupfix. After setup: each row above | Undo the fill: chat LANE ai-panel (`E3.discard`). Screens: MISSING (See my money uses `E3.start`). Start again later: Settings > Start again: MISSING (`startAgain`, kept copy) | Put it back: EXISTS (kept copies) |

---

## 3. (b) What each remove or close means in the saved data

Rule from SCHEMA_V3 section 0: nothing is deleted; remove and Undo set `gone` and `goneBy` and move `at`; putting back clears both. Two kinds of ending:
- **End (history kept):** the record stays live with an end date (`ends`, `closed`, a step to 0). Every period gone by shows exactly what it showed before. Used whenever any record, settlement or past period names the thing.
- **True remove (`gone`):** the record and everything that step made with it are marked gone, as if it was never added. Allowed only when nothing else names it (in practice: added by mistake). Undo puts it back whole.

The named action decides which, never the person's wording. The screen and the assistant say which one happened ("Closed. Its history stays" or "Removed. It was never used").

| Remove or close | End or true remove | Records written in one act3 step | What the figures do | Undo (this visit, act3 marks) |
|---|---|---|---|---|
| **Close an account with money in it** (bank, cash, e-wallet) | End | P6, R4, Q7, S3: first each link moved (a card's `payFrom`, a goal's `keptIn.acct`, a bill's or pay's `acct` asked for, R4); then a final `check` of its figure dated the closing day; then a `transfer` `close:<acct>` to the account the person picks, or a write-off `spend` `close:<acct>` for money that cannot be moved, or both as `close:<acct>:1`, `:2`; then `closed: <day>` on the account | The money moves to the other account (safe to spend unchanged) or is spent (safe to spend falls by it; the step's card shows before and after). Its schedules end on the closing day (engine reads `closed`). Any event dated after the closing day reopens it with the warning `reopened` (engine, AP1) | Added records gone; `closed` and the moved links edited back. After a reload: refused (F-A), the door is Reopen (`reopenAccount`: clears `closed`, the closing's records stay as history) |
| **Close a bank below zero** | Refused | Nothing. The screen offers a transfer in that gets it to zero [R3] | None | n/a |
| **Remove an account added by mistake** | True remove | Only when every live event on it is its own `open` and opening `check`s, no link points at it, and no schedule uses it. The account and those events marked gone | Total and safe to spend lose what it held, as if it was never typed | All put back |
| **Close the main bank** | End | T watch: asks for the new main bank, moves `home.main` (a field value), the `acct` of lines and of Free to spend's share held on it, every schedule's `acct` (bills too, unless the person ends them), cards' `payFrom`, goals' `keptIn.acct`; then as a close above | The new main bank carries safe to spend from the closing day | As a close. Last slice (13): biggest link set |
| **Close a card with an owed balance** | Refused until zero | R3: the screen offers "Pay it off now" (a `repay` from its `payFrom`, dated today, only if the person really paid it) or ticking its payment at Check your bank | None until paid | n/a |
| **Close a card at zero** | End | Final `check` of 0 on the closing day, `closed`. Its payment day stops (schedules owned by the account end) | What is due before next pay drops its future payments of 0 | Edits back, check gone |
| **Remove a card added by mistake** | True remove | As for an account: only with no spends, payments, statements or settlements on it. The card and its `open` and `check` gone | Owed on cards and the bank after cards rise by what was typed on it | All put back |
| **End a pay that does not start the periods** (second income) | End | `ends` on the schedule (as `endBill`), never before an occurrence a record names [X8] | Its future pays leave the look ahead; safe to spend may fall (the card shows it; BW asks first when the change is larger than safe to spend) | `ends` edited back |
| **End the pay that starts the periods** (F4) | End | If another live pay with a fixed day exists: the `startsPeriod` flag moves to it in the same step (BY1, the same move bde36f9 makes), each line and Free to spend counted each pay is asked again under the new pay's rhythm (as `changeBill` asks), then `ends`. If none: the same as changing it to no fixed pay from the end day (changeBill `toNone`: lines and Free to spend asked as amounts a month, new steps and a new share entry), then `ends` | Periods after the end follow the other pay, or run by the day (B4). Periods before it are unchanged (BY1: the flag is undated, so the old pay's past periods are drawn by date only; accepted for v1 in BY1) | All edits and added shares in one step, so one Undo puts the flag and the amounts back |
| **Remove a pay or bill added by mistake** | True remove | Only when `scheduleView(...).lastNamed` is null (no settlement, no `once` or `amounts` key, no auto spend names it) and it does not start the periods. Marked gone | Its future occurrences leave the look ahead | Put back |
| **End a bill** | End | `ends` (EXISTS) | As today | EXISTS |
| **End a line** | End | A step to 0 from the next period and `ends` (EXISTS) | Past periods still show it | EXISTS |
| **Remove a line added by mistake** | True remove | Only when no event names it and it has one step. Gone | As if never added | Put back |
| **Free to spend to nothing** | Change | A new `plan.shares` entry of 0 from the next period (`setFree`) | Safe to spend no longer leaves room for it from then | EXISTS |
| **Remove a goal with nothing in it** | True remove | The place marked gone. A goal kept in its own account leaves the account as it is (offered: close that account too, a second step) | None | Put back |
| **Remove a goal with money in it** | True remove of the place, money moved first | The screen asks where the money goes: back to spending money (a `move` out of the place to Waiting, the same record `takeOut` writes, T7; for its own account also the `transfer` back), or into another goal (a `move` with `place` and `place2`). Then the place gone. All one step. **Not used in v1:** the `rm:<place>` `toPlace` move (money held in Waiting to place, Q7), because no screen can place it yet; it stays the shape for a sync conflict and for stage 2 | Back to spending: safe to spend rises by what it held (the card says so). Into a goal: nothing changes but the goals | Moves gone, place put back |
| **Change a past check's figure** | Change | `edit` of that check event's `a` | The gap (spending found) in the stretch before it and the stretch after it both change; today's bank figure changes only if it is the latest check of that account | Edit back |
| **Remove a check-in** (the latest one only) | True remove | The `checkins` row and every record of its `grp` marked gone: each account's `check`, the `set:<occurrence>` settlements it ticked, the gap spends it logged (`dayInside`). A later check-in re-ticking the same occurrence revives the gone `set:` record (act3 `writer.add` already does this) | Bank today falls back to the check before plus what was logged since; spending found at that check is no longer counted; what it ticked becomes due again (may show late, H8); safe to spend moves with all three | Everything put back |
| **Remove an earlier check-in** | Refused in v1 | Nothing. Words: "A later check of this bank follows it. Change its figure instead" | None | n/a |
| **Remove a statement import** | True remove | Every record of the import step's `grp` marked gone: its `imp:` lines, its card statement `check`s (`stmt`), the checkins it wrote. Typed records it matched were never marked gone in saved data (matching drops them only while the engine reads), so they count again on their own | Spends from the file leave Receipts and the lines; a card's owed figure falls back to its earlier statement check; typed spends it had matched count again | Put back. Re-adding the same file makes the same `imp:` ids and revives them |
| **Change the country** | Change | `home.country` field value edited | Every schedule's landing days are worked out again on the new calendar, past ones too (an undated field). Settlement ids name occurrences by due day before the move, so ticks still match. Treated as a correction of a wrong pick, which should change the past. A real move of country is stage 2 with the dated currency | Edit back |
| **Change the currency on a book with records** | Not offered | Start again: the book kept whole (`E3.rec('copy')`), setup opens with every answer except amounts | A new book | Put it back (EXISTS) |
| **Undo a whole setup** | True remove of the book | Chat: `E3.discard` (ai-panel). Screens: See my money goes through the same `E3.fill` so it has the same Undo | Back to the first screen | One tap while the fill is held; after any other write it is released (ai-panel) |

**For qc-foundation, three readings to judge** (asked at the cause, with a recommendation, LESSONS lesson 1):
1. Remove a goal with money: recommend the person picks where the money goes now, rather than Q7's money held in Waiting, until a placing door exists.
2. Remove a check-in: recommend the latest only; an earlier one is changed, never removed, because the next check's gap depends on it.
3. Country: recommend correction semantics (the past moves with it).

---

## 4. (c) The shared piece: one controls table and one test

LESSONS lesson 2: when a gap shows on more than one kind, build the missing shared piece. The gap here is that nothing lists every kind of thing with its doors, so a kind with no remove was never seen.

**`wip/team/app3/src/controls3.js`** (plain data, no money maths, read by the page, chat3_core and the test):
```
CONTROLS3 = [
  { kind: 'account', list: 'accounts', types: ['bank','cash','ewallet','wallet'],
    add:    { action: 'addAccount',    screen: '#plAddAcct',         ai: 'add_account' },
    change: { action: 'changeAccount', screen: '[data-acct] form',   ai: 'change_account' },
    end:    { action: 'closeAccount',  screen: 'Close this account', ai: 'close_account', means: 'end' },
    remove: { action: 'removeAccount', screen: 'Remove this account',ai: 'remove_account', means: 'gone', when: 'no history' },
    todo: null },
  ...one row per kind in the table above (keep, country, currency, pay, income, bill, line, free, goal, card, loan,
     spend, checkin, import, setup)...
]
```
- `action` is the name of a `PLAN3W` function (or an `ACT3` action for spends). `ai` is the assistant's `change` step name. `means` is `end` or `gone`, so the words after the step can say which.
- chat3_core's `DO` list is read from this table (after lane/ai-core merges), so a door added here is offered to the assistant, and a step name that is not in the table is refused.
- `todo: 'slice N'` marks a door not built yet. It is the only way a missing door may exist.

**`wip/team/app3/tests/e3_controls.js`** (a real-page test, in check3's full level):
1. Every act3 list (`PATHS`), every `PLAN3W` export and every assistant step name appears in a row (a new kind or action with no row fails).
2. For every door not marked `todo`, on Mako's own shape with made-up figures: open the screen door, make the change, see it saved, reload, press Undo where the bar still shows, and check the book is back record for record; then the same through the assistant's step with the fake model (ai-core's `fake_ai.js`), same book.
3. For every `end` door, that a period before it shows the same figures after; for every `gone` door, that it is refused when something names the record.
4. It prints how many doors are still `todo`. FEATURES.json gets "Every kind of thing can be added, changed and removed, on screen and through the assistant" with `passes: false` until the count is 0. check3 fails if a door not marked `todo` is missing or broken, so a removed door, or a new kind with no doors, turns check3 red.

---

## 5. (d) Thin slices, in order

Each item is one commit, test first, `./check3.sh quick` after each, full level before the merge. Rebuilding the page touches `index.html` and `sw3.js` in every slice (build3.sh); merge often to keep those conflicts small.

**Must land first (not this lane):**
- **L1.** lane/setupfix and lane/ai-panel, with setup3.js merged by one hand (F-D).
- **L2.** lane/ai-core from the local branch at ddbb3cb (F-E): `addPay`, `addAccount`, BY1 startsPeriod, chat3_core, answers3. Every slice below that touches `plan3_write.js` or `chat3_core.js` starts after L2.

| Slice | Items (one commit each) | Files | Waits for | qc-foundation? |
|---|---|---|---|---|
| **1. The table** | controls3.js with every row, existing doors filled, the rest `todo`; e3_controls.js walking the doors that exist; FEATURES entry `passes: false`; chat3_core reads `DO` from the table | src/controls3.js, tests/e3_controls.js, check3.sh, FEATURES.json, build3.sh (adds the file), chat3_core.js | L2 | No (screens and tests) |
| **2. act3 guards** | `remove()` only for events (F-B); Undo after a reload refused for a step with edits (F-A); `writer.setField(path, value)` for `home` field values with Undo | src/act3.js, tests/e3_act_unit.js, tests/e3_act_book.js | none (can start now) | Yes (saved data) |
| **3. Keep at least** | `setKeep`; Settings door; assistant `set_keep` | plan3_write.js, settings3.js, chat3_core.js, controls3.js | 1, 2 | No |
| **4. Accounts: add, rename** | Plan > Accounts card listing every account; Add an account (screen door to `addAccount`); `changeAccount` (name, own Keep at least); assistant `change_account` | plan3.js, plan3_write.js, chat3_core.js, controls3.js | 1 | No |
| **5. Accounts: close and remove** | `closeAccount` (not main): links, final check, `close:` transfer or write-off, `closed`; `reopenAccount`; `removeAccount` (no history only); assistant `close_account`, `remove_account` with the BW confirm | plan3_write.js, plan3.js, chat3_core.js, controls3.js | 4 | **Yes** |
| **6. Cards and loans** | `closeAccount` for cards at zero, with "Pay it off now" (`repay`); `closeLoan` folded in; card `removeAccount`; assistant `change_card`, `add_loan`, `close_loan` | plan3_write.js, plan3.js, chat3_core.js | 5 | **Yes** |
| **7. Pay** | Plan > Add a pay (screen door to `addPay`); `endPay` with the startsPeriod handling of section 3; `removeSchedule`; assistant `end_pay` | plan3_write.js, plan3.js, chat3_core.js | 1, L2 (bde36f9) | **Yes** (periods) |
| **8. Bills and lines, true remove** | `removeSchedule` for bills; `removeLine`; assistant `remove` for B, P and L refs; `change_once` | plan3_write.js, plan3.js, chat3_core.js | 7 | No |
| **9. Goals** | `removeGoal` with the money question; assistant `remove_goal`, `change_goal`, `take_out` | plan3_write.js, plan3.js, chat3_core.js | 1 | **Yes** |
| **10. Check-ins** | A list of past checks on Home; `changeCheck`; `removeCheckin` (latest only); assistant steps | checkin3.js, home3.js, plan3_write.js (or a new checkin3_write.js), chat3_core.js | 2 | **Yes** |
| **11. Statement imports** | A list of imports with Remove; `removeImport`; decide F-C | stmt3.js, home3.js, chat3_core.js | 2 | **Yes** |
| **12. Setup, country, currency** | Screen setup's See my money through `E3.fill` (same Undo as chat); `setCountry` in Settings; Start again (kept copy, answers filled except amounts) | setup3.js, settings3.js, e3.js, plan3_write.js | L1, 2 | **Yes** (country) |
| **13. Close the main bank** | `closeAccount` with `newMain`, moving every link (T watch) | plan3_write.js, plan3.js | 5 | **Yes** |
| **14. Done** | e3_controls has no `todo`; FEATURES flips to passing; a chat walk that removes and closes one of each by talking | tests, FEATURES.json | all | End-of-slice review |

Slice 2 is the only one that can start before L1 and L2 merge. Slices 3, 4, 7 and 9 do not depend on each other after slice 1 and can run as parallel lanes, but all four touch `plan3_write.js` and `chat3_core.js`; one lane at a time per file is safer.

**For Mako's run** (written down, not asked now): the words for End versus Remove; where the Accounts card sits (Plan or Home); whether Start again belongs in Settings.

---

## 6. (e) Files this lane does not touch

Not edited by this plan or its slices: `.claude/agents/*.md`, `wip/team/QC_ROLES.md`, `QC_AGENT.md`, `QC_NUMBERS.md`, `wip/team/qc/`. The coordinator owns them (DECISIONS new foundation 17). Suggestion for the coordinator's brief update: the controls table (section 2) is the list a reviewer can walk to check "every kind can be added, changed and removed".

---

## Corrections after qc-foundation (BZ)

qc-foundation FAILed this plan (qc_reports/2026-11-24_controls_plan/qc-foundation.md): three FOUNDATIONAL findings, three plan corrections, four WATCH items. Each is taken. The three base changes are built first, on lane/controls-base (from wip-38.31), each its own commit with an engine or store test first and a migration test for every shape change. Every saved book that exists today stays readable. The decisions and reasons are DECISIONS_ROUND2 BZ.

### The three base changes (before slice 1)

**BZ1. A saved Undo journal (finding 2; M14, M6, M61).** Replaces F-A.
- act3 writes one journal entry per step, in the same save as the step, into a new top-level list `journal`:
  - `id` (the step id, the same as the records' `grp`), `label`, `moment` (the step's `at`), `day`, `by`;
  - `added` and `removed`: `{ list, id }` for each record;
  - `edited`: `{ list, id, before }`, where `before` holds the old value of each field it changed (and the old `at` and `by`);
  - `revived`: a gone record a check-in's `set:` id took over, with the whole record as it was.
- `undo(stepId)` after a reload reads the entry, so a step that only edits (setKeep, changeAccount, changeCheck, a close's `closed`) undoes too. The rule within a visit is unchanged: refused whole when a later step changed any record it touched, so nothing is ever half undone. An undone entry gets `undone` (the Undo's step id); an Undo is not journaled itself.
- The sync joins two journals by id and never asks about them (an entry marked undone wins over the same entry not marked). Two tabs or two devices then both keep every step, and an Undo of a step from the other device is still refused when anything changed its records since. Two devices' changes to one record still meet in the which-to-keep question (M20). The journal keeps the latest 200 steps by moment, in act3 and in the sync, so a step dropped on both sides is not brought back by the base copy.
- Steps from before the journal still undo what they can, as today: what they added (by `grp`) and removed (by `goneBy`).
- So the close (slice 5) undoes after a reload too: the transfer and the final check gone, `closed` and the moved links edited back, in one step. Reopen stays as its own door for a close the person wants to take back later, when other steps have touched the account since.

**BZ2. A dated `startsPeriod` (finding 1; M38, M46, M31).** Replaces BY1's undated move.
- `startsPeriod` on a pay is either `true` (every book saved today: held since the pay's start) or a list of dated entries like `rules`: `[{ from, at, by }]` (`from: null` means since the pay's start).
- The pay that holds it on a day is the live pay with the newest entry on or before that day (by `from`, ties by `at`). Moving it is one new entry on the new pay. The old pay is never edited, so its past stays.
- The engine draws each period from the pay that held the flag on that day: the old pay's pays before the switch, the new pay's from it. The current period runs from the last pay that started one to the day before the next pay of the pay holding it today.
- endPay (slice 7) on the pay that starts periods adds an entry `{ from: <end day> }` on the other pay with a fixed day, in the same step as `ends`. One Undo takes both back.
- lane/ai-core's F4 (bde36f9: addPay and changeBill clear the old pay's flag and set `true` on the new) moves onto this when the lanes join: the new pay gets `startsPeriod: [{ from: <today>, at, by }]` and the old pay keeps its flag.

**BZ3. A removed record comes back when a live record names it (finding 3; M67, M20, M45, M61).**
- In the engine and the sync: a live event (its `acct`, `acct2`, `line`, `stream` or a settled occurrence), a live schedule or a live line that names a removed account, line or schedule brings it back. With an account come its own records removed in the same step (the same `goneBy`, naming it). A notice says so, as a late spend reopens a closed account (AP1).
- Read the same way by both, from the joined data, so both devices show the same: the look ahead counts it and warns `revived`, and `afterSync` gives the notice `revived`. Nothing is written by the sync. The person can remove it again, with the money on it moved or removed first.
- So "true remove" (section 3) stays safe on two devices: a 3,000 spend logged offline on the phone on an e-wallet the desktop removed counts, the e-wallet is back, and the person is told.

**BZ4. sync.js reads `type` (WATCH).** Lines 289 and 425 read `a.kind`; accounts keep `type`. Fixed with a test first: a card's match window is 7 days, and a closed card's figure at close has the owed sign.

### Plan corrections (no base change)

- **A. removeImport (slice 11)** also puts back, in the same step, every record whose `goneBy` names one of the import's lines (sync's rematch, sync.js:305; the same payment from a bank and a card import, stmt3_plan.js:236). Section 3's "never marked gone in saved data" is wrong and is replaced by this.
- **B. changeCheck (slice 10)** changes or removes, in the same step, the gap spend that check-in logged (`dayInside`, the same `grp` and account, checkin3.js:148), so the line and the gain follow the new figure.
- **C. "The latest check-in" (slice 10)** is per account: the latest check of that account, by date then `told`, counting checks written by a statement import. Removing it takes out that check-in's records for that account only; another account's check in the same check-in stays.

### WATCH items, now in the plan

- **Rows from the lists, not by hand (slice 1).** controls3.js builds one row per act3 list (`PATHS`, `people` included) and per account type (act3's `SPEND_FROM` and the ledger's types, `paylater` included). A row with no door is `todo`. So couples (stage 2) and pay-later (stage 2 lane A) arrive with rows already, and e3_controls fails when a list or type has no row.
- **Closing an account in another currency** needs a `convert`, not a `transfer`. Stage 2 (with currency). In v1, closeAccount refuses a move to an account in another currency and offers the write-off or a move to an account in the same currency.
- **Yen is the default (M34).** Someone who typed peso amounts under yen fixes it with Start again in v1 (slice 12: the book kept whole, setup refilled except amounts). A real currency change, a dated `home.curs` entry, is stage 2. A rescaling relabel rewrites every amount and stays out of v1.
- **sync.js `kind` and `type`:** BZ4 above.

### BZ2 part: rows from the controls back-test (qc_reports/2026-11-24_backtest_live_build/SORTED.md, K4 to K23)

Each row is a door the table above lacked. Each goes into controls3.js with its slice, `todo` until built. K29, K34, K35, K37, K18 and K32 are handled in other lanes.

| Row | What is missing | The door | Slice |
|---|---|---|---|
| K4 | A card's or a pay's weekend rule cannot be changed later | `changeOwed` and `changeBill` take `shift` (the card form and the pay form get the weekend box); assistant `change_card`, `change_bill` take it too. A pay's rule change is a dated entry like its other changes, so past landings stay | 6 (card), 7 (pay) |
| K5 | No loan in setup | A loan row in the setup screens (name, still owed, usual payment, day), writing what `addLoan` writes; the setup chat's `add_loan` | 12 |
| K6 | A loan's "Still owed" cannot be changed | A "Still owed today" box in the loan's form, written as a `check` on the loan (as a card's figure is), with Undo; assistant `change_loan` | 6 |
| K7 | A loan paid off early cannot be closed (closeLoan refuses while anything is owed) | "Pay it off now" for a loan as for a card (a `repay` from its paying account, dated today, only if the person really paid it), then the close at zero; `closeLoan` folds into `closeAccount`; assistant `close_loan` | 6 |
| K12 | The screens' End this bill, End this line and Receipts Remove do not ask first (M6) | One shared confirm for every screen delete or end, saying what is lost and what stays ("Its history stays" or "It was never used"), the same words the assistant's confirm uses; then the step and its Undo bar. e3_controls checks every `end` and `remove` door asks first | 1 (the shared confirm, in the table's door walk) |
| K13 | No budget line or goal in the setup screens | A line row and a goal row in the setup screens, writing what `addLine` and `addGoal` write, each section saved on its own with Undo (M16); the setup chat already has `add_line` and `add_goal` (ai-core) | 12 |
| K16 | The assistant cannot change a spend or a refund | Assistant `change_spend` over act3 `edit` (amount, day, account, line or place, note), with the confirm when larger than safe to spend | 8 |
| K23 | Reminders have no row, no Undo, and are not kept across a reload | A `reminders` act3 list (add, change, remove through act3, Undo from the journal, BZ1). Today they are not saved on purpose; M14 ("Undo everywhere") overrides that. A new list in the saved shape: added only, old books read as having none (a migration test) | 10 |

### What this changes above

- Section 1 F-A is replaced by BZ1. Section 3: "Undo after a reload: refused (F-A)" now reads "undone from the journal"; for End the pay that starts the periods, "Periods before it are unchanged" holds by BZ2; Remove a statement import follows A; Change a past check's figure follows B; Remove a check-in follows C.
- Slice 2 (act3 guards) keeps F-B and setField; its Undo item is done by BZ1. Slice 7 writes the dated entry (BZ2). Slice 1 builds rows from the lists (WATCH).
