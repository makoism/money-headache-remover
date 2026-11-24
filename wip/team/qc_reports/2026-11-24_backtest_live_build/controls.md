VERDICT: FAIL

CHECK: no check3.txt (round README: published page from main 6740469). Judged /tmp/qc/live/index.html, phone 390x844, file page, made-up numbers. Assistant tested with a made-up AI (window.claude stub, as in e3_ask.js), not the real one.

OWNER'S WORDS
- M1 NOT MET: Ask is a 32px header link, not the main way in.
- M2 NOT MET: setup is one long form, no chat.
- M6 NOT MET: deletes (end bill, end line, remove spend/refund) happen with no question.
- M13 NOT MET: no add or remove for banks; no remove for card, goal, pay, second income; no add second income later; cash, e-wallet not built.
- M14 NOT MET: reminders have no Undo; setup has none.
- M15 NOT MET: an empty bill row in setup blocks saving and cannot be removed.
- M16 NOT MET: setup saves all or nothing; one bad box blocks everything; Back throws all of it away.
- M17 MET for questions.
- M22 NOT MET: no "Money came in" door.
- M23 NOT MET: one bank only, no cash, e-wallet or pay-later.
- M24 NOT BUILT: no choice of where unspent money goes on any screen.
- M42 NOT MET: Keep at least cannot be changed after setup.
- M47 NOT MET: Check your bank refuses a bank below zero ("-5": "Type what Bank A shows today, as an amount").
- M79 NOT MET: the assistant can do 4 things only (log_spend, change_line, set_free, set_aside).

COUNT: kinds found 25 (24 graded, imported statement not checked). Cells 192: YES 71 / NO 76 / BROKEN 3 / N/A 42. Boxes tried 25 (114 entries). Sheets tried 19; 19 have a way back; 1 (setup) loses everything on Back, the rest lose their typing.

GRID
| Kind | 1 Add in setup | 2 Add later | 3 Change | 4 Remove, asks first | 5 Remove row in setup | 6 Undo | 7 Reload | 8 Assistant |
|---|---|---|---|---|---|---|---|---|
| Bank account | YES "Your bank" (one only) | NO | NO for name; balance only at "Check your bank" | NO | N/A one is required | YES (balance, via check) | YES | NO |
| Cash | NO (NOT BUILT) | NO | NO | NO | NO | NO | NO | NO |
| E-wallet | NO (NOT BUILT) | NO | NO | NO | NO | NO | NO | NO |
| Card | YES "Add a card" | YES Plan/Home "Add a card" | YES name, pay day, close day; owed at Check your bank; weekend rule not changeable | NO | NO | YES add, change | YES | NO |
| Loan | NO | YES "Add a loan" | YES name, day, usual payment; still owed NO | BROKEN | N/A not in setup | YES add, change | YES | NO |
| Pay | YES | N/A one main pay | YES name, amount, day, "Changes from"; weekend rule NO | NO | N/A required | YES | YES | NO |
| Second income | YES "Add a second income on the same day" | NO | YES | NO | NO (blank row traps) | YES change | YES | NO |
| Bill | YES "Add a bill" | YES "Add a bill" | YES name, amount, day, "Changes from" | NO (ends at once, no question) | NO (blank row blocks save) | YES add, change, end | YES | NO |
| Budget line | NO | YES "Add a line" | YES name, amount, when | NO ("End this line", no question) | N/A not in setup | YES | YES | NO (change only) |
| Free to spend | YES | YES (row) | YES | N/A set it to 0 | N/A blank allowed | YES | YES | YES set_free |
| Goal | NO | YES "Add a goal" | YES name, amount, date, "Set aside", "Take out" | NO | N/A not in setup | YES | YES | NO (set aside only) |
| Spend | N/A not a setup thing | YES "Log spend" | YES "Save change" | NO ("Remove", no question) | N/A | YES | YES | NO (add only) |
| Refund | N/A | YES "Refund" | YES | NO (no question) | N/A | YES | YES | NO |
| Money in (not pay) | NO (NOT BUILT) | NO | NO | NO | NO | NO | NO | NO |
| Move between own accounts | N/A | BROKEN | N/A cannot make one | N/A | N/A | N/A | N/A | NO |
| Check of the bank | YES (bank today) | YES "Check your bank" | YES check again | N/A a reading | N/A | YES "Bank checked ... Undo" | YES | NO |
| Lowest the bank should go | YES "Keep at least" | NO | NO | NO | N/A blank allowed | N/A | YES | NO |
| Currency | YES | N/A | NO "It stays the same once money is written down" | N/A | N/A | N/A | YES | NO |
| Country | NO (NOT BUILT) | NO | NO | NO | NO | NO | NO | NO |
| Reminder | N/A | YES Reminders, per bill | YES days before, time | YES untick | N/A | NO | BROKEN | NO |
| Backup file | N/A | YES "Save a backup file" | N/A | N/A file is on the person's device | N/A | YES "Put it back" | YES | NO |
| Cloud copy | N/A | YES "Keep a copy in the cloud" | N/A | YES "Turn off", says what is lost | N/A | N/A | YES | NO |
| Setup answers | YES | N/A | NO (bank name, keep at least, currency, weekend rules) | NO (no start over) | N/A | N/A | YES | NO |
| A change the assistant made | N/A | YES "Apply" | YES on Receipts or Plan | NO (Receipts "Remove", no question) | N/A | YES "Undo" / "Taken back" | YES | N/A it is the assistant |

