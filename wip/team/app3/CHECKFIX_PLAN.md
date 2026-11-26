# Change or remove a bank check later (CONTROLS_PLAN slice 10, with BZ B and BZ C)

LANE J, 26 Nov 2026. For qc-foundation before building (CONTROLS_PLAN marks slice 10 "qc-foundation: yes"). Then qc-controls and qc-data-safety on the build.

Lines served: M13 (change and remove every kind of thing, after setup), M14 (Undo everywhere), M6 (a remove asks first), M36 and M37 (the bank figure is the bank today and says how fresh it is), M45 (no coin counted twice), M61 (nobody loses data). Touches M44 (one dataset from real dates).

## The person and the moment (M98)
Kenji checks his bank on Saturday and types 182,400. On Sunday he sees he typed one digit wrong: it was 128,400. Today he can only check again, which leaves a wrong figure in the book and a wrong "spending found" between the two. He wants to fix the figure he typed. Another day he checks the wrong account by mistake (typed his savings figure into the main bank), and wants that check gone, with the payments he ticked in it back to not ticked.

## What is saved today (no change to the shape)
- A check-in: `checkins[]` record `{ id, date, told, figures: [{ acct, check, typedA }], settled: [event ids] }`.
- Each figure: an event `{ k: 'check', acct, date, a, grp: <check-in id> }`.
- Each ticked payment: an event with `grp: <check-in id>` and `settles`.
- A gap logged as a spend at the check (checkin3.js saveCheck3): `{ k: 'spend', acct, a: loss, dayInside: true, grp: <check-in id>, note: 'Found at a bank check' }`.
- A statement import writes checks too (`stmt: true`).

## 1. Change a check's figure (`changeCheck(w, checkEventId, { amount })`, plan3_write.js, through ACT3.run)
- Any past check of a live, open account, not only the latest (CONTROLS_PLAN row "Change a past check's figure"). Refused with words for a closed account ("Reopen <name> first") and for a statement's check ("This figure came from your statement of <date>. Change it there" until statements can be changed; then it follows the statement).
- Writes: the check event's `a`; the check-in record's `figures[i].typedA` for that account (the record and the event never disagree).
- BZ B: the gap spend that check-in logged for that account (same `grp`, same `acct`, `dayInside`) follows the new figure in the same step: worked out again with the same engine call the sheet uses (gapWords3's source); new loss > 0 edits its `a`; no loss marks it `gone`. A spend the person logged on their own is never touched.
- Nothing else changes: the engine reads the new figure (the gap before and after it, today's bank figure only if it is that account's latest check, CHECKGAP: the gap stays whole in the check's period).
- Undo: one step, the journal's edit entries (works after a reload, slice 4).
- Asks first? No (a change, not a delete; M6). The change card and the Undo bar show the account's figure before and after, and safe to spend before and after.

## 2. Remove a check-in for one account (`removeCheck(w, acct)`, BZ C)
- Only the latest check of that account (by date, then `told`, counting statement checks). An older one: the button is not there; the assistant is told "Only the latest check of <name> can be removed. Change its figure instead".
- A statement's check: refused with words ("This came from your statement. Remove the statement instead") until statements can be removed.
- Marks gone, in one step: that account's check event; that check-in's gap spend for that account; the payments ticked in that check-in whose account is that one (a card payment: its paying account), so they show as not ticked again. The check-in record loses that figure and those ids; if it has none left it is marked gone. Another account's figure and ticks in the same check-in stay.
- Asks first (sure3): "Remove the check of <name> on <date>? Its figure <amount> and the <n> payments ticked with it go back to not ticked. You can Undo it".
- After: today's figure for that account is the check before it (or the opening); Home's "checked <n> days ago" follows.
- Undo after a reload: from the journal.

## 3. Where the person does it
- Screens: Home, tap an account's figure > "Checks" list of that account's checks (date, figure, from a statement or typed), newest first. Each opens a sheet: the figure box (empty box: "Type the figure your bank showed", a way out that loses nothing), Save, and on the newest only "Remove this check".
- Assistant (M3): `change_check { account, date, amount }` and `remove_check { account }`, each with a change card and Undo; a remove asks first. The SCREENS table gains the Checks sheet.
- controls3.js table: the two rows move from todo to done; the counted test walks them.

## 4. Tests first
- plan3_write.test.js: change the latest check (figure, typedA, gap spend edited; no gap: gone; a spend typed by hand untouched); change an older check (today's figure unchanged, the gap between the two changes); remove the latest (check, gap spend, ticked payment of that account gone; another account's figure in the same check-in stays; the record gone when empty); remove an older: refused; a statement's check: refused, both; a closed account: refused; Undo of each puts every record back.
- Engine numbers worked by hand on Mako's shape (one bank, two cards): a typo 182,400 to 128,400 on a check 3 days before pay: the gap and safe to spend before and after.
- e3_checkfix (page): the Checks list, change, remove with its question, Undo, after a reload.
- chat3_core.test.js: change_check and remove_check, the card, the ask for a remove, Undo.

## Questions for qc-foundation
1. Is "latest only" for remove right when a later check-in on another account exists in between (per account, BZ C)?
2. A check on a card or a loan (the loan check plan sets owed from its day): the same two steps hold; anything in the saved shape that differs?
3. A check-in whose ticked payment had a typed landing day before an earlier check (landedFrom): after a remove, is anything left pointing at the removed check?
