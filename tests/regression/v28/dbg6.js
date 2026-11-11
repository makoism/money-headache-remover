const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console', m.type(), m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:8788/?d=1#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.a); await w(1000);
  await p.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(600);
  console.log(await p.evaluate(() => ({ box: document.querySelector('#vaultBox').hidden, on: document.querySelector('#vaultOn').hidden, st: document.querySelector('#vaultState').textContent })));
  await p.click('#vaultOn'); await w(1500);
  console.log(await p.evaluate(() => ({ st: document.querySelector('#vaultState').textContent, code: document.querySelector('#vaultCode').innerHTML.slice(0, 120), ls: localStorage.getItem('mhr-vault') })));
  await b.close();
})();
