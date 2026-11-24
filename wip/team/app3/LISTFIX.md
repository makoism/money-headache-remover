# app3: the list, sorted (LISTFIX lane, 24 Nov JST)

Every item in app3/FOR_MAKO.md and app3/SLICE6.md, in one of four kinds:
- **(a) correctness:** a figure that is wrong, or words that can make a person act on a wrong idea of their money.
- **(b) clarity:** the figure is right, but a person cannot tell what it means or why.
- **(c) stuck:** a person cannot finish a job.
- **(d) taste:** wording, layout or feel, or a choice that is Mako's. These stay in FOR_MAKO.md for his run.

Only (a), (b) and (c) are fixed in this lane, in that order, test first, one commit each with a real-page test.
"Out of lane" marks an item that is not app3 page work (the server, the old app, main).

## To fix here, in order

| # | Item (where it came from) | Kind | Why this kind |
|---|---|---|---|
| A1 | Gaps found at Check your bank count as spending but are not listed in Receipts ("spent ¥6,700" above "Nothing logged") (BN notes) | a | Two figures on one screen disagree: the list says nothing was spent while the total says ¥6,700 was. |
| A2 | Plan lines alone need more than the bank can spare, and there is no warning, only "nothing safe to spend" (BN notes) | a | Home says "It turns safe once your pay is in", which is not true when the plan, not the timing, is the cause. A person would wait for pay instead of changing the plan. |
| C1 | A second bank with bills and no pay into it goes below zero, Home warns but does not suggest moving money from the other bank (slice 6 notes, Lia's Bank B) | c | The job is keeping that bank above zero; the warning names the day but not where the money can come from or how much. |
| B1 | The gap toast after Check your bank sometimes leaves out "It counts as spending" (BN notes) | b | When the card question is showing and Save is pressed, the gap is still counted as spending, but the words do not say so. |
| B2 | Right after setup, safe to spend is only the share of Free to spend for the days left; Home does not say why, only Plan does (BN notes) | b | The figure is right (I4, BP2); a person cannot tell why it is small. Whether the first period should count in full stays with Mako (d). |
| B3 | The sum line "- ¥297,576 (more than Free to spend left this period)" is hard to read (BN notes) | b | The step's label does not say what it is: money held back because Free to spend has only so much left. |
| B4 | The bank after the cards: "If everything on the cards now is taken." reads as half a sentence, and it does not say bills are taken off (BN notes; help words, last line) | b | A half sentence; a person cannot tell what is assumed in the figure. |
| B5 | Using a cloud code on a device that already has its own numbers replaces them without asking first (BN notes) | b | Nothing is lost (a whole copy is kept first and Settings asks which copy to keep, engine wholeCopyQuestion), so it is not (a). But the person cannot tell, before pressing, what will happen to the numbers on this device. |
| B6 | Logging a spend on a card can raise safe to spend (the card is paid on pay day, from the next pay) (BN notes) | b | True, but nothing says why safe to spend went up; the toast after logging can say when the card takes it from the bank. |
| B7 | With no fixed pay, "Lasts about N weeks at this rate" counts bills only when there are no budget lines (slice 6 notes) | b | Checked in the build: with no lines and no Free to spend the engine gives no figure, and Home shows no "Lasts" line. Kept here to confirm with a test; fixed only if a case shows the line counting bills only. |
| B8 | A big check-in gap in a past period shows as Free to spend overspent (feel and wording) | b | The overspend is right (the gap is spending, T2), but nothing showed where it came from. A1 lists the gap in that period's Receipts, which answers it. Whether it gets its own plan line is (d). |

## Stays with Mako (d)

| Item | Why it is taste |
|---|---|
| Tab bar at the top | Layout. |
| Undo shows for 8 s; keep it after a reload? | Feel; the old app's 3 days is a product choice. |
| Receipts refuses a day after today; a refund to no line goes back to the account only | Behaviour choices that are each correct. |
| "Add statements" under Home or its own tab | Layout. |
| A card statement's printed close day becomes the card's close day | The printed day is the fact; whether to ask first is feel. |
| Whether a past check-in gap gets its own line (see B8) | Layout; the clarity part is fixed by A1. |
| Goal pace words; Overdue words | Wording. |
| Cloud code look, turn-off words, 90 s between sends, a new build loading by itself | Wording and feel. |
| With the cloud copy on, a restored backup does not remove records added on another device since | Settled behaviour of the join (DECISIONS "Phone and desktop": money joins up on its own); wording on the restore is his. |
| Names left open in screens/names.js | Wording, BB3. |
| Privacy words for statements and Ask | Wording. |
| All five "Draft words from the screen fixes" | Wording. |
| Bill reminders without an amount | A privacy choice. |
| "the burrow" wraps at 320 wide | Layout. |
| Reminder choices not kept between visits | Feel: nothing is lost, the defaults come back. |
| Reminder defaults | Choice. |
| Ask adding bills or goals | Scope. |
| Every help "?" draft | Wording (the half sentence in the last one is B4). |
| "Safe to spend" is capped at Free to spend left once set, and is everything after bills before it is; one name for both | The sum shows the cap as its last step (BJ5) and the help says it, so a person can tell; the name is his (names.js). |
| A goal with a date says "next due 30 Jun", or "By 30 Jun" | Wording. |
| The month-end "keep it or put it toward a goal" question | A feature to add or not. |
| Whether the first period should count in full (B2's other half) | BP2: I4 stays unless Mako chooses otherwise. |
| Setup drafts for pay rhythm, country, more accounts | Wording. |
| I4, a line added in the setup period counts from the setup day | Decided (BP2); his choice to change. |
| The yearly-cost nudge goes away once a goal has the same name | Linking a goal to a bill is a saved-data change; out of scope for version one. |
| A rhythm change proposes each per-pay line as the same money a year | Decided (BP3); the person can change it. |
| Slice 6b: pay changed to and from two days a month and no fixed pay | Decided (BQ1). |
| BQ3: with no fixed pay, Free to spend left starts again each month | Decided. |
| A second income every 1, 2, 3 or 4 weeks | A note of what was built. |
| Pay day in two steps, its words | Wording. |

## Out of lane

| Item | Kind | Where it goes |
|---|---|---|
| Cloud server changes 1 to 5 (listed twice in FOR_MAKO) | 1, 2, 4: a (a copy overwritten or sent back up); 3: a (undo a bad copy); 5: c (sends refused) | The worker, not app3. Approved by Mako (DECISIONS 9); its own lane. |
| Private publish limits 1 to 4 (old sw.js, cache clearing, the old manifest's scope, build_site.sh) | c | Changes to the old app and to main, which wait for Mako. app3 works without them. |
| "Starting with your real numbers" and "Bank comparison" | none | A guide and a note, not findings. |

## SLICE6.md

Every item there was built in slice 6 and 6b, each with its page test in check3 (e3_setup6, e3_moneyin, e3_rhythms,
e3_paychange, e3_payday, e3_life_a to e3_life_d, e3_income2, e3_weeks3). Before the build, each was (c): a person whose
life has that shape could not set up or keep going. Nothing in it is open, except what the slice 6 notes above say.

## Done (lane/listfix, 24 Nov JST), each with its page test in tests/e3_listfix.js

| # | Commit | What changed |
|---|---|---|
| A1 | LISTFIX A1 | Receipts lists each gap found at a check, in the period each part counts in, as a row that is not a button. A held gain is left out. |
| A2 | LISTFIX A2 | Home's status says "Your plan lines need ¥X more than your bank can spare before pay on D", and "Lower a plan line, or move money in" (screens/status.js, state plan_over). |
| C1 | LISTFIX C1 | Under a bank's below-zero warning: "Move ¥X from Main bank to Bank B by D. Main bank can spare it" (screens/status.js moveText), only when another account can spare all of it. |
| B1 | LISTFIX B1 | The Undo bar after a check always says a gap counts as spending. |
| B2 | LISTFIX B2 | Home says "Free to spend counts ¥X of ¥Y this pay period, because you started partway through it", with Plan's "?". |
| B3 | LISTFIX B3 | The cap step reads "(held back: Free to spend has only ¥X left this period)". |
| B4 | LISTFIX B4 | "It counts everything on the cards now, as their close days are not sure" and "Bills due by then are taken off". |
| B5 | LISTFIX B5 | "Use this code" on a device with its own numbers says what happens first; "Not now" changes nothing. |
| B6 | LISTFIX B6 | A spend logged on a card: "It goes on Card A and leaves your bank when the card is paid on D". |
| B7 | none | Checked: with no fixed pay and no plan lines or Free to spend, the engine gives no "Lasts about" figure and Home shows none; with Free to spend set it counts that too, not bills only. Covered by e3_life_c. No fault found. |
| B8 | (A1) | A past period's gap is now a row in that period's Receipts, so the overspend shows where it came from. |

The new words are drafts like every other line, for Mako's copy pass.
