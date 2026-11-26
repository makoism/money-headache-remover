# Another main bank, and closing the main bank (CONTROLS_PLAN slice 13)

LANE N, 26 Nov 2026. Plan only. For qc-foundation (CONTROLS_PLAN marks slice 13 "qc-foundation: yes") and qc-novice (LESSONS 6) before building; then qc-controls, qc-numbers and qc-data-safety on the build. Built on lane/controls-13, from lane/controls-8 (slices 2 to 8), after the close-account fix on lane/controls-5fix is merged in.

Lines served: M13 (change and remove every kind of thing, banks included, after setup), M14 (Undo), M6 (asks first for a remove and for a change larger than safe to spend), M23 (several banks), M3 (the assistant can do it), M91 (the options a person would want, including not now), M36 and M45 (the picture adds up, no coin counted twice), M61 (nobody loses data). Touches M26 (his one main bank), M30 and M40 (cards paid from the main bank), M42 (Keep at least), M90 (safe to spend is the play money left; a switch of bank never changes it by itself).

## The person and the moment (M98)
1. **Kenji changes banks.** His employer will pay into his new bank from next month. Today he opens the new bank and adds it (Plan, Add an account). On pay day the pay lands in the new bank. He wants the app to treat the new bank as "the bank" from now on: cards paid from it, bills from it, Keep at least on it. The old bank still has 40,000 in it and two bills he has not moved yet. A month later he empties the old bank and closes it.
2. **Aiko typed her savings first in setup**, so the app thinks her savings is the main bank. She wants to say "my main bank is the other one". Nothing moved in real life: only the label was wrong.
3. **Mako's bank closes his account** (he moves country, or the bank shuts it). He wants one step: "close it, the money went to X, X is my bank now".

What else could be true: the new main bank is cash or an e-wallet (allowed? see question 3); the new bank is in another currency (refused: a main bank in another currency is stage 2, the home currency is dated and the minimum would be in the wrong currency, AS11); there is only one bank (closing the main bank needs another account first: the screen says "Add the bank your money goes to first", with the door to Add an account); he wants to do it later (Not now on every question, nothing written).

## What the saved data holds today (no shape change)
- `home.main: { v: { acct, min }, at, by }`, one field value, undated (SCHEMA_V3 AL3, AO5, AM2). `acct` is the default for: budget lines and the Free to spend share with no `acct` (lookahead.js 87 `lineAcct`), a card's `payFrom` when it has none (88, 89 `moneyAcct`, `payFromOf`), Keep at least (`minimumOf`, 93), goals kept in the bank with no `keptIn.acct` (plan3_write 344 to 397), and every write that takes "the main bank by default" (bills 125, lines 313, cards 422 and 439, accounts 516, pay-off 646).
- Schedules (pays and bills) carry their own `acct`, written at the time. Cards written by setup and addCard carry `payFrom`, possibly null on old books.
- SCHEMA already says how a change of main bank is written (AO5): the new main bank brings its own `minBank` into the pair (none if it had none) and its `minBank` is cleared; the old main bank gets no minimum, with the notice "This account is no longer your main bank, so it has no minimum now. Set one if you want to keep some money in it." Two devices: the newer pair wins whole, the loser gets "Your other device changed this. Check it." (AM2, already built in sync.js 520 to 610).

