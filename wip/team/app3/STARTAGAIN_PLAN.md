# Start again in another currency (CONTROLS_PLAN slice 12 part, M34)

LANE J, 26 Nov 2026. For qc-foundation and qc-data-safety before building. Touches setup3.js, answers3.js, settings3.js, e3.js (MAIN's area: merge order agreed with MAIN 22 before building).

Lines served: M13 (change every kind of thing after setup; the currency is the one thing that cannot be changed in place), M34 (yen is the default), M61 and M69 (nobody loses data), M14 (Undo: Put it back), M2 and M16 (setup, each section saved), M91 (a "not now").

## The person and the moment (M98)
Ana in Manila set up the app in a hurry and left yen, the default. She typed her pay, bank and bills as pesos. Every figure shows a yen sign. Today she can only remove everything by hand. She wants the app in pesos with what she already told it, and not to type it all again.
What else could be true: she has logged two weeks of spending already; she uses two phones and the cloud copy; she changes her mind halfway through the new setup; she taps it by mistake.

## What it does
1. Settings, Money: under "Amounts are shown in ¥", a button "Start again in another currency". It opens a sheet: what it does in plain words ("Your money now is kept whole as a copy on this device. Setup opens again with your banks, pays, bills and cards filled in, and every amount left empty to type in the new currency. Put it back brings this copy back at any time"), the new currency picked, "Start again", "Not now".
2. Start again, one step:
   - The book kept whole first: E3.rec('copy', { copy, why: 'Start again in <cur>', pin: true }) (the store's kept store, as a restore does). If the copy is not saved, nothing else happens and the words say so.
   - A setup draft is written from the book (answers3.toForm, new, the inverse of fromForm): every bank, cash, e-wallet, pay, bill, card, loan, goal and line with its name, days, rhythm, weekend rule, paying account and kind; country; the new currency; every amount empty. Records logged after setup (spends, checks, receipts) are not carried: the sheet says so with their count ("14 things you logged stay in the kept copy").
   - The book on this device is replaced by none (as before setup) through the same door a restore uses, so the cloud copy and the other device follow the restore rules already built (settings3.js: restamp, the one-line warning, the which-to-keep question). Not settled 7 in MAKO_SAYS applies and is said in the sheet.
   - Setup opens on the screens, every section filled from the draft and marked "Not saved yet", amounts empty; the chat's "Your answers so far" reads the same draft (one draft, fix B).
3. Changing her mind: Put it back (Settings, kept copies, EXISTS) brings the old book back whole, at any time, including halfway through the new setup (the draft is then dropped after a sure question).
4. The assistant: `start_again { currency }` asks first (sure: it is a big replace), then the same step; the chat then carries on the setup.

## Saved data
No new field. The kept copy and the setup draft exist. answers3.toForm is a pure function.

## Tests first
- answers3.test: toForm then fromForm on Mako's made-up book gives the same shape with every amount empty (each kind, two pays, a yearly bill, a card with close day not sure, a loan, a goal kept in its own account, a bill paid from a card).
- e3_startagain (page): Settings > Start again > pesos: the kept copy is there; setup shows every name and day, amounts empty, peso sign; finish setup; Put it back brings the yen book back byte for byte; two devices with the cloud copy (Q.serve): the other device gets the restore question.
- The copy failing to save: nothing replaced.
- chat3_core.test: start_again asks first; Undo is Put it back.

## Questions for the reviewers
1. qc-foundation: anything a book holds that toForm cannot carry and that the person would expect to keep (a closed account, an ended bill, a goal's saved money)? Proposed: closed and ended things are not carried; goal money is an amount, so it is asked again.
2. qc-data-safety: is the restore door the right one for the cloud copy here, or must Start again be refused while another device has changes not yet joined?
