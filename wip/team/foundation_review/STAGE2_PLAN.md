# Stage 2 plan (draft, 24 Nov 2026 JST, MAIN 15)

Status: DRAFT. Goes to the efficiency review and qc-foundation before any slice starts (CLAUDE.md, LESSONS lesson 4).
Covers what comes after version one: couples, a second currency, the rich merge of phone and desktop, card interest,
a minimum as a percent, instalments, and "money lasts about N weeks". All amounts are made up.

## 0. Ground rules for this stage (from LESSONS 1 to 4 and AX, AZ, BN)
- Thin slices. Each one is small enough to build and walk through the real page in one day, and ends with something Mako can open.
- A slice adds tests only for itself. Anything found outside the slice goes on a list (AX3, AZ3).
- One engine (wip/team/engine). The reference model stays frozen (AX2, BC5). No new rule rounds, no new scenario files for the whole stage (AZ4).
- Every slice ends with a real-page walk with hand-worked figures, added to app3/check3.sh, and a FEATURES.json line (AZ5).
- Money maths only in the engine: tests/no_maths.js stays green, so every new figure (a view's headline, a total in the home currency, weeks left) is an engine result.
- Version one comes first. Slice 6b, Mako's run feedback (app3/FOR_MAKO.md) and the vault lane beat any stage 2 slice when they compete.
- No saved-data move. The copy stays `v: 3`.

## 1. What is already there (read before planning more)
The engine already does more of stage 2 than the stage list suggests:
- Interest on a carried card balance at each close, and on loans and pay-later on each payment day, rounded half up (engine/units.js interestOn, engine/lookahead.js cardInfo and owed; I2, J1, K1).
- A minimum as a percent with a floor, or fixed (lookahead.js minPay; minRule `{ pct, floor }` or `{ fixed }`; K2).
- Pay-later plans and a card instalment buy with parts posted to the card and the rest in "Later on" (lookahead.js planParts; Q3, S4).
- "Lasts about N weeks" with no fixed pay (lookahead.js lastsAboutWeeks, B4), shown on Home since slice 6 (home3.js).
- Accounts, schedules and goals in another currency kept apart and warned, never converted (F11; warnings card_other_currency, loan_other_currency, income_other_currency, spend_other_currency).
- The version one sync joins every list of id records, including lists it does not know, and keeps the version not picked in keptVersions (engine/sync.js records(), AQ3, AW7).
What is missing is mostly screens and walks. The engine work is small for interest and instalments, middling for the runway and currencies, large for couples' views and the rich merge.

### Gaps in the saved shape (all additive, no data move)
SCHEMA_V3 section 0 says "Unknown fields are kept on load and save, arrays and objects too", and sync.js joins any list of id records. So these can be added without a move. Each gets one line in SCHEMA_V3 and a store round-trip and sync-join test in the slice that needs it:
1. **A dated exchange rate.** SCHEMA_V3 has none. Proposed: a shared list `rates: [ { id, from, cur, to, rate: '150.25', src: 'typed'|'convert', told, at, by } ]`, the rate a decimal string so no float is ever saved.
2. **Who is using this device** (for a person's own view). Device only, section 2.2: `me: <people id>`. Never in the cloud copy.
3. **An owner on budget lines and `plan.shares` entries** (each person's own Free to spend). Accounts, places, schedules and events have `owner` already; the plan does not.

## 2. Each item

### 2.1 Money lasts about N weeks (for everyone, not only no fixed pay)
- **For whom:** everyone, Mako first. "If no more pay came, your money lasts about 7 weeks." It answers "am I safe?" in one line and teaches the habit of a cushion (NORTH_STAR: feel safe, teaches the mindset).
- **Shape:** nothing new. Reads accounts (spendFrom, minBank, home.main.min), schedules, plan.budgets and plan.shares (SCHEMA_V3 sections 3, 5, 8).
- **Engine:** one option on the walk that leaves out every future income, and counts budget lines and Free to spend by the day (the no-fixed-pay units rule, SCHEMA_V3 section 8 "Units": monthly x 12 / days in the year, rounded down). Result `runwayWeeks` beside lastsAboutWeeks, with its sum parts and the first day below the minimum.
- **Screens:** one line on Home under safe to spend, with "?" help and the sum behind it. Plan shows the same figure in the goal for an emergency place, if there is one.
- **Walk (hand-worked):** today 24 Nov, one bank 300,000, no cards owed, rent 90,000 on the 27th, lines and Free to spend 73,000 a month (2,400 a day). 24 to 27 Nov: 3 days, 7,200, then rent: 202,800. To 27 Dec: 30 days, 72,000, then rent: 40,800. 40,800 / 2,400 = 17 more days, so 0 on 13 Jan and below it on 14 Jan: 51 days, "about 7 weeks". With a minimum of 40,800: below it on 28 Dec, 34 days, "about 4 weeks". Reload at each step gives the same.
- **Risk:** low. The real question is what counts (goal money in the bank? the emergency place?). Default: what safe to spend counts, goals left out and named; for Mako's run.

### 2.2 Interest on a carried card balance, and a minimum as a percent
- **For whom:** the team test and wider (cards are core, DECISIONS 19 Nov), anyone who does not pay a card in full. Not Mako's own shape (paid in full).
- **Shape:** card `inFull`, `apr`, `minRule`, `extraSteps`, `cutDay`, `payMonths` (SCHEMA_V3 section 3, card). Loans the same (`apr`, `minRule`, `amount`, `steps`).
- **Engine:** done (I2, I3, J1, K1, K2). Check only that the result carries `interest` and `minimum` per statement for the screens, and that nothing in screens works them out.
- **Screens:** setup and Plan ask "Do you pay it in full each month?"; if not, the yearly rate and the minimum (percent with a lowest amount, or a fixed amount). Home's card box shows the minimum due, the day, and "interest added this month". Check your bank ticks the minimum by default, editable.
- **Walk:** a card closing on the 15th, paid on the 5th the next month, 15% a year, minimum 3% or 2,000. Statement closed 15 Nov: 100,000, unpaid. Due 5 Dec: max(2,000, 3,000) = 3,000. Paid 3,000, so 97,000 carried. Close 15 Dec: interest 97,000 x 15 / 1,200 = 1,212.5, rounded half up 1,213. A 10,000 spend on 1 Dec: statement 108,213. Due 5 Jan: 3% is 3,246.39, so 3,246. Safe to spend on 24 Nov (pay on 10 Dec) takes off 3,000, not 100,000.
- **Risk:** low in the engine, medium in words (people misread "minimum" as "enough"). The screen must also say what is still owed and what the interest costs in a month.

### 2.3 Instalments (pay-later apps, and an instalment buy on a card)
- **For whom:** the team in the Philippines (pay-later apps are core, DECISIONS 19 Nov), and anyone splitting a big buy on a card (common in Japan).
- **Shape:** `paylater` account with `plans: [ { id, amount, count, first, at, by } ]`, `payFrom`, `payDay`, `apr`; a card instalment is a `paylater` with `of: <card id>` (SCHEMA_V3 section 3, paylater and "A card instalment buy").
- **Engine:** done (Q3, S4, laterOn with each part's balance).
- **Screens:** setup and Receipts: "Paid in parts?" with the number of parts, the amount of each and the first day. Home lists what each plan still owes; "Later on" lists the parts.
- **Walk A (pay-later app):** home currency PHP, an e-wallet with 3,000.00, a plan of 4 parts of 1,250.00 from 15 Dec paid from it. After 15 Jan: 500.00. On 15 Feb the e-wallet goes below zero by 750.00, and Home warns on 24 Nov already. The plan owes 5,000.00, then 3,750.00 after the first part.
- **Walk B (on a card):** a laptop of 120,000 in 12 parts of 10,000 from 1 Dec on a card closing on the 15th, paid the 10th the next month. The Dec statement holds 10,000 of it, due 10 Jan. The plan owes 110,000 after 1 Dec; "Later on" lists 11 parts; the 1 Jan part leaves the bank on 10 Feb. No part is taken twice.
- **Risk:** low in the engine. Medium at Check your bank: a statement line for a part must match the part, not be called new spending (matching.json covers it; the walk must show it).

### 2.4 A second currency
- **For whom:** someone paid or saving in another currency (working in Japan, sending to or saving in pesos; SCHEMA_V3 O6's example), a travel card, a foreign account.
- **Shape:** `cur` on every account, schedule, goal and budget line; `home.curs` dated; `a` and `a2` on `convert`, `transfer`, `repay`, `borrow` (SCHEMA_V3 section 0 "Currency", section 6.2 `a2`). Missing: the rate (gap 1 above).
- **Engine:** step 1: a total in the home currency = each account in its own currency x the rate in force on the day (latest `from` on or before it), minor units converted in whole-number maths, rounded half up, the rate and its day returned. Step 2: the rate from the person's own conversions (the latest `convert` or two-currency payment, `a2 / a`), offered as the rate. Step 3: card, loan and pay payments in another currency counted in the walk at that rate, on the safe side, replacing the "not counted" warnings (H5, Q4, V2) with a dated estimate. Safe to spend stays per account in its own currency until step 3.
- **Screens:** an account in another currency in setup and Settings; Home's Total line "about 150,250 at 150.25 on 24 Nov, typed by you"; Settings "Rates" to type or change a rate; an old rate (over 30 days) says so.
- **Walk:** home JPY, a USD account with $1,000.00 (100,000 cents). Rate typed 24 Nov: 150.25. Total adds 100,000 x 150.25 / 100 = 150,250. A conversion on 1 Dec: 150,000 yen out, $990.00 in: the rate offered is 151.52 (150,000 / 990, rounded to 2 places), and the total uses it from 1 Dec, with the old rate still giving the 24 Nov figure in history.
- **Risk:** medium. A rate is never exact, so every converted figure says "about" and its date. Never fetched from the internet in this stage (privacy, offline, guard3 forbids outside requests). Mixed currencies in safe to spend is the hard part: step 3 waits for a qc-foundation pass of its own.

### 2.5 Couples: each person's own view on one book
- **For whom:** two people sharing money and the bills, each with their own accounts too (F12; a life qc-foundation walks).
- **Shape:** `people`, and `owner` (a people id, null for shared) on accounts, places, schedules and events (SCHEMA_V3 sections 2.1, 3, 4, 5, 6.1). Missing: the device's `me` and `owner` on plan lines (gaps 2 and 3).
- **Engine:** a view: the same look ahead, then a result per person: the accounts they own plus shared ones, their own headline (the sum of the engine's per-account headroom for the accounts in the view), what is due from their accounts. The household view is today's result unchanged. Step 2: Free to spend and lines per person (owner on plan lines). One pay stream starts periods for both (F12); a period per person is not in this stage.
- **Screens:** setup or Settings: "Who else uses this book?" and "This is my phone: Aki". Each account gets Mine, Shared or theirs. Home: a switch "Everyone / Me", and shared money marked "shared, also in Ben's view".
- **Walk:** today 20 Nov, pay stream Aki's on 25 Nov. Shared bank 300,000 with rent 120,000 on 22 Nov: it can spare 180,000. Aki's own bank 80,000, Ben's own 50,000, no bills on them, no Free to spend set. Everyone: 310,000. Aki: 80,000 + 180,000 = 260,000. Ben: 50,000 + 180,000 = 230,000. The shared 180,000 is in both views and the screen says so. A spend Ben logs from the shared bank lowers both views.
- **Risk:** high, mostly in meaning, not maths: two views counting the same shared money twice (both spend it); two people editing on two phones makes "which to keep" questions frequent (see 2.6); privacy between partners is not in the shape (anyone with the code sees everything). Owner question for Mako's run: should a person's view show shared money in full, or a share?

### 2.6 Phone and desktop: the rich merge
- **For whom:** couples first (two people editing the same plan), then one person on two devices. For Mako alone the version one "which to keep" should be rare, because a device sends every 90 s.
- **Shape:** per-entry `at`, `by`, `gone` on `steps`, `rules`, `extraSteps`, keyed overrides `amounts` and `once` (AE1), field values in `home`, `ui`, `plan.limits`, `imports.cats` (AL1), `keptVersions` (SCHEMA_V3 sections 2.1, 2.3, 2.3.1). Nothing to add.
- **Engine:** port merge_ref.js into engine/sync.js one area at a time, replacing "ask" with a field-by-field join where the spec says so: first `steps`, `rules`, `extraSteps` by `from` and keyed overrides key by key on one schedule; then field values; then restore with a merge and the notices after a merge. Each area switches on only when its labelled cases pass on the engine.
- **Screens:** fewer questions. A short notice after a join that changed something ("Your phone and desktop both changed Rent. Both changes are kept: 95,000 from 1 Dec, on the 28th").
- **Tests:** the 201 cases labelled stage 2 in rules/merge.json (STAGE2_MERGE_LIST.md) run against the engine, area by area; fuzz_two_devices.js with the rich join (5,000 seeds, merge(A,B) = merge(B,A), twice changes nothing); a two-browser real-page walk on fake_vault.js. Hand-worked: the phone changes rent to 95,000 from 1 Dec, the desktop moves rent to the 28th from 1 Dec, offline. After the sync: no question, one schedule, 95,000 due 28 Dec; safe to spend on 24 Nov (pay 10 Dec) unchanged; due before 10 Jan pay shows 95,000 on 28 Dec. Second: the phone sets the 10 Dec pay to 260,000, the desktop the 10 Jan pay to 255,000: both keys kept.
- **Risk:** the largest of the stage. 201 cases, restore with a merge, notices. Depends on the vault changes (FOR_MAKO items 1 to 5) being live first. Mitigation: measure before building: count the "which to keep" questions in Mako's real use and in the couples walk; build only the areas that come up.

## 3. Order of thin slices (each one day: build, walk, qc-foundation at the end)
| # | Slice | Who gains | Shape change | Engine | Done when |
|---|---|---|---|---|---|
| S1 | Lasts about N weeks for everyone, on Home | Mako now | none | walk option, runwayWeeks | 2.1 walk green in check3 |
| S2 | Card carries a balance: setup and Plan fields, minimum and interest on Home and Check your bank | team | none | none (check results) | 2.2 walk green |
| S3 | Pay-later app plans | team | none | none | 2.3 walk A green |
| S4 | Instalment buy on a card, matched at statement import | team, Japan | none | none | 2.3 walk B green, an import line matches a part |
| S5 | Account in another currency; typed dated rate; Total in the home currency | two-currency lives | `rates` | total at a rate | 2.4 walk to 24 Nov green |
| S6 | Rate from the person's own conversions | same | none | rate offered | 2.4 walk from 1 Dec green |
| S7 | Couples 1: people, owner per account, this device's person, Everyone / Me on Home | couples | `me` (device only) | per-person view | 2.5 walk green |
| S8 | Couples 2: own and shared lines and Free to spend | couples | `owner` on plan lines | per-person lines | its own walk, planned at S7's end |
| S9 | Payments in another currency counted at the rate (H5, Q4, V2 warnings become dated estimates) | two-currency lives | none | walk at a rate, safe side | qc-foundation pass first, then its walk |
| S10+ | Rich merge, one area per slice, only the areas that real use shows | couples, two devices | none | merge_ref port | that area's labelled cases and the two-browser walk |

Why this order: S1 helps Mako's own shape this week and needs nothing new. S2 to S4 are mostly screens on engine work that is done and tested, so they are the cheapest real gains, and they serve the team test (cards and pay-later are core). Currency comes before couples because it is smaller and its shape gap is one list. Couples needs both views and, with two phones, will show whether the rich merge is worth building. The rich merge is last and built only where questions really pile up.

### The first slice, S1, in steps (one commit each, check3 after each)
1. Engine: a failing test with the 2.1 figures (7 weeks; 4 weeks with the minimum), then `runwayWeeks` with its parts and first day below the minimum, from the walk with future income left out.
2. Engine: the same book in nine orders and after a reload gives the same weeks (lesson 4 addendum).
3. Home: one line under safe to spend, "If no more pay came, your money lasts about 7 weeks", with "?" help and the sum. No maths in the screen.
4. Real-page walk tests/e3_runway.js: setup in Mako's shape with made-up numbers, the line on day one, after a spend, after a check-in, after a pay day; hand-worked at each step; added to check3 and FEATURES.json.
5. qc-foundation on the slice; words to app3/FOR_MAKO.md for his copy pass.

## 4. What NOT to do yet
- No stage-wide rule round, no new scenario files, no edits to the frozen reference model. Tests come with their slice.
- No porting all 201 merge cases up front. Measure first.
- No exchange rates fetched from the internet, no automatic rate updates.
- No travel spend's original amount (`orig`), two-currency transfer schedule, or goal kept in its own account in another currency (SCHEMA_V3 section 14, "Stage 2, no field now").
- No per-person pay periods, no hiding one partner's accounts from the other, no separate logins.
- No Wallet mode (`hand`, T7), no cash advance interest (`cashApr` stays stored only).
- No change to `v`, no move of saved data, no change to the old app.
- No stage 2 slice while slice 6b, Mako's run feedback or a version one blocker is waiting.
- Nothing published or pushed to main without Mako.

## 5. For Mako's run (with the default used meanwhile)
- Lasts about N weeks: should goal money in the bank count? Default: no, and the line names it.
- Couples: shared money shown in full in each person's view, or split? Default: in full, marked shared.
- Rates: typed by you, or taken from your own conversions? Default: your latest conversion, and you can type over it.

## Corrections after the qc-foundation plan review (24 Nov, DECISIONS_ROUND2 BS; these override the text above)
1. **No `owner` on `plan.shares`.** It stays the household timeline. A version one page reads it as one timeline, so owned entries would replace each other. Each person's own Free to spend is held as a budget line (`plan.budgets`, `place: 'free'`, `owner`), which old engines add up correctly for the household. `owner` on budget lines stays as planned.
2. **Rates keep full precision.** A rate taken from a conversion is saved as the exact ratio (a decimal string, at least 6 significant digits), or worked out from the conversion event each time. It is rounded only for display. Convert with each currency's minor-unit exponent (engine/units.js). Say which direction a rate is read in; the inverse is used when only that one exists.
3. **`rates` records** carry `gone` like every other list. Two rates for the same day are settled by latest `from`, then `at`, then id.
4. **`me` is the device's current view choice** ("Everyone / Aki / Ben"), never who owns the phone. It is device only and never synced.
5. **S1 rules:**
   - Period mode turns off both the "lines left this period" at the start and the per-pay plan lines, and uses only the by-day loop. A test checks that the same book with and without the pay on the 10th gives the same weeks.
   - The headline uses the first day under the minimum, not the first day below zero.
   - Transfers in from your own accounts are not income.
   - With several accounts, the line names the account that runs out first. Adding the accounts together comes in a later slice.
   - No runway figure is shown on an emergency goal.
