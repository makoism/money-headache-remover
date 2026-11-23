// Turns a scenario file (foundation_review/scenarios/*.json, written without saved field names) into the saved shape
// version 3 the engine reads (SCHEMA_V3 sections 2 to 8), following SCHEMA_V3 section 13 ("What the scenario files call
// each thing"). Test code only: the app writes the saved shape itself.
// Returns { book, opts } where opts carries what the saved copy does not: the holiday tables listed in the file (a
// test's own tables replace the built-in ones) and the device's offset.
'use strict';
const U = require('../units.js');
const D = require('../dates.js');

const SHIFT = { 'move earlier': 'before', 'move later': 'after', none: 'none' };
const KIND = { bank: 'bank', cash: 'cash', ewallet: 'ewallet', wallet: 'wallet', card: 'card', loan: 'loan', paylater: 'paylater', investment: 'investment', owed_to_you: 'owedToYou', owedToYou: 'owedToYou' };
// a keyed override entry [AE1]: the scenario's entry with its amount in minor units (a plain number stays plain, so the
// engine refuses it as the reference does [AH3])
const key = (v, c) => (v && typeof v === 'object' ? Object.assign({}, v, { amount: U.minorOf(v.amount, c) }) : v);

function convRule(r) {
  if (!r) return { every: 'none' };
  switch (r.frequency) {
    case 'monthly': return { every: 'month', days: r.days || [r.day] };
    case 'every_n_months': return { every: 'months', n: r.n, day: r.day, from: r.from };
    case 'every_n_weeks': return { every: 'weeks', n: r.n, from: r.from };
    case 'weekly': {
      if (r.from) return { every: 'weeks', n: 1, from: r.from };
      const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[r.weekday];
      let a = D.dayNum('2000-01-02'); while (D.weekday(a) !== wd) a++;
      return { every: 'weeks', n: 1, from: D.dayStr(a) };
    }
    case 'months_list': return { every: 'monthsList', months: r.months, day: r.day };
    case 'yearly': return { every: 'year', date: r.date };
    case 'last_workday': return { every: 'lastWorkday' };
    case 'once': return { every: 'once', date: r.date };
    default: return { every: 'none' };
  }
}

