/* UX walkthrough on the site build (relay + stub): persona Aiko with a statement, every screen shot at phone size */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
const OUT = '/tmp/v36/site'; let n = 0;
const title = p => p.$eval('#tourTitle', e => e.textContent).catch(() => '');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = [];
  await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__keep')) localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch (e) {} });
  const shot = async (name, full) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png`, fullPage: !!full }); };
  const scrollShots = async (name) => { const h = await p.evaluate(() => document.querySelector('#tourScroll') ? document.querySelector('#tourScroll').scrollHeight : document.documentElement.scrollHeight); const vh = 844; let y = 0, k = 0; while (y < h && k < 8) { await p.evaluate(y => { const s = document.querySelector('#tourScroll'); if (s && !s.closest('[hidden]')) s.scrollTop = y; else scrollTo(0, y); }, y); await w(120); await shot(`${name}-${k}`); y += vh - 60; k++; } await p.evaluate(() => { const s = document.querySelector('#tourScroll'); if (s) s.scrollTop = 0; scrollTo(0, 0); }); };
  await p.goto(BASE + '/#2026-11', { waitUntil: 'load' }); await w(1200);
  await shot('open-video');
  await scrollShots('video');
  // walk to statements
  let hit = false;
  await runTour(p, P.a, async () => { if ((await title(p)) === 'Your statements') { hit = true; throw new Error('stop'); } }).catch(() => {});
  await w(600); await scrollShots('statements');
  // upload the bank csv into box 0 and read
  const inputs = await p.$$('[data-acctfile]'); await inputs[0].uploadFile('/tmp/v28/imp/bank.csv'); await w(500);
  await p.evaluate(() => { const ni = document.querySelector('[data-acctname]'); ni.value = 'BPI'; ni.dispatchEvent(new Event('input', { bubbles: true })); });
  await shot('statements-file-in');
  await p.click('#impRead'); await w(600); await shot('statements-reading');
  for (let i = 0; i < 40; i++) { await w(500); if ((await title(p)) !== 'Your statements') break; }
  await shot('after-read'); await scrollShots('review');
  // the review -> continue with Next until done
  const seen = [];
  for (let i = 0; i < 40; i++) {
    const t = await title(p); const nx = await p.$eval('#tourNext', e => e.textContent).catch(() => ''); seen.push(t + ' | ' + nx);
    if (!t) break;
    if (/^(Done|Go to bills|Open my page|Go to my month|View month|Start)$/.test(nx)) { await scrollShots('step-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)); await p.click('#tourNext'); await w(1200); break; }
    const hidden = await p.$eval('#tourNext', e => e.hidden).catch(() => true);
    if (hidden) { if (await p.$('#srcSkip')) { await p.click('#srcSkip'); await w(300); continue; } break; }
    // fill goal fields for the trip
    if (await p.$('#tourGCost')) { await p.type('#tourGName', 'Japan trip'); await p.type('#tourGCost', '300000'); if (await p.$('#tourGSaved')) await p.type('#tourGSaved', '50000'); if (await p.$('#tourGWhy')) await p.type('#tourGWhy', 'Cherry blossoms with Mom'); }
    await scrollShots('step-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20));
    await p.click('#tourNext'); await w(400);
  }
  console.log(seen.join('\n'));
  await w(800); await shot('landing');
  // coach overlay?
  const co = await p.evaluate(() => { const c = document.querySelector('#co'); return c ? { hidden: c.hidden, html: c.innerText.slice(0, 200) } : null; }); console.log('coach', co);
  if (co && !co.hidden) { await shot('coach-1'); for (let i = 0; i < 10; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; }); if (!v) break; await p.click('#coNext').catch(() => {}); await w(300); await shot('coach-' + (i + 2)); } }
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(500); const c = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; }); if (c) { await shot('coach-' + t); for (let i = 0; i < 10; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; }); if (!v) break; await p.click('#coNext').catch(() => {}); await w(250); } } };
  await go('home'); await scrollShots('home');
  await go('receipts'); await scrollShots('receipts');
  await go('month'); await scrollShots('plan');
  await go('goals'); await scrollShots('goals');
  await go('months'); await scrollShots('months');
  await go('basics'); await scrollShots('settings');
  await go('home');
  await p.click('#askBtn'); await w(1500); await shot('ask-open');
  await p.type('#askIn', 'How much can I spend this week?'); await p.click('#askSend'); await w(2500); await shot('ask-answer');
  await p.click('#askClose'); await w(300);
  fs.writeFileSync(OUT + '/errs.json', JSON.stringify(errs, null, 1)); console.log('errs', errs.length, errs.slice(0, 5));
  await b.close();
})();
