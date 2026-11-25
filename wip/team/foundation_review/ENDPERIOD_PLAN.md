# End of pay period: where the unspent money goes (plan only, 24 Nov 2026, lane B helper)

**Saved shape: no change** (SCHEMA_V3 7.4 `periodEnd`). **Engine: one small change, slice 0** (the sync check), which qc-foundation has said yes to on the terms written there. "Add it to the same line" is not in this version (it needs L q6 in the engine). Figures are made up and were run on the engine at wip-38.31.

## 1. Lines of MAKO_SAYS
Serves: **M24** "Choose where unspent planned money goes, or 'Decide later'." **M46** "Unspent planned money never drops out silently."
Touches: M1 "It needs to all be AI first." M3 "full control over all the numbers". M4 "Day to day he mostly talks to it." M5 "Screens are for seeing and checking." M6 "It changes, shows what changed, Undo is one tap." M11 "He logs weekly." M13 "Add, change and remove every kind of thing." M14 "Undo everywhere." M17 "Ask the assistant anything, any time." M30 "Almost all spending goes on the cards." M36 "The picture adds up to what is really in the accounts." M38 "Periods run pay to pay." M43 "Goal money stays in the bank (default) or in its own account." M45 "No coin is counted twice." M53 "one thing at a time." M68 "a daily call cap". Not settled 2 (screens work with the assistant off) and 8 (two named figures on Home).

## 2. The main way in (lesson 5): the assistant asks; the card is the same thing with it off
After the pay that starts a new period is ticked (L q2), once per visit, one place at a time, oldest period first. The prompt and the buttons are scripted from `EP3.waiting`: no model call (M68). Only a typed reply costs one.
> **Burrow:** Your pay is in. From 10 Nov to 9 Dec you had ¥9,000 left in Food. Where should it go?
> [Leave it in my bank] [Trip] [Decide later]
> **Mako:** trip
> **Burrow:** Done, Trip has ¥9,000 set aside now [Undo]
> **Burrow:** ¥12,000 left in Free to spend too. Same question
> **Mako:** decide later
> **Burrow:** OK, it stays on Home as "to decide" until you pick

**Not fresh (L q1, q9):** when a spend-from account or card was not checked in the period's last 3 days or after, it says "Card A was last checked on 2 Dec, so some of this may be spent already" and offers [Check your bank first], [Leave it in my bank], [Decide later]. A goal is offered only once the figures are fresh.
**Over:** when the period as a whole has nothing left it asks nothing: "10 Nov to 9 Dec went ¥14,000 over. Nothing left this time" (L q5).
**Home card:** the same, "1 of 2", folding to a line after Decide later. **Plan, "Pay periods gone by":** each line's left and where it went, with Change and Take back. The assistant can do both too.

## 3. What happens today (Mako's shape)
Pay ¥240,000 on the 10th, Food ¥40,000 and Free to spend ¥60,000 a pay, Trip kept in the bank, cards paid in full on the 10th and 11th. Food ¥31,000 and other spending ¥48,000 went on the cards, so Food has ¥9,000 left and Free to spend ¥12,000 on 9 Dec.
- On 10 Dec each line starts at its full amount again (lookahead.js:965). `periods().past[0]` still reports the two lefts (lookahead.js:1042) but nothing shows them. The ¥21,000 sits inside what the bank can spare (¥277,000), named nowhere. **It drops out silently.**
- A bill not ticked does not drop out: it stays held and listed (home3.js:224). Not changed here.
- **Unlogged card spending lands only in Free to spend** (lookahead.js:977 to 980). Run: Food left ¥40,000, Free ¥12,000 on pay day; the card figures go in two days later and the same period shows Food ¥40,000 and Free minus ¥54,000. The period was ¥14,000 over. So a place's own left is never offered on its own (section 4).
- A `periodEnd` record's date fixes the period's last day (lookahead.js:357, 367); its moves to a goal fill the goal (lookahead.js:860). Run: ¥9,000 to Trip gives Trip ¥9,000 and the bank's spare ¥268,000.

