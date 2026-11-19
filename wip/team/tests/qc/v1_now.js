/* LAUNCH_CHECKLIST.md A1 (storage) and A5 (simple form), on the model. Mako's shape with made-up numbers: one bank, two cards paid in full
   on the 10th and 11th, pay on the 10th. Run: node tests/qc/v1_now.js     Ends with "V1 NOW PASS" or "V1 NOW FAIL n".
   A1  The balance typed as "bank now" (on the 19th, after pay landed and some bills were paid) is stored apart from bankStart (the bank at
       the start of the first month): no planned figure changes, so nothing already past this month is counted twice.
   A5  What is on each card now is typed with its date and pay day; "bank after the cards are paid" = bank now - everything on the cards,
       worked out in the model (nowOf). Cards here are pay-in-full cards, never the interest-bearing debts in Cards and loans. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.MODEL || path.join(__dirname, '..', '..', 'model.js'), 'utf8');
const M = new Function(src + `; return { MONTHS, presetState, calcAll, viewOf, cleanCfg, setBankNow: typeof setBankNow !== 'undefined' ? setBankNow : null, nowOf: typeof nowOf !== 'undefined' ? nowOf : null, cleanCards: typeof cleanCards !== 'undefined' ? cleanCards : null }; `)();
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const S = M.presetState('¥', false), ym = M.MONTHS[0];
S.cfg.bankStart = 150000; S.cfg.bankAt = '2026-11-01';
const before = JSON.stringify(M.viewOf(S, M.calcAll(S), ym, '2026-11-19').map);
ck('the model has setBankNow, nowOf and cleanCards', !!(M.setBankNow && M.nowOf && M.cleanCards));
if (M.setBankNow) M.setBankNow(S, 212345.5, new Date(2026, 10, 19));
ck('A1 bank now is stored apart: bankStart stays 150,000 (' + S.cfg.bankStart + ')', S.cfg.bankStart === 150000 && S.cfg.bankAt === '2026-11-01');
ck('A1 bank now and its date are stored (' + S.cfg.bankNow + ', ' + S.cfg.bankNowAt + ')', S.cfg.bankNow === 212345.5 && S.cfg.bankNowAt === '2026-11-19');
ck('A1 typing bank now changes no planned figure', JSON.stringify(M.viewOf(S, M.calcAll(S), ym, '2026-11-19').map) === before);
const c2 = M.cleanCfg(JSON.parse(JSON.stringify(S.cfg)));
ck('A1 bank now and its date survive a save and load', c2.bankNow === 212345.5 && c2.bankNowAt === '2026-11-19', JSON.stringify(c2));
ck('A1 a minus bank now is kept (overdrawn)', M.cleanCfg({ bankNow: -50.25, bankNowAt: '2026-11-19' }).bankNow === -50.25);
ck('A1 a broken bank now is dropped', M.cleanCfg({ bankNow: 'abc', bankNowAt: 'yesterday' }).bankNow === undefined && M.cleanCfg({ bankNowAt: 'yesterday' }).bankNowAt === undefined);
S.cards = M.cleanCards ? M.cleanCards([{ id: 'k1', name: 'Card A', owed: 48200.75, payDay: 10, at: '2026-11-19' }, { id: 'k2', name: 'Card B', owed: 12000, payDay: 11, at: '2026-11-18' }]) : [];
const N = M.nowOf ? M.nowOf(S) : {};
ck('A5 two cards kept with what is on them, pay day and date', S.cards.length === 2 && S.cards[0].owed === 48200.75 && S.cards[1].payDay === 11 && S.cards[0].at === '2026-11-19', JSON.stringify(S.cards));
ck('A5 cards owed in all = 60,200.75 (' + N.cardsOwed + ')', N.cardsOwed === 60200.75);
ck('A5 bank after the cards are paid = bank now - cards (' + N.afterCards + ')', N.afterCards === 152144.75);
ck('A5 nowOf says the bank figure is the typed bank now, with its date', N.bank === 212345.5 && N.bankAt === '2026-11-19');
ck('A5 cards change no planned figure (they are not Cards and loans)', JSON.stringify(M.viewOf(S, M.calcAll(S), ym, '2026-11-19').map) === before);
ck('A5 broken card rows are dropped or cleaned', M.cleanCards([{ id: 'x', name: '', owed: -5, payDay: 40 }, 'junk', { id: 'y', name: 'Ok', owed: '12', payDay: 0 }]).every(c => c.owed >= 0 && (c.payDay === null || (c.payDay >= 1 && c.payDay <= 31))));
const S0 = M.presetState('¥', false); S0.cfg.bankStart = 90000; S0.cfg.bankAt = '2026-11-02';
const N0 = M.nowOf ? M.nowOf(S0) : {};
ck('A1 with no bank now typed, the bank figure is the balance typed in setup, with its date', N0.bank === 90000 && N0.bankAt === '2026-11-02' && N0.afterCards === 90000);
const S1 = M.presetState('¥', false); delete S1.cfg.bankAt;
ck('A1 with no date anywhere, nowOf says there is no bank figure yet', M.nowOf ? M.nowOf(S1).bank === null : false);
console.log(bad ? 'V1 NOW FAIL ' + bad : 'V1 NOW PASS'); process.exit(bad ? 1 : 0);
