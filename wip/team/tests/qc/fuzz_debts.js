/* Cards and loans, extra money, limits, look back and repeating spending on thousands of random plans.
   Run: node tests/qc/fuzz_debts.js [count] [seed]      Ends with "DEBTS FUZZ PASS" or "DEBTS FUZZ FAIL n". */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(process.env.MODEL || path.join(__dirname, '..', '..', 'model.js'), 'utf8');
const M = new Function(src + '; return { MONTHS, presetState, calcAll, jarsOf, debtRows, debtStep, debtProject, addExtraMoney, limitsOf, lookBack, applyRecurring, cleanPlan, cleanDebts, cleanRecurring, addReceipt, setVal, val, receiptStats, statusOf, debtsOf, goalById, capOf, readyBy }')();
let seed = +(process.argv[3] || 777), N = +(process.argv[2] || 3000);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[ri(0, a.length - 1)], chance = p => rnd() < p;
let fails = 0, checks = 0;
const ok = (id, c, msg) => { checks++; if (!c) { fails++; if (fails <= 40) console.log('FAIL', id, msg); } };
const fin = x => typeof x === 'number' && isFinite(x);
for (let t = 0; t < N; t++) {
  const S = M.presetState(pick(['₱', '¥', '$']), false), id = '#' + t;
  const nd = ri(0, 5); S.plan.debts = [];
  for (let i = 0; i < nd; i++) S.plan.debts.push({ id: 'd' + i, name: 'D' + i, kind: pick(['card', 'loan', 'personal']), balance: pick([0, 1, 500, ri(1, 5000), ri(1000, 900000), 1e9]), apr: pick([0, 0, 1.5, 12, 24, 36, 60, 100]), min: pick([0, 1, 50, ri(0, 5000), ri(0, 100000)]), extra: pick([0, 0, 100, ri(0, 20000)]) });
  if (!S.plan.debts.length) delete S.plan.debts;
  /* cleaning keeps what is valid and never invents */
  const cl = M.cleanPlan(JSON.parse(JSON.stringify(S.plan)), {});
  ok(id, JSON.stringify(cl.debts || []) === JSON.stringify(S.plan.debts || []), 'cleanPlan changes valid debts');
  const dirty = M.cleanDebts([{ id: '<x>', balance: 5 }, { id: 'a', name: 5, balance: -3, apr: 1e6, min: NaN, extra: 'x', kind: 'zzz' }, null, { id: 'a' }, { id: 'b', balance: 12.6, apr: -4 }]);
  ok(id, dirty.length === 2 && dirty[0].balance === 0 && dirty[0].apr === 100 && dirty[0].min === 0 && dirty[0].kind === 'loan' && dirty[1].balance === 12.6 &&  dirty[1].apr === 0, 'cleanDebts of junk ' + JSON.stringify(dirty));   /* 12.6 keeps its cents since the foundation stage 0 (decision 1); it was rounded to 13 before */
  for (let i = 0; i < ri(0, 6); i++) { const ym = pick(M.MONTHS), d = pick(S.plan.debts || [{ id: 'zz' }]); M.setVal(S, 'debt:' + d.id, ym, pick([0, 100, ri(0, 50000)]), pick(['once', 'after'])); }
  const C = M.calcAll(S), eq = (m, a, b) => ok(id + ' ' + m, a === b, a + ' vs ' + b);
  const bal = {}; (S.plan.debts || []).forEach(d => { bal[d.id] = d.balance; });
  C.months.forEach(m => {
    const tag = id + ' ' + m.ym; let pay = 0, intr = 0;
    (S.plan.debts || []).forEach(d => {
      const x = m.debts[d.id], b0 = bal[d.id], extra = M.val(S, 'debt:' + d.id, m.ym);
      eq(tag + ' start ' + d.id, x.start, b0);
      eq(tag + ' interest', x.interest, b0 > 0 ? Math.round(b0 * d.apr / 1200) : 0);
      eq(tag + ' pay', x.pay, Math.min(b0 + x.interest, d.min + extra));
      eq(tag + ' bal', x.bal, b0 + x.interest - x.pay);
      ok(tag, x.bal >= 0 && x.pay >= 0 && x.pay <= b0 + x.interest && Number.isInteger(x.pay) && Number.isInteger(x.bal), 'range ' + JSON.stringify(x));
      if (b0 === 0) ok(tag, x.pay === 0 && x.interest === 0 && x.bal === 0, 'a paid debt stays paid');
      bal[d.id] = x.bal; pay += x.pay; intr += x.interest;
    });
    eq(tag + ' debtPay', m.debtPay, pay); eq(tag + ' debtInterest', m.debtInterest, intr);
    eq(tag + ' owed', m.debtOwed, (S.plan.debts || []).reduce((a, d) => a + bal[d.id], 0));
    /* the jars still add up to 100 and money out is still every part */
    const J = M.jarsOf(S, m), tot = J.list.reduce((a, j) => a + j.pct, 0) + J.restPct;
    ok(tag, m.inflow <= 0 || J.income <= 0 || tot === 100 || tot === 0, 'percents ' + tot);
    eq(tag + ' out', m.out, m.jar.nec + m.jar.play + m.jar.edu + m.jar.ffa + m.jar.give + m.goalsTotal);
    eq(tag + ' bank', m.bankEnd, m.bankStart + m.left);
  });
  /* rows: payoff month is where the balance reaches 0; a rate with no way out is flagged */
  const rows = M.debtRows(S, C);
  rows.forEach(r => {
    const d = S.plan.debts.find(x => x.id === r.id), last = C.months[C.months.length - 1].debts[r.id];
    if (r.payoffYm && M.MONTHS.indexOf(r.payoffYm) >= 0) ok(id, C.byYm[r.payoffYm].debts[r.id].bal === 0, 'payoff month balance ' + r.payoffYm);
    if (d.balance === 0) ok(id, r.done && !r.never, 'zero balance is done');
    if (r.never) ok(id, last.bal > 0, 'never but paid');
    ok(id, fin(r.totalInterest) && r.totalInterest >= 0 && r.totalPaid >= 0, 'totals');
  });
  ok(id, rows.filter(r => r.first).length <= 1, 'one first');
  /* extra money: the month's left changes only by what stays in the bank */
  if (!C.months[0].debts || true) {
    const ym = pick(M.MONTHS), a = pick([1, 100, 5000, ri(1, 90000)]);
    const dests = [{ t: 'bank' }, { t: 'play' }, { t: 'ffa' }].concat(S.plan.goals.filter(g => g.target > 0).map(g => ({ t: 'goal', id: g.id })), (S.plan.debts || []).map(d => ({ t: 'debt', id: d.id })));
    const dest = pick(dests), before = JSON.parse(JSON.stringify(S)), L0 = C.byYm[ym].left;
    const res = M.addExtraMoney(S, ym, a, dest);
    if (res) {
      const C2 = M.calcAll(S);
      ok(id, res.placed + res.toBank === a && res.placed >= 0 && res.toBank >= 0, 'extra split ' + JSON.stringify(res));
      ok(id, C2.byYm[ym].inflow === C.byYm[ym].inflow + a || C.byYm[ym].inflow + a > 1e9, 'inflow rises by the amount');
      /* what was placed is spent in that month, so left rises only by what was not placed (goals fill up to their room) */
      ok(id, C2.byYm[ym].left === L0 + res.toBank || (dest.t === 'goal'), 'left after extra: ' + C2.byYm[ym].left + ' vs ' + (L0 + res.toBank) + ' ' + JSON.stringify(dest) + JSON.stringify(res));
      /* the other months are not touched (except balances that carry on: debts and goals) */
      if (dest.t === 'bank' || dest.t === 'play' || dest.t === 'ffa') M.MONTHS.filter(x => x !== ym).forEach(x => ok(id, C2.byYm[x].left === C.byYm[x].left || x > ym, 'earlier month changed ' + x));
    }
  }
  /* limits and last month add up to the receipts */
  const ym = pick(M.MONTHS); (S.receipts = S.receipts || []);
  for (let i = 0; i < ri(0, 8); i++) M.addReceipt(S, ym + '-' + ('0' + ri(1, 28)).slice(-2), ri(1, 99999) / 100, pick(S.plan.lines.map(l => l.key).concat(['other'])), '');
  const C3 = M.calcAll(S), L = M.limitsOf(S, C3, ym), rs = M.receiptStats(S, ym);
  const spentRows = L.rows.reduce((a, r) => a + r.spent, 0) + L.other;
  const nonRow = S.plan.lines.filter(l => !L.rows.some(r => r.key === l.key)).reduce((a, l) => a + (rs.byKey[l.key] || 0), 0);
  ok(id, Math.abs(spentRows + nonRow - rs.total) < 0.011, 'limits cover all receipts: ' + (spentRows + nonRow) + ' vs ' + rs.total);
  L.rows.forEach(r => ok(id, Math.abs(r.left - (r.planned - r.spent)) < 0.006 && r.over === (r.left < 0), 'limit row ' + JSON.stringify(r)));
  const lb = M.lookBack(S, C3, ym);
  ok(id, lb.count === rs.count && Math.abs(lb.logged - rs.total) < 0.006 && lb.bankEnd === C3.byYm[ym].bankEnd, 'lookBack matches');
  /* repeating spending: never twice, never before its start, never more than 60 at once */
  S.plan.recurring = [{ id: 'r1', a: ri(1, 500), c: pick(S.plan.lines.map(l => l.key)), n: '', every: pick(['week', 'month']), on: 0, from: pick(['2026-11-02', '2027-01-10', '2028-03-05']), last: '' }];
  const r = S.plan.recurring[0]; r.on = r.every === 'week' ? ri(0, 6) : ri(1, 28);
  const today = pick(['2026-11-30', '2027-06-15', '2028-10-31']), n0 = S.receipts.length;
  const n1 = M.applyRecurring(S, today), n2 = M.applyRecurring(S, today);
  ok(id, (n1 >= 60 || n2 === 0) && S.receipts.length === n0 + n1 + n2, 'applying twice adds nothing new (n1 ' + n1 + ' n2 ' + n2 + ')');
  ok(id, new Set(S.receipts.slice(n0).map(x => x.d)).size === S.receipts.length - n0, 'no day logged twice');
  ok(id, S.receipts.slice(n0).every(x => x.d >= r.from && x.d <= today), 'repeat dates inside the range');
  ok(id, n1 <= 60 && n2 <= 60, 'at most 60 a time');
}
console.log('plans', N, '| checks', checks, '| fails', fails);
console.log(fails ? 'DEBTS FUZZ FAIL ' + fails : 'DEBTS FUZZ PASS'); process.exit(fails ? 1 : 0);
