# Statements: read on the phone first

Side O, 2026-11-19. For LAUNCH_CHECKLIST A8, D5, E7, E13, H4. Code: `stmt_ph.js` (new, self-contained, not in the build yet). Tests: `tests/next/stmt_ph_read.js` and `tests/next/stmt_ph_privacy.js`. Fixtures: `tests/next/fixtures_ph/` (made-up person, made-up numbers). No existing file was changed.

## The idea in five lines
1. The phone reads the statement itself. No AI call when the layout is regular.
2. A read is only trusted when the statement's own figures agree with the rows, to the cent. If they don't, the app says so and falls back. It never guesses quietly.
3. Every line gets a stable id. The same line met again (overlapping statements, the same file twice) adds nothing.
4. Money moved between the person's own accounts is paired and counted once, as a transfer. A charge and its reversal are paired and count as neither spending nor income.
5. The AI only gets what the phone could not place: merchant names, with no dates, no balances, no account, no person.

## What `stmt_ph.js` does
| Function | Job |
|---|---|
| `phRead(text, {file, provider, kind})` | Any statement text or CSV to one read: `ok`, `why`, `provider`, `kind` (bank, ewallet, card), `account` (name plus last four digits), `from`, `to` (from the rows' own dates, never the file name), `opening`, `closing`, `totalIn`, `totalOut`, `rows`, `unread`, `checks`, `notes`. Cards add `stmtDate` (cut-off), `dueDate`, `prev`, `due`, `min`, `instalments`. |
| row | `date`, `c` (whole cents), `a` (same, as units), `dir` (in or out), `text`, `ref`, `bal`, `lid` (line id), `acct`, `cat` (one of stmt.js's STMT_CATS), `k` and `sub` (ledger kind), `conf` (0 to 1). Card rows add `post` and `inst`. |
| `phMerge(reads, known)` | One list. A repeated line id is dropped and counted in `dupes`. Ids already in the ledger come back `already: true`. |
| `phPairReversals(rows)` | Charge and refund or reversal on one account: same amount, opposite direction, a word of the name in common. Sets `rev` on both. |
| `phPairTransfers(rows)` | Out on one account, in of the same amount on another, 0 to 3 days later (1 day earlier allowed). Sets `pair` on both. A bank's payment to the card pairs with the card's "payment received". |
| `phAlreadyLogged(rows, events)` | Lines that match something typed or logged from a receipt (same direction, same amount, within 3 days). Sets `maybe`. One typed entry matches one line. |
| `phPrepare(reads, known, events)` | All of the above in order, plus `keep` on each row and `totals`. This is what the review screen takes. |
| `phTotals(rows)` | What really came in and went out. Own transfers, card payments and reversed pairs are left out. |
| `phEvents(rows, acctOf)` | Kept rows as ledger events (LEDGER_DESIGN fields): `k`, `sub`, `date`, `a`, `acct`, `acct2` for a paired transfer, `src: {t:'stmt', lid, lid2}`, `note`. One event per pair. |
| `phMask(text, {names})` | The privacy pass. See below. |
| `phLeaks(text)` | A last look before sending: any number of 6 digits or more, any email. Must be empty. |
| `phAskList(rows)` | What the AI gets when the phone did the reading: merchant name, direction, count, total. Nothing else. |
| `phToStmtRead(read, file)` | The read in the shape `stmtCleanRows` returns, so `stmtNumbers` and the review work as they do now. |

How a read proves itself:
- **Accounts with a running balance** (GCash, Maya, BDO, BPI, Metrobank, UnionBank CSV): each row must take the balance from the row before to its own. This also gives the direction when the PDF text dropped the empty Debit or Credit column. Then opening plus in minus out must equal closing, and the printed totals and closing balance must match when they are there. Oldest-first and newest-first are both tried.
- **Cards**: previous balance plus purchases and fees minus payments and credits must equal the total amount due. The payments box and the purchases box are checked when printed.
- **Dates with no year** take the year from the statement date or period. A cycle across New Year is handled (tested on a card and on a BPI layout).
- **Line id**: provider, kind, last four digits, date, direction, cents, then the reference number if the statement has one, else the balance after the line, else (cards) the post date, the text and a count for identical lines on one day. It is hashed, so it holds no name and no number.

What it refuses, with the reason in `read.why`: a line that starts with a date but could not be read; a balance that does not chain; printed totals that don't match; no opening balance and no way to tell in from out; nothing to check against. Tested by changing one amount, removing one row and changing one total.

## Privacy on the device
`phMask` removes, before anything leaves the phone:
- the owner's name, found from the header (labelled lines, or an all-capitals name line at the top) and from `names` the app passes in (the person's own name from setup). Any run of two or more of the name's words is removed anywhere in the text, in any order;
- address lines in the header, and anything after an "Address:" label;
- phone numbers (0917..., +63 917..., 63917...);
- card numbers (last four kept, as `[card ••3456]`);
- account numbers after a label (last four kept), and any other run of 9 digits or more;
- reference codes (letters and 6 or more digits);
- emails;
- the other person in "Send Money to ..." and "Received GCash from ..." lines.

It keeps dates, merchant names and amounts. The test reads each fixture before and after masking and gets the same rows and totals.

What it cannot promise: a person's name inside a row when the app does not know that name (a friend's name in a bank transfer line that doesn't use GCash's wording). The fix is the first rule: when the phone reads the statement itself, rows never go to the AI at all.

