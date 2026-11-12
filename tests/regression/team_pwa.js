const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) process.exitCode = 1; };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/', { waitUntil: 'load' }); await w(800);
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  ok('service worker is active', reg);
  const cdp = await p.target().createCDPSession();
  const inst = await cdp.send('Page.getInstallabilityErrors');
  console.log('installability errors:', JSON.stringify(inst.installabilityErrors));
  ok('Chrome finds nothing blocking install', inst.installabilityErrors.length === 0);
  const man = await cdp.send('Page.getAppManifest');
  ok('manifest parses with name and icons', !man.errors.length && /Money Headache Remover 2000/.test(man.data) && /maskable/.test(man.data));
  await p.click('#tourNext'); await w(300); /* past the video to the currency screen, where the name is */
  await p.type('#tourName', 'Mara'); await p.click('#tourNext'); await w(250); await p.click('#tourSkip'); await w(1500);
  const before = await p.evaluate(() => (localStorage.getItem('money-map-template-v2') || '').includes('Mara'));
  ok('your name was saved before going offline', before);
  await p.setOfflineMode(true);
  await p.reload({ waitUntil: 'load' }); await w(900);
  ok('page loads with no network', /Money Headache Remover 2000/.test(await p.title()) && (await p.$eval('#heroNum', e => e.textContent)).length > 0);
  ok('your saved data is still there offline', await p.evaluate(() => (localStorage.getItem('money-map-template-v2') || '').includes('Mara')));
  ok('and the tour does not come back', await p.$eval('#tour', e => e.hidden));
  /* a newer version put online while the page is open: the page offers a reload, never forces one */
  await p.setOfflineMode(false);
  const fs = require('fs'); const swp = '/home/claude/work/pwa/dist/sw.js'; const sw0 = fs.readFileSync(swp, 'utf8'); fs.writeFileSync(swp, sw0.replace(/money-headache-[0-9a-f]+/, 'money-headache-testnew01'));
  try {
    await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    let shown = false; for (let i = 0; i < 40; i++) { await w(250); shown = await p.evaluate(() => !document.querySelector('#upd').hidden); if (shown) break; }
    ok('a newer version offers a reload (the page is not forced)', shown && /Money Headache Remover 2000/.test(await p.title()));
    await p.click('#updGo'); await p.waitForNavigation({ waitUntil: 'load' }).catch(() => {}); await w(600);
    ok('after Reload the page is up and the offer is gone', (await p.$eval('#upd', e => e.hidden)) && (await p.evaluate(() => (localStorage.getItem('money-map-template-v2') || '').includes('Mara'))));
  } finally { fs.writeFileSync(swp, sw0); }
  ok('no page errors', errs.length === 0);
  if (errs.length) console.log(errs);
  await b.close();
})();
