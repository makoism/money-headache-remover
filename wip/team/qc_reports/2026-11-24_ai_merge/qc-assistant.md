VERDICT: FAIL
Tested with the made-up AI only (fake_ai_page.js, my own scripted replies). No real AI, no live site. Its words are judged from its instructions in chat3_core.js. Phone 390x844, dark, 24 Nov 2026. No page errors.

CHECK: no check3.txt in the round folder. check3_full.txt is there; its last lines: two [x] PASS lines (tests/e3_walk.js, tests/e3_setup.js), a blank, "(full level, 2 at a time, 640 s in all)", "ALL GOOD". No scope.txt, so nothing missing is excused.

OWNER'S WORDS
- M1 MET with gaps: the assistant is the first screen, and a bar on 18 of 18 tabs and sheets after setup. Gone on "Set up on the screens" and in "See it with made-up numbers first".
- M2 NOT MET: explains, asks, fills. Uploads not built in the chat.
- M3 NOT MET: 23 of 42 grid cells are NO.
- M4 NOT BUILT for receipts and files. Typed spends work.
- M5, M6, M7, M11 MET. M9 NOT BUILT in the chat.
- M8, M10, M12 COULD NOT TELL: a made-up AI does not show them.
- Seen broken outside my lines: M13 (blocker 3), M68.

COUNT: jobs 1 DONE, 7 STUCK. Grid 19 YES / 23 NO / 0 BROKEN. Setup never asked 9 questions.

JOBS
1. First open STUCK (narrow). It greets and explains, no hunt, but asks nothing: the box says "Ask or tell me something" and the first question comes only after the person types.
2. Set up by talking DONE. "Your answers so far" shows every part before "Fill in my Burrow". Rent changed by talking before the fill. The fill card's Undo kept the answers. Home: ¥222,000 = ¥300,000 − ¥8,000 Power − ¥70,000 Rent.
3. "I don't know" STUCK. Bank: says where ("open the bank app. The big number on the first screen") but no way on: "Not saved: What does Main bank show today? A plain number", and the fill refuses. Close day: "Not sure is fine" works, where to find it is never said.
4. Ask about the app STUCK. "What is safe to spend?" matches Home's ? word for word (3 of 3 topics). "Why that much" is sent Home's own sum. "What does this screen do?": the request never says which screen is open.
5. Day to day STUCK, 5 of 6. Lunch 900, rent to 75,000, add a bank, remove gym (asked first; Not now changed nothing), 5,000 to the trip: each showed a card with before and after, and Undo put Home and Plan back. Upload: "Reading files in the chat comes next. For now, type the figures, or add statements on Receipts."
6. Wrong and unclear STUCK. Guessed amounts asked first (2 of 2). "delete everything" asked first. An ask it cannot do shows nothing from the app, and the AI is given no map of the screens. Blocker 4.
7. Assistant off STUCK. Plain words, message back in the box, setup finishes on the screens with the talk's bank, pay and cards filled in. Blockers 2, 3.
8. Always there STUCK. One tap away after setup. Never told the screen.

GRID (add / change / remove, by asking)
- Accounts YES / NO (name, kind) / NO
- Cards YES / NO (what is on it yes; pay day, close day no) / NO
- Loans NO / NO / NO
- Pay YES / YES / YES
- Bills YES / YES / YES
- Budget lines YES / YES / YES
- Free to spend YES / YES / NO (0 is not blank: Safe to spend went ¥21,333 to ¥0)
- Goals YES / NO (set aside yes; amount, date, take out no) / NO
- Spends YES / NO / YES
- Checks of the bank YES / YES (a second figure) / NO
- Statements NO / NO / NO
- Lowest the bank should go YES in setup only / NO / NO
- Reminders NO / NO / NO
- Backup and cloud copy NO / NO / NO
Every YES add and change was undone and Home came back. The screens can do these NOs: loans, card pay and close day, goal change and take out, spend change, statements, reminders, backup, cloud copy.

BLOCKERS
1. Files. The AI is told to say "send me a statement or payslip and I'll read it" (question 1) and "Or send me a screenshot" (question 5). "Send a file" then says it "comes next".
2. One failed call turns the assistant off until reload. Drop the network for one message mid setup ("The AI did not answer: no connection. Check the internet and try again. Nothing was lost"), bring it back, send again: no call is made, "That didn't go through: the assistant is off right now". Same after "Too many requests. Wait a minute."
3. With the assistant off after setup there is no way to add a bank account: not on Home, Plan or Settings. The off card says "You can still finish everything:" and offers only "Use any AI", which hands out the setup request ("Help me set up a money app").
4. A bank figure with an extra zero goes straight in. "My bank shows 3,000,000": Safe to spend ¥222,000 to ¥2,922,000, no question. The explain words say the app "asks about the gap"; by chat nobody asks.
5. The grid NOs on things the screens can do.
6. Country "Somewhere else": no currency question, the draft falls back to yen.
7. The fill card's Undo on a phone leaves the old sheet over the welcome screen: two chat boxes and a stale "Filled in" card.

SETUP NEVER ASKED (9): is each card paid in full; a card's weekend rule; which bank a bill leaves from; any yearly bill; loans or pay-later; cash or e-wallets; money already set aside; currency; reminders and a backup.

SETTINGS A PERSON NEVER SEES
- ANTHROPIC_API_KEY: off gives "The assistant is off right now", no reason. Not checkable on the live site from here: a finding (lesson 5).
- DB binding: without it no cap runs (M68), nothing says so.
- INVITE_CODES: a code word box appears.
- MODEL_DEFAULT, MODEL_QUICK, MODEL_COMPLEX: a wrong name gives "The AI did not answer: Claude answered with an error", then blocker 2.
- USER_DAILY_CALLS, DAILY_TOKEN_CAP, IP_PER_MINUTE: "Daily limit for this device reached. Try again tomorrow", then blocker 2.
- ANTHROPIC_BASE_URL, SITE_VERSION: never shown.

CONFUSING
- A refused card is headed "Changed" then "Not done". Use "Not changed".
- Adding a bank is refused twice ("Is this new money, or moved from Main bank since today?", then "Was it moved before or after you looked at Main bank today?"). Tell the AI to ask both first.
- "I bought lunch, 900" goes "from Main bank" unasked. The owner pays by card (M30).
- Header "Ask" opens a second, older assistant with another rule: "Nothing changes until you tap Apply".
- Questions 4, 7, 9, 10 ask several things at once. Question 14 reads "Keep at least ___".

POLISH: after reload the sheet opens at the oldest message.

FOR MAKO'S EYE: should the first screen already show the first question?

NOT CHECKED: a real AI's wording; the live site's settings; "my pay came in" with something due; the desktop column; light scheme; 320 wide.
