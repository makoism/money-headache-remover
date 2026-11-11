const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await p.goto('http://127.0.0.1:8788/?dbg=1#2026-11', { waitUntil: 'load' }); await w(1200);
  console.log(await p.evaluate(() => ({ title: document.title, tour: !!document.querySelector('#tour'), tourHidden: document.querySelector('#tour') && document.querySelector('#tour').hidden, tt: !!document.querySelector('#tourTitle'), body: document.body.innerText.slice(0, 200) })));
  await b.close();
})();
