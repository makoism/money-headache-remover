const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 760, deviceScaleFactor: 1 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  let done = false;
  await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!done && /done/i.test(t)) { done = true; await w(6500);
    const info = await p.evaluate(() => { const f = document.querySelector('.tour-foot'), r = f.getBoundingClientRect(); const ps = [...document.querySelectorAll('#tourBody p')].map(p => { const q = p.getBoundingClientRect(); return [p.textContent.slice(0, 30), Math.round(q.top), Math.round(q.bottom)]; }); return { foot: [Math.round(r.top), Math.round(r.bottom)], ps, scrollTop: document.querySelector('#tour').scrollTop }; });
    console.log(JSON.stringify(info));
    await p.screenshot({ path: '/tmp/v31/foot_px.png' }); } });
  await b.close();
})();