## 4. The choices: one act3 step each, each with Undo
**What can leave a period (L q4, q5):** the sum of its places' left, less the places that are over, less answers already given, never below zero. An over comes off Free to spend's left first, then the other lines in plan order. A place is offered the smaller of its own left and what the period can still give. Net zero or less: nothing is asked and the overspend is stated. When answers already given are more than the period turned out to have (figures came in later), the card says so and offers Take back; it never takes back by itself.
`ACT3.run(label, w => EP3.answer(w, x))`, built id `pe:<occurrence that started the period>:<place>` (ids.js:36), date always `past[i].end`, never worked out.
| Choice | Record |
|---|---|
| Leave it in my bank | `{ k:'periodEnd', place, moves:[{ to:'waiting', a }] }`. No figure changes; it is the proof it was decided |
| Move to a goal kept in the bank | `moves:[{ to:<goal id>, a }]`. Refused above what the period can give (the engine does not refuse, so EP3 does) and above the `canSetAside` of the goal's bank (lookahead.js:1317) |
| Decide later | nothing written (section 5) |
| Change, Take back (later day) | the same record with new `moves`, or `moves: []`. The record stays, so the period's end stays fixed (T1) and the question returns. Refused when the goal no longer holds the money to give back, as `takeOut` does (plan3_write.js:293 to 295) |
Undo right after an answer is act3's own. **Two devices** answering one place differently get a "which to keep" question with both kept (SCHEMA_V3 2.3, AT1, M20); it names the period and the place, never the raw id.

