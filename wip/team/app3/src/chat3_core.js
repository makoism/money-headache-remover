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
       turns: [{ id, who: 'person' | 'ai' | 'note' | 'card', text, at, card? }], the last K.KEEP kept
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
  const SM = node ? require('../../screens/money.js') : root.BurrowScreens.money;
  const SN = node ? require('../../screens/names.js') : root.BurrowScreens.names;
  const HELP = node ? require('../../screens/help.js') : root.BurrowScreens.help;
  const AQ = node ? require('./ask3_core.js') : root.ASK3C;
  const ANS = node ? require('./answers3.js') : root.ANSWERS3;
  const PW = () => (node ? require('./plan3_write.js') : root.PLAN3W);
  const ROUNDS = 6, TURNS = 10, KEEP = 200, MAX_TOKENS = 2000, MAX_STEPS = 6;
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  const live = x => x && !x.gone;
  const clone = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const day1 = s => SN.dayLabel(s, false);
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').replace(/\*\*/g, '').trim().slice(0, max || 1500);

  /* ---- the 15 setup questions (AI_FIRST_PLAN section 2, with BV7, BV2.13 and BW: how many banks, one is fine).
     Drafts for Mako's copy pass. ---- */
  const GUIDE = [
    { n: 1, key: 'welcome', ask: "Hi, I'll set up your Burrow with you. I ask a few questions, about 10 minutes. You can type, or send me a statement or payslip and I'll read it. What you tell me stays on this phone until you say fill it in." },
    { n: 2, key: 'how', ask: "You tell me what's in your bank today, what comes in and what goes out and when. From that the app works out what's safe to spend until your next pay. Everything I fill in shows on the screens so you can check it." },
    { n: 3, key: 'country', ask: 'Which country do you bank in? It moves pay and bills off weekends and holidays.' },
    { n: 4, key: 'banks', ask: 'How many banks do you use? One is fine to start, you can add more later. Which bank does your pay go into?' },
    { n: 5, key: 'banks', ask: "What does that bank's app show right now? If you don't know: open the bank app. The big number on the first screen is it. Or send me a screenshot." },
    { n: 6, key: 'pays', ask: 'How are you paid? On a day each month, twice a month, every week or two, or whenever work comes in?' },
    { n: 7, key: 'pays', ask: "Which day does it land? If that's a weekend or holiday does it come the day before or after?" },
    { n: 8, key: 'pays', ask: "How much lands in your bank each time? Then always: is that before or after tax? If before or not sure: I need what lands in the bank, after tax. On a Japanese payslip it's 差引支給額 (take-home)." },
    { n: 9, key: 'pays', ask: 'Anything else coming in, like a side job? Is it the same amount each time? If it lands the same day you can give me one total.' },
    { n: 10, key: 'cards', ask: "Do you have credit cards? For each one: what's on it right now (it's in the card app), which day it's paid and from which bank. Do you know its statement close day (締め日)? Not sure is fine." },
    { n: 11, key: 'bills', ask: "Which bills come out of your bank? Rent, power, phone, internet, subscriptions. How much and which day for each. Bills you pay by card go with the card, not here." },
    { n: 12, key: 'asked', ask: 'For each bill in NEEDED that was due since your last pay: "Phone was due on 20 Nov. Has it come out of your bank already?" For each card statement in NEEDED: how much was on it. If a pay lands today: has it already landed in that figure?' },
    { n: 13, key: 'free', ask: "How much do you want for food and everyday stuff each pay period? Groceries, eating out, getting around, fun. Leave it blank if you don't know yet." },
    { n: 14, key: 'min', ask: 'Keep at least ___ in your bank? Skip it and there is no minimum.' },
    { n: 15, key: 'fill', ask: 'Show what you have (the draft), then ask: shall I fill in your Burrow? When they say yes, call fill_book.' },
  ];
  const SYSTEM = `You are the assistant inside The Burrow, a money app the person has open right now. You set it up with them by talking, and after that you answer questions and make changes for them.

Numbers: the app works out every figure. FIGURES (and DRAFT before setup) come with every message and are exact for today. Quote them; never work out a total of your own. Amounts you send are plain numbers in the currency, no symbol, exactly as the person gave them.

How to talk: plain words, short sentences, one question per message, like a friend who is good with money. Usually under 60 words. No headings, no bold, no lists of options, no exclamation marks, no praise. Times and days as the app writes them.

The person can ask anything about the app at any point (use explain for how it works). Answer, then go back to the next setup question.

SETUP (when FIGURES says there is no book yet). Ask these in order, one per message, skipping what DRAFT already has:
${GUIDE.map(g => g.n + '. ' + g.ask).join('\n')}
After each answer, save it with draft_set (that section's whole list each time; nothing is in the app until fill_book). A pay needs afterTax true: only save a pay once the person said the amount is after tax. A second income needs same: true or false. Never fill in a minimum or a figure the person did not give. NEEDED lists what fill_book still needs; ask for those. fill_book only when the person says to fill it in.

AFTER SETUP. When the person says they spent, got or moved money, or asks to change a bill, pay, line, goal or card, use change. The app makes the change at once and shows what changed with Undo; a delete, or a change larger than safe to spend, waits for their OK. Refs (A1, L1, G1, B1, P1, S1) come from FIGURES or list; never invent one. Not a licensed adviser: for investments, loans or taxes, say so in one line.`;

  /* ---- the tools (BU2: no figures or draft read tool) ---- */
  const num = { type: 'number', description: 'A plain number in the currency, no symbol.' };
  const str = d => ({ type: 'string', description: d });
  const DO = ['log_spend', 'refund', 'money_in', 'move_money', 'remove', 'add_bill', 'change_bill', 'end_bill', 'add_pay', 'add_line', 'change_line', 'end_line', 'set_free', 'add_goal', 'set_aside', 'add_card', 'add_account'];
  const SECTIONS = ['country', 'banks', 'pays', 'cards', 'bills', 'asked', 'statements', 'payToday', 'free', 'min'];
  const TOOLS = [
    { name: 'list', description: 'Records with their refs: accounts, pays, bills, cards, lines, goals, or the recent spends of one account (amount, date and ref only).',
      input_schema: { type: 'object', properties: { what: { type: 'string', enum: ['accounts', 'pays', 'bills', 'cards', 'lines', 'goals', 'spends'] }, account: str('An account ref like A1, for spends.') }, required: ['what'] } },
    { name: 'explain', description: 'How a part of the app works, in the app\'s own words.',
      input_schema: { type: 'object', properties: { topic: { type: 'string', enum: ['safeToSpend', 'period', 'status', 'cards', 'free', 'goals', 'check', 'undo', 'setup', 'sent'] } }, required: ['topic'] } },
    { name: 'draft_set', description: 'Save one setup section into the draft, its whole value. Nothing reaches the app until fill_book. Sections: country "JP"|"PH"|"XX"; banks [{name, amount, type?, confirmed?}] (first is where pay lands; confirmed true when the person gave the figure again today); pays [{name, amount, every: month|days|weeks|none, day?, day2?, n?, start?, shift?: before|after, bank?, afterTax, same?}]; cards [{name, owed, payDay, closeDay: day|"last"|"not sure", shift?, payFrom?, confirmed?}]; bills [{name, amount, day, every?: month|year, month?, from?}]; asked [{name, out: true|false}]; statements [{name, amount|"not sure"}]; payToday {landed: true|false}; free amount|null; min amount|null.',
      input_schema: { type: 'object', properties: { section: { type: 'string', enum: SECTIONS }, value: { description: 'The section\'s whole value.' } }, required: ['section', 'value'] } },
    { name: 'fill_book', description: 'Turn the draft into the person\'s Burrow. Only when they said to fill it in. Refused while NEEDED is not empty.', input_schema: { type: 'object', properties: {} } },
    { name: 'change', description: 'Make up to ' + MAX_STEPS + ' changes, each a named step: ' + DO.join(', ') + '. Fields: amount, account (A ref), from and to (A refs), line (L ref), goal (G ref), ref (the record: S, B, P, L or G ref), date (YYYY-MM-DD, today or before), note, name, day, day2, every (month|days|weeks1..4|none), start, when (now|next|once), target, due, owed, payDay, closeDay, type (bank|cash|ewallet), moved (true|false).',
      input_schema: { type: 'object', properties: { steps: { type: 'array', items: { type: 'object', properties: { do: { type: 'string', enum: DO }, amount: num }, required: ['do'] } } }, required: ['steps'] } },
  ];

  /* ---- refs and the figures sent ---- */
  function figures(book, today) {
    if (!book) return { text: 'There is no book yet: this is setup.', refs: {} };
    const s = AQ.summary(book, today), refs = Object.assign({}, s.refs), out = [s.text];
    const home = G.homeOn(book, today);
    const sch = (book.schedules || []).filter(x => live(x) && (x.kind === 'income' || x.kind === 'bill'));
    const lines = [];
    let p = 0, b = 0;
    for (const x of sch) {
      const ref = x.kind === 'income' ? 'P' + (++p) : 'B' + (++b); refs[ref] = x.id;
      const rule = (x.rules || []).slice(-1)[0], step = (x.steps || []).slice(-1)[0];
      lines.push(`${ref} | ${x.name} | ${step && step.amount != null ? SM.format(step.amount, x.cur || home) : 'no fixed amount'} | ${ruleWords(rule && rule.rule)}${x.ends ? ' | ends ' + day1(x.ends) : ''}`);
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
  const TITLES = { country: 'Country', banks: 'Your bank', pays: 'Pay', cards: 'Cards', bills: 'Bills', asked: 'Bills since your last pay', statements: 'Card statements', payToday: "Today's pay", free: 'Free to spend', min: 'Keep at least' };
  /* one section into a copy of the draft, checked; { ok, draft, text } or { ok: false, text } */
  function draftSet(draft0, section, value, today) {
    const d = clone(draft0) || emptyDraft(), cur = curOf(d), no = text => ({ ok: false, text });
    const list = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? [v] : null);
    const nameOf = x => clean(x && x.name, 60);
    const prev = (sec, name) => (d[sec] || []).find(y => ANS.keyOf(sec, y.name) === ANS.keyOf(sec, name));
    if (section === 'country') {
      if (!['JP', 'PH', 'XX'].includes(value)) return no('Country is JP, PH or XX (somewhere else)');
      d.country = value;
    } else if (section === 'banks') {
      const v = list(value); if (!v || !v.length) return no('Give at least one bank');
      const out = [];
      for (const x of v) {
        const name = nameOf(x), a = amountIn(x.amount, cur, true), p = prev('banks', name);
        if (!name) return no('Each bank needs a name');
        if (a === undefined || a === null) return no('What does ' + name + ' show today? A plain number');
        if (x.type && !['bank', 'cash', 'ewallet', 'wallet'].includes(x.type)) return no(name + ': a bank, cash or an e-wallet');
        const on = p && p.amount === a && !x.confirmed ? p.on : today;
        out.push(Object.assign({ name, amount: a, on }, x.type && x.type !== 'bank' ? { type: x.type } : {}, p && p.payToday && on === p.on ? { payToday: p.payToday } : {}));
      }
      d.banks = out;
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
    return { ok: true, draft: d, text: 'Saved: ' + TITLES[section] };
  }
  /* the draft in plain lines (what is sent, and the draft card) */
  function draftLines(d) {
    const cur = curOf(d), m = a => (a == null ? 'blank' : SM.format(a, cur)), out = [];
    out.push({ key: 'country', title: TITLES.country, lines: d.country ? [{ JP: 'Japan', PH: 'The Philippines', XX: 'Somewhere else (weekends only)' }[d.country]] : [] });
    out.push({ key: 'banks', title: TITLES.banks, lines: d.banks.map(b => `${b.name}: ${m(b.amount)} on ${day1(b.on)}` + (b.payToday ? `, today's pay ${b.payToday.landed ? 'already in it' : 'not in it yet'}` : '')) });
    out.push({ key: 'pays', title: TITLES.pays, lines: d.pays.map(p => `${p.name}: ${p.amount == null ? 'no fixed amount' : m(p.amount) + ' after tax'}, ${p.every === 'none' ? 'no fixed day' : p.every === 'weeks' ? 'every ' + (p.n > 1 ? p.n + ' weeks' : 'week') + ' from ' + day1(p.start) : 'on day ' + p.day + (p.day2 ? ' and ' + p.day2 : '') + ' each month'}` + (p.every !== 'none' ? `, a weekend or holiday: the working day ${p.shift || 'before'}` : '')) });
    out.push({ key: 'cards', title: TITLES.cards, lines: d.cards.map(c => `${c.name}: ${m(c.owed)} on ${day1(c.on)}, paid on day ${c.payDay}, statement closes ${c.closeDay === 'not sure' ? 'not sure' : c.closeDay === 'last' ? 'the last day' : 'day ' + c.closeDay}` + (c.statement ? `, ${c.statement.a === 'not sure' ? 'all of it' : m(c.statement.a)} on the statement of ${day1(c.statement.closed)}` : '')) });
    out.push({ key: 'bills', title: TITLES.bills, lines: d.bills.map(b => `${b.name}: ${m(b.amount)} on day ${b.day}${b.every === 'year' ? ' of month ' + b.month : ' each month'}` + (b.out ? `, the one of ${b.out.days.map(day1).join(' and ')} ${b.out.out ? 'already out' : 'not out yet'}` : '')) });
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
    if (!book) {
      const d = state.draft || emptyDraft(), card = draftCard(d, ctx.today);
      out.push('', 'DRAFT (saved on this device, not in the app yet). Today is ' + SN.dayLabel(ctx.today, true) + '. Currency: ' + curOf(d) + '.');
      for (const s of card.sections) out.push(s.title + ': ' + (s.lines.length ? s.lines.join('; ') : 'not asked yet'));
      out.push('NEEDED before fill_book: ' + (card.need.length ? card.need.join(' ') : 'nothing. Show the draft and ask whether to fill it in.'));
    }
    return out.join('\n');
  }
  function request(state, message, rounds, ctx) {
    const hist = state.turns.filter(t => t.who === 'person' || t.who === 'ai');
    const past = hist.slice(0, hist.length - 1).slice(-TURNS), messages = [];
    const push = (role, text) => { const last = messages[messages.length - 1]; if (last && last.role === role) last.content[0].text += '\n\n' + text; else messages.push({ role, content: [{ type: 'text', text }] }); };
    for (const t of past) push(t.who === 'person' ? 'user' : 'assistant', t.text || '(a card)');
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
  const ctxOf = deps => ({ book: deps.book ? deps.book() : null, today: deps.today(), anon: deps.anon, invite: deps.invite });

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
    if (what === 'log_spend' || what === 'refund' || what === 'money_in') {
      const acct = acctOr(a.account), cur = acct && (acctRec(acct) || {}).cur, x = amt(a.amount, cur), d = date(a.date);
      const line = what === 'money_in' ? null : lineOf(a.line);
      if (!acct || !x || !d || (what !== 'money_in' && !line)) return { bad: 'a ' + what.replace('_', ' ') + ' I could not read' };
      const args = { date: d, a: x, acct }; if (line && (what === 'log_spend' || a.line)) args.line = line; const n = note(a.note); if (n) args.note = n;
      const kind = { log_spend: 'logSpend', refund: 'refund', money_in: 'moneyIn' }[what];
      const text = what === 'log_spend' ? `Log ${m(x, cur)} on ${lineName(line)} from ${nm(acct)}, ${on(d)}` : what === 'refund' ? `Log ${m(x, cur)} back into ${nm(acct)}, ${on(d)}` : `Log ${m(x, cur)} in to ${nm(acct)}, ${on(d)}`;
      return { kind, args: [args], text: text + (n ? ' (' + n + ')' : ''), amount: x, ref: line && line !== 'free' ? a.line : null };
    }
    if (what === 'move_money') {
      const from = ref(a.from, 'A'), to = ref(a.to, 'A'), x = amt(a.amount), d = date(a.date);
      if (!from || !to || !x || !d) return { bad: 'a move I could not read' };
      return { kind: 'moveMoney', args: [{ date: d, a: x, from, to }], text: `Move ${m(x)} from ${nm(from)} to ${nm(to)}, ${on(d)}`, amount: x };
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
      const x = amt(a.amount), acct = acctOr(a.account);
      if (!x || !dayOk(a.day) || !acct || !a.name) return { bad: 'a bill I could not read' };
      return { kind: 'addBill', args: [{ name: clean(a.name, 60), amount: x, day: a.day, acct }], text: `Add ${clean(a.name, 60)}: ${m(x)} on day ${a.day} each month, from ${nm(acct)}`, amount: x };
    }
    if (what === 'change_bill') {
      const id = ref(a.ref, 'BP'); if (!id) return { bad: 'a change to a bill or pay I do not know' };
      const ch = {}; if (a.amount != null) { ch.amount = amt(a.amount); if (!ch.amount) return { bad: 'an amount I could not read' }; }
      if (a.day != null) ch.day = a.day; if (a.every) { ch.every = a.every; ch.day2 = a.day2; ch.start = a.start; } if (a.name) ch.name = clean(a.name, 60);
      return { kind: 'changeBill', args: [id, ch], text: `${schName(id)}: ` + [ch.amount ? m(ch.amount) : '', ch.day ? 'on day ' + ch.day : '', ch.every ? ch.every : '', ch.name ? 'called ' + ch.name : ''].filter(Boolean).join(', ') + ' from its next one', amount: ch.amount || 0, ref: a.ref };
    }
    if (what === 'add_pay') {
      const x = a.amount == null ? null : amt(a.amount), acct = acctOr(a.account);
      if (!a.name || !a.every || (a.amount != null && !x)) return { bad: 'a pay I could not read' };
      const args = { name: clean(a.name, 60), amount: x, every: a.every, day: a.day, day2: a.day2, start: a.start, acct };
      return { kind: 'addPay', args: [args], text: `Add ${args.name}: ${x ? m(x) : 'no fixed amount'}, ${a.every === 'none' ? 'no fixed day' : a.every === 'month' ? 'on day ' + a.day + ' each month' : a.every}`, amount: 0 };
    }
    if (what === 'add_line') { const x = amt(a.amount); if (!x || !a.name) return { bad: 'a line I could not read' }; return { kind: 'addLine', args: [{ name: clean(a.name, 60), amount: x }], text: `Add a line, ${clean(a.name, 60)}: ${m(x)} each pay period`, amount: x }; }
    if (what === 'change_line') {
      const id = ref(a.ref || a.line, 'L'), x = amt(a.amount, null, true); if (!id || x == null) return { bad: 'a change to a line I could not read' };
      return { kind: 'changeLine', args: [id, { amount: x, when: when(a.when) }], text: `${lineName(id)}: ${m(x)} each pay period`, amount: x, ref: a.ref || a.line };
    }
    if (what === 'set_free') { const x = amt(a.amount, null, true); if (x == null) return { bad: 'Free to spend I could not read' }; return { kind: 'setFree', args: [{ amount: x, when: when(a.when) }], text: `Free to spend: ${m(x)} each pay period`, amount: x }; }
    if (what === 'add_goal') { const x = amt(a.target != null ? a.target : a.amount); if (!x || !a.name) return { bad: 'a goal I could not read' }; return { kind: 'addGoal', args: [{ name: clean(a.name, 60), target: x, due: a.due || undefined }], text: `Add a goal, ${clean(a.name, 60)}: ${m(x)}${a.due ? ' by ' + day1(a.due) : ''}`, amount: 0 }; }
    if (what === 'set_aside') {
      const id = ref(a.goal || a.ref, 'G'), x = amt(a.amount); if (!id || !x) return { bad: 'money for a goal I could not read' };
      return { kind: 'setAside', args: [id, { amount: x }], text: `Set aside ${m(x)} for ${((book.places || []).find(g => g.id === id) || {}).name}, today`, amount: x, ref: a.goal || a.ref };
    }
    if (what === 'add_card') {
      const x = amt(a.owed != null ? a.owed : a.amount, null, true); if (x == null || !a.name || !dayOk(a.payDay)) return { bad: 'a card I could not read' };
      return { kind: 'addCard', args: [{ name: clean(a.name, 60), owed: x, payDay: a.payDay, cutDay: a.closeDay }], text: `Add ${clean(a.name, 60)}: ${m(x)} on it now, paid on day ${a.payDay}`, amount: 0 };
    }
    if (what === 'add_account') {
      const x = amt(a.amount, null, true); if (x == null || !a.name) return { bad: 'an account I could not read' };
      return { kind: 'addAccount', args: [{ name: clean(a.name, 60), type: a.type || 'bank', amount: x, moved: a.moved }], text: `Add ${clean(a.name, 60)} with ${m(x)}${a.moved ? ' moved from ' + nm(mainAcct) : ''}`, amount: a.moved ? x : 0 };
    }
    return { bad: what ? 'a change I can\'t make (' + what.slice(0, 30) + ')' : 'a change I could not read' };
  }
  const ACT = { logSpend: 1, refund: 1, moneyIn: 1, moveMoney: 1, remove: 1 };
  function runOne(door, s, opts) {
    if (ACT[s.kind]) return door[s.kind](...s.args, opts);
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
    return rows;
  }
  async function carryOut(state, card, deps) {
    const door = deps.door, before = deps.book(), today = deps.today(), done = [];
    for (const s of card.plan) {
      const res = await runOne(door, s, { quiet: true });
      if (!res.ok) {
        for (const st of done.slice().reverse()) await door.undo(st.id, { quiet: true });
        card.status = 'refused'; card.why = s.text + ': ' + res.text;
        return { ok: false, text: card.why };
      }
      done.push(res.step);
    }
    card.status = 'done'; card.steps = done.map(s => s.id); card.rows = rowsOf(before, deps.book(), today, card.plan);
    return { ok: true };
  }
  const resultOf = card => card.status === 'done' ? 'Done, with Undo on the card. ' + card.rows.map(r => `${r.label}: ${r.before == null ? '-' : r.before} to ${r.after == null ? '-' : r.after} (minor units)`).join('; ')
    : card.status === 'ask' ? 'Waiting for the person\'s OK: ' + card.why : 'Not changed: ' + card.why;

  /* ---- one tool call ---- */
  function addTurn(state, t, shown) {
    const turn = Object.assign({ id: 't' + (++state.seq) }, t);
    state.turns.push(turn);
    if (state.turns.length > KEEP) state.turns.splice(0, state.turns.length - KEEP);
    if (shown) shown.push(turn);
    return turn;
  }
  async function handle(state, call, deps, shown, said) {
    const today = deps.today(), book = deps.book ? deps.book() : null, x = call.input || {};
    if (call.name === 'list') return list(book, today, x);
    if (call.name === 'explain') return explain(x.topic);
    if (call.name === 'draft_set') {
      if (book) return 'Setup is done: change things with change instead.';
      const r = draftSet(state.draft, x.section, x.value, today);
      if (!r.ok) { addTurn(state, { who: 'note', text: 'Not saved: ' + r.text, at: deps.told() }, shown); return 'Not saved: ' + r.text; }
      state.draft = r.draft;
      addTurn(state, { who: 'note', text: r.text, at: deps.told() }, shown);
      const need = ANS.need(r.draft, { day: today });
      return r.text + '. NEEDED now: ' + (need.length ? need.join(' ') : 'nothing');
    }
    if (call.name === 'fill_book') { const f = await fillNow(state, deps, shown, true); return f.ok ? 'Filled in. ' + f.text : 'Not filled in: ' + f.text; }
    if (call.name === 'change') {
      if (!book || !deps.door) return 'There is no book yet: finish setup first.';
      const raw = Array.isArray(x.steps) ? x.steps : [];
      const refs = allRefs(book, today), plan = [], dropped = [];
      for (const a of raw) {
        if (plan.length >= MAX_STEPS) { dropped.push('more than ' + MAX_STEPS + ' at a time'); continue; }
        const s = stepOf(a, { book, today, refs });
        if (s.bad) dropped.push(s.bad); else plan.push(s);
      }
      if (!plan.length) return 'Nothing changed: ' + (dropped.join('; ') || 'no steps');
      /* [BW] a delete, or a change larger than safe to spend, asks first; [AI_FIRST_PLAN 7] an amount the person did not
         type is a guess and asks first too */
      const safe = LA.lookahead(book, today).safeToSpend.headline;
      const big = plan.some(s => s.amount && s.amount > safe), del = plan.some(s => s.del);
      const typed = String(said || '').normalize('NFKC').replace(/[,，]/g, '');
      const plain = a => SM.format(a, G.homeOn(book, today)).replace(/[^\d.]/g, '').replace(/\.0+$/, '');
      const guess = plan.filter(s => s.amount && !new RegExp('(^|[^\\d.])' + plain(s.amount) + '(?![\\d])').test(typed));
      const card = { kind: 'change', status: 'ask', lines: plan.map(s => s.text + (guess.includes(s) ? ' (my guess)' : '')), rows: [], plan, dropped };
      if (del || big || guess.length) {
        card.ask = del ? 'delete' : big ? 'large' : 'guess';
        card.why = del ? 'this removes something' : big ? 'this is more than safe to spend' : 'I guessed an amount';
        addTurn(state, { who: 'card', text: card.lines.join('. '), at: deps.told(), card }, shown);
        return resultOf(card) + (dropped.length ? ' Left out: ' + dropped.join('; ') : '');
      }
      const res = await carryOut(state, card, deps);
      addTurn(state, { who: 'card', text: card.lines.join('. '), at: deps.told(), card }, shown);
      return (res.ok ? resultOf(card) : 'Not changed: ' + res.text) + (dropped.length ? ' Left out: ' + dropped.join('; ') : '');
    }
    return 'There is no tool called ' + String(call.name).slice(0, 30);
  }

  /* ---- one turn ---- */
  async function turn(state0, message, deps) {
    const state = clone(state0), shown = [];
    const said = state.turns.filter(t => t.who === 'person').slice(-TURNS).map(t => t.text).join(' ') + ' ' + message;
    addTurn(state, { who: 'person', text: clean(message, 4000), at: deps.told() }, shown);
    const rounds = [];
    const draftWas = JSON.stringify(state.draft);
    const end = stop => {
      if (!state.fill && state.draft && JSON.stringify(state.draft) !== draftWas) {
        state.turns = state.turns.filter(t => !(t.who === 'card' && t.card && t.card.kind === 'draft'));
        addTurn(state, { who: 'card', text: 'The draft so far', at: deps.told(), card: draftCard(state.draft, deps.today()) }, shown);
      }
      return { state, shown, stop };
    };
    for (let i = 0; i < ROUNDS; i++) {
      const body = request(state, clean(message, 4000), rounds, ctxOf(deps));
      let res;
      try { res = await deps.send(body); } catch (e) {
        addTurn(state, { who: 'note', text: 'The AI did not answer: ' + (e && e.message ? e.message : 'try again') + '. Nothing was lost', at: deps.told() }, shown);
        return Object.assign(end('error'), { error: e && e.message });
      }
      const r = read(res);
      if (r.words) addTurn(state, { who: 'ai', text: r.words, at: deps.told() }, shown);
      if (!r.calls.length) return end('words');
      const results = [];
      for (const c of r.calls) {
        let out;
        try { out = await handle(state, c, deps, shown, said); } catch (e) { out = 'That did not work: ' + (e && e.message); }
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
    if (!(await deps.start(built.book))) return { state, shown, ok: false, text: 'This could not be saved on this device. Nothing changed' };
    const v = LA.lookahead(built.book, today), main = built.ids.bank1;
    state.fill = { at: told, told, day: today };
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
{"country": "JP" | "PH" | "XX",
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
    ROUNDS, TURNS, KEEP, MAX_TOKENS, MAX_STEPS, TIER: 'default', EFFORT: 'low', GUIDE, TOOLS, SYSTEM,
    fresh: () => ({ v: 1, turns: [], draft: null, fill: null, seq: 0 }),
    turn, confirm, notNow, undo, startOver, draftEdit,
    fillNow: (s, deps) => fillNow(s, deps),
    copyPrompt, pasteBack,
    request, read, figures, draftCard: (d, today) => draftCard(d, today), fillCheck, sentText,
    handle: async (state0, call, deps) => { const state = clone(state0), shown = []; const result = await handle(state, call, deps, shown, ''); return { state, shown, result }; },
  };
  if (node) module.exports = api;
  else root.CHAT3C = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
