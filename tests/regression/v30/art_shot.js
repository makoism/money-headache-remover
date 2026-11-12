const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 1500, height: 520, deviceScaleFactor: 2 }); await p.goto('file:///tmp/v30/art.html'); await p.screenshot({ path: '/tmp/v30/art.png' }); await b.close(); })();
