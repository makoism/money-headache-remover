/* site-specific: invite code flow on 8789, the review without answers, the camera without a camera, cloud backup from Setup done */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const OUT = '/tmp/v36/s2'; let n = 0;
const title = p => p.$eval('#tourTitle', e => e.textContent).catch(() => '');
async function fresh(b, base) {
  const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  await p.goto(base + '/#2026-11', { waitUntil: 'load' }); await w(1000);
  return { p, errs };
}
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  // 1. invite code on 8789
  let { p, errs } = await fresh(b, 'http://127.0.0.1:8789');
  const shot = async (name) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(600);
  await p.click('#askBtn'); await w(1500); await shot('invite-ask-open');
  console.log('ask state:', await p.evaluate(() => ({ wait: !document.querySelector('#askWait').hidden, off: !document.querySelector('#askOff').hidden, offTxt: document.querySelector('#askOffTxt').textContent, log: document.querySelector('#askLog').innerText.slice(0, 300) })));
  await p.type('#askIn', 'How much can I spend this week?'); await p.click('#askSend'); await w(1500); await shot('invite-after-send');
  console.log('after send:', await p.evaluate(() => document.querySelector('#askLog').innerText.replace(/\s+/g, ' ').slice(0, 300)));
  const inv = await p.$('#askLog input.txt');
  if (inv) { await inv.type('wrong word'); await p.evaluate(() => { const b = [...document.querySelectorAll('#askLog button')].find(x => x.textContent === 'Continue'); b && b.click(); }); await w(1500); await shot('invite-wrong'); console.log('wrong code:', await p.evaluate(() => document.querySelector('#askLog').innerText.replace(/\s+/g, ' ').slice(0, 300))); }
  const inv2 = await p.$('#askLog input.txt');
  if (inv2) { await inv2.type('fam'); await p.evaluate(() => { const b = [...document.querySelectorAll('#askLog button')].find(x => x.textContent === 'Continue'); b && b.click(); }); await w(2500); await shot('invite-right'); console.log('right code:', await p.evaluate(() => document.querySelector('#askLog').innerText.replace(/\s+/g, ' ').slice(0, 300))); }
  await p.close();
  // 2. review without answering questions (8788)
  ({ p, errs } = await fresh(b, 'http://127.0.0.1:8788'));
  let hit = false; await runTour(p, P.a, async () => { if ((await title(p)) === 'Your statements') { hit = true; throw new Error('stop'); } }).catch(() => {});
  const inputs = await p.$$('[data-acctfile]'); await inputs[0].uploadFile('/tmp/v28/imp/bank.csv'); await w(400);
  await p.click('#impRead'); for (let i = 0; i < 40; i++) { await w(500); if ((await title(p)) !== 'Your statements') break; }
  console.log('review reached:', await title(p));
  const qs = await p.evaluate(() => [...document.querySelectorAll('.imp-q')].map(q => q.innerText.replace(/\s+/g, ' ').slice(0, 120))); console.log('questions:', qs);
  await p.click('#tourNext'); await w(600);
  console.log('after Use these numbers with no answers:', await title(p), '|', await p.evaluate(() => [...document.querySelectorAll('#tourBody .msg, #tourBody [role=status]')].map(e => e.textContent.trim()).filter(Boolean).join(' | ').slice(0, 300)));
  await shot('review-unanswered');
  // where did the unanswered items go? check the numbers after review
  const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2')); return { a: s.steps.a, b: s.steps.b, side: s.steps.side }; }); console.log('income steps:', JSON.stringify(st));
  // continue to the end
  for (let i = 0; i < 30; i++) { const t = await title(p); const nx = await p.$eval('#tourNext', e => e.textContent).catch(() => ''); if (!t) break; if (/^(Done|Go to bills)$/.test(nx)) { await shot('import-end'); console.log('end screen:', await p.evaluate(() => document.querySelector('#tourBody').innerText.replace(/\s+/g, ' ').slice(0, 400))); break; } await p.click('#tourNext'); await w(400); }
  // 3. camera without a camera
  await p.click('#tourNext'); await w(900);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(500);
  await p.evaluate(() => document.querySelector('#scanCam').click()); await w(1500); await shot('camera-none');
  console.log('camera dialog:', await p.evaluate(() => ({ hidden: document.querySelector('#cam').hidden, msg: document.querySelector('#camMsg').textContent, pick: !document.querySelector('#camPick').hidden, shot: !document.querySelector('#camShot').hidden })));
  await p.evaluate(() => document.querySelector('#camClose').click()); await w(300);
  console.log('errs', errs);
  await b.close();
})();
