# The money door: one way in for everything that happens to your money

Side Q, 2026-11-19. Logic and tests only, no screens. Code: `wip/team/money_door.js`. Proof: `node wip/team/tests/next/money_door_test.js` (337,129 checks, PASS, no GAP line). Handoff: `LANE_money_door.md`. Made-up numbers only.

Mako's decision (DECISIONS.md, "After the concept review" point 3): two buttons, **Money came in** and **Money went out**, each with a short list of kinds and one line saying what each is for. You pick the kind and the kind decides what happens to the numbers. The labels and lines below are first drafts in plain words for the voice lane to go over.

Every kind asks **how much** and **which day** first. The other questions are listed per kind. A question in brackets is only asked when you want to change what the kind does by itself.

## Money came in

| Kind | What it is for | It asks | Total | Free to spend | Bills left | Saved | Owed |
|---|---|---|---|---|---|---|---|
| **Pay** | Your salary or what a client paid you - it waits until you give it a job | which account it landed in (is it extra pay like a bonus or 13th month) | up | same | same | same | same |
| **Borrowed** | Money someone lent you or a cash loan - you have it now and you owe it back | which account it landed in, who you owe it to | up | same | same | same | up |
| **Paid back** | Someone paid back what you lent them - it was yours all along so your total stays the same | which account it landed in, who paid you back (what it is for now) | same | up | same | same | same |
| **Refund** | Money back for something you paid for - it goes back where it came from | where it came back to (what it was for) | up | up | same | same | same |
| **Gift** | Money someone gave you, nothing to pay back | which account it landed in (what it is for) | up | same | same | same | same |
| **Sold something** | You sold something of yours and got paid | which account it landed in (what it is for) | up | same | same | same | same |
| **Other** | Anything else that came in, like interest or a payout | which account it landed in (what it is for) | up | same | same | same | same |

## Money went out

| Kind | What it is for | It asks | Total | Free to spend | Bills left | Saved | Owed |
|---|---|---|---|---|---|---|---|
| **Spent** | Something you bought - it comes out of Free to spend unless you say otherwise | what you paid with (where it comes from) | down | down | same | same | same |
| **Bill** | Rent, power, phone, anything you have to pay - it comes out of Bills left | what you paid with (where it comes from) | down | same | down | same | same |
| **Family support** | Money you sent to family - it has its own line in your bills and a surprise ask can come from somewhere else | what you sent it from (who it is for, where it comes from) | down | same | down | same | same |
| **Lent** | Money you lent or paid for someone who will pay you back - still yours but you can not spend it until it comes back | what you paid with, who will pay you back (where it comes from) | same | down | same | same | same |
| **Paid a card** | You paid your credit card bill - the money was already set aside so Free to spend does not move | which account you paid from, which card | down | same | down | same | down |
| **Paid back a loan or pay-later** | An instalment or money you gave back - you owe less | which account you paid from, which loan or who (was it taken out of your pay before it landed) | down | same | down | same | down |
| **Moved between my accounts** | Bank to GCash, cash from the ATM, dollars brought home - same money in a different spot | which account it left, which account it went to (how much landed, when it changed currency) | same | same | same | same | same |
| **Saved to a burrow** | Money you put away for later - it leaves Free to spend and stays yours | which burrow (where it comes from, which account holds it now) | same | down | same | up | same |
| **Other** | Anything else that went out, like a fee | what you paid with (where it comes from) | down | down | same | same | same |

The columns show the usual way: paid from or into a bank, e-wallet or cash, with the kind's own place. Two things change them, and the kind works both out by itself from the account you picked.

**What you paid with.**
| You paid with | What happens instead |
|---|---|
| A card you pay in full | Total stays. The amount leaves the place it was for and is set aside in "for the card" inside Bills left. Owed goes up. So Spent by card: Free to spend down, Bills left up, Total same |
| Pay-later, a loan, or a card you do not pay in full | No pile shrinks today. Owed goes up. The instalments are bills later |
| Your wallet in Wallet mode, or money in another currency | Nothing in the five moves. That money sits beside Total |

**Where it comes from.** Spent takes from Free to spend, Bill and Family support from Bills left, unless you name another place: a burrow (a surprise ask from the emergency fund), Waiting, Free to spend. A place can go below zero. It is then shown in amber, never refused.

