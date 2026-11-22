(Sweep 2, 23 Nov 2026: the everyday experience with the new design. Read-only review by a helper; copied from its reply.)

I walked Mako and a beginner through three months of the new design, week by week. I read LESSONS, RECOMMENDATION, SCHEMA (section 10 taken as the rule where it differs), NORTH_STAR, DECISIONS, and on the side branches STATEMENTS_DESIGN (statements-ph), MONEY_DOOR and LEDGER_DESIGN (money-door), plus the foundation reviews. Nothing was written to the repo.

How each person really uses it:
- **Mako:** sets up once, then opens it about every Sunday. He never types card spends. He looks at his bank app and two card apps. Pay and both card payments go out automatically on the 10th and 11th.
- **Beginner:** sets up on a good day and logs a few coffees in week 1. They miss weeks 3 and 4, come back after pay day and want one number they can believe without retyping anything.

In the new design, a typed check is the only thing that brings the app back to the truth. Almost everything that goes wrong happens at that check.

## Engine and saved-shape changes needed now

**1. The weekly check must settle the automatic payments first, then treat what is left as spending.**
- **Moment:** Mako's Sunday 14 Nov check. Since his last check, pay landed on the 10th, card A was paid on the 10th and card B on the 11th. He logged none of it.
- **What goes wrong:** He types today's bank figure. As written, the difference between that and the logged events is "unexplained", and accepting it records an adjust into Free to spend. The difference is "pay minus two card payments". Free to spend absorbs it, while both cards still hold their full set-asides and stay owed, so the card money is counted twice. Pay goes into Free to spend instead of Waiting. No income event exists, so the new period never starts: Home still shows the old period, now in negative days. Rent paid by direct debit stays "not seen yet" and is counted as still coming, so safe to spend is too low every month until he confirms it.
- **What the base needs:**
  - A reconcile step inside the check. Every expected item due since the last check (pay, card payments, bills) is offered as "this happened", ticked by default, with the real amount allowed to differ. Only what is left after that becomes the gap.
  - Ticking pay writes the income event that starts the period. Ticking a card payment writes the repay event.
  - The check event, or a group, carries the occurrence ids it settled.

**2. "Rest of spending" should be one worked-out filler, not an adjust saved forever.**
- **Moment:** Mako types his card balances each week. The gap is everything he did not type, which is all of it. Weeks later he imports the card statement.
- **What goes wrong:** Each accepted gap becomes a fixed adjust event. The import's duplicate check (`phAlreadyLogged`: same amount within 3 days) never matches a lump against single lines, so every imported line is added on top of the adjusts. The month's spending doubles. A typed rough "about 1,200 at a cafe" against a posted 1,180 does not match either.
- **What the base needs:**
  - The adjust is marked as filler and carries the stretch it covers (from one check to the next). Its amount is always worked out as the check figure minus the logged events in that stretch.
  - Imported or typed lines dated inside the stretch shrink the filler automatically and never add to it.
  - A typed entry can be marked rough (`est`). An import line within the posting-delay window and close in amount replaces it (the typed one is marked `gone`, with the import as `goneBy`), instead of both being kept.

**3. A gap that spans a pay day has to be split at the period line.**
- **Moment:** The beginner comes back on the 28th after missing two weeks. Pay was on the 25th.
- **What goes wrong:** The adjust is dated the day of the check. Three weeks of old spending land on day 3 of the new period. Free to spend is in the red at once, and the beginner leaves. Mako sees the same on his first Sunday after the 10th.
- **What the base needs:** The filler's stretch (item 2). When the stretch crosses a period start, the amount is split by period: by days, or all to the older period when the person says "mostly before pay". The engine needs only the stretch and a split rule; the wording can come later.

**4. Changing a schedule must not cut it off from what it already settled.**
- **Moment:** In week 2 the beginner sees they typed pay on the 25th when it is really the 15th. Or Mako's employer moves pay day.
- **What goes wrong:** An occurrence id is `<schedule>@<date>`. Editing the rule changes the dates, so past income events now point at ids that no longer exist. The look ahead sees pay as not yet in and counts it again, which is the old double-pay bug coming back. The same happens to one-off amounts keyed by date.
- **What the base needs:**
  - Settled links are tied to the schedule plus its place in the sequence (for example "pay for the 10 Nov period"), or are re-pointed on edit.
  - The edit screen shows what moves (the schema already says this for pay).
  - A failing test: edit a pay day after two pays have been settled.

