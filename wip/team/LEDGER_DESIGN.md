# The ledger (step B1): the shape on paper, proved before any code

Side session, 2026-11-19. Reference model: `tests/next/ledger_ref.js` (tests only). Proof: `MODEL=tests/next/ledger_ref.js node tests/next/ledger_conservation.js` runs side C's 400 random event lists, eight personas (Mako, the standard Philippine team shape, and the six of the 95% sweep) and two 38.31 migrations; `MODEL=tests/next/ledger_ref.js node tests/next/ledger_fuzz.js` runs 300 random people with every account type and kind over four years. Every identity holds to the cent. Made-up numbers only. B1 is built against these two tests.

Updated 2026-11-19 by the ledger core lane (side N2), after `ledger.js` was built: the check shown is the one with the latest day; handed to the wallet goes by day; five cases where the first reference broke the one rule are now written down (see "The one rule, case by case"); the card cut-off day, card instalments and the storage key are recorded. The reference, the fuzz and the differential test (`tests/next/ledger_diff.js`) cover all of it. One command runs every proof: `bash wip/team/tests/next/ledger_core_all.sh`.

## The idea in one breath
Two lists and one rule. **Accounts** say where money sits. **Places** say what it is for. Every coin in a tracked account is in exactly one place, so the accounts added up and the places added up are the same number: **Total**. What is owed sits in its own accounts (cards, pay-later, loans), never in a place. Nothing is stored as a balance: every number is added up from dated **events**.

```
   WHERE IT SITS (accounts)                     WHAT IT IS FOR (places)
   +---------------------------+                +-----------------------------------+
   | Bank      152,340  (JPY)  |                | Waiting (new pay, not placed yet) |
   | GCash         845  (PHP)  |   same coins   | This month                        |
   | Cash           23         | =============> |   Bills left                      |
   | Owed to you   390 (Lea)   |    = TOTAL     |     incl. "for Card A" (= Card A) |
   +---------------------------+                |   Free to spend (Track mode)      |
   outside Total, shown beside it:              | Burrows (emergency, trip, Giving, |
   | Payoneer  USD 120 (other currency) |       |   Education, Investing...) = Saved|
   | Wallet (Wallet mode, handed out)   |       +-----------------------------------+
   OWED (accounts, never places):
   | Card A 61,200 (paid in full on the 10th) -> the same amount sits in "for Card A"
   | Card B 23,450 (paid in full on the 11th) -> the same amount sits in "for Card B"
   | SPayLater 6,000, loan from Tita 5,000    -> instalments are bills when due
```

## Accounts
Each account has a name, a type and a **currency**: bank, card paid in full (with its pay day), wallet or cash, e-wallet (GCash, Suica), pay-later, loan, and "owed to you" (money lent, still yours). Presets per country are names only, never a bank connection. An account in another currency (USD in Payoneer or Wise) is kept in its own currency, shown beside Total and not in it, until it is moved home; then it lands in Total at the amount that arrived.

**Cards are core** (Mako, 2026-11-19: everyone has one). A card paid in full is one account. A card that carries an older balance is two: the card (new spending, set aside as usual) and "that card, older balance", held like a loan, paid by minimum or instalment from Bills left, with interest as a spend on it. The screen shows them as one card with two lines.