function convert(sc) {
  const home = sc.currency;
  const acctOf = {}; for (const a of sc.accounts) acctOf[a.id] = a;
  const cur = id => (acctOf[id] ? acctOf[id].currency : home);
  const mn = (x, c) => (x == null ? x : U.minorOf(x, c));
  const zone = sc.device_offset || null;
  const movedZone = (sc.moved_copy && D.offsetOf(sc.moved_copy.saved)) || zone;
  // [X9] a time with no offset of its own is in the writing device's offset; a date alone stays a date (the start of
  // its day, records on one day keeping the order they are listed in), read in the device's offset by the engine.
  const zoned = (t, z) => (t && t.length > 10 && !D.offsetOf(t) && z ? t + z : t);
  const opts = { calendars: {}, deviceOffset: zone };

  // ----- calendars -----
  const homeCountry = (sc.holidays && sc.holidays.country) || 'XX';
  const table = h => ({ holidays: (h.dates || []).map(x => x.date), bankClosed: (h.bank_closed || []).map(x => x.date) });
  opts.calendars[homeCountry] = sc.holidays ? table(sc.holidays) : { holidays: [], bankClosed: [] };

  const book = { v: 3, home: {}, people: [], accounts: [], places: [], schedules: [], events: [], checkins: [], plan: { shares: [], budgets: [] } };
  book.home.curs = (sc.home_curs && sc.home_curs.length ? sc.home_curs.map((h, i) => ({ from: i === 0 ? '1970-01-01' : h.from, cur: h.cur })) : [{ from: '1970-01-01', cur: home }]);
  book.home.country = { v: homeCountry };
  book.home.mode = { v: 'track' };
  const mainId = sc.main_bank || null;
  const main = mainId && acctOf[mainId];
  // [AN3, AS11] the main bank's minimum lives in home.main with its own currency; a file may name it apart (`main_minimum`)
  const mm = sc.main_minimum;
  book.home.main = { v: { acct: mainId, min: mm ? { a: mn(mm.amount, mm.currency), cur: mm.currency }
    : main && main.minimum ? { a: mn(main.minimum, main.currency), cur: main.currency } : null } };

  const opening = [];   // the open events and checks setup wrote, listed before everything else
  for (const a of sc.accounts) {
    const c = a.currency, op = a.opening || {};
    const x = { id: a.id, name: a.name, type: KIND[a.kind] || a.kind, cur: c, owner: a.owner || null,
      minBank: a.id !== mainId && a.minimum ? { a: mn(a.minimum, c), cur: c } : null };
    if (a.spend_from != null) x.spendFrom = a.spend_from;
    if (a.closed) x.closed = a.closed;
    if (a.posting_days != null) x.postingDays = a.posting_days;
    if (a.holidays) {
      let k = a.holidays.country || ('acct:' + a.id);
      if (opts.calendars[k] && JSON.stringify(opts.calendars[k]) !== JSON.stringify(table(a.holidays))) k = 'acct:' + a.id;
      opts.calendars[k] = table(a.holidays); x.country = k;
    } else if (a.country) x.country = a.country;
    if (a.apr != null) x.apr = a.apr;
    if (a.cash_apr != null) x.cashApr = a.cash_apr;
    if (a.of) x.of = a.of;
    if (a.plans) x.plans = a.plans.map(p => ({ id: p.id, amount: mn(p.amount, c), count: p.count, first: p.first }));
    const pay = a.payment || {};
    if (x.type === 'card') {
      Object.assign(x, { inFull: !a.carries, cutDay: a.statement_close_day == null ? null : a.statement_close_day, payDay: pay.day,
        payMonths: pay.months_after_close != null ? pay.months_after_close : 1, shift: SHIFT[pay.weekend_holiday] || 'none', payFrom: pay.from });
    } else if (x.type === 'loan' || x.type === 'paylater') {
      if (!a.of || a.payment) Object.assign(x, { payDay: pay.day, shift: SHIFT[pay.weekend_holiday] || 'none', payFrom: pay.from });
      if (pay.amount != null) x.amount = mn(pay.amount, c);
    }
    if (pay.min_rule) x.minRule = pay.min_rule.fixed != null ? { fixed: mn(pay.min_rule.fixed, c) } : { pct: pay.min_rule.pct, floor: mn(pay.min_rule.floor || 0, c) };
    if (pay.extra_steps) x.extraSteps = pay.extra_steps.map(st => Object.assign({ from: st.from, amount: mn(st.amount, c) }, st.gone ? { gone: st.gone } : {}));
    if (pay.amounts) { x.amounts = {}; for (const k in pay.amounts) x.amounts[k] = key(pay.amounts[k], c); }
    book.accounts.push(x);

    // ----- the opening: one `open` and a `check` the same day, in the first check-in [B6, B7, H1] -----
    if (!op.date) continue;
    // [J2] a moved figure with no time of its own is told at the copy's last save; [X9] one typed with no time covers its day
    const told = op.told ? zoned(op.told, zone) : op.moved ? zoned(sc.moved_copy.saved, movedZone) : op.date + 'T24:00' + (zone || '');
    const owedType = x.type === 'card' || x.type === 'loan' || x.type === 'paylater';
    const amt = owedType ? mn(x.type === 'card' ? op.current : op.owed != null ? op.owed : op.amount, c) : mn(op.amount, c);
    const open = { id: 'open:' + a.id, k: 'open', acct: a.id, date: op.date, a: amt || 0, told, grp: 'setup' };
    if (op.moved) open.src = { type: 'move' };
    if (op.split) {
      open.split = {};
      if (op.split.goals) { open.split.places = {}; for (const g in op.split.goals) open.split.places[g] = mn(op.split.goals[g], c); }
      if (op.split.lines) { open.split.lines = {}; for (const l in op.split.lines) open.split.lines[l] = mn(op.split.lines[l], c); }
      if (op.split.free != null) open.split.free = mn(op.split.free, c);
    }
    opening.push(open);
    const check = { id: 'check:' + a.id, k: 'check', acct: a.id, date: op.date, a: amt || 0, told, grp: 'setup' };
    if (op.moved) check.src = { type: 'move' };
    if (op.not_yet) check.notYet = op.not_yet.slice();
    opening.push(check);
    // [J5, AB3] each last statement at the opening is its own check with `stmt: true`
    const sts = op.statements || (op.statement ? [op.statement] : []);
    sts.forEach((st, i) => {
      const sc2 = { id: 'stmt:' + a.id + ':' + i, k: 'check', acct: a.id, stmt: true, date: op.date, told, grp: 'setup',
        paid: st.paid === 'dont_know' ? 'dont_know' : !!st.paid };
      if (st.closed) sc2.stmtDate = st.closed;
      if (st.payment_day) sc2.stmtPay = st.payment_day;
      if (st.amount !== undefined) sc2.a = mn(st.amount, c);
      opening.push(sc2);
    });
  }

  // ----- places (goals) [B6, F22, E5, P1, V1, X watch] -----
  for (const g of sc.goals || []) {
    const p = { id: g.id, name: g.name, kind: g.kind || 'goal', keptIn: { acct: g.kept_in, mode: g.mode === 'own_account' ? 'ownAccount' : 'inBank' } };
    if (g.due) p.due = g.due;
    if (g.refill) p.refill = true;
    if (g.pays) p.pays = g.pays;
    if (g.removed) p.gone = g.removed;
    if (g.owner) p.owner = g.owner;
    book.places.push(p);
    // goal money typed with its own date: a move from Waiting into the place on that day
    if (g.opening) opening.push({ id: 'open:' + g.id, k: 'move', place: 'waiting', place2: g.id, a: mn(g.opening.amount, cur(g.kept_in)), date: g.opening.date, told: g.opening.date, grp: 'setup' });
  }
  const schedCurOf = id => { const x = (sc.income || []).concat(sc.bills || []).find(y => y.id === id); return x ? (x.currency || cur(x.account)) : home; };
  const forBill = {}; for (const g of sc.goals || []) if (g.for_bill) forBill[g.for_bill] = g.id;

  // ----- schedules [H2, B8, Q2, Q4, X watch] -----
  for (const [list, kindOf] of [[sc.income || [], () => 'income'], [sc.bills || [], b => (b.kind === 'transfer' ? 'transfer' : b.kind === 'auto_spend' ? 'autoSpend' : 'bill')]]) {
    for (const s of list) {
      const kind = kindOf(s), sc0 = s.schedule || {};
      const c = s.currency || cur(s.account);
      const x = { id: s.id, kind, name: s.name, acct: s.account, cur: c, shift: SHIFT[s.weekend_holiday] || 'none',
        rules: [{ from: null, rule: convRule(sc0) }].concat((s.changes || []).map(ch => ({ from: ch.from, rule: convRule(ch.schedule) }))),
        steps: [{ from: null, amount: mn(s.amount, c) }].concat((s.changes || []).map(ch => ({ from: ch.from, amount: mn(ch.amount != null ? ch.amount : s.amount, c) }))) };
      if (s.to) x.acct2 = s.to;
      if (sc0.from) x.from = sc0.from;
      if (sc0.count) x.count = sc0.count;
      if (s.ends) x.ends = s.ends;
      if (s.redirect) x.redirect = s.redirect;
      if (s.amount_by_day) { x.byDay = {}; for (const k in s.amount_by_day) x.byDay[k] = mn(s.amount_by_day[k], c); }
      if (s.amounts) { x.amounts = {}; for (const k in s.amounts) x.amounts[k] = key(s.amounts[k], c); }
      if (s.vary) x.vary = s.vary;
      if (s.starts_period) x.startsPeriod = true;
      if (s.place) x.place = s.place;
      else if (forBill[s.id]) x.place = forBill[s.id];   // a goal `for_bill`: the place pays that schedule [E5]
      if (s.fee) x.fee = mn(s.fee, cur(s.account));
      if (s.owner) x.owner = s.owner;
      book.schedules.push(x);
    }
  }

  // [AN5] what waits for add or replace, in minor units of its schedule's currency
  // [AW7] kept versions of a schedule, written in a file as amounts: each version is the whole schedule with that amount
  if (sc.keptVersions) book.keptVersions = sc.keptVersions.map(k => {
    const s0 = book.schedules.find(x => x.id === k.of);
    return { id: 'kept:' + k.of, of: k.of, in: s0 ? 'schedules' : undefined, ask: !!k.ask,
      versions: (k.versions || []).map(v => (s0 && v.amount != null ? Object.assign({}, s0, { steps: [{ from: null, amount: mn(v.amount, s0.cur) }] }) : v)) };
  });
  // [AO4] a waiting `once` amount is in the minor units of its budget line's or share's currency
  const planCurOf = p => { const l = ((sc.plan && sc.plan.lines) || []).find(y => y.id === p.line); return cur((l && l.account) || (sc.plan && sc.plan.free && sc.plan.free.account) || mainId); };
  if (sc.pendingMove) book.pendingMove = sc.pendingMove.map(p => Object.assign({}, p,
    typeof p.a === 'number' && p.schedule ? { a: mn(p.a, schedCurOf(p.schedule)) }
      : typeof p.a === 'number' && p.to === 'once' ? { a: mn(p.a, planCurOf(p)) } : {}));

  // ----- the plan [B1, B2, O4, T watch] -----
  // [B8, T1, AE1] `once` keys: each entry keeps its at, by and gone; the amount is in minor units under the field the
  // saved shape names (`amount` on a budget line, `free` on a share)
  const onceOf = (o, field, c) => { const out = {}; for (const k in o) { const v = o[k]; const x = Object.assign({}, v); delete x.amount; x[field] = mn(v.amount, c); out[k] = x; } return out; };
  if (sc.plan) {
    for (const l of sc.plan.lines || []) {
      const c = cur(l.account || mainId);
      book.plan.budgets.push({ id: l.id, name: l.name, cur: c, acct: l.account || null, per: l.per,
        steps: [{ from: null, amount: mn(l.amount, c) }].concat((l.changes || []).map(ch => ({ from: ch.made, amount: mn(ch.amount, c) }))),
        ...(l.from ? { from: l.from } : {}), ...(l.once ? { once: onceOf(l.once, 'amount', c) } : {}) });
    }
    const f = sc.plan.free;
    if (f) {
      const c = cur(f.account || mainId);
      book.plan.shares.push(Object.assign({ id: 'share:1', from: null, cur: c, acct: f.account || null, per: { free: f.per }, free: mn(f.amount, c) },
        f.once ? { once: onceOf(f.once, 'free', c) } : {}));
      (f.changes || []).forEach((ch, i) => book.plan.shares.push({ id: 'share:' + (i + 2), from: ch.made, cur: c, acct: f.account || null, per: { free: f.per }, free: mn(ch.amount, c) }));
    }
  }

  // ----- events [section 6, section 13] -----
  const settled = [], unticked = [], fillerCheckins = [];
  const schedCur = {}; for (const s of book.schedules) schedCur[s.id] = s.cur;
  const occs = v => [].concat(v || []).map(o => { const i = String(o).lastIndexOf('@'); return { s: String(o).slice(0, i), due: String(o).slice(i + 1) }; });
  const events = [];
  for (const e of sc.events || []) {
    if (e.told === null) continue;   // the app never heard of it
    const moved = !!e.moved, isFig = e.kind === 'check' || e.kind === 'card_check';
    const date = e.date || (moved && isFig ? sc.moved_copy.saved.slice(0, 10) : e.date);
    // [I5, J2] a moved record is told at its own time; with none, a receipt at the start of its day, a figure at the copy's last save
    const told = e.told ? zoned(String(e.told), moved ? movedZone : zone) : moved ? (e.own_time ? zoned(e.own_time, movedZone) : isFig ? zoned(sc.moved_copy.saved, movedZone) : date + 'T00:00' + (movedZone || '')) : date;
    const x = { id: e.id, date, told };
    const side = e.account || e.from;
    const A = (v, id) => mn(v, cur(id));
    const src = e.source ? { type: e.source } : moved ? { type: 'move' } : null;
    if (src && e.bal != null) src.bal = A(e.bal, e.account);
    if (src && e.source && e.source !== 'typed' && e.account && (e.from || e.to || e.card)) src.acct = e.account;   // [Q1] the statement it came from
    if (src) x.src = src;
    if (e.posted) x.posted = e.posted;
    if (e.posted2) x.posted2 = e.posted2;
    if (e.est) x.est = true;
    if (e.gone) x.gone = typeof e.gone === 'string' ? e.gone : date;
    if (e.settles) x.settles = occs(e.settles);
    if (e.line) x.line = e.line;
    if (e.ticked) settled.push(e.id);
    if (e.unticked) unticked.push(e.id);
    switch (e.kind) {
      case 'pay_in': case 'money_in': case 'refund':
        Object.assign(x, { k: 'in', sub: e.kind === 'pay_in' ? 'pay' : e.kind === 'refund' ? 'refund' : 'other', acct: e.account, a: A(e.amount, e.account) });
        if (e.kind === 'pay_in' && x.settles) x.stream = x.settles[0].s;
        if (e.amount2 != null) { const sid = x.settles && x.settles[0] && x.settles[0].s; x.a2 = mn(e.amount2, schedCur[sid] || home); }
        break;
      case 'spend': case 'bill_paid':
        Object.assign(x, { k: 'spend', acct: e.account, a: A(e.amount, e.account) });
        if (e.goal) x.place = e.goal;
        if (e.of) x.of = e.of;
        break;
      case 'adjust':
        Object.assign(x, { k: 'adjust', acct: e.account, a: A(e.amount, e.account) });
        if (e.goal) x.place = e.goal;
        break;
      case 'card_payment': case 'repay': {
        const to = e.card || e.to;
        Object.assign(x, { k: 'repay', acct: e.from || null, acct2: to });
        x.a = e.amount_out != null ? A(e.amount_out, e.from) : e.from ? A(e.amount, e.from) : A(e.amount, to);
        x.a2 = e.amount_in != null ? A(e.amount_in, to) : A(e.amount, to);
        break;
      }
      case 'transfer': case 'convert': case 'borrow':
        Object.assign(x, { k: e.kind, acct: e.from, acct2: e.to });
        x.a = e.amount_out != null ? A(e.amount_out, e.from) : A(e.amount, e.from);
        x.a2 = e.amount_in != null ? A(e.amount_in, e.to) : A(e.amount, e.to);
        break;
      case 'skip': x.k = 'skip'; if (e.account) x.acct = e.account; break;
      case 'check':
        Object.assign(x, { k: 'check', acct: e.account, a: A(e.amount, e.account) });
        if (e.avail) x.avail = e.avail;
        if (e.gain) x.gain = e.gain;
        // [AS6] the filler's place is saved on the check-in the check was written with
        if (e.filler_place) { x.grp = 'checkin:' + e.id; fillerCheckins.push({ id: x.grp, date, told, figures: [{ acct: e.account, check: e.id }], fillerPlace: { [e.account]: e.filler_place } }); }
        break;
      case 'card_check':
        if (e.statement) events.push(Object.assign({}, x, { id: e.id + ':stmt', k: 'check', acct: e.account, stmt: true, stmtDate: e.statement.closed, a: A(e.statement.amount, e.account), grp: e.id }));
        Object.assign(x, { k: 'check', acct: e.account, a: A(e.current, e.account), grp: e.id });
        break;
      case 'set_aside': {
        const g = (sc.goals || []).find(y => y.id === (e.goal || e.from_place));
        Object.assign(x, { k: 'move', place: e.from_place || 'waiting', place2: e.goal || 'waiting', a: A(e.amount, g ? g.kept_in : mainId) });
        if (e.to_place_of) x.placed = 'rm:' + e.to_place_of;
        if (/^rm:/.test(e.id) && e.from_place) x.toPlace = true;   // [P1, Q7] the removal's own move to Waiting
        break;
      }
      case 'place_money':
        Object.assign(x, { k: 'move', place: 'waiting', place2: e.into === 'free' ? 'free' : 'waiting', a: A(e.amount, e.account), acct: e.account, placed: 'rm:' + e.to_place_of });
        break;
      case 'period_end_answer': {
        const pl = (sc.goals || []).find(g => g.id === e.place);
        Object.assign(x, { k: 'periodEnd', place: e.place, moves: (e.moves || []).map(mv => ({ to: mv.to, a: A(mv.amount, pl ? pl.kept_in : mainId) })) });
        break;
      }
      case 'period_start': x.k = 'periodStart'; break;
      default: x.k = e.kind;
    }
    if (e.at) x.at = e.at;
    events.push(x);
  }
  book.events = opening.concat(events);
  if (settled.length || unticked.length) book.checkins.push({ id: 'checkin:ticked', settled, unticked });
  book.checkins.push(...fillerCheckins);
  return { book, opts };
}

module.exports = { convert };
