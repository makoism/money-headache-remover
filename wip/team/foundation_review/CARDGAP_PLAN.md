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
2. **A statement figure typed in the same check-in** (lookahead.js:600 to 605) is its own part: its stretch ends on the close day, and the rest of the gap runs from the day after the close day to the check.
3. **Readers.** lookahead.js:979 sums a card's `parts` by each part's first day, exactly as line 975 does for a bank. app3/src/receipts3.js:307 lists a card gap by its parts, as line 305 does for a bank, so the Receipts list and the spent figure still agree (LISTFIX A1).
4. **Unchanged on purpose:** the filler keeps `day`, `amount`, `more`, `less` (Check your bank's words read them, checkin3.js:100 to 104). What the card owes, its statements and the day each payment falls due still put the gap on the check's day (lookahead.js:607): which statement a gap falls on is a separate question and no figure of safe to spend moves in this change. No field of safeToSpend is renamed or reshaped.

## Saved data
No saved-shape change and nothing to move. A gap is never saved: it is worked out from the checks every time the book is read (A3, engine/ledger.js:5). So gaps "already saved without a stretch" do not exist. The same book simply reads differently after the fix: past periods' spent on Free to spend goes up where a card check crossed a pay day and the period after goes down by the same amount. The sum over periods is the same to the yen.

## What a person sees change
Home's everyday figure in the first days of a period (higher, as it should be). Past periods on Receipts: a card gap that crossed a pay day shows as two rows, one in each period. Nothing else.

## Real lives beyond Mako
Paid every two weeks or weekly: a stretch can cross two or three period starts; makeFiller already cuts at each. No fixed pay: no period starts, one part, as today. Set up mid-period: the first stretch starts the day after the opening check. Away three weeks: one long stretch cut at each pay. A card in another currency: marked apart as today, parts and all. Two devices, reload, restore, Undo of a check: nothing saved, so the parts follow the checks that exist.

## Slices (test first, one commit each)
1. The grown engine test above (red).
2. makeFiller for card gaps and the reader at line 979 (green). engine/test/run_all, the checker and the reference comparison stay green, or each difference is listed and explained here.
3. receipts3.js:307 and a page test: a card check after a pay day shows two gap rows and the spent figures match.
4. A step in the real-page walk (tests/e3_walk.js): a card check that crosses a pay day, hand-worked.
Then check3 full, a fresh qc-numbers and qc-foundation on the branch.

## Second fix on this branch: two pays that both start periods (failing test 201cba8)
The engine picks the period pay with `schedules.find` (lookahead.js:346), so the order of the list decides; swapping two marked pays moved the period start from 10 Nov to 25 Oct and safe to spend from 32,000 to 1,935 (engine/test/two_pays_order.test.js). SCHEMA_V3 2.3: a list's order means nothing.
The rule (coordinator, 24 Nov): **the pay marked most recently starts the period**, by its record's clock `at`, then its id. Nothing is saved differently. Later, outside this branch: the controls endPay slice clears the mark on an ended pay, and where two live pays are both marked the screen says which one the period follows so the person can change it.
Slice 5: the pick by `at` then id in one place (every reader of the period pay goes through it), the test green in both list orders and with equal clocks.

## Not in this plan
The end-of-period build: it waits for this. Three new values for Home's two figures (asked by MAIN 16, TWO_FIGURES_PLAN F1): their own short plan and review, straight after this branch is green.
