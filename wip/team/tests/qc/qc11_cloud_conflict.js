/* QC round 4, north-star gate 5 (data safety): two phones share one cloud copy. Phone B still holds an older copy; when B changes
   something, it must not send over the newer copy phone A sent in the meantime. Settings promises "If both changed the app asks which
   to keep". Each send names the cloud revision this phone last loaded or sent (base); the server refuses a send whose base is not the
   copy it holds, and the page asks. Two browser profiles and a made-up server on this machine (cloud_lib.js), made-up numbers.
   Run: node tests/qc/qc11_cloud_conflict.js      Ends with "qc11_cloud_conflict: ALL PASS" or "n FAIL". */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 500)); } };
const receipts = p => p.evaluate(() => JSON.stringify(__t.S.receipts));
const held = st => { const ids = Object.keys(st.store); return ids.length ? st.store[ids[0]] : null; };
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1);
  ck('A: cloud copy on, first copy sent', srv.st.puts >= 1 && /^MHR-/.test(code), code);

  /* phone B loads that copy */
  const B = await C.profile(srv.url);
  await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
  await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse'); await until(() => seen(B.p, '#vaultLoad')); await tap(B.p, '#vaultLoad');
  await until(async () => /Made-up noodles/.test(await receipts(B.p)));
  ck('B: loaded A\'s copy', /Made-up noodles/.test(await receipts(B.p)));
  await B.p.evaluate(() => { const c = document.getElementById('setClose'); c && c.click(); }); await w(300);

  /* A changes something and it is sent */
  let p0 = srv.st.puts;
  await L.tab(A.p, 'tab-home'); await w(300);
  await L.rc(A.p, 555, 'envelope', null, 'Made-up later spend on A');
  await until(() => srv.st.puts > p0, 12000);
  const revA = held(srv.st).rev;
  ck('A: its later change reached the cloud copy', srv.st.puts > p0);

  /* B, still on the older copy, changes something: it must not be sent over A's change */
  p0 = srv.st.puts;
  await L.tab(B.p, 'tab-home'); await w(300);
  await L.rc(B.p, 777, 'envelope', null, 'Made-up spend on B');
  await w(6000);
  ck('B: its send did not replace the newer cloud copy', held(srv.st).rev === revA && srv.st.puts === p0, { held: held(srv.st).rev, revA, puts: srv.st.puts, p0 });
  await L.settings(B.p); await w(500);
  const said = await B.p.evaluate(() => document.body.innerText);
  ck('B: Settings asks which copy to keep (Load the newer copy / Keep mine)', await seen(B.p, '#vaultLoadNewer') && await seen(B.p, '#vaultKeepMine'), said.match(/.{0,80}cloud.{0,120}/g));
  ck('B: Settings no longer says the cloud copy has everything on this device', !/The cloud copy has everything on this device/.test(said));

  /* A's next change still goes through: A was not the stale one */
  p0 = srv.st.puts;
  await L.rc(A.p, 222, 'envelope', null, 'Made-up third spend on A');
  await until(() => srv.st.puts > p0, 12000);
  ck('A: its next change is still sent (it holds the copy the cloud has)', srv.st.puts > p0);

  /* B taps Load the newer copy: A's changes arrive, B's own is kept as a copy with Undo */
  await tap(B.p, '#vaultLoadNewer'); await w(1500);
  const rB = await receipts(B.p);
  ck('B: Load the newer copy brings A\'s later changes', /Made-up third spend on A/.test(rB), rB);
  /* after the load B is in step again: its next change is sent */
  p0 = srv.st.puts;
  await B.p.evaluate(() => { const c = document.getElementById('setClose'); c && c.click(); }); await w(300);
  await L.rc(B.p, 333, 'envelope', null, 'Made-up spend on B after loading');
  await until(() => srv.st.puts > p0, 12000);
  ck('B: after loading, its next change is sent', srv.st.puts > p0);

  /* now A is the stale one; Keep mine sends A's numbers over B's, because the person chose it */
  p0 = srv.st.puts;
  await L.rc(A.p, 444, 'envelope', null, 'Made-up fourth spend on A');
  await w(6000);
  ck('A: now stale, its send is refused too', srv.st.puts === p0, { puts: srv.st.puts, p0 });
  await L.settings(A.p); await w(500);
  if (await tap(A.p, '#vaultKeepMine')) { await until(() => srv.st.puts > p0, 9000); ck('A: Keep mine sends A\'s numbers in its place', srv.st.puts > p0); }
  else ck('A: Keep mine is offered', false);

  const errs = A.errs.concat(B.errs).filter(e => !/status of 409/.test(e));   /* the browser logs the server's "ask first" answer; that is the point */
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); await B.b.close(); srv.close();
  console.log(bad ? `qc11_cloud_conflict: ${bad} FAIL` : 'qc11_cloud_conflict: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_cloud_conflict: FAIL'); process.exit(1); });
