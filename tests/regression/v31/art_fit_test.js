const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  let p;
  const state = () => p.evaluate(() => { const a = document.querySelector('#tourArt .art'); return a ? (a.classList.contains('aside') ? 'aside' : 'shown') : 'none'; });
  for (const [W, H] of [[1358, 702], [1288, 900], [390, 844], [390, 760], [1288, 702]]) {
    const ctx = await b.createBrowserContext(); p = await ctx.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
    const seen = [];
    await runTour(p, P.a, async i => { const t = await p.$eval('#tourTitle', e => e.textContent); seen.push(t.slice(0, 12) + ':' + await state()); if (/Currency/.test(t) && W > 1000) await p.screenshot({ path: `/tmp/v31/art_${W}x${H}.png` }); });
    console.log(W + 'x' + H, seen.join(' '));
    await ctx.close();
  }
  await b.close();
})();
