const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  for (let i = 0; i < 3; i++) {
    const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
    await p.setRequestInterception(true); const reqs = [];
    p.on('request', r => { reqs.push(r.url().slice(0, 70)); if (/^https?:/.test(r.url())) r.abort(); else r.continue(); });
    const c = await p.target().createCDPSession(); await c.send('Performance.enable');
    await p.goto('file:///home/claude/work/money-map-team.html?l=' + i, { waitUntil: 'load' });
    const m = Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const t = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0], fp = performance.getEntriesByName('first-contentful-paint')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: fp ? Math.round(fp.startTime) : null }; });
    console.log('run', i, JSON.stringify(t), 'script ms', (m.ScriptDuration * 1000).toFixed(0), 'task ms', (m.TaskDuration * 1000).toFixed(0), 'layout ms', (m.LayoutDuration * 1000).toFixed(0), 'style ms', (m.RecalcStyleDuration * 1000).toFixed(0), 'external reqs', reqs.filter(u => /^https?:/.test(u)).join(' '));
    await p.close();
  }
  await b.close();
})();
