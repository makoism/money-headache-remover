# The month rule: an amount typed a month is charged exactly that in every calendar month

LANE B, 25 Nov 2026. Half a page, for qc-foundation before the engine line changes. Branch lane/monthrule, on top of lane/cardclose. Ruled by the coordinator on 25 Nov after qc-numbers; it replaces the day rate of M9 and M10 in DECISIONS_ROUND2 (a monthly amount x 12 / the year's days a day).

## Mako's lines
M36 "the picture adds up". M51 "one meaning per word". M12 "I would stop using it if it didn't give me clarity." His own shape has a pay period and is not touched: this rule is only for a plan that runs by the day (no fixed pay).

## The fault
With no fixed pay each plan line and the everyday money come off the look-ahead by the day (engine/lookahead.js, plannedFor, the by-day branch). The day rate is floor(amount x 12 / 365), and the month's last day carries "the rest of the month's own share", which is amount x 12 x the month's days / 365. So 40,000 typed a month is charged 40,767 in a 31 day month, 39,452 in a 30 day month and 36,821 in February. A person who typed 40,000 cannot find that figure anywhere. (The month's own figure, what is left of the 40,000 this month, already starts from exactly 40,000: BQ3. Only the look-ahead's later days use the day rate.)

## The rule
For a monthly amount that comes off by the day: each day of a calendar month costs floor(amount / that month's days), and the month's last day carries the rest (amount less the other days). Every calendar month adds up to exactly the amount typed, in a leap year too. A weekly amount is unchanged (a seventh a day, the rest on the seventh day). The share of a month a person starts partway through is unchanged (I4: amount x days left / the month's days, rounded down). Nothing saved changes.

## The failing test (committed first)
engine/test/month_rule.test.js: no fixed pay, 40,000 a month. Every calendar month from Dec 2026 to Nov 2027 and the 29 day February of 2028 adds up to 40,000 (today December is 40,767). December is 1,290 a day and 1,300 on the 31st. 100,001 a month is 100,001 in a 30 and in a 31 day month.

## What else moves (found by a trial run, then reverted; each is reworked by hand in its own comments, never by adjusting an input)
- One of the 779 asks: nfd-01, 15 Jan 2027, safe to spend 254,136 becomes 252,000. The frozen reference and the scenario's expected figure carry the old day rate: the scenario's hand-working is redone under the new rule and the difference is listed in this plan's review section.
- engine/test/three_values.test.js: the ten Kai cases (January held is 27 x floor(60,000 / 31) = 27 x 1,935 = 52,245, was 53,244, and so on), each redone by hand.
- engine/test/periods.test.js slice 6b and engine/test/platform.test.js (the Los Angeles and Tokyo case): the by-day figures redone.
- app3/tests/e3_life_d.js: its by-day working (1,315 and 3,287 a day) redone.
- The independent checker (wip/team/checker) if it produces by-day lives: run, and each difference listed.

## Slices
1. The rule in the one place (two lines). 2. Each test above reworked by hand, one commit a file, the engine suite green between. 3. DECISIONS_ROUND2: CA4, with the note on M9 and M10. 4. check3 full, then one fresh qc-numbers and one qc-foundation on the build, one at a time.

## Not in this plan
How Home prints the by-day terms (grouped one a month: the main build session's two-figures work). The 45 days the look-ahead runs with no income counted (Mako's to feel at his run, Not settled 8).

## After qc-foundation's review of this plan (25 Nov, LANE C; report in qc_reports/2026-11-25_monthrule/foundation_plan.md)
FAIL, narrowly: the rule is sound, nothing saved changes, two holes in the same few lines.
1. **A later month takes the amount in force on its first day** (built, in the rule's own commit; tests in month_rule.test.js). Before, every later day used the amount this month began with, so 40,000 changed to 60,000 on 16 Dec still held January at 40,000. The month a change is made in keeps the amount it began with until the 1st (BQ3, unchanged); the Plan screen says "a change counts from today", which is true for a pay period and not for this life: listed for Mako's run with the 45 day question, not opened here.
2. **This month's days for a plan line other than the everyday money** come off by the day whatever was spent (Food 30,000, all spent by 5 Dec, still charged 25,165 more for December). Proposed to the coordinator: this month the walk holds what is left of the line, never below zero, as a pay period does and as THREE_VALUES did for the everyday money; later months by the day. The failing test is engine/test/month_rule_lines.test.js (hand-worked, not in run_all). **Waits for the coordinator's yes.** nfd-01 and app3/tests/e3_life_d.js have a Food line and are reworked once, after the answer. Done already, no plan line in them: the ten Kai cases, periods slice 6b.
Also from the review, to do in this branch: say in CA4 that the start month's share (I4, amount x days left / the month's days) and the by-day rule can differ by less than the month's days in yen and are never shown side by side; the frozen reference (foundation_review/ref/lookahead_ref.js) keeps the old day rate and is left alone, the one ask it differs on (nfd-01) is named in CA4; the independent checker never makes a life with no fixed pay, so by-day lives have no independent check (said plainly, a watch item); BQ3's mention of M10 is updated.

## The month a change is made in (CA6; coordinator, 25 Nov: "the screen and the engine must say the same thing"). For qc-foundation before the engine line changes
**Lines served:** M36, M51 (one meaning), M13 (change every kind of thing, after setup too), M12.
**The fault.** With no fixed pay the Plan screen says a change to a monthly amount "counts from today" and saves it dated today. The engine reads this month's amount as the one in force on the month's first day (BQ3; lookahead.js amountOf, the by-day branch: periodAmount(src, countFrom(...))), so the new amount does nothing until the 1st. A person who raises everyday money from 40,000 to 60,000 on 16 Dec still sees 40,000 for December.
**The rule proposed (the simplest that makes the words true).** This month's amount is the one in force today, less everything spent on it this month. Raised to 60,000 on 16 Dec with 25,000 spent: 35,000 left (was 15,000). Lowered to 20,000 with 25,000 spent: 5,000 over, headline 0. It is the same shape as a pay period, where a change "from now" counts from the period's first day. One line: the by-day branch of amountOf reads stepAmount at today in place of the month's first day. The start month's share by days left (I4) is unchanged and is taken from the amount in force today. Later months already take the amount in force on their first day (CA4). Nothing saved changes.
**Not chosen:** sharing the month by days between the old and the new amount (old for the days gone, new for the days left). It is closer to "from today" in arithmetic, but gives a figure nobody typed and nobody can find, the fault the month rule itself removes.
**The failing test (committed, not in run_all):** engine/test/month_change.test.js, four hand-worked cases: raised, lowered, a plan line raised (can spare 1,872,770), and a change in the month of setup.
**What else may move:** any test that changes a monthly amount mid-month with no fixed pay (a trial run will list them; each reworked by hand). The pay-period path is untouched.
