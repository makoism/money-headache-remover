VERDICT: PASS (confirming run against the earlier qc-controls.md, FAIL with five blockers, at git f8d18731)

CHECK: check3.txt ends "...(tests/e3_layout.js: PASS) / (full level, 3 at a time, 849 s in all) / ALL GOOD". Assistant tested with the made-up AI only (fake_ai_page.js present).

OWNER'S WORDS: M13 MET for the places walked (blockers 2 to 4 gone; blocker 5 is KNOWN in scope.txt). M14 MET for the places walked; Reminders Undo stays NOT BUILT (IN SCOPE FILE). M23 MET for the card/bill/loan paying account. All other marks carried over from the earlier report, not walked again.

COUNT: 4 of 4 blockers gone (5th KNOWN). Grid cells walked again: 22, all YES. Boxes tried: 6 (Add a bill empty; pay-came-in day empty, after today, before the range; a bank figure with a minus; a bill amount pasted with a comma). Sheets tried: 8 (Reminders, Add a bill, bill sheet, Add a card, card sheet, Add a loan, loan sheet, Check your bank), all with Back or Close.

What I did: setup by chat with Main bank and Beta Bank, today 24 Nov; then later days 1, 12 and 29 Dec, phone 390.
1. Reminders: unticked Rent and "The middle of each pay period", "3 days before", 08:30. It says "Saved on this phone. A calendar you already filled changes only when you save the calendar file again". Close, reload: all four choices kept. GONE.
2. Yearly bill on 1 Dec: Plan > Add a bill > How often "Once a year", "Month it is due" May, day 31, Paid from Beta Bank, amount "39,500". "Bill added" / Undo / "Undone" work; reload shows "each year on 31 May, next 31 May 2027". Its sheet changes month and day ("each year on 15 Sep"), Undo puts it back, kept after reload. Empty Add says "Type a name". GONE.
3. Cards: Add a card has "Paid from" and the weekend rule. Card C from Beta Bank, "the working day before": add, Undo, add, reload, change to Main bank and Undo, all right. Card A moved to Beta Bank on 1 Dec: Check your bank on 12 Dec lists "Card A | 10 Dec, Beta Bank" and Beta's expected figure drops by 54,000; nothing earlier moved. On 12 Dec, Card B (11 Dec not ticked) to Beta Bank is refused: "The payment of 11 Dec is not ticked off yet. Tick it at Check your bank first: a change of account counts from the next one", the choice stays in the box. After ticking at Check your bank, the same change says "Card B changed", Undo works, kept after reload. Loans: Add a loan has "Paid from"; the loan sheet changes account and weekend rule, with Undo. GONE.
4. Bills: on 1 Dec, Rent (27 Nov not ticked) to Beta Bank gives the same refusal words; after ticking, "Bill changed", Undo, kept after reload. On 29 Dec Check your bank lists "Rent | 28 Dec, Beta Bank"; 27 Nov stayed on Main bank. GONE.
5. Assistant: add_card {account: Beta Bank, shift before} adds "Card D, paid on day 20 from Beta Bank" (Plan), next payment 18 Dec; change_bill {account} makes Power "paid from Beta Bank from its next one". After a reload both change cards still offer Undo; each Undo works and Plan shows them gone.
6. Pay-came-in day box: empty, after today and before the range each say "Pick the day Pay came in, between 25 Nov and today"; ticks, unticks and bank figures typed survive.

BLOCKERS: none.

CONFUSING
- Plan's bill rows do not say which account pays ("Rent / day 27 each month, next 28 Dec"); card rows do ("paid on day 10 from Beta Bank"). Add "from Beta Bank" to the bill row.
- For qc-numbers: moving Power (next due 26 Dec, after the 10 Dec pay) to an already short Beta Bank showed "Safe to spend 107,400 to 100,000" on the change card. Possibly right (a bank's later shortfall counted), but the card does not say why.

POLISH
- Add a loan has no weekend question (it is set to "the working day after" without asking); Add a card asks it.

FOR MAKO'S EYE: none.

NOT CHECKED: the assistant's yearly add_bill and add_loan with an account; desktop and 320 sizes for the new fields; Reminders' calendar file after a change.
