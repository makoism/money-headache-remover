const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
(async () => {
  const { b, p } = await L.launch(390, 844, 'dark');
  const pr = JSON.parse(JSON.stringify(P.a)); pr.g.travel.name = 'Save for the wedding of my sister in Cebu next year'; pr.cur = 'NZ$';
  await runTour(p, pr); await w(800);
  await p.evaluate(() => document.querySelector('[data-tab-go="months"]').click()); await w(400);
  await p.evaluate(() => scrollBy(0, 260)); await p.screenshot({ path: '/tmp/v36/t/months-long.png' });
  await b.close();
  const { b: b2, p: p2 } = await L.launch(390, 844, 'dark');
  for (let i = 0; i < 30; i++) { const nxt = await p2.$eval('#tourNext', e => e.textContent); if (/^(Go to bills|Done)$/.test(nxt)) break; await p2.click('#tourNext'); await w(250); }
  await p2.screenshot({ path: '/tmp/v36/t/naive-done.png' });
  await b2.close();
})();
