VERDICT: FAIL

CHECK: check3.txt ends "...(tests/e3_layout.js: PASS) / (full level, 3 at a time, 844 s in all) / ALL GOOD". fake_ai_page.js present; assistant tested with the made-up AI only.

OWNER'S WORDS
- M13 NOT MET. Gaps outside scope.txt: a yearly bill cannot be added after setup; a card added after setup is always paid from the main bank; a card's or bill's paying account cannot be changed; no loan, goal or budget line in setup.
- M14 NOT MET. Screens Undo after reload KNOWN. Reminders have no Undo (in scope).
- M15 MET. An empty amount in an edit sheet gives "Nothing changed". "End this bill" asks first.
- M16 MET. Each part shows "Saved". See my money says "Your bank is not saved yet. Press Save under it first".
- M17 MET with the made-up AI.
- M18 NOT BUILT (IN SCOPE FILE).
- M19 COULD NOT TELL. Backup and cloud doors exist. Second device not walked.
- M20 not walked.
- M21 NOT BUILT (IN SCOPE FILE).
- M22 MET. "Money went out" and "Money came in".
- M23 NOT MET. Pay-later is in scope. A card after setup cannot be paid from a second bank, which is not in scope.
- M24 NOT BUILT (IN SCOPE FILE).
- M25 MET.

COUNT: 27 kinds (3 NOT BUILT). Cells: 101 YES, 46 NO (34 IN SCOPE FILE, 12 not), 1 BROKEN, 41 N/A. Boxes: 32 of about 55 tried (the 9 add-sheet amount/day boxes with all 6 values, 6 names empty, Receipts amount with all 6, 15 edit boxes with 1 or 2 values, setup bill amount, Check your bank). Sheets: 25 of 25 have a way back or close.

GRID. Key: S = setup, P = Plan, R = Receipts. "sc" = NO (IN SCOPE FILE). Columns are 1 Add in setup, 2 Add later, 3 Change, 4 Remove/end, 5 Remove row in setup, 6 Undo (a/c/r), 7 After reload, 8 Assistant (a/c/r).

| Kind | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Main bank | YES | N/A, one main | name YES (P); Keep at least sc | sc | N/A, needed | YES/YES/- | YES | c YES (change_account); r sc |
| Other bank | YES "Add another account" | YES P "Add an account" | YES name, Keep at least | sc | YES "Remove this account" | YES "Account added/Undo" / YES | YES | a YES, c YES, r sc |
| Cash | YES (type Cash) | YES | YES | sc | YES | YES/YES | YES | a YES, c YES, r sc |
| E-wallet | YES | YES (PayPay) | YES | sc | YES | YES/YES | YES | a YES, c YES, r sc |
| Card | YES | BROKEN: no "Paid from", "It is paid in full from your main bank" | name, pay day, close day YES; paying account and weekend rule NO | sc | YES "Remove this card" | YES/YES | YES | a YES (asks when the amount is a guess); c, r sc |
| Loan | NO (screens and chat) | YES "Add a loan" | name, day, payment YES; still owed sc | sc ("Car loan still owes money. Tick its last payment at Check your bank first") | N/A | YES/YES | YES | sc |
| Pay | YES | N/A, one main | YES, every field | N/A, "No fixed pay" exists | N/A | -/YES "Pay changed" | YES | c sc |
| Second income | YES | sc (no "Add a pay" on P) | YES | sc (0 gives "A pay needs an amount") | YES "Remove this income" | -/YES | YES | a YES; c, r sc |
| Bill, monthly | YES | YES | name, amount, day, "Changes from", "next one only" YES; paying account NO | YES "End Gym? Nothing is due after the day in Changes from" | YES "Remove this bill" | YES/YES/YES | YES | YES/YES/YES, asks "This takes something away. Do it?" |
| Bill, yearly | YES "Once a year" | NO: Add a bill has no "How often" | NO | as monthly | YES | as monthly | YES | not tried |
| Budget line | NO | YES "Add a line" | YES | YES "End Food? It stays for this pay period..." | N/A | YES/YES/YES | YES | YES/YES/YES |
| Free to spend | YES | YES | YES | YES (0 is taken) | YES (leave blank) | YES | YES | set_free YES, Undo YES |
| Goal | NO | YES | name, target, date, set aside, take out YES; where kept NO | sc | N/A | YES/YES/- | YES | a YES, set aside YES; c, take out, r sc |
| Spend | N/A, setup takes today's figures | YES "Log spend" | YES "Save change" | YES, asks first | N/A | YES/YES/YES | YES | a YES, r YES (asks); c NO, sc |
| Refund | N/A | YES | YES | YES | N/A | YES | YES | a YES; c sc |
| Money in | N/A | YES | YES | YES | N/A | YES | YES | a YES; c sc |
| Move between own accounts | N/A | YES | YES | YES | N/A | YES | YES | not tried |
| Bank check | YES (bank today) | YES "Check your bank" | sc | sc | N/A | YES "Bank checked..." / Undo | YES | a YES bank_figure; c, r sc |
| Imported statement | sc (no file reading) | door exists, needs the AI | not checked | not checked | N/A | not checked | not checked | sc |
| Keep at least | YES | YES for other accounts | main sc; others YES | YES, empty is none | YES, blank | YES "Keep at least: saved / Undo" | YES | others YES; main sc |
| Currency | YES | N/A | sc ("It stays the same once money is written down") | N/A | YES | N/A | YES | sc |
| Country | YES | N/A | sc (not on Settings) | N/A | YES | N/A | YES | sc |
| Reminder | N/A, on by default | YES tick | YES lead time, time | YES untick | N/A | sc | BROKEN, see B1 | sc |
| Backup file | N/A | YES "Save a backup file" | N/A | kept copy: "Drop it" | N/A | restore: "Put it back" | YES | sc |
| Cloud copy | N/A | YES "Keep a copy in the cloud" | "Show code", "Earlier versions" | YES "Turn off", says what is lost | N/A | N/A | YES | sc |
| Assistant's change | N/A | YES | N/A | N/A | N/A | YES "Undo", also after reload | YES | YES |
| Pay-later / envelopes / unspent money | NOT BUILT (IN SCOPE FILE) | | | | | | | |