## 5. "Decide later": never dropped, never twice
`EP3.waiting(book, day)` works it out each time: every period in `periods().past`, oldest first, by the rule in section 4. Nothing is saved, so a reload, a merge, a restore or an Undo bring the same question back. It shows on Home's folded line, in the assistant's summary and on Plan.
It is a label on money already in the bank, added to no total. Home now shows two named figures when they differ (Not settled 8): everyday money left until pay, and what the bank can spare beyond the plan. Money still to decide is **inside the second and never in the first** (the new period's Free to spend starts at its own amount). The card says so in those words, and slice 2 asserts both figures are the same with the card and without it.

## 6. Other lives
- **Every two weeks, weekly:** a question at each pay; the card counts what waits ("3 pay periods").
- **Set up mid-period, away two periods, pay late:** the part period is asked about; each period keeps its own id and last day (L q8); no question before the pay is ticked (L q2).
- **No fixed pay:** no past periods (periods.js:32); last month's left still drops silently. **M46 stays NOT MET for this life.**
- **A change of pay:** `past` becomes empty (lookahead.js:376, 1030). Slice 2b stops the silence without an engine change.

## 7. Slices (test first, one commit each, check3 quick after each, full before merge)
0. **The sync check judges kept places only** (engine/sync.js). qc-foundation's yes is given on these terms: "kept place" is decided from `book.places` (and Waiting), never from a list of line ids, so an ended line is still skipped; the goal side of the sum at sync.js:481 stays; the test has a goal as well as a line, with real-looking ids. Failing case: Food's ¥9,000 to Trip or to Waiting raises no `shares` question.
1. **What waits.** New `src/endperiod3.js`, node test `tests/endperiod3.test.js`: Food ¥9,000 and Free ¥12,000; **Food ¥40,000 with Free minus ¥54,000 gives nothing and "¥14,000 over"**; the same with ¥40,000 already sent to Trip offers Take back; an answered place leaves the rest; mid-period setup; two periods; no fixed pay gives none; nine record orders. Files: the two new ones, build3.sh, check3.sh.
2. **Home card and Plan rows.** `tests/e3_endperiod.js` (real page): Trip gets ¥9,000, spare ¥268,000, both Home figures as section 5; not fresh hides the goal; Undo; Take back on a later day keeps the record with `moves: []` and, after the pay is re-dated to 12 Dec with a spend on 11 Dec, Food's left stays ¥9,000; Take back refused after Trip was spent; Decide later survives a reload; two devices: the which question names the period and place (cloud3_page.js:236 to 240). Files: endperiod3.js, home3.js (lane/homefix first), plan3.js (controls slice 4's lane first), cloud3_page.js, controls3.js row (controls slice 1 first).
2b. **A change of pay names what waits first.** The pay-change step (plan3_write.js:178 to 196) reads `EP3.waiting` and asks before it writes. One test. After lane/ai-core.
3. **The assistant:** `end_period`, `change_end_period`, `take_back_end_period`, each with Undo, and the scripted pay-day prompt. Fake-model test. Files: chat3_core.js, answers3 (lane/ai-core and lane/ai-panel first, then controls slice 1). Slices 2 and 3 reach Mako together; M24 is not MET before this.
4. **The walk.** `tests/e3_walk.js` crosses a pay day with hand-worked figures, the ¥14,000 over case included.
**WATCH, later, not built now:** L q6, then "add it to the same line"; L q7 hold; no fixed pay needs a name for its month before `pe:` ids work there; periods gone by kept across a change of pay; goals in their own account (a real transfer beside an answer counts twice, lookahead.js:844); several accounts (the cap must be the goal's bank, not the line's account); a second currency (offer only goals in the place's own currency); a statement found later (P5) beyond the Take back offer.

## 8. For the coordinator to bring to Mako (causes, with a recommendation)
1. **Money left in a line stays in the bank and is named nowhere after pay day.** Recommended: always ask, one line at a time, never pick for him. Nobody has checked that people paid weekly will answer line by line.
2. **He logs weekly and card spending not yet logged makes a line look fuller than it is, so money could go to a goal that the period never had.** Recommended: a goal is offered only after the cards and bank are checked; "Leave it in my bank" and "Decide later" are always there.
3. **"Add it to Food this time" is not in the first version,** because the engine cannot carry a line's money yet without risking a wrong amount. Recommended: ship bank, goal and Decide later now.
4. **Money still to decide is inside "what the bank can spare beyond the plan", the second of Home's two figures, and never in the everyday figure.** Recommended: leave it there, said on the card, and settle it with the names of the two figures at his run (Not settled 8) instead of holding it out (team rule L q7).

## qc-foundation
- **Review 1 (draft 3ecd19d): FAIL.** A line's answer raised a sync question that could not be cleared (now slice 0); "add it to the same line" through `once` was unsound (taken out); undecided money vanished at a change of pay; no change or take back on a later day.
- **Review 2 (60a3d16): FAIL, small, no saved-shape change.** F-A the question offered money the period did not have (section 4's rule, slices 1 and 4); F-B Take back after the goal's money moved on (refused); F-C the silence at a change of pay (slice 2b); F-D Take back un-fixed the period's end (`moves: []`); F-E the assistant could not change or take back (slice 3); F-F two devices get a which question, not "the newer wins" (section 4). Its yes to slice 0 is recorded there. All six are in the text above; the coordinator runs the next review.

## Third review (qc-foundation, 24 Nov, on ba963f2) and what changed since: read this before building

FAIL, for a cause outside this plan: a card's unlogged spending was dated on the day the card was checked, so the figures this plan reads ("left" in a period just ended) were wrong for anyone who spends on cards. That is fixed in the engine on lane/twofig-engine (BZ1 in DECISIONS_ROUND2: a card gap is split by days over the stretch it covers). **This plan builds only on top of that branch.** Section 3's third bullet is corrected by it: after the fix the period that ended really shows the overspend once the card figures are typed, pay ticked or not.

Decisions taken by the coordinator on 24 and 25 Nov, now part of this plan:
- A goal is offered only when the cards and the bank are fresh (checked after the period's end). "Leave it in my bank" and "Decide later" are always offered.
- With no fixed pay the money is never called "money with no job" and is never offered to a goal: the card says what is true ("not needed before <the day the look-ahead reaches>, with no income counted") and offers only Decide later and Check your bank.
- The engine now gives canSpare, everyday and noJob (BZ3). The card and the assistant read those; undecided money sits inside noJob and never in the everyday figure (Not settled 8).

Eight points for the builder, each goes into the slice named (no saved-shape change in any):
1. Undo of a goal answer after the goal's money was spent is not refused by the write door: act3's undo refuses only when the same record changed later, and its check floors a place at zero. The same hole exists for money set aside by hand. Fix the shared piece (act3's check refuses a step that leaves a kept place below zero), one test. Slice 2.
2. The sync question for a goal cannot be answered (device A takes back, device B spends from the goal: a `shares` question with nothing to undo). Slice 0 makes it answerable (offer to put the answer back) or routes it to EP3; a test with two devices.
3. "Plan order" has no owner (a list's order means nothing, SCHEMA_V3 2.3). The order an overspend comes off the lines is: Free to spend first, then each line by its `told`, then its id.
4. Answers are counted by record, not by line: a line marked gone drops out of a past period's lines, so its waiting money and its answers would be missed.
5. Answering again after Take back is an edit of the live record, never a second add.
6. Slice 2b covers every write that empties the past periods, not only the pay-change form: each reads EP3.waiting first and names what is still to decide.
7. Outside pieces, named: the site's AI switch and the relay key with its daily cap (the pay-day prompt is scripted and costs no model call); the cloud copy for the two-device tests; lane/ai-core and lane/ai-panel for the assistant action.
8. EP3 does money sums outside the engine: it is listed by name in the no_maths gate as a pure file tested in node, with no page access, so it can move into engine/periods.js when carrying (q6) and holding out (q7) arrive.

Still open for a later stage (watch, not built): a later card check can push spending back into a period already answered (the card says so and offers Take back, never takes back by itself); two-weekly or weekly pay with a monthly line needs carrying (q6) before those lives; no fixed pay needs an id form for its month; after a change to no fixed pay, given answers still fill their goals but cannot be seen or changed; a pay unticked after an answer leaves the new period started (T1), and the screen must say so; sending part of a place's left, or splitting it, is a screen and an action only.

Order of building, unchanged: slice 0 (the sync fix, its own qc-foundation yes on the terms recorded above), slice 1 (endperiod3.js and its node test, waits for nobody once lane/twofig-engine is merged), then 2, 2b, 3, 4 behind the lanes named in section 7.
