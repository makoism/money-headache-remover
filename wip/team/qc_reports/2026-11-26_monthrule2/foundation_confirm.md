FAIL

qc-foundation, confirming run on lane/monthrule at 43b699c1 (changes c2c2d543, 660ee131, a19cc32e), 26 Nov 2026. Earlier report: foundation.md (FAIL at ba60df02). The built page carries all three changes. Lines not walked again keep their marks from foundation.md.

## F1 (CA10): GONE
- Kai, Free to spend 60,000 set 18 Dec after 50,000 of spends: 27,096 left, headline 27,096. With a 5,000 spend on 18 Dec itself: 22,096 left. On 5 Jan: 60,000 in full.
- Food 31,000 added 18 Dec, receipts on 5 Dec (10,000) and 18 Dec (3,000): counts 14,000, spent 3,000, left 11,000. The 5 Dec receipt stays out; the one on the day added counts.
- Undo of the Free to spend entry: month.free is null, headline back to the bank. Undo of the Food line: no lines, headline 500,000 again.
- Paid on a fixed day: unchanged. Old engine (ba60df02) against new, monthly, every two weeks and twice a month, 40 days each from 1 Nov to 28 Feb: 120 results identical apart from the new `month: null`.
- Tests pass: month_added 18, month_rule_lines 5, month_rule 7, month_change 10.

## F2: NOT GONE (lines fixed, Free to spend not)
- Lines are fixed: the assistant's list and summary read res.month (lookahead.js:1121 to 1128). Kai sees "L1 | Food | 14,000 (part of 31,000 a month, for the days left) | 14,000 left". The change cards say "each month".
- Free to spend is not fixed. ask3_core.js:74 reads only `p.free`. Kai's assistant is sent "Free to spend: not set yet." on 18 Dec, two lines under "held back: Free to spend has only 27,096 left" (run through chat3_core figures). It will tell him he has not set the amount that sets his headline. The before and after rows for a spend or a Free to spend change also read only r.period (ask3_core.js:195, chat3_core.js:647), so no-fixed-pay cards never show "Free to spend left". Fix for the builder: read `(r.period || r.month).free`. The engine already has the figure, so nothing saved changes. M1, M3, M7: still BROKEN for this life.

## New, next to a19cc32e: two lines called Food
After Food ends and a new Food is added, both can be picked:
- Receipts lists every budget not marked gone, so ended lines are included (receipts3.js:18).
- The assistant's lines come from the engine, which keeps the ended line at 0 (lookahead.js:1093). Run: "Food 0, 8,000 over" and "Food 20,000".
- The write door accepts a spend filed to an ended line (act3.js:73).

A receipt filed to the old Food comes off nothing, while the new Food still shows its full amount left: a confident wrong figure (M7, M51). This affects every life, fixed pay included. Fix for the builder: the Receipts picker and the assistant's list leave out lines that have ended (or mark them ended), and act3.js refuses a spend dated after a line's `ends`. The saved shape holds this already, with no migration.

## GRID (touched cells only)
- Change or end a line through the assistant, no fixed pay: now covered.
- Add Food again after it ended: now covered on the screens and through the assistant. It opens the duplicate problem above.
- Read Free to spend through the assistant, no fixed pay: EMPTY (ask3_core.js:74).

## OWNER'S WORDS
- M1, M3, M7: still broken (Free to spend).
- M4: met for lines. Broken by the ended-line pick.
- M13: met.
- M14: met.
- M36, M45, M51: met for CA10. M51 is broken by two Foods.
- Other lines: carried over from foundation.md.

## FOUNDATIONAL
None new. Both remaining faults are builder fixes on a base that already holds the figures.
