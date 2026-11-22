/* QC round 8 data safety, confusing 1: Choose file only reads the backup into the box; the person then taps Load text, and taps it again
   to say yes. The restore steps on Settings say that: "Tap Choose file and pick your backup file, then tap Load text twice." The flow
   itself is not changed. Made-up numbers only.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc25_restore_steps.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await L.settings(p); await w(400);
  const s = await p.evaluate(() => { const ol = document.getElementById('rsSteps'); return ol ? [...ol.children].map(li => li.textContent.replace(/\s+/g, ' ').trim()) : null; });
  ck('the restore steps are on Settings', !!s && s.length >= 2, s);
  /* QC round 9 wording 10: "twice" was not explained, so the second tap says what it is for */
  ck('step 1 says "Tap Choose file and pick your backup. Then tap Load text, and tap it again to confirm."', !!s && s[0].startsWith('Tap Choose file and pick your backup. Then tap Load text, and tap it again to confirm.'), s && s[0]);
  ck('the paste way says the same', !!s && /paste the backup text in the box above, then tap Load text, and tap it again to confirm\./.test(s[0]), s && s[0]);
  ck('no "twice" left', !!s && !/twice/.test(s[0]), s && s[0]);
  ck('no step reads as if Choose file alone restores', !!s && !/pick your backup file\. Or/.test(s.join(' ')), s);
  /* the flow the steps describe is still there: Choose file reads into the box, Load text asks, then replaces */
  const ok = await p.evaluate(() => !!document.getElementById('bkFile') && !!document.getElementById('bkLoad') && !!document.getElementById('bkFileBtn'));
  ck('Choose file and Load text are both there', ok);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc25_restore_steps: ${bad} FAIL` : 'qc25_restore_steps: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc25_restore_steps: FAIL'); process.exit(1); });
