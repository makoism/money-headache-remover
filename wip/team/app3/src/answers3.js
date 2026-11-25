/* ---------- answers3: the ONE answers-to-book function (AI_FIRST_PLAN corrections BV1, BV2.8, BV2.10, BV2.13) ----------
   setup3, the chat's draft (chat3_core.js) and the "Use any AI" paste all turn setup answers into a book here. The
   answers are what the person said; every field they never see is filled here and nowhere else: the keys, the setup
   day, told, the currency (from the country), the weekend rules (pay the working day before, cards and bills the day
   after), which pay starts the period (the first with a fixed day). Nothing is worked out: engine/build_book.js writes
   the book, and asks (its `asked`, `askedStatements`) which answers the day needs.

   The answers (ANSWERS3's shape; amounts in minor units; accounts are named by their names):
     { country: 'JP' | 'PH' | 'XX', currency: 'JPY' | 'PHP' | 'USD' | 'EUR' (its own answer, in the chat too),
       banks: [{ name, amount, type?: 'bank' | 'cash' | 'ewallet' | 'wallet', on: day the figure was given,
                 payToday?: { landed, day } }],      the first is the main bank
       pays:  [{ name, amount | null, every: 'month' | 'days' | 'weeks' | 'none', day?, day2?, n?, start?, shift?, bank? }],
       cards: [{ name, owed, on, payDay, closeDay: 1..31 | 'last' | 'not sure', shift?, payFrom?,
                 statement?: { a: amount | 'not sure', closed: day } }],
       bills: [{ name, amount, day, every?: 'month' | 'year', month?: 1..12, from?, out?: { out: bool, days: [days] } }],
       free: amount | null, min: amount | null }
   Each asked answer sits on its own item (found by keyOf, never by position) with the days it answered [BV2.8].

   API (ANSWERS3 in a page; module.exports in node):
     keyOf(section, name)                 the item's key: 'bills:rent'
     toBuild(answers, { day, told, currency? }) -> build_book's input (throws Error(plain words) on a wrong answer)
     build(answers, { day, told, newId, currency? }) -> build_book's result; a pay not landed yet in today's figure
                                          (payToday.landed false) stays to come (named in the opening check's notYet)
     questions(answers, { day }) -> { asked: { key: [days] }, statements: { key: { closed, payment } }, payToday: bool }
     need(answers, { day }) -> [words]    what a fill on that day still needs: today's figures (BV3), each asked
                                          answer for these very days (BV4, BV2.8), "has today's pay landed?" (BV2.13)
     toForm(answers, { day }) -> setup3's form (a bank, account or card figure not given on `day` leaves its box empty)     fromForm(form, { day }) -> answers
   setup3's form (its boxes as plain values; account choices are setup3's keys 'bank1', 'acct2', ...):
     { bankName, bank, cur, country, accts: [{ name, amount, type }], payToday: 'yes' | 'no' | null,
       pay: { name, amount, every: 'month' | 'days' | 'weeks1'..'weeks4' | 'none', day, day2, start, shift, acct },
       pays: [{ name, amount, every: 'same' | (as pay), day, day2, start, acct }],
       cards: [{ name, owed, payDay, closeDay, payFrom, shift, statement: amount | null }],
       bills: [{ name, amount, every: 'month' | 'year', month: '01'..'12', day, from, takenOut: 'yes' | 'no' }],
       free, min }
   MERGE NOTE (lane/setupfix owns setup3.js): setup3's answers3(strict) should read its boxes into this form and call
   ANSWERS3.toBuild(ANSWERS3.fromForm(form, { day }), { day, told, currency }), its askTaken3 should use
   ANSWERS3.questions, and it should ask payToday (BV2.13). build3.sh must load answers3.js before setup3.js.
   Plain browser JavaScript. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const B = node ? require('../../engine/build_book.js') : root.BurrowEngine.build;
  const S = node ? require('../../engine/schedules.js') : root.BurrowEngine.schedules;
  const D = node ? require('../../engine/dates.js') : root.BurrowEngine.dates;
  const IDS = node ? require('../../engine/ids.js') : root.BurrowEngine.ids;
  const SN = node ? require('../../screens/names.js') : root.BurrowScreens.names;
  const CUR_OF = { JP: 'JPY', PH: 'PHP' };
  const clone = x => JSON.parse(JSON.stringify(x));
  const keyOf = (section, name) => section + ':' + String(name == null ? '' : name).trim().toLowerCase();
  const day1 = s => SN.dayLabel(s, false);
  const fail = words => { throw new Error(words); };

  /* the build_book input; lenient (for the questions): a missing amount counts as 0, a fixed pay's as 1, no answers */
  function toBuild(ans, o, lenient) {
    const banks = ans.banks || [];
    if (!banks.length) fail('Setup needs at least one bank');
    const bankKeys = {};
    const seen = {};
    const once = (sec, name) => { const k = keyOf(sec, name); if (seen[k]) fail('There are two called ' + name + '. Give each its own name'); seen[k] = 1; return k; };
    const amt = (v, words) => (Number.isInteger(v) ? v : lenient ? 0 : fail(words));
    const out = { day: o.day, told: o.told, currency: ans.currency || CUR_OF[ans.country] || o.currency || 'JPY', country: ans.country || 'XX',
      banks: [], pays: [], cards: [], bills: [] };
    banks.forEach((b, i) => {
      once('banks', b.name);
      const key = i ? 'acct' + (i + 1) : 'bank1';
      bankKeys[keyOf('banks', b.name)] = key;
      const x = { key, name: b.name, amount: amt(b.amount, 'What does ' + b.name + ' show today?') };
      if (i) x.type = b.type || 'bank';
      else Object.assign(x, { main: true, min: ans.min != null ? amt(ans.min, 'How much to keep at least?') : null });
      out.banks.push(x);
    });
    const acct = (name, words) => { if (name == null || name === '') return 'bank1'; const k = bankKeys[keyOf('banks', name)]; return k || fail(words); };
    const mainShift = ((ans.pays || []).find(p => p.every !== 'none') || {}).shift || 'before';
    (ans.pays || []).forEach((p, i) => {
      once('pays', p.name);
      const x = { key: 'pay' + (i + 1), name: p.name, bank: acct(p.bank, p.name + ' lands in ' + p.bank + ', which is not one of your accounts') };
      if (p.every === 'none') {
        if (Number.isInteger(p.amount)) x.amount = p.amount;
        Object.assign(x, { shift: 'none', every: 'none' });
      } else {
        x.amount = Number.isInteger(p.amount) && p.amount > 0 ? p.amount : lenient ? 1 : fail(B.PAY_NEEDS_AMOUNT);
        x.shift = p.shift || mainShift;
        if (p.every === 'month' || p.every == null) Object.assign(x, { every: 'month', day: p.day });
        else if (p.every === 'days') { const d2 = p.day2 === 'last' ? 'last' : p.day2; Object.assign(x, { every: 'month', days: p.day === d2 ? [p.day] : [p.day, d2] }); }
        else if (p.every === 'weeks') Object.assign(x, { every: 'weeks', n: p.n || 1, start: p.start || (lenient ? o.day : fail('What day did one ' + p.name + ' land, the last one or the next one?')) });
        else fail(p.name + ': no such rhythm ' + p.every);
      }
      out.pays.push(x);
    });
    const first = out.pays.find(x => x.every !== 'none');
    if (first) first.startsPeriod = true;
    (ans.cards || []).forEach((c, i) => {
      once('cards', c.name);
      const x = { key: 'card' + (i + 1), name: c.name, owed: amt(c.owed, 'What is on ' + c.name + ' today?'), payDay: c.payDay,
        closeDay: c.closeDay == null ? 'not sure' : c.closeDay, payFrom: acct(c.payFrom, c.name + ' is paid from ' + c.payFrom + ', which is not one of your accounts'), shift: c.shift || 'after' };
      out.cards.push(x);
    });
    (ans.bills || []).forEach((b, i) => {
      once('bills', b.name);
      const x = { key: 'bill' + (i + 1), name: b.name, from: acct(b.from, b.name + ' leaves from ' + b.from + ', which is not one of your accounts'),
        amount: amt(b.amount, 'How much is ' + b.name + '?'), shift: 'after' };
      if (b.every === 'year') x.every = 'year', x.date = String(b.month).padStart(2, '0') + '-' + String(b.day).padStart(2, '0');
      else x.day = b.day;
      out.bills.push(x);
    });
    out.free = ans.free != null ? amt(ans.free, 'How much for food and everyday things?') : null;
    if (lenient) return out;
    /* the answers to what this day asks: a bill not out yet, a card's statement ("not sure" is all owed, as setup3) */
    const q = questions(ans, o);
    (ans.bills || []).forEach((b, i) => { if (q.asked[keyOf('bills', b.name)] && b.out && b.out.out === false) out.bills[i].takenOut = false; });
    (ans.cards || []).forEach((c, i) => {
      if (!q.statements[keyOf('cards', c.name)]) return;
      const s = c.statement && c.statement.a;
      out.cards[i].statement = Number.isInteger(s) ? s : out.cards[i].owed;
    });
    return out;
  }

  /* what the day asks: build_book's own `asked` and `askedStatements` on a draft book, and a pay landing that day */
  function questions(ans, o) {
    const input = toBuild(ans, { day: o.day, told: o.day + 'T00:00:00.000Z', currency: o.currency }, true);
    const r = B.buildBook(input, { newId: IDS.idMaker('draft0') });
    const asked = {}, statements = {};
    input.bills.forEach((b, i) => { if (r.asked[b.key]) asked[keyOf('bills', ans.bills[i].name)] = r.asked[b.key]; });
    input.cards.forEach((c, i) => { if (r.askedStatements[c.key]) statements[keyOf('cards', ans.cards[i].name)] = r.askedStatements[c.key]; });
    return { asked, statements, payToday: payToday(r, input, o.day).length > 0 };
  }
  /* the fixed pays landing on the setup day: [{ bank key, occurrence id }] */
  function payToday(r, input, day) {
    const cal = S.calendar(input.country), d0 = D.dayNum(day), out = [];
    input.pays.forEach(p => {
      if (p.every === 'none') return;
      const sch = r.book.schedules.find(x => x.id === r.ids[p.key]);
      for (const occ of S.occurrences(sch, cal, d0 - 7, d0 + 7)) if (occ.land === d0) out.push({ bank: p.bank, id: occ.id });
    });
    return out;
  }

  function build(ans, o) {
    const input = toBuild(ans, o);
    const r = B.buildBook(input, { newId: o.newId });
    /* [BV2.13] a pay landing today that is not in today's figure yet stays to come: named in the opening check */
    for (const p of payToday(r, input, o.day)) {
      const b = (ans.banks || [])[input.banks.findIndex(x => x.key === p.bank)];
      if (!b || !b.payToday || b.payToday.landed !== false) continue;
      const acct = r.ids[p.bank], check = r.book.events.find(e => e.k === 'check' && e.acct === acct);
      check.notYet = (check.notYet || []).concat([p.id]);
    }
    return r;
  }

  /* what a fill on that day still needs, in the words the chat asks it */
  function need(ans, o) {
    const out = [], day = o.day;
    /* [AI_JOIN_FIXES C; M2, M7, M42] a whole answer: the country, the currency (its own answer), a pay or "no fixed pay",
       and everyday money and the minimum each answered or skipped in words (null), never left unasked (undefined) */
    const late = [];
    if (!ans.country) out.push('Which country do you bank in?');
    if (!ans.currency) out.push('Which currency? Yen, pesos, dollars or euros');
    if (!(ans.pays || []).length) late.push('How are you paid? A day each month, every week or two, or no fixed pay');
    if (ans.free === undefined) late.push('How much for food and everyday stuff each pay period? Or skip it');
    if (ans.min === undefined) late.push('Keep at least how much in your bank? Or no minimum');
    if (!(ans.banks || []).length) return out.concat(['Which bank does your pay go into?'], late);
    for (const b of ans.banks) if (!Number.isInteger(b.amount) || b.on !== day) out.push('What does ' + b.name + ' show today?');
    for (const c of ans.cards || []) if (!Number.isInteger(c.owed) || c.on !== day) out.push('What is on ' + c.name + ' today?');
    out.push(...late);
    let q;
    try { q = questions(ans, o); } catch (e) { return out.concat([e.message]); }
    for (const b of ans.bills || []) {
      const days = q.asked[keyOf('bills', b.name)];
      if (!days) continue;
      if (!b.out || typeof b.out.out !== 'boolean' || JSON.stringify(b.out.days) !== JSON.stringify(days)) {
        out.push('Has ' + b.name + ', due ' + days.map(day1).join(' and ') + ', come out of ' + (b.from || ans.banks[0].name) + ' already?');
      }
    }
    for (const c of ans.cards || []) {
      const g = q.statements[keyOf('cards', c.name)];
      if (!g) continue;
      const s = c.statement;
      if (!s || !(Number.isInteger(s.a) || s.a === 'not sure') || s.closed !== g.closed) out.push('How much of ' + c.name + ' was on the statement that closed on ' + day1(g.closed) + '?');
    }
    if (q.payToday) {
      const input = toBuild(ans, { day, told: day + 'T00:00:00.000Z', currency: o.currency }, true);
      const r = B.buildBook(input, { newId: IDS.idMaker('draft0') });
      const seen = {};
      for (const p of payToday(r, input, day)) {
        if (seen[p.bank]) continue; seen[p.bank] = 1;
        const b = ans.banks[input.banks.findIndex(x => x.key === p.bank)];
        if (!b.payToday || typeof b.payToday.landed !== 'boolean' || b.payToday.day !== day) out.push("Has today's pay already landed in " + b.name + "'s figure?");
      }
    }
    try { toBuild(ans, { day, told: day + 'T00:00:00.000Z', currency: o.currency }); } catch (e) { if (!out.includes(e.message)) out.push(e.message); }
    return out;
  }

  /* ---- setup3's form ---- */
  const acctKey = (ans, name) => { if (name == null || name === '') return 'bank1'; const i = (ans.banks || []).findIndex(b => keyOf('banks', b.name) === keyOf('banks', name)); return i <= 0 ? 'bank1' : 'acct' + (i + 1); };
  const formEvery = p => (p.every === 'weeks' ? 'weeks' + (p.n || 1) : p.every || 'month');
  function toForm(ans, o) {
    /* [AI_JOIN_FIXES F] a figure is today's only when it was given today: one from another day leaves its box empty, so
       the screens ask for it again and fromForm never stamps yesterday's figure with today (M36, M37) */
    const day = (o && o.day) || null, today = x => (x && x.on === day && day ? x : null);
    const b0 = ans.banks[0], pays = ans.pays || [], p0 = pays[0] || { name: '', amount: null, every: 'month', day: 25 };
    const pt = (ans.banks.find(b => b.payToday && b.payToday.day === day) || {}).payToday;
    const payOf = p => ({ name: p.name, amount: p.amount == null ? null : p.amount, every: formEvery(p), day: p.day != null ? p.day : null,
      day2: p.day2 != null ? p.day2 : null, start: p.start || null, acct: acctKey(ans, p.bank) });
    return {
      bankName: b0.name, bank: today(b0) ? b0.amount : null, cur: ans.currency || CUR_OF[ans.country] || 'JPY', country: ans.country || 'XX',
      payToday: pt ? (pt.landed ? 'yes' : 'no') : null,
      accts: ans.banks.slice(1).map(b => ({ name: b.name, amount: today(b) ? b.amount : null, type: b.type || 'bank' })),
      pay: Object.assign(payOf(p0), { shift: p0.every === 'none' ? 'before' : p0.shift || 'before' }),
      pays: pays.slice(1).map(payOf),
      cards: (ans.cards || []).map(c => ({ name: c.name, owed: today(c) ? c.owed : null, payDay: c.payDay, closeDay: c.closeDay == null ? 'not sure' : c.closeDay,
        payFrom: acctKey(ans, c.payFrom), shift: c.shift || 'after', statement: c.statement && Number.isInteger(c.statement.a) ? c.statement.a : null })),
      bills: (ans.bills || []).map(b => ({ name: b.name, amount: b.amount, every: b.every === 'year' ? 'year' : 'month',
        month: b.every === 'year' ? String(b.month).padStart(2, '0') : null, day: b.day, from: acctKey(ans, b.from), takenOut: b.out && b.out.out === false ? 'no' : 'yes' })),
      free: ans.free == null ? null : ans.free, min: ans.min == null ? null : ans.min,
    };
  }
  function fromForm(f, o) {
    const day = o.day;
    const banks = [{ name: f.bankName || 'Main bank', amount: f.bank, on: day }].concat((f.accts || []).map(a => ({ name: a.name, amount: a.amount, type: a.type || 'bank', on: day })));
    const nameOf = key => { if (!key || key === 'bank1') return banks[0].name; const i = Number(String(key).replace('acct', '')) - 1; return (banks[i] || banks[0]).name; };
    const rhythm = (p, base) => {
      const ev = p.every === 'same' ? base.every : p.every, src = p.every === 'same' ? base : p;
      if (ev === 'month') return { every: 'month', day: src.day };
      if (ev === 'days') return { every: 'days', day: src.day, day2: src.day2 };
      if (ev === 'none') return { every: 'none' };
      /* [qc-foundation WATCH] a blank day of one pay is asked for, never turned into today (as setup3) */
      return { every: 'weeks', n: Number(String(ev).slice(5)), start: src.start || fail('Type the day of one pay, the last one or the next one') };
    };
    const p0 = f.pay;
    const pays = [Object.assign({ name: p0.name || 'Pay', amount: p0.amount }, rhythm(p0, p0), p0.every === 'none' ? {} : { shift: p0.shift || 'before' }, p0.acct && p0.acct !== 'bank1' ? { bank: nameOf(p0.acct) } : {})]
      .concat((f.pays || []).map((p, i) => { const r = rhythm(p, p0); return Object.assign({ name: p.name || (i ? 'Income ' + (i + 2) : 'Second income'), amount: p.amount }, r, r.every === 'none' ? {} : { shift: p0.shift || 'before' }, p.acct && p.acct !== 'bank1' ? { bank: nameOf(p.acct) } : {}); }));
    const ans = { country: f.country, currency: f.cur, banks, pays,
      cards: (f.cards || []).map(c => Object.assign({ name: c.name || 'Card', owed: c.owed, on: day, payDay: c.payDay, closeDay: c.closeDay, shift: c.shift || 'after' }, c.payFrom && c.payFrom !== 'bank1' ? { payFrom: nameOf(c.payFrom) } : {})),
      bills: (f.bills || []).map(b => Object.assign({ name: b.name || 'Bill', amount: b.amount, day: b.day }, b.every === 'year' ? { every: 'year', month: Number(b.month) } : {}, b.from && b.from !== 'bank1' ? { from: nameOf(b.from) } : {})),
      free: f.free == null ? null : f.free, min: f.min == null ? null : f.min };
    /* the answers to the day's questions, with the days they answer */
    const q = questions(ans, { day });
    ans.bills.forEach((b, i) => { const days = q.asked[keyOf('bills', b.name)]; if (days) b.out = { out: f.bills[i].takenOut !== 'no', days }; });
    ans.cards.forEach((c, i) => { const g = q.statements[keyOf('cards', c.name)]; if (g) c.statement = { a: f.cards[i].statement == null ? 'not sure' : f.cards[i].statement, closed: g.closed }; });
    /* [qc-foundation WATCH] the answer goes on every bank a pay lands in today */
    if (q.payToday && f.payToday) {
      const input = toBuild(ans, { day, told: day + 'T00:00:00.000Z' }, true), r = B.buildBook(input, { newId: IDS.idMaker('draft0') });
      for (const p of payToday(r, input, day)) banks[input.banks.findIndex(x => x.key === p.bank)].payToday = { landed: f.payToday === 'yes', day };
    }
    return ans;
  }

  const api = { keyOf, toBuild: (a, o) => toBuild(a, o, false), build, questions, need, toForm, fromForm, CUR_OF };
  if (node) module.exports = api;
  else root.ANSWERS3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
