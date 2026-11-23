#!/usr/bin/env node
// The two-device fuzz [AQ6]: it replaces hand review rounds for the version one sync (rules/sync_v1_ref.js).
// Each seed sets up one copy, then runs one to three rounds. In a round the phone and the desktop each make random
// offline edits with their own clocks and ordinary ids (`<6>-<10>-<n>`, the form realistic_ids.js checks), each edit
// checked on its own device first (an edit a device would refuse or ask about is not made), then they sync through the
// vault's revision (compare and swap). After every sync it asserts:
//   1. symmetry: joining A with B gives the same as B with A, and the devices syncing in either order end the same;
//   2. joining again changes nothing;
//   3. every edit is present, or kept and waiting as a question (or kept below a person's lesson, AP7);
//   4. nothing is doubled: one record per id, one record per statement line however many devices read it;
//   5. every one-device check passes after the sync once its questions are answered (each failure is a question:
//      the person's answers are random picks among what is offered), and no check throws.
// Usage: node fuzz_two_devices.js [seeds] [--from N] [--show]   (default 5,000 seeds from 1; --show prints each failure)
// Any failure makes the run fail, and the last line says so (LESSONS lesson 2).
'use strict';
const S = require('./sync_v1_ref');
const M = require('./merge_ref');
const LA = require('../ref/lookahead_ref');
const { dayNum, dayStr } = require('./dates');

const args = process.argv.slice(2);
const fromAt = args.indexOf('--from');
const FROM = fromAt >= 0 ? Number(args[fromAt + 1]) : 1;
const SEEDS = Number(args.find((a, i) => /^\d+$/.test(a) && (fromAt < 0 || i !== fromAt + 1)) || 5000);
const SHOW = args.includes('--show');
// What the run exercised, printed at the end, so a pass is never read without knowing what was tried.
const STATS = { edits: 0, refused: 0, syncs: 0, rounds: 0, linesBoth: 0 };
const seen = (k, n = 1) => { STATS[k] = (STATS[k] || 0) + n; };

