const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/?i=9#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.a); await w(800); await p.evaluate(() => { const s = document.querySelector('#coSkip'); if (s && s.offsetParent) s.click(); });
  await p.type('#hAmt', '120'); await p.keyboard.press('Enter'); await w(700);
  await p.click('#hNext [data-exact]'); await w(1200);
  console.log('boxes', await p.$$eval('.acct', es => es.map(e => e.querySelector('[data-acctname]').value + '/' + [...e.querySelectorAll('input[type=radio]')].find(r => r.checked).value)));
  const input = await p.$('[data-acctfile]'); await input.uploadFile('/tmp/v28/imp/long.csv'); await w(400);
  await p.click('#impRead'); for (let i = 0; i < 60; i++) { await w(250); if ((await p.$eval('#tourTitle', e => e.textContent)) === 'Check what was found') break; }
  const body = await p.$eval('#tourBody', e => e.textContent.replace(/\s+/g, ' '));
  console.log(body.slice(0, 400));
  console.log('errs', errs);
  await b.close();
})();
