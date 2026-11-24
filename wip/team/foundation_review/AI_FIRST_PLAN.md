# AI first: the plan (24 Nov 2026, for qc-foundation before building)

Source: DECISIONS "The new foundation" items 12 (the direction), 13 (pay is what lands), 14 (setup feedback), DECISIONS line 49
(the assistant that carries out decisions), NORTH_STAR (one thing at a time, holds your hand), VOICE, LESSONS 4 (thin slices).
Built on what exists: act3.js (the one write door, Undo), plan3_write.js (plan steps), ask3_core.js (summary, checked
changes, preview with the engine's figures), stmt3_ai.js (the AI route), build_book.js (setup answers to a book), the relay
functions/api/ai.js on main. The AI never works out money and never writes on its own. The engine works out every figure;
act3 writes every change.

## 1. The assistant in the page

**One panel, always there.** A new pair of files like Ask: `chat3_core.js` (pure, node-testable: tools, the draft, checks,
the loop's rules) and `chat3.js` (the panel). On a phone it is a bar at the bottom ("Ask or tell me something") that opens
to half the screen over the tabs, so Home stays visible above it; on desktop a column on the right. It replaces the Ask
sheet (ask3.js folds into it). Before setup, it is the whole first screen.

**Conversation saved on this device only.** Its own IndexedDB store (`chat3`), never in the book, never in the cloud copy,
never in a backup file. Kept: the last 200 turns and the setup draft. "Clear this chat" in Settings. A reload picks up where
it left off (the draft too).

**The loop.** One person message, then up to 6 rounds with the AI: the AI may call read tools (answered by the page at once)
and propose tools (shown as cards). The turn ends when the AI answers in words or proposes. The relay refuses a forced tool,
so tool_choice stays auto and a plain text reply is read as words (as ask3 does).

**The tools (12, under the relay's 16).** Records are named by short refs (A1, L1, G1, B1, C1, P1), never by ids, as
ASK3C.summary does.
- Read, no OK needed: `figures` (ASK3C.summary: safe to spend, period, next pay, due before pay, cards, goals, notes);
  `list` (accounts, pays, bills, cards, lines, goals, recent spends of one account, with refs); `explain` (a topic from the
  help texts: how safe to spend works, periods, cards, goals); `draft` (the setup draft so far).
- Setup draft, no money yet: `draft_set` (one section of the build_book answers: bank, country, pays, cards, bills, free,
  minimum). The draft card shows what is filled in; the person can edit any line in the card or say "no, 7,400".
- Propose, nothing happens until the person taps OK: `propose` with up to 6 steps, each a named action:
  act3 (`logSpend`, `refund`, `moneyIn`, `moveMoney`, `edit`, `remove`) and plan3_write (`addBill`, `changeBill`, `endBill`,
  `addLine`, `changeLine`, `setFree`, `addGoal`, `setAside`, `addCard`, `changeOwed`, `addLoan`); plus `checkBank` (a
  check-in figure, through checkin3's records) and `fillBook` (setup: the draft through build_book). Missing today and
  needed (test first): `addPay` and `changePay` in plan3_write, `addAccount` for a second bank.
- `read_file`: the person attached a file; the page runs the extraction (section 7) and returns cleaned rows.

**Every change shown, then OK, then Undo.** A `propose` becomes one card: each step in plain words ("Log 1,200 on Free to
spend from Main bank, today"), and the engine's figures before and after (ASK3C.preview: safe to spend, Free to spend left,
the line or goal touched). Buttons: OK, Change, Not now. OK runs the steps through ACT3 as one group (ASK3C.apply, a refused
step takes back the ones before it), then the one message band shows "Done" with Undo; the card stays in the chat with its
own Undo. The AI is told the result in the next round ("applied", "person said not now", or act3's refusal words). Nothing
that changes money is ever written without the OK tap, including in setup.

**It knows everything.** Each request carries `figures` for today (about 1,500 tokens) and the last 10 turns. Older turns
are not sent; the draft and the book are the memory, not the chat.

## 2. The setup chat, for Mako's shape

First open, no book: the panel is the page. Answers go into the draft (`draft_set`), each section saved to the device as
it is answered with a "Saved" line in the chat (item 14), each editable and undoable. Questions are fixed in the page's
guide and the AI asks them in this order, one per message, skipping what it already knows. Drafts for Mako's copy pass:

1. Welcome: "Hi, I'll set up your Burrow with you. I ask a few questions, about 10 minutes. You can type, or send me a
   statement or payslip and I'll read it. What you tell me stays on this phone until you say fill it in."
2. How it works: "You tell me what's in your bank today, what comes in and what goes out and when. From that the app works
   out what's safe to spend until your next pay. Everything I fill in shows on the screens so you can check it."
3. "Which country do you bank in? It moves pay and bills off weekends and holidays." (Japan picked from yen; he confirms.)
4. "Which bank does your pay go into? One is fine to start. You can add more later."
5. "What does that bank's app show right now?" If he doesn't know: "Open the bank app. The big number on the first screen
   is it. Or send me a screenshot."
6. "How are you paid? On a day each month, twice a month, every week or two, or whenever work comes in?"
7. "Which day does it land? If that's a weekend or holiday does it come the day before or after?"
8. "How much lands in your bank each time?" Then always: "Is that before or after tax?" If before or not sure: "I need what
   lands in the bank, after tax. On a Japanese payslip it's 差引支給額 (take-home). Send me the payslip and I'll find it."
9. "Anything else coming in, like a side job? If it lands the same day you can give me one total." (Mako: one number.)
10. "Do you have credit cards? For each one: what's on it right now (it's in the card app), which day it's paid and from
    which bank." Then: "Do you know its statement close day (締め日)? Not sure is fine."
11. "Which bills come out of your bank? Rent, power, phone, internet, subscriptions. How much and which day for each. Bills
    you pay by card go with the card, not here." A statement upload lists the repeats it finds as a draft for him to tick.
12. For each bill build_book's `asked` names (due between the last pay and today): "Phone was due on 20 Nov. Has it come
    out of your bank already?"
13. "How much do you want for food and everyday stuff each pay period? Groceries, eating out, getting around, fun. Leave it
    blank if you don't know yet." (replaces "everyday spending", item 14)
14. "Keep at least ___ in your bank? Skip it and there's no minimum." (item 5, never filled in for him)
15. The draft card, all sections, then "Fill in my Burrow". OK runs `fillBook`: build_book through one act3 step (Undo puts
    the draft back and the book away). The chat says "Done. Here's Home" and opens Home; "Check each tab, tell me anything
    that's wrong". The screens' Setup still shows the same answers for checking and editing.

## 3. What is sent and what never is

Sent, only when the person sends a message or taps Read: their message, the last 10 turns, today's figures with names and
refs (as Ask today), the setup draft, and a file they attached. Never sent: record ids, notes, shop names or single spends
(unless the person types them or uploads the statement), the backup, the cloud copy's key, anything from Settings. The
anonymous id is random per page open. The relay keeps only counters, no text. "See what is sent" stays under the panel.

**Cost caps.** Model: the relay's `default` tier, `claude-sonnet-5-5` (MODEL_DEFAULT) for the chat; `quick`,
`claude-haiku-5-5`, for file reads only if a test of Mako's payslip and statement shows it reads them as well (else
default, as stmt3 uses today). Relay limits as on main: DAILY_TOKEN_CAP 3,000,000 tokens a day for everyone,
USER_DAILY_CALLS 150 a browser a day, IP_PER_MINUTE 30, output capped at 32,768. The page asks max_tokens 2,000 for a chat
round, 24,000 for a file read, effort low. A setup of about 20 rounds at about 4,000 tokens in is about 80,000 tokens.
**INVITE_CODES must be set before the key goes on**: the private address is only unlisted, not locked. The page asks for
the code word once and keeps it on the device (app3 sends `invite: ''` today, so this is wiring work in slice 1). Mako also
sets a monthly spend limit in the Anthropic console. Asks Mako (via the coordinator): the key and the code word.

## 4. When the site's AI is off or offline

The panel checks /api/health. With `"ai": false` (today), no relay, or no connection:
- It says so in one line and offers two ways: "Set up on the screens" (setup3, unchanged, the same build_book) and "Use
  any AI": the page shows the same questions as one request to copy into any AI chat, with the answer shape (build_book
  answers as JSON); the person pastes the reply back, it goes through the same draft checks and the same draft card, then
  `fillBook` with OK. The stmt3 "Use any AI instead" box is the pattern.
- Inside the Claude viewer, the viewer's own Claude (`window.claude.use`) is the second route, as stmt3_ai does.
- Day to day with no AI: the screens do everything; the panel shows "The assistant is off right now" and the copy route
  for statements. Nothing is queued to send later.

## 5. Tests with no real AI

- **Recorded replies** (node, `chat3_core.test.js`): fixed AI replies (words, read calls, `draft_set`, `propose`) through
  the checks. Each named action, each bad reply (unknown ref, amount as words, a date ahead, 7 steps, a tool not in the
  list) is dropped with plain words. Draft to build_book answers equals the screens' setup answers for the same shape.
- **A fake model that calls tools** (`fake_ai.js`, served at /api/ai in Playwright like e3_ask's stub): a small script per
  conversation that reads the request (which tool results came back, which question was last) and answers the next step,
  including a read call before a proposal, a refused act3 step, a "before tax" answer, an upload. Checks: the request
  never holds an id or a note, max_tokens and invite are sent, the loop stops at 6 rounds.
- **The real-page walk** (`e3_chatwalk.js`, joins check3): Mako's made-up shape set up through the chat on 24 Nov 2026
  with the fake model: Main bank 286,000; pay on the 10th (the working day before), 240,000 as one number, said "after
  tax"; Card A 54,000 paid on the 10th (day after), Card B 23,000 on the 11th (day before), close days not sure; Rent
  72,000 on the 27th, Power 7,400 on the 26th, Phone 4,800 on the 20th (already out), Internet 5,200 on the 27th; Free
  to spend blank; no minimum. Hand-worked: next pay 10 Dec; due before it Power 7,400 (26 Nov), Rent 72,000 and Internet
  5,200 (27 Nov), together 84,600; safe to spend 286,000 minus 84,600 = **201,400**; Main bank **286,000**; Card A owes
  54,000, Card B 23,000. (The pay is not in the sum: it lands after the stretch. The same 201,400 the screens' walk gets
  with 180,000 and 60,000.) Then: Undo the fill (back to the draft, no book), fill again, reload (same figures), one
  spend by chat ("I spent 1,200 on lunch", OK, safe 200,200; Undo, 201,400). Same check the other way: the same answers
  through setup3 give the same book, figure for figure.
- One test with the real AI, by hand, only once the key is on: the same walk, read by a person, not a gate.

## 6. Thin slices, in order

Each ends with a real-page walk and reaches Mako (LESSONS 4). Test first, one item per commit.
1. **Setup chat for Mako's own shape, end to end.** The panel (first screen only), the draft and its card, `draft_set`,
   `fillBook` with Undo, the "before or after tax" question, the not-yet-out bill question, invite wiring, the fake model,
   `e3_chatwalk` to 201,400. No uploads, no day-to-day tools. The copy route (section 4) in the same slice, because the
   site's AI is off until Mako adds the key, so this is how he tries it first.
2. **Always on, day to day.** The panel on every tab, ask3 folded in, `figures`, `list`, `explain`, `propose` with the act3
   actions and plan3_write steps; Undo on each card. Walk: a week of spends and a check-in by chat.
3. **Uploads.** Payslip (take-home and date, confirmed in words), statements through stmt3 (rows into the existing review
   and stmt3_plan, then repeats offered as bills). Walk: setup from a made-up payslip and statement.
4. **The other shapes.** Every two weeks, no fixed pay, two banks, cash (`addPay`, `changePay`, `addAccount` first).
5. **Receipts by chat** ("here are my new receipts"): photos read like statements, sorted to lines, one card.
Words in every slice go to qc-voice; Mako's copy pass at his next run.

## 7. Risks and what stops each

**Wrong numbers from the AI.**
- The AI never states a figure of its own: the guide says to use `figures` and quote it; the answer check flags any
  amount in its words that is not in figures, the draft or the person's own message, and shows "Check this" on it.
- Every amount it writes is parsed by screens/money.js, every step is checked by act3 and the engine's look ahead, and the
  card shows the engine's before and after. The person taps OK. Undo on every step.
- Amounts it proposes must appear in what the person typed or in a file read; one that does not is marked "my guess" on
  the card and never ticked by default.
- The draft card shows every answer next to the question; the screens show the book after; the walk is the gate.

**Prompt injection from uploaded statements and payslips.**
- A file is read by its own call that offers only the rows tool (no propose, no draft tools), as stmt3_ai does now. Its
  answer goes through STMT3R.cleanRead: only dates, amounts and short descriptions survive, cut to 60 letters.
- The chat AI sees the cleaned rows marked as data from a file, never the file. Words in a file can at most produce a
  proposal, and every proposal needs the person's OK with figures shown.
- Tools are fixed in the page; the AI cannot add a tool, reach the network or read anything but the book's figures.

**Cost.**
- Relay caps (3,000,000 tokens a day, 150 calls a browser a day, 30 a minute), invite code before the key, a console spend
  limit, max_tokens 2,000 a round, 6 rounds a turn, 10 turns of history. The panel shows "Daily limit reached" in plain
  words and offers the screens.

**Also.** The relay's prefix keeps it to the app and the person's money. If the AI is down mid-setup, the draft is kept and
the screens' setup opens with the same answers filled in.
