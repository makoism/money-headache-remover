const L = require('/tmp/v22/lib.js'); const { w } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  for (const [vw, vh] of [[390, 844], [320, 640], [1440, 900]]) {
    const { b, p, errs } = await L.launch(vw, vh, 'dark');
    await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(700);
    const r = await p.evaluate(() => ({ big: !!document.querySelector('#scene'), bot: !!document.querySelector('#sceneBot'), sign: !!document.querySelector('.wrap > .top').style.getPropertyValue('--sign'), phone: document.body.classList.contains('scene-phone'),
      botH: (document.querySelector('#sceneBot') || { getBoundingClientRect: () => ({}) }).getBoundingClientRect().height, help: document.querySelector('#helpBtn').getBoundingClientRect().bottom, vh: innerHeight }));
    if (vw < 720) {
      ok(r.bot && !r.big && r.sign && r.phone, `${vw}: the stream strip and the wooden sign, no scene behind the words`);
      ok(r.botH > 60 && r.botH < 140 && r.help > r.vh - r.botH, `${vw}: the strip is short and Ask/Help sit on it`);
      const pad = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.wrap')).paddingBottom));
      ok(pad >= r.botH + 20, `${vw}: the page ends with room above the stream (${pad}px padding, strip ${Math.round(r.botH)}px)`);
    } else ok(r.big && !r.bot && !r.sign, `${vw}: the full forest, no phone strip`);
    await p.evaluate(() => document.querySelector('#djBtn').click()); await w(200);
    await p.evaluate(() => { const c = document.querySelector('#djScene'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }); await w(300);
    ok(await p.evaluate(() => !document.querySelector('#scene') && !document.querySelector('#sceneBot') && !document.querySelector('.wrap > .top').style.getPropertyValue('--sign')), `${vw}: the scenery switch removes it all`);
    ok(errs.length === 0, `${vw}: no page errors ` + errs.join(' | '));
    await b.close();
  }
  console.log(`PHONE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
