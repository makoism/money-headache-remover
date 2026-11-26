# qc-assistant, round 2026-11-26_amounthist

Tested with the made-up AI only. That proves the doors, cards, Undo and what is sent, not how a real model talks.

VERDICT: PASS

CHECK: check3.txt ends:
e3_setup PASS, e3_layout PASS, (full level, 787 s), ALL GOOD

OWNER'S WORDS
- M1 MET: the first screen is the chat, and the Ask box sits on every tab and sheet I opened (17 places).
- M2 MET for talking (it explains, asks, says where to find figures, shows the draft, fills in). Uploads: NOT BUILT (IN SCOPE FILE).
- M3 NOT BUILT (IN SCOPE FILE): 23 of 42 grid cells are NO. All 23 are covered by scope.txt.
- M4 MET for typed news (spends, bills, figures, goals). Receipts by upload: NOT BUILT (IN SCOPE FILE).
- M5 MET.
- M6 MET: each change is shown on a card with Before/After and one Undo. It asks first for deletes, for amounts it guessed ("You didn't type this amount, it's the AI's guess") and for amounts over safe to spend.
- M7 MET on Home. The card spends are KNOWN (IN SCOPE FILE).
- M8, M12 COULD NOT TELL: no real AI.
- M9, M10 NOT BUILT (IN SCOPE FILE). M11 COULD NOT TELL.

COUNT: 7 jobs DONE, 1 STUCK (IN SCOPE FILE). Grid: 19 YES, 23 NO (all IN SCOPE FILE), 0 BROKEN. Setup never asks 11 questions.

JOBS (390x844 phone, nothing saved, made-up AI)
1. DONE. The first screen says "Welcome to the burrow". Next come two plain lines on what the app does, then the first question with the answer box right under it.
2. DONE. Made-up person: one bank, pay on the 10th after tax, two cards, three bills. "Your answers so far" listed every section before the fill. Each part has a row on Plan. Home's safe to spend is ¥21,333, with the sum written out under it.
3. DONE. Bank: "open the bank app. The big number on the first screen is it ... leave it for later". The fill is refused until the figure is given ("Still needed: What does Home bank show today?"). Close day: "It's on the card's monthly statement ... Not sure is fine". Home then counts all of each card.
4. DONE (made-up AI): what it is sent matches Home word for word, and SCREEN uses each screen's own name.
5. STUCK (IN SCOPE FILE) only on the upload: no attach button exists. Lunch, rent, add a bank, remove the gym bill (asks first), goal and set aside: all done, each shown on a card, and Undo brought every figure on Home, Plan and Receipts back (6 of 6, compared word for word).
6. DONE. "Add my car loan" gives "On the screens: Plan, Add a loan". "Delete everything" puts all three removals on one card that asks first. A guessed 9,000 for "lunch 90000" asks first.
7. DONE with KNOWN items. AI off or network gone: "That didn't go through: the assistant is off right now. Your message is back in the box", and the box still held the text. Setup on the screens took what the chat had already saved (country, currency, bank). After setup the panel offers only "Use any AI" (KNOWN LATER).
8. DONE. The Ask box was there and SCREEN was right in 17 places: every tab, Settings, Reminders, Check your bank, Add statements, and the bill, pay, Free to spend, goal, loan and card sheets.

GRID (add / change / remove, by asking)
accounts Y/N/N; cards Y/N/N (only the owed figure changes, through card_figure); loans N/N/N; pay Y/Y/Y; bills Y/Y/Y; budget lines Y/Y/Y; Free to spend Y/Y/Y; goals Y/N/N (setting money aside works); spends Y/Y/Y (the amount only; date, account and line are IN SCOPE FILE); bank checks Y/N/N; statements N/N/N; minimum N/N/N; reminders N/N/N; backup and cloud copy N/N/N. Every NO is IN SCOPE FILE (M3 "23 things", M13).

SETTINGS A PERSON NEVER SEES
- ANTHROPIC_API_KEY: missing, or refused, gives "The assistant is off right now". Visible.
- MODEL_QUICK, MODEL_DEFAULT, MODEL_COMPLEX: a wrong name still reads "on" in /api/health and every message fails (KNOWN LATER).
- ANTHROPIC_BASE_URL: wrong gives "Could not reach Claude". Shown only as a failed send.
- DB: without it the daily cap is not counted and nothing says so. Only /api/health shows it (KNOWN M68).
- INVITE_CODES: a code word box appears. Visible.
- IP_PER_MINUTE, USER_DAILY_CALLS (default 400 a day per code word), DAILY_TOKEN_CAP: seen only once the limit is hit.
- Settings has no line saying the assistant is on (KNOWN LATER).

BLOCKERS: none new.

CONFUSING
1. A change card for a bill, pay or goal shows only Safe to spend under Before/After, often the same figure on both sides, and never the old value. Example: "Rent: ¥75,000 from its next one", ¥21,333 / ¥21,333. Show "Rent ¥70,000 to ¥75,000".
2. change_spend when the bank check is in the same pay period: "Change the spend of ¥1,500 on 24 Nov to ¥9,000" with Safe to spend ¥18,333 / ¥18,333 and no reason given. The line about the check ("It was ¥2,000 at your bank check on 12 Dec ...") appears only when the check is in a later pay period (seen there). Add the same line here.
3. The Files instruction tells the AI to "ask them to type the figures" and never points to Home, Add statements, which already reads statement files.
4. After a failed call: "The AI did not answer: the AI did not answer (502). Nothing was lost". The words are doubled and carry a code.
5. With no network it says "the assistant is off right now". It should say the connection is down.
6. "Keep at least 10,000" is refused with "Say where from WHERE ON THE SCREENS", but that list has no entry for the minimum, so the AI has nothing true to say.
7. Setup question 4 asks two things ("How many banks ... Which bank does your pay go into?"), although its own rules say one question per message. It also never asks for a second bank's figure.

POLISH
- Adding the budget line "Transport ¥8,000" moved Safe to spend from ¥21,333 to ¥21,334 on the change card, the same in two runs. For qc-numbers.
- The "Ask" link at the top is 32 wide.
- After setup the privacy line still says "the setup answers so far".

QUESTIONS SETUP NEVER ASKED (11): are the cards paid in full; any loans; any goals or savings; cash or e-wallets; a second bank's figure; yearly or every-few-months bills; which bank each bill comes from when there are several; recurring card charges; has a card payment due since the last pay already gone out; backup or cloud copy at the end; reminders. The play amount as a percentage or a set amount is IN SCOPE FILE (M88).

KNOWN seen, not raised: "This is more than safe to spend. Do it?" on changes to pay and Free to spend; after setup with the AI off, only "Use any AI" is offered; the box is empty after a failed call; card spends are not taken off safe to spend.

FOR MAKO'S EYE: none.

NOT CHECKED: a real AI (none reachable); desktop and 320 wide; SCREEN inside a Receipts record sheet (no spend there at the time); iPhone; Undo after a reload for assistant cards.
