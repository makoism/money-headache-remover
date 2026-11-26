FAIL

Confirming run, qc-foundation (saved by LANE P from the reviewer's reply, 26 Nov about 16:30 JST). Build: lane/controls-5, tip 6974fb15, code 7c777ca3. Nothing in wip/team/engine or wip/team/store changed since 50045d72. plan3_write.test.js ALL PASS (56), chat3_core.test.js ALL PASS (71). check3.txt ALL GOOD.

The verdict is FAIL because of one new finding (N1): a card can never be closed after a bill it paid has been removed. The fix is one condition in the write door. No engine or saved-shape change is needed. F1 to F3 are all fixed.

## EARLIER FINDINGS
F1 FIXED (M45, M27, M40). Mako on 12 Dec, Card A's 10 Dec payment not ticked. Before: bank 286,000, owed 54,000, overdue 54,000, safe to spend 35,000.
- Pay it off refused: "Card A's 10 Dec payment is not ticked off yet: tick it at Check your bank, then try again". Close gets the same words.
- Ticked through checkin.js with 54,000, landed 12 Dec: bank 232,000, owed 0, overdue none, safe to spend still 35,000. Counted once.
- Pay it off after that says "Nothing is owed on Card A" and writes nothing (owedTicked, plan3_write.js:604-607, used by payOff and closeCard).

F2 FIXED (M46, M7, M13). 1,500 Streaming bill paid by Card A, card paid off.
- Close refused: "Streaming is paid by Card A. Change it to another card or account first". Moved with changeBill to Main bank, then closed. Streaming still in the engine's output, nothing dropped.
- The assistant's close_account for a card goes through the same closeAccount, then closeCard (chat3_core.js:745).

F3 FIXED (M36, M37, M95). Envelope the app thinks holds 20,000, really about 8,000, closed to Main bank.
- Without a figure refused: "Type what is in ... now". With 8,000: transfer 8,000 to Main bank and a check of 0 on the envelope, both 25 Nov, then closed.
- The 12,000 gap counts once as spent at a bank check. Main bank 286,000 to 294,000, envelope 0, safe to spend 221,400 to 209,400.
- closeWords says exactly that before writing. Screen (plan3.js:446-447) and assistant (chat3_core.js:747-753) both use closeWords and closeAccount. With no amount the assistant asks "How much is in ... now?" (chat3_core.test.js:264, 293-303).

The ai-join merge undid none of this. Later commits (8386d4bb, f4ea580f, 600ce75d, 6dca16ae) add words, dry runs or questions; they write nothing extra. Pay it off by asking uses the app's owed figure with paid:true and the door still refuses an unticked payment.

Reopen at 0, then a check (asked by LANE P): Reopen clears closed, the envelope comes back at 0. A check of 3,000 on 27 Nov counts 3,000 as money in. The 12,000 stays counted once. One case can still double count, see N3.

## NEW FINDINGS
N1, fix before merge (M13, M46): a removed bill blocks closing its card for good.
- Someone cancels a subscription paid by Card A, removes it, pays the card off and tries to close it: "Streaming is paid by Card A. Change it to another card or account first". They cannot change a removed bill.
- Cause: plan3_write.js:612 filters schedules with no live(s) check (linksTo at 543 has one). Fix: add live(s), plus a test.

N2, minor (M13): a bill ended today still blocks closing its card today.
- After endBill on Gym today (ends = 25 Nov), closing Card A the same day names Gym. The filter uses `s.ends < w.today`; the engine ends a closed account's items on the closing day (lookahead.js:295-298), so nothing would be dropped. Fix: `s.ends <= w.today`, or check for an item due after today.

N3, minor, wording (M95): Reopen does not say the money moved at the close stays where it went.
- Closed cash by mistake (8,000 moved to Main bank), Reopen says "It comes back at ¥0. Type what is in it now at Check your bank" (plan3_write.js:647). Typing 8,000 counts it in cash and again in Main bank until its next check. Undo on the close is the right step for a mistake, but nothing points there.
- Fix: reopenWords adds e.g. "The ¥8,000 moved to Main bank at the close stays there. If it never moved, use Undo on the close instead."

## MAKO_SAYS LINES TOUCHED
M45 MET. M27, M40 MET. M46, M7 MET for a live bill, NOT MET for a removed bill (N1). M13 MET for banks, cash, e-wallets; NOT MET for a card in N1's case, minor N2. M36, M37, M95 MET (N3 a words gap). M3, M6, M17 MET. M61 MET. Not built here: closing the main bank (slice 13), a loan's Still owed today (controls-6).

## GRID
55 covered, 8 not applicable, 5 empty (as before: close main bank x2, a loan's Still owed today x2, assistant undoing an older step x1). Card close cell partly covered until N1 is fixed. None FOUNDATIONAL.

## WATCH
Earlier (1) to (5) unchanged. (6) A check after a Reopen counts the whole typed figure as money in; when the ledger and statement import land, a reopened account's first imported line should be matched before the check fills the gap.

## SOUND
Refusals write nothing. Pay it off counts once after a tick. Close words are worked out on the book the close would make. The assistant asks for the amount. Closing-day order is right. A spending line cannot carry a card, so closing a card drops no line.
