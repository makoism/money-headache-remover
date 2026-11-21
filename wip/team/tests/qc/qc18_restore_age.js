/* QC round 7 data safety, confusing 3 (the part with one right answer): the Restore confirm said "replaces your pay, bills, goals and
   receipts with this copy" without saying how old the backup is or what is in it. Now: "Tap again: replaces your numbers here with the
   backup from 21 Nov, which has 1 receipt. You can undo for 3 days." The date is the backup's own saved time (rev); a backup with no
   time leaves the date out. The flow is unchanged: the second tap loads it. Made-up numbers. Run: node tests/qc/qc18_restore_age.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const L = require('./lib_r12.js'), R = L.R, w = R.w;
const REV = new Date(new Date().getFullYear(), 10, 21, 15, 11, 5).getTime();   /* 21 Nov this year */
const OLD = new Date(new Date().getFullYear() - 1, 2, 4, 9, 0, 0).getTime();   /* 4 Mar last year */
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await L.rc(p, 1234, 'envelope', null, 'Made-up here');
  const base = await p.evaluate(() => JSON.parse(JSON.stringify(__t.S)));
  const rc = n => Array.from({ length: n }, (_, i) => ({ id: 'm' + i, d: '2026-11-0' + (i + 1), a: 10 + i, c: 'envelope', n: 'Made-up ' + i }));
  const arm = async d => {
    await L.settings(p); await w(300);
    await p.evaluate(t => { const ta = document.getElementById('bk'); ta.value = t; ta.dispatchEvent(new Event('input', { bubbles: true })); }, JSON.stringify(d));
    await p.evaluate(() => { const b = document.getElementById('bkLoad'); b.scrollIntoView({ block: 'center' }); b.click(); }); await w(200);
    return p.evaluate(() => document.getElementById('bkLoad').textContent);
  };
  const yr = new Date(OLD).getFullYear();
  const cases = [
    ['from 21 Nov with 1 receipt', Object.assign({}, base, { rev: REV, receipts: rc(1) }), 'Tap again: replaces your numbers here with the backup from 21 Nov, which has 1 receipt. You can undo for 3 days.'],
    ['from 21 Nov with 2 receipts', Object.assign({}, base, { rev: REV, receipts: rc(2) }), 'Tap again: replaces your numbers here with the backup from 21 Nov, which has 2 receipts. You can undo for 3 days.'],
    ['no receipts in it', Object.assign({}, base, { rev: REV, receipts: [] }), 'Tap again: replaces your numbers here with the backup from 21 Nov, which has no receipts. You can undo for 3 days.'],
    ['from last year: the year is said', Object.assign({}, base, { rev: OLD, receipts: rc(1) }), `Tap again: replaces your numbers here with the backup from 4 Mar ${yr}, which has 1 receipt. You can undo for 3 days.`],
    ['no saved time: no date', Object.assign({}, base, { rev: undefined, receipts: rc(1) }), 'Tap again: replaces your numbers here with the backup, which has 1 receipt. You can undo for 3 days.'],
  ];
  for (const [name, d, want] of cases) {
    const got = await arm(d);
    ck('the confirm says how old the backup is and what is in it: ' + name, got === want, got);
    await w(4300);   /* the confirm goes back by itself; nothing was loaded */
    const n = await p.evaluate(() => __t.S.receipts.length);
    ck('one tap loads nothing: ' + name, n === base.receipts.length, n);
  }
  /* the second tap still loads it */
  await arm(Object.assign({}, base, { rev: REV, receipts: rc(2) })); await w(800);
  await p.evaluate(() => document.getElementById('bkLoad').click()); await w(900);
  const after = await p.evaluate(() => ({ n: __t.S.receipts.map(r => r.n), msg: document.getElementById('bkMsg').textContent }));
  ck('the second tap loads the backup', JSON.stringify(after.n) === JSON.stringify(['Made-up 0', 'Made-up 1']) && after.msg === 'Loaded.', after);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
  console.log(bad ? `qc18_restore_age: ${bad} FAIL` : 'qc18_restore_age: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc18_restore_age: FAIL'); process.exit(1); });
