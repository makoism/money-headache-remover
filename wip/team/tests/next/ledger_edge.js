/* LEDGER EDGE CASES (tests/next, side N, 2026-11-19): the real ledger, wip/team/ledger.js, on the cases a random list rarely hits,
   on what it refuses, and on real Philippine shapes (side L: PERSONAS_PH.md, PH_ACCOUNTS.md). Made-up numbers only.
     node tests/next/ledger_edge.js        Ends with "LEDGER EDGE PASS" or "... FAIL n".
   After every case the one rule is checked (ledgerProof): Total = the tracked accounts added up, and every "for the card" line
   equals its card. A refused event must leave the saved copy exactly as it was. */
const fs = require('fs'), path = require('path');
const { Report, cents } = require('./lib');
const L = require(process.env.LEDGER_FILE ? path.resolve(process.env.LEDGER_FILE) : path.join(__dirname, '..', '..', 'ledger.js'));
const rep = Report('ledger edge'), J = JSON.stringify, c = cents;
const fresh = (cur, accounts, more) => L.ledgerFresh(Object.assign({ cur, accounts }, more || {}));
const BANK = { id: 'bank', name: 'Bank', type: 'bank' }, CARD = { id: 'card', name: 'Card', type: 'card', payDay: 10 };
const proof = (tag, S) => { const p = L.ledgerProof(S); rep.ok(p.ok, `${tag}: the one rule is broken ${J(p)}`); return L.placesOf(S); };
const add = (tag, S, e, today) => { const r = L.ledgerAdd(S, e, today); rep.ok(!!r, `${tag}: refused ${J(e)} ${J(L.ledgerWhy())}`); return r; };
/* refused, with this reason, and nothing changed */
const refused = (tag, S, code, fn) => { const before = J(S), r = fn(); const w = L.ledgerWhy();
  rep.ok(r === false && w && w.code === code, `${tag}: should be refused with "${code}", got ${J(r && r.code ? r : r === false ? w : 'recorded')}`);
  rep.ok(J(S) === before, `${tag}: a refused step changed the saved copy`); };
const eq = (tag, got, want) => rep.ok(c(got) === c(want), `${tag}: ${got}, expected ${want}`);
const all = (tag, p, want) => { for (const k in want) eq(`${tag} ${k}`, k.includes('.') ? p[k.split('.')[0]][k.split('.')[1]] : p[k], want[k]); };

