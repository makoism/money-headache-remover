# End of pay period: where the unspent money goes (plan only, 24 Nov 2026, lane B helper)

**Saved shape: no change.** Every record is in SCHEMA_V3 7.4 (`periodEnd`). **Engine: one small change is needed before slice 2, and it needs qc-foundation's yes on the fix itself:** the sync check reads a budget line's answer as money leaving a kept place and raises a question that can never be cleared (sync.js:481, 489 to 495; section 7 slice 0). **"Add it to the same line" is not in this version:** it needs L q6 in the engine (section 4). Figures are made up and were run on the engine at wip-38.31 3d941d7.

## 1. Lines of MAKO_SAYS
Serves: **M24** "Choose where unspent planned money goes, or 'Decide later'." **M46** "Unspent planned money never drops out silently."
Touches: M1 "It needs to all be AI first." M4 "Day to day he mostly talks to it." M5 "Screens are for seeing and checking." M6 "It changes, shows what changed, Undo is one tap." M13 "Add, change and remove every kind of thing." M14 "Undo everywhere." M30 "Almost all spending goes on the cards." M38 "Periods run pay to pay." M43 "Goal money stays in the bank (default) or in its own account." M45 "No coin is counted twice." M53 "one thing at a time." Not settled 2: every task possible on the screens with the assistant off.

## 2. The main way in (lesson 5): the assistant asks; the card is the same thing with it off
After the pay that starts a new period is ticked (L q2), the assistant raises it once per visit, one place at a time, oldest period first:
> **Burrow:** Your pay is in. From 10 Nov to 9 Dec you had ¥9,000 left in Food. Where should it go?
> [Leave it in my bank] [Trip] [Decide later]
> **Mako:** trip
> **Burrow:** Done, Trip has ¥9,000 set aside now [Undo]
> **Burrow:** ¥12,000 left in Free to spend too. Same question
> **Mako:** decide later
> **Burrow:** OK, it stays on Home as "to decide" until you pick

When a card or bank was last checked before the period's last 3 days, one line comes first: "Card A was last checked on 2 Dec, so some of this may be spent already" with [Check your bank first]. It still asks (D 18 Nov item 3). This softens L q1 ("the question starts with a check-in") to an offer; section 8 item 2 brings it to Mako.
**Home card:** "Left from 10 Nov to 9 Dec, 1 of 2. Food ¥9,000" with the same buttons (the goal button lists goals kept in the bank only). After Decide later it folds to a line that stays: "¥12,000 from 10 Nov to 9 Dec still to decide" [Decide]. **Plan, "Pay periods gone by"** shows each line's left and where it went, with **Change** and **Take back** on any later day (M13): both remove the `pe:` record, so the question returns.