## What the AI is still for, and what it gets
| Case | What is sent | Through |
|---|---|---|
| The phone read the statement and it adds up | Only merchant names it could not place (`phAskList`): name, in or out, how many times, the total. Lines about a person (a send, money received) are never in it. In the fixtures all 64 lines are placed on the phone and nothing is asked. | the existing category job (`stmtCategorize`) |
| The text was read but does not add up, or the layout is unknown | The text after `phMask`, and only if `phLeaks` comes back empty. The person is told first. | the existing rows job (`stmtRunJob`) |
| A screenshot or a scanned PDF (a picture, no text) | The picture itself. It can't be masked on the phone. The person is told that plainly before sending. | the existing image job |
| Questions in Ask | As today. | as today |

The AI is never sent a password, a whole PDF once the phone can open PDFs, or a balance.

## Locked PDFs (design only, nothing added to the build)
**How it would work**
1. The person picks the PDF. The app tries to open it on the phone.
2. If it is locked, one screen asks for the password, with the hint for that provider (from PH_ACCOUNTS section 4).
3. The password goes straight to the PDF opener in memory. It is not saved, not put in the saved copy or the cloud copy, not written to the error log, not sent anywhere. The field is `type="password"` with `autocomplete="off"`, and the variable is cleared when the file is open or the screen closes.
4. The opener gives the text of each page. The app builds lines from it and hands them to `phRead`. The PDF itself never leaves the phone.

