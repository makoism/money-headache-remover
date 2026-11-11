const { w, P, launch, runTour } = require('./lib.js');
(async () => {
  for (const art of [true, false]) {
    const L = await launch(390, 844, 'light');
    if (art) { await L.p.evaluateOnNewDocument(() => { window.claude = { use: async () => null }; }); await L.p.reload({ waitUntil: 'load' }); await w(700); }
    let hit = false;
    await runTour(L.p, P.a, async () => {
      if (hit) return; const t = await L.p.$eval('#tourTitle', e => e.textContent);
      if (!/reminder/i.test(t)) return;
      hit = true;
      await L.p.evaluate(() => document.querySelector('#tourCal').scrollIntoView({block:'center'})); await w(200);
      await L.p.evaluate(() => document.querySelector('#tourCal [data-cal=apple]').click()); await w(400);
      const r = await L.p.evaluate(() => { const m = document.querySelector('.cal-manual'); return { manual: !!m, text: m && m.querySelector('textarea').value, msg: document.querySelector('#tourCalMsg').textContent.slice(0,60), cap: [...document.querySelectorAll('#tourBody .cap')].map(e=>e.textContent).join(' || ') }; });
      console.log(art ? 'ARTIFACT' : 'STANDALONE', JSON.stringify(r));
      if (art) {
        await L.p.screenshot({ path: '/tmp/v22/cal_art.png' });
        await L.p.select('#tourDay', '3'); await w(300);
        console.log('after day change:', JSON.stringify(await L.p.$eval('.cal-manual textarea', e => e.value)));
        await L.p.evaluate(() => { document.querySelector('[data-calcopy]').click(); }); await w(400);
        console.log('copy msg:', await L.p.$eval('.cal-manual .msg', e => e.textContent));
      }
    });
    console.log(art ? 'art' : 'std', 'hit', hit, 'errors', JSON.stringify(L.errs)); await L.b.close();
  }
})();
