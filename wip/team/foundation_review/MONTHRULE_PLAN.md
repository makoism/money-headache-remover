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
