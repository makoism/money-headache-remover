(Saved by LANE C from the reviewer's reply: qc-foundation on foundation_review/STALE_SHEET_PLAN.md, lane/staledoor fd6e8f4f, 25 Nov 2026 about 20:25 JST. Shortened in layout only.)

VERDICT: FAIL (plan stage). The rule is right and belongs in the door. No saved-data or engine change is needed now or later. As written it leaves three ways through and one false refusal, all cheap to fix in the plan. Nothing was run; from reading the code.

BLOCKERS
1. Free to spend slips past, because the change only adds a record (plan3.js:227-228 always calls setFree with the box; plan3_write.js:95 adds a `shares` entry; the same for the "how much each pay" answers at plan3_write.js:221 and 429). Example: tab two opens Free to spend at 30,000; tab one sets 20,000; tab two changes only "when" and saves: a new 30,000 entry is added, nothing is edited, nothing refused. The same hole when the tab is behind: the three-way join sees two adds and no clash (e3.js:160-163). Fix: a step can tell the door "this replaces what is in list X"; the door refuses if any record in that list has a new id or a moved stamp since the note, compared as a set.
2. A card's own steps refuse each other (carryOut runs up to MAX_STEPS steps, one door.run each, chat3_core.js:612-623): with one note per card, step 1 moves a record's `at` and step 2 on the same record is refused. Fix: after each kept step the note takes that step's own stamps (st.own, act3.js:275); records a step added itself are exempt. A unit case for both.
3. For the assistant the note is taken too late: refs are numbered by position (S1.. by told order, chat3_core.js:211-216; B and P at 195) and worked out again in handle(), after the wait for the relay. Example: the model is shown S7 = coffee; during the wait a cloud take brings a spend told earlier; S7 is now another spend, and a change applies to the wrong item with a fresh note. Fix: take the note (and freeze the refs) when the request is built.
4. Two messages and two behaviours for one event: a tab that is behind gets "Changed in another tab. Shown again, try again" (e3.js:68, 161, 165), the sheet stays open with old boxes (plan3.js:193-194), and the second tap gets the new sentence. Fix: one sentence, one place in plForm3, receipts and the card that handles why 'other' (close, redraw from the book).

ANSWERS
- Goals: set aside and take out only add `move` events, but the step checks the book as it is at save. No stale figure is written.
- Settings as `{ v, at }` under home: no sheet edits them today. Make the note's key a plain string so a path fits later.
- The same `at` twice: two devices in the same millisecond give the same text; note `at` plus `by`.
- A redraw or a tab join moves no stamp. A restore restamps everything and every open sheet refuses: right. holdArriving (store/clock.js:90) is not wired into app3; when it is, it rewrites `at` locally: watch.
- A Plan sheet closes after a kept save, so no second save from one note. Undo from the bar on the same item makes the open sheet refuse: right.
- A cloud take while a sheet is open: refused. Sound, apart from blocker 1.
- Setup, Reminders, Settings: confirmed, no note needed.
- Check your bank is NOT confirmed: it writes a "found at a bank check" spend whose amount is worked out at Save from the book then, not the gap shown. If the book moved while it was open, an amount the person never saw is written (M6). Also a bill ticked in both tabs hits a plain Error at act3.js:102, not a Bad, so run() rejects and checkin3.js:197 shows nothing. Simplest fix: the check sheet takes a note and asks the door to refuse if anything changed.
- Cost: one pass over a few thousand records, held in memory: sound for sheets. Do not keep the note inside chat state (every chat action JSON-copies it) and never send it to the relay.

SMALLER
- False refusal, safe: endBill hands the period flag to another pay (plan3_write.js:257); if that pay changed, the end is refused.
- Order dependence, not this plan's, for the main build: setFree "once" picks shares.slice(-1)[0] (plan3_write.js:86) and the engine reads `once` across shares in list order (lookahead.js:838, 858, 863); two entries with a `once` for the same pay can give different Free amounts.

OWNER'S WORDS: M61, M69 not met until blocker 1 and Check your bank are closed. M3, M6 broken by blockers 2 and 3. M14 met. M20 met for edits and removes. M13, M67 met.
