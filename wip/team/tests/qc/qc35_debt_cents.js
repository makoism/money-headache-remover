/* Foundation stage 0 (premortem saved-data 3): cleanDebts rounded a debt's balance, minimum and extra payment to whole units on every load,
   so typed cents were lost each time the page opened. Cents are kept (decision 1: cents everywhere). Run: node tests/qc/qc35_debt_cents.js */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.MODEL || path.join(__dirname, '..', '..', 'model.js'), 'utf8');
const M = new Function(src + '; return { cleanDebts };')();
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const d = M.cleanDebts([{ id: 'd1', name: 'Card', kind: 'card', balance: 1234.56, apr: 18, min: 50.25, extra: 10.5 }], new Set(), new Set())[0] || {};
ck('balance keeps its cents', d.balance === 1234.56, d.balance);
ck('minimum keeps its cents', d.min === 50.25, d.min);
ck('extra keeps its cents', d.extra === 10.5, d.extra);
const again = M.cleanDebts([d], new Set(), new Set())[0] || {};
ck('a second load changes nothing', again.balance === 1234.56 && again.min === 50.25 && again.extra === 10.5, JSON.stringify(again));
const neg = M.cleanDebts([{ id: 'd2', name: 'x', balance: -5, min: 'a', extra: NaN }], new Set(), new Set())[0] || {};
ck('bad values still become 0', neg.balance === 0 && neg.min === 0 && neg.extra === 0, JSON.stringify(neg));
console.log(bad ? 'qc35_debt_cents: ' + bad + ' FAIL' : 'qc35_debt_cents: ALL PASS'); process.exit(bad ? 1 : 0);
