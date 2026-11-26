/* ---------- act3: the one door for every write in app3 (SCHEMA_V3 section 0; DECISIONS_ROUND2 H6, D2, BD4) ----------
   Every change a person makes goes through here as one named step: one save, one redraw, one Undo. Nothing here works
   out money; it writes what the person typed into records and checks them before they are kept.

   API (BurrowAct3 in a page, module.exports in node; the page's instance is ACT3, made in receipts3.js):
     const A = BurrowAct3.make({ book: () => book, put: async newBook => saved?, told: () => iso, newId: () => id,
                                 today: () => 'YYYY-MM-DD', queue: <screens/messages queue>, check: book => throws? })
     A.logSpend({ date, a, acct, line | place, note })      a spend; `line: 'free'` (or none) is Free to spend
     A.refund({ date, a, acct, line, note })                money back: `in` with sub 'refund'; `line` gives it back
     A.moveMoney({ date, a, from, to, note })              money between two of your own accounts (`transfer`)
     A.moneyIn({ date, a, acct, note })                    money in that is not a pay or a refund (a client payment, a
                                                           gift): `in` with no `sub`, into one of your own accounts [slice 6]
     A.edit(id, { date, a, acct, acct2, line, place, note }) changes a record in place (null takes a field away)
     A.remove(id)                                          marks it gone, never deletes
     A.addRecords(label, { events, checkins })             records another writer built (a check-in), as one step
     A.run(label, w => { w.add(list, rec); w.edit(list, id, fields); w.remove(list, id) }, opts)   any other step;
         lists: events, checkins, accounts, schedules, places, people, budgets (plan.budgets), shares (plan.shares)
     Each returns a promise of { ok, step, book } or { ok: false, why: 'bad' | 'engine' | 'save' | 'later', text }.
     Every action takes a last argument { undo: 'words for the Undo bar', quiet: true (no bar) }.
     A.undo(stepId) takes back that step only and keeps every later change; it is refused ('later') when a later
       step changed the same record. A.dry(action, ...args) gives the book the action would make, without saving it
       (for "what this would leave"). A.steps() lists this visit's steps; A.onChange(fn) runs after each saved write.

   What each record gets [SCHEMA_V3 0]: a new id, `told` once when made (never changed by an edit or Undo), `at` from
   the hybrid clock on every write (store/clock.js), `by` the device part, and `grp` the step's id, so an Undo after a
   reload can still find what a step added. Remove and Undo set `gone: <day>` and `goneBy: <step id>` and move `at`;
   putting back clears both and moves `at` again [H6]. Every touched record moves `at`, so store/idb writes only those
   records (BD4). Before a step is kept, `check(book)` (the engine's look ahead) must not refuse it.
   Plain browser JavaScript. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const C = node ? require('../../store/clock.js') : root.BurrowClock;
  const PATHS = { events: ['events'], checkins: ['checkins'], accounts: ['accounts'], schedules: ['schedules'], places: ['places'],
    people: ['people'], budgets: ['plan', 'budgets'], shares: ['plan', 'shares'] };
  const HOME_FIELDS = { main: 1, country: 1 };   // [E5] the home field values a step may set (writer.setField)
  const SPEND_FROM = { bank: 1, cash: 1, ewallet: 1, wallet: 1, card: 1, paylater: 1 };   // where a spend can be paid from
  const OWN = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };                                 // money moved between these
  const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
  const clone = x => JSON.parse(JSON.stringify(x));
  const live = x => x && !x.gone;

  function listOf(book, name, make) {
    const p = PATHS[name];
    if (!p) throw new Error('act3: no list called ' + name);
    let o = book;
    for (const step of p.slice(0, -1)) { if (!o[step]) { if (!make) return []; o[step] = {}; } o = o[step]; }
    const k = p.slice(-1)[0];
    if (!Array.isArray(o[k])) { if (!make) return []; o[k] = []; }
    return o[k];
  }
  const findIn = (book, id) => { for (const n of Object.keys(PATHS)) { const r = listOf(book, n).find(x => x && x.id === id); if (r) return { list: n, rec: r }; } return null; };

  /* ---- checking what the person typed, in plain words (an error is { bad: words }) ---- */
  class Bad extends Error {}
  const bad = text => { throw new Bad(text); };
  function account(book, id, kinds, what) {
    const a = (book.accounts || []).find(x => live(x) && x.id === id);
    if (!a) bad('Pick the account ' + what);
    if (kinds && !kinds[a.type]) bad(a.name + ' can not be used for this. Pick another account');
    return a;
  }
  function checkEvent(book, e, today) {
    if (!Number.isInteger(e.a) || !(e.a > 0)) bad('Type an amount above zero');
    if (!DAY_RE.test(String(e.date || ''))) bad('Pick the day');
    if (e.date > today) bad('That day has not come yet. Pick today or a day before');
    if (e.k === 'transfer') {
      account(book, e.acct, OWN, 'the money left');
      account(book, e.acct2, OWN, 'the money went to');
      if (e.acct === e.acct2) bad('Pick two different accounts');
    } else if (e.k === 'in' && !e.sub) account(book, e.acct, OWN, 'the money came into');
    else account(book, e.acct, SPEND_FROM, e.k === 'in' ? 'the money came back to' : 'it was paid from');
    if (e.line != null && e.place != null) bad('Pick a line or a place, not both');
    if (e.line != null && e.line !== 'free' && !((book.plan || {}).budgets || []).some(l => live(l) && l.id === e.line)) bad('That line is not in your plan any more. Pick another');
    if (e.place != null && !(book.places || []).some(g => live(g) && g.id === e.place)) bad('That place is not there any more. Pick another');
    if (e.note != null && typeof e.note !== 'string') bad('A note is words');
  }

  /* ---- one step on a copy of the book: what it added, changed and removed ---- */
  /* [STALE_SHEET_PLAN, M61] what a caller saw: `seen` is id -> stamp (`at` and `by`) of every record when its sheet
     opened. An edit or a remove of a record whose stamp moved since is refused, and so is an add to a list whose newest
     entry is "the amount now" (REPLACES) when any entry of it is new or moved. Nothing is written. */
  const OTHER = 'Nothing was saved, because this changed somewhere else while it was open';
  const REPLACES = { shares: 1 };
  const sig = r => (r.at || '') + '|' + (r.by || '');
  const other = () => { const e = new Bad(OTHER); e.why = 'other'; return e; };
  function writer(book, s, seen) {
    const log = { added: [], edited: [], removed: [], revived: [], swapped: [] };
    const mine = new Set();   // records this step itself wrote: never refused by the note
    const fresh = (list, r) => { if (seen && !mine.has(r.id) && seen[r.id] !== sig(r)) throw other(); };
    const wholeList = list => { if (seen && REPLACES[list]) for (const r of listOf(book, list)) if (r && !mine.has(r.id) && seen[r.id] !== sig(r)) throw other(); };
    const stamp = r => { r.at = s.at; r.by = s.by; };
    return {
      log,
      add(list, rec) {
        if (!rec || typeof rec !== 'object') throw new Error('act3: add needs a record');
        const r = Object.assign({}, rec);
        if (!r.id) r.id = s.newId();
        wholeList(list); mine.add(r.id);
        if (!r.told) r.told = s.told;
        if (r.grp == null) r.grp = s.id;
        stamp(r);
        const had = findIn(book, r.id);
        /* a record a writer names by its meaning (a check-in's `set:<occ>`) that an Undo left gone: the new record takes
           its place, fresh (its own told, grp and fields), so one id is one record; the gone one is kept in the step so
           this step's Undo puts it back exactly as it was */
        if (had && had.list === list && had.rec.gone) {
          const before = clone(had.rec);
          for (const k of Object.keys(had.rec)) delete had.rec[k];
          Object.assign(had.rec, r);
          log.revived.push({ list, id: r.id, before });
          return r.id;
        }
        if (had) throw new Bad('That is there already. It may have been added somewhere else');
        listOf(book, list, true).push(r);
        log.added.push({ list, id: r.id });
        return r.id;
      },
      edit(list, id, fields) {
        const r = listOf(book, list).find(x => x && x.id === id);
        if (!r) throw new Bad('That is not there any more');
        if (r.gone) throw new Bad('That was removed. Undo the removal first');
        fresh(list, r); mine.add(id);
        const before = {};
        for (const k of Object.keys(fields)) {
          if (k === 'id' || k === 'told' || k === 'at' || k === 'by' || k === 'gone' || k === 'goneBy') throw new Error('act3: ' + k + ' is not edited');
          before[k] = k in r ? clone(r[k]) : undefined;
          if (fields[k] === null || fields[k] === undefined) delete r[k]; else r[k] = clone(fields[k]);
        }
        before.at = r.at; before.by = r.by;
        stamp(r);
        log.edited.push({ list, id, before });
        return r;
      },
      remove(list, id) {
        const r = listOf(book, list).find(x => x && x.id === id);
        if (!r) throw new Bad('That is not there any more');
        if (r.gone) return r;
        fresh(list, r); mine.add(id);
        const before = { at: r.at, by: r.by };
        r.gone = s.day; r.goneBy = s.id; stamp(r);
        log.removed.push({ list, id, before });
        return r;
      },
      /* [E5, M13, M42] a home field value (SCHEMA AL1 `{ v, at, by }`): Keep at least lives in home.main, the country in
         home.country. Only these two; the currency is never set this way (O6). Journaled as an edit of list 'home' */
      setField(key, value) {
        if (!HOME_FIELDS[key]) throw new Bad('That cannot be changed here');
        const home = book.home || (book.home = {}), r = home[key] && typeof home[key] === 'object' && 'v' in home[key] ? home[key] : (home[key] = { v: home[key] === undefined ? null : home[key] });
        const before = { v: clone(r.v === undefined ? null : r.v), at: r.at, by: r.by };
        if (JSON.stringify(before.v) === JSON.stringify(value)) return r;
        r.v = clone(value); stamp(r);
        log.edited.push({ list: 'home', id: key, before });
        return r;
      },
      /* Undo of a revived record: the gone record it replaced comes back whole, with a new `at` (BD4) */
      putBack(list, id, before) {
        const r = listOf(book, list).find(x => x && x.id === id);
        if (!r) throw new Bad('That is not there any more');
        const now = clone(r);
        for (const k of Object.keys(r)) delete r[k];
        Object.assign(r, clone(before)); stamp(r);
        log.edited.push({ list, id, before: { at: now.at, by: now.by } });
        return r;
      },
      restore(list, id) {   // put back a removed record [H6]: both marks cleared, `at` moved
        const r = listOf(book, list).find(x => x && x.id === id);
        if (!r || !r.gone) return r;
        const before = { gone: r.gone, goneBy: r.goneBy, at: r.at, by: r.by };
        delete r.gone; delete r.goneBy; stamp(r);
        log.edited.push({ list, id, before });
        return r;
      },
      /* [WHICH_DOOR_PLAN] one item the cloud copy names as engine/sync.js names it, set whole: `where` the dotted path of
         its holder ('' the book), `of` a record id in a list of records or `where.key` for a settings item; `value`
         undefined takes it out. opts.stamp moves its `at` and `by` to this step's (an Undo, so other devices take it). */
      swap(where, of, value, opts) {
        const sl = slot(book, where, of, value !== undefined);
        const old = sl.get();
        /* [qc-foundation on WHICH_DOOR_PLAN, F1] a record is never taken out of its list (a delete does not last: the store
           keeps it and a join brings it back): it is marked gone, as Remove does */
        const marked = value === undefined && sl.list && !!old;
        /* [qc-foundation confirm on lane/whichdoor, WATCH] a record already removed stays as its Remove left it, so that
           Remove's own Undo still works */
        if (marked && old.gone) return old;
        if (marked) value = Object.assign(clone(old), { gone: s.day, goneBy: s.id });
        /* [coordinator 15, 26 Nov; SCHEMA_V3 2.1] a settings item ({ v, at, by }) is never deleted either: a delete does
           not last (the next join brings the other copy's value back). It is marked not set, { v: null, at, by, gone },
           and every reader takes v null as not set */
        const unset = value === undefined && !sl.list && fieldValue(old);
        if (unset && old.v === null && old.gone) return old;   // already not set: left as it was, so the earlier answer's Undo still works
        if (unset) value = Object.assign({}, old, { v: null, gone: s.day });
        const v = value === undefined ? undefined : clone(value);
        if ((marked || unset || (opts && opts.stamp)) && v && typeof v === 'object' && !Array.isArray(v)) stamp(v);
        sl.set(v);
        log.swapped.push({ where, of, had: old !== undefined, before: old === undefined ? null : clone(old), after: v && v.at ? v.at : null });
        return v;
      },
      find: id => findIn(book, id),
      book,
    };
  }

  /* ---- [WHICH_DOOR_PLAN] the cloud copy's answers: the engine makes the answer (engine/sync.js answer, answerCheck);
     the door carries the difference item by item. Nothing here decides what an answer means. ---- */
  const isMapV = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const isRecs = l => Array.isArray(l) && l.every(r => isMapV(r) && typeof r.id === 'string');
  const fieldValue = x => isMapV(x) && 'v' in x && 'at' in x;   // a settings item, as engine/sync.js keeps one
  const canonJ = x => (Array.isArray(x) ? '[' + x.map(canonJ).join(',') + ']' : isMapV(x) ? '{' + Object.keys(x).filter(k => x[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonJ(x[k])).join(',') + '}' : JSON.stringify(x === undefined ? null : x));
  const sameJ = (a, b) => (a === undefined || b === undefined ? a === b : canonJ(a) === canonJ(b));
  function holderAt(book, where, make) {
    let o = book;
    if (!where) return o;
    for (const k of where.split('.')) { if (o[k] === undefined) { if (!make) return undefined; o[k] = {}; } o = o[k]; if (o === null || typeof o !== 'object') return undefined; }
    return o;
  }
  function slot(book, where, of, make) {
    const h = holderAt(book, where, make);
    if (h === undefined) return { get: () => undefined, set: () => { throw new Bad('That is not there any more'); } };
    if (Array.isArray(h)) return {
      list: true,
      get: () => h.find(r => r && r.id === of),
      set: v => { const i = h.findIndex(r => r && r.id === of); if (v === undefined) { if (i >= 0) h.splice(i, 1); } else if (i >= 0) h[i] = v; else h.push(v); },
    };
    const key = where ? of.split('.').pop() : of;   // a settings item's key is the last part of its name, as the page reads it
    return { get: () => h[key], set: v => { if (v === undefined) delete h[key]; else h[key] = v; } };
  }
  /* every item that differs between two books, as the cloud copy names items: a list of records by id (order never
     counts), a plain object walked into, anything else whole. The book's `rev`, `at`, `fmt` and Undo `journal` are not its content */
  function syncDiff(cur, next) {
    const out = [];
    const index = l => new Map((l || []).map(r => [r.id, r]));
    (function walk(a, b, where) {
      const keys = [...new Set(Object.keys(a || {}).concat(Object.keys(b || {})))].sort();
      for (const k of keys) {
        if (!where && (k === 'rev' || k === 'journal' || k === 'at' || k === 'fmt')) continue;   // the store's own marks (store/idb.js NOT_IN_BOOK) and the Undo journal
        const p = where ? where + '.' + k : k, x = a ? a[k] : undefined, y = b ? b[k] : undefined;
        if ((Array.isArray(x) || Array.isArray(y)) && (x === undefined || isRecs(x)) && (y === undefined || isRecs(y))) {
          const X = index(x), Y = index(y);
          for (const id of [...new Set([...X.keys(), ...Y.keys()])].sort()) if (!sameJ(X.get(id), Y.get(id))) out.push({ where: p, of: id, value: Y.get(id) });
        } else if ((isMapV(x) || x === undefined) && (isMapV(y) || y === undefined) && !fieldValue(x) && !fieldValue(y)) walk(x, y, p);   // a holder one copy lacks is walked into too, so each settings item in it is swapped (and marked) on its own
        else if (!sameJ(x, y)) out.push({ where, of: p, value: y });
      }
    })(cur, next, '');
    return out;
  }
  const BIG = 50;   // an answer that swaps more items than this, or the whole-copy question (two whole books), keeps no old values in the saved journal

  /* ---- the named actions, as steps on a writer ---- */
  const typed = () => ({ type: 'typed' });
  const noteOf = n => (n && String(n).trim() ? String(n).trim() : undefined);
  function forOf(x) { return x.place != null ? { place: x.place } : { line: x.line != null ? x.line : 'free' }; }
  const ACTIONS = {
    logSpend: (w, x) => {
      const e = Object.assign({ k: 'spend', date: x.date, a: x.a, acct: x.acct }, forOf(x), { note: noteOf(x.note), src: typed() });
      if (e.note === undefined) delete e.note;
      checkEvent(w.book, e, w.today);
      return w.add('events', e);
    },
    refund: (w, x) => {
      const e = { k: 'in', sub: 'refund', date: x.date, a: x.a, acct: x.acct, line: x.line != null ? x.line : undefined, note: noteOf(x.note), src: typed() };
      for (const k of ['line', 'note']) if (e[k] === undefined) delete e[k];
      checkEvent(w.book, e, w.today);
      return w.add('events', e);
    },
    moneyIn: (w, x) => {
      const e = { k: 'in', date: x.date, a: x.a, acct: x.acct, note: noteOf(x.note), src: typed() };
      if (e.note === undefined) delete e.note;
      checkEvent(w.book, e, w.today);
      return w.add('events', e);
    },
    moveMoney: (w, x) => {
      const e = { k: 'transfer', date: x.date, a: x.a, acct: x.from, acct2: x.to, note: noteOf(x.note), src: typed() };
      if (e.note === undefined) delete e.note;
      checkEvent(w.book, e, w.today);
      return w.add('events', e);
    },
    edit: (w, id, fields) => {
      const f = w.find(id);
      if (!f) bad('That is not there any more');
      const ch = Object.assign({}, fields);
      if ('note' in ch) ch.note = noteOf(ch.note) || null;
      if (f.list === 'events') {   // a line and a place are one choice: picking one takes the other away
        if (ch.line != null) ch.place = null;
        else if (ch.place != null) ch.line = null;
        const after = Object.assign(clone(f.rec), ch);
        for (const k of Object.keys(ch)) if (ch[k] === null) delete after[k];
        checkEvent(w.book, after, w.today);
      }
      w.edit(f.list, id, ch);
      return id;
    },
    remove: (w, id) => { const f = w.find(id); if (!f) bad('That is not there any more'); w.remove(f.list, id); return id; },
    addRecords: (w, label, out) => {
      for (const c of (out && out.checkins) || []) w.add('checkins', c);
      for (const e of (out && out.events) || []) w.add('events', e);
    },
  };

  /* ---- [BZ1] the saved Undo journal: one entry per step, in the book's top-level `journal`, the latest JOURNAL_KEEP.
     An entry: { id (the step id, the records' grp), label, moment (the step's at), day, by, told, added, removed:
     [{ list, id }], edited: [{ list, id, before: { field: old value, at, by } }], revived: [{ list, id, before }],
     undone?: the Undo's step id, moved?: { record id: at } (a record an Undo put back as this step left it) }.
     The sync joins journals by id and keeps the latest JOURNAL_KEEP (engine/sync.js). ---- */
  const JOURNAL_KEEP = 200;
  /* the order of two entries by moment (a clock, not money), then id */
  const byMoment = (a, b) => { const x = Date.parse(a && a.moment) || 0, y = Date.parse(b && b.moment) || 0; return x < y ? -1 : x > y ? 1 : a.id < b.id ? -1 : 1; };
  function journalAdd(book, entry) {
    const list = Array.isArray(book.journal) ? book.journal : (book.journal = []);
    list.push(entry);
    if (list.length > JOURNAL_KEEP) {
      const sorted = list.slice().sort(byMoment);
      while (sorted.length > JOURNAL_KEEP) sorted.shift();
      const keep = new Set(sorted);
      book.journal = list.filter(j => keep.has(j));
    }
  }
  /* a field the step added had no old value: kept as null (an edit never leaves a null, it takes the field away) so the
     saved text still names it, and Undo takes it away again */
  const keptEdit = x => { const before = {}; for (const k of Object.keys(x.before)) before[k] = x.before[k] === undefined ? null : clone(x.before[k]); return { list: x.list, id: x.id, before }; };
  const ownAt = (j, id) => (j.moved && j.moved[id]) || j.moment;
  function fromJournal(j) {
    const m = { id: j.id, label: j.label, at: j.moment, added: j.added || [], edited: j.edited || [], removed: j.removed || [], revived: j.revived || [], swapped: j.swapped || [], own: {} };
    for (const x of m.added.concat(m.edited, m.removed, m.revived)) m.own[x.id] = ownAt(j, x.id);
    for (const x of m.swapped) m.own[x.of] = x.after;   // [WHICH_DOOR_PLAN] the `at` the answer left on each item
    return m;
  }

  const ARGS = { logSpend: 1, refund: 1, moneyIn: 1, moveMoney: 1, edit: 2, remove: 1, addRecords: 2 };   // how many each takes
  const LABELS = { logSpend: 'Spend logged', refund: 'Refund logged', moneyIn: 'Money in logged', moveMoney: 'Money moved', edit: 'Changed', remove: 'Removed' };
  function make(o) {
    const clock = C ? C.makeClock() : null;
    const nowAt = () => (clock ? clock.stamp() : new Date().toISOString());
    const steps = [], listeners = [];
    let queue = Promise.resolve(), by = null;

    /* plan a step on a copy; returns { book, step } or throws Bad */
    function plan(label, fn, dry, undoing, guard, words) {
      const cur = o.book();
      if (!cur) throw new Bad('Set up first');
      if (guard && guard.ver != null && guard.ver !== ver(cur)) throw other();
      if (clock) clock.see(cur);
      const book = clone(cur), id = o.newId();
      if (!by) by = String(id).split('-')[0];
      const s = { id, label, at: nowAt(), by, told: o.told(), day: o.today(), newId: o.newId };
      const w = writer(book, s, guard && guard.seen);
      w.today = s.day; w.at = s.at; w.by = s.by;
      const out = fn(w);
      if (!w.log.added.length && !w.log.edited.length && !w.log.removed.length && !w.log.revived.length && !w.log.swapped.length) throw new Bad('Nothing changed');
      if (o.check && !dry) {
        try { o.check(book); } catch (e) { const err = new Bad('This would leave numbers the app refuses: ' + e.message); err.why = 'engine'; throw err; }
      }
      const step = { id, label, out, at: s.at, added: w.log.added, edited: w.log.edited, removed: w.log.removed, revived: w.log.revived, swapped: w.log.swapped };
      /* [BZ1] the step's journal entry goes into the same save, so an Undo after a reload finds what it edited too */
      /* [E4, M14] with the words its Undo bar shows, so the list of recent changes can name it after a reload */
      if (!dry && !undoing) journalAdd(book, { id, label, words: words || LABELS[label] || label, moment: s.at, day: s.day, by: s.by, told: s.told,
        added: clone(w.log.added), edited: w.log.edited.map(keptEdit), removed: clone(w.log.removed), revived: clone(w.log.revived),
        swapped: w.log.swapped.length > BIG || w.log.swapped.some(x => x.of === 'kept:copy') ? w.log.swapped.map(x => ({ where: x.where, of: x.of, after: x.after, big: true })) : clone(w.log.swapped) });
      if (undoing) undoing(book, s);
      return { book, step };
    }
    function run(label, fn, opts) {
      opts = opts || {};
      const p = queue.then(async () => {
        let planned;
        try { planned = plan(label, fn, false, opts.journalUndo, opts.isUndo ? null : { seen: opts.seen, ver: opts.ver }, opts.undo); } catch (e) {
          if (e instanceof Bad) return { ok: false, why: e.why || 'bad', text: e.message };
          throw e;
        }
        const ok = await o.put(planned.book);
        if (ok !== true) return { ok: false, why: (ok && ok.why) || 'save', text: (ok && ok.text) || 'This could not be saved on this device. Nothing changed' };   // put may say why (another tab changed the same record)
        if (clock) clock.see(planned.step.at);
        const st = planned.step;
        st.own = {}; for (const x of st.added.concat(st.edited, st.removed, st.revived)) st.own[x.id] = st.at;   // the `at` this step left on each record
        for (const x of st.swapped || []) st.own[x.of] = x.after;
        if (opts.seen && !opts.isUndo) for (const x of st.added.concat(st.edited, st.removed, st.revived)) { const f = findIn(planned.book, x.id); if (f) opts.seen[x.id] = sig(f.rec); }   // the caller's own step: its note follows
        if (opts.after) opts.after(st);
        if (!opts.isUndo) steps.push(st);
        if (o.queue && !opts.quiet && !opts.isUndo) {
          o.queue.post({ kind: 'undo', key: 'act3', text: opts.undo || LABELS[label] || label, action: { label: 'Undo', run: () => undo(planned.step.id) } });
        }
        listeners.forEach(f => { try { f(planned.step, opts); } catch (e) { /* a screen's redraw must not stop the others */ } });
        return { ok: true, step: planned.step, book: planned.book };
      });
      queue = p.catch(() => {});
      return p;
    }

    /* Undo: put back only what that step did. What it added is marked gone; what it removed is put back; what it
       changed gets its old values. A record a later step changed since is left alone and the Undo is refused. */
    function undo(stepId, opts) {
      /* [BZ1] this visit's memory first; after a reload, the saved journal (what the step added, removed and edited, with
         the old values); a step from before the journal: what it added (grp) and removed (goneBy), as before */
      const cur = o.book();
      const saved = !steps.some(s => s.id === stepId) && cur ? ((cur.journal || []).find(j => j && j.id === stepId) || null) : null;
      if (saved && saved.undone) return Promise.resolve({ ok: false, why: 'bad', text: 'That was undone already' });
      const mem = steps.find(s => s.id === stepId) || (saved ? fromJournal(saved) : undefined);
      /* once kept: the step is gone from this visit's list, and an earlier step that left a record as this Undo put it
         back may be undone in turn (its record now carries the Undo's `at`) */
      /* [BZ1] in the same save: the entry is marked undone, and an earlier entry that left a record as this Undo put it
         back now owns that record at the Undo's `at` (as `after` does for this visit's steps) */
      const journalUndo = (book, s) => {
        const list = book.journal || [], own = list.find(j => j && j.id === stepId);
        if (own) own.undone = s.id;
        if (mem) for (const x of mem.edited.concat(mem.removed)) for (const j of list) {
          if (j && j !== own && !j.undone && ownAt(j, x.id) === x.before.at) j.moved = Object.assign({}, j.moved, { [x.id]: s.at });
        }
      };
      const after = u => {
        const i = steps.indexOf(mem); if (i >= 0) steps.splice(i, 1);
        if (mem) for (const x of mem.edited.concat(mem.removed)) for (const p of steps) if (p.own[x.id] && p.own[x.id] === x.before.at) p.own[x.id] = u.at;
      };
      return run('Undo', w => {
        const all = Object.keys(PATHS).map(n => [n, listOf(w.book, n)]);
        const added = mem ? mem.added : [].concat(...all.map(([n, l]) => l.filter(r => r && r.grp === stepId && !r.gone).map(r => ({ list: n, id: r.id }))));
        const removed = mem ? mem.removed : [].concat(...all.map(([n, l]) => l.filter(r => r && r.goneBy === stepId).map(r => ({ list: n, id: r.id }))));
        const edited = mem ? mem.edited : [];
        const revived = mem ? mem.revived || [] : [];   // after a reload a revived record is found by grp with the added ones, and marked gone
        const recOf = x => (x.list === 'home' ? ((w.book.home || {})[x.id] || null) : listOf(w.book, x.list).find(r => r && r.id === x.id));
        const later = x => { const r = recOf(x); return !r || (mem && r.at !== mem.own[x.id]); };
        const swapped = mem ? mem.swapped || [] : [];
        const laterSwap = x => { const v = slot(w.book, x.where, x.of, false).get(); return ((v && v.at) || null) !== mem.own[x.of]; };
        if (added.concat(removed, edited, revived).some(later) || swapped.some(laterSwap)) { const e = new Bad('Something changed it since. Undo that change first'); e.why = 'later'; throw e; }
        if (swapped.some(x => x.big)) bad('This was the choice of a whole copy. It can be undone only until the app is closed, so nothing changed');
        for (const x of swapped) w.swap(x.where, x.of, x.had ? x.before : undefined, { stamp: true });   // a record the answer added is marked gone
        for (const x of added) w.remove(x.list, x.id);
        for (const x of revived) w.putBack(x.list, x.id, x.before);
        for (const x of removed) {
          if (recOf(x).goneBy === stepId) w.restore(x.list, x.id);
        }
        for (const x of edited) {
          if (x.list === 'home') { w.setField(x.id, x.before.v === undefined ? null : x.before.v); continue; }
          const back = {};
          for (const k of Object.keys(x.before)) if (k !== 'at' && k !== 'by') back[k] = x.before[k] === undefined ? null : x.before[k];
          w.edit(x.list, x.id, back);
        }
      }, Object.assign({ isUndo: true, after, journalUndo }, opts)).then(r => {
        if (o.queue && r.ok && !(opts && opts.quiet)) o.queue.post({ kind: 'toast', key: 'act3', text: 'Undone' });
        if (o.queue && !r.ok && !(opts && opts.quiet)) o.queue.post({ kind: 'toast', key: 'act3', text: r.text });
        return r;
      });
    }
    /* the note for a sheet on one item, and the short mark of the whole book (order-free: every change time, sorted) */
    function seen() { const cur = o.book(), out = {}; if (cur) for (const n of Object.keys(PATHS)) for (const r of listOf(cur, n)) if (r && r.id) out[r.id] = sig(r); return out; }
    function ver(b) {
      b = b || o.book(); if (!b) return '';
      const stamps = [];
      (function walk(x, top) {
        if (Array.isArray(x)) { for (const y of x) walk(y, false); return; }
        if (!x || typeof x !== 'object') return;
        for (const k of Object.keys(x)) {
          if (top && (k === 'rev' || k === 'journal')) continue;   // the cloud's revision and the Undo journal are not the book's content
          const v = x[k];
          if (k === 'at' && typeof v === 'string' && !top) stamps.push(v + '|' + (x.by || '') + '|' + (x.id || ''));
          else walk(v, false);
        }
      })(b, true);
      return C && C.markOf ? C.markOf(stamps) : stamps.sort().join(',');   // the hash lives in store/clock.js (no sums in a screen file)
    }
    const api = { run, undo, seen, ver: () => ver(), steps: () => steps.slice(), onChange: f => listeners.push(f) };
    /* [WHICH_DOOR_PLAN] A.answerSync(label, make, opts): make(book, { now, by }) is the engine's answer on the book as it
       is in this step (S.answer or S.answerCheck); the door writes what differs, item by item, with Undo */
    api.answerSync = (label, make, opts) => run(label, w => {
      const next = make(clone(w.book), { now: w.at, by: w.by });
      for (const x of syncDiff(w.book, next)) w.swap(x.where, x.of, x.value);
    }, opts);
    for (const name of Object.keys(ACTIONS)) {
      const n = ARGS[name];   // the action's own arguments, before the options
      api[name] = (...args) => {
        const opts = args.length > n ? args[n] : undefined;
        const label = name === 'addRecords' ? args[0] : name;
        return run(label, w => ACTIONS[name](w, ...args.slice(0, n)), opts);
      };
    }
    /* the words a step would be refused with, or null: nothing is written (a question before a remove is only asked
       when Yes would do it) */
    api.refusal = (label, fn) => { try { plan(label, fn, true); return null; } catch (e) { if (e instanceof Bad) return e.message; throw e; } };
    /* [qc-controls confirm 1] the book any step would make (the step's words are built from it), or throws Bad */
    api.dryRun = (label, fn) => plan(label, fn, true).book;
    api.dry = (name, ...args) => {
      const n = ARGS[name];
      const p = plan(name, w => ACTIONS[name](w, ...args.slice(0, n)), true);
      return p.book;
    };
    return api;
  }

  const api = { make, PATHS, listOf, Bad, OTHER, syncDiff, SPEND_FROM, ACTION_NAMES: Object.keys(ACTIONS) };   // the last two are read by tests/controls3.test.js
  if (node) module.exports = api;
  else root.BurrowAct3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
/* the page's door: one for the whole page, over E3's book (src/e3.js), its Undo bar in the one message band (MSG3) */
const ACT3 = typeof E3 === 'object' && typeof BurrowAct3 === 'object' ? BurrowAct3.make({
  book: () => E3.book, put: b => E3.put(b), told: () => E3.told(), newId: () => E3.newId(), today: () => E3.today(),
  queue: MSG3, check: b => BurrowEngine.lookahead.lookahead(b, E3.today()) }) : null;
