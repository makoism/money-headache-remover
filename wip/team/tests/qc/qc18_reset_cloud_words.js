/* QC round 7 data safety, confusing 1: Settings "Reset and setup" said "They're saved in this browser only and nobody else sees them."
   while the cloud copy was on. With the cloud copy on it says the locked cloud copy has them too; with it off, the old sentence stays.
   A made-up server (cloud_lib.js), made-up numbers. Run: node tests/qc/qc18_reset_cloud_words.js */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const OFF = 'These are your numbers and you can change them any time. They\'re saved in this browser only and nobody else sees them.';
const ON = 'These are your numbers and you can change them any time. They\'re saved in this browser and in your locked cloud copy. Nobody else can read them.';
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await A.p.evaluate(() => { __t.S.ui.setup = true; delete __t.S.ui.cleared; __t.persist(); __t.restructure(); });
  await L.settings(A.p); await w(500);
  const off = await text(A.p, '#makeCap');
  ck('cloud copy off: the old sentence stays', off === OFF, off);
  await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn'); await tap(A.p, '#vaultFlow [data-vf-next]');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(1500);
  const now = await text(A.p, '#makeCap');
  ck('cloud copy just turned on: the words change without leaving Settings', now === ON, now);
  await L.tab(A.p, 'tab-home'); await L.settings(A.p); await w(500);
  const on = await text(A.p, '#makeCap');
  ck('cloud copy on: says the locked cloud copy has them too', on === ON, on);
  await A.p.reload(); await w(3000); await C.skipTour(A.p); await L.settings(A.p); await w(500);
  const on2 = await text(A.p, '#makeCap');
  ck('cloud copy on after a reload: same words', on2 === ON, on2);
  await tap(A.p, '#vaultOff'); await w(700);
  if (await A.p.evaluate(() => !!localStorage.getItem('mhr-vault'))) { await tap(A.p, '#vaultOff'); await w(700); }
  await L.tab(A.p, 'tab-home'); await L.settings(A.p); await w(500);
  const off2 = await text(A.p, '#makeCap'), still = await A.p.evaluate(() => !!localStorage.getItem('mhr-vault'));
  ck('cloud copy turned off: the old sentence comes back', !still && off2 === OFF, { still, off2 });
  ck('no page errors', A.errs.length === 0, A.errs.slice(0, 3));
  await A.b.close(); srv.close();
  console.log(bad ? `qc18_reset_cloud_words: ${bad} FAIL` : 'qc18_reset_cloud_words: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc18_reset_cloud_words: FAIL'); process.exit(1); });
