const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  const pb = Object.assign({}, P.b);
  let shot = 0;
  const r = await runTour(p, pb, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (t === 'Credit card' && !shot) { shot = 1; await p.screenshot({ path: '/tmp/v29/card1.png' });
      await p.evaluate(() => { document.querySelector('#tourBody details').open = true; }); await w(200);
      await p.type('#tourCardT', '9000'); await p.type('#tourCardB', '5500'); await w(300);
      console.log('cap:', await p.$eval('#cardCap', e => e.textContent), '| use btn:', await p.$eval('#cardUse', e => e.hidden + ' ' + e.textContent));
      await p.click('#cardUse'); await w(200); console.log('amount after Use:', await p.$eval('#tourAmt', e => e.value));
      await p.screenshot({ path: '/tmp/v29/card2.png' });
    }
  });
  const st = await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('money-map-template-v2')); return { card: S.steps.card, cardT: S.ui.cardT, cardB: S.ui.cardB }; });
  console.log(JSON.stringify(st), 'probs', JSON.stringify(r.probs), 'errs', JSON.stringify(errs));
  await b.close();
})();
