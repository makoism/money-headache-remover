const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 1288, height: 702, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.click('#tourNext'); await w(500);
  const info = await p.evaluate(() => { const a = document.querySelector('#tourArt .art'), s = a && a.querySelector('svg'), r = a && a.getBoundingClientRect(), ti = document.querySelector('.tour-in').getBoundingClientRect(), tb = document.querySelector('.tour-body').getBoundingClientRect(); const cs = e => { const c = getComputedStyle(e); return [c.overflow, c.position]; }; return { art: r && [r.left, r.top, r.width, r.height], tourIn: [ti.left, ti.top, ti.width, ti.height, ...cs(document.querySelector('.tour-in'))], tourBody: [tb.left, tb.top, tb.width, tb.height, ...cs(document.querySelector('.tour-body'))], tourArtParent: a && a.parentElement.id + ' ' + cs(a.parentElement), viewBox: s && s.getAttribute('viewBox'), svgOverflow: s && getComputedStyle(s).overflow, tour: cs(document.querySelector('#tour')) }; });
  console.log(JSON.stringify(info, null, 1));
  await p.screenshot({ path: '/tmp/v31/sprig_laptop.png' });
  await b.close();
})();
