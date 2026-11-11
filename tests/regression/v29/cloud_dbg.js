const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8788/?d=1#2026-11', { waitUntil: 'load' }); await w(900);
  let done = false;
  await runTour(p, P.a, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent); if (!/^Setup done/.test(t) || done) return; done = true;
    await p.screenshot({ path: '/tmp/v29/cloud1.png' });
    await p.click('#tourVaultOn'); await w(1200);
    await p.screenshot({ path: '/tmp/v29/cloud2.png' });
    console.log(JSON.stringify(await p.evaluate(() => { const r = id => { const e = document.querySelector(id); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height), e.hidden, getComputedStyle(e).display]; }; const t = document.querySelector('.tour'); return { saved: r('#vaultSaved'), copy: r('#vaultCopy'), next: r('#tourNext'), code: r('#vaultCodeTxt'), scroll: [t.scrollTop, t.scrollHeight, t.clientHeight], rowHidden: r('#tourCloud .row-btns'), vcHTML: document.querySelector('#tourVaultCode').innerHTML.length }; })));
    await p.click('#tourVaultCode #vaultSaved'); await w(400);
    await p.screenshot({ path: '/tmp/v29/cloud3.png' });
    const r = await p.evaluate(() => { const n = document.querySelector('#tourNext'); const r = n.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { rect: [r.x, r.y, r.width, r.height], covered: top ? top.id || top.className : null, vh: innerHeight }; });
    console.log(JSON.stringify(r));
  }).catch(e => console.log('tour stopped:', e.message.split('\n')[0]));
  console.log('errs', errs);
  await b.close();
})();
