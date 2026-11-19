/* ADAPTER (tests only, side N, 2026-11-19): lets tests/next/lib.js load the real ledger, wip/team/ledger.js, through its hooks.
     MODEL=tests/next/ledger_core_model.js node tests/next/ledger_conservation.js      (from wip/team)
   lib.js loads a model as a plain script and asks for freshState and setFreeMode; ledger.js does not define those two names, because
   model.js owns freshState in the page. This file adds only what the hooks need and changes no figure:
     - freshState(): a fresh ledger with one bank and one wallet that is not tracked (side C's shape)
     - side C's event shape ({ t, a, to, from }) is turned into the design's shape ({ k, a, acct, place })
     - side C pushes opening balances straight into S.ledger; they are read as 'open' events on the bank
     - the tests' made-up events often carry no date. The app always passes the day, so here an event with no date is dated one day
       after the latest event in the ledger (so the order they were added is the order of their days)
     - placesOf() also answers chest (= waiting) and unexplained (= the bank's last check), the two names side C's hook reads */
var LEDGER_CORE = (function () {
  var req = process.getBuiltinModule ? process.getBuiltinModule : function (n) { return process.mainModule.require(n); };
  var fs = req('fs'), path = req('path');
  var here = process.env.MODEL ? path.dirname(path.resolve(process.env.MODEL)) : path.join(process.cwd(), 'tests', 'next');
  var file = process.env.LEDGER_FILE || path.join(here, '..', '..', 'ledger.js');
  var names = ['LEDGER_V', 'ledgerFresh', 'ledgerAdd', 'ledgerUndo', 'ledgerRedo', 'placesOf', 'periodOf', 'flows', 'migrate3831', 'ledgerSetMode', 'ledgerWhy'];
  return new Function(fs.readFileSync(file, 'utf8') + ';\nreturn {' + names.map(function (n) { return n + ': ' + n; }).join(', ') + '};')();
})();
var LEDGER_V = LEDGER_CORE.LEDGER_V;
var LEDGER_CORE_BASE = '2026-01-01';
function ledgerCoreNextDay(S) {
  var max = LEDGER_CORE_BASE; S.ledger.forEach(function (e) { if (e && typeof e.date === 'string' && e.date > max) max = e.date; });
  var t = new Date(Date.UTC(+max.slice(0, 4), +max.slice(5, 7) - 1, +max.slice(8, 10) + 1));
  return t.toISOString().slice(0, 10);
}
function ledgerCoreShape(S, e) {
  if (!e || e.k || !e.t) return e;
  var pl = function (p) { return p === 'chest' ? 'waiting' : p; };
  switch (e.t) {
    case 'open': return { k: 'open', acct: 'bank', a: e.a, place: pl(e.to) };
    case 'pay': return { k: 'in', sub: 'pay', acct: 'bank', a: e.a, place: 'waiting' };
    case 'place': if (e.to === 'free' && S.ui.freeMode === 'wallet') return { k: 'hand', acct: 'bank', acct2: 'wallet', a: e.a, place: 'waiting' };
      return { k: 'move', a: e.a, place: 'waiting', place2: pl(e.to) };
    case 'spend': return { k: 'spend', acct: 'bank', a: e.a, place: pl(e.from) };
    case 'takeout': return { k: 'spend', sub: 'take out', acct: 'bank', a: e.a, place: pl(e.from) };
    case 'move': return { k: 'move', a: e.a, place: pl(e.from), place2: pl(e.to) };
    case 'check': return { k: 'check', acct: 'bank', typedA: e.a };
  }
  return null;
}
function freshState() { return LEDGER_CORE.ledgerFresh({ cur: 'PHP', accounts: [{ id: 'bank', name: 'Bank', type: 'bank' }, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false }] }); }
function setFreeMode(S, mode) { return LEDGER_CORE.ledgerSetMode(S, mode); }
function ledgerFresh(setup) { return LEDGER_CORE.ledgerFresh(setup); }
function ledgerAdd(S, ev) {
  var e = ledgerCoreShape(S, ev); if (!e) return false;
  return LEDGER_CORE.ledgerAdd(S, e, e.date == null ? ledgerCoreNextDay(S) : undefined);
}
function ledgerUndo(S, id) { return LEDGER_CORE.ledgerUndo(S, id); }
function ledgerRedo(S) { return LEDGER_CORE.ledgerRedo(S); }
function placesOf(S, day) {
  var view = S;
  if (S.ledger.some(function (e) { return e && !e.k && e.t; })) {
    view = Object.assign({}, S, { ledger: S.ledger.map(function (e, i) {
      if (!e || e.k || !e.t) return e;
      var d = ledgerCoreShape(S, e); return { k: d.k, acct: d.acct, place: d.place, c: Math.round(d.a * 100), date: LEDGER_CORE_BASE, id: -1 - i };
    }) });
  }
  var p = LEDGER_CORE.placesOf(view, day);
  p.chest = p.waiting; p.unexplained = p.checks.bank ? p.checks.bank.unexplained : null;
  return p;
}
function periodOf(S, date) { return LEDGER_CORE.periodOf(S, date); }
function flows(S, from, to) { return LEDGER_CORE.flows(S, from, to); }
function migrate3831(old, today) { return LEDGER_CORE.migrate3831(old, today); }
