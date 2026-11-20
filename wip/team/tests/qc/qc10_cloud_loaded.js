/* Q7 (launch checklist): on a second phone 412 wide, after Load, the "Cloud copy loaded" message ran off the right edge, showed no
   Undo, and stayed on screen across tabs; the typed recovery code was cut off in its box. Two browser profiles and a made-up server on
   this machine (cloud_lib.js), made-up numbers. The test taps and types as a person would.
   Run: node tests/qc/qc10_cloud_loaded.js      Ends with "qc10_cloud_loaded: ALL PASS" or "n FAIL". */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 500)); } };
const receipts = p => p.evaluate(() => JSON.stringify(__t.S.receipts));
/* the whole code shows in its box: nothing scrolled out of sight, the box inside the screen */
const fits = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect();
  return { ok: e.scrollWidth <= e.clientWidth + 1 && r.left >= 0 && r.right <= innerWidth, sw: e.scrollWidth, cw: e.clientWidth, left: r.left, right: r.right, vw: innerWidth, val: e.value }; }, sel);
/* the Undo bar: shown, inside the screen, its words all there, the Undo button inside the screen */
const bar = p => p.evaluate(() => { const b = document.getElementById('undoBar'), t = document.getElementById('undoTxt'), g = document.getElementById('undoGo');
  if (!b || b.hidden || !b.getClientRects().length) return { shown: false };
  const r = b.getBoundingClientRect(), gr = g.getBoundingClientRect(), tr = t.getBoundingClientRect();
  return { shown: true, text: t.innerText, inside: r.left >= 0 && r.right <= innerWidth, undoInside: gr.width > 0 && gr.left >= 0 && gr.right <= innerWidth && gr.bottom <= innerHeight,
    textInside: tr.left >= 0 && tr.right <= innerWidth && t.scrollWidth <= t.clientWidth + 1, r: [r.left, r.right], g: [gr.left, gr.right], vw: innerWidth }; });
