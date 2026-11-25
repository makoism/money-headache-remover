# qc-foundation on lane/cardclose 5b7f2d2: FAIL (narrow), fixed in the next commit

Saved by LANE B from the reviewer's own answer (25 Nov 2026). The reviewer wrote no file and stopped near the 150,000 token limit.

## Verdict
FAIL, narrow: one engine rule in the new card loop needed one more step. No saved-data change, no change for "not sure" cards (Mako's). Everything else was found sound.

## How it was checked
A made-up real world (card and bank moving day by day, statements closing and being paid by the bank) run beside the engine through build_book, checkin and lookahead for 12 months, about 700 opens, on this build and on the engine one commit before it. Fifteen lives: close 15 paid the 10th with flat and uneven spending and weekly opens; away 5, 3 and 10 weeks; close "last" paid the 27th; close 31 paid two months on; close 5 paid the 10th of the same month; two cards with different close days; weekend shift "after"; never ticking card payments; opening every day; refunds; Mako's shape (two "not sure" cards, 10th and 11th); a "not sure" card given a close day months later, three ways. The engine suite was rerun: 28 runs, the 779 asks pass.

## Owner's words
M40 met for weekly use, not met in the finding's case. M41 met: in Mako's shape over 70 opens the card figures and what the bank can spare are identical on the old and new engine. M36 met: after every one of about 700 checks the card owes exactly the figure typed and each gap's period parts add up. M44 met. M11, M30 met. M27, M31, M32, M38 unchanged. M47 and M12 touched by the finding. M1 to M6, M13, M14 silent (engine only). M61, M62 met.

## Foundational
1. A part moved off a paid statement could land on another statement whose payment day had also passed, and showed as a false overdue payment. Card closes the 15th, paid the 10th, 2,000 a day, checks to 12 Dec, back on 20 Feb: the bank really paid 42,000 on 10 Jan and 62,000 on 10 Feb; the app asks only the 10 Jan payment (36,000), she ticks it and types 72,000; the app showed "overdue 10 Feb: 3,086" and what the bank can spare 3,086 too low. With uneven spending the false overdue was 29,343. New with the build (the old engine showed none). Needs: the moved part carries on, close by close, until it reaches a statement not already paid as of the check, or the open cycle. Harsh, not unsafe: the spare figure read too low, never too high.
**FIXED by LANE B in the commit after 5b7f2d2**, test first: both moments are in engine/test/card_gap_statement.test.js (the first reads no overdue and 66,858 due 10 Mar, the reviewer's own figure from its trial fix).

## Watch
1. "Nothing left" on a statement is judged from the whole book, not at the check's moment (only "held" is). No wrong money found: in a late-tick walk the 15 Dec statement read 38,400 unpaid, then 36,000 paid after a 38,400 payment was ticked a week later; what is owed and what can be spared stayed right.
2. The day share is an estimate: with spending heavier in the first week of the month the next payment was off by up to about 18,000 on 160,000 after a three-week gap, both ways; on average 1,500 to 7,500 off, where the old engine averaged 11,000 to 56,000 and was almost always too kind. Import of a real statement amount corrects it.
3. A close day set on a later day cuts every past gap again at the new closes. Sound in three lives; no test in the suite does it. Add one before import ships.
4. A "not sure" card's first payment day (unchanged by this build): a card set up with spending but nothing really due yet shows "all owed" as overdue from its first payment day until something is ticked. Worth a look at Mako's run: his cards are this shape.
5. The check-in has no answer for "the statement was a credit, nothing was taken".

## Sound
With flat spending and weekly checks the next payment is exact at every open (42 of 42; the old engine was too kind at 38 of 42 by up to 10,000). The card owes the figure typed after every check in every life. Close "last" and 31 in short months, a payment five days after the close, two months after the close, two cards: no false overdue, no drift. Never ticking with the bank typed: overdue shows as it should, nothing counted twice. No server setting.

## Not reached
The built page and the walks. Statement import. Two devices. A second currency. Japanese holidays and amounts under a weekend shift. A minus gap larger than the open cycle on a card with a rate. Card instalment plans across a close. Bills paid by card. The other engine changes merged into this branch since 94af457.
