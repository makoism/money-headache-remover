VERDICT: FAIL (one finding outside scope.txt, blocker 1; a judgment call, see it). Tested with the made-up AI only. Every assistant line in my walks was scripted by me from its instructions, so the doors are proven and the real AI's talk is not.

Told plainly: at the start I ran `git log --oneline` once by mistake and saw five commit titles (they said three assistant fixes followed a first report). I read no other report, plan or diff.

CHECK: check3.txt ends (two long lines trimmed):
```
[x] Setup, short (setup3): bank today, pay with a second income, cards ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide (M52, M33) ... (tests/e3_layout.js: PASS)

(full level, 3 at a time, 781 s in all)
ALL GOOD
```

OWNER'S WORDS
- M1 MET. First screen is the assistant; "Ask" is on every screen I opened; Home has "Ask or tell me something".
- M2 MET for the talk (explains, asks, says where to find, fills in). Uploads NOT BUILT (IN SCOPE FILE).
- M3 NOT BUILT (IN SCOPE FILE). 23 grid cells are NO.
- M4 MET for typed asks. "Here are my receipts" as files NOT BUILT (IN SCOPE FILE).
- M5 MET. Every change showed on Home, Plan or Receipts.
- M6 MET as built (remove, over safe to spend, and a guessed amount each asked first).
- M7 MET for this person: bank, safe to spend with its sum, bills due, cards, bank after cards.
- M8, M11, M12 COULD NOT TELL (his to say).
- M9 NOT BUILT (IN SCOPE FILE).
- M10 NOT BUILT (IN SCOPE FILE, picture).