// ---------- a seeded random source ----------
function rngOf(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = l => l[Math.floor(next() * l.length)];
  const chance = p => next() < p;
  const word = (n, abc) => { let s = ''; for (let i = 0; i < n; i++) s += abc[Math.floor(next() * abc.length)]; return s; };
  return { next, int, pick, chance, word };
}
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
const C = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const canon = S.canon;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz', ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';
const JST = 9 * 60;
function jst(msv) {   // a moment written in Japan time
  const d = new Date(msv + JST * 60000), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}+09:00`;
}
const MIN = 60000;

// ---------- one device ----------
function device(r, name) {
  const part = r.word(6, ALNUM.slice(0, 26)) + '', ses = r.word(10, ALNUM);
  return { name, part, ses, n: 0, now: 0, lastSeen: null, copy: null, base: null, baseRev: 0, edits: [] };
}
const newId = d => `${d.part}-${d.ses}-${++d.n}`;
function stampOf(d) {
  const seen = [d.lastSeen, M.newestAt(d.copy)].filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const at = M.nextAt(jst(d.now), seen);
  d.lastSeen = at;
  return { at, by: d.part };
}
const today = d => jst(d.now).slice(0, 10);

// ---------- the setup copy ----------
function setup(r) {
  const P = device(r, 'setup');
  P.now = Date.parse('2026-11-23T00:00:00Z');
  const t = jst(P.now), st = { told: t, at: t, by: P.part };
  const id = () => newId(P);
  const A = { bank: id(), bank2: id(), ew: id(), card: id() };
  const acct = (aid, kind, name, extra) => Object.assign({ id: aid, kind, name, cur: 'JPY' }, extra || {}, st);
  const rule = (from, ru) => ({ from, rule: ru, at: t, by: P.part });
  const step = (from, amount) => ({ from, amount, at: t, by: P.part });
  const sched = (kind, name, ac, ru, amount, extra) => Object.assign({ id: id(), kind, name, acct: ac, cur: 'JPY', rules: [rule('2026-11-01', ru)], steps: [step('2026-11-01', amount)] }, extra || {}, st);
  const schedules = [
    sched('income', 'Pay', A.bank, { every: 'month', days: [25] }, 250000, { startsPeriod: true }),
    sched('bill', 'Rent', A.bank, { every: 'month', days: [27] }, 80000),
    sched('bill', 'Insurance', A.bank, { every: 'year', date: '12-20' }, 60000),
    sched('bill', 'Water', A.bank, { every: 'months', n: 2, day: 5, from: '2026-12-05' }, 6000),
    sched('income', 'Bonus', A.bank, { every: 'monthsList', months: [12, 6], day: 10 }, 300000),
    sched('transfer', 'Top-up', A.bank, { every: 'weeks', n: 2, from: '2026-11-27' }, 10000, { acct2: A.ew }),
    sched('income', 'Side job', A.bank2, { every: 'lastWorkday' }, 40000),
    sched('bill', 'Car tax', A.bank, { every: 'once', date: '2027-01-15' }, 30000),
  ];
  const ev = (k, extra) => Object.assign({ id: id(), k, date: '2026-11-23' }, extra, st);
  const events = [
    ev('open', { acct: A.bank, a: 400000 }), ev('open', { acct: A.bank2, a: 120000 }), ev('open', { acct: A.ew, a: 15000 }), ev('open', { acct: A.card, a: 30000 }),
    ev('move', { place: 'free', place2: 'waiting', a: 100000, toPlace: true }),
  ];
  const goals = [Object.assign({ id: id(), kind: 'goal', name: 'Trip', target: 200000 }, st), Object.assign({ id: id(), kind: 'goal', name: 'Car', target: 500000 }, st)];
  const budgets = [Object.assign({ id: id(), name: 'Food', per: 'month', amount: 30000, cur: 'JPY' }, st), Object.assign({ id: id(), name: 'Fun', per: 'month', amount: 10000, cur: 'JPY' }, st)];
  const fv = v => ({ v, at: t, by: P.part });
  const copy = {
    v: 3, rev: 1, at: t,
    home: { curs: [{ from: '2026-11-23', cur: 'JPY', at: t, by: P.part }], country: fv('JP'), mode: fv('track'), main: fv({ acct: A.bank, min: { a: 30000, cur: 'JPY' } }) },
    people: [Object.assign({ id: id(), name: 'Mika' }, st)],
    accounts: [acct(A.bank, 'bank', 'Bank', { minBank: null }), acct(A.bank2, 'bank', 'Second bank', { minBank: { a: 20000, cur: 'JPY' } }), acct(A.ew, 'ewallet', 'E-wallet'), acct(A.card, 'card', 'Card')],
    places: goals, schedules, events, checkins: [],
    plan: { shares: [Object.assign({ id: id(), goal: goals[0].id, a: 20000, cur: 'JPY' }, st)], budgets, limits: { ceiling: fv({ a: 120000, cur: 'JPY', per: 'month' }) } },
    imports: { cats: { 'k:seven eleven': Object.assign(fv('bill:food'), { src: 'person' }), 'k:lawson': Object.assign(fv('bill:other'), { src: 'reader' }) } },
    ui: { sb: fv(true), askNums: fv(false) },
  };
  return { copy, A, goals: goals.map(g => g.id), budgets: budgets.map(b => b.id) };
}

// ---------- what a device knows ----------
const live = l => (l || []).filter(x => x && !x.gone);
const entriesOf = s => live(s.rules).sort((a, b) => (a.from < b.from ? -1 : 1));
// The occurrences of a schedule from day `from` to `to`, each by its entry in force [H2], with the look ahead's code [AP2].
function duesOf(s, from, to) {
  const es = entriesOf(s), out = [];
  es.forEach((e, i) => {
    const lo = Math.max(dayNum(from), dayNum(e.from)), hi = Math.min(dayNum(to), es[i + 1] ? dayNum(es[i + 1].from) - 1 : Infinity);
    const rr = S.laRule(e.rule);
    if (!rr || lo > hi) return;
    for (const x of LA.dueDays(rr, lo - 400, hi, S.CAL)) if (x.due >= lo && x.due <= hi) out.push(dayStr(x.due));
  });
  return [...new Set(out)].sort();
}
function oneDeviceQuestions(copy) { return S.afterSync(copy).questions.filter(q => q.q !== 'which').map(canon); }
function acctFigure(copy, a, day) { return S.figureAtClose(Object.assign({}, a, { closed: day }), live(copy.events).filter(e => [e.acct, e.acct2, e.card].includes(a.id))); }

// A statement of one account for one month, the same on every device that reads it (made from the seed): some carry
// the bank's own reference, some not; a few lines repeat a date, amount and direction, so the count matters [AP3].
function statement(seed, acctId, ym) {
  const r = rngOf(hash(seed + ':' + acctId + ':' + ym));
  const refs = r.chance(0.5), n = r.int(2, 6), lines = [];
  for (let i = 0; i < n; i++) {
    const day = ym + '-' + String(r.int(1, 28)).padStart(2, '0');
    const a = r.pick([800, 1200, 1200, 3400, 5000, 12000]);
    const dir = r.chance(0.85) ? 'out' : 'in';
    lines.push(Object.assign({ date: day, a, dir }, refs ? { ref: 'R' + ym.replace('-', '') + '-' + (i + 1) } : {}));
  }
  lines.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  return lines;
}

// ---------- the edits a person makes on one device ----------
// Each returns the items it touched ({ list, id } or { path }), or null when it does not apply now.
function makeOps(ctx) {
  const { r, A } = ctx;
  const acctOf = (c, id) => c.accounts.find(x => x.id === id);
  // Most edits land on a few schedules, so the two devices often touch the same one (the AN2 situation).
  const hotSchedule = c => { const l = live(c.schedules); return r.chance(0.7) ? r.pick(l.slice(0, 3)) : r.pick(l); };
  const listAt = (c, path) => path.split('.').reduce((o, k) => (o || {})[k], c);
  return {
    typeSpend(d) {
      const c = d.copy, ac = r.pick([A.bank, A.ew, A.card]), st = stampOf(d);
      const date = dayStr(dayNum(today(d)) - r.int(0, 3));
      c.events.push(Object.assign({ id: newId(d), k: 'spend', date, acct: ac, a: r.int(1, 60) * 100, line: r.pick(ctx.budgets) }, { told: st.at }, st));
      return [{ list: 'events', id: c.events[c.events.length - 1].id }];
    },
    tick(d) {
      const c = d.copy, s = hotSchedule(c);
      const dues = duesOf(s, r.chance(0.7) ? dayStr(dayNum(today(d)) - 20) : '2026-11-01', today(d)).filter(x => !c.events.some(e => e.id === 'set:' + s.id + '@' + x));
      if (!dues.length) return null;
      const due = r.pick(dues), st = stampOf(d), usual = s.steps[s.steps.length - 1].amount;
      const k = s.kind === 'income' ? 'in' : s.kind === 'transfer' ? 'transfer' : 'spend';
      const e = Object.assign({ id: 'set:' + s.id + '@' + due, k, date: due, acct: s.acct, a: r.chance(0.8) ? usual : usual + r.int(-5, 5) * 100, settles: [{ s: s.id, due }] }, s.acct2 ? { acct2: s.acct2 } : {}, { told: st.at }, st);
      c.events.push(e);
      return [{ list: 'events', id: e.id }];
    },
    importStatement(d) {
      const c = d.copy, ac = r.pick([A.bank, A.card, A.ew]);
      const t = today(d), ym = r.pick(['2026-11', '2026-12', '2027-01', '2027-02'].filter(m => m <= t.slice(0, 7)));
      const monthEnd = dayStr(dayNum(ym + '-01') + 40).slice(0, 7) + '-01';
      const to = dayStr(Math.min(dayNum(monthEnd) - 1, dayNum(t) - 1));   // a mid-month export covers whole days up to yesterday
      if (to < ym + '-01') return null;
      const lines = statement(ctx.seed, ac, ym).filter(l => l.date <= to);
      const ids = S.impIds({ account: ac, lines });
      if (new Set(ids).size !== ids.length) ctx.fail('two lines of one statement got one id', ac + ' ' + ym);
      const src = { type: 'statement', file: ac + '-' + ym + '-to-' + to, from: ym + '-01', to };
      const st = stampOf(d), touched = [];
      lines.forEach((l, i) => {
        if (c.events.some(e => e.id === ids[i])) return;   // a repeat of a live line is dropped [L q9]
        c.events.push(Object.assign({ id: ids[i], k: l.dir === 'out' ? 'spend' : 'in', date: l.date, acct: ac, a: l.a, src }, { told: st.at }, st));
        touched.push({ list: 'events', id: ids[i] });
        ctx.lines.add(ids[i]);
      });
      return touched.length ? touched : null;
    },
    editEvent(d) {
      const c = d.copy, es = live(c.events).filter(e => e.k === 'spend' && /^[a-z0-9]{6}-/.test(e.id));
      if (!es.length) return null;
      const e = r.pick(es); Object.assign(e, { a: r.int(1, 60) * 100 }, stampOf(d));
      return [{ list: 'events', id: e.id }];
    },
    removeEvent(d) {
      const c = d.copy, es = live(c.events).filter(e => e.k === 'spend' && /^[a-z0-9]{6}-/.test(e.id));
      if (!es.length) return null;
      const e = r.pick(es); Object.assign(e, { gone: today(d), goneBy: e.id }, stampOf(d));
      return [{ list: 'events', id: e.id }];
    },
    changeRule(d) {
      const c = d.copy, s = hotSchedule(c), t = today(d);
      const named = M.namedDues(c, s.id).filter(x => x >= '2000');
      const after = named.length ? dayNum(named[named.length - 1]) + 1 : 0;
      const from = dayStr(Math.max(after, dayNum(t) + r.int(-25, 10)));   // X8 on this device: after what is settled or named
      const dayOn = dayStr(dayNum(from) + r.int(0, 30));
      const rule = r.pick([
        { every: 'month', days: [r.int(1, 28)] }, { every: 'month', days: [10, 25] }, { every: 'weeks', n: r.pick([1, 2]), from: dayOn },
        { every: 'months', n: 3, day: r.int(1, 28), from: dayOn }, { every: 'monthsList', months: [r.int(1, 12), r.int(1, 12)].sort((a, b) => a - b), day: r.int(1, 28) },
        { every: 'year', date: dayOn.slice(5) }, { every: 'lastWorkday' }, { every: 'once', date: dayOn }]);
      const st = stampOf(d);
      s.rules = s.rules.filter(e => !(e.from === from && !e.gone)).concat([Object.assign({ from, rule }, st)]).sort((a, b) => (a.from < b.from ? -1 : 1));
      Object.assign(s, st);
      return [{ list: 'schedules', id: s.id }];
    },
    amountKey(d) {
      const c = d.copy, s = r.pick(live(c.schedules)), t = today(d);
      const dues = duesOf(s, t, dayStr(dayNum(t) + 70));
      if (!dues.length) return null;
      const due = r.pick(dues), st = stampOf(d);
      s.amounts = Object.assign({}, s.amounts, { [due]: Object.assign({ amount: r.int(1, 50) * 10000 }, st) });
      Object.assign(s, st);
      return [{ list: 'schedules', id: s.id }];
    },
    renameOrStep(d) {
      const c = d.copy, s = r.pick(live(c.schedules)), st = stampOf(d);
      if (r.chance(0.5)) s.name = r.pick(['Pay', 'Salary', 'Rent', 'Rent (flat)', 'Bill', 'Insurance', 'Tax']) + ' ' + r.int(1, 3);
      else s.steps = s.steps.concat([Object.assign({ from: dayStr(dayNum(today(d)) + r.int(1, 40)), amount: r.int(1, 30) * 10000 }, st)]);
      Object.assign(s, st);
      return [{ list: 'schedules', id: s.id }];
    },
    budget(d) {
      const c = d.copy, b = r.pick(r.chance(0.7) ? c.plan.budgets : c.plan.shares);
      Object.assign(b, b.amount != null ? { amount: r.int(1, 8) * 5000 } : { a: r.int(1, 8) * 5000 }, stampOf(d));
      return [{ list: b.amount != null ? 'plan.budgets' : 'plan.shares', id: b.id }];
    },
    goal(d) {
      const c = d.copy, g = r.pick(c.places); Object.assign(g, r.chance(0.8) ? { target: r.int(10, 90) * 10000 } : { gone: today(d), goneBy: g.id }, stampOf(d));
      return [{ list: 'places', id: g.id }];
    },
    homeField(d) {
      const c = d.copy, st = stampOf(d), k = r.pick(['country', 'mode', 'main']);
      if (k === 'country') c.home.country = Object.assign({ v: r.pick(['JP', 'PH', 'US']) }, st);
      else if (k === 'mode') c.home.mode = Object.assign({ v: 'track', note: r.int(1, 9) }, st);
      else c.home.main = Object.assign({ v: { acct: c.home.main.v.acct, min: r.chance(0.2) ? null : { a: r.int(1, 9) * 10000, cur: 'JPY' } } }, st);
      return [{ path: 'home.' + k }];
    },
    setMain(d) {   // [AN3] the new main bank's minimum moves into `home.main`; its own is cleared
      const c = d.copy, to = c.home.main.v.acct === A.bank ? A.bank2 : A.bank, a = acctOf(c, to);
      if (a.closed) return null;
      const st = stampOf(d);
      c.home.main = Object.assign({ v: { acct: to, min: a.minBank || null } }, st);
      Object.assign(a, { minBank: null }, st);
      return [{ path: 'home.main' }, { list: 'accounts', id: to }];
    },
    ownMin(d) {
      const c = d.copy, other = c.home.main.v.acct === A.bank ? A.bank2 : A.bank, a = acctOf(c, other);
      Object.assign(a, { minBank: r.chance(0.2) ? null : { a: r.int(1, 9) * 5000, cur: 'JPY' } }, stampOf(d));
      return [{ list: 'accounts', id: other }];
    },
    uiOrLimit(d) {
      const c = d.copy, st = stampOf(d);
      if (r.chance(0.5)) { const k = r.pick(['sb', 'askNums']); c.ui[k] = Object.assign({ v: r.chance(0.5) }, st); return [{ path: 'ui.' + k }]; }
      c.plan.limits.ceiling = Object.assign({ v: { a: r.int(8, 20) * 10000, cur: 'JPY', per: 'month' } }, st);
      return [{ path: 'plan.limits.ceiling' }];
    },
    cat(d) {   // [AP7] a lesson the person types, or a guess the reader makes (never over a lesson or a moved value)
      const c = d.copy, shop = r.pick(['SEVEN ELEVEN 0012', 'Lawson', 'FAMILY MART #3', 'Uniqlo Shibuya']), src = r.chance(0.6) ? 'person' : 'reader', st = stampOf(d);
      const key = S.catKey(shop), before = C(c.imports.cats[key]);
      c.imports.cats = S.catLearn({ cats: c.imports.cats, writes: [Object.assign({ shop, v: r.pick(['bill:food', 'bill:fun', 'bill:other']), src }, st)] });
      return canon(before) === canon(c.imports.cats[key]) ? null : [{ path: 'imports.cats.' + key }];
    },
    close(d) {   // [O, P6] closing the e-wallet: its figure today, moved to the main bank
      const c = d.copy, a = acctOf(c, A.ew), t = today(d);
      if (a.closed || live(c.events).some(e => [e.acct, e.acct2].includes(a.id) && e.date > t)) return null;
      const fig = acctFigure(c, a, t);
      if (fig === null || fig < 0) return null;
      const st = stampOf(d), chk = Object.assign({ id: newId(d), k: 'check', date: t, acct: a.id, a: fig }, { told: st.at }, st);
      c.events.push(chk);
      const touched = [{ list: 'events', id: chk.id }, { list: 'accounts', id: a.id }];
      if (fig > 0) { c.events.push(Object.assign({ id: 'close:' + a.id, k: 'transfer', date: t, acct: a.id, acct2: c.home.main.v.acct, a: fig }, { told: st.at }, st)); touched.push({ list: 'events', id: 'close:' + a.id }); }
      Object.assign(a, { closed: t }, st);
      return touched;
    },
    check(d) {   // a figure typed at a check-in, with the check-in record [AP6]
      const c = d.copy, a = acctOf(c, r.pick([A.bank, A.ew])), t = today(d), st = stampOf(d);
      const fig = acctFigure(c, a, t);
      const chk = Object.assign({ id: newId(d), k: 'check', date: t, acct: a.id, a: (fig || 0) + r.int(-20, 5) * 100 }, { told: st.at }, st);
      c.events.push(chk);
      const settled = live(c.events).filter(e => /^set:/.test(e.id)).map(e => e.id).slice(-2);
      const ci = Object.assign({ id: newId(d), date: t, from: dayStr(dayNum(t) - 7), figures: [{ acct: a.id, check: chk.id }], settled }, { told: st.at }, st);
      c.checkins.push(ci);
      return [{ list: 'events', id: chk.id }, { list: 'checkins', id: ci.id }];
    },
    editCheckin(d) {
      const c = d.copy, cis = live(c.checkins);
      if (!cis.length) return null;
      const ci = r.pick(cis);
      Object.assign(ci, r.chance(0.8) ? { settled: ci.settled.slice(0, r.int(0, ci.settled.length)) } : { gone: today(d), goneBy: ci.id }, stampOf(d));
      return [{ list: 'checkins', id: ci.id }];
    },
    place(d) {   // placing money to place [X5], never more than Waiting holds on this device
      const c = d.copy, have = S.placeFigures(c).get('waiting') || 0;
      if (have <= 0) return null;
      const st = stampOf(d), mv = Object.assign({ id: newId(d), k: 'move', date: today(d), place: 'waiting', place2: r.pick(ctx.goals), a: Math.min(have, r.int(1, 10) * 10000) }, { told: st.at }, st);
      c.events.push(mv);
      return [{ list: 'events', id: mv.id }];
    },
    person(d) {
      const c = d.copy, p = r.pick(c.people); Object.assign(p, { name: r.pick(['Mika', 'Mika S.', 'Mika Sato', 'Ken']) }, stampOf(d));
      return [{ list: 'people', id: p.id }];
    },
    answerOne(d) {   // a question still waiting from an earlier sync, answered offline
      const qs = S.afterSync(d.copy).questions;
      if (!qs.length) return null;
      return answerQuestion(ctx, d, r.pick(qs));
    },
  };
}
const WEIGHTS = { typeSpend: 6, tick: 6, importStatement: 4, editEvent: 3, removeEvent: 2, changeRule: 4, amountKey: 3, renameOrStep: 3, budget: 3, goal: 2, homeField: 3, setMain: 2, ownMin: 2, uiOrLimit: 2, cat: 3, close: 2, check: 3, editCheckin: 2, place: 3, person: 1, answerOne: 5 };

// The person's answer to one question: a random pick among what is offered. Returns the items it touched.
function answerQuestion(ctx, d, q) {
  const { r } = ctx;
  const st = stampOf(d);
  if (q.q === 'which') {
    const k = d.copy.kept.find(x => x.id === q.kept);
    d.copy = S.answer({ copy: d.copy, of: q.of, pick: r.int(0, k.versions.length - 1), now: st.at, by: d.part, lastSeen: d.lastSeen });
    const list = k.in.split('.').reduce((o, x) => (o || {})[x], d.copy);
    return [Array.isArray(list) ? { list: k.in, id: q.of } : { path: q.of }, { list: 'kept', id: q.kept }];
  }
  const pick = q.q === 'x8' ? (q.offer && r.chance(0.7) ? 'offer' : 'back') : q.q === 'closed' ? r.pick(['reopen', 'move']) : q.q === 'minimum' ? r.pick(['own', 'main']) : 'undo';
  const before = C(d.copy);
  d.copy = S.answerCheck({ copy: d.copy, question: q, pick, now: st.at, by: d.part, lastSeen: d.lastSeen });
  return changedItems(before, d.copy);
}
// The items that differ between two copies of one device (for answers, which may touch several).
function changedItems(a, b) {
  const out = [];
  for (const list of ['accounts', 'schedules', 'events', 'places', 'people', 'checkins', 'plan.budgets', 'plan.shares']) {
    const get = c => list.split('.').reduce((o, k) => (o || {})[k], c) || [];
    const A = new Map(get(a).map(x => [x.id, x]));
    for (const x of get(b)) if (canon(A.get(x.id)) !== canon(x)) out.push({ list, id: x.id });
  }
  for (const path of ['home.main', 'home.country', 'home.mode', 'ui.sb', 'ui.askNums', 'plan.limits.ceiling']) {
    const get = c => path.split('.').reduce((o, k) => (o || {})[k], c);
    if (canon(get(a)) !== canon(get(b))) out.push({ path });
  }
  return out;
}

// ---------- items in a copy ----------
const keyOfItem = it => (it.list ? it.id : it.path);
function itemIn(copy, it) {
  if (it.list) return (it.list.split('.').reduce((o, k) => (o || {})[k], copy) || []).find(x => x.id === it.id);
  const parts = it.path.split('.'), head = it.path.startsWith('imports.cats.') ? ['imports', 'cats', it.path.slice(13)] : parts;
  return head.reduce((o, k) => (o || {})[k], copy);
}

// ---------- one seed ----------
function runSeed(seed) {
  const r = rngOf(seed * 2654435761);
  const fails = [];
  const fail = (what, detail) => fails.push({ seed, what, detail });
  const set = setup(r);
  const ctx = { r, seed, A: set.A, goals: set.goals, budgets: set.budgets, lines: new Set(), fail };
  const ops = makeOps(ctx);
  const names = Object.keys(WEIGHTS), total = names.reduce((t, k) => t + WEIGHTS[k], 0);
  const chooseOp = () => { let x = r.next() * total; for (const k of names) { x -= WEIGHTS[k]; if (x < 0) return k; } return names[0]; };
  let cloud = { rev: 1, copy: C(set.copy) };
  const devs = { phone: device(r, 'phone'), desktop: device(r, 'desktop') };
  let clock = Date.parse('2026-11-23T01:00:00Z');
  for (const d of Object.values(devs)) { d.copy = C(cloud.copy); d.base = C(cloud.copy); d.baseRev = 1; d.lastSeen = M.newestAt(cloud.copy); }
  const rounds = r.int(1, 3);
  try {
    for (let round = 1; round <= rounds; round++) {
      // both start from the same synced copy
      if (canon(devs.phone.base) !== canon(devs.desktop.base) || devs.phone.baseRev !== devs.desktop.baseRev) fail('bases differ at the start of a round', round);
      const commonBase = C(devs.phone.base);
      // offline edits, each checked on its own device first
      const touched = { phone: new Map(), desktop: new Map() };
      for (const d of Object.values(devs)) {
        d.now = clock + r.int(10, 600) * MIN;
        const n = r.int(0, 10);
        for (let i = 0; i < n; i++) {
          d.now += r.int(5, 60 * 36) * MIN;
          const op = chooseOp(), before = C(d.copy), beforeQ = new Set(oneDeviceQuestions(d.copy)), beforeN = d.n, beforeSeen = d.lastSeen;
          let items;
          try { items = ops[op](d); } catch (e) { fail('an edit threw on one device: ' + op, e.stack.split('\n').slice(0, 3).join(' | ')); items = null; }
          const after = items ? oneDeviceQuestions(d.copy) : [];
          if (!items || after.some(q => !beforeQ.has(q))) { d.copy = before; d.n = beforeN; d.lastSeen = beforeSeen; seen('refused'); continue; }   // refused or asked on its own device: not made
          seen('edits'); seen('op ' + op);
          for (const it of items) if (it.list !== 'kept') touched[d.name].set(keyOfItem(it), it);
        }
      }
      clock = Math.max(devs.phone.now, devs.desktop.now) + r.int(1, 120) * MIN;
      // 1. symmetry of the join itself
      const A0 = C(devs.phone.copy), B0 = C(devs.desktop.copy);
      const j1 = S.sync(commonBase, A0, B0), j2 = S.sync(commonBase, B0, A0);
      if (canon(j1) !== canon(j2)) fail('join(A, B) is not join(B, A)', round);
      // 2. joining again changes nothing
      if (canon(S.sync(j1, j1, j1)) !== canon(j1) || canon(S.sync(commonBase, j1, B0)) !== canon(j1) || canon(S.sync(commonBase, A0, j1)) !== canon(j1)) fail('joining again changed the copy', round);
      // the devices sync in either order through the vault: the same end
      const order = r.chance(0.5) ? ['phone', 'desktop', 'phone'] : ['desktop', 'phone', 'desktop'];
      const other = [order[1], order[0], order[1]];
      const runOrder = (ord, devState, cl) => { const st = C(devState); let c = C(cl); for (const nm of ord) { seen('syncs'); const x = S.syncDevice({ copy: st[nm].copy, base: st[nm].base, baseRev: st[nm].baseRev }, c); Object.assign(st[nm], x.device); c = x.cloud; } return { st, cloud: c }; };
      const snap = { phone: { copy: devs.phone.copy, base: devs.phone.base, baseRev: devs.phone.baseRev }, desktop: { copy: devs.desktop.copy, base: devs.desktop.base, baseRev: devs.desktop.baseRev } };
      const o1 = runOrder(order, snap, cloud), o2 = runOrder(other, snap, cloud);
      const noRev = c => { const o = Object.assign({}, c); delete o.rev; return canon(o); };
      if (noRev(o1.cloud.copy) !== noRev(o2.cloud.copy)) fail('syncing in the other order ends differently', round);
      if (noRev(o1.st.phone.copy) !== noRev(o1.st.desktop.copy) || noRev(o1.st.phone.copy) !== noRev(o1.cloud.copy)) fail('after syncing, the devices hold different copies', round);
      if (noRev(o1.cloud.copy) !== noRev(j1)) fail('the vault story differs from the join', round);
      cloud = o1.cloud;
      for (const nm of ['phone', 'desktop']) Object.assign(devs[nm], o1.st[nm]);
      for (const d of Object.values(devs)) d.lastSeen = [d.lastSeen, M.newestAt(d.copy)].sort((a, b) => Date.parse(b) - Date.parse(a))[0];
      const final = cloud.copy;
      seen('rounds');
      for (const q of S.afterSync(final).questions) seen('question ' + q.q);
      for (const n of S.afterSync(final).notices) seen('notice ' + n.notice);
      for (const k of final.kept || []) if (k.ask) seen('kept asked'); else seen('kept by rank or answered');
      { const a = new Set(A0.events.filter(e => /^imp:/.test(e.id)).map(e => e.id)); seen('linesBoth', B0.events.filter(e => /^imp:/.test(e.id) && a.has(e.id) && !commonBase.events.some(x => x.id === e.id)).length); }
      // 3. every edit present, or kept and waiting
      for (const nm of ['phone', 'desktop']) {
        const mine = nm === 'phone' ? A0 : B0;
        for (const [key, it] of touched[nm]) {
          const v = itemIn(mine, it), f = itemIn(final, it);
          if (v === undefined) { fail('an edited item vanished on its own device', key); continue; }
          if (S.same(v, f)) continue;
          const k = (final.kept || []).find(x => x.id === 'kept:' + key);
          const inKept = k && k.versions.some(x => S.same(x, v));
          const below = k && !k.ask && typeof v.src === 'string' && v.src !== 'person';   // [AP7] a guess below a lesson
          if (!inKept) fail('an edit was lost', nm + ' ' + key);
          else if (!k.ask && !below) fail('an edit was kept but not asked', nm + ' ' + key);
        }
      }
      for (const k of A0.kept || []) { const b = (B0.kept || []).find(x => x.id === k.id), z = (commonBase.kept || []).find(x => x.id === k.id); if (b && canon(b) !== canon(k) && canon(k) !== canon(z) && canon(b) !== canon(z)) seen('kept changed on both'); }
      // ... and no kept version is ever dropped: Undo can bring back any of them [AQ3]
      for (const mine of [A0, B0]) for (const k of mine.kept || []) {
        const f = (final.kept || []).find(x => x.id === k.id);
        for (const v of k.versions) if (!f || !f.versions.some(x => S.same(x, v))) fail('a kept version was dropped', k.id);
      }
      // 4. nothing doubled
      for (const list of ['events', 'schedules', 'accounts', 'checkins', 'people', 'places', 'kept']) {
        const ids = (final[list] || []).map(x => x.id);
        if (new Set(ids).size !== ids.length) fail('an id is doubled', list);
      }
      // every statement line read on either device is one record: its built id is the same wherever it was read [AP3]
      for (const id of ctx.lines) if (!(final.events || []).some(e => e.id === id)) fail('a statement line is missing', id);
      const lineKeys = new Map();
      for (const e of live(final.events).filter(x => /^imp:/.test(x.id))) {
        const k = e.acct + '|' + (e.src && e.src.from) + '|' + e.date + '|' + e.a + '|' + e.k + '|' + e.id.split(':').slice(2).join(':');
        if (lineKeys.has(k)) fail('one statement line is two records', e.id); lineKeys.set(k, 1);
      }
      // 5. the one-device checks: answered until none is left, and none throws
      let guard = 0;
      const answerer = r.chance(0.5) ? devs.phone : devs.desktop, follower = answerer === devs.phone ? devs.desktop : devs.phone;
      const answerNow = round === rounds || r.chance(0.4);
      while (answerNow) {
        const qs = S.afterSync(answerer.copy).questions;
        if (!qs.length) break;
        if (++guard > 25) { fail('questions never end', canon(qs).slice(0, 300)); break; }
        answerer.now = clock = clock + r.int(1, 30) * MIN;
        answerQuestion(ctx, answerer, qs[0]);
        for (const d of [answerer, follower]) { const x = S.syncDevice({ copy: d.copy, base: d.base, baseRev: d.baseRev }, cloud); Object.assign(d, x.device); cloud = x.cloud; d.lastSeen = [d.lastSeen, M.newestAt(d.copy)].sort((a, b) => Date.parse(b) - Date.parse(a))[0]; }
      }
      if (answerNow) {
        const left = S.afterSync(cloud.copy);
        if (left.questions.length) fail('a one-device check still fails after its questions were answered', canon(left.questions).slice(0, 300));
        if (canon(devs.phone.copy) !== canon(devs.desktop.copy)) fail('the devices differ after answering', round);
      }
    }
  } catch (e) {
    fail('threw', e.stack.split('\n').slice(0, 4).join(' | '));
  }
  return fails;
}

if (require.main === module) {
  let failed = 0, failures = [];
  const counts = new Map();
  const t0 = Date.now();
  for (let seed = FROM; seed < FROM + SEEDS; seed++) {
    const f = runSeed(seed);
    if (f.length) { failed++; failures = failures.concat(f); }
    for (const x of f) counts.set(x.what, (counts.get(x.what) || 0) + 1);
  }
  console.log('Exercised: ' + Object.entries(STATS).sort().map(([k, v]) => k + ' ' + v).join(', '));
  for (const [what, n] of counts) console.log(`FAIL ${what}: ${n} times`);
  if (SHOW) for (const f of failures.slice(0, 40)) console.log(`  seed ${f.seed}: ${f.what}: ${f.detail}`);
  else if (failures.length) console.log('  first: seed ' + failures[0].seed + ': ' + failures[0].what + ': ' + failures[0].detail);
  console.log(failed ? `FAILED: ${failed} of ${SEEDS} seeds failed (seeds ${FROM} to ${FROM + SEEDS - 1}, ${Math.round((Date.now() - t0) / 1000)} s)`
    : `All ${SEEDS} seeds passed (seeds ${FROM} to ${FROM + SEEDS - 1}, ${Math.round((Date.now() - t0) / 1000)} s)`);
  process.exit(failed ? 1 : 0);
}
module.exports = { runSeed };
