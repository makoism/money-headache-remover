/* Setup answers into a book, the saved shape version 3 (SCHEMA_V3 sections 0 and 2 to 5; B6, B7, H1, H4, AN3, O3). Pure:
   it works nothing out, it writes what the person answered. WIRING_PLAN step 10.
   buildBook(answers, { newId, by }) returns { book, ids } (ids: each answer's key to the id it was given). Answers:
     { day, told, country, currency,
       banks: [{ key, name, amount, type?: 'bank'|'cash'|'ewallet'|'wallet', main?, min? }],
       pays:  [{ key, name, bank, amount, every: 'month'|'weeks'|'months'|'year'|'none', day | days, n, start | from, date, shift?, startsPeriod? }],
       cards: [{ key, name, owed, payDay, closeDay: <1 to 31, 'last'> | 'not sure', payMonths?, payFrom, shift?, inFull? }],
       bills: [{ key, name, from, amount, day | days, every?, n?, start?, date?, shift?, takenOut? }],
     Rhythms [slice 6]: 'month' (day or days), 'weeks' and 'months' (every n, from `start`, the day of one; a pay may say
     `from`), 'year' (`date` 'MM-DD'), 'none' (a pay with no fixed day: no amount needed, never starts the period [B4]).
       free?: what goes on food and everyday things each pay period, or null for not said }
   `free` [north star F1, BJ2] is Free to spend: the first plan amount, a `plan.shares` entry from the setup day (the
   period holding the setup day counts its share for the days left, as Plan does). Left out: no Free to spend.
   `takenOut` [X3]: for a bill due between the last pay and the setup day, whether it has already come out of the
   account (true, the default: it is inside the opening figure) or is still to go (false: each such occurrence is
   named in the opening check's `notYet`, so it stays expected and on the check-in list). The result's `asked` gives,
   for each bill key with such an occurrence, its landing days (YYYY-MM-DD): the bills setup asks about. "The last pay" is the
   period-starting pay (else any pay) landing on or before the setup day; with no pay, the month before setup.
   Amounts are whole minor units of the home currency. `shift` is 'before', 'after' or 'none' (the weekend and holiday
   rule). The first bank is the main one unless another says `main`. Each account opens with one `open` and one `check`
   on the setup day, written together [B6, B7, H1]; a card's opening is what it owes now. A close day "not sure" is saved
   as none: each payment is then all that is owed [H4]. [BL6] `askedStatements` gives, for each card key set up after
   its close day and before that statement's payment day, { closed, payment } (YYYY-MM-DD, the payment after the weekend
   rule); the card's answer `statement` (how much of `owed` was on that statement) is saved as its own `stmt` check. The main bank's minimum lives in home.main with its currency
   [AN3]; skipped means none [M1]. Wrong answers are refused, never guessed. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const D = node ? require('./dates.js') : root.BurrowEngine.dates;
  const S = node ? require('./schedules.js') : root.BurrowEngine.schedules;

  const SHIFTS = { before: 1, after: 1, none: 1 };
  const BANK_TYPES = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };
  // [slice 6] the day of one pay every n weeks, stepped back by whole n weeks until it is on or before `day` (YYYY-MM-DD)
  function weeksAnchor(start, day, n) {
    const step = 7 * (n || 1), a = D.dayNum(start), d = D.dayNum(day);
    return a <= d ? start : D.dayStr(a - Math.ceil((a - d) / step) * step);
  }
  const PAY_NEEDS_AMOUNT = 'A pay needs an amount. If it comes when it comes, pick No fixed pay';
  function buildBook(ans, opts) {
    const newId = opts.newId, by = opts.by || String(newId()).split('-')[0];
    const day = ans.day, told = ans.told, at = ans.told, cur = ans.currency;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || D.dayStr(D.dayNum(day)) !== day) throw new Error('the setup day is not a date: ' + day);
    if (!told) throw new Error('the setup answers need the moment they were told');
    if (!cur) throw new Error('the setup answers need the home currency');
    const whole = (v, what) => { if (!Number.isInteger(v)) throw new Error(what + ' is not a whole amount in minor units: ' + v); return v; };
    const shift = (v, what) => { const s = v == null ? 'none' : v; if (!SHIFTS[s]) throw new Error(what + ': no such weekend rule ' + v); return s; };
    const dayOfMonth = (v, what) => { if (v !== 'last' && !(Number.isInteger(v) && v >= 1 && v <= 31)) throw new Error(what + ': no such day ' + v); return v; };
    const ids = {};
    const idFor = key => {
      if (key == null || key === '') throw new Error('every answer needs its key');
      if (ids[key]) throw new Error('the key ' + key + ' is used twice');
      return (ids[key] = newId());
    };
    const stamp = r => Object.assign(r, { told, at, by });
    const field = v => ({ v, at, by });

    const book = { v: 3, home: {}, people: [], accounts: [], places: [], schedules: [], events: [], checkins: [], plan: { shares: [], budgets: [] } };
    const banks = ans.banks || [];
    if (!banks.length) throw new Error('setup needs at least one bank');
    const main = banks.find(b => b.main) || banks[0];
    if (banks.filter(b => b.main).length > 1) throw new Error('only one main bank');
    const grp = newId();   // the setup moment: its opens and checks belong together
    const opening = (acct, amount) => {
      book.events.push(stamp({ id: newId(), k: 'open', acct, date: day, a: amount, grp }));
      book.events.push(stamp({ id: newId(), k: 'check', acct, date: day, a: amount, grp }));
    };

    for (const b of banks) {
      const type = b.type || 'bank';
      if (!BANK_TYPES[type]) throw new Error(b.name + ': no such kind of account ' + type);
      const x = stamp({ id: idFor(b.key), name: b.name, type, cur, owner: null });
      if (b !== main && b.min != null) x.minBank = { a: whole(b.min, b.name + "'s minimum"), cur };
      book.accounts.push(x);
      opening(x.id, whole(b.amount, b.name));
    }
    const acctOf = key => { if (!ids[key]) throw new Error('no account ' + key); return ids[key]; };
    // [BL6] the statement closed last (on or before the setup day) and its payment day after the weekend rule, when the
    // setup day falls after that close and before that payment day; else null
    const askedStatements = {};
    const statementGap = card => {
      const d0 = D.dayNum(day), [y, mo] = D.ymOf(d0), here = D.dayIn(y, mo, card.cutDay);
      const closed = here <= d0 ? here : D.dayIn(y, mo - 1, card.cutDay);
      const [cy, cm] = D.ymOf(closed), cal = S.calendar(ans.country || 'XX');
      const land = cal.shift(D.dayIn(cy, cm + card.payMonths, card.payDay), card.shift);
      return closed < d0 && d0 < land ? { closed: D.dayStr(closed), payment: D.dayStr(land) } : null;
    };
    for (const c of ans.cards || []) {
      const notSure = c.closeDay == null || c.closeDay === 'not sure';
      const x = stamp({ id: idFor(c.key), name: c.name, type: 'card', cur, owner: null, inFull: c.inFull !== false,
        cutDay: notSure ? null : dayOfMonth(c.closeDay, c.name + "'s close day"), payDay: dayOfMonth(c.payDay, c.name + "'s payment day"),
        payMonths: c.payMonths != null ? c.payMonths : 1, shift: shift(c.shift, c.name), payFrom: acctOf(c.payFrom) });
      if (book.accounts.find(a => a.id === x.payFrom).type === 'card') throw new Error(c.name + ' is paid from a card');
      book.accounts.push(x);
      opening(x.id, whole(c.owed, c.name + ' owed'));
      // [BL6, AB3, J5] set up after a close and before that statement's payment day: setup asks how much was on it; the
      // answer is its own check with `stmt: true`, due on the coming payment day (0: nothing on it, so it is paid)
      const gap = notSure ? null : statementGap(x);
      if (gap) askedStatements[c.key] = gap;
      if (c.statement != null) {
        if (!gap) throw new Error(c.name + ': a statement figure is asked only between its close day and its payment day');
        const a = whole(c.statement, c.name + "'s statement");
        book.events.push(stamp({ id: newId(), k: 'check', acct: x.id, date: day, a, stmt: true, stmtDate: gap.closed, paid: a === 0, grp }));
      }
    }
    book.home = { curs: [{ from: '1970-01-01', cur, at, by }], country: field(ans.country || 'XX'), mode: field('track'),
      main: field({ acct: ids[main.key], min: main.min != null ? { a: whole(main.min, 'the minimum'), cur } : null }) };

    // [slice 6] `start` is the day of one occurrence (weeks, months); a pay may give it as `from` too (a bill's `from` is
    // its account). `year` takes `date` 'MM-DD'. `none` is a pay with no fixed day [B4].
    const isDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && D.dayStr(D.dayNum(s)) === s;
    const ruleOf = (x, what, start) => {
      const every = x.every || 'month';
      if (every === 'month') {
        const ds = x.days || [x.day];
        ds.forEach(d => dayOfMonth(d, what));
        return { every: 'month', days: ds.slice() };
      }
      if (every === 'weeks') {
        if (!Number.isInteger(x.n || 1) || (x.n || 1) < 1) throw new Error(what + ': every how many weeks? ' + x.n);
        if (!isDay(start)) throw new Error(what + ': the weeks need the day of one pay');
        // [qc-foundation] a pay day given in the future (the next pay) is stepped back by n weeks until it is on or
        // before the setup day, so the pay period holding the setup day exists
        return { every: 'weeks', n: x.n || 1, from: weeksAnchor(start, day, x.n || 1) };
      }
      if (every === 'months') {
        if (!Number.isInteger(x.n) || x.n < 1) throw new Error(what + ': every how many months? ' + x.n);
        if (!isDay(start)) throw new Error(what + ': every few months needs the day of one');
        return { every: 'months', n: x.n, from: start };
      }
      if (every === 'year') {
        const m = /^(\d\d)-(\d\d)$/.exec(x.date || '');
        if (!m || +m[1] < 1 || +m[1] > 12 || +m[2] < 1 || +m[2] > D.daysInMonth(2028, +m[1])) throw new Error(what + ': no such day of the year ' + x.date);
        return { every: 'year', date: x.date };
      }
      if (every === 'none') return { every: 'none' };
      throw new Error(what + ': no such rhythm ' + every);
    };
    if ((ans.pays || []).filter(p => p.startsPeriod).length > 1) throw new Error('only one pay starts the period');
    for (const p of ans.pays || []) {
      const none = p.every === 'none';
      // [B4] a pay with no fixed day has no fixed amount and never starts the period: the money is logged as it comes in
      if (none && p.startsPeriod) throw new Error(p.name + ' has no fixed day, so it cannot start the pay period');
      // [BL1] a fixed pay always has an amount, so its check-in item can be ticked
      if (!none && p.amount === 0) throw new Error(PAY_NEEDS_AMOUNT);
      book.schedules.push(stamp({ id: idFor(p.key), kind: 'income', name: p.name, acct: acctOf(p.bank), cur, shift: shift(p.shift, p.name),
        rules: [{ from: null, rule: ruleOf(p, p.name, p.start || p.from) }], steps: [{ from: null, amount: none && p.amount == null ? null : whole(p.amount, p.name) }],
        ...(p.startsPeriod ? { startsPeriod: true } : {}) }));
    }
    for (const b of ans.bills || []) {
      if (b.every === 'none') throw new Error(b.name + ': a bill needs a day');
      book.schedules.push(stamp({ id: idFor(b.key), kind: 'bill', name: b.name, acct: acctOf(b.from), cur, shift: shift(b.shift, b.name),
        rules: [{ from: null, rule: ruleOf(b, b.name, b.start) }], steps: [{ from: null, amount: whole(b.amount, b.name) }] }));
    }
    // [X3] bills due between the last pay and the setup day: `asked` names each one's landing days (setup asks about
    // those, QC F3), and the ones still to go are marked on the opening check
    const asked = {};
    const toGo = (ans.bills || []).filter(b => b.takenOut === false);
    if ((ans.bills || []).length) {
      const cal = S.calendar(ans.country || 'XX');
      const d0 = D.dayNum(day), occ = (sch, from) => S.occurrences(sch, cal, from, d0);
      const payStarts = book.schedules.filter(x => x.kind === 'income' && x.startsPeriod);
      const pays = (payStarts.length ? payStarts : book.schedules.filter(x => x.kind === 'income'))
        .map(x => occ(x, d0 - 62).filter(o => o.land <= d0).map(o => o.land)).reduce((a, l) => a.concat(l), []);
      const since = pays.length ? Math.max(...pays) : d0 - 31;
      for (const b of ans.bills) {
        const sch = book.schedules.find(x => x.id === ids[b.key]);
        const inside = occ(sch, since).filter(o => o.land > since && o.land <= d0);
        if (inside.length) asked[b.key] = inside.map(o => D.dayStr(o.land));
        const names = inside.map(o => o.id);
        if (!names.length || !toGo.includes(b)) continue;
        const check = book.events.find(e => e.k === 'check' && e.acct === sch.acct && e.grp === grp);
        check.notYet = (check.notYet || []).concat(names);
      }
    }
    if (ans.free != null) {
      if (ans.free < 0) throw new Error('what goes on everyday things cannot be below zero');
      book.plan.shares.push(stamp({ id: newId(), from: day, cur, per: { free: 'pay' }, free: whole(ans.free, 'what goes on everyday things'), goals: {} }));
    }
    return { book, ids, asked, askedStatements };
  }
  const api = { buildBook, weeksAnchor, PAY_NEEDS_AMOUNT };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).build = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