BLOCKERS
1. Setup, blank row trap. Tap "Add a bill", leave it empty, tap "Save and see my money": "Type the amount of Bill". There is no remove on the row. Same for "Add a second income on the same day" ("Type how much Pay is", wrong name) and "Add a card" ("Type what is on Card now, or 0"). Only ways out: type 0 (a ¥0 bill or card is kept forever on Plan) or Back, which loses everything.
2. Setup Back loses everything with no question. Fill the whole form, tap "Back": Welcome screen, every box empty when you come back.
3. Bank account: no "Add a bank", no rename, no remove on any screen or sheet. Moved therefore cannot work: Receipts, "Moved", To list is empty, "Pick the account the money went to".
4. No remove or close for: card (sheet has Name, two days, Save, Back), goal (sheet has Set aside, Save changes, Take out, Back), pay and second income (Save, Back only). No way to add a second income after setup (Plan has "Add a bill" only).
5. Loan cannot be closed: "Close this loan" says "Auto still owes money. Tick its last payment at Check your bank first", but loans are not in Check your bank and "Still owed" cannot be changed.
6. Removes do not ask: "End this bill", "End this line", Receipts "Remove" act at once. Undo saves it, but nothing says what is lost.
7. Reminders not kept: change "Remind me" to "A week before", time to 20:00, untick "The middle of each pay period", Close, reload: back to "2 days before", 09:00, all ticked. Repeated once on its own: same.
8. Keep at least, currency, bank name, weekend rules: set in setup, no screen changes them later. No start over.
9. Assistant: "Delete my rent" and "Add a bank" give "Left out because the app could not read them: a change Ask can't make (remove_bill)" (and "(add_account)"). It cannot add a line or goal, change or remove a spend, touch bills, pay, cards, loans, banks.
10. Bank below zero cannot be typed at Check your bank or setup ("-5" refused).

CONFUSING
- "Type amount as an amount", "Type each pay period as an amount", "Type still owed today as an amount" (Plan sheets, for -5 and 999999999999999). Say "Type a number above zero, like 5000" and "That is too big".
- "Left out because the app could not read them: a change Ask can't make (remove_bill)". Say "I can't remove a bill yet. Do it on Plan, tap the bill".
- Setup accepts a ¥0 bill; Plan refuses one ("Type the amount above zero").
- Home: "¥260,000 (more than Free to spend left this period)" in the safe to spend sum is unclear.
- Android back from any sheet leaves the app (history length 2, back goes to a blank page).

POLISH
- "Save a backup file" downloads with no "saved" words.
- The Undo bar stays over later sheets (Settings, other Plan sheets).
- Console error on the served page: 404 on /api/vault/... before the first cloud copy.

FOR MAKO'S EYE
- Ended bills stay listed ("ended 10 Dec").

NOT CHECKED
- Imported statement (add, remove one import): needs a statement read by the AI; no made-up reader for it.
- Desktop and 320 width for these flows.
- "Change the next one only" and Home "Add a card" opened but not saved.
