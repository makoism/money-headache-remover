# Lane: Philippine statements (side O)

2026-11-19. Branch `side/statements-ph`, from wip-38.31. No existing file was changed. Made-up data only.

## What is here
| File | What |
|---|---|
| `stmt_ph.js` | Reads statement text and CSV on the phone, checks it against the statement's own figures, gives line ids, pairs own transfers and reversals, flags "already logged", masks personal details. Not in the build. |
| `tests/next/stmt_ph_read.js` | 472 checks. `node tests/next/stmt_ph_read.js`, ends `STMT PH PASS`. |
| `tests/next/stmt_ph_privacy.js` | 321 checks. Ends `STMT PH PRIVACY PASS`. |
| `tests/next/fixtures_ph/` | 10 statements for one made-up person (Juana P. Dela Cruz, the Philippine "Jane Doe"): GCash twice (overlapping), Maya, BDO savings, BPI twice (newest first; and no-year dates across New Year with a signed amount), Metrobank savings (a wrapped line), UnionBank CSV, BDO card (previous balance, payment, refund, fee and its reversal, instalment 3 of 12, cut-off and due date), Metrobank card (month names, CR, across New Year). The same story runs through them, so six transfers between her own accounts can be paired. |
| `STATEMENTS_DESIGN.md` | The design: how a read proves itself, privacy, locked PDFs, the flow, the review screen, honest privacy lines, the wiring list. |

Both tests are pure node, need no setup, and take well under a second.

## What the tests prove
- Every dated line in every fixture becomes a row. Sums equal the statement's printed totals and closing balance, or the card's total amount due.
- A changed amount, a missing row, a wrong printed total and a row with no balance are each refused with a reason.
- Two overlapping GCash statements give 16 lines, not 22. The same file twice adds nothing. A second import of everything adds no event and no money.
- Six own transfers pair up, including the bank's payment to the card. Five charge and reversal pairs. Pay and ATM cash are never paired. Income and spending leave all of these out, and each account still adds up to its closing balance.
- Things typed by hand first are flagged, one to one.
- After masking, none of the made-up name, address, phone, account or card numbers is left, and the masked text reads to the same rows and totals.

## What I am unsure of
1. **The layouts are my best reconstruction, not copies of real statements.** I had no real statement. GCash follows the public description (columns, STARTING and ENDING BALANCE rows). The card fixtures follow the general shape every issuer shares. BDO, BPI, Maya, Metrobank and UnionBank account layouts are invented in the usual shape (date, description, money out, money in, balance), because their real columns are not published. I did not run my own web search for them: the session ran out of room after the usage stop. Side L searched twice and found nothing firm, and I built the tolerant reader the coordinator asked for.
2. **So the reader does not depend on exact headers.** It finds a date at the start of a line and the money at the end, and proves direction and completeness from the running balance. A layout it has never seen either adds up and is used, or is refused aloud. What it cannot handle: a date that is not at the start of the line, amounts without two decimals, a balance column that is missing on some lines, Numeric dates like 03/08/2026 are no longer assumed month first: `phDateOrder` proves the order from the file (a number over 12, or dates in order only one way) and otherwise the read is refused with `ask: 'dateOrder'`, so the app asks the person and passes the answer back as `dateOrder`. Fixtures `ambiguous_dates.txt` and `dayfirst_dates.txt`.
3. **How PDF text comes out is assumed.** I assumed one line per row with the columns in order. pdf.js gives pieces with positions, and the app has to rebuild lines. Wrapped descriptions may come out before or after their row. The GCash reference number may land on its own line. All of this needs one real file per provider.
4. **GCash date format.** Side L saw `2025-10-02 08:22` in one copy. The reader takes that and AM/PM. Not confirmed.
5. **Kind guesses are word lists I wrote.** Good enough to tell pay, cash-in, cash-out, transfers, fees, interest and the big billers. Real GCash wording for send money, bank transfer, GGives and GLoan is not known. The fixture's "GGives Auto-deduction" is invented.
6. **Transfer pairing can be wrong** when two different moves of the same amount happen within three days between the same two accounts. The review screen lets the person split a pair. One-sided transfers (the other statement not uploaded) are guessed from words and must be asked.
7. **Card "in" and "out"** follow stmt.js today: a purchase is out, a payment is in. The ledger's own words differ (spend raises what is owed, repay lowers it); `k` on each row carries the ledger kind.
8. **Name masking of other people** only covers GCash-style "Send Money to" and "Received from" lines and names the app passes in. A friend's name in a bank transfer line stays unless the phone read the statement itself, in which case rows never go to the AI.
9. **pdf.js size and speed are from memory**, not measured. See STATEMENTS_DESIGN.md.
10. **Screen words** follow VOICE.md as far as I read it (the top and Part A). They have not been through the voice checker.
11. **Other currencies** (Wise, PayPal, Payoneer CSV): the CSV reader takes any file with date, description and debit and credit or signed amount columns, but `cur` is always PHP. Not tested on their real headers.
12. `stmtCleanRows` drops rows dated more than a month ahead and the import drops rows before Nov 2026 (LANE_e6). My reader does neither. The E6 fix has to land for old statements to survive the import.

## Which real statements would settle it
For Mako or a teammate. One of each is enough. **Black out every name, number and amount if you like. Only the layout matters:** where things sit on the page and what the headings say. A photo of the page works, but the PDF itself is better, because what matters most is how the text comes out of the file.

| Statement | Which page | What it settles |
|---|---|---|
| GCash transaction history (the PDF emailed from the app) | Page 1 and one middle page | The date format, how long descriptions wrap, the exact words for cash-in, send money, bank transfer, GGives or GLoan, whether the totals at the end are printed. Also: does the password rule work. |
| BDO savings or current, from BDO Online | The first page | The column headings, the date format, one amount column or two, whether it is locked. |
| BPI savings, from the app (My Statements) | The first page | The headings, whether dates have a year, oldest or newest first, whether it is locked. |
| Maya savings or wallet statement | The first page | Everything. Nothing public is firm. |
| UnionBank, the Excel download | The first 10 rows | The column names and the date format. |
| Metrobank account, from the app | The first page, and the list of formats the download offers | The headings, and whether a CSV exists. |
| One credit card statement (BDO, BPI or Metrobank) | The summary box and the first page of transactions | The labels in the box, how credits are marked (minus, CR), how an instalment line reads. Also the password rule for BPI and Metrobank. |

With the PDFs in hand: open each with pdf.js in a scratch page, save the text it gives, black it out, and add it to `fixtures_ph` beside the invented one. If the reader refuses it, the reason says what to fix.

## Next steps, in order
1. Get the real files above. Fix the reader against them.
2. The E6 fix, then the wiring list in STATEMENTS_DESIGN.md (12 steps, each naming its function).
3. pdf.js as a lazy-loaded file, measured on a real mid-range phone, with the password screen.
4. The honest privacy line for today ("statements are sent to the AI, with everything on them") can go in now, before any of this.
