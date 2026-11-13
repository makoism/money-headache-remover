const L = require('/tmp/v22/lib.js'); const { w } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const st = p => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2') || '{}').ui || {});
(async () => {
  const { b, p, errs } = await L.launch(1280, 820, 'dark');
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500);
  const sw = () => p.$eval('#setMus', e => e.getAttribute('aria-checked'));
  const chip = () => p.evaluate(() => { const a = document.querySelector('[data-djsrc][aria-pressed="true"], [data-djsrc].on'); return a ? a.dataset.djsrc : ''; });
  await p.click('#djBtn'); await w(300);
  await p.click('[data-djsrc="off"]'); await w(500);
  ok(await sw() === 'false', 'Off in the panel turns the Settings music switch off');
  await p.keyboard.press('Escape'); await w(200);
  await p.evaluate(() => document.querySelector('#setMus').click()); await w(500);
  ok((await st(p)).music !== false && await sw() === 'true', 'the Settings switch turns music back on');
  await p.click('#djBtn'); await w(300);
  ok(await chip() === 'forest', 'and the panel shows Forest picked: ' + await chip());
  await p.keyboard.press('Escape');
  // persistence of every setting through reload
  await p.evaluate(() => { const r = document.querySelector('#djVol'); r.value = 42; r.dispatchEvent(new Event('input', { bubbles: true })); }); await w(400);
  await p.click('#sndBtn'); await w(400);
  await p.evaluate(() => { const c = document.querySelector('#djScene'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }); await w(500);
  await w(1200); await p.evaluate(() => sessionStorage.setItem('__keep', '1')); await p.reload(); await w(1500);
  const u = await st(p);
  ok(u.vol === 42 && u.mute === true && u.scene === false, 'volume, mute and scenery come back after reload: ' + JSON.stringify({ vol: u.vol, mute: u.mute, scene: u.scene }));
  await p.click('#djBtn'); await w(300); ok(await p.$eval('#djVolN', e => e.textContent) === '42' && await p.$eval('#sndBtn', e => e.getAttribute('aria-pressed')) === 'true', 'and the controls show them');
  ok(await p.evaluate(() => !document.body.classList.contains('scene-on')), 'scenery stays off after reload');
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  console.log(`SYNC: ${pass} pass, ${fail} fail`); await b.close(); process.exit(fail ? 1 : 0);
})();
