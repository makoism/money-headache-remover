/* QC round 6 north-star gate 3: phone B loaded A's cloud copy and changed nothing, yet B sent it back as a new version; A was then told
   "Newer copy in the cloud" with Load it highlighted, and Load it dropped A's latest change (a card added after B's load). A phone that
   only loaded sends nothing, and A is not offered B's copy.  Two browser profiles and a made-up server (cloud_lib.js), made-up numbers.
   Run: node tests/qc/qc12_load_no_send.js */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(4000);
  for (const how of ['Settings', 'welcome']) {
  const puts0 = srv.st.puts;
  /* B: a fresh phone loads A's copy and changes nothing (from Settings, then from the welcome screen as in the report) */
  const B = how === 'welcome' ? await C.profile(srv.url, { tour: true }) : await C.profile(srv.url);
  if (how === 'welcome') {
    await until(() => seen(B.p, '#tourRestoreBtn'), 6000); await tap(B.p, '#tourRestoreBtn'); await B.p.type('#tourVaultIn', code);
    await B.p.focus('#tourVaultIn'); await B.p.keyboard.press('Enter'); await until(() => seen(B.p, '#tourVaultLoad')); await tap(B.p, '#tourVaultLoad'); await w(2500);
    await C.skipTour(B.p);
  } else {
    await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
    await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse'); await until(() => seen(B.p, '#vaultLoad')); await tap(B.p, '#vaultLoad');
  }
  await until(async () => /Made-up noodles/.test(await B.p.evaluate(() => JSON.stringify(__t.S.receipts))));
  await w(3000); await B.p.evaluate(() => { const d = document.querySelector('#vaultFlow [data-vf-done], #vaultFlow button'); d && d.click(); }); await w(1500);
  await L.tab(B.p, 'tab-home'); await w(6000);
  ck(how + ': B sent nothing after only loading', srv.st.puts === puts0, { before: puts0, after: srv.st.puts });
  /* A adds a receipt after B's load, then checks the cloud */
  /* A adds a card after B's load, as in the report, and a receipt */
  await L.rc(A.p, 77, 'envelope', null, 'Made-up later on A ' + how); await w(6000);
  await A.p.reload(); await w(5000);
  const homeA = await A.p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  ck(how + ': A is not told there is a newer copy', !/Newer copy in the cloud|newer copy in the cloud/.test(homeA), (homeA.match(/.{0,80}ewer copy.{0,80}/) || [''])[0]);
  ck(how + ': A keeps its later receipt', new RegExp('Made-up later on A ' + how).test(await A.p.evaluate(() => JSON.stringify(__t.S.receipts))));
  const errs = A.errs.concat(B.errs).filter(e => !/status of 409/.test(e));
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await B.b.close(); }
  await A.b.close(); srv.close();
  console.log(bad ? `qc12_load_no_send: ${bad} FAIL` : 'qc12_load_no_send: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc12_load_no_send: FAIL'); process.exit(1); });
