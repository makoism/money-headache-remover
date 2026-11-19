/* Runs the personas (ledger_personas.js) and the 38.31 migrations through the model, from tests/next/ledger_conservation.js.
   The model must offer ledgerFresh, ledgerAdd, ledgerUndo, ledgerRedo, placesOf and migrate3831 (tests/next/ledger_ref.js does;
   the app will once step B1 is built). Until then this prints NOT BUILT.

   The checks are worked out HERE, from the events, on the account side only (what each event does to each account). The model works
   out places on its own. So every identity below compares two different roads to the same number, to the cent:
     I1  every account balance the model shows = the sum of that account's events (opening + in - out)
     I2  Total = the tracked home-currency accounts added up            (every coin is in exactly one place)
     I3  Total = waiting + This month + Burrows, This month = Bills left + Free to spend (Track only)
     I4  Owed = cards + pay-later + loans, added up from their events
     I5  for each card paid in full: the money set aside for it = what is on the card
     I6  money in another currency = its account events, kept outside Total
     I7  check your bank: unexplained = the typed balance - that account's balance from its events, and a check moves no money
     I8  a move between places and a check never change Total; a move between accounts in Total never changes Total
     I9  undo puts every number back exactly; redo puts it back again; a saved and reopened copy shows the same numbers;
         undoing everything returns to the opening balances
     I10 the 38.31 migration: opening balances = the typed bank + goal starts; cards set aside; a frozen copy kept unchanged */
const { cents } = require('./lib');
const { PERSONAS, MIGRATIONS } = require('./ledger_personas');
const J = JSON.stringify;

