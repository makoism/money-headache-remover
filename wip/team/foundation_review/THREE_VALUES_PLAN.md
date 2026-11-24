# Three values for Home's two figures: a plan for the engine's answer

LANE B, 24 Nov 2026. One page, for qc-foundation before any engine line changes. Branch lane/twofig-engine, on top of lane/cardgap. Asked for by MAIN 16 after qc-foundation failed TWO_FIGURES_PLAN (F1: "the two figures are not in the engine's answer, and A means two different things").

## Mako's lines it serves
M7 "see at a glance where all the money is and what is safe to spend". M12 "I would stop using it if it didn't give me clarity." M36 "the picture adds up". M51 "one meaning per word". Not settled 8: "one headline was doing two jobs. Built as two named figures on Home whenever they differ: everyday money left until pay, and what the bank can spare beyond the plan." The way in (M1, M5): the assistant and the screens read the same three values, so neither works them out its own way (lesson 2).

## What is wrong today
The screens need three figures. Today they exist only as parts of a worded sum (`safeToSpend.whyParts[0].amount`, present only when capped, cut to zero when over, lookahead.js:1296 to 1300) or only in some lives (`period.free.left`, missing with no fixed pay, lookahead.js:1046). And "what the accounts can spare" means two things: with a pay period the walk takes plan lines off and everyday money only caps (lookahead.js:1102 to 1109, 1280 to 1283); with no fixed pay the walk has already taken everyday money off day by day to the horizon (1110 to 1126). Kai (no fixed pay, bank 420,000, rent 85,000, everyday 60,000 a month, set up 1 Dec): headline 60,000, whyParts[0] 137,578; a screen that printed "the other 77,578 is not planned" would take December's everyday money off twice.

## The three values (worked out once, in lookahead.js, the same meaning in every life)
All in the home currency, whole minor units, from the engine's own walk. `until` is the day everyday money runs to: the day before the next counted pay lands (safeToSpend.until's rule) or, with no fixed pay, the last day of this calendar month (BQ3).
1. `res.canSpare = { amount, until }`: what the spend-from accounts can spare after everything due, goals kept in them, plan lines, the minimum, and the everyday money of the days AFTER `until` that the walk already holds. It is NOT reduced by everyday money up to `until`. Signed: below zero when short. With a pay period this is today's `raw` (lookahead.js:1281), unchanged. With no fixed pay it is the same walk with the Free to spend by-day items dated on or before `until` left out.
2. `res.everyday = { amount, spent, left, until, untilKind: 'pay' | 'month' }`: the everyday amount that counts for this stretch (its part for the days left when the person started partway, `counts`), what was spent of it (logged spending, gaps by their parts, refunds back), and what is left, signed (below zero when over). `null` when no everyday amount is set. An everyday amount of 0 is an amount: `{ amount: 0, spent, left }`, never null.
3. `res.noJob = { amount }`: `canSpare.amount` less `everyday.left` where that is above zero, never below zero. So when nothing is short and everyday is not over: canSpare = everyday.left + noJob, to the yen. When there is no everyday amount: noJob = max(0, canSpare).
`safeToSpend` keeps every field it has (headline, cappedByFreeToSpend, why, whyParts, short). A test ties them: headline = max(0, min(canSpare.amount, everyday.left)) when everyday is set, else max(0, canSpare.amount). No saved-shape change; nothing is stored.

## Kai, by hand (made-up yen)
Set up 1 Dec, seen 1 Dec, horizon 27 Jan. Rent leaves in December and in January: 170,000. Everyday by day in January up to the 27th is held by the walk (about 52,400; the test works it to the yen from the by-day rule at lookahead.js:1120 to 1122). canSpare = 420,000 - 170,000 - January's held everyday, about 197,600. everyday = { amount 60,000, spent 0, left 60,000, until 31 Dec, 'month' }. noJob = canSpare - 60,000, about 137,600. December's everyday money is counted once.

## Lives the tests cross (each hand-worked, real-looking ids, through buildBook and the check-in writer)
Mako's shape mid period after spending; set up one day before pay (the 1,818 against 182,400 case of Not settled 8); pay day with the pay ticked and not ticked; a pay three weeks late (not counted: `until` is today's rule for safeToSpend.until); paid every two weeks; Kai; no fixed pay set up mid month (everyday's share by days); everyday amount 0; no everyday amount; everyday over (left below zero); short (canSpare below zero, noJob 0); two spend-from accounts with the everyday line in one; a second currency account (left out, as today); the same in nine record orders.

## Slices (test first, one commit each)
1. engine/test/three_values.test.js, red.
2. The walk takes an option to leave out the everyday by-day items up to `until` (one filter where planItems are listed, lookahead.js:1100); the three values are set beside safeToSpend; green; the 779 asks and the checker unchanged.
3. screens/names.js paths for the three values are MAIN 16's (its lane holds names.js); this plan only fixes the field names above.

## Not in this plan
What the screens call the figures and which is the headline (Mako's, at his run). Holding undecided end-of-period money out of noJob (end-of-period plan). Any change to how the horizon is chosen.
