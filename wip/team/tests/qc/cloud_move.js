/* LAUNCH_CHECKLIST.md E15: the cloud copy explains itself step by step, and a person can move their numbers to another phone or
   browser USING ONLY THE SCREENS. Two browser profiles (two "phones"), a made-up plan, a made-up server on this machine (cloud_lib.js).
   The test only looks, taps and types, as a person would; the recovery code is read off the screen of the first phone.
   Run: node tests/qc/cloud_move.js      Ends with "CLOUD MOVE PASS" or "CLOUD MOVE FAIL n". */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x === undefined ? '' : x)); if (!c) bad++; };
const stepSeen = (p, name) => seen(p, `#vaultFlow [data-vf-step="${name}"]`);
const receipts = p => p.evaluate(() => document.getElementById('tab-receipts').click()).then(() => w(500)).then(() => L.txt(p));
(async () => {
  const srv = await C.server();
  /* ---------- phone A: make a plan, turn the cloud copy on ---------- */
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  ck('A: a receipt is logged through the Receipts screen', /Made-up noodles/.test(await receipts(A.p)));
  await L.settings(A.p);
  ck('A: Settings shows the cloud copy with two ways in: keep a copy, or I have a code', await until(() => seen(A.p, '#vaultOn')) && await seen(A.p, '#vaultHave'));
  await tap(A.p, '#vaultOn');
  ck('A step 1 says what the cloud copy is, before anything is sent', await stepSeen(A.p, 'what') && (await text(A.p, '#vaultFlow')).length > 80 && srv.st.puts === 0, await text(A.p, '#vaultFlow'));
  ck('A: one step at a time (only one step on screen)', await A.p.evaluate(() => [...document.querySelectorAll('#vaultFlow [data-vf-step]')].filter(e => e.offsetParent).length) === 1);
  await tap(A.p, '#vaultFlow [data-vf-next]');
  ck('A step 2 shows the code and says what it is for', await stepSeen(A.p, 'code') && /MHR-/.test(await text(A.p, '#vaultCodeTxt')), await text(A.p, '#vaultFlow'));
  const code = await text(A.p, '#vaultCodeTxt');
  ck('A step 2 cannot be passed before saying the code is saved (Next is "I saved it")', await seen(A.p, '#vaultSaved') && !(await seen(A.p, '#vaultFlow [data-vf-next]')));
  await tap(A.p, '#vaultSaved');
  ck('A step 3 says what happens on this device', await stepSeen(A.p, 'here'), await text(A.p, '#vaultFlow'));
  ck('A step 3 shows the copy was sent (' + await text(A.p, '#vaultFlow [data-vf-sent]') + ')', !!(await until(async () => srv.st.puts >= 1 && /\d/.test(await text(A.p, '#vaultFlow [data-vf-sent]')))));
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const other = await text(A.p, '#vaultFlow');
  ck('A step 4 lists what to do on the other phone or browser, as numbered steps', await stepSeen(A.p, 'other') && await A.p.evaluate(() => document.querySelectorAll('#vaultFlow [data-vf-step="other"] ol li').length) >= 3, other);
  await tap(A.p, '#vaultFlow [data-vf-done]');
  ck('A: after the steps Settings says the cloud copy is on and when it was last sent', /\d/.test(await text(A.p, '#vaultState')) && !(await seen(A.p, '#vaultOn')), await text(A.p, '#vaultState'));
  ck('A: the steps for another device can be opened again later', await seen(A.p, '#vaultHow') && await tap(A.p, '#vaultHow') && await stepSeen(A.p, 'other'));
  ck('A: the code can be shown again later', await tap(A.p, '#vaultShow') && (await text(A.p, '#vaultCodeTxt')) === code);

  /* ---------- phone B: a fresh browser. Settings, I have a code ---------- */
  const B = await C.profile(srv.url);
  ck('B starts without the receipt', !/Made-up noodles/.test(await receipts(B.p)));
  await L.settings(B.p);
  await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
  ck('B step 1 asks for the code and says where to find it', await stepSeen(B.p, 'enter') && await seen(B.p, '#vaultIn'), await text(B.p, '#vaultFlow'));
  await B.p.type('#vaultIn', code.toLowerCase().replace(/-/g, ' '));           /* typed the way a person might: lower case, spaces */
  await tap(B.p, '#vaultUse');
  ck('B step 2 says what was found and when it was saved, before anything is replaced', !!(await until(() => stepSeen(B.p, 'found'))) && /\d/.test(await text(B.p, '#vaultFlow [data-vf-found]')) && !/Made-up noodles/.test(await B.p.evaluate(() => JSON.stringify(__t.S.receipts))), await text(B.p, '#vaultFlow'));
  await tap(B.p, '#vaultLoad');
  ck('B step 3 says it is done and that both devices now share the copy', !!(await until(() => stepSeen(B.p, 'loaded'))), await text(B.p, '#vaultFlow'));
  await tap(B.p, '#vaultFlow [data-vf-done]');
  await B.p.evaluate(() => { const c = document.getElementById('setClose') || document.querySelector('#settings [data-close], #gearClose'); c && c.click(); }); await w(400);
  ck('B now shows the receipt made on A', /Made-up noodles/.test(await receipts(B.p)) && /1,234/.test(await L.txt(B.p)));

  /* ---------- B changes something; A gets it the next time it opens ---------- */
  const puts = srv.st.puts; await L.rc(B.p, 567, 'envelope', null, 'Made-up bus');
  await until(() => srv.st.puts > puts);
  ck('B: the change is sent on its own', srv.st.puts > puts);
  await A.p.reload(); await w(1800); await C.skipTour(A.p);
  await A.p.evaluate(() => document.getElementById('tab-home').click()); await w(500);
  ck('A: on opening, Home says a newer copy is in the cloud and offers to load it', !!(await until(() => seen(A.p, '#hBk [data-vault-load]'))), await text(A.p, '#hBk'));
  await tap(A.p, '#hBk [data-vault-load]'); await w(800);
  ck('A now shows the receipt made on B', /Made-up bus/.test(await receipts(A.p)));
  ck('A: what was on A before is kept, with Undo', await A.p.evaluate(() => !!__t.S.ui.keep));

  /* ---------- phone C: a fresh browser, the code typed in the first-open setup ---------- */
  const D = await C.profile(srv.url, { tour: true });
  if (await until(() => seen(D.p, '#tourRestoreBtn'), 6000)) {
    await tap(D.p, '#tourRestoreBtn'); await D.p.type('#tourVaultIn', code); await tap(D.p, '#tourVaultGo, #tourVaultUse, #tourRestoreIn button');
    await until(async () => /Made-up bus/.test(await D.p.evaluate(() => JSON.stringify(__t.S.receipts))), 8000);
    ck('C: the first-open setup takes the code and brings both receipts back', /Made-up bus/.test(await receipts(D.p)) && /Made-up noodles/.test(await L.txt(D.p)));
  } else ck('C: the first-open setup offers "enter your recovery code"', false);
  ck('no page errors', A.errs.concat(B.errs, D.errs).length === 0, A.errs.concat(B.errs, D.errs).join(' | '));
  await A.b.close(); await B.b.close(); await D.b.close(); srv.close();
  console.log(bad ? 'CLOUD MOVE FAIL ' + bad : 'CLOUD MOVE PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('CLOUD MOVE FAIL'); process.exit(1); });
