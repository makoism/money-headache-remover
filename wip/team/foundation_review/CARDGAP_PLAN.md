# Card gap plan: a card's unlogged spending belongs to the days it covers

LANE B, 24 Nov 2026, branch lane/cardgap. One page. For qc-foundation before any engine line changes.

## Mako's lines it serves
- M11 "He logs weekly. Play money is not tracked in detail." M30 "Almost all spending goes on the cards, so the bank alone is not the truth."
- M36 "The picture adds up to what is really in the accounts." M38 "Periods run pay to pay." M44 "worked out from real transaction dates." M45 "No coin is counted twice."
- M77 "A fact about his money becomes a failing test the same day." Touches Not settled 8 (the everyday figure on Home) and M24, M46 (the end-of-period question reads the same figures).

## The fault (found by qc-foundation on the end-of-period plan)
At Check your bank a person types what is on a card. What the card shows above what was logged is a gap, counted as spending on Free to spend. The engine dates the whole gap on the day of the check (engine/lookahead.js:610) and counts it in a pay period by that one day (lookahead.js:979). A bank's gap is cut by days at each period start (makeFiller, lookahead.js:476 to 487, read at 974 to 976). DECISIONS_ROUND2 A4, T2 and period-end q1 say a gap's stretch is split by days at the pay, and nothing excepts cards.

For Mako: pay lands on the 10th, he checks on the 13th. Every yen spent on his cards since his last card check lands in the new period. The period just ended looks better than it was, and the new period's everyday figure is too low from its first check.

## The failing test (committed first, 50a03d8)
engine/test/card_gap_period.test.js, made-up yen: card checked 6 Dec (30,000 not logged) and 13 Dec (21,000 not logged over 7 to 13 Dec), pay on the 10th. By days: 9,000 belongs to the period ending 9 Dec and 12,000 to the new one. Today the engine gives 30,000 and 21,000; right is 39,000 and 12,000. Six cases, with five record orders. Before the fix lands it grows to: two cards paid on the 10th and 11th (his shape), a card payment ticked between the two checks, a statement check in the same check-in, a check on the pay day itself, a first check after setup, two periods crossed in one stretch, a gap below zero (less on the card than logged), and nine record orders.

