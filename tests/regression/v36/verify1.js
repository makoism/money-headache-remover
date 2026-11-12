/* checks for the first batch of UX fixes */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const title = p => p.$eval('#tourTitle', e => e.textContent);
(async () => {
  // A. the statements step has a visible way forward in the footer
  let { b, p, errs } = await L.launch(390, 844, 'dark');
  let hit = false; await runTour(p, P.a, async () => { if ((await title(p)) === 'Your statements') { hit = true; throw new Error('stop'); } }).catch(() => {});
  ok(hit, 'reached Your statements');
  const nx = await p.$eval('#tourNext', e => ({ hidden: e.hidden, text: e.textContent, solid: e.classList.contains('solid'), y: e.getBoundingClientRect().top }));
  ok(!nx.hidden && nx.text === 'Type numbers instead' && !nx.solid && nx.y < 844, `footer button visible, plain, says "${nx.text}"`);
  await p.click('#tourNext'); await w(400);
  ok((await title(p)) === 'Your money', 'it goes to Your money');
  await p.screenshot({ path: '/tmp/v36/fix-statements.png' });
  // B. naive path end: wording reflects zeroed bills
  await b.close();
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  for (let i = 0; i < 30; i++) { const t = await title(p); const nxt = await p.$eval('#tourNext', e => e.textContent); if (/^(Go to bills|Done)$/.test(nxt)) break; await p.click('#tourNext'); await w(250); }
  const doneTxt = await p.$eval('#tourBody', e => e.innerText);
  ok(/Your bills are all at zero so far/.test(doneTxt) && !/still samples/.test(doneTxt), 'naive end: says bills are at zero, not samples');
  ok(/Plan, Money in, Salary/.test(doneTxt), 'naive end: says where pay goes');
  await p.screenshot({ path: '/tmp/v36/fix-naive-done.png' });
  await p.click('#tourNext'); await w(900);
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(500);
  const hero = await p.$eval('#hHero', e => e.innerText);
  ok(/Emergency fund has no amount yet/.test(hero), 'Home hero asks for the amount of the amount-less goal: ' + hero.split('\n')[0]);
  await p.evaluate(() => document.querySelector('[data-gset]').click()); await w(600);
  const onGoals = await p.evaluate(() => !document.querySelector('#p-goals').hidden && !!document.querySelector('#goalCards input[data-g="target"]'));
  ok(onGoals, 'Set amount opens the goal editor on Goals');
  await p.screenshot({ path: '/tmp/v36/fix-setamount.png' });
  await b.close();
  // C. the typed comma is a thousands separator for pesos, a decimal for euros
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(400);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(400);
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.scrollIntoView({ block: 'center' }); a.focus(); });
  await p.type('#rcAmt', '1,200');
  ok((await p.$eval('#rcAmt', e => e.value)) === '1200', 'peso box: 1,200 reads as 1200');
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.value = ''; });
  await p.type('#rcAmt', '12,5');
  ok((await p.$eval('#rcAmt', e => e.value)) === '125', 'peso box: 12,5 reads as 125 (comma dropped)');
  await p.evaluate(() => { window.__t && window.__t.S; const s = JSON.parse(localStorage.getItem('money-map-template-v2')); s.ui.cur = '€'; localStorage.setItem('money-map-template-v2', JSON.stringify(s)); sessionStorage.setItem('__keep', '1'); });
  await p.reload({ waitUntil: 'load' }); await w(600);
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); }); await w(300);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(400);
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.scrollIntoView({ block: 'center' }); a.focus(); a.value = ''; });
  await p.type('#rcAmt', '12,5');
  ok((await p.$eval('#rcAmt', e => e.value)) === '12.5', 'euro box: 12,5 reads as 12.5');
  // D. a future date asks first, then logs on the second tap; the Plan stays on this month
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.value = ''; }); await p.type('#rcAmt', '800');
  await p.evaluate(() => { const d = document.querySelector('#rcDate'); d.value = '2027-03-05'; d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.evaluate(() => document.querySelector('#rcSave').click()); await w(300);
  const m1 = await p.$eval('#rcMsg', e => e.textContent);
  ok(/in the future. Tap again/.test(m1), 'future date asks first: ' + m1);
  const n0 = await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).receipts.length);
  await p.evaluate(() => document.querySelector('#rcSave').click()); await w(800);
  const n1 = await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).receipts.length);
  ok(n1 === n0 + 1, 'second tap logs it');
  ok((await p.$eval('#rcTitle', e => e.textContent)) === 'Receipts, March 2027', 'the receipts list follows it to March 2027');
  await p.evaluate(() => document.querySelector('[data-tab="month"]').click()); await w(400);
  ok((await p.$eval('#monthTxt', e => e.textContent)) === 'November 2026', 'Plan opens on November 2026, not March: ' + await p.$eval('#monthTxt', e => e.textContent));
  // E. receipt button label stays "Log receipt"
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(300);
  ok((await p.$eval('#rcSave', e => e.textContent)) === 'Log receipt', 'button still says Log receipt after a log');
  // F. Settings: Zero all visible, restore box empty with a placeholder
  await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300);
  ok(!(await p.$eval('#blankBtn', e => e.hidden)), 'Zero all is shown');
  ok((await p.$eval('#bk', e => e.value)) === '' && /Paste/.test(await p.$eval('#bk', e => e.placeholder)), 'restore box empty with a placeholder');
  await b.close();
  console.log(`\nVERIFY1: ${pass} pass, ${fail} fail`);
})();