### The less common ways, kind by kind
| Kind | Way | Total | The rest |
|---|---|---|---|
| Pay, Gift, Sold, Other in | into dollars or the wallet | same | it sits beside Total until you bring it home with Moved |
| Borrowed | cash taken on a card you pay in full | up | set aside for the card bill at once: Bills left up, Owed up, nothing to spend |
| Refund | back onto a card you pay in full | same | Owed down, "for the card" down, the place it was for up |
| Refund | back onto pay-later or a loan | same | Owed down |
| Lent | paid for someone with a card you pay in full | up | Owed up (you owe the card), Lent up (they owe you), Free to spend down and Bills left up because the card bill is yours to pay |
| Lent | paid with pay-later or a loan | up | Owed up, Lent up |
| Paid back | landed in your wallet | down | Lent down: it left Total for the wallet |
| Paid a card | a card you do not pay in full, or its older balance | down | comes out of Bills left, Owed down |
| Paid a card | paid from your wallet | same | Owed down, "for the card" down, and what the bank had set aside goes back to Waiting |
| Paid back a loan | taken out of your pay before it landed | same | Owed down, no account moves |
| Moved | to your wallet in Wallet mode | down | this is handing yourself spending money: Free to spend (handed out) up |
| Moved | dollars brought home | up | Total rises by what landed. It asks "how much landed", never a rate |
| Moved | sent into another currency | down | Total falls by what left, it now sits beside Total |
| Moved | from your wallet back into the bank, GCash or cash in Wallet mode | up | money put back: it is inside Total again, and Free to spend (handed out since pay day) goes down by it, never below zero |

## Two figures beside the five
- **Waiting**: pay that has no job yet. Pay, Gift, Sold, Other and Borrowed land here.
- **Lent**: what people owe you. It is yours and inside Total, but it is not Free to spend and it is not Saved. Lent puts the amount there, Paid back takes it out, so it always equals what the "owed to you" accounts hold (tested after every step).

Total = Waiting + Bills left + Free to spend + Saved + Lent, and that equals the tracked accounts added up, after every kind, on every picture.

## The choices I made (nobody was asked, flip any of them by using it)
1. **Seven kinds in, nine out**, the list from the brief, nothing added. Pay-later buys, taking money out of a burrow, cash on a card, interest and fees all fit an existing kind through "what did you pay with" or "where does it come from", so the list stays short.
2. **Paying a card lowers Total.** The money leaves the bank. What does not move is Free to spend, and "bank after the cards are paid". LAUNCH_CHECKLIST A4 and persona Carlo (thing 9) and Mika (thing 5) say "the total stays the same": that is true of Free to spend and of the bank-after-cards figure, not of Total as the ledger defines it (LEDGER_DESIGN.md: Total does not drop when he pays **by** card, it drops when the card is paid). The line for "Paid a card" is worded to match. For the coordinator: the checklist wording should follow the ledger.
3. **Lent takes the money out of Free to spend** (or the place you name) and holds it in its own figure. The ledger's design leaves the places alone when you lend, which would keep showing lent money as safe to spend. Total still stays the same, as the design says.
4. **Paying for someone with your card is "Lent" too.** The card is owed, they owe you, and the card bill is set aside now, so the picture stays true until they pay you back.
5. **Family support comes out of Bills left** (C1: its own line in Bills and basics, never Giving). A surprise ask names another place.
6. **Refund goes back to Free to spend** unless you say what it was for.
7. **Paid a card pays what is on the card first**, then the card's older balance (the ledger's loan account for it), as one step with one undo. A person who carries a balance just says "I paid 3,400 to my card".
8. **Paid back** needs somebody who owes you. Money back from someone you never logged as lent is a Refund.
9. **A new person** (Borrowed from, Lent to) needs only a name. The door makes the account: a loan, or "owed to you". Undoing that step takes the account out again and redo brings it back; it stays while another event still names it.
10. **Moved to the wallet in Wallet mode is the ledger's "hand"**, so it counts as Free to spend handed out.
11. **Saved to a burrow** can also move the money between two accounts in the same step (bank to a savings account), with one undo.
12. **Nothing twice (A8).** A line from a statement or a receipt that looks like money already logged (same amount, same account, same day, or within 3 days when it moves between two accounts) is not recorded: the door answers "seen" with the event it would repeat, and the person can say "it is another one". Two equal lines inside one statement are two things. A line typed by hand is always recorded, with a hint. When the person says "yes, it is the same money", `doorSame` makes the event remember that line too, so importing the same file again does not ask again.
13. **Extra pay** (13th month, a bonus, a second income) is Pay with "extra" ticked: it waits to be placed and does not start a new month.
14. Events carry `door: <kind>` and a `sub` word, so history can show the kind the person picked.

