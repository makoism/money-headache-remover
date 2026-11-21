/* QC round 5 data safety B1: phone B with its own numbers loads A's cloud copy, is reloaded, then taps Undo on the kept-copy bar. Undo
   must do what the Undo right after the load does: B gets exactly its own numbers back, B stops sharing A's cloud copy, and nothing is
   sent over A's copy (it showed B's receipt plus A's two, still shared, and sent the mix). Settings > Put them back must do the same.
   Two browser profiles and a made-up server on this machine (cloud_lib.js), made-up numbers.
   Run: node tests/qc/qc12_cloud_undo_reload.js      Ends with "qc12_cloud_undo_reload: ALL PASS" or "n FAIL". */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 500)); } };
const receipts = p => p.evaluate(() => __t.S.receipts.map(r => r.a + ':' + (r.n || '')).sort().join('|'));
const sharing = p => p.evaluate(() => { try { return !!JSON.parse(localStorage.getItem('mhr-vault') || 'null'); } catch (e) { return null; } });
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles'); await L.rc(A.p, 99, 'envelope', null, 'Made-up tea');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(4000);
  for (const how of ['undo bar', 'Put them back']) {
    const tag = '[' + how + ']';
    const B = await C.profile(srv.url);
    await L.rc(B.p, 700, 'envelope', null, 'Made-up own spend on B');
    await B.p.evaluate(() => { __t.persist(); }); await w(1500);
    const own = await receipts(B.p);
    await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
    await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse'); await until(() => seen(B.p, '#vaultLoad')); await tap(B.p, '#vaultLoad');
    await until(async () => /Made-up noodles/.test(await receipts(B.p)));
    ck(tag + ' B: Load brought A\'s receipts', /Made-up noodles/.test(await receipts(B.p)));
    await w(6000);
    await B.p.reload(); await w(4000);
    const puts0 = srv.st.puts;
    if (how === 'undo bar') { await until(() => seen(B.p, '#undoGo')); ck(tag + ' B: after the reload the Undo bar is offered', await tap(B.p, '#undoGo')); }
    else { await L.settings(B.p); await until(() => seen(B.p, '#keepBack')); ck(tag + ' B: Settings offers Put them back', await tap(B.p, '#keepBack')); }
    await w(1500);
    const r = await receipts(B.p);
    ck(tag + ' B: exactly its own receipts are back', r === own, { r, own });
    ck(tag + ' B: no longer shares A\'s cloud copy', (await sharing(B.p)) === false);
    await w(8000);
    ck(tag + ' nothing was sent over A\'s cloud copy', srv.st.puts === puts0, { before: puts0, after: srv.st.puts });
    await B.p.reload(); await w(4000);
    ck(tag + ' B: after another reload still its own receipts', (await receipts(B.p)) === own);
    const D = await C.profile(srv.url);
    await L.settings(D.p); await until(() => seen(D.p, '#vaultHave')); await tap(D.p, '#vaultHave');
    await D.p.type('#vaultIn', code); await tap(D.p, '#vaultUse'); await until(() => seen(D.p, '#vaultLoad'));
    const said = await D.p.evaluate(() => document.getElementById('vaultFlow').innerText);
    ck(tag + ' the cloud copy still has A\'s 2 receipts', /has 2 receipts/.test(said), said.slice(0, 300));
    const errs = B.errs.concat(D.errs).filter(e => !/status of 409/.test(e));
    ck(tag + ' no page errors', errs.length === 0, errs.slice(0, 3));
    await B.b.close(); await D.b.close();
  }
  await A.b.close(); srv.close();
  console.log(bad ? `qc12_cloud_undo_reload: ${bad} FAIL` : 'qc12_cloud_undo_reload: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc12_cloud_undo_reload: FAIL'); process.exit(1); });