{ /* an empty ledger */
  const S = fresh('PHP', [BANK, CARD]), p = proof('empty', S);
  all('empty', p, { total: 0, waiting: 0, bills: 0, free: 0, saved: 0, owed: 0, have: 0, 'accounts.bank': 0, 'cards.card': 0 });
  refused('empty undo', S, 'nothing', () => L.ledgerUndo(S)); refused('empty redo', S, 'no-redo', () => L.ledgerRedo(S));
  rep.ok(J(L.periodOf(S, '2028-02-29')) === J({ from: '2028-02-01', to: '2028-03-01' }), 'empty: the calendar month of a leap day');
  all('empty flows', L.flows(S, '2026-01-01', null), { cameIn: 0, wentOut: 0, totalStart: 0, totalEnd: 0 });
  rep.ok(L.ledgerFresh({}) === false && L.ledgerWhy().code === 'setup', 'a setup with no currency is refused');
  rep.ok(L.ledgerFresh({ cur: 'PHP', accounts: [BANK, BANK] }) === false, 'two accounts with one id are refused');
  rep.ok(L.ledgerFresh({ cur: 'PHP', accounts: [{ id: '__proto__', type: 'bank' }] }) === false, 'an account id that would hide coins is refused');
}
{ /* one cent, huge amounts, pesos and yen */
  const S = fresh('PHP', [BANK]);
  add('one cent', S, { k: 'open', acct: 'bank', a: 0.01, date: '2026-11-01' }); all('one cent', proof('one cent', S), { total: 0.01, waiting: 0.01 });
  for (let i = 0; i < 1000; i++) L.ledgerAdd(S, { k: 'in', sub: 'gift', acct: 'bank', a: 0.01, date: '2026-11-02' });
  all('a thousand single cents', proof('cents', S), { total: 10.01 });
  add('huge', S, { k: 'in', sub: 'pay', acct: 'bank', a: 99999999999.99, date: '2026-11-03' }); add('huge', S, { k: 'in', sub: 'pay', acct: 'bank', a: 99999999999.99, date: '2026-11-03' });
  rep.ok(L.ledgerProof(S).total === 2 * 9999999999999 + 1001, 'huge amounts add up to the cent');
  refused('too large', S, 'amount', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1e12, date: '2026-11-03' }));
  refused('three decimals', S, 'amount', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1.005, date: '2026-11-03' }));
  refused('not a number', S, 'amount', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: '1,200', date: '2026-11-03' }));
  refused('zero', S, 'amount-sign', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 0, date: '2026-11-03' }));
  refused('negative spend', S, 'amount-sign', () => L.ledgerAdd(S, { k: 'spend', acct: 'bank', a: -5, place: 'bills', date: '2026-11-03' }));
  refused('units and cents that differ', S, 'amount-two', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 5, c: 501, date: '2026-11-03' }));
  const Y = fresh('JPY', [BANK, { id: 'usd', name: 'Wise', type: 'ewallet', cur: 'USD' }]);
  add('yen', Y, { k: 'open', acct: 'bank', a: 152340, date: '2026-11-01' });
  refused('yen with cents', Y, 'amount-whole', () => L.ledgerAdd(Y, { k: 'spend', acct: 'bank', a: 100.5, place: 'free', date: '2026-11-02' }));
  refused('yen check with cents', Y, 'amount-whole', () => L.ledgerAdd(Y, { k: 'check', acct: 'bank', typedA: 100.5, date: '2026-11-02' }));
  add('dollars keep cents in a yen plan', Y, { k: 'in', sub: 'pay', acct: 'usd', a: 310.25, date: '2026-11-02' });
  refused('yen arriving with cents', Y, 'amount-whole', () => L.ledgerAdd(Y, { k: 'convert', acct: 'usd', acct2: 'bank', a: 300, a2: 45000.5, date: '2026-11-03' }));
  add('convert', Y, { k: 'convert', acct: 'usd', acct2: 'bank', a: 300, a2: 45000, date: '2026-11-03' });
  all('yen', proof('yen', Y), { total: 197340, 'foreign.USD': 10.25 });
  /* money sent abroad: home to another currency leaves Total (the reference model loses this coin) */
  add('convert out', Y, { k: 'convert', acct: 'bank', acct2: 'usd', a: 15000, a2: 100, date: '2026-11-04' });
  all('convert out', proof('convert out', Y), { total: 182340, waiting: 182340, 'foreign.USD': 110.25 });
  refused('convert onto the same account', Y, 'acct-same', () => L.ledgerAdd(Y, { k: 'convert', acct: 'bank', acct2: 'bank', a: 1, a2: 1, date: '2026-11-04' }) || false);
}
{ /* dates: before the opening, the same day, the future, no date */
  const S = fresh('PHP', [BANK, CARD]);
  add('open', S, { k: 'open', acct: 'bank', a: 5000, date: '2026-11-10' });
  refused('before the opening', S, 'before-open', () => L.ledgerAdd(S, { k: 'spend', acct: 'bank', a: 100, place: 'waiting', date: '2026-11-09' }));
  refused('a check before the opening', S, 'before-open', () => L.ledgerAdd(S, { k: 'check', acct: 'bank', typedA: 100, date: '2026-11-09' }));
  refused('a second opening in the same place', S, 'open-twice', () => L.ledgerAdd(S, { k: 'open', acct: 'bank', a: 9, date: '2026-11-10' }));
  refused('a second opening on another day', S, 'open-day', () => L.ledgerAdd(S, { k: 'open', acct: 'bank', a: 9, place: 'trip', date: '2026-11-12' }));
  add('a move has no account, so any day', S, { k: 'move', a: 100, place: 'waiting', place2: 'bills', date: '2026-01-01' });
  add('card spend with no opening', S, { k: 'spend', acct: 'card', a: 300, place: 'bills', date: '2026-11-05' });
  refused('an opening after events', S, 'open-late', () => L.ledgerAdd(S, { k: 'open', acct: 'card', a: 9, date: '2026-11-08' }));
  add('same day 1', S, { k: 'spend', acct: 'bank', a: 200, place: 'waiting', date: '2026-11-10' }); add('same day 2', S, { k: 'spend', acct: 'bank', a: 300, place: 'waiting', date: '2026-11-10' });
  const chk = L.ledgerCheck(S, 'bank', 4500, '2026-11-10'); eq('a check counts every event of its own day', chk.unexplained, 0);
  add('same day, added after the check', S, { k: 'spend', acct: 'bank', a: 50, place: 'waiting', date: '2026-11-10' });
  eq('the check now shows what was added for its day', proof('same day', S).checks.bank.unexplained, 50);
  refused('no date', S, 'no-date', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1 }));
  refused('not a real day', S, 'date', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1, date: '2027-02-29' }));
  refused('the future', S, 'future', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1, date: '2026-11-21' }, '2026-11-20'));
  const e = add('the day passed in is used', S, { k: 'in', acct: 'bank', a: 1 }, '2026-11-20'); rep.ok(e && e.date === '2026-11-20', 'an event with no date takes the day passed in');
  refused('unknown kind', S, 'kind', () => L.ledgerAdd(S, { k: 'gift', acct: 'bank', a: 1, date: '2026-11-20' }));
  refused('unknown account', S, 'acct', () => L.ledgerAdd(S, { k: 'in', acct: 'nope', a: 1, date: '2026-11-20' }));
  refused('spend with no place', S, 'place', () => L.ledgerAdd(S, { k: 'spend', acct: 'bank', a: 1, date: '2026-11-20' }));
  refused('a card line named by hand', S, 'place', () => L.ledgerAdd(S, { k: 'move', a: 1, place: 'waiting', place2: 'card:card', date: '2026-11-20' }));
  refused('repay to a bank', S, 'acct-type', () => L.ledgerAdd(S, { k: 'repay', acct: 'card', acct2: 'bank', a: 1, date: '2026-11-20' }));
  const given = { k: 'in', acct: 'bank', a: 2, date: '2026-11-20' }, was = J(given); L.ledgerAdd(S, given); rep.ok(J(given) === was, 'the event passed in is never changed');
}
{ /* undo and redo */
  const S = fresh('PHP', [BANK]);
  add('first', S, { k: 'open', acct: 'bank', a: 700, date: '2026-11-01' }); add('second', S, { k: 'spend', acct: 'bank', a: 50, place: 'waiting', date: '2026-11-02' });
  const firstId = S.ledger[0].id, before = J(L.placesOf(S));
  rep.ok(!!L.ledgerUndo(S, firstId), 'undo of the first event'); all('first event undone', proof('undo first', S), { total: -50, waiting: -50 });
  rep.ok(!!L.ledgerRedo(S) && J(L.placesOf(S)) === before && S.ledger[0].id === firstId, 'redo puts the first event back in its place');
  L.ledgerUndo(S); const S2 = JSON.parse(J(S)); rep.ok(!!L.ledgerRedo(S2) && J(L.placesOf(S2)) === before, 'redo works on a saved and reopened copy');
  add('a new event', S, { k: 'in', sub: 'gift', acct: 'bank', a: 5, date: '2026-11-03' });
  refused('redo after a new event', S, 'no-redo', () => L.ledgerRedo(S));
  rep.ok(S.removed.length === 1 && S.removed[0].k === 'spend', 'the undone event is kept in S.removed, outside every sum'); all('after', proof('removed', S), { total: 705 });
  refused('undo an id that is not there', S, 'no-id', () => L.ledgerUndo(S, 999));
}
{ /* the check shown is the one with the latest day, not the one added last (a statement imported late holds an older check) */
  const S = fresh('PHP', [BANK]);
  add('open', S, { k: 'open', acct: 'bank', a: 9000, place: 'waiting', date: '2026-09-01' });
  add('spend', S, { k: 'spend', acct: 'bank', a: 1200, place: 'waiting', date: '2026-11-20' });
  L.ledgerCheck(S, 'bank', 7650, '2026-12-09');
  let p = proof('check in December', S); eq('December gap', p.checks.bank.unexplained, -150); rep.ok(p.checks.bank.date === '2026-12-09', 'the December check is shown');
  L.ledgerCheck(S, 'bank', 8600, '2026-10-01', { src: 'stmt:oct:9' });
  p = proof('older check added later', S); eq('still the December gap', p.checks.bank.unexplained, -150); rep.ok(p.checks.bank.date === '2026-12-09', 'an older check added later does not replace the latest day');
  eq('as of October the October check is shown', L.placesOf(S, '2026-10-31').checks.bank.unexplained, -400);
  L.ledgerCheck(S, 'bank', 7800, '2026-12-09');
  p = proof('second check on the same day', S); eq('same day: the one added last', p.checks.bank.unexplained, 0);
  L.ledgerUndo(S); eq('undo brings the first December check back', L.placesOf(S).checks.bank.unexplained, -150);
}
{ /* the bank below zero, check your bank, start fresh */
  const S = fresh('PHP', [BANK, CARD, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false }]);
  add('below zero', S, { k: 'open', acct: 'bank', a: -2400.5, date: '2026-11-01' }); add('card', S, { k: 'open', acct: 'card', a: 1000, date: '2026-11-01' });
  let p = proof('below zero', S); all('below zero', p, { total: -2400.5, waiting: -3400.5, forCards: 1000, owed: 1000, afterCards: -3400.5 }); rep.ok(p.below.includes('waiting'), 'waiting below zero is listed for amber');
  const u = L.ledgerUnexplained(S, 'bank', -2000, '2026-11-05'); eq('preview', u.unexplained, 400.5); rep.ok(S.ledger.length === 2, 'a preview records nothing');
  const acc = L.ledgerAccept(S, 'bank', -2000, '2026-11-05', 'waiting'); eq('accepted', acc.unexplained, 400.5); p = proof('accept', S); all('accept', p, { 'accounts.bank': -2000, total: -2000 }); eq('nothing unexplained after', p.checks.bank.unexplained, 0);
  L.ledgerUndo(S); rep.ok(S.ledger.length === 2, 'the check and its adjust leave together on one undo'); L.ledgerRedo(S); rep.ok(S.ledger.length === 4, 'and come back together');
  refused('start fresh with an account missing', S, 'missing-accounts', () => L.ledgerStartFresh(S, { bank: 100 }, '2027-01-05'));
  refused('start fresh with a bad figure records nothing', S, 'typed', () => L.ledgerStartFresh(S, { bank: 100, card: 'x' }, '2027-01-05'));
  const sf = L.ledgerStartFresh(S, { bank: 51234.56, card: 8820 }, '2027-01-05'); rep.ok(sf && sf.ok, 'start fresh'); p = proof('start fresh', S);
  all('start fresh', p, { 'accounts.bank': 51234.56, 'accounts.card': 8820, total: 51234.56, owed: 8820, forCards: 8820 }); eq('bank explained', p.checks.bank.unexplained, 0); eq('card explained', p.checks.card.unexplained, 0);
}
{ /* cards: refund, pay in two parts, older balance, cash advance, paid from the wallet, a closed account */
  const S = fresh('PHP', [BANK, CARD, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false }, { id: 'old', name: 'Old bank', type: 'bank' }], { mode: 'track' });
  add('open', S, { k: 'open', acct: 'bank', a: 30000, date: '2026-11-01' });
  add('move', S, { k: 'move', a: 10000, place: 'waiting', place2: 'free', date: '2026-11-01' });
  add('card spend', S, { k: 'spend', acct: 'card', a: 4000, place: 'free', date: '2026-11-02' });
  let p = proof('card spend', S); all('card spend', p, { total: 30000, free: 6000, forCards: 4000, owed: 4000, afterCards: 26000 });
  add('refund onto the card', S, { k: 'in', sub: 'refund', acct: 'card', a: 1500, place: 'free', date: '2026-11-03' });
  all('refund', proof('refund', S), { total: 30000, free: 7500, forCards: 2500, owed: 2500 });
  add('pay part one', S, { k: 'repay', acct: 'bank', acct2: 'card', a: 1000, date: '2026-11-10' }); add('pay part two', S, { k: 'repay', acct: 'bank', acct2: 'card', a: 1500, place: 'trip', date: '2026-11-12' });
  all('paid in two parts', proof('two parts', S), { total: 27500, forCards: 0, owed: 0, 'accounts.bank': 27500, free: 7500 });
  add('overpaid', S, { k: 'repay', acct: 'bank', acct2: 'card', a: 200, date: '2026-11-13' }); all('a card in credit', proof('overpaid', S), { forCards: -200, owed: -200, total: 27300 }); L.ledgerUndo(S);
  add('spend again', S, { k: 'spend', acct: 'card', a: 9000, place: 'bills', date: '2026-11-14' });
  const co = L.ledgerCarryOver(S, 'card', 6000, '2026-12-10'); rep.ok(co && co.account.type === 'loan' && co.account.of === 'card', 'an older balance account is made');
  p = proof('older balance', S); all('older balance', p, { forCards: 3000, owed: 9000, 'accounts.card': 3000, total: 27500 }); eq('older line', L.ledgerCardLines(S)[0].older, 6000); eq('new line', L.ledgerCardLines(S)[0].now, 3000);
  add('interest on the older balance', S, { k: 'spend', sub: 'interest', acct: co.account.id, a: 180, place: 'bills', date: '2026-12-11' });
  add('minimum paid', S, { k: 'repay', acct: 'bank', acct2: co.account.id, a: 500, place: 'bills', date: '2026-12-12' });
  all('older balance with interest', proof('interest', S), { owed: 8680, forCards: 3000, total: 27000 });
  L.ledgerUndo(S); L.ledgerUndo(S); L.ledgerUndo(S); rep.ok(L.placesOf(S).owed === 9000 && L.placesOf(S).forCards === 9000, 'carry over is undone as one step');
  add('cash on the card', S, { k: 'borrow', acct: 'bank', acct2: 'card', a: 2000, date: '2026-12-13' }); all('cash advance is set aside at once', proof('cash advance', S), { forCards: 11000, 'accounts.bank': 29500, total: 29500 });
  add('hand', S, { k: 'hand', acct: 'bank', acct2: 'wallet', a: 3000, date: '2026-12-14' }); add('card paid from the wallet', S, { k: 'repay', acct: 'wallet', acct2: 'card', a: 1000, date: '2026-12-15' });
  all('paid from outside Total: the money set aside is free again', proof('wallet pays', S), { forCards: 10000, owed: 10000, total: 26500 });
  /* closing */
  refused('close an account that holds money', S, 'acct-open', () => L.ledgerCloseAccount(S, 'bank', '2026-12-20'));
  rep.ok(!!L.ledgerCloseAccount(S, 'old', '2026-12-20'), 'close an empty account');
  refused('an event after the closing day', S, 'acct-closed', () => L.ledgerAdd(S, { k: 'in', acct: 'old', a: 5, date: '2026-12-21' }));
  add('a late statement line from before it closed', S, { k: 'in', sub: 'gift', acct: 'old', a: 5, date: '2026-12-19' }); all('a closed account still counts', proof('closed', S), { total: 26505 });
  refused('type locked once used', S, 'acct-locked', () => L.ledgerEditAccount(S, 'card', { inFull: false }));
  rep.ok(L.ledgerEditAccount(S, 'card', { name: 'Visa', payDay: 12 }).name === 'Visa', 'a name and pay day can change');
}
{ /* pay: a second income on the same day, months as pay day views, Wallet mode */
  const S = fresh('PHP', [BANK, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false }], { mode: 'wallet', payDays: [10] });
  add('pay', S, { k: 'in', sub: 'pay', acct: 'bank', a: 40000, date: '2026-11-10' }); add('hand', S, { k: 'hand', acct: 'bank', acct2: 'wallet', a: 5000, date: '2026-11-10' });
  add('second income, same day', S, { k: 'in', sub: 'pay', acct: 'gcash', a: 6500, date: '2026-11-10', startsPeriod: false });
  let p = proof('second income', S); all('a second income does not start a new month', p, { free: 5000, wallet: 5000, total: 41500, waiting: 41500 });
  rep.ok(J(L.periodOf(S, '2026-11-10')) === J({ from: '2026-11-10', to: '2026-12-10' }) && J(L.periodOf(S, '2026-11-09')) === J({ from: '2026-10-10', to: '2026-11-10' }), 'the month runs from pay day to pay day');
  all('the month of the pay', L.flows(S, '2026-11-10', '2026-12-10'), { cameIn: 46500, wentOut: 5000, totalStart: 0, totalEnd: 41500 });
  add('a late line from before pay day', S, { k: 'hand', acct: 'bank', acct2: 'wallet', a: 700, date: '2026-11-08' }); eq('handed since pay day goes by day, not by the order added', L.placesOf(S).free, 5000);
  add('free in Wallet mode', S, { k: 'adjust', acct: 'bank', a: 100, date: '2026-11-11' }); p = proof('wallet free', S); all('an adjust with no place lands in Waiting in Wallet mode', p, { waiting: 40900, total: 40900 });
  L.ledgerSetMode(S, 'track'); p = proof('track again', S); all('back in Track the same coin is in Free to spend', p, { free: 100, waiting: 40800, total: 40900 });
  L.ledgerSetPayDays(S, [15, 30]); rep.ok(J(L.periodOf(S, '2027-02-28')) === J({ from: '2027-02-28', to: '2027-03-15' }), 'pay day 30 falls on the last day of February');
  refused('pay day 0', S, 'paydays', () => L.ledgerSetPayDays(S, [0]));
}
{ /* the saved copy: fields from a newer version are kept, a newer copy is never written, a line is logged once */
  const S = fresh('PHP', [Object.assign({ futureField: { x: 1 } }, BANK)]); S.somethingNew = [1, 2];
  const e = add('unknown field', S, { k: 'in', sub: 'pay', acct: 'bank', a: 10, date: '2026-11-01', src: 'stmt:bdo-nov:17', zz: { later: true } });
  const S2 = JSON.parse(J(S)); rep.ok(L.ledgerClean(S2).ok && J(S2.ledger[0].zz) === J({ later: true }) && S2.accounts[0].futureField.x === 1 && J(S2.somethingNew) === '[1,2]', 'fields this version does not know are kept through save, reopen and clean');
  refused('the same statement line again', S, 'already', () => L.ledgerAdd(S, { k: 'in', sub: 'pay', acct: 'bank', a: 10, date: '2026-11-01', src: 'stmt:bdo-nov:17' })); rep.ok(L.ledgerHas(S, 'stmt:bdo-nov:17'), 'ledgerHas finds it');
  add('typed lines may repeat', S, { k: 'in', acct: 'bank', a: 10, date: '2026-11-01', src: 'typed' }); add('typed lines may repeat', S, { k: 'in', acct: 'bank', a: 10, date: '2026-11-01', src: 'typed' });
  const newer = JSON.parse(J(S)); newer.ledgerV = L.LEDGER_V + 1;
  rep.ok(L.ledgerMayWrite(newer) === false && L.ledgerMayWrite(S) === true && L.ledgerMayWrite(null) === true, 'a copy from a newer version must not be written over');
  refused('add to a newer copy', newer, 'newer', () => L.ledgerAdd(newer, { k: 'in', acct: 'bank', a: 1, date: '2026-11-02' })); refused('undo on a newer copy', newer, 'newer', () => L.ledgerUndo(newer));
  rep.ok(L.ledgerClean(newer).code === 'newer', 'clean leaves a newer copy alone');
  const broken = JSON.parse(J(S)); broken.ledger.push({ k: 'in', acct: 'gone', c: 5, date: '2026-11-02', id: 77 }, null, { k: 'spend', acct: 'bank', c: 'x', date: '2026-11-02' }); delete broken.ledgerNext;
  const cl = L.ledgerClean(broken); rep.ok(cl.ok && cl.moved === 3 && broken.ledgerBad.length === 3 && broken.ledger.length === 3, 'events that cannot be read are set aside, kept and not summed'); all('cleaned', proof('cleaned', broken), { total: 30 });
  add('ids carry on after clean', broken, { k: 'in', acct: 'bank', a: 1, date: '2026-11-03' }); rep.ok(new Set(broken.ledger.map(q => q.id)).size === broken.ledger.length, 'ids stay unique');
}
{ /* a real 38.31 saved copy: cfg.bankNow, cfg.bankNowAt, S.cards (coordinator, 2026-11-19) */
  const saved = { v: 1, rev: 5, ui: { cur: '¥' }, cfg: { bankStart: 99999, bankAt: '2026-10-01', bankNow: 152340, bankNowAt: '2026-11-18' },
    cards: [{ id: 'c_a', name: 'Card A', owed: 61200, payDay: 10, at: '2026-11-17' }, { id: 'c_b', name: 'Card B', owed: 23450, payDay: 11 }],
    plan: { goals: [{ id: 'rainy', start: 6100, target: 90000 }, { id: 'trip', start: 2750 }], lines: [] }, receipts: [{ id: 'r1', a: 120 }] };
  const S = L.migrate3831(JSON.parse(J(saved)), '2026-11-20'), p = proof('real 38.31 copy', S);
  all('real 38.31 copy', p, { total: 161190, waiting: 67690, forCards: 84650, saved: 8850, owed: 84650, 'accounts.bank': 152340, 'cards.c_a': 61200, 'burrows.rainy': 6100 });
  rep.ok(S.ledger.every(e => e.k === 'open' && e.src === 'migration') && S.ledger[0].date === '2026-11-18' && S.ledger.find(e => e.acct === 'c_a').date === '2026-11-17', 'only opening balances, on the days they were typed');
  rep.ok(J(Object.assign({}, S.frozen, { frozenAt: undefined })) === J(saved) && S.frozen.frozenAt === '2026-11-20', 'the whole saved copy is frozen unchanged'); rep.ok(!S.accounts[0].confirm && S.accounts.find(a => a.id === 'oldsavings').confirm === true, 'old savings ask to be confirmed');
  const noNow = JSON.parse(J(saved)); delete noNow.cfg.bankNow; delete noNow.cfg.bankNowAt; const S3 = L.migrate3831(noNow, '2026-11-20');
  rep.ok(c(L.placesOf(S3).accounts.bank) === c(99999) && S3.accounts[0].confirm === true, 'without "bank now" the start figure is used and the bank asks to be confirmed');
  const odd = L.migrate3831({ cur: '¥', bankStart: 100.4, cards: [{ name: 'X', owed: 'abc' }], goals: [{ id: 'a b', start: 5 }, null] }, '2026-11-20');
  rep.ok(odd && L.ledgerProof(odd).ok && odd.oldFigures.notes.length === 2 && c(L.placesOf(odd).total) === c(105), 'odd figures never stop the move: they are noted, not guessed');
  rep.ok(L.migrate3831(null, '2026-11-20') === false && L.migrate3831(saved, 'today') === false, 'no copy or no day: refused');
  /* W4 (wiring lane): the old plan's figures are handed over as a third argument, so the frozen copy stays the saved copy byte for byte */
  { const fig = { total: 161190, saved: 8850, free: 0, billsLeft: 600.5 }, S4 = L.migrate3831(JSON.parse(J(saved)), '2026-11-20', fig), fr = JSON.parse(J(S4.frozen)); delete fr.frozenAt;
    rep.ok(J(S4.oldFigures.plan) === J(fig), 'W4 the figures handed over as the third argument are kept to show once');
    rep.ok(J(fr) === J(saved), 'W4 handing the figures over adds no key to the frozen copy');
    fig.total = 1; rep.ok((S4.oldFigures.plan || {}).total === 161190, 'W4 the kept figures are a copy, not the object handed over');
    const withKey = JSON.parse(J(saved)); withKey.planFigures = { total: 7 }; const S5 = L.migrate3831(JSON.parse(J(withKey)), '2026-11-20', { total: 9 }), f5 = JSON.parse(J(S5.frozen)); delete f5.frozenAt;
    rep.ok(J(f5) === J(withKey) && (S5.oldFigures.plan || {}).total === 9, 'W4 a saved copy is frozen whole whatever keys it has, and the third argument is what is shown');
    rep.ok(L.migrate3831(JSON.parse(J(saved)), '2026-11-20').oldFigures.plan === null, 'W4 no figures handed over: none kept');
    const plain = L.migrate3831({ cur: 'PHP', bankStart: 10, planFigures: { bankEnd: 5 } }, '2026-11-20'); rep.ok(plain.oldFigures.plan.bankEnd === 5, 'W4 the plain shape still carries its own planFigures'); }
}

