const { w, P, launch, runTour } = require('./lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  await runTour(p, P.a); await w(900);
  if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(350); }
  await p.evaluate(() => document.querySelector('.tabs [data-tab=basics]').click()); await w(1000);
  if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(450); }
  await p.evaluate(() => document.querySelector('#setSnd').scrollIntoView({block:'center'})); await w(300);
  const before = await p.evaluate(() => [document.querySelector('#setSnd').getAttribute('aria-checked'), document.querySelector('#sndTxt').textContent]);
  await p.click('#setSnd'); await w(400);
  const after = await p.evaluate(() => [document.querySelector('#setSnd').getAttribute('aria-checked'), document.querySelector('#sndTxt').textContent, JSON.parse(localStorage.getItem('money-map-template-v2')).ui.mute]);
  console.log('before', before, 'after', after);
  await p.screenshot({ path: '/tmp/v22/snd.png' });
  // tour button reflects it
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(200); await p.click('#helpTour'); await w(500);
  console.log('tour button text when muted:', await p.$eval('#tourSnd', e => e.textContent));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
