VERDICT: FAIL. 56 cells NO, 8 BROKEN, 2 kinds NOT BUILT; M13, M14, M23 NOT MET; M24 NOT BUILT (no scope.txt). Round note: `app3/tests/fake_ai_page.js` and `app3/tests/README.md` are missing in this build, so the assistant was driven with the stand-in from the top of `e3_ask.js` (a made-up AI: it proves the doors, not how the real one talks).

CHECK:
```
[x] The real-page walk (walk 4 run A) as a gate: Mako's made-up shape from setup on 24 Nov to 15 Feb through the page, safe to spend and the bank at every step are the hand-worked figures  (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): bank today, pay with a second income, cards with a close day or not sure, bills, the minimum; through build_book and the store  (tests/e3_setup.js: PASS)

(full level, 3 at a time, 364 s in all)
ALL GOOD
```

OWNER'S WORDS (section B)
- M13 NOT MET. No add, rename or remove of a bank, cash or e-wallet after setup. No remove of a card, goal or second income.
- M14 NOT MET. Undo follows every money change, but is one step deep, gone after a reload, and absent on Reminders.
- M15 MET. Plan > bill > "End this bill"; an empty amount says "Nothing changed" and Back works.
- M16 MET. Six parts, each "Save" then "Saved". One bad bill did not block the other five.
- M17 MET (door only). "Ask" is in the header on every screen.
- M18 COULD NOT TELL. Four "?" on Home, some on Plan, none elsewhere.
- M19 MET. Backup, restore, "Put it back", cloud code on a second device.
- M20 MET, but the two choices read the same.
- M21 COULD NOT TELL. Only Chrome at phone size was run.
- M22 MET. Receipts: "Money went out", "Money came in".
- M23 NOT MET. No pay-later. Banks only in setup.
- M24 NOT BUILT. Food ended a pay period 16,000 unspent; nothing asked where it goes.
- M25 MET. No 3D here.

COUNT: 27 kinds found, plus 2 NOT BUILT. 216 cells: 103 YES, 56 NO (11 are PART: some fields have no way), 8 BROKEN, 48 N/A, 1 not checked. 65 boxes tried with 297 entries, none left a person stuck. 26 sheets and steps tried, all have a way back.

GRID. 1 add in setup, 2 add later, 3 change, 4 remove or end, 5 remove a row in setup, 6 Undo, 7 after reload, 8 assistant. Y = YES, with the button where it helps.

| Kind | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Bank account | Y "Add another account" | NO | NO (PART: figure only, "Check your bank") | NO | Y "Remove this account" | Y | Y | NO |
| Cash | Y | NO | NO (PART) | NO | Y | Y | Y | NO |
| E-wallet | Y | NO | NO (PART) | NO | Y | Y | Y | NO |
| Card | Y | Y "Add a card" | NO (PART: paid-from, weekend rule) | NO | Y "Remove this card" | Y | Y | NO |
| Loan | NO | Y "Add a loan" | NO (PART: still owed) | BROKEN | N/A | Y | Y | NO |
| Pay | Y | N/A always one | NO (PART: lands-in, weekend rule) | N/A "No fixed pay" | N/A | Y | Y | NO |
| Second income | Y | NO | NO (PART: lands-in) | NO | Y "Remove this income" | Y | Y | NO |
| Bill | Y | Y "Add a bill" | NO (PART: paid-from, yearly) | BROKEN no ask | Y | Y | Y | NO |
| Budget line | NO | Y "Add a line" | Y | BROKEN no ask | N/A | Y | Y | NO (PART: amount only) |
| Free to spend | Y | Y "Set Free to spend" | Y | N/A set 0 | N/A | Y | Y | Y |
| Goal | NO | Y "Add a goal" | NO (PART: where kept) | NO | N/A | Y | Y | NO (PART: set aside only) |
| Money set aside | N/A | Y "Set aside" | N/A | Y "Take out" | N/A | Y | Y | Y |
| Spend | N/A | Y "Log spend" | Y "Save change" | BROKEN no ask | N/A | Y | Y | NO (PART: add only) |
| Refund | N/A | Y | Y | BROKEN no ask | N/A | Y | Y | NO |
| Money in | N/A | Y | Y | BROKEN no ask | N/A | Y | Y | NO |
| Move | N/A | Y | Y | BROKEN no ask | N/A | Y | Y | NO |
| Bank check | N/A | Y "Check your bank" | NO | NO | N/A | Y | Y | NO |
| Imported statement | NO | Y "Add 3 lines" | Y by line | NO as a whole | N/A | Y | Y | NO |
| Keep at least | Y | NO | NO | NO | N/A | Y | Y | NO |
| Currency | Y | N/A | NO | N/A | N/A | Y | Y | NO |
| Country | Y | N/A | NO | N/A | N/A | Y | Y | NO |
| Reminder | N/A | N/A fixed set | Y | Y untick | N/A | NO | BROKEN | NO |
| Backup file | N/A | Y "Save a backup file" | N/A | N/A | N/A | Y "Put it back" | Y | N/A |
| Cloud copy | N/A | Y "Keep a copy in the cloud" | N/A | Y "Stop here" / "Delete the cloud copy" | N/A | N/A asked first | Y | N/A |
| Setup answers, whole | Y | NO | NO | NO | Y | Y | Y | NO |
| Assistant's change | N/A | Y "Apply" | Y untick | Y "Not now" | N/A | Y | Y | N/A |
| Code word for the AI | N/A | Y "Keep it" | Y "Change it" | Y "Clear it" | N/A | Y | not checked | N/A |
| Pay-later (M23) | NOT BUILT | | | | | | | |
| Where unspent money goes (M24) | NOT BUILT | | | | | | | |

