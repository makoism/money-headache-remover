const { w, P, launch, runTour } = require('./lib.js');
(async () => {
  const [,, persona='a', vw='390', vh='844', out='/tmp/v22/h', scheme='light'] = process.argv;
  require('fs').mkdirSync(out,{recursive:true});
  const { b, p, errs } = await launch(vw, vh, scheme);
  const r = await runTour(p, P[persona]); console.log('tour problems', JSON.stringify(r.probs));
  await w(600);
  // coach marks: step through all of them on Home with screenshots
  let n = 0;
  const coVis = () => p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; });
  while (await coVis()) {
    n++; await p.screenshot({ path: `${out}/coach-${n}.png` });
    const txt = await p.$eval('#coNext', e=>e.textContent).catch(()=>null); if (txt===null) break;
    await p.click('#coNext'); await w(500); if (n>8) break;
  }
  console.log('home coach steps', n);
  await w(500);
  await p.screenshot({ path: `${out}/home-top.png` });
  await p.screenshot({ path: `${out}/home-full.png`, fullPage: true });
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
