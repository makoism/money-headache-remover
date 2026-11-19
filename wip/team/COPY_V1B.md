# COPY_V1B: the copy table, second batch (the smaller files)

Voice lane (SIDE M3), 2026-11-19. Same row format as COPY_V1.md. It is a follow-up table: its old strings are the strings as COPY_V1.md left them, so it goes after COPY_V1.md on the command line.

**Listed against** `origin/wip-38.31` at 8369a5e.

**What is in:** the page tour (ui48.js), scanning receipts (ui49.js), reading files (ui41.js), the lines a person sees while statements are read (ui45v.js), the assistant's own messages and errors (ui46.js, ui4a.js), the chart (ui3.js), the setup steps (ui44.js), and one tag in model.js the first batch missed.

**What is not in:** Settings and everything about saving (the LATE list at the end, it waits for the coordinator's word like the LATE list in COPY_V1.md). Prompt text that is sent to Claude. Buttons, labels, tabs and glossary words.

**Checked by a fresh voice checker (2026-11-19):** one qc-voice agent that had not seen the lines read all 90 new lines with only VOICE.md and NORTH_STAR.md. 19 failed (2 for sounding like AI, 3 for not sounding like Mako, 18 for not saying what to do next). 3 rows were rewritten (G-003, G-011, G-061). The other 16 were kept, for these reasons:
- The code puts the fix right after the piece: G-022 and G-078 ("Remove it, then send again."), G-043 and G-044 ("Choose files instead."), G-083, G-084 and G-085 ("Open the web link, not a downloaded file, and the chat works."), G-073 (one line in a "Left out" list).
- The numbered steps under G-029 and G-030 name the buttons, and G-030 has to stay word for word the same as D-007.
- G-058 is a privacy line and only lost its semicolon. For the main session: the checker asks who keeps nothing, this page or Claude. If that can be said exactly, say it.
- G-027, G-054, G-074 and G-075 say what is wrong and the checker wants a fix named. I could not confirm a fix from the code (where "its Claude link" is, whether the rest of a long file can be added as a second file), so nothing was made up. For the main session to fill in.
- G-091 is the small tag under the place name Free to spend, next to tags like "Bills" and "Never spent", not a second name for the place.

## How to apply

```
cd wip/team
node tests/qc/copy_apply.js --check COPY_V1.md COPY_V1B.md   # a fresh checkout: says what would happen
node tests/qc/copy_apply.js COPY_V1.md COPY_V1B.md           # applies both, in this order
node tests/qc/copy_apply.js COPY_V1B.md                      # COPY_V1.md is already in: only this one
```

Rows are applied in the order they stand. Three pairs depend on it: G-041 before G-042, G-071 before G-072, G-073 before G-074.

## Three things the code reads out of these messages (do not change these words by hand)

- ui45v.js and ui46.js look for the words `cut short` in a message from ui41.js. "The answer was cut short." has no row.
- ui46.js looks for `PDF` or `pages` in the two "too much" messages from ui41.js. G-023 keeps both words.
- ui45v.js cuts the file name and anything up to a colon off the front of a message from ui41.js. No row adds a colon to those messages.

## The rows

```copy
@@ G-001 | ui48.js | AI: no | Mako: no A13 colon | Next: yes
- Read this first. On plan: this month fits your pay and your balance stays above your minimum.
+ Read this first. On plan means this month fits your pay and your balance stays above your minimum.
@@ G-002 | ui48.js | AI: no | Mako: no B14 | Next: yes
- Your reason, in your words, with what this month adds and the months left. Tap Forecast for the graph.
+ Your reason in your own words, with what this month adds and how many months are left. Tap Forecast for the graph.
@@ G-003 | ui48.js | AI: yes A1 | Mako: no B3 A13, retired word necessities | Next: yes
- The money you use this month. The big number is free to spend on fun, no guilt. Below it: are your necessities covered, and what is left for learning and giving. What is left at month end can go toward a goal.
+ The money you use this month. The big number is Free to spend and it's yours to spend on whatever you want. Under it you can see if your Bills and basics are covered and what's left for Education and Giving, and whatever's left at the end of the month can go into a goal.
# WORST: "no guilt" in the tour, the line Mako called slop. UNSURE: "learning and giving" became the two place names, Education and Giving. If the card shows something else under the big number, say what
@@ G-004 | ui48.js | AI: no | Mako: no B14 | Next: yes
- Enter an amount, pick a category, tap Log. Do it as you spend or weekly.
+ Enter an amount, pick a category and tap Log. Do it as you spend or once a week.
@@ G-005 | ui48.js | AI: no | Mako: no B13 | Next: yes
- Tap a burrow to open it. Edit it or make it your main burrow.
+ Tap a burrow to open it, then you can edit it or make it your main burrow.
@@ G-006 | ui48.js | AI: yes A2 | Mako: no B13 | Next: yes
- Money you invest and never spend. It only grows. Goals and debt live in the burrows at the top.
+ Money you invest and don't spend. Goals and debt live in the burrows at the top.
# "It only grows." is the neat closer, and it reads as a promise that investments never go down. Same as F-045
@@ G-007 | ui48.js | AI: no | Mako: no A5 | Next: yes
- Any money question, any time. It knows your plan and can make changes you approve.
+ Ask any money question here. It knows your plan and can make changes once you approve them.
@@ G-008 | ui48.js | AI: no | Mako: no B2 review, B13 | Next: yes
- Claude reads receipt photos and files each one. You review before anything is added.
+ Claude reads your receipt photos and sorts each one into a category, and nothing gets added until you've checked it.
# clear wins: same words as D-004 for the same thing
@@ G-009 | ui48.js | AI: no | Mako: no A5 A8 | Next: yes
- Date, amount, category. Unsure of the category? Pick Other and change it later.
+ Type the date, amount and category. If you're not sure of the category pick Other and change it later.
@@ G-010 | ui48.js | AI: no | Mako: no B14 clipped | Next: n/a
- Per category: planned, spent, left.
+ What you planned, what you spent and what's left in each category
@@ G-011 | ui48.js | AI: no | Mako: no B14, a symbol for a word | Next: yes
- Bar = how full by plan. Edit goal changes name, amount or date.
+ The bar shows how full it should be by now if you stick to the plan. Edit goal changes the name, amount or date.
# UNSURE: I read "how full by plan" as how full the plan says it should be, not what is really saved. If the bar is the real money this row is wrong
@@ G-012 | ui48.js | AI: no | Mako: no B14 clipped | Next: yes
- Three steps: type, goal amount, date.
+ Three steps - you pick the type, the goal amount and the date
@@ G-013 | ui48.js | AI: no | Mako: no A5 | Next: yes
- Every goal, month by month. Hover or tap to read a month.
+ This shows every goal month by month. Hover over a month or tap it to read it.
@@ G-014 | ui48.js | AI: yes A1 | Mako: no A13 | Next: n/a
- The big number is this month’s free to spend: yours to spend, no guilt.
+ The big number is this month’s Free to spend and it’s yours to spend on whatever you want
# WORST: "no guilt" again
@@ G-015 | ui48.js | AI: no | Mako: no A5 | Next: yes
- Six places. Hover or tap a colour for the amount.
+ Your pay split into six places. Hover over a colour or tap it to see the amount.
@@ G-016 | ui48.js | AI: no | Mako: no B5 dropped subject reads like a form | Next: yes
- Tap a row to open it and enter a new amount. Applies to this month only, until you choose Keep for later months.
+ Tap a row to open it and enter a new amount. It only changes this month unless you choose Keep for later months.
@@ G-017 | ui48.js | AI: no | Mako: no B14, a symbol for a word | Next: yes
- Tap a month to open it. Short = balance falls under the minimum.
+ Tap a month to open it. Short means your balance falls under the minimum that month.
@@ G-018 | ui3.js | AI: no | Mako: no B13 | Next: yes
- No burrows to chart. Give a burrow a goal amount and it plots here.
+ No burrows to chart yet - give a burrow a goal amount and it shows up here
@@ G-019 | ui3.js | AI: no | Mako: no B2 available | Next: n/a
- . A table view is available.
+ . There's a table view too.
# aria-label, keeps its full stop (Part D 9)
@@ G-020 | ui44.js | AI: no | Mako: no B2 | Next: n/a
- Setup complete. All four steps done.
+ Setup is done, that's all four steps
# a toast. UNSURE: a test may quote it
@@ G-021 | ui41.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Export fewer months, or take screenshots of the pages.
+  is too big. Export fewer months or take screenshots of the pages.
# "too big" like the amount error in COPY_V1 (E-032)
@@ G-022 | ui41.js | AI: no | Mako: no B3 | Next: n/a
-  is not a PDF.
+  isn't a PDF.
@@ G-023 | ui41.js | AI: no | Mako: no A13 colon | Next: yes
- PDFs is too much for one read. Pick fewer months: 2 or 3 is plenty.
+ PDFs is too much for one read. Pick fewer months, 2 or 3 is plenty.
@@ G-024 | ui49.js | AI: no | Mako: no B2 review | Next: yes
- Send receipts to an AI app, then paste its reply here. Items are sorted into your categories and listed for review before anything is added.
+ Send your receipts to an AI app and paste its reply here. They get sorted into your categories and listed, and nothing gets added until you've checked it.
@@ G-025 | ui49.js | AI: no | Mako: no B2 review, B13 | Next: yes
- Claude reads and sorts them into your categories. You review before anything is added.
+ Claude reads them and sorts them into your categories, and nothing gets added until you've checked it.
@@ G-026 | ui49.js | AI: no | Mako: no B2 B3 | Next: yes
- Reading photos is not available here. Use an AI app below.
+ Photos can't be read here. Use an AI app below.
# the rewrite VOICE.md B3 gives for this line
@@ G-027 | ui49.js | AI: no | Mako: no B14 | Next: yes
- Reading photos needs a signed-in Claude and your permission. Open this page from its Claude link, or use an AI app below.
+ To read photos here you have to be signed in to Claude and say yes when it asks. Sign in and open this page again, or use your own AI with the steps below.
@@ G-028 | ui49.js | AI: no | Mako: no B3 | Next: yes
- Claude could not be reached. Try again, or use an AI app below.
+ Claude couldn't be reached. Try again or use an AI app below.
@@ G-029 | ui49.js | AI: no | Mako: no B3 B2 review | Next: yes
- Copy one message, paste it into ChatGPT, Gemini or the Claude app with the photos, and paste its reply back here. It is checked and listed for review the same way.
+ Copy one message, paste it into ChatGPT, Gemini or the Claude app with the photos and paste its reply back here. The reply gets checked and listed for you to go through the same way.
# the numbered steps under it name the buttons (Copy message, Check)
@@ G-030 | ui49.js | AI: no | Mako: no B3 B13 A13 | Next: yes
- An alternative to the buttons above, with the same result. If you would rather not send receipts through this page, or you like ChatGPT, Gemini or the Claude app better: copy one message, paste it into that AI with the photos, and paste its reply back here. It is checked and listed for review the same way.
+ This does the same thing as the buttons above. If you don't want to send receipts through this page, or you like ChatGPT, Gemini or the Claude app better, you copy one message, paste it into that AI with the photos and paste its reply back here. The reply gets checked and listed for you to go through the same way.
# word for word the same as D-007, which is this text in body.html
@@ G-031 | ui49.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Try one month at a time.
+  is too big. Try one month at a time.
@@ G-032 | ui49.js | AI: no | Mako: no B2 | Next: n/a
- Maximum ${ASK_MAX_TEXT} CSV or Excel files at a time.
+ Up to ${ASK_MAX_TEXT} CSV or Excel files at a time.
# the PDF line next to it already says "Up to"
@@ G-033 | ui49.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Export fewer months, or take screenshots of the pages.
+  is too big. Export fewer months or take screenshots of the pages.
@@ G-034 | ui49.js | AI: no | Mako: no B2 review | Next: yes
- PDFs at a time. One month per read keeps the review short.
+ PDFs at a time. One month at a time keeps the list short.
@@ G-035 | ui49.js | AI: no | Mako: no B3 | Next: yes
- Photos cannot be sent from here. Use an AI app below, or a CSV from your bank.
+ Photos can't be sent from here. Use an AI app below or a CSV from your bank.
@@ G-036 | ui49.js | AI: no | Mako: no B2 | Next: yes
- Maximum ${maxImg} photos at a time. Read these first, then add the rest.
+ Up to ${maxImg} photos at a time. Read these first, then add the rest.
@@ G-037 | ui49.js | AI: no | Mako: no B14 clipped | Next: yes
- : photo format not supported. Use a screenshot instead.
+  is a kind of photo that can't be read here. Use a screenshot instead.
@@ G-038 | ui49.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Use a screenshot instead of the original photo.
+  is too big. Use a screenshot instead of the original photo.
@@ G-039 | ui49.js | AI: no | Mako: no B3 | Next: yes
- They are in the list below.
+ They're in the list below.
@@ G-040 | ui49.js | AI: no | Mako: no A5 | Next: n/a
- Reading receipts. A few seconds.
+ Reading your receipts, it takes a few seconds
@@ G-041 | ui49.js | AI: no | Mako: no B14 | Next: yes
- Copy blocked by the browser. Select the text and copy it by hand.
+ The browser blocked the copy. Select the text and copy it by hand.
@@ G-042 | ui49.js | AI: no | Mako: no A13 colon, B14 | Next: yes
- No receipts found. Paste the whole reply: one line per receipt, as date, amount, category, note.
+ No receipts found. Paste the whole reply, it has one line per receipt with the date, amount, category and note.
@@ G-043 | ui49.js | AI: no | Mako: no B3 | Next: yes
- The camera was not allowed.
+ The camera wasn't allowed.
@@ G-044 | ui49.js | AI: no | Mako: no B3 | Next: yes
- The camera could not be started.
+ The camera couldn't be started.
@@ G-045 | ui49.js | AI: no | Mako: no B14 | Next: yes
- added. Take another, or Done.
+ added. Take another or tap Done.
@@ G-046 | ui45v.js | AI: yes A13 semicolon | Mako: no B14 | Next: yes
- too long for one read; split it, or fewer pages
+ too long for one read, split it or use fewer pages
# shows after the file's name
@@ G-047 | ui45v.js | AI: yes A13 semicolon | Mako: no | Next: yes
- too many requests right now; try again in a minute
+ too many requests right now, try again in a minute
@@ G-048 | ui45v.js | AI: no | Mako: no B3 | Next: yes
- Claude cannot be reached from this copy of the page. Use any AI below, or type the numbers in.
+ Claude can't be reached from this copy of the page. Use any AI below or type the numbers in.
@@ G-049 | ui45v.js | AI: no | Mako: no C comma | Next: yes
- Use any AI below, or type the numbers in.
+ Use any AI below or type the numbers in.
# only once in the file after G-048 is applied
@@ G-050 | ui45v.js | AI: yes A13 semicolon | Mako: no | Next: yes
- Fix any that are wrong; the numbers follow.
+ Fix any that are wrong and the numbers follow.
# the line you tap to open the list, so it stays the same length
@@ G-051 | ui45v.js | AI: yes A13 semicolon | Mako: no | Next: n/a
- rows in total; the newest 12 are shown.
+ rows in total and the newest 12 are shown.
@@ G-052 | ui46.js | AI: yes A13 semicolon | Mako: no B2 propose | Next: yes
- Ask anything about your money or this page. I can see your plan and can propose changes; nothing changes until you tap Apply.
+ Ask anything about your money or this page. I can see your plan and suggest changes, and nothing changes until you tap Apply.
# the first thing the assistant says
@@ G-053 | ui46.js | AI: no | Mako: no B3 | Next: yes
- That code word was not accepted. Ask the person who shared this page for the current one.
+ That code word didn't work. Ask the person who shared this page for the current one.
@@ G-054 | ui46.js | AI: no | Mako: no B2 unavailable | Next: yes
- Ask Claude needs permission to use your Claude account and is unavailable here. The tour is still under Help.
+ Ask Claude needs permission to use your Claude account and it doesn't have that here. Sign in to Claude and tap Try again. The tour is still under Help.
@@ G-055 | ui46.js | AI: no | Mako: no B2 B14 | Next: yes
- No answer produced. Rephrase the question.
+ No answer came back. Ask it another way.
@@ G-056 | ui46.js | AI: no | Mako: no B14 clipped | Next: yes
- Conversation too long. Use New chat to start fresh.
+ This conversation got too long. Tap New chat to start fresh.
@@ G-057 | ui46.js | AI: no | Mako: no B13 B2 | Next: yes
- Request failed. Your question is back in the box. Try again.
+ That didn't go through. Your question is back in the box so try again.
@@ G-058 | ui46.js | AI: yes A13 semicolon | Mako: no | Next: yes
- Runs on your Claude account; you approve access first. Your numbers go with each question while the box is ticked. Nothing is kept.
+ Runs on your Claude account and you approve access first. Your numbers go with each question while the box is ticked. This page doesn't keep the chat.
# clear wins (Part D 10): a privacy line, only the semicolon is gone
@@ G-058b | ui46.js | AI: no | Mako: no | Next: n/a
- Answered by Claude through this page. Your numbers go with each question while the box is ticked. Nothing is kept.
+ Answered by Claude through this page. Your numbers go with each question while the box is ticked. This page doesn't keep the chat.
# MAIN 4: 'Nothing is kept' could not be promised for Claude's side, the page itself keeps no chat (checked: the ask log is never saved)
@@ G-059 | ui46.js | AI: no | Mako: no B14 clipped | Next: yes
- : old Excel format. Open it and save as CSV or .xlsx.
+  is in the old Excel format. Open it and save it as CSV or .xlsx.
@@ G-060 | ui46.js | AI: no | Mako: no B3 | Next: yes
- : this browser cannot open Excel files here. Save it as CSV.
+  can't be opened because this browser can't read Excel files here. Save it as CSV.
@@ G-061 | ui46.js | AI: no | Mako: no B14 | Next: yes
- , where PDFs, Excel files and screenshots are read for everyone, no sign-in.
+ , where anyone can get PDFs, Excel files and screenshots read without signing in.
# the fresh check: "read for everyone" could sound like your files are open to everyone
@@ G-062 | ui46.js | AI: no | Mako: no B3 | Next: n/a
- This PDF cannot
+ This PDF can't
@@ G-064 | ui46.js | AI: no | Mako: no B2 optional, C e.g. | Next: yes
- Optional note, e.g. "October card statement"
+ A note if you want, like "October card statement"
# a placeholder. UNSURE: 5 characters longer, check it isn't cut off on a phone
@@ G-065 | ui46.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Try one month at a time.
+  is too big. Try one month at a time.
@@ G-066 | ui46.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Export fewer months, or take screenshots of the pages.
+  is too big. Export fewer months or take screenshots of the pages.
@@ G-067 | ui46.js | AI: no | Mako: no B2 | Next: yes
-  is too large. Use a screenshot instead of the original photo.
+  is too big. Use a screenshot instead of the original photo.
@@ G-068 | ui46.js | AI: no | Mako: no B2 | Next: n/a
- Maximum ${ASK_MAX_TEXT} CSV or Excel files at a time.
+ Up to ${ASK_MAX_TEXT} CSV or Excel files at a time.
@@ G-069 | ui46.js | AI: no | Mako: no B2 | Next: yes
- Maximum ${maxImg} photos at a time. Add the rest after these.
+ Up to ${maxImg} photos at a time. Add the rest after these.
@@ G-070 | ui46.js | AI: no | Mako: no B3 | Next: yes
-  could not be read as a spreadsheet. Save it as CSV and try again.
+  couldn't be read as a spreadsheet. Save it as CSV and try again.
@@ G-071 | ui46.js | AI: no | Mako: no B3 | Next: n/a
- They are in the Receipts tab.
+ They're in the Receipts tab.
@@ G-072 | ui46.js | AI: no | Mako: no B3 | Next: n/a
- They are
+ They're
# only once in the file after G-071 is applied. It reads "They're kept in your saved copy"
@@ G-073 | ui46.js | AI: no | Mako: no B2 | Next: n/a
-  unreadable.
+  couldn't be read.
@@ G-074 | ui46.js | AI: no | Mako: no A13 colon, B14 | Next: n/a
- Long file: only the first part was read.
+ It's a long file so only the first part was read. Send it one month at a time to get the rest.
@@ G-075 | ui46.js | AI: no | Mako: no B2 unavailable | Next: no
- Reading files needs permission to use your Claude account and is unavailable here.
+ Reading files needs permission to use your Claude account and it doesn't have that here. Sign in to Claude and say yes when it asks, then send the files again.
@@ G-076 | ui46.js | AI: no | Mako: no B3 | Next: yes
- Photos cannot be sent from here. A CSV from your bank still works.
+ Photos can't be sent from here. A CSV from your bank still works.
@@ G-077 | ui46.js | AI: no | Mako: no B3 | Next: yes
- A photo could not be read. Try a clearer one, or a screenshot.
+ One photo couldn't be read. Try a clearer one or a screenshot.
@@ G-078 | ui46.js | AI: no | Mako: no B3 | Next: yes
- A file could not be read.
+ A file couldn't be read.
@@ G-079 | ui46.js | AI: no | Mako: no B14 clipped | Next: yes
- Files too long. Add fewer files, fewer pages, or one month at a time.
+ That's too much to read in one go. Add fewer files, fewer pages or one month at a time.
@@ G-080 | ui46.js | AI: no | Mako: no A13 colon, C brackets | Next: yes
- The answer was cut short: too much for one read. Fewer files at a time (2 or 3 months is plenty).
+ The answer was cut short because it was too much for one read. Send fewer files at a time, 2 or 3 months is plenty.
@@ G-081 | ui46.js | AI: no | Mako: no B2 | Next: yes
- No entries could be made from those files. Try a clearer photo, or one file at a time.
+ Nothing could be read from those files. Try a clearer photo or one file at a time.
@@ G-082 | ui46.js | AI: no | Mako: no B13 B2 | Next: yes
- Request failed. Your files are still attached. Try again.
+ That didn't go through. Your files are still attached so try again.
@@ G-083 | ui46.js | AI: no | Mako: no B3 | Next: yes
- This copy of the page cannot reach Claude. Downloaded files behave this way.
+ This copy of the page can't reach Claude. That happens with a downloaded file.
@@ G-084 | ui46.js | AI: no | Mako: no B14 clipped | Next: yes
- Permission not granted, or not signed in to Claude in this browser.
+ Claude doesn't have permission here, or you're not signed in to Claude in this browser.
@@ G-085 | ui46.js | AI: no | Mako: no B3 | Next: yes
- Claude could not be reached from this view.
+ Claude couldn't be reached from this view.
@@ G-086 | ui4a.js | AI: no | Mako: no C brackets | Next: n/a
- Left out (not understood): ${chk.dropped.join(', ')}.
+ Left out because I didn't understand them: ${chk.dropped.join(', ')}.
# a colon before a real list is fine
@@ G-087 | ui4a.js | AI: no | Mako: no B3 | Next: yes
- Here is a change you can apply.
+ Here's a change you can apply.
@@ G-088 | ui4a.js | AI: no | Mako: no C brackets, A5 | Next: yes
- (Cut short. Ask for less at a time.)
+ That got cut short, ask for less at a time.
@@ G-089 | ui4a.js | AI: no | Mako: no B3 B2 | Next: yes
- The proposed change could not be read. Ask again in other words.
+ I couldn't read that change. Ask again in other words.
# the assistant says "I" in its first line too
@@ G-090 | ui4a.js | AI: no | Mako: no B2 proposal | Next: yes
- Nothing in that proposal matched the page. Ask again in other words.
+ Nothing in that change matched the page. Ask again in other words.
@@ G-091 | model.js | AI: yes A1 | Mako: no | Next: n/a
- Fun, no guilt
+ Spend on fun
# WORST: "no guilt" in the small tag under Free to spend, the last one in the app. One character shorter than the old tag
```

## Hand edits the script cannot do (the same string twice in one file)

- ui46.js line 142: `PDFs cannot` becomes `PDFs can't`, next to G-062 (the words are in the file three times, the other two are in text for Claude).
- ui46.js lines 79 and 319: `The AI is not switched on for this page yet.` becomes `The AI isn't switched on for this page yet.` in both places.
- ui46.js lines 82 and 326: `Too many requests, or your Claude usage limit is reached. Try again later.` passes, left alone.
- ui46.js line 330 and 357 both end in `Try a clearer photo, or one file at a time.` G-081 changes the first. The second (after "Nothing new found to add.") should lose its comma the same way.
- ui6.js line 570 has the toast `Limit: ${MAX_GOALS} burrows.` which should read like C-017 in COPY_V1.md: `You can have ${MAX_GOALS} burrows at most, so remove one to add another`.

## Looked at and left alone, with the reason

- ui47.js (the date picker), world.js (the orb), ui4b.js, the step names in ui44.js: labels and screen reader names only, they pass.
- ui48.js `Pick a schedule, then add a repeating calendar event.` passes. The toast `Nothing to show on this tab yet.` only needs its full stop dropped, it goes with the toast sweep the main session decides on (see COPY_V1.md, Home and More).
- ui41.js: `Only JPEG, PNG, WebP or GIF.`, the password line, `No connection.`, `The connection dropped.`, `No text came back.`, `Stopped.` pass. `The answer was cut short.` must stay (code reads it).
- ui49.js: the two "Take a photo, or choose pictures..." lines, `Copied. Paste it into your AI app.`, `Paste the reply first.`, `Nothing new found to add.`, the camera hint, `No camera was found on this computer.` pass. `Prefer your own AI? Use it instead` is the line you tap.
- ui45v.js: `Nothing could be read. The line above says why.`, the "No transactions were found" line, `Sorting 12 merchants into categories.`, the keep as receipts tick box, `Tap a name to see its rows as printed.` pass.
- ui46.js: the six starter questions are chips you tap. `Signed out of Claude. Sign in again, then ask again.`, `Files go to Claude when you press Send. This page keeps none of them.` and its twin (privacy, exact and plain), the "only photos, screenshots" line, `Claude answered in words instead of numbers`, `Undone. Page restored.`, `Copied. Send it to Mako.` pass.
- Prompt text for Claude and the problem report (not read by the person as copy): ui46.js lines 1 to 60 and 180 to 210, ui4a.js lines 36 to 135 and 170 to 182, ui45v.js lines 8 to 85 and 139 to 140. The lint's strong findings there (semicolons in ui45v.js 18 and 80, the hyphen list in ui46.js 54) are in voice_known.txt with this reason.

## LATE (no rows written, they wait with the LATE list in COPY_V1.md)

- ui48.js lines 34 to 37, the Settings part of the tour: Balance, Look, Six places, Saved data ("Numbers live in this browser only. Save a file copy regularly. Restore it here or on another device.").
- ui41.js line 197: The app has its own address / Works without a Claude account: reading statements, receipts and the assistant are on for everyone there. / Open it and move my numbers. And line 217, the toast "Your numbers are here."
- ui46.js lines 377 and 378: At the app's own address it works for everyone. / Open it and move my numbers.
- ui46.js line 290: "kept in your saved copy, but no month on screen shows them yet" (G-072 only makes "They are" into "They're").
- ui5.js line 48 has the same toast as E-036 in COPY_V1.md ("That sum does not work out to an amount. The old amount stays."). ui5.js is Settings, so its row comes with the Settings batch.

## For Mako: words that sound off (nothing renamed)

- "Manual entry" (a tour heading) reads like a form. "Type it in" is how he'd say it.
- "Plan vs spend" has "vs" in it (VOICE.md B14). "Plan and spent" or "Planned and spent".
- "code word" and "recovery code" are two different things with close names.
- "the app's own address" is said three ways: "the app's own address", "the web link", "its Claude link".
- "merchant" in "Sorting 12 merchants into categories". The setup chat says "shop".
