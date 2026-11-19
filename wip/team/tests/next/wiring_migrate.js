/* WIRING STEP 5 (the move, E5): real 38.31 saved copies through migrate3831. Side P, 2026-11-19.
   Run: node wip/team/tests/next/wiring_migrate.js [-v]        (under a second; no page needed)
   Fixtures: tests/next/fixtures/wiring/*.json, made by wiring_make_fixtures.js from the real model.js and ui0.js of the v1 branch.
   Refresh them from the v1 candidate with one command, then run this again:
       node wip/team/tests/next/wiring_make_fixtures.js <git ref of the candidate>
   It FAILS on any field it cannot read:
     1. every key under cfg, cards[], plan.goals[], plan.debts[], ui (the money ones) and the top level of the saved copy must be
        listed below by name as READ (a typed figure the move must carry) or KNOWN (not a typed balance; stays with the plan).
        A renamed or new field is a failure until someone decides which list it belongs to.
     2. every figure in the fixture's "typed" block (written by the fixture maker from its own inputs) must be found again in the
        new ledger, to the cent, in the account or place it belongs to, and nothing else may arrive.
   The gaps of LANE_ledger_wiring.md "Gaps in ledger.js" are fixed (ledger core, third pass): this must PASS, and it is run by
   ledger_core_all.sh. */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'ledger.js'));
const DIR = path.join(__dirname, 'fixtures', 'wiring'), VERBOSE = process.argv.includes('-v');
const J = v => JSON.parse(JSON.stringify(v)), same = (a, b) => JSON.stringify(a) === JSON.stringify(b), c = v => Math.round(v * 100);

/* ---- the field lists. READ: the move carries it. KNOWN: looked at, on purpose not moved (it is not a typed balance) ---- */
const FIELDS = {
  top:   { READ: ['cfg', 'cards', 'plan', 'ui'], KNOWN: ['v', 'rev', 'steps', 'once', 'items', 'receipts'] },   /* M5: old receipts stay as history; steps, once, items are the plan */
  cfg:   { READ: ['bankNow', 'bankNowAt', 'bankStart', 'bankAt'],
           KNOWN: ['minBank', 'ceiling', 'aims', 'loanLast', 'redirectLoan', 'moveMonth', 'carDue', 'moveTarget', 'moveStart', 'travelTarget', 'travelStart', 'carTarget', 'carStart', 'rainyStart', 'rainyTarget', 'rainyStretch'] },
  cards: { READ: ['id', 'name', 'owed', 'payDay', 'at'], KNOWN: [] },
  goals: { READ: ['id', 'start', 'target'], KNOWN: ['name', 'due', 'slot', 'monthly', 'why', 'emergency', 'stretch', 'stretchOn'] },   /* target is read for a debt goal only: owed = target - start */
  debts: { READ: ['id', 'name', 'kind', 'balance'], KNOWN: ['apr', 'min', 'extra'] },                                                 /* rate and payments stay with the plan */
  ui:    { READ: ['cur', 'gk', 'preset', 'cleared', 'freeMode', 'payDays'], KNOWN: null },                                            /* KNOWN null: other ui keys are screen state, not listed one by one */
};

let pass = 0, fail = 0; const fails = [];
const ok = (cond, fx, what, more) => { if (cond) { pass++; if (VERBOSE) console.log('  ok   ' + fx + ': ' + what); } else { fail++; fails.push(fx + ': ' + what + (more ? '  [' + more + ']' : '')); } return !!cond; };

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => /\.json$/.test(f)).sort() : [];
if (files.length < 6) { console.log('FAIL: fewer than 6 fixtures in ' + DIR + '. Run: node wip/team/tests/next/wiring_make_fixtures.js'); process.exit(1); }

