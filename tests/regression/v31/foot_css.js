const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 760 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  console.log(await p.evaluate(() => { const f = document.querySelector('.tour-foot'), c = getComputedStyle(f, '::before'); return { bg: c.backgroundImage, mask: c.maskImage || c.webkitMaskImage, bf: c.backdropFilter || c.webkitBackdropFilter, pos: c.position, z: c.zIndex, h: c.height, w: c.width, left: c.left, footPos: getComputedStyle(f).position, footZ: getComputedStyle(f).zIndex }; }));
  await b.close();
})();