{ /* W3 (wiring lane): a debt of Cards and loans keeps its plan.debts id. Real fields: { id, name, kind, balance, apr, min, extra } */
  const saved = { v: 1, rev: 2, ui: { cur: '₱' }, cfg: { bankNow: 21730.55, bankNowAt: '2026-11-19' }, plan: { lines: [], goals: [], debts: [
    { id: 'd9q3s1', name: 'Home credit', kind: 'loan', balance: 46000, apr: 18.5, min: 2300, extra: 0 },
    { id: 'd9qvk2', name: 'Tita Bing', kind: 'personal', balance: 5000, apr: 0, min: 500, extra: 0 },
    { id: 'bank', name: 'Id already in use', kind: 'loan', balance: 700, apr: 0, min: 0, extra: 0 },
    { id: 'not an id!', name: 'Odd id', kind: 'card', balance: 300, owed: 999, apr: 42, min: 50, extra: 0 }] } };
  const S = L.migrate3831(JSON.parse(J(saved)), '2026-11-20'), p = proof('W3 debts', S), by = id => S.accounts.find(a => a.id === id), of = id => S.accounts.find(a => a.debt === id) || {};
  rep.ok(!!by('d9q3s1') && by('d9q3s1').type === 'loan' && by('d9q3s1').debt === 'd9q3s1' && by('d9q3s1').name === 'Home credit', 'W3 the loan account carries the plan.debts id as its id and in the field debt');
  rep.ok(!!by('d9qvk2') && by('d9qvk2').debt === 'd9qvk2' && by('d9qvk2').kind === 'personal', 'W3 the second debt too, with its kind');
  rep.ok(of('bank').type === 'loan' && of('bank').id !== 'bank' && by('bank').type === 'bank', 'W3 a debt id that is already an account id gets another account id and keeps its own in debt');
  rep.ok(of('not an id!').type === 'loan' && /^[A-Za-z0-9_-]+$/.test(of('not an id!').id || ''), 'W3 a debt id that cannot be an account id is still kept in debt');
  all('W3 debts', p, { owed: 52000, total: 21730.55, 'accounts.d9q3s1': 46000, 'accounts.d9qvk2': 5000 });
  eq('W3 the balance is read from balance, no other name', p.accounts[of('not an id!').id], 300); eq('W3 the debt with a used id', p.accounts[of('bank').id], 700);
  rep.ok(S.oldFigures.notes.length === 0 && S.ledger.every(e => e.src === 'migration'), 'W3 nothing left out');
  rep.ok(new Set(S.accounts.map(a => a.id)).size === S.accounts.length, 'W3 no two accounts share an id');
}

