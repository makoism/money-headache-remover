(qc-foundation review of SCHEMA.md, first draft, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

The shape closes most of what the last review found. F5 is closed. F1 and F4 are mostly closed. F2 and F3 are only partly closed. Eight problems below would each need an engine change or a second data move if two builders read the shape differently, so each needs a written decision before any engine code. None should take more than a few hours to pin down now.

## FOUNDATIONAL

**1. Two different meanings of "balance", and moved receipts would be counted twice.**
- Section 2 says an account opens with a check, "never a bare number". In the ledger, a check moves no money (LEDGER_DESIGN event table), so balances and places are only added up from `open` and the other kinds (migrate3831, ledger.js:735-770). Section 8 instead starts from the check: "balance on the check day + events after it". Those are two different numbers.
- Mako's fixture: bankNow is 352,340 on 18 Nov. Section 9 moves his receipts from 3 to 17 Nov in as spend events on the bank. If the balance is added up from events, those receipts come off a figure that already includes them, so his bank and Free to spend both drop by everything he logged. If it starts from the check, the places no longer add up to the accounts.
- Needed: an opening is an `open` with its place plus a check on the same day, and events dated on or before an account's opening check do not move that account. Write down which side a same-day event falls on.

**2. Everyday spending budgets have nowhere to go.**
- LINE_DEFS (model.js:47-62) puts Food, Transport, Subscriptions and "Other card spending" in the needs pot beside rent. Section 9 turns every needs line into a bill on the 1st.
- Groceries do not leave on one day, so food@12-01 is never settled. It shows "not seen yet" for good, and food money is taken off twice: once as the bill, once by each grocery spend.
- "Other card spending" as a bill is also taken off a second time beside the card's set-aside.
- plan.shares only has keys for free, edu, give, ffa and goals, so these line amounts and any custom lines are lost.
- cfg.ceiling and cfg.aims (model.js:1018-1036) have no target either.
- Needed: a budget line per period with a place and a category (spends carry the line in `sub`). It is used up by spending, not settled.

**3. The safe-to-spend rule (section 8) can be coded two ways.**
- **Where the walk ends is never defined.** For the person paid every two weeks with rent on the 1st (pays on the 13th and 27th, today the 14th): if the walk reaches 1 Dec, it adds the 27th pay first and the rent looks covered. If it ends at the next pay, the rent is "pulled in" with no date. The two builds give different numbers.
- **Mako's cards are taken off twice.** The cardPay occurrences and "everything on the card" are both subtracted, and cardPay has a fixed `amount`. It needs to be "the card's due amount, already inside its set-aside", not a second subtraction.
- **Yearly costs are taken off twice.** A cost with `place: <goal id>` is subtracted as a goal place kept in the bank and again when it falls due. Only the part the place does not cover should come off.
- **No field says which accounts Free to spend may use.**
- **Carlo's GCash low point gets lost.** GCash dips 290 below zero on the 20th. If GCash is not a Free to spend account, that dip drops out of the sum. Every account's shortfall should come off, and the engine should report the account and the date.
- **Every account gets the main bank's minimum.** `minBank: null` falls back to home.minBank, so cash and e-wallets each take the bank minimum. The default should apply to bank accounts only, and the move should set it on the bank.
- **Data gap:** a schedule has one `acct`. A card payment or a transfer needs `acct2` (which bank pays the card). This is a field to add now.
- **Freelancer, zero month:** the rule holds (no future pay counted), but see item 6.

**4. What the plan amounts are measured in is not stated.**
- plan.shares `free: 30000` could be per month, per day or per pay. "14 days' worth" spreads it by days. That gives Mako, paid the same each month, a different Free to spend in a 28-day period than in a 33-day one, and splits a two-weekly earner's pay-by-pay budget by days.
- goal.monthly and shares.goals both hold the goal amount.
- A raise from April has no field. A schedule has one `amount`, plus single-occurrence overrides only. 38.31 `steps` with several "from" entries cannot move across exactly.
- `ends` is described as "date or after N".
- Needed: `per` on each shares entry, and dated amount steps on schedules.

**5. Currency has to be known before amounts are converted.**
- Minor units depend on the currency's decimal places. A "¥" copy moved as yen and later answered "yuan" is out by 100 times.
- ui.cur takes any symbol up to 4 characters (ui0.js:93), but the table lists six codes.
- Needed: the move runs only after the code is known, and the table has a fallback.

**6. Some 38.31 data and ledger fields have no target, or the wrong one.**
- **Debt goals become fake savings.** A goal of kind "pay off a debt" (ui.gk, fixture debtgoal: 12,000 of 30,000 paid) would open 12,000 of savings that has already gone to the lender. A goal needs a `pays: <account>` link.
- **No target for these:**
  - ui.loans totals, ui.subP and ui.subO prices, ui.cardT and ui.cardB (ui0.js:137-145);
  - lines `ends`/`redirect`, plus cfg.loanLast and redirectLoan;
  - plan.recurring with its weekday rule and `last` (model.js:1104);
  - steps `debt:<id>` extras;
  - goal `start`, `slot` and `why` (GOAL_KNOWN, model.js:1056);
  - the receipt's `c` (category) and `s` (account name);
  - ui.sweep turned into past-dated moves could add plan money to goals as if it were real.
- **Goal money moves two ways.** Section 9 keeps LEDGER_DESIGN's "Savings from your old plan" account, but section 5 makes kept-in-bank the default. They disagree on whether a goal start is an `open` or a move inside the bank.
- **Ledger fields dropped from the shape:** `tracked`, `closed`, `confirm`, `preset`, `grp`, and Track or Wallet mode.
- **The freelancer's pay cannot be tied to its stream.** An `every: 'none'` stream has no occurrence ids, so `settles` cannot link a payment to it, and "last money in" could start a period from a refund. Events need a `stream` field.

**7. Ids and merging.**
- The shape does not say where the counter is kept.
- Two tabs on one device would hand out the same ids.
- A phone restored from a backup copies its local storage, device part included, while the old phone is still in use.
- plan.shares entries, `home` and the plan have no `id` or `at`, so they cannot be merged.
- Whether an edit updates the record in place is not stated.
- Needed: a random part for each id (or each session), and `id`/`at` on every plan entry.

**8. Card payment day comes from two places.**
A card's `payDay` plus `paySched`, and a `cardPay` schedule, can disagree. Pick one owner. The "30th in February" rule should cover pay days too, not just cut days.

## WATCH
- **Bills that leave on their own and are never confirmed:** they stay "not seen yet" and are taken off twice until confirmed or matched by an import (Rina after three weeks away). Safe, but the number will look too low.
- **Statement import:** a typed card spend and the imported line for it need a matching rule, or they are counted twice.
- **Couples' own views (stage 2):** need a Free to spend place and a period for each person. Additive if place ids stay strings.
- **Holiday tables:** need a yearly refresh, or after the last year shipped, pay dates fall back to weekends only.
- **Putting shares into places on pay day:** whether that happens by itself or by the person is unset (the engine would create events).

## Checked and found sound
- **F5:** the statement and "now" figures for cards, and the posting date. Closed.
- **F1 (mostly):** weekend and holiday shift rules, occurrence ids, `settles` and `skip`, and "not seen yet" counted on the safe side.
- **F3 (partly):** income as a list of streams with owner, currency, `startsPeriod` and `ends`; receipts and spends as one list; the payDays list replaced.
- **F4 (mostly):** "removed" marks with `goneBy`, `at` on each record, unknown fields kept.
- **Pay rules hold for:** every two weeks (three-pay months), weekly, the 15th and the last day, set months (bonuses, 13th month pay, tax paid in parts), every N months, last working day.
- **Day-to-day events hold for:** refunds onto a card, moves between own accounts, ATM cash and e-wallet top-ups, an overspent place going below zero, a second currency kept outside Total.
- **Setting up on the 20th:** holds if a schedule's `from` defaults to the setup day.
- **Saved data:** whole minor units, the version stamp refusal, the frozen copy, no fixed window, the clock guard.
- **Planned features:** ledger, statement import, several accounts, cloud copy and the 3D world all build on this with no move, once items 1, 3, 6 and 7 are written down.

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA.md
- /home/user/money-headache-remover/wip/team/model.js
- /home/user/money-headache-remover/wip/team/ui0.js
- origin/side/ledger-wiring: wip/team/ledger.js, wip/team/LEDGER_DESIGN.md, wip/team/tests/next/fixtures/wiring/
