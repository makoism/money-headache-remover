VERDICT: PASS

CHECK: (last lines of check3.txt)
(full level, 3 at a time, 869 s in all)
ALL GOOD

Second confirming run (confirm2_qc-controls.txt) against qc-controls_confirm.md. Build: worktree c5, lane/controls-5 at 3542ef58 (app as 7c777ca3), app3/index.html, phone 390x844. Book: Mako's setup by chat on 24 Nov (made-up AI), then on Plan: Wallet (cash) 55,000, Beta Bank 50,000, PayPay (e-wallet) 3,000, Car loan 900,000 owed. Assistant: made-up AI, doors only, not how the real one talks. Marks for lines not walked again are carried over from qc-controls_confirm.md and qc-controls.md. No page errors in any run.

OWNER'S WORDS
- M13 MET for close and reopen of bank, cash, e-wallet, card and loan. Main bank close: NOT BUILT (IN SCOPE FILE). Other M13 parts carried.
- M14 MET: Undo after every close, pay off and reopen I made, screens and asking.
- M6 MET for these doors: the close asks first with what moves and what counts as spent; pay off asks.
- M15, M16, M17, M19, M22, M25 carried MET. M18, M23, M24 NOT BUILT (IN SCOPE FILE). M20 carried COULD NOT TELL.

COUNT: earlier blockers 6: FIXED 6, NOT FIXED 0. New blockers 0. Close/reopen grid cells 30: YES 29, N/A 1 (main bank, in scope file). Close box values tried 7. Questions and sheets tried 11, each with "No, go back" / "No, keep it" / "Not now" and Back.

EARLIER BLOCKERS
1. FIXED. Plan > Wallet > Close this account, Move it to Main bank, 8000: "Close Wallet? ¥8,000 moves to Main bank. The app had ¥55,000: the other ¥47,000 counts as spent today, like a bank check. Safe to spend goes from ¥306,400 to ¥259,400. Its history stays". Changing the box to 3000 (and also changing the "Its money" choice) drops the question at once. Asked again with 3000: "¥3,000 moves ... the other ¥52,000 counts as spent ... from ¥306,400 to ¥254,400"; Yes: Main bank ¥286,000 to ¥289,000, Home safe to spend ¥254,400, Wallet under Closed. Undo: ¥286,000, ¥306,400, Wallet back at ¥55,000. With 0: "Nothing moves to Main bank. The app had ¥55,000: the other ¥55,000 counts as spent ... to ¥251,400"; Home ¥251,400; Undo puts it back. Beta Bank ¥50,000 with 0: "the other ¥50,000 counts as spent ... from ¥306,400 to ¥256,400"; Home ¥256,400; Undo back to ¥306,400.
2. FIXED. Huge number: "That amount is too big. Check the digits". Empty: "Type what is in Wallet now"; "abc": "Type what is in it now as an amount"; "-500": "That can't be below zero. Type it without the minus". Each time the typed value and the chosen account stay. The error goes when the question shows.
3. FIXED. By asking, "close card B" (¥23,000 owed) and "close the car loan" (¥900,000) are refused at once with no question: "Not changed ... Card B still has ¥23,000 on it. Use Pay it off now if you paid it all, or tick its payment at Check your bank when it has gone". Close Wallet with no amount: "Not done: one step that needs an answer from you first. Nothing changed. How much is in Wallet now?". After "there is 3000 left" the card names ¥3,000 and the ¥52,000 spent, Do it moved ¥3,000, Undo put it back.
4. FIXED. Card A close while owing: one message, "Card A still has ¥54,000 on it. Use Pay it off now if you paid it all, or tick its payment at Check your bank when it has gone". Tapping Pay it off now replaces it with "Did you pay all ¥54,000 on Card A today, from Main bank? It is written as paid today / Yes, I paid it / No, keep it". Loan the same with "Car loan still owes ¥900,000". At zero: "Close Card A? Its payment day stops. Its history stays", "Close Car loan? It leaves your plan".
5. FIXED. Closed Wallet: "Reopen it if you use it again. It comes back at ¥0. Type what is in it now at Check your bank"; card: "It comes back with ¥0 on it. Type what is on it now at Check your bank". By asking: "Reopen PayPay. It comes back at ¥0. Type what is in it now at Check your bank", with Undo.
6. FIXED. "I paid off card B": "Pay off Card B: ¥23,000 from Main bank, today / Did you pay all of it today? It is written as paid today / Do it / Not now". No "AI's guess" words.

GRID ROW: close and reopen (screens Yes words; Undo; after reload; by asking)
| Kind | Close on screens | Reopen | Undo | After reload | By asking |
|---|---|---|---|---|---|
| Bank (Beta Bank) | Y "Close this account" then "Yes, close it" | Y "Reopen" | Y | Y (carried) | Y (carried) |
| Main bank | N/A in scope file | N/A | N/A | N/A | N/A |
| Cash (Wallet) | Y | Y | Y | Y | Y asks amount, card, Undo |
| E-wallet (PayPay) | Y, spent: "What it held (¥0) counts as spent today" | Y | Y | Y closed after reload | Y close with 2,500 (¥500 spent named), reopen |
| Card | Y refused while owed, Pay it off now, close at zero | Y "Card A open again" | Y | Y closed after reload | Y refused while owed, pay off asks |
| Loan | Y refused while owed, Pay it off now, close at zero | Y (carried) | Y | Y (carried) | Y refused while owed |

BLOCKERS: none.

CONFUSING
- Pasted "1,2,3" is read as ¥123 with no word; the question does show ¥123, so it is caught before writing.
- By asking, a refusal reads "Not changed: Close Card B. Its history stays: Card B still has ..." (the LATER item in scope.txt). With my made-up AI, refusals also ended "The app did not do this: nothing was added", odd for a close; may come from my fake's wording.

POLISH: the "Undone" notice stays on screen into the next sheet.

FOR MAKO'S EYE: none.

NOT CHECKED: later days (all steps on 24 Nov, setup day; later-day closes carried from qc-controls_confirm.md); loan reopen and bank close by asking not walked again (carried); 320 and desktop sizes; the earlier unexplained Wallet rise from ¥10,000 to ¥55,000 (not seen in any of my runs, which close, Undo and close again).
