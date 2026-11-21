/* QC round 8 data safety, confusing 3: after Send now, when the server answered but refused (a server error), the behind line said
   "Still no connection." although the connection was fine. Now it says "Still not sent." for a refusal, and "Still no connection." only
   when the connection was really lost. On Settings and on Home. A made-up server (cloud_lib.js), made-up numbers.
   Run: BUILD=/abs/money-map-team.html node tests/qc/qc25_still_not_sent.js */
if (process.env.PAGE && !process.env.BUILD) process.env.BUILD = process.env.PAGE;
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const SAY = { drop: 'Still no connection.', '500': 'Still not sent.' };
const tried = s => new RegExp('Tried again at \\d{1,2}:\\d\\d [AP]M\\. ' + s.replace(/\./g, '\\.') + ' Your numbers are safe on this device\\.');
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn'); await tap(A.p, '#vaultFlow [data-vf-next]');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(1500);
  /* 500 first, then drop, then 500 again: the words follow the latest try, not the first one */
  for (const mode of ['500', 'drop', '500']) {
    srv.st.mode = mode; const want = tried(SAY[mode]), other = tried(SAY[mode === '500' ? 'drop' : '500']);
    await L.rc(A.p, 300, 'envelope', null, 'Made-up ' + mode); await L.settings(A.p);
    await until(() => seen(A.p, '#vaultBehind'), 12000);
    await tap(A.p, '#vaultRetry');
    const b1 = await until(async () => { const t = await text(A.p, '#vaultBehind'); return want.test(t) && t; }, 8000);
    ck(`(${mode}) Settings: after Send now it says "${SAY[mode]}"`, !!b1 && !other.test(b1), b1 || await text(A.p, '#vaultBehind'));
    await L.tab(A.p, 'tab-home'); await w(800);
    const h1 = await text(A.p, '#hBk');
    ck(`(${mode}) Home says the same`, want.test(h1) && !other.test(h1), h1);
  }
  srv.st.mode = 'ok'; const puts = srv.st.puts; await L.settings(A.p); await tap(A.p, '#vaultRetry');
  ck('once the cloud is back, Send now clears the line', !!(await until(async () => srv.st.puts > puts && !(await seen(A.p, '#vaultBehind')))), await text(A.p, '#vaultBehind'));
  const errs = A.errs.filter(e => !/Failed to fetch|ERR_|status of 500|status of 409/.test(e));
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); srv.close();
  console.log(bad ? `qc25_still_not_sent: ${bad} FAIL` : 'qc25_still_not_sent: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc25_still_not_sent: FAIL'); process.exit(1); });