{ /* W1 (wiring lane): a goal of kind "pay off a debt" (ui.gk[id] === 'debt', A3) is a loan of target less paid, never savings */
  const saved = { v: 1, rev: 2, ui: { cur: '₱', gk: { g9sf44: 'debt', g9t6w5: 'travel', gdone: 'debt', gover: 'debt' } }, cfg: { bankNow: 15200, bankNowAt: '2026-11-16' }, plan: { lines: [], goals: [
    { id: 'g9sf44', name: 'Laptop loan', target: 30000, start: 12000 }, { id: 'g9t6w5', name: 'Trip', target: 20000, start: 6100 },
    { id: 'gdone', name: 'All paid', target: 5000, start: 5000 }, { id: 'gover', name: 'Paid more than the target', target: 1000, start: 1500.5 }] } };
  const S = L.migrate3831(JSON.parse(J(saved)), '2026-11-20'), p = proof('W1 debt goal', S), a = S.accounts.find(q => q.goal === 'g9sf44') || {};
  rep.ok(a.type === 'loan' && a.id === 'g9sf44' && a.name === 'Laptop loan', 'W1 the debt goal is a loan account that carries the goal id');
  all('W1 debt goal', p, { owed: 18000, total: 21300, saved: 6100, waiting: 15200, 'accounts.g9sf44': 18000, 'burrows.g9t6w5': 6100 });
  rep.ok(!('g9sf44' in p.burrows) && !('gdone' in p.burrows) && !('gover' in p.burrows), 'W1 what was paid toward a debt is not a burrow: it is not in Saved and not in Total');
  rep.ok(c(p.accounts[(S.accounts.find(q => q.goal === 'gdone') || {}).id]) === 0 && c(p.accounts[(S.accounts.find(q => q.goal === 'gover') || {}).id]) === 0, 'W1 a debt goal paid in full, or past its target, is a loan with nothing owed');
  rep.ok(c(p.accounts.oldsavings) === c(6100) && S.oldFigures.notes.length === 0, 'W1 only real savings sit in the savings account');
  rep.ok(S.ledger.find(e => e.acct === 'g9sf44').date === '2026-11-20' && S.ledger.find(e => e.acct === 'g9sf44').place == null, 'W1 the loan opens on the day of the move and touches no place');
  const plain = L.migrate3831({ cur: 'PHP', bankStart: 100, goals: [{ id: 'd1', kind: 'debt', target: 900, start: 250.25 }, { id: 's1', start: 40 }] }, '2026-11-20');
  all('W1 the plain shape', proof('W1 plain', plain), { owed: 649.75, total: 140, saved: 40 });
  const odd = L.migrate3831({ cur: 'PHP', bankStart: 100, goals: [{ id: 'd1', kind: 'debt', target: 'lots', start: 250 }] }, '2026-11-20');
  rep.ok(c(L.placesOf(odd).owed) === 0 && c(L.placesOf(odd).total) === c(100) && odd.oldFigures.notes.length === 1, 'W1 a debt goal with no usable target is noted and nothing is guessed');
}

