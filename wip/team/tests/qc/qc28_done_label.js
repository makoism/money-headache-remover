/* QC round 10 regression polish: on the Setup done step the small step label above the title still read "Free to spend", left over
   from the step before. It reads "Done". The progress dots are not changed (the last step still fills the last segment).
   Walks setup with Next only, nothing typed, at 390. Run: node tests/qc/qc28_done_label.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x || '')); if (!c) bad++; };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || '/home/claude/work/money-map-team.html') + '?sfxtest';
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.goto(PAGE); await w(1500);
  let st = null, before = null;
  for (let i = 0; i < 40; i++) {
    const s = await p.evaluate(() => ({ title: (document.getElementById('tourTitle') || {}).textContent || '', part: (document.getElementById('tourPart') || {}).textContent || '', dots: (document.getElementById('tourDots') || { getAttribute: () => '' }).getAttribute('aria-label'), on: document.querySelectorAll('#tourDots i.on').length, n: document.querySelectorAll('#tourDots i').length }));
    if (/^Setup done/.test(s.title)) { st = s; break; }
    before = s;
    const ok = await p.evaluate(() => { const n = document.getElementById('tourNext'); if (n && n.offsetParent) { n.click(); return true; } const k = document.getElementById('srcSkip'); if (k && k.offsetParent) { k.click(); return true; } return false; }); if (!ok) break; await w(500);
  }
  ck('Setup done was reached', !!st, before);
  ck('its step label reads "Done"', !!st && st.part === 'Done', st);
  ck('the progress label says Done too', !!st && /^Done, setup progress$/.test(st.dots), st);
  ck('the dots are unchanged: the last one is on', !!st && st.on === 1 && st.n >= 2 && before && st.n === before.n, { st, before });
  ck('no page errors', errs.length === 0, errs);
  await b.close();
  console.log(bad ? 'qc28_done_label: ' + bad + ' FAIL' : 'qc28_done_label: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc28_done_label: FAIL'); process.exit(1); });