## Real situations, each mapped to a kind
LAUNCH_CHECKLIST section C:
| # | Situation | Kind | Tested as |
|---|---|---|---|
| C1 | Sending money to family, monthly and surprise asks | out: Family support (surprise: name the place it comes from) | Bea 8,000 from GCash and 6,500 from the emergency burrow, Carlo, Mika, Jun and Tess in cash, Rina 700 from Free to spend |
| C2 | Freelance pay that changes, a zero month | in: Pay with what landed. A zero month is no event at all | Bea: dollars into Wise (beside Total), a zero amount is not an event |
| C3 | Late or early pay | in: Pay on the day it lands | Carlo, Mika, Rina paid on the 27th |
| C4 | Pay in two halves, two incomes | in: Pay on each day. A second income on the same day: Pay with "extra" | Carlo 17,100 and 16,400; Jun and Tess |
| C5 | Borrowed from family, pay-later apps | in: Borrowed (cash you got). A pay-later buy is out: Spent, paid with the pay-later app | Rina borrows 1,000, Carlo's shoes on SPayLater, GGives and GLoan parts as Paid back a loan |
| C6 | Shared costs, paying for a friend | out: Lent, in: Paid back | shared rent both ways nets to her half exactly; a dinner paid by card |
| C7 | Refunds, gifts, sold something | in: Refund, Gift, Sold something, Other | each on Mako's shape, a refund onto a card |
| A4, A5 | What is owed, cards paid next month | every kind states what it does to Owed; card spending is set aside | Mako: 4,380 by card leaves Total at 152,340, Free to spend at 25,620, bank after the cards at 51,310 |
| A8 | Nothing counted twice | the "seen" answer and `src` | a bill and its receipt, a transfer on two statements, a card payment on two, dollars home on two |

The people of PERSONAS_PH.md and the habits of PH_ACCOUNTS.md:
| Situation | Kind |
|---|---|
| Cash in to GCash, ATM withdrawal, bank to bank | Moved between my accounts |
| Fee for a transfer or the ATM | Other (out) |
| Dollars in Wise or Payoneer brought home | Moved (asks how much landed) |
| Money sent abroad | Moved, home account to the other currency |
| Card bill paid | Paid a card |
| Card not paid in full, the monthly part | Paid a card (goes to the older balance by itself) |
| Interest added to a card's older balance or a loan | Bill, paid with that loan (owed goes up, no pile moves). It fits, but it reads oddly: see below |
| SPayLater, GGives, Home Credit, BillEase buy | Spent, paid with the pay-later account |
| Their instalments, GLoan, a bank loan | Paid back a loan or pay-later |
| SSS or Pag-IBIG loan taken out of pay | Paid back a loan, "taken out of your pay" |
| Borrowed from an officemate, no due date | Borrowed, with a name |
| Cash taken on a credit card | Borrowed, who: the card |
| A new phone on a 0% card plan | Spent, paid with the plan |
| A week of market and fares in cash | Spent, one line, paid with cash |
| Money taken out of a burrow and spent | Spent, where it comes from: the burrow |
| Tuition for a brother from the emergency fund | Family support, where it comes from: the burrow |
| Paluwagan, simple (the team default) | each round: Bill. The pot: Other (in) |
| Paluwagan, exact | each round before your turn: Lent to "Paluwagan". The pot: Paid back for what you put in, Borrowed for the rest. Rounds after: Paid back a loan. Tested from round one to ten: every figure ends where it started |
| 13th month pay, a bonus | Pay, "extra" |
| Deposit on a flat that comes back | Lent |
| Bank interest, cashback, a tax refund | Other (in), or Refund when it is money back for a buy |
| A gift you give | Spent (from Giving, if there is such a burrow) |

## What fits no kind
| Situation | Why | Where it belongs |
|---|---|---|
| A month where nothing landed | no money moved, so there is no event | the pay day screen takes "nothing landed" and plans the month from that (C2) |
| The app and the bank disagree, counting the cash, starting fresh after a gap | not money in or out | "Check your bank" (`ledgerCheck`, `ledgerAccept`, `ledgerStartFresh`) |
| Giving new pay its jobs, moving money between places, taking money back out of a burrow without spending it | no account moves | the placing screen (a ledger `move`). The door only has the one-way "Saved to a burrow" |
| This month's part of a card instalment arriving on the card | it happens by itself each month | `ledgerInstalment`, on a schedule, not typed |
| "I will not pay this card in full" | a change to how a card is held | the card screen (`ledgerCarryOver`) |
| Owed money moved between two owed accounts (a balance transfer, a loan that pays off a card) | no kind and no ledger kind either | the ledger's proposed `shift` |
| Interest added to what you owe | it fits "Bill, paid with the loan" but nobody thinks of interest as paying with a loan | a small "Interest" entry on the card or loan screen that records the same event |
| A wage advance from the employer | it is Borrowed, then Paid back a loan "taken out of your pay". Two entries that a person may not think of | fine as is; a hint on the pay day screen |
| One payment split over cash and a card | two entries | fine as is |
