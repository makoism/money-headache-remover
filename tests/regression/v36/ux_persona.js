/* Persona Aiko (typed numbers, one trip goal): every page after setup, then the common flows, shot at phone size */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
const fs = require('fs'); const OUT = '/tmp/v36/p'; let n = 0;
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'dark');
  const shot = async (name) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
  const pageShots = async (name) => { const h = await p.evaluate(() => document.documentElement.scrollHeight); let y = 0, k = 0; while (y < h && k < 9) { await p.evaluate(y => scrollTo(0, y), y); await w(150); await shot(`${name}-${k}`); y += 784; k++; } await p.evaluate(() => scrollTo(0, 0)); };
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(450); };
  const r = await runTour(p, P.a); console.log(r.seen.join('\n'), r.probs);
  await w(1000);
  // where did we land?
  await shot('landing');
  await go('home'); await pageShots('home');
  await go('goals'); await pageShots('goals');
  // goal flows: edit goal
  await p.evaluate(() => { const b = [...document.querySelectorAll('#goalCards button')].find(b => /Edit goal/.test(b.textContent)); b && b.click(); }); await w(400); await pageShots('goal-edit');
  await go('receipts'); await pageShots('receipts');
  // log a receipt with a comma amount and one with a future date
  await p.evaluate(() => document.querySelector('#rcAmt').scrollIntoView({block:'center'})); await p.type('#rcAmt', '1,200'); await p.evaluate(() => document.querySelector('#rcSave').click()); await w(400); await shot('receipt-comma');
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.value = ''; }); await p.type('#rcAmt', '800'); await p.evaluate(() => { const d = document.querySelector('#rcDate'); d.value = '2027-03-05'; d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); }); await p.evaluate(() => document.querySelector('#rcSave').click()); await w(400); await shot('receipt-future');
  await go('month'); await pageShots('plan');
  // plan: next month, then the month far ahead
  await p.click('#nextM'); await w(400); await shot('plan-next-month');
  await go('months'); await pageShots('months');
  await go('basics'); await pageShots('settings');
  // settings: zero all (first tap arms), restore samples (first tap)
  await p.evaluate(() => document.querySelector('#blankBtn').scrollIntoView({block:'center'})); await p.click('#blankBtn'); await w(300); await shot('settings-zero-armed'); await w(4500);
  await p.evaluate(() => document.querySelector('#bkReset').scrollIntoView({block:'center'})); await p.click('#bkReset'); await w(300); await shot('settings-restore-armed'); await w(4500);
  await go('home');
  fs.writeFileSync(OUT + '/errs.json', JSON.stringify(errs, null, 1)); console.log('errs', errs);
  await b.close();
})();
