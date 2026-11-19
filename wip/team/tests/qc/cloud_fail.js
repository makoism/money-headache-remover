/* LAUNCH_CHECKLIST.md E9 and E10 (client part). Made-up numbers; a made-up server on this machine (cloud_lib.js).
   E9   A cloud save that fails is never silent: Settings and Home say the cloud copy is behind and since when, also after a reload,
        and the line goes away on the next save that works.
   E10  A cloud copy that is not newer than the numbers on this device is refused unless the person asks for it; when they do,
        the numbers that were here are still kept with Undo (E1).
   Run: node tests/qc/cloud_fail.js      Ends with "CLOUD FAIL PASS" or "CLOUD FAIL FAIL n". */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x === undefined ? '' : x)); if (!c) bad++; };
const home = p => p.evaluate(() => document.getElementById('tab-home').click()).then(() => w(500));
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn'));
  await tap(A.p, '#vaultOn'); await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await tap(A.p, '#vaultFlow [data-vf-next]'); await tap(A.p, '#vaultFlow [data-vf-done]');
  ck('the cloud copy is on and the first copy was sent', srv.st.puts >= 1 && /MHR-/.test(code) && !(await seen(A.p, '#vaultBehind')));

  /* ---------- E9: the server fails, then the connection drops ---------- */
  for (const mode of ['500', 'drop']) {
    srv.st.mode = mode;
    await L.rc(A.p, mode === '500' ? 200 : 300, 'envelope', null, 'Made-up ' + mode);
    await L.settings(A.p);
    ck(`E9 (${mode}) Settings says the cloud copy is behind, and since when ("${await text(A.p, '#vaultBehind')}")`, !!(await until(() => seen(A.p, '#vaultBehind'), 12000)) && /\d/.test(await text(A.p, '#vaultBehind')), await text(A.p, '#vaultState'));
    ck(`E9 (${mode}) Settings no longer just says it is on and sent`, !/^On\. Last sent/.test(await text(A.p, '#vaultState')) || await seen(A.p, '#vaultBehind'));
    await home(A.p);
    ck(`E9 (${mode}) Home says so too`, !!(await until(() => seen(A.p, '#hBk [data-vault-retry]'))), await text(A.p, '#hBk'));
    await A.p.reload(); await w(1800); await C.skipTour(A.p); await L.settings(A.p);
    ck(`E9 (${mode}) after a reload it still says so`, !!(await until(() => seen(A.p, '#vaultBehind'), 12000)));
    srv.st.mode = 'ok'; const puts = srv.st.puts;
    await tap(A.p, '#vaultRetry');
    ck(`E9 (${mode}) Send now works once the cloud is back, and the line goes away`, !!(await until(async () => srv.st.puts > puts && !(await seen(A.p, '#vaultBehind')))), await text(A.p, '#vaultBehind'));
    ck(`E9 (${mode}) Settings says when it was last sent again`, /\d/.test(await text(A.p, '#vaultState')), await text(A.p, '#vaultState'));
    await home(A.p);
    ck(`E9 (${mode}) Home no longer says it`, !(await seen(A.p, '#hBk [data-vault-retry]')));
  }
  /* cleared by the next ordinary save too, not only by the button */
  srv.st.mode = '500'; await L.rc(A.p, 400, 'envelope', null, 'Made-up third'); await L.settings(A.p); await until(() => seen(A.p, '#vaultBehind'), 12000);
  srv.st.mode = 'ok'; await L.rc(A.p, 500, 'envelope', null, 'Made-up fourth'); await L.settings(A.p);
  ck('E9 the next save that works clears the line on its own', !!(await until(async () => !(await seen(A.p, '#vaultBehind')), 12000)));

  /* ---------- E10: a copy that is not newer is refused unless asked ---------- */
  const B = await C.profile(srv.url);
  await L.rc(B.p, 777, 'envelope', null, 'Made-up B only');          /* B has numbers of its own, made after the cloud copy was sent */
  const direct = await B.p.evaluate(async code => {
    const V = window.__vault, k = await V.keysFor(code.replace(/^MHR/, '').replace(/[^A-Z0-9]/g, ''));
    const old = JSON.parse(JSON.stringify(__t.S)); old.receipts = []; old.rev = (__t.S.rev || Date.now()) - 60000;
    const enc = await V.vaultEncrypt(k, JSON.stringify(old)); let threw = '';
    try { await V.vaultApply(k, { blob: enc.blob, iv: enc.iv, rev: old.rev }); } catch (e) { threw = e.message; }
    return { threw, n: __t.S.receipts.length };
  }, code);
  ck('E10 an older copy is refused when nobody asked for it (the receipt on this device stays)', direct.threw === 'older' && direct.n === 1, JSON.stringify(direct));
  await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
  await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse');
  await until(() => seen(B.p, '#vaultFlow [data-vf-step="found"]'));
  ck('E10 with a code typed, the screen warns that the cloud copy is older than the numbers here', await seen(B.p, '#vaultFlow [data-vf-older]'), await text(B.p, '#vaultFlow'));
  ck('E10 nothing was replaced yet', /Made-up B only/.test(await B.p.evaluate(() => JSON.stringify(__t.S.receipts))));
  ck('E10 the safe choice (keep what is here) is offered', await seen(B.p, '#vaultKeepHere'));
  await tap(B.p, '#vaultLoad');
  await until(() => seen(B.p, '#vaultFlow [data-vf-step="loaded"]'));
  const after = await B.p.evaluate(() => ({ rc: JSON.stringify(__t.S.receipts), keep: __t.S.ui.keep ? __t.S.ui.keep.snap : '' }));
  ck('E10 asked for, the older copy loads', /Made-up noodles/.test(after.rc) && !/Made-up B only/.test(after.rc));
  ck('E1 and what was here is kept with Undo', /Made-up B only/.test(after.keep));
  { const errs = A.errs.concat(B.errs).filter(e => !/status of 500|ERR_EMPTY_RESPONSE/.test(e));   /* the failures this test makes on purpose */
    ck('no page errors', errs.length === 0, errs.join(' | ')); }
  await A.b.close(); await B.b.close(); srv.close();
  console.log(bad ? 'CLOUD FAIL FAIL ' + bad : 'CLOUD FAIL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('CLOUD FAIL FAIL'); process.exit(1); });
