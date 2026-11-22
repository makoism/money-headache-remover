# Foundation recommendation (23 Nov 2026, MAIN 15)

Built from five independent reviews in this folder: code_inventory.md, premortem.md, banking_reality.md, life_walks_salaried.md, life_walks_irregular.md. All amounts in them are made up.

## 1. The cause, in one paragraph
The engine treats money as one pool that runs calendar month by calendar month, from one balance pinned to the 1st of the first month. Pay, bills, goal money and card payments are monthly totals with no dates, and the plan is counted as if it happened. Nothing a person can actually see (what the bank shows today, on a date) feeds it. Every big problem the reviews found comes from that: two bank figures, pay counted twice at setup, "safe to spend" judged only at month end, every-two-weeks pay off by about 8%, cards leaving the bank in the wrong month, a balance typed in March replayed from November, goals growing in a month with no pay, a removed bill rewriting past months, the app stuck on Oct 2028.

## 2. How it got through, and what stops it now
Mako's own shape (DECISIONS 19 Nov: pay on the 10th, cards paid on the 10th and 11th, "the month should follow his pay day") was written down, then filed as a later team feature, and the designs that fixed it stayed on side branches. QC rounds judged the build against itself, so they polished a wrong base.
Now in place or about to be:
- **qc-foundation** (.claude/agents/qc-foundation.md): walks real lives through the engine. Runs on every plan before building and on every QC round.
- **Every fact Mako states about his money becomes a failing test the same day.** No build is a v1 candidate while one is red. First one: Mako's shape, every day of three months.
- **Side-branch designs are read before building** (added to the RESUME reading list).

## 3. The foundation (what the app is built on from now)
1. **What really happened is recorded, with a date and an account.** Money in, spending, moves between your own accounts, refunds, card payments, and "I checked: the bank shows X today". This is the ledger already built on side/ledger-core and side/ledger-wiring (776 lines, tests, a move plan for saved 38.31 data).
2. **Accounts:** bank, cash, e-wallet, card. Each has a currency (saved as a code, not a symbol) and an owner field (ready for couples, used later).
3. **Every balance is "amount on a date".** Setup and Check your bank become the same question: "What does your bank show today?" Debts and goals the same.
4. **One schedule type for everything that repeats:** pay (a day or days of the month, every N weeks from a date, last working day, or no fixed day), bills (due day, every month or every N months or set months), card payments, instalments, yearly costs. Each gives dated future items.
5. **A day-by-day look ahead from the latest check.** A period runs from one pay to the next. Safe to spend = the lowest point the bank reaches before the next pay, less the minimum balance. "Days left" means days to the next pay.
6. **The plan is what you expect,** set beside what happened. Goals hold money really set aside (moved to an account, or marked as kept in your bank). Past periods are built from what happened, so a plan change never rewrites the past.
7. **No end date.** The window moves with today; dates are never dropped. A wrong phone clock is caught before anything is written.
8. **Saved data that cannot be damaged:** a version stamp that older pages refuse, ids unique per device (phone and desktop), undo kept as a "removed" mark (never deleted, so phone and desktop can be merged later), a changed-at stamp on each plan item, cents kept everywhere, no cap on receipts.
9. **What was expected is tied to what happened** (plan review F1). Each schedule has a weekend and holiday rule (move earlier, move later, none) and a holiday table per country. Each expected item has an id (its schedule and its date); the event that settles it carries that id. The look ahead counts only items not yet settled; one past its date and not seen shows "not seen yet", never assumed paid. This is what stops pay or a bill being counted twice when it lands early or the app is not opened for weeks.
10. **One rule for safe to spend, by account and by place** (plan review F2). What is set aside for the cards and for goals kept in the bank is taken off first. The look ahead reaches the next time each bill falls due, not only the next pay (rent paid monthly by someone paid every two weeks, yearly costs). Each schedule says which account it comes from, so an e-wallet going below zero is seen.
11. **Pay is a list of income streams** (plan review F3), each with an account, an owner, a currency, whether it starts a new period, its own schedule, an amount per pay that can be changed one at a time, and an end. Plan amounts take a "from this date", not a calendar month key. Receipts and spending events are one list, never two.
12. **Cards open with two dated figures** (plan review F5): the last statement balance and what is on the card now. Imported lines keep the posting date beside the buy date. The minimum balance belongs to each account; owner and currency are on accounts, income streams and goals.

