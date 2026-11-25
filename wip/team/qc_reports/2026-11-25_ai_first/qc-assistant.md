VERDICT: FAIL (job 7 STUCK on one clause, blocker 1. Job 5 is STUCK only on the upload, which is in scope.txt. The grid's NO cells are in scope.txt.)
Tested with the made-up AI only. It proves the doors, the cards, Undo and what is sent. It does not prove the real one talks well. Its instructions were read as written.

CHECK: check3.txt ends
```
[x] Setup, short (setup3) ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide ... (tests/e3_layout.js: PASS)

(full level, 3 at a time, 796 s in all)
ALL GOOD
```

OWNER'S WORDS
- M1 MET. First screen is the assistant's welcome with its answer box. The box "Ask or tell me something" is at the foot of every screen.
- M2 MET for explains, asks, says where, fills in. "Takes uploads": NOT BUILT (IN SCOPE FILE).
- M3 NOT BUILT in part (IN SCOPE FILE): 23 grid cells are NO.
- M4 MET for typed asks. Receipts and statements by upload: NOT BUILT (IN SCOPE FILE).
- M5 MET.
- M6 MET as built. Removes, an amount the person never typed, and changes over safe to spend all waited for "Do it".
- M7 MET, with the card truth fault KNOWN (IN SCOPE FILE).
- M9 NOT BUILT (IN SCOPE FILE).
- M10 picture NOT BUILT (IN SCOPE FILE).
- M17 MET.
- M8, M11, M12: COULD NOT TELL, they need his own run.

COUNT: jobs 6 DONE, 2 STUCK. Grid 42 cells: 17 YES, 23 NO, 0 BROKEN, 2 not tried. Questions setup never asked: 11.

JOBS (phone 390x844, today 24 Nov 2026)
1. DONE. "Welcome to the burrow / Hi, I'll set up your Burrow with you..." then "Which country do you bank in, and in which currency?" with the box "Your answer".
2. DONE. Sora Bank 250,000, pay 300,000 on the 10th after tax, Card A and Card B, Rent, Gym, Phone. "Your answers so far" was redrawn after each answer with "Still needed: ...". It asked "Has Gym, due 16 Nov, come out of Sora Bank already?". "Fill in my Burrow" gave "Filled in / Safe to spend ¥170,000 / Bank today ¥250,000 / Undo". Home: "¥250,000 (Sora Bank today) − ¥80,000 (Rent 27 Nov) = ¥170,000". The cards are not in that figure: KNOWN.
3. DONE. Bank left blank: "Sora Bank: the figure is for later, asked again before I fill anything in", and fill was refused until it was given. Close day "not sure" accepted. The instructions say where to look for both.
4. DONE. The explain words and the "How safe to spend is worked out" line sent to the AI are the same words and sums as Home.
5. STUCK on one of six. Lunch 900 (asked "Card or bank?" first), Rent to 75,000, add a bank (asked new money or moved), remove a bill ("This takes something away. Do it?"), 5,000 to the Trip goal: each showed a Before and After card, and Undo put every figure back (checked against the full figures the page sends, 5 of 5). The card statement: the chat has no way to attach a file and the assistant is told "you can't read files ... yet". IN SCOPE FILE.
6. DONE. The AI sending 9,000 when the person typed 900: "You didn't type this amount, it's the AI's guess. Is it right?" and nothing changed before "Do it". 9,000,000: "This is more than safe to spend. Do it?". "Delete everything" and a card's pay day: nothing changed, and the AI is told "On the screens: Plan, tap the card". Someone else's money: only one server line covers it ("Help only with ... the person's own money"). No door to test.
7. STUCK, see blocker 1. The rest holds: AI off shows "The assistant is off right now. You can still finish everything: Set up on the screens / Use any AI" and "Your message is back in the box". A failed call shows "The AI did not answer ... Nothing was lost".
8. DONE for what was reached: Home, Receipts, Plan, Reminders, Settings, Check your bank, Add statements, and the Add a bill sheet. The box was there on all 8 and the right SCREEN line was sent on all 8.

BLOCKERS
1. Two links with nearly the same words, one drops the chat answers from view. Steps: new phone, answer country and bank in the chat (Sora Bank, 250,000), the AI then fails. Tap "Set up on the screens" in the failure message: boxes hold Sora Bank and 250000, with "Filled in from the chat, not saved yet: Your bank". Tap "Set up on the screens instead" at the foot of the same screen: "Its name" and "What does your bank show today?" are empty. Run twice, same result. Both links should fill the boxes from the chat.

CONFUSING
- After a failed call the screen says "That didn't go through. Send it again" but the box is empty. The person has to retype. When the AI is off the message does go back in the box. Do the same here.
- After setup with the AI off the panel offers only "Use any AI", which is a setup tool. Replace with one line saying which screen does what.
- Question 10 of the guide asks five things in one message. Question 12 is a note to the AI, not a line to say. Both KNOWN.
- "This is more than safe to spend. Do it?" on Free to spend, add a card, change a pay. KNOWN.
- The assistant is told to send "delete everything" to "WHERE ON THE SCREENS", but no screen has Start again. KNOWN.

THE GRID (by asking the assistant: add / change / remove)
- Accounts: YES / YES today's figure only, a rename is NO / NO
- Cards: YES / NO pay day and close day / NO
- Loans: NO / NO / NO
- Pay: YES / YES / YES asks first
- Bills: YES / YES / YES asks first
- Budget lines: YES / YES / YES asks first
- Free to spend: YES / YES / not tried
- Goals: YES, and set aside YES / NO, take out NO / NO
- Spends: YES / NO / not tried
- Checks of the bank: YES / NO / NO
- Statements: NO / NO / NO
- Lowest the bank should go: NO / NO / NO
- Reminders: NO / NO / NO
- Backup and cloud copy: NO / NO / NO
The screens can do these NO cells: loans (3), a card's days, change a goal and take out, change a spend, add statements, backup and cloud. All sit under scope.txt M3 ("23 things"). My count of NO is also 23.

QUESTIONS SETUP NEVER ASKS (scope.txt says ten, I count 11): is each card paid in full; any loans; any goals or money already set aside; what the other banks, cash and e-wallets hold (it asks how many banks, then only the pay bank); which bank each bill comes from; the weekend rule for bills and for card payments; yearly bills; budget lines; pay-later; whether this period's pay has landed when today is not pay day; any offer of an upload.

SETTINGS A PERSON NEVER SEES
- ANTHROPIC_API_KEY: off gives "The assistant is off right now". Clear.
- INVITE_CODES: "Code word for the AI (ask the owner) ... Type the code word first, then send again". The message stays in the box. Clear.
- DB: with it off the daily caps are not counted and nothing says so. KNOWN.
- MODEL_DEFAULT, MODEL_QUICK, MODEL_COMPLEX: /api/health only looks for a key. A wrong model name would read as on, and every message would fail with "The AI did not answer". A person cannot tell it is a setting. Finding: health should prove one real call. This matters because no real talk has been run (scope.txt, M1 M17).
- No credit on the key: only seen after the first message.
- USER_DAILY_CALLS, DAILY_TOKEN_CAP, IP_PER_MINUTE: the server has plain lines ("Daily limit for this device reached. Try again tomorrow."). Not checked whether the page shows them.
- ANTHROPIC_BASE_URL, SITE_VERSION: nothing for a person.

POLISH
- While answering, "Your answers so far" has nothing to tap. A section changes only by telling the assistant.

FOR MAKO'S EYE
- The welcome is three paragraphs before the first question.

NOT CHECKED
- A real AI.
- Job 8 on Plan's other sheets (pay, bill, card, goal, loan, line, Free to spend), Log a spend, the record sheet, setup on the screens. My taps did not reach them.
- Removing a spend and clearing Free to spend by asking.
- A card figure by asking (the bank figure was tried).
- Whether the chat still holds the answers after blocker 1's empty screen.
- Undo after a reload: 4 Undo buttons were there after a reload, none was tapped.
- Desktop size, 320 wide, light scheme.
- "Use any AI" copy and paste back.
- The rate limit words on the page.
- Every tool result was read from what the page sent, not from a real reply.
