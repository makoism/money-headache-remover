/* A balance set through the assistant keeps its cents (decision 1: cents kept, yen whole). ui4a.js rounded it to a whole unit. Made-up numbers.
   Run: node tests/qc/v1_asst_cents.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R;
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  const run = cur => p.evaluate(cur => { __t.S.ui.cur = cur; const A = window.__asst; if (!A) return 'no hook'; const chk = A.asstCheck({ actions: [{ do: 'set_balance', amount: 1640.55 }] });
    const T = JSON.parse(JSON.stringify(__t.S)); A.runActions(T, chk.steps || chk.out || chk); return T.cfg.bankStart; }, cur);
  const usd = await run('$'), yen = await run('¥');
  ck('dollars: the assistant sets 1640.55, cents kept (' + usd + ')', usd === 1640.55, usd);
  ck('yen: whole yen (' + yen + ')', yen === 1641, yen);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(bad ? 'V1 ASST CENTS FAIL ' + bad : 'V1 ASST CENTS PASS'); process.exit(bad ? 1 : 0);
})();
