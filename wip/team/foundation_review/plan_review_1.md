(qc-foundation review of RECOMMENDATION.md, first version, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

The direction is right. The ledger plus a dated look-ahead is the correct base, and most of the eight lives fit it. But the plan leaves five things open, and each would force an engine or saved-data rework after version one. The plan's claim that "the stage 2 shape goes in during stage 1" only holds if the saved shape is written out in full first. Today it is not.

## FOUNDATIONAL

**F1. Nothing links an expected item to what really happened.**
- **Who and when:** Mako, January 2027. The 10th is a Sunday, so pay lands on Friday the 8th. The 11th is Coming of Age Day, so both cards are taken on Tuesday the 12th. He checks his bank on the 9th. Carlo's pay for the 30th lands on the 27th. Rina does not open the app for three weeks.
- **What the plan does:** item 5 projects "from the latest check". Item 4 schedules only say "a day or days", with no rule for weekends and holidays. On the 9th the pay is already in the checked balance, but its scheduled date (the 10th) is after the check, so it is counted again. That is the setup double count coming back. After three weeks away, the bills due in between are either assumed paid (the plan counted as real again, the old F2) or counted again. The ledger has no field for "this event is that bill on that date" (ledger.js on origin/side/ledger-wiring, event fields in LEDGER_DESIGN "Fields"). Repeats that log themselves (model.js:1203-1225, applyRecurring) would carry the same fault into the ledger.
- **Why it is the base:** this decides what the look-ahead counts.
- **What the base needs:**
  - each schedule gets a weekend and holiday rule (move before, move after, none) and a country holiday table;
  - each item a schedule produces has an id (schedule id plus due date), and the event that settles it carries that id;
  - the look-ahead counts only items not yet settled. One that is past due and not seen shows as "not seen yet".
- **Cost:** about a day now. Later, settled items in saved history can only be guessed.

**F2. "Safe to spend" has two definitions.**
- **The two:** plan item 5 says "the lowest point the bank reaches before the next pay, less the minimum". The ledger says Free to spend is the `free` place (placesOf, ledger.js:471-515).
- **Mako:** he pays for almost everything by card, and card spending leaves the bank only on the 10th or 11th, after his next pay. So the bank's lowest point before the next pay never drops as he spends. Safe to spend comes out too high by everything on his cards.
- **Goal money:** choice 3 makes "kept in my bank" the default, so goal money sits inside that same bank figure and also counts as spendable.
- **Paid every two weeks:** rent once a month falls after the next pay, but that next pay cannot cover it. A yearly cost works the same way. "Before the next pay" never sees either.
- **Carlo:** GGives is taken from GCash (910) on the 20th. The bank as a whole is fine, but GCash goes below zero.
- **What the base needs:** one rule, written in terms of places and checked account by account. Take off what is set aside for the cards and the goals. Look far enough ahead to reach the next time each bill falls due. Schedules need an "from which account" field.
- **Cost:** a day now. Later it means reworking the main number and every test on it.

**F3. The saved shape of the plan side is not written down.**
- **Pay:** the plan says "pay" (one schedule?). Jun and Tess have three pay days. Mako has two incomes on one day. The code inventory proposed a single `cfg.pay` object, which cannot hold them. Pay must be a list of income streams. Each needs:
  - an account;
  - an owner;
  - a currency;
  - "starts a period" (yes or no);
  - an amount for each pay that can be changed one at a time;
  - an end.
- **Ledger pay days:** ledger.js keeps pay as `ui.payDays`, a list of days of the month (ledger.js:226-232, 291-295, 537-547, 677). It cannot hold every two weeks or every week. It has to be replaced, not reused.
- **Month keys:** the plan does not say what happens to `steps`, `once`, `items`, `ui.sweep` and `ui.mcOk`, which are all keyed by calendar month. If they stay that way, "planned against what happened" for past periods still changes whenever the plan changes. Weekly and every-two-weeks budgets would then need a second move. Plan amounts need a "from this date" instead.
- **Two lists:** receipts and spend events must become one list. Shipping both (ledger M5 "old receipts stay as history", wiring step 7 "beside or instead of") brings back two truths, and joining them later is a data move.
- **Cost:** a schema and a test, half a day. Later, a second move of everyone's data.

**F4. Unique ids alone do not make phone plus desktop safe.**
- **Ids:** ledger.js:705 gives a new number to any id that is not a whole number, every time the copy loads. Ids are also a counter (ledger.js:385-393). Stage 0's per-device ids need ledger.js changed.
- **Cloud copy:** it is one whole copy. On a clash the person picks "Keep mine" (ui42.js:48-58), and the other device's entries are lost.
- **Undo:** undo takes events out of the list (ledger.js:394-400, 427). A later merge could not tell an undone entry from one it has not seen.
- **What the base needs:** undo recorded as a "removed" mark that stays in the list, and a changed-at stamp on each plan item.
- **Cost:** small now. Merging properly later then needs no move.

**F5. A card's starting balance is one figure.**
- **Mako sets up on the 20th:** each card opens as one figure dated the day it was typed (migrate3831, ledger.js:762-765).
- **What goes wrong:** ledgerCardDue counts only what was on the card at the last cut-off as due. A balance typed after a cut-off on the 15th is all "later", so "due on the 10th" shows 0.
- **What the base needs:** card apps show a statement balance and a current balance, and setup should take both as two dated openings. Imported lines also need a posting date next to the buy date, because the cut-off goes by the posting date.

## WATCH
- **No fixed pay day (Bea):** in stage 1 the look-ahead must count no future pay, and "days left" must have a defined meaning. The "lasts about N weeks" view in stage 2 is engine only, which is fine.
- **Second currency:**
  - ledger.js:123 takes the home currency from `ui.cur`, which is a symbol today. Stage 0's code must be what feeds it.
  - "$" has to be asked.
  - Schedules and goals need a currency field now.
- **Couples:** the owner field is on accounts only. Put it on income streams and goals now too. Events can take it from their account.
- **Statement import:** use the statement's balance date (stmt.js:152, read and never used) as the check date. A check should also record whether the typed figure was "available" or "current".
- **Clock guard:** needs a saved "last seen" date.
- **Minimum balance:** it is per account, so it belongs with the account.
- **3D world:** sound as long as it calls ACT only.

## What I checked and found sound
- **The ledger's core rules hold for:**
  - money moved between your own accounts;
  - cash taken out and e-wallet top-ups;
  - refunds onto a card;
  - card payments;
  - an overspent month (a place goes below zero, shown in amber);
  - other currencies kept beside Total;
  - cents kept in every currency;
  - a check matched by its own date, so a late statement does not move today's figure;
  - "start fresh" after a missed month;
  - a second income on the same day not starting a new month.
- **Saved data:**
  - the new storage key, the refusal of newer copies (ledgerMayWrite) and the seven entry points that get the check;
  - only typed figures move, a frozen copy is kept, and nothing is trimmed.
- **Setting up on the 20th with pay already in:** this holds once F1 is in.
- **A yearly cost as a schedule every 12 months:** this holds once the F2 look-ahead is in.

## Stage 2 with no data move?
Yes, but only if F3 to F5 land in stage 1:
- interest and minimums are extra fields on accounts;
- instalments use the existing account `of` link plus a schedule with an end;
- couples and a second currency only add fields.

As written, the days-of-month pay list, a single pay object and month-keyed plan amounts would each force a move.

## The estimate and 3 Dec
- **Low hours:** 130 to 170 hours looks low. The code inventory gave 95 to 135 hours for a smaller change: keep the monthly plan and map it onto pay months, with no ledger and no accounts.
- **What stage 1 adds on top:**
  - most of LEDGER_WIRING steps 0 to 13;
  - schedules, settling items against events, and the look-ahead, none of which is on the ledger branches;
  - setup, Home, Plan and Receipts rebuilt;
  - an independent oracle;
  - 42 golden files and about 60 of 281 qc tests to rewrite.
- **The ledger branches:** ledger.js (776 lines) and its fuzz tests carry over well. But the branches were cut from wip-38.31 at 9916cde, and the screens have changed a lot since. Pay days, ids, the home currency and the move code all need changes.
- **A serial path:** parallel lanes do not shorten it. Schema, then engine, then move and screens, then three review gates and their fixes.
- **My estimate:** 200 to 280 hours, landing mid to late December.
- **To keep early December:** fix the full schema and its tests first, about a day. Then build stage 1a end to end for Mako's shape only: one bank, two cards, monthly pay, bills with due days, the look-ahead. Then 1b for the other lives on the same schema.

## Files
- /home/user/money-headache-remover/wip/team/foundation_review/RECOMMENDATION.md
- /home/user/money-headache-remover/wip/team/model.js
- /home/user/money-headache-remover/wip/team/ui42.js
- origin/side/ledger-wiring: wip/team/ledger.js, LEDGER_DESIGN.md, LEDGER_WIRING.md
- origin/side/persona-walks: wip/team/PERSONAS_PH.md