{ /* W2 (wiring lane): the sample plan's invented figures never move. The copy cannot say it is still the sample; the page can
     (planIsSample), so the move takes that as an input */
  const saved = { v: 1, rev: 2, ui: { cur: '¥', gk: { car: 'debt' } }, cfg: { bankNow: 87000, bankNowAt: '2026-11-19' }, cards: [{ id: 'c_a', name: 'Card A', owed: 4000, payDay: 10, at: '2026-11-19' }],
    plan: { lines: [], goals: [{ id: 'rainy', name: 'Emergency fund', target: 600000, start: 140000 }, { id: 'car', name: 'Car loan', target: 90000, start: 10000 }], debts: [{ id: 'd1', name: 'Sample loan', kind: 'loan', balance: 50000, apr: 3, min: 1000, extra: 0 }] } };
  const S = L.migrate3831(JSON.parse(J(saved)), '2026-11-20', null, { planIsSample: true }), p = proof('W2 sample', S);
  all('W2 sample', p, { total: 87000, saved: 0, owed: 4000, waiting: 83000, forCards: 4000, 'accounts.bank': 87000, 'accounts.c_a': 4000 });
  rep.ok(Object.keys(p.burrows).length === 0 && S.accounts.length === 2 && !S.accounts.some(a => a.id === 'oldsavings' || a.type === 'loan'), 'W2 still the sample: no burrow, no savings account, no loan; the bank and the cards typed on Home move');
  rep.ok(S.oldFigures.notes.length === 0 && S.oldFigures.sample === true, 'W2 it is recorded that the plan was still the sample, and nothing is listed as left out');
  const fr = JSON.parse(J(S.frozen)); delete fr.frozenAt; rep.ok(J(fr) === J(saved), 'W2 the frozen copy still holds the sample plan, whole');
  const T = L.migrate3831(JSON.parse(J(saved)), '2026-11-20'), q = proof('W2 typed', T);
  all('W2 the same copy when the page says the plan is the person\'s own', q, { total: 227000, saved: 140000, owed: 134000 }); rep.ok(T.oldFigures.sample === false, 'W2 not the sample: recorded as such');
  rep.ok(c(L.placesOf(L.migrate3831(JSON.parse(J(saved)), '2026-11-20', null, { planIsSample: 'yes' })).total) === c(227000), 'W2 only a plain true skips the plan figures');
}

{ /* W5 (wiring lane): a card debt in Cards and loans and a card typed on Home under one name. The same card or two? The copy
     cannot say and the move does not guess: it asks, and until the answer only the card typed on Home counts */
  const saved = { v: 1, rev: 2, ui: { cur: '₱' }, cfg: { bankNow: 31900.75, bankNowAt: '2026-11-19' },
    cards: [{ id: 'k1', name: 'BDO Card', owed: 9200.5, payDay: 10, at: '2026-11-18' }, { id: 'k2', name: 'Visa', owed: 300, payDay: 4, at: '2026-11-18' }],
    plan: { lines: [], goals: [], debts: [{ id: 'd1', name: ' bdo  card', kind: 'card', balance: 68400, apr: 36, min: 3400, extra: 0 }, { id: 'd2', name: 'Visa', kind: 'loan', balance: 1000, apr: 0, min: 0, extra: 0 },
      { id: 'd3', name: 'Metrobank card', kind: 'card', balance: 24750, apr: 42, min: 1200, extra: 0 }, { id: 'd4', name: 'VISA', kind: 'card', balance: 300, apr: 30, min: 50, extra: 0 }] } };
  const mk = () => L.migrate3831(JSON.parse(J(saved)), '2026-11-20'), S = mk(), p = proof('W5 asked', S), qs = S.oldFigures.questions;
  rep.ok(Array.isArray(qs) && qs.length === 2 && qs.every(q => q.code === 'same-card' && q.answer === null), 'W5 two questions: the card debts named like a card typed on Home (spaces and capitals do not matter)');
  rep.ok(J(qs.map(q => [q.debt, q.acct, q.card, q.held, q.cardOwed])) === J([['d1', 'd1', 'k1', 68400, 9200.5], ['d4', 'd4', 'k2', 300, 300]]), 'W5 each question names the debt, its account, the card and both figures');
  all('W5 until answered', p, { owed: 9200.5 + 300 + 1000 + 24750, total: 31900.75, forCards: 9500.5, 'accounts.d1': 0, 'accounts.d4': 0, 'accounts.d2': 1000, 'accounts.d3': 24750 });
  rep.ok(S.accounts.find(a => a.id === 'd1').confirm === true && S.accounts.find(a => a.id === 'd1').debt === 'd1' && !S.accounts.find(a => a.id === 'd3').confirm, 'W5 the waiting debt has its account, marked to be confirmed; a loan named like a card, or a card debt with its own name, is not asked about');
  rep.ok(S.oldFigures.notes.length === 0, 'W5 a question is not a figure left out');
  refused('W5 no such question', S, 'no-question', () => L.ledgerSameCard(S, 'd3', true)); refused('W5 an answer must be yes or no', S, 'no-question', () => L.ledgerSameCard(S, 'd1', 'maybe'));
  const A = mk(); rep.ok(!!L.ledgerSameCard(A, 'd1', true), 'W5 answer: the same card'); const pa = proof('W5 same', A), a1 = A.accounts.find(a => a.id === 'd1');
  all('W5 the same card', pa, { owed: p.owed, total: 31900.75, 'accounts.d1': 0, 'accounts.k1': 9200.5 }); rep.ok(a1.of === 'k1' && !a1.confirm && A.oldFigures.questions[0].answer === 'same' && A.ledger.length === S.ledger.length, 'W5 the same card: owed once, the figure typed on Home stays, the debt account is tied to the card and no event is added');
  rep.ok(L.ledgerCardLines(A).find(l => l.id === 'k1').olderIds.indexOf('d1') >= 0, 'W5 the same card: the debt account is that card\'s older balance line');
  refused('W5 answered once', A, 'no-question', () => L.ledgerSameCard(A, 'd1', false));
  const B = mk(); rep.ok(!!L.ledgerSameCard(B, 'd1', false), 'W5 answer: another card'); const pb = proof('W5 other', B), e = B.ledger[B.ledger.length - 1];
  all('W5 another card', pb, { owed: p.owed + 68400, total: 31900.75, 'accounts.d1': 68400, 'accounts.k1': 9200.5, forCards: 9500.5 });
  rep.ok(e.k === 'open' && e.acct === 'd1' && e.date === '2026-11-20' && e.src === 'migration' && B.oldFigures.questions[0].answer === 'other' && !B.accounts.find(a => a.id === 'd1').confirm && B.oldFigures.questions[1].answer === null, 'W5 another card: the debt opens on the day of the move; the other question still waits');
  const R = JSON.parse(J(S)); rep.ok(L.ledgerClean(R).ok && J(R.oldFigures) === J(S.oldFigures) && !!L.ledgerSameCard(R, 'd4', false) && c(L.placesOf(R).owed) === c(p.owed + 300), 'W5 the question survives saving and loading');
  rep.ok(mk().oldFigures.questions.length === 2 && L.migrate3831({ cur: 'PHP', bankStart: 5 }, '2026-11-20').oldFigures.questions.length === 0, 'W5 questions is always a list');
}

