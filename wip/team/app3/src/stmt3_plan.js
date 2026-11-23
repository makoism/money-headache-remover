/* Statements, the writing half (SCHEMA_V3 0 "An import line", 3 "A card statement", 6.1, 6.4; DECISIONS_ROUND2 A6, H1,
   H3, O1, Q1, S2, AP3, AS4, BC4). Pure: no page, no network; it never changes the book it is given.
   plan(book, reads, opts) says, for every line read, what it is and what it meets, by the frozen matching rules
   (engine/match.js) against the book: a repeat of a line already kept (dropped), a typed record it replaces, a side of a
   two-sided record it attaches to, an expected item it settles, or a new line. records(plan, opts) turns the plan into
   the records to add: one `imp:<account>:<line id>` event per line kept, with its buy date (`date`) and, when the
   statement printed one, its posting date beside it (`posted`), and on a card statement the statement itself (a `check`
   with `stmt: true` and the owed figure on its close day, as the opening writes them [J5]).
   Nothing is removed from the book here. A typed record a line replaces stays as it is: the look ahead replaces it each
   time it runs (lookahead.js, the same rules), so a check-in's ticked settle is never lost. What the line takes from it
   is written on the line now: its `settles`, its `told` [O1] and its budget line or place [BC4].
   Amounts are whole minor units (engine/units.js minorOf); the old reader's rows are in money units. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? { ids: require('../../engine/ids.js'), units: require('../../engine/units.js'), match: require('../../engine/match.js'),
    lookahead: require('../../engine/lookahead.js'), schedules: require('../../engine/schedules.js') } : root.BurrowEngine;
  const dep = { cats: typeof STMT_CATS !== 'undefined' ? STMT_CATS : null, numbers: root.stmtNumbers };   // eslint-disable-line no-undef
  function use(d) { dep.cats = d.STMT_CATS; dep.numbers = d.stmtNumbers; }
  const TWO = { transfer: 1, repay: 1, borrow: 1, convert: 1 };

  /* [AP3] a statement reference: every character but letters, digits and -._~ as %XX */
  const refPart = s => String(s).replace(/[^A-Za-z0-9\-._~]/g, c => [...new TextEncoder().encode(c)].map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join(''));

  const liveAccts = book => (book.accounts || []).filter(a => a && !a.gone && !a.closed);
  const isCard = a => !!a && a.type === 'card';
  /* a line's category: the person's or the one the book remembers for the shop (opts.cats), else the reader's, else other */
  const catOf = (cats, row) => { const c = cats[row.k] || row.cat; return dep.cats.includes(c) ? c : row.dir === 'in' ? 'other_income' : 'other'; };

  /* the items the book expects (pay, bills, card payments), from the look ahead on the day: those still to confirm and
     those not seen yet, each with its account and direction */
  function expectedOf(book, today) {
    const r = E.lookahead.lookahead(book, today), out = {}, sched = {};
    for (const s of book.schedules || []) if (s && !s.gone) sched[s.id] = s;
    const dirOf = item => { const o = E.ids.occurrence(item); const s = o && sched[o.schedule]; return s && s.kind === 'income' ? 'in' : 'out'; };
    for (const o of (r.checkIn && r.checkIn.toConfirm) || []) out[o.item] = { item: o.item, a: o.amount, acct: o.account, lands: o.lands, dir: dirOf(o.item) };
    for (const o of (r.notSeenYet && r.notSeenYet.items) || []) if (!out[o.item]) out[o.item] = { item: o.item, a: o.amount, acct: o.account, lands: o.lands, dir: o.direction || dirOf(o.item) };
    return Object.values(out);
  }
  /* what the book already holds, as lines the rules read */
  const occNames = s => (s || []).map(x => (typeof x === 'string' ? x : x.s + '@' + x.due));
  function bookLines(book) {
    const out = [];
    for (const e of book.events || []) {
      if (!e || e.gone || !['spend', 'in', 'transfer', 'repay', 'borrow', 'convert'].includes(e.k)) continue;
      const src = e.src && e.src.type ? e.src.type : 'typed';
      const l = { id: e.id, a: e.a, date: e.date, src, told: e.told, settles: occNames(e.settles) };
      if (e.posted) l.posted = e.posted;
      if (e.est) l.est = true;
      if (e.src && e.src.file != null) { l.file = e.src.file; l.line = e.src.line; }
      if (TWO[e.k]) Object.assign(l, { k: e.k, acct: e.acct, acct2: e.acct2, a2: e.a2 });
      else Object.assign(l, { acct: src === 'typed' || src === 'move' ? e.acct : (e.src.acct || e.acct), dir: e.k === 'spend' ? 'out' : 'in' });
      if (src === 'statement' && TWO[e.k] && e.src.acct === e.acct2) { delete l.acct2; Object.assign(l, { acct: e.acct2, dir: 'in' }); }   // a card-side line, as read
      out.push(l);
    }
    return out;
  }

  /* one read into its lines: the line id, the kind of record, the account money leaves and the one it reaches */
  const MS = 86400000;
  const dayNum = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / MS); };
  const flat = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  /* the card a bank's card payment line pays (MAIN 15). With close days "not sure" each card's item asks everything owed,
     so the amount rarely tells. In order: the person's choice for this line, the card they chose before for this shop,
     the only card, the card named in the line's words, the card whose payment day is nearest (within 5 days, one card
     nearer than the rest), the one card expecting this amount. Otherwise { cards } and the review asks: nothing is guessed. */
  function cardOfLine(cards, acct, l, o, expected) {
    if (o.cardFor && o.cardFor[l.id] && cards.some(c => c.id === o.cardFor[l.id])) return { to: o.cardFor[l.id], chosen: true };
    if (o.cardOf && o.cardOf[l.key] && cards.some(c => c.id === o.cardOf[l.key])) return { to: o.cardOf[l.key] };
    if (cards.length === 1) return { to: cards[0].id };
    const t = flat(l.text), named = cards.filter(c => flat(c.name) && t.includes(flat(c.name)));
    if (named.length === 1) return { to: named[0].id };
    const pool = named.length ? named : cards;
    const items = c => expected.filter(x => x.acct === acct.id && E.ids.scheduleOf(x.item) === c.id);
    const near = pool.map(c => ({ c, g: Math.min(Infinity, ...items(c).map(x => Math.abs(dayNum(x.lands) - dayNum(l.date)))) })).filter(x => x.g <= 5).sort((x, y) => x.g - y.g);
    if (near.length === 1 || (near.length > 1 && near[0].g < near[1].g)) return { to: near[0].c.id };
    const amt = pool.filter(c => items(c).some(x => x.a === l.a));
    if (amt.length === 1) return { to: amt[0].id };
    return { cards: pool.map(c => c.id) };
  }
  /* [BJ4] a line moving money out to another of the person's own accounts (not a card). In order: the person's answer
     for this line, their answer before for this shop, the one own account named in the line's words (a word of its
     name other than the plain ones; only on a line the reader filed as money sent, cash or other). A line filed as money
     sent that names none: { accts } and the review asks "Is this a move to one of your accounts?". 'no' is a spend. */
  const OWN_TYPES = { bank: 1, cash: 1, ewallet: 1, wallet: 1, investment: 1 };
  const PLAIN = new Set(['account', 'acct', 'bank', 'main', 'my', 'the', 'to', 'of', 'and', 'for', 'from']);
  const words = s => String(s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  function moveOfLine(own, l, o) {
    const known = id => id === 'no' || own.some(a => a.id === id);
    if (o.moveFor && o.moveFor[l.id] && known(o.moveFor[l.id])) return { to: o.moveFor[l.id], chosen: true };
    if (o.moveOf && o.moveOf[l.key] && known(o.moveOf[l.key])) return { to: o.moveOf[l.key] };
    if (!['transfer_out', 'cash', 'other'].includes(l.cat)) return {};
    const tw = new Set(words(l.text));
    const named = own.filter(a => words(a.name).some(w => w.length >= 3 && !PLAIN.has(w) && tw.has(w)));
    if (named.length === 1) return { to: named[0].id };
    if (l.cat === 'transfer_out' && own.length) return { accts: (named.length ? named : own).map(a => a.id) };
    return {};
  }
  function linesOf(book, read, acct, cats, o, expected) {
    const cur = acct.cur, seen = {}, cards = liveAccts(book).filter(a => isCard(a) && a.payFrom === acct.id);
    return read.rows.map((r, i) => {
      const a = E.units.minorOf(r.a, cur), cat = catOf(cats, r);
      const k3 = [r.d, a, r.dir].join(':');
      seen[k3] = (seen[k3] || 0) + 1;
      const id = 'imp:' + acct.id + ':' + (r.ref ? 'ref:' + refPart(r.ref) : k3 + ':' + seen[k3]);
      const l = { id, acct: acct.id, dir: r.dir, a, date: r.d, file: read.file, line: i, text: r.t, key: r.k, cat, k: r.dir === 'out' ? 'spend' : 'in' };
      if (r.posted) l.posted = r.posted;
      if (r.bal != null) l.bal = E.units.minorOf(r.bal, cur);
      if (isCard(acct) && r.dir === 'in') {
        if (cat === 'card_payment' || cat === 'transfer_in') Object.assign(l, { k: 'repay', from: acct.payFrom || null, to: acct.id, side: 2 });
        else l.sub = 'refund';
      } else if (!isCard(acct) && r.dir === 'out' && cat === 'card_payment' && cards.length) {
        const c = cardOfLine(cards, acct, l, o, expected);
        if (c.to) Object.assign(l, { k: 'repay', from: acct.id, to: c.to, side: 1, acct2: c.to }, c.chosen ? { chosen: true } : {});
        else Object.assign(l, { k: 'repay', from: acct.id, to: null, side: 1, status: 'pick', cards: c.cards });
      } else if (!isCard(acct) && r.dir === 'out') {
        const own = liveAccts(book).filter(x => x.id !== acct.id && OWN_TYPES[x.type]);
        const m = moveOfLine(own, l, o);
        if (m.to && m.to !== 'no') Object.assign(l, { k: 'transfer', from: acct.id, to: m.to, side: 1, acct2: m.to }, m.chosen ? { chosen: true } : {});
        else if (m.to === 'no' && m.chosen) l.chosenNo = true;
        else if (m.accts) Object.assign(l, { status: 'askmove', accts: m.accts });
      }
      return l;
    });
  }

  /* plan(book, reads, { today, assign: [account id per read], cats: { key: category }, cardFor: { line id: card id } }) */
  function plan(book, reads, opts) {
    const o = opts || {}, today = o.today, cats = o.cats || {};
    const accts = {}; for (const a of liveAccts(book)) accts[a.id] = a;
    const expected = expectedOf(book, today);
    const order = reads.map((r, i) => ({ r, i, acct: accts[(o.assign || [])[i]] })).filter(x => x.acct);
    order.sort((x, y) => Number(isCard(x.acct)) - Number(isCard(y.acct)) || x.i - y.i);   // banks first: a card's payment line then meets the bank's
    const country = (book.home && book.home.country && book.home.country.v) || 'JP';
    const years = new Set(); for (const x of order) for (const r of x.r.rows) years.add(+r.d.slice(0, 4));
    const holidays = [].concat(...[...years].map(y => E.schedules.holidays(country, y)));
    const ctxAccts = {}; for (const a of Object.values(accts)) ctxAccts[a.id] = { kind: isCard(a) ? 'card' : 'bank', postingDays: a.postingDays };
    const schedules = {}; for (const s of book.schedules || []) if (s && !s.gone) schedules[s.id] = { vary: s.vary || 0 };
    // ids already kept: live, or gone because another record holds the same money (a payment read from both sides).
    // A line the person took back (Undo) is offered again, and put back when kept.
    const kept0 = {}; for (const e of book.events || []) if (e) kept0[e.id] = e;
    const have = new Set(Object.values(kept0).filter(e => !e.gone || (e.goneBy && kept0[e.goneBy])).map(e => e.id));
    const byRead = order.map(x => ({ read: x.r, acct: x.acct, idx: x.i, lines: linesOf(book, x.r, x.acct, cats, o, expected) }));
    const all = [].concat(...byRead.map(g => g.lines));
    // a line whose id is already kept is a repeat; within this batch, the first of two equal ids is kept (two files of one account)
    const first = {}; for (const l of all) { if (have.has(l.id)) l.status = 'repeat'; else if (first[l.id]) l.status = 'repeat'; else first[l.id] = l; }
    const imports = byRead.map((g, n) => ({ id: 'batch:' + n, acct: g.acct.id, src: 'statement', file: g.read.file, from: g.read.from, to: g.read.to,
      lines: g.lines.filter(l => !l.status).map(l => {
        const m = { id: l.id, acct: l.acct, dir: l.dir, a: l.a, date: l.date, line: l.line };
        if (l.posted) m.posted = l.posted;
        if (l.side === 1) m.acct2 = l.to;   // a bank's card payment is itself a two-sided record a card's line may meet [Q1]
        return m;
      }) }));
    const book0 = bookLines(book);
    const res = E.match.applyImports({ accounts: ctxAccts, holidays, schedules, lines: book0,
      expected: expected.map(x => { const oc = E.ids.occurrence(x.item); return { s: oc.schedule, due: oc.due, a: x.a, acct: x.acct, dir: x.dir, lands: x.lands }; }), imports });
    const out = {}; for (const l of res.lines) out[l.id] = l;
    const dropped = new Set(res.dropped);
    const replaced = {}; for (const l of res.lines) if (l.gone && l.goneBy && have.has(l.id)) replaced[l.goneBy] = l.id;
    const kept = {}; for (const e of book.events || []) if (e && !e.gone) kept[e.id] = e;
    const incoming = new Set(all.map(l => l.id));
    for (const l of all) {
      if (l.status) continue;
      const r = out[l.id];
      if (dropped.has(l.id)) { l.status = 'repeat'; continue; }
      if (res.met[l.id] && l.k === 'spend' && kept[res.met[l.id]] && kept[res.met[l.id]].k === 'transfer' && kept[res.met[l.id]].acct === l.acct) {
        Object.assign(l, { k: 'transfer', from: l.acct, to: kept[res.met[l.id]].acct2, side: 1 });   // [BJ4] it met a typed move: it is that move, never a spend
      }
      if (res.met[l.id]) { l.status = 'meets'; l.meets = res.met[l.id]; l.metImport = incoming.has(l.meets) || !!(kept[l.meets] && kept[l.meets].src && kept[l.meets].src.type === 'statement'); continue; }
      if (!r) { l.status = 'repeat'; continue; }
      if (r.gone) { l.status = 'repeat'; l.heldBy = r.goneBy; continue; }
      l.settles = r.settles.slice();
      if (replaced[l.id]) { l.status = 'typed'; l.typed = replaced[l.id]; }
      else l.status = l.settles.length ? 'settles' : 'new';
    }
    // [MAIN 15] a card payment line that settled nothing settles its card's nearest unsettled item (within 10 days):
    // the item asks everything owed, so the amount is not the test; the card's own statements take what was paid.
    const taken = new Set([].concat(...res.lines.filter(x => !x.gone).map(x => x.settles || [])));
    for (const l of all) {
      if (l.status !== 'new' || l.k !== 'repay' || l.side !== 1 || !l.to) continue;
      const best = expected.filter(x => E.ids.scheduleOf(x.item) === l.to && x.acct === l.from && !taken.has(x.item))
        .map(x => ({ x, g: Math.abs(dayNum(x.lands) - dayNum(l.date)) })).filter(y => y.g <= 10).sort((p1, p2) => p1.g - p2.g || (p1.x.lands < p2.x.lands ? -1 : 1))[0];
      if (best) { l.settles = [best.x.item]; l.status = 'settles'; taken.add(best.x.item); }
    }
    const statements = [];
    for (const g of byRead) {
      const st = g.read.statement;
      if (!st || !isCard(g.acct)) continue;
      const a = E.units.minorOf(st.total, g.acct.cur), id = 'imp:' + g.acct.id + ':ref:stmt-' + st.close;
      statements.push({ acct: g.acct.id, close: st.close, due: st.due, a, file: g.read.file, from: g.read.from, to: g.read.to, id, repeat: have.has(id) });
    }
    // per merchant: the lines behind it and their totals in and out (the review's "tap a merchant for its rows")
    const merchants = {};
    for (const l of all) {
      const m = merchants[l.key] || (merchants[l.key] = { key: l.key, name: l.text, cat: l.cat, rows: [], cur: accts[l.acct].cur, inA: 0, outA: 0 });
      m.rows.push(l.id);
      if (l.dir === 'in') m.inA += l.a; else m.outA += l.a;
    }
    const count = s => all.filter(l => l.status === s).length;
    return { today, lines: all, statements, merchants: Object.values(merchants).sort((x, y) => (y.inA + y.outA) - (x.inA + x.outA)),
      counts: { read: all.length, repeat: count('repeat'), typed: count('typed'), settles: count('settles'), meets: count('meets'), new: count('new'), pick: count('pick'), askmove: count('askmove') },
      reads: byRead.map(g => ({ idx: g.idx, file: g.read.file, acct: g.acct.id, from: g.read.from, to: g.read.to, rows: g.lines.length, notes: g.read.notes || [] })) };
  }

  /* the records to add for a plan. opts: { told, grp, skip: { line id: true }, keepStatements (default true) } */
  function records(book, p, opts) {
    const o = opts || {}, skip = o.skip || {};
    const kept = {}; for (const e of book.events || []) if (e && !e.gone) kept[e.id] = e;
    const events = [], settled = [];
    for (const l of p.lines) {
      if (l.status === 'repeat' || l.status === 'pick' || l.status === 'askmove' || skip[l.id]) continue;
      const src = { type: 'statement', file: l.file, line: l.line, acct: l.acct };
      const read = p.reads.find(r => r.file === l.file && r.acct === l.acct);
      if (read && read.from) { src.from = read.from; src.to = read.to; }
      if (l.bal != null) src.bal = l.bal;
      const e = { id: l.id, k: l.k, date: l.date, a: l.a, note: l.text, src, told: o.told, at: o.told, grp: o.grp };
      if (TWO[l.k]) {
        e.acct = l.from; e.acct2 = l.to;
        if (l.posted) e[l.side === 1 ? 'posted' : 'posted2'] = l.posted;
      } else {
        e.acct = l.acct;
        if (l.posted) e.posted = l.posted;
        if (l.sub) e.sub = l.sub;
      }
      if (l.settles && l.settles.length) e.settles = l.settles.map(n => { const oc = E.ids.occurrence(n); return { s: oc.schedule, due: oc.due }; });
      const t = l.typed && kept[l.typed];
      if (t) {
        if (t.told) e.told = t.told;                          // [O1] it keeps the typed record's told
        if (!e.line && t.line) e.line = t.line;               // [BC4] and its budget line, so a coffee typed on Food stays on Food
        if (!e.place && t.place) e.place = t.place;
      }
      if (l.status === 'meets' && l.metImport) { e.gone = o.told ? o.told.slice(0, 10) : l.date; e.goneBy = l.meets; }   // the same payment, already read from the other side
      events.push(e);
      // A card payment read from the bank settles the card's payment item. The look ahead works a statement line's settle
      // out again only for money in and spends, so the review, where the person saw "pays Card A", is the tick [S2, U2]:
      // the check-in record below names it in `settled`, and the settle stays.
      if (e.k === 'repay' && e.settles && !e.gone) settled.push(e.id);
    }
    if (o.keepStatements !== false) for (const s of p.statements) {
      if (s.repeat || skip[s.id]) continue;
      const told = s.close + 'T24:00';   // as the opening's checks: the figure covers its whole close day [X9]
      const grp = 'stmt:' + s.acct + ':' + s.close;
      events.push({ id: s.id, k: 'check', acct: s.acct, date: s.close, a: s.a, typedA: s.a, stmt: true, stmtDate: s.close, stmtPay: s.due || undefined, note: 'the statement ' + s.file, told, at: o.told, grp });
      events.push({ id: 'imp:' + s.acct + ':ref:owed-' + s.close, k: 'check', acct: s.acct, date: s.close, a: s.a, typedA: s.a, note: 'owed on the statement ' + s.file, told, at: o.told, grp });
    }
    for (const e of events) for (const k of Object.keys(e)) if (e[k] === undefined) delete e[k];
    const checkins = settled.length ? [Object.assign(o.newId ? { id: o.newId() } : {}, { date: p.today, told: o.told, at: o.told, figures: [], settled, from: 'statements' })] : [];
    return { events, checkins };
  }

  /* [BC4 cats] the categories to remember, by shop: { 'k:<key>': { v, src, at } } (SCHEMA_V3 2.1 imports.cats) */
  function catsToKeep(p, changed, at) {
    const out = {};
    for (const m of p.merchants) {
      out['k:' + m.key] = { v: m.cat, src: changed && changed[m.key] ? 'person' : 'reader', at };
      const ch = p.lines.find(l => l.key === m.key && l.chosen);   // the card the person chose for this shop's payments
      if (ch && ch.k === 'repay') out['k:' + m.key].card = ch.to;
      if (ch && ch.k === 'transfer') out['k:' + m.key].move = ch.to;   // [BJ4] the account they said it moves to
      if (p.lines.some(l => l.key === m.key && l.chosenNo)) out['k:' + m.key].move = 'no';
    }
    return out;
  }
  /* [BJ4] the person's answers before, by shop key: the account a shop's lines move to, or 'no' */
  function knownMoves(book) {
    const c = (book.imports && book.imports.cats) || {}, out = {};
    for (const k of Object.keys(c)) if (c[k] && !c[k].gone && c[k].move && k.startsWith('k:')) out[k.slice(2)] = c[k].move;
    return out;
  }
  /* the cards the person chose before, by shop key */
  function knownCards(book) {
    const c = (book.imports && book.imports.cats) || {}, out = {};
    for (const k of Object.keys(c)) if (c[k] && !c[k].gone && c[k].card && k.startsWith('k:')) out[k.slice(2)] = c[k].card;
    return out;
  }
  /* the categories the book already knows, by merchant key */
  function knownCats(book) {
    const c = (book.imports && book.imports.cats) || {}, out = {};
    for (const k of Object.keys(c)) if (c[k] && !c[k].gone && k.startsWith('k:')) out[k.slice(2)] = c[k].v;
    return out;
  }

  /* for setup3 ("Start from statements"): what the reads say, in minor units, through the old reader's own sums.
     { bank: { a, date } | null, pay: { a, how } | null, bills: { rent: a, ... }, cards: a | null } */
  function setupHints(reads, cats, cur, today) {
    const d = dep.numbers(reads, k => cats[k], today), m = x => E.units.minorOf(x, cur);
    const bills = {}; for (const k of Object.keys(d.bills)) bills[k] = m(d.bills[k]);
    return { bank: d.balance !== null ? { a: m(d.balance), date: d.balanceDate } : null, pay: d.pay !== null ? { a: m(d.pay), how: d.how } : null, bills, cards: d.card !== null ? m(d.card) : null };
  }

  const api = { plan, records, catsToKeep, knownCats, knownCards, knownMoves, setupHints, expectedOf, use };
  if (node) module.exports = api;
  else root.STMT3P = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
