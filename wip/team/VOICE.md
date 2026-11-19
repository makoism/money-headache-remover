# The Burrow voice guide

Mako, 2026-11-19: "I want it to not sound like AI, and I also want it to sound like me. And talk like me and skip things like me. I want it to use less like punctuation."

This file is the whole brief for the voice checker (`.claude/agents/qc-voice.md`) and for anyone who writes a word a person will read in the app. Every line of copy gets two separate answers.

1. Does it sound like AI? Part A.
2. Does it sound like Mako? Part B.

Part C is punctuation and layout. Part D is where style has to stop because the money has to be exact.

The voice in one line: Mako telling a friend how his money app works. He's sure of it, he says it once, he uses small words, and he doesn't comfort you.

What it rests on: his own typed and dictated messages to the team (counts in LANE_voice.md) and a web search on what editors and researchers have found about AI writing (sources at the end, with how far each can be trusted). Dictation adds "um" and "I don't know" and run-ons. Those are speech, they stay out. The app sounds like him talking, cleaned up, never like a transcript.

---

## Part A. Never sound like AI

Each tell has a number so the checker can name it. "Before" lines marked (app) or (help) are real ones from the build or from HELP_TEXTS.md.

How solid each one is: **measured** means a study counted it, **editors** means people who clean up AI text for a living agree on it (Wikipedia's "Signs of AI writing" page is the main list), **common** means writers keep reporting it but nobody has counted. No single tell proves anything. A line fails when it reads as written by nobody.

### A1. Comfort nobody asked for (editors)
Reassuring the reader about feelings they didn't mention. This is the one Mako called slop.

Words that give it away: "and that is fine", "that's okay", "no guilt", "no shame", "you are not being tested", "it is not a verdict on you", "you do not owe", "there is no wrong", "be kind", "calm", "gentle".

- Before (help): Everyone skips a week, or a month. Busy, tired, a rough patch. It does not undo anything, and nothing is lost. You do not owe the app an apology and there is nothing to catch up on.
- After: If you skip a week or even a month nothing breaks. You don't have to go back and log what you missed.

- Before (app): Free to spend {amount} a month, to spend without guilt.
- After: Free to spend {amount} a month. Spend it on whatever you want.

Say the fact that makes the worry pointless. Don't name the worry.

### A2. The neat closing line (editors)
A short last sentence that sums up or lands a point. If the paragraph is fine without it, cut it.

- Before (help): Type what is in your bank now, and carry on from here. The gap is just a gap.
- After: Type what's in your bank right now and carry on from there.

- Before (help): Money with a name is much harder to spend by accident. That is the whole trick.
- After: Money with a name on it is harder to spend by accident.

Watch for last sentences that start with "That is", "That's", "It is just", "Nothing is", "Same money", "Done".

### A3. "It's not X, it's Y" (editors, the most reported shape)
Knocking down something nobody said so the real point sounds deeper.

- Before (help): It is not about having more. It is about knowing.
- After: You decide what every peso is for before you spend any of it.

- Before (help): It is not lost, it is not wrong, it is just undecided.
- After: This is pay you haven't put anywhere yet.

A plain correction of a real mix-up is allowed. "This is your bank after the cards are paid, not today's balance" is fine because people do mix those up.

### A4. Groups of three (editors)
Three examples, three adjectives, three short sentences. One is enough. Two if they're really different.

- Before (help): Life sends surprises: a broken phone, a sick relative, a quiet month at work.
- After: Something always comes up. A phone breaks, work goes quiet for a month.

A real list is not a tell. "Pay, bills and burrows" is three things the app really asks for. Keep it.

### A5. Staged fragments (common)
Little verbless sentences lined up for drama.

- Before (help): Busy, tired, a rough patch.
- Before (help): Sunday, 9 pm. Three receipts, one bank check, a cup of tea. Done until next week.
- After: Sunday night, log the three things you remember and check the bank number.

A label or a one line note with no verb is fine ("4 steps left"). What fails is a run of them built to sound good.

### A6. A lesson on every paragraph (editors)
Each paragraph ends by telling you what to feel or learn. The reader came for what the number means and what to tap.

- Before (help): Once it is visible, you can make a plan for it, and plans are calming.
- After: Once it's on the screen you can plan around it.

### A7. Sweeping claims about people (editors)
"Most people", "people who feel calm about money", "almost everyone". Nobody checked. Mako talks about himself or about you.

- Before (help): People who feel calm about money are not spending less. They know exactly which pesos are free, so they can enjoy them without guilt.
- After: Bills are covered and your saving is already put away, so whatever is in here is yours to spend.

### A8. Question then answer, and the warm-up (common)
"The result?" "Here's the thing." "Let me explain." A sentence that only announces the next sentence.

- Before: So what does this number mean? It is what you can spend.
- After: This is what you can spend.

### A9. Words nobody says out loud (measured for the first group)
Counted in studies of AI text: delve, tapestry, testament, pivotal, crucial, underscore, showcase, foster, landscape, intricate, meticulous, robust, seamless, leverage, navigate, journey, elevate, unlock, empower, ensure, enhance, comprehensive, vibrant.

Stiff words the app uses today that Mako wouldn't say: exceeds, invented, optional, regularly, available, review, stored, ensure, in order to, such as, however, therefore, simply, plainly.

- Before (app): Plan exceeds pay by {amount}.
- After: The plan is {amount} more than your pay.

- Before (app): Invented figures for now.
- After: These numbers are made up.

Full list in `tests/qc/voice_lint.js`.

### A10. The same shape every time (common)
Every sentence the same length. Every entry the same three boxes with the same rhythm. Every paragraph two sentences and a closer. Real writing is uneven. One entry is one line, the next is five.

- Before (help): 28 entries, each with Why it matters, What to do, Example, each about the same length.
- After: say what it is and what to do. Add an example only where the numbers make it click. Some entries are two lines.

### A11. Explaining twice (editors)
Saying the thing, then saying it again in other words, then summing up. Say it once.

- Before (help): It is only a picture to look at, not your money, and nothing here is a judgment.
- After: None of this is your money yet.

### A12. Hedging (editors)
"May", "might", "can sometimes", "tends to", "it is worth", "usually" stacked on a plain fact. If it's true say it. If the app really doesn't know, say that plainly once.

- Before (help): Money spent on getting better at something tends to come back to you.
- After: cut it, or let Mako say it his way in the video.

"This may be spending you have not logged yet" stays. The app really doesn't know there.

### A13. Em dashes, colons that reveal, semicolons (measured for em dashes, falling in newer models)
The em dash is banned here anyway (Mako's standing rule). A colon used as a drum roll is the same move.

- Before (app): Where your money is: this month first, your burrows after it.
- After: Where your money is. This month first, then your burrows.

A colon before a number or a real list is fine ("Free to spend: $204 left").

### A14. Fake cheer and chat leftovers (editors)
Exclamation marks, "Great", "Oops", "Let's", "We're excited", "I hope this helps", emoji as bullets. Mako used no exclamation mark in the whole sample.

- Before: You're all set! Let's get started.
- After: Done. Next is your pay.

### Don't over-correct
Stripping every "and", every list and every contraction makes flat robot text, which is its own tell. A plain correct line that a script would flag can still pass. The checker judges the line, the script only points.

---

## Part B. Sound like Mako

These come from how he actually writes and talks. Short harmless phrases of his are quoted. Nothing else from his messages is in this file.

### B1. Say how it works, then stop
He states the fact and moves on. His own closer when he explains something is "that's how it works". No build up before, no lesson after.

- Before (app): Statements only show what went through an account. After the upload, the check screen lists every bill and has Add a line: put the cash ones there.
- After: Statements only show what went through the account. Cash bills you add yourself on the next screen with Add a line.

### B2. Small words
His words: just, actually, stuff, thing, like, a bit, a lot, cool, cute, tricky, silly, weird, basically, obviously, right now, for now, sort out, figure out, set up, put in, go into, make sure.

Not his: ensure, review, regularly, available, exceeds, optional, invented, additional, approximately, prior, toward the things you want.

- Before (app): Back up regularly, and before clearing or resetting.
- After: Save a backup every now and then, and always before you clear or reset anything.

"Actually" and "just" are his, but one per screen. More than that and it turns into a tic.

### B3. Contractions, always
He never writes "do not" or "it is". It's don't, it's, that's, you're, what's, can't, won't, hasn't.

- Before (app): Reading photos is not available here.
- After: Photos can't be read here.

One exception in Part D: a warning about losing data may spell it out ("This cannot be undone").

### B4. "You" doing a real thing
He explains with a scene, not a rule. "When you want to log your receipts you want to just go to a website and log it." Put the person in it, doing something, with a number.

- Before (help): When you pay with a card, the money does not leave the bank that day.
- After: When you pay by card the money stays in your bank until the card bill gets paid.

### B5. He skips things
What he leaves out: greetings, "please", "simply", the second half of an explanation, the reason when the reason is obvious, the subject when it's clear ("Thinking of having just one world"), linking words like however, therefore, in addition, as well as.

What he keeps: and, so, but, because. He joins with those and doesn't mind a long sentence.

- Before (app): Any questions before you start? Tap one below or type your own.
- After: Questions before you start? Tap one or type your own.

### B6. Sure when he's sure, flat when he's not
Sure sounds like: "yes", "that's good", "let's do it", "I'm sold". Not sure sounds like: "I don't know what that means", "not really sure". He never dresses doubt up. So the app says "This number is a guess until you upload a statement" and never "This may potentially not fully reflect".

- Before (app): No answer came back. Try again, or tap one of the questions below.
- After: Nothing came back. Try again or tap a question below.

### B7. He repeats a word, he doesn't hunt for another one
He'll say "I want" five times in a row and "make sure" three times. The app does the same with its own words. Free to spend is always Free to spend, never "your fun money" in the next line for variety. This is also the glossary rule.

- Before: Your spending money is ¥20,000. This fun budget starts fresh each month.
- After: Free to spend is ¥20,000. It starts fresh each month.

### B8. Voice the thought with "like, hey"
When he wants to show what something means he says it as a line someone would say: "like, hey, this is how much you have left". In the app that becomes a plain quoted thought, used rarely, in help text only.

- Before (help): Seeing which is which is half the calm.
- After: This is the "wait, where did it go" number.

### B9. His own pictures, not stock ones
He makes his own: "the sprinkles come last", "all steam ahead", "hold your hand", "an actual place that I can go to store my money". They're concrete and a bit odd. Stock ones (journey, safety net, finish line, peace of mind) are out. If no picture of his fits, use none.

- Before (help): It is a second safety net, and it costs nothing.
- After: It's your own copy and you keep it yourself.

### B10. Dry, never cute at the reader
His humour is blunt and short ("that's kind of silly", "what??"). He calls the art cute, he doesn't write cute. No puns, no winks, no mascot talking.

- Before: Uh oh, your acorns are running low!
- After: Free to spend is almost gone. 9 days to pay day.

### B11. The order he explains in
What it is, then why you'd care, in his words "the mindset behind it and then the function". The why is one sentence about your money. Then what to tap. He doesn't open with the lesson.

- Before (help): Bills are the things that will happen whether you feel like it or not. Seeing what is still to pay this month means you never get surprised by them.
- After: What you still have to pay this month. Don't spend this, it's already the landlord's.

### B12. Short for small things, long is fine for a real explanation
Typed, he's very short ("thats good", "whats the ETA"). Explaining something he cares about, he goes long and loose. So buttons, labels and notes are a few words. A help text can run four or five sentences if each one says something new. Never pad a short thing, never chop a real explanation into fragments.

### What he never does (in about 5,000 words of his own)
- No exclamation marks. No em dashes. No semicolons.
- No "please", no "kindly", no "feel free".
- No "however", "therefore", "moreover", "additionally", "furthermore", "in conclusion".
- No comforting the person he's talking to. He says what he wants and what's wrong.
- No praise words for his own thing (powerful, seamless, smart).

---

## Part C. Punctuation and layout

He asked for less punctuation. Typed, he often drops the full stop, the apostrophe and the capital. The app keeps capitals and apostrophes (reasons in Part D) and drops the rest wherever a line break can do the job.

| Where | Rule | Example |
|---|---|---|
| Buttons | 1 to 3 words, starts with a verb, no punctuation at all | Log spend |
| Labels, headings, tabs | No full stop, no colon at the end, sentence case | Bills left |
| One line notes (one sentence under a number or a field) | No full stop at the end. Commas only if it can't be read without one | still to pay in Nov |
| Notes with two or more sentences | Full stops between and at the end, so nobody thinks it was cut off | These numbers are made up. Do the step below to put yours in. |
| Help text | Normal sentences with full stops. Few commas. Break a long one with "and", "so" or a new sentence, never with a semicolon or a dash | |
| Errors and warnings | What happened, then what to do. Two short sentences at most | That amount is too big. The most is 1,000,000,000. |
| Toasts | One line, no full stop | Saved |

Everywhere:
- No em dashes, no en dashes as punctuation, no semicolons.
- No exclamation marks. He would not.
- No brackets for side notes. If it matters give it its own line, if not cut it. A bracket around a unit or format is fine: "(optional)" becomes its own small label.
- No colon to set up a reveal. A colon before a number or a list is fine.
- No quote marks for emphasis. Quotes only for a thought said out loud (B8) or the exact name of something to type.
- No "e.g." or "i.e." or "etc". Say "like".
- No ellipsis, no slash for "or", no ampersand.
- Commas: drop the comma before "and", "so", "but" in a short sentence. Keep any comma that changes the meaning.
- Numbers are digits. Dates are day then short month, "18 Nov". Amounts keep their currency sign and their exact figure.
- One idea per line where the screen allows. A line break is his favourite punctuation.

---

## Part D. The limits

Style never changes what the money says. When clear and "like Mako" pull apart, clear wins, and the checker writes "clear wins" next to the line so nobody rewrites it again.

1. **Numbers and dates never move.** No rounding, no "about", no "a few" where the app has the figure. A rewrite carries every number, date, currency sign and count from the original, exact.
2. **Glossary words never change for style.** burrow, goal, Free to spend, Bills left, Saved, Total, and the rest of the shared glossary in QC_ROLES.md (Bills and basics, This month, Investing, Giving, Education, paid off, still owed, not placed yet, pay, bills, places). Same spelling and capitals every time. No "fun money", no "spending cash", no "pot".
3. **Which money, which month, whose.** If dropping a word makes it unclear which amount, which month or which account, the word stays. "safe to spend in Nov" keeps "in Nov".
4. **Losing data and things that can't be undone** are written out in full, with normal punctuation, and say what is lost. "This cannot be undone" may skip the contraction for weight.
5. **What the app doesn't know, it says once and plainly.** Not hedged, not hidden.
6. **Capitals and apostrophes stay** even though he drops them when typing. "its" and "it's" mean different things, and a lowercase line next to a capital one looks like a bug. The brand line "the burrow, for money freedom" stays lowercase as he set it.
7. **No slang that a teammate reading English as a second language would trip on.** "idk", "btw", "gonna" are his in chat but stay out of the app. So do "damn" and friends.
8. **A button or label rewrite is never longer than the original.** It has to fit where the old one sat.
9. **Screen reader text** (aria labels, alt text) follows the same rules but keeps full stops, because a reader pauses on them.
10. **Legal and privacy lines** ("Not financial advice", what is sent where) are exact first. Make them plain, don't make them casual.

---

## How the checker answers

For each line: `PASS`, or

```
LINE: the exact text
AI: yes or no, and why (the A number)
MAKO: yes or no, and why (the B or C number)
REWRITE: the new line
NOTE: only if Part D applied ("clear wins: kept 'in Nov'")
```

A line can pass one and fail the other. "Your funds are insufficient" doesn't sound like AI and doesn't sound like Mako either.

---

## Where Part A comes from

Read on 2026-11-19 by web search. The session could not open the pages themselves (network rules), so everything below was read through search summaries and extracts. Treat exact figures as reported, not checked.

Solid (studies that counted):
- Kobak and others, "Delving into LLM-assisted writing in biomedical publications through excess vocabulary", Science Advances, 2025. Word counts in 15 million abstracts. The source of the "delve" family in A9. Academic text, so it carries over to app copy only as a hint.
- Juzek and Ward, "Why does ChatGPT delve so much", 2024. Same family of words.
- Liang and others, "Monitoring AI-modified content at scale", 2024. Adjectives like commendable, meticulous, intricate.
- Reinhart and others, "Do LLMs write like humans", PNAS, 2025. Sentences that end in an "-ing" clause several times more often than people write them.
- Liang and others, "GPT detectors are biased against non-native English writers", Patterns, 2023. Detectors flagged most essays by non-native writers as AI. Why this guide never says "a detector score": plain simple English is exactly what detectors get wrong.

Agreed by editors:
- Wikipedia, "Signs of AI writing" (WikiProject AI Cleanup, kept up to date through 2026). The main source for A1 to A8, A11, A12, A14. The page itself says none of the signs is proof and that the signs are symptoms.
- Hacker News threads on that page, 2025 and 2026, and working writers' posts on "it's not X, it's Y".

Folklore, kept out as proof:
- "An em dash means AI." People use them a lot. Reported rates differ by model and are falling. It's banned here because Mako banned it.
- Any single word as proof. Lists date fast.
- AI detector scores.
- The exact comfort phrases in A1 are not on any published list we found. They're in because Mako pointed at them himself.

What good product copy does, from people who write it (GOV.UK and NHS style guides, Mailchimp, Monzo tone of voice, Shopify Polaris, Apple's writing guidelines, Nielsen Norman Group on errors, 37signals): be specific, use the words the person uses, say it as you'd say it out loud, verb first on buttons, no full stop on buttons, headings and labels, exclamation marks almost never and never on a failure, errors say what happened and what to do next, amounts and dates exact. Part C follows these where they agree with Mako and follows Mako where they don't.
