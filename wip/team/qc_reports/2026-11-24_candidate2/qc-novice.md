Round fault first: `wip/team/app3/tests/fake_ai_page.js` and `tests/README.md` are missing in this build. I used the stub at the top of `e3_ask.js` (a made-up AI: it proves the doors, not how the real one talks).

VERDICT: FAIL (part 6 STUCK; M53 and M56 NOT MET and not in scope.txt)

CHECK:
```
[x] The real-page walk (walk 4 run A) as a gate ... (tests/e3_walk.js: PASS)
[x] Setup, short (setup3) ... (tests/e3_setup.js: PASS)

(full level, 3 at a time, 410 s in all)
ALL GOOD
```

OWNER'S WORDS (section E)
- M52 NOT BUILT (IN SCOPE FILE). Home is words and figures only.
- M53 NOT MET. Setup is one page, six parts, 11 boxes before any card or bill.
- M54 MET in setup. NOT MET in Home's small print: "It counts everything on the cards now, as their close days are not sure. Bills due by then are taken off. This is the bank, not safe to spend".
- M55 MET.
- M56 NOT MET. The setup part is still titled "Everyday spending". Home says "Add your everyday spending" over a button "Set Free to spend".
- M57 NOT BUILT, not in scope.txt by id (art waits under M10, M52).
- M58 MET. M59 COULD NOT TELL (no 3D seen). M60 NOT BUILT (his own "later").
- Seen broken outside E: M17 (Ask in setup says "Set up first"); M51 ("Keep at least" in setup is "(minimum)" on Home); M13, M18 as scope.txt says.

COUNT: 8 parts: 7 DONE, 1 STUCK. Places I would have given up: 5 (blockers 1 to 4 and the three-week return). Words not explained: 15, plus 2 numbers. Phone 390x844, one look at 320. No page errors.
1. First ten seconds DONE. Understood: type my bank, pay, cards, bills. Nothing says what I get back.
2. Set up DONE.
3. Change my mind DONE. Bill removed with Undo; empty amount gave "Type the amount of Netflix" and a way out; reopening lands in setup with "What you saved before is back below".
4. Is it true DONE on a plain day ("¥296,000 (Mizuho today) − ¥68,000 (Rent 27 Nov) ... = ¥180,620"). Not on pay day or after setting Free to spend.
5. Live a week DONE. Lunch, fix, Undo, pay, rent late, bank mismatch ("¥2,100 more left your bank than you logged. It counts as spending", Undo), goal in and out.
6. Change my life STUCK. New pay and pay day: done. Cancel a bill ("End this bill"): done. Second bank account, close a card, stop a goal: no control anywhere. All three are in scope.txt (M13).
7. Ask for help DONE for Ask (opens from Home, Receipts, Plan, check-in, a card sheet, Settings, Reminders; Close returns where I was; the made-up AI answered "what does close day mean"). Help: none. "?" only on Home, 3 of them (M18, in scope).
8. Three weeks away DONE, poorly.

BLOCKERS
1. Receipts, Moved: "Moving money needs a second account of your own, like savings, cash or an e-wallet. You have one, so there is nowhere to move it to yet". No way to add one after setup. Card sheet on Plan: only Save and Back. Goal sheet: Set aside, Save changes, Take out, Back. (IN SCOPE FILE, M13.)
2. Setup, tap Ask: a toast "Set up first", nothing else. This is where I needed it ("Day its statement closes").
3. Home on pay day (today=25 Nov, before check-in): "Safe to spend until next pay on 25 Dec, includes today's pay of ¥215,000, not in your bank yet" over ¥73,100, worked as "¥83,100 (Mizuho today) − ¥10,000 (minimum)". The words say the pay is in it, the sum shows it is not. Same screen: "Next pay 25 Nov, today".
4. Home after Set Free to spend 40,000: the headline went ¥180,620 to ¥37,900 with "− ¥142,720 (held back: Free to spend has only ¥37,900 left this period)". Later ¥26,057 with ¥437,000 in the bank. I would think the app lost my money. MAKO_SAYS unsettled 8 says two named figures; this build shows one (scope: homefix).

CONFUSING
- Setup "Back" leaves setup for the Welcome card, which reads as if nothing was saved. "Leave setup, it is saved".
- Rows added but not saved (3 bills) vanish on closing, no warning.
- "Did the Rent of 27 Oct leave your bank?" Why last month? "Has October's rent already gone out?"
- "about 80k" in the bank box: "Type what Main bank shows today". Say digits only.
- Home "Time to check in / 1 thing to tick off since 24 Nov" cannot be tapped; its "?" says "How things stand today, in one line". The button is "Check your bank" at the bottom.
- 28 Nov: Rent gone from "Due before next pay" yet taken off as "(Rent 27 Nov, late)".
- 22 Dec return: "Pay not in yet", "Card and loan payments overdue", "Not seen yet"; Rakuten three times; "Bank today ¥226,500" though "checked 21 days ago". The app has not looked, yet it reads as me being late. "3 weeks since you checked. 2 things probably happened, tick them", with the button there.
- Toast said ¥5,100 extra; Receipts shows ¥1,943. "Free to spend left ¥26,057": no working shown.
- Not explained: pay period (until the "?"), Free to spend, line ("no line of its own"), statement closes / close day, "On it now", minimum, held back, "what your accounts can spare", tick off, "Landed on" (for a bill), "Changes from", "Free to spend each pay from the change", "Code word for the AI", cloud code, "Somewhere else (weekends only)".

POLISH
- Setup drop-downs cut off at 390: "On a day eac", "the working".
- "?" buttons are 28x28.
- Removing an unnamed second account says "Second bank removed".

FOR MAKO'S EYE
- It felt like filling in forms. I never said what I had and watched it sort itself. The day-to-day doors (log, check bank, Undo) are quick and forgiving.

NOT CHECKED
- A change applied by the assistant (my made-up reply used a line ref the app did not know).
- Reading a statement, cloud copy, backup restore, desktop, light scheme, iPhone.
- Second income and no-fixed-pay beyond opening them in setup.