## The fix (engine only, one function and its two readers)
1. **A card gap carries its stretch.** Each card filler gains `from`, `to` and `parts`, made by the same makeFiller the bank uses (so the same rounding, the same cut at every period start, the same `mostlyBeforePay` answer). The stretch runs from the day after that card's check before this one (its opening check at the earliest) to this check's day. The check before is found by day, never by the order records arrive in. A check on the same day as the one before has a stretch of that one day.
2. **A statement check written with a card check** (setup, build_book.js:103, and statement import, stmt3_plan.js:247 to 248; Check your bank never writes one) is its own part. A stretch never starts after it ends: a statement part whose close day is on or before the check before it is one day, the close day; an empty rest has no part; no part is dated after its check or has zero days. The loop over a card's checks runs in the bank's order (byTime, lookahead.js:434), never in the order records were told, so a check imported or dated earlier gives the right stretch around the right amount.
2b. **makeFiller cuts at every day a reader counts from, not only period starts** (qc-foundation F1, the shared piece, for banks and cards): calendar month starts while the plan runs by the day (no fixed pay), and the day of a change to no fixed pay (noneSince, lookahead.js:379). Today, with no fixed pay, a BANK gap that crosses the 1st counts nowhere: 14,000 over 29 Nov to 5 Dec leaves Free to spend reading 60,000 where 50,000 is right (5 of 7 days, 10,000, in December). Routing cards through makeFiller as it is would lose their gaps the same way, in the unsafe direction.
3. **Readers.** lookahead.js:979 sums a card's `parts` by each part's first day, exactly as line 975 does for a bank. app3/src/receipts3.js:307 lists a card gap by its parts, as line 305 does for a bank, so the Receipts list and the spent figure still agree (LISTFIX A1).
4. **Unchanged on purpose:** the filler keeps `day`, `amount`, `more`, `less` (Check your bank's words read them, checkin3.js:100 to 104). What the card owes, its statements and the day each payment falls due still put the gap on the check's day (lookahead.js:607): which statement a gap falls on is a separate question and no figure of safe to spend moves in this change. No field of safeToSpend is renamed or reshaped.

## Saved data
No saved-shape change and nothing to move. A gap is never saved: it is worked out from the checks every time the book is read (A3, engine/ledger.js:5). So gaps "already saved without a stretch" do not exist. The same book simply reads differently after the fix: past periods' spent on Free to spend goes up where a card check crossed a pay day and the period after goes down by the same amount. The sum over periods is the same to the yen for pay-to-pay lives; by-day lives keep the sum over months (and gain back the bank gaps lost today).

## What a person sees change
Home's everyday figure in the first days of a period (higher, as it should be). Past periods on Receipts: a card gap that crossed a pay day shows as two rows, one in each period. Nothing else.

## Real lives beyond Mako
Paid every two weeks or weekly: a stretch can cross two or three period starts; makeFiller already cuts at each. No fixed pay: cut at each month start (2b), so a gap across the 1st is split by days and nothing is lost. Set up mid-period: the first stretch starts the day after the opening check. Away three weeks: one long stretch cut at each pay. A card in another currency: marked apart as today, parts and all. Two devices, reload, restore, Undo of a check: nothing saved, so the parts follow the checks that exist.

## Slices (test first, one commit each)
1. The grown engine test above (red).
2. makeFiller for card gaps and the reader at line 979 (green). engine/test/run_all, the checker and the reference comparison stay green, or each difference is listed and explained here.
3. receipts3.js:307 and a page test: a card check after a pay day shows two gap rows and the spent figures match.
4. A step in the real-page walk (tests/e3_walk.js): a card check that crosses a pay day, hand-worked.
Then check3 full, a fresh qc-numbers and qc-foundation on the branch.

## The grown test must also cover (qc-foundation, 24 Nov)
No fixed pay, card gap and bank gap across the 1st (4,000 and 10,000 by hand); a change to no fixed pay mid stretch; a statement import after two card checks with its close day between them; an import whose close day is on or before the check before it, and one closing the day before pay day; a card check dated earlier than one told before it, the same in nine orders; a card added after setup (first stretch from the day after its open day); two checks of one card on one day from two devices; his card payments on the 10th and 11th left unticked at the 13 Dec check (a large minus gap: what each period shows is asserted, a choice not an accident); parts sum to the gap for odd and minus amounts, in yen and in a cents currency; two-weekly and away three weeks (three parts); Receipts rows equal the spent figure for each period and for a by-day month.

## Review
qc-foundation, 24 Nov, on 50a03d8: FAIL, narrow (the no-fixed-pay claim was false; the statement wording loose). "Amend the plan and the test list, then build." Amended above as 2, 2b and the test list. Sound for Mako's shape, no saved-shape change. Its watch list, for later and not built here: the end-of-period plan must say what happens to money already placed when a later card check pushes spending back into an answered period; one gap is dated two ways for a card with a known close day (needs its own failing test before such cards are relied on); a card gap's place (fillerPlace) is saved but read for banks only; "mostly before pay" is saved per check-in but read as one switch; a stretch across a start before a change to no fixed pay and back; the checker and the frozen reference date card gaps their own way, so slice 2 lists each difference.

## Second fix on this branch: two pays that both start periods (failing test 201cba8)
The engine picks the period pay with `schedules.find` (lookahead.js:346), so the order of the list decides; swapping two marked pays moved the period start from 10 Nov to 25 Oct and safe to spend from 32,000 to 1,935 (engine/test/two_pays_order.test.js). SCHEMA_V3 2.3: a list's order means nothing.
The rule (coordinator, 24 Nov): **the pay marked most recently starts the period**, by its record's clock `at`, then its id. Nothing is saved differently. Later, outside this branch: the controls endPay slice clears the mark on an ended pay, and where two live pays are both marked the screen says which one the period follows so the person can change it.
Slice 5: the pick by `at` then id in one place (every reader of the period pay goes through it), the test green in both list orders and with equal clocks.

## Not in this plan
The end-of-period build: it waits for this. Three new values for Home's two figures (asked by MAIN 16, TWO_FIGURES_PLAN F1): their own short plan and review, straight after this branch is green.
