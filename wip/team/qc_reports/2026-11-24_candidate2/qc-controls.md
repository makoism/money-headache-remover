VERDICT: FAIL

Round note: `wip/team/app3/tests/fake_ai_page.js` and `tests/README.md` are missing from this build. I used the stub at the top of `tests/e3_ask.js` instead. The assistant was tested against a made-up AI only: it proves the doors, not how the real one talks.

CHECK:
```
[x] The real-page walk (walk 4 run A) as a gate: Mako's made-up shape from setup on 24 Nov to 15 Feb through the page ...  (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): bank today, pay with a second income, cards with a close day or not sure, bills, the minimum ...  (tests/e3_setup.js: PASS)

(full level, 3 at a time, 410 s in all)
ALL GOOD
```

OWNER'S WORDS
- M13 NOT MET. 49 cells are NOT BUILT (IN SCOPE FILE). 10 more cells are NO and are not in scope.txt (blockers 1 to 6).
- M14 MET for everything built, in the same sitting. Undo after a reload and for reminders: NOT BUILT (IN SCOPE FILE).
- M15 MET. Setup "Remove this bill" works with an empty amount, then "Rent removed / Undo".
- M16 MET. Each of the 6 parts shows "Saved" and "Your pay: saved". A bad bank box did not block Save under pay or bills.
- M17 MET (made-up AI). "Ask" is in the header on every screen.
- M18 NOT BUILT (IN SCOPE FILE). 3 or 4 "?" on Home, 1 on Plan.
- M19 MET on the made-up server: backup, restore, "Put it back", cloud code, second device.
- M20 COULD NOT TELL, not tried.
- M21 NOT BUILT (IN SCOPE FILE). Android size only.
- M22 MET. Receipts: "Money went out", "Money came in".
- M23 MET for banks, cash, e-wallet, cards in setup. Pay-later NOT BUILT (IN SCOPE FILE).
- M24 NOT BUILT (IN SCOPE FILE).
- M25 MET.
- M6 (seen broken, outside my section): no remove asks first. In scope file. See blocker 9 for the part that is not.

COUNT: 25 kinds built, 2 NOT BUILT (pay-later; where unspent money goes). 200 cells: YES 102, NO 59 (49 in scope file, 10 not), BROKEN 0, N/A 39. Boxes tried 62 with 288 bad entries, 0 left a person stuck. Sheets and steps tried 25, 1 with dead taps.

GRID. Y = yes. S = NO, in scope file. NO = no way on any screen, not in scope file. Columns: 1 add in setup, 2 add later, 3 change, 4 remove or end, 5 remove a row in setup, 6 Undo, 7 after reload, 8 by the assistant.

| Kind | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Bank account | Y "Add another account: a bank, cash or an e-wallet" | S | S name. Balance Y, "Check your bank", "Save" | S | Y "Remove this account" | Y in setup | Y | S |
| Cash | Y same | S | S | S | Y | Y | Y | S |
| E-wallet | Y same | S | S | S | Y | Y | Y | S |
| Card | Y "Add a card" | Y Plan or Home "Add a card", "Add" | NO: name, pay day, close day Y. Paid from and weekend rule have no box | S | Y "Remove this card" | Y | Y | S |
| Loan | NO, setup has none | Y Plan "Add a loan" | NO: name, day, usual payment Y. "Still owed" has no box anywhere | S "Close this loan" refuses | N/A not in setup | Y | Y | S |
| Pay | Y | N/A one main pay | NO: name, amount, how often, day Y. "It lands in" and weekend rule have no box | N/A, "No fixed pay" covers it | N/A | Y | Y | S |
| Second income | Y "Add a second income" | NO | Y | S | Y "Remove this income" | Y | Y | S |
| Bill | Y | Y Plan "Add a bill", monthly only | NO: name, amount, day, "Change the next one only" Y. "Leaves from" and "How often" have no box | Y "End this bill" | Y "Remove this bill" | Y | Y | S |
| Budget line | NO, setup has none | Y "Add a line" | Y | Y "End this line" | N/A | Y | Y | S (amount Y) |
| Free to spend | Y | Y Plan row | Y | Y, 0 accepted | N/A one box | Y | Y | Y |
| Goal | NO, setup has none | Y "Add a goal" | NO: name, amount, date, "Set aside", "Take out" Y. "Where the money is kept" has no box | S | N/A | Y | Y | S (set aside Y) |
| Spend | N/A | Y "Log spend" | Y "Save change" | Y "Remove" | N/A | Y | Y | S (add Y) |
| Refund | N/A | Y "Log refund" | Y | Y | N/A | Y | Y | S |
| Money in | N/A | Y "Log money in" | Y | Y | N/A | Y | Y | S |
| Move | N/A | Y "Log money moved" | Y | Y | N/A | Y | Y | S |
| Bank check | Y | Y | S | S | N/A | Y | Y | S |
| Statement | S | Y "Add statements", "Check the answer", "Add 3 lines" | Y category and account before, each line after | NO as a whole | N/A | Y | Y | S |
| Keep at least | Y | S | S | S | N/A | Y | Y | S |
| Currency, country | Y | S | S | S | N/A | Y | Y | S |
| Reminder | N/A | Y "Save the calendar file" | S | S | N/A | S | S, choices gone | S |
| Backup file | N/A | Y "Save a backup file" | N/A a file | N/A lives outside | N/A | Y "Put it back" | Y | S |
| Cloud copy | N/A | Y "Keep a copy in the cloud" | N/A | Y "Turn off": "Stop here", "Delete the cloud copy", "Keep it on" | N/A | N/A | Y | N/A |
| Setup answers | Y | N/A | S, no way back into setup | N/A | Y | Y | Y | S |
| Assistant change | N/A | Y "Apply" | Y ticks per step | Y "Not now" | N/A | Y, also after closing Ask | S | N/A |
| AI code word | N/A | Y "Keep it" | Y "Change it" | Y "Clear it" | N/A | N/A | Y | N/A |

