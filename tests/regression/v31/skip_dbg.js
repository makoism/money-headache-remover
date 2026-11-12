const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
const PAGE = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(), errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push('console ' + m.text()); });
  await p.goto(PAGE + '?s=1#2026-11', { waitUntil: 'load' }); await w(800);
  const title = () => p.$eval('#tourTitle', e => e.textContent);
  console.log('start', await title());
  await p.click('#tourNext'); await w(400); console.log('after next 1', await title());
  await p.click('#tourNext'); await w(400); console.log('after next 2', await title());
  const info = await p.evaluate(() => { const s = document.querySelector('#srcSkip'); if (!s) return 'no srcSkip'; const r = s.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { text: s.textContent, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], topEl: top && (top.tagName + '#' + top.id + '.' + top.className), hidden: s.hidden, disp: getComputedStyle(s).display }; });
  console.log('srcSkip', JSON.stringify(info));
  await p.click('#srcSkip').catch(e => console.log('click err', e.message)); await w(500); console.log('after skip', await title());
  await p.evaluate(() => document.querySelector('#srcSkip') && document.querySelector('#srcSkip').click()); await w(500); console.log('after js click', await title());
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