**What could open it:** pdf.js (Mozilla's `pdfjs-dist`). It opens password PDFs in the browser (`getDocument({data, password})`, and an `onPassword` callback for a wrong one) and handles the RC4 and AES locks banks use. `getTextContent()` gives each piece of text with its x and y, so lines are rebuilt by grouping on y and sorting on x. The x positions also say which column an amount sits in, a second check on direction beside the running balance. I know of no smaller library that does both the unlocking and the text. Writing our own unlock code is not worth the risk.

**Cost, from memory, not measured here:** about 1.5 MB of script before compression, around 450 KB sent, in two files (the reader and its worker). It should load only when someone picks a PDF, and be kept by the service worker after the first time, so the page itself gets no heavier. On a mid-range Android phone I'd expect 1 to 3 seconds for a monthly statement of a few pages and 10 to 30 seconds for a GCash history covering years, so it should read page by page and show progress. Both figures need measuring on a real phone before anyone relies on them. The content policy from SECURITY_REVIEW S7 needs `worker-src 'self' blob:`.

**When it can't be opened**
- Wrong password: ask again, keep the hint on screen, no limit.
- A scanned PDF (pictures, no text): say so, offer screenshots.
- Anything else: three ways out, in this order. Download it as CSV or Excel if the bank offers it (UnionBank, Wise, PayPal, Payoneer). Open it in the phone's own PDF viewer with the password and take screenshots of the pages. Type the numbers.

Until pdf.js is in: today's message stays (ui41.js line 53: open it with the password, save it as a new PDF, or take screenshots). An unlocked PDF still goes to the relay whole, which is the E7 problem. So opening PDFs on the phone is what makes the privacy lines below true for PDFs.

## The upload flow, one question per screen
Words for the screens. Drafts, written to VOICE.md (side/voice) as far as I could follow it. The voice checker should pass them before they ship.

1. **Where do you keep money?** Tap every one you use. (GCash, Maya, BDO, BPI, UnionBank, Metrobank, a credit card, somewhere else)
2. **Get your GCash history.** In GCash go to Transactions and ask for your history. It comes by email as a PDF. Three months is enough to start. (One provider per screen, steps from PH_ACCOUNTS section 4.)
3. **Add the file.** Button: Choose file. Under it: Your phone reads it. The file stays here.
4. **This one has a password.** Hint for GCash: your last name in small letters and the last 4 digits of your number, like delacruz1234. Under it: The password stays on this phone. It's used once to open the file.
5. **Reading.** A coin drops into the account's pile for each line read. Then: 12 lines, Aug 2 to Aug 30. It adds up to your closing balance of ₱600.68.
6. **If it doesn't add up.** This file doesn't add up to its own closing balance, so I won't use it as is. Buttons: Let the AI read it / Try another file / Type it in. Under the first: Your name, numbers and address are taken out first.
6b. **If the dates could be read two ways** (`read.ask === 'dateOrder'`). Is 03/08/2026 the 8th of March or the 3rd of August? Two buttons with the two dates written out. The answer goes back in as `phRead(text, {dateOrder: 'md' or 'dm'})`.
7. **Another account?** Buttons: Add another / That's all.
8. **Review** (next section).
9. **Done.** The picture: each account's pile at its closing balance.

## The review screen
One list by date. Each line shows the date, the name, the amount and the account, with a tick.
- **Already logged**: grey, unticked, a tag "Already in". Tap to see what it matched. Lines with a known id (`already`) can't be ticked back on. Lines that only look like something typed (`maybe`) can: "Looks like the ₱1,845.32 you logged on Aug 6. Add it anyway?"
- **Own transfers**: the two lines sit together as one row with an arrow, "BDO to GCash ₱2,000". Ticked, counted once, never as spending or income. Tap to split them if the pairing is wrong.
- **One-sided transfers** (a cash-in whose bank statement isn't here): "Money moved in from another account of yours?" Yes / No, it's income.
- **Reversed**: the charge and its reversal sit together, struck through, "Charged and reversed". They stay in so the balance ties.
- **Card instalments**: "3 of 12. ₱11,250 more is owed and isn't in this statement." This feeds the card's older-balance line.
- **Not sure** (`conf` under 0.6): asked one at a time after the list, "What's this one?", with the usual kinds.
- At the top, a picture not a sentence: money in, money out, moved between your own accounts, as three piles. The numbers sit under them.
- At the bottom: "Add 48 lines". After it, per account: "BDO matches its closing balance" or the gap.

## Honest privacy lines
The current lines say data is on this device only and numbers are sent only when Ask is used with the box ticked (ui42.js lines 113 and 114, body.html line 338). That is not true while statements go through the relay (SECURITY_REVIEW S5, E13).

Once `stmt_ph.js` is wired in and PDFs open on the phone:
- On the upload screen: "Your phone reads your statements. The files stay here."
- When the AI is needed for names: "To sort a few shop names I can't place, the names go to the AI. No dates, no balances, no account numbers."
- When the AI must read a file: "This file needs the AI to read it. Your name, address, account and card numbers are taken out first. The rest goes to Anthropic, the company that makes the AI, and is kept there for a limited time under its terms." Button: Send it / Not this one.
- For a screenshot: "A picture can't be cleaned first. Everything in it goes to the AI. Crop out your name and account number if you want."
- In Saved (replacing SAVED_LOCAL): "Your numbers are stored in this browser on this phone. Statements are read here. If a file needs the AI, you're asked first, and your name and account numbers are taken out."

Until it is wired in, the honest line is the opposite and should go in now: "Statements you upload are sent to the AI to be read, with everything on them."

## What the main session changes to wire it in
Nothing here is done. Each step names the function it touches.
1. **build.sh**: add `stmt_ph.js` before `stmt.js`. The `module.exports` line at the end does nothing in the page.
2. **ui45v.js `stmtRunJob`**: for `job.kind === 'text'`, call `phRead(text, {file, kind: job.acct.kind === 'card' ? 'card' : undefined})` first. If `read.ok`, return `stmtTagRead(phToStmtRead(read, name), job.acct)` and skip `stmtAsk`. If not, send `phMask(text, {names}).text` in place of the raw text, after checking `phLeaks`.
3. **ui45v.js `stmtSplitText`**: don't split a file `phRead` can read. The chain needs the whole file.
4. **stmt.js `stmtCleanRows`**: keep `lid` and `cat` on a row when they are given (it rebuilds each row today and would drop them).
5. **stmt.js `stmtMerge`**: when rows carry `lid`, use it as the key. Today's key (date, amount, direction, name) merges two real charges of the same amount at the same shop on one day. The fixtures have that case (two Jollibee charges).
6. **stmt.js `stmtReceipts`**: put `lid` in the receipt's `k`, and after B1 use `phEvents` in its place so `src` lands on the ledger event.
7. **ui45v.js `stmtCategorize`**: skip merchants whose rows came with a `cat`. Send `phAskList` for the rest.
8. **ui45v.js `stmtReviewHTML`**: the flags above (`already`, `maybe`, `pair`, `rev`, `inst`) from `phPrepare`.
9. **ui46.js `askClean`** (the import check LANE_e6 names): keep `src`.
10. **ui41.js line 53 `pdf_locked`**: the password screen, once pdf.js is in. Until then the message stays.
11. **ui42.js `SAVED_LOCAL`, `SAVED_CLOUD`, body.html lines 216 and 338, the "safe" answer in ui45c.js**: the lines above.
12. **tests/verify.sh**: add the two tests (`node tests/next/stmt_ph_read.js`, `node tests/next/stmt_ph_privacy.js`). Under a second together.

Depends on: the E6 fix (rows dated before Nov 2026 are dropped on import today, so three months of statements lose most of their rows however well they are read), and B1 for `phEvents`.
