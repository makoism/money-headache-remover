# The cloud copy's answers through the one write door (plan, LANE D, 26 Nov 2026)

Lines served: M61 (nobody loses data), M14 (Undo everywhere), M20 (phone and desktop both changed one item: the app asks which to keep, the other stays for Undo), M67, M69. Touches: M44 (one dataset), M66.
Known fault it closes (scope.txt, MAIN 17's list): "which to keep" answers do not go through the one write door (act3): app3/src/cloud3_page.js answer3, undoAnswer3, pickVersion3 (Use the other one) and the check answers (answerCheck: x8, closed, minimum, main) call E3.put with a book the engine made. So they skip the door's engine check, the saved Undo journal (no Undo after a reload), the door's queue (two writes can cross) and the listeners every other write runs.

## The main way in (lesson 5)
The person answers on Settings ("To choose") or Home's line that sends them there; the assistant does not answer these questions today and this plan does not add that. Nothing the person sees changes except: Undo after a reload now works for an answer, as for every other write.

## What changes
1. **One door action, `answerSync`, in app3/src/act3.js.** It takes the book the engine's own answer made (engine/sync.js answer or answerCheck, unchanged) and writes the difference through the writer, item by item. The engine stays the only place that decides what an answer means; the door only carries it. No engine rule changes. Nothing saved changes shape.
2. **A writer op `swap(where, of, value)`** for an item the cloud copy names the way engine/sync.js names it: `where` the dotted path of its holder (`plan.budgets`, `schedules`, `keptVersions`, `home`), `of` the record id in a list of records, or `where.key` for a settings item (`home.country`). `value` undefined takes a record out of its list (only a whole-copy answer does that, exactly as the engine's answer does). It logs `{ where, of, before, after }` (the whole old value and the `at` the step left).
3. **The difference** (a pure function in act3.js, `syncDiff(cur, next)`): every top-level key but `rev` and `journal`; a list of records is compared by id (order never counts, LESSONS 4 addendum); a plain object is walked into; anything else (a settings item, a list that is not of records) is compared whole. Each item that differs is one swap.
4. **Undo of an answer** puts back each item's `before` with the Undo's own `at` and `by` (so the other devices take the Undo, as undoAnswer3 does today), and the kept record with it, so the question and both versions come back (e3_cloudwhich2 TEST B). Refused, as every Undo is, when an item changed since (its `at` is not the one the answer left).
5. **The journal** keeps each swap's `before` (a record or a settings item: small). A whole-copy answer can change hundreds of records: when an answer swaps more than 50 items its journal entry keeps the list without the old values, and its Undo after a reload is refused in plain words ("This was a choice of a whole copy. Use the other copy in Settings to go back"); Undo in the same visit keeps working (held in memory, as today). The kept copy stays in keptVersions either way, so nothing is lost.
6. **The page**: answer3, undoAnswer3 (removed: the door's own Undo replaces it), pickVersion3 and the check answers call `ACT3.answerSync(label, nextBook, { undo: words })`. The stale-row check (drawn stamps, STALE3) stays in front of it unchanged, and the door's whole-book mark (`ver`, STALE_SHEET_PLAN) is passed from when the rows were painted, so an answer on a book that changed since is refused.

## Lives and cases (each a test)
- A plan item (a bill's amount), a settings item (the country), a whole copy, "Keep both", "Use the other one", each check question (x8, closed with "move" which adds a record, minimum, main).
- Undo right after, and Undo after a reload (item answers), refused after a later change of the item.
- Two tabs: tab 2's stale row refused (TEST A), unchanged.
- The engine check: an answer the engine refuses (lookahead throws) is not saved, in plain words.
- Order: the same answer on the book in reversed lists writes the same swaps.
- Cash-only, no fixed pay, cents currency: no difference (the door carries what the engine made, money is never worked out here). One case in yen and one in a cents currency for an amount answer.

## Tests, test first
- tests/act3_sync.test.js (node, new): syncDiff and answerSync on books made by build_book and sync.join with realistic ids (idMaker): each kind above, journal contents, Undo, Undo after a reload (a new door over the saved book), refusals, the 50 item rule.
- tests/e3_cloudwhich2.js stays passing (A and B) and gains: after a reload, Undo from... (no: the Undo bar does not survive a reload; the page test checks the journal entry exists and that a second door made after the reload can undo the step).
- tests/e3_cloudwhich.js, e3_cloudstatus, e3_restore, restore3.test unchanged and passing.

## Risks
- A whole-copy answer through swaps must give the same book as the engine's answer (test: deep-equal apart from `journal`).
- keptVersions joins the door's lists for the first time: seen() and the whole-book mark now include it (they skip `journal` and `rev` already).
- No helper writes engine files. Files: app3/src/act3.js, app3/src/cloud3_page.js, tests, check3.sh row.
