VERDICT: FAIL

CHECK: (last lines of check3.txt)
[x] Setup, short (setup3): ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide (M52, M33): ... (tests/e3_layout.js: PASS)
(full level, 3 at a time, 927 s in all)
ALL GOOD

Confirming run (confirm_qc-controls.txt) against qc-controls.md in this folder. Written as qc-controls_confirm.md so the named report is not overwritten. Build: c5f worktree app3/index.html, phone 390x844. Book: Mako's setup by chat on 24 Nov (made-up AI), later days 1 and 8 Dec after reloads; added Side job (by asking), Beta Bank, Wallet (cash), PayPay (e-wallet), Car loan on Plan. Assistant: made-up AI, doors only. Marks for lines not walked again are carried over from qc-controls.md.

OWNER'S WORDS
- M13 NOT MET: new blocker below on closing an account. Main bank close or replace: NOT BUILT (IN SCOPE FILE), marked KNOWN.
- M14 MET (carried, plus Undo checked on every new door below).
- M15 MET (carried). M16, M17, M19, M22, M25 carried MET. M18, M23, M24 NOT BUILT (IN SCOPE FILE). M20 COULD NOT TELL (carried).

COUNT: old blockers 2: 1 KNOWN (in scope file), 1 gone. Grid rows refilled 6 (cells 36: YES 32, BROKEN 1, S 3). Boxes tried 1 new ("What is in it now", 6 values). Refusals tried 7 (4 screens, 3 assistant). Sheets and questions tried 9: all have Back or "No, keep it" / "Not now".

OLD BLOCKER 2: GONE. Plan > Side job > Day 26 > Save: "day 26 each month, next 25 Dec (26 Dec is a Saturday, so the working day before)". Undo: back to "day 25 ..., next 25 Dec". Day 15 (a Tuesday): "next 15 Dec", same after reload, and on 8 Dec. By asking (change_bill P2 day 27): card "Side job: on day 27 from its next one", Plan "next 25 Dec (27 Dec is a Sunday, ...)", the picture sent to the AI has the same words; Undo on the card puts it back; day 16 "next 16 Dec", same after reload.

GRID, refilled rows (1 setup add, 2 later add, 3 change, 4 close/pay off/remove, 5 remove row in setup, 6 Undo, 7 after reload, 8 by asking)
| Kind | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Second bank | Y | Y | Y | **B** close question (blocker 1); Reopen Y | Y | Y | Y | Y close with amount, asks, Undo |
| Cash | Y | Y | Y | **B** same door | Y | Y | Y | Y |
| E-wallet | Y | Y | Y | Y close (assistant); screens same door as above | Y | Y | Y | Y "PayPay: ¥2,500 moves to Main bank, the app had ¥3,000" |
| Card | Y | Y | Y | Y "Pay it off now" asks "Did you pay all ¥54,000 ... Yes, I paid it / No, keep it"; Close refused with ¥54,000 owed, asks at zero "Close Card A? Its payment day stops"; Remove refused "has history"; Reopen | Y | Y | Y | Y (see confusing 3) |
| Loan | S | Y | Y | Y Pay it off asks; Close refused "still owes money"; Remove asks "added by mistake" | S | Y | Y | Y refusal shown |
| Second income | Y | S | Y day (fixed) | S | Y | Y | Y | Y change, S remove |
(Rows 4 and the E-wallet row of the old grid were Y on Close only in shape; the close question is now judged.)

BLOCKERS
1. Close an account on the screens: the question can say one amount and the app does another, and it never says what is lost. Plan > Wallet (cash, ¥55,000) > Close this account > "Move it to Main bank", What is in it now 8000 > Close this account. Shown: "Close Wallet? ¥8,000 moves to Main bank. Its history stays / Yes, close it / No, keep it". Change the box to 3000 and tap "Yes, close it": Main bank goes ¥232,000 to ¥235,000, so ¥3,000 moved, not the ¥8,000 agreed; the other ¥52,000 is counted as gone without a word. Repeated twice (Beta Bank 45,000 asked, 30,000 done; Wallet). Also with 0 typed for Beta Bank (¥50,000): "Close Beta Bank? ¥0 moves to Wallet. Its history stays"; safe to spend falls ¥210,400 to ¥160,400 and nothing said that ¥50,000 counts as spent. Should: drop the question when the box changes, and say what the assistant's card already says: "¥3,000 moves to Main bank, the app had ¥55,000: ¥52,000 counts as spent".

CONFUSING
2. "What is in it now" box: after an error the old message stays on screen under the next question ("Type what is in it now as an amount" above "Close Beta Bank? ¥0 moves ..."); a huge number gets "as an amount" (use "That amount is too big. Check the digits"). A minus with the old question still showing is refused (good).
3. By asking, "close card B" with ¥23,000 owed first asks "This takes something away. Do it?" and only after "Do it" says "Not changed: ... Card B still has ¥23,000 on it. Pay it off first". Same for "close the car loan". Refuse before asking. Close by asking with no amount says only "Not done: one step that needs an answer from you first" and not which answer.
4. Close this loan refusal says "Tick its last payment at Check your bank first" while "Pay it off now" is the button next to it; the card's words name both. Both messages stay stacked after tapping Pay it off now.
5. Reopen after a close "not there any more (spent)" brings Beta Bank back at ¥0, though the sheet says "Reopen it if it was closed by mistake". Say "Check your bank to set what it holds".
6. By asking, "Pay off Card B: ¥23,000 ... (my guess) You didn't type this amount, it's the AI's guess" for the figure the app itself holds.

POLISH
- "Paid from" on cards and loans still offers Wallet and PayPay.
- Old chat cards keep a live "Do it": tapping an older one made a newer card fail with "this changed somewhere else while it was open".

FOR MAKO'S EYE: none.

NOT CHECKED: during a run of Beta Bank close, reopen and close steps (one of my scripts stopped half way), Wallet rose from ¥10,000 to ¥55,000; Settings > Recent changes shows only "Beta Bank closed" as the last entry. I could not repeat it within the 60k limit: trace it (close Beta Bank to Wallet, reopen, close again). Merge door count beyond the doors above; 320 and desktop sizes; cloud copy.