## 3. What "unspent planned money" is today, and what the engine does with it
Mako's shape: pay ¥240,000 on the 10th, Food ¥40,000 and Free to spend ¥60,000 a pay, Trip kept in the bank. From 10 Nov to 9 Dec: Food ¥31,000 on Card A, other spending ¥48,000 on Card B, cards paid in full on 10 and 11 Dec.
- **A line with money left** (Food ¥9,000) and **Free to spend left** (¥12,000). On 10 Dec, pay ticked: `periods().past[0]` reports both (lookahead.js:1042); Plan lists "spent of" only (plan3.js:126). Each line starts the new period at its full amount (lookahead.js:965; nothing reads last period's left). Safe to spend is ¥60,000, capped by the new Free to spend (lookahead.js:1260). The bank can spare ¥277,000 and the ¥21,000 is inside it, named nowhere. **It drops out silently.** With no Free to spend set, safe to spend goes ¥219,000 to ¥277,000 with the ¥9,000 inside it, without a word.
- **A bill not ticked** does not drop out: it stays held and listed ("Rent 27 Nov, late" in the bank's sum; Home "not seen yet", home3.js:224). Not changed here.
- **Cards:** a line's left counts card spends by the day bought, so it is true only once the card figures are fresh (the "last checked" line).
- **What the engine already reads:** a `periodEnd` record's date fixes the period's last day (lookahead.js:357, 367) and its moves to a goal fill the goal (lookahead.js:860). Run: Food's ¥9,000 to Trip gives Trip ¥9,000 and the bank's spare ¥268,000. A move to Waiting changes no figure. Nothing writes one today.

## 4. The choices: one act3 step each, each with Undo
`ACT3.run(label, w => EP3.answer(w, x))`. Built id `pe:<occurrence that started the period>:<place>` (ids.js:36), so two devices make one record, the newer wins whole (P2), and an answer after Undo revives it (act3 `writer.add`). **The date is always `past[i].end`, never worked out:** a wrong date moves the next period's start.
| Choice | Record | Held? |
|---|---|---|
| Leave it in my bank | `{ k:'periodEnd', place, moves:[{ to:'waiting', a }] }` | Yes (7.4). No figure changes; the record is the proof it was decided |
| Move to a goal | `moves:[{ to:<goal id>, a }]` | Yes, and read (lookahead.js:860). EP3 refuses above the place's left (L q10; the engine does not, so this is tested) and above the bank's `canSetAside` (lookahead.js:1317) |
| Decide later | none | Worked out (section 5) |
| Add it to the same line | **not offered** | No. Through the line's `once` key it gives a wrong amount when pay is not monthly (the amount is shared out again per period), counts twice when two devices answer differently, and leaves books that L q6 could not read later. It comes with L q6 in the engine |
The amount is never typed: it is the engine's `left`, less moves already answered, never below zero. The question shows it and the person picks (M6). The first answer of a period, "Leave it in my bank" included, fixes that period's end (T1, settled): a pay re-dated later, or its tick undone, does not move it.

## 5. "Decide later": never dropped, never twice
`EP3.waiting(book, day)`: each period in `periods().past`, oldest first, each place with left above 0, less the moves of its live `pe:` record. Nothing is saved, so a reload, a merge, a restore or an Undo all bring the same question back. It shows on Home's folded line, in the assistant's summary and on Plan's past period. It is a label on money already inside "Bank today", added to no total: slice 2 asserts every other Home figure is the same with and without the card. Known limit, said on the card: until L q7 is built, undecided money is still inside what the bank can spare. Mako's safe to spend is capped by Free to spend, so his headline does not hold it; with no Free to spend set it does.

## 6. Other lives
- **Every two weeks, weekly:** a question at each pay; a monthly line's left is the engine's per-period share. After weeks away many wait; the card counts them ("3 pay periods").
- **No fixed pay:** `periods()` lists no past (periods.js:32); lines start again each month and last month's left drops silently. **M46 stays NOT MET for this life.**
- **A change of pay** (to no fixed pay, or another pay takes over the periods): `past` becomes empty, so every "to decide" line vanishes without a word. **M46 stays NOT MET here too.** The `pe:` ids still name their periods; the engine must keep listing periods gone by. Rides with the no-fixed-pay change.
- **Set up mid-period:** the period holding the opening is in `past` with its opening shares, so the first question is about that part period.
- **Away two periods:** two sets wait, each with its own id and last day (L q8); money spent since is caught by the `canSetAside` cap.
- **Pay late:** no question until the pay is ticked or a period start is written (L q2, q3).

## 7. Slices (test first, one commit each, check3 quick after each, full before merge)
0. **The sync check judges kept places only** (engine, qc-foundation first). Failing rule case: Food's ¥9,000 to Trip or to Waiting raises no `shares` question. Files: engine/sync.js, its test.
1. **What waits.** New `src/endperiod3.js` (`EP3.waiting`), no screen. Failing `tests/endperiod3.test.js`: Mako's shape gives Food ¥9,000 and Free ¥12,000; a `pe:` for Food leaves only Free; a late spend takes left below what was given (clamped at 0); mid-period setup; two periods; no fixed pay gives none; nine record orders. Files: the two new ones, build3.sh, check3.sh.
2. **The Home card and Plan's rows.** Failing `tests/e3_endperiod.js` (real page, through 10 Dec): card shows ¥9,000; Trip gives Trip ¥9,000, spare ¥268,000, safe to spend still ¥60,000; an answer above the left is refused; Undo brings the card back; Take back on a later day too; Decide later survives a reload; the pay re-dated after an answer leaves the period where it was. Files: endperiod3.js, **home3.js** (one hook; lane/homefix first), **plan3.js** (controls slice 4's lane first), controls3.js row (controls slice 1 first), FEATURES.json.
3. **The assistant asks it.** Action `end_period { period, place, to }` and a summary line. Failing test with the fake model: "trip" writes the same record, Undo on the chat card. Files: chat3_core.js, answers3 (lane/ai-core and lane/ai-panel first, then controls slice 1). Needs the site's AI switch on (it is, RESUME 11:55). Slices 2 and 3 reach Mako together; M24 is not marked MET before slice 3.
4. **The walk.** Mako's month in `tests/e3_walk.js` crosses a pay day, a re-dated pay and an undone tick, with hand-worked figures.
**Later, each with qc-foundation first:** L q6 in the engine, then "add it to the same line"; L q7 hold; periods gone by kept across a change of pay and for no fixed pay; covering an overspent line (L q4; until then it is shown as a fact); a statement found later (P5: today Trip keeps the money and the bank's spare pays, with no word); splitting one leftover; goals kept in their own account (a transfer beside a `pe:` counts twice, lookahead.js:852 to 862); two devices' answers adding up to more than was left (P3).

## 8. For the coordinator to bring to Mako (causes, with a recommendation)
1. **Money left in a line stays in the bank and is named nowhere after pay day.** Recommended: always ask, one line at a time, never pick for him; "Leave it in my bank" first. Nobody has checked that people paid weekly will answer line by line; watch it on his run.
2. **He logs weekly and nearly all spending is on cards, so on pay day "left" can be too high.** Recommended: ask anyway, say when the cards were last checked, offer "Check your bank first" (this loosens the team's rule that the question starts with a check-in).
3. **"Add it to Food this time" is not in the first version,** because the engine cannot carry a line's money yet without risking a wrong amount. Recommended: ship bank, goal and Decide later now; carrying comes next.
4. **Until he decides, the money is still inside what his bank can spare** (the team's rule L q7 says hold it out of safe to spend). His own headline is capped by Free to spend, so it does not show there. Recommended: leave as is for the first version and say it on the card.

## qc-foundation verdict (24 Nov 2026, Fable, on draft 3ecd19d): FAIL, fixed above
Run as a one-off reviewer session (session_01BFpKEXiE7cLQ9zBkCk7HkG), because this helper has no Agent tool. Not reviewed again after the fixes.
- **F1** a line's answer raises a sync question that cannot be cleared (sync.js:481, 489 to 495). Fixed: slice 0.
- **F2** "add it to the same line" through `once` is unsound (wrong amount when pay is not monthly, counted twice on two devices, a migration later). Fixed: taken out, moved to later with L q6.
- **F3** undecided money drops out at a change of pay. Fixed: named in section 6, M46 stays NOT MET there.
- **Grid:** 6 covered, 2 not applicable, 4 empty (change and take back an answer on a later day). Fixed: Plan's rows, slice 2.
- **Also taken:** the date only from `past[i].end`; clamp at zero; test EP3's own refusal; the re-dated pay and undone tick cases; L q1 and L q7 brought to Mako; the AI switch named.
- **Found sound:** slices 1 to 3 on the saved shape, Decide later worked out (reload, two devices, restore, Undo), the built id and its revival, `canSetAside` as the cap, the way in.
