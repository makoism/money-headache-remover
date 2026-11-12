const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.setViewport({ width: 390, height: 844 });
  await p.goto('file:///home/claude/work/money-map-team.html?s=1#2026-11', { waitUntil: 'load' }); await w(900);
  let here = false;
  await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!here && t === 'Split the rest') { here = true; throw new Error('stop'); } }).catch(() => {});
  console.log('why before', JSON.stringify(await p.$eval('#jarWhy', e => e.innerHTML)));
  await p.click('.lockb[data-lock="jar"][data-i="2"]'); await w(200);
  console.log('why after', JSON.stringify(await p.$eval('#jarWhy', e => e.innerHTML)));
  console.log('whys', await p.$$eval('.why', es => es.map(e => e.id + ':' + e.textContent.slice(0, 40))));
  await b.close();
})();
