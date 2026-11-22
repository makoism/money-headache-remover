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
8. **Saved data that cannot be damaged:** a version stamp that older pages refuse, ids unique per device (phone and desktop), cents kept everywhere, no cap on receipts.

What stays: the screens' layout and pictures, burrows, the six places, Receipts, the cloud copy, backup, Undo, wording work, the art plan. They read from the new base instead of the old one.

## 4. Stages
- **Stage 0, saved-data safety (about 1 day, first).** Version stamp and refusal, ids unique per device, dates outside the window kept, receipt cap removed, debt cents kept, currency code saved. Plus the failing tests on Mako's shape and on six reviewed lives.
- **Stage 1, the new base (version one).** Items 1 to 8 above for one or more bank, cash, e-wallet and card accounts; pay schedules; bills with due days and frequency; cards with a statement close day and a payment day; the look ahead and the new safe to spend; the move of existing saved data; Home, Plan, Receipts and setup reading from it. Setup asks: what your bank shows today, how and when you are paid, each bill's day.
- **Stage 2, after version one.** Cards and loans with interest on what is carried over and a minimum as a percent; instalments; the "money lasts about N weeks" view for people with no fixed pay day; couples' own views; a second currency.
The saved-data shape for stage 2 goes in during stage 1, so nothing needs moving later.

## 5. Size and date
- Stage 0: about 8 hours. Stage 1: about 130 to 170 working hours, run as parallel lanes (engine and schedules; an independent checker written from the rules, not from the code; the move of saved data; screens; tests), each lane with its own worktree.
- Running non-stop with helpers: **version one in the first week of December, around 3 Dec (JST).** This is an estimate. It firms up after qc-foundation reviews the stage 1 plan and the first lane lands.
- The 23 Nov to 25 Nov date given earlier was for the old base and is withdrawn.

## 6. Mako's choices (only these; everything else follows from the north star)
1. **Rebuild the base before version one?** Recommended: yes. On the old base the app is wrong for Mako's own month (pay on the 10th, cards on the 10th and 11th).
2. **What Home calls the current period.** Recommended: its dates, "10 Nov to 9 Dec", with the month name only in history. The other way: name it by the month the pay lands in.
3. **Goal money.** Recommended: both "moved to its own account" and "kept in my bank, set aside" are allowed; the second is the default, and Home shows the bank figure with the set-aside part marked. The other way: only money in a separate account counts as saved.
