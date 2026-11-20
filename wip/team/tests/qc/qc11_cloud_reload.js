/* QC round 4 data safety blocker 1: on a device that already had a saved plan (the sample after Finish later, or its own), Settings >
   Cloud copy > I have a code > Load showed A's numbers, but a reload brought the device's old plan back (its second copy had a higher
   revision and won), and that old plan was then sent over A's cloud copy. After a load the numbers stay loaded after a reload, and the
   cloud copy keeps A's receipts. Two browser profiles and a made-up server on this machine (cloud_lib.js), made-up numbers.
   Run: node tests/qc/qc11_cloud_reload.js      Ends with "qc11_cloud_reload: ALL PASS" or "n FAIL". */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 500)); } };
const receipts = p => p.evaluate(() => JSON.stringify(__t.S.receipts));
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles'); await L.rc(A.p, 99, 'envelope', null, 'Made-up tea');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(4000);
  for (const own of [false, true]) {
    const tag = own ? '[own plan]' : '[sample plan]';
    const B = await C.profile(srv.url);   /* Finish later: the sample plan is saved on this device */
    if (own) await L.rc(B.p, 700, 'envelope', null, 'Made-up own spend on B');
    await B.p.evaluate(() => { __t.persist(); }); await w(1500);
    await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
    await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse'); await until(() => seen(B.p, '#vaultLoad')); await tap(B.p, '#vaultLoad');
    await until(async () => /Made-up noodles/.test(await receipts(B.p)));
    ck(tag + ' B: Load brought A\'s receipts', /Made-up noodles/.test(await receipts(B.p)));
    await w(8000);
    await B.p.reload(); await w(4000);
    const r = await receipts(B.p);
    ck(tag + ' B: after a reload A\'s numbers are still there', /Made-up noodles/.test(r) && /Made-up tea/.test(r), r.slice(0, 300));
    await w(5000);
    /* the cloud copy still has A's receipts: a third phone finds 2 receipts in it */
    const D = await C.profile(srv.url);
    await L.settings(D.p); await until(() => seen(D.p, '#vaultHave')); await tap(D.p, '#vaultHave');
    await D.p.type('#vaultIn', code); await tap(D.p, '#vaultUse'); await until(() => seen(D.p, '#vaultLoad'));
    const said = await D.p.evaluate(() => document.getElementById('vaultFlow').innerText);
    ck(tag + ' a third phone finds A\'s 2 receipts in the cloud copy', /has 2 receipts/.test(said), said.slice(0, 300));
    const errs = B.errs.concat(D.errs).filter(e => !/status of 409/.test(e));
    ck(tag + ' no page errors', errs.length === 0, errs.slice(0, 3));
    await B.b.close(); await D.b.close();
  }
  await A.b.close(); srv.close();
  console.log(bad ? `qc11_cloud_reload: ${bad} FAIL` : 'qc11_cloud_reload: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_cloud_reload: FAIL'); process.exit(1); });
