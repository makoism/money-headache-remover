'use strict';
// The move (engine/move.js) checked three ways (WIRING_PLAN step 11, R2, R3):
// 1. every case in foundation_review/rules/move.json, run through engine/move.js and compared as run_rules.js compares
//    them (keys sorted, lists of records in id order);
// 2. a made-up copy of Mako's shape as 38.28 saved it (live) and as 38.31 saved it (latest): every typed figure and
//    receipt lands, nothing is left unplaced, the old text is kept whole;
// 3. a round trip: every leaf field of a full 38.28 and 38.31 copy lands somewhere in the new book, or is a field
//    MOVE_FIELDS says needs no place, or is listed (unplaced, zero); and the frozen text is the copy as it was.
// The merge of two devices' moves (move_two, move_later) uses the frozen merge reference until the engine has its own
// merge (lane A): the move itself is all engine.
const fs = require('fs');
const path = require('path');
const { t, done, eq, ok } = require('./t.js');
const M = require('../move.js');
const S = require('../schedules.js');
const D = require('../dates.js');
const L = require('../lookahead.js');
const FR = path.join(__dirname, '..', '..', 'foundation_review', 'rules');
const refMerge = require(path.join(FR, 'merge_ref.js')).merge;

// ---------- the case adapter ----------
function canon(x) {
  if (Array.isArray(x)) {
    const byId = x.length > 1 && x.every(i => i && typeof i === 'object' && typeof i.id === 'string');
    return '[' + (byId ? x.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : x).map(canon).join(',') + ']';
  }
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const isMap = o => !!o && typeof o === 'object' && !Array.isArray(o);
// A test helper only: `make.receipts` adds that many plain receipts, so a case can hold 5,002 receipts without listing them.
function prep(d) {
  if (!d || typeof d.raw === 'string' || !d.copy) return d;
  const c = JSON.parse(JSON.stringify(d.copy)), m = d.make && d.make.receipts;
  if (m) c.receipts = (c.receipts || []).concat(Array.from({ length: m.count }, (_, i) => ({ id: 'g' + (i + 1), d: m.d, a: m.a, c: m.c, cn: '', n: '' })));
  return Object.assign({}, d, { copy: c });
}
const listOf = (o, p) => p.reduce((x, k) => (x || {})[k], o) || [];
function ids(out) {
  const all = [];
  for (const k of ['people', 'accounts', 'places', 'schedules', 'events']) for (const r of out[k] || []) all.push(r.id);
  for (const k of ['shares', 'budgets']) for (const r of (out.plan || {})[k] || []) all.push(r.id);
  return all.sort();
}
const tally = out => { const sp = (out.events || []).filter(e => e.k === 'spend'); return { spends: sp.length, a: sp.reduce((s, e) => s + e.a, 0) }; };
// Each pay's amount on a due day, read with the engine's own schedule reader (schedules.js): `amounts` first, else the
// step in force; a stream kept as monthly totals its share of the year (monthShare).
function payAmounts(out, payAt) {
  const r = {}, cal = S.calendar('none');
  for (const id of Object.keys(payAt || {})) {
    const s = (out.schedules || []).find(x => x.id === id); if (!s) continue;
    r[id] = {};
    for (const due of payAt[id]) {
      const own = S.keyAmount(s.amounts, due);
      const n = D.dayNum(due), step = S.stepOn(s, n);
      const sh = s.per === 'month' && s.rules && s.rules.length ? S.monthShare(s, cal, n, step) : null;
      r[id][due] = own != null ? own : sh ? sh.amount : step;
    }
  }
  return r;
}
function view(out, { show, omit, payAt, pick }) {
  let o = out;
  if (show || pick) o = {};
  for (const k of show || []) {
    if (k === 'tally') o.tally = tally(out); else if (k === 'ids') o.ids = ids(out);
    else if (k === 'frozenIds') o.frozenIds = (out.frozen || []).map(r => r.id).sort();
    else if (k === 'pendingMoveIds') o.pendingMoveIds = (out.pendingMove || []).filter(r => !r.gone).map(r => r.id).sort();
    else if (k === 'payAmounts') o.payAmounts = payAmounts(out, payAt);
    else if (k.includes('.')) { const [a, b] = k.split('.'); o[k] = (out[a] || {})[b]; } else o[k] = out[k];
  }
  if (pick) { o.pick = {}; for (const [l, id, f] of pick) { const r = listOf(out, l.split('.')).find(x => x.id === id); o.pick[l + ' ' + id + ' ' + f] = r && r[f] !== undefined ? r[f] : null; } }
  if (omit) { const strip = x => Array.isArray(x) ? x.map(strip) : isMap(x) ? Object.fromEntries(Object.entries(x).filter(([k]) => !omit.includes(k)).map(([k, v]) => [k, strip(v)])) : x; o = strip(o); }
  return o;
}
function ask(q, input) {
  const two = x => Object.assign({}, x, { phone: prep(x.phone), desktop: prep(x.desktop) });
  if (q === 'move') return view(M.move(prep(input)), input);
  if (q === 'move_answer') return view(M.moveAnswer(prep(input)), input);
  if (q === 'move_two') return view(M.moveTwo(two(input), refMerge), input);
  if (q === 'move_later') return view(M.moveLater(two(input), refMerge), input);
  if (q === 'apply_waiting') return view(M.applyWaiting(input), input);
  throw new Error('unknown question ' + q);
}

// [WIRING_PLAN F2] The frozen cases were written before F2, which marks a bank check with no day of its own `stale: true`.
// That one field is taken off before comparing, and only on the moved bank checks (`mv:check:cfg.*`); the mark itself is
// checked on its own below (stale marks).
let staleSeen = 0;
function withoutF2(x) {
  if (Array.isArray(x)) return x.map(withoutF2);
  if (!isMap(x)) return x;
  const o = {};
  for (const [k, v] of Object.entries(x)) {
    if (k === 'stale' && v === true && typeof x.id === 'string' && /^mv:check:cfg\.bank(Start|Now)$/.test(x.id)) { staleSeen++; continue; }
    o[k] = withoutF2(v);
  }
  return o;
}
const spec = JSON.parse(fs.readFileSync(path.join(FR, 'move.json'), 'utf8'));
let casePass = 0;
for (const c of spec.cases) {
  t('rules ' + c.id + ' ' + c.title, () => {
    const input = Object.assign({}, spec.defaults || {}, c.input);
    let got;
    try { got = withoutF2(ask(c.question, input)); } catch (e) { got = { threw: e.message }; }
    if (canon(got) !== canon(c.expected)) throw new Error('\n     expected ' + canon(c.expected) + '\n     got      ' + canon(got));
    casePass++;
  });
}
t('every move.json case was run [lesson 3: a count]', () => { eq(casePass, spec.cases.length); ok(spec.cases.length >= 129); });

// ---------- made-up copies of Mako's shape (DECISIONS "Mako's own money": pay on the 10th, two cards paid in full on
// the 10th and 11th). Every amount is made up. ----------
// 38.28 (live, public/index.html at e15e25d): v 1, `rev` a count, no cards, no bankNow, no ui.minAuto; its clean-up
// writes ui.cur and preset; plan with lines, goals, debts and recurring; receipts `id, d, a, c, cn, n, s`.
const COPY_3828 = {
  v: 1, rev: 412,
  steps: { a: [{ from: '2026-11', v: 310000 }, { from: '2027-04', v: 325000 }], 'bill:rent': [{ from: '2027-03', v: 92000 }], 'goal:trip': [{ from: '2027-01', v: 15000 }], envelope: [{ from: '2027-02', v: 30000 }] },
  once: { '2026-12': { a: 400000, 'bill:food': 55000, 'goal:trip': 20000 }, '2027-01': { side: 12000 } },
  items: { '2027-03': [{ id: 'i1', label: 'Glasses', amount: 18000, note: 'new lenses' }], '2027-05': [] },
  cfg: { bankStart: 480000, minBank: 50000, ceiling: 200000, aims: { nec: 0.55, play: 0.1 } },
  ui: { cur: '¥', preset: 'legacy', name: 'Sample person', done: { pay: true, bills: true, goals: true }, gk: { trip: 'trip' }, main: 'trip',
    accts: [{ id: 'ac1', name: 'Main bank', kind: 'bank' }, { id: 'ac2', name: 'Pocket cash', kind: 'wallet' }],
    cats: { 'SEVEN ELEVEN': 'bill:food' }, wk: ['2026-11-16', '2026-11-23'], mute: true, tourAt: 'home', seen: { home: true },
    sweep: { '2026-11': { hide: true } }, limits: true, hope: 'calm' },
  plan: {
    lines: [{ id: 'rent', key: 'bill:rent', jar: 'nec', name: 'Rent or mortgage', def: 90000 }, { id: 'food', key: 'bill:food', jar: 'nec', name: 'Food and groceries', def: 50000 },
      { id: 'phone', key: 'bill:phone', jar: 'nec', name: 'Phone', def: 4000 }, { id: 'card', key: 'card', jar: 'nec', name: 'Other card spending', def: 0 },
      { id: 'loan', key: 'bill:loan', jar: 'nec', name: 'Loan or debt payment', def: 0 }, { id: 'spend', key: 'envelope', jar: 'play', name: 'Free to spend', def: 25000 },
      { id: 'gym', key: 'line:gym', jar: 'play', name: 'Gym', def: 8000 }],
    goals: [{ id: 'rainy', name: 'Emergency fund', target: 600000, start: 150000, due: '', monthly: 20000, slot: 7, emergency: true, stretch: 900000 },
      { id: 'trip', name: 'Trip', target: 200000, start: 0, due: '', monthly: 10000, slot: 5, why: 'see family' }],
    debts: [{ id: 'cc1', name: 'Card A', kind: 'card', balance: 0, apr: 15, min: 0, extra: 0 }],
    recurring: [{ id: 'gymfee', a: 8000, c: 'line:gym', n: 'Gym fee', every: 'month', on: 1, from: '2026-12-01', last: '' }],
  },
  receipts: [{ id: 'r1', d: '2026-11-18', a: 1200, c: 'bill:food', cn: 'Food and groceries', n: 'lunch', s: 'Main bank' },
    { id: 'r2', d: '2026-11-19', a: 3000, c: 'other', cn: 'Other', n: '' }, { id: 'r3', d: '2026-11-20', a: 800, c: 'envelope', cn: 'Free to spend', n: '', s: 'Coin purse' }],
};
// 38.31 (latest, wip-38.31): adds cards[], cfg bankAt, bankNow, bankNowAt, planFrom, ui keep/keeps/preSplit, mcOk, minAuto,
// sweep `{ amt, to, t }`, `rev` a time.
const COPY_3831 = Object.assign(JSON.parse(JSON.stringify(COPY_3828)), {
  rev: Date.UTC(2026, 10, 22, 12, 0, 0),
  cards: [{ id: 'k1', name: 'Card A', owed: 42000, payDay: 10, at: '2026-11-22' }, { id: 'k2', name: 'Card B', owed: 18000, payDay: 11, at: '2026-11-22' }],
});
Object.assign(COPY_3831.cfg, { bankAt: '2026-11-15', bankNow: 455000, bankNowAt: '2026-11-22', planFrom: '2026-11' });
Object.assign(COPY_3831.ui, { minAuto: 30000, mcOk: { '2026-11': true }, keep: { x: 1 }, keeps: [], preSplit: null, sweep: { '2026-11': { amt: 5000, to: 'bank', t: Date.UTC(2026, 10, 22) } } });
COPY_3831.plan.debts = [];   // 38.31 keeps pay-in-full cards in cards[]

const NOW = '2026-11-24T09:00:00.000+09:00';
const ANSWERS = { cur: 'JPY', pay: { a: { every: 'month', days: [10] }, side: { every: 'month', days: [25] } }, billDay: { rent: { every: 'month', days: [27] }, phone: { every: 'month', days: [5] } },
  goalMoney: { rainy: 'bank' }, loanLine: 'drop', debtDay: { cc1: 10 } };

function checkMako(name, copy, idb) {
  const out = M.move({ copy, now: NOW, idb, answers: ANSWERS });
  t(name + ': nothing waits for the currency, the old text is kept whole', () => {
    eq(out.waiting, undefined);
    eq(out.frozen3831, JSON.stringify(copy));
    eq(JSON.parse(out.frozen3831), copy);
  });
  t(name + ': every receipt is a spend with its amount, day and note', () => {
    for (const r of copy.receipts) {
      const e = out.events.find(x => x.id === 'mv:rc:' + r.id);
      ok(e, r.id); eq([e.k, e.date, e.a], ['spend', r.d, r.a]);
      if (r.n) ok(e.note.startsWith(r.n));
    }
    eq(out.events.find(x => x.id === 'mv:rc:r1').acct, 'mv:acct:ac1');   // s names an account
    eq(out.events.find(x => x.id === 'mv:rc:r3').note, 'paid from: Coin purse');   // [AA1]
  });
  t(name + ': the bank figures, pay, bills, lines, goals and one-time cost land', () => {
    const bank = out.events.filter(e => e.acct === 'mv:acct:cfg' && (e.k === 'open' || e.k === 'check')).map(e => e.a);
    ok(bank.includes(copy.cfg.bankStart));
    if (copy.cfg.bankNow) ok(bank.includes(copy.cfg.bankNow));
    const pay = out.schedules.find(s => s.id === 'mv:pay:steps.a');
    eq(pay.rules, [{ from: out.home.curs[0].from, rule: { every: 'month', days: [10] } }]);
    ok(pay.steps.some(s => s.amount === 325000 && s.from === '2027-04-01'));
    ok(out.schedules.find(s => s.id === 'mv:bill:rent').steps.some(s => s.amount === 92000));
    ok(out.plan.budgets.find(b => b.id === 'mv:line:food'));
    ok(out.plan.budgets.find(b => b.id === 'mv:line:gym'));
    eq(out.places.map(p => p.id).sort(), ['mv:place:rainy', 'mv:place:trip']);
    eq(out.events.find(e => e.id === 'mv:open:cfg').split, { 'mv:place:rainy': 150000 });
    ok(out.schedules.find(s => s.id === 'mv:item:2027-03:i1' && s.name === 'Glasses' && s.note === 'new lenses'));
    ok(out.schedules.find(s => s.id === 'mv:auto:gymfee'));
    ok(out.plan.shares.length >= 1);
    eq(out.plan.limits.ceiling, { a: 200000, cur: 'JPY', per: 'month' });
  });
  t(name + ': the one-month amounts are written (salary day answered), nothing waits but what must', () => {
    ok(out.schedules.find(s => s.id === 'mv:pay:steps.a').amounts['2026-12-10']);
    ok(out.schedules.find(s => s.id === 'mv:pay:steps.side').amounts['2027-01-25']);
    ok(out.plan.budgets.find(b => b.id === 'mv:line:food').once['mv:pay:steps.a@2026-12-10']);
    // only a month-end answer for a period not ended at the move waits [AB2]: 38.31's November answer (pay 10 Nov to 9 Dec)
    eq(out.pendingMove.filter(p => !p.gone).map(p => p.id), copy.ui.sweep['2026-11'].hide ? [] : ['mv:pend:ui.sweep.2026-11']);
  });
  t(name + ': nothing is left unplaced but the fields MOVE_FIELDS says to list', () => {
    eq(out.unplaced, ['ui.hope']);   // 11.1: kept on the shared ui, listed
    eq(out.ui.hope, 'calm');
  });
  t(name + ': the moved book runs in the look ahead', () => {
    const book = M.stored({ copy, now: NOW, idb, answers: ANSWERS, by: 'phn001' });
    ok(book.v === 3 && book.frozen[0].raw === JSON.stringify(copy));
    const res = L.lookahead(book, '2026-11-24');
    ok(res && typeof res === 'object');
  });
  return out;
}
const o28 = checkMako('38.28', COPY_3828, null);
const o31 = checkMako('38.31', COPY_3831, { t: '2026-11-22T21:00:00.000+09:00' });
t('38.28: `rev` a count, so its minimum (no ui.minAuto) reads as automatic and is asked [AD1]', () => {
  eq(o28.home.main.min, null);
  ok(o28.asks.some(a => a.q === 'minBank' && a.shown === undefined));
});
t('38.31: the typed minimum is kept (ui.minAuto differs), the cards open at what is owed [AB M1, 11.1]', () => {
  eq(o31.home.main.min, { a: 50000, cur: 'JPY' });
  eq(o31.events.find(e => e.id === 'mv:open:card:k1').a, 42000);
  eq(o31.accounts.find(a => a.id === 'mv:card:k2').payDay, 11);
  eq(o31.events.find(e => e.id === 'mv:check:cfg.bankNow').a, 455000);
});

// ---------- the round trip: every old leaf field lands somewhere (MOVE_FIELDS section 3) ----------
// Each leaf path of the old copy is checked by the rule of its MOVE_FIELDS row: where it lands in the new book, that it
// is listed (unplaced, zero), or that MOVE_FIELDS says it needs no place (kept in the frozen text). A path no rule knows
// is a failure, so a new field in an old copy cannot slip through unnoticed.
function leaves(x, p, out) {
  if (Array.isArray(x)) { if (!x.length) out.push([p, x]); x.forEach((v, i) => leaves(v, p + '.' + i, out)); }
  else if (isMap(x)) { if (!Object.keys(x).length) out.push([p, x]); for (const k of Object.keys(x)) leaves(x[k], p ? p + '.' + k : k, out); }
  else out.push([p, x]);
  return out;
}
const SHARE_FIELD = { spend: 'free', learn: 'edu', invest: 'ffa', give: 'give' };
function lands(copy, out) {
  const rec = id => [].concat(out.accounts, out.places, out.schedules, out.events, out.people, out.plan.budgets, out.plan.shares).find(r => r.id === id);
  const listed = l => out.unplaced.includes(l) || out.zero.includes(l);
  const waits = f => out.pendingMove.some(p => p.id === 'mv:pend:' + f);
  const cats = { 'bill:food': { line: 'mv:line:food' }, envelope: { place: 'free' }, other: { place: 'free', line: 'other' }, 'line:gym': { line: 'mv:line:gym' } };
  const catOk = (r, c) => !!cats[c] && Object.entries(cats[c]).every(([k, x]) => r[k] === x);
  const D0 = out.home.curs[0].from;
  const stepFrom = ym => (ym > D0.slice(0, 7) ? ym + '-01' : D0);
  // the record a steps key moves to, and the amount it holds for a month
  function stepLands(key, ym, v) {
    const l = (copy.plan.lines || []).find(x => (({ rent: 'bill:rent', food: 'bill:food', phone: 'bill:phone', card: 'card', loan: 'bill:loan', spend: 'envelope' })[x.id] || 'line:' + x.id) === key);
    if (/^(a|b|side)$/.test(key)) return rec('mv:pay:steps.' + key).steps.some(s => s.from === stepFrom(ym) && s.amount === v);
    if (key.startsWith('goal:')) return out.plan.shares.some(e => e.from === stepFrom(ym) && e.goals && e.goals['mv:place:' + key.slice(5)] === v);
    if (key === 'envelope') return out.plan.shares.some(e => e.from === stepFrom(ym) && e.free === v);
    const r = l && (rec('mv:bill:' + l.id) || rec('mv:line:' + l.id));
    return !!r && r.steps.some(s => s.from === stepFrom(ym) && s.amount === v);
  }
  const R = [
    [/^v$|^rev$/, () => out.v === 3],   // replaced by v 3 and the new rev; the old values in frozen3831
    [/^steps\.([^.]+)\.(\d+)\.(from|v)$/, m => { const st = copy.steps[m[1]][+m[2]]; return listed('steps.' + m[1]) || stepLands(m[1], st.from, st.v); }],
    [/^once\.([^.]+)\.(.+)$/, m => listed('once.' + m[1] + '.' + m[2]) || waits('once.' + m[1] + '.' + m[2])],   // written, or waiting, as its pendingMove record
    [/^items\.([^.]+)$/, (m, v) => Array.isArray(v) && !v.length],   // "no one-time costs this month": none needed
    [/^items\.([^.]+)\.(\d+)\.(id|label|amount|note)$/, (m, v) => { const it = copy.items[m[1]][+m[2]], s = rec('mv:item:' + m[1] + ':' + it.id);
      return !!s && (m[3] !== 'label' || s.name === v) && (m[3] !== 'note' || s.note === v) && (m[3] !== 'amount' || s.steps[0].amount === v); }],
    [/^cfg\.(bankStart|bankNow)$/, (m, v) => rec('mv:check:cfg.' + m[1]).a === v],
    [/^cfg\.(bankAt|bankNowAt)$/, (m, v) => rec('mv:check:cfg.' + (m[1] === 'bankAt' ? 'bankStart' : 'bankNow')).date === v],
    [/^cfg\.minBank$/, (m, v) => (out.home.main.min || {}).a === v || out.asks.some(a => a.q === 'minBank')],   // kept, or dropped and asked [AD1]
    [/^cfg\.ceiling$/, (m, v) => out.plan.limits.ceiling.a === v],
    [/^cfg\.aims\.(.+)$/, (m, v) => out.plan.limits.aims[m[1]] === v],
    [/^cfg\.planFrom$/, () => true],   // none needed: periods come from pay
    [/^ui\.(cur|preset)$/, () => out.home.curs[0].cur === 'JPY' && out.asks.some(a => a.q === 'currency')],
    [/^ui\.name$/, (m, v) => rec('mv:person:ui.name').name === v],
    [/^ui\.gk\.(.+)$/, m => !!rec('mv:place:' + m[1])],
    [/^ui\.accts\.(\d+)\.(id|name|kind)$/, (m, v) => { const a = rec('mv:acct:' + copy.ui.accts[+m[1]].id);
      return !!a && (m[2] !== 'name' || a.name === v) && (m[2] !== 'kind' || a.type === ({ bank: 'bank', wallet: /cash/i.test(a.name) ? 'cash' : 'ewallet', card: 'card' })[v]); }],
    [/^ui\.cats\.(.+)$/, (m, v) => out.imports.cats[M.catKey(m[1])] === v],
    [/^ui\.wk\.\d+$/, (m, v) => out.device.opens.includes(v)],
    [/^ui\.sweep\.([^.]+)\.hide$/, () => true],   // [Y8] hide writes nothing
    [/^ui\.sweep\.([^.]+)\.(amt|to|t|id)$/, m => waits('ui.sweep.' + m[1]) || out.events.some(e => e.src && e.src.id === 'ui.sweep.' + m[1])],
    [/^ui\.(keep|keeps|preSplit|minAuto)(\.|$)/, () => true],   // none needed: Undo copies (D2); minAuto only decides the minimum
    [/^ui\.(mute)$/, (m, v) => out.device.look[m[1]] === v],
    [/^ui\.(tourAt|seen)(\.|$)/, m => m[1] in out.device.tour],
    [/^ui\.(main|done|limits|mcOk)(\.|$)/, m => m[1] in out.ui],
    [/^ui\.hope$/, (m, v) => out.ui.hope === v && listed('ui.hope')],
    [/^plan\.lines\.(\d+)\.(\w+)$/, (m, v) => { const l = copy.plan.lines[+m[1]];
      if (listed('plan.lines.' + l.id)) return true;   // 0 every month: listed in `zero` [Y25]
      if (['note', 'key', 'jar', 'id'].includes(m[2])) return m[2] !== 'jar' || !!(rec('mv:bill:' + l.id) || rec('mv:line:' + l.id) || SHARE_FIELD[l.id]);
      if (SHARE_FIELD[l.id]) return m[2] === 'name' || out.plan.shares[0][SHARE_FIELD[l.id]] === v;   // a share's name is its place's
      const r = rec('mv:bill:' + l.id) || rec('mv:line:' + l.id);
      return !!r && (m[2] !== 'name' || r.name === v) && (m[2] !== 'def' || r.steps.some(x => x.amount === v)); }],
    [/^plan\.goals\.(\d+)\.(\w+)$/, (m, v) => { const g = copy.plan.goals[+m[1]], p = rec('mv:place:' + g.id); if (!p) return false;
      switch (m[2]) {
        case 'id': case 'slot': return p.slot === g.slot;
        case 'name': case 'target': case 'why': case 'stretch': case 'emergency': return p[m[2]] === v;
        case 'due': return p.due === (v || null);
        case 'start': return v === 0 || (rec('mv:open:cfg').split || {})[p.id] === v;
        case 'monthly': return out.plan.shares.some(e => e.goals && e.goals[p.id] === v);
        default: return false;
      } }],
    [/^plan\.(debts|recurring)$/, (m, v) => Array.isArray(v) && !v.length],   // an empty list: nothing to move
    [/^plan\.debts\.(\d+)\.(\w+)$/, (m, v) => { const d = copy.plan.debts[+m[1]], a = rec('mv:debt:' + d.id); if (!a) return false;
      switch (m[2]) {
        case 'id': return true; case 'name': return a.name === v; case 'kind': return a.type === (v === 'card' ? 'card' : 'loan'); case 'apr': return a.apr === v;
        case 'min': return a.minRule.fixed === v; case 'extra': return a.extraSteps[0].amount === v; case 'balance': return rec('mv:open:debt:' + d.id).a === v;
        default: return false;
      } }],
    [/^plan\.recurring\.(\d+)\.(\w+)$/, (m, v) => { const r = copy.plan.recurring[+m[1]], s = rec('mv:auto:' + r.id); if (!s) return false;
      switch (m[2]) {
        case 'id': return true; case 'every': case 'on': return !!s.rules[0].rule.every; case 'from': return s.from === v;
        case 'a': return s.steps[0].amount === v; case 'n': return s.name === v; case 'c': return catOk(s, v);
        case 'last': return v === '' ? !('last' in s) : s.last === v;
        default: return false;
      } }],
    [/^receipts\.(\d+)\.(\w+)$/, (m, v) => { const r = copy.receipts[+m[1]], e = rec('mv:rc:' + r.id); if (!e) return false;
      switch (m[2]) {
        case 'id': return true; case 'd': return e.date === v; case 'a': return e.a === v;
        case 'cn': return true;   // none needed: the line or place names it
        case 'c': return catOk(e, v); case 'n': return v === '' || e.note.startsWith(v);
        case 's': return (out.accounts.find(a => a.id === e.acct) || {}).name === v || (e.note || '').includes('paid from: ' + v);
        default: return false;
      } }],
    [/^cards\.(\d+)\.(\w+)$/, (m, v) => { const c = copy.cards[+m[1]], a = rec('mv:card:' + c.id); if (!a) return false;
      switch (m[2]) {
        case 'id': return true; case 'name': return a.name === v; case 'payDay': return a.payDay === v;
        case 'owed': return rec('mv:check:card:' + c.id).a === v; case 'at': return rec('mv:check:card:' + c.id).date === v;
        default: return false;
      } }],
  ];
  const lost = [];
  for (const [p, v] of leaves(copy, '', [])) {
    const r = R.find(([re]) => re.test(p));
    let fine = false;
    try { fine = !!r && r[1](p.match(r[0]), v); } catch (e) { fine = false; }
    if (!fine) lost.push(p + '=' + JSON.stringify(v) + (r ? '' : ' (no rule)'));
  }
  return lost;
}
t('38.28: every old field lands somewhere, is listed, or needs no place [MOVE_FIELDS]', () => eq(lands(COPY_3828, o28), []));
t('38.31: every old field lands somewhere, is listed, or needs no place [MOVE_FIELDS]', () => eq(lands(COPY_3831, o31), []));
t('the round trip finds a field that went missing (the check can fail)', () => {
  const broken = JSON.parse(JSON.stringify(o28));
  broken.events = broken.events.filter(e => e.id !== 'mv:rc:r2');
  ok(lands(COPY_3828, broken).some(x => x.startsWith('receipts.1.')));
  ok(lands(Object.assign({}, COPY_3828, { newThing: 1 }), o28).some(x => x.includes('newThing')));
});

// ---------- WIRING_PLAN F2: what the old copy cannot answer ----------
t('F2 38.28: the bankStart check has no day of its own: dated the last save and marked stale', () => {
  const chk = o28.events.find(e => e.id === 'mv:check:cfg.bankStart');
  eq([chk.date, chk.stale], ['2026-11-24', true]);   // no second copy and a `rev` count: the move's own day [Y13]
  eq(o28.events.find(e => e.id === 'mv:open:cfg').stale, undefined);
});
t('F2 38.28: needs lists bank today, the cards, each card\'s days, each bill\'s day and the card line, each pointing at its record', () => {
  const o = M.move({ copy: COPY_3828, now: NOW, answers: { cur: 'JPY', pay: ANSWERS.pay, goalMoney: { rainy: 'bank' }, loanLine: 'drop' } });
  eq(o.needs, [
    { q: 'bankToday', ref: 'mv:acct:cfg' },
    { q: 'cardDays', ref: 'mv:debt:cc1', missing: ['payDay', 'cutDay'] },
    { q: 'billDay', ref: 'mv:bill:rent' },
    { q: 'billDay', ref: 'mv:bill:phone' },
  ]);
  // the Card line is 0 every month in this copy, so it is not moved and not asked; with an amount (and no cards) it is
  const withCard = JSON.parse(JSON.stringify(COPY_3828)); withCard.plan.lines.find(l => l.id === 'card').def = 30000; withCard.plan.debts = [];
  const o2 = M.move({ copy: withCard, now: NOW, answers: { cur: 'JPY', goalMoney: { rainy: 'bank' } } });
  eq(o2.needs.map(n => n.q + ' ' + n.ref), ['bankToday mv:acct:cfg', 'cards mv:acct:cfg', 'billDay mv:bill:rent', 'billDay mv:bill:phone', 'cardLine mv:line:card']);
  for (const n of o2.needs) ok([].concat(o2.accounts, o2.schedules, o2.plan.budgets).some(r => r.id === n.ref), n.q);
});
t('F2 38.28: needs reads the stored book the same, so the screens can ask after the move', () => {
  const book = M.stored({ copy: COPY_3828, now: NOW, idb: null, answers: ANSWERS, by: 'phn001' });
  eq(book.needs, undefined);   // not stored: worked out from the records
  eq(M.needs(book), o28.needs);
  eq(o28.needs.map(n => n.q), ['bankToday', 'cardDays']);   // the bill days were answered (ANSWERS.billDay)
  eq(o28.needs[1], { q: 'cardDays', ref: 'mv:debt:cc1', missing: ['cutDay'] });   // its payment day too (debtDay)
});
t('F2 38.31: a dated bank figure is not stale and bank today is not asked; the cards still need a close day', () => {
  eq(o31.events.filter(e => e.stale), []);
  eq(o31.needs, [{ q: 'cardDays', ref: 'mv:card:k1', missing: ['cutDay'] }, { q: 'cardDays', ref: 'mv:card:k2', missing: ['cutDay'] }]);
});
t('F2: the frozen cases met the stale mark (the adapter took it off only there)', () => ok(staleSeen > 0));
// ---------- the platform rules for move.js (platform.test.js does not list it; lane A owns that file) ----------
t('move.js: no Date parsing of a date string, no Date built from a value, no clock read, no toISOString [D8]', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'move.js'), 'utf8').split('\n').filter(l => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
  ok(!/new Date\(/.test(src)); ok(!/Date\.parse|toISOString|Date\.now\(/.test(src));
});
if (!process.env.MOVE_TZ_INNER) t('move.js: the same answers in Los Angeles and in Tokyo', () => {
  const { spawnSync } = require('child_process');
  const run = tz => spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { TZ: tz, MOVE_TZ_INNER: '1' }), encoding: 'utf8' });
  const la = run('America/Los_Angeles'), tk = run('Asia/Tokyo');
  eq([la.status, tk.status], [0, 0]); eq(la.stdout, tk.stdout);
});
t('move.js loads as a plain browser script after dates.js and units.js', () => {
  const vm = require('vm'), ctx = vm.createContext({});
  for (const f of ['dates.js', 'units.js', 'move.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx);
  const o = vm.runInContext('BurrowEngine.move.move', ctx)({ copy: COPY_3828, now: NOW, answers: ANSWERS });
  eq(JSON.stringify(o), JSON.stringify(o28));
});
t('the old copy is never changed by the move', () => {
  const before = JSON.stringify(COPY_3831);
  M.move({ copy: COPY_3831, now: NOW, answers: ANSWERS });
  eq(JSON.stringify(COPY_3831), before);
});
done('move');
