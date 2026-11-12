const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.b); await w(1200);
  await p.type('#hAmt', '12'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(600);
  for (const t of ['home', 'receipts', 'goals', 'month', 'months', 'basics']) {
    await p.evaluate(t => { const e = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); if (e) e.click(); }, t); await w(500);
    const info = await p.evaluate(() => [...document.querySelectorAll('.pixc')].filter(c => c.offsetParent !== null || c.getClientRects().length).map(c => {
      const r = c.getBoundingClientRect(), host = c.parentElement, hr = host.getBoundingClientRect();
      // find text nodes overlapping the sprite box
      const hits = [];
      const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      let n; while ((n = walk.nextNode())) { if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.width && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) { hits.push(n.textContent.trim().slice(0, 30)); break; } } }
      return { host: host.id || host.className, box: [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)], hostW: Math.round(hr.width), hostH: Math.round(hr.height), visible: r.width > 0 && getComputedStyle(c).visibility !== 'hidden', hits };
    }));
    console.log(t, JSON.stringify(info));
  }
  await b.close();
})();
