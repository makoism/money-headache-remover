const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(1200);
  const cdp = await p.target().createCDPSession(); await cdp.send('Performance.enable');
  const task = async () => { const m = await cdp.send('Performance.getMetrics'); return m.metrics.find(x => x.name === 'TaskDuration').value; };
  const idle = async (label) => { const t0 = await task(), s0 = Date.now(); await w(5000); const dt = (await task()) - t0; console.log(label, 'main-thread CPU', (dt / ((Date.now() - s0) / 1000) * 100).toFixed(2) + '%'); };
  await idle('before any tap (no music)');
  await p.click('#tourTitle'); await w(1500);
  console.log('playing', await p.evaluate(() => window.__music.playing()));
  await idle('with the music');
  await b.close();
})();
