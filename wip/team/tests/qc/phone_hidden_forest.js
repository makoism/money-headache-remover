/* F5: the Home forest (scene.js) must not animate while a burrow with its own world (the rainy look) covers it, and must start again when the burrow closes.
   A burrow without its own world (the plain look) shows the forest, so the forest keeps moving behind that one.
   Counts forest redraws (draws of the forest's sky layer onto #scene) on an iPhone 13 sized page. Also prints script time at 6x for the report.
   Run: node tests/qc/phone_hidden_forest.js */
const L = require('./phone_lib.js');
(async () => {
  const fails = []; const { b, p, errs, cdp } = await L.open({ dev: 'iphone13', query: 'burrowtest' });
  await p.evaluate(() => { window.__n = 0; const c = document.querySelector('#scene').getContext('2d'), o = c.drawImage; c.drawImage = function (...a) { if (a[0] && a[0].width === this.canvas.width && a[1] === 0 && a[2] === 0) window.__n++; return o.apply(this, a); }; });
  const count = async ms => { await p.evaluate(() => { window.__n = 0; }); await L.w(ms); return p.evaluate(() => window.__n); };
  const home = await count(2000); if (!(home >= 5)) fails.push(`Home: the forest should animate, drew ${home} times in 2 s`);
  const plainId = await p.evaluate(() => (__bur.rows().find(r => !r.emergency) || {}).id);
  await p.evaluate(() => __bur.open('rainy')); await L.w(800);
  const rainy = await count(2000); if (rainy > 1) fails.push(`rainy burrow open: the hidden forest drew ${rainy} times in 2 s (should be 0)`);
  await p.evaluate(() => __bur.close()); await L.w(300);
  const back = await count(2000); if (!(back >= 5)) fails.push(`after closing the burrow the forest should move again, drew ${back} times in 2 s`);
  if (plainId) { await p.evaluate(id => __bur.open(id), plainId); await L.w(800); const pl = await count(2000); if (!(pl >= 5)) fails.push(`plain burrow (forest visible behind it): drew ${pl} times in 2 s`); await p.evaluate(() => __bur.close()); }
  /* rainy, then swipe to the plain burrow: the forest must come back on its own */
  if (plainId) { await p.evaluate(() => __bur.open('rainy')); await L.w(600); await p.evaluate(id => __bur.open(id), plainId); await L.w(900); const sw = await count(2000); if (!(sw >= 5)) fails.push(`rainy then plain burrow: forest drew ${sw} times in 2 s`); await p.evaluate(() => __bur.close()); await L.w(300); }
  /* the cost, for the report: script time over 4 s with the rainy burrow open at 6x */
  await cdp.send('Performance.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await p.evaluate(() => __bur.open('rainy')); await L.w(1500);
  const ms = await L.scriptMs(cdp, 4000);
  console.log(`forest draws in 2 s: Home ${home}, rainy burrow ${rainy}, after close ${back}; script time with the rainy burrow open at 6x: ${Math.round(ms / 4)} ms per s`);
  if (errs.length) fails.push(errs.join(' | ').slice(0, 300));
  await b.close();
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE HIDDEN FOREST FAIL'); process.exit(1); }
  console.log('PHONE HIDDEN FOREST PASS');
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
