FAIL

qc-foundation, third confirming run on lane/monthrule at 65ebce8b (changes fb29f4ed, 07c0fd9e, ac1e60ca, d416b354, 957e9cc6, d062a8a9), 26 Nov 2026. Earlier: foundation.md, foundation_confirm.md, foundation_confirm2.md (all FAIL). Walks run in node through the engine and the app's modules; line_closes, ask3_core, chat3_core and e3_act_unit pass at this tip. Lines not walked again keep their earlier marks.

## foundation_confirm2's NEW finding (Mako, paid on the 10th, ends Food on 22 Nov): GONE
- One rule now lives in the engine: each period or month line carries `closes`, read through `lineTakes` and `lineLastDay` (engine/lookahead.js:1114 to 1124, 1560 to 1562). Receipts' picker (receipts3.js:24), the assistant's lines and refs (ask3_core.js:71, chat3_core.js:498), the write door (act3.js:81 to 86) and Plan (plan3.js:32) all read it.
- 25 Nov: old Food counts 26,666, left 26,666, closes 10 Dec. A 5,000 receipt dated 25 Nov is kept by the door and by the assistant and leaves 21,666. Dated 10 Dec it is refused: "Food ended on 22 Nov 2026 and takes spends dated up to 9 Dec 2026. Pick another line".
- Words agree in all three places: Plan "26,666 left until 10 Dec, then it ends", picker "Food (ended, until 10 Dec)", assistant row "Food (ended) | 40,000 each pay | 26,666 left until 10 Dec, then it ends" (screens/status.js:299, one source).
- After the 10 Dec pay is ticked, the old Food holds 0 and closes stays 10 Dec. Two periods on, it is still listed, so `lineTakes` never falls back to "open" for a long-ended line.

## Kai (no fixed pay): unchanged and sound
Food ended 22 Dec closes 23 Dec; still listed with closes 23 Dec in January and March, so it stays refused. Home's reason line reads "this month" when there is no period (home3.js, `per = r.period ? 'this period' : 'this month'`). M51 MET for Kai.

## The builder's late-pay note: acceptable, with a words fix (WATCH, not FOUNDATIONAL)
Walk: pay not ticked. On 12 Dec and still on 30 Dec the period runs 10 Nov to today, the old Food still holds 26,666 left, and it takes nothing dated from 10 Dec. Closing on the pay's due day matches real life (the pay almost always did land), and the moment he ticks the pay the period turns and the 26,666 stops being held. If he ticks it dated 13 Dec the line closes 13 Dec, also true. But during the window two things read badly:
- Plan says "26,666 left until 10 Dec, then it ends" with 10 Dec already past, and the assistant is not given the line while its 26,666 is still held back from the headline (M3, M7).
- Fix for the builder, screens only: when `closes` is on or before today, say "Closed on 10 Dec. What is left comes back when your pay is in" on Plan and to the assistant. No engine change.

## FOUNDATIONAL (small, in the engine): ending a line on the first day of a pay period
Who: Mako, the most natural day to change his plan, his pay day. On 10 Dec he ticks his pay, then ends Food on Plan or by voice. (Same if he ends it on 10 Dec before ticking, then ticks.)

What the base holds: `endLine` writes a step to 0 from today and `ends: today` (plan3_write.js:80). The new period starts 10 Dec, so the engine counts 0 for Food in it. But `closesOf` (lookahead.js:1120 to 1124) sees `e >= n.start` and closes the line on the next pay, 8 Jan. Run on 20 Dec with a 5,000 receipt filed to it: counts 0, left -5,000, over 5,000, closes 8 Jan, lineTakes true. Ending on 11 Dec instead gives counts 40,000, left 35,000: the one-day difference flips the line from "holds a full period" to "holds nothing but stays open a full period".

The real-life moment: from 10 Dec to 8 Jan Plan shows "Food (ended)" with "0 left until 8 Jan, then it ends", the picker offers "Food (ended, until 8 Jan)", the assistant gets it with a ref, and every receipt filed there reads as overspent and is taken from safe to spend. The headline total stays right, but the line says he overspent a line he closed, and the rule "an ended line stays open to the end of the period it ended in" is false here: it ended before this period began. M51 broken (one rule, two meanings again), M7 and M12 (clarity) weakened, on the owner's own pay day (M31).

Why it is in the base: `closes` is the engine's own figure that every screen, the assistant and the door now read. A screen cannot correct it.

What the base needs: a line closes on the first period start on or after its end day. In closesOf, `e >= n.start` becomes `e > n.start` and `allStartDays.filter(d => d > e)` becomes `d >= e`, so a line ended on a start day closes that day (it takes nothing in a period where it holds nothing). The door then refuses a receipt dated 10 Dec with "Food ended on 10 Dec 2026. Pick another line", which matches the money. One engine test: Mako ticks the 10 Dec pay, ends Food the same day, a receipt dated 10 Dec is refused and the picker and assistant drop the line. Also check the same rule when the late pay is ticked with a date after the end day. Cost now: a two-character change plus a test. Later: every fixed-pay person who tidies their plan on pay day meets an ended line that collects false overspends.

Note: plan3_write.js:42 and :239 still use `ends <= today`; right for name reuse, but mark it as not the "takes a spend" rule.

## GRID (touched cells only)
Kind: a budget line, fixed pay and no fixed pay, by screens and by the assistant, on a later day: change, end, add again after it ended, file a spend to it while it still holds money, refuse after it closes, undo each.
Count: 13 covered, 0 empty, 0 not applicable. The two cells empty in confirm2 (fixed pay, file a spend to an ended line still open, by screen and by assistant) are now covered. The pay-day case above is not an empty cell: the cell is filled with a wrong answer from the engine.

## OWNER'S WORDS
- M1, M3, M4: MET for both lives (the assistant sees and files to the old Food while it holds money). Weakened in the late-pay window (the line is held but not given to the assistant): words fix above.
- M5: MET (Plan shows what the old line holds and until when).
- M7: MET, except the pay-day end (a 0 line that collects overspends) and the past date in the late window.
- M12: weakened by the pay-day case.
- M13, M14: MET (end, add again, Undo of the end restores the line with no `ends`, all readers follow).
- M27, M28, M31, M38: MET for an end mid-period; the pay-day end is the broken case.
- M45: MET (a receipt counts once, on one line). M46: watch, below.
- M51: MET for mid-period ends and for Kai ("this month"); BROKEN for an end on a period's first day.
- M61, M69: MET (refusals change nothing; book unchanged on every refused write in the tests).
- Others: carried over from foundation.md.

## WATCH
- M46: the old Food's 26,666 left at the end of the period it ended in. When the period turns it must go where unspent planned money goes (or "Decide later"), visibly. "End it now and free what is left" is set for Mako's run; when it comes, it is an engine change to the counting rule, and `closes` must move with it.
- Late receipt dated before a line began (from confirm2): the door still takes it and it comes off nothing. Unchanged; matters for the three-weeks-away life and for statement import.
- Kai's ended Food shows "over" for spends filed before the end in a month where it holds 0. Unchanged; will read as a false overspend once the ledger shows history.
- Statement import and the cloud copy: imported spends dated inside a closed line's window will need the same `lineTakes` check at the door. They go through act3, so they will, as long as import never writes around the door.

## Checked and sound
- One engine rule, read in five places, with tests in the engine and in each reader.
- Door wording comes from `lineLastDay`, so it cannot drift from the picker.
- A receipt already filed to a closed line can still be opened and changed; moving its date past the close is refused with nothing saved.
- No saved-data change in this round; the shape (`ends`, `steps`) holds everything the fix needs.