{ /* G4 (money door lane): Wallet mode. Money put back from the wallet lowers "handed out since pay day", by day, never below zero */
  const S = fresh('PHP', [BANK, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'wallet', name: 'Wallet', type: 'wallet' }, { id: 'usd', name: 'Dollars', type: 'bank', cur: 'USD' }], { mode: 'wallet', payDays: [15] });
  add('G4 open', S, { k: 'open', acct: 'bank', a: 30000, date: '2026-11-01' }); add('G4 pay', S, { k: 'in', sub: 'pay', acct: 'bank', a: 20000, date: '2026-11-15' });
  add('G4 hand', S, { k: 'hand', acct: 'bank', acct2: 'wallet', a: 4000, date: '2026-11-15' });
  const back = add('G4 put back', S, { k: 'transfer', acct: 'wallet', acct2: 'bank', a: 1500, date: '2026-11-25' });
  all('G4 put back', proof('G4', S), { free: 2500, wallet: 2500, total: 47500, 'accounts.wallet': 2500, 'accounts.bank': 47500, waiting: 47500 });
  all('G4 as of the day before', L.placesOf(S, '2026-11-24'), { free: 4000, wallet: 4000, total: 46000 });
  const big = add('G4 into the e-wallet', S, { k: 'transfer', acct: 'wallet', acct2: 'gcash', a: 9000, date: '2026-11-26' }); all('G4 more back than handed', proof('G4', S), { free: 0, wallet: 0, total: 56500 });
  add('G4 hand again', S, { k: 'hand', acct: 'gcash', acct2: 'wallet', a: 700, date: '2026-11-27' }); all('G4 a later hand-out counts in full', proof('G4', S), { free: 700 });
  add('G4 late line', S, { k: 'transfer', acct: 'wallet', acct2: 'bank', a: 300, date: '2026-11-10' }); all('G4 put back before pay day does not count since pay day', proof('G4', S), { free: 700 });
  add('G4 same day, added later', S, { k: 'transfer', acct: 'wallet', acct2: 'bank', a: 100, date: '2026-11-27' }); all('G4 same day: in the order added', proof('G4', S), { free: 600 });
  add('G4 bank to e-wallet', S, { k: 'transfer', acct: 'bank', acct2: 'gcash', a: 50, date: '2026-11-28' }); all('G4 a transfer between tracked accounts is not a put-back', proof('G4', S), { free: 600 });
  L.ledgerUndo(S, big.id); all('G4 the large put-back undone', proof('G4', S), { free: 3100 }); L.ledgerRedo(S); all('G4 and redone', proof('G4', S), { free: 600 });
  L.ledgerUndo(S, back.id); all('G4 the first put-back undone: the large one still empties it', proof('G4', S), { free: 600 }); L.ledgerRedo(S);
  L.ledgerAddAccount(S, { id: 'lea', name: 'Lea', type: 'owedToYou' }); add('G4 lent from the wallet', S, { k: 'transfer', acct: 'wallet', acct2: 'lea', a: 250, date: '2026-11-29', place: 'lent' });
  all('G4 lending from the wallet is not a put-back', proof('G4', S), { free: 600, lent: 250 });
  add('G4 next pay', S, { k: 'in', sub: 'pay', acct: 'bank', a: 20000, date: '2026-12-15' }); all('G4 a new pay day starts from nothing handed', proof('G4', S), { free: 0, wallet: 0 });
  L.ledgerSetMode(S, 'track'); all('G4 Track mode: handed is still worked out, Free to spend is the place', L.placesOf(S, '2026-12-01'), { wallet: 600, free: 0 });
}

