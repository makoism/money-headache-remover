(Saved by LANE C from the reviewer's reply: qc-foundation on foundation_review/MONTHRULE_PLAN.md, lane/monthrule 8e7c286, 25 Nov 2026 about 17:00 JST. Shortened only in layout.)

VERDICT: FAIL, narrowly. The two-line rule itself is sound and nothing saved changes. It fails because the promise "typed X a month is charged exactly X in every calendar month" is still false in two real moments, both in the same branch the plan edits.

## Blockers

1. A changed amount is not charged in the months after the change.
- Life: no fixed pay, 40,000 a month since 1 Nov, changed to 60,000 on 16 Dec. Seen 31 Dec, the walk holds 59,992 for the next 45 days, all at 1,290 a day (40,000's rate). Under the new rule it should hold January 60,000 plus 14 February days at 2,142, which is 89,988. "Can spare" is 29,996 too high and drops by that much overnight on 1 Jan.
- Cause: plannedFor uses l.amount for every later day (engine/lookahead.js:1188), the amount in force on the first day of this month (line 1074). A step dated next month is ignored the same way.
- Needed: read the amount per month, stepAmount(l.src.steps, first day of d's month), plus a failing test for a change.
- Needs a ruling: December's own figure stays 40,000 until 1 Jan, while the write door says "a change counts from today" (app3/src/plan3_write.js:55). Which amount is December's?

2. This month's days for plan lines other than everyday money are charged on top of what was spent.
- Life: Food line 30,000 a month, no fixed pay, all 30,000 spent on 5 Dec. The walk still holds 26 x 967 + 23 = 25,165 for Food for 6 to 31 Dec, so December costs 55,165 against 30,000 typed. The other way: nothing spent by 30 Dec, and only 990 is held while 30,000 is still planned.
- THREE_VALUES fixed this for everyday money only (line 1180). Lines still come off by the day from tomorrow, whatever was spent; app3/tests/e3_life_d.js:26 hand-works it that way.
- It exists today and the plan does not make it worse, but the plan reworks e3_life_d and three_values by hand, which would be reworked again when this is fixed.
- Needed: hold max(0, left) for this month's lines, as the pay path does at line 1207, or say in words that the rule covers later months only and list this for a ruling.
- Related: res.period is null with no fixed pay (line 1106), so a line's own month figure (BQ3) is not in the answer for any screen or the assistant.

## Smaller notes
- I4 start month: set up 15 Dec at 40,000, the month's share is 21,935 (line 1004); the days 15 to 31 under the new rule add to 21,940. Never more than the month's days less one minor unit apart. Record it in CA4. If blocker 2 is fixed, use one of the two rules, not both.
- Small amounts: 20 a month gives nothing for 30 days and 20 on the last day; the month adds up.
- Leap year: February 2028 is 28 x 1,379 + 1,388 = 40,000. yearDays becomes unused in the monthly branch.
- Time zones: whole day numbers, no clock. Weekly: unchanged, and the app never writes a weekly line. Record order: reload_order passes 38 of 38 on the patched copy.
- Other places: periods.js, schedules.js, move.js, checkin.js hold no day rate. lastsAboutWeeks (line 1374) uses the same branch.
- Checker: checker/life_gen.js:123 never makes a no-fixed-pay life: by-day lives have no independent check; say so plainly.
- Frozen reference: foundation_review/ref/lookahead_ref.js:1275 to 1291 keeps the old rate. Say the reference is left alone and where the difference is listed.
- Wording to update: BQ3 cites M10; comments at lines 1141 and 1172 state the old rate.
- The plan's list matches the reviewer's run: month_rule 3 of 3; ten Kai cases, the Los Angeles and Tokyo case, nfd-01 (254,136 becomes 252,000) fail as listed. periods.test.js slice 6b and e3_life_d not seen.
- Test gaps: add a plan line, a mid-month change, a 20 yen amount, and put month_rule in run_all.

## Owner's words
M36, M51, M12: served for later whole months; not met in the two moments above. M31, M38: untouched. M61: met. M13: changing an amount later is the empty cell (blocker 1).

## Grid
Everyday amount and plan line, by add, change, end, undo, later day, screen and assistant. 12 cells covered, 2 empty: the change of each kind on a later day (blocker 1).
