// Fresh-eyes audit: screenshot every setup screen and every tab at phone size.
const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
const fs = require('fs');
(async () => {
  const [,, persona = 'a', scheme = 'light', out = '/tmp/v29/shots'] = process.argv;
  fs.mkdirSync(out, { recursive: true });
  const { b, p, errs } = await launch(390, 844, scheme);
  const shot = async (name, full) => { await p.screenshot({ path: `${out}/${name}.png`, fullPage: !!full }); };
  const r = await runTour(p, P[persona], async i => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    await shot(`t${String(i).padStart(2, '0')}-${t.replace(/[^a-z0-9]+/gi, '_').slice(0, 28)}`);
  });
  console.log('tour', JSON.stringify(r.seen)); console.log('probs', JSON.stringify(r.probs));
  await w(500);
  // coach marks on Home
  let n = 0;
  const coVis = () => p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; });
  while (await coVis() && n < 9) { n++; await shot(`home-coach-${n}`); await p.click('#coNext').catch(() => {}); await w(400); }
  await shot('home-top'); await shot('home-full', true);
  const tab = async (name) => { await p.evaluate(nm => { const t = [...document.querySelectorAll('.tabs button, .tab, nav button')].find(b => b.textContent.trim() === nm); t && t.click(); }, name); await w(500); let k = 0; while (await coVis() && k < 9) { k++; await shot(`${name.toLowerCase()}-coach-${k}`); await p.click('#coNext').catch(() => {}); await w(400); } await shot(`${name.toLowerCase()}-top`); await shot(`${name.toLowerCase()}-full`, true); };
  await tab('Receipts'); await tab('Plan');
  await p.evaluate(() => { const g = document.querySelector('#gear, .gear, [aria-label="Settings"]'); g && g.click(); }); await w(500);
  let k = 0; while (await coVis() && k < 9) { k++; await shot(`settings-coach-${k}`); await p.click('#coNext').catch(() => {}); await w(400); }
  await shot('settings-top'); await shot('settings-full', true);
  // Goals page if there is one (Home goal card -> Goals)
  await p.evaluate(() => { const t = [...document.querySelectorAll('.tabs button, .tab, nav button')].find(b => b.textContent.trim() === 'Home'); t && t.click(); }); await w(400);
  await p.evaluate(() => { const l = [...document.querySelectorAll('a, button')].find(b => /^Goals$|All goals|See goals/.test(b.textContent.trim())); l && l.click(); }); await w(500);
  await shot('goals-full', true);
  // Help menu and Ask panel
  await p.evaluate(() => { const t = [...document.querySelectorAll('.tabs button, .tab, nav button')].find(b => b.textContent.trim() === 'Home'); t && t.click(); }); await w(300);
  await p.click('#helpBtn'); await w(400); await shot('help-menu'); await p.keyboard.press('Escape'); await w(200);
  await p.click('#askBtn'); await w(900); await shot('ask-panel'); await p.keyboard.press('Escape'); await w(200);
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
