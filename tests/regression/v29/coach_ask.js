const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  await runTour(p, P.a); await w(1200);
  let n = 0, last = '';
  for (let i = 0; i < 9; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!v) break; n++; last = await p.$eval('#coPop', e => e.textContent.replace(/\s+/g, ' ')); if (/Any money question/.test(last)) { await p.screenshot({ path: '/tmp/v29/coach_ask.png' }); console.log('scrollY at Ask step', await p.evaluate(() => scrollY)); } await p.click('#coNext').catch(() => {}); await w(400); }
  console.log('steps', n, '| last:', last.slice(0, 80), '| errs', JSON.stringify(errs));
  await b.close();
})();
