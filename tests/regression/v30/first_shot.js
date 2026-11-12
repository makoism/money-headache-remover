const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' });
  for (const t of [1000, 4000, 9000]) { await new Promise(r => setTimeout(r, t === 1000 ? 1000 : 3000)); await p.screenshot({ path: `/tmp/v30/first_${t}.png` }); }
  console.log(await p.evaluate(() => ({ vf: document.querySelector('#tourVF')?.className, load: document.querySelector('.tour-load')?.textContent, vid: !!document.querySelector('#tourVid'), src: document.querySelector('#tourVid')?.currentSrc?.slice(0, 40), ready: document.querySelector('#tourVid')?.readyState })));
  await b.close();
})();
