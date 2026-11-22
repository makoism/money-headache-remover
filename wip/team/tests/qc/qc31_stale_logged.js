/* QC round 11 data safety polish 2: after a backup was loaded, Receipts still said "Logged ¥2,222: Free to spend." for a receipt the backup
   had just replaced. When numbers are replaced (backup, cloud copy, reset), a "Logged ..." line from before is cleared.
   Made-up numbers. Run: node tests/qc/qc31_stale_logged.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 300)); if (!c) bad++; };
const L = require('./lib_r12.js'), w = L.R.w;
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await L.zero(p); await L.base(p, {});
  const backup = await p.evaluate(() => JSON.stringify(__t.S));
  const m0 = await L.rc(p, 2222, 'envelope');
  ck('the receipt is logged ("Logged ...")', /^Logged/.test((m0 || '').trim()), m0);
  await w(9000);   /* past the Undo bar, so the line is on screen */
  await L.settings(p);
  await p.evaluate(g => { const t = document.getElementById('bk'); t.value = g; t.dispatchEvent(new Event('input', { bubbles: true })); }, backup); await w(200);
  await p.evaluate(() => document.getElementById('bkLoad').click()); await w(800);
  await p.evaluate(() => document.getElementById('bkLoad').click()); await w(900);
  const n = await p.evaluate(() => (__t.S.receipts || []).length);
  ck('the backup replaced the numbers (no receipts)', n === 0, n);
  await L.tab(p, 'tab-receipts'); await w(500);
  const m1 = await p.evaluate(() => [(document.getElementById('rcMsg') || {}).textContent || '', (document.getElementById('hMsg') || {}).textContent || '']);
  ck('Receipts and Home no longer say "Logged ¥2,222"', !/Logged/.test(m1.join(' ')), m1);
  ck('no page errors', errs.length === 0, errs);
  await b.close(); console.log(bad ? 'qc31_stale_logged: ' + bad + ' FAIL' : 'qc31_stale_logged: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc31_stale_logged: FAIL'); process.exit(1); });