{ /* G1 (money door lane): one event, two statement lines. A transfer shows on the bank statement and on the e-wallet statement */
  const S = fresh('PHP', [BANK, { id: 'gcash', name: 'GCash', type: 'ewallet' }]);
  add('G1 open', S, { k: 'open', acct: 'bank', a: 9000, date: '2026-12-01' });
  const tr = add('G1 transfer', S, { k: 'transfer', acct: 'bank', acct2: 'gcash', a: 5000, date: '2026-12-05', src: 'stmt:bpi-dec:9' }), sp = add('G1 spend', S, { k: 'spend', acct: 'gcash', a: 120, place: 'waiting', date: '2026-12-06', src: 'typed' });
  rep.ok(typeof L.ledgerAlso === 'function', 'G1 ledgerAlso is there'); const also = L.ledgerAlso || (() => false), before = J(L.placesOf(S));
  const e = also(S, tr.id, 'stmt:gcash-dec:21');
  rep.ok(!!e && e.id === tr.id && J(e.srcs) === J(['stmt:gcash-dec:21']) && e.src === 'stmt:bpi-dec:9', 'G1 the event keeps its first source and lists the second in srcs');
  rep.ok(L.ledgerHas(S, 'stmt:gcash-dec:21') && L.ledgerHas(S, 'stmt:bpi-dec:9') && !L.ledgerHas(S, 'stmt:gcash-dec:22') && J(L.placesOf(S)) === before, 'G1 both lines are known as logged and no figure moved');
  refused('G1 the second line again as a new event', S, 'already', () => L.ledgerAdd(S, { k: 'in', acct: 'gcash', a: 5000, date: '2026-12-06', src: 'stmt:gcash-dec:21' }));
  refused('G1 the same source twice on one event', S, 'already', () => also(S, tr.id, 'stmt:gcash-dec:21')); refused('G1 a source another event holds', S, 'already', () => also(S, sp.id, 'stmt:bpi-dec:9'));
  refused('G1 no such event', S, 'no-id', () => also(S, 999, 'stmt:x:1')); refused('G1 typed is not a source to remember', S, 'src', () => also(S, tr.id, 'typed')); refused('G1 a source must be text', S, 'src', () => also(S, tr.id, 7)); refused('G1 an empty source', S, 'src', () => also(S, tr.id, ''));
  rep.ok(!!also(S, sp.id, 'receipt:r77') && !!also(S, sp.id, 'stmt:gcash-dec:30') && J(sp.srcs) === J(['receipt:r77', 'stmt:gcash-dec:30']) && sp.src === 'typed', 'G1 a line typed by hand can later be tied to its receipt and its statement line');
  refused('G1 a new event that lists a source already logged', S, 'already', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1, date: '2026-12-07', src: 'stmt:bpi-dec:10', srcs: ['receipt:r77'] }));
  refused('G1 srcs must be a list of sources', S, 'src', () => L.ledgerAdd(S, { k: 'in', acct: 'bank', a: 1, date: '2026-12-07', srcs: 'receipt:r78' }));
  const two = add('G1 an event given with two sources at once', S, { k: 'in', sub: 'gift', acct: 'bank', a: 1, date: '2026-12-07', src: 'stmt:bpi-dec:10', srcs: ['receipt:r78', 'typed'] }); rep.ok(L.ledgerHas(S, 'receipt:r78') && !L.ledgerHas(S, 'typed'), 'G1 both are known; typed never counts as logged');
  L.ledgerUndo(S, tr.id); rep.ok(!L.ledgerHas(S, 'stmt:gcash-dec:21') && !L.ledgerHas(S, 'stmt:bpi-dec:9'), 'G1 undone: neither line is logged');
  add('G1 the e-wallet line logged on its own meanwhile', S, { k: 'in', acct: 'gcash', a: 5000, date: '2026-12-06', src: 'stmt:gcash-dec:21' });
  rep.ok(S.removed.some(q => q.id === tr.id && J(q.srcs) === J(['stmt:gcash-dec:21'])), 'G1 the undone transfer is kept with its sources, outside every sum');
  const S2 = fresh('PHP', [BANK, { id: 'gcash', name: 'GCash', type: 'ewallet' }]); add('G1 open', S2, { k: 'open', acct: 'bank', a: 9000, date: '2026-12-01' });
  const t2 = add('G1 transfer', S2, { k: 'transfer', acct: 'bank', acct2: 'gcash', a: 5000, date: '2026-12-05', src: 'stmt:bpi-dec:9' }); also(S2, t2.id, 'stmt:gcash-dec:21');
  L.ledgerUndo(S2); const mid = J(S2); S2.ledger.push({ id: 50, k: 'in', acct: 'gcash', c: 500000, date: '2026-12-06', src: 'stmt:gcash-dec:21' });
  rep.ok(L.ledgerRedo(S2) === false && L.ledgerWhy().code === 'already', 'G1 redo is refused when a second source of the step was logged meanwhile'); S2.ledger.pop(); rep.ok(J(S2) === mid, 'G1 the refused redo changed nothing');
  rep.ok(!!L.ledgerRedo(S2) && L.ledgerHas(S2, 'stmt:gcash-dec:21'), 'G1 redo brings the event back with both sources');
  const R = JSON.parse(J(S2)); rep.ok(L.ledgerClean(R).ok && L.ledgerHas(R, 'stmt:gcash-dec:21') && J(R.ledger) === J(S2.ledger), 'G1 saved, loaded and cleaned: the sources are kept');
  proof('G1', S); proof('G1', S2);
}

