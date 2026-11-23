(qc-foundation review of SCHEMA_V3 and the reference model, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

I checked SCHEMA_V3, lookahead_ref.js and the 180 asks (all 180 pass) on wip-38.31. Every finding from plan_review_1, schema_review_1, schema_review_2 F1 to F9 and the sweep 2 reports is closed in the text. Then I made up 14 new situations, worked each one out by hand, and ran them through the reference model with scripts in /tmp/foundation_v3/ (t.js, t2.js, t3.js). Seven findings would each need an engine rule or a saved-data change later.

## FOUNDATIONAL

**1. A check and an event on the same day: the model has no order between them, and the saved data cannot record one.**
- **Who:** anyone who sets up or checks in during the day and then logs lunch.
- **What happens:** a 7,000 spend logged after a setup the same day leaves the bank at 300,000 when it should be 293,000. The cause is lookahead_ref.js:144: anything dated on or before the opening day is treated as already inside the opening figure. A spend logged after a same-day check is also lost (:157, `e.day > baseDay`), and the filler reads -5,000, "less went out than logged". Two check-ins on one day make a second filler running "23 Nov to 22 Nov" for +5,000.
- **Debit spends:** a debit spend on the 21st that posts on the 24th, with a check on the 22nd, leaves bank today 10,000 too high from then on. The `avail` field and the bank's `posted` date are stored, but no rule uses them.
- **Why it is in the base:** the only time on a record is `at` (SCHEMA_V3:17). Merging overwrites it on every edit (:76), so when the app first heard of an event is lost for good. The scenarios' `told` maps to `at` (:299), which does not survive an edit.
- **What the base needs:** a creation time that never changes (`told`). A check that stores the logged lines its figure does not include yet. A rule that orders same-day events against the check by `told`.
- **Cost:** a few hours now. Later, every event made before the change has no `told` and cannot get one back.

**2. Changing a pay or bill day rewrites the past.**
- **Who:** a person whose pay moves from the 10th to the 25th in January.
- **What happens:** with the rule edited in place, as A5 and SCHEMA_V3:143 say, the model makes up pays on 25 Nov and 25 Dec. They appear in "not seen yet" and in the check-in list, ticked by default (:439). One tap writes 500,000 of income that never came.
- **Two ways of naming one payment:** links use the occurrence number `n`, but `amounts` (:134) and every item id in the model use the date. After the edit, number 2 means 10 Jan under the old rule and 25 Jan under the new one, so a settled pay can be pinned to the wrong month.
- **What the base needs:** a rule that holds from a date (`rules: [{ from, rule }]`, like `steps`), or ending the old schedule and starting a new one. One way to name an occurrence everywhere.
- **Cost:** hours now. Later, a data move that has to guess which pay each saved link meant.

**3. A card's statement is worked out as if the last one was paid exactly.**
- **Statement worked out wrongly:** the model adds up only that month's lines (:225), but a real statement is what was carried over, minus payments, plus that month's lines.
- **Partial payment:** a 50,000 statement paid with 40,000, plus 20,000 of new spending, gives a next payment of 20,000. The bank will ask for 30,000, so the number is 10,000 too low (unsafe).
- **Refund larger than the statement:** a 30,000 refund on a 10,000 statement leaves a -30,000 statement that can never be settled. The card's next payment shows -30,000 for good, and "not seen yet" lists money out of -30,000. The check-in list ticks "card payment -30,000" by default. The January statement asks for 25,000 when nothing is due.
- **Cost:** a rule change in the model now. Later, every card screen and test changes.

**4. Close day "not sure", the setup default (A8) and Mako's own case (E10).**
- **No last statement typed:** the model crashes (:203).
- **Last statement typed:** after the first payment no card item is ever made (:284-288). The card shows no next payment, "due before next pay" leaves out a 40,000 card payment, and the check-in never asks about it. The walk still takes it off, and what is owed grows by every payment the check-in never recorded.
- **Why it matters:** this is the default setup path, and no scenario tests it.

**5. A dollar card paid from a yen bank.**
- **What happens:** a statement of 500.00 dollars comes off the yen bank as 50,000 yen (:365). Card payments write one amount for both sides (:148). Safe to spend is about 25,000 too high.
- **What the base needs:** SCHEMA_V3 has `a2` but no rule saying a repay or transfer between two currencies carries both amounts. Until stage 2, the walk should refuse or warn when a card's paying account is in another currency.
- **Cost:** a rule and a field note now. Later, repays saved with one amount, and the other side cannot be recovered.

**6. The merge makes Redo impossible across devices.**
- **The rule:** "gone beats the same record without it, whatever the at" (SCHEMA_V3:76), while Redo clears `gone` (:18).
- **What happens:** Undo, push, Redo, then any merge with the pushed copy removes the record again, on every device, for good. A spend the person brought back disappears.
- **Fix:** gone wins only against an equal or older `at`.

**7. "The reference model is right" (:5), but it holds only part of the rules.**
- **What the model leaves out:** these are written only in prose, which is the lesson 2 warning sign.
  - The rules `year`, `monthsList`, `lastWorkday` and `once`. A 400,000 yearly tax disappears completely: not due, not in "later on" (:78-93).
  - Paying from a place. A trip paid from 100,000 of trip money gives safe to spend 100,000 when it should be 200,000 (:294-298 ignores `place`). A bill paid from a yearly-cost place is taken off twice.
  - Refill (E5).
  - Loan and pay-later accounts, `minRule`, `extraSteps`, cards that carry a balance.
  - autoSpend, the opening split by place (B2), `posted` on banks, `avail`, `est`.
- **Why it matters:** section 12 says "not in the model yet" only for matching, period end, merging and units.
- **What the base needs:** move these into the model with worked asks before the engine, or limit the "model is right" claim to what it covers.

## Late pay (rule stated two ways)
- **Two readings:** G3 says an item inside its posting window is "counted as expected". The walk drops any pay whose date has passed (:356), and next pay skips it (:139).
- **What happens:** pay due 10 Jan (a Sunday) is moved to Fri 8 Jan and actually arrives after the Monday holiday. On Sat 9 Jan Home says "32 days to next pay". "Due before next pay" then covers a whole month, and the period never ends.
- **Fix:** state one reading. Pay inside its posting window stays "late, expected", and the period does not move on. This is a model change, cheap now.

## WATCH
- **Same spend typed on two phones:** the cloud copy relies on import matching to catch it (:76). Two typed lines with no statement are never matched, so the spend counts twice.
- **Rough spends:** matching an import needs an exact amount for a spend (:176), so a rough (`est`) spend has no margin. A card bought in another currency, logged in yen, will come back as a duplicate once statements are imported.
- **26 or 27 pays a year:** for pay every two weeks, which count and how monthly amounts are rounded per pay are still not written down (schema_review_2 WATCH).
- **Old copies with no currency:** normalize sets '₱' when a copy has none (ui0.js:89). The move from older builds must ask, not inherit pesos. Some old builds also have `cfg.bankStart` with no `bankAt`, and the table gives that no date.
- **One-off costs:** `items[ym]` is dated the 1st of its month. For the move month that is before the opening, so it is quietly treated as paid.
- **Weekly automatic spends:** the 38.31 field `on` (the weekday) is not named in the move table. `from` may not fall on that weekday.
- **Goal kept in its own account that goes overdrawn:** the shortfall plus the whole goal comes off the headline (scenario 12). That is the safe side, but it shows a debt that is not there. Finding 7's spend-from-place rule fixes it.

## Checked and sound
- Every 38.31 field in cleanCfg, CFG_KNOWN, GOAL_KNOWN, cleanCards, cleanDebts, cleanRecurring and normalize has a target, or falls under the "kept as is" line in the table.
- A skipped bill (a `skip` that settles it).
- A top-up from the bank to an e-wallet, including one made before the e-wallet was set up: the total stays true.
- Holiday shifts, bank-closed days, pay every two weeks with three-pay months, twice-monthly unequal halves, weekly pay, a freelancer's zero month, three weeks away, a couple's one stream, cash and e-wallet in the walk, a card refund within its cycle, buys not yet posted.
- Ids, the hybrid clock, the version guard, IndexedDB stores, the device-only split, and E6 loans having one home.
- The ledger, statement import, several accounts and the 3D world all build on this shape once findings 1, 2, 5 and 6 are in the saved data.

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /tmp/foundation_v3/t.js
- /tmp/foundation_v3/t2.js
- /tmp/foundation_v3/t3.js
