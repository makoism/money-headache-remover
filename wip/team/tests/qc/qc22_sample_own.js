/* QC round 8 money accuracy blocker 2: sample numbers mixed with the person's own after a skipped setup. Finish later, Home bank box 50000
   ("It shows here once you use your own numbers"), then Enter pay 100000: Home planned from the sample's ¥85,500, Plan said "under your
   ¥17,000 minimum balance", and Settings held the sample's Money today 85500, minimum 17000 and cap 28500. Once the person's own pay is in,
   the sample start, minimum and cap do not carry over, and the bank typed while the samples showed is the balance. Both orders: bank then
   pay, and pay then bank. Made-up numbers.  Run: node tests/qc/qc22_sample_own.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(400); } };
const txt = p => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const bank = async p => { await L.tab(p, 'tab-home'); await w(300); if (await p.$('#mpCheck')) { await p.evaluate(() => document.getElementById('mpCheck').click()); await w(500); }
  await p.focus('#mpBankIn'); await p.keyboard.type('50000'); await p.evaluate(() => document.getElementById('mpBankSave').click()); await w(700);
  return p.evaluate(() => (document.getElementById('cheer') || {}).textContent || ''); };
const pay = async p => { await L.tab(p, 'tab-home'); await w(300); const ok = await p.evaluate(() => { const b = document.querySelector('#hNext [data-open="a"]'); if (b) { b.click(); return true; } return false; }); await w(800);
  await p.focus('#h-a'); await w(250); await p.evaluate(() => { const e = document.getElementById('h-a'); e.select && e.select(); }); await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); await w(100);   /* the sample pay is cleared first, so the keys make 100000 */
  for (const ch of '100000') { await p.keyboard.type(ch); await w(60); } await p.keyboard.press('Tab'); await w(800); return ok; };
const run = async (order) => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  ck(order + ': the setup offers Finish later', await p.evaluate(() => (document.getElementById('tourSkip') || {}).textContent === 'Finish later'));
  await skip(p);
  ck(order + ': the sample numbers show (start 85,500)', await p.evaluate(() => __t.S.ui.preset === '¥' && /85,500/.test(document.body.innerText)), await p.evaluate(() => __t.S.ui));
  if (order === 'bank then pay') { const m = await bank(p); ck(order + ': the bank message says it shows once you use your own numbers', /own numbers/.test(m), m); ck(order + ': Enter pay is offered on Home', await pay(p)); }
  else { ck(order + ': Enter pay is offered on Home', await pay(p)); await bank(p); }
  const cf = await p.evaluate(() => Object.assign({}, __t.S.cfg));
  ck(order + ': the typed 50,000 is the balance the plan starts from', cf.bankStart === 50000, cf);
  ck(order + ': the minimum balance is a tenth of the pay (10,000), as setup makes it', cf.minBank === 10000, cf);
  ck(order + ': the Free to spend cap is not the sample 28,500', cf.ceiling !== 28500 && cf.ceiling !== undefined, cf);
  await L.tab(p, 'tab-home'); await w(500); const h = await txt(p);
  ck(order + ': Home does not plan from the sample ¥85,500', !/85,500/.test(h), h.match(/.{60}85,500.{40}/));
  ck(order + ': Home plans from the typed ¥50,000', /planned from ¥50,000/.test(h), (h.match(/planned from.{40}/) || [])[0]);
  await L.tab(p, 'tab-month'); await w(500); const pm = await txt(p);
  ck(order + ': Plan never names the sample ¥17,000 minimum', !/17,000 minimum/.test(pm), pm.match(/.{60}17,000.{40}/));
  await L.settings(p); await w(300);
  const st = await p.evaluate(() => ['bankStart', 'minBank', 'ceiling'].map(k => { const e = document.getElementById('st-' + k); return e ? e.value : null; }));
  ck(order + ': Settings shows Money today 50000, minimum 10000, and not the sample cap 28500', st[0] === '50000' && st[1] === '10000' && st[2] !== '28500', st);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck(order + ': no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
};
(async () => {
  await run('bank then pay');
  await run('pay then bank');
  console.log(bad ? `qc22_sample_own: ${bad} FAIL` : 'qc22_sample_own: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc22_sample_own: FAIL'); process.exit(1); });
