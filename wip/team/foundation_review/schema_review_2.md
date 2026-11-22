(qc-foundation review of SCHEMA.md with section 10, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

All eight problems from review 1 are now mostly closed: 2, 5, 7 and 8 (for cards) are closed, and 1, 3, 4 and 6 are mostly closed. But section 10 brings new holes. The safe-to-spend rule in 10.3 gives an unsafe number for two of the four lives I worked through, and a few data-shape gaps would each need a second data move later. Every fix below is a written decision, a few hours now, against a migration later.

## The eight items from review 1
1. Balance meaning: closed by 10.1. New holes in items F6 and F7 below.
2. Budgets: closed by 10.2, except custom lines (F8).
3. Safe to spend: the old double counts are gone. New gaps in F1 to F5.
4. Units: closed, with gaps listed in F8 and WATCH.
5. Currency: closed.
6. Targets: mostly closed. Still missing: debts (F5), the keep copies (F8), the goal opening (F6).
7. Ids: closed.
8. Card date owner: closed for cards, but it reopens for loans and pay-later (F5).

## FOUNDATIONAL

**F1. The walk never sets aside what is left of this period's budget lines.** Step 2 takes off only later periods' budgets. Today's balance still holds this period's food money, so the headroom counts it as free.
- Example: paid every two weeks, 45,000 on Fridays from 13 Nov. Rent 60,000 on 1 Dec, phone 3,000 on the 20th, food and Free to spend 30,000 a month each (13,846 a pay), minimum 5,000. Today is 14 Nov, the bank shows 70,000 and 1,000 of food is already spent.
- Walk: 67,000 (20 Nov), 84,308 (27 Nov), 24,308 (1 Dec). Headroom 19,308, so safe to spend = min(13,846, 19,308) = **13,846**.
- Real life: spend that, plus food 12,846 and the phone bill, and by 10 Dec the bank is **2,384 below zero**. A careful person would not call that safe.
- Fix: also take off each budget line's remaining amount this period. That gives 6,462, which ends exactly at the minimum.

**F2. Setting up partway through a period leaves this period's places unfunded or overfunded.** 10.1 opens everything into Waiting, and shares are put into places only at a pay (WATCH accepted). Mako sets up on the 20th with pay already in, so his Free to spend place is either 0 or the full share. Nothing says which.
- Example: bank 352,340, cards 84,650, trip goal 60,000 in the bank. Utilities 12,000 on the 26th, rent 85,000 on the 27th, food and transport 60,000 a month (20,000 already spent by card), Free to spend 40,000 (25,000 already spent by card), minimum 50,000. Low point 110,690, headroom 60,690.
- Safe to spend comes out as **40,000 or 0**. The careful answer is about **15,000**: 40,000 takes him 19,310 below his own minimum, and 0 is useless for 20 days.
- Fix: the opening sets this period's places, either from a "spent since pay day?" question or shared out by days left. This is a data decision, because it decides which events the opening writes.

**F3. No order is given for events on the same day.** On a pay day, does the period's planned spending come off before or after the pay is added? In F1, taking the spending off first gives safe to spend **0** and a false warning ("bank goes 3,384 below zero on 11 Dec"). Adding the pay first gives 13,846. Write down "income first". Section 10.1 settles this only for the opening day.

**F4. The freelancer (`every: 'none'`).** 10.4 works out "pays a year", which does not exist for a stream with no fixed day, so Free to spend per period is undefined. With no later period start, no budget line is ever taken off, and the 45-day horizon misses the second rent.
- Example: Ana has 120,000 on 5 Mar after 100,000 came in. Rent 40,000 on the 25th, internet 3,000 on the 10th, food 25,000 a month, Free to spend 20,000, minimum 10,000. Low point 74,000, so safe to spend = **20,000**.
- In a month with no work she cannot pay the 25 Apr rent (about 23,500 below zero). The careful answer is 0, with "lasts until about mid April".
- Fix: take budget lines off each day across the horizon. Make the horizon reach the second occurrence of every monthly bill. Free to spend is a monthly amount spread by day.

**F5. Some schedules and debts are not in the walk.**
- Transfer and autoSpend schedules are absent from 10.3, so a scheduled top-up from the bank to GCash is seen by neither account.
- 38.31 debt payments (min plus `extra`, model.js:353,358) become loan accounts with `payDay` and `minRule`, but the walk only takes off "bill and instalment occurrences". So either loan payments vanish (unsafe), or a builder adds an instalment schedule and the loan date has two owners (review 1 item 8 again).
- Fix: extend 10.8 to loan and pay-later accounts, and name `d.extra` as a target.

**F6. Moving goal savings counts the money twice.** 10.6 turns a goal's `start` into an `open` into the goal's place in the bank. 10.1 opens the bank with the full figure, less the goals. Two readings: one bank open split across places, or a bank open of 352,340 plus a goal open of 60,000, which makes the bank **412,340**. Also, read literally, a same-day goal open is `pre`, so the goal stays empty. Fix: the bank opens with one figure, split by place.

**F7. `pre` breaks the one rule when only one side of an event is before an opening.** Example: the bank opens 20 Nov, GCash opens 1 Dec, and on 28 Nov 2,000 moves from the bank to GCash. The bank moves and GCash does not, so the accounts no longer add up to the places. Decide where the amount goes (Waiting). Also decide whether `pre` is worked out each time or stored; if stored, it goes stale when an opening date is changed.

**F8. Data with no target, or the wrong shape:**
- `amounts` is keyed by the date after the weekend shift. A holiday table refresh or a changed due day leaves those keys pointing at nothing. Key it by the unshifted date.
- Budget lines have only `steps`, so a 38.31 `once` for one month ("food 8,000 this month") has no single-period target.
- Custom lines in the edu, give and ffa places (LINE_JARS, model.js:42,1064) become budget lines whose place can only be `'bills'|'free'`.
- `per` on a `plan.shares` entry: is it one per entry or one per amount? Not stated.
- "Main bank" (10.3 step 4) has no field. `ui.main` is the main goal, not a bank.
- `ui.keep` and `ui.keeps` hold whole 38.31 snapshots and diffs (ui45.js:475-483). Section 1 keeps `ui` "as today", so a late Undo after the move would write old-shape fields into a v2 copy. They belong in `frozen3831`.

**F9. Two smaller rule gaps.**
- Step 5 adds a spending account's negative headroom into the sum and also takes its shortfall off again. Carlo: GCash has 800, a 1,090 bill is due on the 20th, and the bank's headroom is 25,000, giving 24,420 instead of 24,710. Count only headroom above zero.
- The walk starts from the events total, so a newer, lower check that has not been accepted (back after three weeks, spends not logged) is ignored. Start from the lower of the two.

## Results
- **Carlo's GCash:** safe to spend 3,000, capped by Free to spend, with a 290 warning. A careful person would call that safe.
- **Mako (F2), every two weeks (F1), freelancer (F4):** not safe as written.

## WATCH
- A yearly cost placed in bills rather than a goal is invisible until 45 days before it is due (section 8 covered it, 10.3 dropped it).
- `plan.budgets` has no `cur`. That is fine until the second currency arrives.
- Rounding when a monthly amount is split per pay, and whether a year has 26 or 27 two-weekly pays, are not stated.
- A share step that starts in the middle of a period has no rule.
- If the new storage key is damaged, the "second copy" reader (ui43.js) could re-run the move from the 38.31 copy and lose newer events.
- The Investing place kept in the bank is not protected in the headroom.

## Checked and sound
- Pay rules for every two weeks with three-pay months (13 Nov 2026 is a Friday), twice a month on the 15th and last day, and weekly.
- The weekend shift: 10 Jan 2027 is a Sunday, so pay moves to 8 Jan.
- A couple's owners and streams; refunds never start a period (`stream`); moves between own accounts.
- Card statement and "now" figures, the cut day, and taking off "everything on the card" today.
- Ids per session, `gone` and `at`, the version guard, the clock guard.
- Statement import with `posted`. The ledger, several accounts, the cloud copy and the 3D world all build on this shape once F6 to F8 are written down.

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA.md
- /home/user/money-headache-remover/wip/team/model.js
- /home/user/money-headache-remover/wip/team/ui0.js
- /home/user/money-headache-remover/wip/team/ui45.js
