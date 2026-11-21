/* QC round 7 data safety, confusing 2: tapping Send now while the server is down changed nothing on screen. After a Send now that fails,
   the behind line on Settings and on Home says when it tried: "Tried again at 3:35 PM. Still no connection. Your numbers are safe on
   this device." A Send now that works clears the line as before. A made-up server (cloud_lib.js), made-up numbers.
   Run: node tests/qc/qc18_send_now_tried.js */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const TRIED = /Tried again at (\d{1,2}:\d\d [AP]M)\. Still no connection\. Your numbers are safe on this device\./;
const clock = p => p.evaluate(() => new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }));
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn'); await tap(A.p, '#vaultFlow [data-vf-next]');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(1500);
  for (const mode of ['drop', '500']) {
    srv.st.mode = mode;
    await L.rc(A.p, 300, 'envelope', null, 'Made-up ' + mode); await L.settings(A.p);
    await until(() => seen(A.p, '#vaultBehind'), 12000);
    const b0 = await text(A.p, '#vaultBehind');
    ck(`(${mode}) before any Send now, the behind line is the usual one`, /^The cloud copy is behind\. Changes made since .+ are on this device only\./.test(b0) && !TRIED.test(b0), b0);
    const t0 = await clock(A.p); await tap(A.p, '#vaultRetry'); const t1 = await clock(A.p);
    const b1 = await until(async () => { const t = await text(A.p, '#vaultBehind'); return TRIED.test(t) && t; }, 8000);
    const m1 = TRIED.exec(b1 || '');
    ck(`(${mode}) Settings: after a failed Send now the line says when it tried`, !!m1 && (m1[1] === t0 || m1[1] === t1), b1 || await text(A.p, '#vaultBehind'));
    ck(`(${mode}) Settings: it still says since when the cloud copy is behind, and Send now stays`, /^The cloud copy is behind\. Changes made since .+ are on this device only\./.test(b1 || '') && await seen(A.p, '#vaultRetry'), b1);
    await L.tab(A.p, 'tab-home'); await w(800);
    const h1 = await text(A.p, '#hBk');
    ck(`(${mode}) Home says the same try`, TRIED.test(h1) && /Changes made since/.test(h1) && await seen(A.p, '#hBk [data-vault-retry]'), h1);
    /* Send now on Home, still down: the line still says it tried, at the time of this tap */
    await A.p.evaluate(() => { const b = document.querySelector('#hBk [data-vault-retry]'); b && b.click(); }); await w(2500);
    const h2 = await text(A.p, '#hBk'), m2 = TRIED.exec(h2), t2 = await clock(A.p);
    ck(`(${mode}) Home: Send now again, still down, says when it tried`, !!m2 && m2[1] === t2, h2);
    await L.settings(A.p); await w(500);
    const b2 = await text(A.p, '#vaultBehind');
    ck(`(${mode}) Settings agrees with Home`, TRIED.test(b2) && TRIED.exec(b2)[1] === (m2 && m2[1]), b2);
    srv.st.mode = 'ok'; const puts = srv.st.puts;
    await tap(A.p, '#vaultRetry');
    ck(`(${mode}) Send now once the cloud is back clears the line`, !!(await until(async () => srv.st.puts > puts && !(await seen(A.p, '#vaultBehind')))), await text(A.p, '#vaultBehind'));
    await L.tab(A.p, 'tab-home'); await w(800);
    ck(`(${mode}) Home no longer says it`, !(await seen(A.p, '#hBk [data-vault-retry]')) && !TRIED.test(await text(A.p, '#hBk')), await text(A.p, '#hBk'));
  }
  /* the next time it falls behind, the old try is not shown again */
  srv.st.mode = 'drop'; await L.rc(A.p, 400, 'envelope', null, 'Made-up later'); await L.settings(A.p); await until(() => seen(A.p, '#vaultBehind'), 12000);
  const b3 = await text(A.p, '#vaultBehind');
  ck('a new fall behind starts without the old try', !TRIED.test(b3) && /^The cloud copy is behind/.test(b3), b3);
  const errs = A.errs.filter(e => !/Failed to fetch|ERR_|status of 500|status of 409/.test(e));
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); srv.close();
  console.log(bad ? `qc18_send_now_tried: ${bad} FAIL` : 'qc18_send_now_tried: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc18_send_now_tried: FAIL'); process.exit(1); });
