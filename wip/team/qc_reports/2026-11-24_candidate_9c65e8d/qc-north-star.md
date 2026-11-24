VERDICT: FAIL

Round notes: `wip/team/app3/tests/fake_ai_page.js` and `tests/README.md` are missing, so the assistant was tested with the stub at the top of `e3_ask.js`. No `scope.txt`, no screen pack. The branch head is 8a54e82; the page file is the same file as at 9c65e8d, so this is the named build.

CHECK (last five lines of check3.txt):
```
[x] The real-page walk (walk 4 run A) as a gate: ... (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): bank today, pay with a second income, cards with a close day or not sure, bills, the minimum; through build_book and the store  (tests/e3_setup.js: PASS)

(full level, 3 at a time, 364 s in all)
ALL GOOD
```

CHECKS
1. Owner's words: FAIL. 2. North star: PASS (bank, safe to spend and "checked today, on 24 Nov" are on the first phone screen and add up). 3. The way in: FAIL. 4. Fresh eyes: FAIL. 5. Nothing lies or breaks: FAIL. 6. Safe with data: PASS on one device (restore keeps the old copy, every delete has Undo), but see blocker 4. 7. Picture first: no picture anywhere, reported below.

OWNER'S WORDS
A. M1 NOT MET: "Ask" is a 32x44 text link, top right. On a new phone it answers "Set up first". M2 NOT BUILT: setup is one form page. M3 NOT MET: Ask can make four changes (log a spend, change a line, Free to spend, set aside). Asked to remove a bill, change the pay, add a card, set the bank: "Left out because the app could not read them: a change Ask can't make (remove_bill)". M4 NOT MET: Ask takes no files. M5 MET. M6 NOT MET: Ask says "Nothing changes until you tap Apply" for every change; on the screens "Remove" (a spend) and "End this bill" do not ask first. M7 MET, in words only. M8 COULD NOT TELL. M9 NOT MET: setup asks for everything by typing; "Add statements" shows only after setup. M10 NOT MET: no picture, four buttons, up to five lists on Home. M11 MET. M12 COULD NOT TELL.
B. M13 NOT MET (blocker 2). M14 MET, but every Undo is gone after a reload. M15 MET: empty amount gives "Nothing changed" and Back works; after setup a bill can only be ended and stays listed as "ended 24 Nov". M16 MET ("Your bank: saved", Undo). M17 NOT MET before setup. M18 NOT MET: 4 question marks on Home, 0 on Plan, Receipts, Check your bank, setup, Settings. M19 MET. M20, M21, M24 COULD NOT TELL (not reached). M22 MET. M23 MET in setup only; no pay-later kind seen. M25 MET.
C. M26 to M32, M34, M35 MET. M33 COULD NOT TELL.
D. M36 to M43, M47, M50 MET (M39: it tells you "after tax", it does not ask). M51 NOT MET: "Everyday spending" and "Free to spend" are one thing; the made-up book on 10 Dec shows "Safe to spend until next pay on 12 Jan 2027" and "Next pay 10 Dec, today" together. M44, M45, M46, M48, M49 COULD NOT TELL.
E. M52 NOT MET. M53 NOT MET: setup is six sections on one page. M54 COULD NOT TELL. M55 MET. M56 NOT MET: the section is still headed "Everyday spending"; Home says "Add your everyday spending". M57 NOT BUILT. M58, M59 MET. M60 NOT BUILT (he said later).
F. M61, M69 MET. M67 NOT MET (blocker 4). M62 to M66, M68 COULD NOT TELL from the screens.

COUNT: 69 lines. MET 34, NOT MET 14, NOT BUILT 3, COULD NOT TELL 18. Failing the gate (A, B, D, F): M1, M2, M3, M4, M6, M9, M10, M13, M17, M18, M51, M67.
Jobs: 5 DONE, 3 STUCK.
1. STUCK the owner's way (no chat setup). DONE on the screens alone.
2. STUCK. Pay: DONE. Bill: changed and ended, DONE. Bank name, a second account, a second income, the minimum: no screen after setup changes, adds or removes them. Card: renamed, cannot be removed.
3. DONE. Typed 398,500: "¥398,500, checked today, on 24 Nov", same after reload.
4. STUCK at "remove it". Added Finch card; "After your cards are paid on 10, 11 and 21 Dec" went 622,500 to 607,500. Its sheet has only "Save" and "Back".
5. DONE. Logged, searched, fixed "lunhc", removed, Undo.
6. DONE. 12 Dec: "Pay not in yet", late Phone bill shown as "Phone 7 Dec, late", figures right after the check.
7. DONE for the move: Home, Plan and Receipts word for word the same on phone two. See blocker 4.
8. DONE. Restore, then "Put it back", figures back, same after reload.

BLOCKERS
1. The way in is a form (M1, M2). Phone 390, first open: "Welcome to the burrow ... Set up with your own numbers". Tap "Ask": "Set up first". It should open on the assistant.
2. After "See my money" there is no way back to the bank, the accounts, a second income or "Keep at least" (M13). Settings: "The currency is chosen in setup". Receipts, "Moved": "You have one, so there is nowhere to move it to yet", with no way to add one. Card and goal sheets have no remove.
3. The assistant cannot do what he asks it (M3, M4), see A above.
4. A spend logged on the second phone did not reach the first (M67). Two phones on one code, phone two logs ¥700 "tea". After 30 seconds, after phone two left the page, and after reloading phone one: not there, Home still "¥412,000". Phone two's Settings said "On. Last in step with the cloud at 04:28". It arrived only after "Send now". Repeated twice. A longer timer was not ruled out.

CONFUSING
- Home: "¥276,000 (what your accounts can spare) − ¥244,000 (held back: Free to spend has only ¥32,000 left this period) = ¥32,000". Setup said "Safe to spend leaves room for it", which reads the other way. Say: "You planned ¥32,000 for everyday things until pay, so that is what is safe".
- 12 Dec, straight after checking and leaving Phone unticked: headline "Time to check in. 1 thing to tick off since 12 Dec".
- 12 Dec before the check: Wren card is under both "Card and loan payments overdue" and "May still go through"; "After your cards are paid on 12 and 21 Dec" (they were due 10 and 11).
- Cards after paying: "Nothing to pay yet, checked 24 Nov, ¥0". It was ¥48,000 on 24 Nov.
- Check your bank, 15 Dec, for a bill: "Landed on", with an empty box 28 wide.

POLISH
- Short bank: "¥5,000 (Sparrow Bank today) − ¥80,000 (Rent 27 Nov) = −¥75,000" is printed twice.
- During setup, tapping Receipts shows "Set up first, then log what you spend here" with the whole setup form still under it.
- No cut-off or sideways scroll found at 320 or 1300 on Home, Plan, Receipts, Settings, Reminders, Ask, Check, setup.

FOR MAKO'S EYE
- Picture first: bank, safe to spend, the pay period and the cards are all sentences and sums. The pay period wants a bar from pay to pay; safe to spend wants the bank as a pile with the held parts marked.

NOT CHECKED
M20 (both devices change one item), M24 (unspent money, Decide later), M48 cents, M49 percents, install to home screen, light scheme, locked backup, the stale "Bill added, Undo" notice tapped after a restore, a real AI, statement reading.

Pictures: /tmp/qc/qc-north-star/