## 1. Make another account the main bank: `setMain(w, id, x)` (plan3_write.js, through ACT3.run)
- `id`: an open bank (question 3 on cash and e-wallets) of the home currency, not the main bank now. Refused with words otherwise ("<name> is closed. Reopen it first", "<name> is in <cur>. Your main bank has to be in <home cur>").
- **Nothing moves in real life, so no money moves in the app.** Every link that only followed the main bank by default is pinned to the old main bank first (explicit `acct`, `payFrom`, `keptIn.acct` = old), in the same step, unless the person says to move it. So yesterday's numbers, every closed period and today's bank figures are unchanged by the switch itself. Test: every closed period's figures and today's figures per account are identical before and after a switch with nothing moved (Mako's shape: one bank, two cards paid from it by default, lines and Free to spend with no account).
- **What follows the main bank, asked once, as one list with the defaults ticked** (M91): "From now on, use <new> for:" each with its own tick: the pay that starts your periods (and each other pay landing in the old main bank), each bill paid from it, each card paid from it, spending money (the lines and Free to spend), Keep at least (the old amount offered, the box shows it; untick keeps none). Goals kept in the old bank are listed as "stays in <old>: the money is there" with a "I moved it" choice that writes the transfer (as setAside's own-account mode does). Defaults: everything ticked except goals (the money is physically in the old bank). "Not now" closes with nothing written.
- Writes, one step: `home.main` with `{ acct: new, min }` per AO5 (setField, so Undo is an edit back); `minBank` of the new account cleared when it moved into the pair; for each ticked link, `acct` or `payFrom` = new (edits); for each unticked default link, the pinned old id (edits). A pay or bill's change of account is the same field changeBill writes; a dated change (from the next occurrence) is not needed: a schedule's past occurrences are settled by records that carry their own account.
- **The money in the old bank** is not moved by setMain. After the step the change card says where the money is: "<old> still has 40,000. Move some to <new>?" with the door to a move between own accounts (M89's choices: move it, keep it there, later).
- What the figures do: safe to spend is unchanged unless a ticked bill or card now comes from a bank that will be short before pay; then the existing per-bank short line shows (amber, M47) and the card shows before and after. A switch that makes safe to spend fall by more than it is asks first (M6, the existing "large" ask).
- Undo: one step, after a reload too (all edits and one setField; slice 2 rules).

## 2. Close the main bank: `closeAccount(w, id, { to, now, newMain })`
- Today refused ("Your main bank is where pay lands, so it cannot be closed here yet"). Now: allowed when `newMain` names an open bank of the home currency other than this one. `to` (where the money goes) defaults to `newMain`, or "spent".
- One step, in this order: `setMain` to `newMain` with **every link ticked** (nothing can stay on a closed bank; goals kept in it are refused as today: "Holiday is kept in <old>. Change or remove it first"); then the close as for any account (the close-account question built from what will be written, lane/controls-5fix 8386d4bb: the typed "what is in it now", the move to `to`, a final check, `closed` today).
- The question (sure3): "Close <old>? <new> becomes your main bank: pay, <n> bills, <n> cards and your spending money use it from today. <amount> moves to <to>. You can Undo it". Not now: nothing written.
- Only one bank of your own open: refused, "Add the bank your money goes to first", with the door.

## 3. Where the person does it
- Screens: Plan > Accounts > an account that is not the main bank: "Make this my main bank" (opens section 1's list). Plan > Accounts > the main bank: "Close this account" opens the close sheet with a first box "Which bank is your main bank now?" (the open banks; "Add one" door).
- Settings, Money shows "Main bank: <name>" with "Change" (the same sheet).
- Assistant (M1, M3): `set_main { account, keep?: [refs that stay] }` and `close_account { account: main, to, now, newMain }`, each with the change card (src/change3.js before and after: the main bank's name, each moved link, Keep at least) and Undo; close asks first. SCREENS and WHERE gain "Make this my main bank: Plan, Accounts, tap the bank".
- controls3.js: the "main bank" row's `end` moves from todo to done, and gains `change: setMain`; e3_controls walks both.

## 4. Tests first
- plan3_write.test.js: setMain with nothing ticked changes no figure (every closed period, today per account, safe to spend); with all ticked moves each link and only those; Keep at least moves per AO5 and the old bank's notice; refused for a closed account, another currency, the main bank itself, a card or loan; closeAccount of the main bank with newMain: links, the move, the check, `closed`, the new pair; refused without newMain or with one bank; a goal kept in it refused; Undo of each puts every record and the field value back, after a reload too.
- Engine, by hand, on Mako's shape (one bank, two cards paid on the 10th and 11th from the main bank by default, pay on the 10th): add a second bank, setMain with all ticked, one day before pay: the cards' payments now come from the new bank, safe to spend before and after, each bank's figure before and after; a closed period's numbers unchanged.
- sync: setMain on the phone and a bill added on the desktop with no account (defaults to the main bank at write time, so it carries an explicit `acct`): after the join the bill stays on the bank the desktop meant; the AM2 notice when both changed the pair.
- e3_mainbank (page): Make this my main bank, the list with its ticks, Not now, Undo after a reload; close the main bank with its question.
- chat3_core.test.js: set_main and close_account on the main bank: card, ask, Undo.

## Questions for qc-foundation
1. Pinning the default links to the old main bank at the switch (instead of a dated main bank) keeps every past figure: is there any reader of `home.main.acct` for a past day that pinning misses (period-end answers `pe:`, the per-account short line, the bank after cards for a past period, statement matching)?
2. A book from another device written before the switch arrives after it (a line with no `acct` added on the desktop while offline): it follows the new main bank. Acceptable (it is new), or should the join pin it?
3. May the main bank be cash or an e-wallet? Recommendation: no for v1 (cards are paid from the main bank and pay lands in it); a bank only.
4. Anything in the saved shape that a later "main bank per period" (a dated main bank) would need now, so no data move is needed later?

## For Mako's run (written down, not asked now)
- The words "main bank" and "Make this my main bank".
