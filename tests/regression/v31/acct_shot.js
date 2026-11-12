const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.click('#tourNext'); await w(300); await p.click('#tourNext'); await w(900);
  await p.screenshot({ path: '/tmp/v31/acct1.png' });
  await p.evaluate(() => { const ni = document.querySelector('[data-acctname]'); ni.value = 'BPI'; ni.dispatchEvent(new Event('input', { bubbles: true })); });
  const input = await p.$('[data-acctfile]'); await input.uploadFile('/tmp/v28/imp/bank.csv'); await w(300);
  await p.click('#acctAdd'); await w(300);
  await p.evaluate(() => { const ni = document.querySelectorAll('[data-acctname]')[1]; ni.value = 'Mercari Card'; ni.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.screenshot({ path: '/tmp/v31/acct2.png' });
  await p.evaluate(() => document.querySelector('#tourScroll').scrollTo(0, 380)); await w(300);
  await p.screenshot({ path: '/tmp/v31/acct3.png' });
  await b.close();
})();
