# The ledger (step B1): the shape on paper, proved before any code

Side session, 2026-11-19. Reference model: `tests/next/ledger_ref.js` (tests only). Proof: `MODEL=tests/next/ledger_ref.js node tests/next/ledger_conservation.js` runs side C's 400 random event lists, eight personas (Mako, the standard Philippine team shape, and the six of the 95% sweep) and two 38.31 migrations; `MODEL=tests/next/ledger_ref.js node tests/next/ledger_fuzz.js` runs 300 random people with every account type and kind over four years. Every identity holds to the cent. Made-up numbers only. B1 is built against these two tests.

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
- Account: `id`, `name`, `type` (bank, card, ewallet, cash, wallet, paylater, loan, owedToYou), `cur` (ISO code, for example PHP), `inFull` (cards; true unless it carries an older balance), `payDay` (cards and loans: day of the month it is due), `tracked` (false only for the Wallet-mode wallet), `preset` (optional id from a presets file, for example `ph.gcash`), `confirm` (set by the move from 38.31: ask at the first check), `closed` (date; hidden, never deleted).
- Event: `id`, `k` (kind, below), `sub` (the kind the person picked, for example "family support"), `date` (YYYY-MM-DD, the day it happened, taken from the statement line, never the file name), `a` (amount, cents kept; signed only for adjust), `a2` (convert: what arrived), `acct`, `acct2`, `place`, `place2`, `typedA` (check: the balance typed), `startsPeriod` (pay only; false for a second income that does not start a new month), `src` (typed, statement and line id, receipt id, or migration; lets an import say "already logged", A8), `note`.

## Places
Waiting (where new pay waits until placed; its word comes in B2), This month (Bills left, one "for the card" line per card paid in full, Free to spend), and the burrows. A place may go below zero; it is then shown in amber, never refused (L1).

## Events (one list, dated, each with a kind)
The person sees "Money came in" and "Money went out" with a short list of kinds; underneath there are only these:

| Kind | Accounts | Places | Total |
|---|---|---|---|
| open (typed balance at the start) | that account | its place (waiting, or a burrow) | up |
| in: pay, refund, gift, grant, other | the account up (a refund onto a card lowers what is owed) | waiting, or the place it is back to | up |
| borrow: borrowed, pay-later cash | the account up, the loan up | waiting | up |
| place / move | none | one place to another | same |
| spend: spend, bill, family support, take out of a burrow | bank or cash down; or the card's owed up | the place it was for down; for a card paid in full the same amount moves into "for that card"; pay-later buys touch no place | down, or same on a card |
| hand (Wallet mode) | bank or e-wallet to the wallet | waiting down | down |
| transfer: ATM, bank to GCash, lent | one account to another | none | same |
| convert (other currency home) | foreign down, home up by what arrived | waiting up | up |
| repay: card payment, instalment, paid back | the account down, the owed account down | "for that card", or Bills left | down |
| check (a typed balance, dated) | none | none | same |
| adjust (accept the difference) | that account | Free to spend or waiting | up or down |

## How the numbers are read
- **Total** = tracked home-currency accounts added up = Waiting + This month + Burrows. **Free to spend** = its place (Track) or "handed to your wallet since pay day" (Wallet). **Bills left** = bills place + every "for the card" line. **Saved** = the burrows. Total is not the sum of the four (proof_formula.js).
- **Owed** = cards + pay-later + loans. For each card paid in full, "for the card" always equals what is on the card, so **bank after the cards are paid** = bank minus those lines (Mako's question, A5). Mid-month his Total does not drop when he pays by card; his Free to spend does, and "for Card A" grows.
- **Wallet and Track mode.** Track: Free to spend is a place and spending lowers it. Wallet: placing Free to spend hands it out of the tracked accounts (cash taken out, or moved to an e-wallet marked "my wallet"); after that it is not tracked. Someone who pays for fun things by card or from the same bank uses Track (Mako does).
- **Check your bank, per account.** The person types what each account shows. The difference from that account's events dated on or before the check's day (a statement imported later can hold older events) is "unexplained" and shown on that account only. They add what they missed, or accept it (an adjust event). "Start fresh from today" after a missed month is a check plus an adjust on every account.
- **Months without a fixed window.** The ledger is never trimmed. A month is only a view: it runs from one pay day to the next (`payDays`, for example the 10th, or the 15th and 30th; the calendar month if none), and its flow strip adds up only the events dated in it. Any month, years back or ahead, can be shown. Periods chain end to start, and each one's Total moves by exactly what came in minus what went out (tested). A second income on the same day does not start a new month. Months dropped on load (E6) are the E6 lane's test.
- **Undo.** The last event leaves the list and is kept with the saved copy, so undo and redo survive closing the page and a restore. Because nothing is clamped, every number goes back exactly.

## Moving a saved 38.31 copy (E5)
Start from today's typed balance per account: the bank figure (with its date) opens the bank, each typed card balance opens that card and sets the same amount aside for it, and goal starts open their burrows in an account "Savings from your old plan" that the first check asks the person to confirm. The old plan's figures are shown once beside the new ones. A frozen copy of the saved 38.31 copy is kept and never written again, and the ledger carries a version number that older pages refuse to overwrite.

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
6. **Card payment from another place** (fuzz): a card paid in full is always paid out of "for the card"; paying it from a burrow is a move into "for the card" first. Otherwise the line stopped matching the card.
7. **Statements imported late** (fuzz): a check compares with events dated up to its day, not with the order they were added.
8. **Cards with an older balance** (team shape): the older balance is held like a loan, so "for the card" stays equal to new spending only.
9. **New phone**: a restored backup shows exactly what was backed up, and its undo list still works.

The ledger is plain data with no device code, so iPhone and Android run the same numbers; the phone checks belong to the page tests.
