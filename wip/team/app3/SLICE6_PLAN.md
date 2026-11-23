# Slice 6 plan: the other lives (lane/slice6, 24 Nov JST)

Source: app3/SLICE6.md. No saved-data change (SCHEMA_V3 already holds every rhythm, account type and `none`).
Mako's shape stays exactly as it is: tests/e3_walk.js and tests/e3_reload.js are not touched and stay green. Every
setup default stays what it is today (one bank, pay on a day each month, a second income on the same day, cards and
bills paid from the first bank), so his walk types the same boxes and gets the same book.

## The lives (each walked through the real page from setup for about 3 months, hand-worked figures at each step)
| Life | Who | Pay | Accounts | What it proves |
|---|---|---|---|---|
| A | Sam, US dollars, country "Other" (weekends only) | every 2 weeks, Fridays | Checking, Cash; one card, close day not sure | weeks rhythm, a month with three pays, a yearly bill and its nudge, Plan names, a per-pay line asked about when the pay changes to monthly, pay day with a bill on the same day (two steps) |
| B | Lia, pesos, country Philippines chosen | 15th and the 30th (several days a month); a side income on the 5th into an e-wallet | Bank A (main), Bank B, GCash e-wallet; card A from Bank A, card B from Bank B | several days, a second income on another day into another account, more than one bank, an e-wallet, cards paid from two banks, the after-cards figure per bank, a client payment logged as money in |
| C | Kai, yen, country Japan | no fixed pay | Bank, Cash | no fixed pay in setup and build_book, money in from Receipts (a client payment, a gift), "due in the next 30 days", "lasts about N weeks", a budget line a month with no pay day |
The lives use made-up amounts only. Each has its own test file (tests/e3_life_a.js, _b, _c) added to check3 and to
FEATURES.json. Each step checks Home's safe to spend and each account's bank figure against a figure worked by hand in
the file's comments (as e3_walk.js does), then reloads and checks every figure is the same.

## Order of work (one item per commit, the test first and red, then the build; check3 ALL GOOD plus the engine gates after each)
1. **Engine: build_book takes `none` and `year`** (engine). `every: 'none'` for a pay with no fixed day: no amount
   needed (BL1 applies to fixed pay only), never starts the period. `every: 'year'` with `date: 'MM-DD'` for bills and
   pays. Also `months` (every n months from a date) for bills. Test: engine/test/build_book.test.js new cases. Engine
   gates: run_all.js, ref/run_scenarios.js exit 0, rules/run_rules.js, the checker run.
2. **Setup: accounts and the country** (screen). "Add another account" with its kind (bank, cash, e-wallet), name and
   what it holds today; the first is the main one. "Your country" chosen beside the money (Japan, Philippines, other:
   weekends only); default from the money as today, so Mako's yen still gives Japan. Cards pick the bank they are paid
   from (banks only). Bills pick the account they leave from.
