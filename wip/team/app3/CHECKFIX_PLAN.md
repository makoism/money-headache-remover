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

## After qc-foundation (FAIL, report qc_reports/2026-11-26_checkfix_plan/qc-foundation.md): what changes
- F1, the opening figure: a check that is an account's opening (same day and grp as its `open`, no check-in row; also those written by addCard, addLoan, addAccount and a close) is changed by editing `open.a` and the check's `a` together. A moved-account opening (open 0 plus a transfer) is refused with words ("It came from <account>: change that move instead"). Remove applies only to a check whose grp is a live check-in that lists it; an opening, close or reopen check is refused ("Change its figure instead").
- F3, card payments: removing a bank check keeps a card payment tick of that check-in while that card's own figure in the same check-in stays; the question names it ("Card A's payment stays ticked: its 0 was typed with it"). A tick-only check-in (no figure) loses its ticks with it. `fillerPlace[acct]` goes with a remove; `unticked` import lines come back only if the whole check-in record goes.
- F2, the gap logged as a spend (RULED YES by coordinator 16, 26 Nov 11:35 JST; conditions: the CHECKGAP rule holds (the gap goes whole to the check's period, closed periods never change), it agrees with LANE I's lane/amounthist (told LANE I what is written and read), old books with fixed gap spends keep working (test), qc-numbers on the build with Kenji's numbers): Check your bank stops writing a fixed-amount gap spend and writes the check-in's `fillerPlace[acct]` (the line or place picked), which the engine already reads (lookahead.js 461 to 486). The gap then follows any later change of either check, on any device, with no follow-up edits. Old books' gap spends: a change of C1 re-works C1's spend and the next check's spend of that account, each with the old spend left out of its own gap and the right filler (not gapWords3's last one). The assistant's gap logging (log a gap as a spend) writes fillerPlace the same way.
- F4, two devices (RULED YES, built in this slice, qc-data-safety on the build; the notice in plain words: "A bank check you removed on your phone came back, because your computer added a later one"): in the join, a removed check with a later live check of the same account comes back with its group's ticks, and a notice says so, as BZ3 revives. Read rule only, nothing written.
- M6: a change whose effect on safe to spend is larger than safe to spend asks first (the existing "large" ask). A change never creates a gap spend the person did not choose.
- M46: when the change turns a past period overspent after its leftover went to a goal, the change card shows the engine's set_aside_over line.
- M47: the figure box takes a minus, as at Check your bank.
- A change clears `gain` on that check (a check answered "wrong" is otherwise ignored).
- Statement checks refused by grp starting `stmt:` or `imp:`, not by the `stmt` flag alone.
- Couples on one phone: the question names whose check it is when `by` differs from the person now.
- Added doors (grid): "Was that figure right?" (a held large gain): "Yes" writes `gain: 'right'`, "No, it was ..." opens the change; a tick changed (amount or day) or unticked later gets a controls3 row and its doors (Receipts today leaves out records with settles): built in this slice if small, else its own slice with a row marked todo.
- Tests added: an opening typo fixed (open.a and check.a; today's figure follows); Mako's card-zero check-in with the bank check removed (cards' ticks stay, safe to spend unchanged); C0, C1 typo, C2 with gap spends, C1 fixed: 80,000 logged in all; a large change asks; minus figure; gain cleared; imp: check refused; the join revive with its notice; an old book with fixed gap spends gives the same figures before and after the change to fillerPlace.

## After confirm 1 (FAIL, qc-foundation_confirm1.md): coordinator 16 rulings FD1 and FD2 (26 Nov), LANE M
Build order: lane/amounthist (LANE L) is merged into this branch first; then this slice.
- FD1, a removed check comes back only when named (replaces the F4 read rule above). Every new check writes optional `prev`: the id of that account's latest live check as the writing device saw it (Check your bank, setup openings, addCard, addLoan, addAccount, close and reopen, the loan check, the assistant's steps, statement checks). In the join a gone check comes back, with its group's ticks and the plain notice, only when a live check of the same account has `prev` equal to its id. A check without `prev` (every old book) never comes back. Nothing written by the join.
  The moment: Kenji removes a wrong C1 on his phone and checks again (C2, prev = C0, since C1 was gone when he typed): C1 stays gone. His computer, offline, checked after C1 (C2', prev = C1): on the join C1 comes back with the notice "A bank check you removed on your phone came back, because your computer added a later one".
  Saved data: SCHEMA_V3.md line for `prev` on a check event; the store guard keeps it on save and load; a sync round trip keeps it.
  Tests: remove then check again on one device: no revive; an offline second device in both join orders: revive with the notice; an old book with no prev: no revive; prev naming a check of another account: ignored.
- FD2, amounthist is the one rule for a corrected amount. (a) Removing a whole check-in (or one account's part of it, section 2) writes no `was` on what it removes: it never happened; this is decided before the records are written. amounthist holds a removed record only by a check written before its removal. Test: remove C1 (gap in a closed period), check again: nothing counted in the closed period, safe to spend unchanged by the gap. (b) A changed figure (section 1) goes through act3's edit so the check gets `was` with its told; a correction found later counts in the period of the check that held it, closed periods keep what they closed with. So fixing C1's typo does not move a closed period: the difference shows in the period it was fixed in. The worked example (C0 200,000, C1 182,400 really 128,400, C2 120,000) is redone with this rule in the tests, by hand, before building; qc-numbers checks it on the build.
- From confirm 1, also: when the next check-in already uses fillerPlace, a change says "nothing else to edit" (no follow-up write); a test with a book mixing old fixed gap spends and new fillerPlace check-ins; an old gap spend edited by hand (its `at` after the check-in's) is never overwritten, the card says so.
- Grid gap (confirm 1): where a gap went can be changed or cleared later. The Checks sheet shows "The gap went to: Groceries" with Change; the assistant's change_check takes `place`; Undo; a controls3 row for it.
- Watch, not this slice: slice 11 statement checks write prev and a removed statement does not revive; two currencies stay apart.

## After confirm 2 (FAIL, qc-foundation_confirm2.md), LANE M
- FA, a remove never edits the check-in record (replaces section 2's "the check-in record loses that figure and those ids" and F3's "fillerPlace[acct] goes with a remove"). removeCheck marks gone, with one goneBy (the step id, w.remove), that account's check event, its old gap spend if any, and the ticks it takes back. The checkins record keeps its figures, settled and fillerPlace as they were: every reader already skips gone events (settled and fillerPlace are read only for live events). The record itself is marked gone, with the same goneBy, only when nothing in it is live after the remove. Then a revive can be true.
- The revive (FD1) lives in ledger.revive, read by lookahead.js and by sync.js, not only in the join, so the device that removed C1 sees it come back too. It brings back every record with the gone check's goneBy, the check-in record included. A chain is followed: C1b (prev C1) and C1 both gone under a live C2' (prev C1b): C1b comes back, and then C1 because C1b is live and names it; each step of the chain is a test. A revived check-in counts its gap on its own place and its ticks as ticked, as before the remove.
- Writers of prev, all named: Check your bank (checkin3 via CK.checkIn), setup openings and build_book's statement checks at setup (build_book.js:103), addCard, addLoan, addAccount, addPlace (plan3_write.js:320), close and reopen, the loan check, the assistant's steps. Statement imports (stmt3_plan.js:257-258, two checks for one account on one day): the first names the account's latest live check, the second names the first. Migration of old books (move.js) writes no prev: those never revive, which is right.
- FB, a corrected figure, waits for the coordinator's ruling (asked 26 Nov): proposed, the change counts on the day of the fix in both gaps beside the check (plus in the gap before, minus in the gap after), so with a later check the two cancel and closed periods and safe to spend do not move; on the latest check only the plus part, in the period of the fix. Section 1's "Nothing else changes" is replaced by this rule once ruled. Tests: same period; closed then open; the latest check.
- FD2 money in (coordinator 17): removeCheck passes "removed with its check-in, no history" to w.remove; every other removal of a money record writes `was` (LANE L told, amounthist).
- Where the gap went, cleared: on the Checks sheet "Change" offers the lines and "Nothing, back to Free to spend" (place null); the assistant's change_check takes place: null the same way. On an old book (a fixed gap spend) the change edits that spend's line.
- The join keeps fillerPlace per account, as it does `settled` (sync.js:202), so two devices changing the place for different accounts keep both. Test.
