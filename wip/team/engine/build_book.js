/* Setup answers into a book, the saved shape version 3 (SCHEMA_V3 sections 0 and 2 to 5; B6, B7, H1, H4, AN3, O3). Pure:
   it works nothing out, it writes what the person answered. WIRING_PLAN step 10.
   buildBook(answers, { newId, by }) returns { book, ids } (ids: each answer's key to the id it was given). Answers:
     { day, told, country, currency,
       banks: [{ key, name, amount, type?: 'bank'|'cash'|'ewallet'|'wallet', main?, min? }],
       pays:  [{ key, name, bank, amount, every: 'month'|'weeks', day | days, n, from, shift?, startsPeriod? }],
       cards: [{ key, name, owed, payDay, closeDay: <1 to 31, 'last'> | 'not sure', payMonths?, payFrom, shift?, inFull? }],
       bills: [{ key, name, from, amount, day | days, every?, n?, shift?, takenOut? }] }
   `takenOut` [X3]: for a bill due between the last pay and the setup day, whether it has already come out of the
   account (true, the default: it is inside the opening figure) or is still to go (false: each such occurrence is
   named in the opening check's `notYet`, so it stays expected and on the check-in list). "The last pay" is the
   period-starting pay (else any pay) landing on or before the setup day; with no pay, the month before setup.
   Amounts are whole minor units of the home currency. `shift` is 'before', 'after' or 'none' (the weekend and holiday
   rule). The first bank is the main one unless another says `main`. Each account opens with one `open` and one `check`
   on the setup day, written together [B6, B7, H1]; a card's opening is what it owes now. A close day "not sure" is saved
   as none: each payment is then all that is owed [H4]. The main bank's minimum lives in home.main with its currency
   [AN3]; skipped means none [M1]. Wrong answers are refused, never guessed. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const D = node ? require('./dates.js') : root.BurrowEngine.dates;
  const S = node ? require('./schedules.js') : root.BurrowEngine.schedules;

  const SHIFTS = { before: 1, after: 1, none: 1 };
  const BANK_TYPES = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };
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
    for (const c of ans.cards || []) {
      const notSure = c.closeDay == null || c.closeDay === 'not sure';
      const x = stamp({ id: idFor(c.key), name: c.name, type: 'card', cur, owner: null, inFull: c.inFull !== false,
        cutDay: notSure ? null : dayOfMonth(c.closeDay, c.name + "'s close day"), payDay: dayOfMonth(c.payDay, c.name + "'s payment day"),
        payMonths: c.payMonths != null ? c.payMonths : 1, shift: shift(c.shift, c.name), payFrom: acctOf(c.payFrom) });
      if (book.accounts.find(a => a.id === x.payFrom).type === 'card') throw new Error(c.name + ' is paid from a card');
      book.accounts.push(x);
      opening(x.id, whole(c.owed, c.name + ' owed'));
    }
    book.home = { curs: [{ from: '1970-01-01', cur, at, by }], country: field(ans.country || 'XX'), mode: field('track'),
      main: field({ acct: ids[main.key], min: main.min != null ? { a: whole(main.min, 'the minimum'), cur } : null }) };

    const ruleOf = (x, what) => {
      const every = x.every || 'month';
      if (every === 'month') {
        const ds = x.days || [x.day];
        ds.forEach(d => dayOfMonth(d, what));
        return { every: 'month', days: ds.slice() };
      }
      if (every === 'weeks') {
        if (!Number.isInteger(x.n || 1) || (x.n || 1) < 1) throw new Error(what + ': every how many weeks? ' + x.n);
        if (!x.from || D.dayStr(D.dayNum(x.from)) !== x.from) throw new Error(what + ': the weeks need the day of one pay');
        return { every: 'weeks', n: x.n || 1, from: x.from };
      }
      throw new Error(what + ': no such rhythm ' + every);
    };
    if ((ans.pays || []).filter(p => p.startsPeriod).length > 1) throw new Error('only one pay starts the period');
    for (const p of ans.pays || []) {
      book.schedules.push(stamp({ id: idFor(p.key), kind: 'income', name: p.name, acct: acctOf(p.bank), cur, shift: shift(p.shift, p.name),
        rules: [{ from: null, rule: ruleOf(p, p.name) }], steps: [{ from: null, amount: whole(p.amount, p.name) }],
        ...(p.startsPeriod ? { startsPeriod: true } : {}) }));
    }
    for (const b of ans.bills || []) {
      book.schedules.push(stamp({ id: idFor(b.key), kind: 'bill', name: b.name, acct: acctOf(b.from), cur, shift: shift(b.shift, b.name),
        rules: [{ from: null, rule: ruleOf(b, b.name) }], steps: [{ from: null, amount: whole(b.amount, b.name) }] }));
    }
    // [X3] bills still to go that were due between the last pay and the setup day
    const toGo = (ans.bills || []).filter(b => b.takenOut === false);
    if (toGo.length) {
      const cal = S.calendar(ans.country || 'XX');
      const d0 = D.dayNum(day), occ = (sch, from) => S.occurrences(sch, cal, from, d0);
      const payStarts = book.schedules.filter(x => x.kind === 'income' && x.startsPeriod);
      const pays = (payStarts.length ? payStarts : book.schedules.filter(x => x.kind === 'income'))
        .map(x => occ(x, d0 - 62).filter(o => o.land <= d0).map(o => o.land)).reduce((a, l) => a.concat(l), []);
      const since = pays.length ? Math.max(...pays) : d0 - 31;
      for (const b of toGo) {
        const sch = book.schedules.find(x => x.id === ids[b.key]);
        const names = occ(sch, since).filter(o => o.land > since && o.land <= d0).map(o => o.id);
        if (!names.length) continue;
        const check = book.events.find(e => e.k === 'check' && e.acct === sch.acct && e.grp === grp);
        check.notYet = (check.notYet || []).concat(names);
      }
    }
    return { book, ids };
  }
  const api = { buildBook };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).build = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
