const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 5000));
  await p.screenshot({ path: '/tmp/v30/first_dark.png' });
  await b.close();
})();