BLOCKERS (phone 390x844)
1. Accounts are setup only. After "See my money", tapping "Bank today: Tana Bank" on Home does nothing. Plan offers "Add a line", "Add a bill", "Add a goal", "Add a card", "Add a loan", nothing for a bank, cash or e-wallet. Setup cannot be reopened.
2. No remove for a card, goal or second income. Plan > Visa: "Save / Back". Plan > Trip: "Set aside / Save changes / Take out / Back". Plan > Tutoring: "Save / Back". Plan > Car loan > "Close this loan": "Car loan still owes money. Tick its last payment at Check your bank first", and "still owed" has no box, so a loan typed wrong stays wrong.
3. Undo is one step and does not last. Add line "First", add line "Second", Undo: only "Second" goes. After a reload there is no Undo. With 2, a slip is permanent.
4. A bank check cannot be changed or removed. Type 300000 where 309600 was expected: Receipts shows "Found at your bank check on 8 Dec ... more went out than you logged, on Free to spend ¥9,600", not tappable. Bills ticked in a check cannot be unticked later.
5. Check your bank needs every account. Fill only Kiri Bank, "Save": "Type what Tana Bank shows today, as an amount". A minus figure gets the same words, so an overdrawn bank cannot be typed.
6. Reminders are not kept. Untick "The middle of each pay period", pick "On the day", "Close", reload: both are back. Seen twice. No "saved", no Undo.
7. "Keep at least", currency and country cannot change after setup. Settings: "It stays the same once money is written down." No start over.
8. The assistant makes four changes: log a spend, a line's amount, Free to spend, set aside. Ten others (add or remove a bill, add a bank, change pay, add a goal, refund, money in, move, remove a spend, bank check) gave "Left out because the app could not read them: a change Ask can't make (remove_bill)".
9. Nothing asks before a remove. "End this bill", "End this line" and Receipts > "Remove" act at once ("Removed ¥1,200, Free to spend / Undo"). M6 says deletes ask first.
10. Adding later does less than setup: "Add a card" and "Add a loan" say "paid from your main bank" with no choice; "Add a bill" has no "Once a year" and no account. Setup has no loan, goal, line or statement.

CONFUSING
- Two devices, one bill: both choices read '"Rent", changed 8 Dec, 04:47 / Keep this one'. Show each amount.
- "Type amount as an amount". Use "Type the amount in numbers, like 1200". A huge number gets the same words.
- Emptying a box on a change sheet: "Nothing changed". Say "Type an amount, or tap Back".
- Free to spend: blank says "Type an amount above zero", yet 0 saves.
- Setup: Undo on "Your bank: saved" empties every box in that part.
- "Ask the browser to keep it" and "Send now" show nothing after a tap.
- Receipts: "Money in ... back ¥5,000". Drop "back".

POLISH
- "?" buttons are 28x28.
- Turning the cloud copy on logs a 404 in the console.
- "What was read" > "Back" clears the pasted answer.
- "Choose a file for at least one account first" stays after a file is chosen.

FOR MAKO'S EYE
- An ended bill stays listed as "ended 1 Dec" for good.

NOT CHECKED
- Desktop, 320 wide, light scheme.
- "Read with the AI" (only the paste path was run), and the real AI.
- A locked backup; "I have a code" on a device that has money.
- Each pay rhythm, a yearly bill, a goal "In an account of its own", a loan paid off then closed.
- Code word after a reload; card boxes in Check; note and goal date boxes; calendar links; controls in the made-up book.