What stays: the screens' layout and pictures, burrows, the six places, Receipts, the cloud copy, backup, Undo, wording work, the art plan. They read from the new base instead of the old one.

## 4. Stages
- **Step 1, the full saved shape first (about 1 day).** Every field for stage 1 and stage 2 written out with a test that proves an old 38.31 copy moves into it with nothing lost, reviewed by qc-foundation before any engine code. This is what makes stage 2 need no data move.
- **Stage 0, saved-data safety (about 1 day, alongside step 1).** Version stamp and refusal, ids unique per device, dates outside the window kept, receipt cap removed, debt cents kept, currency code saved. Plus the failing tests on Mako's shape and on the reviewed lives.
- **Stage 1a, version one for Mako's own shape, end to end.** One bank, two cards paid in full with statement and payment days, pay on the 10th (two incomes, one day), bills with due days and frequency, goals set aside in the bank, the look ahead and the new safe to spend, the move of existing saved data, and Home, Plan, Receipts and setup reading from it.
- **Stage 1b, the other lives on the same shape.** Twice a month, every two weeks, weekly, no fixed pay day (counts no future pay), cash and e-wallets, statement import with the statement's own dates.
- **Stage 2, after.** Interest on what is carried over, minimum as a percent, instalments, the "money lasts about N weeks" view, couples' own views, a second currency. Fields only; no data move.

## 5. Size and date (corrected after the plan review)
- The first figure (130 to 170 hours, 3 Dec) was too low. The review puts the whole of stage 1 at **200 to 280 working hours**. The path is mostly in sequence (shape, engine, move and screens, then the review gates), so helpers shorten it less than hoped.
- **Version one for Mako (stage 1a): about 5 to 8 Dec (JST).** Stage 1b for the team test: mid to late December. Both firm up after the shape is reviewed and the first engine lane lands. These are estimates.
- The 25 Nov date given earlier was for the old base and is withdrawn.

## 5b. How it is built (from the coordinator's efficiency review, efficiency_review.md)
- The new engine is built beside the old one behind a switch and changed over in one commit, so the checks never go red or get weakened on the way. Extra check: a plan paid on the 1st with no cards must give the old engine's month-end figures.
- After the saved shape is frozen, two helpers work in new files only on their own branches: the ledger port with the schedules and look ahead, and a second independent checker written from the written rules. model.js, the screens, check.sh and the golden files stay with the main session.
- Mako's shape and the eight reviewed lives become failing scripts first.
- Old calendar-month tests are retired from a written keep, replace or retire list signed by the regression reviewer. No test is ever edited just to pass.
- During engine work only the two gates and qc-foundation run; the full panel runs once at the end of stage 1a.
- Stage 1a on its own: about 150 to 190 hours (shape and safety 16, engine port, schedules and look ahead 45, second checker 20, data move 15, screens 35, tests and retiring 20, gates and fixes 15). That is about 9 to 11 days at the pace of the last week, which is where 5 to 8 Dec comes from.

## 6. Mako's choices (only these; everything else follows from the north star)
1. **Rebuild the base before version one?** Recommended: yes. On the old base the app is wrong for Mako's own month (pay on the 10th, cards on the 10th and 11th).
2. **What Home calls the current period.** Recommended: its dates, "10 Nov to 9 Dec", with the month name only in history. The other way: name it by the month the pay lands in.
3. **Goal money.** Recommended: both "moved to its own account" and "kept in my bank, set aside" are allowed; the second is the default, and Home shows the bank figure with the set-aside part marked. The other way: only money in a separate account counts as saved.
4. **Your cards' statement close days** (the day each card's statement is cut, no amounts). The payment days (10th and 11th) are already noted. With no answer, the app asks in setup and the test uses made-up close days.
