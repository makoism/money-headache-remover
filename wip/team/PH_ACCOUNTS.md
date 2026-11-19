# Where people in the Philippines keep and owe money

Side L, 2026-11-19. For the account presets (LAUNCH_CHECKLIST A2), the team gate and the statements lane (D5).
Data and docs only. The presets are in `presets_ph.json`, the test people in `PERSONAS_PH.md`.

## How to read this
- Every fact has its source and the date of the source. All lookups were done by web search on 2026-11-19.
- **[checked]** means a news or official source said it in the search results. **[thin]** means only blogs or one weak source said it. **[not found]** means the search found nothing I would trust. **[known, not searched]** means general knowledge that today's search did not confirm.
- Two official help sites could not be opened from this session (help.gcash.com, help.bpi.com.ph: not in the session's allowed network list). What is written about them comes from the search engine's summary of those pages, not from reading the page myself. Allow those hosts if the statements lane needs to read them.
- No real person and no real figures of anyone we know. Market figures are public numbers from the sources named.

## The short version
1. **More adults have an e-wallet than a bank account.** In the latest survey, 43% of adults had an e-money account and 21% a bank account. GCash is by far the biggest, Maya second. So GCash sits at the top of the list beside cash, not under "other".
2. **Cash is still everywhere.** Digital payments were 64.7% of retail payments by count in 2025, which leaves about a third in cash. "Cash on hand" must be a first-class account.
3. **Our users are not the average.** Mako says to assume everyone has a card. Nationally there are only about 18.5 million credit cards for the whole country. So for the team: bank + GCash + cash + a card is the base shape, with pay-later on top.
4. **Pay-later is common and comes in three shapes:** one bill next month, fixed monthly instalments, and a credit line. All three are money owed. About one in four consumers use it.
5. **Pay usually lands twice a month** (15th and 30th) for local employees. Monthly pay is the app default by Mako's decision; two pay days must be one tap away.
6. **Money goes to family.** About two in three people give money to relatives. It is a monthly line plus surprise asks.
7. **Statements are PDFs, mostly locked with a password.** Three kinds of password: a fixed rule built from your own details (GCash, BDO cards), told in the email (BPI cards), or chosen by you at download (UnionBank). CSV or Excel is rare for personal accounts.

## 1. How many people use what
| Fact | Source and date | Status |
|---|---|---|
| 58% of adults (18 and over) have a formal account, up from 48% a year before. 43% have an e-money account, 21% a bank account. 1,500 people, 24 to 31 March 2026. | SWS survey for the BSP, Q1 2026; Philstar 2026-05-24 (philstar.com/business/2026/05/24/2530020), PNA (pna.gov.ph/articles/1275692) | [checked] |
| BSP's own 2025 survey: account ownership about 50%, e-money 36%, bank 23%. A different survey, so not a clean trend. | BSP 2025 Consumer Finance and Inclusion Survey; Inquirer (business.inquirer.net/585729) | [checked] |
| Digital payments were 64.7% of retail payments by count in 2025 (57.4% in 2024), 53.3% by value. | BSP report; BusinessWorld 2026-08-18, Inquirer (business.inquirer.net/606328), GMA | [checked] |
| About 18.5 million credit cards outstanding at the end of 2025. | Credit Card Association of the Philippines, cited by 2C2P (2c2p.com/blog/philippines-payment-methods) | [thin] one secondary source |
| About 26% of consumers use buy now, pay later. | TransUnion 2026, cited by a 2026 pay-later guide found in the search (which site: not kept) | [thin] |
| 68% of people surveyed give money to relatives; 17% support both parents and children. | Manulife Asia Care Survey 2026 (manulife.com/ph, "Independence as the new legacy"), Manila Bulletin 2026-08-06 | [checked] |
| Cash sent home by Filipinos abroad: about USD 35.6 billion in 2025. | BSP figure through a secondary source | [thin] |

## 2. The places, kind by kind
Each kind has one plain line for the picture: is it money you have, money you owe, and when it leaves the bank.

### Cash
**Money you have. It already left the bank the day you withdrew it.**
- Wallet cash, cash at home, the envelope for the month. ATM withdrawals are a move from bank to cash, not spending.
- In Wallet mode (LEDGER_DESIGN.md) cash handed out is no longer tracked. In Track mode it is an account to check like any other: count it, type it.

### Banks (the usual ones)
**Money you have. It leaves when you pay, move or withdraw it.**
| Bank | Why it is on the list | Source |
|---|---|---|
| BDO | Largest bank by assets (about ₱5.7 to 5.9 trillion in 2026); very common for payroll | Daily Tribune 2026-04-17, 2026-10-21 | 
| BPI | Third by assets (about ₱3.7 trillion, Q1 2026); common for payroll | same |
| Metrobank | Second by assets (about ₱3.8 trillion, Q1 2026) | same |
| Landbank | State bank, third in deposits (₱3.04 trillion, Q1 2026); government and many company payrolls, provinces | same |
| UnionBank | Top in Visa credit card payment volume in 2025; strong app | Philstar 2026-06-16 |
| Security Bank | Seventh among the big banks (about ₱1.57 trillion, March 2026) | blog, [thin] |
| RCBC, PNB, China Bank, EastWest | Large retail banks | [known, not searched] no figures found today |

Rank is by size, not by number of customers. No source today gave customer counts per bank. [not found]

### Digital banks
**Money you have, usually savings set aside for the higher interest. It leaves when you move it back to a spending account.**
- Seven licensed digital banks. MariBank (the Shopee group's bank, known before as SeaBank) became the seventh in July 2026. The others: Maya Bank, GoTyme, Tonik, UNO, UnionDigital, OF Bank. Source: Philstar 2026-07-25. [checked]
- Together about 20 to 22 million depositors and over ₱100 billion in deposits by late 2025. Source: Inquirer (business.inquirer.net/536970) and BSP-based reports. [checked, figures differ by report]
- CIMB Bank PH is app-only too and sits inside GCash as "GSave by CIMB". [known, not searched]
- What people do with them: park the emergency fund or a goal there. That maps straight onto a burrow.

### E-wallets
**Money you have, like a bank you spend from daily. It left the bank when you cashed in.**
- **GCash:** about 90 million and more registered users (2025 and 2026 figures, blogs); about 89% of the local wallet market in 2023 data. [thin on exact numbers, clear on rank]
- **Maya:** second. It is a wallet and a bank in one app (wallet, Maya Savings, credit). [checked on rank]
- Smaller: ShopeePay, GrabPay, Coins.ph, and the wallets inside TikTok Shop and Lazada. People hold small leftovers there. One "Other e-wallet" covers them.
- Things that sit inside GCash and matter: GSave (a real bank account at CIMB or another bank), GFunds (investments), and the borrowing products below. A person says "my GCash" and may mean four different things. The preset list keeps them apart.
- Moving money between bank and wallet (InstaPay) is a transfer. It can cost a small fee (often around ₱10 to ₱15 from a bank [known, not searched]); that fee is spending.

### Credit cards
**Money you owe. It is already spent, but it leaves the bank only on the due date.**
- Main issuers: BDO (largest issuer by Euromonitor's 2026 summary), BPI, Metrobank, UnionBank (top Visa volume 2025, about 2 million cards), RCBC, Security Bank, EastWest. Sources: Euromonitor "Credit Cards in the Philippines" summary, March 2026; Philstar 2026-06-16; Manila Bulletin 2026-03-11. A full share table is behind a paywall. [checked on names, not on shares]
- **Cut-off and due date.** The issuer picks the statement cut-off day (the end of the billing cycle). The due date comes about 20 days later; MariBank's card paper says exactly 20 calendar days. Other issuers are likely 20 to 25 days. [thin: one issuer's document, the rest known, not searched]. If the due date falls on a weekend or holiday it moves to the next business day (RA 10870). [checked]
- So each card needs two days of the month: **cut-off day** and **due day**. What is spent after the cut-off is owed but not due until the month after. This is the heart of A5.
- **Interest.** The BSP cap stays at 3% a month on unpaid balances (circular signed 2026-11-10). In the same circular the cap on card instalment add-on interest went up to 1.5% a month and the cash advance fee to ₱300. Source: BusinessWorld 2026-11-12, Manila Bulletin 2026-11-12. [checked; may take effect 15 days after publication]
- **Three ways people use a card, three different pictures:**
  1. Paid in full each month (Mako's shape): the whole statement leaves the bank on the due date.
  2. Minimum or part paid: the rest stays owed and grows by interest. The statement shows a "minimum amount due".
  3. Instalment on the card (0% for 3 to 24 months, or balance conversion): only this month's slice is in the statement, but the whole remaining amount is owed.
- Card instalments are very common for phones, appliances and tuition. [known, not searched]

### Pay-later and instalment apps
**Money you owe. It leaves your wallet or bank on each due date, often by auto-deduction.**
| Service | Shape | Due dates | Source |
|---|---|---|---|
| SPayLater (Shopee) | One bill next month at 0%, or 3, 6 or 12 instalments with 1 to 5% a month | Due date fixed to the 5th or the 15th; bill issued 10 days before | Shopee PH help (help.shopee.ph article 81313, 170712), read 2026-11-19 [checked] |
| GGives (GCash) | Instalments, up to 24 months | Monthly, on the day shown in the app; auto-deducted from the GCash wallet when due | GCash help and promo pages (gcash.com/promos, help.gcash.com 4409087639065) [checked through search summary] |
| GCredit (GCash) | A credit line, like a small card | Monthly statement by email; late fees ₱200, then ₱300, then ₱400 | expressway.ph 2026 [thin] |
| BillEase | Instalments 2 to 12 months (about 3.49% a month), plus a credit line | Per plan; can auto-debit; payable by InstaPay, e-wallet or over the counter | blogs and billease.ph FAQ [thin] |
| Home Credit | In-store instalments for phones and appliances, also cash loans; over 10 million customers since 2013 | Monthly | Moneymax and 2026 guides [thin] |
| Atome | Split in 3 payments 30 days apart, or pay within about 40 days; also a card and cash loans | Per purchase | 2026 comparison blogs, Google Play listing 2026-11-13 [thin] |
| LazPayLater (Lazada) | Credit limit for Lazada orders | Monthly | Moneymax [thin] |
| TikTok Shop PayLater | Named by the coordinator | | [not found] in today's search; covered by "Other pay-later" |

What matters for the picture:
- A pay-later buy is bought with borrowed money. It raises what is owed and touches no place (LEDGER_DESIGN.md point 4). The instalments are bills.
- People hold several small plans at once, each with its own due day. The app needs "what is due before my next pay" across all of them, more than it needs each plan's detail.
- GGives and GLoan take the money out of the GCash wallet by themselves on the due date. If the wallet is empty, the person is late. A reminder "cash in ₱X to GCash by the 4th" is real help.

### Loans
**Money you owe, a fixed amount on a fixed day each month. It leaves the bank or wallet on that day, or comes straight out of your pay.**
- **GLoan (GCash):** cash loan into the wallet; about 1.59% to 6.99% a month plus a 3% processing fee; auto-deducted on the due date. Sources: Globe and Moneymax guides. [thin on rates]
- **SLoan (Shopee), Maya Credit and Maya Personal Loan, Tala (₱1,000 to ₱25,000), BillEase cash loan, Home Credit cash loan:** same shape. [thin or known, not searched]
- **Bank personal loan, car loan, home loan:** fixed monthly amount, usually auto-debited. [known, not searched]
- **SSS and Pag-IBIG salary loans:** repaid by payroll deduction, so the person never sees the money leave; the pay that lands is already smaller. They are owed all the same. [known, not searched]
- **Borrowed from family, a friend or an officemate:** no statement, no fixed date. C5 covers it ("Borrowed"). Needs only a name and an amount.
- Cash loans add money you have and money you owe by the same amount on the same day (the "borrow" event).

### Money from abroad: freelancers and remote workers
**Money you have, but in dollars, until you bring it home. It counts in the peso picture on the day it lands in a peso account, at the amount that landed.**
- Routes: PayPal, Wise and Payoneer, withdrawn to a bank (BPI, BDO, UnionBank) or to GCash. Upwork and other platforms pay out through these. Sources: 2026 freelancer guides (grey.co, itsourcecode.com, payoneer.com country guide). [thin: blogs, and they disagree on which ones reach GCash directly]
- Common habit: leave dollars in Wise or Payoneer and bring them home when the rate is good or when rent is due. So there is a real dollar balance sitting outside the peso picture (A9; LEDGER_DESIGN.md keeps it beside Total).
- Fees and the exchange rate eat part of each pay. The person knows what the client paid in dollars and what landed in pesos; the app should ask only "how much landed?" (C2).

## 3. Habits that change the picture
| Habit | What it is | What it means for the picture | Source |
|---|---|---|---|
| Pay on the 15th and 30th | Local employers pay twice a month. The Labor Code asks for wages at least every two weeks or twice a month, no more than 16 days apart (Art. 103). | Two pay days, each placing its half (C4). Bills fall into "the 15th pay" or "the 30th pay". When the day is a weekend, pay often lands the Friday before. | [known, not searched: today's search did not return the article text] |
| Monthly pay | Remote staff of foreign companies, some managers, Mako's team. | The app default, by Mako's decision. | DECISIONS.md |
| 13th month pay | One twelfth of the year's basic pay, by law, paid no later than 24 December. Some employers pay half mid-year. Tax free up to ₱90,000 together with other benefits. | A known extra pay day in December. It should be asked about in setup or in November, and placed like any pay, with a nudge to give it a job before it is spent. | PD 851; TRAIN law; Grant Thornton PH, laborlaw.ph [checked] |
| Christmas bonus, mid-year bonus | Not required by law; common. | "Other money in", or an extra pay. | [known, not searched] |
| Card cut-off and due date | See cards above. | What is on the card now is spent but still in the bank. Show "bank after the cards are paid" (A5). | above |
| Pay-later due on the 5th or 15th | SPayLater's fixed due dates sit right after the two pay days. | Instalments are bills on dates (A6). | Shopee PH help |
| Sending money to family | About two in three give money to relatives. Usually a fixed amount each pay day, plus surprise asks (hospital, tuition, a repair). Sent by GCash, bank transfer, or cash. | Its own line in Bills and basics (C1), never under Giving and never shameful. Surprise asks need a one-tap "Family support" out. | Manulife 2026 [checked] |
| Paluwagan | A group of people each put in a fixed amount every week or pay day. Each round, one member takes the whole pot. Not regulated. Share of people using it: 4% of adults in one reading of a BSP survey, 14.8% of households in another. | Before your turn: money you put in is still yours, owed to you by the group. After your turn: you got a lump sum and you owe the rounds left. Either way the contribution is a fixed bill each pay day. See the open point below. | Moneymax, Digido, finmerkado [thin, numbers conflict] |
| Cash on hand | A third of retail payments by count are still cash; markets, tricycles, small stores. | Cash is an account. Small cash spending is where Wallet mode earns its keep. | BSP 2025 figure above |
| Cashing in and out | Bank to GCash, GCash to bank, ATM withdrawals, over-the-counter cash-in. | Transfers, not spending. Fees are spending. | [known] |
| "Utang" between people | Lending to and borrowing from friends, family, officemates. | "Lent" makes an "owed to you" account; "Borrowed" makes a loan (C5, C6). | [known] |
| Government deductions | SSS, PhilHealth, Pag-IBIG and tax come out before pay lands. Freelancers pay their own. | The app works from what landed. A freelancer's own contributions are bills. | [known, not searched] |

## 4. What statements each provider gives
For the statements lane (D5, H4). "Locked" means the PDF needs a password to open.

| Provider | How you get it | File | Locked? | Password rule | Source and status |
|---|---|---|---|---|---|
| GCash wallet | In the app: Transactions, request history for a date range (up to 4 years). It is emailed, subject "Your GCash Transaction History". | PDF only | Yes | Last name in lowercase plus the last 4 digits of the mobile number, for example `delacruz1234`; ñ is typed as n | GCash help article 360034155433, through the search summary [checked, page not opened by me]. Open-source readers for this PDF exist on GitHub, so the layout is a stable table. |
| GCash GCredit | Monthly statement by email | PDF (likely) | not found | not found | expressway.ph 2026 [thin] |
| GGives, GLoan | Schedule and history in the app only, as far as found | in-app | | | [not found] |
| Maya (wallet, savings) | Monthly "Maya Savings" statement of account exists as a PDF (user copies are named MayaSavings-SoA...). Official steps for a personal account were not found. | PDF | not found | not found | Scribd copies only [thin] |
| BDO credit card | eSOA emailed each month | PDF | Yes | Built from your date of birth. The default changed on 2025-06-15 from day first (`08Jan1985`) to month first (`Jan081985`). Older statements keep the older rule. | bdo.com.ph "New eSOA Password" [checked] |
| BDO deposit account | BDO Online, after enrolling the account for Statement of Account: view, save or print | PDF. CSV is confirmed for BDO Business Online only | not found | not found | nook.com.ph guide [thin] |
| BPI deposit account | BPI app: More, My Statements, pick account and dates, Download | PDF | not found | not found | BPI help, through the search summary [checked, page not opened by me] |
| BPI credit card | eStatement by email; also "My statements" in the app | PDF | Yes | Not published; the email says how | bpi.com.ph credit card eStatement page [checked] |
| Metrobank deposit account | Metrobank app: pick the account, "Download Statement", choose the format. Paper statements have ended. | A choice of formats (which ones: not found) | not found | not found | Metrobank post, 2024-11; metrobank.com.ph [checked] |
| Metrobank credit card | eSOA by email | PDF | Yes | not found | metrobankcard.com [checked that it is locked] |
| UnionBank account | UnionBank Online on the web: open the account, download, pick PDF or Excel and a date range | PDF or Excel | Yes | You choose the password yourself at download | Medium guide and an older guide [thin] |
| Landbank, RCBC, Security Bank, PNB, China Bank, EastWest | | | | | [not found] today. Security Bank has an SMS eSOA request for cards (securitybank.com blog). |
| GoTyme, MariBank, Tonik | Statements exist as PDFs (user copies seen); steps not found | PDF | not found | not found | [thin] |
| SPayLater, BillEase, Home Credit, Atome | Bills and history in the app | in-app | | | [not found] |
| Wise | Web or app, per currency, up to 365 days per file | PDF, CSV, XLSX (web also MT940, QIF, CAMT.053) | No | | wise.com/help article 2736049 [checked] |
| PayPal | Reports: activity download, up to 12 months per request, 7 years back; monthly statements | CSV, PDF (also TAB, Quicken, QuickBooks) | No | | paypal.com/cshelp article help145 [checked] |
| Payoneer | Transactions export; monthly statement | PDF or CSV | No | | Payoneer help answer 27046 [checked] |

### What a line looks like, provider by provider
Looked up on 2026-11-19 (second pass, for the statements lane). Honest state: only GCash is well described in public. For the banks, the public sources are converter sites and copies people uploaded, which agree on the general shape but not on exact headers. **Nothing below replaces opening one real statement of each kind.** Maps to the ledger's event fields: `date` from the line (never the file name), `a` from the amount columns, `src` = the statement plus the line's reference number, which is what lets an import say "already logged" (A8).

**GCash wallet history (PDF, locked)** [checked: two open-source readers and several uploaded copies agree]
| Thing | What it is |
|---|---|
| Columns, in order | `Date and Time`, `Description`, `Reference No.` (with the full stop), `Debit`, `Credit`, `Balance` |
| Date | Year first, 24-hour time, like `2025-10-02 08:22` (seen in one copy; confirm on a real file) |
| Amounts | Two columns. Debit is money out, Credit is money in. One of the two is empty on each line. |
| Running balance | A `Balance` column on every line: the wallet balance after that line |
| First and last rows | A `STARTING BALANCE` row before the first line and an `ENDING BALANCE` row after the last. They are not transactions. |
| Line id | The reference number, one per line. Long descriptions wrap onto extra lines; readers anchor each line on its reference number. |
| Self-check | Starting balance plus credits less debits equals the ending balance, and each line's balance follows from the one before. A gap is shown to the person, never fixed quietly. |
| What descriptions say | Plain phrases for cash-in, send money, bills, and the GGives or GLoan deduction. The words that tell a transfer from spending have to be read from a real file. [not found] |

**BDO deposit account (PDF)** [thin: converter sites and a student-made sample]
- General shape: a date column, a description, money out, money in, and a running balance. Some BDO layouts have separate debit and credit columns; others have one amount column with a sign. A reader must tell which one it has.
- When there is one date column it is the posting date (the day the bank recorded it), which can be a day or more after the day the person paid.
- Exact headers, date format and whether the file is locked: [not found]. CSV is confirmed only for BDO Business Online.

**BPI deposit account (PDF from the app)** [thin: uploaded copies and converter sites]
- Columns reported: `Date`, `Description`, `Ref`, `Details`, `Debit Amount`, `Credit Amount`, `Balance`. A previous balance at the top and an ending balance at the bottom.
- **Known trap: some BPI layouts print the date without the year.** The year has to come from the statement period in the header, and a statement that runs across New Year needs care.
- The header carries the branch, account type, period and account number. The account number must be stripped on the device before anything is sent (E7).

**Credit card statements: BDO, BPI, Metrobank, UnionBank, RCBC, Security Bank (PDF, locked, monthly by email)** [thin on layout; the summary box is checked by law and by issuer pages]
- Every card statement has a summary box with: statement date (the cut-off), payment due date, total amount due, minimum amount due, credit limit. These map straight to the card account: `payDay` from the due date, the opening balance from the total amount due.
- The lines usually carry two dates, the day of the purchase and the day it was posted, then a description and one amount. Payments and refunds show as a minus or with "CR". The event's `date` should be the purchase day.
- **There is no running balance per line.** The check is: previous balance, less payments, plus purchases and charges, equals the total amount due.
- Instalments show as one line per month ("3/12" style) for this month's part only; the rest is not in the total. Interest and late fees are their own lines (the "interest" spend in the ledger).
- Purchases in dollars show the peso amount charged, with the foreign amount in the description.
- Exact headers and date formats per issuer: [not found].

**Maya, Metrobank, UnionBank, Landbank, GoTyme, MariBank** [not found]
- Maya Savings gives a monthly statement PDF; Metrobank's app offers a download with a choice of formats; UnionBank's website gives PDF or Excel with a password the person picks. No trustworthy public description of the columns for any of them.

**Wise (CSV, one file per currency)** [checked through two integration write-ups]
- Headers: `TransferWise ID`, `Date`, `Amount`, `Currency`, `Description`, `Payment Reference`, `Running Balance`, `Exchange Rate`, `Total fees`, then payer and card fields.
- One signed amount (minus is out), a running balance on every line, and an id per line. Date format: day first with dashes, like `19-11-2026` [known, not searched; confirm on a real file].

**PayPal (CSV)** [the Balance column is from a guide found today; the other column names are known, not searched]
- The activity download has date, time, time zone, name, type, status, currency, gross, fee, net and, when "balance affecting" is chosen, a `Balance` column at the far right. Each line has a transaction id. The date format follows the account's region. One payment can show as several lines (the payment, the fee, the conversion).

**Payoneer (CSV or PDF)** [thin]: the monthly statement has a running balance and all completed transactions. Headers: [not found].

**To settle with one real file each (ten minutes with Mako or a teammate, no amounts leave their phone):**
1. Is the file locked, and does the hint above open it?
2. The exact header row, and the date format of the first line.
3. One column for amounts or two, and how money out is marked.
4. Is there a balance on every line, or only at the top and bottom?
5. Is there a reference number per line?
6. The words used for moves between the person's own accounts (cash-in, transfer, card payment), so they are not counted as spending.

What follows for the statements lane:
1. **PDF is the format to solve.** GCash, the cards and the bank apps all give PDFs. CSV exists for Wise, PayPal and Payoneer and for UnionBank (Excel).
2. **Ask for the password on the device, with the hint for that provider.** GCash: "your last name in small letters and the last 4 digits of your number". BDO card: "your birthday, like Jan081985, or 08Jan1985 for statements before June 2025". BPI card: "it is in the email the statement came in". UnionBank: "the password you typed when you downloaded it". The password never leaves the phone (D5, E7).
3. **A provider preset can carry its statement hint** (file kind, locked or not, password hint). `presets_ph.json` has an optional `statement` field for the ones we know.
4. **GCash first.** It has the most users, one fixed layout, a known password rule and up to 4 years in one file.
5. **Pay-later has no statements.** Those balances are typed, like the bank figure: what is left, how much each month, which day.
6. **Still to find, by someone with real statements in hand:** the Maya, Metrobank and BPI password rules, and whether the bank apps' PDFs are locked at all. Mako or a teammate opening one statement each answers this faster than any search.

## 5. Open points for the ledger and the coordinator
1. **Card cut-off day.** The finished ledger design (commit 22d5b83) covers a card that is not paid in full: its older balance is held like a loan, with interest as a spend. Persona Dan tests that. What is still missing is the cut-off day: a card has `payDay` only. Spending after the cut-off is on the card but is not in the bill due on the next `payDay`; it is due a month later. With "for the card" equal to everything on the card, "bank after the cards are paid" is safe but too low in the days between cut-off and due date. Persona Mika tests this (thing 8).
2. **Card instalments.** The remaining months of a 0% instalment are owed but are not in the statement balance. Typing only the statement balance understates what is owed. Persona Mika tests this.
3. **Paluwagan.** It does not fit one kind: it is "owed to you" before your turn and a loan after. Simplest default: the contribution is a bill each pay day, and the payout is "Other money in". A person who wants it exact can add an "owed to you" account. Not a preset; the personas use the simple default. A note for Mako with the first build.
4. **GCash is four things.** Wallet (e-wallet), GSave (bank), GGives and GCredit (pay-later), GLoan (loan). The presets list them apart, grouped by the name the person sees in their app.
5. **Pay taken before it lands** (SSS and Pag-IBIG loans): owed, but never an "out" the person makes. Typed as a loan whose balance drops each pay day without touching the bank. Left for later unless a teammate has one.
6. **Dollars waiting in Wise, Payoneer or PayPal** are presets with currency USD, shown beside Total (A9).

## How the presets fit the ledger design
`presets_ph.json` uses the fields of the finished LEDGER_DESIGN.md (side/ledger-design, commit 22d5b83, read 2026-11-19): `id` like `ph.gcash`, `name`, `type` (bank, card, ewallet, cash, paylater, loan), `cur`, and for cards `inFull` (true) and `payDay` (empty: it differs per person, so the app asks). Extra fields the design does not have and can ignore: `owed`, `first`, `other`, `for`, `statement`. No preset for `wallet` (made by Wallet mode), `owedToYou` (made by "Lent") or a card's older balance (made when the person says they do not pay in full).