BLOCKERS
1. Reminders are not kept, and nothing says so. Phone 390. Go to Reminders. Untick "Rent", set "3 days before", set the time to 08:30 and press Close. Reopen and they show as changed. Reload and all are back to the defaults ("Rent" ticked, "2 days before", 09:00). I repeated this on its own and it happened again. scope.txt lists "Reminders kept, with Undo: queued". This does more harm than that line says: the screen looks saved, so the person believes a reminder is off or moved when it is not. It should either keep the changes or say they are not kept yet.
2. A yearly bill cannot be added after setup. Plan > "Add a bill" has Name, Amount, Day of the month and Paid from, but no "How often". Setup's "Once a year" is the only way. This is not in scope.
3. The paying account of a card cannot be chosen after setup. Plan > "Add a card" says "It is paid in full from your main bank" and has no "Paid from". The card edit sheet has only Name, pay day and close day. Setup offers "Paid from" with every bank. A card on a second bank, if added later or entered wrong in setup, cannot be fixed. This is not in scope.
4. The paying account of a bill cannot be changed. The Rent sheet has Name, Amount, Day and "Changes from" only. This is not in scope.
5. A loan, a goal or a budget line cannot be added in setup, on the screens or in the chat (draft_set has no loan, goal or line section). Each can be added on Plan right after. scope.txt's M2 line about questions the setup chat never asks may cover this: coordinator to say.

CONFUSING
- Error words read like a template: "Type amount as an amount", "Type each pay period as an amount", "Type still owed today as an amount", "Type goal amount as an amount", "Type keep at least as an amount". A minus and a 15-digit number get the same words. Better: "Type a number, like 7000. No minus." and "That is too big, check the zeros".
- Free to spend: an empty box says "Type an amount above zero", but 0 is accepted ("Free to spend changed").
- Check your bank needs a figure for every bank, cash and e-wallet: "Type what Beta Bank shows today, as an amount". Cards can be left blank, accounts cannot. Better: "Leave it blank if you have not looked".
- Money in shows as "back ¥5,000" in What you logged. "back" already means a refund (M51).
- Cash and e-wallets say "bank today" (Plan) and "Bank today: Wallet cash" (Home).
- In setup, two new unnamed accounts both show as "Second bank" in "It lands in" and "Paid from".
- Reminders cover bills only. A card or loan payment, which leaves the bank, cannot get one.

POLISH
- "Save a backup file" shows no saved line on the page. Only the browser's download bar shows it.
- Served page: one console 404 on load.
- On a phone the assistant's sheet closes after each answer, so its Undo is one more tap away.

FOR MAKO'S EYE: none.

NOT CHECKED
- Imported statements, adding and removing (needs the AI to read a file).
- The assistant's move_money, refund removal, change_account min and yearly add_bill.
- Undo for setup "Remove this ..." rows (no Undo seen; the rows were never saved).
- Date boxes (goal date, account "moved" day, bill "Changes from", Receipts day), setup amount boxes other than a bill, reminder time, code words, backup lock.
- Two devices, "which to keep", cloud "Earlier versions" restore.
- Desktop and 320 sizes for the sheets.
- Every tappable doing something: Plan, Receipts, Home, Settings and Reminders taps were all listed and the main ones used. The calendar "Google" and "Outlook" links and each "?" were not opened.
