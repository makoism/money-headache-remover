VERDICT: FAIL

CHECK: (last five lines of check3.txt)
[x] Setup, short (setup3): bank today, pay with a second income, cards with a close day or not sure, bills, the minimum; through build_book and the store  (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide (M52, M33): ... (tests/e3_layout.js: PASS)
(full level, 3 at a time, 883 s in all)
ALL GOOD

Build: c5 worktree app3/index.html, phone 390x844. Setup on the screens on 1 Dec (Main bank, Beta Bank, Wallet cash, Pay 250,000 + Side job 30,000, Card A, Rent/Power/Phone, Free to spend 60,000, Keep at least 20,000); later days 8 to 10 Dec after reloads. Assistant: made-up AI (fake_ai_page.js), so doors only, not how a real AI talks.

OWNER'S WORDS
- M13 NOT MET: Main bank cannot be closed, removed or replaced; a second income's day change does not take effect. Everything else in the grid works.
- M14 MET: Undo straight after on every screen door tried; after a reload from Settings > Recent changes (screens and assistant). Reminders: NOT BUILT (IN SCOPE FILE).
- M15 MET: End this bill asks first; empty amount boxes never trap.
- M16 MET: each setup part saves alone with "Saved" and Undo.
- M17 MET (made-up AI).
- M18 NOT BUILT (IN SCOPE FILE): "?" on Home and Plan only.
- M19 MET: backup save says "Saved burrow-backup-....json"; restore asks, Put it back offered.
- M22 MET. M25 MET. M23 (pay-later), M24: NOT BUILT (IN SCOPE FILE).
- M20 COULD NOT TELL (not walked).

COUNT: kinds 28. Cells 224: YES 146, NO 1, BROKEN 1, N/A 36, NOT BUILT or KNOWN (IN SCOPE FILE) 39, not checked 1. Boxes tried 32 (all six values each where they apply, 160 tries): every one gave a message and kept the other typing. Sheets and steps tried 28: every one has Back, Close, Cancel or "No, keep it".

GRID (1 setup add, 2 later add, 3 change, 4 remove/end/close, 5 remove row in setup, 6 Undo, 7 after reload, 8 by asking). Y yes, N no, B broken, NA, S = in scope file (NOT BUILT or KNOWN)
| Kind | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Main bank | Y | NA one main | Y name | **N** | NA | Y | Y | Y |
| Second bank | Y | Y "Add an account" | Y name, Keep at least | Y Close/Reopen/Remove, asks | Y "Remove this account" | Y | Y | Y |
| Cash | Y | Y | Y | Y | Y | Y | Y | Y |
| E-wallet | Y | Y | Y | Y | Y | Y | Y | Y |
| Card | Y | Y | Y name, days, paid from | Y Pay it off now, Close at zero, Remove if no history | Y | Y | Y | Y |
| Loan | S | Y | Y (still owed S) | Y | S | Y | Y | Y |
| Main pay | Y | NA | Y | S | NA | Y | Y | S |
| Second income | Y | S | **B** day | S | Y | Y | Y | Y add, S remove |
| Bill | Y | Y monthly, yearly | Y, next one only | Y End (remove-mistake S) | Y (see 3) | Y | Y | Y |
| Budget line | S | Y | Y | Y End, asks | S | Y | Y | Y |
| Free to spend | Y | Y | Y | Y via 0 | Y blank | Y | Y | Y |
| Goal | S | Y | Y Save changes, Set aside | S | S | Y | Y | Y add, S change/remove |
| Spend | NA | Y | Y | Y asks | NA | Y | Y | Y (change S) |
| Refund | NA | Y | Y | Y | NA | Y | Y | Y |
| Money in | NA | Y | Y | Y | NA | Y | Y | Y |
| Move | NA | Y | Y | Y | NA | Y | Y | Y |
| Bank check | Y | Y | S | S | NA | Y | Y | Y |
| Statement | S | Y paste route | Y per line | Y per line, Undo all | NA | Y | Y | S |
| Keep at least | Y | Y Settings, account sheet | Y | Y empty | Y | Y | Y | Y |
| Currency | Y | S | S | NA | NA | NA | Y | S |
| Country | Y | NA | Y | NA | NA | Y | Y | Y |
| Reminder | NA made per bill | Y | Y | Y untick | NA | S | Y | S |
| Backup file | NA | Y | NA | NA file is outside | NA | Y Put it back | Y | S |
| Cloud copy | Y | Y | NA | Y Stop here / Delete, explained | NA | NA | not checked | S |
| Setup answers | Y | NA | Y on Plan | S (no Start again) | NA | Y | Y | Y |
| Assistant change | NA | NA | NA | NA | NA | Y card | Y Recent changes | Y |
| Pay-later | S | S | S | S | S | S | S | S |
| Cash envelopes (M92-M96) | S | S | S | S | S | S | S | S |

BLOCKERS
1. Main bank cannot be closed, removed or replaced. Plan > tap "Main bank": the sheet has only "Name", "Save", "Back". No way to make another account the main one. Someone who moves banks keeps a dead main bank forever. Should: offer "Make this the main bank" on another account, then Close on the old one, asking first.
2. Second income day change does not take effect. Plan > "Side job" > Day of the month 26 > Save: the row reads "Side job, day 26 each month, next 25 Dec". Moving Pay to day 24 then shows "Pay ... next 24 Dec" but Side job still "next 25 Dec". Repeated twice. Should: next 26 Dec, or say why not.

CONFUSING
3. Setup, Your bills, after one Save: typing a new bill's name then tapping "Remove this bill" does nothing. The "Did the Gym typo of 27 Nov leave your bank?" box appears on leaving the name and pushes the button down about 25 px, so the tap misses. A second tap works.
4. Setup bills: the first Save with a bill that has no amount shows only "Not saved yet". The reason ("Type the amount of Typo") appears only on the second press.
5. Check your bank refuses to save until every account is typed: with only Main bank filled it says "Type what Beta Savings shows today, as an amount". Cards may be left blank. Let banks, cash and e-wallets be left blank too.
6. Assistant refs move inside one chat. Seen in a list: Wallet A3, PayPay A5, Car loan A7. After closing Wallet, a new list gives PayPay A4 and Car loan A6, and the request names the closed Wallet as A7. A later step "reopen A3" answered "Reopen Card A: Card A is not closed". Removes ask first and show the name, but renames and other changes do not ask. Keep refs fixed for the life of a record.
7. Box words: "Type amount as an amount", "Type usual payment as an amount", "Type each pay period as an amount", "Type still owed today as an amount". A minus or a huge number gets the same words. Setup's main bank says "Type what Main bank shows today" for a huge number, but a second account says "That amount is too big. Check the digits". Use the second-account words everywhere.
8. Free to spend on Plan: empty gives "Type an amount above zero", but 0 is accepted and sets it to nothing. Say "Type 0 for none".
9. Settings > Recent changes lists only the 10 newest, with no "more". Anything older cannot be undone after a reload, though the line says "Undo any of these".

POLISH
- Money in rows read "back ¥5,000" ("back" is for refunds).
- Card and loan "Paid from" offers Wallet (cash) and PayPay.
- Cash and e-wallet rows on Plan say "bank today".
- Reminders checkboxes and "Lock it with a code" are 22x22.
- Served page console: "Failed to load resource: 404".
- Receipts shows "spent −¥700 of ¥48,000" after removing a spend when a refund remains.

KNOWN (IN SCOPE FILE), seen: no loan, goal or line in setup; pay account fixed. M14 (screens, after a reload) now looks fixed by Recent changes. On Add a bill, typing was kept after Back.

FOR MAKO'S EYE: none.

NOT CHECKED: removing a row by asking during the setup chat; the cloud copy after a reload and with two devices (M20); the 320 and desktop sizes; the code word for the AI.
