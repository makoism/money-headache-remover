/* QC round 10 money accuracy blocker 2: a debt burrow asked for "Total owed" with "What you still owe in total", then "Already paid off",
   so typing 50,000 and 10,000 read as owing 50,000 but was counted as owing 40,000. The total is now the whole debt before any payments.
   And the toast after adding one said "full Oct 2027"; a debt is "paid off Oct 2027". Reads the source, then adds a debt burrow in the page.
   Run: BUILD=/abs/money-map-team.html node tests/qc/qc28_debt_words.js */
const fs = require('fs'), d = __dirname + '/../../';
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 300)); if (!c) bad++; };
const src = ['ui45s.js', 'ui6.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
ck('no "What you still owe in total"', !/What you still owe in total/.test(src));
ck('the debt total says it is the whole debt before any payments', /The whole debt, before any payments\./.test(src));
const L = require('./lib_r12.js'), w = L.R.w;
(async () => {
  process.env.BUILD = process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html';
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.evaluate(() => { const t = document.getElementById('tab-goals') || document.getElementById('tab-month'); t && t.click(); }); await w(500);
  await p.evaluate(() => document.getElementById('addGoalBtn').click()); await w(500);
  const page = await p.evaluate(() => document.querySelector('.gw-chips') ? document.querySelector('.gw-chips').innerText : '');
  ck('the debt choice is offered', /Pay off a debt/.test(page), page);
  await p.evaluate(() => [...document.querySelectorAll('[data-kind]')].find(b => /Pay off a debt/.test(b.textContent)).click()); await w(300);
  await p.evaluate(() => { const n = document.getElementById('gwName'); n.value = 'Made-up loan'; n.dispatchEvent(new Event('input', { bubbles: true })); });
  const toasts = [];
  for (let i = 0; i < 6; i++) {
    await p.evaluate(() => { const c = document.getElementById('gwCost'); if (c && !c.value) { c.value = '50000'; c.dispatchEvent(new Event('input', { bubbles: true })); } const s = document.getElementById('gwSaved'); if (s && !s.value) { s.value = '10000'; s.dispatchEvent(new Event('input', { bubbles: true })); } });
    const t = await p.evaluate(() => { const n = document.querySelector('#gw [data-gwnext]'); if (!n || !n.getClientRects().length) return null; n.click(); return n.textContent.trim(); });
    await w(500); const msg = await p.evaluate(() => (document.getElementById('cheer') || {}).textContent || ''); if (/Goal added/.test(msg)) toasts.push(msg);
    if (!t) break;
  }
  const tm = toasts.join(' ');
  ck('the goal was added', /Goal added/.test(tm), tm);
  ck('the toast does not call a debt "full"', !/: full /.test(tm), tm);
  ck('if it names a month it says "paid off"', !/Made-up loan:/.test(tm) || /Made-up loan: paid off /.test(tm), tm);
  ck('no page errors', errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e)).length === 0, errs);
  await b.close();
  console.log(bad ? 'qc28_debt_words: ' + bad + ' FAIL' : 'qc28_debt_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc28_debt_words: FAIL'); process.exit(1); });
