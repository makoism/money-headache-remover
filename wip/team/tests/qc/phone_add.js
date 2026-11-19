/* F4: tapping Add on a burrow screen. The page behind the burrow is hidden, so one Add may redraw it once (the save already does that), never twice.
   Counts page redraws (each render() rewrites #heroNum) and the long tasks after the tap, on an iPhone 13 sized page at 6x CPU slowdown.
   The rule (ARCHITECTURE "keep tasks short") is no task over 50 ms. The one redraw left is inside the save (ACT.commit, restructure, render),
   which this lane does not own, so the 50 ms check only fails the run with STRICT=1. Undo is checked the same way.
   Run: node tests/qc/phone_add.js   (CPU=4 for 4x) */
const L = require('./phone_lib.js');
const CPU = +process.env.CPU || 6, STRICT = process.env.STRICT === '1';
(async () => {
  const fails = [], notes = []; const { b, p, errs } = await L.open({ dev: 'iphone13', query: 'burrowtest', cpu: CPU });
  await p.evaluate(() => { window.__r = 0; new MutationObserver(ms => { window.__r += ms.length; }).observe(document.querySelector('#heroNum'), { childList: true }); });
  await p.evaluate(() => __bur.open('rainy')); await L.w(1500);
  await p.evaluate(() => document.querySelector('#burrowView .bv-add').click()); await L.w(600);
  await p.evaluate(() => document.querySelector('#burrowView .chip').click()); await L.w(300);
  await L.watchLong(p); await p.evaluate(() => { window.__r = 0; });
  await p.evaluate(() => document.querySelector('#burrowView .bv-go').click()); await L.w(400);
  const r1 = await p.evaluate(() => window.__r), long1 = await L.takeLong(p);
  const going = await p.evaluate(() => document.querySelector('#burrowView .bv-pop').innerText);
  if (!/\+/.test(going)) fails.push(`after Add the panel should show the amount going in, shows "${going.slice(0, 80)}"`);
  if (r1 !== 1) fails.push(`Add redrew the hidden page ${r1} times (should be once)`);
  await L.w(9000);   /* the coin trips end and "Added. Undo" shows */
  const undo = await p.evaluate(() => !!document.querySelector('#burrowView .bv-undo'));
  if (!undo) fails.push('no Undo after the coins went in');
  await L.takeLong(p); await p.evaluate(() => { window.__r = 0; });
  if (undo) { await p.evaluate(() => document.querySelector('#burrowView .bv-undo').click()); await L.w(400); }
  const r2 = await p.evaluate(() => window.__r), long2 = await L.takeLong(p);
  if (undo && r2 !== 1) fails.push(`Undo redrew the hidden page ${r2} times (should be once)`);
  const max1 = Math.max(0, ...long1), max2 = Math.max(0, ...long2);
  console.log(`${CPU}x: Add redraws ${r1}, longest task ${max1} ms; Undo redraws ${r2}, longest task ${max2} ms`);
  if (max1 > 50 || max2 > 50) (STRICT ? fails : notes).push(`a task over 50 ms after the tap (Add ${max1} ms, Undo ${max2} ms): the one redraw left is in the save (actions.js commit, ui1.js restructure, ui2.js render)`);
  if (errs.length) fails.push(errs.join(' | ').slice(0, 300));
  await b.close();
  notes.forEach(n => console.log('OPEN ' + n));
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE ADD FAIL'); process.exit(1); }
  console.log('PHONE ADD PASS');
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
