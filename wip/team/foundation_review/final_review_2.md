(qc-foundation final review 2, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

I ran 12 new situations through the references. Scripts are in /tmp/foundation_final2/ (s1 to s11, base.js). The team's checks still pass: 356 of 356 asks and 223 of 223 cases. Seven findings would need an engine or saved-data change if they are left until later. None of them repeats an earlier review.

## FOUNDATIONAL

**1. A statement line that meets a two-sided record (a transfer, card payment, borrow or convert) is counted twice or loses a side.**
- Who: everyone who imports statements. That is Mako's way in (E4).
- Moment: 10,000 cash is typed as bank to cash. Or Mako ticks the 50,000 card payment at the check-in. Then the bank statement arrives, showing a plain line out.
- What the model does: `dirOf` makes a transfer or repay its own direction (lookahead_ref.js:29), so the line never matches. Result: bank 80,000 when it should be 90,000, and 200,000 when it should be 250,000 (s1). An import read as a repay crashes the model (:176).
- What matching_ref does: it replaces the typed transfer (gone) with a one-sided line, so the 10,000 in cash disappears (s1d).
- SCHEMA_V3 6.4 says lines match "by account, direction" but never says what a one-sided line does to a two-sided record. `posted` and `src` exist once per event, yet a top-up appears on both the bank's and the e-wallet's statement, on different days.
- What the base needs: an import line that matches one side attaches to the record (sets that side's posted date and source) and never replaces it. That means a posted date and a source for each side (for example `posted2`, `src2`), plus asks in both references.
- Cost now: hours. Later: double counts already saved look like real spends, and the two sides cannot be pulled apart.

**2. Fees cannot be saved.**
- Who: Philippine top-ups (15 pesos), Japanese ATM fees (110 to 220 yen), loans paid out net of fees.
- SCHEMA_V3 6.2: "Between two accounts in one currency `a2` is left out." A 1,000 top-up that costs 1,015 can only be saved as 1,015 on both sides. The e-wallet then shows 1,015 when it holds 1,000 (s4). A transfer schedule also has only one amount.
- What the base needs: `a2` whenever what arrived differs from what left (or a `fee` field), and a fee on transfer schedules.
- Cost now: one rule. Later: e-wallet histories are wrong by the fees, and the fees cannot be recovered.

**3. New money owed on a loan, pay-later account or card instalment plan is never counted.**
- Borrowing on a loan: `borrow` is card-only (O5). loanInfo reads only repays (:584). A 500,000 draw lands in the bank, the loan still shows 0 owed, no payment is expected, and headroom is 600,000 (s3). The ledger says a borrow raises the loan (LEDGER_DESIGN:46).
- Pay-later: SCHEMA_V3:106 says "the buy is a spend on this account", but the model ignores it. A 30,000 buy leaves 0 owed (s3b). `instalments` is a single object, so it cannot hold a second plan at once (GGives, Atome, Paidy).
- Card instalments: a 120,000 laptop in 12 parts shows 120,000 due, and 110,000 after the first part is paid. The right figure is 10,000 each time (s9).
- `of` has no rule and no ask anywhere, which breaks H7.
- What the base needs:
  - Where an instalment buy is saved: on the card with a plan field, or on its own account with `of`.
  - A list of plans.
  - Borrow and spend raising what is owed on a loan or pay-later account.
  - Asks for all of the above.
- Cost now: about a day. Later: buys already saved on the wrong account, and a data move that has to guess.

**4. Pay in another currency is counted as if it were in the account's currency.**
- A schedule may carry `cur` (SCHEMA_V3:136), but the model uses the account's currency (:246). A 1,000 USD pay into a yen bank counts as 1,000 yen (s5b). A yen salary into a peso bank would count as pesos, about 2.7 times too high, which is unsafe.
- `in` has no second amount (6.2), so the dollar figure of a settled pay is lost.
- What the base needs: the H5 rule for income (not counted in the walk until stage 2, with a warning) and `a2` allowed on `in`.
- Cost now: small. Later: settled pays saved without their original amount.

**5. A spend the app logs by itself comes back after it is removed.**
- Moment: a parent paid the gym fee, so the person removes the logged spend.
- The removed `auto:gym@…` no longer settles the occurrence, so the model writes it again: bank 92,000 when it should be 100,000 (s2, :272).
- With two devices, the second device's newer rewrite brings it back after a merge.
- What the base needs: a removed `auto:` record settles its occurrence as "did not happen" (or Undo writes a `skip`).
- Cost now: one rule. Later: an engine change, and spends that can never be removed.

**6. The first import line in the file settles the pay, not the closest one.**
- Moment: pay of about 250,000 (`vary` 0.3). A 200,000 deposit is returned on 22 Mar, and the real 262,000 pay lands on 25 Mar.
- The deposit settles `pay@03-25` and starts the period three days early. The real pay becomes plain money in (s8, s8b; matching_ref step 3, model :255).
- `settles` is saved at import time.
- What the base needs: across the whole import, the line nearest the landing day settles the item (then the nearest amount).
- Cost now: one rule and cases. Later: wrong settles already saved, and period starts moved.

**7. A removed goal's move to Waiting has an ordinary id, so two devices double it.**
- Moment: the goal is removed on both the phone and the laptop before they sync. The merge keeps two 50,000 moves, so Waiting holds 100,000 from a goal of 50,000 (s11).
- P6's closing transfer has the same gap.
- What the base needs: built ids, for example `rm:<place>` and `close:<account>`, in O2's list and in `idFor`.
- Cost now: tiny. Later: duplicates nobody can tell from real records.

## WATCH (stage 2, no field needed now)

- **Card with two holders:** set it up as one account, with `owner` on each event (both already exist). If two card accounts are made, one combined bank debit settles neither: matching is one line to one item, although `settles` is a list. Matching by sum is a stage 2 rule.
- **Travel spending on the home card:** the original dollar amount is not stored. Unknown fields are kept, so `orig: { a, cur }` can be added later without a data move. A rough line at 6.9% over, posted 8 working days late, still matched by its buy date (s6, OK).
- **Pending hold:** a 15,000 hold gives a 15,000 filler, then -15,000 when it drops. No gain question is asked and it corrects itself (s7). A period end in between shows a false overspend, which P5's "found later" path covers.
- **A card or bill paid by someone else:** a repay with no paying account works in the model (s10, OK), and `skip` works for a bill. Write down that a repay may have no paying account.
- **P decisions, checked as asked:**
  - P1 is sound if the move into Waiting can be identified. Finding 7 makes it so.
  - P2: SCHEMA_V3 7.4 and 6.2 still say answers are `move` events. Write down the record with `moves`, and make place balances read it.
  - P3, P4 and P5 are sound.
  - P6: a balance that can never be withdrawn (a few pesos in a dead e-wallet) needs to be written off as a spend at closing, not only moved out by a transfer.

## Checked and sound

- A returned deposit, a tax refund and an insurance claim: the bank figure is right, and if the money was not logged the check-in asks about the gain.
- A yearly-changing amount via `steps`.
- Someone else paying a bill, via `skip`.
- A non-auto bill left unticked keeps counting (the safe side).
- **Agreement between the documents:** SCHEMA_V3, the model and the rules files agree everywhere else I looked. The three gaps are matching direction (finding 1), borrow and pay-later buys (finding 3), and P2's record shape.
- **Planned features:**
  - The 3D world (ACT only) and the ledger base: sound.
  - The cloud copy: sound once 5 and 7 are fixed.
  - Statements: need 1, 3 and 6.
  - Several accounts: need 1 and 2.
  - A second currency: needs 4.

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/SCHEMA_V3.md
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/matching_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /tmp/foundation_final2/ (base.js, s1_import_meets_transfer.js, s1d_matching_ref.js, s2_auto_paid_by_other.js, s3_loan_mid_year.js, s4_fees.js, s5_second_currency_pay.js, s5c.js, s6_travel_card.js, s7_pending_hold.js, s8_deposit_back.js, s8b.js, s9_card_instalments.js, s10_paid_by_someone_else.js, s11_two_devices_remove_goal.js)
