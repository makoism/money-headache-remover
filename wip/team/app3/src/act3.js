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
  function writer(book, s) {
    const log = { added: [], edited: [], removed: [], revived: [] };
    const stamp = r => { r.at = s.at; r.by = s.by; };
    return {
      log,
      add(list, rec) {
        if (!rec || typeof rec !== 'object') throw new Error('act3: add needs a record');
        const r = Object.assign({}, rec);
        if (!r.id) r.id = s.newId();
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
        if (had) throw new Error('act3: there is already a record ' + r.id);
        listOf(book, list, true).push(r);
        log.added.push({ list, id: r.id });
        return r.id;
      },
      edit(list, id, fields) {
        const r = listOf(book, list).find(x => x && x.id === id);
        if (!r) throw new Bad('That is not there any more');
        if (r.gone) throw new Bad('That was removed. Undo the removal first');
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
        const before = { at: r.at, by: r.by };
        r.gone = s.day; r.goneBy = s.id; stamp(r);
        log.removed.push({ list, id, before });
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
      find: id => findIn(book, id),
      book,
    };
  }

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

  const ARGS = { logSpend: 1, refund: 1, moneyIn: 1, moveMoney: 1, edit: 2, remove: 1, addRecords: 2 };   // how many each takes
  const LABELS = { logSpend: 'Spend logged', refund: 'Refund logged', moneyIn: 'Money in logged', moveMoney: 'Money moved', edit: 'Changed', remove: 'Removed' };
  function make(o) {
    const clock = C ? C.makeClock() : null;
    const nowAt = () => (clock ? clock.stamp() : new Date().toISOString());
    const steps = [], listeners = [];
    let queue = Promise.resolve(), by = null;

    /* plan a step on a copy; returns { book, step } or throws Bad */
    function plan(label, fn, dry) {
      const cur = o.book();
      if (!cur) throw new Bad('Set up first');
      if (clock) clock.see(cur);
      const book = clone(cur), id = o.newId();
      if (!by) by = String(id).split('-')[0];
      const s = { id, label, at: nowAt(), by, told: o.told(), day: o.today(), newId: o.newId };
      const w = writer(book, s);
      w.today = s.day;
      const out = fn(w);
      if (!w.log.added.length && !w.log.edited.length && !w.log.removed.length && !w.log.revived.length) throw new Bad('Nothing changed');
      if (o.check && !dry) {
        try { o.check(book); } catch (e) { const err = new Bad('This would leave numbers the app refuses: ' + e.message); err.why = 'engine'; throw err; }
      }
      return { book, step: { id, label, out, at: s.at, added: w.log.added, edited: w.log.edited, removed: w.log.removed, revived: w.log.revived } };
    }
    function run(label, fn, opts) {
      opts = opts || {};
      const p = queue.then(async () => {
        let planned;
        try { planned = plan(label, fn); } catch (e) {
          if (e instanceof Bad) return { ok: false, why: e.why || 'bad', text: e.message };
          throw e;
        }
        const ok = await o.put(planned.book);
        if (ok !== true) return { ok: false, why: (ok && ok.why) || 'save', text: (ok && ok.text) || 'This could not be saved on this device. Nothing changed' };   // put may say why (another tab changed the same record)
        if (clock) clock.see(planned.step.at);
        const st = planned.step;
        st.own = {}; for (const x of st.added.concat(st.edited, st.removed, st.revived)) st.own[x.id] = st.at;   // the `at` this step left on each record
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
      const mem = steps.find(s => s.id === stepId);
      /* once kept: the step is gone from this visit's list, and an earlier step that left a record as this Undo put it
         back may be undone in turn (its record now carries the Undo's `at`) */
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
        const recOf = x => listOf(w.book, x.list).find(r => r && r.id === x.id);
        const later = x => { const r = recOf(x); return !r || (mem && r.at !== mem.own[x.id]); };
        if (added.concat(removed, edited, revived).some(later)) { const e = new Bad('Something changed it since. Undo that change first'); e.why = 'later'; throw e; }
        for (const x of added) w.remove(x.list, x.id);
        for (const x of revived) w.putBack(x.list, x.id, x.before);
        for (const x of removed) {
          if (recOf(x).goneBy === stepId) w.restore(x.list, x.id);
        }
        for (const x of edited) {
          const back = {};
          for (const k of Object.keys(x.before)) if (k !== 'at' && k !== 'by') back[k] = x.before[k] === undefined ? null : x.before[k];
          w.edit(x.list, x.id, back);
        }
      }, Object.assign({ isUndo: true, after }, opts)).then(r => {
        if (o.queue && r.ok && !(opts && opts.quiet)) o.queue.post({ kind: 'toast', key: 'act3', text: 'Undone' });
        if (o.queue && !r.ok && !(opts && opts.quiet)) o.queue.post({ kind: 'toast', key: 'act3', text: r.text });
        return r;
      });
    }
    const api = { run, undo, steps: () => steps.slice(), onChange: f => listeners.push(f) };
    for (const name of Object.keys(ACTIONS)) {
      const n = ARGS[name];   // the action's own arguments, before the options
      api[name] = (...args) => {
        const opts = args.length > n ? args[n] : undefined;
        const label = name === 'addRecords' ? args[0] : name;
        return run(label, w => ACTIONS[name](w, ...args.slice(0, n)), opts);
      };
    }
    api.dry = (name, ...args) => {
      const n = ARGS[name];
      const p = plan(name, w => ACTIONS[name](w, ...args.slice(0, n)), true);
      return p.book;
    };
    return api;
  }

  const api = { make, PATHS, listOf, Bad };
  if (node) module.exports = api;
  else root.BurrowAct3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
/* the page's door: one for the whole page, over E3's book (src/e3.js), its Undo bar in the one message band (MSG3) */
const ACT3 = typeof E3 === 'object' && typeof BurrowAct3 === 'object' ? BurrowAct3.make({
  book: () => E3.book, put: b => E3.put(b), told: () => E3.told(), newId: () => E3.newId(), today: () => E3.today(),
  queue: MSG3, check: b => BurrowEngine.lookahead.lookahead(b, E3.today()) }) : null;
