VERDICT: FAIL

Tested with the made-up AI only (phone 390x844, today 24 Nov 2026, one desktop open). How the real AI talks is not proven; its instructions were read as written. Fails on M6 not met and jobs 4 and 6 stuck.

CHECK: check3.txt ends:
```
[x] Setup, short (setup3) ... PASS
[x] The layout holds at 320, 390, 412 and 1300 wide ... PASS

(full level, 3 at a time, 784 s in all)
ALL GOOD
```

OWNER'S WORDS
- M1 MET. First screen is the chat; a chat box on all 10 places tried.
- M2 MET except uploads: NOT BUILT (IN SCOPE FILE).
- M3 NOT BUILT in part (IN SCOPE FILE): 23 grid cells NO. "Knows the whole picture" NOT MET: blocker 2.
- M4 MET for typed asks; uploads as M2.
- M5 MET. M7 MET on Home.
- M6 NOT MET: blocker 1.
- M9 NOT BUILT (IN SCOPE FILE).
- M17 MET for reach, NOT MET for two of three questions in job 4.
- M8, M10, M11, M12 COULD NOT TELL.

COUNT
- Jobs: 6 DONE, 2 STUCK. 1 DONE, 2 DONE, 3 DONE, 4 STUCK, 5 DONE for 5 of 6 asks (upload NOT BUILT, IN SCOPE FILE), 6 STUCK, 7 DONE, 8 DONE.
- Grid, 42 cells: 19 YES, 23 NO, 0 BROKEN.
- Setup questions never asked: 9 by my count (KNOWN, IN SCOPE FILE; I did not see the plan's list): loans, goals, cash or e-wallets, other banks' figures, is each card paid in full, weekend rule for cards, weekend rule for bills, yearly bills, which bank a bill leaves. Before or after tax, how many banks, has this bill gone out: all asked.
- Changes made by talking 22, shown on a card 22. Undo tried on 17, put back 17 (5 with all of Home compared, 12 by the headline only). 5 not undone.

Job notes
- 1: "Hi, I'll set up your Burrow with you...", then "Which country do you bank in, and in which currency?" with the box under it.
- 2: 14 answers. "Your answers so far" showed every part before the fill. Home: "¥26,666 is safe to spend until pay on 10 Dec" with both working lines.
- 3: "Main bank: for later", then "Still needed: What does Main bank show today?" and fill refused. Close day "not sure" saved. The questions say where to find each.
- 7: No server: "The assistant is off right now. You can still finish everything:" with "Set up on the screens" and "Use any AI"; "Your message is back in the box". Screens setup keeps the chat's answers.

The grid (add / change / remove, by asking)
- Accounts: YES / NO / NO
- Cards: YES / NO / NO
- Loans: NO / NO / NO
- Pay: YES / YES / YES (remove seen as far as the "Do it?" card)
- Bills: YES / YES / YES
- Budget lines: YES / YES / YES
- Free to spend: YES / YES / YES (set to 0)
- Goals: YES / NO / NO (set aside YES, take out NO)
- Spends: YES / NO / YES
- Checks of the bank: YES / NO / NO
- Statements: NO / NO / NO
- Lowest the bank should go: YES in the setup chat only / NO / NO
- Reminders: NO / NO / NO
- Backup and cloud copy: NO / NO / NO
All 23 NO are NOT BUILT (IN SCOPE FILE). The screens can do at least seven of them: a loan, a card's days, a goal, a spend, statements, reminders, backup.

Settings a person never sees
- ANTHROPIC_API_KEY. Off: the page says "The assistant is off right now". Seen with no server only.
- INVITE_CODES. "Type the code word first, then send again". Not run.
- DB. If missing, no call is counted and no cap works. A person cannot know.
- USER_DAILY_CALLS, IP_PER_MINUTE, DAILY_TOKEN_CAP. One line for all: "the daily limit is reached, or too many messages at once. Try again later, or use the screens". No count of what is left.
- MODEL_DEFAULT, MODEL_QUICK, MODEL_COMPLEX, ANTHROPIC_BASE_URL. A wrong value shows only as an error at the first message.
Finding: nobody has tried the assistant on the live site (KNOWN, IN SCOPE FILE). Settings has no line saying whether the assistant is on. With the network gone, nothing says so until a send fails.

BLOCKERS
1. A spend written with an amount the person did not type (M6, job 6). Phone, Home, after setup. Type "I bought lunch, 900 on card A": "Changed, Log ¥900 on Free to spend from Card A, today". Then "another lunch today", the AI sends 900 again: "Changed, Log ¥900..." with no question. Same for a goal: "Add a goal, Trip: ¥100,000" went in unasked because 100000 was typed earlier for a bank account. Cause: `turn()` in `chat3_core.js` counts the last 10 messages as typed. With no earlier 900 it does ask: "You didn't type this amount, it's the AI's guess. Is it right?". It should count only this message. Both were shown, with Undo.
2. "Why is it that much?" cannot match the screen (job 4). Home's second line, "¥222,000 (what your accounts can spare) − ¥195,334 (held back: Free to spend has only ¥26,666 left this period) = ¥26,666", is not in what is sent. The AI gets a sum ending ¥222,000 and a headline of ¥26,666, and is told never to work out a total.
3. "What does this screen do?" has no words (job 4). The AI is told "SCREEN: the person has Plan open" and nothing about what any screen is for. On the "Add a card" sheet it is told "Plan".

CONFUSING
- Change cards show only safe to spend, often unchanged: "Rent: ¥75,000 from its next one. Before ¥26,666 After ¥26,666". Show the thing itself: "Rent ¥70,000 to ¥75,000".
- "This is more than safe to spend. Do it?" on a rent change, on "Add Savings with ¥100,000", and, with safe to spend at ¥0, on "Log ¥1,500 in to Main bank". Say "This is a big change. Do it?".
- "Add a line, Fun: ¥4,000": safe to spend ¥26,666 to ¥26,667, one yen up.
- "Send a file" (first screen) shows "The whole file goes to the AI, with your name, address...", takes a file, then says "Reading files in the chat comes next. For now, type the figures, or add statements on Receipts." Add statements is on Home, not Receipts. Say it before the file is chosen.
- A refused step ("delete everything", a loan, a card's pay day, remove a card) shows nothing from the app; only the AI speaks. Its list of places has no line for delete everything, removing a card or bank, or Keep at least.
- Two steps asked, one dropped: goal added, the ¥5,000 not set aside, the card does not say so.

POLISH
- Desktop welcome says "stays on this phone".
- After "The AI did not answer: no connection... Nothing was lost" the words stay in the chat but the box is empty.
- Assistant off: the screen still opens "Hi, I'll set up your Burrow with you".

FOR MAKO'S EYE
- Three paragraphs of welcome before the first question.

NOT CHECKED
- A real AI, the live site, any server setting switched for real.
- A full setup and each day to day job on the screens with the assistant off.
- The chat box on Plan's sheets, each screens setup step, cloud and "which to keep" screens.
- Sizes 320 and 412, light scheme, "Use any AI" paste back, the code word box, Undo after a reload.
- Someone else's money: read in the instructions only.
- "landed", refund, yearly bills.
