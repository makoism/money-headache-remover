/* ---------- endperiod3: what waits at the end of a pay period (ENDPERIOD_PLAN slice 1; MAKO_SAYS M24, M46) ----------
   Money a plan line or Free to spend did not use in a pay period gone by never drops out silently (M46): the person
   chooses where it goes, or decides later (M24). This file works out what waits and writes one answer; the screens and
   the assistant word it (slices 2 and 3).
     EP3.waiting(book, day) -> [ each pay period gone by that still has something to decide, oldest first:
       { id: the occurrence of the pay that started it, start, end (both from engine/periods.js, never worked out),
         over: how far the period went over as a whole (0 when not), fresh: every spend-from account and card checked
         on or after its end day, can: what it can give (the places' left, overs taken off, never below zero), sent:
         what its answers sent to goals (by record, so a line removed since still counts), takeBack: sent is more than
         can (figures came in later), takeBackBy: by how much,
         places: [{ place: a line id or 'free', name, acct, left, net (its left once the overs come off, Free to spend
                    first, then each line by told, then id), sent, decided, fresh, offer: the most that may go to a goal
                    now, goals: the goal ids offered (none when offer is 0) }]   (none when the period went over),
         goals: [{ id, name, acct }] the goals offered in any of its places } ]
     Nothing is saved: a reload, a merge, a restore or an Undo give the same answer. No answer depends on the order of
     any list in the book.
     EP3.answer(w, x) is the step for the write door: ACT3.run(label, w => EP3.answer(w, x)), x = { period: <its id>,
       place, to: 'waiting' (Leave it in my bank) | <goal id> | 'takeBack', a }. One record per place,
       { k: 'periodEnd', id: pe:<occurrence>:<place>, date: the period's end, place, moves }; answering again edits it,
       Take back leaves it with moves: []. The cap is worked out again here from w.book, without this place's own
       answer, and over it the door's Bad is thrown in plain words.
   The rules (ENDPERIOD_PLAN, fourth review): "Leave it in my bank" decides a place and takes nothing off what the
   period can give; only money sent to a goal does. A place's offer is the least of its own left less its own goal
   answers, what the period can still give, the engine's noJob today and the canSetAside of the goal's bank; a goal is
   offered only when the figures are fresh and only if kept in the line's own bank account (version one).
   Money sums here are outside the engine on purpose (builder point 8): a pure file, tested in node
   (tests/endperiod3.test.js), named in the no_maths gate, so it can move into engine/periods.js later.
   Plain browser JavaScript; in node, require('./endperiod3.js'). */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const A3 = node ? require('./act3.js') : root.BurrowAct3;
  const LA = node ? require('../../engine/lookahead.js') : root.BurrowEngine.lookahead;
  const PE = node ? require('../../engine/periods.js') : root.BurrowEngine.periods;
  const I = node ? require('../../engine/ids.js') : root.BurrowEngine.ids;
  const SMF = node ? require('../../screens/money.js') : root.BurrowScreens.money;
  const bad = text => { throw new A3.Bad(text); };
  const live = x => x && !x.gone;
  const clone = x => JSON.parse(JSON.stringify(x));
  const byId = (x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
  /* Free to spend first, then each line by when it was told, then by id: never a list's order (builder point 3) */
  const byOrder = (x, y) => (x.place === 'free' ? -1 : y.place === 'free' ? 1 : x.told < y.told ? -1 : x.told > y.told ? 1 : x.place < y.place ? -1 : x.place > y.place ? 1 : 0);
  const goalMoves = rec => (rec && live(rec) ? rec.moves || [] : []).filter(m => m && m.to !== 'waiting');
  const sentOf = rec => goalMoves(rec).reduce((t, m) => t + (Number(m.a) || 0), 0);

  /* the day an account was last checked by `day`, as e3.js lastCheckOf reads it (a statement is not a check) */
  function lastCheck(book, acct, day) {
    let last = null;
    for (const e of book.events || []) {
      if (!live(e) || e.k !== 'check' || e.stmt || e.acct !== acct || !e.date || e.date > day || String(e.told || e.date).slice(0, 10) > day) continue;
      if (last === null || e.date > last) last = e.date;
    }
    return last;
  }

  /* every pay period gone by, oldest first, with every place (also the ones decided), for waiting() and answer() */
  function view(book, day) {
    const r = LA.lookahead(book, day);
    if (!r.period) return [];   // no fixed pay: no periods gone by [B4]
    const past = PE.periods(book, day).past.slice().reverse();
    if (!past.length) return [];
    const toldOf = {}; for (const l of ((book.plan || {}).budgets || [])) if (l && l.id) toldOf[l.id] = String(l.told || '');
    const recs = {};   // occurrence -> place -> its live periodEnd record (answers counted by record, builder point 4)
    for (const e of book.events || []) {
      if (!live(e) || e.k !== 'periodEnd') continue;
      const oc = I.periodOcc(e.id);
      if (oc) (recs[oc] = recs[oc] || {})[e.place] = e;
    }
    // what the person spends from: the home-currency spend-from accounts and every card
    const spendFrom = Object.keys(r.accounts).filter(id => r.accounts[id].spendFrom).concat(Object.keys(r.cards || {}));
    const goals = (book.places || []).filter(g => live(g) && g.kind === 'goal' && r.places[g.id] && (g.keptIn || {}).mode !== 'ownAccount')
      .map(g => ({ id: g.id, name: g.name, acct: (g.keptIn || {}).acct, told: String(g.told || '') }))
      .sort((x, y) => (x.told < y.told ? -1 : x.told > y.told ? 1 : byId(x, y))).map(g => ({ id: g.id, name: g.name, acct: g.acct }));
    const noJob = r.noJob ? r.noJob.amount : 0;
    const out = [];
    for (const p of past) {
      if (!p.startsWith) continue;   // a period with no pay to name it by has no answer id
      const mine = recs[p.startsWith] || {};
      const fresh = spendFrom.every(id => { const c = lastCheck(book, id, day); return c !== null && c >= p.end; });
      const places = (p.lines || []).map(l => ({ place: l.id, name: l.name, acct: l.acct, left: l.left, told: toldOf[l.id] || '' }));
      if (p.free) places.push({ place: 'free', name: 'Free to spend', acct: p.free.acct, left: p.free.left, told: '' });
      places.sort(byOrder);
      const total = places.reduce((t, x) => t + x.left, 0);
      const can = Math.max(0, total), over = Math.max(0, -total);
      const sent = Object.keys(mine).reduce((t, k) => t + sentOf(mine[k]), 0);
      const still = Math.max(0, can - sent);
      // [rule 1] the overs come off Free to spend first, then each line by told, then id
      let take = places.filter(x => x.left < 0).reduce((t, x) => t - x.left, 0);
      for (const x of places) {
        if (x.left <= 0) { x.net = 0; continue; }
        const off = Math.min(x.left, take); x.net = x.left - off; take -= off;
      }
      for (const x of places) {
        const rec = mine[x.place];
        x.sent = sentOf(rec);
        x.decided = !!(rec && live(rec) && (rec.moves || []).length);
        x.fresh = fresh;
        const setAside = (r.accounts[x.acct] || {}).canSetAside || 0;
        x.offer = fresh && x.left > 0 ? Math.max(0, Math.min(x.left - x.sent, still, noJob, setAside)) : 0;
        x.goals = x.offer > 0 ? goals.filter(g => g.acct === x.acct).map(g => g.id) : [];
        delete x.told;
      }
      const offered = goals.filter(g => places.some(x => x.goals.includes(g.id)));
      out.push({ id: p.startsWith, start: p.start, end: p.end, over, fresh, can, sent, takeBack: sent > can, takeBackBy: Math.max(0, sent - can), places, goals: offered });
    }
    return out;
  }

  /* what still has something to decide: a place with money left and no answer, or answers that sent more than the
     period turned out to have; a period that went over as a whole asks nothing and says by how much (rule 5) */
  function waiting(book, day) {
    return view(book, day).filter(p => p.over > 0 || p.takeBack || (p.can > 0 && p.places.some(x => !x.decided && x.left > 0)))
      .map(p => (p.over > 0 ? Object.assign(p, { places: [], goals: [] }) : p));
  }

  /* the write step: one record per place, edited when it is there, never a second one */
  function answer(w, x) {
    x = x || {};
    const book = w.book, day = w.today;
    if (!x.period || !I.occurrence(x.period)) bad('Pick a pay period gone by');
    if (!x.place) bad('Pick a line of that pay period');
    const id = I.built.pe(x.period, x.place);
    const events = A3.listOf(book, 'events');
    const old = events.find(e => e && e.id === id && !e.gone) || null;
    const res = LA.lookahead(book, day);
    const nameOfAcct = a => ((book.accounts || []).find(y => y && y.id === a) || {}).name || 'that account';
    const curOf = a => ((book.accounts || []).find(y => y && y.id === a) || {}).cur;
    const goalName = g => ((book.places || []).find(y => y && y.id === g) || {}).name || 'That goal';
    // a goal never gives back more than it holds now, as takeOut (plan3_write.js) refuses
    const givesBack = moves => {
      const was = {}, now = {};
      for (const m of goalMoves(old)) was[m.to] = (was[m.to] || 0) + m.a;
      for (const m of moves.filter(m => m.to !== 'waiting')) now[m.to] = (now[m.to] || 0) + m.a;
      for (const g of Object.keys(was).sort()) {
        const back = was[g] - (now[g] || 0), held = (res.places[g] || {}).kept || 0;
        if (back > 0 && back > held) {
          const acct = ((book.places || []).find(y => y && y.id === g) || {}).keptIn || {};
          const cur = curOf(acct.acct) || 'JPY';
          bad(`${goalName(g)} holds ${SMF.format(held, cur)} now, less than the ${SMF.format(back, cur)} this would take back. It was spent or moved since`);
        }
      }
    };
    if (x.to === 'takeBack') {
      if (!old || !(old.moves || []).length) bad('There is nothing to take back there');
      givesBack([]);
      w.edit('events', id, { moves: [] });
      return id;
    }
    if (!Number.isInteger(x.a) || !(x.a > 0)) bad('Type an amount above zero');
    // the cap, worked out again from the book as it is, without this place's own answer
    const base = old ? clone(book) : book;
    if (old) base.events.find(e => e && e.id === id && !e.gone).moves = [];
    const p = view(base, day).find(q => q.id === x.period);
    if (!p) bad('That is not a pay period gone by');
    const pl = p.places.find(q => q.place === x.place);
    if (!pl) bad('That is not a line of that pay period');
    const cur = curOf(pl.acct) || 'JPY';
    let moves;
    if (x.to === 'waiting') {
      if (pl.left <= 0) bad(`${pl.name} has nothing left in that pay period`);
      if (x.a > pl.left) bad(`${pl.name} has ${SMF.format(pl.left, cur)} left in that pay period`);
      moves = [{ to: 'waiting', a: x.a }];
    } else {
      const g = (book.places || []).find(y => live(y) && y.id === x.to && y.kind === 'goal');
      if (!g) bad('That goal is not there any more. Pick another');
      const k = g.keptIn || {};
      if (k.mode === 'ownAccount' || k.acct !== pl.acct) bad(`${g.name} is not kept in ${nameOfAcct(pl.acct)}, where ${pl.name}'s money is. Pick a goal kept there`);
      if (!p.fresh) bad(`Some of ${pl.name}'s money may be spent already. Check your bank and cards first, then pick a goal`);
      if (x.a > pl.offer) bad(pl.offer > 0 ? `Up to ${SMF.format(pl.offer, cur)} of ${pl.name} can go to a goal now`
        : `None of ${pl.name}'s money can go to a goal now: your bank can not spare it before your next pay. Leave it in your bank or decide later`);
      moves = [{ to: g.id, a: x.a }];
    }
    givesBack(moves);
    if (old) w.edit('events', id, { moves });
    else w.add('events', { id, k: 'periodEnd', date: p.end, place: x.place, moves });
    return id;
  }

  const api = { waiting, answer };
  if (node) module.exports = api;
  else root.EP3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
