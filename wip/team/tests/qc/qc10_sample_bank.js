/* QC10 round 3 numbers should-fix 1: with the sample numbers showing, typing a bank balance on Home said "Saved: X in your bank today",
   showed the figure nowhere, and still turned Free to spend from "safe to spend" into "not safe to spend yet". Sample numbers are not the
   person's: a typed bank does not change them, and the message says when it will show. Made-up numbers.
   Run: node tests/qc/qc10_sample_bank.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.tab(p, 'tab-home'); await w(500);
  const look = () => p.evaluate(() => { const r = document.querySelector('#mpRooms [data-room="play"]'); return { sample: !!document.querySelector('.smp-tag'), aria: r ? r.getAttribute('aria-label') : '', cheer: (document.getElementById('cheer') || {}).textContent || '' }; });
  const a = await look();
  ck('sample numbers are showing, Free to spend is safe to spend', a.sample && /safe to spend/.test(a.aria) && !/not safe/.test(a.aria), a);
  await p.focus('#mpBankIn'); await p.keyboard.type('60'); await p.evaluate(() => document.getElementById('mpBankSave').click()); await w(700);
  const c = await look();
  ck('a small bank typed in sample mode does not change the sample Free to spend label', /safe to spend/.test(c.aria) && !/not safe/.test(c.aria), c);
  ck('the message says the balance shows once you use your own numbers', /own numbers/.test(c.cheer), c.cheer);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_sample_bank: ${bad} FAIL` : 'qc10_sample_bank: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_sample_bank: FAIL'); process.exit(1); });
