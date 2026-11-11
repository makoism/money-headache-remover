const { w, P, launch, runTour } = require('./lib.js');
(async () => {
  const [,, persona='a', vw='390', vh='844', out='/tmp/v22/t', scheme='light', reduce='0'] = process.argv;
  require('fs').mkdirSync(out,{recursive:true});
  const { b, p, errs } = await launch(vw, vh, scheme, reduce==='1');
  const r = await runTour(p, P[persona]); console.log('tour problems', JSON.stringify(r.probs));
  await w(500);
  const coVis = () => p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; });
  const skipCoach = async () => { if (await coVis()) { await p.click('#coSkip'); await w(400); } };
  await skipCoach();
  const shot = async n => { await w(350); await p.screenshot({ path: `${out}/${n}.png` }); };
  const probs = [];
  const ovf = async (label) => { const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); if (o.sw > o.iw + 1) probs.push(`h-overflow on ${label}: ${o.sw}>${o.iw}`); };
  // 1. log a receipt on Home
  await p.type('#hAmt', '1200'); await p.click('#hForm .hadd'); await w(1200); await shot('01-after-receipt'); await ovf('home after receipt');
  const st = await p.evaluate(() => ({ streak: document.querySelector('.hst-n b')?.textContent, spend: document.querySelector('.hs-big')?.textContent, badges: document.querySelector('.hb-n')?.textContent, msg: document.querySelector('#hMsg')?.textContent, next: !document.querySelector('#hNext').hidden }));
  console.log('after receipt', JSON.stringify(st));
  // 2. goal wizard
  await p.evaluate(() => document.querySelector('[data-gw]').scrollIntoView({block:'center'})); await w(200);
  await p.click('#hGoals [data-gw]'); await w(600); await shot('02-wizard-1');
  await p.click('.gw-chip:nth-child(2)'); await w(200);
  await p.$eval('#gwName', e => e.value = '').catch(()=>{});
  await shot('02b-wizard-1b');
  await p.click('#gwNext'); await w(500); await shot('03-wizard-2');
  const inputs = await p.$$eval('.gw-card input', els => els.map(e=>e.id+':'+e.type));
  console.log('wizard step2 inputs', JSON.stringify(inputs));
  await p.type('#gwCost', '9000').catch(e=>console.log('no #gwCost')); 
  await p.click('#gwNext'); await w(500); await shot('04-wizard-3');
  const btns = await p.$$eval('.gw-card button', els => els.map(e=>(e.id||e.className)+':'+e.textContent.trim().slice(0,20)));
  console.log('wizard step3 buttons', JSON.stringify(btns));
  await p.click('.gw-quick .chipbtn:nth-child(2)').catch(()=>{}); await w(300); await shot('05-wizard-3b');
  console.log('plan text:', await p.$eval('#gwPlan', e=>e.textContent).catch(()=>null));
  await p.click('#gwNext'); await w(1200); await shot('06-after-goal');
  console.log('goals now', await p.$$eval('#hGoals .hg-h b', els => els.map(e=>e.textContent)));
  await ovf('home after goal');
  // 3. each tab
  for (const t of ['receipts','goals','month','basics']) {
    await p.evaluate(tt => document.querySelector(`.tabs [data-tab=${tt}]`).click(), t); await w(1100); await skipCoach(); await w(4200);
    await ovf(t); await p.screenshot({ path: `${out}/tab-${t}.png` });
    await p.screenshot({ path: `${out}/tab-${t}-full.png`, fullPage: true });
  }
  console.log('problems', JSON.stringify(probs)); console.log('errors', JSON.stringify(errs));
  await b.close();
})();
