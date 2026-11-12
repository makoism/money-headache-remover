const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 320, height: 640, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-12', { waitUntil: 'load' }); await w(1200);
  const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.querySelector('#tourScroll').scrollWidth > document.querySelector('#tourScroll').clientWidth);
  console.log('sideways overflow at 320:', over);
  await p.screenshot({ path: '/tmp/v35/v_320.png' });
  const g = await p.evaluate(() => { const g = document.querySelector('.vgarden'); const r = g.getBoundingClientRect(); return { w: Math.round(r.width), corners: g.querySelectorAll('.art-corner').length, note: !!document.querySelector('.from-mako'), pix: g.querySelectorAll('.vg-pix .pix').length, playOk: (() => { const b = document.querySelector('#tourPlay'); const rr = b.getBoundingClientRect(); const el = document.elementFromPoint(rr.left + rr.width / 2, rr.top + rr.height / 2); return !!el && (el === b || b.contains(el)); })() }; });
  console.log(JSON.stringify(g));
  await b.close();
})();
