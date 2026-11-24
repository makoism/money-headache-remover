No check3.txt in the round folder (README: the published page from main 6740469). Tested with the made-up AI only (scripted replies through window.claude and a faked /api/ai).

VERDICT: FAIL

CHECK: no check3.txt

OWNER'S WORDS
- M1 NOT MET. First screen is a form invite; Ask is a 32x44 text button in the top bar beside Settings and Reminders.
- M2 NOT BUILT. Setup is one long form. Ask during setup or first open shows "Set up first".
- M3 NOT MET. Ask can do 4 kinds of change out of 42 grid cells. What it is sent leaves out pay amount, bills not due before next pay, Keep at least.
- M4, M5 NOT MET. No upload in Ask; most things are screens only.
- M6 NOT MET. Every Ask change needs Apply first (confirm before), not change then Undo. Undo itself works.
- M9 NOT MET for the assistant: nothing uploaded through it.
- M13 NOT MET through the assistant (see grid).
- M14 MET for Ask changes: Undo on the card and on Home put Safe to spend back (18,000 > 17,100 > 18,000, same after reload).
- M17 NOT MET: not before or during setup.
- M39 NOT MET: setup says "How much lands", never asks before or after tax.
- M41 MET on the form ("not sure").
- M54, M55 COULD NOT TELL (made-up AI). M63 MET (ai.js reads the key from the site secret only).
- M68 NOT MET: a new anon id every page open, so the per-browser daily cap resets on reload; no household cap.

COUNT: jobs 1 DONE (7), 7 STUCK (1, 2, 3, 4, 5, 6, 8). Grid 42 cells: YES 5, NO 37, BROKEN 0. Setup questions never asked: 3 (pay before or after tax; any other bank, e-wallet or cash; loans).

Jobs
1. First open STUCK. Screen: "Welcome to the burrow ... Set up with your own numbers". No greeting from the assistant; tapping Ask shows "Set up first".
2. Set up by talking STUCK. Not possible. Done on the form instead; Home showed "¥18,000 is safe to spend until pay on 10 Dec".
3. "I don't know that figure" STUCK. Ask cannot be opened during setup, where the question arises.
4. Ask about the app STUCK. Home explains 18,000 in two lines; the second ("¥292,000 (what your accounts can spare) − ¥274,000 (more than Free to spend left this period) = ¥18,000") is not in what Ask sends, so the AI cannot explain the figure in the screen's words. Ask is never told which screen is open.
5. Day to day STUCK. Lunch 900: DONE (card with Now/After, Apply, Undo, figures back). Put 5,000 toward Trip: DONE once a goal exists. Rent change, add a bank, remove Gym, card statement upload: STUCK.
6. Wrong asks STUCK. Never changes money without Apply (the 9,000 typo showed Safe to spend 15,000 > 6,000 and waited). But refusals do not say where on the screens to go, and the wording is code (below).
7. Assistant off DONE. AI off, network gone and a 503 all kept the question in the box; setup works on screens.
8. Always there STUCK. One tap away from all 3 tabs and 7 sheets tried (typed values kept). Not at first open or setup. Never knows the screen.

GRID (add / change / remove by asking)
- Accounts NO/NO/NO. Cards NO/NO/NO. Loans NO/NO/NO. Pay NO/NO/NO. Bills NO/NO/NO (tried change and remove: dropped).
- Budget lines NO/YES/NO. Free to spend YES/YES/NO. Goals NO/YES (money set aside only; taking money back dropped)/NO. Spends YES/NO/NO.
- Checks of the bank, statements, lowest the bank should go, reminders, backup and cloud copy: NO/NO/NO each.
Plan has "Add a bill", "Add a card", "Add a loan", "Add a goal", "Add a line"; each of those NOs fails the verdict on its own.

SETTINGS A PERSON NEVER SEES (functions/api/ai.js, health.js)
- ANTHROPIC_API_KEY missing: health says ai false. Nothing on Home or Settings says the AI is off; only after typing a question: "The AI can't be reached from this copy of the page. Open it from its own address, or inside Claude." On its own address that advice is wrong.
- INVITE_CODES set: the page always sends invite '' and has no box for a code word, so every question fails "the AI did not answer (401)". The assistant would be dead on the live site with no way to tell why (LESSONS lesson 5).
- No credit or bad key (503): page says "the AI did not answer (503)"; the server's own plain message is thrown away.
- DAILY_TOKEN_CAP, USER_DAILY_CALLS (429, server: "try again tomorrow"): page says "too many questions right now, try again in a minute". Wrong. IP_PER_MINUTE: same words, right.
- MODEL_* wrong: "the AI did not answer (400)". DB missing: caps silently off. ANTHROPIC_BASE_URL, SITE_VERSION: no sign.

BLOCKERS
1. Setup is not a chat and the assistant is locked until the form is saved. Phone 390, new device: tap "Ask" > toast "Set up first". Should: the assistant greets, explains, asks one thing at a time, fills the app.
2. Ask cannot add, change or remove accounts, cards, loans, pay, bills, reminders, checks, the minimum. Phone 390, after setup: ask "Remove the gym bill." Reply card: "Left out because the app could not read them: a change Ask can't make (remove_bill)". Same for change_bill and add_account.
3. Chat log lies after reopening. Ask "Remove the gym bill.", AI says "Removing Gym.", the "left out" card shows. Close Ask, open again: the log reads "Remove the gym bill. / Removing Gym." with no left-out line. Gym is still there. The log must keep what was not done.
4. No upload in Ask. "Here is my card statement" has nowhere to go.
5. The AI's instructions list 4 actions and never say what it cannot do or where on the screens to do it, so even the real AI cannot send a person to Plan.
6. Invite code and error words (settings above): the live assistant can fail showing only a status number.

CONFUSING
- "Left out because the app could not read them: a change Ask can't make (remove_bill)". Use: "I can't remove bills yet. Go to Plan, Pay and bills, tap Gym."
- "money for a goal I could not read" when no goal exists. Use: "You have no goal called Trip yet. Add one on Plan, Goals."
- Ask's top line ("through this page's own server when it is opened from its own address, or ...") reads like a manual. Use: "Your question and today's figures go to Claude. Nothing changes until you tap Apply."
- Setting 5,000 aside for Trip (kept in bank) left Safe to spend 18,000 > 18,000. For the number reviewer to confirm.

POLISH
- Ask button 32 px wide, under the 44 px tap size.
- The Undo button on an applied card is gone after closing and reopening Ask (Undo on Home still works).

FOR MAKO'S EYE
- Confirm-first versus change-then-Undo (not settled item 1): the build confirms every change.

NOT CHECKED
- The real AI's words (no network). Questions about someone else's money and "delete everything" only with scripted replies.
- change_line and set_free when no Free to spend is set: taken as YES from the assistant's action list, not tried in the browser (no budget line was made).
- Whether every job (remove a bill, add a bank) can be finished on the screens with the AI off: left to the screen reviewers.
- Desktop and 320 width for Ask.
- Scripts: /tmp/qc/assistant/.
