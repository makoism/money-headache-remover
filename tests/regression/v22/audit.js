const { w, P, launch, runTour } = require('./lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  await runTour(p, P.a); await w(900);
  for (let i = 0; i < 3; i++) { if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(400); } }
  for (const t of ['home', 'receipts', 'goals', 'month', 'basics']) {
    await p.evaluate(tt => document.querySelector(`.tabs [data-tab=${tt}]`).click(), t); await w(900);
    if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(450); }
    const info = await p.evaluate(() => {
      const sec = [...document.querySelectorAll('main section, main .tab, [role=tabpanel]')].find(e => e.offsetParent && e.getBoundingClientRect().height > 200);
      const root = sec || document.querySelector('main') || document.body;
      const txt = root.innerText || ''; const words = txt.trim().split(/\s+/).length;
      const paras = [...root.querySelectorAll('p')].filter(e => e.offsetParent && e.innerText.trim().split(/\s+/).length > 18).map(e => e.innerText.trim().split(/\s+/).length);
      return { words, longParas: paras, height: Math.round(root.getBoundingClientRect().height) };
    });
    console.log(t, JSON.stringify(info));
    await p.screenshot({ path: `/tmp/v22/audit_${t}.png` });
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