(async () => {
  const srv = await C.server();
  /* ---------- phone A: a receipt, then the cloud copy on, the code read off the screen ---------- */
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1);
  ck('A: the code is on screen and was sent', /^MHR-/.test(code) && srv.st.puts >= 1, code);

  /* ---------- phone B, 412 wide: its own receipt, then Settings, I have a code ---------- */
  const B = await C.profile(srv.url);
  await L.rc(B.p, 777, 'envelope', null, 'Made-up tea');
  await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
  await B.p.type('#vaultIn', code);
  const f = await fits(B.p, '#vaultIn');
  ck('B: the whole typed code shows in its box in Settings (' + f.val + ')', f.ok, f);
  const wide = await B.p.evaluate(() => { const e = document.getElementById('vaultIn'), v = e.value, out = []; for (const ch of 'MWQN') { e.value = 'MHR-' + [0, 1, 2, 3, 4].map(() => ch.repeat(4)).join('-'); if (e.scrollWidth > e.clientWidth + 1) out.push(ch); } e.value = v; return out; });
  ck('B: a code of the widest letters (all M, all W) also shows whole', wide.length === 0, wide);
  await tap(B.p, '#vaultUse'); await until(() => seen(B.p, '#vaultLoad')); await tap(B.p, '#vaultLoad');
  await until(async () => /Made-up noodles/.test(await receipts(B.p)));
  ck('B: Load brought the receipt from A', /Made-up noodles/.test(await receipts(B.p)));
  const b1 = await bar(B.p);
  ck('B: "Cloud copy loaded" shows with Undo', b1.shown && /^Cloud copy loaded/.test(b1.text), b1);
  ck('B: the message stays inside the screen, 412 wide', b1.shown && b1.inside && b1.textInside, b1);
  ck('B: the Undo button is inside the screen', b1.shown && b1.undoInside, b1);
  /* another tab: the message is about the load just made, not about the tab opened next */
  await B.p.evaluate(() => { const c = document.getElementById('setClose') || document.querySelector('#settings [data-close], #gearClose'); c && c.click(); }); await w(400);
  await L.tab(B.p, 'tab-receipts'); await w(400);
  const b2 = await bar(B.p);
  ck('B: after opening another tab the message is gone', !b2.shown, b2);
  ck('B: what was on B before is still kept as a copy (Settings, for days)', await B.p.evaluate(() => !!__t.S.ui.keep));
  ck('B: the receipt from A is still there after changing tab (nothing was undone by hiding)', /Made-up noodles/.test(await receipts(B.p)));

  /* ---------- the same Load again, this time tapping Undo before changing tab ---------- */
  const B2 = await C.profile(srv.url);
  await L.rc(B2.p, 888, 'envelope', null, 'Made-up rice');
  await L.settings(B2.p); await until(() => seen(B2.p, '#vaultHave')); await tap(B2.p, '#vaultHave');
  await B2.p.type('#vaultIn', code); await tap(B2.p, '#vaultUse'); await until(() => seen(B2.p, '#vaultLoad')); await tap(B2.p, '#vaultLoad');
  await until(async () => /Made-up noodles/.test(await receipts(B2.p)));
  const b3 = await bar(B2.p);
  ck('B2: Undo is on screen after Load', b3.shown && b3.undoInside, b3);
  if (b3.shown) { await B2.p.evaluate(() => document.getElementById('undoGo').scrollIntoView({ block: 'center' })); await B2.p.tap('#undoGo'); await w(800); }
  const r3 = await receipts(B2.p);
  ck('B2: Undo puts back the numbers from before the load', /Made-up rice/.test(r3) && !/Made-up noodles/.test(r3), r3);

  /* ---------- phone E, 412 wide, no numbers of its own (QC10 north-star F2): the load offers no Undo, so one tap can never put the
     sample numbers back and send them over the only cloud copy ---------- */
  const E = await C.profile(srv.url);
  ck('E: a fresh phone with no numbers of its own', await E.p.evaluate(() => !(__t.S.receipts || []).length));
  await L.settings(E.p); await until(() => seen(E.p, '#vaultHave')); await tap(E.p, '#vaultHave');
  await E.p.type('#vaultIn', code); await tap(E.p, '#vaultUse'); await until(() => seen(E.p, '#vaultLoad')); await tap(E.p, '#vaultLoad');
  /* the cloud copy holds B2's numbers by now (B2 tapped Undo, which sends them up): rice, or noodles if that was not sent yet */
  await until(async () => /Made-up (noodles|rice)/.test(await receipts(E.p)));
  ck('E: the load brought the cloud copy', /Made-up (noodles|rice)/.test(await receipts(E.p)));
  const e1 = await bar(E.p);
  ck('E: no Undo offered after the load (there was nothing of its own to go back to)', !e1.shown, e1);
  ck('E: it does not say numbers from before are kept', !/numbers from before/.test(await E.p.evaluate(() => document.body.innerText)));
  await w(3000); ck('E: a few seconds later the loaded numbers are still there', /Made-up (noodles|rice)/.test(await receipts(E.p)));
  /* a phone that had numbers: Undo says plainly that it also goes to the cloud copy */
  ck('B2 earlier: the bar on a phone with its own numbers says Undo also changes the cloud copy', /cloud copy/.test(b3.text || '') && /Undo/.test(b3.text || ''), b3.text);

  /* ---------- phone C, 412 wide: the code typed on the first-open screen ---------- */
  const D = await C.profile(srv.url, { tour: true });
  if (await until(() => seen(D.p, '#tourRestoreBtn'), 6000)) {
    await tap(D.p, '#tourRestoreBtn'); await D.p.type('#tourVaultIn', code);
    const g = await fits(D.p, '#tourVaultIn');
    ck('C: the whole typed code shows in its box on the first-open screen (' + g.val + ')', g.ok, g);
  } else ck('C: the first-open screen offers "enter your recovery code"', false);

  const errs = A.errs.concat(B.errs, B2.errs, D.errs, E.errs);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); await B.b.close(); await B2.b.close(); await D.b.close(); await E.b.close(); srv.close();
  console.log(bad ? `qc10_cloud_loaded: ${bad} FAIL` : 'qc10_cloud_loaded: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_cloud_loaded: FAIL'); process.exit(1); });