3. **Setup: pay rhythms** (screen). "How often" for the pay: a day each month (default), several days each month (a
   second day box), every week, every 2, 3 or 4 weeks (with the day of one pay), no fixed pay. The second income gets
   its own "When it lands" (default: the same days as the first pay, so Mako's shape is unchanged) and its account.
   Bills: each month (default) or once a year (month and day).
   Life C setup is the first walk step committed here; lives A and B setup next.
4. **Receipts: Money in** (screen, act3). A fourth mode, "Money in" (a client payment, a gift): `in` with no `sub`,
   to an account, with a note. act3.moneyIn. Test: e3_act_unit and e3_receipts new cases.
5. **No fixed pay on Home and Plan** (screen). Home: the due list is headed "Due in the next 30 days" (F13) and the safe
   to spend heading says "lasts about N weeks" from `lastsAboutWeeks`; Plan: "Add a line" works with no pay day, saved
   `per: 'month'` and named "a month"; Plan's period card says the plan runs by day with no pay day.
6. **Plan names every rhythm** (screen). Yearly ("each year on 1 Mar"), every n months, set months, once, last working
   day of the month, several days, no fixed day. One function, used by Plan and setup's summary. Test: e3_plan cases.
7. **Changing the pay rhythm asks about each per-pay line** (screen, plan3_write). The pay form gets "How often". When
   it changes the rhythm of the pay that starts the period, the form lists each line and Free to spend that is `per:
   'pay'` and asks, for each: "keep the same each pay" or "keep the same each month" (a new step `per` from the change
   day). Default: keep the same each pay. Test: plan3_write.test.js, life A step.
8. **Nudge to set money aside for a yearly cost** (engine helper + screen). periods.js `aheadFor(book, day)`: for each
   bill with a yearly, several-months or once rhythm whose next one is more than one pay period away, the pays that
   start a period before it and the amount each (U.spread, the leftover on the earliest; null pays with no fixed pay:
   then a month count). Plan shows under the bill "Set aside about $X each pay to have $Y ready by 1 Mar" and a button
   "Make a goal for it" opening the goal form filled in. Pure helper, outside lookahead, so the checker is unaffected.
9. **Pay day: two steps, not only the net (G4)** (engine field + screen). On a pay day whose pay covers what leaves
   that day, the sum shows only "bank today". The engine adds `accounts[id].todayParts` (the pay and each item leaving
   today, only when they are not already in `whyParts`); Home writes a second line under the sum: "Today: + $2,000
   (Pay) − $900 (Rent). Safe to spend counts on this pay coming in today". The headline does not change (G4 stands).
10. **The bank after the cards, per bank (BB2, BK)** (test, screen if needed). The engine already gives
   `bankAfterCards` per bank. Life B checks a line for Bank A and one for Bank B with their own cards and days.

## Engine or screen
Engine: 1 (build_book), 8 (a pure helper in periods.js), 9 (one new result field). Everything else is screen work.
No change to lookahead's figures, so ref/run_scenarios.js, rules and the checker stay as they are.

## What setup asks, per life
- A: bank "Checking" $1,850.00 today, Cash $120.00; money: US dollars, country: other. Pay "Pay" $1,600.00 every 2
  weeks, one pay on Fri 4 Dec 2026. Card "Visa" $230.00 owed, paid on the 20th, close day not sure, from Checking.
  Bills: Rent $900.00 on the 1st, Phone $45.00 on the 15th, Car insurance $480.00 once a year on 1 Mar. Set up Mon 7 Dec.
- B: Bank A ₱18,000, Bank B ₱6,000, GCash ₱1,500; pesos, country Philippines. Pay ₱15,000 on the 15th and 30th
  (working day before); side income ₱4,000 on the 5th into GCash. Card A ₱3,000 paid the 20th from Bank A; card B ₱1,200
  paid the 25th from Bank B (both close not sure). Bills: Rent ₱8,000 on the 1st from Bank A, Internet ₱1,500 on the
  10th from Bank B. Set up Tue 1 Dec.
- C: Bank ¥420,000, Cash ¥20,000; yen, Japan. Pay: no fixed pay (Client work). No cards. Bills: Rent ¥85,000 on the
  27th, Phone ¥5,000 on the 20th, Pension ¥17,000 on the last day. Set up Tue 1 Dec.
Exact steps and figures are in each test file's comments.

## Checks against LESSONS
- Lesson 1: these are the real lives the engine was rebuilt for; each walks from setup through the real page.
- Lesson 2: rhythm words come from one function; the per-bank figure from the engine's one walk.
- Lesson 4: only SLICE6.md items. Anything else found goes to app3/FOR_MAKO.md "For Mako's run" or the list.
- Record-order addendum: every walk step reloads and compares every figure (sameAfterReload, as e3_walk.js).
- qc-foundation: this lane has no way to start an agent; the coordinator runs qc-foundation on this plan and at the end.

## Status (end of the lane)
Done, each with its test in check3: build_book none, year and months (77df7f8); setup for the other lives (1278c6b,
items 2 and 3 together, as SLICE6.md lists setup as one item); Money in (0764817); no fixed pay on Home and Plan with
life C (8380f8c); rhythm words (463f76c); a pay rhythm change asking about each line (5730692); the yearly nudge
(a284d4a); pay day in two steps (a0f352f); life A (4ee4e81); life B and the per-bank figure after the cards (23c41eb).
Setup offers every 1, 2 or 4 weeks (not 3). The per-bank figure needed no code: the engine already gave it per bank.
