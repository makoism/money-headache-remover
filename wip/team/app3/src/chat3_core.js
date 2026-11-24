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
   Plain browser JavaScript. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const later = name => () => { throw new Error('chat3_core: ' + name + ' is not built yet'); };
  const api = {
    ROUNDS: 6, TURNS: 10, KEEP: 200, MAX_TOKENS: 2000, MAX_STEPS: 6, TIER: 'default', EFFORT: 'low', GUIDE: [], TOOLS: [],
    fresh: () => ({ v: 1, turns: [], draft: null, fill: null, seq: 0 }),
    turn: later('turn'), confirm: later('confirm'), notNow: later('notNow'), undo: later('undo'), startOver: later('startOver'),
    draftEdit: later('draftEdit'), fillNow: later('fillNow'), request: later('request'), read: later('read'), figures: later('figures'),
    draftCard: later('draftCard'), fillCheck: later('fillCheck'), handle: later('handle'), sentText: later('sentText'),
  };
  if (node) module.exports = api;
  else root.CHAT3C = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
