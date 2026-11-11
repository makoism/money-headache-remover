const { M } = require('/tmp/v25/oracle.js');
const vm = require('vm'), fs = require('fs');
const ctx = vm.createContext({ console, Math, JSON, Date });
vm.runInContext(fs.readFileSync('/home/claude/work/team/model.js', 'utf8') + '\n;this.__X={loanMonthlyFrom,loanTotalFrom,loanPayments,round2};', ctx);
const X = ctx.__X; let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; if (bad < 15) console.log('FAIL', m); } };
let seed = 9; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
for (let i = 0; i < 20000; i++) {
  const total = Math.floor(rnd() * 5e6), k = 1 + Math.floor(rnd() * 24), mo = X.loanMonthlyFrom(total, k);
  ok(mo * k >= total, 'monthly*n covers the total ' + total + ' ' + k); ok(mo * k < total + k, 'overpay less than one unit per month ' + total + ' ' + k);
  ok(X.loanTotalFrom(mo, k) === mo * k, 'total from monthly');
}
ok(X.loanMonthlyFrom(1000, 0) === 0, 'no months'); ok(X.loanMonthlyFrom(-5, 3) === 0, 'negative total'); ok(X.loanPayments('2026-11') === 1, 'one payment when it ends in the first month'); ok(X.loanPayments('2028-10') === 24, '24 payments to the end'); ok(X.loanPayments('2020-01') === 0, 'unknown month');
/* receipts in cents: add 1000 receipts of 0.1 and 0.2, totals must be exact */
const S = M.presetState('$'); const lines = S.plan.lines;
for (let i = 0; i < 1000; i++) { M.addReceipt(S, '2026-11-05', i % 2 ? 0.1 : 0.2, lines[0].key, ''); }
const rs = M.receiptStats(S, '2026-11'); ok(rs.total === 150, 'float-safe receipt total ' + rs.total); ok(rs.count === 1000, 'count');
const k = lines[0].key; ok(rs.byKey[k] === 150, 'byKey ' + rs.byKey[k]);
ok(M.addReceipt(S, '2026-11-05', -3, k, '') === null && M.addReceipt(S, '2026-11-05', 0, k, '') === null && M.addReceipt(S, 'junk', 5, k, '') === null && M.addReceipt(S, '2026-11-05', 1e10, k, '') === null, 'bad receipts rejected');
ok(M.addReceipt(S, '2026-11-05', 12.345, k, '') !== null && M.receiptStats(S, '2026-11').total === 162.35 || M.receiptStats(S, '2026-11').total === 162.34, 'rounding to cents: ' + M.receiptStats(S, '2026-11').total);
console.log(n + ' checks, ' + bad + ' failures');