**5. Defaults written into the engine so setup stays short.**
- **Moment:** First open.
- **Count, as specified, one question per screen, for Mako:** about 60 to 70 screens. That is about 8 per card (name, figure now, last statement, statement date, close day, payment day, which account pays, paid in full), about 5 for pay, and about 6 per bill for six bills (name, amount, due day, how often, which account, which place). The beginner faces about 40 and stops around the third bill.
- **Target:** about 12 to 15 screens. This needs defaults the engine itself accepts as valid saved data, not just answers a screen fills in:
  - weekend and holiday rule from the country;
  - payment account = the main bank;
  - cards paid in full;
  - close day "not sure";
  - last statement optional;
  - bills monthly, from the main bank;
  - pay = one date, monthly;
  - Free to spend = whatever is left after bills and goals;
  - no minimum balance.
- **One shape item to add:** an "all my bills, roughly" bill line (one amount per month, due on the period's first day) that can be broken into real bills later, from statements or one at a time. Setup then never makes anyone list their bills.
- **Pay must never be left blank.** If pay is skipped, safe to spend counts no future pay and shows close to zero on the first screen. Ask for the next pay date and assume monthly.

**6. A check-in has to exist as one moment.**
- **Moment:** Every Sunday, and every missed week.
- **What goes wrong:** Checks are saved per account. Nothing records "I looked at everything on the 14th". So the app cannot honestly say how fresh it is (north star: "says how fresh that is"), cannot spot a missed week, and cannot hang a streak or the month-end question on it. Safe to spend quietly mixes a bank check from today with a card check from three weeks ago.
- **What the base needs:** A check-in id (`grp` already exists) on the checks, settlements and filler written together. The look ahead returns an "as of" date per account, and safe to spend returns its oldest input date.

**7. The month-end question must wait for a fresh check.**
- **Moment:** The first period end, 9 Dec. "Where should the money left in Free to spend go?"
- **What goes wrong:** With a stale check, Free to spend still holds spending nobody has entered. The answer moves that money into a goal, so the goal shows money that is already spent. Later checks drive Free to spend into the red. The old "only N receipts logged" warning does not fit a model built on checks.
- **What the base needs:** The month-end move is allowed only after a check-in dated in the last few days of the period, or it runs that check-in first. Otherwise it is held as "decide later" without moving anything.

**8. Screenshot and second-source imports need a way to drop repeats.**
- **What goes wrong:** Weekly screenshots of a bank app overlap and have no balance or reference. The line id falls back to date, amount, text and a count, and an AI reading text from the same picture twice can return slightly different text, so repeats get through.
- **What the base needs:** A source type on each import (statement, screenshot, typed) and a ranking, so a proved statement replaces screenshot lines in the same stretch. The screenshot line id is built only from date, amount and direction, plus a count.

**9. Bills that vary, and posting delays, need a matching window.**
- **What goes wrong:** Electricity is never the planned amount, and Japanese card lines post days after the buy. Settling by exact amount within 3 days misses both, so the bill stays "not seen yet" and is counted again.
- **What the base needs:** Each schedule has an amount margin (for example `vary: 30%`). Matching uses the posting date and a window set per account.

## Screens that can wait (the base above already supports them)
- **Card apps show two figures:** Japanese card apps often show the next bill and the unbilled part separately. Ask for both in one screen, so the person does not type only one and treat it as the total.
- **The weekly check-in itself:** three figures, then a ticked "these happened" list, then "the rest was about X: everyday spending?". It ends with one sentence on why the gap is normal.
- **The filler as a picture:** "Not sorted yet", a pile that shrinks as statements arrive, not a red loss. Optional "mostly food".
- **Coming back after a gap:** a gentle return screen. One check-in, then the split question; never a list of missed days.
- **Statements first, one per screen:** the order from DECISIONS 8, with suggested bills from repeated payees.
- **Missing parser:** the statement parser covers the Philippines only. Mako's Japanese bank and card files fall back to the AI or screenshots until a Japanese reader exists. That is fine because his week runs on typed checks.
- **Pay day:** coins split into the burrows at the pay the check-in confirmed, never at an assumed one.
- **Fixing a mistake:** "Edit what you typed on the 14th" re-works the filler (item 2), so a typo in a check is fixed with one edit.

## What this means
The ledger, the schedules and the look ahead are right. What they have not designed for is the person who never logs. For Mako and the beginner the check-in is the product, not an extra. Items 1 to 4 decide whether the numbers stay true for someone who only types balances. They belong in the frozen saved shape (step 1) and need failing tests before engine code:
- Mako's Sunday after the 10th;
- the beginner's three-week gap across a pay day;
- a statement imported after two filler weeks;
- a pay day edited after it was settled.

Items 5 to 7 keep setup and the period end from being heavy or wrong. They are small fields, cheap to add now and costly to add after the data move.