module.exports = function (M, rep) {
  if (!(M.ledgerFresh && M.ledgerAdd && M.ledgerUndo && M.ledgerRedo && M.placesOf)) { rep.missing('the persona runs: the model has no ledgerFresh / ledgerRedo (LEDGER_DESIGN.md)'); return; }
  const OWED = { card: 1, paylater: 1, loan: 1 }, ASSET = { bank: 1, cash: 1, ewallet: 1, wallet: 1, owedToYou: 1 };

  /* what one event does to the accounts, in cents, written from LEDGER_DESIGN.md "Kinds", independent of the model */
  function acctDelta(e, accts) {
    const d = {}, add = (k, v) => { if (k) d[k] = (d[k] || 0) + v; }, c = cents(e.a || 0), owed = id => OWED[(accts[id] || {}).type];
    switch (e.k) {
      case 'open': case 'adjust': add(e.acct, c); break;
      case 'in': add(e.acct, owed(e.acct) ? -c : c); break;              /* a refund onto a card lowers what is owed */
      case 'borrow': add(e.acct, c); add(e.acct2, c); break;
      case 'spend': add(e.acct, owed(e.acct) ? c : -c); break;
      case 'hand': case 'transfer': add(e.acct, -c); add(e.acct2, c); break;
      case 'convert': add(e.acct, -c); add(e.acct2, cents(e.a2)); break;
      case 'repay': add(e.acct, -c); add(e.acct2, -c); break;
    }
    return d;
  }

  function oracle(setup, events) {
    const accts = {}; setup.accounts.forEach(a => { accts[a.id] = Object.assign({ cur: setup.cur, tracked: a.type !== 'wallet' }, a); });
    const bal = {}; Object.keys(accts).forEach(k => { bal[k] = 0; });
    events.forEach(e => { const d = acctDelta(e, accts); for (const k in d) bal[k] += d[k]; });
    let total = 0, owed = 0; const foreign = {};
    for (const k in accts) { const a = accts[k];
      if (OWED[a.type]) owed += bal[k];
      else if (a.cur !== setup.cur) foreign[a.cur] = (foreign[a.cur] || 0) + bal[k];
      else if (ASSET[a.type] && a.tracked !== false) total += bal[k]; }
    return { accts, bal, total, owed, foreign };
  }

  function identities(tag, setup, S, events) {
    const p = M.placesOf(S), O = oracle(setup, events), c = cents;
    for (const k in O.bal) rep.ok(c(p.accounts[k] || 0) === O.bal[k], `${tag}: I1 account ${k} shows ${p.accounts[k]}, its events give ${O.bal[k] / 100}`);
    rep.ok(c(p.total) === O.total, `${tag}: I2 Total ${p.total} is not the tracked accounts added up (${O.total / 100})`);
    const saved = Object.values(p.burrows).reduce((a, b) => a + c(b), 0);
    rep.ok(c(p.total) === c(p.waiting) + c(p.thisMonth) + saved, `${tag}: I3 Total ${p.total} is not waiting + This month + Burrows`);
    rep.ok(c(p.thisMonth) === c(p.bills) + (S.ui.freeMode === 'track' ? c(p.free) : 0), `${tag}: I3 This month is not Bills left + Free to spend`);
    rep.ok(c(p.saved) === saved, `${tag}: I3 Saved is not the burrows added up`);
    rep.ok(c(p.owed) === O.owed, `${tag}: I4 Owed ${p.owed} is not the cards and loans added up (${O.owed / 100})`);
    for (const k in O.accts) if (O.accts[k].type === 'card' && O.accts[k].inFull) rep.ok(c((p.cards || {})[k] || 0) === O.bal[k], `${tag}: I5 set aside for ${k} is ${(p.cards || {})[k]}, the card shows ${O.bal[k] / 100}`);
    for (const cur in O.foreign) rep.ok(c((p.foreign || {})[cur] || 0) === O.foreign[cur], `${tag}: I6 ${cur} shows ${(p.foreign || {})[cur]}, its events give ${O.foreign[cur] / 100}`);
    return p;
  }

  for (const P of PERSONAS) {
    let S = M.ledgerFresh(P.setup); const done = [], undone = [], backups = {};
    let openSnap = null;
    P.steps.forEach((st, i) => {
      const tag = `${P.name.split(':')[0].slice(0, 40)} step ${i + 1} ${J(st)}`;
      if (st.do === 'undo') { const before = J(M.placesOf(S)); const snap = done.length > 1 ? done[done.length - 1].before : null;
        rep.ok(M.ledgerUndo(S) !== false, `${tag}: undo refused`); const e = done.pop(); undone.push(e);
        if (snap) rep.ok(J(M.placesOf(S)) === snap, `${tag}: I9 undo did not put every number back exactly`); e.after = before; }
      else if (st.do === 'redo') { rep.ok(M.ledgerRedo(S) !== false, `${tag}: redo refused`); const e = undone.pop(); done.push(e);
        rep.ok(J(M.placesOf(S)) === e.after, `${tag}: I9 redo did not put the numbers back`); }
      else if (st.do === 'reload') { const before = J(M.placesOf(S)); S = JSON.parse(J(S)); rep.ok(J(M.placesOf(S)) === before, `${tag}: I9 a saved and reopened copy shows different numbers`); }
      else if (st.do === 'backup') backups[st.as] = { S: J(S), done: done.slice(), undone: undone.slice(), places: J(M.placesOf(S)) };
      else if (st.do === 'restore') { const b = backups[st.from]; S = JSON.parse(b.S); done.length = 0; done.push(...b.done); undone.length = 0; undone.push(...b.undone); S.__restored = b.places; }
      else if (st.do === 'expect') {
        const p = M.placesOf(S), c = cents;
        for (const k in st) {
          if (k === 'do') continue; const v = st[k];
          if (k === 'unexplainedOf') rep.ok(c(p.checks[v[0]].unexplained) === c(v[1]), `${tag}: ${v[0]} unexplained shows ${p.checks[v[0]].unexplained}, expected ${v[1]}`);
          else if (k === 'bank') rep.ok(c(p.accounts.bank) === c(v), `${tag}: bank shows ${p.accounts.bank}, expected ${v}`);
          else if (k === 'bankAfterCards') rep.ok(c(p.accounts.bank) - c(p.forCards) === c(v), `${tag}: bank after the cards are paid is ${(c(p.accounts.bank) - c(p.forCards)) / 100}, expected ${v}`);
          else if (k === 'freeBelowZero') rep.ok((p.free < 0) === v, `${tag}: Free to spend ${p.free} below zero should be ${v} (L1: shown in amber, never refused)`);
          else if (k === 'waitingBelowZero') rep.ok((p.waiting < 0) === v, `${tag}: waiting ${p.waiting} below zero should be ${v}`);
          else if (k === 'foreignUSD') rep.ok(c(p.foreign.USD) === c(v), `${tag}: USD shows ${p.foreign.USD}, expected ${v}`);
          else if (k === 'restoredEqualsBackup') rep.ok(J(p) === S.__restored, `${tag}: the restored copy does not show what the backup held`);
          else rep.ok(c(p[k]) === c(v), `${tag}: ${k} shows ${p[k]}, expected ${v}`);
        }
      } else {
        const before = M.placesOf(S), events = () => done.map(d => d.e);
        const ok = M.ledgerAdd(S, st); rep.ok(ok, `${tag}: the design could not record this event`); if (!ok) return;
        undone.length = 0; done.push({ e: st, before: J(before) });
        const p = identities(tag, P.setup, S, events());
        if (st.k === 'check') { const O = oracle(P.setup, events()); rep.ok(cents(p.checks[st.acct].unexplained) === cents(st.typedA) - O.bal[st.acct], `${tag}: I7 unexplained is not typed - balance`); }
        if (st.k === 'move' || st.k === 'check' || (st.k === 'transfer' && !['wallet'].includes((P.setup.accounts.find(a => a.id === st.acct2) || {}).type))) rep.ok(cents(p.total) === cents(before.total), `${tag}: I8 a ${st.k} changed Total`);
        if (st.k === 'open') openSnap = J(p);
      }
      if (!st.k && st.do !== 'expect') identities(tag, P.setup, S, done.map(d => d.e));
    });
    /* I9: undo everything back to the opening balances */
    let guard = 0; while (S.ledger.length && S.ledger[S.ledger.length - 1].k !== 'open' && guard++ < 500) { M.ledgerUndo(S); done.pop(); }
    rep.ok(J(M.placesOf(S)) === openSnap, `${P.name.slice(0, 40)}: I9 undoing every event does not return to the opening balances`);
    identities(P.name.slice(0, 40) + ' after undoing all', P.setup, S, done.map(d => d.e));
  }

  /* I10: a saved 38.31 copy moves into the ledger */
  if (!M.migrate3831) { rep.missing('the 38.31 migration (migrate3831)'); return; }
  for (const G of MIGRATIONS) {
    const old = JSON.parse(J(G.old)), S = M.migrate3831(old, '2026-11-20'), p = M.placesOf(S), c = cents, tag = 'migration: ' + G.name;
    for (const k in G.expect) rep.ok(c(p[k]) === c(G.expect[k]), `${tag}: ${k} shows ${p[k]}, expected ${G.expect[k]}`);
    rep.ok(c(p.total) === c(G.old.bankStart) + (G.old.goals || []).reduce((a, g) => a + c(g.start), 0), `${tag}: opening balances are not the typed bank + goal starts`);
    rep.ok(J(S.frozen && Object.assign({}, S.frozen, { frozenAt: undefined })) === J(Object.assign({}, G.old, { frozenAt: undefined })), `${tag}: the frozen copy is not the saved copy unchanged`);
    rep.ok(S.ledger.every(e => e.k === 'open'), `${tag}: migration recorded something other than opening balances`);
    rep.ok(J(M.placesOf(JSON.parse(J(S)))) === J(p), `${tag}: reopened, it shows different numbers`);
    rep.ok(typeof S.ledgerV === 'number' && S.ledgerV >= 1, `${tag}: no ledger version (older pages must refuse to overwrite it)`);
  }
};
