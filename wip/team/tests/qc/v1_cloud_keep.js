/* LAUNCH_CHECKLIST.md E1, the v1 part: before a cloud copy replaces the numbers on this device (a newer copy loaded, or a restore with
   the recovery code), the numbers here are kept as a local copy with Undo, as a loaded backup file already is. Made-up numbers.
   The cloud is not reached: the page's own encrypt and apply functions are called with a record made in the page.
   Run: node tests/qc/v1_cloud_keep.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  ck('the page has the cloud functions', await p.evaluate(() => !!window.__vault));
  await p.evaluate(() => { __t.S.cfg.bankStart = 1234; __t.S.ui.name = 'Here'; __t.persist(); __t.restructure(); }); await w(400);
  await p.evaluate(async () => {
    const other = JSON.parse(JSON.stringify(__t.S)); other.cfg.bankStart = 9876; other.ui.name = 'Cloud'; other.rev = Date.now() + 60000;
    const V = window.__vault, k = await V.keysFor('ABCDEFGHJKMNPQRSTUVW'), enc = await V.vaultEncrypt(k, JSON.stringify(other));
    await V.vaultApply(k, { blob: enc.blob, iv: enc.iv, rev: other.rev });
  }); await w(600);
  const after = await p.evaluate(() => ({ bank: __t.S.cfg.bankStart, keep: __t.S.ui.keep ? JSON.parse(__t.S.ui.keep.snap).cfg.bankStart : null, why: __t.S.ui.keep ? __t.S.ui.keep.why : '',
    bar: !document.getElementById('undoBar').hidden ? document.getElementById('undoTxt').textContent : '' }));
  ck('the cloud copy was loaded (' + after.bank + ')', after.bank === 9876);
  ck('E1 the numbers that were here are kept as a local copy (' + after.keep + ')', after.keep === 1234, JSON.stringify(after));
  ck('E1 Undo is offered and says what happened ("' + after.bar + '")', /cloud copy/i.test(after.bar) && /undo/i.test(after.bar), after.bar);
  /* the kept copy survives a reload, so Undo is still there later */
  await p.reload(); await w(1600); await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(300);
  const re = await p.evaluate(() => ({ keep: !!__t.S.ui.keep, bar: !document.getElementById('undoBar').hidden ? document.getElementById('undoTxt').textContent : '' }));
  ck('E1 after a reload the copy is still kept and Undo is offered', re.keep && /undo/i.test(re.bar), JSON.stringify(re));
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(700);
  ck('E1 Undo brings back the numbers that were here', await p.evaluate(() => __t.S.cfg.bankStart) === 1234, await p.evaluate(() => __t.S.cfg.bankStart));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? 'V1 CLOUD KEEP FAIL ' + bad : 'V1 CLOUD KEEP PASS'); process.exit(bad ? 1 : 0);
})();
