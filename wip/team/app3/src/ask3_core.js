/* ---------- ask3_core: Ask, the pure half (DECISIONS_ROUND2 E8; the old app's ui4a.js assistant, rebuilt on the new engine) ----------
   A question goes to the AI with a short summary of the engine's figures for today. The AI answers in plain words and
   may propose changes from a fixed list; it never writes. The page shows each proposed change as a ticked step with the
   engine's figures before and after, and only the person's Apply carries them out, through act3 (the one write door),
   with Undo. Nothing here works out money: every figure is the engine's, written with screens/money.js.
     K.summary(book, today) -> { text, refs }   the figures in plain words; records are named by short refs (A1 an
         account you can spend from, L1 a budget line, G1 a goal), never by their ids; no notes, no shops, no single spends
     K.request(summaryText, question, turns) -> { prompt, name, description, schema }   one fixed-shape job for the AI
     K.check(raw, refs, { book, today }) -> { answer, steps, dropped }   the reply checked; each step { text, kind, args, ref }
     K.preview(book, steps, { today, told, newId }) -> { ok, rows: [{ key, label, before, after }], view } or { ok: false, text }
         the steps run on a copy through its own act3, so the figures after are the engine's for the book they would make
     K.apply(door, steps) -> { ok, steps } or { ok: false, text }   each step one act3 step (quiet); a refused one takes
         back the ones before it.  K.undoAll(door, steps) takes all of them back, the last first.
   Plain browser JavaScript; in node, require('./ask3_core.js'). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? null : root.BurrowEngine;
  const LA = node ? require('../../engine/lookahead.js') : E.lookahead;
  const I = node ? require('../../engine/ids.js') : E.ids;
  const G = node ? require('../../engine/ledger.js') : E.ledger;
  const SM = node ? require('../../screens/money.js') : root.BurrowScreens.money;
  const SN = node ? require('../../screens/names.js') : root.BurrowScreens.names;
  const ST = node ? require('../../screens/status.js') : root.BurrowScreens.status;
  const A3 = node ? require('./act3.js') : root.BurrowAct3;
  const PW = () => (node ? require('./plan3_write.js') : root.PLAN3W);
  const MAX = 4, TURNS = 4;
  const SPEND_FROM = { bank: 1, cash: 1, ewallet: 1, wallet: 1, card: 1, paylater: 1 };
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  const live = x => x && !x.gone;
  const clone = x => JSON.parse(JSON.stringify(x));
  const day = (s, today) => SN.dayLabel(s, !!today && s.slice(0, 4) !== today.slice(0, 4));

  /* ---- what is sent: the engine's figures for today, in plain words ---- */
  function summary(book, today) {
    const r = LA.lookahead(book, today), home = G.homeOn(book, today);
    const m = (minor, cur) => SM.format(minor, cur || home);
    const accts = (book.accounts || []).filter(a => live(a) && !a.closed);
    const name = id => { const a = accts.find(x => x.id === id) || (book.accounts || []).find(x => x && x.id === id); if (a) return a.name; const s = (book.schedules || []).find(x => x && x.id === id); return s ? s.name : 'one of your records'; };
    const occName = item => { const o = I.occurrence(item); return name(o ? o.schedule : item); };
    const refs = {}, out = [];
    out.push(`Today is ${SN.dayLabel(today, true)}. Currency: ${home}. Amounts are written as the app writes them.`);
    const p = r.period, np = r.daysToNextPay || {};
    if (p && p.start && p.end) out.push(`This pay period: ${SN.periodLabel(p.start, p.end)}${p.payToday ? ', and the next pay lands today' : ''}.`);
    if (np.next_pay) {
      const st = p && p.nextPay ? p.nextPay.state : null;
      out.push(`Next pay: ${day(np.next_pay, today)}${st === 'late' || np.late ? ', late' : st === 'notSeen' ? ', not seen in the bank yet' : ', in ' + np.days + ' days'}.`);
    } else out.push('No pay day is set.');
    /* [BL3] short as Home says it: the sum's own total, before the pay after its lowest point (only when one brings money),
       and the first day under */
    const sh = r.safeToSpend.short;
    out.push(`Safe to spend until next pay: ${m(r.safeToSpend.headline)}.` + (sh ? ` Short by ${m(sh.amount)}${sh.beforePay ? ` before the pay on ${day(sh.beforePay, today)}` : ''}, below ${sh.minimum ? 'your minimum' : 'zero'} from ${day(sh.day, today)}.` : ''));
    /* [CARDS_IN_HEADLINE 3, R1] no play amount: what the cards take off now, so "why did it drop?" is answered from the figures */
    if (r.safeToSpend.cardsNow) out.push(`No play amount is set, so safe to spend takes off everything owed now on your cards paid in full: ${m(r.safeToSpend.cardsNow.owed)}.`);
    const rows = [];
    let k = 0;
    for (const a of accts.filter(x => SPEND_FROM[x.type])) {
      const ref = 'A' + (++k); refs[ref] = a.id;
      const fig = r.accounts[a.id];
      rows.push(`${ref} | ${a.name} | ${a.type} | ` + (fig ? `${m(fig.bank, fig.currency)} today, checked ${fig.ageDays === 0 ? 'today' : fig.ageDays === 1 ? 'yesterday' : fig.ageDays < 0 ? 'on a later day' : fig.ageDays + ' days ago'}` : 'see cards'));
    }
    out.push('Accounts you can spend from (ref | name | kind | bank today):\n' + rows.join('\n'));
    for (const id of Object.keys(r.accounts)) if (r.accounts[id].spendFrom && r.accounts[id].whyParts) out.push(`How safe to spend is worked out for ${name(id)}: ${SM.sumLine(r.accounts[id].whyParts, r.accounts[id].headroom, r.accounts[id].currency)}`);   // [S4] as Home writes it
    /* [qc-assistant blocker 2; M36, M51] the other sums Home writes under the headline, in Home's own words (the engine's
       parts, worded once in screens/status.js): what Free to spend holds back, and the short amount's own sum */
    const cap = ST.capParts(r, x => m(x));
    if (cap) out.push(`Why safe to spend is ${m(r.safeToSpend.headline)}: ${SM.sumLine(cap, r.safeToSpend.headline, home)}`);
    const shA = sh && r.accounts[sh.account] && r.accounts[sh.account].real;
    if (shA) out.push(`How the short amount is worked out: ${SM.sumLine(shA.whyParts, shA.headroom, r.accounts[sh.account].currency)}`);
    const lines = (p && p.lines) || [];
    if (lines.length) {
      // [QC F5, B2] the amount that counts this period, the full amount a period beside it only when they differ
      out.push('Budget lines this pay period (ref | name | amount | left):\n' + lines.map((l, i) => { const ref = 'L' + (i + 1); refs[ref] = l.id; return `${ref} | ${l.name} | ${m(l.counts)}${l.counts !== l.amount ? ` (part of ${m(l.amount)} a period, for the days left)` : ''} | ${m(l.left)} left`; }).join('\n'));
    } else out.push('Budget lines: none yet.');
    out.push(p && p.free ? `Free to spend this pay period: ${m(p.free.counts)}${p.free.counts !== p.free.amount ? ` (part of ${m(p.free.amount)} a period, for the days left)` : ''}, ${m(p.free.left)} left.` : 'Free to spend: not set yet.');
    const goals = (book.places || []).filter(g => live(g) && g.kind === 'goal');
    if (goals.length) {
      out.push('Goals (ref | name | set aside | date | pace):\n' + goals.map((g, i) => {
        const ref = 'G' + (i + 1), f = r.places[g.id] || {}; refs[ref] = g.id;
        return `${ref} | ${g.name} | ${m(f.kept || 0)} set aside${f.target != null ? ' of ' + m(f.target) : ''}` + (f.due ? ` | by ${day(f.due, today)}` : ' | no date') + (f.perPeriod != null ? ` | ${m(f.perPeriod)} each pay period to get there` : '');
      }).join('\n'));
    } else out.push('Goals: none yet.');
    const due = r.dueBeforeNextPay;
    out.push(due.items.length ? `Due before next pay: ${due.items.map(o => `${occName(o.item)} ${day(o.lands, today)} ${m(o.amount, o.currency)}`).join('; ')}. Together ${m(due.total)}.` : 'Nothing is due before next pay.');
    if (r.notSeenYet.items.length) out.push(`Due and not ticked off yet: ${r.notSeenYet.items.map(o => `${occName(o.item)} ${day(o.lands, today)} ${m(o.amount, o.currency)}`).join('; ')}.`);
    const cards = Object.keys(r.cards);
    if (cards.length) out.push('Cards (name | owed | next payment):\n' + cards.map(id => { const c = r.cards[id], nx = c.next; return `${name(id)} | ${m(c.owedNow, (accts.find(a => a.id === id) || {}).cur)} owed | ` + (nx && nx.amount ? `next payment ${m(nx.amount)} on ${day(nx.payment_date, today)}` : 'nothing to pay yet') + ((c.overdue || []).length ? ' | a payment is overdue' : ''); }).join('\n'));
    const owed = Object.keys(r.owed || {});
    if (owed.length) out.push('Loans (name | owed): ' + owed.map(id => `${name(id)} | ${m(r.owed[id].owedNow != null ? r.owed[id].owedNow : 0)}`).join('; ') + '.');
    /* [S4] the notes in the same words as Home (screens/status.js), each amount with its currency */
    const wctx = { currency: home, names: Object.fromEntries(accts.map(a => [a.id, a.name])), accounts: r.accounts };
    for (const w of r.warnings || []) out.push('Note: ' + ST.warningText(w, wctx));
    for (const l of r.laterOn || []) out.push('Note: ' + ST.laterText(l, wctx));
    return { text: out.join('\n'), refs };
  }

  /* ---- the job for the AI ---- */
  const ACTIONS = ['log_spend', 'change_line', 'set_free', 'set_aside'];
  const SCHEMA = { type: 'object', properties: {
    answer: { type: 'string', description: 'The reply to the person, in plain words.' },
    actions: { type: 'array', description: 'Changes to propose, or an empty list.', items: { type: 'object', properties: {
      do: { type: 'string', enum: ACTIONS },
      amount: { type: 'number', description: 'A plain number in the currency, no symbol.' },
      line: { type: 'string', description: 'A budget line ref like L1.' }, goal: { type: 'string', description: 'A goal ref like G1.' },
      account: { type: 'string', description: 'An account ref like A1.' }, date: { type: 'string', description: 'YYYY-MM-DD, today or before.' },
      note: { type: 'string', description: 'A few words.' }, when: { type: 'string', enum: ['now', 'next', 'once'] } }, required: ['do'] } } },
    required: ['answer', 'actions'] };
  const GUIDE = `You answer questions inside The Burrow, a money app the person has open right now. The FIGURES below are worked out by the app for today and are exact. Use them. Don't work out new totals of your own beyond a simple comparison.

How to answer: plain words and short sentences, like a friend who is good with money talking. Usually under 80 words. Plain text: no headings, no bold, no tables, no exclamation marks, no greeting, no praise. Say the number and the day. If the figures don't say, say so in a few words instead of guessing. You are not a licensed adviser: for investments, loans or taxes, say so in one line.

You never change anything yourself. When the person says they spent something, or asks to change a budget line, Free to spend, or to set money aside for a goal, put the change in actions. The app shows it to them and nothing changes until they tap Apply. For a "what if", propose the change: they see the before and after and can say no. No action when nothing should change. At most ${MAX} actions. Use only the refs in the FIGURES (A1, L1, G1). Amounts are plain numbers in the currency, without the symbol.
Actions:
- log_spend {amount, line?, account?, date?, note?}: money already spent. line is an L ref (left out: Free to spend). account is an A ref (left out: the main bank). date is YYYY-MM-DD, today or before (left out: today). note is a few words.
- change_line {line, amount, when?}: a budget line's amount each pay period. when: now (this pay period on, the default), next (from the next pay period), once (this pay period only).
- set_free {amount, when?}: Free to spend each pay period, the same when.
- set_aside {goal, amount}: money set aside for a goal today.`;
  function request(text, question, turns) {
    const past = (turns || []).slice(-TURNS).map(x => `Person: ${x.q}\nYou: ${x.a}`).join('\n');
    const prompt = `${GUIDE}\n\nFIGURES\n${text}` + (past ? `\n\nEARLIER IN THIS CHAT\n${past}` : '') + `\n\nTHE QUESTION\n${question}`;
    return { prompt, name: 'money_answer', description: 'The answer to the person, and any changes proposed for them to apply.', schema: SCHEMA };
  }

  /* ---- the reply, checked ---- */
  const WHEN = { now: 'from this pay period', next: 'from the next pay period', once: 'for this pay period only' };
  function check(raw, refs, ctx) {
    const book = ctx.book, today = ctx.today, home = G.homeOn(book, today), r = LA.lookahead(book, today);
    const m = (minor, cur) => SM.format(minor, cur || home);
    const answer = String((raw && raw.answer) || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').replace(/\*\*/g, '').trim().slice(0, 1500);
    const list = Array.isArray(raw && raw.actions) ? raw.actions : [];
    const steps = [], dropped = [];
    const refOf = (v, letter) => (typeof v === 'string' && v.charAt(0) === letter && refs[v] ? refs[v] : null);
    const amountOf = (v, cur, zero) => { if (typeof v !== 'number' && typeof v !== 'string') return null; const p = SM.parse(String(v), cur || home); return p.ok && (zero ? p.minor >= 0 : p.minor > 0) ? p.minor : null; };
    const acctName = id => ((book.accounts || []).find(a => a && a.id === id) || {}).name;
    const lineOf = id => ((r.period && r.period.lines) || []).find(l => l.id === id);
    const mainAcct = (G.fieldValue((book.home || {}).main) || {}).acct;
    for (const a of list) {
      const what = a && typeof a === 'object' ? String(a.do || '') : '';
      if (steps.length >= MAX) { dropped.push((what || 'a change') + ': more than ' + MAX + ' at a time'); continue; }
      if (what === 'log_spend') {
        const acct = a.account != null ? refOf(a.account, 'A') : (mainAcct && Object.values(refs).includes(mainAcct) ? mainAcct : refs.A1);
        const cur = acct && ((book.accounts || []).find(x => x.id === acct) || {}).cur;
        const amt = amountOf(a.amount, cur);
        const line = a.line == null || a.line === '' ? 'free' : refOf(a.line, 'L');
        const date = a.date == null || a.date === '' ? today : DAY.test(String(a.date)) && a.date <= today ? a.date : null;
        if (!acct || amt == null || !line || !date) { dropped.push('a spend I could not read'); continue; }
        const note = typeof a.note === 'string' && a.note.trim() ? a.note.replace(/\s+/g, ' ').trim().slice(0, 60) : undefined;
        const ln = line === 'free' ? 'Free to spend' : (lineOf(line) || {}).name;
        steps.push({ kind: 'logSpend', ref: line === 'free' ? null : a.line, args: [{ date, a: amt, acct, line, note }],
          text: `Log a spend of ${m(amt, cur)} on ${ln} from ${acctName(acct)}, ${date === today ? 'today' : day(date, today)}${note ? ' (' + note + ')' : ''}` });
      } else if (what === 'change_line') {
        const id = refOf(a.line, 'L'), l = id && lineOf(id), amt = amountOf(a.amount, home, true), when = WHEN[a.when] ? a.when : 'now';
        if (!l || amt == null) { dropped.push('a change to a line I could not read'); continue; }
        steps.push({ kind: 'changeLine', ref: a.line, args: [id, { amount: amt, when }], text: `${l.name}: ${m(l.amount)} to ${m(amt)} each pay period, ${WHEN[when]}` });
      } else if (what === 'set_free') {
        const amt = amountOf(a.amount, home, true), when = WHEN[a.when] ? a.when : 'now', f = r.period && r.period.free;
        if (amt == null) { dropped.push('a change to Free to spend I could not read'); continue; }
        steps.push({ kind: 'setFree', ref: null, args: [{ amount: amt, when }], text: `Free to spend: ${f ? m(f.amount) + ' to ' : ''}${m(amt)} each pay period, ${WHEN[when]}` });
      } else if (what === 'set_aside') {
        const id = refOf(a.goal, 'G'), g = id && (book.places || []).find(x => x.id === id), amt = amountOf(a.amount, home);
        if (!g || amt == null) { dropped.push('money for a goal I could not read'); continue; }
        steps.push({ kind: 'setAside', ref: a.goal, args: [id, { amount: amt }], text: `Set aside ${m(amt)} for ${g.name}, today` });
      } else dropped.push(what ? 'a change Ask can\'t make (' + what.slice(0, 30) + ')' : 'a change I could not read');
    }
    return { answer, steps, dropped };
  }

  /* ---- running the steps through a door (act3) ---- */
  function runOne(door, s, opts) {
    if (s.kind === 'logSpend') return door.logSpend(s.args[0], opts);
    return door.run('Ask: ' + s.text, w => PW()[s.kind](w, ...s.args), opts);
  }
  async function undoAll(door, done) {
    for (const st of done.slice().reverse()) {
      const u = await door.undo(st.id, { quiet: true });
      if (!u.ok) return { ok: false, text: u.text };
    }
    return { ok: true };
  }
  async function apply(door, steps) {
    const done = [];
    for (const s of steps) {
      const res = await runOne(door, s, { quiet: true });
      if (!res.ok) { await undoAll(door, done); return { ok: false, text: s.text + ': ' + res.text }; }
      done.push(res.step);
    }
    return { ok: true, steps: done };
  }
  async function preview(book, steps, o) {
    let b = clone(book);
    const door = A3.make({ book: () => b, put: async x => { b = x; return true; }, told: o.told, newId: o.newId, today: () => o.today, check: x => LA.lookahead(x, o.today) });
    const res = await apply(door, steps);
    if (!res.ok) return res;
    const r0 = LA.lookahead(book, o.today), r1 = LA.lookahead(b, o.today);
    const rows = [{ key: 'safe', label: SN.label('safeToSpend'), before: r0.safeToSpend.headline, after: r1.safeToSpend.headline }];
    const f0 = r0.period && r0.period.free, f1 = r1.period && r1.period.free;
    if (f0 || f1) rows.push({ key: 'free', label: 'Free to spend left', before: f0 ? f0.left : null, after: f1 ? f1.left : null });
    const seen = {};
    for (const s of steps) {
      if (!s.ref || seen[s.ref]) continue;
      seen[s.ref] = 1;
      if (s.ref.charAt(0) === 'L') {
        const id = s.kind === 'changeLine' ? s.args[0] : s.args[0].line, at = r => ((r.period && r.period.lines) || []).find(l => l.id === id);
        const l0 = at(r0), l1 = at(r1);
        rows.push({ key: 'line:' + s.ref, label: (l0 || l1 || {}).name + ' left', before: l0 ? l0.left : null, after: l1 ? l1.left : null });
      } else if (s.ref.charAt(0) === 'G') {
        const id = s.args[0], g = (book.places || []).find(x => x.id === id);
        rows.push({ key: 'goal:' + s.ref, label: g.name + ' set aside', before: (r0.places[id] || {}).kept || 0, after: (r1.places[id] || {}).kept || 0 });
      }
    }
    return { ok: true, rows, view: r1 };
  }

  const api = { summary, request, check, preview, apply, undoAll, SCHEMA, MAX };
  if (node) module.exports = api;
  else root.ASK3C = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
