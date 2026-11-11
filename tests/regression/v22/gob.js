const { w, P, launch, runTour } = require('./lib.js');
(async () => {
  for (const vw of [320, 390]) {
    const { b, p, errs } = await launch(vw, 800, 'light');
    // run persona B until loan step, then screenshot
    let done = false;
    const res = await runTour(p, P.b, async (i) => {
      if (done) return;
      const t = await p.$eval('#tourTitle', e => e.textContent);
      if (/loan/i.test(t) && await p.$('#gob')) {
        done = true;
        await p.evaluate(() => document.querySelector('#gob').scrollIntoView({block:'center'}));
        await p.click('#gob'); await w(250);
        await p.screenshot({ path: `/tmp/v22/gob${vw}.png` });
        const r = await p.evaluate(() => { const g = document.querySelector('.gob-bub').getBoundingClientRect(); return {l:g.left, r:g.right, w:innerWidth}; });
        console.log(vw, 'bubble rect', JSON.stringify(r));
      }
    });
    console.log(vw, 'tour problems', JSON.stringify(res.probs), 'errors', JSON.stringify(errs));
    await b.close();
  }
})();
