VERDICT: PASS (confirming run of qc-controls.md, run 1)

CHECK: check3.txt ends "...e3_layout.js: PASS) / (full level, 3 at a time, 853 s in all) / ALL GOOD". fake_ai_page.js present; assistant tested with the made-up AI only (doors, cards, Undo), never a real one.

OWNER'S WORDS (only those this run touched; every other mark carried over from qc-controls.md)
- M13 MET for blockers 2, 4, 6 (below). Rest as run 1: KNOWN or NOT BUILT (IN SCOPE FILE).
- M14 MET for every add and change walked here, screens and assistant, and for an assistant remove after a reload. Reminders have no Undo: KNOWN (IN SCOPE FILE, "Reminders kept, with Undo: queued").
- M16 MET on Check your bank: a blank box no longer blocks the rest.

COUNT: run 1 blockers checked 4 of 4 (2, 3, 4, 6), all gone; Reminders item gone. Grid cells walked again: 19 (Bill 2, 3, 6, 7, 8; Card 2, 3, 6, 7; Loan 3, 6, 7; Bank check 2, 6, 7; Reminder 3, 4, 7; Goal 8). YES 18, NO 1 (bill "how often", carried from run 1), BROKEN 0. The four BROKEN cells of run 1: Loan remove is KNOWN (IN SCOPE FILE); Reminder change, remove and reload are now YES. Boxes tried: 2 (Beta Bank on Check your bank: a letter, then empty). Sheets tried: 5 (Add a bill, Add a card, Add a loan, bill, card and loan change sheets, Reminders), each has Back or Close.

What I did (390 wide unless said): setup on the screens with Alpha Bank, Beta Bank, Wallet cash, Pay, Side gig, Card A paid from Beta, Rent, Power, a yearly Insurance; reload a week later.
- Blocker 2 gone. Setup's last step, the chat's "Filled in" card and the guide's step 15 all say "Loans, goals and budget lines like Gifts are not part of setup. Add them on Plan after this: Add a loan, Add a goal, Add a line".
- Blocker 3 gone. Check your bank, Beta "abc": "Type what Beta Bank shows today, as an amount, or leave it blank", other typing and ticks kept. Beta empty, Save: "Bank checked", Undo; Alpha saved, Beta still "checked 24 Nov". Undo, again, reload: right.
- Blocker 4 gone. Plan, Add a bill, "Once a year", "Month it is due" May, "Paid from" Beta: "Bill added", Undo "Undone". Car tax's Paid from changed, Undo, changed again; Card A's Paid from and "the working day before"; a loan's Paid from changed and undone: all right after a reload.
- Blocker 6 gone. Assistant remove of P2 with B2: Power ended after "Do it", the pay refused with "Not done: removing a pay, which the app cannot do yet. You can change it on Plan: tap it". G1: same for a goal. Undo of the end after a reload brings Power back.
- Reminders gone. Untick middle check, "A week before", 20:30, untick Power: "Saved on this phone", all kept after a reload.
- After a screens setup the chat no longer shows setup questions.

BLOCKERS: none.

CONFUSING
- Assistant, pay refused in a two-step remove: "... tap it. Say that part again on its own". Saying it again cannot work. Drop that sentence.
- Assistant, goal refused: the next line reads "The app did not do this: nothing was added". Nothing was removed. Say "Nothing changed".
- Rent's Paid from, with its 27 Nov payment not ticked: "The payment of 27 Nov is not ticked off yet. Tick it at Check your bank first". Plain and it works after the tick, but a person changing only the account for later is sent elsewhere first.

POLISH
- Add a loan has no weekend rule; the loan's change sheet then shows one, set to "the working day after".
- A bill's change sheet still has no "How often" (monthly to yearly means End and Add). Carried from run 1.
- Plan still shows "bank today" under Wallet cash.

FOR MAKO'S EYE: none.

NOT CHECKED: the new Plan "Add an account" (seen, not walked); a card's Paid from given as a card; boxes other than the one above; 320 and desktop sizes for the sheets; everything in run 1's NOT CHECKED. Other marks carried over from qc-controls.md.
