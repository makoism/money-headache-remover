VERDICT: FAIL (one BLOCKER: the assistant sends a person to Settings for something Settings does not have)
Tested with the made-up AI only (fake_ai_page.js present). Doors proven; how the real AI talks is judged from its written instructions.
CHECK: check3.txt ends "ALL GOOD" (full level, 3 at a time, 844 s). Last lines: setup3 PASS, layout PASS, "(full level, 3 at a time, 844 s in all)", "ALL GOOD".

OWNER'S WORDS
- M1 MET: first screen is the chat; "Ask or tell me something" bar on every tab and sheet.
- M2 MET for talk; uploads NOT BUILT (IN SCOPE FILE); ten setup questions never asked KNOWN (IN SCOPE FILE).
- M3 NOT BUILT (IN SCOPE FILE): 23 NO cells, matching scope's "23 things".
- M4 MET for typed day-to-day; receipts upload NOT BUILT (IN SCOPE FILE).
- M5 MET. M6 MET as built (KNOWN). M9, M11 NOT BUILT (IN SCOPE FILE). M12 COULD NOT TELL.
- M17 MET: one tap from every place tried, SCREEN sent correctly.

COUNT: jobs 8: DONE 8 (job 5's upload is STUCK, IN SCOPE FILE), STUCK 0 outside scope. Grid 42 cells: YES 19, NO 23 (all IN SCOPE FILE), BROKEN 0. Setup never asked: 10 (2 of them IN SCOPE FILE).

JOBS
1 DONE. Phone 390, new device: "Welcome to the burrow", then "Hi, I'll set up your Burrow with you ... about 10 minutes", what the app does, then "Which country do you bank in". No link to hunt.
2 DONE. One bank, pay after tax on the 10th, two cards, three bills, 3 Dec. Each answer showed "Saved: ..." and the "Your answers so far" card with "Still needed"; fill refused until bills since last pay were answered; "Filled in" card with Undo. Home: "¥9,333 is safe to spend until pay on 10 Dec", explained by Home's two sums. Answers carry into "Set up on the screens".
3 DONE. Bank: "open the bank app. The big number on the first screen is it ... leave it for later", asked again before fill. Close day: statement or card app, "Not sure is fine".
4 DONE (doors). Each message carries FIGURES in Home's own words ("what your accounts can spare", "held back: Free to spend has only ¥9,333 left") and "SCREEN: the person has Home open" with that screen's purpose.
5 DONE except upload. Lunch 900: asked card or bank, card showed Safe to spend 9,333 to 8,433 and Visa owed 30,000 to 30,900, Undo put both back. Rent up, add a bank, remove Gym (asked first), set aside 5,000: all carded, Undo restored Home and Plan exactly. Upload: no file door in the chat (IN SCOPE FILE).
6 DONE. 90,000 lunch asked first ("more than safe to spend"); an amount not typed asked "it's the AI's guess. Is it right?"; three bill ends at once asked first; bank 1,500,000 asked "far from what the app expected"; add_loan refused with "On the screens: Plan, Add a loan" to the AI. The page itself shows nothing for a refusal (KNOWN, LATER list). No instruction line for someone else's money.
7 DONE. No relay: "The assistant is off right now. You can still finish everything: Set up on the screens / Use any AI". Network gone: "The AI did not answer: no connection ... Nothing was lost", box emptied (KNOWN). After setup with AI off only "Use any AI" offered (KNOWN).
8 DONE. Bar on all 5 tabs and 5 sheets tried; SCREEN named each, sheets included. Typing kept across tabs.

GRID (add / change / remove by asking)
accounts YES/YES/NO(IN SCOPE) | cards YES/NO(IN SCOPE)/NO(IN SCOPE) (card_figure sets the balance only) | loans NO/NO/NO (IN SCOPE) | pay YES/YES/YES | bills YES/YES/YES | budget lines YES/YES/YES | Free to spend YES/YES/YES (set to 0, no ask first) | goals YES/NO/NO (IN SCOPE, slice 6) | spends YES/NO/YES (change: IN SCOPE only as one of the unnamed "23 things"; scope.txt should name it) | bank checks YES/NO/NO (IN SCOPE) | statements NO/NO/NO (IN SCOPE) | Keep at least, main bank NO/NO/NO (IN SCOPE slice 5; other accounts YES) | reminders NO/NO/NO (IN SCOPE) | backup and cloud NO/NO/NO (IN SCOPE).

SERVER SETTINGS (functions/api/ai.js, health.js)
- ANTHROPIC_API_KEY: health "ai"; panel says "The assistant is off right now". Settings has no assistant-on line (KNOWN).
- MODEL_DEFAULT, MODEL_QUICK, MODEL_COMPLEX: a wrong name reads as on; every message fails with "The AI did not answer: <server words>" (KNOWN).
- INVITE_CODES: shown only after the first send: "Code word for the AI (ask the owner)", typing kept. Fine.
- DB: without it the daily caps are not counted, nothing says so (KNOWN, M68).
- DAILY_TOKEN_CAP, USER_DAILY_CALLS, IP_PER_MINUTE: person sees "Daily limit for this device reached. Try again tomorrow." Plain.
- File reading in the chat cannot be tried on the live site at all: the relay takes images and PDFs, the page never sends them (IN SCOPE FILE).

BLOCKERS
1. Wrong directions, new in this slice's change_account. Ask "keep at least 20000 in Bank" (main bank). Card: "Not changed ... Keep at least for your main bank is in Settings". Settings (390 wide) has no Keep at least. Plan > Bank sheet has only Name. A person is sent hunting for a control that does not exist. Should say it is set up in setup only for now, or point nowhere until slice 5.

CONFUSING
1. Instructions, "Files: ... say in one line that reading files comes later, and ask them to type the figures." After setup Home has "Add statements", which reads a statement now. "Here is my card statement" gets "type the figures" instead of "Home, Add statements reads it". Replace: "after setup, for a bank or card statement say: Home, Add statements reads it; for anything else, type the figures."
2. Change cards show only Safe to spend for changes that do not move it: "Rent: ¥65,000 from its next one" with Safe to spend 9,333 to 9,333; no "Rent 60,000 to 65,000" row. Same for set aside (no goal or bank row) and End Gym. Add the changed item's own before and after.
3. "This is more than safe to spend. Do it?" on Add Savings, Add goal, a pay rise, Free to spend 30,000 (KNOWN, LATER list).
4. Remove goal G1 told the AI "a remove for a ref I do not know" though G1 came from list. Should say goals cannot be removed by asking yet, and "Plan, tap the goal".

POLISH
- "the AI did not answer (502)": drop the number.
- Free to spend set to 0 does not ask first.

SETUP NEVER ASKED (10): cash or e-wallets (only "how many banks"); loans; goals; budget lines beyond Free to spend; card paid in full or not; a bill on a weekend, before or after; yearly bills; bills paid by card; set amount or percentage (M88, IN SCOPE); cash envelopes (M92, IN SCOPE). Asked: after tax, how many banks, bill already out, statement amount.

FOR MAKO'S EYE: three long bubbles before the first question.

NOT CHECKED: Undo after a reload of assistant cards; desktop and 320 sizes of the panel; a full screens-only setup to Home with the AI off (door and prefill seen, check3 setup3 passes); Receipts record sheet and Settings sheets by SCREEN; the real AI (no session can reach it).
