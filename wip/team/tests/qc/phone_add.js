/* F4: tapping Add on a burrow screen must not freeze. The page behind the burrow is hidden, so its redraw waits (actions.js ACT.commit):
   none in the tap, one a moment later, and it is in place when the burrow closes.
   Counts page redraws (each render() rewrites #heroNum) and the long tasks after the tap, on an iPhone 13 sized page at 6x CPU slowdown.
   The rule (ARCHITECTURE "keep tasks short"): no task over 50 ms in the 400 ms after the tap. Undo is checked the same way.
   Run: node tests/qc/phone_add.js   (CPU=4 for 4x) */
const L = require('./phone_lib.js');
const CPU = +process.env.CPU || 6;
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
  if (r1 !== 0) fails.push(`Add redrew the hidden page ${r1} times inside the tap (should wait)`);
  await L.w(9000);   /* the coin trips end and "Added. Undo" shows */
  const undo = await p.evaluate(() => !!document.querySelector('#burrowView .bv-undo'));
  if (!undo) fails.push('no Undo after the coins went in');
  const r1b = await p.evaluate(() => window.__r); if (r1b !== 1) fails.push(`after Add the hidden page was redrawn ${r1b} times in all (should be once)`);
  await L.takeLong(p); await p.evaluate(() => { window.__r = 0; });
  if (undo) { await p.evaluate(() => document.querySelector('#burrowView .bv-undo').click()); await L.w(400); }
  const r2 = await p.evaluate(() => window.__r), long2 = await L.takeLong(p);
  if (undo && r2 !== 0) fails.push(`Undo redrew the hidden page ${r2} times inside the tap (should wait)`);
  const max1 = Math.max(0, ...long1), max2 = Math.max(0, ...long2);
  console.log(`${CPU}x: Add redraws ${r1}, longest task ${max1} ms; Undo redraws ${r2}, longest task ${max2} ms`);
  if (max1 > 50 || max2 > 50) fails.push(`a task over 50 ms after the tap (Add ${max1} ms, Undo ${max2} ms)`);
  /* closing straight after an Add: the page behind must already show the new numbers */
  await L.w(2500); await p.evaluate(() => document.querySelector('#burrowView .bv-add').click()); await L.w(600);
  await p.evaluate(() => document.querySelector('#burrowView .chip').click()); await L.w(300);
  await p.evaluate(() => { window.__r = 0; document.querySelector('#burrowView .bv-go').click(); document.querySelector('#burrowView .bv-sign').click(); });
  const r3 = await p.evaluate(() => window.__r), shut = await p.evaluate(() => !document.body.classList.contains('bv-on'));
  if (!shut) fails.push('the burrow did not close'); if (r3 !== 1) fails.push(`closing right after Add redrew the page ${r3} times (should be once, before the page shows)`);
  await L.w(2500); const r4 = await p.evaluate(() => window.__r); if (r4 !== 1) fails.push(`a put-off redraw ran again after the burrow closed (${r4} redraws)`);
  if (errs.length) fails.push(errs.join(' | ').slice(0, 300));
  await b.close();
  notes.forEach(n => console.log('OPEN ' + n));
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE ADD FAIL'); process.exit(1); }
  console.log('PHONE ADD PASS');
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
