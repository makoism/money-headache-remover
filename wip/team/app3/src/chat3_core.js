/* ---------- chat3_core: the assistant, the pure half (DECISIONS new foundation 12 to 14; DECISIONS_ROUND2 BU, BV, BW;
   foundation_review/AI_FIRST_PLAN.md with both Corrections sections) ----------
   The conversation engine behind the one assistant panel (chat3.js, lane B). Pure: no DOM, no fetch, no store; it runs in
   node and in the page. The AI never works out money and never writes: the engine (lookahead) works out every figure,
   answers3.js turns setup answers into build_book input, and act3 (with plan3_write's steps) writes every change.

   THE INTERFACE (fixed on day one for lane B; additions only, never a change of meaning)
   In a page it is CHAT3C; in node require('./chat3_core.js'). It needs ANSWERS3 (answers3.js), ASK3C, BurrowAct3, PLAN3W
   and the engine, loaded before it.

   Constants
     K.ROUNDS 6 (AI rounds in one turn), K.TURNS 10 (earlier turns sent), K.KEEP 200 (turns kept on the device),
     K.MAX_TOKENS 2000 (a chat round), K.MAX_STEPS 6 (steps in one change), K.TIER 'default', K.EFFORT 'low'
     K.GUIDE   the 15 setup questions, in order: [{ n, key, ask }] (AI_FIRST_PLAN section 2, with BV7, BV2.13, BW)
     K.TOOLS   the tools offered to the AI (relay shape: { name, description, input_schema }); 5 tools, none of them reads
               the figures or the draft (BU2: fresh figures and the draft go with every round):
                 list {what, account?}     records with refs; spends as amount, date and ref only (BV6)
                 explain {topic}           how the app works, from the help words
                 draft_set {section, value} one setup section into the draft (device only, no money yet)
                 fill_book {}              the draft into a book (refused until complete, BV4)
                 change {steps: [...]}     up to 6 named steps through act3 (BW: made at once, Undo one tap)

   The chat state (the panel keeps it in its own IndexedDB store `chat3`: device only, never in the book, the cloud copy
   or a backup file)
     K.fresh() -> state { v: 1, turns: [], draft: null, fill: null, seq: 0 }
       turns: [{ id, who: 'person' | 'ai' | 'note' | 'card', text, at, card?, check? }], the last K.KEEP kept;
         an 'ai' turn's check: [amounts in its words found in none of what it was sent] (the panel marks "Check this")
         a 'note' is the app's own line ("Saved", "That was not changed: ...");
         a 'card' carries card = one of
           { kind: 'change', status: 'done' | 'ask' | 'undone' | 'refused' | 'not now', lines: [words], rows: [{ label,
             before, after }] (engine figures, minor units), why?: words (a refusal, or why it asks first), steps?: [act3
             step ids], ask?: 'delete' | 'large' }
           { kind: 'draft', sections: [{ key, title, lines: [words] }], need: [words], ready: bool }
           { kind: 'fill', status: 'done' | 'undone' | 'start over', figures: { safe, bank } }
       draft: the setup answers so far (ANSWERS3's answers shape; each bank and card figure keeps its `on` day, each
         asked answer the days it answered, BV3 and BV2.8), or null before the first answer
       fill: { at, day, grp } once the draft became a book; null after the fill's Undo

   One turn
     await K.turn(state, message, deps) -> { state, shown: [turns added], stop: 'words' | 'change' | 'rounds' | 'error',
         error?: plain words }
       the person's message, then up to K.ROUNDS rounds: each round sends K.request(...) through deps.send; read tools are
       answered at once, draft_set and fill_book and change are carried out at once (a delete or a change larger than
       safe to spend becomes an 'ask' card instead, BW) and the AI is told the result in the next round. The turn ends
       when the AI answers in words, or after the rounds. A relay error ends the turn with plain words; nothing is lost.
     deps (the page gives E3, ACT3 and its fetch; the tests give a fake):
       send: async body -> the relay's JSON ({ content: [blocks], stop_reason }), or throws Error(plain words)
       today: () -> 'YYYY-MM-DD'; told: () -> ISO moment; newId: () -> id
       book: () -> the book or null; mode: () -> E3.mode ('none' | 'kept' | 'try')
       door: the page's act3 (ACT3) or null before setup
       start: async book -> true | false (E3.start: keep a new book)
       discard: async () -> true | false (the fill's Undo, BV2 and BV2.9: drop the book and its records only, keep the
         device record and kept copies, mark the store so another tab gets "behind", hold the cloud copy back)
       anon: the device id (BU3); invite: the code word ('' when none)

   What the person taps on a card (each returns { state, shown, ok, text? })
     await K.confirm(state, turnId, deps)   an 'ask' card: carry it out now
     await K.notNow(state, turnId)          an 'ask' card: leave it (the AI hears it next round)
     await K.undo(state, turnId, deps)      a 'done' change card: its act3 steps taken back; a 'done' fill card: the
                                            book discarded and the draft kept (refused, as 'start over', once anything
                                            else was written: then K.startOver after the panel asks first)
     await K.startOver(state, deps)         the book discarded and the draft kept, after the person said yes
     K.draftEdit(state, section, value, deps) -> { state, shown, ok, text? }   an edit typed on the draft card, the
                                            same checks as draft_set
     await K.fillNow(state, deps)           the draft card's "Fill in my Burrow"

   The draft's sections (draft_set and K.draftEdit take one section and its whole value; amounts are whole yen or cents,
   minor units; accounts are named by their names; ANSWERS3 fills every hidden field, never the AI, BV1):
     country  'JP' | 'PH' | 'XX'
     currency 'JPY' | 'PHP' | 'USD' | 'EUR'   its own answer; amounts saved before it changed are dropped and asked again
     banks    [{ name, amount, type?: 'bank' | 'cash' | 'ewallet' }]   the first is the main bank; each figure keeps its
              `on` day (set here, never by the AI)
     pays     [{ name, amount, every: 'month' | 'days' | 'weeks' | 'none', day?, day2?, n?, start?, shift?: 'before' |
              'after', bank? }]   a side job not the same each time is every 'none' (BV7)
     cards    [{ name, owed, payDay, closeDay: 1..31 | 'last' | 'not sure', shift?: 'before' | 'after', payFrom? }]
     bills    [{ name, amount, day, every?: 'month' | 'year', month?: 1..12, from? }]
     asked    [{ name, out: true | false }]   "has it come out of your bank already?" for each bill build_book asks about
     statements [{ name, amount | 'not sure' }]   for each card build_book asks about (between its close and its payment)
     payToday { landed: true | false }   when a bank figure is given on a day a pay lands (BV2.13)
     free     amount | null (left blank)        min   amount | null (no minimum)

   Pure helpers (the panel and the tests use them)
     K.request(state, message, rounds, ctx) -> the relay body { v: 1, anon, invite, tier, max_tokens, effort, system,
         tools, tool_choice: { type: 'auto' }, messages }. Sent: the message, the last K.TURNS turns as words, the engine's
         figures for today with names and refs, the draft. Never sent: a record id, a note, a shop name or a single spend
         (unless the person typed it), the backup, the cloud key, anything from Settings (AI_FIRST_PLAN 3, BV6).
     K.read(res) -> { words, calls: [{ id, name, input }] }   a relay reply read (a plain text reply is words)
     K.figures(book, today) -> { text, refs }   what is sent about the book (ASK3C.summary plus pays and bills refs)
     K.draftCard(draft, today) -> the draft card (sections, what is still needed, ready)
     K.fillCheck(draft, today, mode) -> { ok: true, answers } | { ok: false, need: [words] }   BV4, BV3, BV2.8, BV2.9
     K.handle(state, call, deps) -> { result: words for the AI, shown: [turns] }   one tool call (used by turn)
     K.sentText(state, message, deps) -> what "See what is sent" shows: the same text the request carries
     K.copyPrompt(state, today) -> text   "Use any AI" when the site's AI is off (AI_FIRST_PLAN 4): the questions,
         the answer shape and the draft so far, to copy into any AI chat
     K.pasteBack(state, text, deps) -> { state, shown, ok, text? }   that AI's reply pasted back, through the same
         draft checks (all of it or none); then K.fillNow as usual
   Plain browser JavaScript. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? null : root.BurrowEngine;
  const LA = node ? require('../../engine/lookahead.js') : E.lookahead;
  const G = node ? require('../../engine/ledger.js') : E.ledger;
  const PER = node ? require('../../engine/periods.js') : E.periods;
  const SM = node ? require('../../screens/money.js') : root.BurrowScreens.money;
  const SN = node ? require('../../screens/names.js') : root.BurrowScreens.names;
  const HELP = node ? require('../../screens/help.js') : root.BurrowScreens.help;
  const AQ = node ? require('./ask3_core.js') : root.ASK3C;
  const ANS = node ? require('./answers3.js') : root.ANSWERS3;
  const PW = () => (node ? require('./plan3_write.js') : root.PLAN3W);
  const CK = node ? require('../../engine/checkin.js') : E.checkin;
  const IDS = node ? require('../../engine/ids.js') : E.ids;
  const ROUNDS = 6, TURNS = 10, KEEP = 200, MAX_TOKENS = 2000, MAX_STEPS = 6;
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  const live = x => x && !x.gone;
  const clone = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const day1 = s => SN.dayLabel(s, false);
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').replace(/\*\*/g, '').trim().slice(0, max || 1500);

  /* ---- the 15 setup questions (AI_FIRST_PLAN section 2, with BV7, BV2.13 and BW: how many banks, one is fine).
     Drafts for Mako's copy pass. ---- */
  const GUIDE = [
    { n: 1, key: 'welcome', ask: "Hi, I'll set up your Burrow with you. I ask a few questions, about 10 minutes. You type, and I'll say where to find each figure. What you tell me stays on this phone until you say fill it in." },
    { n: 2, key: 'how', ask: "You tell me what's in your bank today, what comes in and what goes out and when. From that the app works out what's safe to spend until your next pay. Everything I fill in shows on the screens so you can check it." },
    { n: 3, key: 'country', ask: 'Which country do you bank in, and in which currency? The country moves pay and bills off weekends and holidays.' },
    { n: 4, key: 'banks', ask: 'How many banks do you use? One is fine to start, you can add more later. Which bank does your pay go into?' },
    { n: 5, key: 'banks', ask: "What does that bank's app show right now? If you don't know: open the bank app. The big number on the first screen is it. Not sure right now? We can leave it for later, and I'll ask again before I fill anything in." },
    { n: 6, key: 'pays', ask: 'How are you paid? On a day each month, twice a month, every week or two, or whenever work comes in?' },
    { n: 7, key: 'pays', ask: "Which day does it land? If that's a weekend or holiday does it come the day before or after?" },
    { n: 8, key: 'pays', ask: "How much lands in your bank each time? Then always: is that before or after tax? If before or not sure: I need what lands in the bank, after tax. On a Japanese payslip it's 差引支給額 (take-home)." },
    { n: 9, key: 'pays', ask: 'Anything else coming in, like a side job? Is it the same amount each time? If it lands the same day you can give me one total.' },
    { n: 10, key: 'cards', ask: "Do you have credit cards? For each one: what's on it right now (it's in the card app), which day it's paid and from which bank. Do you know its statement close day (締め日)? It's on the card's monthly statement, or in the card app with the payment details. Not sure is fine." },
    { n: 11, key: 'bills', ask: "Which bills come out of your bank? Rent, power, phone, internet, subscriptions. How much and which day for each. Bills you pay by card go with the card, not here." },
    { n: 12, key: 'asked', ask: 'For each bill in NEEDED that was due since your last pay: "Phone was due on 20 Nov. Has it come out of your bank already?" For each card statement in NEEDED: how much was on it. If a pay lands today: has it already landed in that figure?' },
    { n: 13, key: 'free', ask: "How much do you want for food and everyday stuff each pay period? Groceries, eating out, getting around, fun. Leave it blank if you don't know yet." },
    { n: 14, key: 'min', ask: 'Keep at least ___ in your bank? Skip it and there is no minimum.' },
    { n: 15, key: 'fill', ask: 'Show what you have (the draft), then ask: shall I fill in your Burrow? When they say yes, call fill_book. After it is filled, say that loans, goals and budget lines like Gifts are not part of setup: they are added on Plan (Add a loan, Add a goal, Add a line), and goals and budget lines can also be told to you.' },
  ];
  /* [qc-assistant blocker 3; M17] ONE table: what every screen and every sheet is for, in one plain line each. The
     assistant is told all of it (SYSTEM), and with each message which screen is open and which sheet is on top
     (stateText). A new screen or sheet needs its row here: tests/chat3_core.test.js counts the rows and
     tests/e3_fakeai_page.js opens each of Plan's sheets. These are words for a person too: the wording lint reads them. */
  const SCREENS = {
    home: { name: 'Home', does: 'Home shows what is safe to spend until your next pay, what each account holds today, what is due before pay, and your goals' },
    plan: { name: 'Plan', does: 'Plan shows your pay and bills, Free to spend and your budget lines, goals, your accounts, cards and loans. Tap a row to change it' },
    receipts: { name: 'Receipts', does: 'Receipts is where you log money that came in, went out or moved between your accounts, and see what you logged. Tap a record to change or remove it' },
    settings: { name: 'Settings', does: 'Settings holds the backup file, the cloud copy, the code word for the AI and the assistant\'s error log' },
    check: { name: 'Check your bank', does: 'Check your bank is where you type what your bank and cards show today. The app compares each with what it expected and asks about the gap' },
    stmt: { name: 'Add statements', does: 'Add statements reads a bank or card statement file and shows what it read before anything is added' },
    reminders: { name: 'Reminders', does: 'Reminders shows the days your bills are due and when to check your bank, and can add them to your calendar' },
    setup: { name: 'setup on the screens', does: 'Setup on the screens asks for your bank, pay, cards and bills in sections, and each section saves on its own' },
    welcome: { name: 'the first screen', does: 'The first screen is where setup starts, by answering in the chat or on the screens' },
    free: { name: 'Free to spend', does: 'Sets Free to spend, the money you keep for food and everyday things' },
    addLine: { name: 'Add a line', does: 'Adds a budget line, a name and an amount, like Food or Transport' },
    line: { name: 'A budget line\'s own sheet', does: 'Changes the line\'s name or amount, or ends the line' },
    addBill: { name: 'Add a bill', does: 'Adds a bill: its name, amount, the day it is due and what it is paid from' },
    bill: { name: 'A bill\'s own sheet', does: 'Changes the bill\'s name, amount or day from a date you choose, changes the next one only, or ends the bill' },
    pay: { name: 'A pay\'s own sheet', does: 'Changes the pay\'s name, amount, day or how often it lands, from a date you choose' },
    addGoal: { name: 'Add a goal', does: 'Adds a goal: its name, the goal amount, a target date and where the money is kept' },
    goal: { name: 'A goal\'s own sheet', does: 'Sets money aside for the goal, takes money out of it, or changes its name, amount or date' },
    addCard: { name: 'Add a card', does: 'Adds a card: its name, what is on it now, the day it is paid from your bank and the day its statement closes' },
    card: { name: 'A card\'s own sheet', does: 'Changes the card\'s name, the day it is paid and the day its statement closes' },
    addLoan: { name: 'Add a loan', does: 'Adds a loan: its name, what is still owed, the usual payment and the day it is paid' },
    loan: { name: 'A loan\'s own sheet', does: 'Changes the loan\'s name, the day it is paid or the usual payment, or closes the loan' },
    addAccount: { name: 'Add an account', does: 'Adds a bank, cash or e-wallet after setup: its name, what it holds today, and whether that money was moved from your main bank' },
    account: { name: 'An account\'s own sheet', does: 'Renames a bank, cash or e-wallet, or sets its own Keep at least' },
    record: { name: 'A record\'s own sheet', does: 'Changes or removes one thing you logged on Receipts' },
  };
  const SYSTEM = `You are the assistant inside The Burrow, a money app the person has open right now. You set it up with them by talking, and after that you answer questions and make changes for them.

Numbers: the app works out every figure. FIGURES (and DRAFT before setup) come with every message and are exact for today. Quote them; never work out a total of your own. Amounts you send are plain numbers in the currency, no symbol, exactly as the person gave them.

How to talk: plain words, short sentences, one question per message, like a friend who is good with money. Usually under 60 words. No headings, no bold, no lists of options, no exclamation marks, no praise. Times and days as the app writes them.

The person can ask anything about the app at any point (use explain for how it works). Answer, then go back to the next setup question.

When they don't know a figure: say where to find it, then give a way on. A bank's figure can be left for later: save that bank with amount null, go on, and it is asked again before fill_book. A close day can be "not sure".

Files: you can't read files, statements, payslips or pictures yet. Never offer to. If they want to send one, say in one line that reading files comes later, and ask them to type the figures.

SETUP (when FIGURES says there is no book yet). Ask these in order, one per message, skipping what DRAFT already has:
${GUIDE.map(g => g.n + '. ' + g.ask).join('\n')}
After each answer, save it with draft_set (that section's whole list each time; nothing is in the app until fill_book). A pay needs afterTax true: only save a pay once the person said the amount is after tax. A second income needs same: true or false. Never fill in a minimum or a figure the person did not give. NEEDED lists what fill_book still needs; ask for those. fill_book only when the person says to fill it in.

AFTER SETUP. When a pay, bill or card payment the app expects has come in or gone out ("my pay came in", "rent came out"), use change with landed and its P, B or A ref: never money_in or log_spend for it, which would count it twice. When they say what their bank app or card app shows today, use bank_figure or card_figure with that figure; if they say a bill or pay has not gone through yet, put its ref in not. When the person says they spent, got or moved money, or asks to change a bill, pay, line, goal or card, use change. The app makes the change at once and shows what changed with Undo; a delete, or a change larger than safe to spend, waits for their OK. An amount you send must be one the person typed since your last change; for a repeat ("another lunch") ask how much, never send the old amount again. Refs (A1, L1, G1, B1, P1, S1) come from FIGURES or list; never invent one. Not a licensed adviser: for investments, loans or taxes, say so in one line.

Adding a bank: ask both of its questions in one message: is it new money or moved from their bank, and if moved, before or after they looked at that bank today.

A spend goes on the account they paid with. If they did not say and they have cards, ask once, naming them: card or bank? The answer is kept for the chat.

SCREEN says which screen the person has open, and the sheet on top of it when there is one: "this screen" means the sheet if there is one, else the screen. Say what it is for in the words below.
WHAT EACH SCREEN AND SHEET IS FOR:
${Object.keys(SCREENS).map(k => SCREENS[k].name + ': ' + SCREENS[k].does).join('\n')}
WHERE ON THE SCREENS (what you can't do yet; when asked, say where in one line): a loan: Plan, Add a loan. A card's pay day or close day: Plan, tap the card. Change a goal or take money out of it: Plan, tap the goal. Change a spend: Receipts, tap it. Statements: Home, Add statements. Reminders: Reminders at the top. A backup or the cloud copy: Settings.`;
  /* [AI_JOIN_FIXES H4] a change it can't make says where it is on the screens (the same map as SYSTEM) */
  const WHERE = [[/loan/, 'Plan, Add a loan'], [/card/, 'Plan, tap the card'], [/goal|take_out/, 'Plan, tap the goal'], [/spend|receipt/, 'Receipts, tap it'],
    [/statement/, 'Home, Add statements'], [/remind/, 'Reminders at the top'], [/backup|cloud/, 'Settings']];
  const whereOf = what => { const w = WHERE.find(([re]) => re.test(what)); return w ? 'On the screens: ' + w[1] : 'Say where from WHERE ON THE SCREENS'; };

  /* ---- the tools (BU2: no figures or draft read tool) ---- */
  const num = { type: 'number', description: 'A plain number in the currency, no symbol.' };
  const str = d => ({ type: 'string', description: d });
  const DO = ['landed', 'bank_figure', 'card_figure', 'log_spend', 'refund', 'money_in', 'move_money', 'remove', 'add_bill', 'change_bill', 'end_bill', 'add_pay', 'add_line', 'change_line', 'end_line', 'set_free', 'add_goal', 'set_aside', 'add_card', 'add_account', 'change_account'];
  /* a step that was asked for and left out, in words for the person (the card says which was not done) */
  const DO_WORDS = { landed: 'ticking off a pay or bill', bank_figure: 'a bank figure', card_figure: 'a card figure', log_spend: 'a spend', refund: 'a refund', money_in: 'money that came in',
    move_money: 'money moved between accounts', remove: 'removing a record', add_bill: 'a new bill', change_bill: 'a change to a bill or pay', end_bill: 'ending a bill', add_pay: 'a new pay',
    add_line: 'a new line', change_line: 'a change to a line', end_line: 'ending a line', set_free: 'a change to Free to spend', add_goal: 'a new goal', set_aside: 'money set aside for a goal',
    add_card: 'a new card', add_account: 'a new account', change_account: 'a change to an account' };
  const CURS = ['JPY', 'PHP', 'USD', 'EUR'];
  const SECTIONS = ['country', 'currency', 'banks', 'pays', 'cards', 'bills', 'asked', 'statements', 'payToday', 'free', 'min'];
  const TOOLS = [
    { name: 'list', description: 'Records with their refs: accounts, pays, bills, cards, lines, goals, or the recent spends of one account (amount, date and ref only).',
      input_schema: { type: 'object', properties: { what: { type: 'string', enum: ['accounts', 'pays', 'bills', 'cards', 'lines', 'goals', 'spends'] }, account: str('An account ref like A1, for spends.') }, required: ['what'] } },
    { name: 'explain', description: 'How a part of the app works, in the app\'s own words.',
      input_schema: { type: 'object', properties: { topic: { type: 'string', enum: ['safeToSpend', 'period', 'status', 'cards', 'free', 'goals', 'check', 'undo', 'setup', 'sent'] } }, required: ['topic'] } },
    { name: 'draft_set', description: 'Save one setup section into the draft, its whole value. Nothing reaches the app until fill_book. Sections: country "JP"|"PH"|"XX"; currency "JPY"|"PHP"|"USD"|"EUR" (a change of currency drops the amounts saved before it: ask each again); banks [{name, amount, type?, confirmed?}] (first is where pay lands; confirmed true when the person gave the figure again today); pays [{name, amount, every: month|days|weeks|none, day?, day2?, n?, start?, shift?: before|after, bank?, afterTax, same?}]; cards [{name, owed, payDay, closeDay: day|"last"|"not sure", shift?, payFrom?, confirmed?}]; bills [{name, amount, day, every?: month|year, month?, from?}]; asked [{name, out: true|false}]; statements [{name, amount|"not sure"}]; payToday {landed: true|false}; free amount|null; min amount|null.',
      input_schema: { type: 'object', properties: { section: { type: 'string', enum: SECTIONS }, value: { description: 'The section\'s whole value.' } }, required: ['section', 'value'] } },
    { name: 'fill_book', description: 'Turn the draft into the person\'s Burrow. Only when they said to fill it in. Refused while NEEDED is not empty.', input_schema: { type: 'object', properties: {} } },
    { name: 'change', description: 'Make up to ' + MAX_STEPS + ' changes, each a named step: ' + DO.join(', ') + '. landed {ref: the P, B or card A ref, amount? only if it was different, date? the day it landed}; bank_figure and card_figure {account, amount, not?: [the P, B or A refs of things the person says have not gone through yet]}: the app ticks everything it expected on that account by today and asks the person first, naming each. Fields: amount, account (A ref), every (add_bill: month|year|months, with month 1..12 for a year, n and start for months), from and to (A refs), line (L ref), goal (G ref), ref (the record: S, B, P, L or G ref; remove takes an S, B or L ref only: a pay or a goal cannot be removed in this app yet, so say that and that it can be changed on Plan), date (YYYY-MM-DD, today or before), note, name, day, day2, every (month|days|weeks1..4|none), start, when (now|next|once), target, due, owed, payDay, closeDay, type (bank|cash|ewallet), moved (true|false), shift (after|before: a card weekend rule), from (the A ref the money came from), afterFigure (true|false: moved after they looked at that bank on the day of its figure). change_account {account: a bank, cash or e-wallet A ref, name?, min?: its own Keep at least, 0 for none}.',
      input_schema: { type: 'object', properties: { steps: { type: 'array', items: { type: 'object', properties: { do: { type: 'string', enum: DO }, amount: num }, required: ['do'] } } }, required: ['steps'] } },
  ];

  /* ---- refs and the figures sent ---- */
  function figures(book, today) {
    if (!book) return { text: 'There is no book yet: this is setup.', refs: {} };
    const s = AQ.summary(book, today), refs = Object.assign({}, s.refs), out = [s.text];
    const home = G.homeOn(book, today);
    const sch = (book.schedules || []).filter(x => live(x) && (x.kind === 'income' || x.kind === 'bill'));
    const lines = [], view = PER.scheduleView(book, today);
    let p = 0, b = 0;
    for (const x of sch) {
      const ref = x.kind === 'income' ? 'P' + (++p) : 'B' + (++b); refs[ref] = x.id;
      /* one figure, one source: the amount and the rhythm in force today are the engine's own answer (its schedule view,
         the one Plan shows), never worked out again here from the saved lists (a change dated later is not today's);
         [qc-controls 2to5 F2] its next day in Plan's words, with why when a weekend or holiday moved it */
      const v = view[x.id] || {};
      lines.push(`${ref} | ${x.name} | ${v.amount != null ? SM.format(v.amount, x.cur || home) : 'no fixed amount'} | ${ruleWords(v.rule)}${v.next ? ', next ' + SN.landLabel(v.next.land, v.next.due, v.next.land.slice(0, 4) !== today.slice(0, 4)) : ''}${x.ends ? ' | ends ' + day1(x.ends) : ''}`);
    }
    if (lines.length) out.push('Pays and bills (ref | name | amount | when):\n' + lines.join('\n'));
    return { text: out.join('\n'), refs };
  }
  function ruleWords(r) {
    if (!r) return '';
    if (r.every === 'month') return 'on day ' + r.days.join(' and ') + ' each month';
    if (r.every === 'weeks') return 'every ' + (r.n > 1 ? r.n + ' weeks' : 'week') + ' from ' + day1(r.from);
    if (r.every === 'months') return 'every ' + r.n + ' months';
    if (r.every === 'year') return 'once a year on ' + r.date;
    return 'no fixed day';
  }
  /* the spends of the book with refs S1.. in the order they were told (a new one gets the next number) */
  function spendRefs(book) {
    const ev = (book.events || []).filter(e => e && (e.k === 'spend' || e.k === 'in' || e.k === 'transfer') && e.src && e.src.type === 'typed')
      .sort((x, y) => (String(x.told) < String(y.told) ? -1 : String(x.told) > String(y.told) ? 1 : x.id < y.id ? -1 : 1));
    const refs = {};
    ev.forEach((e, i) => { refs['S' + (i + 1)] = e.id; });
    return refs;
  }
  function allRefs(book, today) { return Object.assign(figures(book, today).refs, book ? spendRefs(book) : {}); }

  /* ---- the draft ---- */
  const curOf = d => (d && d.currency) || ANS.CUR_OF[(d && d.country) || ''] || 'JPY';
  const emptyDraft = () => ({ country: null, banks: [], pays: [], cards: [], bills: [], free: undefined, min: undefined });
  function amountIn(v, cur, zero) {
    if (v === null) return null;
    if (typeof v !== 'number' && typeof v !== 'string') return undefined;
    const p = SM.parse(String(v), cur);
    return p.ok && (zero ? p.minor >= 0 : p.minor > 0) ? p.minor : undefined;
  }
  const dayOk = d => Number.isInteger(d) && d >= 1 && d <= 31;
  const TITLES = { country: 'Country', currency: 'Currency', banks: 'Your bank', pays: 'Pay', cards: 'Cards', bills: 'Bills', asked: 'Bills since your last pay', statements: 'Card statements', payToday: "Today's pay", free: 'Free to spend', min: 'Keep at least' };
  /* one section into a copy of the draft, checked; { ok, draft, text } or { ok: false, text } */
  function draftSet(draft0, section, value, today) {
    const d = clone(draft0) || emptyDraft(), cur = curOf(d), no = text => ({ ok: false, text });
    const list = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? [v] : null);
    const nameOf = x => clean(x && x.name, 60);
    const prev = (sec, name) => (d[sec] || []).find(y => ANS.keyOf(sec, y.name) === ANS.keyOf(sec, name));
    if (section === 'country') {
      if (!['JP', 'PH', 'XX'].includes(value)) return no('Country is JP, PH or XX (somewhere else)');
      d.country = value;
    } else if (section === 'currency') {
      /* [AI_JOIN_FIXES C] the currency is its own answer. Amounts saved before the currency they are read in changed
         (50,000 yen units would show as 500.00 pesos) are dropped and asked again, never converted or kept: see the
         end of this function */
      const v = String(value || '').toUpperCase();
      if (!CURS.includes(v)) return no('Currency is JPY, PHP, USD or EUR');
      d.currency = v;
    } else if (section === 'banks') {
      const v = list(value); if (!v || !v.length) return no('Give at least one bank');
      const out = [];
      for (const x of v) {
        const name = nameOf(x), a = amountIn(x.amount, cur, true), p = prev('banks', name);
        if (!name) return no('Each bank needs a name');
        if (a === undefined) return no('What does ' + name + ' show today? A plain number, or null to leave it for later');
        /* [AI_JOIN_FIXES H3] "I don't know": the bank is kept with its figure for later, asked again before the fill */
        if (a === null) { out.push(Object.assign({ name, amount: null, on: null, later: true }, x.type && x.type !== 'bank' ? { type: x.type } : {})); continue; }
        if (x.type && !['bank', 'cash', 'ewallet', 'wallet'].includes(x.type)) return no(name + ': a bank, cash or an e-wallet');
        const on = p && p.amount === a && !x.confirmed ? p.on : today;
        out.push(Object.assign({ name, amount: a, on }, x.type && x.type !== 'bank' ? { type: x.type } : {}, p && p.payToday && on === p.on ? { payToday: p.payToday } : {}));
      }
      d.banks = out;
      const later = out.filter(b => b.later).map(b => b.name);
      if (later.length && curOf(d) === cur) return { ok: true, draft: d, text: 'Saved: ' + TITLES.banks + '. ' + later.join(' and ') + ': the figure is for later, asked again before I fill anything in' };
    } else if (section === 'pays') {
      const v = list(value) || []; const out = [];
      for (let i = 0; i < v.length; i++) {
        const x = v[i], name = nameOf(x) || (i ? 'Second income' : 'Pay');
        let every = x.every || 'month';
        /* [BV7] a second income: the same amount each time, or saved as no fixed day */
        if (i > 0 && x.same !== true && x.same !== false) return no('Is ' + name + ' the same amount each time? Ask, then save it with same true or false');
        if (i > 0 && x.same === false) every = 'none';
        const a = amountIn(x.amount, cur);
        /* [new foundation 13] what lands in the bank, after tax */
        if (every !== 'none' && x.afterTax !== true) return no('Not saved: ask whether ' + name + ' is before or after tax. I need what lands in the bank, after tax');
        if (every !== 'none' && !a) return no('How much of ' + name + ' lands each time? A plain number');
        const p = { name, amount: every === 'none' ? (a || null) : a, every };
        if (every === 'month' || every === 'days') { if (!dayOk(x.day)) return no('Which day of the month does ' + name + ' land?'); p.day = x.day; }
        if (every === 'days') { if (!(dayOk(x.day2) || x.day2 === 'last')) return no('And the second day ' + name + ' lands?'); p.day2 = x.day2; }
        if (every === 'weeks') { if (!DAY.test(x.start || '')) return no('The day of one ' + name + ', the last or the next (YYYY-MM-DD)'); p.n = Number.isInteger(x.n) && x.n >= 1 && x.n <= 4 ? x.n : 1; p.start = x.start; }
        if (!['month', 'days', 'weeks', 'none'].includes(every)) return no(name + ': every month, days, weeks or none');
        if (every !== 'none' && x.shift) { if (!['before', 'after'].includes(x.shift)) return no(name + ': before or after on a weekend'); p.shift = x.shift; }
        if (x.bank) p.bank = clean(x.bank, 60);
        out.push(p);
      }
      d.pays = out;
    } else if (section === 'cards') {
      const v = list(value) || []; const out = [];
      for (const x of v) {
        const name = nameOf(x), a = amountIn(x.owed, cur, true), p = prev('cards', name);
        if (!name) return no('Each card needs a name');
        if (a === undefined || a === null) return no("What's on " + name + ' right now? A plain number, 0 if nothing');
        if (!dayOk(x.payDay)) return no('Which day is ' + name + ' paid?');
        const cd = x.closeDay == null ? 'not sure' : x.closeDay;
        if (!(cd === 'not sure' || cd === 'last' || dayOk(cd))) return no(name + ': the close day is a day, "last" or "not sure"');
        const on = p && p.owed === a && !x.confirmed ? p.on : today;
        out.push(Object.assign({ name, owed: a, on, payDay: x.payDay, closeDay: cd }, x.shift && ['before', 'after'].includes(x.shift) ? { shift: x.shift } : {},
          x.payFrom ? { payFrom: clean(x.payFrom, 60) } : {}, p && p.statement ? { statement: p.statement } : {}));
      }
      d.cards = out;
    } else if (section === 'bills') {
      const v = list(value) || []; const out = [];
      for (const x of v) {
        const name = nameOf(x), a = amountIn(x.amount, cur), p = prev('bills', name);
        if (!name) return no('Each bill needs a name');
        if (!a) return no('How much is ' + name + '? A plain number');
        if (!dayOk(x.day)) return no('Which day does ' + name + ' come out?');
        const b = { name, amount: a, day: x.day };
        if (x.every === 'year') { if (!(Number.isInteger(x.month) && x.month >= 1 && x.month <= 12)) return no('Which month does ' + name + ' come out?'); b.every = 'year'; b.month = x.month; }
        if (x.from) b.from = clean(x.from, 60);
        if (p && p.out) b.out = p.out;
        out.push(b);
      }
      d.bills = out;
    } else if (section === 'asked' || section === 'statements') {
      const v = list(value); if (!v) return no('A list of answers');
      let q; try { q = ANS.questions(d, { day: today }); } catch (e) { return no(e.message); }
      for (const x of v) {
        const sec = section === 'asked' ? 'bills' : 'cards', item = prev(sec, x.name);
        if (!item) return no('There is no ' + (section === 'asked' ? 'bill' : 'card') + ' called ' + x.name);
        if (section === 'asked') {
          const days = q.asked[ANS.keyOf('bills', item.name)];
          if (!days) return no(item.name + ' was not due since the last pay: nothing to ask');
          if (typeof x.out !== 'boolean') return no('Has ' + item.name + ' come out already? true or false');
          item.out = { out: x.out, days };
        } else {
          const g = q.statements[ANS.keyOf('cards', item.name)];
          if (!g) return no(item.name + ' is not between its close and its payment: nothing to ask');
          const a = x.amount === 'not sure' ? 'not sure' : amountIn(x.amount, cur, true);
          if (a === undefined || a === null) return no('How much of ' + item.name + ' was on the statement? A number or "not sure"');
          item.statement = { a, closed: g.closed };
        }
      }
    } else if (section === 'payToday') {
      if (!value || typeof value.landed !== 'boolean') return no('Has today\'s pay landed in that figure? landed true or false');
      if (!d.banks.length) return no('Save the bank first');
      d.banks.forEach(b => { b.payToday = { landed: value.landed, day: today }; });
    } else if (section === 'free' || section === 'min') {
      const a = amountIn(value, cur, section === 'free');
      if (a === undefined) return no('A plain number, or null to leave it blank');
      d[section] = a;
    } else return no('No such section: ' + String(section).slice(0, 20));
    if (curOf(d) !== cur) {   // the currency the amounts are read in changed (by the currency answer, or by the country before it)
      const n = dropAmounts(d);
      if (n) return { ok: true, draft: d, text: 'Saved: ' + TITLES[section] + '. The amounts from before were typed before the currency was known, so each is asked again' };
    }
    return { ok: true, draft: d, text: 'Saved: ' + TITLES[section] };
  }
  /* the amounts typed before the currency they are read in changed: dropped, asked again (never converted); keep: the
     sections whose amounts came in the new currency */
  function dropAmounts(d, keep) {
    let n = 0;
    if (!(keep && keep.banks)) for (const b of d.banks) if (b.amount != null) { b.amount = null; b.on = null; delete b.payToday; n++; }
    for (const c of d.cards) if (c.owed != null) { c.owed = null; c.on = null; delete c.statement; n++; }
    for (const x of d.pays) if (x.amount != null) { x.amount = null; n++; }
    for (const x of d.bills) if (x.amount != null) { x.amount = null; n++; }
    for (const k of ['free', 'min']) if (d[k] != null) { delete d[k]; n++; }
    return n;
  }
  /* ---- [qc-assistant run 4, fix B] the setup screens' sections and the chat's draft: one set of answers before the book
     exists. A section's Save on the screens writes that section's answers (ANSWERS3.fromForm, amounts in minor units,
     never read as typed) into the draft; its Undo puts the draft back; the newest answer wins both ways. state.screens
     holds, per section, what the screens' last Save wrote (the stamp) ---- */
  const SCREEN_SECS = { bank: ['country', 'currency', 'banks'], pay: ['pays'], free: ['free'], cards: ['cards'], bills: ['bills'], min: ['min'] };
  const secJson = (d, sec) => JSON.stringify(SCREEN_SECS[sec].map(k => (d && d[k] !== undefined ? d[k] : null)));   // null and missing are one answer
  function fromScreens(state0, sec, ans) {
    const state = clone(state0) || {}, keys = SCREEN_SECS[sec];
    if (state.fill || !keys || !ans) return { state, before: null, wrote: null };
    const before = state.draft ? clone(state.draft) : null, d = state.draft || emptyDraft(), curWas = curOf(d);
    if (sec === 'bank') {
      /* [qc-foundation 1] an account renamed in place (the same row) is renamed where the pays, cards and bills name it */
      const ren = {};
      (ans.banks || []).forEach((b, i) => { const o = d.banks[i]; if (o && ANS.keyOf('banks', o.name) !== ANS.keyOf('banks', b.name)) ren[ANS.keyOf('banks', o.name)] = b.name; });
      const to = n => (n != null && ren[ANS.keyOf('banks', n)]) || n;
      d.pays.forEach(p => { if (p.bank) p.bank = to(p.bank); });
      d.cards.forEach(c => { if (c.payFrom) c.payFrom = to(c.payFrom); });
      d.bills.forEach(b => { if (b.from) b.from = to(b.from); });
    }
    for (const k of keys) { if (ans[k] === undefined) delete d[k]; else d[k] = clone(ans[k]); }
    if (curOf(d) !== curWas) dropAmounts(d, { banks: true });
    state.draft = d;
    state.screens = Object.assign({}, state.screens, { [sec]: secJson(d, sec) });
    return { state, before, wrote: JSON.stringify(d) };
  }
  function undoScreens(state0, sec, before, wrote) {
    const state = clone(state0), keys = SCREEN_SECS[sec];
    if (state.fill || !keys || wrote == null) return { state, ok: false, text: state.fill ? 'Setup is done. Change it on the screens or ask me' : 'Nothing to undo' };
    if (JSON.stringify(state.draft) === wrote) state.draft = clone(before);
    else if (state.draft && state.screens && secJson(state.draft, sec) === state.screens[sec]) {
      const was = before || emptyDraft();
      for (const k of keys) { if (was[k] === undefined) delete state.draft[k]; else state.draft[k] = clone(was[k]); }
    } else return { state, ok: true };   // the chat changed that section since: its newer answer stays
    state.screens = Object.assign({}, state.screens, { [sec]: secJson(state.draft, sec) });
    return { state, ok: true };
  }
  function chatNewer(state, sec) {
    const d = state && state.draft, keys = SCREEN_SECS[sec];
    if (!d || !keys) return false;
    const holds = sec === 'bank' ? (d.banks || []).length > 0 : Array.isArray(d[keys[0]]) ? d[keys[0]].length > 0 : d[keys[0]] != null;
    return holds && (!state.screens || state.screens[sec] !== secJson(d, sec));
  }
  /* the draft in plain lines (what is sent, and the draft card) */
  function draftLines(d) {
    const cur = curOf(d), m = a => (a == null ? 'blank' : SM.format(a, cur)), out = [];
    out.push({ key: 'country', title: TITLES.country, lines: d.country ? [{ JP: 'Japan', PH: 'The Philippines', XX: 'Somewhere else (weekends only)' }[d.country]] : [] });
    out.push({ key: 'currency', title: TITLES.currency, lines: d.currency ? [{ JPY: 'Yen', PHP: 'Philippine pesos', USD: 'US dollars', EUR: 'Euros' }[d.currency]] : [] });
    const again = 'asked again';
    out.push({ key: 'banks', title: TITLES.banks, lines: d.banks.map(b => b.amount == null ? `${b.name}: ${b.later ? 'for later' : again}` : `${b.name}: ${m(b.amount)} on ${day1(b.on)}` + (b.payToday ? `, today's pay ${b.payToday.landed ? 'already in it' : 'not in it yet'}` : '')) });
    out.push({ key: 'pays', title: TITLES.pays, lines: d.pays.map(p => `${p.name}: ${p.amount == null ? (p.every === 'none' ? 'no fixed amount' : 'amount ' + again) : m(p.amount) + ' after tax'}, ${p.every === 'none' ? 'no fixed day' : p.every === 'weeks' ? 'every ' + (p.n > 1 ? p.n + ' weeks' : 'week') + ' from ' + day1(p.start) : 'on day ' + p.day + (p.day2 ? ' and ' + p.day2 : '') + ' each month'}` + (p.every !== 'none' ? `, a weekend or holiday: the working day ${p.shift || 'before'}` : '')) });
    out.push({ key: 'cards', title: TITLES.cards, lines: d.cards.map(c => `${c.name}: ${c.owed == null ? again : m(c.owed) + ' on ' + day1(c.on)}, paid on day ${c.payDay}, statement closes ${c.closeDay === 'not sure' ? 'not sure' : c.closeDay === 'last' ? 'the last day' : 'day ' + c.closeDay}` + (c.statement ? `, ${c.statement.a === 'not sure' ? 'all of it' : m(c.statement.a)} on the statement of ${day1(c.statement.closed)}` : '')) });
    out.push({ key: 'bills', title: TITLES.bills, lines: d.bills.map(b => `${b.name}: ${b.amount == null ? 'amount ' + again : m(b.amount)} on day ${b.day}${b.every === 'year' ? ' of month ' + b.month : ' each month'}` + (b.out ? `, the one of ${b.out.days.map(day1).join(' and ')} ${b.out.out ? 'already out' : 'not out yet'}` : '')) });
    out.push({ key: 'free', title: TITLES.free, lines: d.free === undefined ? [] : [m(d.free) + (d.free != null ? ' each pay period' : '')] });
    out.push({ key: 'min', title: TITLES.min, lines: d.min === undefined ? [] : [d.min == null ? 'no minimum' : m(d.min)] });
    return out;
  }
  function draftCard(d, today) {
    const draft = d || emptyDraft(), need = ANS.need(draft, { day: today });
    return { kind: 'draft', sections: draftLines(draft), need, ready: !need.length };
  }
  /* [BV4, BV3, BV2.8, BV2.9] the fill: only on a device with no book, and only with every answer for this very day */
  function fillCheck(d, today, mode) {
    if (mode && mode !== 'none') return { ok: false, need: [mode === 'try' ? 'This is the made-up book. Leave it first' : 'There is already a book on this device'] };
    if (!d) return { ok: false, need: ['Nothing is in the draft yet'] };
    const need = ANS.need(d, { day: today });
    return need.length ? { ok: false, need } : { ok: true, answers: d };
  }

  /* ---- what is sent ---- */
  function stateText(state, ctx) {
    const book = ctx.book, out = ['FIGURES (worked out by the app for today, exact)', figures(book, ctx.today).text];
    if (ctx.screen && SCREENS[ctx.screen]) {
      const sc = SCREENS[ctx.screen], sh = ctx.sheet && SCREENS[ctx.sheet.key], title = sh && clean(ctx.sheet.title || sh.name, 60);
      out.push('', 'SCREEN: the person has ' + sc.name + ' open' + (sh ? `, with the sheet "${title}"${title !== sh.name ? ' (' + sh.name + ')' : ''} on top. ${sh.does}` : '. ' + sc.does));
    }
    const pw = book && state.payWith && (book.accounts || []).find(x => x.id === state.payWith && live(x));
    if (pw) out.push('', 'They said they pay with ' + pw.name + ': a spend with no account named goes on it, unless they say otherwise.');
    if (!book) {
      const d = state.draft || emptyDraft(), card = draftCard(d, ctx.today);
      out.push('', 'DRAFT (saved on this device, not in the app yet). Today is ' + SN.dayLabel(ctx.today, true) + '. Currency: ' + curOf(d) + '.');
      for (const s of card.sections) out.push(s.title + ': ' + (s.lines.length ? s.lines.join('; ') : 'not asked yet'));
      out.push('NEEDED before fill_book: ' + (card.need.length ? card.need.join(' ') : 'nothing. Show the draft and ask whether to fill it in.'));
      /* [AI_JOIN_FIXES H2] the first screen asked the first question before anything was typed */
      if (state.turns.filter(t => t.who === 'person').length <= 1 && !state.turns.some(t => t.who === 'ai'))
        out.push('', 'The first screen already showed the welcome and asked: ' + GUIDE[2].ask + ' Their first message answers that, or asks something first. Do not greet again.');
    }
    return out.join('\n');
  }
  function request(state, message, rounds, ctx) {
    const hist = state.turns.filter(t => t.who === 'person' || t.who === 'ai');
    const past = hist.slice(0, hist.length - 1).slice(-TURNS), messages = [];
    const push = (role, text) => { const last = messages[messages.length - 1]; if (last && last.role === role) last.content[0].text += '\n\n' + text; else messages.push({ role, content: [{ type: 'text', text }] }); };
    /* [qc-foundation on CONFUSING1_PLAN, 3] its own words from a turn where nothing was done are sent with that said */
    for (const t of past) push(t.who === 'person' ? 'user' : 'assistant', (t.text || '(a card)') + (t.notDone ? ' (the app did not do this: nothing changed)' : ''));
    if (messages.length && messages[0].role === 'assistant') messages.shift();
    const now = stateText(state, ctx);
    const first = (rounds || []).length ? 'THE PERSON SAYS\n' + message : now + '\n\nTHE PERSON SAYS\n' + message;
    push('user', first);
    (rounds || []).forEach((r, i) => {
      messages.push({ role: 'assistant', content: r.content });
      const res = r.results.slice();
      if (i === rounds.length - 1) res.push({ type: 'text', text: now });   // [BU2] fresh figures and the draft every round
      messages.push({ role: 'user', content: res });
    });
    return { v: 1, anon: ctx.anon, invite: ctx.invite || '', tier: 'default', max_tokens: MAX_TOKENS, effort: 'low', system: SYSTEM,
      tools: TOOLS, tool_choice: { type: 'auto' }, messages };
  }
  function read(res) {
    const content = (res && Array.isArray(res.content)) ? res.content : [];
    const words = clean(content.filter(b => b && b.type === 'text').map(b => b.text).join('\n') || (res && typeof res.text === 'string' && !content.length ? res.text : ''), 1500);
    const calls = content.filter(b => b && b.type === 'tool_use' && typeof b.name === 'string').map(b => ({ id: String(b.id), name: b.name, input: b.input && typeof b.input === 'object' ? b.input : {} }));
    return { words, calls, content: content.filter(b => b && (b.type === 'text' || b.type === 'tool_use')).map(b => b.type === 'text' ? { type: 'text', text: b.text } : { type: 'tool_use', id: String(b.id), name: b.name, input: b.input || {} }) };
  }
  function sentText(state, message, deps) {
    const body = request(state, message, [], ctxOf(deps));
    return body.system + '\n\n' + body.messages.map(m => (m.role === 'user' ? 'YOU\n' : 'THE AI\n') + m.content.map(c => c.text || '').join('\n')).join('\n\n');
  }
  const ctxOf = deps => ({ book: deps.book ? deps.book() : null, today: deps.today(), anon: deps.anon, invite: deps.invite, screen: deps.screen ? deps.screen() : null, sheet: deps.sheet ? deps.sheet() : null });

  /* ---- the explain topics (help words where they exist; drafts for Mako's copy pass) ---- */
  const EXPLAIN = {
    cards: 'A card is paid in full from your bank on its payment day. What you spend on it comes out of the bank then, so safe to spend takes off what is due before your next pay.',
    free: 'Free to spend is what you keep for food and everyday things each pay period. Safe to spend leaves room for it until each pay.',
    goals: 'A goal is money you set aside for something. It stays in your bank, marked as set aside, or in its own account.',
    check: 'Check your bank: type what your bank app shows today. The app compares it with what it expected and asks about the gap.',
    undo: 'Every change I make shows what changed and has Undo. A delete, or a change larger than safe to spend, waits for your OK first.',
    setup: 'I ask about your bank today, your pay, cards and bills. What you say stays on this phone as a draft until you say fill it in. Then the screens show it all for checking.',
    sent: 'Sent to the AI when you send a message: your message, the last 10 messages, today\'s figures with account, bill and income names, and the setup draft. Never sent: record ids, notes, shop names or single spends, the backup, the cloud copy\'s key, or Settings.',
  };
  function explain(topic) {
    if (EXPLAIN[topic]) return EXPLAIN[topic];
    try { return HELP.words(topic, {}).join(' '); } catch (e) { return 'No words for that yet.'; }
  }
  function list(book, today, x) {
    if (!book) return 'There is no book yet. The draft comes with every message.';
    const refs = allRefs(book, today), r = LA.lookahead(book, today), home = G.homeOn(book, today), m = (a, c) => SM.format(a, c || home);
    const back = id => Object.keys(refs).find(k => refs[k] === id);
    const what = x.what;
    if (what === 'spends') {
      const acct = refs[x.account];
      if (!acct || !String(x.account).startsWith('A')) return 'Which account? An A ref from FIGURES.';
      const ev = (book.events || []).filter(e => live(e) && e.acct === acct && (e.k === 'spend' || e.k === 'in') && e.src && e.src.type === 'typed' && e.date <= today).slice(-30);
      /* [BV6] amounts and dates only: never a note or a shop */
      return ev.length ? 'ref | date | amount | kind | line\n' + ev.map(e => `${back(e.id)} | ${day1(e.date)} | ${m(e.a)} | ${e.k === 'in' ? 'in' : 'spend'} | ${e.line === 'free' ? 'Free to spend' : back(e.line) || ''}`).join('\n') : 'No spends logged on that account yet.';
    }
    if (what === 'accounts' || what === 'cards') {
      const as = (book.accounts || []).filter(a => live(a) && !a.closed && (what === 'cards' ? a.type === 'card' : a.type !== 'card'));
      return as.map(a => `${back(a.id) || '-'} | ${a.name} | ${a.type} | ` + (a.type === 'card' ? (r.cards[a.id] ? m(r.cards[a.id].owedNow) + ' owed, paid on day ' + a.payDay : '') : r.accounts[a.id] ? m(r.accounts[a.id].bank) + ' today' : '')).join('\n') || 'None.';
    }
    if (what === 'pays' || what === 'bills') return figures(book, today).text.split('Pays and bills (ref | name | amount | when):\n')[1]?.split('\n').filter(l => l.startsWith(what === 'pays' ? 'P' : 'B')).join('\n') || 'None.';
    if (what === 'lines') return ((r.period && r.period.lines) || []).map(l => `${back(l.id)} | ${l.name} | ${m(l.amount)} each pay | ${m(l.left)} left`).join('\n') || 'None.';
    if (what === 'goals') return (book.places || []).filter(g => live(g) && g.kind === 'goal').map(g => `${back(g.id)} | ${g.name} | ${m((r.places[g.id] || {}).kept || 0)} set aside of ${m(g.target)}`).join('\n') || 'None.';
    return 'Pick accounts, pays, bills, cards, lines, goals or spends.';
  }

  /* ---- change: named steps through act3 (BW) ---- */
  const DELETES = { remove: 1, end_bill: 1, end_line: 1 };
  /* one step from the AI into { kind, args, text, amount, ask? } or { bad: words } */
  function stepOf(a, ctx) {
    const { book, today, refs } = ctx, home = G.homeOn(book, today), m = (x, c) => SM.format(x, c || home);
    const what = a && typeof a === 'object' ? String(a.do || '') : '';
    const ref = (v, letters) => (typeof v === 'string' && letters.includes(v.charAt(0)) && refs[v] ? refs[v] : null);
    const acctRec = id => (book.accounts || []).find(x => x.id === id);
    const mainAcct = (G.fieldValue((book.home || {}).main) || {}).acct;
    const acctOr = v => (v == null || v === '' ? mainAcct : ref(v, 'A'));
    const amt = (v, cur, zero) => amountIn(v, cur || home, zero);
    const date = v => (v == null || v === '' ? today : DAY.test(String(v)) && v <= today ? v : null);
    const when = (v) => (['now', 'next', 'once'].includes(v) ? v : 'now');
    const nm = id => (acctRec(id) || {}).name;
    const lineOf = v => (v == null || v === '' ? 'free' : ref(v, 'L'));
    const lineName = id => (id === 'free' ? 'Free to spend' : (((book.plan || {}).budgets || []).find(l => l.id === id) || {}).name);
    const schName = id => ((book.schedules || []).find(s => s.id === id) || {}).name;
    const note = v => (typeof v === 'string' && v.trim() ? clean(v, 60) : undefined);
    const on = d => (d === today ? 'today' : day1(d));
    /* [qc-foundation confirm 3; M45, M37] what the app expects, landed: a tick through the check-in writer */
    if (what === 'landed') {
      const id = ref(a.ref, 'PBA');
      if (!id || (String(a.ref).charAt(0) === 'A' && (acctRec(id) || {}).type !== 'card')) return { bad: 'a landed step for a ref I do not know' };
      const due = (LA.lookahead(book, today).checkIn.toConfirm || []).filter(o => { const oc = IDS.occurrence(o.item); return oc && oc.schedule === id; });
      const o = (a.date ? due.filter(x => x.lands === a.date) : due.filter(x => x.lands <= today)).slice(-1)[0] || due[0];
      if (!o) return { bad: 'nothing from ' + (schName(id) || nm(id)) + ' is expected now' };
      const x = a.amount != null ? amt(a.amount, (acctRec(o.account) || {}).cur) : o.amount;
      const d = a.date != null ? date(a.date) : null;
      if (!x || (a.date != null && !d)) return { bad: 'a landed step I could not read' };
      const s = (book.schedules || []).find(y => y.id === id), inc = s && s.kind === 'income';
      const ci = { ticked: [o.item], expected: { [o.item]: o.amount }, lands: { [o.item]: o.lands } };
      if (x !== o.amount) ci.amounts = { [o.item]: x };
      if (d) ci.landed = { [o.item]: d };
      return { kind: 'checkIn', ci, text: `${schName(id) || nm(id)} of ${day1(o.lands)} landed: ${m(x)} ${inc ? 'in' : 'from'} ${nm(o.account)}`, amount: 0, figs: a.amount != null ? [x] : [] };
    }
    if (what === 'bank_figure' || what === 'card_figure') {
      const id = ref(a.account, 'A'), rec = id && acctRec(id), card = what === 'card_figure';
      if (!rec || (rec.type === 'card') !== card) return { bad: 'a ' + (card ? 'card' : 'bank') + ' figure for an account I do not know' };
      const x = amt(a.amount, rec.cur, true);
      if (x == null) return { bad: 'a figure I could not read' };
      /* [qc-foundation on the AI-first candidate, F1; M36, M37, M45] like Check your bank: what the app expected on this
         account by today is listed and ticked (a later tick could only land after this figure, BI1), except what the
         person said has not gone through yet (not: its refs). The card asks first, naming each */
      const notIds = new Set((Array.isArray(a.not) ? a.not : []).map(r => ref(r, 'PBA')).filter(Boolean));
      const due = (LA.lookahead(book, today).checkIn.toConfirm || []).filter(o => o.account === id && o.lands <= today);
      const schOf = o => (IDS.occurrence(o.item) || {}).schedule;
      const tick = due.filter(o => !notIds.has(schOf(o))), wait = due.filter(o => notIds.has(schOf(o)));
      const ci = { figures: { [id]: x } };
      if (due.length) Object.assign(ci, { ticked: tick.map(o => o.item), expected: Object.fromEntries(due.map(o => [o.item, o.amount])), lands: Object.fromEntries(due.map(o => [o.item, o.lands])) });
      const occ = o => `${schName(schOf(o)) || nm(schOf(o)) || 'a payment'} ${day1(o.lands)} ${m(o.amount, rec.cur)}`;
      const also = (tick.length ? `. Already through, so ticked: ${tick.map(occ).join(', ')}` : '') + (wait.length ? `. Not through yet, still expected: ${wait.map(occ).join(', ')}` : '');
      return { kind: 'checkIn', ci, text: `${rec.name} shows ${m(x, rec.cur)} today${also}`, amount: 0, figs: [x], ticks: tick.length };
    }
    /* [AI_JOIN_FIXES H6; M30] a spend with no account named while there are cards: the account the person named for
       this chat, else asked once ("card or bank?"), never the main bank unasked */
    if (what === 'log_spend' && (a.account == null || a.account === '')) {
      if (ctx.payWith && acctRec(ctx.payWith) && !acctRec(ctx.payWith).gone) a = Object.assign({}, a, { account: Object.keys(refs).find(k => refs[k] === ctx.payWith) });
      else {
        const own = (book.accounts || []).filter(x => live(x) && !x.closed), cards = own.filter(x => x.type === 'card');
        if (cards.length) {
          const names = cards.concat(own.filter(x => x.type !== 'card' && x.type !== 'loan')).map(x => x.name);
          return { bad: 'which account paid for it. Ask once, in one question naming them: "Card or bank? ' + names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1] + '". Then change again with that account; the answer is kept for this chat', payWith: true };
        }
      }
    }
    if (what === 'log_spend' || what === 'refund' || what === 'money_in') {
      const acct = acctOr(a.account), cur = acct && (acctRec(acct) || {}).cur, x = amt(a.amount, cur), d = date(a.date);
      const line = what === 'money_in' ? null : lineOf(a.line);
      if (!acct || !x || !d || (what !== 'money_in' && !line)) return { bad: 'a ' + what.replace('_', ' ') + ' I could not read' };
      const args = { date: d, a: x, acct }; if (line && (what === 'log_spend' || a.line)) args.line = line; const n = note(a.note); if (n) args.note = n;
      const kind = { log_spend: 'logSpend', refund: 'refund', money_in: 'moneyIn' }[what];
      const text = what === 'log_spend' ? `Log ${m(x, cur)} on ${lineName(line)} from ${nm(acct)}, ${on(d)}` : what === 'refund' ? `Log ${m(x, cur)} back into ${nm(acct)}, ${on(d)}` : `Log ${m(x, cur)} in to ${nm(acct)}, ${on(d)}`;
      return { kind, args: [args], text: text + (n ? ' (' + n + ')' : ''), amount: x, ref: line && line !== 'free' ? a.line : null, named: what === 'log_spend' && a.account != null && a.account !== '' ? acct : null };
    }
    if (what === 'move_money') {
      const from = ref(a.from, 'A'), to = ref(a.to, 'A'), x = amt(a.amount), d = date(a.date);
      if (!from || !to || !x || !d) return { bad: 'a move I could not read' };
      return { kind: 'moveMoney', args: [{ date: d, a: x, from, to }], text: `Move ${m(x)} from ${nm(from)} to ${nm(to)}, ${on(d)}`, amount: x };
    }
    /* [qc-controls run 1 blocker 6] a pay or a goal cannot be removed anywhere in the app yet: said plainly, with where
       it can be changed (Plan, tap it), never "a ref I do not know" */
    if (what === 'remove' && /^[PG]\d/.test(String(a.ref || ''))) {
      const which = String(a.ref).charAt(0) === 'P' ? 'a pay' : 'a goal';
      return { bad: 'remove takes an S, B or L ref: ' + which + ' cannot be removed in this app yet. Say so, and that it can be changed on Plan', left: 'removing ' + which + ', which the app cannot do yet. You can change it on Plan: tap it' };
    }
    if (what === 'remove' || what === 'end_bill' || what === 'end_line') {
      const id = ref(a.ref, what === 'end_line' ? 'L' : what === 'end_bill' ? 'BP' : 'SBL');
      if (!id) return { bad: 'a ' + what.replace('_', ' ') + ' for a ref I do not know' };
      const c = String(a.ref).charAt(0);
      if (c === 'S') { const e = (book.events || []).find(x => x.id === id); return { kind: 'remove', args: [id], text: `Remove the ${e.k === 'in' ? 'money in' : 'spend'} of ${m(e.a)} on ${day1(e.date)}`, del: true }; }
      if (c === 'L') return { kind: 'endLine', args: [id], text: `End ${lineName(id)} from today`, del: true };
      return { kind: 'endBill', args: [id, {}], text: `End ${schName(id)} from today`, del: true };
    }
    if (what === 'add_bill') {
      const x = amt(a.amount), acct = acctOr(a.account), every = a.every || 'month';
      if (!x || !acct || !a.name || !['month', 'year', 'months'].includes(every) || (every !== 'months' && !dayOk(a.day))) return { bad: 'a bill I could not read' };
      const args = { name: clean(a.name, 60), amount: x, day: a.day, acct, every };
      if (every === 'year') args.month = a.month;
      if (every === 'months') { args.n = a.n; args.start = a.start; }
      const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const when = every === 'year' ? `once a year on ${a.day} ${MONTHS[Number(a.month) - 1] || '?'}` : every === 'months' ? `every ${a.n} months from ${DAY.test(a.start || '') ? day1(a.start) : '?'}` : `on day ${a.day} each month`;
      return { kind: 'addBill', args: [args], text: `Add ${args.name}: ${m(x)} ${when}, from ${nm(acct)}`, amount: x };
    }
    if (what === 'change_bill') {
      const id = ref(a.ref, 'BP'); if (!id) return { bad: 'a change to a bill or pay I do not know' };
      const ch = {}; if (a.amount != null) { ch.amount = amt(a.amount); if (!ch.amount) return { bad: 'an amount I could not read' }; }
      if (a.day != null) ch.day = a.day; if (a.every) { ch.every = a.every; ch.day2 = a.day2; ch.start = a.start; } if (a.name) ch.name = clean(a.name, 60);
      if (a.account) { ch.acct = ref(a.account, 'A'); if (!ch.acct) return { bad: 'a bill paid from an account I do not know' }; }   // [E1b, M13] its paying account
      return { kind: 'changeBill', args: [id, ch], text: `${schName(id)}: ` + [ch.amount ? m(ch.amount) : '', ch.day ? 'on day ' + ch.day : '', ch.every ? ch.every : '', ch.name ? 'called ' + ch.name : '', ch.acct ? 'paid from ' + nm(ch.acct) : ''].filter(Boolean).join(', ') + ' from its next one', amount: ch.amount || 0, figs: ch.amount ? [ch.amount] : [], ref: a.ref };
    }
    if (what === 'add_pay') {
      const x = a.amount == null ? null : amt(a.amount), acct = acctOr(a.account);
      if (!a.name || !a.every || (a.amount != null && !x)) return { bad: 'a pay I could not read' };
      const args = { name: clean(a.name, 60), amount: x, every: a.every, day: a.day, day2: a.day2, start: a.start, acct };
      return { kind: 'addPay', args: [args], text: `Add ${args.name}: ${x ? m(x) : 'no fixed amount'}, ${a.every === 'none' ? 'no fixed day' : a.every === 'month' ? 'on day ' + a.day + ' each month' : a.every}`, amount: x || 0, figs: x ? [x] : [] };
    }
    if (what === 'add_line') { const x = amt(a.amount); if (!x || !a.name) return { bad: 'a line I could not read' }; return { kind: 'addLine', args: [{ name: clean(a.name, 60), amount: x }], text: `Add a line, ${clean(a.name, 60)}: ${m(x)} each pay period`, amount: x }; }
    if (what === 'change_line') {
      const id = ref(a.ref || a.line, 'L'), x = amt(a.amount, null, true); if (!id || x == null) return { bad: 'a change to a line I could not read' };
      return { kind: 'changeLine', args: [id, { amount: x, when: when(a.when) }], text: `${lineName(id)}: ${m(x)} each pay period`, amount: x, ref: a.ref || a.line };
    }
    if (what === 'set_free') { const x = amt(a.amount, null, true); if (x == null) return { bad: 'Free to spend I could not read' }; return { kind: 'setFree', args: [{ amount: x, when: when(a.when) }], text: `Free to spend: ${m(x)} each pay period`, amount: x }; }
    if (what === 'add_goal') { const x = amt(a.target != null ? a.target : a.amount); if (!x || !a.name) return { bad: 'a goal I could not read' }; return { kind: 'addGoal', args: [{ name: clean(a.name, 60), target: x, due: a.due || undefined }], text: `Add a goal, ${clean(a.name, 60)}: ${m(x)}${a.due ? ' by ' + day1(a.due) : ''}`, amount: 0, figs: [x] }; }
    if (what === 'set_aside') {
      const id = ref(a.goal || a.ref, 'G'), x = amt(a.amount); if (!id || !x) return { bad: 'money for a goal I could not read' };
      return { kind: 'setAside', args: [id, { amount: x }], text: `Set aside ${m(x)} for ${((book.places || []).find(g => g.id === id) || {}).name}, today`, amount: x, ref: a.goal || a.ref };
    }
    if (what === 'add_card') {
      const x = amt(a.owed != null ? a.owed : a.amount, null, true); if (x == null || !a.name || !dayOk(a.payDay)) return { bad: 'a card I could not read' };
      /* [E1b, M23] the account that pays it (the main bank when none is named) and its weekend rule */
      const pf = a.account ? ref(a.account, 'A') : mainAcct; if (!pf) return { bad: 'a card paid from an account I do not know' };
      return { kind: 'addCard', args: [Object.assign({ name: clean(a.name, 60), owed: x, payDay: a.payDay, cutDay: a.closeDay, payFrom: pf }, a.shift ? { shift: a.shift } : {})], text: `Add ${clean(a.name, 60)}: ${m(x)} on it now, paid on day ${a.payDay} from ${nm(pf)}${a.shift === 'before' ? ', the working day before a weekend or holiday' : ''}`, amount: x, figs: [x] };
    }
    if (what === 'add_account') {
      const x = amt(a.amount, null, true); if (x == null || !a.name) return { bad: 'an account I could not read' };
      /* [AI_JOIN_FIXES H7] both of its questions in one go, before anything is tried: new money or moved since that
         bank's last figure, and when that figure is from today, moved before or after they looked */
      const from = a.from ? ref(a.from, 'A') : mainAcct, fromName = nm(from);
      const last = (book.events || []).filter(e => live(e) && e.k === 'check' && !e.stmt && e.acct === from && e.date <= today).map(e => e.date).sort().pop() || today;
      const since = last === today ? 'today' : day1(last), lookedQ = `If it was moved: was it before or after you looked at ${fromName} ${last === today ? 'today' : 'on ' + since}?`;
      const needLooked = last === (a.date || today);
      if (a.moved !== true && a.moved !== false) return { bad: `ask both in one message: "Is this new money, or moved from ${fromName} since ${since}?${needLooked ? ' ' + lookedQ : ''}" Then change again with moved (and afterFigure)` };
      if (a.moved === true && needLooked && typeof a.afterFigure !== 'boolean') return { bad: `ask: "${lookedQ.replace('If it was moved: was', 'Was')}" Then change again with afterFigure` };
      return { kind: 'addAccount', args: [Object.assign({ name: clean(a.name, 60), type: a.type || 'bank', amount: x, moved: a.moved }, a.date ? { date: a.date } : {},
        a.from ? { from: ref(a.from, 'A') || 'none' } : {}, typeof a.afterFigure === 'boolean' ? { afterFigure: a.afterFigure } : {})], text: `Add ${clean(a.name, 60)} with ${m(x)}${a.moved ? ' moved from ' + nm(a.from ? ref(a.from, 'A') : mainAcct) : ''}`, amount: x, figs: [x] };
    }
    /* [E1, M13] a bank, cash or e-wallet renamed, or its own Keep at least set (0 clears it): PLAN3W.changeAccount */
    if (what === 'change_account') {
      const id = ref(a.account || a.ref, 'A'), rec = id && acctRec(id);
      if (!rec || rec.type === 'card' || rec.type === 'loan') return { bad: 'change_account is for a bank, cash or e-wallet. ' + whereOf(rec && rec.type === 'loan' ? 'loan' : 'card') };
      const ch = {}; if (a.name) ch.name = clean(a.name, 60);
      if (a.min !== undefined) { if (a.min === null || a.min === 0 || a.min === '') ch.min = null; else { ch.min = amt(a.min, rec.cur); if (!ch.min) return { bad: 'a Keep at least I could not read' }; } }
      if (!Object.keys(ch).length) return { bad: 'a change to an account with nothing to change' };
      const words = [ch.name ? 'called ' + ch.name : '', ch.min !== undefined ? (ch.min ? 'keep at least ' + m(ch.min, rec.cur) : 'no Keep at least') : ''].filter(Boolean).join(', ');
      return { kind: 'changeAccount', args: [id, ch], text: `${rec.name}: ${words}`, amount: 0, figs: ch.min ? [ch.min] : [] };
    }
    return { bad: what ? 'a change I can\'t make (' + what.slice(0, 30) + '). ' + whereOf(what) : 'a change I could not read' };
  }
  const ACT = { logSpend: 1, refund: 1, moneyIn: 1, moveMoney: 1, remove: 1 };
  function runOne(door, s, opts, deps) {
    if (ACT[s.kind]) return door[s.kind](...s.args, opts);
    if (s.kind === 'checkIn') {
      let out;
      try { out = CK.checkIn(deps.book(), Object.assign({ day: deps.today(), told: deps.told(), newId: deps.newId, unticked: [] }, s.ci)); }
      catch (e) { return Promise.resolve({ ok: false, why: 'bad', text: e.message }); }
      return door.addRecords('Check your bank', out, opts);
    }
    return door.run('Assistant: ' + s.text, w => PW()[s.kind](w, ...s.args), opts);
  }
  /* the engine's figures before and after (minor units) */
  function rowsOf(b0, b1, today, steps) {
    const r0 = LA.lookahead(b0, today), r1 = LA.lookahead(b1, today);
    const rows = [{ key: 'safe', label: SN.label('safeToSpend'), before: r0.safeToSpend.headline, after: r1.safeToSpend.headline }];
    const f0 = r0.period && r0.period.free, f1 = r1.period && r1.period.free;
    if ((f0 || f1) && steps.some(s => s.kind === 'logSpend' || s.kind === 'setFree' || s.kind === 'refund')) rows.push({ key: 'free', label: 'Free to spend left', before: f0 ? f0.left : null, after: f1 ? f1.left : null });
    for (const id of Object.keys(r1.accounts)) {
      const a0 = r0.accounts[id], a1 = r1.accounts[id];
      if (a1 && a1.bank != null && (!a0 || a0.bank !== a1.bank)) rows.push({ key: 'bank:' + id, label: ((b1.accounts || []).find(x => x.id === id) || {}).name + ' today', before: a0 ? a0.bank : null, after: a1.bank });
    }
    /* [qc-assistant run 2; M30] a card whose figure changed shows it: most spending goes on cards, and safe to spend
       alone would read the same before and after. The engine's own cards.owedNow, named as Home names it */
    for (const id of Object.keys(r1.cards || {})) {
      const c0 = (r0.cards || {})[id], c1 = r1.cards[id];
      if (c1 && c1.owedNow != null && (!c0 || c0.owedNow !== c1.owedNow)) rows.push({ key: 'card:' + id, label: ((b1.accounts || []).find(x => x.id === id) || {}).name + ', ' + SN.label('owed').toLowerCase(), before: c0 ? c0.owedNow : null, after: c1.owedNow });
    }
    return rows;
  }
  /* [M30; the coordinator's ruling 26 Nov] a spend on a card that leaves the headline where it was: one true line says
     why, from the engine's own dates (the card's next payment is on or after the next pay, so it is not due before it).
     No day is promised: with a close day not sure, the statement it falls in is not known */
  function noteOf(b0, b1, today) {
    const r0 = LA.lookahead(b0, today), r1 = LA.lookahead(b1, today), pay = (r1.daysToNextPay || {}).next_pay;
    if (!pay || r0.safeToSpend.headline !== r1.safeToSpend.headline) return null;
    const ids = Object.keys(r1.cards || {}).filter(id => { const c0 = (r0.cards || {})[id], c1 = r1.cards[id]; return c0 && c1.owedNow > c0.owedNow && c1.next && c1.next.payment_date && c1.next.payment_date >= pay; });
    if (!ids.length) return null;
    const names = ids.map(id => ((b1.accounts || []).find(x => x.id === id) || {}).name);
    return `${SN.label('safeToSpend')} stays the same: ${names.join(' and ')} ${names.length > 1 ? 'are' : 'is'} paid from your bank on or after your next pay`;
  }
  async function carryOut(state, card, deps) {
    const door = deps.door, before = deps.book(), today = deps.today(), done = [];
    /* [STALE_SHEET_PLAN, M61] the card was made on the book as it was then (card.ver, the door's short mark: no figures in
       it). If anything changed somewhere else since, the door refuses and nothing is carried out. After each of the
       card's own steps the mark is taken again, so its own steps never refuse each other */
    const marks = typeof door.ver === 'function' && card.ver != null;
    let mark = marks ? card.ver : undefined;
    for (const s of card.plan) {
      const res = await runOne(door, s, marks ? { quiet: true, ver: mark } : { quiet: true }, deps);
      if (res.ok && marks) mark = door.ver();
      if (!res.ok) {
        for (const st of done.slice().reverse()) await door.undo(st.id, { quiet: true });
        card.status = 'refused'; card.why = s.text + ': ' + res.text;
        return { ok: false, text: card.why };
      }
      done.push(res.step);
    }
    card.status = 'done'; card.steps = done.map(s => s.id); card.rows = rowsOf(before, deps.book(), today, card.plan); card.note = noteOf(before, deps.book(), today);
    return { ok: true };
  }
  const resultOf = card => card.status === 'done' ? 'Done, with Undo on the card. ' + card.rows.map(r => `${r.label}: ${r.before == null ? '-' : r.before} to ${r.after == null ? '-' : r.after} (minor units)`).join('; ')
    : card.status === 'ask' ? 'Waiting for the person\'s OK: ' + card.why : 'Not changed: ' + card.why;

  /* [AI_JOIN_FIXES H5] each bank figure step whose gap (the engine's filler on the book the check would make) is larger
     than safe to spend: Map step -> the gap in words. Comparisons only; every figure is the engine's */
  function farFigures(plan, book, today, deps, safe) {
    const far = new Map(), home = G.homeOn(book, today), m = (x, c) => SM.format(x, c || home);
    if (!deps.door || typeof deps.door.dry !== 'function') return far;
    const r0 = LA.lookahead(book, today);
    for (const s of plan) {
      if (s.kind !== 'checkIn' || !s.ci.figures) continue;
      let r1;
      try {
        const out = CK.checkIn(book, Object.assign({ day: today, told: deps.told(), newId: deps.newId, unticked: [] }, s.ci));
        r1 = LA.lookahead(deps.door.dry('addRecords', 'Check your bank', out), today);
      } catch (e) { continue; }
      for (const id of Object.keys(s.ci.figures)) {
        const a = r1.accounts[id], f = a && (a.fillers || []).slice(-1)[0], was = r0.accounts[id];
        if (!f || f.to !== today || !was) continue;
        const cur = ((book.accounts || []).find(x => x.id === id) || {}).cur;
        if (f.gain > 0 && f.gain > safe) far.set(s, `The app expected ${m(was.bank, cur)}: ${m(f.gain, cur)} more than it had`);
        else if (f.amount > 0 && f.amount > safe) far.set(s, `The app expected ${m(was.bank, cur)}: ${m(f.amount, cur)} less than it had`);
      }
    }
    return far;
  }
  /* ---- [M6, ruled 26 Nov 2026] which amounts the person typed ----
     An amount counts as typed by the person only if it is in their own messages since the assistant's last written
     change (state.typedFrom: the turn count when the first message after that change came in), and each time a written
     change uses an amount, one typing of it is used up (state.used). So "another lunch" never writes an old amount
     again without a question, and an answer to "from when?" still counts the amount typed just before. */
  const plainOf = (book, today) => a => SM.format(a, G.homeOn(book, today)).replace(/[^\d.]/g, '').replace(/\.0+$/, '');
  const figsOf = s => (s.figs || (s.amount ? [s.amount] : []));
  function typedFrom(state) {
    if (state.typedFrom != null) return state.typedFrom;
    /* a chat saved before this rule: from the last change the assistant made */
    const last = state.turns.filter(t => t.who === 'card' && t.card && t.card.status === 'done').slice(-1)[0];
    return last ? +String(last.id).slice(1) : 0;
  }
  function typedLeft(state) {
    const from = typedFrom(state);
    const text = state.turns.filter(t => t.who === 'person' && +String(t.id).slice(1) > from).slice(-TURNS).map(t => t.text).join(' ').normalize('NFKC').replace(/[,，]/g, '');
    return f => (text.match(new RegExp('(^|[^\\d.])' + f.replace('.', '\\.') + '(?![\\d])', 'g')) || []).length - (state.used || []).filter(u => u === f).length;
  }
  function wrote(state, card, book, today) {
    const plain = plainOf(book, today);
    state.typedFrom = typedFrom(state);
    state.used = (state.used || []).concat(...card.plan.map(s => figsOf(s).map(plain)));
    state.wrote = true;
  }
  /* [CONFUSING 1, coordinator 16's ruling b] what a turn did: a refused step tells the person in a note; a turn where
     steps were refused and nothing was written or asked marks the AI's words as not done (never changed or hidden) */
  /* [TABSETUP_PLAN 4] the fill found a book another tab made: the same words as the setup screens */
  const OTHER_TAB = 'Your money was set up in another tab, so this tab shows it now. What you typed here was not saved';
  const DONE_WORDS = 'The app did not do this: nothing changed';
  function refused(frame, state, shown, deps, text) {
    if (frame) frame.refused++;
    addTurn(state, { who: 'note', text, at: deps.told() }, shown);
  }
  function did(frame) { if (frame) frame.did = true; }
  /* [qc-foundation on CONFUSING1_PLAN, 1 and 2] the chat's own book: a book that still holds a record written at the
     chat's fill. Any other book was made on the screens (or elsewhere). Nothing about it is saved: it is worked out from
     the book each time, so a book that goes away opens the setup answers again */
  function ownBook(state, book) {
    if (!book || !state.fill) return false;
    const recs = [].concat(book.accounts || [], book.schedules || [], book.events || [], book.checkins || [], book.places || []);
    return recs.some(r => r && r.at === state.fill.told);
  }
  const setupShut = (state, book) => !!book && !ownBook(state, book);
  /* setup finished on the screens while the chat was part way: one note, once per book (said again for a later book) */
  const SETUP_CLOSED = 'Setup was finished on the screens, so these setup answers are closed. Change things on the screens, or tell me what to change';
  function closeSetup(state, book, shown, told) {
    if (!book) { if (state.fill) state.fill = null; state.shutSaid = false; return false; }
    if (!setupShut(state, book) || state.shutSaid) return false;
    if (!state.turns.some(t => t.who === 'card' && t.card && t.card.kind === 'draft')) return false;
    state.shutSaid = true;
    addTurn(state, { who: 'note', text: SETUP_CLOSED, at: told }, shown);
    return true;
  }
  /* ---- one tool call ---- */
  function addTurn(state, t, shown) {
    const turn = Object.assign({ id: 't' + (++state.seq) }, t);
    state.turns.push(turn);
    if (state.turns.length > KEEP) state.turns.splice(0, state.turns.length - KEEP);
    if (shown) shown.push(turn);
    return turn;
  }
  async function handle(state, call, deps, shown, frame) {
    const today = deps.today(), book = deps.book ? deps.book() : null, x = call.input || {};
    if (call.name === 'list') return list(book, today, x);
    if (call.name === 'explain') return explain(x.topic);
    if (call.name === 'draft_set') {
      if (book) { refused(frame, state, shown, deps, 'Not saved: setup is done. Change it on the screens, or tell me what to change'); return 'Setup is done: change things with change instead.'; }
      const r = draftSet(state.draft, x.section, x.value, today);
      if (!r.ok) { refused(frame, state, shown, deps, 'Not saved: ' + r.text); return 'Not saved: ' + r.text; }
      state.draft = r.draft; did(frame);
      addTurn(state, { who: 'note', text: r.text, at: deps.told() }, shown);
      const need = ANS.need(r.draft, { day: today });
      return r.text + '. NEEDED now: ' + (need.length ? need.join(' ') : 'nothing');
    }
    if (call.name === 'fill_book') {
      const f = await fillNow(state, deps, shown, true);
      if (f.ok) did(frame); else refused(frame, state, shown, deps, 'Not filled in: ' + f.text);
      return f.ok ? 'Filled in. ' + f.text : 'Not filled in: ' + f.text;
    }
    if (call.name === 'change') {
      if (!book || !deps.door) return 'There is no book yet: finish setup first.';
      /* [STALE_SHEET_PLAN, M61] the refs the AI holds are places in lists (S7 is the seventh spend told): if the book
         changed somewhere else while it was answering, they may point at other things. Nothing is carried out */
      const verNow = typeof deps.door.ver === 'function' ? deps.door.ver() : null;
      if (frame && frame.ver != null && verNow !== frame.ver) {
        frame.ver = verNow;
        refused(frame, state, shown, deps, 'Nothing was changed, because something changed somewhere else while I was answering. Say it again');
        return 'Not changed: the book changed somewhere else after FIGURES were sent, so the refs may be old. Nothing was done. Use list again before any change, or ask the person to say it again.';
      }
      const raw = Array.isArray(x.steps) ? x.steps : [];
      const refs = allRefs(book, today), plan = [], dropped = [], left = [];
      let again = false;   // [qc-controls run 2 CONFUSING] some left-out step could work if said again (not one the app cannot do)
      for (const a of raw) {
        if (plan.length >= MAX_STEPS) { again = true; dropped.push('more than ' + MAX_STEPS + ' at a time'); if (!left.includes('the changes after the first ' + MAX_STEPS)) left.push('the changes after the first ' + MAX_STEPS); continue; }
        const s = stepOf(a, { book, today, refs, payWith: state.payWith });
        if (s.bad) {
          dropped.push(s.bad); if (s.payWith) state.askPay = true;
          /* a note that tells the AI to ask something is no words for the person */
          if (!s.left) again = true;
          left.push(s.left || (/^(ask|which account)/i.test(s.bad) ? 'one step that needs an answer from you first' : DO_WORDS[a && a.do] || 'a change the assistant can\'t make here'));
        } else plan.push(s);
      }
      /* [AI_JOIN_FIXES H6] the answer to "card or bank?" is kept for this chat */
      const named = plan.find(s => s.named);
      if (state.askPay && named) { state.payWith = named.named; state.askPay = false; }
      if (!plan.length) { refused(frame, state, shown, deps, 'Not done: ' + (left.length ? left.join(', and ') : 'nothing was asked for') + '. Nothing changed'); return 'Nothing changed: ' + (dropped.join('; ') || 'no steps'); }
      /* [BW] a delete, or a change larger than safe to spend, asks first; [AI_FIRST_PLAN 7] an amount the person did not
         type is a guess and asks first too */
      const safe = LA.lookahead(book, today).safeToSpend.headline;
      /* [qc-foundation F2] the size is the step's real figure: a new pay and new money count too */
      const big = plan.some(s => s.amount && s.amount > safe), del = plan.some(s => s.del);
      /* every figure in a step (an amount, a target, what is owed, even 0) must be one the person typed, in their own
         messages since the last written change, and not used up by a change already written [M6] */
      const plain = plainOf(book, today), typedN = typedLeft(state);
      const guess = plan.filter(s => figsOf(s).some(f => typedN(plain(f)) < 1));
      /* [AI_JOIN_FIXES H5; M6's third reason] a bank figure far from what the app expected (the engine's own gap for that
         check, on the book the step would make, larger than safe to spend) asks first, with the gap in words: an extra
         zero never goes in silently */
      const far = farFigures(plan, book, today, deps, safe);
      const card = { kind: 'change', status: 'ask', ver: verNow, lines: plan.map(s => s.text + (far.has(s) ? '. ' + far.get(s) : '') + (guess.includes(s) ? ' (my guess)' : '')), rows: [], plan, dropped, left, again };
      const ticks = plan.some(s => s.ticks);   // [qc-foundation F1] a figure that ticks what the app expected asks first
      if (del || big || far.size || ticks || guess.length) {
        card.ask = del ? 'delete' : big ? 'large' : far.size ? 'gap' : ticks ? 'ticks' : 'guess';
        card.why = del ? 'this removes something' : big ? 'this is more than safe to spend' : far.size ? 'the figure is far from what the app expected' : ticks ? 'it also ticks what the app expected to have gone through' : 'I guessed an amount';
        did(frame);
        addTurn(state, { who: 'card', text: card.lines.join('. '), at: deps.told(), card }, shown);
        return resultOf(card) + (dropped.length ? ' Left out: ' + dropped.join('; ') : '');
      }
      const res = await carryOut(state, card, deps);
      if (res.ok) { wrote(state, card, book, today); did(frame); } else if (frame) frame.refused++;   // its card says why
      if (frame && typeof deps.door.ver === 'function') frame.ver = deps.door.ver();   // the turn's own steps
      addTurn(state, { who: 'card', text: card.lines.join('. '), at: deps.told(), card }, shown);
      return (res.ok ? resultOf(card) : 'Not changed: ' + res.text) + (dropped.length ? ' Left out: ' + dropped.join('; ') : '');
    }
    return 'There is no tool called ' + String(call.name).slice(0, 30);
  }

  /* ---- one turn ---- */
  async function turn(state0, message, deps) {
    const state = clone(state0), shown = [];
    /* [M6] the first message after a written change starts the typed amounts again */
    if (state.wrote || state.typedFrom == null) { state.typedFrom = state.wrote ? state.seq : typedFrom(state); state.used = []; state.wrote = false; }
    addTurn(state, { who: 'person', text: clean(message, 4000), at: deps.told() }, shown);
    const rounds = [];
    const draftWas = JSON.stringify(state.draft);
    const end = stop => {
      if (frame.refused && !frame.did) for (const t of shown) if (t.who === 'ai') t.notDone = true;
      if (!state.fill && state.draft && JSON.stringify(state.draft) !== draftWas) {
        state.turns = state.turns.filter(t => !(t.who === 'card' && t.card && t.card.kind === 'draft'));
        addTurn(state, { who: 'card', text: 'The draft so far', at: deps.told(), card: draftCard(state.draft, deps.today()) }, shown);
      }
      return { state, shown, stop };
    };
    /* the book as it is when the figures are sent, kept beside the chat state (never in it, never sent) */
    const frame = { ver: deps.door && typeof deps.door.ver === 'function' && deps.book && deps.book() ? deps.door.ver() : null, refused: 0, did: false };
    closeSetup(state, deps.book ? deps.book() : null, shown, deps.told());
    for (let i = 0; i < ROUNDS; i++) {
      const body = request(state, clean(message, 4000), rounds, ctxOf(deps));
      let res;
      try { res = await deps.send(body); } catch (e) {
        addTurn(state, { who: 'note', text: 'The AI did not answer: ' + (e && e.message ? e.message : 'try again') + '. Nothing was lost', at: deps.told() }, shown);
        return Object.assign(end('error'), { error: e && e.message });
      }
      const r = read(res);
      if (r.words) {
        /* [AI_FIRST_PLAN 7] an amount in its words that is in none of what it was given is marked for checking */
        const given = (JSON.stringify(body.messages) + ' ' + message).normalize('NFKC').replace(/[,，]/g, '');
        const check = (r.words.normalize('NFKC').match(/\d[\d,]{2,}(?:\.\d+)?/g) || []).filter(a => !new RegExp('(^|[^\\d])' + a.replace(/,/g, '').replace('.', '\\.') + '(?![\\d])').test(given));
        addTurn(state, Object.assign({ who: 'ai', text: r.words, at: deps.told() }, check.length ? { check } : {}), shown);
      }
      if (!r.calls.length) return end('words');
      const results = [];
      for (const c of r.calls) {
        let out;
        try { out = await handle(state, c, deps, shown, frame); } catch (e) { out = 'That did not work: ' + (e && e.message); }
        results.push({ type: 'tool_result', tool_use_id: c.id, content: String(out) });
      }
      rounds.push({ content: r.content, results });
    }
    addTurn(state, { who: 'note', text: 'I stopped there. Tell me how to go on', at: deps.told() }, shown);
    return end('rounds');
  }

  /* ---- the person's taps ---- */
  const findCard = (state, id) => state.turns.find(t => t.id === id && t.who === 'card');
  async function confirm(state0, id, deps) {
    const state = clone(state0), t = findCard(state, id), shown = [];
    if (!t || t.card.kind !== 'change' || t.card.status !== 'ask') return { state, shown, ok: false, text: 'Nothing to confirm' };
    const res = await carryOut(state, t.card, deps);
    if (res.ok) wrote(state, t.card, deps.book(), deps.today());
    t.text = t.card.lines.join('. ');
    addTurn(state, { who: 'note', text: res.ok ? 'Done' : 'Not changed: ' + res.text, at: deps.told() }, shown);
    return { state, shown, ok: res.ok, text: res.text };
  }
  async function notNow(state0, id) {
    const state = clone(state0), t = findCard(state, id);
    if (!t || t.card.status !== 'ask') return { state, shown: [], ok: false };
    t.card.status = 'not now';
    return { state, shown: [], ok: true };
  }
  /* the fill is undoable while nothing else was written: every record still carries the fill's own moment */
  function onlyFill(book, fill) {
    const recs = [].concat(book.accounts || [], book.schedules || [], book.events || [], book.checkins || [], book.places || [], ((book.plan || {}).shares) || [], ((book.plan || {}).budgets) || []);
    return recs.every(r => !r || r.at === fill.told);
  }
  async function undo(state0, id, deps) {
    const state = clone(state0), t = findCard(state, id), shown = [];
    if (!t) return { state, shown, ok: false, text: 'Nothing to undo' };
    if (t.card.kind === 'change') {
      if (t.card.status !== 'done') return { state, shown, ok: false, text: 'Nothing to undo' };
      for (const sid of t.card.steps.slice().reverse()) {
        const u = await deps.door.undo(sid, { quiet: true });
        if (!u.ok) return { state, shown, ok: false, text: u.text };
      }
      t.card.status = 'undone';
      addTurn(state, { who: 'note', text: 'Undone', at: deps.told() }, shown);
      return { state, shown, ok: true };
    }
    if (t.card.kind === 'fill') {
      if (t.card.status !== 'done' || !state.fill) return { state, shown, ok: false, text: 'Nothing to undo' };
      const book = deps.book();
      if (book && !onlyFill(book, state.fill)) { t.card.status = 'start over'; return { state, shown, ok: false, text: 'start over' }; }
      return startOver(state, deps, t.id);
    }
    return { state, shown, ok: false, text: 'Nothing to undo' };
  }
  /* [BV2, BV2.9] the book goes away (deps.discard), the draft stays */
  async function startOver(state0, deps, cardId) {
    const state = clone(state0), shown = [];
    if (!(await deps.discard())) return { state, shown, ok: false, text: 'That could not be undone on this device. Nothing changed' };
    for (const t of state.turns) if (t.who === 'card' && t.card.kind === 'fill' && (t.id === cardId || !cardId)) t.card.status = 'undone';
    state.fill = null;
    addTurn(state, { who: 'note', text: 'Undone. Your answers are still here', at: deps.told() }, shown);
    return { state, shown, ok: true };
  }
  function draftEdit(state0, section, value, deps) {
    const state = clone(state0), shown = [];
    if (deps.book && deps.book()) return { state, shown, ok: false, text: 'Setup is done' };
    const r = draftSet(state.draft, section, value, deps.today());
    if (!r.ok) return { state, shown, ok: false, text: r.text };
    state.draft = r.draft;
    addTurn(state, { who: 'note', text: r.text, at: deps.told() }, shown);
    return { state, shown, ok: true };
  }
  async function fillNow(state0, deps, shown0, inPlace) {
    const state = inPlace ? state0 : clone(state0), shown = shown0 || [];
    const today = deps.today(), chk = fillCheck(state.draft, today, deps.mode ? deps.mode() : 'none');
    if (!chk.ok) return { state, shown, ok: false, text: chk.need.join(' ') };
    const told = deps.told();
    let built;
    try { built = ANS.build(state.draft, { day: today, told, newId: deps.newId }); } catch (e) { return { state, shown, ok: false, text: e.message }; }
    if (!(await deps.start(built.book))) return { state, shown, ok: false, text: deps.why && deps.why() === 'there' ? OTHER_TAB : 'This could not be saved on this device. Nothing changed' };
    const v = LA.lookahead(built.book, today), main = built.ids.bank1;
    state.fill = { at: told, told, day: today };
    state.wrote = true;   // [M6] what was typed for setup is not typed for a later change
    const figs = { safe: v.safeToSpend.headline, bank: v.accounts[main].bank };
    addTurn(state, { who: 'card', text: 'Your Burrow is filled in', at: told, card: { kind: 'fill', status: 'done', figures: figs } }, shown);
    const cur = curOf(state.draft);
    return { state, shown, ok: true, text: `Safe to spend ${SM.format(figs.safe, cur)}, ${state.draft.banks[0].name} ${SM.format(figs.bank, cur)}.` };
  }

  /* ---- "Use any AI" (AI_FIRST_PLAN 4): the same questions as one request to copy into any AI chat, and its answer
     pasted back through the same draft checks. Nothing about the book is in it: only the draft so far. ---- */
  function copyPrompt(state, today) {
    const d = state.draft || emptyDraft(), card = draftCard(d, today);
    return `Help me set up a money app called The Burrow. Ask me these questions one at a time, in order, and skip what is already answered below. When we are done, give me one JSON object with only the sections I answered.

QUESTIONS
${GUIDE.slice(2, 14).map(g => '- ' + g.ask).join('\n')}

ANSWER SHAPE (amounts are plain numbers, no symbol; days of the month are numbers)
{"country": "JP" | "PH" | "XX", "currency": "JPY" | "PHP" | "USD" | "EUR",
 "banks": [{"name": "Main bank", "amount": 0}],
 "pays": [{"name": "Pay", "amount": 0, "every": "month" | "days" | "weeks" | "none", "day": 25, "shift": "before" | "after", "afterTax": true, "same": true}],
 "cards": [{"name": "Card", "owed": 0, "payDay": 10, "closeDay": "not sure", "shift": "after"}],
 "bills": [{"name": "Rent", "amount": 0, "day": 27}],
 "asked": [{"name": "Phone", "out": true}],
 "statements": [{"name": "Card", "amount": "not sure"}],
 "free": null, "min": null}
A pay is what lands in the bank after tax (afterTax true). A second income says whether it is the same amount each time (same). Never fill in a minimum I did not give.

SO FAR (today is ${SN.dayLabel(today, true)})
${card.sections.map(s => s.title + ': ' + (s.lines.length ? s.lines.join('; ') : 'not asked yet')).join('\n')}
${card.need.length && state.draft ? 'STILL NEEDED: ' + card.need.join(' ') : ''}`.trim();
  }
  function loose(text) {
    const t = String(text || '').trim(), tries = [t];
    const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(t); if (fence) tries.push(fence[1]);
    const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a >= 0 && b > a) tries.push(t.slice(a, b + 1));
    for (const x of tries) { try { const v = JSON.parse(x); if (v && typeof v === 'object' && !Array.isArray(v)) return v; } catch (e) { /* the next way */ } }
    return null;
  }
  function pasteBack(state0, text, deps) {
    const state = clone(state0), shown = [], today = deps.today();
    const v = loose(text);
    if (!v) return { state: state0, shown, ok: false, text: 'That has no answers I can read. Paste the whole reply' };
    let d = state.draft;
    const done = [];
    for (const sec of SECTIONS) {
      if (!(sec in v)) continue;
      const r = draftSet(d, sec, v[sec], today);
      if (!r.ok) return { state: state0, shown, ok: false, text: TITLES[sec] + ': ' + r.text };
      d = r.draft; done.push(TITLES[sec]);
    }
    if (!done.length) return { state: state0, shown, ok: false, text: 'That has no answers I can read. Paste the whole reply' };
    state.draft = d;
    addTurn(state, { who: 'note', text: 'Saved: ' + done.join(', '), at: deps.told() }, shown);
    return { state, shown, ok: true };
  }

  const api = {
    ROUNDS, TURNS, KEEP, MAX_TOKENS, MAX_STEPS, TIER: 'default', EFFORT: 'low', GUIDE, TOOLS, SYSTEM, SCREENS,
    fresh: () => ({ v: 1, turns: [], draft: null, fill: null, seq: 0 }),
    turn, confirm, notNow, undo, startOver, draftEdit, DONE_WORDS, setupShut,
    SCREEN_SECS, fromScreens, undoScreens, chatNewer,
    /* [AI_JOIN_FIXES H2] what the first screen says before anything is typed: the welcome, and the first question */
    welcome: () => [GUIDE[0].ask, GUIDE[1].ask, GUIDE[2].ask],
    fillNow: (s, deps) => fillNow(s, deps),
    copyPrompt, pasteBack,
    request, read, figures, draftCard: (d, today) => draftCard(d, today), fillCheck, sentText,
    handle: async (state0, call, deps) => { const state = clone(state0), shown = []; const result = await handle(state, call, deps, shown); return { state, shown, result }; },
  };
  if (node) module.exports = api;
  else root.CHAT3C = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
