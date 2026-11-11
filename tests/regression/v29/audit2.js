// second screenshot pass: persona b's typed path (subscriptions, loan, credit card), then the goal wizard, goal editor, plan line editor, help menu, ask panel
const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
const fs = require('fs');
(async () => {
  const out = '/tmp/v29/shots3'; fs.mkdirSync(out, { recursive: true });
  const { b, p, errs } = await launch(390, 844, 'light');
  const shot = (n, full) => p.screenshot({ path: `${out}/${n}.png`, fullPage: !!full });
  const pb = Object.assign({}, P.b, { bills: ['rent', 'util', 'food', 'net', 'phone', 'gas', 'loan', 'card', 'subs'], amt: Object.assign({}, P.b.amt, { subs: 30 }) });
  await runTour(p, pb, async i => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (/Subscriptions|Loan|Credit|card|Yearly|Goal money|Emergency|Big purchase|home or move|Deposit/i.test(t)) await shot(`t${String(i).padStart(2, '0')}-${t.replace(/[^a-z0-9]+/gi, '_').slice(0, 24)}`);
  });
  await w(600);
  const coach = async () => { for (let i = 0; i < 9; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!v) break; await p.click('#coNext').catch(() => {}); await w(300); } };
  await coach();
  // goal wizard
  await p.evaluate(() => { const b = document.querySelector('#p-home [data-gw]'); b && b.click(); }); await w(600); await shot('gw-1');
  await p.evaluate(() => { const k = document.querySelector('#gwKinds [data-kind], #gwKinds button, .gw-kind'); k && k.click(); }); await w(500); await shot('gw-2');
  await p.keyboard.press('Escape'); await w(300);
  // goal editor on the Goals page
  await p.evaluate(() => document.querySelector('[data-tab="goals"]').click()); await w(600); await coach();
  await shot('goals-top');
  await p.evaluate(() => { const b = [...document.querySelectorAll('#p-goals button')].find(x => /Edit goal/.test(x.textContent)); b && b.click(); }); await w(500); await shot('goal-edit', true);
  await p.keyboard.press('Escape'); await w(300);
  // plan tab: open a line's detail
  await p.evaluate(() => document.querySelector('[data-tab="month"]').click()); await w(600); await coach();
  await p.evaluate(() => { const r = [...document.querySelectorAll('.row-t')].find(x => /Rent/.test(x.textContent)); r && r.click(); }); await w(500); await shot('plan-line-open', true);
  // receipts: the Other AI fold and the month section
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(600); await coach();
  await p.evaluate(() => { const d = document.querySelector('#scan details, .scan details'); if (d) d.open = true; }); await w(300); await shot('receipts-otherai', true);
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
