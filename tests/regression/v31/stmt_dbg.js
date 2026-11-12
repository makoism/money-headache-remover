const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 1372, height: 747, deviceScaleFactor: 1 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await p.click('#tourNext'); await w(300); await p.click('#tourNext'); await w(600);
  const m = () => p.evaluate(() => { const t = document.querySelector('#tour'), ti = document.querySelector('.tour-in'), f = document.querySelector('.tour-foot'), fr = f.getBoundingClientRect(), bk = document.querySelector('#tourBack').getBoundingClientRect(); return { tourScroll: [t.scrollTop, t.scrollHeight, t.clientHeight], tourIn: ti.getBoundingClientRect().height, foot: [Math.round(fr.top), Math.round(fr.bottom), Math.round(fr.height)], back: [Math.round(bk.top), Math.round(bk.bottom)], inner: innerHeight, footCs: [getComputedStyle(f).position, getComputedStyle(f).bottom, getComputedStyle(f).paddingBottom], bodyPad: getComputedStyle(document.querySelector('.tour-body')).paddingBottom, tourInPad: getComputedStyle(ti).paddingBottom }; });
  console.log('top', JSON.stringify(await m()));
  await p.screenshot({ path: '/tmp/v31/stmt_top.png' });
  await p.evaluate(() => { document.querySelector('#tour').scrollTop = 99999; }); await w(300);
  console.log('scrolled', JSON.stringify(await m()));
  await p.screenshot({ path: '/tmp/v31/stmt_bottom.png' });
  await b.close();
})();
