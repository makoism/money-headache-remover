# COPY_V1: the copy table, first batch

Voice lane (SIDE M2), 2026-11-19. Every row is one string a person sees, as it is in the source, and the same string rewritten to VOICE.md. The main session applies it in one go. No app file is changed on this branch.

**Listed against** `origin/wip-38.31` at 20538e3 (setup, Plan, Receipts and messages were listed at b5c51e3 and still apply at 20538e3).

**Rows:** 275. Per file: body.html 14, model.js 6, stmt.js 3, ui0.js 1, ui1.js 24, ui2.js 20, ui4.js 8, ui45.js 21, ui45c.js 20, ui45s.js 44, ui45u.js 20, ui45x.js 13, ui6.js 36, ui7.js 22, ui8.js 23.

**What is in:** setup, Plan, Receipts, Help text in body.html, Home and More, messages and errors in model.js, stmt.js and ui0.js. Sentences, hints, notes, errors, toasts, aria-label and placeholder text.

**What is not in yet (waits for the coordinator's word):** Settings, and every string about saving, the cloud copy, the recovery code, backup, restore and data that could be lost. They are listed as LATE in the notes at the end. Also not in: ui5.js, ui42.js, ui43.js, ui41.js, ui47.js, ui48.js, ui49.js, ui4b.js, ui44.js, ui3.js (Settings, saving and dialogs that belong to them), and the files that are art, prompts sent to Claude or his video transcript.

**What a row never changes:** a button word, a label, a tab, a glossary word, a number, a date, a `${...}`, an HTML tag. Strings that already pass have no row. About 1,150 of the 1,430 strings looked at are labels, buttons or lines that pass.

## How to apply

```
cd wip/team
bash tests/setup_env.sh                                   # acorn
node tests/qc/copy_apply.js --check COPY_V1.md            # says what would happen, writes nothing
node tests/qc/copy_apply.js COPY_V1.md                    # applies
node tests/qc/copy_apply.js COPY_V1.md ROUND2.md          # a fresh checkout: the batch, then Mako's notes on top
node tests/qc/copy_apply.js ROUND2.md                     # the batch is already in: only the follow-up
```

- It fails, and writes nothing, unless every old string is in its file exactly once, every `${...}` is kept, no em dash, exclamation mark or semicolon is added, and the code around the strings is the same token for token afterwards.
- Rows are applied in the order they stand. A few pairs depend on that order (A-045 before A-046, A-054 before A-055, E-032 before E-033, F-011 before F-012).
- It ends with the test files that quote an old string. Golden screen files need regenerating. `tests/regression/v31` and `v35` hold old copies of the page and are not assertions on this build.
- A follow-up table has the same row format in a ```copy fence. Its old strings are the strings as this table left them.

## How to read a row

```
@@ ID | file | AI: does it sound like AI (rule in VOICE.md Part A) | Mako: does it sound like him (Part B, C) | Next: does the person know what to do
- the old string, as in the source
+ the new string
# note: "clear wins" where exact money wording beat the voice, WORST, UNSURE
```

The verdict is on the old string. The new string is the fix.

## Hand edits the script cannot do

- ui45.js lines 205 and 208: "Longer setup is on: every bill and goal." is there twice. The rewrite is in the setup notes below.
- ui7.js: the toast "Finish the first steps first." is there twice and only needs its full stop dropped.
- stmt.js line 178: a semicolon a person sees comes from `.join('; ')` in code.
- "Plan exceeds pay" (ui2.js, a label, and the title in setup) is left alone because a label can't get longer. VOICE.md A9 names "exceeds". For Mako: "Plan is over pay" is the same length.
- "Prefer your own AI? Use it instead" (body.html) is the line you tap, so it is left alone. It is the question then answer shape (A8).


## The 20 worst

The lines that would put Mako off most, worst first. They are ordinary rows and are applied with the rest.

```copy
@@ A-001 | ui45.js | AI: yes A1 | Mako: no B13 | Next: yes
- a month, to spend without guilt. All other pay is placed.
+ a month, and it's yours to spend on whatever you want. All your other pay is placed.
# WORST: "without guilt" on the last setup screen, the exact line Mako called slop (VOICE.md A1)
@@ A-031 | ui45c.js | AI: yes A1 | Mako: no B14 A13 | Next: yes
- Then there are no statements to upload, and that is fine. On the next screen tap Type numbers instead: pay, bills and burrows, about five minutes.
+ Then there's nothing to upload. On the next screen tap Type numbers instead and put in your pay, bills and burrows, it takes about five minutes.
# WORST: "and that is fine" (A1), then clipped words after a colon (VOICE.md B14 uses this very line)
@@ B-021 | ui45s.js | AI: yes A1 | Mako: no B13 | Next: yes
- Every month, your pay is split into six places, each with one job. Bills and basics and Free to spend are for this month. Your goals, Education, Giving and Investing fill <b>burrows</b> that pile up over months. Free to spend is what you spend on fun without guilt. Usual shares of take-home pay:
+ Every month your pay gets split into six places and each one has one job. Bills and basics and Free to spend are for this month. Your goals, Education, Giving and Investing fill <b>burrows</b> that pile up over months. Free to spend is yours to spend on whatever you want. Usual shares of take-home pay:
# WORST: "without guilt", the line Mako called slop
@@ B-044 | ui45s.js | AI: yes A1 | Mako: no C colon | Next: yes
- Bills are paid and every other place has its share: this is yours to spend on fun, no guilt. Split of ${fmt2(f.inc)} pay:
+ Bills are paid and every other place has its share, so this is yours to spend on whatever you want. Split of ${fmt2(f.inc)} pay:
# WORST: "no guilt" on the screen that shows Free to spend for the first time
@@ B-054 | ui45x.js | AI: yes A1 A5 | Mako: no | Next: n/a
- Spend freely. No guilt.
+ Yours to spend on anything
# WORST: "No guilt." as its own sentence under Free to spend
@@ D-016 | model.js | AI: yes A1 | Mako: no B3 | Next: yes
- Fun for you and your family, no guilt. What is left at month end can go to a goal.
+ Fun for you and your family, spend it on whatever you want. What's left at month end can go to a goal.
# WORST: "no guilt", the comfort line he called slop.
@@ A-002 | ui45.js | AI: yes A9 | Mako: no B2 | Next: yes
- Plan exceeds pay by <b>${fmt2(f.shortBy)}</b>.
+ The plan is <b>${fmt2(f.shortBy)}</b> more than your pay.
# WORST: "exceeds" (VOICE.md A9 example). Tests quote the old words.
@@ A-007 | ui45.js | AI: yes A9 | Mako: no B2 | Next: yes
- Pay entered. The ${billsIn ? 'plan' : 'sample plan'} exceeds pay by <b>${fmt2(PF.shortBy)}</b>
+ Pay entered. The ${billsIn ? 'plan' : 'sample plan'} is <b>${fmt2(PF.shortBy)}</b> more than your pay
# WORST: "exceeds" again. The amount is not next to a hyphen, the sentence carries on with "because bills are still samples"
@@ C-034 | ui2.js | AI: yes A6 | Mako: no B1 | Next: yes
- Keep the other places going, even small: the habit matters more than the exact percent.
+ Keep putting something in the other places, even a small amount.
# WORST: a lesson on the end of a money fact
@@ C-035 | ui2.js | AI: yes A7 | Mako: no B1 | Next: n/a
- about the usual ${u}% many people aim for.
+ which is about the usual ${u}%.
# WORST: "many people"
@@ D-001 | body.html | AI: yes A9 | Mako: no B2 | Next: n/a
- aria-label="This month at a glance"
+ aria-label="This month"
# WORST: "at a glance" is on the lint's AI word list. Screen reader label only, check no test finds the section by it.
@@ D-024 | ui0.js | AI: yes A14 | Mako: no B10 | Next: yes
- This part hit a snag and is resting. The rest of the page works. If it keeps happening, Help has Report a problem.
+ This part broke but the rest of the page still works. If it keeps happening, tap Help and then Report a problem.
# WORST: "hit a snag and is resting" is cute at the reader.
@@ E-013 | ui6.js | AI: yes A2 A6 | Mako: no B1 | Next: yes
- A calendar reminder keeps this a habit. Logging a few minutes each week keeps the numbers true.
+ Put a reminder in your calendar so you log for a few minutes each week and the numbers stay right
# WORST: two "keeps" sentences that teach a lesson
@@ E-018 | ui6.js | AI: yes A9 unlocks | Mako: no B2 | Next: no
- Add a burrow to see what it unlocks and when.
+ Add a burrow to see what you're saving for and when you'll get there
# WORST: "unlocks" is the lint's one strong word in this file. UNSURE: I can't tell from the string what a burrow unlocks on this card, so the new line says what a burrow shows. If it really unlocks art, say what
@@ A-009 | ui45.js | AI: no | Mako: no B2 B13 | Next: yes
- Put in your pay and bills. The burrow shows how much is really free to spend, and saves toward the things you want.
+ Put in your pay and bills and the burrow shows you how much is really free to spend and saves up for the things you want.
# WORST: the first sentence a new person reads. "toward the things you want" is on the not-his list (B2). UNSURE: one long sentence with two "and", could split after "bills"
@@ B-019 | ui45s.js | AI: no | Mako: no B13 | Next: yes
- You can still add burrows next. They start filling once bills drop below pay. To lower a bill, go back. Otherwise continue and adjust under Plan later.
+ You can still add burrows next and they start filling once your bills are lower than your pay. Go back if you want to lower a bill now, or carry on and change it under Plan later.
# WORST: four chopped sentences in a row on the screen where the news is bad
@@ B-032 | ui45s.js | AI: yes A13 | Mako: no semicolon | Next: yes
- Each slider moves on its own; what you take away waits as not placed yet.
+ Each slider moves on its own, and what you take off one waits as not placed yet.
# WORST: semicolon
@@ B-035 | ui45s.js | AI: yes A13 | Mako: no semicolon | Next: yes
- Plan spends <b>${fmt2(f.J.out)}</b>; pay is <b>${fmt2(f.inc)}</b>.
+ The plan spends <b>${fmt2(f.J.out)}</b> and your pay is <b>${fmt2(f.inc)}</b>.
# WORST: semicolon between two amounts
@@ C-012 | ui1.js | AI: no | Mako: no B2 C | Next: no
- Usual advice: three to six months of necessities. The goal amount above is the first stop; this is the larger one.
+ Three to six months of Bills and basics is the usual amount. The goal amount above is the first stop and this is the bigger one after it.
# WORST: "necessities" is a retired word, plus a semicolon and a colon reveal
@@ C-038 | ui2.js | AI: no | Mako: no B2 C | Next: no
- Each slider sets that goal’s amount this month. Leave them alone to use the computed amounts (from goal amounts and dates). Up takes from Left; down returns to Left.
+ Each slider sets that goal’s amount for this month. If you leave them alone the amounts are worked out from each goal’s amount and date. Sliding up takes from Left and sliding down gives it back.
# WORST: brackets, a semicolon and "computed" in one hint
```

## Setup: first screens, questions, statements (ui45.js, ui45c.js, ui45u.js)

```copy
@@ A-003 | ui45.js | AI: no | Mako: no B14 B2 | Next: yes
- Under Plan: lower a bill or a goal, or add income.
+ Under Plan you can lower a bill or a goal, or add more pay.
# "income" is a retired word, the glossary word is pay. UNSURE: Plan has a "Money in" part, so "add more pay" may not be the word on that screen
@@ A-004 | ui45.js | AI: no | Mako: no B13 | Next: yes
- Nothing is free to spend in the plan. Raise the Free to spend line under Plan.
+ Nothing is free to spend in the plan, so raise the Free to spend line under Plan.
@@ A-005 | ui45.js | AI: no | Mako: no A13 | Next: yes
- </b> of pay is not placed yet: raise a goal or add to free to spend.
+ </b> of pay is not placed yet, so raise a goal or add to Free to spend.
# glossary: Free to spend takes its capital here like everywhere else
@@ A-006 | ui45.js | AI: no | Mako: no A13 | Next: yes
- </b> is not placed yet: raise a goal or add to free to spend.
+ </b> is not placed yet, so raise a goal or add to Free to spend.
@@ A-008 | ui45.js | AI: no | Mako: no B7 | Next: yes
- Pay entered. All of it is assigned.
+ Pay entered. All of it is placed.
# one word per thing: the app says placed everywhere else
@@ A-010 | ui45.js | AI: no | Mako: no B14 | Next: yes
- Six minutes from Mako, who made this. Also under Help.
+ Six minutes from Mako, who made this. It's under Help too.
@@ A-011 | ui45.js | AI: no | Mako: no B14 B13 | Next: yes
- Six minutes from Mako, who made this. Come back here when done, or skip. Also under Help.
+ Six minutes from Mako, who made this. Come back here when you're done or skip it, it's under Help too.
@@ A-012 | ui45.js | AI: no | Mako: no B3 | Next: yes
- Video did not load. Skip it and continue.
+ The video didn't load, so skip it and carry on.
@@ A-013 | ui45.js | AI: no | Mako: no A13 | Next: yes
- The first setup is short: pay, rent, food and one goal.
+ The first setup is short, just pay, rent, food and one goal.
@@ A-015 | ui45.js | AI: no | Mako: no A13 B2 | Next: yes
- Receipts keeps this true: log what you spend, or upload each month's statement. What is left of Free to spend at month end can go toward a goal. Help, bottom right, has the video and this setup.
+ To keep this true you log what you spend in Receipts or upload each month's statement. Whatever is left of Free to spend at month end can go into a goal. Help at the bottom right has the video and this setup.
# UNSURE: "keeps this true" is the team's phrase, not checked against how he'd say it
@@ A-016 | ui45.js | AI: no | Mako: no B14 B13 | Next: yes
- Pay skipped. Everything is zero until you add numbers.
+ You skipped pay, so everything is zero until you add numbers.
@@ A-017 | ui45.js | AI: no | Mako: no B14 B15 | Next: no, the path is a row of bare words
- No pay yet, so the numbers are samples. Add yours on Plan: Month, Details, Money in, Salary. Or Help, Guided setup, to come back here.
+ No pay yet, so the numbers are samples. To add yours go to Plan, then Month, Details, Money in and Salary, or tap Help and then Guided setup to come back here.
# every tap named in order (B15). Button words unchanged
@@ A-018 | ui45.js | AI: no | Mako: no B13 | Next: yes
- Bills and burrows are empty. Open Plan, Bills and basics, and enter what you pay.
+ Bills and burrows are empty, so open Plan, go to Bills and basics and enter what you pay.
@@ A-019 | ui45.js | AI: no | Mako: no B4 | Next: yes
- Your bills are in. Any line left at zero can be set under Plan, Bills and basics.
+ Your bills are in. If a line is still at zero you can set it under Plan in Bills and basics.
@@ A-020 | ui45.js | AI: no | Mako: no B13 | Next: yes
- Your bills are all at zero so far. Set each line under Plan, Bills and basics.
+ Your bills are all at zero so far, so set each line under Plan in Bills and basics.
@@ A-021 | ui45.js | AI: no | Mako: no B13 | Next: yes
- Bills and burrows are still samples. Open Plan, Bills and basics, and set each line. Or use <b>Set all to zero</b> in Settings.
+ Bills and burrows are still samples. Open Plan, go to Bills and basics and set each line, or use <b>Set all to zero</b> in Settings.
@@ A-022 | ui45.js | AI: no | Mako: no C brackets | Next: yes
- Help (bottom right) has the video and the setup.
+ Help at the bottom right has the video and the setup.
@@ A-023 | ui45c.js | AI: no | Mako: no B1 A13 | Next: yes
- Statements only show what went through an account. After the upload, the check screen lists every bill and has Add a line: put the cash ones there. Day-to-day cash spending goes in Receipts any time.
+ Statements only show what went through an account, so cash bills you add yourself. After the upload the check screen has Add a line for them, and day-to-day cash spending goes in Receipts any time.
@@ A-024 | ui45c.js | AI: no | Mako: no C brackets B13 | Next: yes
- Add it on the check screen after the upload (Add a line), or later on the Plan tab if it comes every month. A one-off goes in Receipts, Log spend.
+ After the upload the check screen has Add a line, so put it there, or add it later on the Plan tab if it comes every month. If it's a one-off, go to Receipts and tap Log spend.
@@ A-025 | ui45c.js | AI: no | Mako: no B13 B3 | Next: yes
- The check screen shows every shop with its category. Tap one and pick another. The app remembers it, so next month it is already right.
+ The check screen shows every shop with its category, so you tap the wrong one and pick another. The app remembers it and next month it's already right.
@@ A-026 | ui45c.js | AI: no | Mako: no B3 | Next: yes
- The files are sent once to Claude to be read and this app does not keep them. Only the numbers stay, in this browser. Nobody else can see them, Mako included.
+ The files are sent to Claude once to be read and this app doesn't keep them. Only the numbers stay, and they stay in this browser where nobody else can see them, Mako included.
# clear wins (Part D 10): what is sent where is said in full, only the contraction and one join changed
@@ A-027 | ui45c.js | AI: yes A2 | Mako: no B1 | Next: yes
- Open the PDF with its password, then save or print it as a new PDF without one, or take screenshots of the pages. Both work.
+ Open the PDF with its password, then save or print it as a new PDF without one. Screenshots of the pages work too.
@@ A-028 | ui45c.js | AI: no | Mako: no B13 | Next: yes
- Tap Type numbers instead on the next screen. It takes about five minutes. Statements can go in later from Receipts, and the numbers become exact then.
+ Tap Type numbers instead on the next screen, it takes about five minutes. You can put statements in later from Receipts and the numbers become exact then.
@@ A-029 | ui45c.js | AI: no | Mako: no B3 B13 | Next: yes
- Upload it like any other. On the check screen, untick what is not yours, or change an amount to your share.
+ Upload it like any other, then on the check screen untick what isn't yours or change an amount to your share.
@@ A-030 | ui45c.js | AI: no | Mako: no B2 | Next: yes
- Where does your money come in and go out? Pick all that apply.
+ Where does your money come in and go out? Pick every one you use.
# UNSURE: "Pick all that apply" is form language but everybody knows it
@@ A-032 | ui45c.js | AI: no | Mako: no B13 | Next: yes
- Day-to-day cash goes in Receipts. Log it as you spend, or once a week.
+ Day-to-day cash goes in Receipts, you log it as you spend or once a week.
@@ A-033 | ui45c.js | AI: no | Mako: no B2 | Next: yes
- What do you call them? Use your own words, for example
+ What do you call them? Use your own words, like
@@ A-034 | ui45c.js | AI: no | Mako: no B14 B2 | Next: yes
- . The app will use these names everywhere. Optional.
+ . The app uses these names everywhere, and you can skip this.
# "Optional." as a one word sentence is the clipped form shape (B14). The Skip button is on the same screen
@@ A-035 | ui45c.js | AI: no | Mako: no B3 B13 | Next: yes
- Cash does not show on statements. The check screen after the upload has a line for it, and Receipts takes cash any time.
+ Cash doesn't show on statements, so the check screen after the upload has a line for it and Receipts takes cash any time.
@@ A-036 | ui45c.js | AI: yes A13 | Mako: no B3 | Next: yes
- Why statements: they already know where your money went, so there is nothing to guess or remember, and the numbers come out exact.
+ Statements already know where your money went, so there's nothing to guess or remember and the numbers come out exact.
# the three "Label: explanation" messages in a row were one shape (A10)
@@ A-037 | ui45c.js | AI: yes A13 | Mako: no C brackets B3 | Next: yes
- What happens: each file is sent once to Claude, an AI, which turns its rows into a table (date, description, amount). This app then does all the arithmetic itself: your pay, each bill as a monthly average, your balance. The files are not kept.
+ Each file is sent once to Claude, an AI, which turns its rows into a table of date, description and amount. This app then does all the maths itself, so your pay, each bill as a monthly average and your balance. The files aren't kept.
# clear wins (Part D 10): "sent once to Claude, an AI" and "The files aren't kept" stay as plain statements
@@ A-038 | ui45c.js | AI: yes A13 | Mako: no B13 | Next: yes
- How it is sorted: every shop and payee gets a category, like rent, food, transport, subscriptions or play. The next screen shows every number and category before anything is used. Tap one to change it, and the app remembers your choice for next month.
+ Every shop and payee gets a category, like rent, food, transport, subscriptions or play. The next screen shows you every number and category before anything is used, and if one is wrong you tap it to change it and the app remembers for next month.
@@ A-039 | ui45c.js | AI: no | Mako: no B5 | Next: yes
- Any questions before you start? Tap one below or type your own.
+ Questions before you start? Tap one or type your own.
# the rewrite VOICE.md B5 gives for this line
@@ A-040 | ui45c.js | AI: no | Mako: no B3 | Next: yes, what works now comes first
- Typed questions need Claude, which this copy of the page cannot reach. The Ask button on Home answers anything once setup is done, or tap one of the questions below.
+ Typed questions need Claude, and this copy of the page can't reach it. Tap one of the questions below, or use the Ask button on Home once setup is done.
@@ A-041 | ui45c.js | AI: no | Mako: no B6 | Next: yes
- No answer came back. Try again, or tap one of the questions below.
+ Nothing came back. Try again or tap a question below.
# the rewrite VOICE.md B6 gives for this line
@@ A-042 | ui45c.js | AI: no | Mako: no B3 | Next: yes
- That did not go through. Try again in a moment, or tap one of the questions below.
+ That didn't go through. Try again in a moment or tap a question below.
@@ A-043 | ui45u.js | AI: no | Mako: no B14 | Next: no, it didn't say what to do
- : not a readable PDF.
+ : this PDF can't be read. Take screenshots of the pages instead.
# UNSURE: the advice is taken from the app's own "How to get your statements" text (screenshots work where a PDF doesn't)
@@ A-044 | ui45u.js | AI: no | Mako: no B14 | Next: yes
- : only CSV or Excel files, ${askDoc ? 'PDFs, ' : ''}screenshots and photos.
+ : this kind of file can't be read. Use CSV or Excel files, ${askDoc ? 'PDFs, ' : ''}screenshots or photos.
@@ A-045 | ui45u.js | AI: no | Mako: no B2 | Next: yes
- is too large. Export fewer months, or take screenshots of the pages.
+ is too big. Export fewer months or take screenshots of the pages.
@@ A-046 | ui45u.js | AI: no | Mako: no B2 | Next: no, it didn't say what to do
- is too large.
+ is too big. Try a smaller file.
# this old string is in the file once only after A-045 has been applied, so keep the two rows in this order
@@ A-047 | ui45u.js | AI: no | Mako: no B14 | Next: no, it read like a label
- files at a time.
+ files at a time is the most.
@@ A-048 | ui45u.js | AI: no | Mako: no B4 | Next: yes
- Statements of this account go here.
+ Put this account's statements here
@@ A-049 | ui45u.js | AI: no | Mako: no A13 B13 | Next: yes
- Any bank or e-wallet app: open the account, find <b>Statements</b>, <b>Transaction history</b> or <b>Export</b>, and choose the last 2 or 3 months. A <b>CSV</b> or <b>Excel</b> export, or a <b>PDF</b> statement, is best. If the app only shows a list, take <b>screenshots</b> of each page instead.
+ In any bank or e-wallet app you open the account, find <b>Statements</b>, <b>Transaction history</b> or <b>Export</b> and choose the last 2 or 3 months. A <b>CSV</b> or <b>Excel</b> export or a <b>PDF</b> statement is best, and if the app only shows a list you take <b>screenshots</b> of each page instead.
@@ A-050 | ui45u.js | AI: no | Mako: no C brackets | Next: yes
- A PDF that asks for a password (GCash sends these) has to be opened with the password first, then saved or printed as a new PDF, or screenshotted.
+ If a PDF asks for a password, like the ones GCash sends, open it with the password first and then save or print it as a new PDF, or take screenshots of it.
@@ A-051 | ui45u.js | AI: no | Mako: no C brackets B14 | Next: yes
- Credit cards: the last statement (CSV or screenshots). Cash spending: add it on the review screen.
+ For credit cards use the last statement, as CSV or screenshots. Cash spending you add on the review screen.
# UNSURE: this says "review screen", the setup chat says "check screen" for what looks like the same screen. Two names for one thing, not renamed here
@@ A-052 | ui45u.js | AI: yes A5 A4 | Mako: no B13 | Next: yes
- Nothing is stored. Files go to Claude once, the numbers come back, the files are forgotten.
+ Nothing is stored - your files go to Claude once, the numbers come back and the files aren't kept.
# clear wins (Part D 10): "forgotten" became "aren't kept", the same words the setup chat uses
@@ A-053 | ui45u.js | AI: no | Mako: no A13 B13 | Next: yes
- One box per account: your bank, each card, each wallet. Name each the way you say it, and the app will too. Put in the last 2 or 3 months of each: PDF, CSV or Excel exports, or screenshots of the transaction list. The numbers come out exact, and your history fills in.
+ There's one box per account, so your bank, each card and each wallet. Name each one the way you say it and the app will call it that too. Put in the last 2 or 3 months of each as PDF, CSV or Excel exports or screenshots of the transaction list, and the numbers come out exact and your history fills in.
@@ A-054 | ui45u.js | AI: no | Mako: no B2 B3 A13 | Next: yes
- <p id="srcAiLede">An alternative to the upload above, with the same result. If you would rather not send statements through this page, or you like ChatGPT, Gemini or the Claude app better: copy one message, paste it into that AI with your statements, answer its questions, and paste its final answer back here. It is checked and reviewed the same way.
+ <p id="srcAiLede">Or use your own AI and get the same result. If you'd rather not send statements through this page, or you like ChatGPT, Gemini or the Claude app better, you copy one message, paste it into that AI with your statements, answer its questions and paste its final answer back here. It gets checked the same way.
# this text is in the file twice. The row carries the tag in front so it is found once, and A-055 then finds the other one
@@ A-055 | ui45u.js | AI: no | Mako: no B2 B3 A13 | Next: yes
- An alternative to the upload above, with the same result. If you would rather not send statements through this page, or you like ChatGPT, Gemini or the Claude app better: copy one message, paste it into that AI with your statements, answer its questions, and paste its final answer back here. It is checked and reviewed the same way.
+ Or use your own AI and get the same result. If you'd rather not send statements through this page, or you like ChatGPT, Gemini or the Claude app better, you copy one message, paste it into that AI with your statements, answer its questions and paste its final answer back here. It gets checked the same way.
# must come after A-054
@@ A-056 | ui45u.js | AI: no | Mako: no B2 | Next: yes
- No statements at hand?
+ Don't have your statements right now?
@@ A-057 | ui45u.js | AI: no | Mako: no A13 B13 | Next: yes
- Bring in the last 2 or 3 months of each account: PDF, CSV or Excel exports, or screenshots of the transaction list. An AI app reads them for you, and the numbers come out exact. Your history fills in.
+ Bring in the last 2 or 3 months of each account as PDF, CSV or Excel exports or screenshots of the transaction list. An AI app reads them for you, so the numbers come out exact and your history fills in.
@@ A-058 | ui45u.js | AI: no | Mako: no A13 | Next: yes
- any AI: copy one message, paste it into ChatGPT, Gemini or the Claude app with your statements, answer its questions, and paste its final answer below.
+ any AI - copy one message, paste it into ChatGPT, Gemini or the Claude app with your statements, answer its questions and paste its final answer below.
# his hyphen, once, no amount near it
@@ A-059 | ui45u.js | AI: no | Mako: no B14 | Next: yes
- Shopping, eating out, not counted above
+ Shopping and eating out that isn't counted above
@@ A-060 | ui45u.js | AI: no | Mako: no B3 | Next: yes
- Here is what the statements show.
+ Here's what the statements show.
@@ A-061 | ui45u.js | AI: no | Mako: no B3 B13 | Next: yes
- Tick what is right, fix any amount. Unticked lines are left out.
+ Tick what's right and fix any amount that isn't. Anything you leave unticked is left out.
@@ A-062 | ui45u.js | AI: no | Mako: no B13 B4 | Next: yes
- Missing a bill? Tick it and type the amount. Anything can be changed later in Plan.
+ If a bill is missing, tick it and type the amount. You can change anything later in Plan.
```

## Setup: bills, shares, burrows, the plan reveal (ui45s.js, ui45x.js)

```copy
@@ B-001 | ui45s.js | AI: yes A8 | Mako: no B13 | Next: yes
- Not sure? Leave it blank and add it later on Plan.
+ If you're not sure leave it blank and add it later on Plan
@@ B-002 | ui45s.js | AI: no | Mako: no B13 B4 | Next: yes
- Full amount, even if someone shares it. Put their share under Money in.
+ Put the full amount even if someone shares it, and put their share under Money in
@@ B-003 | ui45s.js | AI: no | Mako: no C full stop | Next: n/a
- Electricity, gas and water.
+ Electricity, gas and water
@@ B-004 | ui45s.js | AI: no | Mako: no B13 | Next: yes
- Groceries and everyday meals. Eating out for fun goes under Free to spend.
+ Groceries and everyday meals - eating out for fun goes under Free to spend
@@ B-005 | ui45s.js | AI: no | Mako: no B3 | Next: n/a
- Home internet, or the data plan if that is how you connect.
+ Home internet, or your data plan if that's how you get online
@@ B-006 | ui45s.js | AI: no | Mako: no C full stop | Next: n/a
- Your monthly plan, or what you usually spend on top-ups.
+ Your monthly plan, or what you usually spend on top-ups
@@ B-007 | ui45s.js | AI: no | Mako: no B14 | Next: yes
- Health, life, car or home. Use the monthly amount.
+ Health, life, car or home. Put in what it costs a month.
# keeps its full stop because the next string is joined onto it in pesos
@@ B-008 | ui45s.js | AI: yes A8 | Mako: no B13 | Next: yes
- Self-employed? Include your own SSS, PhilHealth and Pag-IBIG.
+ If you're self-employed include your own SSS, PhilHealth and Pag-IBIG too.
@@ B-009 | ui45s.js | AI: no | Mako: no B13 | Next: yes
- Tick what applies. Rough numbers are fine.
+ Tick the ones you pay, rough numbers are fine
@@ B-010 | ui45s.js | AI: yes A8 | Mako: no B13 | Next: yes
- Missing one? Add lines later.
+ If one's missing you can add lines later
@@ B-011 | ui45s.js | AI: no | Mako: no B14 | Next: yes
- Tick each one, then enter the monthly cost. The grey line is a typical price, as a check only.
+ Tick each one and put in what it costs a month. The grey line is a typical price so you can check yours against it.
@@ B-012 | ui45s.js | AI: no | Mako: no C colon | Next: yes
- Not in the list: add a name and amount.
+ If it's not in the list add a name and amount
@@ B-013 | ui45s.js | AI: no | Mako: no B13 A5 | Next: yes
- Typical prices, Nov 2026. Each grey line names its country. Plan and billing change them: use your own bill.
+ Typical prices from Nov 2026 and each grey line names its country. Yours depends on your plan and billing, so go by your own bill.
@@ B-014 | ui45s.js | AI: no | Mako: no | Next: no
- Give the part not placed yet to one
+ Give what's not placed yet to one of these
# aria-label. UNSURE: the old one stops mid thought, the new one is 6 characters longer
@@ B-015 | ui45s.js | AI: no | Mako: no B3 B14 | Next: yes
- No bills listed, so the other five places would share all of your pay. If that is wrong, go back and add bills.
+ You haven't listed any bills, so the other five places would share all of your pay. If that's not right go back and add your bills.
@@ B-016 | ui45s.js | AI: no | Mako: no B2 | Next: yes
- If you truly have none, continue and split below.
+ If you really have none, carry on and split it below
@@ B-017 | ui45s.js | AI: yes A9 | Mako: no B2 exceed | Next: yes
- Bills exceed pay by <b>${fmt2(setupCells(S).billsOverPay)}</b>, so
+ Bills are <b>${fmt2(setupCells(S).billsOverPay)}</b> more than your pay, so
@@ B-018 | ui45s.js | AI: no | Mako: no C colon | Next: yes
- nothing is left for the other five places: no free to spend and nothing for burrows, for now.
+ nothing is left for the other five places, so no Free to spend and nothing for burrows for now.
# glossary: Free to spend gets its capital
@@ B-020 | ui45s.js | AI: no | Mako: no B2 proportions | Next: yes
- is yours to split between the five places below, starting at the usual proportions.
+ is yours to split between the five places below, and it starts at the usual shares.
@@ B-022 | ui45s.js | AI: yes A3 A2 | Mako: no | Next: no
- The shares are a guide, not a rule.
+ These shares are a starting point, change them to fit you
# UNSURE: the old line is the "X, not Y" closer. The new one says what to do
@@ B-023 | ui45s.js | AI: no | Mako: no retired word | Next: n/a
- Cushion for surprises
+ Money for surprises
# "cushion" is a retired word. This one is a hint under the Emergency fund chip, a label, and it got shorter. UNSURE: a test may read it
@@ B-024 | ui45s.js | AI: yes A4 | Mako: no B3 B13 retired word | Next: yes
- Burrows hold money you build up: a cushion, a trip, a big purchase, or paying off a debt. Tick what you are working toward. Add more later.
+ Burrows hold money you build up for something, like a trip or paying off a debt. Tick the ones you're working on, you can add more later.
# four examples down to two (A4), "cushion" is a retired word
@@ B-025 | ui45s.js | AI: no | Mako: no B13 retired word | Next: yes
- A cushion for surprises. You can borrow from it in a short month. Usual advice: three to six months of bills.
+ Money for surprises, and you can borrow from it in a short month. The usual advice is three to six months of bills.
@@ B-026 | ui45s.js | AI: no | Mako: no retired word | Next: yes
- A cushion for surprises. How much do you want to hold? Usual advice: three to six months of bills.
+ Money for surprises. How much do you want to hold? The usual advice is three to six months of bills.
# clear wins: kept "hold" because the field under it is called "How much to hold"
@@ B-027 | ui45s.js | AI: no | Mako: no A5 B14 | Next: yes
- Name, cost, a date if there is one, and the reason in your words.
+ Give it a name, a cost, a date if there is one and why you want it
@@ B-028 | ui45s.js | AI: yes A6 | Mako: no B2 | Next: yes
- Why it matters, in your words
+ Why you want it
# placeholder
@@ B-029 | ui45s.js | AI: no | Mako: no B2 | Next: yes
- Shows with the goal, so the reason stays in view.
+ This shows next to the goal so you keep seeing why
@@ B-030 | ui45s.js | AI: no | Mako: no B4 | Next: yes
- With a date, the monthly amount is worked out for you.
+ Give it a date and the monthly amount gets worked out for you
@@ B-031 | ui45s.js | AI: no | Mako: no B3 C colon | Next: yes
- of this is not placed yet: your burrows cannot take more now. Add a burrow or raise a cost.
+ of this is not placed yet because your burrows can't take any more right now. Add a burrow or raise a cost.
@@ B-033 | ui45s.js | AI: no | Mako: no C colon | Next: yes
- at this pace. Under Plan, Burrows: move the date, lower the amount or give it more pay.
+ at this pace. Under Plan, Burrows you can move the date, lower the amount or give it more pay.
@@ B-034 | ui45s.js | AI: no | Mako: no B3 B13 C colon | Next: yes
- Free to spend is money for fun: what is left after bills and burrows. It needs your pay to work it out, so there is no figure yet.
+ Free to spend is money for fun, it's what's left after bills and burrows. There's no number yet because it needs your pay to work it out.
@@ B-036 | ui45s.js | AI: no | Mako: no B14 | Next: yes
- Nothing left, so no free to spend yet.
+ Nothing is left, so no Free to spend yet.
# glossary: Free to spend gets its capital
@@ B-037 | ui45s.js | AI: no | Mako: no retired word, C colon | Next: yes
- Under Plan: lower a bill or add income.
+ Under Plan you can lower a bill or add more pay.
# "income" is a retired word. UNSURE: if the Plan field it points to is called Money in, say that instead
@@ B-038 | ui45s.js | AI: no | Mako: no B3 B2 | Next: yes
- Free to spend appears as soon as there is room.
+ Free to spend shows up as soon as there's room.
@@ B-039 | ui45s.js | AI: no | Mako: no retired word | Next: n/a
- aria-label="Pay by jar"
+ aria-label="Where your pay goes"
# aria-label, "jar" is a retired word
@@ B-040 | ui45s.js | AI: no | Mako: no glossary capital | Next: yes
- of pay, so almost nothing is left for free to spend.
+ of pay, so almost nothing is left for Free to spend.
@@ B-041 | ui45s.js | AI: no | Mako: no glossary capital | Next: yes
- Nothing is set aside for free to spend.
+ Nothing is set aside for Free to spend.
@@ B-042 | ui45s.js | AI: no | Mako: no glossary capital | Next: yes
- of pay is not placed yet. Raise a goal or add to free to spend.
+ of pay is not placed yet. Raise a goal or add it to Free to spend.
@@ B-043 | ui45s.js | AI: no | Mako: no B13 | Next: yes
- Bills take most of pay, so the month is tight. Lowering a bill is the easiest fix.
+ Bills take most of your pay so the month is tight, and lowering a bill is the easiest fix.
@@ B-045 | ui45x.js | AI: no | Mako: no B3 B13 | Next: yes
- No calendar file can be saved here. In your calendar app, add an event, set the same repeat, and paste this in.
+ A calendar file can't be saved here, so add an event in your calendar app, set the same repeat and paste this in.
@@ B-046 | ui45x.js | AI: no | Mako: no C brackets | Next: yes
- Press Ctrl+C (Cmd+C) to copy the selected text.
+ Press Ctrl+C, or Cmd+C on a Mac, to copy the selected text
@@ B-047 | ui45x.js | AI: no | Mako: no B13 | Next: yes
- Saved receipts-reminder.ics. Open it to add the repeating event. If nothing happens, open it from your downloads.
+ Saved receipts-reminder.ics - open it to add the repeating event, and if nothing happens open it from your downloads
@@ B-048 | ui45x.js | AI: no | Mako: no B14 | Next: no
- File not created here. Use the copy-text option.
+ The file couldn't be made here, so add the event in your calendar app yourself
# UNSURE: the old line sends you to a "copy-text option", and the Copy event text button only shows inside Claude, not where this message shows. The new line names nothing that may not be there. For the main session: showing the copy box here too would be the real fix
@@ B-049 | ui45x.js | AI: no | Mako: no B3 B13 | Next: yes
- can only take what is not placed yet, and nothing is. Lower another one first.
+ can only take what's not placed yet and right now nothing is, so lower another one first.
@@ B-050 | ui45x.js | AI: no | Mako: no C colon | Next: yes
- : all that was not placed yet. To go further, lower another one.
+ , which is all that was not placed yet. To go further lower another one.
# reads after a name and a percent: "Giving +5%, which is all that was not placed yet"
@@ B-051 | ui45x.js | AI: yes A13 | Mako: no semicolon | Next: yes
- Lower one and the difference waits as not placed yet; raise one and it takes from there.
+ Lower one and the difference waits as not placed yet, raise one and it takes from there.
@@ B-052 | ui45x.js | AI: yes A5 | Mako: no B13 | Next: n/a
- Bills and essentials. Paid first.
+ Bills and essentials, paid first
@@ B-053 | ui45x.js | AI: no | Mako: no C full stop | Next: n/a
- Saved now, spent later.
+ Saved now, spent later
@@ B-055 | ui45x.js | AI: no | Mako: no C full stop | Next: n/a
- Books, courses, skills.
+ Books, courses, skills
@@ B-056 | ui45x.js | AI: yes A5 | Mako: no B13 | Next: n/a
- Invested. Not spent.
+ Invested, not spent
@@ B-057 | ui45x.js | AI: no | Mako: no C full stop | Next: n/a
- Gifts and donations.
+ Gifts and donations
```

## Plan and Receipts (ui1.js, ui2.js, ui4.js)

```copy
@@ C-001 | ui1.js | AI: no | Mako: no B13 B14 | Next: yes
- Monthly take-home pay, after tax. Paid twice a month: add both.
+ Your monthly take-home pay after tax, and if you get paid twice a month add both
@@ C-002 | ui1.js | AI: yes A4 | Mako: no B2 B14 | Next: yes
- Optional. A partner’s share, a second job, benefits: anything regular.
+ Only if you have one, like a partner’s share or a second job that pays every month
# "benefits" dropped as the third example (A4). UNSURE: someone on benefits may look for the word
@@ C-003 | ui1.js | AI: yes A2 | Mako: no B2 B13 | Next: yes
- Optional. Freelance, gig or cash work that changes month to month. Enter the lowest month you expect, so the plan still works in a slow one. Extra that comes in is a bonus.
+ Only if you have it. This is freelance, gig or cash work that changes month to month, so put in the lowest month you expect and the plan still works in a slow one - anything extra is a bonus
@@ C-004 | ui1.js | AI: no | Mako: no C | Next: yes
- Rent, food, utilities, every other monthly bill.
+ Rent, food, utilities and every other monthly bill
@@ C-005 | ui1.js | AI: no | Mako: no B14 | Next: no
- Minimum payments plus extra.
+ The minimum payments plus anything extra you pay
@@ C-006 | ui1.js | AI: yes A4 | Mako: no B2 | Next: yes
- Burrows with a goal: big purchases, rainy day fund, trips, surprises.
+ Burrows with a goal, like a trip, something big to buy or your Emergency fund
# clear wins: three examples kept because the Emergency fund lives here. "rainy day fund" becomes the app's own word, Emergency fund
@@ C-007 | ui1.js | AI: yes A4 | Mako: no B13 | Next: yes
- Eating out, hobbies, treats, fun. Groceries go under Bills and basics.
+ Eating out, hobbies and fun stuff - groceries go under Bills and basics
@@ C-008 | ui1.js | AI: yes A4 | Mako: no B2 | Next: yes
- Courses, books, coaching, skill building.
+ Courses, books and anything else you learn from
@@ C-009 | ui1.js | AI: yes A5 | Mako: no B2 B14 | Next: yes
- Money you never spend: index fund, retirement plan. Put away regularly, leave alone.
+ Money you put away and don't spend, like an index fund or a retirement plan
@@ C-010 | ui1.js | AI: yes A4 | Mako: no C | Next: yes
- Charity, donations, gifts.
+ Gifts and donations
@@ C-011 | ui1.js | AI: no | Mako: no B13 | Next: yes
- The one goal you can borrow from in a short month. A finished payment can send its money here.
+ This is the one goal you can borrow from when a month comes up short, and a payment that ends can send its money here
@@ C-013 | ui1.js | AI: no | Mako: no B2 | Next: yes
- Monthly amount is computed. To change it, open Burrows under Plan.
+ The monthly amount is worked out for you. To change it open Burrows under Plan.
@@ C-014 | ui1.js | AI: no | Mako: no B2 | Next: yes
- Shows with the goal, so the reason stays in view.
+ This shows next to the goal so you keep seeing why
@@ C-015 | ui1.js | AI: no | Mako: no B3 B13 | Next: yes
- With a date, the amount left is spread over the months before it. Without one, it is planned over about a year.
+ With a date the amount left gets spread over the months before it, and without one it's planned over about a year.
# full stop kept, more text can follow it
@@ C-016 | ui1.js | AI: no | Mako: no B13 | Next: yes
- No burrows. Add one below.
+ No burrows yet - add one below
@@ C-017 | ui1.js | AI: no | Mako: no B14 | Next: yes
- Limit: ${MAX_GOALS} burrows.
+ You can have ${MAX_GOALS} burrows at most
@@ C-018 | ui1.js | AI: no | Mako: no B2 | Next: yes
- Enter a category name.
+ Type a name for the category
@@ C-019 | ui1.js | AI: no | Mako: no B13 | Next: yes
- That name exists. Pick it from the list.
+ You already have that name, pick it from the list
@@ C-020 | ui1.js | AI: no | Mako: no B14 | Next: yes
- Limit: ${MAX_LINES} categories.
+ You can have ${MAX_LINES} categories at most
@@ C-021 | ui1.js | AI: yes A13 | Mako: no B13 | Next: yes
- No monthly amount yet: set one in Plan to compare.
+ It has no monthly amount yet, so set one in Plan to compare.
@@ C-022 | ui1.js | AI: no | Mako: no C | Next: yes
- New line, e.g. Pet food
+ New line, like Pet food
@@ C-023 | ui1.js | AI: no | Mako: no B14 | Next: yes
- Warns when a month would end below this.
+ You get a warning when a month would end below this
@@ C-024 | ui1.js | AI: no | Mako: no B13 | Next: yes
- The most you want Free to spend to be in a month. A mark on the Free to spend bar in Plan shows it.
+ The most you want Free to spend to be in a month, shown as a mark on the Free to spend bar in Plan
@@ C-033 | ui2.js | AI: no | Mako: no B13 | Next: yes
- No bills planned yet. Add rent, food and the rest under Money out.
+ No bills planned yet - add rent, food and the rest under Money out.
# full stop kept, another sentence can follow it
@@ C-036 | ui2.js | AI: yes A5 | Mako: no B13 | Next: n/a
- under the usual ${u}%. More room for the other places.
+ under the usual ${u}%, so there's more room for the other places.
@@ C-039 | ui2.js | AI: no | Mako: no B14 | Next: yes
- Type monthly take-home pay under Salary.
+ Type your monthly take-home pay under Salary
@@ C-040 | ui2.js | AI: no | Mako: no B13 | Next: yes
- Set each Bills and basics line to the real amount. Rename, remove or add lines.
+ Put your real amount on each Bills and basics line, and rename, remove or add lines as you go
@@ C-041 | ui2.js | AI: no | Mako: no B14 | Next: yes
- Name each goal, its cost and its date.
+ Give each goal a name, what it costs and a date
@@ C-042 | ui2.js | AI: no | Mako: no B13 | Next: yes
- Add what you spent. Set a calendar reminder to make it a habit.
+ Add what you spent, and set a reminder in your calendar so you keep doing it
@@ C-043 | ui2.js | AI: yes A13 | Mako: no B14 | Next: yes
- Enter monthly take-home pay: tap Salary below.
+ Tap Salary below and type your monthly take-home pay
@@ C-044 | ui2.js | AI: no | Mako: no B7 | Next: yes
- Raise a goal or another place to use it, or keep it as a cushion.
+ Raise a goal or another place to use it, or leave it where it is.
# WORST: "cushion" is a retired word. UNSURE: "leave it where it is" says less than cushion did
@@ C-045 | ui2.js | AI: no | Mako: no B14 | Next: yes
- Month spends ${fmt2(PC.overPay)} more than your pay
+ This month spends ${fmt2(PC.overPay)} more than your pay
@@ C-046 | ui2.js | AI: no | Mako: no B14 C | Next: yes
- . Balance covers it and ends at ${fmt2(m.bankEnd)}, at or above the ${fmt2(floor)} minimum balance (change it in Settings).
+ . Your balance covers it and ends at ${fmt2(m.bankEnd)}, which is at or above your ${fmt2(floor)} minimum balance. You can change that in Settings.
# brackets out, the side note gets its own sentence
@@ C-047 | ui2.js | AI: no | Mako: no C | Next: yes
- under the ${fmt2(floor)} minimum balance (change it in Settings).
+ under your ${fmt2(floor)} minimum balance. You can change that in Settings.
@@ C-048 | ui2.js | AI: no | Mako: no B2 | Next: n/a
- so the bank ends higher than the figures above.
+ so the bank ends higher than the numbers above.
@@ C-049 | ui2.js | AI: no | Mako: no B14 | Next: n/a
- Mark = ${fmt(ceil)} ceiling.
+ The mark is your ${fmt(ceil)} ceiling.
# a symbol standing in for a word
@@ C-050 | ui2.js | AI: no | Mako: no B15 | Next: no
- Set the goal amount under Plan, Goals.
+ Open Plan, then Goals, and set the goal amount
# UNSURE: C-013 says "Burrows under Plan" for what looks like the same place. One of the two is wrong, I did not rename either
@@ C-052 | ui2.js | AI: no | Mako: no B3 B13 | Next: yes
- No burrows. Add one to see when it is reached.
+ No burrows yet - add one to see when you'll reach it
@@ C-053 | ui2.js | AI: no | Mako: no B13 | Next: n/a
- . Taken from that month’s money.
+ , taken out of that month’s money
@@ C-054 | ui2.js | AI: no | Mako: no B3 | Next: n/a
- Free to spend was not spent.
+ Free to spend wasn't spent.
@@ C-060 | ui4.js | AI: no | Mako: no C | Next: yes
- not logged as spent yet; Home asks where it goes.
+ not logged as spent yet, and Home asks where it goes.
# same words as the Plan screen now
@@ C-061 | ui4.js | AI: no | Mako: no B3 | Next: n/a
- Lines without receipts are not listed.
+ Lines with no receipts aren't listed
@@ C-062 | ui4.js | AI: no | Mako: no B6 | Next: yes
- Date must be ${monthLabel(START)} to ${monthLabel(END)}.
+ Pick a date from ${monthLabel(START)} to ${monthLabel(END)}
@@ C-063 | ui4.js | AI: no | Mako: no B13 | Next: yes
- Type the amount without a minus sign. A receipt is money you spent. For a refund, lower or delete the receipt it pays back.
+ Type the amount without a minus sign, because a receipt is money you spent. For a refund, lower or delete the receipt it pays back.
@@ C-064 | ui4.js | AI: no | Mako: no B2 | Next: yes
- Enter an amount.
+ Type an amount
# UNSURE: an error tests are likely to quote
@@ C-065 | ui4.js | AI: no | Mako: no B2 | Next: yes
- That amount is too large. The most is 1,000,000,000.
+ That amount is too big. The most is 1,000,000,000.
@@ C-066 | ui4.js | AI: no | Mako: no C | Next: yes
- Add a short title, e.g. “Vet bill”.
+ Add a short title, like “Vet bill”
@@ C-067 | ui4.js | AI: no | Mako: no C | Next: n/a
- Deleted ${what}.
+ Deleted ${what}
# a toast, no full stop
```

## Plan, Receipts and Help in body.html, messages in model.js, stmt.js, ui0.js

```copy
@@ D-002 | body.html | AI: no | Mako: no C | Next: yes
- Tap a month to open.
+ Tap a month to open it
@@ D-003 | body.html | AI: no | Mako: no B14 | Next: yes
- Each goal at month end, if the plan holds.
+ Where each goal is at month end if you stick to the plan
# UNSURE: a little longer than the old one, it sits under the Forecast heading.
@@ D-004 | body.html | AI: no | Mako: no B13 B2 | Next: yes
- Claude reads receipt photos and statements and files each item by category. You review before anything is added.
+ Claude reads your receipt photos and statements and sorts each item into a category, and nothing gets added until you've checked it.
# clear wins: says what is sent and that nothing is added without the person, kept exact.
@@ D-005 | body.html | AI: no | Mako: no C B13 | Next: yes
- One receipt per photo, flat, well lit. A bank CSV, Excel or PDF statement lists a whole month. Files go to Claude on Read; this page keeps none.
+ One receipt per photo, flat and well lit. A bank statement as a CSV, Excel or PDF file covers a whole month. When you tap Read the files go to Claude and this page keeps none of them.
# WORST: semicolon and clipped words in the line that says where the files go. clear wins: the privacy sentence stays a sentence of its own.
@@ D-007 | body.html | AI: no | Mako: no B3 B13 | Next: yes
- An alternative to the buttons above, with the same result. If you would rather not send receipts through this page, or you like ChatGPT, Gemini or the Claude app better: copy one message, paste it into that AI with the photos, and paste its reply back here. It is checked and listed for review the same way.
+ This does the same thing as the buttons above. If you don't want to send receipts through this page, or you like ChatGPT, Gemini or the Claude app better, you copy one message, paste it into that AI with the photos and paste its reply back here. The reply gets checked and listed for you to go through the same way.
# WORST: "An alternative to", "you would rather not", a colon as a drum roll.
@@ D-008 | body.html | AI: no | Mako: no B14 | Next: yes
- Paste it into your AI app, attach the photos, send.
+ Paste it into your AI app, attach the photos and send it.
# A numbered step between two that end in a full stop, so it keeps its own.
@@ D-009 | body.html | AI: no | Mako: no C | Next: yes
- Google Calendar and Apple Calendar (the downloaded file) repeat on their own. Outlook, Microsoft 365 and Yahoo open once: set Repeat there.
+ Google Calendar and Apple Calendar, which uses the downloaded file, repeat on their own. Outlook, Microsoft 365 and Yahoo only add it once, so set Repeat in there yourself.
# UNSURE: I read "open once" as "the event is added one time". If it means something else this row is wrong.
@@ D-010 | body.html | AI: no | Mako: no B13 | Next: yes
- Hold the receipt flat in the frame, then take the photo. Take as many as you need.
+ Hold the receipt flat in the frame and take the photo, you can take as many as you need.
@@ D-011 | body.html | AI: no | Mako: no B13 | Next: yes
- Tap the cover to start. Browsers need a tap on the player itself.
+ Tap the cover to start it - browsers need a tap on the player itself
@@ D-012 | body.html | AI: no | Mako: no B2 B13 | Next: yes
- It names the version, the device and the last errors. It holds none of your numbers.
+ It has the version, your device and the last errors in it, and none of your numbers.
# clear wins: what is in the report and what is not, both kept.
@@ D-013 | body.html | AI: no | Mako: no C B14 | Next: yes
- Runs on your Claude account; you approve access first. Only what you type is sent, plus the numbers if ticked.
+ This runs on your Claude account and you approve access first. Only what you type is sent, plus your numbers if you tick the box.
# WORST: a semicolon and dropped words in a privacy line. clear wins: "Only what you type is sent" unchanged.
@@ D-014 | body.html | AI: no | Mako: no B14 | Next: yes
- Chat runs on Claude. For another AI, copy your question with a short page guide and paste it there.
+ The chat runs on Claude. To use another AI, copy your question with a short guide to the page and paste it in there.
@@ D-015 | model.js | AI: yes A13 A2 | Mako: no B1 | Next: yes
- Saved now, spent later: a big purchase, a trip, a rainy day, a surprise. Your burrows live here.
+ Money you save now and spend later, on a big purchase, a trip or a surprise. Your burrows are in here.
# UNSURE: "a rainy day" is dropped from the examples (four in a row read as a list for effect). Put it back if the Emergency fund should be named here.
@@ D-017 | model.js | AI: yes A5 | Mako: no B13 | Next: yes
- Never spent. It grows over time.
+ You never spend this, it grows over time.
@@ D-018 | model.js | AI: no | Mako: no B14 C | Next: yes
- Biggest bill. Use the full amount, even if someone shares it (put their share under Money in).
+ Your biggest bill. Use the full amount even if someone shares it, and put their share under Money in.
@@ D-019 | model.js | AI: yes A5 | Mako: no B14 | Next: yes
- Health or life insurance. Not on payroll: include your own SSS, PhilHealth and Pag-IBIG payments. Monthly amount.
+ Health or life insurance, as a monthly amount. If you're not on a payroll, include your own SSS, PhilHealth and Pag-IBIG payments.
# "include your own SSS, PhilHealth and Pag-IBIG payments" is kept letter for letter: ui0.js swaps that exact piece for other countries.
@@ D-020 | model.js | AI: no | Mako: no C | Next: yes
- Pick the last payment month; its money can then move to your emergency fund.
+ Pick the month of the last payment, and after that its money can move to your emergency fund.
@@ D-021 | stmt.js | AI: no | Mako: no (retired word "income") | Next: yes
- regular income?
+ money that comes in every month?
# UNSURE: "income" is a retired word, but "pay" would be wrong here (this is other money in, seen once). Longer than the old one.
@@ D-022 | stmt.js | AI: no | Mako: no C | Next: yes
- covers only part of a month (${r.from} to ${r.to}); its numbers come from that part.
+ only covers part of a month, ${r.from} to ${r.to}, so its numbers come from that part.
@@ D-023 | stmt.js | AI: no | Mako: no C | Next: yes
- files are one account (${g.account || g.kind}): their months were put together
+ files are the same account, ${g.account || g.kind}, so their months were put together
```

## Home and More (ui6.js)

```copy
@@ E-001 | ui6.js | AI: no | Mako: no B2 B13 | Next: yes
- Pay and bills are yours. The burrows are still invented. Add a burrow below.
+ Pay and bills are yours but the burrows are still made up - add one below
# WORST: "invented" on the first screen he sees with sample numbers
@@ E-002 | ui6.js | AI: no | Mako: no B2 B13 | Next: yes
- Invented figures for now. Finish the step below to make them yours.
+ These numbers are made up - do the step below to put yours in
# WORST: the example line in VOICE.md Part C, first thing on Home
@@ E-003 | ui6.js | AI: no | Mako: no B13, retired word cushion | Next: yes
- of your pay has no place yet. Bills are covered. Give it a goal or a place, or keep it as a cushion.
+ of your pay has no place yet and your bills are covered, so give it a goal or a place or just leave it in the bank.
# WORST: "cushion" is a retired word. clear wins: kept the full stop because another sentence can follow it. UNSURE: "leave it in the bank" for "keep it as a cushion"
@@ E-004 | ui6.js | AI: no | Mako: no B13 | Next: yes
- Bills use all of your pay. Nothing is set aside yet.
+ Bills use all of your pay so nothing is set aside yet
@@ E-005 | ui6.js | AI: no | Mako: no B13, colon | Next: yes
- This week: nothing logged yet. Log by Sunday.
+ Nothing logged this week yet, log by Sunday
@@ E-006 | ui6.js | AI: no | Mako: no B3 | Next: n/a
- of free to spend is not logged as spent
+ of free to spend isn't logged as spent
@@ E-007 | ui6.js | AI: no | Mako: no B3 | Next: yes
- Your bank figure does not include it yet.
+ Your bank figure doesn't include it yet.
@@ E-008 | ui6.js | AI: no | Mako: no B3 | Next: yes
- so this may be spending you have not logged yet.
+ so this may be spending you haven't logged yet.
# clear wins: "may" stays, the app really doesn't know here (A12)
@@ E-009 | ui6.js | AI: no | Mako: no B13 | Next: yes
- Count it in the bank, or put it toward a goal. You can undo.
+ Count it in the bank or put it toward a goal, you can undo either one.
@@ E-010 | ui6.js | AI: no | Mako: no brackets, B13 | Next: yes
- Upload 2 or 3 months of statements (screenshots of the bank app work). The numbers become exact and your history fills in.
+ Upload 2 or 3 months of statements, screenshots of the bank app work too, and the numbers become exact and your history fills in
@@ E-011 | ui6.js | AI: no | Mako: no brackets, B13 | Next: yes
- Bring in 2 or 3 months of statements with an AI app (screenshots of the bank app work). The numbers become exact and your history fills in.
+ Bring in 2 or 3 months of statements with an AI app, screenshots of the bank app work too, and the numbers become exact and your history fills in
@@ E-012 | ui6.js | AI: yes A5 | Mako: no B14 | Next: yes
- Utilities, internet, phone, transport. Rough numbers are fine.
+ Utilities, internet, phone and transport - rough numbers are fine
@@ E-014 | ui6.js | AI: no | Mako: no B14 | Next: yes
- Streak: ${s.n} wk. Log by Sunday.
+ Streak: week ${s.n}. Log by Sunday.
# UNSURE: "wk" spelled out as "week 3" so it reads right for 1 too, the same shape as the toast "Streak: week 1". It can be followed by "Last day." so the full stop stays
@@ E-015 | ui6.js | AI: no | Mako: no B13 | Next: yes
- No streak. Log one receipt this week to start.
+ No streak yet, log one receipt this week to start one
@@ E-016 | ui6.js | AI: no | Mako: no B13 B14 | Next: n/a
- Shield ready. Covers one missed week.
+ Shield ready, it covers one missed week
@@ E-017 | ui6.js | AI: no | Mako: no B3 | Next: yes
- Set the amount to see what each month adds and when it is full.
+ Set the amount to see what each month adds and when it's full
@@ E-019 | ui6.js | AI: no | Mako: no B13 | Next: yes
- Money for anything you like this month. It starts fresh each month.
+ Spend this on whatever you want, it starts fresh each month
@@ E-020 | ui6.js | AI: no | Mako: no B3 | Next: yes
- this shows what is free to spend, and whether
+ this shows what's free to spend and whether
@@ E-021 | ui6.js | AI: yes A8 | Mako: no B13 | Next: yes
- days. Spent something? Add a rough total.
+ days. If you spent something add a rough total.
@@ E-022 | ui6.js | AI: no | Mako: no B13, retired word pot | Next: no
- logged as Other. Not taken from a pot.
+ logged as Other, so it didn't come out of a pile
# UNSURE: "pot" is not a word anywhere else. The tiles above this line say "came from the pile", so I used pile
@@ E-023 | ui6.js | AI: no | Mako: no B5 | Next: yes
- came out of your bank. Spend nothing more from Free to spend this month.
+ came out of your bank, so don't spend any more from Free to spend this month.
@@ E-024 | ui6.js | AI: no | Mako: no B3 B13 | Next: yes
- is held back. Your bank would end under your ${fmt(cfg(S, 'minBank'))} minimum, so it is not safe to spend.
+ is held back because spending it would leave your bank under your ${fmt(cfg(S, 'minBank'))} minimum.
# clear wins: full stops kept, it is a warning about money
@@ E-025 | ui6.js | AI: no | Mako: no B3 | Next: yes
- What is left at month end can go toward
+ What's left at month end can go toward
@@ E-026 | ui6.js | AI: no | Mako: no B3 B13 | Next: n/a
- The bar is what you have spent. The mark is how far through the month you are.
+ The bar is what you've spent and the mark is how far through the month you are
@@ E-027 | ui6.js | AI: no | Mako: no B13, two names for one thing | Next: yes
- No goals. Add one to list it here.
+ No burrows yet, add one and it shows up here
# UNSURE: the card's heading is Burrows and its button is Add a burrow, so the line now says burrows too. Say if goal was meant
@@ E-028 | ui6.js | AI: no | Mako: no B2 | Next: yes
- Not financial advice. Sample numbers are invented. Replace them with yours.
+ Not financial advice. The sample numbers are made up, replace them with yours.
# clear wins: a legal line, "Not financial advice." stays its own sentence
@@ E-029 | ui6.js | AI: no | Mako: no colon, B14 | Next: yes
- No date: plan assumes 12 months. About
+ No date, so the plan assumes 12 months. About
@@ E-030 | ui6.js | AI: no | Mako: no B2 B4 | Next: yes
- Shows with the goal, so the reason stays in view.
+ It shows with the goal so you keep seeing why
@@ E-031 | ui6.js | AI: no | Mako: no B13 | Next: yes
- Type the amount without a minus sign. A receipt is money you spent. For a refund, lower or delete the receipt it pays back.
+ Type the amount without a minus sign because a receipt is money you spent. For a refund, lower or delete the receipt it pays back.
@@ E-032 | ui6.js | AI: no | Mako: no B2 | Next: yes
- That amount is too large. The most is 1,000,000,000. ${el._mnyAtFocus ? 'The old amount stays.' : 'Type it again.'}
+ That amount is too big. The most is 1,000,000,000. ${el._mnyAtFocus ? 'The old amount stays.' : 'Type it again.'}
# this row has to come before E-033, which is the same sentence in another place
@@ E-033 | ui6.js | AI: no | Mako: no B2 | Next: yes
- That amount is too large. The most is 1,000,000,000.
+ That amount is too big. The most is 1,000,000,000.
# the error line in VOICE.md Part C, word for word
@@ E-034 | ui6.js | AI: no | Mako: no B2 e.g. | Next: yes
- Add a short title, e.g. “Vet bill”.
+ Add a short title, like “Vet bill”
@@ E-035 | ui6.js | AI: no | Mako: no B3, colon | Next: yes
- " was not added. Check the amount.
+ " wasn't added, check the amount
# UNSURE: the row starts at the closing quote mark so that it is one piece of the template. "Numbers only:" in front of it is left as it is
@@ E-036 | ui6.js | AI: no | Mako: no B3 B13 | Next: yes
- That sum does not work out to an amount. The old amount stays.
+ That sum doesn't work out to an amount so the old amount stays
```

## Home and More (ui7.js, ui8.js, the Home part of body.html)

```copy
@@ F-001 | ui8.js | AI: no | Mako: no C brackets | Next: yes
- (more than the gap, the extra stays in your bank)
+ and that's more than the gap so the extra stays in your bank
# reads "X is borrowed from your emergency fund and that's more than the gap so the extra stays in your bank." "emergency fund" is lowercase here and "Emergency fund" on the screens, left as it is, see the list below
@@ F-002 | ui8.js | AI: no | Mako: no B3 | Next: yes
- Your bank cannot cover
+ Your bank can't cover
@@ F-003 | ui8.js | AI: yes A13 colon | Mako: no C | Next: yes
- : it would end
+ , it would end
# reads "Your bank can't cover it, it would end X below zero."
@@ F-004 | ui8.js | AI: no | Mako: no B3 | Next: n/a
- What is on the card now
+ What's on the card now
# a field label, one character shorter
@@ F-005 | ui8.js | AI: no | Mako: no C one line note | Next: n/a
- Balance you entered on ${dayTxt(NW.bankAt)}.
+ Balance you entered on ${dayTxt(NW.bankAt)}
@@ F-006 | ui8.js | AI: no | Mako: no B13 | Next: yes
- Open your bank app and type the balance it shows. Add any cash you keep at home.
+ Open your bank app and type the balance it shows, plus any cash you keep at home
@@ F-007 | ui8.js | AI: no | Mako: no B2 B3 | Next: yes
- Spending is past what you planned.
+ You've spent more than you planned.
# a warning, so it keeps its full stop (Part D 4)
@@ F-008 | ui8.js | AI: no | Mako: no B2 | Next: yes
- Spend nothing more from Free to spend until you check your plan.
+ Don't spend any more from Free to spend until you check your plan.
@@ F-009 | ui8.js | AI: no | Mako: no B2 stiff | Next: yes
- This bank figure counts the planned Free to spend as spent.
+ This counts your planned Free to spend as already spent.
# UNSURE: clear wins, it has to stay plain that the bank number already has Free to spend taken out
@@ F-010 | ui8.js | AI: yes A13 colon | Mako: no C | Next: yes
- Where your money is: your bank now, then this month, then your burrows.
+ Where your money is. Your bank now, then this month, then your burrows.
# WORST: the line VOICE.md A13 quotes, first words under the Home heading. Two parts because it is a heading for what follows
@@ F-011 | ui8.js | AI: no | Mako: no B2 "places" as a verb | Next: yes
- Your plan places ${fmt(planOver)} more than your pay.
+ Your plan is ${fmt(planOver)} more than your pay.
# VOICE.md A9 wording. The Pay day line below it already says "Your plan is X bigger than your pay"
@@ F-012 | ui8.js | AI: no | Mako: no B2 | Next: yes
- Your plan places
+ Your plan is
# the same sentence on the Pay day screen. Only once in the file after F-011 is applied
@@ F-013 | ui8.js | AI: no | Mako: yes | Next: yes
- of free to spend is left out until you answer
+ of Free to spend is left out until you answer
# glossary capitals only (Part D 2)
@@ F-014 | ui8.js | AI: no | Mako: no C brackets | Next: yes
- (Home asks again next time).
+ and Home asks again next time.
@@ F-016 | ui8.js | AI: no | Mako: no C toast | Next: yes
- Type the balance your bank app shows, in numbers.
+ Type the balance your bank app shows, in numbers
@@ F-017 | ui8.js | AI: no | Mako: no C toast | Next: n/a
- in your bank today.
+ in your bank today
# toast "Saved: X in your bank today"
@@ F-018 | ui8.js | AI: no | Mako: no C toast | Next: n/a
- Card removed.
+ Card removed
@@ F-019 | ui8.js | AI: no | Mako: no B3, C toast | Next: yes
- Type what is on the card now, in numbers.
+ Type what's on the card now, in numbers
@@ F-020 | ui8.js | AI: no | Mako: no | Next: no
- The pay day is a day of the month, 1 to 31.
+ Type the day of the month you pay it, 1 to 31
# WORST: "pay day" here means the day the card is paid, and Pay day is the glossary word for the day your pay comes in. The new line uses the words of the field label, "Day of the month you pay it"
@@ F-021 | ui8.js | AI: no | Mako: no C toast | Next: n/a
- Card saved.
+ Card saved
@@ F-022 | ui8.js | AI: no | Mako: no B13 | Next: yes
- . Enter your pay to see yours. Each coin
+ , enter your pay to see yours. Each coin
# reads "Sample pay of X in Nov, enter your pay to see yours. Each coin goes where your plan sends it."
@@ F-023 | ui8.js | AI: no | Mako: no, two names for one thing | Next: yes
- of your pay has no goal yet and stays in the bank.
+ of your pay is not placed yet and stays in the bank.
# glossary: the bar above calls this money "Not placed yet". "is not" spelled out so the glossary words stay exact
@@ F-024 | ui8.js | AI: yes A2 | Mako: no B10 | Next: n/a
- Every coin has a home.
+ All of your pay has a place.
# UNSURE: the last line of the Pay day animation. The old one is a slogan, the new one says the same thing with the glossary word "place". Also read out as an aria-label so the full stop stays
@@ F-025 | body.html | AI: no | Mako: no B3 | Next: n/a
- How you are doing
+ How you're doing
# the caption under the Home tab, one character shorter
@@ F-026 | ui7.js | AI: no | Mako: no C "e.g." | Next: yes
- e.g. BPI card
+ BPI card
# a placeholder, it is grey so it reads as an example already
@@ F-027 | ui7.js | AI: no | Mako: no C brackets, B13 | Next: yes
- Cards often show it per month (like 3.5) or per year (like 42). Pick what your statement says. Use 0 for money owed to a person.
+ Cards often show it per month, like 3.5, or per year, like 42, so pick what your statement says. Use 0 for money you owe a person.
@@ F-028 | ui7.js | AI: no | Mako: no B3 B13 | Next: yes
- The least you must pay. It is part of Bills and basics.
+ The least you have to pay, and it's part of Bills and basics
@@ F-029 | ui7.js | AI: no | Mako: no B13 | Next: yes
- On top of the minimum. It goes straight off what you owe, so interest drops.
+ On top of the minimum - it goes straight off what you owe so the interest drops
@@ F-030 | ui7.js | AI: no | Mako: no B3 | Next: yes
- The payment does not cover the interest.
+ The payment doesn't cover the interest.
@@ F-031 | ui7.js | AI: no | Mako: no A5 fragment | Next: yes
- None. Add a card or loan to see when each is paid off and how much interest it costs.
+ Nothing here yet - add a card or loan to see when each is paid off and how much interest it costs
@@ F-032 | ui7.js | AI: no | Mako: no B14 clipped | Next: no
- Limit: ${MAX_DEBTS}.
+ You can have ${MAX_DEBTS} at most
# UNSURE: shows when the list is full. The old line doesn't say a limit of what
@@ F-033 | ui7.js | AI: no | Mako: no B13 | Next: yes
- Cards and loans with interest. Their payments are part of Bills and basics.
+ Cards and loans with interest, and their payments are part of Bills and basics
@@ F-034 | ui7.js | AI: no | Mako: no B3 | Next: yes
- One of them is not being paid off.
+ One of them isn't being paid off.
@@ F-035 | ui7.js | AI: no | Mako: no B3 | Next: yes
- is not being paid off. Pay at least
+ isn't being paid off. Pay at least
@@ F-037 | ui7.js | AI: no | Mako: no B3 | Next: no
- That cannot take extra money.
+ That one can't take extra money, pick another.
# an error under the form, now it says what to do
@@ F-038 | ui7.js | AI: yes A4 A5 | Mako: no B13 B3 | Next: yes
- A bonus, a 13th month pay, a refund, a good freelance month. It is added to ${esc(monthLabel(XM.ym))} only.
+ A bonus, a 13th month pay, a refund or a good freelance month - it's only added to ${esc(monthLabel(XM.ym))}
# WORST: four fragments in a row then a stiff line. All four examples kept, they are real cases
@@ F-039 | ui7.js | AI: no | Mako: no C toast, B13 | Next: n/a
- Added. The rest stays in the balance.
+ Added and the rest stays in the balance
@@ F-040 | ui7.js | AI: no | Mako: no B13 B3 | Next: yes
- The plan works in months. Say how often you are paid and how much each time.
+ The plan works in months, so say how often you're paid and how much each time
@@ F-041 | ui7.js | AI: no | Mako: no B3 | Next: n/a
- That is about ${fmt(m)} a month.
+ That's about ${fmt(m)} a month.
@@ F-042 | ui7.js | AI: no | Mako: no B3 B13 | Next: yes
- Some months you are paid an extra time. Plan with this number and treat that month as extra money.
+ Some months you're paid an extra time, so plan with this number and treat that month as extra money.
@@ F-043 | ui7.js | AI: yes A5 | Mako: no B3 B13 | Next: yes
- A gym fee, a weekly top-up. It is logged for you on its day.
+ Like a gym fee or a weekly top-up - it gets logged for you on its day
@@ F-044 | ui7.js | AI: no | Mako: no C toast | Next: n/a
- Repeating. Today\'s was logged.
+ Repeating, and today's was logged
@@ F-045 | ui7.js | AI: yes A2 | Mako: no B13 | Next: yes
- Money you invest and never spend. It only grows.
+ Money you invest and never spend, so it only grows
# WORST: "It only grows." is the neat closer
@@ F-046 | ui7.js | AI: no | Mako: no B3 | Next: yes
- What you log here comes out of the pile, and it does not touch your monthly bills.
+ What you log here comes out of the pile and doesn't touch your monthly bills.
@@ F-047 | ui7.js | AI: no | Mako: no C toast | Next: n/a
- Logged 1 repeating payment.
+ Logged 1 repeating payment
@@ F-048 | ui7.js | AI: no | Mako: no C toast | Next: n/a
- repeating payments.
+ repeating payments
```

# Notes from the listing, part by part

What was left alone and why, the strings that wait (LATE), and words for Mako. Nothing below is applied by the script.

### Setup: first screens, questions, statements (ui45.js, ui45c.js, ui45u.js)

#### LATE (no rows written, wait for the coordinator)

- ui45.js 177: Used this before on another phone? / Enter your recovery code
- ui45.js 177: aria-label "Recovery code" and the code field next to it
- ui45.js 182: Welcome back. (the toast after a recovery code loads the numbers)
- ui45.js 204: Data stays in this browser. Nobody else can see it.
- ui45.js 237: Keep a copy in the cloud
- ui45.js 237: Your numbers live in this browser. Cloud backup keeps an encrypted copy that only your recovery code can open. New phone, or browser cleared: enter the code and the numbers come back.
- ui45.js 238: Later: Settings, Cloud backup.
- ui45.js 366: Setup changed your plan. / Setup changed your plan. You can undo for {KEEP_DAYS} days.

#### Could not be a row (the same string twice in one file, both inside plain strings)

- ui45.js 205 and 208: `Longer setup is on: every bill and goal.` should become `The longer setup is on, with every bill and goal.` in both places (AI: no, Mako: no A13 B14, Next: yes). copy_apply needs a way to say "both" or the main session changes the two by hand.

#### Looked at and left alone, with the reason

- Button, chip and label words: the seven setup chat questions (ui45c.js 11 to 17, they are the chips a person taps), That is all, None of these, Skip names, Type numbers instead, Add a line, Prefer your own AI? Use it instead, Not playing? Open on Google Drive, Watch the video.
- Screen reader text that already passes (Part D 9): Sound on. Turn off, Music off. Turn on, Play the video, Playback speed, Name of this account, The AI's answer.
- Prompts sent to Claude: ui45u.js 8, 27, 35 and ui45c.js 113.
- Real lists (not A4): ui45u.js 146 and 147, the menu paths inside bank apps.
- Plain and exact: Numbers in. / Numbers exact. / {n} receipts kept. / This is yours to spend. / Full this month. / Paste the answer first. / Up to {n} PDFs at a time. 2 or 3 months of statements is plenty.

#### For Mako: words that sound off (nothing renamed)

- "check screen" (setup chat) and "review screen" (How to get your statements) look like two names for one screen.
- "play" as a category name in the setup chat (rent, food, transport, subscriptions or play). "play money" is retired, the category word is still there.
- "Pay entered." opens three messages. "Your pay is in." is closer to "Your bills are in." two lines below.

### Setup: bills, shares, burrows, the plan reveal (ui45s.js, ui45x.js)

#### Left alone on purpose

- ui45s.js title `Plan exceeds pay`: "exceeds" is on the stiff list, but it is a screen title and a test may read it. For Mako: "The plan is more than your pay" is longer, so it stays until he picks.
- The status lines under each goal (`No cost set.`, `Already full.`, `Not ready in time.` and the rest) pass. They keep their full stops because an amount line is joined in front of them.
- All the price lines in ui45x.js pass. Exact figures, nothing to change.
- `Tap Back to type your pay, or add it later under Plan, Month, Details, Money in.` passes.

#### LATE

Not rewritten here: bank now, cards, what you owe.

- ui45s.js 40: Take-home pay after tax, each month. Paid twice a month: add both. Other pay is a second job, a partner's share, benefits. Balance is bank accounts plus cash; rough is fine. (has a semicolon, a strong finding, and is the first setup screen)
- ui45s.js 41: Rough is fine. Overdrawn? Type a minus (placeholder of Balance now)
- ui45s.js 115: What goes on the card each month apart from the bills you already listed: shopping, eating out, online orders, rides. A rough number is fine.
- ui45s.js 115: Enter the statement total, then the part of it that is bills you already listed (rent, food, subscriptions). The rest is card spending.
- ui45s.js 115: A card is paid a month late. This month you pay last month's bill, so put that bill under One-time costs for this month (Plan, then Month). The amount above is what you expect to put on the card from now on.
- ui45s.js 115: No credit card: go back and untick it. Owe on a card or loan? Add it under Cards and loans on the Goals tab.
- ui45s.js 241: What you still owe in total. For a card or loan with interest, use Cards and loans on the Goals tab instead.
- ui45s.js 245: Unsure? Keep the emergency fund. Owe on a card or loan? Add it after setup, under Cards and loans on the Goals tab. It works out the interest and the payoff date.
- ui45s.js 274 and 287: Is this money in the same account as the balance you typed before? Then lower that balance by this amount, so the same money is not counted in two places. (in the file twice, the row will need the `</div><p class="cap">` in front of the first one to be exact)
- ui45s.js 281: Name the debt and how much you owe in total. The smallest payment you must make stays in Bills and basics. This burrow is for the extra you pay on top, so the debt shrinks faster.
- ui45x.js 352: The listed bills cover the whole statement: nothing extra to count.
- ui45x.js 352: Card spending: {amount} a month.
- ui45x.js 387: Monthly is the payment you make each month, not what you owe in total. Owe a total, like a card balance? Switch to Total, or add it later under Cards and loans on the Goals tab. Set the last payment month and the other value is filled in.

### Plan and Receipts (ui1.js, ui2.js, ui4.js)

#### LATE (no rows written)

- ui1.js 170: Money today (bank plus cash) / What you have right now. It is the start of the first month in the plan. Update when you check. Overdrawn? Type a minus, like -400. (bank now)
- ui2.js 54: Sample numbers for one salary. Replace them with yours. Data stays in this browser. (saving)
- ui2.js 55: Name, currency, balance, look, saved data. (Settings, saving)
- ui2.js 56: Amounts are samples for one salary. Start at zero or type over them. Saved in this browser only. Nobody else sees it, including whoever shared this page. (saving)
- ui2.js 68: These are your numbers. Change them any time. Saved in this browser only; nobody else sees them. (saving, has a semicolon)
- ui2.js 68: Everything starts at zero. Type over it. Saved in this browser only. (saving)

#### Glossary notes (nothing renamed)

- "emergency fund" is lowercase in ui1.js 46 and in six ui2.js notes, "Emergency fund" as the label.
- "ceiling" (ui2.js 177, ui1.js "Your ceiling") and "Free to spend cap" (ui1.js 172) are two names for one thing.
- "Plan, Goals" (ui2.js 183) and "Burrows under Plan" (ui1.js 93) for the same tab.

### Plan, Receipts and Help in body.html, messages in model.js, stmt.js, ui0.js

#### Passed, no row

body.html: the buttons, labels, tabs, aria-labels and placeholders in scope, and these sentences: "Attachments go to that AI company under its own privacy terms. This page never sees them." (privacy, exact and plain), "Log as you spend, or all at once later.", "Pick a schedule, then a calendar.", "A newer version is ready.", "Tap Copy message.", "Paste the reply below and tap Check.", "Copy this and send it to Mako with what you were doing."
model.js: the one line lists under each place and bill (Rent, food, utilities and every other bill. / Courses, books, coaching, skill building. / Charity, donations and gifts. / Streaming, apps, software, gym. / Commute, Grab, fuel, parking, tolls. / the Utilities, Food and Phone notes). Real lists. "Commute, Grab, fuel" must stay as it is, ui0.js swaps it.
stmt.js: the two "around the ..." lines, the budget question, "no transactions could be read.", "repeated rows were counted once.", "Monthly amounts are the average over ...", the summary line.
ui0.js: the country swap pairs (lines 158 to 161) must not change unless model.js changes with them. "feel calm about money" (line 28) is the hope the person picked in setup, not a comfort line, left alone.

Not done on purpose: stmt.js line 178 joins accounts with "; " in code (`.join('; ')`). It shows as a semicolon on the screen. It is two characters of code, not unique in the file, so no row. The main session could change it to ", " by hand.

#### LATE

- body.html 81: Sample numbers for one salary. Replace them with yours. Data stays in this browser.
- model.js 54: Optional. Card spending not already in a line above, like shopping or household items. Fun spending goes under Free to spend.
- model.js 96: Optional. Anything you put on a credit card and pay off each month that is not already in a line above. Fun spending belongs under Free to spend.
- ui0.js 228: Not saved. Save a copy in Settings. (and Saved, Saving…, Saved in this browser on the same line)
- ui0.js 266: Updated from another tab.

### Home and More (ui6.js)

#### Left alone on purpose

- Badge lines ("Log a receipt.", "A goal reaches 50%."), goal maths lines ("Needed by", "Full this month.", "to go."), the wizard's one line errors ("Enter an amount.", "Pick a goal type first."), the status lines built from amounts and month names (lines 128 to 146), "Plans X more than your pay", the safety minimum lines (144, 145), "Too soon to save anything by then. Pick a later date.", "Only two digits after the point". Plain and exact, they pass.
- Toasts that end in a full stop ("Goal added.", "Main goal set.", "Nothing to move.", "Logged. Streak: week 1."). VOICE.md says toasts have no full stop, but tests are likely to quote these whole. One sweep for the main session to decide, not 15 rows.
- "It only grows, and one day it pays you." on Investing. Close to a neat closer (A2), but it is the one idea of the card. For Mako to say his way.
- "free to spend" is lowercase inside several sentences (badge text, "From March's free to spend", "is free to spend") while the glossary word is "Free to spend". Not changed, tests may rely on it. Listed for the glossary check.
- "your emergency fund" lowercase in three status lines, "Emergency fund" elsewhere. Same.

#### LATE

None in ui6.js as sentences. Line 212 only checks backupDue() in code. The backup prompt itself lives in ui43.js.

### Home and More (ui7.js, ui8.js, the Home part of body.html)

#### LATE (no rows written)

- ui7.js 83: Tap again: removes {name} and its payments. You can undo for {KEEP_DAYS} days.
- ui7.js 84: {name} was removed.
- ui7.js 84: {name} removed. You can undo for {KEEP_DAYS} days.
- body.html 32: aria-label "Backup" (a label, passes anyway)

#### Words left alone that the parent should list for Mako or the main session

- ui7.js 119, the option "Keep it as a cushion". "cushion" is a retired word (qc-voice list). It is an option label so no row.
- ui7.js 123, the option "Spend it, free to spend". Glossary word in lowercase, option label, no row.
- ui8.js 9, "your emergency fund" in lowercase, "Emergency fund" on the screens.
- ui8.js 68, "your safety minimum" in one warning, "your minimum" in the other lines and "Your minimum balance" as the label. Three names for one thing.
- ui7.js uses "the balance" for what Home calls the bank ("stays in the balance", "Balance at the start"). Two names for one thing.
- ui8.js 66, "debt burrows" in the You owe line. Reads odd next to burrows being for saving. Left alone, it has just landed.
- ui7.js has the toast 'Finish the first steps first.' twice (lines 128 and one more), so no row. It should lose its full stop like the other toasts, by hand.
- ui7.js 142 and 199 both have 'Enter the amount.' and ui7.js has 'Added.' twice, so they can't be rows (not once in the file). They pass anyway.
