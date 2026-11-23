(qc-foundation review of the whole package, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

I ran 13 new situations of my own through the reference code: lookahead_ref.js, merge_ref, matching_ref, period_end_ref and units_ref. Scripts are in /tmp/foundation_final/ (s1 to s6, base.js). The team's checks still pass (321 asks, 182 cases). Six findings would need a saved-data or engine change if they are left until later.

## FOUNDATIONAL

**1. A statement line on a check-in day, or on the setup day, is counted twice.**
- Who: anyone who checks in and later imports the statement. That is the main planned use.
- Moment: lunch 1,000 typed at noon. Bank checked at 20:00 at 99,000. A week later the statement line replaces the typed lunch.
- What the engine does: the import gets its own `told` (the import time), and the line it replaces is dropped (lookahead_ref.js:186, :225). The check-day ordering (:293-297, SCHEMA_V3:19, :207) then puts the lunch after the check.
- Result:
  - Bank shows 98,000 when the right figure is 99,000, and 1,000 shows up as unexplained spending (s1a).
  - With no typed line, the import still lowers the bank instead of shrinking the gap (s1b).
  - A coffee bought before setup, imported later, comes off a figure that already held it: 99,500 when the right figure is 100,000 (s1c).
- Why it is in the base: `told` is saved once and never changed.
- What the base needs:
  - An import that replaces a typed line keeps that line's `told`.
  - An unmatched import line on a check's day or the setup day counts as inside that figure.
  - Keep the statement's running balance if one is printed (`src.bal`), so the order can be proved.
  - The same rule for spends the app logs by itself (autoSpend) when it writes them late.
- Cost: a rule and a few asks now. Later, every saved import's `told` would have to be rewritten.

**2. Things the app writes for a known moment get random ids, so two devices double them.**
- Who: a couple on two phones, or one person on a phone and a laptop.
- Moment: both tick "Pay 250,000" at the check-in.
- What happens:
  - The merge joins records by id (merge_ref mergeList), so both pays stay. Bank shows 548,000 when it should be 298,000 (s4).
  - The "possible double" offer misses it when one person edited the amount.
  - Spends that log themselves: both devices write the gym fee, so bank shows 84,000 when it should be 92,000 (s6). SCHEMA_V3:154 says nothing about two devices.
  - Period-end answers: each phone moves the 20,000 left. The merged copy moves 40,000 out of a place that held 20,000. The refusal rule only works on one phone.
- What the base needs: ids built from what the record is, for example `set:pay@2026-12-25` for a settlement, `auto:gym@2027-02-01` for a logged spend, and `pe:<period last day>:<place>` for a period-end answer. Then a merge keeps one copy. N5's `periodStart` needs the same.
- Cost: tiny now. Later, duplicates already merged are indistinguishable from real ones.

**3. The id rule will reuse ids on one device.**
- The session part is 3 letters per page open and the counter restarts at 1 (SCHEMA_V3:13).
- With 26 letters there are 17,576 session parts. At 3 to 5 opens a day, about 34 to 95 session pairs share one per year (s5). That is still about 36 if digits are used too.
- Same session part means same ids: `put` into the events store overwrites the older record, and the merge keeps one. A real 1,200 lunch disappeared in my test.
- What the base needs: at least 8 random characters per session, or a counter kept on the device under a lock.
- Cost: one line now. Later: records lost with no way back.

**4. The saved shape has no field for which account a budget line or Free to spend comes from, and the model depends on one.**
- The model reads `account` on lines (lookahead_ref.js:642, :705). `plan.budgets` and `plan.shares` have no such field (SCHEMA_V3:219-220).
- Only 3 scenario files have a plan, all with a single bank.
- Mako's life: food bought on the card.
  - Line set on the bank: the card buys are not counted against the line, so food is taken off twice. Headroom 350,000 when it should be 380,000.
  - Line set on the card: what is left of food is never taken off. Headroom 400,000, which is unsafe (s3).
- What the base needs:
  - `acct` on budget lines and on the Free to spend share, defaulting to `home.mainBank`.
  - Spent-so-far counts a line's spends on every account.
  - Spends on a card are reserved from the card's paying account, once.
- Cost: a field and asks now. Later, an engine change and guessing for saved lines.

**5. Money leaving a card is never seen.**
- cardInfo counts only spends, refunds and payments (lookahead_ref.js:360-367).
- A cash advance of 20,000 into the bank: card owed shows 0, no payment is expected, and safe to spend is 20,000 too high.
- A closed card sends a 3,000 credit back to the bank: card owed shows -3,000, and the total after cards is 3,000 too high (s2).
- The ledger kind `borrow` ("cash taken on a card") is not in the model at all.
- What the base needs: transfers and borrows out of a card become card lines. A cash advance may carry its own rate from day one, so decide now whether the card needs a `cashApr` field.
- Cost: model asks now. Later, an engine change.

**6. The home currency cannot change over time.**
- Who: someone who moves from Japan to the Philippines (an overseas worker going home).
- `plan.shares`, `home.minBank` and `plan.limits` carry no currency (SCHEMA_V3:48, :219-222). Waiting, Bills left and Free to spend are home-currency places with no currency field.
- E2 only allows "convert every amount". That rewrites true yen history into pesos.
- What the base needs: `home.cur` saved as dated entries like `rules`, and `cur` on each `plan.shares` entry.
- Cost: small now. Later, old entries are unreadable once `home.cur` is overwritten.

## WATCH

- **One holiday table for all accounts:** `home.country` sets it, so a Japanese bank plus a Philippine e-wallet use one calendar. Add `country` per account when the second currency comes.
- **Deleting an account with history:** no rule. If it is removed, its money stays counted in the places. If its events are removed with it, the bank's history changes. Make it close-only, with a final figure.
- **A goal deleted with money in it:** the money goes straight into headroom. With no Free to spend amount set, the headline jumps from 50,000 to 150,000 (s5). Write a move to Waiting.
- **A wrong figure typed at a check-in** (bank figure typed into the e-wallet): it becomes a large gap the other way and lifts Free to spend. A large unexplained gain should be asked about, not placed.
- **Pay rhythm changed mid-year** (every two weeks, then monthly): `paysInYear` takes one rule. The year's food plan came to 588,886 when it should be 600,000 (s5).
- **N3 is unclear:** "the pay that starts it" can mean 2028's first pay, while units-50 and M8 give that period 2027's amount. Under M8, 2027 plans 27 periods and 2028 plans 26, so neither year adds up. Say "the pay's due-date year" and change units-50 to 11,556.
- **N1 needs a way to recognise a held copy:** the fast device must tell a held copy of its own record from its own older version. Either compare everything except `at`, or save a `held` mark. Pick one before coding.
- **Move:** 38.28's normalize writes ₱ into any copy that has no currency (src/ui0.js:73, :80). After one save, SCHEMA_V3:237's "ask when there is no currency" never triggers. Also confirm ₱ on copies with preset `legacy`.
- **Move:** `frozen3831` must be the raw stored text. Both builds' cleaners drop data, for example receipts beyond 5,000 (model.js:1125).
- **A refund does not give back to its budget line:** this errs on the safe side. Decide whether `line` goes on `in`.
- **An old statement imported after a period-end answer:** it can make a period overspent after the fact.

## Checked and sound

- **A bill paid twice, then refunded:** bank 140,000, then 220,000, with no expected item left by mistake.
- **Pay split across two accounts:** two schedules, one starting the period; the e-wallet lowest point is right.
- **A couple splitting one bill between two e-wallets:** works as two schedules.
- **Merge:** a Redo against an Undo, entries by `from`, holding a copy that arrives a day ahead.
- **N2, N4, N5:** sound as shapes, apart from the WATCH notes above.
- **38.28 vs 38.31:** both use the same storage key, and every 38.28 field has a target in section 11.
- **Agreement between the documents:** SCHEMA_V3, the model and the rules files agree on posting windows, the 10% margin, early settling, spend-from defaults and period end. The two places they disagree are finding 4 and the `told` of a spend that logs itself (the model uses the start of the day at lookahead_ref.js:263; the schema says the time the app heard of it).
- **The rest of the schema:** dates as whole day numbers, the version guard and the device-only split.

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/units.json
- /tmp/foundation_final/s1_import_after_check.js
- /tmp/foundation_final/s2_card_out.js
- /tmp/foundation_final/s3_line_on_card.js
- /tmp/foundation_final/s4_two_devices_settle.js
- /tmp/foundation_final/s5_more.js
- /tmp/foundation_final/s6_autospend_two_devices.js
