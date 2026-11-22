/* QC round 10 north-star F3: on a new phone, right after the cloud copy was loaded by its code from the welcome screen, Settings said
   "Off. Your numbers live on this device only." until a reload or the next change. It says On at once. A made-up server (cloud_lib.js),
   two browser profiles, taps and typing only.  Run: node tests/qc/qc28_cloud_on_loaded.js */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x === undefined ? '' : JSON.stringify(x))); if (!c) bad++; };
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]'); const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(async () => srv.st.puts >= 1);
  ck('A made a cloud copy', /MHR-/.test(code) && srv.st.puts >= 1, code);
  const D = await C.profile(srv.url, { tour: true });
  ck('the welcome screen offers the code', !!(await until(() => seen(D.p, '#tourRestoreBtn'), 6000)));
  await tap(D.p, '#tourRestoreBtn'); await D.p.type('#tourVaultIn', code); await tap(D.p, '#tourVaultUse');
  await until(() => seen(D.p, '#tourVaultLoad')); await tap(D.p, '#tourVaultLoad');
  await until(async () => /Made-up noodles/.test(await D.p.evaluate(() => JSON.stringify(__t.S.receipts))), 8000);
  await C.skipTour(D.p); await w(800);
  await L.settings(D.p); await w(600);
  const st = await text(D.p, '#vaultState');
  ck('right after loading, Settings says the cloud copy is on', /^On\b/.test(st) && !/Off/.test(st), st);
  ck('...and does not offer to start a new cloud copy', !(await seen(D.p, '#vaultOn')));
  ck('no page errors', A.errs.concat(D.errs).length === 0, A.errs.concat(D.errs));
  await A.b.close(); await D.b.close(); srv.close();
  console.log(bad ? 'qc28_cloud_on_loaded: ' + bad + ' FAIL' : 'qc28_cloud_on_loaded: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('qc28_cloud_on_loaded: FAIL'); process.exit(1); });