BLOCKERS (phone 390x844, today 1 Dec, set up 24 Nov)
1. A second income cannot be added after setup. Plan has "Add a line", "Add a bill", "Add a goal", "Add a card", "Add a loan" and nothing for income. Should have "Add an income".
2. A yearly bill cannot be added after setup, and a bill cannot change account. Setup has "How often: Each month / Once a year" and "Leaves from". Plan "Add a bill" has no "How often". The bill sheet (Name, Amount, Day, Changes from) has neither.
3. A card cannot change the account that pays it. Plan "Add a card" says "It is paid in full from your main bank" with no choice, though setup asks "Paid from". Same for a loan.
4. A loan's "still owed" cannot be changed anywhere. Its sheet has Name, Day, Usual payment only, and Check your bank does not list loans. A typo in "Still owed today" stays for good, since "Close this loan" answers "Car loan still owes money".
5. A goal cannot change "Where the money is kept" after it is added.
6. An imported statement cannot be taken out later. After a reload there is no list of statements. Spends can be removed one at a time in Receipts; a bill it ticked off cannot be unticked.
7. Check your bank will not save unless every account has a figure. Type Main bank only, tap "Save": "Type what Savings bank shows today, as an amount". The ticked pay and the Main bank figure are held up by Wallet. Cards say "Leave it blank if you have not looked"; accounts should too.
8. Add statements: the Home, Receipts and Plan tabs stay on screen and do nothing. Repeated twice. Only "Back" leaves. Every other sheet closes on a tab tap.
9. A bank check far from what the app expects saves with no question. Typed 0 for Main bank: "Bank checked. ¥575,146 more left your bank than you logged. It counts as spending". After a reload nothing removes it (scope, slice 10). It should ask first when the gap is this large.
10. Home asks "A question for you ... Main bank shows ¥73,900 more than the app had: was that figure right" and gives no way to answer. Nothing there is tappable, and "?" gives general help.
11. Loans, goals and budget lines cannot be added in setup. Smallest of these: Plan takes them the same minute.

CONFUSING
- Pay sheet, "Free to spend each pay from the change": change only this box, "Save" says "Nothing changed". Say "This applies when the pay amount changes" or take the box away.
- Emptying an amount on a bill, pay, line, goal or loan, then "Save": "Nothing changed". Should be "Type the amount".
- Card sheet, pay day emptied: bar says "Master changed" and nothing changed.
- "Type amount as an amount", "Type each pay period as an amount", "Type set aside now as an amount". Replace with "Type the amount, like 1200". The same words answer a number too big and 12.5 in yen: say "That amount is too big" or "Yen has no decimals".
- Ended line after a reload: "Food has already ended", with no way to bring it back.
- Ask: "Left out because the app could not read them: a change Ask can't make (remove_bill)". Replace with "I can't remove a bill yet. Do it on Plan".
- Bank check on Wallet: "more left your bank than you logged". Name the account.
- Receipts row for money in: "back ¥5,000". "back" belongs to refunds.
- Two unnamed extra accounts both show as "Second bank" in setup's lists.

POLISH
- "?" buttons are 28x28. Everything else is 44 or more.
- "Ask the browser to keep it": no words after the tap (may be the test browser).
- "Ask" with an empty question: nothing happens, no message.
- Reminders, time emptied: no message.
- Cloud code has no "Copy" button. "Send now" shows no word when the minute is the same.
- Names take 300 letters.
- Escape does not close a sheet. Phone Back does.
- Served copy: one console error, "Failed to load resource: 404", on each device. May be the made-up server.
- Back from the statement review step empties the pasted answer.

FOR MAKO'S EYE
- "End this line" ends after this pay period. A line added by mistake yesterday stays for the rest of the period.
- A fresh second device offers "Save a backup file" with nothing to save.

NOT CHECKED
- Desktop 1300x900, 320 wide, light scheme.
- "Read with the AI" for statements through the relay; PDF and picture files. The paste path only.
- A locked backup saved and restored. "Delete the cloud copy" and "Stop here" tapped through.
- M20, both devices changing one item.
- Unticking one step of an assistant reply.
- The amount box next to each tick in Check your bank. Name boxes in setup with bad values.
- Pay "On two days each month", weekly and "No fixed pay" forms. "Once a year" bill in setup.
- The made-up-numbers tour ("See it with made-up numbers first").
- Google and Outlook links opened.
- Whether the Pay sheet's Free box takes hold when pay changes with it.