for (const f of files) {
  const fx = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')), n = fx.name, saved = fx.saved, T = fx.typed, today = fx.today;

  /* 1. no field the script does not know by name */
  const unknown = (obj, list, where) => Object.keys(obj || {}).filter(k => list.READ.indexOf(k) < 0 && (list.KNOWN === null || list.KNOWN.indexOf(k) < 0)).map(k => where + '.' + k);
  let unk = unknown(saved, FIELDS.top, 'saved').concat(unknown(saved.cfg, FIELDS.cfg, 'cfg'));
  (saved.cards || []).forEach(x => { unk = unk.concat(unknown(x, FIELDS.cards, 'cards[]')); });
  ((saved.plan || {}).goals || []).forEach(x => { unk = unk.concat(unknown(x, FIELDS.goals, 'plan.goals[]')); });
  ((saved.plan || {}).debts || []).forEach(x => { unk = unk.concat(unknown(x, FIELDS.debts, 'plan.debts[]')); });
  Object.keys(saved.plan || {}).forEach(k => { if (['lines', 'goals', 'debts', 'recurring'].indexOf(k) < 0) unk.push('plan.' + k); });
  unk = unk.filter((k, i, a) => a.indexOf(k) === i);
  ok(!unk.length, n, 'every saved field is listed as READ or KNOWN', unk.join(', '));

  /* 2. the move */
  /* whether the plan is still the untouched sample is not in the copy; the page works it out (planIsSample) and hands it over */
  const more = { planIsSample: T.sampleOnly === true };
  const before = JSON.stringify(saved), S = L.migrate3831(J(saved), today, null, more);
  if (!ok(S && typeof S === 'object', n, 'migrate3831 gives a ledger', L.ledgerWhy() && L.ledgerWhy().why)) continue;
  ok(JSON.stringify(saved) === before, n, 'the saved copy is not changed by the move');
  const P = L.placesOf(S), proof = L.ledgerProof(S), acct = id => S.accounts.find(a => a.id === id), opens = id => S.ledger.filter(e => e.k === 'open' && e.acct === id);
  ok(proof.ok, n, 'the one rule holds (Total = accounts, each card line = its card)', JSON.stringify(proof));
  ok(S.oldFigures && Array.isArray(S.oldFigures.notes) && S.oldFigures.notes.length === 0, n, 'nothing was left out (oldFigures.notes is empty)', S.oldFigures && JSON.stringify(S.oldFigures.notes));
  ok(S.ledger.every(e => e.src === 'migration' && e.date <= today), n, 'every event is from the move and dated on or before the day of the move');
  ok(S.ui.cur === T.cur, n, 'the currency is carried');

  /* the bank */
  const bank = acct('bank'), bo = opens('bank');
  ok(!!bank && bank.type === 'bank', n, 'there is a bank account');
  if (T.bank === null) {
    ok(bo.length === 0 && c(P.accounts.bank || 0) === 0, n, 'no bank figure typed: the bank opens with nothing, never a sample figure', JSON.stringify(bo));
    ok(bank && bank.confirm === true, n, 'no bank figure typed: the first check asks for it (confirm)');
  } else {
    ok(c(P.accounts.bank) === c(T.bank), n, 'the bank figure typed is in the bank, to the cent', P.accounts.bank + ' vs ' + T.bank);
    ok(bo.length === 1 && bo[0].date === (T.bankAt || today), n, 'the bank opens on the day it was typed (the day of the move when the copy has no day)', bo.map(e => e.date).join());
    ok(bank && (bank.confirm === true) === (T.bankKind !== 'now'), n, 'only a figure typed as "bank now" is taken without asking again', 'kind ' + T.bankKind + ', confirm ' + (bank && bank.confirm));
  }

  /* cards paid in full */
  T.cards.forEach(k => {
    const a = acct(k.id);
    if (!ok(!!a && a.type === 'card' && a.inFull === true, n, 'card ' + k.name + ' arrives as a card paid in full under its own id')) return;
    ok(a.name === k.name && a.payDay === k.payDay, n, 'card ' + k.name + ' keeps its name and pay day', a.name + ', ' + a.payDay);
    ok(c(P.accounts[k.id]) === c(k.owed) && c(P.cards[k.id]) === c(k.owed), n, 'card ' + k.name + ': what is on it, and the same amount set aside for it', P.accounts[k.id] + ' / ' + P.cards[k.id] + ' vs ' + k.owed);
    ok(opens(k.id).length === 1 && opens(k.id)[0].date === k.at, n, 'card ' + k.name + ' opens on the day it was typed');
  });
  ok(S.accounts.filter(a => a.type === 'card' && a.inFull).length === T.cards.length, n, 'no card paid in full that the person did not type');

  /* burrows: only starts a person typed */
  const wantB = {}; T.burrows.filter(b => b.start > 0).forEach(b => { wantB[b.id] = b.start; });
  const gotB = {}; Object.keys(P.burrows).forEach(k => { if (c(P.burrows[k]) !== 0) gotB[k] = P.burrows[k]; });
  ok(same(Object.keys(gotB).sort().map(k => [k, c(gotB[k])]), Object.keys(wantB).sort().map(k => [k, c(wantB[k])])), n,
    'the burrows hold exactly the goal starts the person typed (no sample figure, no debt goal)', 'got ' + JSON.stringify(gotB) + ' want ' + JSON.stringify(wantB));

  /* what is owed: Cards and loans (plan.debts), and debt goals (A3) */
  const carries = (a, id) => a.id === id || Object.keys(a).some(k => k !== 'name' && a[k] === id);
  T.loans.forEach(d => {
    const a = S.accounts.find(q => L.placesOf(S).accounts[q.id] !== undefined && ['loan', 'card', 'paylater'].indexOf(q.type) >= 0 && q.name === d.name);
    if (!ok(!!a, n, 'debt "' + d.name + '" (' + d.kind + ') arrives as an owed account')) return;
    ok(c(P.accounts[a.id]) === c(d.owed), n, 'debt "' + d.name + '": plan.debts[].balance is what is owed, to the cent', P.accounts[a.id] + ' vs ' + d.owed);
    ok(!(a.type === 'card' && a.inFull), n, 'debt "' + d.name + '" is not a card paid in full (nothing is set aside for it)');
    ok(carries(a, d.id), n, 'debt "' + d.name + '": the account can be traced to plan.debts[].id (' + d.id + '), so the plan and the ledger name the same debt', 'account ' + JSON.stringify(a));
  });
  T.debtGoals.forEach(g => {
    const a = S.accounts.find(q => ['loan', 'paylater'].indexOf(q.type) >= 0 && carries(q, g.id));
    ok(!!a && c(P.accounts[a.id]) === c(g.owed), n, 'debt goal "' + g.name + '" arrives as a loan of target less paid (' + g.owed + '), traced to the goal id', a ? String(P.accounts[a.id]) : 'no owed account carries ' + g.id);
  });
  const owedWant = T.cards.reduce((t, k) => t + c(k.owed), 0) + T.loans.reduce((t, d) => t + c(d.owed), 0) + T.debtGoals.reduce((t, g) => t + c(g.owed), 0);
  ok(c(P.owed) === owedWant, n, 'Owed is the cards, the debts and the debt goals, each once', P.owed + ' vs ' + owedWant / 100);
  const totalWant = c(T.bank || 0) + Object.keys(wantB).reduce((t, k) => t + c(wantB[k]), 0);
  ok(c(P.total) === totalWant, n, 'Total is the bank figure plus the typed goal starts, nothing else', P.total + ' vs ' + totalWant / 100);
  ok(c(P.waiting) === c(T.bank || 0) - T.cards.reduce((t, k) => t + c(k.owed), 0), n, 'Waiting is the bank less what is set aside for the cards (M1)', String(P.waiting));

  /* the first screen the ledger takes over: the v1 Home "now" block must read the same the moment after the move */
  if (fx.homeNow.bank !== null) {
    ok(c(P.accounts.bank) === c(fx.homeNow.bank) && c(P.forCards) === c(fx.homeNow.cardsOwed), n, 'Home now block: the bank and the cards read the same as v1 showed');
    ok(c(P.accounts.bank) - c(P.forCards) === c(fx.homeNow.afterCards), n, 'Home now block: "bank after the cards are paid" = that bank less the card lines, as v1 showed');
  }

  /* the frozen copy and the old figures */
  const fr = J(S.frozen || {}); ok(fr.frozenAt === today, n, 'the frozen copy says when it was frozen'); delete fr.frozenAt;
  ok(same(fr, saved), n, 'the frozen copy is the saved copy, whole and unchanged');
  ok(S.oldFigures && S.oldFigures.shownOnce === false, n, 'the old figures are still to be shown once');
  const figures = { total: 1234.5, saved: 600, free: 34.5, billsLeft: 600 };
  const withFig = J(saved); withFig.planFigures = figures; const S2 = L.migrate3831(withFig, today, null, more), S3 = L.migrate3831(J(saved), today, figures, more);
  const got = [S2, S3].find(q => q && q.oldFigures && same(q.oldFigures.plan, figures));
  ok(!!got, n, 'the old plan figures the page hands over are kept to show once');
  if (got) { const f2 = J(got.frozen); delete f2.frozenAt; ok(same(f2, saved), n, 'handing over the old plan figures does not change the frozen copy', 'extra keys: ' + Object.keys(f2).filter(k => !(k in saved)).join()); }

  /* safe to store and load */
  ok(same(L.migrate3831(J(saved), today, null, more), S), n, 'the move gives the same ledger every time');
  ok(S.oldFigures.sample === T.sampleOnly, n, 'the ledger records whether the plan was still the sample');
  const R = J(S), cl = L.ledgerClean(R);
  ok(cl.ok && cl.moved === 0 && same(L.placesOf(R), P), n, 'stored and loaded again, every figure is the same');
  ok(L.ledgerMayWrite(S) === true && S.ledgerV === L.LEDGER_V, n, 'the ledger carries its version number');
}

fails.forEach(x => console.log('FAIL ' + x));
console.log((fail ? 'FAIL' : 'PASS') + ' wiring_migrate: ' + files.length + ' saved 38.31 copies, ' + (pass + fail) + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