COUNT: jobs 7 DONE, 1 part STUCK (job 5: five asks DONE, the upload STUCK, in scope file). Grid 42 cells: 19 YES, 23 NO, 0 BROKEN (5 YES tried by me, 14 read from the assistant's step list and not tried). Questions setup never asked: 10.

JOBS (phone 390x844, today 24 Nov 2026)
1. First open: DONE. "Hi, I'll set up your Burrow with you..." then what the app does, then "Which country do you bank in, and in which currency?" with the answer box under it.
2. Set up by talking: DONE. "Your answers so far" card grew after each answer, with "Still needed:" and "Fill in my Burrow". Fill was refused while the bank was blank ("Not filled in: What does Main bank show today?"). Home: "¥286,000 (Main bank today) − ¥72,000 (Rent 27 Nov) − ¥8,000 (Gym 7 Dec) = ¥206,000". Afterwards a bill was changed and ended by asking; cards and the bank cannot be changed by asking (grid). Not tried: editing a section on the draft card, and Undo of the fill.
   Never asked: which account each bill is paid from; whether a bill moves before or after a weekend (Gym on the 5th became 7 Dec unasked); the same for card payments; whether cards are paid in full; other accounts (savings, cash, e-wallet: it asks "How many banks" then takes one); loans; goals; yearly bills; budget lines; pay-later.
3. "I don't know": DONE. Bank saved as "Main bank: for later" and asked again before the fill; close day saved as "statement closes not sure". The where-to-find words are in the instructions (questions 5 and 10).
4. Ask about the app: DONE. The explain answer and the sum sent to the AI are Home's own words, character for character. "This screen" was sent correctly for Home, Receipts, Plan, Settings, Reminders, Check your bank, Add statements, "Add a card" and the Rent sheet.
5. Day to day: lunch DONE (asked "Card or bank?" first), rent DONE (¥206,000 to ¥198,000), add a bank DONE (asked new or moved), remove gym DONE ("This takes something away. Do it?", nothing changed before OK, Plan then read "ended 24 Nov"), 5,000 to the trip DONE. After each Undo every word on Home, Plan and Receipts matched the words before. Undo was still there after a reload. Upload: STUCK (KNOWN, IN SCOPE FILE).
6. Wrong asks: DONE. 9,000,000: "This is more than safe to spend. Do it?". An amount I had the AI invent: "You didn't type this amount, it's the AI's guess. Is it right?". "delete everything": nothing changed. Card pay day and a loan: refused with "On the screens: Plan, tap the card" and "Plan, Add a loan". Someone else's money rests on one instruction line only; not provable here.
7. Assistant off: DONE for the words. No server: "The assistant is off right now. You can still finish everything:" with "Set up on the screens" and "Use any AI"; my message came back in the box. Network cut after setup: "The AI did not answer: no connection. Check the internet and try again. Nothing was lost". I did not walk setup on the screens or "Use any AI" to the end.
8. Always there: DONE. Ask was tappable on all nine places above.

THE GRID (add / change / remove, by asking)
- accounts: YES / YES (today's figure only, no rename) / NO
- cards: YES / NO / NO
- loans: NO / NO / NO
- pay: YES / YES / YES
- bills: YES / YES / YES
- budget lines: YES / YES / YES
- Free to spend: YES / YES / YES (set to 0)
- goals: YES / NO (set aside only) / NO
- spends: YES / NO / YES
- checks of the bank: YES / NO / NO
- statements: NO / NO / NO
- lowest the bank should go: NO / NO / NO (asked in setup only)
- reminders: NO / NO / NO
- backup and cloud copy: NO / NO / NO
All 23 NO are KNOWN (IN SCOPE FILE, "23 things"). By my brief alone they would fail the build.

SETTINGS A PERSON NEVER SEES (functions/api/ai.js, health.js)
- ANTHROPIC_API_KEY: off shows "The assistant is off right now". A refused key or no credit is only found on sending a message; those words on the page were not checked.
- INVITE_CODES: the page asks "Type the code word first, then send again".
- DB: with none, the daily caps are silently not counted. Nobody would know (M68).
- MODEL_DEFAULT, MODEL_QUICK, MODEL_COMPLEX: defaults are `claude-sonnet-5-5` and `claude-haiku-5-5`. I could not confirm these names exist. A wrong name gives "Claude answered with an error" on every message while health still says the AI is on.
- USER_DAILY_CALLS, DAILY_TOKEN_CAP, IP_PER_MINUTE: "the daily limit is reached, or too many messages at once. Try again later, or use the screens". My setup took about 25 calls.
- ANTHROPIC_BASE_URL, SITE_VERSION: nothing shown.
- Finding (KNOWN, IN SCOPE FILE): no session has tried any of this on the live site.

BLOCKERS
1. A spend on a card does not show the figure that changed. "I bought lunch, 900" then "Card A": the card reads "Log ¥900 on Free to spend from Card A, today (lunch)", Before "Safe to spend ¥206,000", After "¥206,000". No row for Card A. The owner pays almost everything by card (M30), so his usual change card will show two equal figures. It should add a row: Card A before and after. Judgment call: the words say what was logged, the figures do not show it. I did not read Card A's own figure on Home after the spend.

CONFUSING
- "Send a file" is on the first screen and in the panel. Tap it: "The whole file goes to the AI, with your name, address, employer and account number." Choose a file: "Reading files in the chat comes next. For now, type the figures, or add statements on Receipts." A warning for something that does not happen, and scope.txt says the assistant never offers files. Remove the button, or say it comes later before the picker.
- That line says statements are "on Receipts"; the assistant is told "Statements: Home, Add statements". One place.
- Instructions mix notes to the AI into lines to say: question 8 "Then always: is that before or after tax?", 14 "Keep at least ___ in your bank?", 12 and 15. A real AI may read them out.
- Question 10 asks five things at once and question 4 two, against "one question per message" in the same instructions.
- "The country moves pay and bills off weekends and holidays." Try: "I ask so pay and bills land on the right day around weekends and holidays."
- "delete everything": the app tells the AI "Say where from WHERE ON THE SCREENS", and that list has no such place.

POLISH
- Network cut: the message stays in the chat but is not put back in the box, and there is no "Try again". With the assistant off it is put back.
- An extra zero that stays under safe to spend (9,000 for 900) goes through at once. Undo is the only guard (as M6 is built).
- "Rent: ¥80,000 from its next one" never asks from when.
- The "Log a spend" sheet was sent as plain "Receipts", not by its own name (one run, not repeated).

FOR MAKO'S EYE
- The first screen is three paragraphs before the first question.

NOT CHECKED
- A real AI. Setup on the screens and "Use any AI" walked to the end. The server answering "AI off" as distinct from no server. A refused key, no credit, the daily cap and the code word on the page.
- Editing the draft card, Undo of the fill, "start over".
- 14 YES cells not tried (add card, pay add/change/remove, bill add, lines x3, Free to spend x3, remove a spend, bank figure x2).
- Desktop, 320 wide, light scheme. Every sheet beyond the nine places listed.
- Empty and wrong typing in the chat box (rule 5).
