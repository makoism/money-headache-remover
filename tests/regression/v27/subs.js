const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  for (const [label, pr] of [['yen', P.a], ['peso', Object.assign({}, P.a, { cur: '₱' })], ['usd', P.b], ['euro', Object.assign({}, P.a, { cur: '€' })]]) {
    const { b, p, errs } = await launch(390, 844, 'light');
    let got = null;
    const rr = await runTour(p, pr, async () => {
      if (got) return;
      const ttl = await p.$eval('#tourTitle', e => e.textContent); if (ttl === 'Monthly bills') { await p.evaluate(() => { const el = document.querySelector('input[name=tourBill][value=subs]'); if (el && !el.checked) el.click(); }); await w(150); }
      if (await p.$('.subs-list')) {
        got = await p.$$eval('.sub-row .chip span', els => els.map(e => e.textContent));
        const intro = await p.$eval('#tourBody p', e => e.textContent); got.unshift('INTRO: ' + intro);
        await p.evaluate(() => document.querySelector('.subs-list').scrollIntoView({ block: 'start' }));
        await w(150); await p.screenshot({ path: `/tmp/v27/subs_${label}.png` });
      }
    });
    console.log('=== ' + label + ' errors ' + JSON.stringify(errs) + ' probs ' + JSON.stringify(rr.probs) + ' steps ' + JSON.stringify((rr.seen||[]).slice(0,40))); (got || ['NO SUBS SCREEN']).forEach(x => console.log('  ' + x));
    await b.close();
  }
})();
