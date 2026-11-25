# A sheet left open must not save old figures over a newer change (plan, LANE C, 25 Nov 2026)

Half a page, for qc-foundation before any line changes. Branch lane/staledoor, on top of lane/ai-join. Ruled by the coordinator on 25 Nov ("the door refuses a save from a sheet whose item changed since it opened, says so, nothing lost, and the same rule for the assistant's changes and for a second device if the path is shared"). **Saved shape: no change. Engine: no change.**

## Mako's lines
Serves M61 "Nobody loses data. Priority one", M69, M14 "Undo everywhere", M20 (when two places changed one item the app asks, it never picks silently). Touches M1, M3, M6 (the assistant's changes go through the same door), M13, M67.

## The fault (found by qc-data-safety on 25 Nov; it is on the live build too)
The app open in two tabs. Tab two opens Plan, Rent (72,000) and leaves the sheet open. Tab one changes Rent to 76,000 and saves; tab two hears it and takes it in (src/e3.js joinIn), but its open sheet still holds 72,000 in the box. In tab two only the name is changed and Save is tapped: the sheet hands the door every box it holds, the door sees 72,000 against the book's 76,000 and writes it as a change. Rent is 72,000 on both, with no question, and tab one has no Undo for it. The store's own guard (a save from a tab that is behind is joined three ways, src/e3.js put) does not see it, because tab two is not behind: it is up to date with a stale sheet. The same happens when the newer change arrives from another device through the cloud copy while a sheet is open, and when the assistant offers a change card and the item changes before Apply is tapped.

## The rule, in the one write door (src/act3.js)
1. `ACT3.seen()` gives a small note of what this page has seen: the change time (`at`) of every record in the door's lists, by id.
2. `ACT3.run(label, fn, { seen })`, and the named actions' last argument too: while the step is planned, every record the step **edits or removes** is looked up in the note. If the record's `at` in the book is not the one noted (or the record was not there when the note was taken), the step is refused before anything is written: `{ ok: false, why: 'other', text: 'This was changed somewhere else while it was open. Nothing was saved. Here it is as it is now' }`. Records the step only adds are never refused. A step with no note behaves as today.
3. Who takes the note: the shared Plan form (plForm3, one place for every Plan sheet) when it opens; the receipt being edited (receipts3.js) when it is opened; a change card of the assistant when it is made (chat3). On a refusal the sheet closes to its list, drawn from the book as it is now, with the sentence; the person opens the item again and sees the current figures. Nothing typed is written and nothing saved is lost.
4. Undo is not touched: it has its own, stricter rule already (refused when a later step changed the same record).

## Why here and not in each sheet (lesson 2)
The missing piece is "the door does not know what the person was looking at". Fixing the Rent sheet would leave the card, goal, line, pay, loan and receipt sheets and the assistant's cards with the same hole. One rule in the door, one note taken by the one shared form.

## Tests, first
- tests/e3_stalesheet.js (committed, RED on the join: 5 of 8 fail): the Rent example in two tabs. The refused save writes nothing; tab two is told; trying again from the fresh sheet saves the name and keeps 76,000.
- tests/e3_act_unit.js (node, the door alone): a note, then the record is edited by another step, then an edit with the old note is refused with why 'other' and the book is unchanged; a remove the same; an add with an old note is kept; an edit of another record is kept; no note: as today; the note does not depend on the order of the lists.
- A receipt edited in two hearing tabs, and an assistant card applied after the item changed (fake AI), each one case.
- The second device: one case in the cloud tests, a take arriving while a sheet is open, then Save.

## What is not in this plan
Typing dropped when a sheet is left (the reviewer's blocker 7) and the identical "which to keep" rows (blocker 6): the main build session's. Check your bank and setup add records and edit none, so they need no note. Reminders and Settings write device settings, not book records: listed for the reviewer to confirm.

## Files
src/act3.js (the rule), src/plan3.js (plForm3 only), src/receipts3.js (the edit form), src/chat3.js or chat3_core.js (the card's note), tests above, check3.sh rows, FEATURES.json. act3.js, plan3.js, receipts3.js and the chat files are the main build session's: it is told before each is touched.

## After qc-foundation's review (25 Nov; qc_reports/2026-11-25_stalesheet/foundation_plan.md): FAIL at plan stage, the rule right, four gaps closed here before any line changed
The door gets two notes, both taken by the caller and checked before anything is written:
- **`seen`** (by record, for a sheet on one item): id to `at` and `by`. An edit or remove of a record whose stamp moved is refused. **An add to a list whose newest entry is "the amount now" (plan.shares: Free to spend) is refused when any entry of that list is new or moved since the note** (blocker 1; compared as a set, never by order). After each kept step the note takes that step's own stamps, so a caller's own second step is never refused by its first (blocker 2).
- **`ver`** (the whole book, for a caller whose step depends on everything it showed): a short mark of every change time in the book, order-free. A step with an old mark is refused. Used by Check your bank (its gap spend is worked out from the whole book at Save: the sheet's finding) and by the assistant: the mark is taken when the request is built, before the wait for the AI, kept beside the chat state and never inside it or sent; a change made on an older book is not carried out and the AI is told to look again (blocker 3: refs are positions, and a spend arriving during the wait moves them). A card waiting for OK carries the short mark (a few characters, no figures) and is refused the same way if the book changed since it was offered. After each of its own kept steps the caller takes a new mark.
- **One sentence, one behaviour** (blocker 4): "Nothing was saved, because this changed somewhere else while it was open", from the door and from the store's behind-tab refusal alike (src/e3.js OTHER). A Plan sheet closes to the list, drawn from the book as it is now, with the sentence in the message band. The receipt form keeps what was typed, shows the list as it is now and takes a new note, as it does today for a behind tab (tests/e3_tabs.js). A card says it on the card.
- A bill ticked in two tabs (act3.js add of an existing id) becomes a plain refusal, not a crash.
Not taken: endBill's safe false refusal (it stays, noted); the `once` order question (the main build session's, sent to it).
Files added to the list: src/checkin3.js (the mark at open, one line at save), src/e3.js (the one sentence), tests/e3_tabs.js (its sentence).
