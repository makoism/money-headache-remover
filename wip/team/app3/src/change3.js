/* ---------- change3: what one step changed, in rows a person can read (the coordinator's follow-up, found twice) ----------
   LESSONS lesson 2: the one shared piece, never the case. The assistant's change card (chat3_core carryOut, drawn by
   chat3.js) and the screens' Undo bar (act3's page door) both read these, so "make rent 92,000", "move my phone bill to
   Savings", "rename the card" or "the goal amount is 300,000" show the thing's own before and after, not only safe to
   spend (M5, M6, M12, M14).
   From the step's journal (act3's w.log: added, edited, removed, revived as { list, id }) and the book before and after:
     things(b0, b1, today, j)  rows naming the thing and its own before and after: a bill or a pay (amount, when, paid
                               from or lands in), a goal (goal amount, date, kept in), an account (name, Keep at least,
                               closed), a card (name, paid on, statement closes, paid from), a loan (name, paid on, the
                               usual payment, paid from), a budget line (name, amount). An add says "new", a remove "removed".
     figures(b0, b1, today, o) the engine's own figures that moved: safe to spend, Free to spend left (o.free), each bank
                               today, what each card and loan still owes, what each goal has set aside
     why(b0, b1, today, j)     when safe to spend does not move: one true line why, from the engine's own dates and
                               flags, or null when no reason can be told truly (never a guess)
     amber(b0, b1, today)      a bank that now goes below zero and did not before: one plain line each (M47, never red)
     said(b0, b1, today, j)    the Undo bar's words: the things, then safe to spend (or the why line), then the amber
   A row: { key, label, before, after, money?: true (minor units), state?: 'new' | 'removed' }. Words rows hold words.
   Every figure is the engine's or the record's own; nothing here adds or takes away. Plain browser JavaScript. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? null : root.BurrowEngine;
  const LA = node ? require('../../engine/lookahead.js') : E.lookahead;
  const G = node ? require('../../engine/ledger.js') : E.ledger;
  const S = node ? require('../../engine/schedules.js') : E.schedules;
  const D = node ? require('../../engine/dates.js') : E.dates;
  const IDS = node ? require('../../engine/ids.js') : E.ids;
  const SM = node ? require('../../screens/money.js') : root.BurrowScreens.money;
  const SN = node ? require('../../screens/names.js') : root.BurrowScreens.names;
  const day1 = s => SN.dayLabel(s, false);
  const live = x => x && !x.gone;
  const PATHS = { accounts: ['accounts'], schedules: ['schedules'], places: ['places'], budgets: ['plan', 'budgets'], events: ['events'] };
  const listOf = (b, list) => { let x = b; for (const k of PATHS[list] || [list]) x = x ? x[k] : undefined; return Array.isArray(x) ? x : []; };
  const recOf = (b, list, id) => (b ? listOf(b, list).find(r => r && r.id === id) : undefined);
  const OWN = { bank: 1, cash: 1, ewallet: 1, wallet: 1, investment: 1, paylater: 1 };
  const KIND_WORD = { bill: 'Bill', income: 'Pay', goal: 'Goal', account: 'Account', card: 'Card', loan: 'Loan', line: 'Line' };

  /* how often, as the app says it (one wording: chat3_core's FIGURES reads this too) */
  function ruleWords(r) {
    if (!r) return '';
    if (r.every === 'month') return 'on day ' + r.days.join(' and ') + ' each month';
    if (r.every === 'weeks') return `every ${r.n > 1 ? r.n + ' weeks' : 'week'} from ${day1(r.from)}`;
    if (r.every === 'months') return 'every ' + r.n + ' months';
    if (r.every === 'year') return 'once a year on ' + r.date;
    return 'no fixed day';
  }
  const lookOf = (b, today) => (b ? LA.lookahead(b, today) : null);

  /* the day a schedule's change counts from: the newest dated entry the step added (a change from 1 Dec), else today */
  function fromDay(r0, r1, field, today) {
    const had = new Set(((r0 && r0[field]) || []).map(x => JSON.stringify(x && { from: x.from, amount: x.amount, rule: x.rule })));
    let d = today;
    for (const x of (r1 && r1[field]) || []) if (x && !x.gone && !had.has(JSON.stringify({ from: x.from, amount: x.amount, rule: x.rule })) && x.from && x.from > d) d = x.from;
    return d;
  }
  const acctName = (b, id) => (recOf(b, 'accounts', id) || {}).name;
  const mainOf = b => (G.fieldValue(((b || {}).home || {}).main) || {}).acct;
  const fromWord = s => (s.kind === 'income' ? 'lands in' : 'paid from');
  const closeWords = v => (v == null ? 'not sure' : v === 'last' ? 'the last day' : 'day ' + v);

  /* one thing's rows: its record before (x0) and after (x1), null when it was not there */
  function thingRows(list, id, b0, b1, today, L0, L1) {
    const x0 = live(recOf(b0, list, id)) ? recOf(b0, list, id) : null, x1 = live(recOf(b1, list, id)) ? recOf(b1, list, id) : null;
    const rec = x1 || x0;
    if (!rec) return [];
    const rows = [], name = rec.name, key = list + ':' + id;
    const row = (k, label, before, after, money) => {
      const r = { key: key + ':' + k, label, before, after };
      if (money) r.money = true;
      if (!x0) r.state = 'new'; else if (!x1) r.state = 'removed';
      rows.push(r);
    };
    const both = (k, label, f, money) => {
      const a = x0 ? f(x0, b0, L0) : null, c = x1 ? f(x1, b1, L1) : null;
      if (!x0 || !x1 || JSON.stringify(a) !== JSON.stringify(c)) row(k, label, a, c, money);
    };
    const named = word => { if (x0 && x1 && x0.name !== x1.name) row('name', word + ' name', x0.name, x1.name); };
    if (list === 'schedules') {
      const word = KIND_WORD[rec.kind] || 'Bill';
      named(word);
      const d = fromDay(x0, x1, 'steps', today), dr = fromDay(x0, x1, 'rules', today);
      const on = (dd, s) => (dd > today ? `${s}, from ${day1(dd)}` : s);
      both('amount', on(d, `${name}, amount`), x => S.stepOn(x, D.dayNum(d)), true);
      both('when', on(dr, `${name}, when`), x => ruleWords(S.ruleOnDay(x, D.dayNum(dr))));
      /* one occurrence changed on its own ("the next one only") */
      if (x0 && x1) for (const k of Object.keys(x1.amounts || {})) {
        const a = S.keyAmount(x0.amounts, k), c = S.keyAmount(x1.amounts, k);
        if (a !== c) row('one:' + k, `${name}, the one due ${day1(k)}`, a == null ? S.stepOn(x0, D.dayNum(k)) : a, c == null ? S.stepOn(x1, D.dayNum(k)) : c, true);
      }
      if (x0 && x1) both('acct', `${name}, ${fromWord(rec)}`, (x, b) => acctName(b, x.acct));
      if (x0 && x1 && (x0.ends || null) !== (x1.ends || null)) row('ends', `${name}, last one`, x0.ends ? day1(x0.ends) : 'no end', x1.ends ? day1(x1.ends) : 'no end');
      return rows;
    }
    if (list === 'places') {
      named('Goal');
      both('target', `${name}, goal amount`, x => (x.target == null ? null : x.target), true);
      if (x0 && x1) both('due', `${name}, by`, x => (x.due ? day1(x.due) : 'no date'));
      if (x0 && x1) both('kept', `${name}, kept in`, (x, b) => acctName(b, (x.keptIn || {}).acct));
      return rows;
    }
    if (list === 'budgets') {
      named('Line');
      const d = fromDay(x0, x1, 'steps', today);
      both('amount', d > today ? `${name}, from ${day1(d)}` : name, x => S.stepOn(x, D.dayNum(d)), true);
      return rows;
    }
    if (list === 'accounts') {
      const t = rec.type, word = t === 'card' ? 'Card' : t === 'loan' ? 'Loan' : 'Account';
      named(word);
      if (!x0 || !x1) {   // added or removed: what it holds or owes, the engine's own
        const fig = (x, L) => (!L ? null : t === 'card' ? ((L.cards || {})[id] || {}).owedNow : t === 'loan' ? ((L.owed || {})[id] || {}).owedNow : ((L.accounts || {})[id] || {}).bank);
        const v = x0 ? fig(x0, L0) : fig(x1, L1);
        row('fig', name, x0 ? v : null, x1 ? v : null, v != null);
        return rows;
      }
      if ((x0.closed || null) !== (x1.closed || null)) row('closed', name, x0.closed ? 'closed' : 'open', x1.closed ? 'closed' : 'open');
      if (t === 'card' || t === 'loan') {
        both('payDay', `${name}, paid on`, x => (x.payDay == null ? null : 'day ' + x.payDay));
        if (t === 'card') both('cutDay', `${name}, statement closes`, x => closeWords(x.cutDay));
        if (t === 'loan') both('pay', `${name}, usual payment`, x => (x.amount == null ? null : x.amount), true);
        both('payFrom', `${name}, paid from`, (x, b) => acctName(b, x.payFrom || mainOf(b)));
      } else if (OWN[t]) {
        both('min', `${name}, ${SN.label('minimum')}`, (x, b, L) => (((L && L.accounts) || {})[id] || {}).minimum || 0, true);
      }
      return rows;
    }
    return rows;
  }

  /* the step's things, in the order it touched them; the main bank's Keep at least (home.main) as its account's row */
  function things(b0, b1, today, j) {
    if (!j) return [];
    const L0 = lookOf(b0, today), L1 = lookOf(b1, today), seen = new Set(), out = [];
    const all = [].concat(j.added || [], j.revived || [], j.edited || [], j.removed || []);
    for (const x of all) {
      let list = x.list, id = x.id;
      if (list === 'home' && id === 'main') { list = 'accounts'; id = mainOf(b1) || mainOf(b0); }
      if (list === 'home' && id === 'country') {
        if (seen.has('country')) continue; seen.add('country');
        const c0 = G.fieldValue(((b0 || {}).home || {}).country) || null, c1 = G.fieldValue(((b1 || {}).home || {}).country) || null;
        if (c0 !== c1) out.push({ key: 'home:country', label: 'Where you bank', before: COUNTRY[c0] || 'not set', after: COUNTRY[c1] || 'not set' });
        continue;
      }
      if (!PATHS[list] || list === 'events' || seen.has(list + ':' + id)) continue;
      seen.add(list + ':' + id);
      out.push(...thingRows(list, id, b0, b1, today, L0, L1));
    }
    return out;
  }
  const COUNTRY = { JP: 'Japan', PH: 'the Philippines', XX: 'somewhere else' };

  /* the engine's figures that moved (minor units). o.free: Free to spend left too */
  function figures(b0, b1, today, o) {
    const r0 = LA.lookahead(b0, today), r1 = LA.lookahead(b1, today), nm = id => ((b1.accounts || []).find(x => x.id === id) || {}).name;
    const rows = [{ key: 'safe', label: SN.label('safeToSpend'), before: r0.safeToSpend.headline, after: r1.safeToSpend.headline }];
    const f0 = r0.period && r0.period.free, f1 = r1.period && r1.period.free;
    if ((f0 || f1) && o && o.free) rows.push({ key: 'free', label: 'Free to spend left', before: f0 ? f0.left : null, after: f1 ? f1.left : null });
    for (const id of Object.keys(r1.accounts)) {
      const a0 = r0.accounts[id], a1 = r1.accounts[id];
      if (a1 && a1.bank != null && (!a0 || a0.bank !== a1.bank)) rows.push({ key: 'bank:' + id, label: nm(id) + ' today', before: a0 ? a0.bank : null, after: a1.bank });
    }
    /* [qc-assistant run 2; M30] a card whose figure changed shows it: most spending goes on cards */
    for (const k of ['cards', 'owed']) for (const id of Object.keys(r1[k] || {})) {
      const c0 = (r0[k] || {})[id], c1 = r1[k][id];
      if (c1 && c1.owedNow != null && (!c0 || c0.owedNow !== c1.owedNow)) rows.push({ key: `${k === 'cards' ? 'card' : 'loan'}:${id}`, label: nm(id) + ', ' + SN.label('owed').toLowerCase(), before: c0 ? c0.owedNow : null, after: c1.owedNow });
    }
    for (const id of Object.keys(r1.places || {})) {
      const g0 = (r0.places || {})[id], g1 = r1.places[id];
      if (g0 && g1 && g0.kept !== g1.kept) rows.push({ key: 'goal:' + id, label: (recOf(b1, 'places', id) || {}).name + ', ' + SN.label('setAside').toLowerCase(), before: g0.kept, after: g1.kept });
    }
    return rows;
  }

  /* [M30; the coordinator's ruling 26 Nov] why safe to spend stays: one true line, from the engine's own dates and flags.
     Each reason is said only when it holds for everything the step touched; else nothing (never a guess) */
  function why(b0, b1, today, j) {
    const r0 = LA.lookahead(b0, today), r1 = LA.lookahead(b1, today), s = r1.safeToSpend.headline;
    if (r0.safeToSpend.headline !== s) return null;
    const home = G.homeOn(b1, today), head = `${SN.label('safeToSpend')} stays ${SM.format(s, home)}: `;
    const pay = (r1.daysToNextPay || {}).next_pay, payDay = pay ? day1(pay) : null;
    const nm = (list, id) => (recOf(b1, list, id) || recOf(b0, list, id) || {}).name;
    const touched = j ? [].concat(j.added || [], j.revived || [], j.edited || [], j.removed || []) : [];
    const events = touched.filter(x => x.list === 'events' || x.list === 'checkins');
    const recs = touched.filter(x => x.list !== 'events' && x.list !== 'checkins');
    /* a card the step put more on, or changed, whose next payment is on or after the next pay (the card ruling) */
    const cardIds = Object.keys(r1.cards || {}).filter(id => { const c0 = (r0.cards || {})[id], c1 = r1.cards[id]; return c0 && c1.owedNow > c0.owedNow; });
    const cardsLate = ids => pay && ids.length && ids.every(id => { const c1 = (r1.cards || {})[id], c0 = (r0.cards || {})[id]; return c1 && c1.next && c1.next.payment_date && c1.next.payment_date >= pay && (!c0 || !c0.next || !c0.next.payment_date || c0.next.payment_date >= pay); });
    const and = names => `${names.join(' and ')} ${names.length > 1 ? 'are' : 'is'}`;
    if (cardIds.length && cardsLate(cardIds)) return `${head}${and(cardIds.map(id => nm('accounts', id)))} paid from your bank on or after your next pay`;
    if (!recs.length || events.length) return capped();
    /* names only: a new name moves no money */
    const nameOnly = x => { const a = recOf(b0, x.list, x.id), c = recOf(b1, x.list, x.id); if (!a || !c || !(j.edited || []).includes(x)) return false; return Object.keys(x.before || {}).every(k => k === 'name' || k === 'at' || k === 'by'); };
    if (recs.every(nameOnly)) return `${head}a new name moves no money`;
    const schIds = recs.filter(x => x.list === 'schedules').map(x => x.id);
    const sch = id => recOf(b1, 'schedules', id) || recOf(b0, 'schedules', id);
    const dueIn = (r, id) => (r.dueBeforeNextPay ? r.dueBeforeNextPay.items : []).concat(r.notSeenYet ? r.notSeenYet.items : [], r.mayStillPost || [], (r.checkIn || {}).toConfirm || [])
      .some(o => IDS.scheduleOf(o.item) === id);
    const others = recs.filter(x => x.list !== 'schedules' && !nameOnly(x));
    if (schIds.length && !others.length && !events.length) {
      if (pay && schIds.every(id => (sch(id) || {}).kind === 'bill' && !dueIn(r0, id) && !dueIn(r1, id))) {
        const names = schIds.map(id => nm('schedules', id));
        return `${head}${names.join(' and ')} ${names.length > 1 ? 'are' : 'is'} not due again before your next pay on ${payDay}`;
      }
      if (pay && schIds.every(id => (sch(id) || {}).kind === 'income' && !dueIn(r0, id) && !dueIn(r1, id))) return `${head}it is the money until your next pay on ${payDay}, and a pay counts from the day it lands`;
    }
    /* goals only, and no money moved: a goal amount or date sets nothing aside */
    if (!events.length && recs.every(x => x.list === 'places' || nameOnly(x)) && Object.keys(r1.places || {}).every(id => !(r0.places || {})[id] || r0.places[id].kept === r1.places[id].kept)) return `${head}a goal's amount or date sets no money aside`;
    /* a card's days or paying bank changed, its next payment still on or after the next pay in both */
    const cardEdits = recs.filter(x => x.list === 'accounts' && (recOf(b1, 'accounts', x.id) || {}).type === 'card');
    if (cardEdits.length && cardEdits.length === recs.filter(x => !nameOnly(x)).length && cardsLate(cardEdits.map(x => x.id))) return `${head}${and(cardEdits.map(x => nm('accounts', x.id)))} paid from your bank on or after your next pay`;
    return capped();
    /* the headline is what is left of Free to spend, before and after, and the banks can still spare it */
    function capped() { return r0.safeToSpend.cappedByFreeToSpend && r1.safeToSpend.cappedByFreeToSpend ? `${head}it is what is left of Free to spend, and your bank can still spare that` : null; }
  }

  /* [M47] a bank that now goes below zero (no Keep at least) and did not before: the engine's own day and amount */
  function amber(b0, b1, today) {
    const r0 = LA.lookahead(b0, today), r1 = LA.lookahead(b1, today), home = G.homeOn(b1, today);
    const was = new Set((r0.warnings || []).filter(w => w.code === 'below_minimum' && !w.minimum).map(w => w.account));
    return (r1.warnings || []).filter(w => w.code === 'below_minimum' && !w.minimum && !was.has(w.account)).map(w => {
      const a = recOf(b1, 'accounts', w.account) || {};
      return `${a.name} now goes ${SM.format(w.amount, a.cur || home)} below zero on ${day1(w.day)}. Move money in before then, or pay that from another account`;
    });
  }

  /* a row in words: "Rent, amount: ¥72,000 to ¥75,000", "Gym, amount: new, ¥8,000", "Phone, amount: ¥4,800, removed" */
  function rowText(r, fmt) {
    const v = x => (x == null ? 'none' : r.money ? fmt(x) : x);
    if (r.state === 'new') return `${r.label}: new, ${v(r.after)}`;
    if (r.state === 'removed') return `${r.label}: ${v(r.before)}, removed`;
    return `${r.label}: ${v(r.before)} to ${v(r.after)}`;
  }
  /* the Undo bar's words after the step's own label: its things, safe to spend (or why it stays), a bank going below zero */
  function said(b0, b1, today, j) {
    if (!b0 || !b1) return '';
    const home = G.homeOn(b1, today), rows = things(b0, b1, today, j), safe = figures(b0, b1, today)[0];
    const amounts = [].concat(...rows.filter(r => r.money).map(r => [r.before, r.after]), safe.before, safe.after).filter(x => typeof x === 'number');
    const fmt = SM.formatter(home, amounts);
    const parts = rows.slice(0, 4).map(r => rowText(r, fmt));
    if (rows.length > 4) parts.push('more on Plan');
    if (safe.before !== safe.after) parts.push(`${safe.label}: ${fmt(safe.before)} to ${fmt(safe.after)}`);
    else { const y = why(b0, b1, today, j); if (y) parts.push(y); }
    return parts.concat(amber(b0, b1, today)).join('. ');
  }

  const api = { things, figures, why, amber, said, rowText, ruleWords };
  if (node) module.exports = api;
  else root.CHANGE3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