/* ===== Philippine shapes (side L). How each is written with the kinds the design has ===== */
{ /* card cut-off day (Mika, thing 8): spent after the cut-off is owed and set aside, but not in the bill due next */
  const S = fresh('PHP', [{ id: 'ub', name: 'UnionBank', type: 'bank' }, { id: 'ubc', name: 'UnionBank card', type: 'card', payDay: 7, cutDay: 17 }]);
  add('bank', S, { k: 'open', acct: 'ub', a: 96400, date: '2026-11-01' }); add('card', S, { k: 'open', acct: 'ubc', a: 9000, date: '2026-11-01' });
  add('before the cut-off', S, { k: 'spend', acct: 'ubc', a: 3480, place: 'waiting', date: '2026-11-12' }); add('after the cut-off', S, { k: 'spend', acct: 'ubc', a: 2600, place: 'waiting', date: '2026-11-18' });
  let d = L.ledgerCardDue(S, 'ubc', '2026-11-19'); all('cut-off', d, { onCard: 15080, due: 12480, later: 2600 }); rep.ok(d.cutoff === '2026-11-17', 'the last statement day');
  all('set aside is everything on the card', proof('cut-off', S), { forCards: 15080, owed: 15080, afterCards: 81320 });
  add('bill paid', S, { k: 'repay', acct: 'ub', acct2: 'ubc', a: 12480, date: '2026-12-07' }); d = L.ledgerCardDue(S, 'ubc', '2026-12-08'); all('after paying the bill', d, { onCard: 2600, due: 0, later: 2600 });
  d = L.ledgerCardDue(S, 'ubc', '2026-12-17'); all('at the next cut-off the rest is due', d, { due: 2600, later: 0 }); proof('cut-off end', S);
}
{ /* an instalment on a card, 0% (Mika's laptop): the months still to come are owed, and this month's part is not counted twice */
  const S = fresh('PHP', [{ id: 'ub', name: 'UnionBank', type: 'bank' }, { id: 'bpic', name: 'BPI card', type: 'card', payDay: 26, cutDay: 5 }, { id: 'laptop', name: 'Laptop on the BPI card', type: 'paylater', of: 'bpic', payDay: 26 }]);
  add('bank', S, { k: 'open', acct: 'ub', a: 96400, date: '2026-11-19' }); add('card, with this month\'s 4,500 inside', S, { k: 'open', acct: 'bpic', a: 31900, date: '2026-11-19' }); add('7 parts still to come', S, { k: 'open', acct: 'laptop', a: 31500, date: '2026-11-19' });
  all('day one', proof('instalment day one', S), { owed: 63400, forCards: 31900, total: 96400, afterCards: 64500 });
  rep.ok(!!L.ledgerInstalment(S, 'laptop', 'bpic', 4500, '2026-12-05'), 'next month\'s part moves onto the card'); all('a part falls due', proof('instalment', S), { owed: 63400, forCards: 36400, 'accounts.laptop': 27000, total: 96400 });
  add('with interest: the add-on is a spend on the plan', S, { k: 'spend', sub: 'interest', acct: 'laptop', a: 67.5, place: 'bills', date: '2026-12-05' }); all('interest', proof('instalment interest', S), { owed: 63467.5, total: 96400 });
  L.ledgerUndo(S); L.ledgerUndo(S); all('one undo takes the part back', proof('instalment undo', S), { forCards: 31900, 'accounts.laptop': 31500 });
}
{ /* paluwagan (Jun and Tess): simple default, then exact */
  const S = fresh('PHP', [{ id: 'bdo', name: 'BDO', type: 'bank' }, { id: 'pal', name: 'Paluwagan', type: 'owedToYou' }, { id: 'palowe', name: 'Paluwagan, rounds left', type: 'loan' }]);
  add('bank', S, { k: 'open', acct: 'bdo', a: 18300, place: 'bills', date: '2026-11-19' });
  add('simple: a bill each round', S, { k: 'spend', sub: 'bill', acct: 'bdo', a: 2000, place: 'bills', date: '2026-11-30' }); add('simple: the pot is other money in', S, { k: 'in', sub: 'other', acct: 'bdo', a: 20000, date: '2027-01-15' });
  all('simple paluwagan', proof('paluwagan simple', S), { total: 36300, waiting: 20000 }); L.ledgerUndo(S); L.ledgerUndo(S);
  for (const day of ['2026-11-30', '2026-12-15', '2026-12-30']) add('exact: put in is still yours', S, { k: 'transfer', sub: 'paluwagan', acct: 'bdo', acct2: 'pal', a: 2000, date: day });
  all('before her turn Total does not move', proof('paluwagan before', S), { total: 18300, 'accounts.pal': 6000 });
  add('her turn: what she put in comes back', S, { k: 'transfer', sub: 'paluwagan', acct: 'pal', acct2: 'bdo', a: 6000, date: '2027-01-15' }); add('and the rest of the pot is owed for the rounds left', S, { k: 'borrow', sub: 'paluwagan', acct: 'bdo', acct2: 'palowe', a: 14000, date: '2027-01-15' });
  add('a round after her turn', S, { k: 'repay', sub: 'paluwagan', acct: 'bdo', acct2: 'palowe', a: 2000, place: 'bills', date: '2027-01-30' });
  all('after her turn', proof('paluwagan after', S), { 'accounts.bdo': 30300, owed: 12000, total: 30300, waiting: 14000 });
}
{ /* 13th month pay (Rina): money in that does not start a new month; a loan paid out of pay before it lands */
  const S = fresh('PHP', [{ id: 'bpi', name: 'BPI', type: 'bank' }, { id: 'wallet', name: 'Wallet', type: 'wallet', tracked: false }, { id: 'sal', name: 'Salary loan', type: 'loan' }], { payDays: [28], mode: 'wallet' });
  add('pay', S, { k: 'in', sub: 'pay', acct: 'bpi', a: 24800, date: '2026-11-27' }); add('hand', S, { k: 'hand', acct: 'bpi', acct2: 'wallet', a: 3000, date: '2026-11-28' });
  add('13th month', S, { k: 'in', sub: 'pay', acct: 'bpi', a: 12830, date: '2026-12-18', startsPeriod: false, note: '13th month' });
  all('13th month pay waits to be placed and starts no new month', proof('13th month', S), { waiting: 34630, free: 3000, total: 34630 });
  add('loan owed', S, { k: 'open', acct: 'sal', a: 9000, date: '2026-12-01' }); add('taken out of pay before it lands: owed falls, no account moves', S, { k: 'adjust', sub: 'paid from pay', acct: 'sal', a: -1500, date: '2026-12-28' });
  all('loan paid from pay', proof('salary loan', S), { owed: 7500, total: 34630 });
}
{ /* the six made-up people of PERSONAS_PH.md: the day one picture, to the peso */
  const D = '2026-11-19', bank = (id, a, burrow) => ({ id, type: 'bank', a, burrow }), ew = (id, a, cur) => ({ id, type: 'ewallet', a, cur }), cash = a => ({ id: 'cash', type: 'cash', a });
  const card = (id, a) => ({ id, type: 'card', a }), owe = (id, type, a) => ({ id, type, a });
  const PEOPLE = [
    { who: 'Bea', accts: [bank('bpi', 42300), bank('ub', 8150), ew('gcash', 3480), cash(1200), ew('wise', 310, 'USD'), card('rcbc', 14600)], want: { have: 55130, owed: 14600, 'foreign.USD': 310 }, after: ['bpi', 27700],
      then: S => { add('Bea brings USD 300 home', S, { k: 'convert', acct: 'wise', acct2: 'bpi', a: 300, a2: 16950, date: '2026-11-20' }); add('Bea moves 5,000 to GCash', S, { k: 'transfer', acct: 'bpi', acct2: 'gcash', a: 5000, date: '2026-11-20' });
        add('Bea sends 8,000 home', S, { k: 'spend', sub: 'family support', acct: 'gcash', a: 8000, place: 'waiting', date: '2026-11-21' }); const r = L.ledgerAccept(S, 'gcash', 230, '2026-11-22'); eq('Bea accepts the GCash gap', r.unexplained, -250); return { have: 63830, 'foreign.USD': 10 }; } },
    { who: 'Carlo', accts: [bank('bdo', 6240), ew('gcash', 910), cash(650), card('mb', 9800), owe('spl', 'paylater', 5430), owe('gg', 'paylater', 15050)], want: { have: 7800, owed: 30280 }, after: ['bdo', -3560],
      then: S => { add('Carlo cashes in', S, { k: 'transfer', acct: 'bdo', acct2: 'gcash', a: 1300, date: '2026-11-19' }); add('GGives part', S, { k: 'repay', acct: 'gcash', acct2: 'gg', a: 2150, place: 'waiting', date: '2026-11-20' });
        add('shoes on SPayLater', S, { k: 'spend', acct: 'spl', a: 2400, place: 'free', date: '2026-11-21' }); return { have: 5650, owed: 30530 }; } },
    { who: 'Mika', accts: [bank('ub', 96400), bank('maya', 150000, 'emergency'), bank('gotyme', 12750, 'trip'), ew('gcash', 2300), cash(3000), card('bpic', 31900), card('ubc', 12480), owe('laptop', 'paylater', 31500)], want: { have: 264450, forCards: 44380, saved: 162750, owed: 75880 }, after: ['ub', 52020] },
    { who: 'Jun and Tess', accts: [bank('landbank', 4870), bank('bdo', 18300), ew('gcash', 1640), cash(7500), card('sb', 6900), owe('hc', 'paylater', 17775)], want: { have: 32310, owed: 24675 }, after: ['bdo', 11400],
      then: S => { add('ATM', S, { k: 'transfer', acct: 'bdo', acct2: 'cash', a: 5000, date: '2026-11-20' }); const r = L.ledgerAccept(S, 'cash', 11950, '2026-11-25'); eq('the cash box is 550 short', r.unexplained, -550); return { have: 31760 }; } },
    { who: 'Rina', accts: [bank('bpi', 1050), ew('gcash', 6720), ew('maya', 500), cash(2400), card('bpic', 3260), owe('gloan', 'loan', 7400), owe('mate', 'loan', 5000)], want: { have: 10670, owed: 15660 },
      then: S => { const r = L.ledgerStartFresh(S, { bpi: 900, gcash: 4100, maya: 500, cash: 1250, bpic: 4150, gloan: 5920, mate: 5000 }, '2026-11-28'); rep.ok(r && r.ok, 'Rina starts fresh after nine days'); return { have: 6750, owed: 15070 }; } },
    { who: 'Dan', accts: [bank('mb', 11900), bank('mari', 20000, 'emergency'), ew('gcash', 1150), cash(800), card('bdoc', 0), owe('bdoold', 'loan', 68400), card('mbc', 24750), owe('bankloan', 'loan', 95900)], want: { have: 33850, owed: 189050, forCards: 24750 }, after: ['mb', -12850],
      then: S => { add('Dan pays 3,400', S, { k: 'repay', acct: 'mb', acct2: 'bdoold', a: 3400, place: 'waiting', date: '2026-12-10' }); add('interest', S, { k: 'spend', sub: 'interest', acct: 'bdoold', a: 1950, place: 'bills', date: '2026-12-20' });
        eq('Dan\'s older balance after interest', L.placesOf(S).accounts.bdoold, 66950); const copy = JSON.parse(J(S)); rep.ok(J(L.placesOf(copy)) === J(L.placesOf(S)), 'Dan\'s new phone shows the same'); return { owed: 187600, have: 30450 }; } },
  ];
  for (const P of PEOPLE) {
    const S = fresh('PHP', P.accts.map(a => { const o = { id: a.id, name: a.id, type: a.type }; if (a.cur) o.cur = a.cur; return o; }));
    P.accts.forEach(a => add(P.who + ' types ' + a.id, S, { k: 'open', acct: a.id, a: a.a, date: D, place: a.burrow || 'waiting' }));
    let p = proof(P.who, S); all(P.who + ' day one', p, P.want); eq(P.who + ' Total is the money they have', p.total, P.want.have);
    if (P.after) eq(`${P.who}: ${P.after[0]} after the cards are paid`, c(p.accounts[P.after[0]]) / 100 - p.forCards, P.after[1]);
    if (P.then) { const want = P.then(S); p = proof(P.who + ' later', S); all(P.who + ' later', p, want); }
    const S2 = JSON.parse(J(S)); while (S2.ledger.length) L.ledgerUndo(S2); all(P.who + ' with everything undone', proof(P.who + ' undone', S2), { total: 0, owed: 0 });
  }
}
rep.end();