**Fields** (for the statements lane and the account presets):
- Account: `id`, `name`, `type` (bank, card, ewallet, cash, wallet, paylater, loan, owedToYou), `cur` (ISO code, for example PHP), `inFull` (cards; true unless it carries an older balance), `payDay` (cards and loans: day of the month it is due), `cutDay` (cards, optional: the cut-off day, the day of the month the statement closes; see "Cards: the cut-off day and instalments"), `of` (optional: the id of the card this owed account belongs to; used by a card's older balance and by an instalment plan), `tracked` (false only for the Wallet-mode wallet), `preset` (optional id from a presets file, for example `ph.gcash`), `confirm` (set by the move from 38.31: ask at the first check), `closed` (date; hidden, never deleted).
- Event: `id`, `k` (kind, below), `sub` (the kind the person picked, for example "family support"), `date` (YYYY-MM-DD, the day it happened, taken from the statement line, never the file name), `a` (amount, cents kept; signed only for adjust), `a2` (convert: what arrived), `acct`, `acct2`, `place`, `place2`, `typedA` (check: the balance typed), `startsPeriod` (pay only; false for a second income that does not start a new month), `src` (typed, statement and line id, receipt id, or migration; lets an import say "already logged", A8), `note`.

## Places
Waiting (where new pay waits until placed; its word comes in B2), This month (Bills left, one "for the card" line per card paid in full, Free to spend), and the burrows. A place may go below zero; it is then shown in amber, never refused (L1).

## Events (one list, dated, each with a kind)
The person sees "Money came in" and "Money went out" with a short list of kinds; underneath there are only these:

| Kind | Accounts | Places | Total |
|---|---|---|---|
| open (typed balance at the start) | that account | its place (waiting, or a burrow) | up |
| in: pay, refund, gift, grant, other | the account up (a refund onto a card lowers what is owed) | waiting, or the place it is back to | up |
| borrow: borrowed, pay-later cash, cash taken on a card | the account up, the loan or card up | waiting up. On a card paid in full: "for that card" up by the same amount instead (the cash is set aside for the bill at once); if the cash lands outside Total (the wallet), the place named (or waiting) goes down by it | up (loan), up (card, cash lands in Total), same (card, cash lands outside Total) |
| place / move | none | one place to another | same |
| spend: spend, bill, family support, take out of a burrow | bank or cash down; or the card's owed up | the place it was for down; for a card paid in full the same amount moves into "for that card"; pay-later buys touch no place | down, or same on a card |
| hand (Wallet mode) | bank or e-wallet to the wallet | waiting down | down |
| transfer: ATM, bank to GCash, lent | one account to another | none | same |
| convert (other currency home, or money sent abroad) | the first account down by what left, the second up by what arrived | coming home: waiting (or the place named) up by what arrived. Sent abroad: the place named (or waiting) down by what left | up coming home, down sent abroad |
| repay: card payment, instalment, paid back | the account down, the owed account down | a card paid in full: always "for that card" down, whatever place is named. If it is paid from outside Total (the wallet), the place named (or waiting) goes up by the same amount: the money set aside in the bank is free again. Anything else owed: the place named, or Bills left | down; same when a card paid in full is paid from outside Total |
| check (a typed balance, dated) | none | none | same |
| adjust (accept the difference) | that account | Free to spend (Track) or waiting (Wallet), or the place named; on a card paid in full the same amount also moves into or out of "for that card" | up or down; same on a card |

## The one rule, case by case
For every event, two things must hold. **(1) The places move by exactly what the tracked home-currency accounts move.** **(2) Each "for the card" line moves by exactly what its card moves.** Then Total from both sides and every card line stay right for any list, in any order. Only a card paid in full **in the home currency** has a line; a card in another currency is owed beside Owed (`foreignOwed`), like money in another currency sits beside Total. The first reference model broke the rule in five cases that its random lists never drew. They are now part of the lists (second block of `ledger_fuzz.js` and `ledger_diff.js`):

| Case | Made-up example | What was wrong | The rule now |
|---|---|---|---|
| Money sent abroad | convert 5,000 from the bank to a USD account | the bank fell, no place fell: Total said 5,000 more than the accounts | the place named (default waiting) falls by what left |
| Cash taken on a card paid in full | borrow 2,000 onto Card A into the bank | the card grew, "for Card A" did not; waiting grew, so the cash looked free | "for Card A" grows by 2,000. If the cash lands in the wallet, the place named (default waiting) falls by 2,000 |
| A card paid in full, paid from the wallet | repay 1,500 of Card A from the wallet (not tracked) | the card fell, "for Card A" stayed | "for Card A" falls by 1,500 and the place named (default waiting) rises by 1,500 |
| `free` in Wallet mode | a move, a gift or a card refund into `free` while in Wallet mode | those coins left Total (Wallet mode shows no Free to spend place) | in Wallet mode `free` is read as waiting, so a copy that switches mode keeps every coin in sight |
| Handed to the wallet, by order added | pay on the 10th, hand 5,000 on the 10th, then a late line "hand 700 on the 8th" | shown 5,700 since pay day | by the day of each event (same day: the order added): 5,000 |

## How the numbers are read
- **Total** = tracked home-currency accounts added up = Waiting + This month + Burrows. **Free to spend** = its place (Track) or "handed to your wallet since pay day" (Wallet; counted by the day of each event, from the latest pay that starts a month, never by the order the events were added). **Bills left** = bills place + every "for the card" line. **Saved** = the burrows. Total is not the sum of the four (proof_formula.js).
- **Owed** = cards + pay-later + loans. For each card paid in full, "for the card" always equals what is on the card, so **bank after the cards are paid** = bank minus those lines (Mako's question, A5). Mid-month his Total does not drop when he pays by card; his Free to spend does, and "for Card A" grows.
- **Wallet and Track mode.** Track: Free to spend is a place and spending lowers it. Wallet: placing Free to spend hands it out of the tracked accounts (cash taken out, or moved to an e-wallet marked "my wallet"); after that it is not tracked. Someone who pays for fun things by card or from the same bank uses Track (Mako does).
- **Check your bank, per account.** The person types what each account shows. The difference from that account's events dated on or before the check's day (a statement imported later can hold older events) is "unexplained" and shown on that account only. **The check shown for an account is the one with the latest day** (two on the same day: the one added last), never just the one added last. Made-up case: check the bank on 2026-12-09, then import an older statement holding a check dated 2026-10-01; the screen keeps showing December's gap, and October's shows only when looking at October. They add what they missed, or accept it (an adjust event). "Start fresh from today" after a missed month is a check plus an adjust on every account.
- **Months without a fixed window.** The ledger is never trimmed. A month is only a view: it runs from one pay day to the next (`payDays`, for example the 10th, or the 15th and 30th; the calendar month if none), and its flow strip adds up only the events dated in it. Any month, years back or ahead, can be shown. Periods chain end to start, and each one's Total moves by exactly what came in minus what went out (tested). A second income on the same day does not start a new month. Months dropped on load (E6) are the E6 lane's test.
- **Undo.** The last event leaves the list and is kept with the saved copy, so undo and redo survive closing the page and a restore. Because nothing is clamped, every number goes back exactly.

## Cards: the cut-off day and instalments
Both read or use what is already there. Neither changes any figure of `placesOf`: "for the card" still equals everything on the card.
- **`cutDay`** is an optional account field on a card: the day of the month its statement closes (1 to 31; a day past the end of a short month falls on its last day). `payDay` alone cannot say what is due on the next pay day. `ledgerCardDue(S, card, day)` splits what is on the card: **due** = everything on the card up to the last cut-off, less what was paid or refunded since (payments meet the statement first); **later** = what was added after the cut-off, owed and set aside already but due a month later. due + later is always what is on the card. Without `cutDay` everything is due. Made-up case: 9,000 on the card, spend 3,480 on the 12th, cut-off the 17th, spend 2,600 on the 18th: due is 12,480, later is 2,600.
- **A card instalment** (0% or with interest). The plan is its own owed account: type `paylater`, with `of: <card id>`, holding the months still to come. The buy is a spend on the plan, so like any pay-later buy it touches no place. Each month `ledgerInstalment(S, plan, card, amount, day, place)` moves one part from the plan onto the card as **two adjusts recorded as one step** (same `grp`, sub `instalment`): the plan down by the amount, the card up by it. On the card it is set aside like any card spending: the place named (default Bills left) down, "for the card" up. Owed in all and Total do not move. One undo takes both back. Add-on interest is a spend on the plan. A kind of its own for moving owed money between two owed accounts (`shift`) would read better in history; proposed, not built.
- **A card's older balance** works the same way: `ledgerCarryOver` moves the unpaid part to a loan account with `of: <card id>` as two adjusts in one step, and the money that was set aside for it goes back to Bills left.

## Moving a saved 38.31 copy (E5)
Start from today's typed balance per account: the bank figure (with its date) opens the bank, each typed card balance opens that card and sets the same amount aside for it, and goal starts open their burrows in an account "Savings from your old plan" that the first check asks the person to confirm. The old plan's figures are shown once beside the new ones. A frozen copy of the saved 38.31 copy is kept and never written again, and the ledger carries a version number (`ledgerV`).

**Storage: a new key, and one guard for everything that writes.** The version number alone does not protect the ledger, because pages already shipped (38.31 and older) do not know `ledgerV`. They keep the `rev` rule, but an old page opened later can still save with a higher `rev`, and it rebuilds the state on load, which can drop the ledger fields. So:
1. **The ledger is saved under a new storage key.** The old key stays as it is: the 38.31 copy, which old pages may go on reading and writing without ever touching the ledger. The move reads the old key once and never writes it.
2. **Every writer asks `ledgerMayWrite(stored)` first** and does not write when it says no (the stored copy has a higher `ledgerV` than this page knows). That means the local save, the merge from another tab, a restore from a backup file, and **anything that uploads, above all the cloud copy**: before an upload replaces the copy on the server, the copy on the server goes through the same guard. A cloud copy made by a newer page is never replaced by an older page. On a no the page says "update the app" and keeps both copies.
3. The cloud copy of a ledger must not be stored where a 38.31 page would download it as its own save (a new key or a new kind there too), for the same reason as point 1.

## Defaults for side C's questions (notes for Mako, flip by using it)
- **W1** 12 months back plus 24 ahead for the plan view, as side C suggested; the ledger itself is never trimmed. **W2** kept and shown in Look back. **W3** store the month with it; after B1 the bank start is a dated opening event, so the question goes away.
- **L1** the place goes below zero, in amber; refusing would hide real spending. **L2** yes, undone events are saved with the ledger (redo too; a new event clears redo). **L3** each account is compared with its own events; Wallet money has left the tracked accounts, so it never shows as unexplained. **L4** handed to the wallet since the last pay day.
- **M1** the bank start opens the bank account and sits in Waiting, less what is set aside for the cards. **M2** typed figures only; the old plan's figures shown once beside. **M3** the bank opens below zero and Waiting below zero, in amber ("your next pay fills this first"); not added to Owed, so it is never counted twice. **M4** Education, Giving and Investing start at zero; their old plan totals are shown once. **M5** old receipts stay as history; the ledger starts on the day of the move. **M6** out of scope; pre-25 copies go through the existing clean-up first.

## What the persona runs changed
1. **Refund onto a card** (Japan): money in on a card lowers what is owed and gives the place back from "for the card". Without it the card was owed twice.
2. **Other currencies** (Philippine freelancer, USD in Payoneer): kept outside Total in their own currency and brought in by "convert" with both amounts. One Total in one currency cannot add pesos and dollars to the cent.
3. **Lending and shared rent** (France): "owed to you" is an account inside Total, not spending, so paying all the rent and being paid half back nets out exactly.
4. **Pay-later buys** (Philippine salaried): bought with borrowed money, they touch no place; the instalments are bills.
5. **Missed month** (start fresh): Waiting can go below zero after the adjust, so L1's amber rule covers Waiting too.
6. **Card payment from another place** (fuzz): a card paid in full is always paid out of "for the card", whatever place is named. Otherwise the line stopped matching the card. (An earlier note here said paying it from a burrow is "a move into for the card first". That was wrong: such a move would make the line larger than the card. No move is needed, because a card spend already names the place it was for.)
7. **Statements imported late** (fuzz): a check compares with events dated up to its day, not with the order they were added. For the same reason the check shown is the one with the latest day, and handed to the wallet goes by day.
8. **Cards with an older balance** (team shape): the older balance is held like a loan, so "for the card" stays equal to new spending only.
9. **New phone**: a restored backup shows exactly what was backed up, and its undo list still works.

The ledger is plain data with no device code, so iPhone and Android run the same numbers; the phone checks belong to the page tests.
