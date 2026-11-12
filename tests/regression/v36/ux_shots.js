/* UX walkthrough: screenshots of every screen a person meets, phone size. Naive path (press Next with nothing) and a filled path. */
const L = require('/tmp/v22/lib.js'); const { w } = L;
const fs = require('fs');
const OUT = '/tmp/v36/shots'; const VW = +(process.env.VW || 390), VH = +(process.env.VH || 844);
const tag = process.env.TAG || `${VW}x${VH}`;
(async () => {
  const { b, p, errs } = await L.launch(VW, VH, process.env.SCHEME || 'dark');
  let n = 0; const log = [];
  const shot = async (name, full = false) => { n++; const f = `${OUT}/${tag}-${String(n).padStart(2, '0')}-${name}.png`; await p.screenshot({ path: f, fullPage: full }); log.push(f); };
  const txt = async s => (await p.$(s)) ? await p.$eval(s, e => e.textContent.trim()) : null;
  const vis = async s => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }, s);
  // 1. first open: tour step 0 (video)
  await shot('open');
  // naive: press Next with nothing filled on every step, record the step titles and any messages
  const steps = [];
  for (let i = 0; i < 40; i++) {
    const title = await txt('#tourTitle'); const next = await txt('#tourNext'); const nextHidden = await p.$eval('#tourNext', e => e.hidden); const nextDis = await p.$eval('#tourNext', e => e.disabled);
    const msg = await p.evaluate(() => [...document.querySelectorAll('#tourBody .msg, #tourBody [role=status], #tourBody .err')].map(e => e.textContent.trim()).filter(Boolean).join(' | '));
    steps.push({ i, title, next, nextHidden, nextDis, msg });
    await shot(`tour-${i}-${(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`);
    const tall = await p.evaluate(() => { const s = document.querySelector('#tourScroll'); return s ? s.scrollHeight > s.clientHeight + 4 : false; });
    if (tall) { await p.evaluate(() => { const s = document.querySelector('#tourScroll'); s.scrollTop = s.scrollHeight; }); await w(150); await shot(`tour-${i}-bottom`); await p.evaluate(() => { document.querySelector('#tourScroll').scrollTop = 0; }); }
    if (nextHidden) { if (await p.$('#srcSkip')) { await p.click('#srcSkip'); await w(300); continue; } steps[steps.length - 1].stuck = 'Next hidden, no srcSkip'; break; }
    if (nextDis) { steps[steps.length - 1].stuck = 'Next disabled'; break; }
    if (/^(Done|View month|Go to bills|Open my page|Start)$/.test(next || '')) { await p.click('#tourNext'); await w(1200); break; }
    const before = title;
    await p.click('#tourNext'); await w(350);
    const after = await txt('#tourTitle');
    if (after === before) { steps[steps.length - 1].blocked = await p.evaluate(() => [...document.querySelectorAll('#tourBody .msg, #tourBody [role=status], #tourBody .err, #tourBody .cap')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 3).join(' | ')); await shot(`tour-${i}-blocked`); 
      // try to find what is required and fill a minimum
      if (await p.$('#tourPay')) { await p.type('#tourPay', '200000'); } 
      await p.click('#tourNext'); await w(350);
      if ((await txt('#tourTitle')) === before) { steps[steps.length - 1].stuck = 'cannot leave step'; break; }
    }
  }
  fs.writeFileSync(`${OUT}/${tag}-tour-naive.json`, JSON.stringify(steps, null, 1));
  const tourOpen = await vis('#tour');
  await shot('after-tour-home'); await shot('after-tour-home-full', true);
  // open every top area
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(400); };
  for (const t of ['receipts', 'month', 'goals', 'months', 'basics']) { await go(t); await shot(`tab-${t}`); await shot(`tab-${t}-full`, true); }
  await go('home');
  // the small things on Home
  await p.evaluate(() => { const d = document.querySelector('#hMore'); if (d) d.open = true; }); await w(200); await shot('home-more-open-full', true);
  // Help menu, Ask, Report
  await p.click('#helpBtn'); await w(300); await shot('help-menu');
  await p.click('#helpReport'); await w(400); await shot('report');
  await p.click('#repClose'); await w(200);
  await p.click('#askBtn'); await w(900); await shot('ask');
  await p.click('#askClose'); await w(200);
  // receipts: scan card, camera button (no camera in headless), the log form with nothing
  await go('receipts'); await p.click('#rcSave'); await w(300); await shot('receipt-empty-submit');
  await p.click('#scanCam').catch(() => {}); await w(1200); await shot('scan-cam');
  if (await vis('#cam')) { await p.click('#camClose'); await w(200); }
  // Home log with nothing
  await go('home'); await p.click('#hSave'); await w(300); await shot('home-log-empty-submit');
  // Settings bottom: zero all, restore samples (cancel the confirm)
  fs.writeFileSync(`${OUT}/${tag}-errs.json`, JSON.stringify({ errs, tourOpen }, null, 1));
  console.log(JSON.stringify(steps, null, 1)); console.log('errs', errs); console.log(log.length, 'shots');
  await b.close();
})();
