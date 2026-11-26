VERDICT: PASS (qc-foundation, confirming run on F1, build lane/ai-join at 6a748918; fix 63e0e7fe with failing test 781af7b3. Earlier report: run1_qc-foundation.md)

CHECK: check3.txt in this folder ends "(full level, 3 at a time, 857 s in all)" / "ALL GOOD"; commit 6a748918 says that run is at the F1 and B1 to B3 fixes. tests/chatfig.test.js run again here: ALL PASS (10). Since 63e0e7fe the only source changes are screens (home3.js help name, money3.js drops the Undo bar on a whole new book, app3.css): no engine or write door change.

F1, CLOSED (option (b) as ruled)
What changed: bank_figure and card_figure (chat3_core.js:589-604) now take what the engine expects on that account by today (lookahead checkIn.toConfirm, account === the figure's account, lands <= today), write them in the same check as ticked with their expected amounts and landing days (the same shape the Check your bank screen writes, checkin3.js:93-118), leave out anything the person said has not gone through (not: refs), name each on the change card and ask first (chat3_core.js:917-920, ask 'ticks'). A card payment counts on its paying bank (lookahead.js:822, checkin.js landedFrom), so Mako's card payments on the 10th and 11th are listed with a figure for Main. farFigures (chat3_core.js:776) works the gap out with the ticks in, so the "far from expected" words are right.

Walked by a node harness on the real turn, confirm and undo of chat3_core with a fake AI (scratchpad h.js, w1.js, w2.js):
1. Worked example: 286,000 set up 24 Nov, rent 72,000 out 27 Nov, 10,000 spent. "My bank shows 204,000" on 30 Nov: card names Rent 27 Nov 72,000, asks first; after OK Main 204,000, nothing left expected, Free to spend left 22,000 (by hand: 60,000 x 16/30 = 32,000 from setup to the day before pay, less 10,000). Next day Main still 204,000. Right.
2. Not gone yet, then later: figure 276,000 with not: [B1] on 30 Nov: Main 276,000, Rent still expected, left 22,000. "Rent came out" on 2 Dec: Main 204,000, left 22,000, nothing expected. Right (the rent lands after a figure that did not hold it).
3. Undo of the figure card: Main back to 286,000, Rent expected again, left back to 32,000. Right.
4. Mako's shape with a card (Visa 50,000 owed, paid on the 10th, close day not sure): on 11 Dec the bank figure lists Pay 10 Dec 240,000, Rent 27 Nov 72,000, Visa 10 Dec 50,000; after OK Main equals the figure, the new period starts 10 Dec, the 5,000 gap comes off Free to spend. A card figure of 12,000 then shows the card at 12,000 and takes 12,000 off Free to spend; it lists nothing (no expected item sits on a card), as before.
5. Every two weeks in pesos, set up on pay day 20 Nov, back on 19 Dec: lists both pays (4 and 18 Dec) and Rent (5 Dec moved to Mon 7 Dec); after OK the period starts 18 Dec and the 200,000 gap comes off; Undo puts all of it back.
6. No fixed pay: lists the bill only, Main equals the figure.
7. Nothing expected on the account: the figure goes in with no list (chatfig test 3).

OWNER'S WORDS (only lines this fix touches; all else as in run1)
M3 MET (the figure write is now true). M4, M6 MET as built (a figure that ticks asks first, names each, one Undo). M7, M12, M36, M37, M44, M45 MET for this path (F1 was the only reason they were NOT MET in run1). M38 MET (the ticked pay starts the period at its landing day, also for two pays at once). M40 MET (card payment on the paying bank). M14 MET (Undo of the whole check). M13 silent. A to D and F otherwise unchanged from run1.

GRID
Unchanged from run1 apart from one cell now covered on the assistant's side: a bank or card figure from the assistant now ticks the expected items (no new kind). Run1 count stands: 136 cells, 93 covered, 6 not applicable, 37 empty; only cards plan F1 needs the base (KNOWN). Bank or card figure change and remove stay empty on S and A (controls slice 10, scope).

FOUNDATIONAL
None new.

FOR THE BUILDER (no base change, small)
1. not: takes a schedule ref, so it unticks every occurrence of that pay or bill. A weekly or two-weekly earner back after a while whose newest pay has not landed yet can only untick all of them; the older ones then land after the figure (the run1 kind of error, smaller and only when they say so). Let not take one occurrence (ref plus date), or untick only the newest.
2. The figure card adds "(my guess)" whenever the figure was not typed in this chat turn; with ticks it also asks first, so nothing goes in silently. Not a fault, a note for the wording run.

WATCH
- The saved check-in still does not record which items it listed (option a, a later slice with its own plan). Any new writer of a figure (statement or screenshot reader, M2 M9 M99, the cloud copy merging a check from the other phone) must list and tick the way the screen and now the assistant do, or F1 comes back on that path. Put a test like chatfig in each such slice.
- Ticked by default relies on the person reading the card: a person whose bank figure still includes rent who taps OK gets a 72,000 gain asked about by the engine (gain_to_ask), not a silent error.
- Server settings to show Mako, unchanged from run1: the API key, the relay database binding (/api/health "vault": true), the live write limit (device 1,200 assumes 1,500), the Anthropic monthly spend limit; nobody has run the real AI.

CHECKED AND SOUND
The fix uses the engine's own list and the same check-in fields as the screen; landedFrom (checkin.js:75-90) unchanged; card payments go by the paying account; Undo of the check reverses figure and ticks together; nothing expected keeps the old behaviour; the "not" path leaves items expected and a later tick lands after the figure, which is right.

NOT CHECKED: the page in a browser; the real AI choosing not: from free words.
