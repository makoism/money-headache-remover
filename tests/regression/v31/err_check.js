const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.setViewport({ width: 390, height: 844 });
  await p.goto('file:///home/claude/work/money-map-team.html?s=1#2026-11', { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 1500));
  console.log('tour open', await p.evaluate(() => !document.querySelector('#tour').hidden));
  console.log('errors', JSON.stringify(errs, null, 1));
  await b.close();
})();
